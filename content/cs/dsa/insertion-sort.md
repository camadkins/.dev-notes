---

title: Insertion Sort
description: Build a sorted prefix by shifting the right spot for each key; stable, in-place, and adaptive to near-sorted data.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-28
aliases: []

---

## Overview

**Insertion Sort** builds a **sorted prefix** of the array by inserting one element at a time into its correct position. At pass `i`, the prefix `A[0..i-1]` is already sorted; we take `A[i]` (the **key**), **shift** larger elements in the prefix to the right, and place the key into the resulting **gap**. The algorithm is:

- **Stable** (equal keys preserve relative order),

- **In-place** (`O(1)` auxiliary space),

- **Adaptive** (runs close to linear time on nearly-sorted inputs),

- A common choice for **tiny arrays** or as a **base case** inside hybrid sorts.

## Core Idea

Maintain the invariant: after the `i`-th pass (0-indexed), `A[0..i]` is sorted. To insert `A[i]`, scan **left** across the sorted prefix to find the insertion point, shifting any larger elements **one position right** so the key can be placed without extra swaps. Because only adjacent elements move, relative order of equals does not change → **stability**.

Insertion sort's work is proportional to the number of **inversions** in the input - pairs `(p,q)` with `p<q` but `A[p] > A[q]`. Each shift fixes (at least) one inversion, so fewer inversions ⇒ less work.

## Algorithm Steps / Pseudocode

### Standard insertion sort (0-indexed, ascending)

```pseudo
function INSERTION_SORT(A):
    n = length(A)
    for i in 1..n-1:
        key = A[i]
        j = i - 1
        // shift larger items to the right
        while j >= 0 and A[j] > key:
            A[j + 1] = A[j]
            j = j - 1
        A[j + 1] = key
```

> [!tip]
> Use **shifts**, not swaps. Swapping repeatedly triples writes and hurts cache; the typical pattern is "copy up" until the gap opens, then **write key once**.

### Binary-search insertion (fewer comparisons)

Replace the linear scan with a binary search over the sorted prefix to locate the **leftmost** insertion index. You still must **shift** to make room.

```pseudo
function BINARY_INSERTION_SORT(A):
    n = length(A)
    for i in 1..n-1:
        key = A[i]
        // find first index pos where A[pos] >= key
        lo = 0; hi = i
        while lo < hi:
            mid = (lo + hi) // 2
            if A[mid] < key:
                lo = mid + 1
            else:
                hi = mid
        // shift A[lo..i-1] right by one
        for j in i-1 down to lo:
            A[j + 1] = A[j]
        A[lo] = key
```

This reduces comparisons to `O(n log n)` but data **movement** remains `Θ(n²)` in the worst case.

### Sentinel optimization (optional)

If you can place a **sentinel** - a global minimum at `A[0]` - you can drop the `j>=0` check inside the inner loop for fewer branches. This requires either ensuring `A[0]` is the minimum or moving the minimum to index 0 once up front.

```pseudo
function INSERTION_SORT_WITH_SENTINEL(A):
    n = length(A)
    // move global minimum to A[0]
    minIdx = argmin(A[0..n-1]); swap A[0], A[minIdx]
    for i in 2..n-1:
        key = A[i]
        j = i - 1
        while A[j] > key:          // no j>=0 check needed
            A[j + 1] = A[j]
            j = j - 1
        A[j + 1] = key
```

## Example or Trace

Consider `A = [7, 3, 5, 2, 3]`.

- **i=1, key=3:** Shift `7` right → `[7,7,5,2,3]`, place `3` at index 0 → `[3,7,5,2,3]`.

- **i=2, key=5:** Shift `7` right → `[3,7,7,2,3]`, place `5` at index 1 → `[3,5,7,2,3]`.

- **i=3, key=2:** Shift `7,5,3` right → `[3,5,7,7,3] → [3,5,5,7,3] → [3,3,5,7,3]`, place `2` at index 0 → `[2,3,5,7,3]`.

- **i=4, key=3:** Shift `7,5` right → `[2,3,5,7,7] → [2,3,5,5,7]`, compare at `3` (equal): stop **before** `3` for **stability**, place at index 2 → `[2,3,3,5,7]`.

## Complexity Analysis

- **Time (worst/average):** `Θ(n²)` comparisons and moves (e.g., reverse-sorted input).

