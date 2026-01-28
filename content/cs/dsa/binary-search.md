---
title: Binary Search — Divide and Conquer on Sorted Sequences
description: Efficient search in sorted arrays using interval halving and loop invariants to guarantee correctness and logarithmic time complexity.
draft: false
updated: 2025-10-29
aliases:
- binary-search-algorithm
- binarysearch
- binary_search
tags:
- cs
- dsa
date: 2025-10-16
---

## Definition

**Binary Search** is a fundamental **divide-and-conquer** algorithm used to efficiently find elements in a **sorted sequence**.
It repeatedly halves the search space until the target value is found or the search interval becomes empty.

> [!note]
> Binary search provides **O(log n)** lookup time on sorted arrays, making it a cornerstone of algorithms involving sorted data, monotonic predicates, or search bounds.

---

## Strategy

Binary search maintains a shrinking **candidate interval** and uses a consistent boundary convention (`[lo, hi)` or `[lo, hi]`) to guarantee progress and correctness.

Given a sorted array `A[0 … n−1]`, we maintain a search interval `[lo, hi)` (half-open) or `[lo, hi]` (closed).
At each step:

1. Compute midpoint `mid`.

2. Compare `A[mid]` with the target value.

3. Shrink the interval toward the half that could contain the value.


---

## Template

### Pseudocode (Half-Open Interval)

```pseudo
function binarySearch(A, target):
    lo = 0
    hi = length(A)
    while lo < hi:
        mid = lo + (hi - lo) // 2    // overflow-safe midpoint
        if A[mid] == target:
            return mid
        else if A[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return -1  // not found
```

---

## Correctness & Invariants

Binary search correctness depends on **loop invariants** — properties that hold before and after each iteration.

### Invariant (Half-Open Form `[lo, hi)`)

- `A[i] < target` for all `i < lo`

- `A[i] ≥ target` for all `i ≥ hi`


When the loop exits (`lo == hi`), these invariants guarantee:

- If target exists, `A[lo] == target`

- Otherwise, `lo` is the **insertion position**


> [!tip]
> Choosing between `[lo, hi)` and `[lo, hi]` forms is arbitrary — but consistency is crucial throughout all conditions and updates.

---

## Variants

### 1. Lower Bound

Find the **first index** `i` such that `A[i] ≥ target`.

```pseudo
function lowerBound(A, target):
    lo = 0
    hi = length(A)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if A[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

- Returns insertion point if `target` not found.

- Used in sorted containers like `std::lower_bound()` (C++ STL).


### 2. Upper Bound

Find the **first index** `i` such that `A[i] > target`.

```pseudo
function upperBound(A, target):
    lo = 0
    hi = length(A)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if A[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

> [!note]
> The difference between upper and lower bound is the **inequality direction**.

### 3. Monotone Predicate Search

Binary search extends beyond numeric arrays — it can find the first index satisfying any **monotonic condition**.

Example: _Find first bad version_ problem.

```pseudo
function firstTrue(predicate, n):
    lo = 0
    hi = n
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if predicate(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

Here, `predicate(i)` must be monotonic: `false, false, …, true, true, …`.

---

## Termination & Overflow Safety

Two common pitfalls in binary search implementations:

### 1. Overflow in Midpoint

Avoid `(lo + hi) // 2` — it can overflow when `lo` and `hi` are large.
Instead use:

```
mid = lo + (hi - lo) // 2
```

### 2. Infinite Loops

Improper interval updates can cause infinite loops, especially when using closed intervals `[lo, hi]`.
Always ensure the search space **strictly shrinks** each iteration.

|Interval|Loop condition|Updates (A[mid] < target)|Updates (A[mid] > target)|
|---|---|---|---|
|`[lo, hi)`|`lo < hi`|`lo = mid + 1`|`hi = mid`|
|`[lo, hi]`|`lo ≤ hi`|`lo = mid + 1`|`hi = mid - 1`|

---

## Complexity

|Metric|Cost|
|---|---|
|Time|O(log n)|
|Space|O(1)|
|Best Case|O(1) if target = A[mid] early|
|Worst Case|O(log n) with logarithmic halving of range|

---

## Pitfalls

> [!warning]
> **Off-by-one errors:** arise from mixing closed `[lo, hi]` and half-open `[lo, hi)` logic.

> [!warning]
> **Predicate direction inversion:** a reversed inequality may still "work" on small cases but fail near boundaries.

> [!tip]
> **Test small edge cases** like 1-element and 2-element arrays to confirm correctness before general use.

---

## Examples

### Example 1: Searching for 7 in `[1, 3, 5, 7, 9]`

|Iteration|lo|hi|mid|A[mid]|Decision|
|---|---|---|---|---|---|
|1|0|5|2|5|lo = 3|
|2|3|5|4|9|hi = 4|
|3|3|4|3|7|return 3|

### Example 2: Target not present (find 4)

|Iteration|lo|hi|mid|A[mid]|Decision|
|---|---|---|---|---|---|
|1|0|5|2|5|hi = 2|
|2|0|2|1|3|lo = 2|
|3|lo == hi == 2 → insertion point|||||

---

## Summary

- Binary search operates on **sorted data** in **O(log n)** time.

- Correctness relies on consistent **invariants** and interval boundaries.

- Variants: **lower_bound**, **upper_bound**, and **monotone predicate search**.

- Used in arrays, trees, and continuous binary searches (e.g., numeric optimization).


---

## See also

- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]

- [[cs/dsa/array-operations|Array Operations]]

- [[cs/dsa/bst|Binary Search Tree]]
