---
title: Adjacency List
description: Sparse graph representation with efficient neighbor iteration; trade-offs vs adjacency matrix.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-29
aliases: []
# diagrams:
#   - name: list-vs-matrix-toy
#     brief: Same toy graph rendered as list and matrix to highlight memory vs query trade-offs
---

## Definition
An **adjacency list** stores, for each vertex `u`, a container of its outgoing neighbors `Adj[u] = {v : (u,v) ∈ E}` (optionally with edge attributes like weights or ids). For **undirected** graphs, each undirected edge `{u,v}` is represented twice: once in `Adj[u]` and once in `Adj[v]`.

## Invariants
- Each directed edge `(u,v)` appears **exactly once** in `Adj[u]` (twice overall for undirected graphs).
- The chosen **graph policy** is consistent:
  - *Simple graph*: no parallel edges; self-loops optional/forbidden by policy.
  - *Multigraph*: parallel edges allowed (distinguished by ids or payloads).
- If maintaining **inDegree/outDegree** arrays, updates mirror insertions/deletions in the lists.

## Operations
Typical surface API (names vary by codebase):

- `addVertex()` — allocate a new, initially empty neighbor container.
- `addEdge(u, v, w?)` — insert `(v, w?)` into `Adj[u]` (and `(u, w?)` into `Adj[v]` if undirected).
- `removeEdge(u, v)` — delete one `(u,v)` occurrence (and `(v,u)` if undirected); in multigraphs, delete by edge-id.
- `neighbors(u)` — return an iterator over `Adj[u]`.

> Minimal sketch:
> ```pseudo
> function addEdge(Adj, u, v, directed = true, simple = true):
>     if simple and contains(Adj[u], v): return
>     push_back(Adj[u], v)
>     if not directed and not (simple and contains(Adj[v], u)):
>         push_back(Adj[v], u)
> ```

> [!tip] Choose containers by your access pattern
> - **Append-heavy, occasional deletion**: `vector<int>` per bucket with *swap-pop* deletions.
> - **Frequent membership tests**: `unordered_set<int>` per bucket (expected O(1) test).
> - **Need order (by id)**: `std::set<int>` or `std::vector<int>` kept sorted (binary search).

> [!example] Insert & Remove (vector buckets)
> ```cpp
> // insert edge u->v if absent
> auto& L = adj[u];
> if (std::find(L.begin(), L.end(), v) == L.end()) L.push_back(v);
>
> // remove edge u->v using swap-pop (order not preserved)
> auto it = std::find(L.begin(), L.end(), v);
> if (it != L.end()) { std::swap(*it, L.back()); L.pop_back(); }
> ```

> [!example] Maintain degrees in O(1)
> ```cpp
> out_deg[u]++;           // on successful insert u->v
> in_deg[v]++;
> // ...and decrement on deletion
> ```

## Complexity
- **Space:** `O(n + m)` overall (headers for `n` vertices plus one record per **directed** edge; two per undirected edge).
- **Edge existence test `hasEdge(u,v)`:** `O(deg(u))` with vector/list; expected `O(1)` with a hash-set bucket; `O(log deg(u))` with a tree-set bucket.
- **Neighbor iteration:** `O(deg(u))` to visit all of `u`’s neighbors.

> Compared with an adjacency matrix (`O(n²)` space, `O(1)` membership, `O(n)` neighbor scan), adjacency lists dominate **sparse** workloads.

> [!note] Typical costs at a glance
> - **Space**: O(n + m)
> - **hasEdge(u,v)**: O(deg(u)) for vector/list; expected O(1) for hash-set
> - **neighbors(u) iteration**: O(deg(u))
> - **degree(u)**: O(1) if maintained; else O(deg(u))
> - **removeEdge(u,v)**: O(deg(u)) vector/list; expected O(1) hash-set

## Implementations
Common per-vertex bucket choices (pick to match workload):
- `vector<vector<int>>` — contiguous buckets; fast iteration and good cache locality; membership is linear unless kept sorted.
- `vector<list<int>>` — easy deletions; weaker locality; iterators stable.
- `unordered_map<int, vector<int>>` (or `unordered_map<Vertex, Container>`) — supports sparse vertex ids; flexible for dynamic graphs.
- Alternatives: `vector<unordered_set<int>>` (expected `O(1)` membership), `vector<set<int>>` (ordered iteration; `O(log deg)` ops).

> [!tip] Iteration order
> - `vector<int>` preserves insertion order (unless swap-pop is used).
> - `std::set<int>` iterates in ascending order.
> - `unordered_set<int>` has no stable order (implementation-dependent).
>
> [!warning] Dedup policy
> In **simple graphs**, avoid parallel edges by checking for membership before insert (or periodically `sort + unique` vector buckets if order matters).

## Examples
Tiny undirected simple graph `V={0,1,2,3,4}`, `E={{0,1},{0,2},{1,2},{2,3}}`:

```

Adj[0] = [1, 2]  
Adj[1] = [0, 2]  
Adj[2] = [0, 1, 3]  
Adj[3] = [2]  
Adj[4] = []

```

Directed variant (edges `0→1, 0→2, 1→2, 2→3`) would store only out-neighbors:
```

Adj[0] = [1, 2]  
Adj[1] = [2]  
Adj[2] = [3]  
Adj[3] = []  
Adj[4] = []

```

> [!example] Undirected example (5 nodes)
> ```
> 0: 1 2
> 1: 0 3
> 2: 0 3 4
> 3: 1 2
> 4: 2
> ```
> - In an undirected simple graph, store both (u→v) and (v→u).

> [!example] Directed, weighted example
> ```
> 0: (1, w=5) (3, w=2)
> 1: (2, w=1)
> 2:
> 3: (2, w=7)
> 4:
> ```
> - Represent edges as tuples `(neighbor, weight[, id])` if you need payloads.

## Pitfalls
- **Duplicate edges** in *simple* graphs inflate degrees and double-count relaxations—deduplicate on insert or via a cleanup pass.
- **Undirected symmetry** must be maintained on insert/delete, or degrees and traversals become inconsistent.
- **Self-loops & parallel edges**: decide policy up front; loops affect degree counts and some heuristics.
- **Iterator invalidation**: removing from a vector while iterating can invalidate indices/iterators; prefer two-phase delete or stable containers.
- **Mixed vertex id spaces**: if vertex ids are sparse/non-contiguous, prefer maps over raw arrays to avoid large unused buckets.

> [!warning] Concurrency
> Multi-writer updates to shared buckets require synchronization (per-vertex locks or immutable snapshots). Traversals over a mutating graph can observe torn buckets unless you guard access.

## When to use
Choose adjacency lists for **sparse graphs** and algorithms that **iterate neighbors** (BFS/DFS/Dijkstra/Prim). They minimize memory, keep work proportional to **present edges**, and provide flexible bucket choices (locality vs membership speed) for your workload.

## See also
- [[cs/dsa/graph-representations|Graph Representations]]
- [[cs/dsa/adjacency-matrix|Adjacency Matrix]]
- [[cs/dsa/breadth-first-search-algorithms|Breadth-First Search]]
- [[cs/dsa/depth-first-search-algorithms|Depth-First Search]]