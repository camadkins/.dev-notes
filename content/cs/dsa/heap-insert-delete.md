---
title: Binary Heap Operations
description: Maintain the heap-order and shape properties via sift-up (insert) and sift-down (delete/extract); includes edge cases, duplicates, and key-update variants.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-20
aliases: []
---

## Overview

A **binary heap** (array-backed, complete tree) supports efficient **insert** and **delete/extract** by restoring **heap-order** locally while preserving the **shape**. The two fundamental primitives are:

- **Sift-up** (a.k.a. bubble-up/percolate-up): used after **insert** or **increaseKey** (max-heap) to move a too-large child upward until the parent is >= it.

- **Sift-down** (a.k.a. bubble-down/percolate-down): used after **extract** or **delete** or **decreaseKey** (max-heap) to push a too-small parent downward toward its proper place.


Both operations take **O(log n)** time, touching at most one node per level. See [[cs/dsa/heaps|Heaps - Overview]] for properties and [[cs/dsa/heapify|Heapify]] for O(n) bulk build.

## Structure Definition

We assume a **max-heap** and **0-based** array `A[0..n-1]`:

- `parent(i) = (i - 1) // 2` (for `i > 0`)

- `left(i) = 2*i + 1`

- `right(i) = 2*i + 2`

- **Heap-order:** `A[i] >= A[left(i)]` and `A[i] >= A[right(i)]` if children exist.
    (For a **min-heap**, reverse the comparisons.)


Leaves live at indices `floor(n/2) .. n-1`. The **last internal node** is `floor(n/2) - 1`.

> [!tip]
> Use the **pull-up** pattern to reduce swaps: carry a temporary `x` and move larger children upward until the right spot for `x` is found; then assign once.

## Core Operations

### Sift-up (max-heap)

```pseudo
function SIFT_UP(A, i):
    x = A[i]
    while i > 0:
        p = (i - 1) // 2
        if A[p] >= x: break
        A[i] = A[p]        // pull parent down
        i = p
    A[i] = x
```

### Sift-down (max-heap)

```pseudo
function SIFT_DOWN(A, n, i):    // n = current heap size (exclusive)
    x = A[i]
    while true:
        L = 2*i + 1
        R = 2*i + 2
        if L >= n: break        // no children
        c = L
        if R < n and A[R] > A[L]:
            c = R               // choose larger child
        if A[c] <= x: break     // already in place
        A[i] = A[c]             // pull child up
        i = c
    A[i] = x
```

### Insert (push)

Append the new key at `A[n]`, increment size, then **sift-up** from that index.

```pseudo
function INSERT(A, n, key):     // returns new size
    A[n] = key
    SIFT_UP(A, n)
    return n + 1
```

### ExtractMax (pop)

Swap the root with the last element, decrement size, then **sift-down** from the root.

```pseudo
function EXTRACT_MAX(A, n):     // returns (max_value, new_size)
    maxv = A[0]
    A[0] = A[n-1]
    n = n - 1
    if n > 0:
        SIFT_DOWN(A, n, 0)
    return (maxv, n)
```

### Delete at index `i`

Replace `A[i]` with the last element, shrink, then **sift-up or sift-down** depending on the new value's relation to its parent/children.

```pseudo
function DELETE_AT(A, n, i):    // returns new size
    if i == n-1: return n-1
    moved = A[n-1]
    A[i] = moved
    n = n - 1
    p = (i - 1) // 2
    if i > 0 and A[p] < A[i]:
        SIFT_UP(A, i)
    else:
        SIFT_DOWN(A, n, i)
    return n
```

> [!warning]
> If you store _handles_ to indices elsewhere (e.g., in a decrease-key workload), remember that `DELETE_AT` may move the last element into position `i`. Update that element's handle.

### Key updates (priority changes)

- **increaseKey(i, newKey)** on a max-heap: set `A[i]=newKey`, then **sift-up(i)**.

- **decreaseKey(i, newKey)** on a max-heap: set `A[i]=newKey`, then **sift-down(i)**.
    For a **min-heap**, swap the directions (increase -> sift-down, decrease -> sift-up).


## Example or Trace

Start with an empty max-heap. Insert the sequence `8, 3, 10, 1, 6, 14, 4, 7, 13`.

**After inserts (show key steps):**

1. Insert `8`: `[8]`.

2. Insert `3`: append -> sift-up (no swap) -> `[8,3]`.

3. Insert `10`: append -> sift-up: swap with `8` -> `[10,3,8]`.

4. Insert `1`: append -> parent `3` ok -> `[10,3,8,1]`.

