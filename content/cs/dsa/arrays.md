---
title: Arrays — Fixed-Size Contiguous Storage
description: Linear data structure offering constant-time random access; foundation for static and dynamic sequences.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - array_layout.svg — shows contiguous memory cells with base + i × elemSize addressing.
#  - array_insert_shift.svg — visualizes insertion causing element shifts.
#  - array_reverse_trace.svg — demonstrates in-place reversal with two-pointer swap.
---

## Overview
An **array** is a contiguous block of memory holding a fixed number of elements of the same type.  
Its power lies in **direct indexing**—given a base address `B` and element size `s`, the address of element `A[i]` is:

```

Address(A[i]) = B + i × s

````

This simple arithmetic underlies the efficiency of arrays: random access in constant time (O(1)).  
However, their fixed size and contiguous nature make insertions, deletions, and resizing costly.

> [!note]
> Arrays form the *lowest-level sequence abstraction* from which lists, stacks, queues, and dynamic arrays are built.

---

## Model & Invariants

Let `A[0 … n−1]` be an array of `n` elements, each occupying `s` bytes.

**Invariants**
- Indices are 0-based.
- Elements are stored consecutively without gaps.
- The array size `n` is immutable for static arrays.
- Access outside `[0, n−1]` causes undefined behavior or bounds errors.

> [!warning]
> In languages like C, no bounds check occurs at runtime; in Java or Python, an `IndexError` is raised.

**Diagram (`array_layout.svg`)** — Shows contiguous memory cells with calculated addresses `B + i × s`.

---

## Operations & Complexity

| Operation | Average Time | Worst Time | Description |
|------------|---------------|-------------|-------------|
| Access `A[i]` | O(1) | O(1) | Direct index arithmetic |
| Update `A[i]=x` | O(1) | O(1) | In-place assignment |
| Insert at end | O(1)* | O(1) | Constant if capacity not exceeded |
| Insert at i | O(n−i) | O(n) | Shift elements right |
| Delete at i | O(n−i) | O(n) | Shift elements left |
| Search | O(n) | O(n) | Linear scan |
| Reverse | O(n) | O(n) | Two-pointer swap |

\* For fixed arrays, insertion at end is invalid unless resizing occurs (dynamic array).

---

### Access & Iteration
```pseudo
for i in 0..n-1:
    visit(A[i])
````

- Sequential iteration cost: Θ(n)
    
- Cache-friendly due to contiguous storage.
    
- Random access O(1) per element.
    

> [!tip]  
> Arrays excel in predictable access patterns (e.g., numeric computations, sorting) because CPUs prefetch contiguous memory.

---

## Insertions & Deletions

### Insertion at Index

```pseudo
function insert(A, n, i, x):
    for j = n-1 downto i:
        A[j+1] = A[j]
    A[i] = x
    n = n + 1
```

- Shifts all elements right of index `i`.
    
- Worst-case O(n) when inserting at the beginning.
    

### Deletion

```pseudo
function delete(A, n, i):
    for j = i to n-2:
        A[j] = A[j+1]
    n = n - 1
```

- Shifts all subsequent elements left.
    
- Leaves garbage at the tail if unmanaged.
    

> [!example]  
> **Diagram (`array_insert_shift.svg`)** — Insert at index `i` shifts trailing elements one cell to the right.

---

## Memory Layout & Addressing

Given:

- Base address `B`
    
- Element size `s`
    
- Index `i`
    

Then `A[i]` address is `B + i×s`.

**Example:**  
If `A` starts at 1000 and holds 4-byte integers:

- `A[0]` → 1000
    
- `A[1]` → 1004
    
- `A[2]` → 1008
    
- …
    

> [!note]  
> This arithmetic is why arrays cannot easily grow; any resize would require allocating a new contiguous region and copying elements.

---

## Traversal & Reverse Example

### Forward traversal

```pseudo
for i in 0..n-1:
    print(A[i])
```

### Reverse in-place

```pseudo
function reverse(A, n):
    left = 0
    right = n - 1
    while left < right:
        swap(A[left], A[right])
        left = left + 1
        right = right - 1
```

> [!example]  
> **Diagram (`array_reverse_trace.svg`)** — Two-pointer swaps showing the reversal progress.

---

## Space & Cache Behavior

- **Contiguous layout:** high spatial locality (CPU prefetch friendly).
    
- **Fixed capacity:** no resizing; use dynamic array for expansion.
    
- **Homogeneous type:** simplifies index arithmetic, supports SIMD/vectorization.
    

|Property|Advantage|Disadvantage|
|---|---|---|
|Fixed contiguous memory|Cache-efficient|Hard to grow dynamically|
|Constant-time indexing|Ideal for random access|Not for insertion-heavy workloads|
|Homogeneous typing|Optimized operations|Restricts flexibility|

---

## Edge Cases & Pitfalls

> [!warning]  
> **Out-of-bounds access:** causes undefined behavior or exception.  
> **Uninitialized slots:** reading before assignment yields garbage or crash.  
> **Sentinel misuse:** some algorithms (like linear search) rely on artificial "end markers" that break with unbounded arrays.  
> **Off-by-one errors:** common in reverse loops or when mixing inclusive/exclusive ranges.

> [!tip]  
> For safety, many modern languages (e.g., Rust, Swift) perform automatic bounds checking or provide slicing abstractions.

---

## When to Use

- When **predictable indexing** and **dense iteration** matter.
    
- For **numerical data**, **buffers**, and **lookup tables**.
    
- As a **foundation** for higher-level abstractions like stacks, queues, and dynamic arrays.
    

---

## Summary

- **Core invariant:** contiguous fixed-size memory, O(1) indexing.
    
- **Weakness:** resizing and shifting cost Θ(n).
    
- **Key takeaway:** arrays are the hardware-level “vector” — ideal for static datasets and index-based logic.
    

---

## See also

- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]
    
- [[cs/dsa/stacks|Stacks]]
    
- [[queue|Queues]]
    
- [[cs/dsa/memory-allocation|Memory Allocation]]