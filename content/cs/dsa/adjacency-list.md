---
title: Adjacency Lists — Sparse Graph Representation
description: Per-vertex neighbor containers for representing sparse graphs efficiently; operations, complexity, and design trade-offs.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - adjacency_list_layout.svg — array/map of vertices; each entry points to a container of (neighbor, weight) pairs.
#  - add_edge_trace.svg — directed vs undirected insertion; highlight symmetric update for undirected graphs.
#  - remove_edge_cases.svg — removing an edge from a singly linked adjacency list (middle/tail).
#  - bfs_queue_on_adjlist.svg — BFS frontier expansion touching only existing edges (sparse advantage).
#  - duplicates_and_multigraphs.svg Q— simple graphs vs multigraphs; how duplicate edges are treated.
---

## Overview
An **adjacency list** stores, for each vertex `u`, a container of its outgoing neighbors `N⁺(u)`. It excels on **sparse graphs** where the edge count `m` is much smaller than `n²`. Traversal-based algorithms (**BFS**, **DFS**, **Dijkstra**, **Prim**) benefit because work is proportional to the number of *present* edges.

> [!note]
> Intuition: keep an array (or map) from each vertex `u` to a compact container of its neighbors. Total storage is Θ(n + m), not Θ(n²).

---

## Model & Invariants

Let `G = (V, E)` with `|V| = n`, `|E| = m`.

- **Representation:** `Adj[u]` contains tuples `(v, w)` for each edge `(u, v) ∈ E` with optional attribute `w` (weight, capacity, id).  
  - **Unweighted:** store just `v`.  
  - **Undirected:** store edge symmetrically: insert `(u, v)` into `Adj[u]` and `(v, u)` into `Adj[v]`.

- **Policy (choose up front):**  
  - **Simple graph:** forbid parallel edges; optionally forbid self-loops; at most one `(u, v)`.  
  - **Multigraph:** allow parallel edges (possibly distinct weights or ids).

**Space:** Θ(n + m) overall (headers plus one record per **directed** edge; two for undirected symmetric storage).

---

## Operations & Complexity

Each bucket `Adj[u]` can be implemented by a **singly linked list**, **dynamic array/vector**, **hash set**, or **balanced tree**. Pick to match your workload.

### Add edge
```pseudo
function addEdge(Adj, u, v, w = None, directed = true, simple = true):
    if simple and contains(Adj[u], v): 
        return
    push_back(Adj[u], (v, w))
    if not directed:           // undirected symmetry
        if not (simple and contains(Adj[v], u)):
            push_back(Adj[v], (u, w))
````

- **Time:** list/vector with linear `contains`: O(deg(u)); hash set: expected O(1); tree: O(log deg(u)).
    
- **Space:** O(1) amortized per inserted edge (twice for undirected).
    

> [!warning]  
> **Undirected symmetry:** Mirror inserts and deletes in both `Adj[u]` and `Adj[v]`, or degree counts and traversals become inconsistent.

### Remove edge

```pseudo
function removeEdge(Adj, u, v, directed = true):
    removed = remove_one(Adj[u], v)     // or by edge-id in multigraphs
    if not directed:
        removed2 = remove_one(Adj[v], u)
        return removed and removed2
    return removed
```

- **Time:** list/vector: O(deg(u)) (search + remove); hash: expected O(1); tree: O(log deg(u)).
    
- **Note:** In arrays, removal may shift elements; use swap-with-last if order does not matter.
    

### Membership / Degree / Iteration

```pseudo
function hasEdge(Adj, u, v): return contains(Adj[u], v)
function neighbors(Adj, u):  return iterator(Adj[u])
function outDegree(Adj, u):  return size(Adj[u])
function inDegree(Adj, v):
    // Maintain indeg[v] in O(1) per update, or compute by scanning all lists in O(n + m).
