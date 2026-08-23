---
title: Memory Allocation
description: How programs request, manage, and free memory; stack vs heap, allocator strategies, fragmentation, locality, safety, and practical patterns.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-31
aliases: []

---

## Overview

Memory allocation is the machinery that turns **abstract data structures** into **live objects** in RAM. It spans from OS primitives (pages, [[cs/systems/virtual-memory|virtual memory]]) through **user-space allocators** (e.g., `malloc`/`free`, custom pools) to language runtimes (GC, arenas). Getting allocation right affects **performance** (latency, throughput, cache behavior), **correctness** (no leaks, no use-after-free), and **security** (no [[cs/security/buffer-overflows|buffer overflows]] or double frees). This note unifies the conceptual layers, common allocator designs, fragmentation trade-offs, and practical patterns that make real programs fast and safe.

> [!note]
> Treat "allocation" as an **API + policy** problem: the interface (`alloc(n)`, `free(p)`) is small; the **policy** (where, how big, how to split/merge, how to cache) determines performance and safety.

## Motivation

Why care beyond "just call `new`"? Because:

- **Performance:** Allocations can dominate runtime in DS-heavy code (e.g., building graphs, hash tables). Allocator choice and layout decide **cache misses** and **TLB** pressure.

- **Predictability:** Real-time systems demand bounded latency; general-purpose allocators often have variable costs.

- **Safety & security:** The majority of low-level exploits ride on memory misuse. Design choices (canaries, guard pages) harden systems.

- **Simplicity at scale:** Pools/arenas reduce book-keeping, making bulk teardown trivial and avoiding leaks.


## Definition and Formalism

At a high level:

- **Stack**: automatic, **LIFO** frames for locals; fast pointer bump on call/return; not for long-lived or variable-sized uncontrolled objects.

- **Static / Data segment**: globals; fixed lifetime.

- **Heap**: dynamic storage via an allocator; lifetime controlled by program.


**Allocator interface (abstract):**

```
ptr = alloc(n)    // n bytes
free(ptr)
ptr2 = realloc(ptr, n2)
```

Backed by OS **virtual memory** via **pages** (commonly 4 KiB) and system calls (e.g., `mmap`/`VirtualAlloc`). User-space allocators carve these pages into blocks according to a **strategy**.

**Fragmentation:**

- **Internal**: unused bytes **inside** allocated blocks (e.g., 28-byte request rounded to 32 with 4 bytes wasted).

- **External**: free space exists but is split into chunks too small to satisfy a large request.


> Internal waste is bounded by **alignment & size class granularity**; external waste depends on **placement policy** and **coalescing**.

## Example or Illustration

Imagine a server that frequently creates small request objects (24–128 bytes) and a few big buffers (64 KiB). A **size-class slab allocator** handles small objects with near-zero per-object overhead and great locality, while big buffers go directly to the OS (page-aligned). On shutdown, an **arena** used for per-request temporaries is freed via a single `reset()` call - no walking thousands of individual frees.

## Properties and Relationships

- **Lifetimes drive policy**: long-lived objects favor general heap with coalescing; **phase-oriented** workloads favor arenas/regions; **uniform small objects** favor slabs.

- **Locality begets speed**: allocators that keep related objects near each other boost cache hit rate; see [[dynamic-arrays|Dynamic Arrays]] and [[hash-tables|Hash Tables]] for layout impacts.

- **Concurrency**: per-thread arenas reduce **contention** and **[[cs/systems/cache-coherence|false sharing]]**.

- **Amortization**: pooling turns many small allocs into a few big ones, smoothing costs.


## Implementation or Practical Context

### 1) Placement Strategies (general heaps)

Common policies when picking a free block:

- **First-fit**: take the first block large enough. Fast, but can create early "holes."

- **Best-fit**: choose the smallest adequate block (least leftover). Can reduce external fragmentation but requires more searching.

- **Next-fit**: like first-fit but resume from last position; can scatter fragmentation.

