---
title: Topological Sorting
description: Produce a linear order of DAG vertices using Kahn's indegree queue or DFS postorder; detect cycles when impossible.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-27
aliases: []
---

## Overview
**Topological sorting** produces a **linear order** of vertices in a directed acyclic graph (DAG) such that for every edge `(u, v)`, vertex `u` appears **before** `v`. This ordering exists **iff** the graph has **no directed cycles**. Two standard algorithms dominate practice:

1) **Kahn's algorithm (indegree method):** iteratively remove vertices of **indegree 0** using a queue (or priority queue) while decrementing neighbors' indegrees.
2) **DFS postorder method:** run depth-first search and record each vertex when its recursion **exits**; reversing that **postorder** yields a valid topological order.

Both run in `Θ(n + m)` time on adjacency lists, where `n=|V|` and `m=|E|`. When a cycle is present, each method can **detect** it and report failure.

> [!note]
> Topological order is **not unique** in general. Any order that respects the edges is valid. Ordering within **ties** (e.g., multiple indegree-0 choices) can be chosen for determinism (e.g., lexicographic).

## Core Idea
A DAG encodes **precedence constraints** (dependencies). If a vertex has **no prerequisites** (indegree 0), it can appear **first**. Removing such a vertex (and its outgoing edges) may reveal additional vertices with indegree 0. Repeating this yields a valid order, or exposes a **cycle** if at some point no indegree-0 vertex remains while edges still exist.

DFS implements the same constraint implicitly: if `(u, v)` is an edge, then during DFS the **exit time** of `u` occurs after finishing `v`. Reversing exit order puts `u` before `v`.

## Algorithm Steps / Pseudocode
### Kahn's Algorithm (indegree queue)
```pseudo
function TOPO_KAHN(Adj, n):
    indeg = array[0..n-1] filled with 0
    for u in 0..n-1:
        for v in Adj[u]:
            indeg[v] += 1

    Q = queue()
    for u in 0..n-1:
        if indeg[u] == 0:
            Q.enqueue(u)

    order = empty list
    count = 0

    while not Q.empty():
        u = Q.dequeue()
        order.append(u)
        count += 1
        for v in Adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                Q.enqueue(v)

    if count != n:
        error "Graph has a cycle; topological order does not exist"
    return order
````

**Tie-breaking:** replace `queue` with a **min-heap** (priority queue) to output the smallest-labeled available vertex first, producing a canonical order.

### DFS Postorder (reverse finishing times)

```pseudo
function TOPO_DFS(Adj, n):
    state = array[0..n-1] filled with "WHITE"   // WHITE=unvisited, GRAY=in stack, BLACK=done
    stack = empty list                           // will collect vertices on exit
    hasCycle = false

    function DFS(u):
        state[u] = "GRAY"
        for v in Adj[u]:
            if state[v] == "WHITE":
                DFS(v)
                if hasCycle: return
            else if state[v] == "GRAY":
                hasCycle = true                  // found back edge: cycle
                return
        state[u] = "BLACK"
        stack.append(u)                          // record on exit

    for u in 0..n-1:
        if state[u] == "WHITE":
            DFS(u)
            if hasCycle: error "Graph has a cycle"

    reverse(stack)                               // reverse postorder
    return stack
