---
title: Linear Search
description: Sequentially scan an array or list for a target with early exit; optional sentinel removes a bounds check.
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

**Linear search** scans a sequence from left to right, comparing each element with a **target** value and stopping as soon as a match is found (or the end is reached). It requires **no ordering** and works for arrays, vectors, and linked lists. Although worst-case time is `Θ(n)`, linear search is the **right default** for small ranges, unknown distributions, or when elements arrive as a **stream**.

## Core Idea

Maintain an index (or pointer) `i` that advances through the sequence, checking `A[i] == x`. The algorithm **short-circuits** on success and reports **not found** only after examining all elements. For continuous blocks in memory, comparisons and increments are cheap and predictably branchy; for linked lists, follow `next` pointers instead of indices.

## Algorithm Steps / Pseudocode

### Basic linear search (first occurrence)

```pseudo
// Return the first index i with A[i] == x; else return NOT_FOUND (-1)
function LINEAR_SEARCH(A, x):
    n = length(A)
    for i in 0..n-1:
        if A[i] == x:
            return i
    return -1
```

### Variant: last occurrence

```pseudo
function LINEAR_SEARCH_LAST(A, x):
    n = length(A)
    last = -1
    for i in 0..n-1:
        if A[i] == x:
            last = i
    return last
```

### Variant: predicate-based search

```pseudo
// Find first i where pred(A[i]) is true
function FIND_IF(A, pred):
    n = length(A)
    for i in 0..n-1:
        if pred(A[i]):
            return i
    return -1
```

### Sentinel technique (array only)

The sentinel removes the inner `i < n` test by placing `x` at `A[n]` temporarily.

```pseudo
// Precondition: A has capacity at least n+1
function LINEAR_SEARCH_SENTINEL(A, n, x):
    last = A[n]            // save
    A[n] = x               // place sentinel
    i = 0
    while A[i] != x:
        i = i + 1
    A[n] = last            // restore
    if i < n: return i     // found inside original range
    else return -1         // match was the sentinel only
```

> [!tip]
> The **sentinel** turns two branch checks (`i<n` and `A[i]==x`) into one inside the loop, which can speed up tight scans. It requires an **extra slot** and careful restore.

### Linked list version (first occurrence)

```pseudo
function LIST_FIND(head, x):
    idx = 0
    curr = head
    while curr != NIL:
        if curr.value == x:
            return (curr, idx)
        curr = curr.next
        idx = idx + 1
    return (NIL, -1)
```

## Example or Trace

Array `A = [9, 4, 7, 2, 7, 5]`.

- Find first `7`:

    - Compare `9 != 7`, `4 != 7`, `7 == 7` → return `2`.

- Find last `7`:

    - Scan all indices and keep `last`; final answer `4`.

- Find first even: `FIND_IF(A, isEven)` → `A[1]=4` → return `1`.

## Complexity Analysis

- **Time:** Worst-case `Θ(n)` comparisons (target absent or at the end). Best-case `Θ(1)` (target at the first position). Average-case `Θ(n)` under uniform randomness with early exit halfway on average.

- **Space:** `O(1)` auxiliary for arrays; `O(1)` pointers for lists.

- **Stability:** Not applicable (search does not reorder elements).

- **Work model:** If comparisons are expensive (e.g., long strings), cost is dominated by the number of predicate evaluations; consider **short-circuiting** predicates and **key extraction**.

## Optimizations or Variants

- **Sentinel scan.** Removes a bounds check inside the loop (see above). Useful in performance-critical inner loops with arrays.

- **Block/batched checks.** Compare multiple elements per iteration (loop unrolling) to reduce branch mispredictions:

    ```pseudo
    for i in 0..n-4 step 4:
        if A[i]==x or A[i+1]==x or A[i+2]==x or A[i+3]==x: handle_match()
    // finish tail
    ```

- **SIMD (vectorized) search.** For primitive types, load 16-32 bytes at a time and compare in parallel; then find the first matching lane. [[cs/languages/Cpp/stl-algorithms|Library functions (e.g., memchr)]] do this.

- **Two-ended scan.** Check `A[l]` and `A[r]` in one loop to halve iterations on average when `x` is uniformly distributed:

    ```pseudo
    while l <= r:
        if A[l]==x: return l
        if A[r]==x: return r
        l = l + 1; r = r - 1
    return -1
    ```

- **First vs last occurrence.** Maintain `last` during scan for "last"; for "first", exit immediately.

- **Predicate/selector.** Search by computed **key** (e.g., `key(A[i]) == k`) to avoid recomputing keys for candidates you skip.

- **Streaming input.** When data arrives incrementally, scan as it comes; terminate when found, or continue accumulating until end-of-stream.

## Applications

- **Small ranges / base cases.** Hybrid algorithms often switch to linear search for tiny subarrays where constant factors dominate.

- **Unordered containers.** When there is no indexing or order (e.g., a simple dynamic array used as a bag), linear search is the only choice.

- **Validation and scanning.** Input validation, log scanning for markers, simple token detection.

- **Linked structures.** Adjacency lists, chains in separate chaining for [[cs/dsa/hash-tables|Hash Tables]].

## Common Pitfalls or Edge Cases

> [!warning]
> **Off-by-one errors.** Ensure the loop reaches index `n-1` and does not read `A[n]` unless using a sentinel deliberately.

> [!warning]
> **Missing early exit.** Forgetting to return immediately on match wastes time and can cause logic errors in "first occurrence" searches.

> [!warning]
> **Sentinel restore bug.** After placing the sentinel, always **restore** `A[n]` before returning; otherwise the array is corrupted.

> [!warning]
> **Equality vs comparator.** For objects, define equality appropriately (value vs reference). For floating-point, consider tolerance-based comparison.

> [!warning]
> **Linked list null checks.** Always guard `curr != NIL` before dereferencing `curr.value` or `curr.next`.

## Implementation Notes or Trade-offs

- **When to prefer binary search.** If the data is **sorted** and random access is cheap, prefer [[cs/dsa/binary-search|Binary Search]] for `O(log n)` time. Linear search can still win on **very small** arrays due to branch/predictor and cache effects.

- **Cache behavior.** Arrays provide sequential access that is [[cs/systems/memory-hierarchy-and-caching|cache-friendly]]; linked lists incur pointer chasing and poor locality.

- **Return conventions.** Standardize on `-1` for "not found" (arrays) or `(NIL, -1)` for lists. Exposing both index and pointer simplifies later updates.

- **Stable vs unstable.** Search does not reorder, so stability is irrelevant; if subsequent steps swap, document their stability, not the search's.

## Summary

Linear search scans sequentially, stops on the first hit, and costs `Θ(n)` in the worst case with **O(1)** extra space. It's the **default** for unsorted data, small ranges, and streaming inputs. Use the **sentinel** trick to streamline tight loops, unroll or vectorize for throughput on primitive arrays, and switch to order-aware methods (e.g., [[cs/dsa/binary-search|Binary Search]]) when data is sorted.

## Related Notes

- [[cs/dsa/binary-search|Binary Search]]

- [[cs/dsa/arrays|Arrays]]

- [[cs/dsa/searching|Searching]]

- [[cs/dsa/brute-force-search|Brute Force Search]] - the general paradigm this is the table-lookup case of

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
