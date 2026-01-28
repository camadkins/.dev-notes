---
title: D-ary Heap
description: Generalized heap where each node has up to d children; reduces height to speed some priority-queue operations while trading more comparisons per sift-down.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2026-01-23
aliases: []
---

## Overview

A **d-ary heap** is a generalization of the binary heap where each node has up to **d children**. Like a binary heap, it stores elements in a compact **array** and maintains the **heap property** (min-heap or max-heap). Increasing `d` makes the heap **shallower** (fewer levels) but increases the **fan-out comparisons** during downward adjustments. This trade-off can improve throughput for workloads with many **decrease-key** operations or when cache behavior benefits from fewer pointer-chasing levels.

Compared with [[cs/dsa/binary-heap|Binary Heap]], a d-ary heap offers:

- **Shorter height:** `⌈log_d n⌉` levels instead of `⌈log_2 n⌉`.

- **More work per level:** selecting the best among up to `d` children during sift-down.


## Structure Definition

- **Storage:** array `A[0..n-1]` (0-indexed).

- **Arity:** integer `d ≥ 2`.

- **Indexing formulas (0-indexed):**


```pseudo
PARENT(i)     = (i - 1) / d            // integer division
CHILD(i, k)   = d * i + k               // for k in {1..d}
FIRST_CHILD   = d * i + 1
LAST_CHILD    = min(d * i + d, n - 1)
```

- **Heap property (min-heap):** For all valid children `c` of `i`, `A[i] ≤ A[c]`. (Flip comparisons for max-heap.)

## Core Operations

Assume a **min-heap** and a **key** comparable with `<`.

### Sift-up (decrease-key / insert bubble)

```pseudo
function SIFT_UP(A, i, d):
    while i > 0:
        p = PARENT(i)
        if A[i] < A[p]:
            swap(A[i], A[p])
            i = p
        else:
            break
```

### Sift-down (extract-min / delete bubble)

```pseudo
function SIFT_DOWN(A, i, n, d):
    while true:
        left = FIRST_CHILD(i)
        if left >= n: break                 // i is a leaf
        // find index m of minimum among children i's [left .. LAST_CHILD(i)]
        m = left
        last = min(left + d - 1, n - 1)
        for c from left to last:
            if A[c] < A[m]: m = c
        if A[m] < A[i]:
            swap(A[i], A[m])
            i = m
        else:
            break
```

### Insert (push)

```pseudo
function INSERT(A, x, d):
    A.append(x)
    SIFT_UP(A, n-1, d)
```

### Find-min and Extract-min (pop)

```pseudo
function MIN(A): return A[0]

function EXTRACT_MIN(A, d):
    n = length(A)
    minval = A[0]
    A[0] = A[n-1]
    remove last element
    SIFT_DOWN(A, 0, n-1, d)
    return minval
```

### Decrease-key

```pseudo
function DECREASE_KEY(A, i, new_key, d):
    A[i] = new_key
    SIFT_UP(A, i, d)
```

### Build-heap (Floyd's method, generalized)

```pseudo
function BUILD_HEAP(A, d):
    n = length(A)
    for i from (n-1)/d downto 0:
        SIFT_DOWN(A, i, n, d)
```

## Example (Stepwise)

Start with `d = 3` (ternary heap) and array `A = [2, 5, 9, 7, 6, 12]` (already a min-heap).
**Insert `4`:**

1. Append → `A = [2, 5, 9, 7, 6, 12, 4]`, index `i=6`.

2. SIFT_UP: `PARENT(6) = 2` (value `9`). Swap `4` and `9` → `A = [2, 5, 4, 7, 6, 12, 9]`.

3. New `i=2`, parent `PARENT(2)=0` (value `2`). Stop (`4 ≥ 2`). Heap property restored.


**Extract-min:**

1. Save `2`, move last element `9` to root → `[9, 5, 4, 7, 6, 12]`.

2. SIFT_DOWN at `i=0`: children indices `1..3` → values `5, 4, 7`; pick smallest `4` (index 2). Swap → `[4, 5, 9, 7, 6, 12]`.

3. New `i=2`: children `6..8` (none). Stop. Result is a valid min-heap.

## Complexity and Performance

Let `n` be the number of elements.

- **Height:** `h = ⌈log_d n⌉`.

- **Insert / Decrease-key (sift-up):** `O(log_d n)` comparisons and swaps.

- **Extract-min (sift-down):** `O(d · log_d n)` comparisons in the worst case (up to `d` child comparisons per level).

- **Build-heap:** `O(n)` time (same asymptotic as binary heaps; the linear-time proof generalizes for constant `d`).

- **Space:** `O(n)` contiguous array.


**Comparison with binary heap (`d=2`):**

- Larger `d` → **fewer levels** → fewer parent hops, but **more child comparisons** per sift-down.

- For workloads dominated by **decrease-key** (sift-up), higher `d` can be beneficial; for workloads dominated by **extract-min**, too large `d` may hurt due to the `d` factor.


> [!tip]
> In graph algorithms like Dijkstra's (with `V` extractions and up to `E` decrease-keys), a rough rule is to pick `d ≈ max(2, ⌈E / V⌉)` to balance many decrease-keys against fewer but heavier extract-mins.

## Implementation Details or Trade-offs

- **Choosing `d`:**

    - `d = 2` (binary) is a strong default.

    - `d = 4` or `8` can reduce height and improve instruction/cache behavior on modern CPUs.

    - Extremely large `d` increases comparison cost and may degrade performance.

- **Branching cost:** Use **unrolled min-child selection** for small, fixed `d` (e.g., `d ∈ {3,4,8}`), or a small loop for general `d`.

- **Stability & duplicates:** Heaps are **not stable**; equal keys may reorder.

- **Decrease-key indexing:** If keys live in external records, store **handles/indices** in the heap to avoid moving large payloads.

- **Cache friendliness:** The contiguous array and shallower height often improve locality relative to pointer-based trees.


## Practical Use Cases

- **Priority queues** in large-fan-out search and scheduling.

- **Shortest paths (Dijkstra's)** where many decrease-keys occur per extract-min.

- **Event simulation** with high insertion rates and moderate extract rate.


## Limitations / Pitfalls

> [!warning]
> **Index math bugs:** Mind `0`-indexing. Children are `d*i+1 .. min(d*i+d, n-1)`. Off-by-one errors at the tail are common.

> [!warning]
> **Oversized `d`:** Very large `d` can slow down extract-min due to `d` comparisons per level; pick `d` based on workload, not just height.

> [!warning]
> **`d = 1` is invalid:** The heap wouldn't progress; require `d ≥ 2`.

## Summary

A d-ary heap keeps the compact array layout of heaps while letting you **tune arity** to the workload. Raising `d` shrinks height and speeds operations like **decrease-key**, at the cost of more comparisons during **sift-down**. With careful choice of `d`, d-ary heaps can outperform binary heaps in priority-queue heavy algorithms.

## See also

- [[cs/dsa/binary-heap|Binary Heap]]

- [[cs/dsa/heaps|Heaps]]

- [[cs/dsa/heapsort|Heapsort]]
