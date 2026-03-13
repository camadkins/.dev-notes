---
title: Arrays — Fixed-Size Contiguous Storage
description: Linear data structure offering constant-time random access; foundation for static and dynamic sequences.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-29
aliases: []
---

## Definition
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

## Invariants
Let `A[0 … n−1]` be an array of `n` elements, each occupying `s` bytes.

- Indices are 0-based.
- Elements are stored consecutively without gaps (**contiguity**).
- The array size `n` is immutable for static arrays (**fixed capacity**).
- Access outside `[0, n−1]` causes undefined behavior or bounds errors.
- Constant-time indexing follows a stride/base model.

> [!note] Index-to-address mapping
> For fixed-size elements:
> ```
> addr(A[i]) = base(A) + i * stride
> ```
> This model explains why random access is O(1).

> [!warning]
> In languages like C, no bounds check occurs at runtime; in Java or Python, an `IndexError` is raised.

### Memory Layout & Addressing
Given base address `B`, element size `s`, and index `i`, the address of `A[i]` is `B + i×s`.

**Example:** If `A` starts at 1000 and holds 4-byte integers: `A[0]→1000`, `A[1]→1004`, `A[2]→1008`, …

> [!note]
> This arithmetic is why arrays cannot easily grow; any resize would require allocating a new contiguous region and copying elements.

---

## Operations
Typical operations include indexing, iteration, insertion/deletion (with shifts), and searching.

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

### Access & Iteration
```pseudo
for i in 0..n-1:
    visit(A[i])
````

- Sequential iteration cost: Θ(n); cache-friendly due to contiguous storage.
    
- Random access: O(1) per element.
    

> [!tip]  
> Arrays excel in predictable access patterns (e.g., numeric computations, sorting) because CPUs prefetch contiguous memory.

### Insertions & Deletions

**Insertion at Index**

```pseudo
function insert(A, n, i, x):
    for j = n-1 downto i:
        A[j+1] = A[j]
    A[i] = x
    n = n + 1
```

- Shifts all elements right of index `i` (worst-case O(n) when inserting at the beginning).
    

**Deletion**

```pseudo
function delete(A, n, i):
    for j = i to n-2:
        A[j] = A[j+1]
    n = n - 1
```

- Shifts all subsequent elements left; may leave garbage at the tail if unmanaged.
    



> [!example] Insert at position k by shifting right
> 
> ```cpp
> // assume capacity available; n is logical length
> for (int i = n; i > k; --i) A[i] = A[i-1];
> A[k] = value; n++;
> ```

---

## Complexity

- Indexing and updates are O(1) due to fixed-stride addressing.
    
- Insert/delete in the middle are O(n) because elements must shift.
    
- Whole-array traversals are Θ(n).
    

> [!note] Costs at a glance
> 
> - access by index: O(1)
>     
> - insert/delete at middle: O(n) due to shift
>     
> - append to **dynamic** array: amortized O(1); worst-case O(n) on resize
>     

### Space & Cache Behavior

- **Contiguous layout:** high spatial locality (CPU prefetch friendly).
    
- **Fixed capacity:** no resizing; use dynamic array for expansion.
    
- **Homogeneous type:** simplifies index arithmetic, supports SIMD/vectorization.
    

|Property|Advantage|Disadvantage|
|---|---|---|
|Fixed contiguous memory|Cache-efficient|Hard to grow dynamically|
|Constant-time indexing|Ideal for random access|Not for insertion-heavy workloads|
|Homogeneous typing|Optimized operations|Restricts flexibility|

---

## Variants

- **Static arrays** (fixed capacity) vs **dynamic arrays** (resizable with reallocation and copy).
    
- **Multidimensional arrays** with row-major or column-major layout (see also dedicated note).
    

> [!tip] Row vs Column major  
> Row-major (C/C++/Rust) favors row scans; column-major (Fortran/Julia) favors column scans. Structure loops to match memory layout.

---

## Examples

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

### When to Use

- When **predictable indexing** and **dense iteration** matter.
    
- For **numerical data**, **buffers**, and **lookup tables**.
    
- As a **foundation** for higher-level abstractions like stacks, queues, and dynamic arrays.
    

---

## Pitfalls

> [!warning] Common pitfalls
> 
> - off-by-one bounds
>     
> - mid-inserts are expensive (consider gap buffers/deques for editors)
>     
> - iterator invalidation after dynamic array reallocation
>     

> [!warning]  
> **Out-of-bounds access:** causes undefined behavior or exception.  
> **Uninitialized slots:** reading before assignment yields garbage or crash.  
> **Sentinel misuse:** some algorithms (like linear search) rely on artificial "end markers" that break with unbounded arrays.  
> **Off-by-one errors:** common in reverse loops or when mixing inclusive/exclusive ranges.

> [!tip]  
> For safety, many modern languages (e.g., Rust, Swift) perform automatic bounds checking or provide slicing abstractions.

---

## See also

- [[dynamic-arrays|Dynamic Arrays]]
    
- [[multidimensional-arrays|Multidimensional Arrays]]
    
- [[linear-search|Linear Search]]
    
- [[binary-search|Binary Search]]
    
- [[array-operations|Array Operations]]
    