5. Insert `6`: append -> parent `3` < `6` -> swap -> `[10,6,8,1,3]`.

6. Insert `14`: append -> sift-up past `10` -> `[14,6,10,1,3,8]`.

7. Insert `4`: `[14,6,10,1,3,8,4]` (no swaps).

8. Insert `7`: `[14,7,10,6,3,8,4,1]` (sift-up 7 past 6).

9. Insert `13`: append -> sift-up over `7`, then `14` stops -> `[14,13,10,7,3,8,4,1,6]`.


**Now `EXTRACT_MAX` twice:**

- Extract #1: swap root with last (6), shrink, sift-down from 0:
    `[13,7,10,6,3,8,4,1]` -> compare children (7,10) choose 13? Actually root=6: swap with `13`? Careful: after swap the array pre-sift is `[6,13,10,7,3,8,4,1]`. Sift-down: compare 13 and 10 -> move 13 up, then compare 7 and 3 vs `6` -> move 7 up, place `6`:
    Result: `[13,7,10,6,3,8,4,1]`.

- Extract #2: swap root with last (1), shrink, sift-down from 0:
    Pre-sift: `[1,7,10,6,3,8,4]` -> move 10 up, compare children of index 2 (8,4) -> move 8 up, place 1:
    Result: `[10,7,8,6,3,1,4]`.


## Complexity and Performance

- **Insert:** O(log n) due to at most one swap (or assignment) per level.

- **Extract/Delete root:** O(log n) via a single sift-down path.

- **Delete arbitrary index:** O(log n) by one sift-up or sift-down (never both when implemented as above).

- **Space:** O(1) auxiliary; array holds the heap.

- **Constants:** The **pull-up** variant reduces writes and branches, improving practical throughput.


## Implementation Notes or Trade-offs

- **Max vs Min heaps.** Swap comparison directions consistently; a single wrong comparator corrupts invariants.

- **Stability and duplicates.** Heaps are **not stable**. To break ties deterministically, store `(key, tie_id)` where `tie_id` increases over time.

- **Handles for decrease-key.** If external code needs `decreaseKey` by handle, store an index back-pointer inside the payload or keep a parallel map `handle -> index`, updating it after swaps.

- **[[cs/security/buffer-overflows|Bounds & off-by-one]].** Always guard child indices (`L < n`, `R < n`). The last internal node is `floor(n/2)-1`, not `floor(n/2)`.

- **Bulk construction.** Prefer [[cs/dsa/heapify|Heapify]] to build from an existing array in O(n) rather than `n` inserts (O(n log n)).


## Common Pitfalls or Edge Cases

> [!warning]
> **Using array length instead of heap size.** When the heap lives in a prefix of `A`, pass the **current heap size** `n` to `SIFT_DOWN`. Reading into the inactive suffix breaks correctness.

> [!warning]
> **Deleting without repair.** After replacing `A[i]` with the last element, you must choose **one** direction: if `A[i]` grew (greater than parent), **sift-up**; otherwise **sift-down**. Doing both wastes time and may overshoot.

> [!warning]
> **Mutating keys in place.** Changing `A[i]` without a follow-up **sift-up/down** silently violates the heap property.

> [!warning]
> **Incorrect tie-handling.** With equal keys, strict `>`/`<` vs `>=`/`<=` determines whether equal nodes move. Be consistent across all operations.

> [!warning]
> **Comparator inconsistencies.** Custom comparators must be a consistent strict weak order; otherwise the heap can oscillate or loop.

## Applications

- **Priority queues:** task dispatchers, [[cs/systems/process-scheduling-algorithms|schedulers]], event loops.

- **Graph algorithms:** pick the next smallest tentative distance in [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]].

- **Top-k / streaming:** maintain a size-`k` heap and compare new items to the root.

- **Heapsort:** build once, then repeatedly extract to grow a sorted suffix (see [[cs/dsa/heapsort|Heapsort]]).


## Summary

Binary heap updates hinge on two local repairs: **sift-up** and **sift-down**. With a complete-tree array layout, inserts append and move up; deletes/extracts swap with the last element and move down. Each operation visits `O(log n)` nodes, uses `O(1)` extra space, and - when implemented with pull-up and careful bounds - delivers fast, predictable priority-queue performance.

## Related Notes

- [[cs/dsa/binary-heap|Binary Heap]]

- [[cs/dsa/heapify|Heapify]]

- [[cs/dsa/heaps|Heaps - Overview]]

- [[cs/dsa/heapsort|Heapsort]]
