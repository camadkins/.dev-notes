---
title: Knapsack Problem
description: Choose items with weights and values to maximize total value under a capacity constraint; covers 0/1, fractional, and unbounded variants with DP and greedy solutions.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-11-19
aliases: []

---

## Overview

The **Knapsack Problem** asks: given `n` items with **weights** `w[i]` and **values** `v[i]`, and a capacity `W`, select a subset (or multiset) to **maximize total value** without exceeding capacity. Three common variants:

- **0/1 Knapsack:** either take an item **once** or not at all (binary decisions).

- **Fractional Knapsack:** items are divisible; can take **fractions** of items.

- **Unbounded (Unbounded/Complete) Knapsack:** items can be taken **multiple times** (unlimited copies).

These variants differ sharply in tractability and strategy: **Fractional** admits a greedy optimum via value/weight ratios; **0/1** is NP-hard (pseudo-polynomial DP exists); **Unbounded** has efficient DP with unbounded transitions. This note provides precise problem statements, correct algorithms, and practical guidance on when to use each.

## Motivation

Knapsack models **resource allocation**: budgets, cargo loading, ad placement under time caps, memory-limited caching, and even compiler optimizations (instruction selection). Understanding when **greedy** suffices and when **dynamic programming** is necessary is a core skill that bridges [[greedy-algorithms|Greedy Algorithms]] and [[dynamic-programming|Dynamic Programming]].

## Definition and Formalism

**Inputs.**

- Integers `n`, `W`; arrays `w[1..n]`, `v[1..n]` with `w[i] > 0`, `v[i] ≥ 0`.

**Objectives.**

- **0/1:** choose `x[i] ∈ {0,1}` to maximize `∑ v[i]·x[i]` subject to `∑ w[i]·x[i] ≤ W`.

- **Fractional:** choose `x[i] ∈ [0,1]` with the same constraint.

- **Unbounded:** choose `x[i] ∈ ℕ` (any nonnegative integer).

**Complexity landscape.**

- **0/1:** NP-hard; admits **pseudo-polynomial** DP in `O(nW)` time and `O(W)` space.

- **Fractional:** solvable optimally by **greedy** sorting by `v[i]/w[i]` in `O(n log n)` (or `O(n)` selection with linear-time median).

- **Unbounded:** `O(nW)` DP with transitions that reuse the current row.

## Example or Illustration

Small 0/1 instance: `W=7`, items
`(w,v) = (1,1), (3,4), (4,5), (5,7)`.

- Greedy by ratio picks `(3,4)` (1.33), then `(4,5)` (1.25) → uses capacity 7, value **9** (optimal here, but by luck).

- Another instance shows failure: `W=10`, items `(w,v) = (9,19), (6,12), (6,12)`. Greedy-by-ratio picks `9,19` (ratio 2.11) leaving 1 capacity ⇒ value **19**, while picking both `(6,12)` yields **24** (optimal). Greedy fails for **0/1**.

## Properties and Relationships

- **Optimal substructure (0/1, Unbounded):** Best value at capacity `c` and items up to `i` depends on best values of smaller subproblems (`i-1` items and/or capacity `c-w[i]`).

- **Overlapping subproblems:** Many capacities are recomputed unless memoized → DP pays off.

- **Greedy-choice property:** Holds for **Fractional** (proof via exchange argument), not for 0/1.

- **Weight/value scaling:** When `W` is large, `O(nW)` may be impractical; when values are small, **value-based DP** runs in `O(n·Vsum)` by minimizing weight for a given value.

## Implementation or Practical Context

### Fractional Knapsack (Greedy, Optimal)

```pseudo
function FRACTIONAL_KNAPSACK(w[1..n], v[1..n], W):
    items = [(i, w[i], v[i], v[i]/w[i]) for i in 1..n]
    sort items by ratio decreasing
    value = 0
    for (i, wi, vi, r) in items:
        if wi <= W:
            W -= wi
            value += vi
        else:
            value += vi * (W / wi)
            W = 0
            break
    return value
```

