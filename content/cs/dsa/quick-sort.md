---
title: Quick Sort
description: Partition an array around a pivot and recurse; average n log n with small constants, but quadratic without good pivoting or duplicate handling.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-04
aliases: []

---

## Overview

Quick sort is a **divide-and-conquer** sorting algorithm that repeatedly **partitions** an array segment around a chosen **pivot**, placing smaller elements to the left and larger to the right, then recursively sorts the subsegments. It is prized for:

- **Average-case** time near the theoretical lower bound - typically **O(n log n)** with excellent constants.

- **In-place** operation - **O(1)** extra space (beyond recursion stack).

- **Cache efficiency** - linear scans over contiguous memory.

However, it can degrade to **O(n^2)** when pivots are poor (e.g., already-sorted input with naive pivot choice) or when duplicates are handled naively. Practical implementations deploy **randomization**, **median-of-three**, **3-way partitioning**, and **[[cs/languages/Cpp/stl-algorithms|introspective fallbacks]]** to avoid pathologies.

> [!note]
> Notation: arrays are 0-indexed; subarray `A[l..r]` is inclusive. We write `(l, r)` for indices and use `swap(A[i], A[j])` for element swaps.

## Core Idea

1. **Choose a pivot** `p` from `A[l..r]`.

2. **Partition** the segment into elements `< p` and `≥ p` (or `≤ p` and `> p`, depending on the scheme).

3. **Recurse** on the two resulting subsegments until they are trivially sorted.

The **partition** step is the heart of quick sort. Two classical single-pivot schemes are:

- **Lomuto**: simple, one pass, more swaps; best with many small elements moving left of the pivot.

- **Hoare**: two-pointer inward scan; fewer swaps; pivot may end up anywhere within the partition boundary.

