---
title: Array Operations — Canonical Patterns and Costs
description: Indexing, iteration, insertion/deletion with shifts, and searching on contiguous fixed-stride arrays with practical tips and pitfalls.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-07
aliases: []
---

## Overview
Arrays provide **O(1) indexed access** via fixed-stride addressing, making them the default substrate for many algorithms and data structures. This note gathers the **canonical operations** on arrays—**index, iterate, insert/delete (with shifts), and search**—with their **standard costs**, **safe idioms**, and **gotchas**. It complements the structural properties in [[cs/dsa/arrays|Arrays — Fixed-Size Contiguous Storage]] and focuses on *how to do the work correctly and efficiently*.

> [!note] Mental model
> For fixed-size elements:
> ```
> addr(A[i]) = base(A) + i * stride
> ```
> This model explains constant-time random access and why mid-array insertions/deletions require shifting.

---

## Motivation
Real programs rarely perform a single primitive; they **compose** these operations. Understanding **how costs add up** (e.g., scan + mid-insert = Θ(n)) and which **loop shapes** suit memory is crucial for clear, correct, and cache-friendly code.

> [!tip] Pick the right structure
> If your workload is *insert/delete-heavy in the middle*, prefer a **deque**, **gap buffer**, or **linked structure**; keep arrays when **indexed access and dense iteration** dominate.

---

## Definition and Formalism
Let `A` be a contiguous array with logical length `n` (`0 ≤ n ≤ capacity`). The canonical operations:

- **Index**: read/write `A[i]` with `0 ≤ i < n`.
- **Iterate**: visit `A[0]..A[n-1]` in order (or reverse).
- **Insert at i**: shift `A[i..n-1]` right by one, write `A[i]=x`, increment `n`.
- **Delete at i**: shift `A[i+1..n-1]` left by one, decrement `n`.
- **Search**: linear scan (unsorted) or binary search (sorted).

**Asymptotic costs (RAM model):**

| Operation               | Cost        | Notes                                 |
|-------------------------|-------------|---------------------------------------|
| `A[i]` read/write       | O(1)        | Index arithmetic                      |
| Iterate all elements    | Θ(n)        | Contiguous prefetch-friendly          |
| Insert/Delete at end    | O(1)\*      | If capacity available; else resize    |
| Insert/Delete at i      | Θ(n − i)    | Shifts dominate                       |
| Linear search           | Θ(n)        | No order assumption                    |
| Binary search (sorted)  | Θ(log n)    | Requires monotone comparator          |

\* In **dynamic arrays**, appends are amortized O(1); see [[cs/dsa/dynamic-arrays|Dynamic Arrays]] and [[cs/dsa/amortized-analysis-methods|Amortized Analysis]].

---
### **Index**

```cpp
use(A[i]);    // 0 <= i < n
```

```
Indexing (O(1)):

┌────┬────┬────┬────┬──────┐
│ A0 │ A1 │ Ai │ ...│ A[n-1]│
└────┴────┴────┴────┴──────┘
             ↑
          use(A[i])
```

---

### **Safe forward iteration**

```cpp
for (int i = 0; i < n; ++i) {
    use(A[i]);
}
```

```
Forward iteration (Θ(n)):

┌────┬────┬────┬──────┐
│ A0 │ A1 │ ...│ A[n-1]│
└────┴────┴────┴──────┘
  ↑ → → → → → → → → → ↑
 i = 0            i = n-1
```

---

### **Reverse iteration (two-pointer idiom)**

```cpp
for (int l = 0, r = n - 1; l < r; ++l, --r) {
    std::swap(A[l], A[r]);
}
```

```
Reverse scan (swapping ends):

l →      increasing
      ┌────┬────┬────┬──────┐
      │ A0 │ A1 │ ...│ A[n-1]│
      └────┴────┴────┴──────┘
                     ← r
                      decreasing
```

---

### **Insert at position i (shift right)**

```cpp
// pre: 0 <= i <= n, n < capacity
for (int j = n; j > i; --j) A[j] = A[j-1];
A[i] = x;
++n;
```

#### Before:

```
Before (capacity available):

┌────┬────┬────┬────┬────┬──────┬──────┐
│ A0 │ A1 │ ...│ Ai │ Ai+1│ ...  │ A[n-1]│ [ ] 
└────┴────┴────┴────┴────┴──────┴──────┘
                           empty slot →
```

#### Shift:

```
Shift right (Θ(n−i)):

A[n-1] → A[n]
A[n-2] → A[n-1]
...
A[i]   → A[i+1]
```

#### After:

```
After insertion:

┌────┬────┬────┬────┬────┬──────┐
│ A0 │ A1 │ ...│  x │ Ai │ ... │
└────┴────┴────┴────┴────┴──────┘
```

---

### **Delete at position i (shift left)**

```cpp
// pre: 0 <= i < n
for (int j = i; j + 1 < n; ++j) A[j] = A[j+1];
--n;
```

#### Before:

```
Before:

┌────┬────┬────┬────┬────┬──────┐
│ A0 │ A1 │ ...│ Ai │ Ai+1│ ...  │ A[n-1]
└────┴────┴────┴────┴────┴──────┘
```

