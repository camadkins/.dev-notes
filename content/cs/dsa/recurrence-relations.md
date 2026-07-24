---
title: Recurrence Relations
description: Equations that define sequences via earlier terms; foundational for analyzing divide-and-conquer and dynamic-programming running times.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-29
aliases: []

---

## Overview

A **recurrence relation** specifies a sequence by expressing each term as a function of earlier terms. In algorithms, recurrences model **running time**, **work**, or **number of subproblems** as input size changes (e.g., halving in divide-and-conquer or subtracting a constant in iterative algorithms). Solving or **bounding** recurrences yields asymptotic costs like `O(n log n)` for merge sort or `O(log n)` for binary search.

This note surveys common recurrence forms, solution techniques (recursion trees, substitution/induction, characteristic equations), and practical guidance for using them to analyze algorithms.

> [!note]
> There are two broad flavors in CS notes:
>
> - **Cost recurrences** (e.g., `T(n) = a T(n/b) + f(n)`): model time or work.
>
> - **Value recurrences** (e.g., `F(n) = F(n−1) + F(n−2)`): define combinatorial sequences or DP states.
>     Techniques overlap but have different standard tools.
>

## Motivation

When an algorithm **reduces** a problem into **subproblems** and combines solutions, its cost naturally depends on the cost of those subproblems. Recurrences encode this relationship:

- **Divide-and-conquer**: split size `n` into `a` subproblems each of size `n/b`, do combine work `f(n)`.

- **Incremental**: reduce `n` by a constant (`n → n−1`), add a per-step cost.

- **Exponential branching**: make choices at each step (backtracking/DFS), yielding `T(n) = T(n−1) + T(n−2)` or similar.


They also appear in **dynamic programming**, where the value of a state depends on previously computed states.

## Definition and Formalism

A recurrence for a sequence `{T(n)}` is an equation of the form

- **Linear, homogeneous with constant coefficients**:

    - `T(n) = c1 T(n−1) + c2 T(n−2) + … + ck T(n−k)` with `T(0..k-1)` given.

- **Non-homogeneous** (adds a function):

    - `T(n) = c1 T(n−1) + … + ck T(n−k) + g(n)`.

- **Divide-and-conquer** (multiplicative + additive):

    - `T(n) = a T(⌈n/b⌉) + f(n)` for integers `a ≥ 1, b > 1`.


**Base cases** pin down small inputs: `T(1)`, `T(0)`, or `T(n0)` for a threshold `n0`.

> [!tip]
> Always **state base cases and domains** (e.g., "assume `n` is a power of `b`" or "solve for `n ≥ 1` and extend with floors/ceilings"). Missing base cases cause incorrect constants or off-by-one mistakes.

## Example or Illustration

### Classic algorithms → recurrences

- **Merge sort**: `T(n) = 2T(n/2) + Θ(n)` → `T(n) = Θ(n log n)`.

- **Binary search**: `T(n) = T(n/2) + Θ(1)` → `T(n) = Θ(log n)`.

- **Strassen (matrix multiply)**: `T(n) = 7T(n/2) + Θ(n^2)` → `T(n) = Θ(n^{log₂7}) ≈ Θ(n^{2.807})`.

- **Insertion sort (worst-case)**: `T(n) = T(n−1) + Θ(n)` → `T(n) = Θ(n^2)` by summation.

- **Balanced tree height**: `H(n) = H(⌊n/2⌋) + 1` → `H(n) = Θ(log n)`.

## Properties and Relationships

### Three canonical solution methods

1. **Recursion tree / expansion**
    Repeatedly expand the recurrence to visualize the work per level and sum a series. Great for intuition and quick upper/lower bounds.

2. **Substitution (a.k.a. induction) method**
    Guess a bound `T(n) ≤ c · h(n)` and **prove** it by induction, choosing constants that make the inequality hold. Use for tight proofs, especially with awkward `f(n)` or floors/ceilings.

3. **Master / Akra–Bazzi theorems**
    Provide ready-made asymptotic bounds for `T(n) = ∑ a_i T(n/b_i) + g(n)` under regularity conditions.
    See [[recurrences-master-theorem|Recurrences - Master Theorem]] for the common `aT(n/b)+f(n)` form and brief notes on Akra–Bazzi (handles multiple subproblem sizes and additive perturbations).


### Linear recurrences with constant coefficients

For `T(n) = α T(n−1) + β T(n−2)`:

- Solve the **characteristic equation** `x^2 − αx − β = 0` with roots `r1, r2`.

- General solution: `T(n) = A r1^n + B r2^n` (or `T(n) = (A + Bn) r^n` for repeated root).

- Determine `A, B` from base cases.


This covers Fibonacci-like growth, geometric decays/growths, and many DP value recurrences.

### Typical growth regimes for `aT(n/b)+f(n)`

Let `p` satisfy `a · (1/b)^p = 1`, i.e., `p = log_b a`. Compare `f(n)` with `n^p`:

