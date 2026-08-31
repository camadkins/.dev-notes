---
title: Bucket Sort
description: Distribute elements into ordered ranges, sort inside each bucket, then concatenate; linear-time expected on well-spread inputs.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-14
aliases: []
---

## Overview

**Bucket Sort** is a **distribution-based sorting algorithm** that maps elements into **ordered buckets**, sorts each bucket locally, and **concatenates** buckets to produce a globally sorted array.
When the mapping spreads items evenly (e.g., approximately [[cs/statistics/probability-distributions|uniform data]] or quantile-calibrated cut points) and the number of buckets matches the input scale, the algorithm achieves **expected $O(n)$** time.

> [!note]
> The comparison lower bound $Ω(n\log n)$ does **not** apply here because order arises from **value-to-range mapping**, not pairwise comparisons alone.

---

## Intuition

Think of pouring pebbles through a sieve with evenly sized slots. Each slot (bucket) collects a narrow value range. Because each bucket receives **few** items, sorting inside a bucket is cheap; concatenating buckets in order yields the final sorted run.

- **Even spread ⇒ tiny buckets ⇒ linear behavior**

- **Skewed spread ⇒ fat buckets ⇒ falls back to the bucket's internal sorter**

---

## Pseudocode

```pseudo
function BUCKET_SORT(A, m):        // A[0..n-1] of numeric keys; m buckets
    B = array of m empty lists     // or contiguous ranges via two-pass layout

    // Distribute
    for j from 0 to length(A)-1:
        i = bucket_index(A[j], m)  // e.g., floor(m * A[j]) if A[j] ∈ [0,1)
        append A[j] to B[i]

    // Sort within buckets
    for i from 0 to m-1:
        STABLE_SORT(B[i])          // insertion sort for tiny buckets; mergesort/Timsort otherwise

    // Concatenate
    k = 0
    for i from 0 to m-1:
        for each x in B[i] (in order):
            A[k] = x
            k = k + 1
```

> [!tip]
> For cache efficiency, use a **two-pass contiguous layout**: (1) histogram counts, (2) prefix sums to compute offsets, (3) scatter into one output array partitioned by bucket, (4) sort each contiguous region in place.

---

## Dry Run Example

Array `A = [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68]`, with `m = 5` buckets over $[0,1)$ using `i = ⌊5x⌋`:

|Bucket|Range|Elements (unsorted)|After in-bucket sort|
|--:|---|---|---|
|B[0]|[0.00, 0.20)|0.17, 0.12|0.12, 0.17|
|B[1]|[0.20, 0.40)|0.39, 0.26, 0.21, 0.23|0.21, 0.23, 0.26, 0.39|
|B[2]|[0.40, 0.60)| - | - |
|B[3]|[0.60, 0.80)|0.72, 0.68, 0.78|0.68, 0.72, 0.78|
|B[4]|[0.80, 1.00)|0.94|0.94|

Concatenation in bucket order yields the globally sorted array.

---

## Time Complexity

|Phase|Work|
|---|---|
|Bucket allocation + concat|$O(n + m)$|
|In-bucket sorting (expected)|$O(n^2/m)$ with insertion sort; $O(\sum k_i\log k_i)$ with mergesort/Timsort|

- With **uniform** spread and **$m = Θ(n)$**: expected total is **$O(n)$**.

- **Worst case (heavy skew):** one giant bucket ⇒ cost of the chosen in-bucket sort on $n$ items (e.g., $O(n^2)$ for insertion, $O(n\log n)$ for mergesort/Timsort).

- **Space:** $O(n + m)$ (lists) or $O(n + m)$ (two-pass arrays: counts + offsets).

---

## Optimizations

1. **Choose $m$ wisely**

    - Classic: $m \approx n$ to keep expected bucket size near 1.

    - Cache-aware: pick $m$ so typical bucket fits L1/L2.

    - Memory-bound: smaller $m$ + faster in-bucket sort.

2. **Quantile or CDF-based buckets**
    Estimate the CDF $F(x)$ via sampling; choose cut points at quantiles so buckets have similar expected occupancy, mitigating skew.

3. **Adaptive splitting**
    Detect oversized buckets during the pass and split them (requires extra offsets but stabilizes performance).

4. **Hybrid interiors**
    Use counting/radix inside buckets with small integer ranges; otherwise use insertion sort for tiny buckets and Timsort/mergesort for larger ones.

5. **Parallelization**
    Per-thread histograms → reduce → prefix sums → parallel scatter → parallel per-bucket sorts.

---

## Common Pitfalls

> [!warning]
> **Rounding at the upper bound:** Clamp `i = min(m-1, floor(m*x))` to avoid `i == m` when `x ≈ 1.0`.

> [!warning]
> **Skewed inputs:** Heavy clustering collapses linear-time behavior. Prefer quantile buckets when distributions drift.

> [!warning]
> **Unstable pipeline:** Bucket sort is not inherently stable; stability depends on the in-bucket algorithm and concatenation order.

