---
title: Breadth-First Search
description: Level-order graph traversal using a queue; computes shortest paths in unweighted graphs and builds parent trees for reconstructions.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
---

## Overview
**Breadth-First Search (BFS)** explores a graph in **layers**: it visits all vertices at distance `k` from a source before moving to distance `k+1`.  
Implemented with a **queue**, BFS provides:
- **Reachability** (which vertices are connected to the source),
- **Shortest-path distances** in **unweighted** graphs (edge cost = 1),
- A **parent tree** (or BFS tree) suitable for reconstructing paths.

> [!note]
> BFS discovers vertices in **nondecreasing distance** from the source. The first time a vertex is dequeued is the moment we know its **final shortest distance** (in edges) from the source.

---

## Model & Invariants

Let `G = (V, E)` be a directed or undirected graph. Choose a source `s ∈ V`.

State tracked by BFS:
- `dist[v]`: distance in edges from `s` to `v` (`∞` if unreached),
- `parent[v]`: predecessor of `v` on a shortest path from `s`,
- `visited[v]`: whether `v` has been discovered (enqueued).

**Invariants** maintained during the algorithm:
1. The **queue** contains vertices in **nondecreasing `dist`**.
2. When we **dequeue** a vertex `u`, all vertices at distance `< dist[u]` have already been fully processed.
3. An edge `(u, v)` that **first discovers** `v` sets  
   `dist[v] = dist[u] + 1` and `parent[v] = u`.

> [!tip]
> Mark vertices **visited at enqueue time** (not at dequeue). This prevents multiple enqueues of the same vertex.

---

## Pseudocode (Adjacency List)

```pseudo
function BFS(Adj, s):
    for v in V:
        dist[v] = ∞
        parent[v] = NIL
        visited[v] = false
    dist[s] = 0
    visited[s] = true
    Q = empty queue
    enqueue(Q, s)

    while not empty(Q):
        u = dequeue(Q)
        for v in Adj[u]:
            if not visited[v]:
                visited[v] = true
                dist[v] = dist[u] + 1
                parent[v] = u
                enqueue(Q, v)
````

- `Adj[u]` yields neighbors of `u`.
    
- On undirected graphs, edges are stored symmetrically; on directed graphs, only out-neighbors appear.
    

![BFS frontier expansion: layers L0={A}, L1={B,C}, L2={D,E}, L3={F} with queue evolution at each dequeue step](cs/dsa/assets/bfs-frontier-layers.svg)

---

## Correctness Sketch (Shortest Paths)

**Claim:** After BFS completes, for any vertex `v` reachable from `s`, `dist[v]` equals the **length of a shortest path** (number of edges) from `s` to `v`.

**Idea:**

- BFS examines vertices in increasing distance from `s`.
    
- The first time `v` is discovered, it must be via an edge `(u, v)` from some `u` already at minimum distance; thus `dist[v] = dist[u] + 1` is minimal.
    
- [[cs/math/mathematical-induction|By induction]] on distance layers, no smaller distance can exist.
    

---

## Reconstructing Paths (Parent Tree)

BFS implicitly builds a **shortest-path tree (SPT)** rooted at `s`.

```pseudo
function reconstructPath(parent, s, t):
    if parent[t] == NIL and t != s:
        return []   // unreachable
    path = []
    cur = t
    while cur != NIL:
        push_front(path, cur)
        cur = parent[cur]
    return path
