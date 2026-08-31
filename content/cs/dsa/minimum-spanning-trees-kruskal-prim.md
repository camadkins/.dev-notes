---

title: Minimum Spanning Trees
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

- **Cycle property**: In _any_ cycle, an edge **strictly heavier than every other edge of that cycle** is excluded from _all_ MSTs. The strictness matters: if the maximum weight on the cycle is tied, a heaviest edge may still sit in an MST.

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
**Cycle property (forbidden edge).** For any cycle, an edge whose weight is **strictly larger than the weight of every other edge of that cycle** cannot belong to **any** MST.

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

- With **Fibonacci heap** and adjacency lists: `O(m + n log n)` (theoretical; large constants).
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


## Sources

- Minimum spanning tree, Wikipedia. https://en.wikipedia.org/wiki/Minimum_spanning_tree . Backs the two structural facts and the uniqueness discussion. Its cut property states that for any cut, an edge in the cut-set whose weight is strictly smaller than every other cut-set edge belongs to all MSTs, and adds that when more than one edge ties for minimum weight across a cut, each such edge is contained in some minimum spanning tree, which is the safe-edge phrasing this note uses. Its cycle property is the source for the strictness correction made above: the edge ruled out is one whose weight is larger than any of the individual weights of all other edges of the cycle. It also backs the uniqueness claim (distinct edge weights give exactly one MST, generalizing to forests), the multiplicity claim (with all weights equal, every spanning tree is minimum), that a spanning tree on `n` vertices has `n - 1` edges, and the clustering application via single-linkage hierarchical clustering.
- Jeff Erickson, Algorithms, Chapter 7: Minimum Spanning Trees. https://jeffe.cs.illinois.edu/teaching/algorithms/book/07-mst.pdf . Backs the safe/useless vocabulary this note's correctness sketches run on, defining an edge as safe when it is the minimum-weight edge with exactly one endpoint in some component of the evolving forest and useless when both endpoints are already in the same component, then proving that the MST contains every safe edge and no useless edge. It backs the negative-weight remark directly, since it defines the input weight function as assigning a real weight to each edge which may be positive, negative, or zero. It backs the uniqueness lemma and the deterministic tie-breaking device that lets an algorithm assuming distinct weights run on a graph with ties. On costs it gives Kruskal as `O(E log E) = O(E log V)` dominated by the initial sort with the disjoint-set work smaller, Prim (Jarnik) as `O(E log E) = O(E log V)` with a binary heap and `O(E + V log V)` with a Fibonacci heap because insert and decrease-key become constant amortized there, and Boruvka as `O(E log V)`.
- Kruskal's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Kruskal%27s_algorithm . Backs the algorithm as stated and its cost line: it finds a minimum spanning forest and therefore a minimum spanning tree when the graph is connected, adds in each step the lowest-weight edge that will not form a cycle, and its running time is dominated by sorting the edges, `O(E log E)`, with the disjoint-set loop contributing only `O(E alpha(V))`. It also backs the bucketed-weights tip (with integer weights small enough for counting or radix sort the total drops to `O(E alpha(V))`) and the Filter-Kruskal variant attributed to Osipov, Sanders, and Singler, including its quicksort-style partitioning and its suitability for parallelization.
- Prim's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Prim%27s_algorithm . Backs the Prim cost table with each bound's precondition attached, which is the point this note now makes explicit: an adjacency matrix with linear search gives `O(|V|^2)`, a binary heap with an adjacency list gives `O((|V| + |E|) log |V|) = O(|E| log |V|)`, and a Fibonacci heap with an adjacency list gives `O(|E| + |V| log |V|)`. It also backs the disconnected-input pitfall, since the most basic form of Prim's algorithm finds a minimum spanning tree only in connected graphs and must be rerun per component to yield a forest, and the decrease-key description of the relax step.
- Disjoint-set data structure, Wikipedia. https://en.wikipedia.org/wiki/Disjoint-set_data_structure . Backs the DSU requirement and the `alpha(n)` figure: a disjoint-set forest performs union and find in near-constant amortized time, `O(m alpha(n))` total for `m` operations, and tree height is controlled by union by size or union by rank while path compression flattens the find path, which is why omitting either degrades the bound.
- Borůvka's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Bor%C5%AFvka%27s_algorithm . Backs the Boruvka variant described in the hybrids section: each round finds the connected components of the current forest and the cheapest edge leaving each one, each repetition reduces the number of trees within a component to at most half its former value, and the running time is `O(|E| log |V|)`. It also records that the algorithm is frequently called Sollin's algorithm especially in the parallel computing literature, which is the parallel-friendliness this note claims.
- Matroid, Wikipedia. https://en.wikipedia.org/wiki/Matroid . Backs the matroid view: every finite graph or multigraph yields a cycle matroid whose independent sets are exactly the forests, that is, the edge sets containing no simple cycle, and a maximum-weight independent set in a weighted matroid is found by a greedy algorithm, a property that in fact characterizes matroids. Kruskal's edge-order scan is that greedy algorithm run on the graphic matroid, with weights negated so the extremum is a minimum.