- **Segregated free lists**: maintain **bins by size** (e.g., 16, 32, 64, …). Look up bin, possibly round up. Industry standard for speed.


**Splitting & coalescing**

- On alloc: split a larger free block; remainder returns to an appropriate bin.

- On free: **coalesce** with adjacent free blocks (needs boundary tags or side metadata).

- Maintain metadata via **headers/footers** or external **bitmaps**.


> [!warning]
> Coalescing adds latency. Many allocators defer it (lazy coalescing) or coalesce only when bins run low.

### 2) Fixed-Size Pools & Slabs (small objects)

- **Idea**: dedicate pages ("slabs") to one **size class**; keep a free list of objects.

- **Pros**: `O(1)` alloc/free, minimal fragmentation, great locality.

- **Cons**: internal waste if requested size doesn't match classes; need many classes to cover range.


```pseudo
class SlabClass(size):
    free_list = stack<ptr>
    partial_slabs, full_slabs
function alloc():
    if free_list not empty: return free_list.pop()
    slab = allocate_page_block()
    carve slab into objects of 'size'; push all but one into free_list
    return first_object
function free(p):
    free_list.push(p); if slab becomes empty: return slab to OS
```

### 3) Buddy System (coalescing at power-of-two)

- Whole region managed in blocks of size `2^k`. Split until block fits request; on free, merge with its **buddy** if available.

- Pros: fast, deterministic, easy coalescing.

- Cons: internal fragmentation can be high for non power-of-two sizes.


```pseudo
alloc(n):
    k = ceil_log2(align_up(n))
    find smallest k' >= k with free block
    while k' > k: split block into two buddies; push one into list k'-1
    return block
free(block, k):
    while buddy(block,k) is free and k<max:
        remove buddy; block = merge(block,buddy); k = k+1
    insert block into list k
```

### 4) Arena / Region (bump pointer)

- **Phase-based** allocation: allocate sequentially from a region with a **bump pointer**; free the **entire arena at once**.

- Perfect when object lifetimes are similar (e.g., per request, per frame).

- No individual frees, so zero fragmentation within the phase.


```pseudo
struct Arena { base, ptr, end }
function arena_alloc(A, n, alignment):
    p = align_up(A.ptr, alignment)
    if p+n > A.end: A = grow_arena(A, required=n)
    A.ptr = p+n
    return p
function arena_reset(A): A.ptr = A.base
function arena_destroy(A): return all memory to OS
```

> [!tip]
> Combine arenas with **temporary containers** (vectors/maps) that never free individual nodes; call `arena_reset()` between phases.

### 5) Threading & NUMA

- **Thread-local caches**: per-thread free lists or arenas avoid locks and reduce cross-core bouncing.

- **NUMA awareness**: allocate near the thread that uses the memory to avoid remote node latency.

- Production allocators (jemalloc, tcmalloc, mimalloc) implement **per-thread arenas + size classes + background coalescing**.


### 6) Reallocation & Growth Policies

`realloc` can:

- **Expand in place** (if next block free) or

- **Move** to a new block and copy.


**Growth factors**: dynamic arrays typically grow by `×1.5–×2`. Too small → many copies; too big → memory blow-up. See [[dynamic-arrays|Dynamic Arrays]].

### 7) Alignment & Padding

- **Alignment** prevents misaligned accesses; common minima: 8 or 16 bytes on 64-bit.

- Allocators return pointers aligned to the **max alignment** required for fundamental types or vector instructions (e.g., 16/32 bytes).

- Structures may need **manual padding** to avoid false sharing across cache lines.


> [!warning]
> **False sharing**: two hot objects on the same cache line, updated by different cores, cause ping-pong invalidations. Prefer per-thread arenas and **cache-line padding** for shared counters.

### 8) Safety, Debugging, and Hardening

**Bugs & attacks**

- **Buffer overflow / out-of-bounds**: writes past block end corrupt metadata.

