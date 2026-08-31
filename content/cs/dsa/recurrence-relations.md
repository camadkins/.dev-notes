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
    Guess a bound `T(n) ≤ c · h(n)` and **prove** it [[cs/math/mathematical-induction|by induction]], choosing constants that make the inequality hold. Use for tight proofs, especially with awkward `f(n)` or floors/ceilings.

3. **Master / Akra–Bazzi theorems**
    Provide ready-made asymptotic bounds for `T(n) = ∑ a_i T(n/b_i) + g(n)` under regularity conditions.
    See [[cs/dsa/recurrences-master-theorem|Recurrences - Master Theorem]] for the common `aT(n/b)+f(n)` form and brief notes on Akra–Bazzi (handles multiple subproblem sizes and additive perturbations).


### Linear recurrences with constant coefficients

For `T(n) = α T(n−1) + β T(n−2)`:

- Solve the **characteristic equation** `x^2 − αx − β = 0` with roots `r1, r2`.

- General solution: `T(n) = A r1^n + B r2^n` (or `T(n) = (A + Bn) r^n` for repeated root).

- Determine `A, B` from base cases.


This covers Fibonacci-like growth, geometric decays/growths, and many DP value recurrences.

### Typical growth regimes for `aT(n/b)+f(n)`

Let `p` satisfy `a · (1/b)^p = 1`, i.e., `p = log_b a`. Compare `f(n)` with `n^p`:

- **Subcritical** `f(n) = O(n^{p−ε})`: total dominated by leaves → `T(n) = Θ(n^p)`.

- **Critical** `f(n) = Θ(n^p log^k n)`: extra [[cs/math/logarithms-and-exponentials|logarithmic factor]] → `T(n) = Θ(n^p log^{k+1} n)`.

- **Supercritical** `f(n) = Ω(n^{p+ε})` and regular: combine dominates → `T(n) = Θ(f(n))`.


> [!note]
> The "regularity condition" usually requires `a f(n/b) ≤ c f(n)` for some `c < 1` and large `n` to prevent pathological oscillations. See the Master/Akra–Bazzi page for precise statements.

## Implementation or Practical Context

### Turning a recurrence into code

- **Cutoff thresholds**: Many real sorts (quick/merge/introsort) cut over to [[cs/dsa/insertion-sort|Insertion Sort]] below a small `k` to reduce overhead; this changes base cases and constants but not leading asymptotics.

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

- [[cs/dsa/recurrences-master-theorem|Recurrences - Master Theorem]]

- [[cs/dsa/divide-and-conquer|Divide and Conquer]]

- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]

- [[cs/dsa/dynamic-programming|Dynamic Programming]]

## Sources

