---
title: Backtracking Algorithms
description: Systematic search over decision trees with recursion and pruning; solves CSPs and combinatorial enumeration with correctness by invariants.
draft: false
comments: true
updated: 2025-10-29
aliases: []
tags:
  - cs
  - dsa
date: 2025-10-16
---

## Definition

**Backtracking** is a general algorithmic technique for solving **constraint satisfaction** and **[[cs/math/combinatorics|combinatorial enumeration]]** problems by **incrementally building a partial solution** and abandoning branches as soon as they can no longer lead to a valid (or improved) solution (**pruning**). It performs a **depth-first exploration** of a decision tree, undoing choices ("backtracking") when a dead end is reached. This is what separates it from [[cs/dsa/brute-force-search|brute force search]], which enumerates the whole candidate set without discarding any of it unexamined.

> [!note] Core idea
> Explore a **decision tree** with recursion; abandon partial assignments that cannot lead to a valid solution (**pruning**), and backtrack to try alternatives.

---

## Strategy

- Maintain a **partial solution** (S).

- At each step, **choose** a candidate, **check** feasibility, **recurse**, then **unchoose** (undo).

- Stop when you reach a **goal** (e.g., size-n assignment, first solution, or all solutions collected).


**Typical loop:**

1. Pick a variable/position to assign.

2. Iterate through candidate values in an order (heuristic).

3. If adding a candidate keeps constraints satisfied, recurse.

4. After recursion returns, **undo** the change and continue.

---

## Template

> [!example] Generic backtracking skeleton
>
> ```pseudo
> def solve(state):
>   if goal(state): record(state); return  # or continue for all solutions
>   for choice in ordered_choices(state):
>     if feasible(state, choice):         # pruning guard
>       apply(state, choice)              # choose
>       solve(state)                      # explore
>       undo(state, choice)               # unchoose
> ```

---

## Correctness & Invariants

- **Feasibility invariant**: `feasible(state)` ensures every recorded solution satisfies all constraints.

- **No-skip argument**: with a deterministic ordering of variables/choices, every viable branch is eventually explored (DFS completeness).

- **No-duplicate argument**: enforce a canonical generation order (e.g., fix positions, maintain `visited` sets/bitmasks, or enforce nondecreasing indices) so each solution appears once.

---

## Complexity

Backtracking is often **exponential in the worst case**, but pruning can reduce the **effective branching factor**.

- Worst-case time: (O(b^d)) where (b) is branching factor and (d) is depth.

- Space: (O(d)) for the recursion stack plus problem-specific auxiliary state.


> [!note] Cost model
>
> - Worst case often (O(b^d)) with branching factor (b) and depth (d).
>
> - Pruning reduces the **effective** branching factor; report empirical bounds for concrete problems (e.g., N-Queens solutions for small (n)).
>

---

## Heuristics & Pruning

> [!tip] Useful heuristics
>
> - **Ordering**: try most-constrained variables/choices first (fail fast; MRV/LCV in CSPs).
>
> - **Constraint propagation**: maintain domains and eliminate inconsistent options early (forward checking, arc consistency).
>
> - **Bounding**: if current score + optimistic bound < best, cut branch (bridges to [[cs/dsa/branch-and-bound|Branch and Bound]]).
>

Other practical tactics:

- **Symmetry breaking** (e.g., fix the first queen's column to reduce symmetric solutions).

- **Memoization** for repeated subproblems (careful to include enough state in the key).

- **Iterative deepening** to cap depth and progressively widen search.

---

## Examples

### N-Queens (tiny)

State: row index `r` and a placement array `col[r]`.
Feasibility: no two queens share a **column** or **diagonal**.

```pseudo
def place(r):
  if r == n: record(col); return
  for c in 0..n-1:
    if ok(r, c):      # column, diag checks
      col[r] = c
      place(r+1)
      col[r] = ⊥
```

- `ok(r,c)` checks `c` against used columns and `|c - col[i]| != |r - i|` for diagonals.

- Pruning happens immediately on conflict to avoid exploring doomed subtrees.

### Subset Sum (nonnegative set)

Include/exclude element `i`; track partial sum.

```pseudo
def dfs(i, sum):
  if sum == T: record(); return
  if i == n or sum > T: return       # prune
  choose A[i]; dfs(i+1, sum + A[i]); # include
  unchoose;   dfs(i+1, sum)          # exclude
```

- With sorted `A`, you can bound: if `sum + remaining_max_possible < T`, prune.


### Permutations (in-place)

Swap `a[k]` with `a[i]` for `i ≥ k` and recurse; swap back to unchoose.

```pseudo
def perm(k):
  if k == n: record(a); return
  for i in k..n-1:
    if use(a[i]):                # optional dedup guard
      swap(a[k], a[i])
      perm(k+1)
      swap(a[k], a[i])           # undo
```

---

## Pitfalls

> [!warning] Common pitfalls
>
> - Missing **undo** step corrupts state and produces wrong results.
>
> - Weak feasibility checks cause **late rejection** and exponential blowups.
>
> - Duplicates from symmetric choices; fix with ordering, `visited` sets, or canonical forms.
>
> - Global state not restored on return (e.g., forgetting to pop from helper stacks/sets).
>

Engineering notes:

- Validate base cases first to avoid unnecessary recursion.

- Keep `state` mutations localized; prefer [[cs/languages/Cpp/raii-and-object-lifetime|RAII]]/`defer`-style guards when available.

- Benchmark with/without specific pruners to quantify benefit.

---

## Summary

- Backtracking builds solutions **incrementally** and prunes as early as possible.

- Correctness hinges on a **feasibility invariant** and duplicate-avoidance strategy.

- Performance depends on **branching factor** and the strength of **heuristics/propagation**.

- Many CSPs and combinatorial tasks are naturally expressed with this template.

---

## Related Notes

- [[cs/dsa/recursion|Recursion]]

- [[cs/dsa/branch-and-bound|Branch and Bound]]

- [[cs/dsa/depth-first-search-algorithms|Depth-First Search]]

- [[cs/dsa/constraint-satisfaction-problems|Constraint Satisfaction Problems]]