- **[[cs/security/use-after-free-and-heap-exploitation|Use-after-free]]**: dangling pointer dereference.

- **Double free**: freeing same pointer twice corrupts free lists.

- **Uninitialized read**: leaking prior contents.


**Defenses**

- **Guard pages**: non-mapped pages around special allocations to catch overflows.

- **Canaries / red zones**: known patterns before/after blocks, checked on free.

- **Quarantine**: delay reuse of freed blocks to expose UAF.

- **Randomization / ASLR**: reduce predictability.


**Tools**

- **ASan/UBSan/MSan**: compile-time sanitizers that instrument loads/stores and report issues with stack/heap/Global.

- **Valgrind/Memcheck**: detects leaks and invalid accesses, slower but no recompile needed.

- **GFlags/ETW/Perf**: platform-specific tracing; **heap verification** modes in OS allocators.


> [!tip]
> Adopt **RAII/ownership** patterns in manual-memory languages: wrap raw pointers in types that call `free` in destructors; prefer **unique ownership** by default, **shared** only when necessary.

### 9) Measuring & Tuning

- **Throughput vs latency**: microbench both `alloc` and mixed `alloc/free` patterns with realistic object sizes.

- **Fragmentation metrics**:

    - Internal = `∑(rounded_i − requested_i)`.

    - External ≈ `1 − largest_free / total_free`.

- **Cache/TLB**: sample miss rates; locality wins often dwarf raw allocator timings.

- **Allocator choice**: drop-in replacements (`LD_PRELOAD` with jemalloc/mimalloc) can yield instant wins.


## Common Misunderstandings

> [!warning]
> **"One allocator fits all."** Workloads differ. A general heap is versatile but not optimal for uniform small objects or phase-based lifetimes.

> [!warning]
> **Ignoring alignment.** Misaligned SIMD or atomic accesses can crash or degrade performance. Always respect required alignments in custom allocators.

> [!warning]
> **Premature micro-tuning.** Layout/locality often matters **more** than raw allocator speed. First fix data structure layout and lifetimes; then tweak the allocator.

> [!warning]
> **Assuming `free` zeroes memory.** It doesn't. Use explicit scrubbing only when needed (security), knowing it costs time.

> [!warning]
> **Recycling freed memory across threads.** Returning blocks to another thread's cache causes remote frees and contention. Prefer **per-thread** arenas with safe cross-thread transfer protocols.

## Broader Implications

- **Data structures**: each DS implies an **allocation pattern**. Linked lists/tree nodes create many small objects → slabs/arenas shine. Dynamic arrays reallocate in bulk → growth factors matter.

- **Real-time systems**: prefer **bounded-time** allocators (pools, fixed-size blocks, no coalescing) to avoid pauses.

- **GC vs manual**: GC removes frees but introduces **pause times** and write barriers; arenas mimic some GC benefits with explicit phase boundaries and deterministic costs.

- **Security posture**: hardened allocators and sanitizers are part of your CI; design invariants (e.g., can't observe freed objects) complement runtime checks.


## Summary

Memory allocation connects OS pages to application objects through policies that balance **speed**, **fragmentation**, **locality**, and **safety**. Choose strategies by **lifetime** and **size profile**:

- **General heaps** with segregated lists + coalescing for mixed workloads.

- **Slabs** for uniform small objects (`O(1)` alloc/free, great locality).

- **Buddy** for fast split/merge in power-of-two environments.

- **Arenas** for phase-oriented lifetimes (bump then **reset**).
    Harden with guard pages, canaries, quarantines, and sanitizers; measure fragmentation and cache behavior. The right allocator policy often yields order-of-magnitude improvements with cleaner code.


## Related Notes

- [[dynamic-memory-allocation|Dynamic Memory Allocation]]

- [[dynamic-arrays|Dynamic Arrays]]

- [[hash-tables|Hash Tables]]

- [[algorithm-efficiency|Algorithm Efficiency]]
