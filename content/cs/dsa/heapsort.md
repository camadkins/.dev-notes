---
title: Heapsort
description: In-place O(n log n) sorting by building a heap and repeatedly extracting the extreme; cache-friendly, comparison-based, and not stable.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-22
aliases: []
---

## Overview

**Heapsort** sorts an array **in place** by first **heapifying** it (linear time) and then performing `n−1` rounds of: **swap the root with the last element of the heap, shrink the heap by one, and sift down**. Using a **max-heap** yields **ascending** order; using a **min-heap** yields **descending** order. Runtime is deterministically **`O(n log n)`** with **`O(1)`** extra space, but the algorithm is **not stable** and often loses to cache-friendlier [[cs/dsa/merge-sort|Merge Sort]] or well-implemented [[cs/dsa/quick-sort|Quick Sort]] in practice for typical, in-memory data.

## Core Idea

A heap gives **`O(1)`** access to the current **extreme** element (max or min) with an **`O(log n)`** fix-up after removal. Heapsort turns the array into a heap and then **places one final element per step** at the end of the array region reserved for **sorted output**. The "active heap" is the **prefix** `A[0..heap_end]` (exclusive upper bound), which shrinks by one after each extraction.

Key invariants:

- At the start of each round, `A[0]` holds the current global maximum (for max-heap).

- Elements in `A[heap_end..n-1]` are in **final, sorted** positions.

- `A[0..heap_end-1]` satisfies the heap property.


## Algorithm Steps / Pseudocode

We assume a **max-heap** on a **0-indexed** array for **ascending** sort.

```pseudo
function HEAPIFY(A, n):                   // Floyd's method
    for i in reverse(floor(n/2) - 1 .. 0):
        SIFT_DOWN(A, n, i)

function SIFT_DOWN(A, n, i):              // n is heap size (exclusive end)
    x = A[i]                               // pull-up variant: fewer writes
    while true:
        L = 2*i + 1
        R = 2*i + 2
        if L >= n: break
        c = L
        if R < n and A[R] > A[L]: c = R    // choose larger child
        if A[c] <= x: break
        A[i] = A[c]
        i = c
    A[i] = x

function HEAPSORT(A):
    n = length(A)
    HEAPIFY(A, n)                          // O(n)
    heap_end = n                           // exclusive bound of heap
    while heap_end > 1:
        swap A[0], A[heap_end - 1]         // place max at final position
        heap_end = heap_end - 1
        SIFT_DOWN(A, heap_end, 0)          // restore heap in A[0..heap_end-1]
```

> [!tip]
> To sort **descending**, build a **min-heap** (reverse comparisons in `SIFT_DOWN`) and keep the same sweep.

## Example or Trace

Sort `A = [4, 10, 3, 5, 1, 8, 12]` (ascending):

1. **Heapify** → max-heap (one outcome): `A = [12, 10, 8, 5, 1, 4, 3]`.

2. **Sweep:**

    - Round 1: swap `A[0],A[6]` → `[3,10,8,5,1,4,12]`, `heap_end=6`; sift-down at 0 → `[10,5,8,3,1,4,12]`.

    - Round 2: swap root with `A[5]` → `[4,5,8,3,1,10,12]`, `heap_end=5`; sift-down → `[8,5,4,3,1,10,12]`.

    - Round 3: swap with `A[4]` → `[1,5,4,3,8,10,12]`, `heap_end=4`; sift-down → `[5,3,4,1,8,10,12]`.

    - Round 4: swap with `A[3]` → `[1,3,4,5,8,10,12]`, `heap_end=3`; sift-down → `[4,3,1,5,8,10,12]`.

    - Round 5: swap with `A[2]` → `[1,3,4,5,8,10,12]`, `heap_end=2`; sift-down → `[3,1,4,5,8,10,12]`.

    - Round 6: swap with `A[1]` → `[1,3,4,5,8,10,12]`, `heap_end=1` (done).


Array is sorted, and the tail grew monotonically: `[...,10,12]`, then `[...,8,10,12]`, etc.

## Complexity Analysis

