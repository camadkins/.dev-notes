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
aliases: []

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

If `f(n)` equals `n^p` times **polylogarithms**, you're in **Case 2**. Extra `log^k n` becomes `log^{k+1} n` in `T(n)`. Non-integer `k` and iterated logs can appear; treat them as slowly varying factors attached to `n^p`.

### Floors, ceilings, and powers of `b`

Analyses often assume `n` is a power of `b` to remove rounding. You can repair this at the end using monotonicity or a constant-factor slack in substitution proofs.

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

- **Cutoffs** change base cases, not `Θ(·)`: switching to [[insertion-sort|Insertion Sort]] for small subarrays alters constants.

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
> - Quick Sort (median-of-three, good pivots expected): `T(n/2)+T(n/2)+Θ(n)` → effectively the same form with random balance → `n log n` expected, but worst-case not guaranteed unless introspective fallback is added (see [[heapsort|Heapsort]]).
>

## Summary

To analyze `T(n)=aT(n/b)+f(n)`:

1. compute `p=log_b(a)`,

2. compare `f(n)` with `n^p`,

3. choose Case 1/2/3 (checking **regularity** for Case 3), and

4. patch details with substitution as needed.
    For unequal subproblem sizes or extra additive terms, apply **Akra–Bazzi**. Document base cases, assumptions on `n`, and any polylog factors clearly to avoid common errors.


## Related Notes

- [[recurrence-relations|Recurrence Relations]]

- [[recurrences-master-theorem|Recurrences - Master Theorem]]

- [[divide-and-conquer|Divide and Conquer]]

- [[time-complexity-analysis|Time Complexity Analysis]]
