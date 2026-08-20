---
title: Graph Representations - Adjacency List vs Matrix
description: When to store a graph as adjacency lists or as an adjacency matrix, with space/time costs, examples, and practical guidance for sparse vs dense graphs.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-31
aliases: []
---

## Overview

Graphs are commonly stored as either **adjacency lists** or an **adjacency matrix**. Lists store, for each vertex `u`, the neighbors `Adj[u]`. A matrix stores a `V x V` table where entry `(i,j)` indicates the weight/existence of edge `i->j`. The choice drives **space**, **iteration cost**, and **edge lookup cost**, and it shapes how algorithms like [[dijkstras-algorithm|Dijkstra's Algorithm]] or [[graph-traversals-bfs-dfs|Graph Traversals (BFS & DFS)]] behave in practice.

## Motivation

No single representation dominates. Use **lists** to keep memory linear in the number of edges and to iterate neighbors quickly on **sparse** graphs. Use a **matrix** when the graph is **dense**, when constant-time **edge existence** queries are frequent, or when bitset operations can accelerate dense computations (e.g., transitive closure).

## Definition and Formalism

Let `n = |V|` and `m = |E|` (directed edges count separately).

- **Adjacency list (AL):**
    Data shape: `Adj[u]` is a container of neighbors (and, for weighted graphs, `(v,w)` pairs).
    Space: `Theta(n + m)` (plus container overhead).
    Typical ops: iterate neighbors of `u` in `Theta(deg(u))`.

- **Adjacency matrix (AM):**
    Data shape: `n x n` table `M` with `M[u][v] = weight` (or `1/true`) if edge exists, else `0/false/infinity`.
    Space: `Theta(n^2)` regardless of `m`.
    Typical ops: `hasEdge(u,v)` and `weight(u,v)` in `Theta(1)`.


## Example or Illustration

Consider the directed graph with edges: `0->1`, `0->3`, `1->2`, `2->3`, `3->0`. Weights omitted (unweighted) for brevity.

**Adjacency list**

```
Adj[0]: {1, 3}
Adj[1]: {2}
Adj[2]: {3}
Adj[3]: {0}
Adj[4]: {}
```

**Adjacency matrix**

```
   0 1 2 3 4
0: 0 1 0 1 0
1: 0 0 1 0 0
2: 0 0 0 1 0
3: 1 0 0 0 0
4: 0 0 0 0 0
```

> [!tip]
> For **weighted** graphs, store weights in `Adj[u]` as pairs `(v,w)` or in `M[u][v]` as the numeric weight with a sentinel (e.g., `+infinity` or `0`) for "no edge". Be consistent across the codebase.

## Properties and Relationships

- **Sparsity vs density.** If `m` is much smaller than `n^2` (e.g., `m = O(n)` or `O(n log n)`), lists typically win on both space and neighbor iteration time. When `m` is approximately `n^2`, the matrix cost `Theta(n^2)` is proportional to actual edges; constant-time lookups pay off.

- **Iteration pattern.** Many algorithms need "for each neighbor `v` of `u` ..." (BFS/DFS, Dijkstra). Lists match this pattern directly; matrices require scanning a full row (cost `Theta(n)` regardless of `deg(u)`).

- **Edge tests.** When code frequently asks "is `(u,v)` an edge?" without iterating neighbors, matrices provide `Theta(1)` answers; lists require searching `Adj[u]` (`Theta(deg(u))`).

- **Transitive closure / algebraic methods.** Matrix-based algorithms (Warshall, fast boolean matrix multiplies) benefit from AM and bit-packing.


## Implementation or Practical Context

### Operation Costs (typical)

|Operation|Adjacency List|Adjacency Matrix|
|---|---|---|
|Space|`Theta(n + m)`|`Theta(n^2)`|
|Iterate neighbors of `u`|`Theta(deg(u))`|`Theta(n)`|
|Check/Fetch weight of `(u,v)`|`Theta(deg(u))` (or `log deg(u)` with a set/map)|`Theta(1)`|
|Insert edge `(u,v)`|Amortized `Theta(1)` (push)|`Theta(1)`|
|Delete edge `(u,v)`|`Theta(deg(u))` unless indexed|`Theta(1)`|
|Add vertex|`Theta(1)` (push empty list)|`Theta(n)` to expand each row/col|
|Remove vertex|`Theta(deg(u) + in-edges)`|`Theta(n)` to clear row/col|

### Directed vs Undirected

- **Adjacency list:** For undirected graphs, store both directions (`u->v` and `v->u`). Degrees: `deg(u)` counts neighbors; total edges stored = `2m`.

- **Adjacency matrix:** Mirror entries: `M[u][v] = M[v][u]` for undirected graphs.


### Weighted Graphs

- **Lists:** Use structs `{to, weight}`; optional secondary index if frequent `(u,v)` lookups are needed (e.g., sort or hash neighbors).

- **Matrix:** Natural place to keep weights; initialize with `infinity` (or `0` for boolean reachability).


### Cache/Memory Considerations

- **AL:** `array<vector<int>>` (or similar) yields contiguous blocks per vertex; iteration is cache-friendly. Hash-based neighbor sets speed edge checks but hurt iteration latency.

- **AM:** Dense `n x n` blocks traverse well in row-major order; for large `n`, tile/block loops to keep working sets in cache.


### Algorithmic Fit

- **BFS/DFS:** Prefer **AL** for sparse graphs: time `Theta(n + m)` vs `Theta(n^2)` for AM (since AM scans each row).

- **Dijkstra:** AL with a priority queue is `Theta((n + m) log n)`; AM version is `Theta(n^2)` and is competitive only when the graph is dense or `n` is small.

- **Floyd–Warshall / Warshall:** Naturally matrix-based; initializing `dist`/`reach` comes "for free" with AM. See [[floyd-warshall|Floyd–Warshall Algorithm]].

- **Edge-existence-heavy workloads:** AM shines (e.g., constraint checking, dense DP transitions).


## Common Misunderstandings

> [!warning]
> **Using a matrix for a very sparse graph.** The `Theta(n^2)` blow-up wastes memory and makes neighbor scans `Theta(n)` instead of `Theta(deg(u))`. Prefer AL unless density or `hasEdge` needs dominate.

> [!warning]
> **Mismatched degree logic.** In undirected graphs stored as AL, each undirected edge appears twice. Be careful when computing totals like `Sum deg(u) = 2m`.

> [!warning]
> **Inconsistent sentinels.** With AM for weighted graphs, pick a single "no edge" sentinel (e.g., `INF`) and check it **before** arithmetic to avoid overflow.

> [!warning]
> **Unindexed deletions.** Removing `(u,v)` from `Adj[u]` can be `Theta(deg(u))`. If deletions are common, maintain positions (e.g., swap-remove) or an auxiliary hash for neighbors.

## Broader Implications

Representation choices ripple into:

- **Asymptotic bounds** (e.g., `Theta(n+m)` vs `Theta(n^2)` traversals).

- **Engineering constraints** (RAM usage for large `n`; locality; ease of dynamic updates).

- **Parallelization:** AM supports SIMD/bitset tricks and straightforward blocking; AL provides natural task parallelism over vertices/edges but requires careful scheduling to avoid contention.


## Summary

- Use **adjacency lists** when the graph is **sparse**, you often **iterate neighbors**, or memory is tight.

- Use an **adjacency matrix** when the graph is **dense**, when **edge checks** dominate, or when matrix-style algorithms/bitsets are a win.

- Match algorithms to representation: BFS/DFS/Dijkstra typically prefer AL; Floyd–Warshall and transitive closure like AM.
    Choosing the right form improves both **big-O** and **real-world performance**.


## Related Notes

- [[adjacency-list|Adjacency List]]

- [[adjacency-matrix|Adjacency Matrix]]

- [[graph-traversals-bfs-dfs|Graph Traversals (BFS & DFS)]]

- [[dijkstras-algorithm|Dijkstra's Algorithm]]
