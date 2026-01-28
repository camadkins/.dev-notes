---
title: Constraint Satisfaction Problems
description: Modeling decision problems as variables with domains and constraints; explores consistency, search, and local optimization techniques for efficient solution.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-11-29
aliases: []
---

## Overview

A **Constraint Satisfaction Problem (CSP)** encodes a decision problem as a set of **variables** with **domains** and a set of **constraints** restricting which combinations of values are allowed. A **solution** is a total assignment of all variables that satisfies all constraints. CSPs unify problems like map coloring, scheduling, timetabling, Sudoku, and n-queens under a common modeling and algorithmic toolkit.

CSP algorithms exploit **structure**—constraint graphs, variable/constraint orderings, and local consistency—to prune search and reduce combinatorial explosion. When exact search is expensive, **local search** (e.g., min-conflicts) often finds high-quality solutions quickly.

## Motivation

Expressing a problem as a CSP yields **reusable machinery**:

- **Inference** (node/arc/path consistency) to shrink domains before or during search.

- **Heuristics** (MRV, degree, least-constraining value) to prioritize promising choices.

- **Decomposition** (tree/low-treewidth structures) to enable polynomial-time solutions on special cases.

- **Local search** strategies that scale on large instances where backtracking stalls.


CSPs separate **what** must be satisfied from **how** to find it, improving clarity and reuse across domains.

## Definition and Formalism

A CSP is a triple ((X, D, C)):

- (X = {X_1, \dots, X_n}) variables.

- (D = {D_1, \dots, D_n}), where (D_i) is the **finite domain** for (X_i).

- (C = {C_1, \dots, C_m}) constraints; each **scope** (S_k \subseteq X) with a **relation** (R_k \subseteq \prod_{X_i \in S_k} D_i) of satisfying tuples.


A (partial) assignment (\theta) maps a subset of variables to values in their domains. (\theta) is **consistent** if it does not violate any constraint whose scope is fully assigned; it is **complete** if all variables are assigned. A **solution** is a complete, consistent assignment.

