---

title: Heaps - Overview
description: The heap-order and shape properties, array representation, and why heaps power fast priority queues, schedulers, and selection.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-11
aliases: []

---

## Overview

A **heap** is a tree-based structure that keeps the **highest-priority** (max-heap) or **lowest-priority** (min-heap) element at the **root**, enabling fast `extract` and `insert`. Heaps are defined by two independent properties:

1. **Heap-order property:** Every node compares appropriately with its children
    (max-heap: parent ≥ children; min-heap: parent ≤ children).

2. **Shape property:** The tree is **complete** - all levels filled except possibly the last, which is filled left to right.


These properties enable an efficient **array representation** with simple index arithmetic, constant extra space, and `O(log n)` updates. Heaps back priority queues, **schedulers**, **Dijkstra's algorithm** on dense-enough graphs, **median-of-stream** (with two heaps), and **top-k** selection. See also [[binary-heap|Binary Heap]] and the linear-time builder [[heapify|Heapify]].

## Motivation

Heaps shine when the **extreme element** matters repeatedly:

- **Priority queues:** process the next most/least important task in `O(log n)`.

- **Online scheduling:** pick the earliest-deadline job or highest priority at each step.

- **Graph algorithms:** choose the smallest tentative distance (e.g., [[dijkstras-algorithm|Dijkstra's Algorithm]]).

- **Selection:** maintain a min-heap of size `k` to track the **top-k** largest items in `O(n log k)`.

- **Heapsort:** get an in-place `O(n log n)` sort after a linear-time build-heap.


Heaps do **not** maintain full order like balanced BSTs - only the root has global extremal priority. If you must iterate items in order, a heap alone will perform `O(n log n)` extractions; if you need fast predecessor/successor queries, use a BST.

## Definition and Formalism

Let the underlying shape be a **complete binary tree** with nodes stored in an array `A[0..n-1]`:

- **Indexing (0-based):**
    `left(i) = 2i + 1`, `right(i) = 2i + 2`, `parent(i) = ⌊(i - 1)/2⌋` for `i > 0`.
    The **last internal node** is `⌊n/2⌋ − 1`.
    (For 1-based arrays: `left=2i`, `right=2i+1`, `parent=⌊i/2⌋`.)

- **Heap-order:**
    **Max-heap:** `A[i] ≥ A[left(i)]` and `A[i] ≥ A[right(i)]` if children exist.
    **Min-heap:** reverse the comparisons.


Because the shape is complete, the tree height is `⌊log₂ n⌋`, and updates visit at most one node per level, yielding `O(log n)` time for `insert` and `extract`.

> [!tip]
> Prefer **0-indexed** formulas in code: fewer off-by-one bugs, and `parent = (i-1)//2` memorizes easily.

## Example or Illustration

Consider `A = [12, 10, 8, 5, 1, 4, 3]` as a **max-heap**:

- `A[0]=12` is ≥ both children `A[1]=10`, `A[2]=8`.

- Level 2 also satisfies order: `10 ≥ {5,1}`, `8 ≥ {4,3}`.

- Because the shape is complete, array mapping is valid for every index.


If we `insert(15)`, we append at the end (`A[7]=15`), then **bubble up** (swap with parent while parent < 15) until heap-order holds, placing 15 at the root in `O(log n)`.
If we `extractMax()`, we return `A[0]=12`, move the last element to the root, and **sift down** (swap with the larger child while child > parent) to restore order - again `O(log n)`.

## Properties and Relationships

- **Order vs shape are independent.** You can have an ordered but non-complete tree, or a complete tree that violates order; heaps require **both**.

- **Partial order only.** Siblings aren't ordered: `A[1]` and `A[2]` can be in either order; only each parent vs its children is constrained.

- **Height and costs.** With height `h = Θ(log n)`, `insert`, `decreaseKey`/`increaseKey`, and `extract` are all `O(log n)`; **find-min/max** is `O(1)` at the root.

- **Build vs insert repeatedly.** `HEAPIFY` builds a heap in **O(n)**; inserting `n` elements one-by-one costs **O(n log n)**. See [[heapify|Heapify]] for the proof idea.

- **Heapsort compatibility.** Max-heap → decreasing order (extract max repeatedly). Min-heap → increasing order (if adapted accordingly).


## Implementation or Practical Context

### Core Operations (max-heap sketch)

**Sift-down** (restore order when a parent may be too small):

```pseudo
function SIFT_DOWN(A, n, i):
    while true:
        L = 2*i + 1
        R = 2*i + 2
        largest = i
        if L < n and A[L] > A[largest]: largest = L
        if R < n and A[R] > A[largest]: largest = R
        if largest == i: break
        swap A[i], A[largest]
        i = largest
```

**Sift-up** (restore order when a child may be too large):

```pseudo
function SIFT_UP(A, i):
    while i > 0:
        p = (i - 1) // 2
        if A[p] >= A[i]: break
        swap A[p], A[i]
        i = p
```

**Insert**: append at `A[n]`, `n++`, then `SIFT_UP(A, n-1)`.
**ExtractMax**: save `A[0]`, move `A[n-1]` to root, `n--`, then `SIFT_DOWN(A, n, 0)`.

> [!tip]
> **Pull-up variant:** Instead of repeated swaps, save `x=A[i]` and move the larger child up each step until its spot fits `x`; place `x` once. This reduces writes and branch mispredictions in practice.

### Array Representation Cheatsheet

- Parent index: `(i - 1) // 2`

- Children indices: `2i + 1`, `2i + 2`

- Last internal node: `⌊n/2⌋ − 1`

- Complete shape: leaves occupy indices `⌊n/2⌋ .. n-1`.


### Use Cases

- **Scheduling/dispatch:** Use a **min-heap** keyed by next deadline or wake time for event loops and timer wheels (small heaps).

- **Dijkstra / A*:** A **min-heap** keyed by tentative distance or `g+h` score. For very sparse graphs and huge `n`, pairing heaps or Fibonacci heaps can theoretically help **decrease-key** heavy workloads; in practice, well-engineered binary heaps perform best.

- **Streaming top-k:** Maintain a **min-heap of size k** storing the current k largest elements; compare each new item to `heap[0]`.

- **Heapsort:** Deterministic `O(n log n)`, in-place, not stable.


## Common Misunderstandings

> [!warning]
> **Breaking the shape property.** Inserting at arbitrary indices or removing from the middle makes the tree non-complete, invalidating array formulas. Always append/remove from the **end** and then restore order via sift.

> [!warning]
> **Mixing min-/max-heap comparisons.** If `SIFT_DOWN` uses max-heap logic but callers expect a min-heap, the structure silently corrupts. Keep a single comparator and propagate it consistently.

> [!warning]
> **Assuming sorted children/siblings.** A heap does not sort siblings or levels; only parents vs children are constrained. For fully sorted iteration, you must repeatedly `extract` or use another structure.

> [!warning]
> **Off-by-one indices.** Accessing `2i+1` or `2i+2` without checking `< n` causes out-of-bounds reads. Guard both child indices.

## Limitations / Pitfalls

- **Stability:** Heaps are not stable; equal keys may flip order. Attach a `(key, tiebreak)` pair if stability matters.

- **Decrease-key ergonomics:** Binary heaps don't support decrease-key in `O(1)` unless you keep external handles; otherwise it's `O(log n)` via reheap.

- **Cache behavior:** Trees jump around in memory when stored as pointers; the **array** layout keeps access patterns predictable and cache-friendly.


## Broader Implications

The heap abstraction generalizes to **k-ary heaps** (fewer levels, more branching), **d-heaps** in external-memory settings, and specialized variants like **pairing heaps**, **Fibonacci heaps**, **binomial heaps**, and **radix heaps** (for integer keys). Most production systems prefer the **binary heap** for its small constants, simplicity, and excellent CPU cache behavior.

## Summary

Heaps pair a **local order constraint** (parent vs children) with a **complete-tree shape**, giving a compact array representation and `O(log n)` updates with `O(1)` root access. They are ideal for priority queues, schedulers, and selection problems. Use `HEAPIFY` for `O(n)` bulk builds, keep indexing conventions straight, and guard the shape property by inserting/removing at the end followed by sift operations.

## Related Notes

- [[binary-heap|Binary Heap]]

- [[heapify|Heapify]]

- [[heapsort|Heapsort]]

- [[priority-queue|Priority Queue]]
