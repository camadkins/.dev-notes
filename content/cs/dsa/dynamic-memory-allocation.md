---
title: Dynamic Memory Allocation
description: Heap allocation, ownership, lifetime, and how to design safe growable buffers without leaks or fragmentation.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-22
aliases: []

---

## Overview

**Dynamic memory allocation** gives programs **heap** storage at runtime when sizes or lifetimes aren't known at compile time. Unlike the **stack**, which grows/shrinks automatically with function calls, the **heap** requires explicit **request** and **release** (e.g., `malloc/free`, `new/delete`, or GC). Done well, you get flexible structures like [[dynamic-arrays|Dynamic Arrays]] and graphs. Done poorly, you get **leaks**, **fragmentation**, **[[cs/security/use-after-free-and-heap-exploitation|dangling pointers]]**, and elusive heisenbugs.

## Underlying Process

At a high level, a **memory allocator** manages a region of [[cs/systems/virtual-memory|virtual memory]] for the process:

1. **Request:** Program asks for `N` bytes.

2. **Placement:** Allocator finds or creates a **free block** big enough (via free lists, segregated bins, buddy system, etc.), often with **alignment** and a small **header**.

3. **Return pointer:** A pointer to the payload range `[p, p+N)` is returned.

4. **Free:** Program later returns the block; allocator **coalesces** adjacent free blocks to reduce fragmentation.


**Fragmentation:**

- **External:** free space exists but is split into many small non-contiguous gaps.

- **Internal:** the block given to you is larger than your request due to alignment or size classes.


Garbage-collected runtimes (Java, Go, many scripting languages) **reclaim unreachable objects** automatically, but still face fragmentation, pauses, and cache behavior concerns. Manual systems (C/C++) demand explicit `free/delete` but enable tight control and predictable latency.

## Example Execution

Here's a minimal manual allocation lifecycle (C-like pseudocode):

```pseudo
function make_buffer(len):
    // +1 for sentinel; align to word for speed
    ptr = malloc(len + 1)
    if ptr == NULL: error "out of memory"
    ptr[len] = 0      // sentinel (e.g., '\0' for strings)
    return ptr

function consume():
    buf = make_buffer(1024)
    // ... use buf[0..1023] ...
    free(buf)         // release exactly once
```

> [!warning]
> **Common pitfalls:**
>
> - **Leak:** Never calling `free` (lost reference).
>
> - **Double-free:** Calling `free` twice on the same pointer (UB).
>
> - **Use-after-free:** Accessing memory **after** you freed it.
>
> - **Invalid free:** Freeing a pointer not returned by the allocator (including interior pointers).
>

## Performance and Design Trade-offs

- **Allocator strategy:**

    - _General-purpose_ allocators (ptmalloc, jemalloc, mimalloc) balance throughput and fragmentation using size **classes** and **per-thread** arenas.

    - _Custom/arena_ allocators trade fine-grained frees for **bulk reset**: very fast when many objects share a lifetime.

- **Throughput vs fragmentation:**

    - Size classes reduce search time (fast) but cause **internal fragmentation**.

    - Exact-fit schemes reduce internal waste but may **fragment externally** and cost more to search.

- **Cache and TLB locality:**
    Group allocations used together to improve **spatial locality**; reuse freed blocks of the same size class to improve **temporal locality**.

- **Pause times (GC):**
    Moving/compacting GCs reduce fragmentation but can introduce **latency**; concurrent/parallel GCs mitigate pauses at complexity costs.


## Correctness and Reliability Considerations

- **Ownership:** Every allocation must have a clear **owner** responsible for freeing. Adopt patterns: RAII (C++), unique handles, or region lifetimes.

- **Aliasing:** If multiple references exist, define a policy (single writer / many readers; reference counting) to avoid freeing while in use.

- **Bounds:** Always respect the requested length; [[cs/security/buffer-overflows|buffer overflows]] corrupt allocator metadata and neighboring objects.

