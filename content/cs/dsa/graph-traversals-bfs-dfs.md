---
title: Graph Traversals — BFS & DFS
description: Systematic exploration of graphs using queues (BFS) and stacks/recursion (DFS); includes discovery/finish times, edge classification, and classic applications.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-12-17
aliases: []
---

## Overview

**Graph traversals** visit vertices and edges in a disciplined order to reveal structure. Two foundational methods dominate:

- **Breadth-First Search (BFS):** explores level by level using a **queue**; finds shortest paths in **unweighted** graphs.

- **Depth-First Search (DFS):** explores as far as possible along a branch using a **stack/recursion**; yields **discovery/finish times**, **edge classification**, **topological order**, and **cycle cues**.


This note presents clear invariants, concise pseudocode, and "what to look for" when debugging or using traversals to solve problems.

## Motivation

Many graph problems reduce to "visit everything, but do it in a way that reveals structure."
Use **BFS** when distances in **edge count** matter (unweighted shortest paths, bipartite test). Use **DFS** when you need **reachability structure**, **topological order**, **cycle detection**, or to compute **components**.

## Definition and Formalism

Let a graph be `G = (V, E)` with vertices labeled `0..n-1`. Use `Adj[u]` for neighbors of `u`. We maintain:

- `visited[u]` (boolean) — whether `u` has been discovered.

- `parent[u]` — predecessor of `u` in the traversal tree/forest (`NIL` for roots).

- For DFS, **timestamps**: `d[u]` (discovery) and `f[u]` (finish), where strictly `d[u] < f[u]`.


**Invariants**

- BFS: When a vertex `u` is dequeued, all vertices at **smaller** distance from the source have already been fully processed. `dist[u]` never decreases.

- DFS: At any moment, the recursion stack corresponds to a **simple path** from the current root. For an edge `(u,v)`, the relation between `d[.]`, `f[.]` determines its classification.


## Algorithm Steps / Pseudocode

### Breadth-First Search (single source)

```pseudo
function BFS(Adj, s):
    for u in V:
        visited[u] = false
        parent[u]  = NIL
        dist[u]    = +infinity
    visited[s] = true
    parent[s]  = NIL
    dist[s]    = 0
    Q = empty queue
    ENQUEUE(Q, s)

    while Q not empty:
        u = DEQUEUE(Q)
        for v in Adj[u]:
            if not visited[v]:
                visited[v] = true
                parent[v]  = u
                dist[v]    = dist[u] + 1
                ENQUEUE(Q, v)
```

### Depth-First Search (full forest, recursive)

```pseudo
time = 0
for u in V:
    color[u] = WHITE    // WHITE=unseen, GRAY=in stack, BLACK=finished
    parent[u] = NIL

function DFS(V, Adj):
    for u in V:
        if color[u] == WHITE:
            DFS_VISIT(u)

function DFS_VISIT(u):
    color[u] = GRAY
    time = time + 1
    d[u] = time
    for v in Adj[u]:
        if color[v] == WHITE:
            parent[v] = u
            // (u,v) is a TREE edge
            DFS_VISIT(v)
        else if color[v] == GRAY:
            // (u,v) is a BACK edge (cycle cue in directed graphs)
        else:
            // color[v] == BLACK:
            // (u,v) is FORWARD or CROSS (depending on timestamps)
    color[u] = BLACK
    time = time + 1
    f[u] = time
```

> [!tip]
> Prefer **iterative DFS** when recursion depth may exceed the call stack. Use an explicit stack of `(u, iterator over Adj[u])` and simulate the "mark-on-entry / mark-on-exit" phases to record `d[u]` and `f[u]`.

## Example or Trace

Consider an undirected graph with edges `{(0,1),(0,2),(1,3),(2,3),(3,4)}`.

- **BFS from 0** discovers layers: `L0={0}`, `L1={1,2}`, `L2={3}`, `L3={4}`. `dist[4]=3` gives the **shortest hop count** path.

- **DFS from 0** might visit `0->1->3->2->4` depending on neighbor order. Timestamps (one possible run):
    `d[0]=1,f[0]=10`, `d[1]=2,f[1]=7`, `d[3]=3,f[3]=6`, `d[2]=8,f[2]=9`, `d[4]=4,f[4]=5`.
    Tree edges: `(0,1),(1,3),(3,4),(0,2)`. Non-tree edges depend on directed/undirected interpretation.


## Properties and Relationships

### BFS: Layered structure and shortest paths

