---
title: Radix Sort
description: Sort fixed-width keys by processing digits from least or most significant using a stable subroutine; linear-time in key length.
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

**Radix sort** orders keys by examining their **digits** (or fixed-size **radices**) from either the **Least Significant Digit (LSD)** upward or the **Most Significant Digit (MSD)** downward. Each pass uses a **stable** subroutine - commonly [[cs/dsa/counting-sort|Counting Sort]] - to bucket and concatenate elements based on the current digit. For **fixed-width keys** (e.g., 32-bit integers, 128-bit UUIDs, fixed-length strings/bytes), radix achieves near-linear time, typically `Θ(n · d + b)` where `n` is the number of elements, `d` the number of digit passes, and `b` the radix (alphabet) size per pass.

Key strengths:

- **Data-independent runtime** (no comparisons) and predictable throughput.

- **Excellent for integers and fixed-length byte strings**; widely used in systems pipelines and indexing.

Key constraints:

- Requires **known digit structure** and benefits from **fixed widths**; extra care for **negatives**, **variable lengths**, or **locale/collation**.

> [!note]
> Radix sort is non-comparative; it can beat the `Ω(n log n)` lower bound that applies to **comparison** sorts like [[cs/dsa/merge-sort|Merge Sort]] or [[cs/dsa/quick-sort|Quick Sort]].

## Core Idea

Represent each key `K` as a sequence of `d` digits in base `b`:
`K = (k_{d-1}, k_{d-2}, …, k_1, k_0)`, with `k_i ∈ {0, …, b−1}`.

Two organizing strategies:

- **LSD radix**: perform stable passes from `k_0` (least significant) to `k_{d-1}`; final order is sorted.

- **MSD radix**: **partition** by `k_{d-1}` first, then recursively sort each bucket by the next digit; mirrors a trie on key prefixes.

Choosing **LSD or MSD** depends on key distribution, variable lengths, and memory behavior.

## Algorithm Steps / Pseudocode

Below, `DIGIT(x, i, b)` extracts digit `i` (0 = least significant) in base `b`.

### LSD Radix Sort (array of fixed-width integers)

```pseudo
function RADIX_LSD(A, d, b):
    // A: array of keys; d: digit count; b: radix per digit (e.g., 256)
    B = new array |A|            // output buffer (same size)
    C = new array b of 0         // counts / prefix sums
    for i in 0..d-1:             // process LSD → MSD
        // 1) Count
        fill(C, 0)
        for x in A:
            C[DIGIT(x, i, b)] += 1
        // 2) Prefix sums
        sum = 0
        for r in 0..b-1:
            tmp = C[r]
            C[r] = sum
            sum += tmp
        // 3) Stable scatter into B
        for x in A:
            r = DIGIT(x, i, b)
            B[C[r]] = x
            C[r] += 1
        // 4) Swap roles (B becomes current array)
        swap(A, B)
    return A
```

### MSD Radix Sort (byte strings; handles variable prefix structure)

```pseudo
function RADIX_MSD(A, l, r, i, b):
    if r - l <= SMALL:           // cutoff to insertion sort
        INSERTION_SORT_BY_DIGIT(A, l, r, i)
        return
    // Partition by digit i into b buckets using stable counting
    B = new array (r-l+1)
    C = new array b of 0
    for k in l..r:
        d = DIGIT_OR_SENTINEL(A[k], i, b)   // see notes on variable length
        C[d] += 1
    // prefix sums to positions
    pos = exclusive_prefix_sum(C)
    for k in l..r:
        d = DIGIT_OR_SENTINEL(A[k], i, b)
        B[pos[d]] = A[k]
        pos[d] += 1
    // copy back
    for t in 0..(r-l):
        A[l + t] = B[t]
    // recursively sort each bucket (skip terminal/sentinel bucket)
    start = l
    for rdx in 0..b-1:
        cnt = C[rdx]
        if cnt > 1 and rdx != SENTINEL:
            RADIX_MSD(A, start, start + cnt - 1, i + 1, b)
        start += cnt
```

> [!tip]
> **LSD** is usually simpler and more cache-friendly for fixed-width integers. **MSD** shines for **strings** (common prefixes) and when you want to short-circuit recursion once buckets become small or uniform.

## Example or Trace

Consider 8-bit base-10 numbers and **LSD** radix with `b=10` and `d=3` for `[329, 457, 657, 839, 436, 720, 355, 66]`.

1. **On ones** (`k_0`): stable bucket/concat by last digit → …

2. **On tens** (`k_1`): stable process preserves ones-order within each tens-bucket → …

3. **On hundreds** (`k_2`): final array is sorted.

For **MSD** on fixed-length ASCII strings with `b=256`, the first pass groups by the first byte; each group recurses on the next byte. If a bucket's range is size 1 (or all equal), recursion halts early.

## Complexity Analysis

Let `n` items, radix `b`, `d` digit passes (e.g., for w-bit integers with `k` bits per digit, `d=⌈w/k⌉`, `b=2^k`):

- **Time:** `Θ(n · d + b · d)` for counting-based passes; the `b · d` term builds prefix sums (often negligible for moderate `b`).

- **Space:** One **auxiliary array** `B` of size `n` plus a **count array** `C` of size `b`. MSD variants may allocate temporary buffers per recursion level but reuse a shared workspace.

Comparisons with comparison-based sorts:

- For fixed-width 32-bit integers (`w=32`) and `k=8` (so `d=4`, `b=256`), radix runs in `~4n` bucket writes, typically outperforming `n log n` sorts for large `n`.

- When keys are very short (e.g., 16 bits), radix is particularly fast. When keys are long or variable, MSD with early termination can still be efficient.

