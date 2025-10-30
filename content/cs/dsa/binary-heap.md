---
title: Binary Heap — Priority Queue Backed by Array-Based Tree
description: Complete binary tree supporting O(log n) insertion and deletion through array-based parent-child relationships and heap-order property.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
aliases: []
# diagrams:
#  - binary_heap_structure.svg — show mapping between tree shape and array indices.
#  - heapify_trace.svg — illustrate bottom-up heapify process restoring min-heap order.
#  - heap_operations.svg — insertion bubble-up and removal bubble-down.
---

## Overview
A **Binary Heap** is a **complete binary tree** that satisfies the **heap-order property**:
- **Min-heap:** Each parent ≤ its children.
- **Max-heap:** Each parent ≥ its children.

It is typically implemented using an **array**, enabling efficient index arithmetic without explicit pointers.

> [!note]
> Binary heaps are the foundation for **priority queues**, **heap sort**, and scheduling algorithms such as Dijkstra’s shortest path.

---

## Array Representation

For a heap stored in array `H[0 … n−1]` (0-indexed):

| Relationship | Formula |
|---------------|----------|
| Parent index | `(i - 1) // 2` |
| Left child | `2i + 1` |
| Right child | `2i + 2` |

> [!example]
> **Diagram (`binary_heap_structure.svg`)** — show how an array `[10, 15, 20, 17, 25]` maps to a binary tree shape.

This mapping guarantees that the tree remains **complete** (filled from left to right).

---

## Heap Properties

1. **Structural property:** complete binary tree.  
2. **Heap-order property:** for min-heap, `H[parent(i)] ≤ H[i]`.

These ensure efficient logarithmic insertions and deletions while maintaining compact array storage.

---

## Operations & Complexity

| Operation | Time | Description |
|------------|------|-------------|
| `insert(x)` | O(log n) | Add new element, bubble up to restore order. |
| `extractMin()` | O(log n) | Remove smallest element (root), move last element to root, bubble down. |
| `peekMin()` | O(1) | Return smallest element without removing. |
| `heapify()` | O(n) | Build heap from unsorted array. |

---

## Insertion (Bubble Up)

### Algorithm
1. Append new key at end.
2. Compare with parent.
3. Swap if violates heap property.
4. Repeat until heap-order restored.

```pseudo
function insert(H, x):
    H.append(x)
    i = size(H) - 1
    while i > 0 and H[parent(i)] > H[i]:
        swap(H[i], H[parent(i)])
        i = parent(i)
````

> [!tip]  
> In a max-heap, reverse the comparison (`<` instead of `>`).

> [!example]  
> **Diagram (`heap_operations.svg`)** — visualize upward swaps as new elements bubble up.

---

## Extract Minimum (Bubble Down)

### Algorithm

1. Store `min = H[0]`.
    
2. Move last element to root.
    
3. Remove last element.
    
4. **Heapify down** from root until heap-order restored.
    

```pseudo
function extractMin(H):
    if size(H) == 0: return null
    min = H[0]
    H[0] = H[last]
    delete last element
    heapifyDown(H, 0)
    return min

function heapifyDown(H, i):
    left = 2*i + 1
    right = 2*i + 2
    smallest = i
    if left < size(H) and H[left] < H[smallest]:
        smallest = left
    if right < size(H) and H[right] < H[smallest]:
        smallest = right
    if smallest != i:
        swap(H[i], H[smallest])
        heapifyDown(H, smallest)
```

---

## Heapify (Bottom-Up Construction)

Building a heap from an arbitrary array can be done in **O(n)** by heapifying from the last non-leaf down to the root:

```pseudo
function buildHeap(H):
    n = size(H)
    for i = (n // 2) - 1 downto 0:
        heapifyDown(H, i)
```

> [!example]  
> **Diagram (`heapify_trace.svg`)** — show bottom-up restoration of order across subtrees.

> [!note]  
> This is more efficient than inserting each element individually (O(n log n)).

---

## Heap Variants

- **Min-Heap / Max-Heap:** depending on order relation.
    
- **d-ary Heap:** generalization where each node has `d` children (used in high-degree priority queues).
    
- **Binary Max-Heap:** used in **heap sort** for efficient in-place sorting.
    

---

## Applications

- **Priority queues** (task scheduling, event simulation)
    
- **Dijkstra’s algorithm** (extract-min queue)
    
- **Heap sort**
    
- **Median maintenance** (min + max heap combination)
    

> [!tip]  
> The heap structure’s compactness and guaranteed O(log n) operations make it ideal for performance-critical scheduling systems.

---

## Pitfalls

> [!warning]  
> **Off-by-one errors** — mixing 0-based and 1-based index formulas leads to broken child/parent mapping.

> [!warning]  
> **Forgetting to re-heapify after extraction** — root replacement must always be followed by `heapifyDown()`.

> [!tip]  
> Always verify heap property after operations — each parent must satisfy ordering with its children.

---

## Summary

- Binary Heap is a complete binary tree stored in an array.
    
- Supports logarithmic insertions and deletions.
    
- Built efficiently with `heapify()` in O(n).
    
- Foundation for priority queues and heapsort.
    
- Simple, compact, and cache-efficient structure.
    

---

## See also

- [[cs/dsa/heaps|Heaps Overview]]
    
- [[cs/dsa/heapify|Heapify]]
    
- [[cs/dsa/priority-queue|Priority Queue]]
    
- [[cs/dsa/d-ary-heap|d-ary Heap]]
    
- [[bst|Binary Search Tree]]