---

title: Kruskal's Algorithm
description: Greedy MST construction by sorting edges and adding those that connect different components, implemented efficiently with Union-Find (DSU).
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-12-22
aliases: []

---

## Overview

**Kruskal's algorithm** builds a **minimum spanning tree** (MST) of a weighted, undirected graph by processing edges in **increasing weight** and adding an edge **iff** it connects two **different components**. The test "are the endpoints already connected?" is answered fast using a **Disjoint Set Union (DSU)**, also called **Union-Find**. With sorting cost `O(m log m)` (`m = |E|`) and near-constant amortized DSU operations, Kruskal is a simple, scalable baseline for MST on sparse and medium-dense graphs.

## Core Idea

The algorithm is a **greedy** matroid-style selection procedure:

- Maintain a **forest** (set of trees). Initially every vertex is its own tree.

- Consider edges by **nondecreasing weight**.

    - If an edge `(u,v,w)` connects **different** trees (components), **add** it and **merge** the two trees.

    - Otherwise, **skip** it (it would create a cycle).

- When exactly `|V|-1` edges have been accepted (or the edge list is exhausted), the union of chosen edges is an MST (or a minimum **spanning forest** if the graph is disconnected).

**Cut property.** For any partition (cut) of the vertices, the **lightest edge** crossing the cut is **safe** to include in some MST. Sorting globally and picking safe edges as they appear ensures correctness.

## Algorithm Steps / Pseudocode

We use `Adj` only for input; Kruskal operates on the **edge list**. DSU supports:

- `FIND(x)` → representative of the component containing `x` (with **path compression**).

- `UNION(a, b)` → merge components by **rank/size**.

```pseudo
function KRUSKAL_MST(V, E):                // V: set of vertices, E: list of (u, v, w)
    sort E by weight nondecreasing
    DSU dsu = MAKE_DSU(V)                   // each v ∈ V in its own set
    MST = empty list
    total = 0
    for each (u, v, w) in E:
        if dsu.FIND(u) != dsu.FIND(v):      // endpoints in different components?
            dsu.UNION(u, v)                 // merge components
            MST.append((u, v, w))           // accept edge
            total = total + w
            if MST.size == |V| - 1:         // early stop: tree complete
                break
        else:
            continue                        // skip cycle-forming edge
    // If MST.size < |V|-1, the graph is disconnected; MST is a forest.
    return (MST, total)
```

**DSU (Union-Find) essentials**

```pseudo
function MAKE_DSU(V):
    for v in V:
        parent[v] = v
        rank[v] = 0
    return (parent, rank)

function FIND(x):
    if parent[x] != x:
        parent[x] = FIND(parent[x])         // path compression
    return parent[x]

function UNION(a, b):
    ra = FIND(a); rb = FIND(b)
    if ra == rb: return
    if rank[ra] < rank[rb]: swap(ra, rb)    // attach smaller rank under larger
    parent[rb] = ra
    if rank[ra] == rank[rb]:
        rank[ra] = rank[ra] + 1
```

> [!tip]
> **Early termination:** As soon as `|V|-1` edges are accepted, the MST is complete—stop scanning even if edges remain.

## Example or Trace

Let `V = {A,B,C,D,E}` and edges with weights:

```
(A,B,1), (B,C,2), (A,C,3), (C,D,4), (B,D,5), (D,E,6), (C,E,7)
```

1. **Sort**: `[(A,B,1), (B,C,2), (A,C,3), (C,D,4), (B,D,5), (D,E,6), (C,E,7)]`

2. Initialize DSU: `{A},{B},{C},{D},{E}`

- Take `(A,B,1)`: `FIND(A) ≠ FIND(B)` → **add**; merge `{A,B}`.

- Take `(B,C,2)`: `{A,B}` and `{C}` → **add**; merge `{A,B,C}`.

- Consider `(A,C,3)`: both in `{A,B,C}` → **skip** (cycle).

- Take `(C,D,4)`: `{A,B,C}` and `{D}` → **add**; merge `{A,B,C,D}`.

- Take `(B,D,5)`: both in `{A,B,C,D}` → **skip**.

- Take `(D,E,6)`: `{A,B,C,D}` and `{E}` → **add**; merge all `{A,B,C,D,E}`.

Accepted edges: `{(A,B,1), (B,C,2), (C,D,4), (D,E,6)}` with total weight `1+2+4+6 = 13`. We have `|V|-1 = 4` edges—**done**.

## Complexity Analysis

Let `n = |V|`, `m = |E|`.

- **Sorting edges:** `O(m log m)` dominates in typical implementations. (Since `m ≤ n(n-1)/2`, `log m = O(log n^2) = O(log n)` asymptotically.)

