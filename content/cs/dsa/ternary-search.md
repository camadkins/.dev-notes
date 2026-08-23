---
title: Ternary Search
description: Unimodal optimization by shrinking the search interval using two interior probes per iteration.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-16
aliases: []
---

## Overview
**Ternary search** is a [[cs/math/convexity-and-optimization-basics|1-D optimization technique]] for **unimodal** functions - those that **strictly increase then strictly decrease** (for maxima) or the reverse for minima - on a **closed interval**. Each iteration evaluates at **two interior points** and discards the third of the interval that cannot contain the optimum, shrinking the window deterministically. It is [[cs/math/derivatives-and-gradients|derivative-free]], simple, and numerically robust when the objective is smooth and unimodal.

There are two closely related settings:

- **Continuous domain**: maximize (or minimize) a real-valued function `f(x)` on `[l, r]` by repeatedly comparing `f(m1)` vs `f(m2)` for two interior trisection points.
- **Discrete domain (arrays)**: locate the **peak** of a unimodal array `A[0..n-1]`. While often presented as "ternary," the tight, branch-minimizing routine uses **binary-style** mid/neighbor comparisons. Both fit the same **divide-and-conquer** pattern.

> [!note]
> Unimodality is the key precondition. Without it, ternary search gives no correctness guarantees.

## Core Idea
In a unimodal function, comparing the values at two ordered points `m1 < m2` tells you **which side the maximum lies on**:

- If `f(m1) < f(m2)`, the maximum cannot be left of `m1`; keep `[m1, r]`.
- If `f(m1) > f(m2)`, the maximum cannot be right of `m2`; keep `[l, m2]`.
- If `f(m1) == f(m2)` under exact arithmetic, the maximum lies in `[m1, m2]`.

This **rules out one third** of the interval each iteration and preserves unimodality on the remaining subinterval. For minimization, flip the inequalities (or search on `-f`).

## Algorithm Steps / Pseudocode

### A) Continuous ternary search (maximize `f` on `[l, r]`)
```pseudo
function TERNARY_MAX(f, l, r, eps):
    // Precondition: f is unimodal on [l, r]
    while r - l > eps:
        m1 = l + (r - l) / 3.0
        m2 = r - (r - l) / 3.0
        if f(m1) < f(m2):
            l = m1                // max in [m1, r]
        else:
            r = m2                // max in [l, m2]
    x_star = (l + r) / 2.0
    return x_star                 // approx argmax; f(x_star) is near max
```

- `eps` is the stopping window. For doubles, a typical choice is `eps ≈ 1e-9` or scaled to `r - l`.

- For **minimization**, reverse the comparison.

### B) Discrete unimodal array (peak index)

```pseudo
function PEAK_UNIMODAL(A):         // A increases then decreases (strict)
    lo = 0
    hi = len(A) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if A[mid] < A[mid + 1]:
            lo = mid + 1          // rising: peak right of mid
        else:
            hi = mid               // falling: peak at/before mid
    return lo                      // index of maximum element
```

- Uses **one** comparison per round against the neighbor - more efficient than evaluating at two trisection points.

- Works with plateaus if you extend the logic to handle `<=` vs `>=` consistently.

> [!tip]
> For discrete search, prefer the neighbor-comparison routine. For continuous problems, the **golden-section search** is often more evaluation-efficient than naive ternary (see _Optimizations or Variants_).

## Example or Trace

**Continuous:** Maximize `f(x) = -(x - 2)^2 + 5` on `[0, 5]` with `eps = 0.01`.

1. `m1 = 5/3 ≈ 1.667`, `m2 = 10/3 ≈ 3.333`. `f(m1)=4.778`, `f(m2)=4.778` → keep `[1.667, 3.333]`.

2. New `m1 ≈ 2.222`, `m2 ≈ 2.778`. `f(m1)=4.938`, `f(m2)=4.938` → keep `[2.222, 2.778]`.

3. Continue until `r - l ≤ 0.01`; result approaches `x* = 2`.

**Discrete:** `A = [1, 3, 7, 12, 11, 8, 4]`

- `lo=0, hi=6, mid=3, A[3]=12, A[4]=11` → falling → `hi=3`

- `lo=0, hi=3, mid=1, A[1]=3, A[2]=7` → rising → `lo=2`

- `lo=2, hi=3, mid=2, A[2]=7, A[3]=12` → rising → `lo=3`

- Return `3` (value `12`), the peak.

## Complexity Analysis

