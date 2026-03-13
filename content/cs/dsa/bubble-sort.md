---
title: Bubble Sort — Adjacent Swaps and Stability
description: Elementary comparison-based sort using repeated passes and adjacent swaps; simple, stable, but inefficient for large arrays.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-03
aliases: []
---

## Overview
**Bubble Sort** is a simple **comparison-based sorting algorithm** that repeatedly **swaps adjacent elements** if they are out of order.
After each full pass, the **largest unsorted element "bubbles up"** to its correct position at the end of the array.

> [!note]
> Though rarely used in practice, Bubble Sort's clarity and traceability make it a common **teaching algorithm** for introducing sorting, comparison models, and asymptotic reasoning.

---

## Intuition

Imagine **bubbles rising through water**: heavier (larger) elements move upward one position at a time until they reach the surface (the sorted region).

Each pass over the array:
- Compares every adjacent pair `(A[i], A[i+1])`
- Swaps if they're out of order
- Reduces the unsorted portion by one

---

## Pseudocode

```pseudo
function bubbleSort(A):
    n = length(A)
    for i = 0 to n-1:
        swapped = false
        for j = 0 to n-i-2:
            if A[j] > A[j+1]:
                swap(A[j], A[j+1])
                swapped = true
        if not swapped:
            break
````

### Key Details

- The **inner loop** scans unsorted elements and performs adjacent swaps.

- The **outer loop** runs until the array is sorted or no swaps occur (optimization).

- After each pass `i`, the last `i` elements are in their correct positions.

---

## Dry Run Example

Input: `[5, 2, 9, 1, 5, 6]`

|Pass|Array State|Swaps|Largest Element Fixed|
|---|---|---|---|
|1|`[2, 5, 1, 5, 6, 9]`|✓|9|
|2|`[2, 1, 5, 5, 6, 9]`|✓|6|
|3|`[1, 2, 5, 5, 6, 9]`|✓|5|
|4|`[1, 2, 5, 5, 6, 9]`|✗ (early exit)|—|

---

## Time Complexity

|Case|Condition|Comparisons|Swaps|Complexity|
|---|---|---|---|---|
|**Best**|Already sorted|~n|0|**O(n)** (with early exit)|
|**Average**|Random order|≈ n²/2|≈ n²/4|**O(n²)**|
|**Worst**|Reverse order|≈ n²/2|≈ n²/2|**O(n²)**|

**Space:** `O(1)` (in-place)
**Stability:** Yes (equal elements maintain order)

> [!tip]
> Bubble Sort's only redeeming property is **stability** and **simplicity** — ideal for visual or educational contexts but poor for large datasets.

---

## Optimizations

1. **Early Exit:** Stop if no swaps occur in a full pass.

2. **Reduced Range:** After each pass, ignore the sorted suffix.

3. **Bidirectional Bubble Sort (Cocktail Shaker):**

    - Sweep forward to bubble up the largest,

    - Sweep backward to bubble down the smallest.

    - Useful for nearly sorted arrays.

---

## Common Pitfalls

> [!warning]
> **Forgetting the swapped flag:** Without it, the algorithm always performs `n` passes, even on sorted input (O(n²) every time).

> [!warning]
> **Off-by-one errors:**
> The inner loop should stop at `n - i - 2`, not `n - i - 1`, since you compare `A[j]` with `A[j+1]`.

> [!warning]
> **Misplaced early break:**
> Breaking before completing a pass misses potential swaps in the tail region.

---

## Use Cases

- Teaching basic sorting and **in-place algorithm design**

- Introducing **asymptotic notation** and algorithm analysis

- Demonstrating **stability** and **adjacent exchange sorting**

---

## Comparison to Other Elementary Sorts

| Algorithm          | Best  | Average | Worst | Stable | In-place |
| ------------------ | ----- | ------- | ----- | ------ | -------- |
| **Bubble Sort**    | O(n)  | O(n²)   | O(n²) | ✅      | ✅        |
| **Selection Sort** | O(n²) | O(n²)   | O(n²) | ❌      | ✅        |
| **Insertion Sort** | O(n)  | O(n²)   | O(n²) | ✅      | ✅        |

> [!note]
> Insertion Sort generally outperforms Bubble Sort on nearly sorted data because it makes fewer swaps and shifts.

---

## Summary

- **Bubble Sort** iteratively swaps adjacent out-of-order pairs.

- Early termination can reduce runtime to O(n) on sorted input.

- Despite its inefficiency, it illustrates **loop invariants**, **stability**, and **complexity growth** intuitively.

---

## See also

- [[insertion-sort|Insertion Sort]]

- [[selection-sort|Selection Sort]]

- [[algorithm-efficiency|Algorithm Efficiency]]

- [[asymptotic-notation|Asymptotic Notation]]

- [[time-complexity-analysis|Time Complexity Analysis]]
