---
title: Dynamic Arrays
description: Resizable contiguous arrays that grow geometrically to provide amortized O(1) append while preserving cache-friendly iteration and random access.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-11-22
aliases: []
---

## Overview
A **dynamic array** is a contiguous sequence container that supports **random access in O(1)** and **amortized O(1) append (push-back)** by allocating extra capacity ahead of use and **growing geometrically** when full. Unlike fixed-size [[cs/dsa/arrays|Arrays]], dynamic arrays automatically **reallocate** and **copy** elements to a larger buffer when the logical size reaches capacity. This design underpins `std::vector` (C++), `ArrayList` (Java), Python lists, and many runtime arrays in managed languages.

Dynamic arrays provide excellent **cache locality** for iteration and numeric kernels but have non-trivial **resize costs**, **iterator invalidation** on growth, and potentially large **peak memory** due to over-allocation.

## Structure Definition
A dynamic array maintains:
- **Buffer pointer** `buf` to contiguous storage of **capacity** `C ≥ 0`.
- **Size** `n` (# of constructed elements, `0 ≤ n ≤ C`).
- **Element type** `T` with construction, move/copy, and destruction semantics.

Invariants:
- Elements occupy indices `0..n-1`. Uninitialized slack `n..C-1` exists after growth.
- Random access: `A[i]` is O(1) for `0 ≤ i < n`.
- `n` changes with insert/erase; `C` changes only on (re)allocation.

**Growth strategy.** On `push_back` at full capacity, allocate `C' = max(1, ⌈α·C⌉)` with **growth factor** `α > 1` (commonly `1.5–2.0`), move/copy `n` elements into `buf'`, destroy old storage, set `buf ← buf'`, `C ← C'`, and append.

**Shrink strategy.** Some implementations reduce capacity when `n` falls far below `C` (e.g., halve when `n ≤ C/4`) or expose an explicit `shrink_to_fit()`.

## Core Operations
Below, operations assume strong exception safety where applicable and generic `T`.

### Random access
```pseudo
function AT(i):
    if 0 ≤ i < n: return buf[i]
    else: error "out of bounds"
````

### Append (amortized O(1))

```pseudo
function PUSH_BACK(x):
    if n == C:
        GROW()
    buf[n] = construct_from(x)   // or move(x)
    n = n + 1
```

### Grow (geometric)

```pseudo
function GROW():
    C' = max(1, ceil(alpha * C))      // alpha ∈ (1, 2], common choices 1.5 or 2
    new_buf = allocate_array(T, C')
    move_or_copy_construct(new_buf[0..n-1], buf[0..n-1])
    destroy(buf[0..n-1])              // if move leaves valid states, this may be nop
    deallocate(buf)
    buf = new_buf
    C = C'
```

### Insert / Erase at position (may shift O(n))

```pseudo
function INSERT(pos, x):
    // 0 ≤ pos ≤ n
    if n == C: GROW()
    shift_right(buf[pos..n-1])        // move elements one step to the right
    buf[pos] = construct_from(x)
    n = n + 1

function ERASE(pos):
    // 0 ≤ pos < n
    destroy(buf[pos])
    shift_left(buf[pos+1..n-1])       // move elements left to fill hole
    n = n - 1
    if n ≤ C / SHRINK_DIVISOR: maybe_shrink()
```

### Reserve / Shrink

```pseudo
function RESERVE(C_req):
    if C_req > C:
        reallocate_to(C_req)          // same as GROW but to explicit capacity

function SHRINK_TO_FIT():
    if C > n:
        reallocate_to(n)
```

> [!tip]
> If you know the target size in advance (e.g., reading `m` items), call **`RESERVE(m)`** to avoid multiple reallocations and copies. This preserves amortized guarantees and improves throughput.

## Example (Stepwise)

**Scenario:** Start empty; `alpha = 2` (doubling). Push elements `a, b, c, d, e`.

1. `n=0, C=0`. `push(a)`: grow to `C'=1`, place `a` → `n=1`.

2. `push(b)`: `n==C` (`1==1`) → grow `C'=2`, copy 1 element, place `b` → `n=2`.

3. `push(c)`: grow `C'=4`, move 2, place `c` → `n=3`.

4. `push(d)`: fits in `C=4` → place `d` → `n=4`.

5. `push(e)`: grow `C'=8`, move 4, place `e` → `n=5`.


Between expensive growths, pushes are **cheap O(1)**; the occasional growth is **O(n)**, but amortization keeps the average constant.

## Complexity and Performance

Let `n` be the number of elements, `C` capacity.

- **Random access (`A[i]`):** O(1).

- **Append (`push_back`):** Amortized **O(1)**; occasional reallocation costs O(n) when growing.

- **Insert/erase at arbitrary position:** O(n) due to shifting; at **end** these are amortized O(1).

- **Reserve/shrink:** O(n) when they reallocate; O(1) if capacity unchanged.

- **Space:** O(C) words; overhead is `C − n` slack.


**Amortized analysis (accounting method).** Charge each append a small **tax** to prepay future moves. With doubling (`α = 2`), each element moves at most **O(1)** times per lifetime (1 on its insertion growth, then again at later doublings), so total cost over `n` appends is O(n), yielding **O(1)** per append amortized.

**Cache locality.** Iteration over contiguous memory is highly cache-friendly; dynamic arrays outperform pointer-chasing containers for scans and SIMD-able workloads.

**Iterator/pointer invalidation.**

- **On growth:** all pointers/iterators/references usually **invalidate** (buffer relocates).

- **On non-growth insertion/erase:** pointers **after** the modified position may invalidate due to shifts.


## Implementation Details or Trade-offs

**Choice of growth factor `α`.**

- `α = 2.0` (doubling): fewer reallocations, higher memory slack; common in academic proofs and some production vectors.

- `α = 1.5` (≈3/2): better peak memory behavior with slightly more reallocations; common in runtimes seeking balance.

- `α < 1.3`: many reallocations; may degrade throughput.


**Element move vs copy.**

- Prefer **move construction** when `T` supports it to reduce data traffic.

- For trivially copyable `T` (POD), use bulk `memcpy`/vectorized moves.


**Allocator strategy.**

- **Monotonic/arena allocators** minimize per-allocation overhead for bulk lifetimes.

- **Over-alignment** (SIMD, cache lines) can improve numeric kernels.

- **Zero-initialization**: Some languages allocate raw but uninitialized capacity; others zero-fill—be aware of costs.


**Bounds checking.**

- Many APIs expose both `at(i)` (checked) and `operator[]` (unchecked). Use checked access in debug paths; elide in hot loops.


**Exception safety (move/copy may throw).**

- Strong guarantee for `insert/erase`: if move/copy throws during reallocation, roll back and leave the original array intact.

- Growth that fails allocation should not leak partially constructed elements.


**Shrink policy.**

- Automatic shrink on erase can cause **pathological thrashing** for oscillating sizes. Prefer **explicit `shrink_to_fit()`** or hysteresis (e.g., shrink when `n ≤ C/4` and grow when `n == C`).


**Small-Buffer Optimization (SBO).**

- Store a small **inline** array inside the container object (e.g., 8–32 bytes) to avoid heap allocation for tiny `n`. On growth beyond SBO, spill to heap.


**Concurrency.**

- Single-writer with multiple readers requires **external** synchronization; internal reallocation is non-atomic and invalidates readers.

- Lock-free dynamic arrays are non-trivial; prefer specialized concurrent vectors or chunked structures.


**Stable references.**

- If you require **stable addresses** across growth, dynamic arrays are unsuitable; consider [[cs/dsa/doubly-linked-list|Doubly Linked List]] or node-based containers. For stable indices but movable storage, expose **indices** rather than raw pointers.


## Practical Use Cases

- **General-purpose sequence storage** with frequent appends and scans (logs, event buffers, parsed tokens).

- **Batch-building** results where final size is unknown but roughly estimable (use `reserve`).

- **Numeric arrays** and **image buffers** where SIMD and cache locality dominate.

- **Stacks/queues** at the end(s) when middle insertions are rare; for bidirectional end operations, see [[cs/dsa/deque|Deque (Double-Ended Queue)]].


## Limitations / Pitfalls

> [!warning]
> **Middle insert/erase is O(n).** If your workload frequently edits the middle, a rope, gap buffer, or linked structure may be more appropriate.

> [!warning]
> **Iterator invalidation on growth.** Retain **indices** or **offsets** rather than raw pointers if clients keep references across appends.

> [!warning]
> **Over-aggressive shrinking.** Automatic shrink on transient dips can trigger reallocation churn. Prefer hysteresis or explicit control.

> [!warning]
> **Large element types.** Moving/copying heavy objects at growth can dominate runtime; consider indirection (store handles) or specialized containers.

## Summary

Dynamic arrays deliver **contiguous storage**, **O(1) random access**, and **amortized O(1) append** by **geometric growth**. They excel at iteration-heavy and append-heavy workloads with predictable patterns. Their costs—occasional **O(n) reallocation**, **iterator invalidation**, and potential **space slack**—are mitigated by prudent `reserve`, a balanced growth factor, and move-aware implementations. When middle edits, stable addresses, or concurrent access dominate, switch to structures designed for those constraints.

## See also

- [[cs/dsa/arrays|Arrays]]

- [[cs/dsa/deque|Deque (Double-Ended Queue)]]

- [[cs/dsa/linked-list|Linked List]]

- [[cs/dsa/memory-allocation|Memory Allocation]]
