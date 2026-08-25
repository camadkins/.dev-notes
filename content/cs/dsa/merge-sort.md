---
title: Merge Sort
description: Stable divide-and-conquer sorting; O(n log n) time with O(n) extra space and strong worst-case guarantees.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-24
aliases: []
---

## Overview

**Merge sort** sorts a sequence by **dividing** it into halves, **recursively sorting** each half, and **merging** the sorted halves into a single sorted sequence. Its hallmark properties:

- **Worst-case time:** `Θ(n log n)` regardless of input order.

- **Stability:** equal keys retain relative order with a stable merge.

- **Access pattern:** **sequential** scans with predictable memory behavior.

- **Space:** needs `Θ(n)` extra buffer (classic array version); linked-list variant works in `O(1)` extra.

These traits make merge sort the baseline for **robust performance**, **stable sorting**, and **external sorting** on data larger than memory.

## Core Idea

Split the array into two halves `A[L..M)` and `A[M..R)`. Recursively sort both halves. Merge them by scanning each half with a pointer and emitting the smaller element to a temporary buffer, then copy the merged run back to `A[L..R)`.

Stability is achieved by breaking ties in favor of the **left** half. The algorithm's total work is dominated by the merges: each level processes **all `n` elements**, and there are `⌈log₂ n⌉` levels.

## Algorithm Steps / Pseudocode

### Top-down recursive merge sort (array)

```pseudo
function MERGE_SORT(A):
    n = length(A)
    aux = new array of length n
    SORT_RANGE(A, aux, 0, n)          // sort A[0..n)

function SORT_RANGE(A, aux, L, R):     // half-open interval [L..R)
    if R - L <= 1:
        return
    M = L + (R - L) / 2
    SORT_RANGE(A, aux, L, M)
    SORT_RANGE(A, aux, M, R)
    MERGE(A, aux, L, M, R)

function MERGE(A, aux, L, M, R):
    i = L        // pointer in left half
    j = M        // pointer in right half
    k = L        // write pointer in aux
    while i < M and j < R:
        if A[i] <= A[j]:               // <= ensures stability
            aux[k] = A[i]; i = i + 1
        else:
            aux[k] = A[j]; j = j + 1
        k = k + 1
    while i < M:
        aux[k] = A[i]; i = i + 1; k = k + 1
    while j < R:
        aux[k] = A[j]; j = j + 1; k = k + 1
    for t in L..R-1:
        A[t] = aux[t]                  // copy back
```

### Bottom-up (iterative) merge sort (array)

Avoid recursion by merging runs of increasing width `w = 1, 2, 4, …`.

```pseudo
function MERGE_SORT_BOTTOM_UP(A):
    n = length(A)
    aux = new array of length n
    w = 1
    while w < n:
        for L in 0..n-1 step 2*w:
            M = min(L + w, n)
            R = min(L + 2*w, n)
            MERGE(A, aux, L, M, R)    // same MERGE as above
        swap(A, aux)                   // merged data now in A due to copy back;
        w = 2 * w
    // If an odd number of passes swapped arrays, ensure final result resides in A
    if aux currently holds sorted array:
        copy aux into A
```

### Linked-list merge sort (in-place)

Linked lists merge by rewiring `next` pointers; no auxiliary array is required.

```pseudo
function LIST_MERGE_SORT(head):
    if head == NIL or head.next == NIL:
        return head
    (a, b) = SPLIT_IN_HALF(head)      // tortoise & hare split
    a = LIST_MERGE_SORT(a)
    b = LIST_MERGE_SORT(b)
    return LIST_MERGE(a, b)

function LIST_MERGE(a, b):
    dummy = Node()
    tail = dummy
    while a != NIL and b != NIL:
        if a.key <= b.key:            // stable
            tail.next = a; a = a.next
        else:
            tail.next = b; b = b.next
        tail = tail.next
    tail.next = (a != NIL ? a : b)
    return dummy.next
```

## Example or Trace

Array `A = [7, 3, 5, 2, 2, 9]`.

- **Split chain:**
    `[7,3,5] | [2,2,9]` → `[7] [3,5] | [2] [2,9]` → `[7] [3] [5] | [2] [2] [9]`.

- **Merge up:**
    `[3,5]` from `[3]`+`[5]`; `[2,9]` from `[2]`+`[9]`;
    `[7,3,5]` → merge `[7]` and `[3,5]` → `[3,5,7]`;
    `[2,2,9]` already sorted;
    final merge `[3,5,7]` + `[2,2,9]` → `[2,2,3,5,7,9]`.

## Complexity Analysis

- **Time:** `Θ(n log n)` always. Each level merges all `n` items; depth is `⌈log₂ n⌉`.

    - **Top-down recursion:** cost dominated by merges.

    - **Bottom-up:** same asymptotics; constant factors can improve due to fewer branches and better locality.

