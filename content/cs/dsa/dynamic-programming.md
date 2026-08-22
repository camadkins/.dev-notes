---
title: Dynamic Programming
description: Solve problems by decomposing into overlapping subproblems with optimal substructure; reuse solutions via memoization or tabulation.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-19
aliases: []
---

## Overview

**Dynamic programming (DP)** is a method for solving optimization and counting problems by breaking them into **overlapping subproblems** that exhibit **optimal substructure**. Instead of recomputing subproblems repeatedly (as naïve recursion does), DP **remembers** results (memoization) or **builds them iteratively** (tabulation). The strategy converts exponential-time branching into polynomial-time reuse when structure permits.

DP is especially effective for sequences (strings, arrays), grids, trees, and acyclic graphs. Canonical examples include **edit distance**, **knapsack**, **matrix-chain multiplication**, **longest increasing subsequence (LIS)**, **coin change**, and **shortest paths in DAGs**.

## Motivation

Many recursive formulations recompute the **same** subproblems. For instance, a naïve Fibonacci function re-evaluates `F(k)` exponentially many times. DP attacks this redundancy by caching or iteratively building answers so each distinct subproblem is solved **once**.

Beyond speedups, DP also:

- Clarifies **invariants** (base cases, transitions).

- Provides **certificates** of optimality (e.g., parent pointers for reconstruction).

- Enables **fine-grained trade-offs** between time, memory, and precision (e.g., bitset or divide-and-conquer optimizations).


## Definition and Formalism

Two properties justify DP:

1. **Optimal substructure:** An optimal solution to a problem can be composed of **optimal solutions** to its subproblems. Formally, if `OPT(x)` denotes the optimal value on instance `x`, there exists a decomposition `x → (x₁,…,x_k)` and a combination rule such that
    [
    OPT(x) = \min/\max_{choice\in \mathcal{C}(x)} f\big(OPT(x_1),\ldots,OPT(x_k),; choice\big).
    ]

2. **Overlapping subproblems:** The number of **distinct** subproblems is polynomial (or otherwise manageable), and recursion revisits the same ones.


A DP solution specifies:

- **State:** Parameters that uniquely identify a subproblem (e.g., indices `i,j`, capacity `w`, mask of used items).

- **Transition:** Recurrence relation expressing `State` in terms of smaller states.

- **Base cases:** Values for minimal states (often zeros or identities).

- **Order:** A computation order that ensures each dependency is available when needed.

- **Answer location:** Which state encodes the final result.


> [!tip]
> Design states to be **just sufficient**: enough information to make transitions correct, but no redundant dimensions. Extraneous state often multiplies complexity without adding power.

## Example or Illustration

Below are compact, representative DPs across common patterns.

### Edit Distance (Levenshtein)

**State** `ED[i][j]` = edit distance between prefixes `A[0..i)` and `B[0..j)`.
**Transition**
`ED[i][j] = min( ED[i-1][j] + 1, ED[i][j-1] + 1, ED[i-1][j-1] + [A[i-1] ≠ B[j-1]] )`
**Base** `ED[i][0] = i`, `ED[0][j] = j`
**Order** row/column sweep.
**Answer** `ED[n][m]`.

```pseudo
for i in 0..n: ED[i][0] = i
for j in 0..m: ED[0][j] = j
for i in 1..n:
    for j in 1..m:
        cost = (A[i-1] != B[j-1])
        ED[i][j] = min(ED[i-1][j]+1, ED[i][j-1]+1, ED[i-1][j-1]+cost)
```

### 0/1 Knapsack (Value Maximization)

**State** `DP[i][w]` = max value using first `i` items within capacity `w`.
**Transition**
`DP[i][w] = max(DP[i-1][w], DP[i-1][w-w_i] + v_i)` if `w_i ≤ w`; else `DP[i][w] = DP[i-1][w]`.
**Base** `DP[0][*] = 0`.
**Order** `i=1..n`, `w=0..W`.
**Answer** `DP[n][W]`.
**Space:** can be reduced to `O(W)` with a backward `w` loop.

### Longest Increasing Subsequence (LIS)

Two perspectives:

- **Quadratic DP:** `LIS[i] = 1 + max{ LIS[j] : j<i and A[j] < A[i] }`, else `1`.

- **Patience sorting trick (n log n):** Maintain `tails[len]` = minimum possible tail for an increasing subsequence of length `len`; use binary search to place each `A[i]`. Though not classic DP tabulation, it arises from the same **optimal substructure** viewpoint.


### Matrix-Chain Multiplication

**State** `DP[i][j]` = minimal scalar multiplications to multiply `A_i…A_j`.
**Transition**
`DP[i][j] = min_{i≤k<j} (DP[i][k] + DP[k+1][j] + dims(i-1)*dims(k)*dims(j))`.
**Order** by chain length `L=2..n`.

## Properties and Relationships

