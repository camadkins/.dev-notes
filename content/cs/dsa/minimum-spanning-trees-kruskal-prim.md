---

title: Minimum Spanning Trees - Kruskal & Prim
description: MST fundamentals via cut/cycle properties and two classic workflows- Kruskal with Union-Find and Prim with a priority queue.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-03
aliases: []

---

## Overview

A **minimum spanning tree (MST)** of a [[cs/math/graph-theory|connected, undirected, weighted graph]] connects all vertices with the **minimum total edge weight** and **no cycles**. Two algorithms dominate practice:

- **Kruskal's algorithm**: sort edges by weight and add an edge if it links **different components**, using a **Disjoint Set Union (DSU)** to test connectivity quickly.

- **Prim's algorithm**: grow a single **tree** from an arbitrary start vertex, repeatedly adding the **lightest edge** from the current tree to a new vertex via a **priority queue (PQ)** of keys.

Both rely on two structural facts:

- **Cut property**: In _any_ cut, the **lightest crossing edge** is safe to include in some MST.

- **Cycle property**: In _any_ cycle, the **heaviest edge** is excluded from _all_ MSTs.

These properties justify each algorithm's local choice and are the basis for correctness proofs.

## Motivation

MSTs model "connect everything as cheaply as possible" problems: [[cs/systems/physical-layer-of-the-internet|laying fiber networks]], road/pipe planning, clustering via graph distances, and deduplication of redundant links. Choosing **Kruskal vs Prim** depends on the **graph representation**, **density**, and **weight distribution**:

- Edge list + sparse graph → **Kruskal** is natural after sorting.

- Adjacency-heavy access + very dense graph → **Prim** with a good PQ is often better.

- Streaming/bucketed weights → **Kruskal** variants (Filter-Kruskal, radix-bucket sorting) shine.

## Definition and Formalism

Let `G=(V,E,w)` with nonnegative (or arbitrary) edge weights. An MST is a spanning tree `T ⊂ E` minimizing `w(T) = Σ_{e∈T} w(e)`. If `G` is disconnected, the algorithms produce a **minimum spanning forest** (one tree per component).

**Cut (S, V\S).** A set of vertices `S ⊂ V` defines a cut; edges with one endpoint in `S` and the other in `V\S` are said to **cross** the cut.

**Cut property (safe edge).** For any cut `(S, V\S)`, the **lightest** crossing edge is **safe** - it can appear in **some** MST.
**Cycle property (forbidden edge).** For any cycle, the **heaviest** edge cannot belong to **any** MST.

These are dual ways to reason about safe inclusion vs exclusion.

> [!note]
> Negative weights are fine in undirected MSTs; algorithms still choose the lightest edges. Multi-edges are allowed; self-loops are always ignored.

## Example or Illustration

Imagine a five-vertex graph. The **lightest cut edge** across `{A,B}` and `{C,D,E}` is `(B,C,2)` - safe by the cut property. In a cycle `(C,D,4)`, `(D,E,6)`, `(C,E,7)`, the **heaviest** `(C,E,7)` is guaranteed **out** by the cycle property.

## Properties and Relationships

- **Uniqueness.** If all edge weights are **distinct**, the MST is **unique**. With ties, multiple MSTs may exist; the algorithms can return any one of them.

- **Stability under ties.** Deterministic **tie-breaking** (e.g., lexicographic by `(w,u,v)`) ensures reproducible results.

- **Matroid view.** Kruskal realizes a **greedy algorithm on a graphic matroid**; the cut property generalizes as a matroid **exchange** argument.

- **Edge vs vertex perspective.** Kruskal is an **edge-centric** scan; Prim is a **vertex-centric** growth.

## Implementation or Practical Context

### Kruskal's Algorithm - Named Steps & Invariants

**Inputs**: edge list `E`, vertex set `V`.
**Data structure**: **DSU** with path compression and union by rank/size.

1. **Sort edges** nondecreasing by weight. _(Invariant: edges before position `p` are processed; MST set `T` is always acyclic.)_

2. **Initialize** DSU: each vertex its own set.

3. **Scan edges** in order:

    - If `FIND(u) ≠ FIND(v)`, **add** `(u,v)` to `T` and **UNION** the sets.

    - Else **skip** (would form a cycle; cycle property).

4. **Stop** when `|T| = |V| − 1` (connected case) or edges are exhausted.

**Correctness sketch**: At the point of considering an edge `(u,v)`, the DSU partition defines a **cut**. If `(u,v)` connects two different components, it is the **lightest available** across that cut and therefore **safe** (cut property). Skipped edges close a cycle and must **not** be chosen (cycle property).

**Cost**: `O(m log m)` for sorting + `O(m α(n))` DSU ops → overall `O(m log m)`.

> [!tip]
> For integer weights with small range, bucket/radix sort reduces the `log m` factor and can make Kruskal nearly linear.

### Prim's Algorithm - Named Steps & Invariants

**Inputs**: adjacency structure (list or matrix), start vertex `s`.
**Data structure**: **Priority Queue** keyed by the **cheapest known edge** connecting each **outside** vertex to the current tree.