#### Shift:

```
Shift left (Θ(n−i)):

A[i+1] → A[i]
A[i+2] → A[i+1]
...
A[n-1] → A[n-2]
```

#### After:

```
After deletion:

┌────┬────┬────┬────┬────┬──────┐
│ A0 │ A1 │ ...│ Ai+1│ Ai+2│ ... │ [ ]
└────┴────┴────┴────┴────┴──────┘
                          empty slot
```

---

## Properties and Relationships

### Searching patterns

- **Unsorted**: use **linear search** (Θ(n)). Optionally place a **sentinel** at `A[n]` to eliminate a bound check in languages that allow it (requires extra capacity and careful restoration). See [[cs/dsa/linear-search|Linear Search]].
    
- **Sorted**: use **binary search** (Θ(log n)) and consider **galloping (exponential) search** if likely near a probe point. See [[cs/dsa/binary-search|Binary Search]].
    

> [!note] Sentinel sketch (unsafe in bounds-checked languages)
> 
> ```
> // reserve A[n] for the sentinel temporarily
> T key = x; T last = A[n-1]; A[n-1] = x;
> int i = 0; while (A[i] != x) ++i;
> A[n-1] = last;
> if (i < n-1 || last == x) { /* found at i */ }
> ```
> 
> Prefer explicit bounds in safety-focused codebases.

### Interaction with dynamic arrays

Insert/delete in the **middle** remains Θ(n) even if appends are amortized O(1). Growth policy affects constants; see [[cs/dsa/dynamic-arrays|Dynamic Arrays]] and [[cs/dsa/amortized-analysis-methods|Amortized Analysis]].

### Multidimensional arrays and layout

For 2D `A[r][c]` with row-major layout (C/C++/Rust), scanning **row-first** maximizes locality:

```cpp
for (int i = 0; i < R; ++i)
  for (int j = 0; j < C; ++j)
    use(A[i][j]); // contiguous in memory
```

Column-major languages (Fortran/Julia) invert the preferred nesting; see [[cs/dsa/multidimensional-arrays|Multidimensional Arrays]].

---

## Implementation or Practical Context

### Bounds hygiene and indices

```cpp
bool in_bounds(int i, int n) { return 0 <= i && i < n; }
```

> [!tip] Defensive indexing  
> Normalize or clamp indices received from untrusted sources. Treat `size_t` underflows carefully when subtracting.

### Avoiding quadratic traps

Repeated mid-array inserts in a loop cause **Θ(n²)** behavior:

```cpp
// anti-pattern: building a list by inserting at front in a raw array
for (int k = 0; k < n; ++k) insert_at(0, x[k]); // Θ(n²)
```

Prefer **append + reverse** or pick a more suitable structure (e.g., deque).

### Bulk operations

Use **bulk copy** where available (e.g., `memmove` or `std::copy_backward`) to shift segments efficiently and clearly.

> [!tip] Copy direction matters
> 
> - Shift **right**: copy **backward** (`j = n; j > i; --j`) to avoid overwriting.
>     
> - Shift **left**: copy **forward** (`j = i; j + 1 < n; ++j`).
>     

### Searching with early exit

```cpp
int idx = -1;
for (int i = 0; i < n; ++i) if (A[i] == x) { idx = i; break; }
```

> [!note] Stability of first/last occurrence  
> For unsorted data, define and test whether you need the **first** or **last** match; this affects scan direction and equality logic.

---

## Common Misunderstandings

> [!warning] Common pitfalls
> 
> - **“Append is always O(1)”** — only _amortized_ in dynamic arrays; worst-case append may be Θ(n) due to resize.
>     
> - **Sentinels are universally safe** — not in bounds-checked languages or when capacity equals length.
>     
> - **Binary search on unsorted data** — precondition is violated; results are undefined.
>     
> - **Copy direction errors** — shifting with the wrong loop direction corrupts data.
>     
> - **Iterator invalidation** — after a dynamic-array reallocation, pointers/iterators to old storage are invalid.
>     

> [!tip] Test harness checklist
> 
> - Empty array; single element; full capacity.
>     
> - Insert/delete at **0**, **middle**, **n-1**, and **n** (append).
>     
> - Search **present/absent** keys; duplicates (first vs last).
>     
> - Reverse odd/even lengths.
>     

---

## Summary

- Arrays support **O(1) index** and **Θ(n)** scans with excellent locality.
    
- **Insert/delete at i** cost Θ(n − i) due to shifting; choose structures accordingly.
    
- **Search** is Θ(n) (unsorted) or Θ(log n) (sorted via binary search).
    
- Correctness depends on **bounds**, **copy direction**, and **layout-aware** loops.
    

---

## See also

- [[cs/dsa/arrays|Arrays — Fixed-Size Contiguous Storage]]
    
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]
    
- [[cs/dsa/multidimensional-arrays|Multidimensional Arrays]]
    
- [[cs/dsa/linear-search|Linear Search]]
    
- [[cs/dsa/binary-search|Binary Search]]