---
title: Depth-First Search (DFS)  
description: Systematic graph exploration that timestamps discovery/finish times and classifies edges; foundation for cycle detection and topological order.  
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16  
updated:  
aliases: []
---

## Overview

**Depth-First Search (DFS)** explores a graph by recursing (or using an explicit stack) along each path as far as possible before backtracking. Classic DFS records **discovery** and **finish** timestamps for each vertex, yielding a **DFS forest** and enabling **edge classification** (tree, back, forward, cross). These artifacts power cycle detection, connectivity analyses, and [[cs/dsa/topological-sorting|Topological Sorting]].

![DFS forest with discovery/finish timestamps on each vertex and edges colored by class](cs/dsa/assets/dfs-forest-timestamps.svg)

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
            // v is finished, so f[v] is already set; the discovery times decide.
            // d[u] < d[v] means v is a descendant of u -> FORWARD
            // d[v] < d[u] means v finished before u was discovered -> CROSS
            if d[u] < d[v]:
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

![Edge classification in directed vs undirected graphs: directed shows tree, back, forward, cross; undirected shows only tree and back](cs/dsa/assets/dfs-edge-types.svg)

## Complexity Analysis

Let `n = |V|` and `m = |E|`.

- **Time:** `O(n + m)` **with the graph in adjacency lists** (each vertex/edge processed a constant number of times). Stored as an adjacency matrix instead, finding the neighbors of a vertex costs `O(n)` per vertex and the traversal becomes `O(n^2 + m)`.
    
- **Space:** `O(n)` for color/parent/timestamps; recursion uses up to `O(n)` call frames (or an explicit stack of the same size).
    

## Optimizations or Variants

- **Edge-order control:** Reordering `Adj[u]` changes DFS trees and edge classes but not correctness; choose orders to expose desirable structures (e.g., lexical order for deterministic trees).
    
- **Iterative DFS:** Avoids [[cs/languages/Racket/proper-tail-calls-and-the-loop-question|recursion limits]]; necessary for very deep graphs or constrained environments.
    
- **Kosaraju/Tarjan scaffolding:** Run DFS to compute **finishing-time order** or **low-link** values for SCCs or articulation points/bridges in linear time.
    
- **Pruning by components:** In sparse graphs, pre-partition connected components to parallelize per-component DFS safely.
    

## Applications

- **[[cs/systems/deadlock|Cycle detection]]:** Back edges in directed graphs imply cycles immediately.
    
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

## See also

- [[cs/dsa/breadth-first-search-algorithms|Breadth-First Search Algorithms]]
    
- [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals: BFS and DFS]]
    
- [[cs/dsa/topological-sorting|Topological Sorting]]
    
- [[cs/dsa/recursion|Recursion]]

## Sources

- Jeff Erickson, Algorithms, Chapter 6: Depth-First Search. https://jeffe.cs.illinois.edu/teaching/algorithms/book/06-dfs.pdf . Backs the white/gray/black state model as new, active, and finished defined against the clock, the fact that a vertex is active exactly while it sits on the recursion stack so the active vertices always form a directed path, the interval nesting that makes ancestry readable from `d[.]` and `f[.]`, and the four edge classes. It is the source for the correction made to the FORWARD/CROSS branch of the pseudocode: a forward edge satisfies `d[u] < d[v] < f[v] < f[u]`, meaning `v` is already finished and `f[v]` is set when the edge is examined, while a cross edge satisfies `f[v] < d[u]`, so the discovery times alone separate the two cases. It also backs the topological-order application, that every DAG has a topological ordering and the reversal of any postordering is one, and the acyclicity test in `O(V + E)`.
- Depth-first search, Wikipedia. https://en.wikipedia.org/wiki/Depth-first_search . Backs the `O(|V| + |E|)` time and `O(|V|)` space bounds, the classification of edges into tree, forward, back, and cross relative to the DFS spanning tree, the undirected special case in which every edge is a tree edge or a back edge with no forward or cross edges, reverse postordering producing a topological sorting of a DAG, and the iterative implementation that keeps a stack of neighbor iterators in order to reproduce the recursive traversal exactly.
- Jeff Erickson, Algorithms, Chapter 5: Basic Graph Algorithms. https://jeffe.cs.illinois.edu/teaching/algorithms/book/05-graphs.pdf . Backs the representation precondition added to the time bound. It gives the traversal as `O(V + E)` under a standard adjacency list and states that the running time rises to `O(V^2 + E)` if the graph is stored as an adjacency matrix, since a matrix forces a full row scan per vertex regardless of degree. It also states that unless said otherwise its graph-algorithm time bounds all assume a standard adjacency list, which is the convention this note follows.
- Strongly connected component, Wikipedia. https://en.wikipedia.org/wiki/Strongly_connected_component . Backs the Kosaraju/Tarjan scaffolding note: several DFS-based algorithms compute strongly connected components in linear time, Kosaraju's using two depth-first searches where the first fixes the order in which the second visits vertices, and Tarjan's using a single pass with a stack and low numbers.
- Biconnected component, Wikipedia. https://en.wikipedia.org/wiki/Biconnected_component . Backs the articulation-points application: the classic Hopcroft-Tarjan algorithm runs in linear time on a depth-first search, maintaining each vertex's depth in the DFS tree together with the lowpoint, the lowest depth reachable from any descendant, which is the low-link comparison this note describes.
- Topological sorting, Wikipedia. https://en.wikipedia.org/wiki/Topological_sorting . Backs the claim that the DFS-based method (prepending each vertex on exit, which is reverse postorder) runs in linear time and is the algorithm described in CLRS, and that a topological ordering exists if and only if the graph is acyclic.
