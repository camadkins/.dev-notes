---
title: Recursion
description: Define solutions in terms of smaller instances with explicit base cases and guaranteed termination; structure call trees and manage state.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-01
aliases: []

---

## Overview
**Recursion** is a problem-solving technique where a function or definition refers to **smaller instances of the same problem** until reaching **base cases** that are solved directly. It is fundamental in algorithms (tree traversals, divide-and-conquer, backtracking) and in mathematical definitions (factorial, Fibonacci, [[cs/math/mathematical-induction|structural induction]]). Correct recursive programs require:

- A **decomposition** rule that reduces size or complexity.
- **Base cases** that terminate recursion.
- A **progress measure** (size, depth, distance to goal) that strictly decreases.
- A clear **state model** so partial results and side effects are handled safely.

> [!note]
> Reasoning about recursion mirrors **induction**: prove it works for base cases, then assume correctness for smaller instances to justify the step case.

## Motivation
Recursion often maps directly to the **structure of the data** or **search space**:

- **Hierarchical data** (trees, graphs with acyclic traversal order) invite a natural recursive visitation.
- **Divide-and-conquer** algorithms split inputs into smaller pieces, solve subproblems, and combine results.
- **Backtracking** explores decision trees, reverting choices when constraints fail.
- **Specification clarity**: many definitions are simpler recursively than iteratively.

When performance matters, recursion must be combined with memoization, pruning, or iterative transformations to achieve the desired complexity and resource usage.

## Definition and Formalism
A recursive definition has two parts:

1. **Base cases.** For minimal inputs (e.g., `n=0`, empty list, leaf node), specify the direct result.
2. **Recursive step.** Express the solution for input `x` in terms of strictly **smaller** inputs `x'`.

### Structural recursion
On algebraic data types, recursion follows the constructors. Example on a binary tree:

```pseudo
function SIZE(node):
    if node == NIL: return 0
    return 1 + SIZE(node.left) + SIZE(node.right)
````

### Numerical recursion

On integers, recursion usually decreases by a fixed amount or factor:

```pseudo
function FACTORIAL(n):
    if n <= 1: return 1
    return n * FACTORIAL(n - 1)
```

### General recursion with branching (search)

Branch on choices, propagate success/failure:

```pseudo
function SOLVE(state):
    if GOAL(state): return true
    for move in LEGAL_MOVES(state):
        APPLY(move, state)
        if SOLVE(state): return true
        UNAPPLY(move, state)  // backtrack
    return false
