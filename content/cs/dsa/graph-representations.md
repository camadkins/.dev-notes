---
title: Graph Representations
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

Graphs are commonly stored as either **adjacency lists** or an **adjacency matrix**. Lists store, for each vertex `u`, the neighbors `Adj[u]`. A matrix stores a `V x V` table where entry `(i,j)` indicates the weight/existence of edge `i->j`. The choice drives **space**, **iteration cost**, and **edge lookup cost**, and it shapes how algorithms like [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]] or [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals (BFS & DFS)]] behave in practice.

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
|Add vertex|`Theta(1)` (push empty list)|`Theta(n)` to expand each row/col when preallocated; `Theta(n^2)` if the array must be resized and copied|
|Remove vertex|`Theta(deg(u) + in-edges)`|`Theta(n)` to clear row/col|

### Directed vs Undirected

- **Adjacency list:** For undirected graphs, store both directions (`u->v` and `v->u`). Degrees: `deg(u)` counts neighbors; total edges stored = `2m`.

- **Adjacency matrix:** Mirror entries: `M[u][v] = M[v][u]` for undirected graphs.


### Weighted Graphs

- **Lists:** Use structs `{to, weight}`; optional secondary index if frequent `(u,v)` lookups are needed (e.g., sort or hash neighbors).

- **Matrix:** Natural place to keep weights; initialize with `infinity` (or `0` for boolean reachability).


### Cache/Memory Considerations

- **AL:** `array<vector<int>>` (or similar) yields contiguous blocks per vertex; iteration is [[cs/systems/memory-hierarchy-and-caching|cache-friendly]]. Hash-based neighbor sets speed edge checks but hurt iteration latency.

- **AM:** Dense `n x n` blocks traverse well in row-major order; for large `n`, tile/block loops to keep working sets in cache.


### Algorithmic Fit

- **BFS/DFS:** Prefer **AL** for sparse graphs: time `Theta(n + m)` vs `Theta(n^2)` for AM (since AM scans each row).

- **Dijkstra:** AL with a **binary heap** priority queue is `Theta((n + m) log n)`; swapping in a **Fibonacci heap** drops it to `Theta(m + n log n)`. The AM version that scans an array for the minimum instead of using a heap is `Theta(n^2)` and is competitive only when the graph is dense or `n` is small.

- **Floyd–Warshall / Warshall:** Naturally matrix-based; initializing `dist`/`reach` comes "for free" with AM. See [[cs/dsa/floyd-warshall|Floyd–Warshall Algorithm]].

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

- **Parallelization:** AM supports SIMD/bitset tricks and straightforward blocking; AL provides natural task parallelism over vertices/edges but requires careful scheduling to avoid [[cs/systems/concurrency-primitives|contention]].


## Summary

- Use **adjacency lists** when the graph is **sparse**, you often **iterate neighbors**, or memory is tight.

- Use an **adjacency matrix** when the graph is **dense**, when **edge checks** dominate, or when matrix-style algorithms/bitsets are a win.

- Match algorithms to representation: BFS/DFS/Dijkstra typically prefer AL; Floyd–Warshall and transitive closure like AM.
    Choosing the right form improves both **big-O** and **real-world performance**.


## Related Notes

- [[cs/dsa/adjacency-list|Adjacency List]]

- [[cs/dsa/adjacency-matrix|Adjacency Matrix]]

- [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals (BFS & DFS)]]

- [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]]

## Sources

- Jeff Erickson, Algorithms, Chapter 5: Basic Graph Algorithms. https://jeffe.cs.illinois.edu/teaching/algorithms/book/05-graphs.pdf . Backs the operation-cost table nearly line for line: adjacency-list space `Theta(V + E)` against adjacency-matrix space `Theta(V^2)` held regardless of the actual edge count, neighbor listing in `Theta(1 + deg(v))` from a list against `Theta(V)` from a matrix row, constant-time edge tests from a matrix, and the improvement of the list-side edge test to `O(1 + log deg(u))` with a balanced search tree or to expected `O(1)` with a hash table. It also backs the traversal comparison in the Algorithmic Fit section, since it gives whatever-first search as `O(V + E)` under a standard adjacency list and `O(V^2 + E)` when the same graph is stored as an adjacency matrix.
- Adjacency list, Wikipedia. https://en.wikipedia.org/wiki/Adjacency_list . Backs the sparse-versus-dense trade-off framing of this note: adjacency-list space is proportional to edges plus vertices while an array-backed matrix is proportional to the square of the vertex count, neighbor listing from a list costs time proportional to the vertex's degree while a matrix requires scanning a full row, and the matrix answers adjacency in constant time where a list is slower.
- Adjacency matrix, Wikipedia. https://en.wikipedia.org/wiki/Adjacency_matrix . Backs the symmetry rule `M[u][v] = M[v][u]` for undirected graphs, the storage claim that a one-bit-per-entry matrix packs into about `|V|^2 / 8` bytes and gains locality of reference from that compactness (the bit-packing point in the Cache/Memory section), and the observation that adjacency lists need less storage on a large sparse graph because they never spend space on absent edges.
- Graph (abstract data type), Wikipedia. https://en.wikipedia.org/wiki/Graph_%28abstract_data_type%29 . Backs the summary recommendation that lists are preferred for sparse graphs and a matrix for dense ones or when edge-existence lookups must be fast, and backs the vertex-insertion row of the table, which it gives as `O(|V|^2)` for a matrix on the grounds that the matrix must be resized and copied.
- Dijkstra's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm . Backs the Dijkstra row's dependence on the queue, not on the graph alone: with adjacency lists and a binary heap the bound is `Theta((|E| + |V|) log |V|)`, a Fibonacci heap improves it to `Theta(|E| + |V| log |V|)`, and the simple version storing the vertex set as an array is `Theta(|V|^2)`.
- Floyd-Warshall algorithm, Wikipedia. https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm . Backs the claim that Floyd-Warshall is the matrix-shaped choice, running in `Theta(|V|^3)` with `Theta(|V|^2)` space and tending to beat repeated Dijkstra in practice when the graph is dense, while Dijkstra dominates when the graph is sparse.
- Transitive closure, Wikipedia. https://en.wikipedia.org/wiki/Transitive_closure . Backs the algebraic-methods case for preferring a matrix: the closure is typically stored as a Boolean matrix so that reachability is answered in constant time, it can be computed by the Floyd-Warshall algorithm in `O(n^3)`, and reducing the problem to adjacency-matrix multiplication is what lets fast matrix-multiplication algorithms apply.