> [!warning]
> **Too many small lists:** With `m ≈ n`, per-bucket list overhead hurts. Prefer the two-pass contiguous layout to cut allocations and improve locality.

---

## Use Cases

- **Numeric analytics / telemetry** where normalization to $[0,1)$ approximates uniformity.

- **Range partitioning** stages in databases and analytics (map → reduce → sort).

- **Pre-sorting for merges**: form small sorted runs cheaply before a merge-heavy phase.

- **Hybrid pipelines** with [[cs/dsa/radix-sort|Radix Sort]] and [[cs/dsa/counting-sort|Counting Sort]].

---

## Comparison to Related Sorts

|Algorithm|Model|Expected Time|Worst Time|Stable|Notes|
|---|---|---|---|---|---|
|**Bucket Sort**|Distribution|$O(n)$|$O(n\log n)$ or $O(n^2)$ (by in-bucket choice)|Depends|Great when spread is even|
|**Counting Sort**|Non-comparison|$O(n+U)$|$O(n+U)$|✅|For bounded integer range $U$|
|**Radix Sort**|Non-comparison|$O(d(n+U))$|$O(d(n+U))$|✅|Digitwise; pairs well with bucketing|
|**Quick Sort**|Comparison|$O(n\log n)$|$O(n^2)$|❌|Strong cache locality in practice|

---

## Summary

- Map elements into **ordered buckets**, sort each bucket, and **concatenate** to finish.

- With **balanced buckets** and **$m = Θ(n)$**, runtime is **expected $O(n)$**.

- Robust performance requires **quantile-aware bucket boundaries**, **[[cs/systems/memory-hierarchy-and-caching|cache-friendly layout]]**, and a **sensible in-bucket sorter**.

---

## Related Notes

- [[cs/dsa/counting-sort|Counting Sort]]

- [[cs/dsa/radix-sort|Radix Sort]]

- [[cs/dsa/quick-sort|Quick Sort]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]

## Sources

- Bucket sort, Wikipedia. https://en.wikipedia.org/wiki/Bucket_sort . Backs the distribute-sort-concatenate structure and the complexity table line by line: the total is `O(n + n²/k + k)`, so with `k = Θ(n)` "bucket sort runs in `O(n)` average time, given a uniformly distributed input"; the concatenation step alone costs `O(k)`; and in the worst case, when clustering puts everything in one bucket, "the overall performance would then be dominated by the algorithm used to sort each bucket, for example `O(n²)` insertion sort or `O(n log n)` comparison sort algorithms, such as merge sort". It also backs quantile or CDF-derived cut points ("if the input distribution is known or can be estimated, buckets can often be chosen which contain constant density rather than merely having constant size, which allows `O(n)` average time complexity even without uniformly distributed input"), the upper-bound rounding hazard (the reference pseudocode indexes with `floor(k × array[i] / M)` where `M` is one more than the maximum key, precisely so the index cannot reach k), the "stability depends" claim (the in-bucket sorter `nextSort` is a free parameter, conventionally insertion sort but possibly selection sort, which is unstable), the relation to counting sort ("if each bucket has size 1 then bucket sort degenerates to counting sort"), and the relation to quicksort ("bucket sort with two buckets is effectively a version of quicksort where the pivot value is always selected to be the middle value of the value range").
- Sorting in linear time (CLRS 8.2, 8.3), Laura Toma, CS 231, Bowdoin College. https://tildesites.bowdoin.edu/~ltoma/teaching/cs231/2018spring/Lectures/linsort.pdf . Backs the `O(n + m)` distribution-plus-traversal cost with the bucket-per-range pseudocode and its `O(n + N)` time and `O(N + n)` space analysis, and the condition under which the linear behavior is real: bucket sort runs in `O(n)` only when the number of buckets is `O(n)`.
- Comparison sort, Wikipedia. https://en.wikipedia.org/wiki/Comparison_sort . Backs the scope of the `Ω(n log n)` bound this note sets aside: it is derived from a decision tree that must have at least `n!` leaves, so it constrains algorithms whose decisions come only from comparisons. Note the Bucket sort article adds a caveat worth keeping in mind, that bucket sort "can be implemented with comparisons and therefore can also be considered a comparison sort algorithm"; what escapes the bound is the arithmetic value-to-bucket mapping, and the escape is to expected time under a distributional assumption, not to a better worst case.
- Counting sort, Wikipedia. https://en.wikipedia.org/wiki/Counting_sort . Backs this note's comparison-table row for counting sort: `O(n + k)` time and space for a bounded integer key range, stable, and not a comparison sort.
- Radix sort, Wikipedia. https://en.wikipedia.org/wiki/Radix_sort . Backs the comparison-table row for radix sort: `Θ(d(n + k))` running time with d digit passes each over a range of k values, LSD variants generally stable, non-comparative.
- Quicksort, Wikipedia. https://en.wikipedia.org/wiki/Quicksort . Backs the comparison-table row for quick sort: `O(n log n)` average, `O(n²)` worst case, in-place unstable partitioning, and better cache behavior than the alternatives on RAM-based arrays.