```

- The returned `path` lists vertices from `s` to `t`.
    
- For all reachable `t`, this path length equals `dist[t]`.
    

![BFS shortest-path tree: parent pointers A->B, A->C, B->D, C->E, E->F with distance labels by layer](cs/dsa/assets/bfs-parent-tree.svg)

---

## Complexity & Data Structures

Assume **adjacency lists** with `n = |V|`, `m = |E|`.

- **Time:** `Θ(n + m)`. Each vertex is enqueued once, and each edge is examined at most twice (undirected) or once (directed).
    
- **Space:** `Θ(n)` for `dist`, `parent`, `visited`, plus the queue.
    

With an **adjacency matrix**, scanning neighbors costs `Θ(n)` per vertex, so total time is `Θ(n²)`.

> [!tip]  
> Prefer **adjacency lists** for **sparse** graphs (`m ≪ n²`); matrices can be reasonable for dense graphs or when `hasEdge(u, v)` queries are frequent.

![BFS work comparison: adjacency list scans O(n+m) actual neighbors vs adjacency matrix scans O(n squared) entire rows](cs/dsa/assets/bfs-on-adjlist-vs-matrix.svg)

---

## Multi-Source BFS

To compute distance from a **set** of sources `S` (e.g., nearest facility):

```pseudo
function multiSourceBFS(Adj, S):
    for v in V:
        dist[v] = ∞; parent[v] = NIL; visited[v] = false
    Q = empty queue
    for s in S:
        dist[s] = 0
        visited[s] = true
        enqueue(Q, s)
    while not empty(Q):
        u = dequeue(Q)
        for v in Adj[u]:
            if not visited[v]:
                visited[v] = true
                dist[v] = dist[u] + 1
                parent[v] = u
                enqueue(Q, v)
```

This effectively treats `S` as a **super-source** with zero edges to all `s ∈ S`.

---

## Disconnected Graphs & All-Pairs Coverage

To visit **all components**, run BFS from each **unvisited** vertex:

```pseudo
for each v in V:
    if not visited[v]:
        BFS(Adj, v)