- **Time:**

    - Build heap: **`O(n)`** via bottom-up heapify.

    - Sweep: `n−1` times **`O(log n)`** `SIFT_DOWN` → **`O(n log n)`** total.

- **Space:** **`O(1)`** auxiliary - the sort is in-place.

- **Comparisons/moves:** The **pull-up** `SIFT_DOWN` reduces swaps; on modern CPUs it improves constants by cutting stores and branches.


**Stability.** Heapsort is **not stable**; equal keys may swap relative order. If stability matters, prefer [[cs/dsa/merge-sort|Merge Sort]] or tag elements with a tie-breaker.

## Optimizations or Variants

- **Pull-up vs swap-down:** The shown `SIFT_DOWN` moves children upward and writes the pulled value once at the end. This usually outperforms "swap on each step".

- **Bottom-up (branch-reduced) sifting:** Pre-descend to the leaf along the larger-child path, then **binary-search upwards** to place `x`. Reduces comparisons on random data.

- **Heap shape tweaks:** **k-ary heaps** (k>2) reduce height (`log_k n`) at the cost of higher arity checks; overall gains are workload-dependent.

- **Two-phase selection:** For partial sorts (top-k), don't heapsort everything - build a heap of size `k` and stream the array for **`O(n log k)`**.

- **Block heaps / cache-aware layouts:** Rearranging tree nodes to improve locality helps large arrays, but adds complexity.


## Applications

- **Deterministic in-place sort** with tight memory budgets.

- **Adversarial/worst-case safety:** Unlike naive quicksort, heapsort's upper bound holds regardless of input order.

- **Embedded/real-time** contexts that require no extra buffers and predictable bounds.


For general-purpose, cache-rich environments, high-quality quicksorts ([[cs/languages/Cpp/stl-algorithms|introsort]]) and mergesort variants often outperform heapsort on typical data due to **branch prediction** and **[[cs/systems/memory-hierarchy-and-caching|sequential access]]** advantages.

## Common Pitfalls or Edge Cases

> [!warning]
> **Heap size vs array length.** Pass the current **heap size** (`heap_end`) to `SIFT_DOWN`, not the full array length. Otherwise the sift can trespass into the sorted suffix.

> [!warning]
> **Off-by-one on the last internal node.** In 0-based arrays, heapify starts at `⌊n/2⌋−1`. Starting at `⌊n/2⌋` pointlessly touches a leaf.

> [!warning]
> **Mixing min/max logic.** Heapsort assumes a **max-heap** for ascending output. If you flip one comparison but not the others, the invariant breaks silently.

> [!warning]
> **Assuming stability.** Equal keys are not preserved. If you need it, use a stable algorithm or decorate items with indices and sort by `(key, index)`.

> [!warning]
> **Comparator inconsistencies.** Custom comparators must define a **strict weak ordering**. Violations cause non-termination or corrupted heaps.

## Implementation Notes or Trade-offs

- **Indexing formulas (0-based):** `left=2i+1`, `right=2i+2`, `parent=(i−1)//2`; leaves live in `[⌊n/2⌋..n-1]`. See [[cs/dsa/heaps|Heaps - Overview]] and [[cs/dsa/heapify|Heapify]].

- **In-place & cache:** Arrays give good spatial locality; `SIFT_DOWN` touches `O(log n)` nodes per round.

- **Parallelism:** Heapsort is inherently sequential in the sweep. If you need parallel sorting, consider mergesort/bitonic variants or parallel partition-based quicksort.


## Summary

Heapsort = **heapify once** (`O(n)`) + **n−1 sift-downs** (`O(n log n)`), all **in place**. It's robust, memory-lean, and predictable, but not stable and - on many real workloads - slower than tuned quicksort/mergesort due to access patterns. Use it when you need **tight memory and hard worst-case guarantees**.

## Related Notes

- [[cs/dsa/heapify|Heapify]]

- [[cs/dsa/binary-heap|Binary Heap]]

- [[cs/dsa/quick-sort|Quick Sort]]

- [[cs/dsa/merge-sort|Merge Sort]]
