---

title: Recurrences & the Master Theorem
description: How to set up divide-and-conquer recurrences T(n)=aT(n/b)+f(n) and apply the Master (and Akra–Bazzi) cases safely.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-21
aliases:
  - Driving Function
  - Master Theorem
---

## Overview

Many divide-and-conquer algorithms have running times captured by a recurrence of the form
`T(n) = a · T(n/b) + f(n)`
where:

- `a ≥ 1` is the number of subproblems,

- `b > 1` is the factor by which the problem size shrinks, and

- `f(n)` is the non-recursive work (divide + combine + overhead).


The **Master Theorem** gives quick asymptotics by comparing `f(n)` with `n^p`, where `p = log_b(a)`. This page is a practical guide: how to identify `(a, b, f)`, choose the right case, avoid common pitfalls, and know when to switch to the more general **Akra–Bazzi** framework.

> [!note]
> Always state **base cases** (e.g., `T(1)=Θ(1)`) and the **domain** (`n ≥ 1`, often assuming `n` is a power of `b` during analysis). Constants and small-`n` thresholds do not change the leading asymptotics but matter in implementations.

## Motivation

The Master Theorem saves time. Instead of expanding or proving bounds from scratch, you classify `f(n)` relative to `n^p` and read off `T(n)`:

- If recursive work dominates, `T(n)` behaves like the total work at the **leaves**.

- If combine work matches the tree's "surface area", a **log factor** appears.

- If combine work dominates, `T(n)` follows `f(n)` itself, provided it is **regular** enough.


> [!example]
> **Fast examples**
>
> - Merge sort: `a=2, b=2, f(n)=Θ(n)` → `p=1` and `f(n)=Θ(n^p)` → `Θ(n log n)`.
>
> - Binary search: `a=1, b=2, f(n)=Θ(1)` → `p=0` and `f(n)=Θ(n^0)` → `Θ(log n)`.
>
> - Strassen: `a=7, b=2, f(n)=Θ(n^2)` → `p=log₂7≈2.807` and `f(n)=O(n^{p−ε})` → `Θ(n^p)`.
>

## Definition and Formalism

Let `p = log_b(a)`. Compare `f(n)` to `n^p`:

**Case 1 (subcritical).** If `f(n) = O(n^{p−ε})` for some `ε>0`, then
`T(n) = Θ(n^p)`.

**Case 2 (critical).** If `f(n) = Θ(n^p · (log n)^k)` for some `k ≥ 0`, then
`T(n) = Θ(n^p · (log n)^{k+1})`.

**Case 3 (supercritical).** If `f(n) = Ω(n^{p+ε})` for some `ε>0` and **regularity** holds, then
`T(n) = Θ(f(n))`.

Regularity (one common form): there exists `c < 1` and `n0` such that
`a · f(n/b) ≤ c · f(n)` for all `n ≥ n0`.
This ensures `f(n)` doesn't oscillate wildly and truly dominates the recursion tree.

> [!tip]
> For quick comparisons, reduce `f(n)` to `n^α (log n)^k` when possible and compare `α` with `p`. Logs only matter on the **boundary** (Case 2).

## Example or Illustration

**Recursion tree intuition**:

- Level `i` has `a^i` subproblems of size `n/b^i`.

- Per-level cost is `a^i · f(n/b^i)`.

- The depth is `≈ log_b n`. Summing these terms yields the three regimes.


**Worked mini-catalog**

1. `T(n)=3T(n/2)+n` → `p=log₂3≈1.585`. Here `f(n)=n = n^{1} = O(n^{p−ε})` with `ε≈0.585` → **Case 1** → `Θ(n^{log₂3})`.

2. `T(n)=2T(n/2)+n` → `p=1`, `f(n)=n = n^p` → **Case 2 (k=0)** → `Θ(n log n)`.

3. `T(n)=T(n/2)+n` → `p=0`, `f(n)=n = Ω(n^{0+ε})` and regular → **Case 3** → `Θ(n)`.

4. `T(n)=4T(n/2)+n^2` → `p=2`, `f(n)=n^2 = n^p` → **Case 2 (k=0)** → `Θ(n^2 log n)`.

## Properties and Relationships

### Picking `(a, b, f)` correctly

- `a`: count the **independent** recursive calls of equal size (for unequal sizes, see Akra–Bazzi).

- `b`: size reduction factor (`n/b` per child). If you split off **k** elements and recurse on `n−k`, this is **not** a Master form.

- `f(n)`: all non-recursive work, including partitioning, merging, or overhead. Include any **linearization costs** (e.g., copying buffers).


### Logs and polylog factors

If `f(n)` equals `n^p` times **[[cs/math/logarithms-and-exponentials|polylogarithms]]**, you're in **Case 2**. Extra `log^k n` becomes `log^{k+1} n` in `T(n)`. Non-integer `k` and iterated logs can appear; treat them as slowly varying factors attached to `n^p`.

