---
title: Sorting
description: Taxonomy of comparison vs counting-based methods with stability and in-place trade-offs for practical selection.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-23
aliases: []
---

## Overview

Sorting organizes elements into a **[[cs/math/relations-and-equivalence|total order]]** according to a comparator or natural key. Two major families dominate: **comparison-based** algorithms (operate via `<`/`>` decisions; lower bound `Ω(n log n)` in the worst case) and **counting-based** algorithms (exploit **key structure** such as bounded integer ranges or fixed-width digits to achieve near-linear time). Choosing the right algorithm depends on **data size**, **key properties**, **stability** needs, and **memory budget**.

> [!note]
> **Stability** preserves the relative order of equal keys. It matters when elements are **records** with secondary fields (e.g., sort by `lastName`, then a stable sort by `firstName` preserves last-name groups).

## Motivation

No single sorting algorithm is best for all contexts. Real systems often combine strategies (e.g., **introsort**: quicksort with heap fallback; mergesort with **insertion sort** for tiny runs). Understanding the landscape helps select an algorithm that matches **workload constraints** - throughput, latency, memory, and required stability.

## Definition and Formalism

Let array `A[0..n−1]` and strict weak ordering `<`. A sorting algorithm permutes `A` so that `A[i] ≤ A[i+1]` for all `i`. We classify sorts by:

- **Model**: comparison vs structured-key (counting/radix/bucket).

- **Complexity**: best/average/worst time, extra space.

- **Stability**: stable vs unstable.

- **In-placeness**: `O(1)` or small extra memory vs `Θ(n)` auxiliary buffers.

- **Adaptivity**: does it accelerate on partially sorted inputs?

## Example or Illustration

### Canonical algorithms at a glance

|Algorithm|Family|Stable|In-place|Avg Time|Worst Time|Extra Space|Notes|
|---|---|--:|--:|--:|--:|--:|---|
|[[cs/dsa/insertion-sort|Insertion Sort]]|Comparison|✓|✓|Θ(n²)|Θ(n²)|O(1)|
|[[cs/dsa/selection-sort|Selection Sort]]|Comparison|✗ (default)|✓|Θ(n²)|Θ(n²)|O(1)|
|[[cs/dsa/bubble-sort|Bubble Sort]]|Comparison|✓ (with stable swap)|✓|Θ(n²)|Θ(n²)|O(1)|
|[[cs/dsa/merge-sort|Merge Sort]]|Comparison|✓|✗ (array)|Θ(n log n)|Θ(n log n)|Θ(n)|
|[[cs/dsa/quick-sort|Quick Sort]]|Comparison|✗ (default)|✓|Θ(n log n)|Θ(n²)|O(log n) stack|
|[[cs/dsa/heapsort|Heapsort]]|Comparison|✗|✓|Θ(n log n)|Θ(n log n)|O(1)|
|[[cs/dsa/counting-sort|Counting Sort]]|Counting-based|✓|✗|Θ(n + k)|Θ(n + k)|Θ(n + k)|
|[[cs/dsa/radix-sort|Radix Sort]]|Counting-based|✓ (with stable pass)|✗|Θ(d·(n + b))|Θ(d·(n + b))|Θ(n + b)|
|[[cs/dsa/bucket-sort|Bucket Sort]]|Distribution|✓ (in-bucket stable)|✗/✓|Θ(n) expected|Θ(n²) worst|Θ(n + m)|

> [!tip]
> Hybrid engines (production compilers, stdlibs) often use **introsort** (quicksort + heap fallback) and cut over to **insertion sort** for small partitions. This keeps `n log n` worst-case and small constants.

## Properties and Relationships

### Comparison-based lower bound

Any algorithm that decides order solely via comparisons corresponds to a **decision tree** with at least `n!` leaves. Height is `Ω(log(n!)) = Ω(n log n)`. Hence **no comparison sort** can beat `Ω(n log n)` in the worst case.

### Stability and secondary keys

Stability lets you sort by **primary key** and then by **secondary key** without merging logic. If an algorithm is unstable but you need stability, either:

- Choose a **stable** variant (e.g., stable partitioning/merging), or

- **Decorate keys** with original indices to simulate stability (may increase memory and comparisons).

### In-place vs memory-heavy

- **In-place** sorts (quicksort, heapsort, insertion/selection) minimize extra memory.

- **Out-of-place** sorts (mergesort, counting/radix/bucket) use buffers or tables but may have stronger stability or throughput properties.

### Adaptivity

- **Insertion sort** is **adaptive**: nearly-sorted arrays run in near-`Θ(n)`.