- **Subcritical** `f(n) = O(n^{p−ε})`: total dominated by leaves → `T(n) = Θ(n^p)`.

- **Critical** `f(n) = Θ(n^p log^k n)`: extra logarithmic factor → `T(n) = Θ(n^p log^{k+1} n)`.

- **Supercritical** `f(n) = Ω(n^{p+ε})` and regular: combine dominates → `T(n) = Θ(f(n))`.


> [!note]
> The "regularity condition" usually requires `a f(n/b) ≤ c f(n)` for some `c < 1` and large `n` to prevent pathological oscillations. See the Master/Akra–Bazzi page for precise statements.

## Implementation or Practical Context

### Turning a recurrence into code

- **Cutoff thresholds**: Many real sorts (quick/merge/introsort) cut over to [[insertion-sort|Insertion Sort]] below a small `k` to reduce overhead; this changes base cases and constants but not leading asymptotics.

- **Memoization vs naive recursion**: For value recurrences like `F(n)=F(n−1)+F(n−2)`, naive recursion is `Θ(φ^n)`, but memoization or bottom-up DP solves it in `Θ(n)`. The **recurrence doesn't fix the algorithm's complexity**; implementation choices do.

- **Parallelism**: If `a` subproblems are independent, a **span** (critical path) recurrence `S(n) = S(n/b) + polylog(n)` may be much smaller than total work `T(n)`. Analyze **work** and **span** separately for parallel algorithms.


### Workflow for analyzing a new algorithm

1. **Write the clean recurrence** (state base cases, assume smooth sizes).

2. **Sanity-check bounds** by plugging in extremes:

    - If all combine work vanished (`f(n)=0`), does `T(n)` drop to leaf cost `Θ(n^{log_b a})`?

    - If no subproblems (`a=0`), does `T(n)` equal pure `f(n)`?

3. **Pick a method**:

    - Recursion tree for a quick picture,

    - Master/Akra–Bazzi for standard forms,

    - Substitution for custom `f(n)` or when regularity is unclear.

4. **Repair floors/ceilings** with slack (replace `n/b` by `⌈n/b⌉` and absorb constants).

5. **Document assumptions** (e.g., `n` a power of `b`, `f` monotone), then remove them with padding or monotonicity arguments.


> [!tip]
> In substitution proofs, include a **negative slack** like `−c'n` in your guess to absorb rounding and base-case noise: e.g., guess `T(n) ≤ c n log n − c'n`. This often makes the inequality go through.

## Common Misunderstandings

> [!warning]
> **Confusing value vs cost recurrences.** `F(n)=F(n−1)+F(n−2)` describes a **value**. The **time** for naive recursion follows a different recurrence `T(n)=T(n−1)+T(n−2)+O(1)` (exponential). Don't conflate them.

> [!warning]
> **Ignoring base cases.** Choosing `T(1)=Θ(1)` vs `T(2)=Θ(1)` changes constants and can shift small-`n` behavior, affecting where a hybrid algorithm should switch strategies.

> [!warning]
> **Overusing the Master Theorem.** It doesn't apply to every `f(n)` (e.g., non-polynomial oscillations, negative terms) or to multiple distinct subproblem sizes unless generalized (Akra–Bazzi).

> [!warning]
> **Forgetting floors/ceilings.** Proofs assuming `n` divisible by `b` must be patched; otherwise the bound may fail at boundary sizes.

> [!warning]
> **Assuming tightness from a single bound.** A recursion tree can give an upper bound; you still need a matching lower bound (or a theorem guaranteeing tightness) for `Θ(·)`.

## Broader Implications

Recurrences tie algorithm **structure** to **asymptotic behavior**. Better splits or cheaper combine steps translate into provable improvements (`a`, `b`, and `f(n)` shape). They also clarify **engineering trade-offs**:

- Changing pivot selection in quicksort alters the **distribution** of subproblem sizes (affecting the expected recurrence).

- Introducing **cutoffs** and **cache-aware merges** modifies `f(n)` and base cases, explaining empirical speedups without changing `Θ` class.

- For **parallel** algorithms, distinguishing **work** vs **span** recurrences guides depth-first scheduling and grain size.

## Summary

Recurrence relations are the lingua franca for analyzing recursive and incremental algorithms. For `aT(n/b)+f(n)`, compare `f(n)` with `n^{log_b a}` to classify regimes; use recursion trees for intuition, substitution for rigorous bounds, and Master/Akra–Bazzi when applicable. For linear constant-coefficient value recurrences, solve via characteristic equations. Always state base cases, handle floors/ceilings, and document assumptions. With these tools, you can translate algorithm structure directly into asymptotic performance guarantees.

## Related Notes

- [[recurrences-master-theorem|Recurrences - Master Theorem]]

- [[divide-and-conquer|Divide and Conquer]]

- [[time-complexity-analysis|Time Complexity Analysis]]

- [[dynamic-programming|Dynamic Programming]]