```

- `hasEdge`: O(deg(u)) for list/vector, expected O(1) for hash, O(log deg(u)) for tree.
    
- `neighbors`: Θ(deg(u)) to iterate.
    
- `inDegree`: O(1) with maintained counter; else O(n + m).
    

---

## Container Choices (Per-Bucket)

|Container|Insert|Remove|Membership|Iteration|Notes|
|---|---|---|---|---|---|
|Singly linked|O(1)|O(deg)|O(deg)|Θ(deg)|Simple; poor locality|
|Dynamic array|Amort. O(1)|O(deg) (shift)|O(deg) or O(log deg) if kept sorted|Θ(deg)|Great cache behavior|
|Hash set|exp. O(1)|exp. O(1)|exp. O(1)|Θ(deg) (unordered)|Extra memory; fastest membership|
|Balanced tree|O(log deg)|O(log deg)|O(log deg)|Θ(deg) (ordered)|Deterministic order|

> [!tip]  
> **Cache behavior:** vectors typically beat pointer-heavy lists in practice, even with the same big-O, due to spatial locality.

---

## Example Walkthrough

Undirected simple graph `V = {0,1,2,3}`, edges `{(0,1), (0,2), (1,2), (2,3)}`.

1. Start `Adj = [[], [], [], []]`
    
2. Insert `(0,1)` → `Adj[0]=[1]`, `Adj[1]=[0]`
    
3. Insert `(0,2)` → `Adj[0]=[1,2]`, `Adj[2]=[0]`
    
4. Insert `(1,2)` → `Adj[1]=[0,2]`, `Adj[2]=[0,1]`
    
5. Insert `(2,3)` → `Adj[2]=[0,1,3]`, `Adj[3]=[2]`
    

Queries:

- `neighbors(2)` iterates `[0,1,3]` in Θ(deg(2)).
    
- `hasEdge(0,3)` scans `Adj[0]=[1,2]` → `false`.
    

> [!example]  
> **Diagram (`adjacency_list_layout.svg`)** — `Adj` as an array; each cell points to a neighbor container. Symmetric entries shown for undirected edges.

---

## Adjacency List vs Adjacency Matrix

|Criterion|Adjacency List|Adjacency Matrix|
|---|---|---|
|Space|Θ(n + m)|Θ(n²)|
|`hasEdge(u, v)`|O(deg(u)) / exp. O(1)*|O(1)|
|Iterate neighbors|Θ(deg(u))|Θ(n)|
|Sparse graphs|**Preferred**|Wasteful|
|Dense graphs|Acceptable|Often better|

* Using a hash-based bucket.

> [!warning]  
> For BFS/DFS, O(1) membership in a matrix doesn’t help: neighbor iteration from a matrix costs Θ(n) per vertex. Adjacency lists keep the overall runtime Θ(n + m).

---

## Example Algorithms on Adjacency Lists

### Breadth-First Search (BFS)

```pseudo
function BFS(Adj, s):
    n = length(Adj)
    dist = array(n, INF)
    parent = array(n, -1)
    dist[s] = 0
    Q = queue()
    enqueue(Q, s)
    while not empty(Q):
        u = dequeue(Q)
        for (v, _) in neighbors(Adj, u):
            if dist[v] == INF:
                dist[v] = dist[u] + 1
                parent[v] = u
                enqueue(Q, v)
    return dist, parent
```

- **Time:** Θ(n + m)
    
- **Space:** Θ(n)
    

> [!example]  
> **Diagram (`bfs_queue_on_adjlist.svg`)** — Frontier expansion level-by-level; the list representation touches only existing edges.

### Dijkstra (sketch)

```pseudo
function Dijkstra(Adj, s):
    n = length(Adj)
    dist = array(n, INF); dist[s] = 0
    parent = array(n, -1)
    PQ = minheap()
    push(PQ, (0, s))
    while not empty(PQ):
        (du, u) = pop(PQ)
        if du != dist[u]: continue     // stale entry
        for (v, w) in neighbors(Adj, u):
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                parent[v] = u
                push(PQ, (dist[v], v))
    return dist, parent
```

- **Time:** Θ((n + m) log n) with a binary heap; Θ(m + n log n) with Fibonacci heap
    
- **Space:** Θ(n) auxiliary (edges live in `Adj`)
    

---

## Dynamic & Weighted Graphs

- Maintain `inDegree[]` / `outDegree[]` for O(1) degree queries.
    
- For **O(1) deletions** in array buckets, keep an edge-id → `(u, index)` map and **swap-with-last** on remove.
    
- Weighted graphs: store `(v, w)` tuples or a compact struct for cache-friendly scans.
    

> [!tip]  
> Prefer POD-style edge records `(neighbor, weight, id)` for predictable layout and SIMD-friendly scans.

---

## Pitfalls

> [!warning]  
> **Duplicate edges (simple graphs):** either check on insert or run a dedup pass; duplicates distort degrees and can multiply relaxations.

> [!warning]  
> **Iterator invalidation:** removing during iteration may invalidate indices/iterators. Use two-phase delete or stable-iterator containers.

> [!warning]  
> **Self-loops:** decide policy early; loops skew degree counts and some heuristics (e.g., clustering).

---

## Summary

- **When to use:** sparse graphs; traversal-heavy workloads; memory-sensitive settings.
    
- **Core cost model:** Θ(n + m) space; traversal cost proportional to actual edges touched.
    
- **Key choice:** per-bucket container (hash for membership speed, tree/sorted array for order, vector for locality).
    
- **Undirected graphs:** keep symmetric updates consistent across operations.
    

---

## See also

- [[cs/dsa/adjacency-matrix|Adjacency Matrix]]
    
- [[cs/dsa/graphs|Graphs]]
    
- [[cs/dsa/graph-representations|Graph Representations]]
    
- [[cs/dsa/breadth-first-search-algorithms|Breadth-First Search (BFS)]]
    
- [[cs/dsa/depth-first-search-algorithms|Depth-First Search (DFS)]]
    
- [[cs/dsa/dijkstras-algorithm|Dijkstra’s Algorithm]]
    