- **TimSort** (practical stable sort for arrays of objects) identifies **runs** and merges them; excellent for real-world partially ordered data.

## Implementation or Practical Context

### Choosing a sort (fast checklist)

1. **Need stable order?**

    - Yes → prefer [[cs/dsa/merge-sort|Merge Sort]], TimSort-like, or counting/radix if key structure permits.

    - No → quicksort or heapsort; introsort for worst-case guard.

2. **Key structure known?**

    - Small integer range or fixed-width bytes → [[cs/dsa/counting-sort|Counting Sort]] / [[cs/dsa/radix-sort|Radix Sort]] / [[cs/dsa/bucket-sort|Bucket Sort]].

    - Arbitrary comparator → comparison family only.

3. **Memory tight?**

    - Yes → in-place (quicksort/heapsort/insertion).

    - No → mergesort or counting-based with auxiliary arrays/tables.

4. **Data size and presortedness**

    - Tiny or nearly sorted → insertion sort (or as a cutoff inside a hybrid).

    - Large, random → quicksort/introsort (avg fast) or heapsort (predictable).

    - Large with fixed-width integer keys → radix.

> [!note]
> Production "std::stable_sort" is typically **merge-based** (stable, `n log n`), while "std::sort" is often **introsort** (unstable, `n log n` worst-case, quick constants).

### Stability in practice

Stability affects:

- **Stable secondary sorts**: group by day, then time.

- **Stable grouping for UI**: preserving initial order within equal keys.
    If you only sort **primitives**, stability rarely matters.

### Handling duplicates and equal keys

- **Three-way partitioning** in quicksort reduces work with many duplicates (Bentley-McIlroy).

- Counting/radix naturally handle duplicates well due to **bucketing**.

### Numeric safety and performance

- Quicksort partition indices must avoid overflow (`mid = lo + (hi - lo)/2` in binary-search-like helpers).

- For expensive comparisons (strings), cache or **decorate** with extracted keys to reduce comparator cost.

### External and parallel sorting

- **External merge sort**: when data doesn't fit in RAM, sort chunks in memory, [[cs/history/magnetic-disk-storage|spill to disk]], then multiway-merge.

- **Parallel sorting**: parallel quicksort/merge; radix adapts well with parallel prefix sums. Consider **work vs span** and [[cs/systems/memory-hierarchy-and-caching|cache locality]].

### Partial sorts and top-k

- **Top-k smallest**: use a **max-heap of size k** (`Θ(n log k)`) or **quickselect** for expected linear time; then sort the k results with insertion or heapsort.

- **nth_element**-style partitioning: place the element that would be at rank `k` in sorted order and split around it.

- **Partial stable sort**: for UI lists, consider stable partial merges on visible windows.

## Common Misunderstandings

> [!warning]
> **"Radix beats `n log n` always."** Only when **keys have structure** (bounded width/base) and memory/cache are well tuned. For long variable strings or custom comparators, comparison sorts are appropriate.

> [!warning]
> **"In-place means zero extra space."** Many "in-place" algorithms still use `O(log n)` stack or small buffers. True constant-space stable sorting of arrays is nontrivial and often slower.

> [!warning]
> **"Mergesort is always better than quicksort."** Mergesort is stable and predictable but allocates; quicksort often wins on in-memory primitive arrays due to cache behavior - unless degenerate pivots trigger worst-case (mitigated by randomization/introsort).

> [!warning]
> **Ignoring key extraction cost.** Sorting complex objects can be dominated by comparator overhead; **Schwartzian transforms** (decorate-sort-undecorate) can help.

## Examples to Add

- **Partial sorts**: show a `top-k` via heap vs quickselect on an example array.

- **Stable multi-key sort**: sort records by `dept` (stable), then by `salary`.

## Summary

Sorting spans two worlds. **Comparison sorts** are general-purpose with a hard `Ω(n log n)` floor but strong flexibility and stable/unstable options. **Counting-based** methods trade generality for speed by exploiting **key structure**, often achieving near-`Θ(n)` time at the cost of additional memory and careful engineering. In practice, hybrids (introsort, TimSort) and **cutoffs to insertion sort** deliver robust performance. Choose by **stability needs**, **key structure**, **memory budget**, and **data shape**; deploy partial/selection techniques when full sorting is unnecessary.

## Related Notes

- [[cs/dsa/merge-sort|Merge Sort]]

- [[cs/dsa/quick-sort|Quick Sort]]

- [[cs/dsa/counting-sort|Counting Sort]]

- [[cs/dsa/radix-sort|Radix Sort]]
