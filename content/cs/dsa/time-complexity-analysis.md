---
title: Time Complexity Analysis
description: Rigorous techniques to bound running time using cost models, asymptotics, and recurrences.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-02
aliases: []

---

## Overview
**Time complexity analysis** predicts how an algorithm's running time scales with input size `n`. The goal is not to count literal CPU cycles but to obtain **asymptotic bounds**—usually `$O(\cdot)$`, `$Ω(\cdot)$`, `$Θ(\cdot)$`—that remain stable across machines and implementations. A disciplined analysis uses a **cost model**, **dominant-term extraction**, and (when needed) **recurrences** for recursive algorithms.

> [!note]
> Complexity is a *function of input size and structure*. For many algorithms, best, worst, and average cases differ. Report the one most relevant to the use case and model assumptions.

## Motivation
- **Design feedback:** reveals bottlenecks early and guides data-structure choices.
- **Scalability checks:** ensures performance remains acceptable as `n` grows.
- **Comparisons:** provides machine-independent yardsticks for alternative approaches.
- **Contracts:** communicates guarantees (e.g., `$O(\log n)$` lookup) to users of a library.

## Definition and Formalism
An algorithm's time cost on input `x` is the number of primitive steps `T(x)` under a chosen **unit-cost** model. For input size `n = |x|`, define:
- **Worst-case:** `T_max(n) = max_{|x|=n} T(x)`
- **Best-case:** `T_min(n) = min_{|x|=n} T(x)`
- **Average-case:** `E[T(x) | |x|=n]` under a distribution over inputs

Asymptotic notation:
- `$O(g(n))$`: upper bound up to constant factors
- `$Ω(g(n))$`: lower bound
- `$Θ(g(n))$`: tight bound; both `$O$` and `$Ω$`

> [!tip]
> When possible, prefer `$Θ(\cdot)$` to communicate tight growth. If only an upper bound is known, use `$O(\cdot)$`, but say why a tighter bound is unknown or unnecessary.

### Cost models
- **RAM model:** Each primitive operation (arithmetic, assignment, comparison, array index) costs `$Θ(1)$`. Memory is word-addressable. Good for most DS&A.
- **Bit model:** Cost reflects operand bit-length. Needed for **big integers**, cryptography, and exact arithmetic.
- **I/O or cache model:** Dominates when memory hierarchy costs overshadow CPU (e.g., external sort). Count **block transfers** rather than primitive ops.

[!example]
**Example (RAM vs bit model):** Adding two `b`-bit integers is `$Θ(1)$` in RAM, but `$Θ(b)$` in the bit model. An algorithm "linear-time" in RAM could be superlinear when numbers grow with `n`.

## Example or Illustration
Consider the following pseudocode:

```pseudo
function F(A):                      // A has length n
    s = 0                           // 1
    for i in 0..n-1:                // n iterations
        s = s + A[i]                // 1 per iter
    return s                        // 1
````

Under the RAM model, `T(n) = 1 + n·1 + 1 = n + 2 = Θ(n)`.

Nested loops:

```pseudo
for i in 0..n-1:
    for j in 0..n-1:
        work()                      // O(1)
```

The inner loop runs `n` times for each `i`: total `n·n = n^2` → `$Θ(n^2)$`.

Triangular loops:

```pseudo
for i in 0..n-1:
    for j in 0..i:
        work()
```

The work count is `Σ_{i=0}^{n-1} (i+1) = n(n+1)/2 = Θ(n^2)`.

Binary search:

```pseudo
lo = 0; hi = n-1
while lo <= hi:
    mid = floor((lo+hi)/2)
    if A[mid] == x: return true
    if A[mid] < x: lo = mid + 1 else hi = mid - 1