- **Continuous ternary search:**

    - After `k` iterations, interval length is `(2/3)^k (r0 - l0)`.
        To stop at window `eps`: `k ≥ log((r0 - l0)/eps) / log(3/2)`.
        Each iteration evaluates `f` **twice** (but you can reuse one evaluation across iterations by carrying `f(m2)` forward), so time is `O(k)` evaluations.

    - Space `O(1)`.

- **Discrete peak finding:**

    - Each step halves the interval: `O(log n)` comparisons.

    - Space `O(1)`.

> [!note]
> In floating-point, the arithmetic cost per iteration is negligible relative to **function evaluation** time. Choose the variant that minimizes **calls to `f`**.

## Optimizations or Variants

- **Golden-section search (continuous):** Uses a fixed ratio `φ = (√5 − 1)/2` to place interior points. With careful reuse, it needs **one new evaluation per iteration** vs. two in naive ternary, while achieving the same convergence factor. Prefer it when `f` is expensive to evaluate.

- **Parabolic interpolation (Brent's method):** Blends golden-section steps with quadratic fits to accelerate on smooth functions, with reliable fallbacks - often the default in numerical libraries.

- **Plateaus & non-strict unimodality:** If `f(m1) ≈ f(m2)` within tolerance, keep the **middle third** `[m1, m2]` to avoid discarding the maximizer.

- **Integer domains:** Terminate when `r - l ≤ 2`, then brute-check the remaining 2-3 points to avoid round-off misclassification.

- **Derivative information (optional):** If you can compute `f'`, a bracketed **ternary** can be replaced by bisection on `f'`'s sign change or by **Newton** once close - faster but requires smoothness and care.

> [!tip]
> Cache `f(m2)` from the previous round: after narrowing, one of the new trisection points coincides with a prior point. This reduces to **one fresh evaluation per iteration**, similar in spirit to golden-section.

## Applications

- **Tuning single parameters** when the score curve is unimodal (e.g., threshold selection, temperature scaling).

- **Black-box optimization** with a unimodal objective and no derivatives (calibration, A/B hyper-sweeps on a constrained range).

- **Array problems**: finding a **peak** in bitonic sequences; solving "maximize/minimize" of discrete unimodal cost functions (e.g., convex cost on integers, by searching on `-cost`).

## Common Pitfalls or Edge Cases

> [!warning]
> **Not actually unimodal.** Multiple local optima break the guarantee; the algorithm may converge to a non-global extremum.

> [!warning]
> **Floating-point ties & noise.** With noisy `f`, `f(m1) < f(m2)` may flip unpredictably. Add a **tolerance**: treat values within `τ` as equal; shrink to the middle third.

> [!warning]
> **Termination too early/late.** Set `eps` relative to the scale of `[l, r]` and the curvature of `f`. For integers, prefer a small fixed **count of iterations** (e.g., 60) or a final local brute-check.

> [!warning]
> **Endpoint optima.** Unimodal guarantees allow the maximizer at an endpoint. Always track the **best seen** value, and compare endpoints on exit.

## Implementation Notes or Trade-offs

- **Function evaluation cost dominates.** If `f` is expensive, prioritize variants that **reuse** evaluations or switch to **golden-section**.

- **Robustness:** Normalize the interval so `l ≤ r` and guard against NaNs from `f`. If `f` throws or fails on some inputs, add feasibility checks before comparing.

- **Vectorization:** If you can evaluate `f` at many points cheaply (e.g., batched inference), consider **coarse sampling** to bracket the peak, then refine with ternary.

- **Discrete vs continuous choice:** For arrays, the neighbor-comparison method is strictly better (fewer evaluations, simpler code). Reserve continuous ternary for real intervals.

## Summary

Ternary search is a clean **divide-and-conquer** routine for **unimodal** objectives. In the **continuous** case, it shrinks the interval by a factor of `2/3` per iteration using two interior probes; in the **discrete** case, a binary-style mid/neighbor comparison isolates the peak in `O(log n)`. Its effectiveness depends on unimodality, careful termination, and, for numeric work, tolerance to [[cs/standards/ieee-754-floating-point|floating-point]] ties and noise. For evaluation-heavy objectives, prefer **golden-section** or hybrid methods that reuse function values.

## Related Notes

- [[binary-search|Binary Search]]

- [[divide-and-conquer|Divide and Conquer]]

- [[time-complexity-analysis|Time Complexity Analysis]]

- [[recurrences-master-theorem|Recurrences - Master Theorem]]
