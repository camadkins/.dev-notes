---
title: Backtracking Algorithms — Systematic Search with Pruning
description: Depth-first exploration of combinatorial search spaces using recursion and constraint-based pruning to eliminate infeasible paths.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - backtracking_tree.svg — recursion tree showing explored and pruned branches for N-Queens.
#  - backtracking_callstack.svg — function call stack illustrating decisions and reversions.
---

## Overview
**Backtracking** is a general algorithmic technique for solving **constraint satisfaction** or **combinatorial search** problems by **incrementally building candidates** and **abandoning (pruning)** partial solutions as soon as they violate constraints.

It performs a **depth-first search (DFS)** over the solution space, exploring one possibility at a time and “backtracking” when a dead end is reached.

> [!note]
> Backtracking provides an organized way to explore exponentially large solution spaces while avoiding full enumeration when constraints can prune large regions.

---

## Conceptual Model

At each decision level:
1. Choose a variable or position.
2. Assign a candidate value.
3. Check whether partial assignment satisfies constraints.
4. If valid, recurse to the next level.
5. If not, **backtrack** — undo the choice and try the next option.

The process continues until all variables are assigned or all possibilities are exhausted.

```pseudo
function backtrack(state):
    if isGoal(state):
        record(state)
        return
    for choice in validChoices(state):
        make(choice)
        if isValid(state):
            backtrack(state)
        undo(choice)
````

> [!example]  
> **Diagram (`backtracking_tree.svg`)** — recursion tree showing explored branches and pruned subtrees when constraints fail.

---

## Example: N-Queens Problem

Place `n` queens on an `n×n` chessboard such that no two queens attack each other.

### Recursive Approach

```pseudo
function solveNQueens(row):
    if row == n:
        print(board)
        return
    for col in 0..n-1:
        if isSafe(row, col):
            placeQueen(row, col)
            solveNQueens(row + 1)
            removeQueen(row, col)
```

- **isSafe(row, col)** checks column and diagonal conflicts.
    
- The recursion explores row by row.
    
- Backtracking removes the queen when no valid position exists in the current row.
    

> [!tip]  
> The N-Queens search tree prunes early — as soon as a queen threatens another, the subtree under that placement is skipped.

---

## Example: Subset Sum Problem

Find all subsets of an array that sum to a target value.

```pseudo
function subsetSum(arr, i, currentSum, target):
    if currentSum == target:
        print(currentSubset)
        return
    if i == len(arr) or currentSum > target:
        return
    include(arr[i])
    subsetSum(arr, i + 1, currentSum + arr[i], target)
    exclude(arr[i])
    subsetSum(arr, i + 1, currentSum, target)
```

Here pruning occurs when `currentSum > target`.

---

## State Space Representation

Each node in the recursion tree corresponds to a **partial assignment**.  
Edges represent decisions, and leaves correspond to completed assignments.

|Term|Meaning|
|---|---|
|**Decision Variable**|Element or step being assigned|
|**Constraint**|Rule that prunes invalid branches|
|**Partial Solution**|Current progress in recursion|
|**Backtrack Step**|Undoing last assignment and trying the next|

> [!example]  
> **Diagram (`backtracking_callstack.svg`)** — illustrates recursive call stack evolution and undo operations.

---

## Optimization & Variants

### 1. Branch and Bound

Extends backtracking by maintaining the **best solution found so far** and pruning subtrees that cannot improve it.

Example: Knapsack or Traveling Salesman Problem with upper-bound estimates.

### 2. Constraint Propagation

Before branching, use constraint logic to eliminate impossible values (e.g., Sudoku or graph coloring).

### 3. Heuristic Ordering

Choosing variables or values strategically reduces search time:

- Minimum Remaining Values (MRV)
    
- Least Constraining Value (LCV)
    
- Depth-first with heuristic pruning
    

---

## Complexity

Backtracking has **exponential worst-case time** but often performs well in practice due to pruning.

|Problem|Theoretical Time|Typical Reduction|
|---|---|---|
|N-Queens|O(n!)|O(n log n) with pruning|
|Subset Sum|O(2ⁿ)|Prunes early on large sums|
|Sudoku Solver|O(9⁸¹)|Reduced via constraint propagation|

---

## Pitfalls

> [!warning]  
> **Ordering matters:** Poor variable ordering can multiply the search space by orders of magnitude.

> [!warning]  
> **Missing undo step:** Forgetting to revert a decision corrupts recursion state and leads to incorrect results.

> [!tip]  
> Combine pruning with memoization when subproblems repeat — e.g., in subset-based problems.

---

## When to Use Backtracking

- Combinatorial enumeration (permutations, combinations)
    
- Constraint satisfaction (Sudoku, N-Queens, graph coloring)
    
- Optimization via pruning (Knapsack, TSP)
    
- Pathfinding and configuration problems with constraints
    

---

## Summary

- Backtracking explores search spaces **recursively**.
    
- Prunes infeasible paths early to reduce computation.
    
- Core for constraint-solving, decision problems, and puzzles.
    
- Enhanced via **branch-and-bound** and **heuristic ordering**.
    

---

## See also

- [[cs/dsa/recursion|Recursion]]
    
- [[cs/dsa/branch-and-bound|Branch and Bound]]
    
- [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals (BFS & DFS)]]
    
- [[cs/dsa/constraint-satisfaction-problems|Constraint Satisfaction Problems]]