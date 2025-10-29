---
title: Searching — Overview  
description: Patterns for linear scans and divide-and-conquer searches over ordered data; how to choose the right strategy and avoid common traps.  
draft: true  
tags:
- cs 
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - decision-tree-vs-array.svg — Comparison decision tree for binary search mapped to array positions; shows depth ~ log2(n) and mid computation.

# - rotated-array-search.svg — Partitioning a rotated sorted array into ordered/rotated halves; highlights invariant for choosing the side.

---

## Overview

“Searching” asks: **where is the target?** Answers depend on what structure you have:

- **No structure** → **linear scan** is the baseline (`Θ(n)`).
    
- **Total order** (sorted array) with comparisons → **binary search** (`Θ(log n)`).
    
- **Hashable keys** with good hashing → **expected `Θ(1)` lookup** (not order-aware).
    
- **Monotone predicates** over integers/reals → **binary search on the answer**.
    
- **Special geometry** (unimodal/bitonic) → tailored **ternary/bitonic searches**.
    

This overview maps problems to strategies, shows archetypal pseudocode, explains how to adapt binary search for first/last occurrence and rotated arrays, and catalogs pitfalls (off-by-one, overflow, duplicate handling, comparator issues).

> [!note]  
> Terminology: Let `A[0..n-1]` be 0-indexed. Use half-open ranges `[lo, hi)` for clarity unless noted. Comparators must define a **strict weak ordering**.

## Motivation

Choosing the right search saves orders of magnitude:

- Scanning a million elements at ~5 GB/s costs ~0.8 ms just to read; logarithmic search touches ~20 elements.
    
- For **monotone decision problems** (e.g., “Is there a feasible `x`?”), turning feasibility into a predicate and **binary-searching the smallest `x`** is often cleaner than designing a custom algorithm from scratch.
    
- For **text and graphs**, searching becomes pattern matching or traversal; thinking in invariants still applies.
    

## Definition and Formalism

At its core, searching either:

1. **Enumerates** candidates until a condition holds (`for`/`while` scan), or
    
2. **Partitions** the domain into regions where the predicate is known to be **false/true** and recursively discards half (or more) each step.
    

**Binary search invariant (ordered arrays).** Maintain indices `lo` and `hi` such that:

- All indices `< lo` are **strictly less than** the target.
    
- All indices `≥ hi` are **greater than or equal** (or strictly greater, depending on variant).  
    Stop when `lo == hi`; that position is either the insertion point or proof of absence.
    

## Example or Illustration

### Linear search (baseline; early exit)

```pseudo
function LINEAR_SEARCH(A, key):
    for i in 0..|A|-1:
        if A[i] == key:
            return i
    return NOT_FOUND
```

- Works on **any** container; good when `n` is tiny or **key found early**.
    
- Use for **streamed** data where ordering is unavailable or expensive to build.
    

### Binary search (membership / position)

Use **half-open** interval `[lo, hi)`; compute `mid = lo + (hi - lo) // 2`.

```pseudo
function BINARY_SEARCH_EQUALS(A, key): // returns index or NOT_FOUND
    lo = 0; hi = |A|
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if A[mid] < key:
            lo = mid + 1
        else if A[mid] > key:
            hi = mid
        else:
            return mid
    return NOT_FOUND
```

#### Lower/upper bound (first/last occurrence; insertion points)

```pseudo
function LOWER_BOUND(A, key): // first i with A[i] >= key
    lo = 0; hi = |A|
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if A[mid] < key: lo = mid + 1 else: hi = mid
    return lo

function UPPER_BOUND(A, key): // first i with A[i] > key
    lo = 0; hi = |A|
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if A[mid] <= key: lo = mid + 1 else: hi = mid
    return lo
```

- **Count of equals**: `UPPER_BOUND(A,key) - LOWER_BOUND(A,key)`.
    
- **Index of last occurrence**: `UPPER_BOUND(A,key) - 1` (check range).
    

> [!example]  
> **Diagram (`decision-tree-vs-array.svg`)** — Map the binary decision tree (left/right at each comparison) to array intervals, showing how the invariant shrinks `[lo, hi)` by half each step.

### Exponential search (unknown `n`)

When array length is unknown or you search a conceptually **infinite** stream:

1. Grow a bound `hi` exponentially until `A[hi] ≥ key` or end; 2) binary-search in `[hi/2, hi]`.  
    Cost: `O(log p)` where `p` is the position of `key`.
    

### Searching in a rotated sorted array

Array is sorted then rotated, e.g., `[4,5,6,7,0,1,2]`. In each step, **one half is sorted**:

```pseudo
function SEARCH_ROTATED(A, key):
    lo = 0; hi = |A| - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if A[mid] == key: return mid
        if A[lo] <= A[mid]:                 // left half sorted
            if A[lo] <= key && key < A[mid]: hi = mid - 1
            else: lo = mid + 1
        else:                               // right half sorted
            if A[mid] < key && key <= A[hi]: lo = mid + 1
            else: hi = mid - 1
    return NOT_FOUND
```

- With duplicates, use care: equality `A[lo] == A[mid] == A[hi]` may force a linear fallback.
    

> [!example]  
> **Diagram (`rotated-array-search.svg`)** — Show pointers `lo`, `mid`, `hi` and which half is ordered; highlight the test that picks the half containing `key`.

### Ternary search (unimodal function on integers/reals)

