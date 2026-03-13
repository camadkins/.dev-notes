---
title: Prim's Algorithm
description: Grow a minimum spanning tree from a seed by repeatedly adding the lightest frontier edge tracked in a priority queue.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2026-01-08
aliases: []

---

## Overview

**Prim's algorithm** constructs a **minimum spanning tree (MST)** of a connected, undirected, weighted graph by growing a single tree from an arbitrary **seed vertex**. At each step it adds the **lightest edge** crossing the cut between the current tree and the remaining vertices. A **priority queue (PQ)** maintains, for every vertex not yet in the tree, the cheapest known connection to the tree.

Key traits:

- **Greedy choice justified by the cut property** (the minimum crossing edge is safe).

- **Works with any real weights** (negative weights allowed).

- Complexity depends on representation:

    - **Adjacency lists + binary heap**: `O(m log n)`

    - **Adjacency lists + Fibonacci heap**: `O(m + n log n)` (theoretical)

    - **Adjacency matrix (dense)**: `O(n^2)`

## Core Idea

Maintain a set `Tree ⊆ V` and arrays:

- `inTree[v]` — whether `v` is already in the tree.

- `key[v]` — weight of the **lightest** edge `(u,v)` with `u ∈ Tree`.

- `parent[v]` — the `u` that achieves `key[v]`.

Initialize `key[s]=0` for a seed `s`, all others `∞`. Repeatedly extract the minimum-key vertex outside the tree, add it, and **relax** its incident edges to update neighbors' keys. The selected edges `(parent[v], v)` form the MST.

## Algorithm Steps / Pseudocode

### Prim with adjacency lists and a decrease-key PQ

```pseudo
function PRIM_MST(G, s):
    // G: adjacency list, G.Adj[u] = list of (v, w(u,v))
    n = |V|
    inTree[0..n-1] = false
    key[0..n-1] = +∞
    parent[0..n-1] = NIL
    key[s] = 0

    PQ = new min-priority-queue()          // supports DECREASE_KEY
    for v in V:
        PQ.insert(v, key[v])

    while not PQ.empty():
        u = PQ.extract_min()                // u has smallest key
        if key[u] == +∞:
            break                           // remaining vertices unreachable → forest
        inTree[u] = true
        for each (v, w) in G.Adj[u]:
            if not inTree[v] and w < key[v]:
                key[v] = w
                parent[v] = u
                PQ.decrease_key(v, w)

    // Output: parent[] encodes MST edges; sum(key[v]) over v with parent[v] ≠ NIL is MST weight
    return parent
```

### Lazy (no explicit decrease-key) variant

Push new `(v, newKey)` entries and ignore **stale** ones on extract.

```pseudo
function PRIM_LAZY(G, s):
    inTree = {false}; key = {+∞}; parent = {NIL}
    key[s] = 0
    PQ.insert((0, s, NIL))                  // (weight, vertex, parent)
    while not PQ.empty():
        (w,u,p) = PQ.extract_min()
        if inTree[u]: continue              // stale
        inTree[u] = true
        parent[u] = p
        for (v, wuv) in G.Adj[u]:
            if not inTree[v] and wuv < key[v]:
                key[v] = wuv
                PQ.insert((key[v], v, u))
    return parent
```

### Dense-graph `O(n^2)` Prim (no PQ, adjacency matrix)

```pseudo
function PRIM_MATRIX(W, s):
    // W[i][j] = weight or +∞ if no edge; symmetric
    n = |V|
    inTree[0..n-1] = false
    key[0..n-1] = +∞
    parent[0..n-1] = NIL
    key[s] = 0
    for iter in 1..n:
        u = argmin_{v not inTree} key[v]    // scan all v
        if key[u] == +∞: break              // disconnected
        inTree[u] = true
        for v in 0..n-1:
            if not inTree[v] and W[u][v] < key[v]:
                key[v] = W[u][v]
                parent[v] = u
    return parent
```

## Example or Trace

Consider a sparse graph with seed `s=A`. Initially `key[A]=0`, others `∞`. Extract `A`, relax edges to set neighbors' keys. Next extract the vertex `u` with the smallest key, add edge `(parent[u], u)`. Repeat until all reachable vertices are included. The final `parent[]` encodes edges of the MST.

## Complexity Analysis

Let `n=|V|`, `m=|E|`.

- **Adjacency list + binary heap**: each edge can trigger a **decrease-key** → `O(m log n)`; `n` extracts add `O(n log n)`.

- **Adjacency list + Fibonacci (or pairing) heap**: `O(m + n log n)` amortized with true `DECREASE_KEY`. Large constants and implementation complexity often erase the theoretical gains; a **binary** or **pairing heap** is typically competitive.