- **Memoization vs tabulation:**

    - _Memoization_ = top-down recursion with a cache; computation follows the **call graph**, easy to implement, computes only **reachable** states, and fits naturally with pruning.

    - _Tabulation_ = bottom-up filling; you control **order** and memory, avoid recursion limits, and often get better constants due to iteration.

- **Subproblem graph:** The set of states and transitions forms a **DAG** (no cycles if order is valid). A correct fill order is any **topological ordering** of this DAG.

- **Space optimization:** If a state only depends on a bounded **window** (e.g., previous row/column), reduce memory from `O(nm)` to `O(min(n,m))`. For path-count DPs or linear recurrences, rolling arrays or even two scalars may suffice.

- **Decision recovery:** Store **parent pointers** or recompute choices to reconstruct the actual solution (sequence of edits, chosen items, split points).

- **Equivalences:**

    - DP on DAG shortest paths ↔ **Dijkstra** on DAG (with topological order).

    - Some greedy or divide-and-conquer methods can be derived as special cases when additional properties (e.g., matroid, quadrangle inequality) hold.


## Implementation or Practical Context

A robust DP implementation follows this checklist:

1. **Define state precisely.** Identify minimal indices or features that make future decisions independent of past history beyond the state.

2. **Prove dependence bounds.** Verify transitions only reference "smaller" states under your chosen order.

3. **Choose representation.** Array/table for dense index ranges; hash maps for sparse or irregular states (e.g., subsets, coordinates with obstacles).

4. **Set base cases.** Fill them before any transitions that rely on them.

5. **Pick an order.**

    - 1D: `i` increasing;

    - 2D: row-major or column-major consistent with dependencies;

    - DAG: topological order;

    - Tree DP: postorder traversal.

6. **Memory plan.** Use rolling arrays or compress dimensions where possible; document invariant rows/columns.

7. **Reconstruction hooks.** If you need the actual path/choices, keep predecessor info or replay decisions deterministically.


```pseudo
// Template: bottom-up tabulation when DP[i] depends on DP[smaller i]
initialize DP[...] to base values
for i in increasing order:
    for each transition choice c:
        DP[i] = combine(DP[i], relax(DP[smaller], c))
return DP[target]
```

**Engineering tips.**

- For performance-critical inner loops, ensure data is **contiguous**; avoid hash lookups if dense arrays are feasible.

- For very large tables, prefer **iterative** forms to avoid recursion depth, and be mindful of [[cs/systems/memory-hierarchy-and-caching|cache line reuse]] (traverse in memory order).


> [!tip]
> When unsure about order, sketch the subproblem **DAG** and do a quick **topological sort** by hand; your loops should respect that order exactly.

## Common Misunderstandings

> [!warning]
> **Wrong state definition.** If the state omits a necessary piece of history, transitions will be **incorrect** (e.g., a 1D knapsack that forgets which items were considered allows reusing items).

> [!warning]
> **Illegal order.** Filling `DP[i][j]` before `DP[i-1][j]` or `DP[i][j-1]` when they are required creates uninitialized reads and nondeterministic bugs.

> [!warning]
> **Double counting.** In counting problems (e.g., number of paths), ensure each distinct solution is counted **once** - avoid symmetric states or ensure symmetry-breaking in the state.

> [!warning]
> **Overfitting base cases.** Over-constraining base values can block valid transitions; base cases should express identity/neutral conditions only.

## Broader Implications

DP unifies a wide range of techniques:

- **Probabilistic models** (HMMs, Viterbi) are DP over hidden states.

- **Bioinformatics** alignment uses DP tables akin to edit distance with affine gap penalties.

- **Compilers** use DP for **optimal code generation** in DAGs and register allocation heuristics.

- **Operations research** applies DP in **inventory control** and **[[cs/deep-learning/reinforcement-learning|Markov decision processes]]** (DP on value functions with Bellman equations).


Connections to other paradigms:

- **Greedy algorithms** succeed when local choices align with global optimality; otherwise DP handles the global dependencies.

- **Divide and conquer** reduces to DP when overlapping subproblems exist; when not, D&C alone suffices.

- **Graph algorithms**: many DP recurrences are shortest/longest paths under acyclic orders or bounded treewidth.


## Summary

Dynamic programming converts recursive formulations with **overlapping subproblems** and **optimal substructure** into efficient algorithms by **remembering** results. A good DP solution hinges on **state design**, **sound transitions**, **proper base cases**, and a **valid computation order**. Mastery comes from practicing the patterns - 1D/2D table DPs, DAG/topological DPs, tree DPs, and bitmask/subset DPs - and learning when to **optimize space**, **recover decisions**, or **switch paradigms** (greedy, divide-and-conquer) when appropriate.

## Related Notes

- [[greedy-algorithms|Greedy Algorithms]]

- [[divide-and-conquer|Divide and Conquer]]

- [[algorithm-efficiency|Algorithm Efficiency]]

- [[recursion|Recursion]]
