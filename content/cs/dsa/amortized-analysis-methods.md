---
title: Amortized Analysis
description: Bounding the average cost per operation over a sequence via aggregate, accounting, and potential methods.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-15
aliases:
  - amortized-analysis
---

## Definition
**Amortized analysis** proves that the **average cost per operation over a sequence** is small, even if some individual operations are expensive. Three standard techniques all yield the same asymptotic bound when applied correctly:

- **Aggregate method.** Analyze a batch of \(k\) operations together; divide total cost by \(k\).
- **Accounting method.** Overcharge cheap operations by a small **credit** that pays for future expensive ones.
- **Potential method.** Define a nonnegative potential $\Phi(\text{state})$ so the amortized cost is

$$
\hat{c}_i \;=\; c_i \;+\; \Phi(S_i) \;-\; \Phi(S_{i-1}) \,,
$$

ensuring (with $\Phi(S_0)\le \Phi(S_k)$) that the total amortized cost upper-bounds total actual work:
$$
\sum_{i=1}^{k} \hat{c}_i \;\ge\; \sum_{i=1}^{k} c_i \,.
$$

> [!note] Three lenses, same result
> - **Aggregate**: analyze k operations together.
> - **Accounting**: charge each op a “banked” fee to pay for expensive ones.
> - **Potential**: define Φ(state) so amortized cost is `actual + ΔΦ`.

---

## Why it matters
Asymptotic *worst-case per operation* can be misleading. Structures like dynamic arrays, hash tables, and disjoint sets have occasional spikes ([[cs/languages/Rust/slices-vec-and-capacity|resizes]], rehashes, compressions), yet deliver **fast average performance across sequences**. Amortized analysis certifies this behavior and guides API guarantees.

> [!tip] Why developers care
> Amortization explains why structures like dynamic arrays and hash tables perform well **in practice** even though some individual operations are expensive.

---

## Model & Assumptions
Amortized bounds are established **for sequences** of operations under a fixed cost model and stable policies.

- **Operation sequences.** Consider a sequence \( \sigma = (op_1,\dots, op_m) \) acting on a shared structure.
- **Cost models.** RAM model with [[cs/systems/memory-hierarchy-and-caching|unit-cost]] pointer/word ops unless otherwise stated.
- **Policies must be fixed.** E.g., dynamic arrays use a **doubling** growth factor; union–find uses **path compression + union by rank/size**.

> [!note] Sequence semantics
> Amortized guarantees are for a **sequence** of operations under a stable model (e.g., randomization assumptions, fixed growth policy). If preconditions change (e.g., resizing policy), redo the analysis.

---

## Examples

### 1) Dynamic array growth (append) - \( O(1) \) amortized
**Model.** Start with capacity 1. On overflow, allocate new array of capacity \(2m\) and copy \(m\) items; then append.

**Aggregate proof (classic).** In \(m\) appends, each element is copied at most **once** per capacity it survives. Total copies \(< 2m\). So total work \(O(m)\) and average \(O(1)\).

**Accounting sketch.** Charge each append **3 units**: 1 to write, **2 banked** toward future copies. When resizing from \(m\) to \(2m\), the bank holds enough to pay for the \(m\) copies.

> [!example] Dynamic array (doubling) - accounting sketch
> - Charge each append 3 units.
> - 1 unit pays for the write; 2 units are banked.
> - On resize to capacity 2m, m banked units copy m elements. Average remains O(1).

**Potential method.** Let \( \Phi = 2\cdot \text{size} - \text{capacity} \) (clamped to \(\ge 0\)). Normal append increases size by 1 (small \(\Delta\Phi\)), resize jumps capacity so \(\Delta\Phi\) becomes negative, **paying back** the spike.

> [!example] Potential method snippet
> Let Φ = 2*size − capacity. A normal append has tiny ΔΦ; a resize increases capacity, making ΔΦ negative and paying back the spike.

---

### 2) Union–Find (Disjoint Set Union) - \( O(m \, \alpha(n)) \)
**Operations.** `make_set`, `find`, `union` with **path compression** and **union by rank/size**.

**Result.** Any sequence of \(m\) operations on \(n\) elements runs in \(O(m\,\alpha(n))\) time, where \(\alpha\) is the inverse Ackermann function (grows \(< 5\) for any practical \(n\)).

**Intuition.**  
- Path compression flattens trees on each `find`, *banking* future speedups.  
- Union by rank avoids tall trees, keeping ranks logarithmic.  
- The potential (based on node ranks) amortizes the repeated `find`s afterward.

> [!example] Union-Find (path compression + union by rank)
> A sequence of m ops on n elements is O(m α(n)), where α is inverse Ackermann - effectively constant for practical n.

---

### 3) Stack with occasional cleanup - \( O(1) \) amortized
Suppose each `push` sometimes triggers a **cleanup** that removes obsolete markers (e.g., periodically scanning to discard dead entries). If each entry is cleaned **once** per its lifetime, the **aggregate** cost over \(m\) `push/pop` operations is linear, yielding constant amortized cost.

**Accounting view.** Charge each `push` a small credit saved on the element. When a cleanup runs, the credits on to-be-removed elements pay for the traversal.

---

### 4) Other patterns
- **Binary counter increments.** Incrementing a k-bit binary counter \(m\) times flips each bit at most \(m/2, m/4, \dots\) times → total flips \(< 2m\) → amortized \(O(1)\).  
- **Hash tables with resizing.** As long as load factor is kept in a constant range (by doubling/halving), `insert`/`find` remain **expected** \(O(1)\); rehash cost is amortized across inserts (requires probabilistic model or simple uniform hashing assumptions).

---

## Pitfalls
- **Amortized \(\neq\) average over random inputs.** Amortized is **worst-case over sequences** when the policy is fixed, not probabilistic averaging.
- **Changing the policy midstream.** If the growth factor for a dynamic array changes (say, from ×2 to ×1.5), redo the analysis - your credits or potential may no longer cover costs.
- **Ignoring allocators and caches.** Real systems may have nontrivial reallocation/memcpy costs; constants matter for performance even if asymptotics don’t change.

> [!warning] Common pitfalls
> - Confusing **amortized** with **average over random inputs**.
> - Changing growth policy midway (invalidates your constants).
> - Ignoring allocator behavior: real-world realloc can change constants meaningfully.

---

## Related Notes
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]
- [[cs/dsa/best-worst-average-cases|Best/Worst/Average Cases]]
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]
- [[cs/dsa/disjoint-set|Union-Find]]