- **Best case (already sorted):** `Θ(n)` comparisons, **0 moves** aside from the key copy (`A[j+1]=key`) each pass - **adaptive** behavior.

- **Binary insertion variant:** `O(n log n)` comparisons but still `Θ(n²)` moves; improves instruction count for expensive comparisons (e.g., long strings with lexicographic compare).

- **Space:** `O(1)` auxiliary; operates in place.

- **Stability:** **Stable** because equal elements never cross - stop condition uses `A[j] > key`, not `>=`.

**Cost model intuition.** Let `Inv(A)` be the number of inversions. Standard insertion sort runs in `Θ(n + Inv(A))`, because each shift eliminates one inversion and we always do at least `n−1` passes.

## Optimizations or Variants

- **Galloping/guarded inner loop.** Unroll small runs of `A[j] > key` to reduce branch overhead on predictable patterns.

- **Block shifting / memmove.** After finding `lo` with binary search, shift `A[lo..i-1]` using a single `memmove` when elements are trivially copyable.

- **Small-subarray cutoff.** In hybrid sorts (e.g., introsort, timsort), switch to insertion sort when subarray size `≤ 16–32`, exploiting cache and low constant factors.

- **Gapped variants / Shellsort.** Insertion sort over **gapped** subsequences (stride `h`) is the building block of [[sorting|Shellsort families]]; final `h=1` pass reduces to standard insertion.

- **Bidirectional insertion (list-like).** For data structures with fast insert in the middle (linked lists, gap buffers), insertion sort can be applied with fewer moves but more pointer chasing; typically slower on arrays due to caches.

## Applications

- **Educational baseline:** Introduces loop invariants and stability.

- **Tiny arrays:** Sorting very small ranges inside larger algorithms (partition remainders, short buckets).

- **Nearly-sorted data:** When inputs have small **disorder** (few inversions), insertion sort is close to linear and can outperform `O(n log n)` sorts with large constants.

- **Key extraction/decoration pipelines:** When comparisons are expensive but moves are cheap, **binary insertion** plus block shift works well.

## Common Pitfalls or Edge Cases

> [!warning]
> **Using swaps instead of shifts.** Swapping `A[j]` and `A[j+1]` repeatedly triples writes and harms performance; prefer shift + single write of `key`.

> [!warning]
> **Off-by-one in inner loop.** Ensure you stop at `j=-1` cleanly or use a **sentinel** to avoid bounds checks; otherwise dereferencing `A[-1]` is a risk.

> [!warning]
> **Breaking stability.** If you scan while `A[j] >= key` rather than `> key`, equals will move **past** each other and the sort becomes **unstable**.

> [!warning]
> **Large element copies.** For large records, shifting many bytes is costly. Store **indices** or decorate with small keys and move references instead of full payloads.

> [!warning]
> **Binary search but linear move.** Don't expect `O(n log n)` end-to-end just from binary search; shifting still dominates.

## Implementation Notes or Trade-offs

- **Comparator discipline.** Comparators must provide a **strict weak ordering**. Inconsistent comparators (or NaNs in floating-point) can cause non-termination or misordered results.

- **Data layout.** Arrays are cache-friendly; linked lists avoid shifting but lose locality and incur allocation overhead - arrays win on modern CPUs.

- **Sentinel practicality.** The sentinel trick is fastest when moving trivially copyable scalars; for general types, first pass to find min, then swap once is usually worthwhile.

- **Partial sorting.** If the task is to insert one new item into an already-sorted array, reuse the insertion inner loop directly; cost is the distance to its position.

## Summary

Insertion sort grows a sorted prefix by **shifting** larger elements and dropping the **key** into the opened gap. It's **stable**, **in-place**, and **adaptive** - ideal for tiny ranges or nearly-sorted data and as a **cutover** in hybrids. Use **shifts** (not swaps), consider **binary search** to cut comparisons, and guard the inner loop with a **sentinel** when possible. On general unsorted inputs, expect `Θ(n²)` behavior; on low-inversion inputs, expect near-linear performance.

## Related Notes

- [[selection-sort|Selection Sort]]

- [[merge-sort|Merge Sort]]

- [[quick-sort|Quick Sort]]

- [[algorithm-efficiency|Algorithm Efficiency]]
