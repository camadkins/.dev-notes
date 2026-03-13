---

title: Binary Heap - Priority Queue Backed by Array-Based Tree  
description: Complete binary tree supporting O(log n) insertion and deletion through array-based parent-child relationships and heap-order property.  
draft: false
comments: true
updated: 2025-10-29  
aliases: []  
tags:
- cs
- dsa
date: 2025-10-16
# diagrams:
# - name: heap-array-layout
# brief: 0-based vs 1-based index formulas; parent/children mapping
# - name: heapify-sift-down
# brief: Sift-down sequence on build-heap showing swaps to restore order
# - name: binary_heap_structure.svg
# brief: Mapping between tree shape and array indices for a small heap
# - name: heapify_trace.svg
# brief: Bottom-up heapify restoring min-heap order across subtrees
# - name: heap_operations.svg
# brief: Insertion bubble-up and removal bubble-down animations
---

## Definition

A **Binary Heap** is a **complete binary tree** that satisfies the **heap-order property**:

- **Min-heap:** Each parent ≤ its children.
    
- **Max-heap:** Each parent ≥ its children.
    

It is typically implemented using an **array**, enabling efficient index arithmetic without explicit pointers.

> [!note] What it is  
> A binary heap is a **complete binary tree** stored in an **array**, where each node satisfies the **heap-order** property (parent ≤ children in a min-heap, or ≥ in a max-heap). It is the standard in-memory **priority queue** backing.

---

## Invariants

- **Shape** (complete tree): nodes fill level-by-level, left-to-right; there are no holes among indices `0..n-1`.
    
- **Order** (heap property): for every node `i`, the parent compares before its children under the heap comparator.
    
- **Min vs Max**: same code structure; only the comparison direction flips.
    

**(Existing diagram reference)** **Diagram (`binary_heap_structure.svg`)** - show how an array `[10, 15, 20, 17, 25]` maps to a binary tree shape.

---

## Operations

### Supported operations

- **push/insert** (sift up)
    
- **pop / extract-min (or max)** (sift down)
    
- **peek** (return root)
    
- **build-heap** (heapify from arbitrary array)
    
- **decrease-/increase-key** (optional extension, needs index location)
    

> [!example] Sift up (insert)
> 
> ```pseudo
> push(x):
>   A[n] = x; i = n; n++
>   while i > 0 and A[i] < A[parent(i)]:
>     swap(A[i], A[parent(i)]); i = parent(i)
> ```

> [!example] Sift down (extract-min)
> 
> ```pseudo
> pop():
>   min = A[0]; A[0] = A[n-1]; n--
>   i = 0
>   while left(i) < n:
>     j = left(i)
>     if right(i) < n and A[right(i)] < A[j]: j = right(i)
>     if A[i] <= A[j]: break
>     swap(A[i], A[j]); i = j
>   return min
> ```

> [!note] Build-heap (heapify)  
> Build in **O(n)** by sifting down from the last parent: `for i in reverse(parent(n-1)..0): siftDown(i)`.

**(Existing diagram reference)** **Diagram (`heap_operations.svg`)** - visualize upward swaps as new elements bubble up.  
**(Existing diagram reference)** **Diagram (`heapify_trace.svg`)** - show bottom-up restoration of order across subtrees.

> [!example] Diagram: Sift-down during build-heap

---

## Complexity

|Operation|Time|Notes|
|---|---|---|
|push/insert|O(log n)|Sift-up along a root-to-leaf path|
|pop/extract-min(max)|O(log n)|Sift-down to restore order|
|peek|O(1)|Root access|
|build-heap|**O(n)**|Bottom-up heapify|
|decrease-/increase-key|O(log n)|Requires locating the element’s index|

> [!note] Costs at a glance
> 
> - push/insert: O(log n)
>     
> - pop/extract-min(max): O(log n)
>     
> - peek: O(1)
>     
> - build-heap from n items: **O(n)**
>     
> - decrease/increase-key: O(log n) (assuming you can locate the element’s index)
>     

---

## Implementations

### Array layout (0-based vs 1-based)

For a heap stored in array `A[0..n-1]` (0-based):

|Relationship|Formula|
|---|---|
|parent(i)|`(i - 1) // 2`|
|left(i)|`2*i + 1`|
|right(i)|`2*i + 2`|

For 1-based indexing, use `parent(i)=i//2`, `left(i)=2*i`, `right(i)=2*i+1`.

> [!tip] Array layout (0-based vs 1-based)  
> **0-based** indexing:
> 
> - parent(i) = (i - 1) // 2
>     
> - left(i) = 2*i + 1
>     
> - right(i) = 2*i + 2  
>     **1-based** indexing:
>     
> - parent(i) = i // 2
>     
> - left(i) = 2*i
>     
> - right(i) = 2*i + 1
>     
> 
> [!example] Diagram: Array layout and mapping

**Comparator strategy.** Implement min-heap or max-heap by parameterizing the comparison; ensure the comparator is **consistent with equality** to avoid violating transitivity at ties.

---

## Examples

> [!example] Top-k with a heap  
> Maintain a size-`k` **max-heap** of the smallest seen values (or a min-heap of the largest). For each new element, push then pop if size exceeds `k`. Total time **O(n log k)**.

**Use in algorithms.** Dijkstra/Prim priority queues, event simulation, streaming quantiles (with dual heaps), and heapsort (using a max-heap).

---

## Pitfalls

> [!warning] Common pitfalls
> 
> - Mixing **0-based and 1-based** formulas (off-by-one bugs).
>     
> - Forgetting the **shape** step on pop (move last element to root before sift-down).
>     
> - Assuming **stability**: binary heaps are _not stable_; equal keys can reorder.
>     
> - Using a comparator **inconsistent with equality**, which can break the heap invariant around ties.
>     

> [!tip]  
> Verify the heap property after each operation, and prefer encapsulating `siftUp/siftDown` as private helpers to centralize invariants.

---

## When to use

> Use a binary heap when:
> 
> - You need a fast **priority queue** (Dijkstra, Prim, A*, schedulers).
>     
> - You want **heapsort** (in-place, O(n log n), not stable).
>     
> - You need **top-k** or **streaming** selection with bounded memory.  
>     Consider **[[d-ary-heap|d-ary Heap]]** or pairing/Fibonacci variants when `decrease-key` dominates.
>     

---

## Related Notes

- [[priority-queue|Priority Queue]]
    
- [[heapsort|Heapsort]]
    
- [[d-ary-heap|d-ary Heap]]
    