```

**Cycle detection:** A discovered edge to a `GRAY` vertex (in the current recursion stack) is a **back edge**, proving a directed cycle.

## Example or Trace

Consider the DAG with edges:

```
5 → 2, 5 → 0
4 → 0, 4 → 1
2 → 3
3 → 1
```

Possible **Kahn** trace:

1. indegree zeros: `{4,5}`. Dequeue `4`: emit `4`; decrement indegrees of `0,1`.

2. Queue now `{5,0?}` (depending on counts); dequeue `5`: emit `5`; decrement `2,0`.

3. Once `2` becomes zero, enqueue `2`; emit `2`; decrement `3`; then enqueue `3`, emit `3`; decrement `1`; emit `0` and `1` when they reach zero.
    One valid order: `[4, 5, 2, 3, 0, 1]`. DFS reversing exit times yields a different but valid order, e.g., `[5, 4, 2, 3, 1, 0]`.

## Complexity Analysis

Let `n=|V|` and `m=|E|`, and store the graph in **adjacency lists**.

- **Kahn's algorithm**: building indegrees costs `Θ(n + m)`. Each vertex is enqueued/dequeued once, and each edge is processed once to decrement indegree → total `Θ(n + m)` time, `Θ(n)` extra space for `indeg` and queue.

- **DFS postorder**: each vertex/edge visited at most once → `Θ(n + m)` time, `Θ(n)` space for recursion stack plus color/state arrays. Tailored **iterative** DFS uses an explicit stack with the same bound.


Both algorithms detect cycles within the same budget.

## Optimizations or Variants

- **Deterministic order:** If vertex IDs are integers or lexicographic keys, use a **min-heap** (or ordered set) for the ready set in Kahn to get a reproducible order. Cost becomes `Θ((n + m) log n)` due to heap ops.

- **Batching / parallel Kahn:** At each round, the set of indegree-0 vertices can be processed **in parallel**, with atomic decrements on indegrees for neighbors. This yields high throughput for large DAGs.

- **Partial topological order:** Sometimes only a subset must be ordered (e.g., affected targets in a build). Run Kahn on the **induced subgraph** of reachable vertices from a changed set to avoid touching the whole DAG.

- **Edge cases (disconnected DAGs):** Both methods naturally output an order that interleaves components. If you require **component-wise grouping**, run the algorithm per weakly connected component.

- **Memory-lean indegree:** If indegrees do not fit in memory (very large DAG), stream edges to compute indegrees in a first pass (external counting), then run a second pass for Kahn with a disk-backed queue.

- **Dynamic DAGs:** For incremental changes (adding/removing edges), maintain a **topological index**; local updates can adjust the order without recomputing from scratch (advanced; beyond basic scope).


> [!tip]
> In schedulers and build systems, Kahn's method maps directly to "**ready queue**" execution with degree-based unlocking. Use a priority queue to prefer cheaper or critical tasks first (heuristics).

## Applications

- **[[cs/languages/common/build-systems-and-dependency-management|Build systems]] & package managers:** Compile/link order; install dependencies before dependents.

- **Course scheduling:** Respect prerequisites so courses appear in a feasible term order.

- **Task scheduling in DAGs:** Workflow engines, data pipelines (MapReduce DAG planners, Airflow, Dask).

- **[[cs/languages/Cpp/translation-units-linkage-and-the-build-model|Linkers]] & initialization order:** Determine safe init/finalization sequences with dependencies.

- **[[cs/systems/deadlock|Deadlock detection]] & reasoning:** Detect cycles in resource graphs; if a topo order exists, the system is acyclic.

- **Graph algorithms as subroutines:** Many DP-on-DAG problems (longest path in DAG, counting paths, reachability) iterate vertices in **topological order**.

## Common Pitfalls or Edge Cases

> [!warning]
> **Forgetting cycle detection.** If Kahn's queue becomes empty **before** all vertices are emitted (or DFS finds a back edge), the graph is **not a DAG**. Report failure rather than returning a partial order.

> [!warning]
> **Wrong indegree initialization.** Only **incoming** edges count toward indegree; counting all incident edges breaks the algorithm.

> [!warning]
> **Modifying the graph destructively.** Conceptually removing edges is fine, but in shared contexts keep indegrees separate from the base graph and avoid mutating `Adj` unless intended.

> [!warning]
> **Stack overflow in DFS.** Deep DAGs (long chains) can exceed recursion limits. Use an **iterative DFS** or increase limits cautiously.

> [!warning]
> **Confusing topo with BFS/DFS order.** Plain BFS/DFS orderings do **not** guarantee precedence unless you take **reverse postorder** in DFS (or use Kahn).

## Implementation Notes or Trade-offs

- **Data structures:**

    - **Kahn:** array `indeg[n]` + **queue** (or deque). Prefer contiguous storage for better cache locality when scanning adjacency lists.

    - **DFS:** color/state arrays + **stack** (recursive or explicit). For iterative DFS, push `(u, iterator)` frames so you can emulate exit-time handling.

- **Graph representation:** Adjacency lists give `Θ(n + m)` scans; adjacency matrices force `Θ(n^2)` even on sparse graphs.

- **Determinism:** If reproducibility matters across runs, pick a stable tie-break (e.g., min-heap). Kahn with a FIFO queue is deterministic **only** when the stream of zero-indegree discoveries is unique.

- **Topological DP:** Once you have an order `order[0..n-1]`, linear-time dynamic programs on DAGs look like:

    ```pseudo
    dp[u] = base(u)
    for u in order:
        for v in Adj[u]:
            dp[v] = combine(dp[v], relax(dp[u], w(u,v)))
    ```

    This turns many "hard on general graphs" problems into simple passes on DAGs.

- **Indexing outputs:** For quick precedence checks later, store the **position** `pos[u]` of each vertex in the topo order so you can test `(u,v)` constraint by `pos[u] < pos[v]` in `O(1)`.


## Summary

Topological sorting linearizes a DAG's precedence constraints. **Kahn's algorithm** exposes ready vertices by indegree and emits them while unlocking successors; **DFS postorder** emits vertices in reverse finishing time. Both are `Θ(n + m)` and detect cycles naturally. Choose Kahn for scheduling-style workflows and controllable tie-breaking; choose DFS when you already traverse the graph and want a compact, stack-based solution. Handle cycles explicitly, pick deterministic tie-breaks if needed, and use the resulting order to drive DAG-based dynamic programs and schedulers.

## Related Notes

- [[graph-traversals-bfs-dfs|Graph Traversals - BFS & DFS]]

- [[graph-representations|Graph Representations]]

- [[dijkstras-algorithm|Dijkstra's Algorithm]]

- [[dynamic-programming|Dynamic Programming]]
