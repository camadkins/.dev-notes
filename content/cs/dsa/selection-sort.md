---
title: Selection Sort
description: Repeatedly select the smallest element and place it at the front; minimal swaps but still quadratic time.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-24
aliases: []
---

## Overview

**Selection sort** is a simple in-place sorting algorithm that repeatedly **selects the minimum** element from the **unsorted tail** of the array and **swaps** it into the next position of the **sorted prefix**. It performs **exactly `n−1` swaps** in total (a key advantage on devices where swaps/writes are costly), but it still makes **Θ(n^2)** comparisons, making it slower than `n log n` algorithms on large inputs.

> [!note]
> Model: arrays are 0-indexed; at pass `i`, the **sorted prefix** is `A[0..i-1]` and the **unsorted tail** is `A[i..n-1]`.

## Core Idea

Maintain a growing **sorted prefix**. For each position `i` from left to right:

1. Scan the tail `A[i..n-1]` to find the **index of the minimum** element.

2. **Swap** that minimum into position `i`.
    After `n-1` passes, the array is sorted.

This "find-min-then-place" structure makes the algorithm conceptually clean and **[[cs/languages/Cpp/stl-algorithms|stable]] in the count of writes** (few swaps), but **unstable** in the sense of relative order for equal keys (standard implementation).

## Algorithm Steps / Pseudocode

```pseudo
function SELECTION_SORT(A):
    n = |A|
    for i in 0..n-2:
        minIdx = i
        // find index of min element in A[i..n-1]
        for j in i+1..n-1:
            if A[j] < A[minIdx]:
                minIdx = j
        if minIdx != i:
            swap(A[i], A[minIdx])
    return A
```

> [!tip]
> If **writes are expensive** (e.g., flash memory endurance, external storage), selection sort's bounded writes can be preferable to algorithms that move elements many times (e.g., [[cs/dsa/insertion-sort|Insertion Sort]] on random data).

## Example or Trace

Consider `A = [6, 3, 5, 1, 4, 2]`:

- **Pass i=0**: scan `[6,3,5,1,4,2]` → min is `1` at `minIdx=3`. Swap `A[0]↔A[3]` → `[1,3,5,6,4,2]`.

- **Pass i=1**: scan tail `[3,5,6,4,2]` → min is `2` at `minIdx=5`. Swap `A[1]↔A[5]` → `[1,2,5,6,4,3]`.

- **Pass i=2**: scan tail `[5,6,4,3]` → min is `3` at `minIdx=5`. Swap `A[2]↔A[5]` → `[1,2,3,6,4,5]`.

- **Pass i=3**: scan tail `[6,4,5]` → min is `4` at `minIdx=4`. Swap `A[3]↔A[4]` → `[1,2,3,4,6,5]`.

- **Pass i=4**: scan tail `[6,5]` → min is `5` at `minIdx=5`. Swap `A[4]↔A[5]` → `[1,2,3,4,5,6]`.

- **Pass i=5**: loop stops at `n-2`.

## Complexity Analysis

Let `n = |A|`.

- **Comparisons:** For each `i`, the inner loop scans `n−i−1` elements. Total comparisons:
    [
    \sum_{i=0}^{n-2} (n-i-1) = \frac{n(n-1)}{2} = Θ(n^2).
    ]
    This does **not** depend on input order; best, average, and worst are all quadratic.

- **Swaps/writes:** At most **`n−1` swaps** (some passes may swap with itself or skip if `minIdx == i`). This is **O(n)** data moves, often much fewer writes than [[cs/dsa/bubble-sort|Bubble Sort]] or naive in-place [[cs/dsa/quick-sort|Quick Sort]] on adversarial data.

- **Space:** **O(1)** extra space; fully in-place.

- **Stability:** **Not stable** in its standard form because swapping the min into position `i` can move a later-equal element before an earlier-equal element. (See variants below for stable adaptations.)

## Optimizations or Variants

### Early-swap elision

Skip the swap if `minIdx == i`. This avoids useless self-swaps (some standard code already guards this).

### Double-ended selection (min-max selection)

Select **both the min and the max** in each pass using two scans (or one careful scan), placing min at the left boundary and max at the right boundary. This roughly halves the number of passes (≈ `n/2`) and can reduce constant factors while retaining `Θ(n^2)` comparisons.

