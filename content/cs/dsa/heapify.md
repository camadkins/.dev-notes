---
title: Heapify
description: Build a binary heap from an array in linear time using bottom-up sift-down (Floyd's method); includes proofs, indexing notes, and comparisons to n log n builds.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-11
aliases: []
---

## Overview

**Heapify** transforms an unsorted array into a **binary heap** in **linear time**. The standard procedure (often called **Floyd's method**) performs **bottom-up sift-down** on each internal node, ensuring that the **heap-order property** holds. This is more efficient than inserting elements one by one (which costs `O(n log n)`), and it underpins fast heap construction for [[cs/dsa/heapsort|Heapsort]] and priority-queue initialization.

## Core Idea

A binary heap is a **complete binary tree** stored in an array `A[0..n-1]` with parent/child relations:

- `left(i) = 2i + 1`, `right(i) = 2i + 2` (0-indexed).

- **Max-heap** (shown here): `A[i] ≥ A[left(i)]` and `A[i] ≥ A[right(i)]` when children exist.
    (For **min-heap**, reverse comparisons.)


If every subtree rooted at `i` is a heap, then doing a **sift-down** at `i` fixes violations at that node while preserving heap order below. By processing nodes from the **last internal node up to the root**, each sift-down traverses only as far as necessary (often a few levels), yielding `O(n)` total work.

## Algorithm Steps / Pseudocode

### Sift-down (max-heap)

```pseudo
function SIFT_DOWN(A, n, i):
    // assumes subtrees at i are heaps; restores heap at i
    while true:
        L = 2*i + 1
        R = 2*i + 2
        largest = i
        if L < n and A[L] > A[largest]:
            largest = L
        if R < n and A[R] > A[largest]:
            largest = R
        if largest == i:
            break
        swap A[i], A[largest]
        i = largest
```

### Build-heap (Floyd's heapify)

```pseudo
function HEAPIFY(A, n):
    // last internal node is floor(n/2) - 1 in 0-indexed arrays
    for i in reverse(floor(n/2) - 1 .. 0):
        SIFT_DOWN(A, n, i)
```

> [!tip]
> For **min-heap**, replace the ">`" comparisons with "<" and the variable names accordingly.

## Example or Trace

**Array:** `A = [4, 10, 3, 5, 1, 8, 12]` (`n=7`).
Internal nodes are indices `0..2` (since `⌊n/2⌋−1 = 2`).

1. `i=2` (`A[2]=3`, children at 5 (`8`) and 6 (`12`)): swap with `12` → `A = [4,10,12,5,1,8,3]`. Sift-down ends (new index 6 is a leaf).

2. `i=1` (`A[1]=10`, children 3 (`5`), 4 (`1`)): already ≥ children → no change.

3. `i=0` (`A[0]=4`, children 1 (`10`), 2 (`12`)): swap with `12` → `A=[12,10,4,5,1,8,3]`.
    Continue at index 2 (children 5=`8`, 6=`3`): swap with `8` → `A=[12,10,8,5,1,4,3]`. End.


Final **max-heap**: `[12,10,8,5,1,4,3]`. The tree's parent is always ≥ children.

## Complexity Analysis

- **Time (Floyd's heapify):** `O(n)`.
    **Why:** A node at **height** `h` (distance to a leaf) can trigger at most `h` swaps. In a complete binary tree:

    - ≤ `⌈n/2⌉` nodes have `h=0`,

    - ≤ `⌈n/4⌉` have `h=1`,

    - ≤ `⌈n/8⌉` have `h=2`, …
        Total work ≤ `∑_{h≥0} (n/2^{h+1})·h = n·∑_{h≥0} h/2^{h+1} = n·1 = O(n)` (the series sums to 1).

- **Space:** `O(1)` extra; operations are in-place on the array.

- **Compare with `n` inserts:** Repeated `push` into a heap costs `O(n log n)` in total because each insert may bubble up `O(log n)` levels.


## Optimizations or Variants

- **Top-down vs bottom-up:** Bottom-up is strictly better for bulk build. Use top-down only if streaming elements one at a time.

- **Branch-reduced sift-down:** Pick child index with a single compare (`choose child = argmax(A[L], A[R])` if `R<n`), then one compare against parent; reduces branches on hot paths.

- **Pull-up technique:** Save `x = A[i]`; while child larger than `x`, **move child up**; place `x` once at final position. Cuts swaps roughly in half.

- **k-ary heaps:** Replace child formula with `child_t(i) = k*i + t (1≤t≤k)` and adapt height arguments; heapify remains `O(n)`.

- **Bottom-up construction for min-heap** (priority queue with smallest at root): identical structure with inverted comparisons.


## Applications

- **Heapsort:** Call `HEAPIFY`, then repeatedly swap `A[0]` with `A[n-1]`, decrement `n`, and `SIFT_DOWN(A, n, 0)`. Total `O(n log n)` after `O(n)` build.

- **Priority queues:** Fast initialization from an existing dataset (e.g., schedule by priority).

- **Selection/Top-k:** Build a min-heap of size `k` (or heapify the whole array) to filter or extract extremes efficiently.


## Common Pitfalls or Edge Cases

> [!warning]
> **Indexing confusion (0 vs 1-based).** This note assumes **0-indexed** arrays with `left=2i+1`, `right=2i+2`, and the last internal node at `⌊n/2⌋−1`. In **1-indexed** arrays: `left=2i`, `right=2i+1`, last internal node `⌊n/2⌋`.

> [!warning]
> **Wrong start index.** Starting heapify at `i = ⌊n/2⌋` wastes a step (that node is a leaf). Start at `⌊n/2⌋−1`.

> [!warning]
> **Assuming children exist without bounds checks.** Always test `L<n` and `R<n` before accessing; off-by-one bugs here corrupt the heap.

> [!warning]
> **Mixing min-/max-heap comparisons.** Be consistent across `SIFT_DOWN` and later uses (e.g., heapsort expects a **max-heap** if it starts by swapping root with end).

## Implementation Notes or Trade-offs

- **Stability:** Binary heaps are **not stable**; relative order among equal keys is not preserved. If stability is required, carry a `(key, tiebreak)` pair.

- **Comparable keys:** Define a **[[cs/math/relations-and-equivalence|total order]]** (`<`/`>`) or a comparator. Inconsistent comparators violate heap invariants.

- **[[cs/systems/memory-hierarchy-and-caching|Cache behavior]]:** Arrays give good locality; the pull-up variant reduces swaps (writes) which can be beneficial for large data.

- **Partial heapify:** For **top-k** with small `k`, heapify a `k`-element heap and scan the rest with conditional inserts; overall `O(n log k)`.

- **Verification:** After heapify, quickly check `A[i] ≥ A[left(i)]` and `A[i] ≥ A[right(i)]` (or the min-heap version) for all valid `i`.


## Summary

Bottom-up **heapify** builds a heap from an array in **linear time** by running **sift-down** from the last internal node to the root. The cost is linear because most nodes sit near the leaves and require only shallow adjustments. This method is the right default for initializing heaps, enabling `O(n)` build followed by `O(log n)` per extract in heapsort and priority-queue workloads.

## Related Notes

- [[cs/dsa/binary-heap|Binary Heap]]

- [[cs/dsa/heaps|Heaps]]

- [[cs/dsa/heapsort|Heapsort]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