- **DSU operations:** Each edge incurs up to two `FIND`s and at most `n-1` `UNION`s overall. With **path compression** and **union by rank/size**, the total is `O(m α(n))`, where `α` is the inverse Ackermann function (≤ 5 in any practical universe).

- **Overall:** `O(m log m)` time, `O(n)` DSU space plus `O(m)` to store edges.

**Special cases**

- If edges are drawn from a **small integer range**, **counting/radix sort** reduces sorting to `O(m)` for near-linear total time.

- For **sparse graphs** (`m = O(n)`), Kruskal runs in `O(n log n)`.

## Optimizations or Variants

- **Edge bucketing / Radix sort.** For integer weights with bounded range or 32-bit keys, non-comparison sorts outperform `O(m log m)`.

- **Filter-Kruskal (streaming).** Partition edges by weight buckets; run Kruskal on each bucket while **filtering** edges whose endpoints are already connected early, reducing DSU calls.

- **Partial Kruskal for k-clustering.** Stop after exactly `n - k` unions to form `k` clusters; the next lightest inter-cluster edge is a natural distance threshold (single-linkage).

- **Boruvka + Kruskal hybrids.** Run a few rounds of **Boruvka's algorithm** to shrink components quickly (linear work), then finish with Kruskal on the reduced graph.

- **Parallel Kruskal.** Sort in parallel; apply unions on independent edge batches with conflict resolution (e.g., filter-then-union, or use concurrent DSU with careful partitioning).

## Applications

- **Network design:** Build least-cost backbones (fiber, roads, power).

- **Clustering (single-link):** MST-based clustering cuts the longest edges to form groups.

- **Image segmentation:** Graphs over pixels/superpixels with contrast as weight; MST defines natural merges.

- **Approximation frameworks:** An MST underlies **metric TSP 2-approx** (double-tree shortcutting).

- **Redundancy elimination:** Keep a connectivity-preserving minimal subset of links in overlay networks.

## Common Pitfalls or Edge Cases

> [!warning]
> **Missing DSU optimizations.** Without **path compression** and **union by rank/size**, Union-Find degenerates and can dominate runtime. Always enable both.

> [!warning]
> **Disconnected graphs.** If `|MST| < n-1` when edges are exhausted, the input is disconnected; the result is a **minimum spanning forest**. Don't report failure unless a **single-tree** MST is explicitly required.

> [!warning]
> **Self-loops / parallel edges.** Ignore **self-loops** `(u,u,w)`. For **multi-edges** between the same pair `(u,v)`, keep all in the list; Kruskal naturally picks the lightest when it appears and later ones will be skipped.

> [!warning]
> **Tie-handling and determinism.** Equal-weight edges may be accepted in different orders yet yield valid MSTs (possibly non-unique). For reproducibility, define a **stable tie-break** (e.g., by `(w, u, v)`).

> [!warning]
> **Overflow in totals.** Summing many weights can overflow 32-bit integers. Use 64-bit (or big integer) accumulation when weights are large.

> [!warning]
> **Directed or negative edges.** Kruskal assumes **undirected** graphs. Negative weights are fine in undirected MST; they are simply processed early by the sort.

## Implementation Notes or Trade-offs

- **Data layout.** Store edges as structs `(u, v, w)` in a flat array; this is cache-friendly for sort + linear scan.

- **Indexing.** Use 0-based vertex IDs; ensure DSU arrays are sized `n`.

- **Early exit.** Track the number of accepted edges and break when it reaches `n-1`.

- **I/O scale.** For massive graphs, read edges in chunks, external-sort by weight, and stream through Kruskal with DSU in memory (external-memory MST).

- **Prim vs Kruskal.** Kruskal pairs naturally with **edge lists** and shines when you can sort cheaply; **Prim's** algorithm is better with **adjacency structures** and a good priority queue on very dense graphs. See [[cs/dsa/prims-algorithm|Prim's Algorithm]].

## Summary

Kruskal's algorithm is a **greedy, edge-sorted** approach to MST: sort edges, scan in increasing order, and add an edge **iff** it connects **different DSU components**. With **path compression** and **union by rank/size**, DSU queries are nearly constant-time, so **sorting dominates**. The method is easy to implement, robust on sparse graphs, and adaptable to clustering and streaming settings.

## See also

- [[cs/dsa/minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees — Kruskal & Prim]]

- [[cs/dsa/prims-algorithm|Prim's Algorithm]]

- [[cs/dsa/disjoint-set-union-union-find|Disjoint Set Union (Union-Find)]]

- [[cs/dsa/graphs|Graphs — Overview]]
