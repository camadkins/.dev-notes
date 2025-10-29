---
title: Disjoint Set (Union–Find)
description: Maintain dynamic connectivity via find/union with path compression and union by rank/size; supports near-constant-time operations.
draft: true
tags:
- cs
- dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
# - uf-parent-pointers.svg — Forest of parent pointers with representative roots; show ranks/sizes and path compression effect after finds.
# - uf-kruskal-trace.svg — Kruskal step trace: edges in weight order, unions that connect components, and a cycle-reject example.
---

## Overview
A **disjoint set** (Union–Find) maintains a partition of elements into **disjoint components** under two operations: `FIND(x)` returns the component’s **representative** (root) of `x`, and `UNION(x,y)` merges the components containing `x` and `y`. With **path compression** (during `FIND`) and **union by rank/size**, both operations run in **amortized almost-constant time**: $O(\alpha(n))$, where $\alpha$ is the inverse Ackermann function.

> [!example]
> **Diagram (`uf-parent-pointers.svg`)** — Draw a small forest with parent pointers and root ranks/sizes; issue a series of `FIND`s to show how **path compression** flattens trees (most nodes point directly to the root afterward).

## Structure Definition
- **Universe:** elements indexed `0..n-1`.
- **Arrays:**  
  - `parent[i]`: parent pointer; roots satisfy `parent[i] = i`.  
  - `rank[i]` *or* `size[i]`: tie-breaker for unions (rank ≈ upper bound on tree height).
- **Invariants:** Each set is a rooted tree; paths follow `parent` pointers up to a root (the representative).

## Core Operations
### Make-set
```pseudo
function MAKE_SET(n):
    for i in 0..n-1:
        parent[i] = i
        rank[i] = 0        // or size[i] = 1
````

### Find with path compression

```pseudo
function FIND(x):
    if parent[x] != x:
        parent[x] = FIND(parent[x])   // path compression
    return parent[x]
```

### Union by rank (or by size)

```pseudo
function UNION(x, y):
    rx = FIND(x)
    ry = FIND(y)
    if rx == ry: return rx            // already same set
    // attach smaller-rank tree under larger-rank tree
    if rank[rx] < rank[ry]:
        parent[rx] = ry
        return ry
    else if rank[rx] > rank[ry]:
        parent[ry] = rx
        return rx
    else:
        parent[ry] = rx
        rank[rx] = rank[rx] + 1
        return rx
```

> [!tip]  
> **Rank vs size.** Either works. _Rank_ is a theoretical height bound; _size_ is often simpler and competitive in practice (attach smaller to larger).

## Example (Stepwise)

Start with elements `{0,1,2,3,4,5}` as singletons.

1. `UNION(0,1)` → root `0` with rank 1; sets: `{0,1}`, `{2}`, `{3}`, `{4}`, `{5}`.
    
2. `UNION(2,3)` → root `2`; sets: `{0,1}`, `{2,3}`, `{4}`, `{5}`.
    
3. `UNION(1,3)` → finds `FIND(1)=0`, `FIND(3)=2`; ranks equal → attach `2` under `0`, increment `rank[0]`; sets: `{0,1,2,3}`, `{4}`, `{5}`.
    
4. `FIND(3)` after prior unions compresses path so `parent[3]=0` directly.
    

> [!example]  
> **Diagram (`uf-kruskal-trace.svg`)** — In a small weighted graph, sort edges; for each edge `(u,v)`, draw whether `FIND(u)≠FIND(v)` (edge chosen, UNION performed) or equal (edge rejected as cycle). This ties Union–Find to MST construction.

## Complexity and Performance

- **Time (amortized):** With **path compression** + **union by rank/size**, any sequence of `p` operations on `n` elements runs in $O((n + p),\alpha(n))$, which is effectively **constant** per operation for all practical input sizes.
    
- **Space:** `O(n)` for `parent` plus `rank`/`size`.
    

**Why it’s fast.** Path compression flattens find-paths aggressively; union by rank/size prevents tall trees from forming. Together, they limit future costs to the tiny inverse Ackermann factor.

## Implementation Details or Trade-offs

- **Path compression variants:**
    
    - _Full compression_ (as above) sets every node on the path directly to the root.
        
    - _Path halving_ / _path splitting_ adjust every other node; often faster in tight loops due to fewer recursive calls.
        
- **Iterative find:** Re-implement `FIND` iteratively to avoid recursion limits; second pass compresses parents to the root.
    
- **ID mapping:** If elements aren’t dense integers, map them to `0..n-1` with a dictionary; store original IDs separately.
    
- **Threading:** Naïve Union–Find isn’t thread-safe; for parallel Kruskal use coarse-grained locks per root or batched unions (specialized algorithms exist).
    

## Practical Use Cases

- **Dynamic connectivity:** Maintain connectivity as edges are added in an undirected graph.
    
- **Minimum spanning tree:** Kruskal’s algorithm repeatedly unions endpoints of chosen edges. See [[cs/dsa/kruskals-algorithm|Kruskal's Algorithm]] and [[cs/dsa/minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees: Kruskal & Prim]].
    
- **Clustering & segmentation:** Merge by similarity thresholds (e.g., image components).
    
- **Equivalence closure:** Merge constraints expressing “must be equal.”
    

## Limitations / Pitfalls

> [!warning]  
> **Forgetting compression.** Union by rank/size **alone** can still leave long paths after many finds; always combine with **path compression**.

> [!warning]  
> **Rank updates.** Only increase rank when two **equal-rank** roots are united; otherwise rank is unchanged. Incorrect rank bumps degrade performance.

> [!warning]  
> **Directed graphs.** Union–Find models **undirected** connectivity; for directed reachability, use graph algorithms (e.g., DFS/BFS, SCC).

## Summary

Union–Find represents components as **parent-pointer forests** and achieves **near-constant** amortized time for connectivity queries by combining **path compression** with **union by rank/size**. It is the standard backbone for dynamic connectivity and MST algorithms due to its simplicity, speed, and small memory footprint.

## See also

- [[cs/dsa/kruskals-algorithm|Kruskal's Algorithm]]
    
- [[cs/dsa/minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees: Kruskal & Prim]]
    
- [[cs/dsa/graph-representations|Graph Representations]]
    