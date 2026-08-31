---
title: Bubble Sort
description: Elementary comparison-based sort using repeated passes and adjacent swaps; simple, stable, but inefficient for large arrays.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-03
aliases: []
---

## Overview
**Bubble Sort** is a simple **[[cs/languages/Cpp/stl-algorithms|comparison-based sorting algorithm]]** that repeatedly **swaps adjacent elements** if they are out of order.
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
|4|`[1, 2, 5, 5, 6, 9]`|✗ (early exit)| - |

---

## Time Complexity

|Case|Condition|Comparisons|Swaps|Complexity|
|---|---|---|---|---|
|**Best**|Already sorted|~n|0|**O(n)** (with early exit)|
|**Average**|Random order|≈ n²/2|≈ n²/4|**O(n²)**|
|**Worst**|Reverse order|≈ n²/2|≈ n²/2|**O(n²)**|

**Space:** `O(1)` (in-place)
**Stability:** Yes ([[cs/math/relations-and-equivalence|equal elements maintain order]])

> [!tip]
> Bubble Sort's only redeeming property is **stability** and **simplicity** - ideal for visual or educational contexts but poor for large datasets.

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

- Despite its inefficiency, it illustrates **[[cs/dsa/loop-invariant|loop invariants]]**, **stability**, and **complexity growth** intuitively.

---

## Related Notes

- [[cs/dsa/insertion-sort|Insertion Sort]]

- [[cs/dsa/selection-sort|Selection Sort]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]

- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]

- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]

## Sources

- Bubble sort, Wikipedia. https://en.wikipedia.org/wiki/Bubble_sort . Backs the algorithm as repeated passes that compare each element with the one after it and swap if needed, the naming ("named for the way the larger elements bubble up to the top of the list"), the `swapped` flag repeating until no swaps occur in a pass, the reduced-range optimization ("the n-th pass finds the n-th largest element and puts it into its final place, so the inner loop can avoid looking at the last n-1 items"), the complexity row this note's table uses (worst and average `O(n²)` comparisons and swaps, best `O(n)` comparisons and `O(1)` swaps, `O(1)` auxiliary space), the explicit statement "Bubble sort is a stable sort algorithm, like insertion sort", that insertion sort is usually considerably more efficient among the simple `O(n²)` sorts, and that bubble sort performs poorly in practice and is used primarily as an educational tool.
- CSci 335 Chapter 7: Sorting, Prof. Stewart Weiss, Hunter College CUNY. https://www.cs.hunter.cuny.edu/~sweiss/course_materials/csci335/lecture_notes/chapter07.pdf . Backs the average swap count of roughly `n²/4`: an exchange of adjacent elements removes exactly one inversion, so m inversions require m swaps, and Theorem 1 proves the average number of inversions in an array of n distinct elements is `n(n-1)/4`. The worst case, a reverse-sorted array, carries all `n(n-1)/2` inversions, which is the `≈ n²/2` swap figure in the table.
- Cocktail shaker sort, Wikipedia. https://en.wikipedia.org/wiki/Cocktail_shaker_sort . Backs the bidirectional variant: it extends bubble sort by operating in two directions, the rightward pass shifting the largest element to the end and the leftward pass shifting the smallest to the beginning, which is what makes it better than plain bubble sort at moving elements toward the front of the list.
- Sorting algorithm, Wikipedia. https://en.wikipedia.org/wiki/Sorting_algorithm . Backs the comparison table's other two rows (insertion sort best `n`, average and worst `n²`, `O(1)` memory, stable; selection sort `n²` in all cases, `O(1)` memory, not stable), the observation that insertion sort is faster than the other elementary sorts in practice due to fewer comparisons and good performance on almost-sorted data, and that bubble sort and its variants are rarely used in practice but are commonly found in teaching.