### Floors, ceilings, and powers of `b`

Analyses often assume `n` is a power of `b` to remove rounding. You can repair this at the end using monotonicity or a constant-factor slack in [[cs/math/mathematical-induction|substitution proofs]].

> [!note]
> For `T(n)=aT(⌊n/b⌋)+f(n)`, replacing `⌊n/b⌋` by `n/b` affects only constants. The asymptotic case classification remains valid.

### When Master doesn't apply

- **Multiple distinct subproblem sizes**: `T(n)=T(n/2)+T(n/3)+f(n)`.

- **Additive perturbations** with nontrivial weight: `T(n)=aT(n/b)+T(n/d)+f(n)`.

- **Irregular/oscillatory** `f(n)` that violates regularity.


Use **Akra–Bazzi** instead.

## Implementation or Practical Context

### How to apply (checklist)

1. **Isolate** the recurrence in the `a, b, f` form; if not, consider Akra–Bazzi or another method.

2. **Compute** `p = log_b(a)`.

3. **Compare** `f(n)` with `n^p`:

    - If `f(n) = n^{p−ε} · polylog`, it's **Case 1**.

    - If `f(n) = n^{p} · (log n)^k`, it's **Case 2**.

    - If `f(n) = n^{p+ε} · polylog`, check **regularity** → **Case 3**.

4. **State base cases** and thresholds (`n ≤ n0`) explicitly.

5. **Patch** floors/ceilings and small `n` with a substitution proof if needed.


> [!tip]
> For Case 3, verify a monotonic **decay**: `a·f(n/b)/f(n) ≤ c < 1` for large `n`. For simple polynomials and logs, this check is quick.

### Akra–Bazzi (one-paragraph primer)

For recurrences of the form
`T(x) = Σ_{i=1..k} a_i · T(b_i x + h_i(x)) + g(x)`,
with `a_i > 0`, `0 < b_i < 1`, and small perturbations `h_i(x)`, find `p` solving
`Σ a_i b_i^p = 1`. Then, under mild regularity,
`T(x) = Θ( x^p · (1 + ∫_1^x (g(u)/u^{p+1}) du) )`.
This generalizes the Master Theorem to unequal child sizes and extra additive terms.

**Quick use cases**

- `T(n)=T(n/2)+T(n/3)+n` → Solve `(1/2)^p + (1/3)^p = 1` (numerically `p≈0.787…`), compare `g(n)=n` to `n^p` → **supercritical** → `Θ(n)`.


### Engineering implications

- **Cutoffs** change base cases, not `Θ(·)`: switching to [[cs/dsa/insertion-sort|Insertion Sort]] for small subarrays alters constants.

- **Cache-aware merges/partitions** adjust `f(n)`: e.g., merging with blocked buffers can move `f(n)` from `n` to `n + lower-order terms`, keeping the same case but improving constants.

- **Parallel analysis**: distinguish **work** `T(n)` vs **span** `S(n)`; span often satisfies `S(n)=S(n/b)+polylog(n)` while work follows `aT(n/b)+f(n)`.


## Common Misunderstandings

> [!warning]
> **Forgetting regularity in Case 3.** Claiming `T(n)=Θ(f(n))` without checking `a·f(n/b) ≤ c·f(n)` is a frequent mistake.

> [!warning]
> **Using Master for non-master forms.** Recurrences like `T(n)=T(n−1)+T(n−2)` (backtracking) or `T(n)=T(n/2)+T(n/2−1)+n` don't fit; use other tools (characteristic equations, Akra–Bazzi, or substitution).

> [!warning]
> **Off-by-one logs.** In Case 2, `f(n)=Θ(n^p log^k n)` yields `Θ(n^p log^{k+1} n)`. Missing the `+1` is common.

> [!warning]
> **Hiding heavy costs in `f(n)`.** Don't drop linearization/copying costs (e.g., buffer allocations) from `f(n)`; it changes the case.

## Broader Implications

The Master Theorem connects **algorithm structure** to **asymptotic behavior**:

- Improving pivot selection or branching factor changes `a` and shifts `p = log_b a`.

- Smarter combination work changes `f(n)` and can move a recurrence across the Case 1/2/3 boundaries.

- In **hybrid** algorithms (e.g., introsort), fallbacks and cutoffs reshape base cases and ensure worst-case guarantees without changing average-case regimes.


> [!example]
> **Compare two sorts**
>
> - Merge Sort: `2T(n/2) + n` → Case 2 → `n log n` (stable, extra space).
>
> - Quick Sort (median-of-three, good pivots expected): `T(n/2)+T(n/2)+Θ(n)` → effectively the same form with random balance → `n log n` expected, but worst-case not guaranteed unless introspective fallback is added (see [[cs/dsa/heapsort|Heapsort]]).
>

## Summary

To analyze `T(n)=aT(n/b)+f(n)`:

1. compute `p=log_b(a)`,