```pseudo
function SELECTION_SORT_MINMAX(A):
    l = 0; r = |A|-1
    while l < r:
        minIdx = l; maxIdx = l
        for j in l..r:
            if A[j] < A[minIdx]: minIdx = j
            if A[j] > A[maxIdx]: maxIdx = j
        // place min at l
        swap(A[l], A[minIdx])
        // if max was at l, it moved to minIdx
        if maxIdx == l: maxIdx = minIdx
        // place max at r
        swap(A[r], A[maxIdx])
        l = l + 1; r = r - 1
```

### Stable selection sort (with shifts instead of swaps)

To make it **stable**, instead of swapping the min into position `i`, **remove** the min and **shift** the block `A[i..minIdx-1]` one step right, then insert the min at `i`. This increases data movement to **O(n^2)** writes, sacrificing the low-write advantage but preserving stability.

### Cache-aware scans

The algorithm performs **linear scans** of the tail each pass. Using **contiguous arrays** (as usual) already helps; there is limited room for locality improvement compared to divide-and-conquer sorts that partition and work in caches more effectively.

> [!tip]
> If you care about write-count **and** asymptotics, consider **cycle sort** for minimal writes (still `Θ(n^2)` comparisons) or **heapsort** for `Θ(n log n)` comparisons with `O(n)` swaps.

## Applications

- **Small arrays** where simplicity matters and constant factors are tolerable.

- **Educational contexts** to illustrate selection versus exchange/insert paradigms.

- **Write-limited media** (EEPROM/flash) or **costly swap** settings where the **few-swaps property** dominates.

- **Partially sorted data** with extremely low write budgets (though insertion sort typically wins on near-sorted data if writes are cheap).

Selection sort complements:

- [[cs/dsa/insertion-sort|Insertion Sort]] (adaptive to near-sorted inputs, stable but more writes).

- [[cs/dsa/bubble-sort|Bubble Sort]] (conceptual neighbor-swapping baseline, but usually inferior).

- [[cs/dsa/heapsort|Heapsort]] (use a heap to select min/max in `log n` time for an `n log n` overall).

- [[cs/dsa/quick-sort|Quick Sort]] (practical `n log n` average-case with small constants; not stable).

## Common Pitfalls or Edge Cases

> [!warning]
> **Off-by-one in the inner loop.** The scan must start at `j = i+1` and run **through** `n−1`. Starting at `j=i` can cause unnecessary self-comparisons; stopping early leaves elements unexamined.

> [!warning]
> **Forgetting to track `minIdx` when equal.** Decide a policy for stability-like behavior: keep the **first** minimum (no change on `==`) to slightly reduce swaps; or choose the **last** (update on `<=`) to minimize later inversions. Neither makes the algorithm truly stable, but the choice affects tie behavior.

> [!warning]
> **Unnecessary swaps.** Always guard `if minIdx != i` before swapping to avoid writes that do nothing.

> [!warning]
> **Assuming adaptiveness.** Selection sort does **not** speed up on nearly-sorted data - comparisons remain `Θ(n^2)` regardless of presortedness. If adaptiveness is desired, use [[cs/dsa/insertion-sort|Insertion Sort]].

> [!warning]
> **Misusing for large datasets.** For `n` above a few thousand, `Θ(n^2)` comparisons dominate; prefer `n log n` algorithms unless write constraints are extreme.

## Implementation Notes or Trade-offs

- **Branching and comparisons:** The inner loop is branchy but predictable; compilers often vectorize poorly due to the min-index update pattern.

- **Data types:** For **expensive comparisons** (e.g., strings), the `Θ(n^2)` factor hurts more - consider using a key-extraction or memoized comparator.

- **I/O-bound variants:** When sorting **[[cs/history/magnetic-disk-storage|on disk]]**, selection's predictable access pattern (mostly sequential scans plus rare swaps) can be useful in carefully batched designs, though external merge is generally preferred.

- **Partial selection:** If only the **k smallest** elements are needed (unordered), use a **selection algorithm** (e.g., quickselect) or a **min-heap** of size `k` rather than sorting the entire array.

## Summary

Selection sort is an in-place algorithm that repeatedly **selects the minimum** from the unsorted tail and **swaps** it into the next position of the sorted prefix. It guarantees **`n−1` swaps** and **`Θ(n^2)` comparisons** across all inputs, is **not stable** in its vanilla form, and offers little adaptiveness. Its niche is **write-limited environments**, educational clarity, and tiny arrays. For performance at scale, choose `n log n` methods or specialized selection structures.

## Related Notes

- [[cs/dsa/insertion-sort|Insertion Sort]]

- [[cs/dsa/bubble-sort|Bubble Sort]]

- [[cs/dsa/heapsort|Heapsort]]

- [[cs/dsa/quick-sort|Quick Sort]]