- Jeff Erickson, Solving Recurrences (Algorithms appendix II), University of Illinois. https://jeffe.cs.illinois.edu/teaching/algorithms/notes/99-recurrences.pdf . Backs the recursion-tree method exactly as the note describes it: the tree for T(n) = aT(n/b) + f(n) has a^i nodes at depth i each holding f(n/b^i), depth log_b n because n/b^L = 1, and a last level worth Theta(n^{log_b a}), so the total is a geometric series in which only the largest term survives. It also backs the Fibonacci claim, proving inductively that F_n is Theta(phi^n) with phi the golden ratio, and it backs the note's remark that the exact base case does not matter for asymptotics while the domain assumption that n is a power of b can be discharged later.
- Jessica Su, CS 161 Lecture 3, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture3.pdf . Backs the substitution method as guess-then-prove-by-induction, with its two warnings: you can accidentally prove a weaker bound than the true one, and you must prove the exact form of the induction hypothesis rather than a slightly looser one. It backs the note's floors-and-ceilings guidance by citing the CLRS result that replacing T(n/b) with the floored or ceilinged version does not change asymptotic behavior, and it backs the Master Theorem caveat: the three cases are not exhaustive, since f(n) can be asymptotically larger than n^{log_b a} without being polynomially larger, as with f(n) = n log n against n^{log_b a} = n.
- Recursion Trees and the Master Method, Cornell CS 3110 Lecture 20 (Spring 2012). https://www.cs.cornell.edu/courses/cs3110/2012sp/lectures/lec20-master/lec20.html . Backs the three growth regimes named subcritical, critical and supercritical here: all work at the leaves when f is polynomially smaller, the same order of work at every level when f matches, and domination by the root when f is polynomially larger, with the extra condition a*f(n/b) <= c*f(n) needed for the last one.
- Master theorem (analysis of algorithms), Wikipedia. https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29 . Backs the note's parenthetical statement of the regularity condition with its exact constant requirement: a*f(n/b) <= k*f(n) for some k < 1 and all sufficiently large n. It also backs the critical case with the polylog factor, f(n) = Theta(n^p (log n)^k) giving T(n) = Theta(n^p (log n)^{k+1}) for k >= 0.
- Akra-Bazzi method, Wikipedia. https://en.wikipedia.org/wiki/Akra%E2%80%93Bazzi_method . Backs the claim that Akra-Bazzi is the generalization to handle multiple subproblem sizes and additive perturbations, solving for p in the sum of a_i * b_i^p = 1 under stated regularity conditions on g and the perturbation terms h_i.
- Linear recurrence with constant coefficients, Wikipedia. https://en.wikipedia.org/wiki/Linear_recurrence_with_constant_coefficients . Backs the characteristic-equation section verbatim in substance: for a second-order homogeneous recurrence the roots of the characteristic polynomial give the general solution C*r1^n + D*r2^n when the roots are distinct and C*r^n + D*n*r^n when they coincide, with the two constants fixed by the initial conditions.
- Recurrence relation, Wikipedia. https://en.wikipedia.org/wiki/Recurrence_relation . Backs the taxonomy in the Definition section: linear recurrences with constant coefficients, the homogeneous against non-homogeneous split, and the role of initial conditions in pinning down a particular solution, with Fibonacci as the canonical second-order homogeneous case.
- CS800 Theory of Algorithms, week 2 notes, Rochester Institute of Technology. https://www.cs.rit.edu/~cmh/cs800/week2.pdf . Backs the substitution-proof tip about negative slack: when the plain guess fails to go through, you strengthen the inductive hypothesis by subtracting a low-order term, assuming T(k) <= c1*k^2 - c2*k so that the leftover work is absorbed, which is the same manoeuvre as the note's guess of c*n*log(n) - c'*n.
- Strassen algorithm, Wikipedia. https://en.wikipedia.org/wiki/Strassen_algorithm . Backs the Strassen row: seven multiplications instead of eight on half-size blocks give O(n^{log_2 7}), approximately n^2.807.
- Merge sort, Wikipedia. https://en.wikipedia.org/wiki/Merge_sort . Backs the merge sort recurrence and its Theta(n log n) solution.
- Binary search, Wikipedia. https://en.wikipedia.org/wiki/Binary_search . Backs the binary search recurrence and its logarithmic solution.
- Dynamic programming, Wikipedia. https://en.wikipedia.org/wiki/Dynamic_programming . Backs the memoization point in the Implementation section and its matching misunderstanding: the naive recursive Fibonacci recomputes overlapping subproblems and runs in exponential time, while memoizing the same recursion brings it to O(n) time at O(n) space, so the recurrence alone does not fix the algorithm's complexity.
- Analysis of parallel algorithms, Wikipedia. https://en.wikipedia.org/wiki/Analysis_of_parallel_algorithms . Backs the parallelism entry: work and span are analyzed separately, the span being the critical path length that bounds achievable running time from below.
- Introsort, Wikipedia. https://en.wikipedia.org/wiki/Introsort . Backs the cutoff-threshold claim, that practical sorts switch to insertion sort below a small element count, which changes base cases and constants without moving the leading asymptotics.
