---
title: Graphs
description: Vertices and edges; directed vs undirected; weighted vs unweighted; core terms and how to work with neighborhoods and degrees.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-14
aliases: []
---

## Overview

A **graph** models relationships. It consists of **vertices** (nodes) and **edges** (links). Edges may be **directed** (arrows) or **undirected** (no direction), **weighted** (with costs) or **unweighted**. Graphs let you formalize networks - roads, social connections, call graphs, dependency graphs - and run algorithms for reachability, shortest paths, connectivity, and more.

## Motivation

Graphs capture structure with minimal assumptions. Because the model is so general, many problems reduce to "build the right graph, then run a standard traversal or path algorithm." Once you're fluent with degree, neighborhoods, and representations, the rest of the toolbox - [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals (BFS & DFS)]], [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]], [[cs/dsa/floyd-warshall|Floyd–Warshall Algorithm]] - slides into place.

## Definition and Formalism

- A **graph** is `G = (V, E)`, where `V` is a finite set of vertices (label them `0..n-1` for code) and `E` is a subset of `V x V` (the set of edges).

- **Undirected**: edges are unordered pairs `{u, v}` with `u != v`.

- **Directed** (digraph): edges are ordered pairs `(u, v)`; direction matters.

- **Weighted**: each edge has a weight `w(u,v)` (cost, distance, capacity, etc.).

- **Simple** graph: no parallel edges (duplicates) and no self-loops `(u,u)`.

- **Multigraph**: parallel edges allowed; **pseudograph**: self-loops allowed.


**Neighborhood and degree (notation).**

- `Adj[u]` = set/list of neighbors of `u`.

- Undirected degree: `deg(u) = |Adj[u]|`.

- Directed: **out-degree** `deg+(u) = |Adj[u]|`, **in-degree** `deg-(u) = |{ v : (v,u) in E }|`.

- **Path**: sequence `u0,u1,...,uk` with each consecutive pair an edge; **cycle**: path with `u0 = uk` and length >= 1 (directed cycles obey direction).

- **Connected** (undirected): every pair of vertices has a path; **strongly connected** (directed): each vertex reaches every other.


## Example or Illustration

Let `V = {0,1,2,3,4}` and edges
`E = {(0,1),(0,3),(1,2),(2,3),(3,0)}` (directed, unweighted).

- **Adjacency list**

    ```
    Adj[0] = {1,3}
    Adj[1] = {2}
    Adj[2] = {3}
    Adj[3] = {0}
    Adj[4] = {}
    ```

    Queries: neighbors of `0` are `{1,3}`; `deg+(0)=2`. Count in-neighbors from `E`: `deg-(0)=1` (edge from 3).

- **Adjacency matrix (A)**

    ```
       0 1 2 3 4
    0: 0 1 0 1 0
    1: 0 0 1 0 0
    2: 0 0 0 1 0
    3: 1 0 0 0 0
    4: 0 0 0 0 0
    ```

    `A[u][v]=1` iff `(u,v) in E`. Row sums give out-degrees; column sums give in-degrees.


> [!tip]
> Pick a **single** vertex labeling (usually `0..n-1`) and stick to it across files and code. It keeps loops simple and avoids off-by-one errors.

## Properties and Relationships

- **Sparsity vs density.** Let `n=|V|`, `m=|E|`. Sparse graphs have `m << n^2` (e.g., `Theta(n)`); dense graphs approach `Theta(n^2)`. Sparsity affects representation choice and algorithm costs.

- **Total degree rules.** Undirected: `Sum_u deg(u) = 2m`. Directed: `Sum_u deg+(u) = Sum_u deg-(u) = m`. These identities are handy for sanity checks.

- **Paths and shortest paths.** On unweighted graphs, **BFS** from a source gives shortest hop counts. With nonnegative weights, use [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]]; with negatives (no negative cycles), [[cs/dsa/floyd-warshall|Floyd–Warshall Algorithm]] or Bellman–Ford.

- **Components.** Undirected connectivity uses BFS/DFS to find components. Directed graphs split into **SCCs** (strongly connected components) via algorithms like Kosaraju/Tarjan (both DFS-based).


## Implementation or Practical Context

**Representations.** See [[cs/dsa/graph-representations|Graph Representations - Adjacency List vs Matrix]]. In brief:

- **Adjacency list (AL):** space `Theta(n+m)`, neighbor iteration is `Theta(deg(u))`. Best for sparse graphs and traversal-heavy work.

- **Adjacency matrix (AM):** space `Theta(n^2)`, constant-time `hasEdge(u,v)`. Works well for dense graphs or matrix-style algorithms (e.g., transitive closure).


**Core operations (teaching-friendly costs).**

- Get neighbors of `u`: AL `Theta(deg(u))`; AM `Theta(n)` (scan row).

- Check `(u,v)` is an edge: AL `Theta(deg(u))` (or `O(1)` with a hash set per row); AM `Theta(1)`.

- Add/remove vertex: AL `Theta(1)`/`Theta(deg(u)+in(u))`; AM `Theta(n)` row/col work **when the matrix is preallocated to a maximum `n`**. If the `n x n` array has to be resized and copied to admit the new vertex, adding a vertex costs `Theta(n^2)`.


**Degree/neighbor mini-snippets (pseudocode).**

```pseudo
// Out-degree from adjacency list
function OUT_DEGREE(u):
    return length(Adj[u])

// In-degree from adjacency list (keep a counter or compute on demand)
function IN_DEGREE(u):
    cnt = 0
    for v in V:
        if u in Adj[v]: cnt++
    return cnt             // or maintain indegree[u] during edge insert/delete
```

