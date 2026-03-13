---
title: Depth-First Search (DFS)  
description: Systematic graph exploration that timestamps discovery/finish times and classifies edges; foundation for cycle detection and topological order.  
draft: false
comments: true
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:
# - dfs-forest-timestamps.svg - DFS forest with discovery/finish times (d[u], f[u]) on each vertex; tree/forward/back/cross edges highlighted.
# - edge-types-directed-vs-undirected.svg - Side-by-side classification on a directed vs undirected graph; note that undirected graphs have only tree/back edges.

---

## Overview

**Depth-First Search (DFS)** explores a graph by recursing (or using an explicit stack) along each path as far as possible before backtracking. Classic DFS records **discovery** and **finish** timestamps for each vertex, yielding a **DFS forest** and enabling **edge classification** (tree, back, forward, cross). These artifacts power cycle detection, connectivity analyses, and [[topological-sorting|Topological Sorting]].

> [!example]  
> **Diagram (`dfs-forest-timestamps.svg`)** - Draw a small directed graph. Show the DFS forest with each vertex labeled `d[u]/f[u]` (discovery/finish). Color edges by class: tree (solid), back (red), forward (blue), cross (gray).

## Core Idea

Treat the graph as an adjacency mapping `Adj[u]`. Mark vertices **white → gray → black** as they transition from unvisited to discovered (on stack) to finished. Increment a global **time** at each discovery/finish to get intervals `[d[u], f[u]]`. In directed graphs, intervals **nest** along recursion; a **back edge** from `u` to an **ancestor** in the current recursion stack proves a cycle.

## Algorithm Steps / Pseudocode

The recursive version below computes timestamps, parents, and classifies edges during traversal.

```pseudo
function DFS(G):
    for each u in V(G):
        color[u] = WHITE
        parent[u] = NIL
    time = 0
    for each u in V(G):
        if color[u] == WHITE:
            DFS_VISIT(G, u)

function DFS_VISIT(G, u):
    color[u] = GRAY
    time = time + 1
    d[u] = time
    for each v in Adj[u]:
        if color[v] == WHITE:
            edge_class(u,v) = TREE
            parent[v] = u
            DFS_VISIT(G, v)
        else if color[v] == GRAY:
            edge_class(u,v) = BACK
        else:  // color[v] == BLACK
            // Use discovery/finish times to distinguish:
            // if d[u] < d[v] and f[v] not set yet (or f[v] > f[u]): FORWARD else CROSS
            if d[u] < d[v] and f[v] is not yet set:
                edge_class(u,v) = FORWARD
            else:
                edge_class(u,v) = CROSS
    color[u] = BLACK
    time = time + 1
    f[u] = time
```

**Iterative stack form** mirrors `DFS_VISIT` by pushing `(u, iterator over Adj[u])` frames and simulating recursion; timestamps occur on first touch (discover) and when an iterator exhausts (finish).

> [!tip]  
> On **undirected** graphs, every non-tree edge encountered is a **back edge** (no forward/cross distinction). Use `parent` to avoid classifying the immediate tree edge back to the parent as a back edge.

## Example or Trace

Suppose `G` is directed with vertices `a..h`. Start from `a`; follow `a→c→d→g`, then backtrack, exploring remaining edges in adjacency order. The timestamp table might look like:

|u|d[u]|f[u]|parent|
|---|---|---|---|
|a|1|16|NIL|
|c|2|7|a|
|d|3|6|c|
|g|4|5|d|
|b|8|15|a|
|e|9|12|b|
|f|10|11|e|
|h|13|14|b|

Edges like `d→c` encountered while `c` is GRAY classify as **back**; an edge from `a` to already-finished `e` is **forward/cross** depending on timestamps.

> [!example]  
> **Diagram (`edge-types-directed-vs-undirected.svg`)** - Left: directed example with one tree, one back, one forward, one cross edge, annotated using `(d,f)` intervals. Right: the same structure made undirected; show that non-tree edges are back edges.

## Complexity Analysis

Let `n = |V|` and `m = |E|`.

- **Time:** `O(n + m)` (each vertex/edge processed a constant number of times).
    
- **Space:** `O(n)` for color/parent/timestamps; recursion uses up to `O(n)` call frames (or an explicit stack of the same size).
    

## Optimizations or Variants

- **Edge-order control:** Reordering `Adj[u]` changes DFS trees and edge classes but not correctness; choose orders to expose desirable structures (e.g., lexical order for deterministic trees).
    
- **Iterative DFS:** Avoids recursion limits; necessary for very deep graphs or constrained environments.
    
- **Kosaraju/Tarjan scaffolding:** Run DFS to compute **finishing-time order** or **low-link** values for SCCs or articulation points/bridges in linear time.
    
- **Pruning by components:** In sparse graphs, pre-partition connected components to parallelize per-component DFS safely.
    

## Applications

- **Cycle detection:** Back edges in directed graphs imply cycles immediately.
    
- **Topological order:** Reverse of vertex **finish** order yields a topological order in DAGs.
    
- **Strongly connected components:** DFS postorder (Kosaraju) or **low-link** (Tarjan).
    
- **Articulation points/bridges:** Undirected DFS with low-link compares `d[u]` with descendants’ reach.
    

## Common Pitfalls or Edge Cases

> [!warning]  
> **Recursion depth limits.** Real graphs can have depth `Θ(n)`. Use an **iterative DFS** or raise recursion limits to avoid stack overflow.

> [!warning]  
> **Visited timing bugs.** Mark **on discovery** (set `GRAY` before exploring neighbors). Marking after exploring can re-enter the same vertex and misclassify edges.

> [!warning]  
> **Parent back-edge confusion (undirected).** When seeing `v` as `GRAY`, ensure `v ≠ parent[u]` before labeling **back**.

## Implementation Notes or Trade-offs

- **Timestamp integrity:** Increment time exactly once at discovery and once at finish to keep interval nesting valid.
    
- **Storage layout:** Iterative DFS benefits from compact adjacency (`Adj[u]` in contiguous arrays) and a manual stack frame `{u, next-index}` to minimize overhead.
    
- **Determinism:** To get reproducible forests, sort adjacency lists; otherwise DFS trees vary with input order.
    

## Summary

DFS performs a **deep** exploration that yields a DFS forest, timestamps, and edge classifications in **linear time**. These outputs are the backbone for cycle detection, topological ordering, SCCs, and articulation/bridge analyses. Use timestamps to reason about ancestry (`d[]/f[]` nesting), and prefer an iterative stack on deep or adversarial inputs.

## Related Notes

- [[breadth-first-search-algorithms|Breadth-First Search Algorithms]]
    
- [[graph-traversals-bfs-dfs|Graph Traversals: BFS and DFS]]
    
- [[topological-sorting|Topological Sorting]]
    
- [[recursion|Recursion]]