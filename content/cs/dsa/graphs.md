---
title: Graphs - Overview
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

- Add/remove vertex: AL `Theta(1)`/`Theta(deg(u)+in(u))`; AM `Theta(n)` row/col work.


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