- **Thread safety:** Many allocators are thread-safe but may contend; per-thread caches/arenas help. Your own metadata (reference counts, freelists) must be synchronized.


> [!tip]
> **Make invalid states unrepresentable.** Wrap raw pointers in a small type that can only be constructed by allocation and **moves ownership** on transfer. In C, pair the pointer with its length in a struct; in C++, use `unique_ptr<T[]>` or a span-like view for bounds.

## Implementation Notes

### Designing a Growable Buffer (Strategy)

A safe growable buffer underpins vectors, string builders, and IO buffers.

**Policy:**

- Track **`size`** (used) and **`capacity`** (allocated).

- On append when `size == capacity`, **grow geometrically** (`capacity ← ceil(α·capacity)`, `α ∈ [1.5, 2.0]`).

- Reallocate to the new capacity, **move/copy** elements, then append.


**Checklist:**

- Ensure `new_capacity ≥ size + needed`.

- Handle **overflow** on size arithmetic (`size + needed` may wrap).

- On failure, leave the old buffer **intact** (strong exception guarantee).

- After reallocation, **invalidate** stale pointers/iterators into the old buffer.


See [[dynamic-arrays|Dynamic Arrays]] for full details on amortized analysis and trade-offs.

### Avoiding Leaks & UAFs

- Initialize pointers to `NULL`/`nullptr`; after `free`, **set to NULL** in debug builds to trip fast.

- Keep **one pointer of truth**; avoid storing the same raw pointer in many places.

- In C, pair `malloc` and `free` in the same lexical scope when possible; exit paths use a single `cleanup:` label.


### Testing for Leaks and Lifetime Bugs

- **Unit tests:**

    - Allocate → use → free → reallocate elsewhere; ensure no stale access.

    - Randomized **allocate/free interleavings** to simulate production churn.

- **Tools:**

    - Leak detectors/ASAN/MSAN/Valgrind for leaks, UAF, and OOB.

    - Fault injection: occasionally **fail allocations** to verify error paths and cleanup are correct.


```pseudo
test "buffer survives realloc":
    buf = new_buffer(8); write(buf,"abc")
    grow(buf, 128)         // forces move
    assert contents == "abc"
    free(buf)

test "no leak on error path":
    buf = malloc(64)
    if step2_fails():
        free(buf)
        return
    // ...
```

## Related Concepts

- **Reference counting:** Automates freeing when the last reference drops to zero; beware cycles.

- **Regions/arenas:** Allocate many small objects, free them all at once; great for parsers/compilers.

- **Garbage collection:** Mark-sweep, copying, generational; trades predictability for convenience. See [[gc-algorithms-mark-sweep-copying-generational|GC Algorithms: Mark–Sweep, Copying, Generational]] and [[garbage-collection-concepts|Garbage Collection Concepts]].

- **Memory pools & freelists:** Pre-allocate blocks for fixed-size structures to avoid fragmentation and system call overhead.

- **Allocators in containers:** Many containers (vectors, maps) accept custom allocator parameters to swap in pool/arena strategies.


## Summary

Dynamic allocation is indispensable for flexible data structures and long-lived objects, but it introduces **lifetime management** responsibilities. The essentials:

- Model **ownership** explicitly.

- Choose an allocation **strategy** that matches lifetimes (general-purpose vs arena).

- For growable buffers, use **geometric growth** with careful reallocation semantics.

- Prevent and detect errors with **tooling** (ASAN/Valgrind) and **tests** that exercise error paths.

- Watch **fragmentation** and **locality**: batch similar-sized allocations and free in patterns that let your allocator coalesce.


Handled with discipline, dynamic allocation gives high performance and reliability; handled casually, it's the fastest path to leaks, crashes, and late-night debugging sessions.

## Related Notes

- [[dynamic-arrays|Dynamic Arrays]]

- [[garbage-collection-concepts|Garbage Collection Concepts]]

- [[gc-algorithms-mark-sweep-copying-generational|GC Algorithms: Mark–Sweep, Copying, Generational]]