- **Adjacency matrix (dense)**: each iteration scans all vertices to find the minimum key and relaxes a full row → `O(n^2)`.

Memory: `Θ(n)` for `key`, `parent`, `inTree` plus graph storage (`Θ(m)` for lists or `Θ(n^2)` for a matrix).

> [!tip]
> For **dense graphs** (`m ≈ n^2`), the `O(n^2)` matrix variant is simple and fast in practice. For **sparse graphs**, prefer adjacency lists with a heap.

## Optimizations or Variants

- **Start from any seed**: MST cost is seed-independent (on connected graphs). Sometimes choose a seed with good locality (e.g., smallest degree) for cache benefits.

- **Batch small improvements**: When many neighbors update, some implementations **buffer** decreases and apply them in chunks to reduce PQ churn (workload dependent).

- **Key representation**: Store 64-bit (or wider) totals if weights can sum large; MST total weight can overflow 32-bit even if individual edges fit.

- **Indexing**: Keep vertices 0..n−1 for array-based speed; map labels to compact indices once.

- **Lazy vs eager**:

    - **Lazy** (no decrease-key): simpler, often **faster** in practice with binary heaps because decrease-key can be expensive. Requires ignoring stale entries on extract.

    - **Eager** (decrease-key): tight theoretical bounds; needs a heap that supports **decrease-key** efficiently.

### Specialized structures

- **Pairing heap**: simple, fast decrease-key empirically; popular alternative to Fibonacci heaps.

- **d-ary heap**: good when **decrease-key** frequency is low: cheaper `extract_min` amortized by fewer levels.

- **Bucket queues**: if weights are **small nonnegative integers**, buckets approach `O(m + C)` where `C` is max weight (Dial-like ideas).

### Parallel & Out-of-core

Prim's classical form is hard to parallelize due to the single global frontier, but:

- Partitioned graphs + **approximate** frontiers can be merged.

- For massive graphs, keep adjacency blocks and PQ on disk with batched relaxations (system-specific).

## Applications

- **Network design**: laying cable/pipe with minimum total cost.

- **Image/vision**: building region adjacency MSTs for segmentation.

- **Clustering (single-linkage)**: run Prim until `k` components remain (or cut the `k−1` largest edges afterward).

- **Approximation frameworks**: MSTs underlie **metric TSP** 2-approximation and **Steiner tree** heuristics.

## Common Pitfalls or Edge Cases

> [!warning]
> **Missing decrease-key.** If using an eager variant, implement **decrease-key** correctly. Otherwise, keys remain stale and the algorithm may add suboptimal edges.

> [!warning]
> **Disconnected graphs.** Prim builds an MST **only** for the connected component containing the seed. Detect `key[u]=∞` on extract and, if needed, restart from another seed to obtain a **minimum spanning forest**.

> [!warning]
> **Wrong neighbor relaxation.** Update a neighbor only when `w(u,v) < key[v]`; use strict `<` to get deterministic `parent[v]` when weights tie.

> [!warning]
> **PQ with stale entries (lazy Prim).** Always check `inTree[u]` after popping; skip nodes already added.

> [!warning]
> **Self-loops and parallel edges.** Ignore self-loops; with parallel edges, keep only the **lightest** for relaxation.

## Implementation Notes or Trade-offs

- **Adjacency structure**: store for each `u` a compact vector of `(v, w)` to improve locality. Sorting neighbors by weight is unnecessary but can slightly improve branch predictability.

- **Type choices**: prefer signed weights if negatives appear; Prim still works because only comparisons matter (no Dijkstra-style nonnegativity requirement).

- **Reconstruction**: the MST edge set is `{ (parent[v], v) | parent[v] ≠ NIL }`. Track `MST_weight = Σ key[v]` as you add vertices (excluding the seed's `0`).

- **Tie-breaking**: for reproducibility, break ties lexicographically on `(key[v], v)` or use a stable PQ key.

- **Testing**: verify against the **cut property**: at each step, check that the chosen edge is minimal among the current cut.

## Summary

Prim grows an MST from a seed by **repeatedly picking the lightest cut edge**, tracked via **keys** in a priority queue. On sparse graphs, an **adjacency list + heap** implementation yields `O(m log n)`; on dense graphs, a simple `O(n^2)` array-based Prim is often optimal. Robust implementations manage **decrease-key** (or use a **lazy** approach), handle **disconnected graphs** by producing a forest, and store parents to reconstruct the tree.

## See also

- [[kruskals-algorithm|Kruskal's Algorithm]]

- [[minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees — Kruskal & Prim]]

- [[graph-representations|Graph Representations]]

- [[graphs|Graphs — Overview]]