- If edges are **unweighted**, `dist[u]` computed by BFS equals the **shortest path length** (#edges) from the source to `u`.

- `parent` pointers reconstruct a shortest path by walking from target back to source.


### DFS: Time-stamps and edge classification (directed graphs)

With discovery `d[u]` and finish `f[u]` times:

- **Tree edge:** first time you see a WHITE `v` from `u`.

- **Back edge:** to a GRAY ancestor (`d[v] < d[u] < f[u] < f[v]`), signals a **cycle** in directed graphs.

- **Forward edge:** to a BLACK descendant (`d[u] < d[v] < f[v] < f[u]`).

- **Cross edge:** between finished subtrees (`f[v] < d[u]` or vice versa).


For **undirected** graphs, DFS edges are either **tree** or **back** (each undirected non-tree edge appears as two directed back edges).

## Implementation or Practical Context

### Connectivity and components

- **Undirected connectivity:** Run DFS/BFS from any unvisited vertex; each run finds **one connected component**. Count runs to count components.

- **Directed reachability:** From a source `s`, run BFS/DFS to get the set reachable from `s`. For **strongly connected components (SCCs)** in directed graphs, use **Kosaraju**, **Tarjan**, or **Gabow** (all DFS-based).


### Topological sort (DAGs)

- A **topological order** exists iff the directed graph is acyclic.

- Run DFS; the **reverse of finish times** (decreasing `f[u]`) yields a valid order.

- A back edge during DFS indicates **no** topological order (cycle present).


### Cycle detection

- **Directed:** any **back edge** implies a cycle.

- **Undirected:** treat a non-parent neighbor encountered during DFS as a back edge -> cycle exists.


### Bipartite test (unweighted, undirected)

- Run **BFS**; 2-color as you go (alternate colors by parity of `dist`).

- If an edge ever connects vertices of the **same color**, the graph is **not bipartite** (odd cycle exists).


### Parent/visited invariants to debug

- BFS: when `u` is dequeued, all vertices with `dist < dist[u]` are already processed; any neighbor `v` discovered later must satisfy `dist[v]` in `{dist[u], dist[u]+1}` (depending on parallel edges/self-loops handling).

- DFS: exactly one of `{WHITE, GRAY, BLACK}` holds for each vertex at any time; the set of GRAY vertices is always a **stack path** from the root to the current `u`.


> [!tip]
> For reproducible traces, **fix neighbor iteration order** (e.g., sort `Adj[u]` once). Many "my output differs" issues in assignments stem from unspecified iteration order.

## Common Pitfalls or Edge Cases

> [!warning]
> **Forgetting to reset state.** Reusing arrays without reinitialization (visited/parent/color/times) corrupts results. Initialize on each run or encapsulate the traversal in a function that owns its state.

> [!warning]
> **Undirected back edges vs parent.** In undirected graphs, ignore the edge back to `parent[u]` when classifying; otherwise you'll falsely report cycles everywhere.

> [!warning]
> **Multiple components.** Calling BFS/DFS from a single source visits **only** that component. For full coverage, run a loop over all vertices and start a new search when `visited[u]==false`.

> [!warning]
> **Distances with weights.** BFS distances are shortest **hop counts** only for equal-weight edges. With nonnegative weights, use [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]]; with negative edges, consider Bellman–Ford or [[cs/dsa/floyd-warshall|Floyd–Warshall Algorithm]] for all-pairs.

## Example: Lightweight BFS/DFS harness (for teaching)

```pseudo
function BFS_ALL_COMPONENTS(Adj):
    for u in V: visited[u] = false; parent[u] = NIL
    for s in V:
        if not visited[s]:
            BFS(Adj, s)   // from earlier
            // component boundary here

function DFS_TOPO(Adj):  // returns topological order or error on cycle
    for u in V: color[u]=WHITE; parent[u]=NIL
    order = empty list
    cycle_found = false
    function VISIT(u):
        color[u]=GRAY
        for v in Adj[u]:
            if color[v]==WHITE: parent[v]=u; VISIT(v)
            else if color[v]==GRAY: cycle_found=true
        color[u]=BLACK
        order.append(u)
    for u in V:
        if color[u]==WHITE: VISIT(u)
    if cycle_found: error "cycle"
    reverse(order); return order
```

## Summary

- **BFS** uses a **queue** to explore in **layers** and computes **unweighted shortest paths**.

- **DFS** uses **recursion/stack** to reveal **structure**: time-stamps, edge types, topological order, cycles, and components.

- Master the **invariants** (visited/parent/levels for BFS; WHITE/GRAY/BLACK and `d[u]/f[u]` for DFS) and you can derive solutions to many graph problems with small, reliable code.


## See also

- [[cs/dsa/adjacency-list|Adjacency List]]

- [[cs/dsa/adjacency-matrix|Adjacency Matrix]]

- [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]]

- [[cs/dsa/floyd-warshall|Floyd–Warshall Algorithm]]
