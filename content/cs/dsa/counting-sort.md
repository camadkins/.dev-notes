---
title: Counting Sort  
description: Frequency array for small integer keys; stable variant builds prefix sums.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:
aliases: []
# diagrams:
# - counting-sort-flow.svg — Three-panel flow: (1) count frequencies, (2) prefix-sum to cumulative counts, (3) stable placement right-to-left into output.
# - prefix-sum-stability.svg — Visual trace showing how equal keys preserve relative order when placing from the end while decrementing counts.
# - range-vs-memory.svg — Plot/table relating key range (U), input size (n), and auxiliary array size; highlights when counting sort is practical.
# - counting-vs-radix-bucket.svg — Concept map linking counting sort as a subroutine in radix sort and as in-bucket sorter for small ranges.
---

## Overview

**Counting sort** sorts `n` items whose keys are integers in a **small known range** `0..U` by counting how many times each key occurs and using those counts to place items directly into their **final positions**. It runs in **$O(n + U)$** time and **$O(n + U)$** space, and its **stable** form enables it to serve as the digit sorter inside [[cs/dsa/radix-sort|Radix Sort]] and as an in-bucket sorter for [[cs/dsa/bucket-sort|Bucket Sort]].

## Core Idea

1. **Count** how many items have each key value `k` in `0..U` → array `C[0..U]`.
    
2. **Prefix-sum** `C` so that `C[k]` becomes the **1-past-last index** of key `k` in the output.
    
3. **Stable place** items into output array `B` by scanning the input **from right to left**: decrement `C[key(x)]` and write `x` into `B[C[key(x)] - 1]`.
    

> [!example]  
> **Diagram (`counting-sort-flow.svg`)** — Show a toy input, its frequency counts, the cumulative counts after prefix-sum, and a right-to-left placement into the output that yields a stable ordering.

## Algorithm Steps / Pseudocode

Assume keys are integers in `0..U`, and `A[0..n-1]` holds records (each with a key).

```pseudo
function COUNTING_SORT(A, U):            // stable variant
    n = length(A)
    C = array[0..U] filled with 0        // counts
    B = array[0..n-1]                    // output

    // 1) Count frequencies
    for j from 0 to n-1:
        k = key(A[j])
        C[k] = C[k] + 1

    // 2) Prefix sums: C[k] becomes 1-past-last index for key k
    total = 0
    for k from 0 to U:
        total = total + C[k]
        C[k] = total

    // 3) Stable placement: scan from right to left
    for j from n-1 downto 0:
        k = key(A[j])
        C[k] = C[k] - 1
        B[C[k]] = A[j]

    return B
```

> [!tip]  
> To **count only**, skip the prefix-sum and placement phases when you just need a histogram (e.g., for selecting quantile cut points before [[cs/dsa/bucket-sort|Bucket Sort]]).

## Example or Trace

Consider records with keys `A = [2, 5, 3, 0, 2, 3, 0, 3]`, with `U = 5`.

- **Count:** `C = [2, 0, 2, 3, 0, 1]`
    
- **Prefix-sum:** `C = [2, 2, 4, 7, 7, 8]` (`C[k]` = 1-past-last index for key `k`)
    
- **Stable placement (right-to-left):**
    
    - Read `3`: `C[3]→6`, place at `B[6]`
        
    - … continue …
        
    - Final `B = [0, 0, 2, 2, 3, 3, 3, 5]` (stable among equal keys)
        

> [!example]  
> **Diagram (`prefix-sum-stability.svg`)** — Two equal keys (e.g., `3a` then `3b`) keep their input order in the output because the rightmost one is placed last into the highest index reserved for `3`.

## Complexity Analysis

- **Time:** $O(n + U)$ (one pass to count, one pass to prefix-sum size `U+1`, one pass to place).
    
- **Space:** $O(n + U)$ (output array `B` plus counts `C`).
    
- **Stability:** Achieved by **right-to-left** placement while decrementing `C[k]`.
    
- **Not comparison-based:** Does not incur the $Ω(n \log n)$ lower bound; instead depends on `U`.
    

## Optimizations or Variants

- **In-place-ish variant:** When stability isn’t required and only keys are stored, you can overwrite `A` if you emit keys in ascending order based on `C`. (Unstable; usually not suitable for use in radix.)
    
- **Partial range:** If keys lie within `[a, b]`, offset by `a` and set `U = b - a`.
    
- **Sparse keys:** When `U` is large but only a small subset of keys actually appear, consider a **sparse map** for counts, then compress to a dense array for placement (trades off constant factors).
    
- **Byte/word specialization:** For small fixed-width keys (e.g., 8-bit), unroll loops and use vectorized prefix sums.
    
- **Parallel prefix:** Parallel counting by thread-local histograms + reduction; then parallel prefix-scan and scatter.
    

> [!example]  
> **Diagram (`counting-vs-radix-bucket.svg`)** — Place counting sort at the center, with arrows to: “digit pass in radix” and “in-bucket sort when bucket’s local range is small”; annotate stability requirements.

## Applications

- **Digit sorting** in [[cs/dsa/radix-sort|Radix Sort]] (must be **stable**).
    
- **Small-range numeric data** (e.g., grades `0..100`, byte values).
    
- **Histogram-based preprocessing** (bucketing/quantiles) before [[cs/dsa/bucket-sort|Bucket Sort]] or other range partitioning.
    

## Common Pitfalls or Edge Cases

> [!warning]  
> **Range too large.** If `U` is much larger than `n`, the `C` array dominates memory/time. Prefer [[cs/dsa/radix-sort|Radix Sort]] or a comparison sort.

> [!warning]  
> **Unknown or shifting range.** If `a..b` isn’t known, compute `min/max` first; outliers can balloon `U`. Consider clipping or mapping rare outliers to a separate bucket.

> [!warning]  
> **Unstable placement.** Scanning left-to-right during placement **breaks stability**; radix will fail if digit passes are unstable.

## Implementation Notes or Trade-offs

- **Records vs. keys:** If records are large, count by key but **scatter indices**; perform a final gather to move records once.
    
- **Prefix-sum semantics:** Using **1-past-last** indices simplifies placement; alternative “first index” conventions work if consistent.
    
- **Cache behavior:** Keep `C` small (fit in cache) by choosing an appropriate key encoding or chunking.
    
- **Memory bounds:** For bounded embedded systems, verify `U+1` counts fit in memory; otherwise chunk keys and merge.
    

## Summary

Counting sort achieves **$O(n + U)$** sorting by **counting frequencies**, computing **prefix sums**, and performing **stable placement**. It excels when the key range is **small and known**, and it is indispensable as the **stable digit pass** in [[cs/dsa/radix-sort|Radix Sort]] and as a **local sorter** for small integer ranges.

## See also

- [[cs/dsa/radix-sort|Radix Sort]]
    
- [[cs/dsa/bucket-sort|Bucket Sort]]
    
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]