If `f(x)` decreases then increases (unimodal), **ternary search** narrows the interval by comparing two midpoints. On discrete domains, stop when small and scan.  
Applications: finding argmin/argmax for convex/unimodal cost when derivatives are inconvenient.

### Searching by predicate (binary search on the answer)

Given monotone predicate `P(x)` (false…false, then true…true), find the **smallest `x`** with `P(x)=true`:

```pseudo
function FIRST_TRUE(P, lo, hi): // domain [lo, hi], P monotone
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if P(mid): hi = mid else: lo = mid + 1
    return lo
```

Examples: earliest feasible start time, minimal capacity to satisfy constraints, minimal radius covering points.

## Properties and Relationships

- **Decision-tree lower bound.** For **comparison-based search** over `n` ordered distinct keys, the decision tree has at least `n` leaves ⇒ **height ≥ ⌈log₂ n⌉**. Hence binary search is optimal up to constants.
    
- **Hash vs order.** Hash tables offer **expected `Θ(1)`** lookups but do not give order statistics (predecessor/successor). Balanced BSTs (e.g., [[cs/dsa/red-black-tree|Red–Black Tree]], [[cs/dsa/avl-tree|AVL Tree]]) support **`Θ(log n)`** search plus ordered traversals.
    
- **Two-pointers / sliding window.** On arrays with nonnegative or monotone structures, many “find subarray meeting constraint” problems are solved in **linear time** by growing/shrinking a window rather than binary searching a length.
    
- **Interpolation search.** For uniformly distributed keys in arrays, estimating the probe position can yield **average `O(log log n)`** probes, but worst case is `O(n)` and performance is highly data-dependent.
    

> [!tip]  
> Prefer **binary search variants** (lower/upper bound) as primitive building blocks. They generalize to “first true” style searches and reduce off-by-one bugs.

## Implementation or Practical Context

### Choosing a strategy

- **Tiny `n` (≤ 32–64)**: branch overhead dominates; **linear scan** may beat binary search.
    
- **Sorted, random access, comparator cheap**: use **binary search** variants.
    
- **Hashable, order not needed**: use **hash table**.
    
- **Unknown bounds / streams**: **exponential search** + binary search.
    
- **Rotated arrays / duplicates**: modified binary search with **invariants** and careful equality handling.
    
- **Answer search**: monotone **predicate + binary search** on parameter space.
    

### Robust binary search pattern (half-open)

Adopt a single, tested pattern in the codebase. Prefer **half-open `[lo, hi)`** loops with:

- Update `lo = mid + 1` only when the **mid cannot** be the answer.
    
- Update `hi = mid` when **mid could** still be the answer (lower-bound style).
    

### Comparators and stability

- Ensure comparator is **transitive and consistent**. Violations can cause infinite loops.
    
- For **custom orders** (e.g., case-insensitive), normalize inputs or guard comparator with preprocessing.
    

### Numeric safety and overflow

- Compute mid as `lo + (hi - lo) // 2` to avoid overflow on large indices.
    
- When binary-searching floating ranges, stop on **precision** (`hi - lo < ε`) or **iteration cap**; beware of **NaN**.
    

### Duplicates and boundaries

- **Membership** checks can be ambiguous with duplicates. Use `LOWER_BOUND`/`UPPER_BOUND` to find the correct edge.
    
- When returning the “closest” element, decide ties explicitly (left/ceil vs right/floor).
    

### Cache behavior and branch prediction

- Linear scans are streaming-friendly and can beat binary search on small arrays due to **branch misprediction** and cache line effects.
    
- **Galloping (exponential) probes** are used in TimSort’s merge to exploit runs.
    

### API design notes

Expose both:

- **Index-based** searches (for arrays/vectors).
    
- **Iterator-based** generic versions (C++ style) requiring random-access for logarithmic time.
    

> [!tip]  
> For production code, write a **single tested utility** (e.g., `lower_bound`) and reuse it everywhere to avoid bespoke off-by-one mistakes.

## Common Misunderstandings

> [!warning]  
> **Midpoint overflow.** `mid = (lo + hi) // 2` can overflow 32-bit integers; always compute `lo + (hi - lo) // 2`.

> [!warning]  
> **Wrong loop condition.** Mixing `[lo, hi]` and `[lo, hi)` semantics leads to infinite loops. Pick one convention and stick to it.

> [!warning]  
> **Duplicates mishandled.** A “==” success return may miss the **first/last** occurrence. Use `LOWER_BOUND`/`UPPER_BOUND` when order matters.

> [!warning]  
> **Comparator inconsistency.** State-dependent or non-transitive comparators (e.g., locale-dependent toggles) break binary search assumptions.

> [!warning]  
> **Assuming rotation trivial with duplicates.** In rotated arrays with many equal elements, the usual “which side is sorted?” test degrades; worst-case can approach linear.

## Summary

Search strategy follows structure. Without structure, **scan**. With order and random access, **binary search** and its **lower/upper bound** variants provide predictable `Θ(log n)` performance and clean semantics for first/last occurrences and insertion points. When bounds are unknown, use **exponential search** before a binary refinement. For specialized shapes—**rotated arrays**, **unimodal functions**, **bitonic arrays**—adapt the invariant or use problem-specific searches. Avoid classic bugs by committing to a half-open range convention, guarding against overflow, and handling duplicates explicitly.

## See also

- [[cs/dsa/linear-search|Linear Search]]
    
- [[cs/dsa/binary-search|Binary Search]]
    
- [[cs/dsa/maps-and-hashtable|Maps & Hash Tables]]
    
- [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals — BFS & DFS]]