When the input has many **duplicate keys**, a **3-way partition** (Dijkstra's "Dutch National Flag") greatly reduces unnecessary work.

## Algorithm Steps / Pseudocode

### 1) Lomuto partition + randomized quick sort

```pseudo
function PARTITION_LOMUTO(A, l, r):
    p = A[r]                      // pivot at end
    i = l                         // A[l..i-1] < p
    for j in l..r-1:              // A[i..j-1] >= p
        if A[j] < p:
            swap(A[i], A[j])
            i = i + 1
    swap(A[i], A[r])              // pivot to its final place
    return i                      // pivot index

function QUICKSORT_LOMUTO(A, l, r):
    while l < r:                  // tail recursion eliminated
        k = random(l, r)          // random pivot to avoid worst case
        swap(A[k], A[r])
        m = PARTITION_LOMUTO(A, l, r)
        // Recurse on smaller side first to bound stack depth
        if (m - 1 - l) < (r - (m + 1)):
            QUICKSORT_LOMUTO(A, l, m - 1)
            l = m + 1             // loop on right side
        else:
            QUICKSORT_LOMUTO(A, m + 1, r)
            r = m - 1
```

### 2) Hoare partition + quick sort

```pseudo
function PARTITION_HOARE(A, l, r):
    p = A[l]                      // pivot at start (could be median-of-three)
    i = l - 1
    j = r + 1
    while true:
        repeat j = j - 1 until A[j] <= p
        repeat i = i + 1 until A[i] >= p
        if i < j:
            swap(A[i], A[j])
        else:
            return j              // partition boundary (last index of left)

function QUICKSORT_HOARE(A, l, r):
    while l < r:
        m = PARTITION_HOARE(A, l, r)
        if (m - l) < (r - (m + 1)):
            QUICKSORT_HOARE(A, l, m)
            l = m + 1
        else:
            QUICKSORT_HOARE(A, m + 1, r)
            r = m
```

### 3) 3-way partition (great for many equal keys)

```pseudo
function QUICKSORT_3WAY(A, l, r):
    if l >= r: return
    k = random(l, r)
    swap(A[l], A[k])              // pivot to front
    p = A[l]
    lt = l                        // A[l..lt-1] < p
    i  = l + 1                    // A[lt..i-1] == p
    gt = r                        // A[gt+1..r] > p
    while i <= gt:
        if A[i] < p:
            swap(A[lt], A[i]); lt = lt + 1; i = i + 1
        else if A[i] > p:
            swap(A[i], A[gt]); gt = gt - 1
        else:
            i = i + 1
    QUICKSORT_3WAY(A, l, lt - 1)
    QUICKSORT_3WAY(A, gt + 1, r)
```

> [!tip]
> **Hybridization** is standard: switch to [[insertion-sort|Insertion Sort]] for tiny subarrays (e.g., length ≤ 16). It reduces overhead and improves cache behavior.

## Example or Trace

Consider `A = [9, 3, 7, 1, 8, 2, 5]`, `l=0, r=6`, using **Lomuto** with random pivot that ends up at `A[6]=5`.

- Partition around `5`:

    - `i=0`. Scan `j` from 0 to 5:

        - `9` (≥5): no swap

        - `3` (<5): swap `A[0]↔A[1]` → `[3,9,7,1,8,2,5]`, `i=1`

        - `7` (≥5)

        - `1` (<5): swap `A[1]↔A[3]` → `[3,1,7,9,8,2,5]`, `i=2`

        - `8` (≥5)

        - `2` (<5): swap `A[2]↔A[5]` → `[3,1,2,9,8,7,5]`, `i=3`

    - Place pivot: swap `A[3]↔A[6]` → `[3,1,2,5,8,7,9]`, pivot index `m=3`.

- Recurse on `[3,1,2]` and `[8,7,9]`. Balanced recursion continues; final sorted array is `[1,2,3,5,7,8,9]`.

## Complexity Analysis

Let `n = r − l + 1`.

- **Balanced splits (average)**: each level does linear partition work; **depth ≈ log n** → **O(n log n)** time.

- **Worst case**: highly unbalanced splits (e.g., pivot always min or max) → **depth ≈ n** → **O(n^2)** time.

- **Space**:

    - In-place partition uses **O(1)** auxiliary space.

    - **Recursion stack**: **O(log n)** expected with randomization/tail-recursion elimination; **O(n)** worst-case without safeguards.

**Constants & locality**: Quick sort's sequential scans and minimal auxiliary state give it **lower constant factors** than [[merge-sort|Merge Sort]] in many real systems, despite both being `n log n` on average/balanced inputs.

> [!note]
> Randomized pivot selection ensures that, **regardless of input order**, the _expected_ recursion depth is `O(log n)` and the _expected_ time is `O(n log n)`.

## Optimizations or Variants

### Pivot selection

- **Random pivot**: robust, simple; avoids adversarial patterns.

- **Median-of-three**: median of `{A[l], A[mid], A[r]}`; good practical bias against sorted/reverse-sorted cases.

- **Ninther (median-of-medians-of-three)**: for large arrays, improves pivot quality at small extra cost.

### 3-way partitioning

When duplicates are common, a standard 2-way partition **re-sorts equal regions**, causing unnecessary recursion. Dijkstra's **3-way** partition collapses equals in one pass, significantly reducing depth.

### Small-subarray cutoff

Switch to **Insertion Sort** when the subarray length ≤ a small **k** (often 8-32). Improves branch prediction and [[cs/systems/memory-hierarchy-and-caching|cache locality]].

### Tail recursion elimination

Always recurse into the **smaller** side and iterate on the other. This caps stack depth to **O(log n)** even without randomization.

### Introspective quick sort (introsort)

Track recursion depth; when it exceeds `⌊2 log n⌋` (or similar threshold), **fallback** to [[heapsort|Heapsort]] to guarantee **O(n log n)** worst-case time. Used in many standard libraries.

### Partition scheme choice

- **Hoare** usually performs fewer swaps and handles repeated elements slightly better with strict/weak comparator care.

- **Lomuto** is easier to teach/verify but can be slower due to extra swaps; pairing with 3-way or median-of-three closes much of the gap.

> [!tip]
> If your comparator is expensive, **minimize comparisons**: Hoare often wins; small-subarray cutoffs help; and 3-way partition avoids redundant re-comparisons of equals.

## Applications

- **General-purpose in-memory sort**: strong default in performance-critical libraries (often as **introsort**).

- **Selection algorithms**: quickselect (partition then recurse into the side containing the k-th element).

- **External systems**: used inside hybrid pipelines where early in-memory phases partition data before spilling or merging.

Quick sort complements:

- [[merge-sort|Merge Sort]] for stable sorting or external sorting.

- [[heapsort|Heapsort]] as a worst-case guard.

- [[insertion-sort|Insertion Sort]] as a tiny-tail accelerator.

## Common Pitfalls or Edge Cases

> [!warning]
> **Naive pivot on structured data.** Choosing `A[l]` or `A[r]` as pivot on already-sorted or reverse-sorted arrays triggers worst-case behavior. Use **random** or **median-of-three**.

> [!warning]
> **Duplicates blow-up.** Without **3-way partition**, arrays with many equal keys cause deep recursion and extra work.

> [!warning]
> **Comparator consistency.** Non-transitive or stateful comparators can violate partition invariants and cause infinite loops (especially in **Hoare**). Ensure a strict weak ordering.

> [!warning]
> **Off-by-one indices.** Be disciplined with inclusive ranges. In Lomuto, the inner loop is `l..r-1`; in Hoare, return boundary `j` and recurse on `[l..j]` and `[j+1..r]`.

> [!warning]
> **Stack overflows.** On huge inputs or adversarial cases, add **tail recursion elimination** and/or an **introsort** fallback.

> [!warning]
> **Stability expectations.** Quick sort is **not stable**. If equal keys must preserve input order, use or adapt a **stable** algorithm (e.g., merge sort) or a **tagged** comparator.

## Implementation Notes or Trade-offs

- **In-place vs stable**: quick sort is in-place and fast; merge sort is stable but uses O(n) extra memory (unless complex in-place merges are used).

- **Cache & branch prediction**: partition loops are branch-heavy. Using **branchless** comparisons and data-dependent swapping can help on modern CPUs.

- **Cutoff tuning**: benchmark a cutoff `k` for your platform (often 16). Too small wastes function-call overhead; too large hurts theoretical guarantees.

- **Randomness source**: reuse a fast RNG or **median-of-three** to avoid per-call RNG cost.

- **Type-specific paths**: specialized partitions for primitives (e.g., `int`, `float`) reduce comparator overhead; generic comparator paths for objects.

## Summary

Quick sort partitions an array around a pivot and sorts subarrays recursively. With good pivot selection (random or median-of-three), small-subarray cutoffs, and 3-way partitioning for duplicates, it delivers **O(n log n)** expected time, **O(1)** extra space, and outstanding real-world performance. To make it robust, add **tail recursion elimination** and an **introsort fallback** to guarantee worst-case bounds, and carefully choose partition schemes and comparator discipline.

## Related Notes

- [[merge-sort|Merge Sort]]

- [[heapsort|Heapsort]]

- [[insertion-sort|Insertion Sort]]

- [[recurrences-master-theorem|Recurrences - Master Theorem]]
