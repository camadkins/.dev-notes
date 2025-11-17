---
title: Branch and Bound — Systematic Search with Pruning  
description: Optimization framework that explores solution spaces through branching and bounds, pruning subproblems guaranteed not to improve the best solution.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated: 2025-10-29  
aliases:    
- branch_and_bound
- branch-bound

# diagrams:
# - name: branch-and-bound-tree
# brief: Exploration tree with node bounds labeled and pruned branches crossed out

# - name: knapsack-example-trace
# brief: 0/1 knapsack branching with fractional bound and pruning marks

# - name: bounding-functions
# brief: Loose vs tight bounds and their pruning effect
---

## Definition

**Branch and Bound (B&B)** is a **general algorithm design paradigm** for solving **combinatorial optimization** problems.  
It systematically explores the solution space as a **search tree**, but uses **bounds** to prune subproblems that cannot lead to a better solution.

> [!note]  
> B&B is not a specific algorithm — it’s a **meta-strategy** applied to problems such as **Knapsack**, **Traveling Salesman (TSP)**, **Job Scheduling**, and **Integer Programming**.

---

## Strategy

1. **Branch** — Divide the problem into smaller subproblems (partition the search space).
    
2. **Bound** — Compute an upper or lower bound on the best possible solution within each subproblem.
    
3. **Prune** — Discard any subproblem whose bound proves it cannot improve on the current best (incumbent).
    

The process repeats recursively until all remaining nodes are pruned or solved.

> [!example] Diagram: Branching with bounds and pruning

---

## Template

### Algorithm Outline

```pseudo
function branchAndBound(problem):
    best = -∞
    queue = [initial_state]
    while not empty(queue):
        node = select(queue)
        if bound(node) < best:
            continue  // prune
        if isSolution(node):
            best = max(best, value(node))
        else:
            children = branch(node)
            for c in children:
                if bound(c) >= best:
                    push(queue, c)
    return best
```

### Key Design Choices

- **Node representation:** partial solutions or decision prefixes
    
- **Branching rule:** how to generate subproblems
    
- **Bounding function:** how to estimate best achievable value
    
- **Node selection strategy:** DFS, BFS, or best-bound-first
    

---

## Bounding Function

A **bound** provides an optimistic estimate of the best solution reachable from a given state.

- **Upper Bound (for maximization):** best possible value that could be achieved below this node.
    
- **Lower Bound (for minimization):** smallest possible cost below this node.
    

If a node’s upper bound ≤ current best (incumbent), it is **pruned**.

> [!tip]  
> The strength of a B&B algorithm depends heavily on how tight the bounding function is — tighter bounds → less exploration.

> [!example] Diagram: Loose vs tight bounds and their pruning power

---

## Node Selection

|Strategy|Description|Use Case|
|---|---|---|
|**DFS (Depth-First)**|Low memory, quick to find feasible solutions|Good for feasibility problems|
|**BFS (Breadth-First)**|Expands level by level|Useful for finding all optimal solutions|
|**Best-Bound-First**|Expand node with best bound (often via priority queue)|Common in integer programming|

---

## Correctness & Termination

B&B terminates when:

- All nodes are either **feasible solutions** or **pruned**.
    
- The best known (incumbent) solution is **provably optimal** because no unexplored node can beat it.
    

> [!note]  
> Correctness depends on **bounding function validity** — bounds must never underestimate the true maximum (for maximization problems).

---

## Complexity

|Aspect|Description|
|---|---|
|**Worst-case**|Exponential (O(2ⁿ)) — explores all subsets if no pruning occurs|
|**Average-case**|Depends on bounding tightness and problem structure|
|**Space**|O(depth) for DFS; O(nodes) for BFS or best-bound search|

Despite its exponential nature, **effective pruning** can make B&B practical for many NP-hard problems.

---

## Optimizations

- **Variable ordering:** Choose branches likely to prune early.
    
- **Heuristic initial solutions:** Improve starting bound to enable earlier pruning.
    
- **Caching and memoization:** Reuse bounds for equivalent states.
    
- **Parallel B&B:** Explore subtrees concurrently.
    

> [!tip]  
> Combine with **dynamic programming** to reuse partial results, or **greedy heuristics** to produce fast initial incumbents.

---

## Examples

### 0/1 Knapsack Problem

Given weights `w[i]`, values `v[i]`, and capacity `W`, maximize total value without exceeding capacity.

**Branching:** at each level `i`, decide **include** or **exclude** item `i`.

**Bounding:** fractional knapsack upper bound:

```text
bound(node) = current_value + remaining_capacity * (next_item_value / next_item_weight)
```

**Pruning:** if bound ≤ current best value, skip this branch.

```pseudo
function knapsackB&B(i, currW, currV):
    if currW > W:
        return  // infeasible
    if currV > best:
        best = currV
    if i == n:
        return
    ub = currV + (W - currW) * (v[i] / w[i])  // optimistic bound
    if ub <= best:
        return  // prune
    knapsackB&B(i+1, currW + w[i], currV + v[i])  // include
    knapsackB&B(i+1, currW, currV)                // exclude
```

> [!example] Diagram: Knapsack branching and pruning trace

---

## Applications

- **Traveling Salesman Problem (TSP)** — prune routes exceeding best path length.
    
- **Integer Linear Programming (ILP)** — relaxation provides bounding.
    
- **Scheduling and Resource Allocation** — enforce constraints while minimizing total cost.
    
- **Knapsack, Job Assignment, Set Cover, Sudoku solving**, etc.
    

> [!note]  
> In practice, B&B underlies solvers such as **CPLEX**, **Gurobi**, and **SCIP** for mixed-integer optimization.

---

## Summary

- **Branch and Bound** is a general algorithmic framework for **optimization via pruning**.
    
- Combines search (branching) with analytical estimates (bounds).
    
- Achieves exponential speedups when bounds and heuristics are effective.
    
- Widely used in operations research, AI search, and combinatorial optimization.
    

---

## See also

- [[cs/dsa/backtracking-algorithms|Backtracking Algorithms]]
    
- [[cs/dsa/greedy-algorithms|Greedy Algorithms]]
    
- [[cs/dsa/dynamic-programming|Dynamic Programming]]
    
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
    
- [[cs/dsa/knapsack-problem|Knapsack Problem]]