- **Time:** `O(n log n)` for sorting.

- **Why optimal:** Exchange argument—if a solution differs, swap in higher-ratio mass without decreasing value.

### 0/1 Knapsack — Capacity-Based DP (Bottom-Up)

`DP[c]` = best value with capacity `c` using items processed so far. Iterate items; traverse capacities backward to avoid reusing an item twice.

```pseudo
function KNAPSACK_01(w[1..n], v[1..n], W):
    DP = array[0..W] filled with 0
    for i in 1..n:
        for c in W down to w[i]:
            DP[c] = max(DP[c], DP[c - w[i]] + v[i])
    return DP[W]
```

- **Time/Space:** `O(nW)` time, `O(W)` space.

- **Reconstruction:** Keep a parallel `choose[i][c]` or store predecessors to recover the chosen set.

> [!tip]
> **Backward capacity loop** is essential for 0/1; forward would allow taking the same item multiple times.

**Value-Based DP (useful when values are small)**
`DP[val]` = minimum weight to achieve total value `val`. Answer is max `val` with `DP[val] ≤ W`. Complexity `O(n·Vsum)`.

### Unbounded Knapsack — Reuse Current Row

For unlimited copies, traverse capacities **forward** so each item can be reused in the same pass.

```pseudo
function KNAPSACK_UNBOUNDED(w[1..n], v[1..n], W):
    DP = array[0..W] filled with 0
    for i in 1..n:
        for c in w[i]..W:                   // forward!
            DP[c] = max(DP[c], DP[c - w[i]] + v[i])
    return DP[W]
```

### Branch & Bound for 0/1 (Large `W`, small `n`)

Use DFS over item order with an **upper bound** from **fractional** relaxation to prune. Effective when `n` is modest and structure exists; see [[branch-and-bound|Branch and Bound]].

### Bitset Optimization (0/1 with integer values)

If weights are small (or values are small), use **bitset convolution tricks** to shift/OR reachable sums; can yield `O(n·W/word_size)` style speedups.

## Common Misunderstandings

> [!warning]
> **Using greedy for 0/1.** Ratio-sorted greedy is **not** correct for 0/1; it works only for **Fractional** and as a **bound** in branch & bound.

> [!warning]
> **Wrong capacity loop direction.** 0/1 must loop capacities **descending**; Unbounded must loop **ascending**.

> [!warning]
> **Overflow & types.** When `W` or `Vsum` is large, pick 64-bit integers; avoid `-∞` sentinels that underflow.

> [!warning]
> **Negative values.** Standard formulations assume `v[i] ≥ 0`. Allowing negatives changes behavior; filter or handle separately.

## Broader Implications

Knapsack DP patterns generalize to **budgeted optimization**, **subset-sum**, and **multi-dimensional knapsack** (multiple resources; NP-hard with `O(W1·W2·…·n)` pseudo-polynomial DP). They also inform approximation schemes (e.g., **FPTAS** for 0/1 via value scaling) that trade accuracy for speed. In systems, ratio-based heuristics are often used when capacities are large and exactness is less critical; combine with DP for small residual capacities.

## Summary

- **Fractional:** sort by `v/w`, take greedily — optimal, fast.

- **0/1:** NP-hard; use `O(nW)` DP (descending capacities) or value-based DP; branch & bound with fractional upper bounds for pruning.

- **Unbounded:** `O(nW)` DP (ascending capacities).
    Choose the formulation that matches the **divisibility** and **multiplicity** of items, and be mindful of capacity scale when picking DP variants.

## See also

- [[greedy-algorithms|Greedy Algorithms]]

- [[dynamic-programming|Dynamic Programming]]

- [[branch-and-bound|Branch and Bound]]

- [[algorithm-efficiency|Algorithm Efficiency]]