```

- This produces a **BFS forest** (one BFS tree per component).
    
- For **all-pairs shortest paths in unweighted graphs**, run BFS from each source (or use specialized methods if needed).
    

---

## Directed vs Undirected, Weighted vs Unweighted

- **Undirected graphs:** BFS layers alternate by distance, edges always connect the same or adjacent layers (`k ↔ k+1`).
    
- **Directed graphs:** Outgoing edges determine reachability; distances respect direction.
    
- **Weighted graphs:** BFS computes shortest paths **only** when all edges have equal weight (or unit weight).  
    For nonnegative weights, use **Dijkstra’s algorithm**; for negative edges without cycles, use **Bellman–Ford**.
    

> [!warning]  
> Do **not** use BFS for general weighted graphs; results are not shortest paths unless all weights are identical.

---

## Common Pitfalls

> [!warning]  
> **Visited at the wrong time:**  
> Marking `visited[v]` **after** dequeue may enqueue `v` multiple times, inflating complexity and breaking invariants. Mark **at enqueue**.

> [!warning]  
> **Forgetting to initialize `dist` to ∞**:  
> Uninitialized distances can be mistaken for zero and corrupt path lengths.

> [!warning]  
> **Mishandling directed graphs:**  
> Ensure adjacency lists reflect **outgoing** edges; undirected graphs require **symmetric** storage.

> [!tip]  
> To save memory when you only need reachability, you can omit `dist` and `parent` and keep a boolean `visited` plus the queue.

---

## Worked Example

Consider `G` (undirected), `V = {A, B, C, D, E, F}`, edges:  
`A-B`, `A-C`, `B-D`, `C-E`, `E-F`.

BFS from `A`:

1. Init: `dist[A]=0`, enqueue `A`.
    
2. Dequeue `A` → discover `B, C` (set `dist=1`, parent=`A`), enqueue both.
    
3. Dequeue `B` → discover `D` (set `dist=2`, parent=`B`).
    
4. Dequeue `C` → discover `E` (set `dist=2`, parent=`C`).
    
5. Dequeue `D` → no new neighbors.
    
6. Dequeue `E` → discover `F` (set `dist=3`, parent=`E`).
    
7. Dequeue `F` → done.
    

Shortest path `A → F` reconstructed by chasing parents: `F ← E ← C ← A` (reverse to get forward order).

---

## Applications

- **Shortest paths** in unweighted graphs (routing on hop count).
    
- **Level decomposition** (topological layers in DAG-like BFS on unweighted edges).
    
- **[[cs/math/graph-theory|Bipartite testing]]** (2-coloring via levels: even/odd parity).
    
- **Finding connected components** (with multiple BFS runs or union-find).
    
- **Web crawling** and **network flood-fill** approximations.
    

> [!tip]  
> **Bipartite check:** Color source as 0; neighbors as 1; next layer as 0; if any edge connects same colors, the graph is not bipartite.

---

## Implementation Notes

- **Queue choice:** language-provided double-ended queues (`deque`) offer O(1) amortized enqueue/dequeue.
    
- **Memory footprint:** store `parent` as `int16`/`int32` when vertex IDs fit; distances can use `int32` or `int64`.
    
- **Edge iteration:** favor **contiguous** adjacency vectors for [[cs/systems/memory-hierarchy-and-caching|cache locality]].
    

---

## Summary

- BFS is a **layered, queue-based traversal** that guarantees **shortest-path distances** in **unweighted** graphs.
    
- It runs in `Θ(n + m)` with adjacency lists.
    
- The **parent tree** enables path reconstruction.
    
- Use multi-source BFS for nearest-source problems and repeat BFS to cover disconnected components.
    

---

## See also

- [[cs/dsa/depth-first-search-algorithms|Depth-First Search (DFS)]]
    
- [[cs/dsa/graph-representations|Graph Representations]]
    
- [[cs/dsa/dijkstras-algorithm|Dijkstra’s Algorithm]]
    
- [[cs/dsa/adjacency-list|Adjacency List]]
    
- [[cs/dsa/adjacency-matrix|Adjacency Matrix]]
    

## Sources

- Breadth-first search, Wikipedia. https://en.wikipedia.org/wiki/Breadth-first_search . Backs the definition of BFS as exploring all nodes at the present depth before moving to the next depth level with a queue holding the frontier, the `O(|V| + |E|)` time and `O(|V|)` space figures in the complexity section, the requirement to check whether a vertex has been explored before enqueueing it rather than delaying the check until dequeue (the mark-at-enqueue tip and the matching pitfall), and the parent links tracing a shortest path back to the root, which is the parent-tree reconstruction. It also states that the input is assumed to be given as an adjacency list, adjacency matrix, or similar representation, which is why this note has to name the representation before quoting a bound.
- Jessica Su, CS 161 Lecture 11: BFS, Dijkstra's algorithm, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture11.pdf . Backs the `Theta(m + n)` bound together with its accounting: each vertex is added to the queue at most once over the whole run because only white vertices are enqueued and a vertex never turns white again, so queue work is `O(n)`, and the inner for loop runs `O(m)` times because each adjacency list is iterated through at most once and the lists hold `m` entries in aggregate. It also backs the shortest-path claim for unweighted graphs and the parent pointers forming the shortest-path tree.
- Jeff Erickson, Algorithms, Chapter 5: Basic Graph Algorithms. https://jeffe.cs.illinois.edu/teaching/algorithms/book/05-graphs.pdf . Backs the adjacency-list versus adjacency-matrix comparison in the complexity section, which is the precondition on the `Theta(n + m)` figure. It gives the traversal as `O(V + E)` when the graph is in a standard adjacency list, states explicitly that the running time increases to `O(V^2 + E)` when the graph is stored as an adjacency matrix, and separately notes that the breadth-first spanning tree built from the parent edges contains shortest paths from the start vertex to every other vertex in its component. It also backs the disconnected-graph section, since restarting the search at every unmarked vertex still costs only `O(V + E)` in total and produces a spanning forest.
- Dijkstra's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm . Backs the weighted-graph warning and the routing advice that follows it: BFS is the special case of Dijkstra on unweighted graphs where the priority queue degenerates into a FIFO queue, and Dijkstra is the method for non-negative weights, which is why unequal weights break the BFS distance guarantee.
- Bellman-Ford algorithm, Wikipedia. https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm . Backs the fallback named for negative edge weights, since Bellman-Ford computes single-source shortest paths where some edge weights are negative and reports a negative cycle when one is reachable.
- Bipartite graph, Wikipedia. https://en.wikipedia.org/wiki/Bipartite_graph . Backs the bipartite-testing application and the parity coloring recipe: a graph is bipartite exactly when it is 2-colorable and exactly when it has no odd cycle, and the test can be run with breadth-first search giving each node the opposite color to its parent in breadth-first order, where an edge to a previously colored vertex of the same color exhibits an odd cycle.
- std::deque, cppreference.com. https://en.cppreference.com/w/cpp/container/deque . Backs the queue-choice implementation note, since it specifies insertion or removal of elements at the end or the beginning as constant `O(1)`.