## Common Misunderstandings

> [!warning]
> **Parallel edges and self-loops.** Decide early whether your graph is **simple** (no duplicates, no `(u,u)`) or permits **multiedges/loops**. This choice changes degree counts, adjacency checks, and some proofs. If you allow multiedges, store counts or a list of parallel arcs and define degree accordingly.

> [!warning]
> **Mixing directed and undirected logic.** In undirected ALs, each undirected edge appears twice (both directions). Remember this when summing degrees or iterating edges.

> [!warning]
> **Assuming unweighted behavior on weighted graphs.** BFS gives shortest paths only when edges have equal weight (often weight 1). For weighted graphs, pick an appropriate algorithm.

> [!warning]
> **Inconsistent sentinels in matrices.** For weighted AMs, choose a single sentinel for "no edge" (e.g., `INF`) and guard before arithmetic to avoid overflow.

## Broader Implications

Graphs underpin compilers ([[cs/pl/intermediate-representations-and-ssa|control-flow]], call graphs), OS schedulers (resource graphs), networking (routing), databases (query plans), ML ([[cs/deep-learning/graph-neural-networks|message passing on GNNs]]), and more. Once you encode a problem as a graph, you unlock a standard vocabulary (paths, cuts, flows, [[cs/math/graph-theory|matchings]]) and a library of proven algorithms.

## Summary

Graphs model entities and relationships with almost no baggage. Know the basics - directed vs undirected, weighted vs unweighted, neighborhoods and degrees, and how to store the graph - and you're set to apply traversals for structure and shortest-path methods for distances. The right representation and clear conventions keep both your theory and code simple.

## Related Notes

- [[cs/dsa/graph-representations|Graph Representations - Adjacency List vs Matrix]]

- [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals (BFS & DFS)]]

- [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]]

- [[cs/dsa/floyd-warshall|Floyd–Warshall Algorithm]]

## Sources

- Graph theory, Wikipedia. https://en.wikipedia.org/wiki/Graph_theory . Backs the formalism `G = (V, E)` with `E` a set of pairs drawn from `V`, the undirected/directed split into unordered pairs versus ordered pairs, weighted graphs as graphs carrying a numeric weight per edge, and the simple-graph restriction to no parallel edges and no self-loops.
- Multigraph, Wikipedia. https://en.wikipedia.org/wiki/Multigraph . Backs multigraph as a graph permitted to have multiple edges (also called parallel edges) between the same pair of end nodes, and the convention under which a pseudograph is the multigraph that is additionally permitted to have loops.
- Degree (graph theory), Wikipedia. https://en.wikipedia.org/wiki/Degree_%28graph_theory%29 . Backs degree as the number of edges incident to a vertex, and the split of a directed vertex's degree into in-degree (incoming edges) and out-degree (outgoing edges), which is what `deg+(u)` and `deg-(u)` name here.
- Handshaking lemma, Wikipedia. https://en.wikipedia.org/wiki/Handshaking_lemma . Backs both total-degree identities used as sanity checks: the degree sum formula `Sum_u deg(u) = 2m` for undirected graphs, and the directed form in which the sum of in-degrees and the sum of out-degrees each equal the number of edges.
- Connectivity (graph theory), Wikipedia. https://en.wikipedia.org/wiki/Connectivity_%28graph_theory%29 . Backs connectedness of an undirected graph as every pair of vertices being joined by a path, and the directed notion of strong connectedness.
- Strongly connected component, Wikipedia. https://en.wikipedia.org/wiki/Strongly_connected_component . Backs the claim that a directed graph decomposes into strongly connected components and that Kosaraju's and Tarjan's algorithms compute them, both by depth-first search.
- Jeff Erickson, Algorithms, Chapter 5: Basic Graph Algorithms. https://jeffe.cs.illinois.edu/teaching/algorithms/book/05-graphs.pdf . Backs the whole operation-cost comparison in this note: adjacency-list space `Theta(n + m)` against adjacency-matrix space `Theta(n^2)` regardless of how many edges the graph actually has, listing a vertex's neighbors in time proportional to its degree from a list against a full `Theta(n)` row scan in a matrix, and the constant-time edge test a matrix gives. It also carries the standing precondition this note's traversal costs depend on, that all its graph-algorithm time bounds assume a standard adjacency list unless stated otherwise.
- Adjacency list, Wikipedia. https://en.wikipedia.org/wiki/Adjacency_list . Backs the sparse-versus-dense guidance: adjacency-list space is proportional to vertices plus edges while an array-backed adjacency matrix is proportional to the square of the vertex count, so lists are significantly more space-efficient on sparse graphs.
- Breadth-first search, Wikipedia. https://en.wikipedia.org/wiki/Breadth-first_search . Backs BFS from a source giving shortest paths measured in number of edges, which is the hop-count claim made here, and the `O(|V| + |E|)` traversal cost behind using BFS or DFS to enumerate components.
- Dijkstra's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm . Backs Dijkstra as the choice for shortest paths under non-negative weights, and the note that BFS is the special case of it on unweighted graphs where the priority queue degenerates to a FIFO queue, which is why equal-weight edges are the condition for BFS distances to be shortest paths.
- Floyd-Warshall algorithm, Wikipedia. https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm . Backs Floyd-Warshall as the all-pairs method that admits negative edge weights provided the graph has no negative cycles, which is the case this note routes to it.