```

> [!tip]
> Always identify a **measure** `μ(x)` that strictly decreases on each recursive step (e.g., `n`, remaining elements, distance-to-goal). This is your termination argument.

## Example or Illustration

### Factorial (simple numeric)

- **Base:** `0! = 1`.

- **Step:** `n! = n × (n−1)!` for `n ≥ 1`.

- **Measure:** `n` decreases by 1 each call → termination.

- **Call tree:** a single chain of depth `n`.


### Tree traversal (structural)

- **Base:** empty subtree contributes `0`.

- **Step:** process node; recurse into `left` and `right`.

- **Shape:** a branching call tree that mirrors the data shape.

- **Time:** `Θ(n)` for visiting `n` nodes when each is processed `O(1)`.


### Backtracking (combinatorial search)

- **Base:** found a complete assignment consistent with constraints.

- **Step:** choose a variable/value, recurse; backtrack on failure.

- **Pruning:** constraints cut branches early; **memoization**/caching can avoid revisiting equivalent states.

## Properties and Relationships

- **Equivalence to iteration.** Any recursion that does not require multiple active frames can be transformed into iteration with an explicit stack or accumulator.

- **Tail recursion.** A call is **tail-recursive** if the recursive call is the final action; it can be compiled into a loop in languages or compilers with **[[cs/pl/evaluation-order-and-strictness|tail-call elimination]] (TCE)**. Many mainstream languages (e.g., typical C/Java VMs) **do not guarantee** TCE.

- **Mutual recursion.** Two or more functions call each other; termination still follows from a common decreasing measure.

- **Memoization vs recomputation.** Overlapping subproblems (e.g., naive Fibonacci) lead to exponential recomputation unless results are cached or a bottom-up DP is used. See [[dynamic-programming|Dynamic Programming]].


### Recurrence relations for cost

Recursive algorithms often yield cost recurrences such as `T(n) = aT(n/b) + f(n)` (divide-and-conquer). Solving these uses the tools in [[recurrences-master-theorem|Recurrences - Master Theorem]] and [[recurrence-relations|Recurrence Relations]].

## Implementation or Practical Context

### Recipe for a safe recursive function

1. **Define base cases first.** Include corner cases: empty input, single element, `NIL` node.

2. **Prove progress.** Identify a measure and check each path decreases it.

3. **Limit work per frame.** Keep local allocations small; avoid large by-value parameters when possible.

4. **Consider tail recursion.** When feasible, rearrange to tail position or switch to an iterative loop with an accumulator.

5. **For shared-state problems,** keep mutations localized and undo them on backtrack (RAII, `defer`, or `try/finally` patterns).

6. **Bound the depth.** On deep data (linked lists of length `n`, degenerate trees), stack depth can reach `Θ(n)`. Use iterative forms when `n` can exceed typical call-stack limits.


### Typical patterns

- **Accumulator style (tail-recursive):**

    ```pseudo
    function SUM_LIST(xs, acc=0):
        if xs == []: return acc
        return SUM_LIST(tail(xs), acc + head(xs))
    ```

- **Explicit stack (iterative DFS) vs recursive DFS:**

    ```pseudo
    function DFS_ITER(Graph, s):
        push(S, s); mark s
        while S not empty:
            u = pop(S)
            for v in Adj[u]:
                if not marked v:
                    push(S, v); mark v
    ```

    This avoids deep recursion on large graphs and gives precise control over stack memory.

- **Divide-and-conquer skeleton:**

    ```pseudo
    function DC(A):
        if SMALL(A): return SOLVE_SMALL(A)
        (L, R) = SPLIT(A)
        yL = DC(L)
        yR = DC(R)
        return COMBINE(yL, yR)
    ```


> [!tip]
> When converting recursion to iteration, map **call stack frames** to an explicit **stack structure** holding the same state (parameters, partial results, program counter). This is how language runtimes implement recursion under the hood.

### Performance considerations

- **Function-call overhead** is small but nonzero; for tiny base problems, consider hybrid approaches (recurse until size ≤ k, then switch to iterative code).

- **Cache locality** can improve with recursion that processes contiguous chunks (e.g., divide arrays in halves).

- **Parallel recursion**: independent subproblems can run concurrently; analyze **work vs span** separately.


## Common Misunderstandings

> [!warning]
> **Missing or too-broad base case.** A base condition like `if n==0` must actually be **reachable** from all inputs; multiple base cases may be needed (e.g., `n<=1`).

> [!warning]
> **No progress on some branches.** Ensure every path decreases the measure; otherwise infinite recursion occurs.

> [!warning]
> **Overlapping subproblems ignored.** Naive recursive Fibonacci is `Θ(φ^n)` time. Add **memoization** or write a bottom-up DP to get `Θ(n)`.

> [!warning]
> **Assuming tail-call optimization.** Many production runtimes do **not** guarantee TCE; deep tail recursion can still overflow the stack.

> [!warning]
> **Hidden global state.** Recursion with global mutations (shared arrays, sets) is brittle without careful scoping and backtracking discipline.

## Summary

Recursion expresses solutions by **reducing** problems to **smaller instances** until **base cases**. Correctness follows an inductive pattern: define base cases, prove progress, and apply the recursive step. Efficiency depends on the structure: structural recursion over trees is naturally `Θ(n)`, divide-and-conquer depends on its recurrence, and backtracking requires pruning or memoization. For robustness, bound stack depth, consider tail-recursive or iterative transformations, and manage shared state explicitly.

## Related Notes

- [[divide-and-conquer|Divide and Conquer]]

- [[dynamic-programming|Dynamic Programming]]

- [[time-complexity-analysis|Time Complexity Analysis]]

- [[recurrence-relations|Recurrence Relations]]