2. compare `f(n)` with `n^p`,

3. choose Case 1/2/3 (checking **regularity** for Case 3), and

4. patch details with substitution as needed.
    For unequal subproblem sizes or extra additive terms, apply **Akra–Bazzi**. Document base cases, assumptions on `n`, and any polylog factors clearly to avoid common errors.


## Related Notes

- [[cs/dsa/recurrence-relations|Recurrence Relations]]

- [[cs/dsa/recurrences-master-theorem|Recurrences - Master Theorem]]

- [[cs/dsa/divide-and-conquer|Divide and Conquer]]

- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]

## Sources

- Master theorem (analysis of algorithms), Wikipedia. https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29 . Backs all three cases as stated here and, critically, states the regularity condition itself rather than merely gesturing at it: if a*f(n/b) <= k*f(n) for some constant k < 1 and all sufficiently large n, a condition the page names the regularity condition, then the total is dominated by the splitting term and T(n) = Theta(f(n)). It also gives Case 2 in the polylog form the note uses, f(n) = Theta(n^{c_crit} (log n)^k) for k >= 0 yielding T(n) = Theta(n^{c_crit} (log n)^{k+1}), and it carries a worked recurrence that meets the Case 3 growth requirement but violates regularity, which is the note's Common Misunderstandings warning made concrete.
- Jessica Su, CS 161 Lecture 3, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture3.pdf . Backs the Case 3 checklist step by working the regularity check as an arithmetic exercise: for T(n) = 3T(n/4) + n log n it states that Case 3 applies only if a*f(n/b) <= c*f(n) for some c < 1 and all sufficiently large n, then exhibits c = 3/4. It also backs the note's framing of the theorem (a >= 1, b > 1, f asymptotically positive), the point that the cases are not exhaustive because f can exceed n^{log_b a} without exceeding it polynomially, and the floors-and-ceilings claim, citing the CLRS result that replacing n/b with its floor or ceiling leaves the asymptotics alone.
- Recursion Trees and the Master Method, Cornell CS 3110 Lecture 20 (Spring 2012). https://www.cs.cornell.edu/courses/cs3110/2012sp/lectures/lec20-master/lec20.html . Backs the recursion-tree intuition section line for line: the tree has branching factor a, level i costs a^i * f(n/b^i), there are log_b n levels and a^{log_b n} = n^{log_b a} leaves, and the three regimes follow from comparing the growth of f with the growth of the leaf count. It states the same side condition on Case 3, a*f(n/b) <= c*f(n) for constant c and large n, and it works T(n) = 4T(n/2) + n^2 to Theta(n^2 log n), which is the note's fourth mini-catalog entry.
- Akra-Bazzi method, Wikipedia. https://en.wikipedia.org/wiki/Akra%E2%80%93Bazzi_method . Backs the primer paragraph in full: the recurrence form with several a_i and b_i plus perturbations h_i, the requirement that p solve the sum of a_i * b_i^p = 1, and the result T(x) = Theta(x^p * (1 + the integral from 1 to x of g(u)/u^{p+1} du)) under the stated regularity conditions. It also backs the claim that this is the tool for unequal child sizes and extra additive terms.
- Merge sort, Wikipedia. https://en.wikipedia.org/wiki/Merge_sort . Backs the merge sort entry in the fast-examples callout and the sort comparison, two subproblems of half size with linear merging giving Theta(n log n), stable, with extra space.
- Binary search, Wikipedia. https://en.wikipedia.org/wiki/Binary_search . Backs the binary search entry, one subproblem of half size with constant work giving logarithmic time.
- Strassen algorithm, Wikipedia. https://en.wikipedia.org/wiki/Strassen_algorithm . Backs the Strassen entry, seven half-size multiplications giving O(n^{log_2 7}), approximately n^2.807, against the naive n^3.
- Introsort, Wikipedia. https://en.wikipedia.org/wiki/Introsort . Backs the hybrid-algorithm claim in Broader Implications and the heapsort fallback mentioned in the sort comparison: introsort runs quicksort, switches to heapsort past a recursion-depth bound derived from log of the element count, and switches to insertion sort below a small threshold, which is how the worst-case guarantee is bought without giving up typical speed.
- Quicksort, Wikipedia. https://en.wikipedia.org/wiki/Quicksort . Backs the caveat attached to the quicksort row: good pivots give expected n log n, but the worst case stays quadratic unless an introspective fallback is added.
- Locality of reference, Wikipedia. https://en.wikipedia.org/wiki/Locality_of_reference . Backs the engineering claim that blocked or cache-aware merges change constants through better use of contiguous access without moving the recurrence into a different case.
- Analysis of parallel algorithms, Wikipedia. https://en.wikipedia.org/wiki/Analysis_of_parallel_algorithms . Backs the parallel-analysis bullet distinguishing work from span, span being the critical path length that determines the shortest achievable execution time.