> [!note]
> The asymptotic lower bound `Ω(n log n)` doesn't apply because radix doesn't rely on comparisons; it's a **distribution** sort.

## Optimizations or Variants

### Base and digit width

- **Power-of-two bases (`b=2^k`)**: digit extraction is fast via masking and shifting; `k=8` (bytes) is a sweet spot on modern CPUs (cache-friendly, `C` fits L1/L2).

- **Larger `k`** reduces the number of passes `d` but inflates `C` and can hurt [[cs/systems/memory-hierarchy-and-caching|cache locality]]; prefer `k` so that `b*sizeof(count)` fits comfortably in cache (e.g., `b=256` or `b=4096`).

### Stability and stable subroutine

- Every LSD pass must be **stable**. Counting sort is the standard choice: `count → prefix → stable scatter`.

- For MSD, each partition step must keep **relative order** within buckets if later levels depend on it (or simply rewrite contiguous segments per bucket).

### Handling negatives (integers)

- **Two-bucket trick for signed integers** with LSD: treat the sign bit as the **final pass** and **rotate** negatives ahead of non-negatives, or run all passes unsigned and then **stable rotate** the final array so that negative keys come before non-negative (with two's-complement order preserved if you process bytes MSB last).

- Alternatively for MSD: process the **sign-most-significant** group first with custom ordering: "negative group" precedes "non-negative group".

### Variable-length strings

- **MSD with sentinel**: define `DIGIT_OR_SENTINEL(s, i, b)` to return a **sentinel** value for positions beyond the string end (e.g., 0) and map real bytes to `1..b`. Reserve the sentinel bucket as **terminal** (no deeper recursion).

- **LSD on strings** works only if all strings are **padded** to the same length with a padding byte ordered **before** all real characters (and you know max length).

### Cutoffs and hybrids

- **Insertion sort cutoff** for small subarrays in MSD recursion improves constants.

- **In-place radix** variants exist but are complex; the classic two-buffer approach is simpler and fast in practice.

### Parallelism

- Each pass builds counts which can be **parallel reduced**, and buckets can be **scattered** with prefix sums per thread and offset correction. MSD recursion can be parallelized per bucket.

> [!tip]
> On large datasets, prefer **byte-wise (`k=8`) LSD** with a **single reusable output buffer** and **streaming-friendly** memory access. It tends to be both simple and fast.

## Applications

- **Indexing and databases**: sorting fixed-size keys (IDs, timestamps).

- **Systems pipelines**: log/session sorting by fixed-width fields.

- **String processing**: lexicographic order for fixed-length codes, or MSD for variable-length [[cs/languages/common/text-encoding-and-unicode|ASCII/UTF-8]] (byte-wise with sentinel).

- **Graphics/GPU**: key-value sorts (e.g., Morton codes) using byte-wise radix with parallel prefix-sum.

Radix complements and often feeds:

- [[cs/dsa/counting-sort|Counting Sort]] as the per-pass stable routine.

- [[cs/dsa/bucket-sort|Bucket Sort]] when distribution is known and continuous.

- [[cs/dsa/heapsort|Heapsort]]/[[cs/dsa/merge-sort|Merge Sort]] when keys are comparison-only or need stability with arbitrary comparators.

## Common Pitfalls or Edge Cases

> [!warning]
> **Unstable passes break correctness (LSD).** If a single pass isn't stable, earlier digit ordering is destroyed and the final result may be incorrect.

> [!warning]
> **Base too large for cache.** Oversized `C` (e.g., `b=2^16`) thrashes caches and slows down despite fewer passes. Align `b` to cache capacity.

> [!warning]
> **Negatives mishandled.** Treat signedness consistently. A naive unsigned interpretation can place negatives after positives incorrectly.

> [!warning]
> **Variable-length strings in LSD.** Padding with the wrong sentinel (or inconsistent padding) breaks lexicographic order. Either use **MSD** with a sentinel bucket or pad with a byte ordered strictly less than all valid characters.

> [!warning]
> **Stable scatter order.** In counting sort, use **exclusive prefix sums** and **forward** scatter for stability (or inclusive sums with **reverse** scatter). Mixing these silently destabilizes.

## Implementation Notes or Trade-offs

- **Buffers**: Reuse one output buffer `B` across passes to avoid repeated allocations. Swap roles `A ↔ B` each pass.

- **Counting array layout**: Keep `C` aligned and in a separate cache line from hot data to avoid [[cs/systems/cache-coherence|false sharing]] when parallelized.

- **Digit extraction**: For integers, `DIGIT(x,i,2^k) = (x >> (k·i)) & ((1<<k)−1)`. For bytes, read directly. For endianness concerns, define digits consistently (LSD = least significant byte first).

- **Key-value pairs**: Carry the **payload** alongside the key during stable scatter; keep structs compact to maximize memory bandwidth.

- **Cutoffs**: For small arrays, fall back to [[cs/dsa/insertion-sort|Insertion Sort]] to reduce overhead.

## Summary

Radix sort organizes keys by **digits** and performs **stable bucket passes** to achieve **linear-time** behavior in key length. Use **LSD** for fixed-width integers and byte sequences (simple, cache-friendly), and **MSD** for strings or when early termination on shared prefixes saves work. Choose a **base** that fits cache (often `b=256`), ensure **stability**, handle **signedness** and **variable lengths** carefully, and reuse buffers for speed. With these choices, radix is a robust, high-throughput default for fixed-structure keys.

## Related Notes

- [[cs/dsa/counting-sort|Counting Sort]]

- [[cs/dsa/bucket-sort|Bucket Sort]]

- [[cs/dsa/heapsort|Heapsort]]

- [[cs/dsa/insertion-sort|Insertion Sort]]