return false
```

The interval halves each iteration; iterations `≈ ⌈log₂ n⌉` → `$Θ(\log n)$`.

## Properties and Relationships

### Dominant-term rule

Drop lower-order terms and constant factors.
`3n^2 + 7n + 10` is `$Θ(n^2)$`.
`n log n + 100n` is `$Θ(n \log n)$`.

### Composition and sums

- Sequential composition adds costs: `T(n) = T₁(n) + T₂(n)` → dominated by the larger term.

- Conditional statements take the **maximum** of branch costs for worst-case.


### Recurrences

Many recursive algorithms are captured by a **recurrence relation**. Common patterns:

1. **Halving with constant work (binary search):**
    `$T(n) = T(n/2) + Θ(1) ⇒ T(n) = Θ(\log n)$`.

2. **Divide and conquer with linear merge (merge sort):**
    `$T(n) = 2T(n/2) + Θ(n) ⇒ T(n) = Θ(n \log n)$`.

3. **Quadratic partitioning (naive quicksort worst-case):**
    `$T(n) = T(n-1) + Θ(n) ⇒ T(n) = Θ(n^2)$`.


> See [[recurrence-relations|Recurrence Relations]] and [[recurrences-master-theorem|Recurrences — Master Theorem]] for systematic solutions.

### Master Theorem (quick recall)

For `$T(n) = aT(n/b) + f(n)$` with `a ≥ 1`, `b > 1`:

- If `$f(n) = O(n^{\log_b a - ε})$` → `$T(n) = Θ(n^{\log_b a})$`.

- If `$f(n) = Θ(n^{\log_b a} \log^k n)$` → `$T(n) = Θ(n^{\log_b a} \log^{k+1} n)$`.

- If `$f(n) = Ω(n^{\log_b a + ε})$` and regularity holds → `$T(n) = Θ(f(n))$`.


> [!tip]
> If `f(n)` is close to `n^{\log_b a}`, check the **polylog factor** to pick the right case. When `f` is irregular or the regularity condition fails, use the **Akra–Bazzi** method or a recursion-tree bound.

## Implementation or Practical Context

### Picking the right model

- Use **RAM** for typical in-memory DS&A.

- Switch to **I/O model** for external memory workflows (mergesort on disk, graph analytics on massive data).

- Use **bit complexity** when numbers grow with `n` (big-integer algorithms, exact polynomial arithmetic).


### Micro-costs that matter

Asymptotics ignore constants, but implementations don't:

- **Cache misses** can dominate linear scans vs pointer-chasing (arrays vs linked lists).

- **Branch mispredictions** hurt data-dependent conditionals; branchless variants improve constants.

- **Vectorization** turns many `$Θ(n)$` routines into faster `$Θ(n)$` with smaller constants.

- **Parallelism** changes the wall-clock model: span/work analysis (e.g., fork-join) gives **parallel time** and **work** (`T₁`, `T_∞`).


> [!note]
> For production code, pair a theoretical bound with **empirical profiles** to calibrate constants and memory behavior. Both are necessary for performance work.

### Input-sensitive and parameterized bounds

- Hash tables: expected `$Θ(1)$` ops at low load, but worst-case `$Θ(n)$` under adversarial hashing.

- Graph algorithms: complexity in terms of `n` **and** `m` (edges) is more informative (e.g., BFS in `$Θ(n + m)$`).

- String algorithms: bounds in **pattern length** `m` and **text length** `n` (e.g., KMP `$Θ(n + m)$`).


### Amortized analysis (brief)

Spread the cost of occasional expensive operations over many cheap ones (dynamic arrays, union-find). Use **aggregate**, **accounting**, or **potential** methods to prove `$O(1)$` _amortized_ time.

- Dynamic array `push_back`: occasional resize is `$Θ(n)$`, but average per-push is `$Θ(1)$`.

- Union–Find with path compression + union by rank: sequence of `m` ops on `n` elements in `$Θ(m α(n))$`, where `α` is the inverse Ackermann function (practically ≤ 5).


See [[dynamic-arrays|Dynamic Arrays]] and [[disjoint-set-union-union-find|Disjoint Set Union — Union–Find]].

## Common Misunderstandings

> [!warning]
> **Counting statements literally.** It's unnecessary and brittle. Count _dominant_ operations and use algebra to simplify.

> [!warning]
> **Confusing average with amortized.** Average-case is over a distribution of inputs; amortized is over a _sequence_ of operations for any input.

> [!warning]
> **Ignoring input parameters.** Reporting `$Θ(n)$` when the true bound is `$Θ(n + m)$` hides critical scaling.

> [!warning]
> **Treating `$O(\cdot)$` as equality.** `$O(n)$` includes `$O(1)$`; only `$Θ(n)$` conveys tight growth.

> [!warning]
> **Applying Master Theorem blindly.** It requires regular subproblem sizes and the regularity condition in Case 3. Nonuniform splits, floors/ceilings, or irregular `f(n)` may break it.

## Broader Implications

- **Algorithm engineering:** After asymptotics identify candidates, careful constant-factor tuning, data layout, and parallelization deliver real-world speedups.

- **Scalability budgeting:** Given SLAs and expected `n`, asymptotics define viable regions (e.g., `$Θ(n^2)$` is fine for `n ≤ 1e3` but not for `1e6`).

- **Complexity classes:** Distinct from _computational complexity theory_ (P, NP, etc.). DS&A time complexity is _algorithm-specific_, not class membership.


## Summary

Time complexity analysis abstracts machine details to compare algorithms by **growth rates**. Choose an appropriate **cost model**, perform **dominant-term** simplification for straight-line and loop code, and use **recurrences** for divide-and-conquer. Incorporate **amortized** and **parameterized** analyses when operations or inputs demand it. Pair the theoretical result with empirical profiling and model-aware implementation to ensure performance that holds both **in principle** and **in production**.

## See also

- [[asymptotic-notation|Asymptotic Notation]]

- [[algorithm-efficiency|Algorithm Efficiency]]

- [[recurrence-relations|Recurrence Relations]]

- [[space-complexity|Space Complexity]]