- **Constraint graph:** nodes are variables; an edge ((X_i, X_j)) indicates any binary constraint involving the pair (or co-membership in a higher-arity constraint's scope when forming a primal graph).

- **Factor graph:** bipartite graph with variable nodes and constraint nodes.


> [!tip]
> When constraints are **binary**, the primal graph captures all interactions; use **factor graphs** for higher-arity constraints to avoid losing scope information.

## Example or Illustration

**Map coloring (4-coloring):**
Variables are regions (X_i); each (D_i = {\text{red, green, blue, yellow}}). For each adjacent pair ((X_i, X_j)), add a constraint (X_i \ne X_j). A valid coloring is a solution.

**Sudoku (9×9):**
Variables (X_{r,c}) for cells; each domain ({1..9}) (restricted by clues). Constraints enforce **all-different** per row, column, and 3×3 block.

## Properties and Relationships

- **Tractability via structure:**

    - **Trees:** If the primal graph is a tree, dynamic programming solves the CSP in linear time in the number of variables (and polynomial in domain size).

    - **Low treewidth:** Bounded-treewidth graphs are solvable in time exponential in treewidth but polynomial in problem size.

- **Consistency notions:**

    - **Node consistency (NC):** Remove domain values that violate unary constraints.

    - **Arc consistency (AC):** For every binary constraint (X_i \leftrightarrow X_j), each value (a \in D_i) must have some **support** (b \in D_j) so that ((a,b)) satisfies the constraint.

    - **Path / k-consistency:** Generalize support across longer scopes.

- **Global constraints:** Compact, powerful constraints like **all-different**, **cumulative**, and **element** have specialized propagation algorithms stronger than decomposing them into binaries.


> [!warning]
> **Propagation ≠ completeness.** Enforcing arc consistency can leave a CSP with non-empty domains that is still **unsatisfiable**. Propagation prunes; search decides.

## Implementation or Practical Context

### Backtracking with Forward Checking & MRV

Use backtracking to build a consistent assignment while pruning with **forward checking** (remove values from unassigned neighbors inconsistent with the chosen value) and **MRV** (minimum-remaining-values) for variable ordering, plus **degree** and **least-constraining value (LCV)** tie-breakers.

```pseudo
function BACKTRACK(assignment):
    if all variables assigned: return assignment
    X = argmin_{unassigned} |D_X|                 // MRV
    break ties by max degree in constraint graph  // DEGREE
    for v in order_by_LCV(X, assignment):         // value that rules out fewest neighbor values first
        if consistent(X = v, assignment):
            assignment[X] = v
            removed = FORWARD_CHECK(X, v)         // prune neighbors' domains
            result = BACKTRACK(assignment)
            if result ≠ failure: return result
            UNDO(removed)                         // restore domains
            remove assignment[X]
    return failure
```

**Forward checking** runs **arc revision** from ((X, \cdot)) to its neighbors after assigning (X=v).

### Arc Consistency (AC-3)

AC-3 enforces arc consistency on binary CSPs by iteratively **revising** arcs until no more values can be removed.

```pseudo
function AC3(csp):
    Q = queue of all directed arcs (Xi → Xj) where constraint exists
    while Q not empty:
        (Xi, Xj) = pop(Q)
        if REVISE(Xi, Xj):              // remove unsupported values from D_Xi
            if D_Xi is empty: return inconsistent
            for each Xk in neighbors(Xi) \ {Xj}:
                push(Q, (Xk, Xi))
    return consistent

function REVISE(Xi, Xj):
    revised = false
    for a in D_Xi:
        if no b in D_Xj such that (a,b) satisfies Cij:
            remove a from D_Xi
            revised = true
    return revised
```

### Global Constraints & Stronger Propagation

- **All-different:** Use matching-based propagation (Hall intervals) to remove domain values implied by pigeonhole constraints.

- **Cumulative (scheduling):** Propagate resource usage over time windows to prune impossible start times.


### Local Search (Min-Conflicts)

For large, nearly satisfiable CSPs, **min-conflicts** repeatedly picks a conflicted variable and assigns a value that **minimizes conflicts** with neighbors.

```pseudo
function MIN_CONFLICTS(max_steps):
    A = random complete assignment
    for step in 1..max_steps:
        if A satisfies all constraints: return A
        X = random variable that participates in a conflict
        v = argmin_{d in D_X} conflicts(X=d, A)
        A[X] = v
    return failure
```

Works spectacularly on **n-queens** and many scheduling/timetabling instances.

### Decomposition & Dynamic Programming

- **Trees:** Choose a root, do a pass from leaves up computing compatible summaries (supports) and a down pass to recover an assignment.

- **Treewidth:** Build a tree decomposition; perform join-tree propagation (bucket elimination / junction trees).


> [!tip]
> Combine **AC-3 pre-processing** with **MRV+LCV** and **forward checking** during search. Pre-processing shrinks domains; online pruning keeps the frontier small.

## Common Misunderstandings

- **"Arc consistency finds solutions."** It only prunes; finding a solution still needs search or specialized propagation strong enough to force singletons.

- **"Bigger domains are always harder."** Sometimes adding values enables more consistent pairings, allowing stronger propagation. Hardness depends on **constraint tightness** and **graph structure**, not just domain size.

- **"Local search can't solve CSPs with many constraints."** Min-conflicts excels when a **nearby** satisfying assignment exists; restarts and randomization help escape local minima.


## Broader Implications

CSP techniques appear in **SAT/SMT** (via encodings or direct propagators), **AI planning** (action as variables, preconditions/effects as constraints), **type inference** (constraints over types), and **configuration systems** (feature models). The same ideas—propagation, heuristic search, decomposition—recur across discrete optimization.

## Summary

CSPs model decision problems as variables, domains, and constraints. Core tools include:

- **Propagation** (NC/AC/stronger global propagators) to cut domains,

- **Heuristic backtracking** (MRV, degree, LCV, forward checking) to explore efficiently,

- **Local search** (min-conflicts) for fast improvements on large instances,

- **Decomposition** (trees/treewidth) for structural tractability.


Effective CSP solving balances **inference strength** against **search effort**, guided by problem structure.

## See also

- [[cs/dsa/backtracking-algorithms|Backtracking Algorithms]]

- [[cs/dsa/graph-representations|Graph Representations]]

- [[cs/dsa/greedy-algorithms|Greedy Algorithms]]

- [[cs/dsa/dynamic-programming|Dynamic Programming]]