- **Space:**

    - **Array version:** `Θ(n)` auxiliary buffer (can be reused across calls).

    - **Linked list version:** `O(1)` extra (pointer rewiring).

    - **In-place array merges** exist but are complex and increase constants.

- **Stability:** Yes, if the merge uses `<=` when comparing keys.

- **Adaptivity:** Classic merge sort is **not adaptive** to existing order, but natural merges (see below) can exploit **preexisting runs**.

## Optimizations or Variants

### Small-run optimization

Switch to **Insertion Sort** on tiny subarrays (e.g., length ≤ 16-32). Benefits: fewer function calls, better cache use, and insertion sort excels on small inputs.

### Natural merges (run detection)

Scan the array to detect already sorted **runs** (increasing or decreasing). Reverse decreasing runs, then iteratively merge adjacent runs until one remains. This adapts to partially sorted inputs.

### Bottom-up implementation details

- Avoid copying back by **ping-ponging** between two buffers each pass (swap roles of `A` and `aux`), then ensure the result ends in `A`.

- When the last block lacks a partner (`L+w ≥ n`), it can be **memcpy**'d over without merging.

### Key extraction and comparator cost

If comparisons are expensive (e.g., long strings), precompute **keys** (Schwartzian transform) or use **decorate-sort-undecorate** to cut repeated extraction. Stability ensures equal keys preserve input order.

### In-place stable merge (advanced)

Algorithms such as **galloping rotation merges** and **block merges** achieve `O(1)` extra space with stability. They are intricate; for production, consider **Timsort** - a stable, natural-merge sorter with galloping merges and run stacks.

### External merge sort (out-of-core)

Sort datasets larger than RAM:

1. **Run generation:** read chunks fitting RAM, sort each chunk (e.g., via in-RAM merge sort or quicksort), and write **runs** to [[cs/history/magnetic-disk-storage|disk]].

2. **k-way merge:** merge `k` runs at a time using a **min-heap** of the current heads.

3. Repeat until one run remains; choose `k` to balance disk I/O and memory.

### Parallel merge sort

- **Divide**: sort halves in parallel (task parallelism).

- **Merge**: partition the merge by binary searching pivot points so threads can merge disjoint segments. Requires careful memory coordination and NUMA awareness.

## Applications

- **Stable sorting by multiple keys:** sort by secondary key, then by primary; stability preserves the secondary order (or use tuples).

- **External sorting in databases and search engines:** sequential I/O and k-way merges suit disks and SSDs.

- **Merging logs/streams:** merging two or more sorted streams with a stable policy.

- **Foundation for Timsort:** production Python/Java sort implementations build on natural merges and galloping heuristics.

## Common Pitfalls or Edge Cases

> [!warning]
> **Incorrect merge indices.** Off-by-one errors at boundaries (`[L..M)` and `[M..R)`) are common. Use **half-open** intervals consistently.

> [!warning]
> **Stability broken by `<` vs `<=`.** To remain stable when keys tie, pick from the **left** half on equality (`<=`).

> [!warning]
> **Aux buffer reuse.** Allocating/freeing the buffer at every recursion is costly. Allocate **once** and pass it down.

> [!warning]
> **Copy-back mistakes.** Ensure the merged segment is written back to the correct positions. For large arrays, consider block copies and `memmove` for tails.

> [!warning]
> **Comparator side effects.** Comparators must be **strict weak orderings** (transitive, antisymmetric). Side effects during compare can lead to undefined behavior.

> [!warning]
> **Linked-list split bugs.** Use the **tortoise-hare** pattern to split lists in half; mishandling produces cycles or drops nodes.

## Implementation Notes or Trade-offs

- **Cache behavior:** Merge sort's sequential scans are [[cs/systems/memory-hierarchy-and-caching|cache-friendly]]. Bottom-up variants can outperform top-down due to fewer calls and better prefetching.

- **Memory footprint:** If memory is tight, consider **in-place** algorithms (e.g., heapsort) at the cost of **stability** and often larger constants.

- **Type stability:** For complex records, compare on a **key** rather than the whole structure to reduce copying. In merges, write out full records but compare keys only.

- **Galloping (exponential search) in merge:** When one side wins repeatedly, jump ahead with exponential search to reduce comparisons - used in Timsort for long **runs**.

## Summary

Merge sort guarantees **`Θ(n log n)`** time regardless of input, is **stable**, and favors **sequential memory access**. The classic array version needs `Θ(n)` extra space; the linked-list version sorts **in place** via pointer rewiring. Practical implementations favor **bottom-up passes**, **small-run insertion sort**, and **natural merges**. For disks or massive datasets, **external merge sort** is the method of choice. When you need predictable performance and stability, merge sort is the dependable workhorse.

## Related Notes

- [[cs/dsa/insertion-sort|Insertion Sort]]

- [[cs/dsa/quick-sort|Quick Sort]]

- [[cs/dsa/heapsort|Heapsort]]

- [[cs/dsa/divide-and-conquer|Divide and Conquer]]