1. **Initialize**: `inTree[v]=false` for all `v`; set `key[s]=0`, others `∞`; PQ contains `(s,0)` and `(v,∞)` or is filled lazily.

2. **Extract-min** `(u, key[u])` from PQ. _(Invariant: edges chosen so far form a tree; `key[v]` is the weight of the best known crossing edge to `v`.)_

3. **Add `u` to the tree**: `inTree[u]=true`. If `u ≠ s`, record its parent edge.

4. **Relax neighbors**: For each edge `(u,v,w)`, if `!inTree[v]` and `w < key[v]`, then **decrease-key** `v` in the PQ and set `parent[v]=u`.

5. **Repeat** until all vertices are in the tree or the PQ empties (disconnected graph → forest).

**Correctness sketch**: At each step, `key[v]` captures the **lightest** edge crossing the cut `(Tree, V\Tree)` to `v`. Extracting the minimum `key[u]` selects the **lightest cut edge**, which is **safe** by the cut property.

**Cost** (sparse graphs):

- With **binary heap** PQ and adjacency lists: `O(m log n)`.

- With **Fibonacci heap**: `O(m + n log n)` (theoretical; large constants).
    **Dense graphs** with adjacency matrices can use a simple `O(n^2)` Prim (scan all keys per step), which is effective when `m ≈ n^2`.

> [!warning]
> Real-world bug: **missing decrease-key**. If your PQ doesn't support **decrease-key**, push a new pair `(v,newKey)` and mark stale entries. Ensure you still connect `v` via the **lowest key** seen when it pops.

### When to Prefer Which

- **Kruskal**: natural for **edge-list inputs**, good with **sparse graphs** and easy parallel sorting; trivially yields a **forest** if the graph is disconnected. Works well with **integer weights** and bucketed sorting.

- **Prim**: excels on **very dense** graphs or when using an adjacency structure and a strong **PQ**; straightforward to start at any root and stop early if desired (e.g., partial tree for a connected component).

### Data & Representation Effects

- **Adjacency list** favors Prim with binary/Fibonacci heaps for large sparse graphs.

- **Adjacency matrix** makes a simple `O(n^2)` Prim attractive for dense graphs.

- **Edge list** is a perfect fit for Kruskal. Converting between forms costs time and memory - choose algorithms that suit the given form.

### Variants & Hybrids

- **Filter-Kruskal (streaming)**: bucket edges by ranges, filter with DSU before sorting within heavy buckets.

- **Boruvka's algorithm**: repeatedly add the **lightest outgoing edge per component**; merges components in rounds and parallelizes well. Often combined with Kruskal/Prim.

- **Partial MST / clustering**: stop Kruskal after `n−k` unions to obtain `k` clusters; the next lightest inter-cluster edge is a natural threshold.

## Common Pitfalls or Edge Cases

> [!warning]
> **Disconnected input**: both algorithms return a **spanning forest**. Do not assume a single tree unless the graph is connected.

> [!warning]
> **Tie-breaking**: non-deterministic iteration over neighbors or edges with equal weights can produce different (but valid) MSTs. Use a stable order if reproducibility matters.

> [!warning]
> **DSU without compression/rank**: Kruskal's DSU must use **path compression** and **union by rank/size**; otherwise DSU cost can dominate.

> [!warning]
> **PQ key discipline**: Prim's requires that `key[v]` always represent the **best known** frontier edge. If implementing without true decrease-key, guard against stale entries.

> [!warning]
> **Self-loops and parallel edges**: ignore self-loops; keep parallel edges - algorithms naturally choose the lightest.

## Implementation Notes or Trade-offs

- **Numeric safety**: accumulate weights in 64-bit (or wider) to avoid overflow on large graphs.

- **Early stopping**: Kruskal stops once `|V|−1` edges are taken; Prim stops when all `inTree[v]=true` for the current component.

- **Parallelization**: sorting (Kruskal) and Boruvka rounds parallelize; Prim is less parallel in its classical form due to the PQ.

- **Memory locality**: store edges contiguously for Kruskal; for Prim, keep adjacency lists sorted or grouped by component to improve cache behavior.

- **Libraries**: many graph libs provide MST; verify whether they return **parent arrays**, **edge lists**, or both.

## Summary

MST construction rests on **cut** and **cycle** properties. **Kruskal** greedily accepts safe edges across DSU **components** by global **edge order**; **Prim** greedily extends a single **tree** via the **lightest frontier edge** tracked in a **PQ**. Complexity depends on representation and data structures: `O(m log m)` for Kruskal vs `O(m log n)` (sparse) or `O(n^2)` (dense) for Prim. Choose based on **input form**, **graph density**, and **performance goals**; combine with Boruvka or bucketed sorts when beneficial.

## Related Notes

- [[cs/dsa/kruskals-algorithm|Kruskal's Algorithm]]

- [[cs/dsa/prims-algorithm|Prim's Algorithm]]

- [[cs/dsa/graph-representations|Graph Representations]]
