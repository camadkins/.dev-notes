---
title: Floyd–Warshall Algorithm
description: All-pairs shortest paths via dynamic programming on path "via" sets; handles negative edges and detects negative cycles using a simple triple loop.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-03
aliases: []
---

## Overview

The **Floyd–Warshall algorithm** computes **shortest paths between all pairs of vertices** in a weighted directed graph (can be undirected by adding symmetric edges). It works even with **negative edge weights** (but not negative cycles), and it **detects negative cycles** cleanly. The algorithm is a compact **dynamic programming** routine with a triple nested loop that considers, for each pair `(i, j)`, whether detouring through an intermediate vertex `k` yields a shorter path.

Compared to [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]], Floyd–Warshall is usually preferred when:

- you need **all pairs** anyway,

- the graph is **dense** or modest in size, or

- you have **negative edges** (but no negative cycles).


Its simplicity and small code footprint make it a standard baseline in teaching and practice.

## Core Idea

Let `dist[i][j]` be the best-known distance from `i` to `j`. The DP invariant after finishing outer loop value `k` is:

> All paths from `i` to `j` that use intermediates only from the set `{0,1,...,k}` have length `dist[i][j]`.

Initialization allows **no** intermediates (just direct edges). Each iteration `k` asks: is it shorter to go `i → k → j` than the current `i → j`? If yes, update.

This yields correctness [[cs/math/mathematical-induction|by induction]] on `k`. Negative cycles are visible because allowing all vertices as intermediates lets a cycle "shrink" the cost of returning to its own start: `dist[v][v] < 0`.

## Algorithm Steps / Pseudocode

**Inputs.**

- `n`: number of vertices, labeled `0..n-1`.

- `W`: adjacency matrix weights where:

    - `W[i][i] = 0`

    - `W[i][j] = weight(i→j)` if edge exists,

    - `W[i][j] = +∞` (a large sentinel) otherwise.


**Outputs.**

- `dist[i][j]`: length of the shortest path from `i` to `j` (or `+∞` if none).

- Optionally `next[i][j]` to reconstruct paths.


```pseudo
function FLOYD_WARSHALL(W, n):
    dist = W.clone()
    next = matrix(n,n)
    for i in 0..n-1:
        for j in 0..n-1:
            if i != j and W[i][j] < +∞:
                next[i][j] = j
            else:
                next[i][j] = NIL

    for k in 0..n-1:
        for i in 0..n-1:
            // small guard: skip rows/cols already +∞ to save work
            if dist[i][k] == +∞: continue
            for j in 0..n-1:
                if dist[k][j] == +∞: continue
                alt = dist[i][k] + dist[k][j]
                if alt < dist[i][j]:
                    dist[i][j] = alt
                    next[i][j] = next[i][k]   // path i→...→k then continue toward j

    // Negative cycle detection:
    for v in 0..n-1:
        if dist[v][v] < 0:
            // mark reachability from/to this cycle as -∞ or signal "affected by negative cycle"
            // optional handling; see notes below
    return (dist, next)
```

**Path reconstruction** (if `next` is maintained):

```pseudo
function RECONSTRUCT_PATH(next, i, j):
    if next[i][j] == NIL: return []  // no path
    path = [i]
    while i != j:
        i = next[i][j]
        path.append(i)
        if length(path) > N_LIMIT: error "negative cycle on path?"
    return path
```

> [!tip]
> If your application needs **only distances** (no paths), you can drop `next` entirely and keep just `dist`. If you only need to know whether a pair is affected by a **negative cycle**, run the triple loop once more: any `(i, j)` that can be improved again (or is reachable from and to a vertex with `dist[v][v] < 0`) is tainted.

## Example or Trace

Consider `n=4`, vertices `0..3`, with edges (directed) and weights:

- `0→1: 4`, `0→2: 11`

- `1→2: -2`, `1→3: 2`

- `2→3: 3`

- `3→0: 1`


Initialize `dist` with direct edges and zeros on the diagonal, `+∞` otherwise. Initially, for example, `dist[0][3] = +∞`.

Iterate `k = 0..3`:

- **k=0**: Allow paths via vertex `0`. You might update `dist[3][1]` because `3→0→1` yields `1+4=5` if it beats any existing value.

- **k=1**: Allow via `1`. `dist[0][2]` improves: `0→1→2` has `4 + (-2) = 2`, better than `11`. Then `0→3` improves via `0→1→3` (`4+2=6`).

- **k=2**: Allow via `2`. `0→3` can also go `0→1→2→3` for `4 + (-2) + 3 = 5`, one better than `6`, so it updates again.

- **k=3**: Allow via `3`. Some cycles may enable new improvements; here no negative cycles exist, so `dist[v][v]` stays `0`.


Final `dist` gives the shortest cost between every pair. Using `next`, `RECONSTRUCT_PATH(0,3)` yields `[0,1,2,3]`.

## Complexity Analysis

Let `n = |V|`.

- **Time:** `O(n^3)` for the triple loop. On dense graphs this competes well; on sparse graphs with many vertices it can be slow compared to running Dijkstra `n` times, which is `O(n m log n)` **with a binary heap** and `O(n m + n^2 log n)` **with a Fibonacci heap**. Note that repeated Dijkstra requires nonnegative weights, which Floyd-Warshall does not.

- **Space:** `O(n^2)` for `dist`, plus `O(n^2)` for `next` if kept.

- **Numerical concerns:** Distances can become very large in magnitude; choose a sentinel `+∞` that cannot be reached by legitimate sums, and guard against overflow if weights are large.


## Optimizations or Variants

- **In-place updates:** You can reuse the single `dist` matrix (no `k`-indexed layers) as in the pseudocode. It works because each update for `k` uses only values already restricted to intermediates `{0..k}`.

- **Bitset reachability:** When weights are unit (or you need just reachability), Warshall's algorithm with boolean matrices computes the **transitive closure** in `O(n^3)` bit operations; with bit-packing (word-level parallelism), it's fast in practice.

- **Blocking / [[cs/systems/memory-hierarchy-and-caching|cache-friendly loops]]:** Reorder the triple loop to improve cache reuse (`for k { for i { for j { ... }}}` is standard). For large `n`, **block** `i, j` loops (tiling) to keep working submatrices in cache.

- **Early exits:** If an application only needs some rows/columns (e.g., from a small subset of sources), prefer running Dijkstra/Bellman–Ford from those sources instead of full Floyd–Warshall.

- **Negative-cycle propagation:** After the main phase, a final pass can mark `(i, j)` as **-∞** if there exists a `k` with `dist[k][k] < 0` and both `i` can reach `k` and `k` can reach `j`. This explicitly signals "no well-defined shortest path."


## Applications

- **[[cs/systems/bgp-and-internet-routing-as-control|Routing and policy analysis]]:** All-pairs latency/cost maps in networks, road graphs (when small enough), or inter-module call graphs.

- **Prerequisite/ordering graphs:** Detect **inconsistencies** (negative cycles) when modeling constraints as weights.

- **Transitive closure / reachability** (Warshall): task dependency planning, database query optimization.

- **Centrality / similarity measures:** Pairwise shortest-path distances for small graphs feed into clustering, layout, or centrality scores.


## Common Pitfalls or Edge Cases

> [!warning]
> **Negative cycles.** If `dist[v][v] < 0` for any `v` after the algorithm, shortest paths are **undefined** for pairs that can reach and be reached from that cycle (you can drive cost to −∞). Do not use those distances as finite answers.

> [!warning]
> **Infinity handling.** Always check for `+∞` before adding `dist[i][k] + dist[k][j]` to avoid overflow or accidental wraparound.

> [!warning]
> **Path reconstruction without `next`.** If you skip the `next` matrix, you cannot reconstruct paths later without re-running or storing additional parent info.

> [!warning]
> **Indexing drift.** Ensure vertices are consistently indexed `0..n-1`. Mixing human labels with indices is a common source of off-by-one bugs.

## Implementation Notes or Trade-offs

- **Choosing representations:** Floyd–Warshall assumes an **adjacency matrix** style `dist`. For sparse graphs with large `n`, an adjacency list plus repeated single-source runs is often superior (see [[cs/dsa/graph-representations|Graph Representations]]).

- **Undirected graphs:** Insert both directions with the same weight; initialize `W[i][i]=0`.

- **Edge cases in initialization:** Multiple edges? Use the **minimum** weight. No self-loops? Keep `0` on the diagonal.

- **Numeric types:** Use 64-bit integers or doubles as appropriate; for doubles, beware of rounding if negative cycles nearly cancel out. Consider a large `INF = 1e18` for integers and check `abs(dist) < INF/2` when reporting.

- **Space-saving `next`:** Instead of `next[i][j]=j`, some implementations store **predecessors**; both are fine if used consistently. The "successor" approach shown above is straightforward for forward path building.


## Summary

Floyd–Warshall is a compact dynamic program for **all-pairs shortest paths** that tolerates **negative edges** and flags **negative cycles**. Initialize a `dist` matrix, run a simple triple loop that tries each vertex `k` as an intermediate, and optionally maintain a `next` matrix for **path reconstruction**. Its `O(n^3)` time and `O(n^2)` space make it ideal for small to medium graphs or as a clear, reliable baseline.

## Related Notes

- [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]]

- [[cs/dsa/graph-representations|Graph Representations]]

- [[cs/dsa/adjacency-matrix|Adjacency Matrix]]

- [[cs/dsa/dynamic-programming|Dynamic Programming]]

## Sources

- Floyd-Warshall algorithm, Wikipedia. https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm . Backs the headline claims and both complexity figures: it finds shortest paths in a directed weighted graph with positive or negative edge weights but no negative cycles, runs in `Theta(|V|^3)` in the best, average, and worst case, and uses `Theta(|V|^2)` space. It backs the negative-cycle section in detail, since it states that the algorithm assumes no negative cycles for numerically meaningful output, that a negative entry on the diagonal of the result signals at least one negative cycle, and that when a negative cycle is present the values can grow to order `6^n` times the largest absolute edge weight, so the check belongs inside the innermost loop, which is exactly the overflow warning this note gives. It is also the source for the corrected comparison bounds: Dijkstra from a single vertex is `Theta(|E| + |V| log |V|)`, so running it from each vertex takes `Theta(|E||V| + |V|^2 log |V|)`, with the further note that Floyd-Warshall tends to win in practice when the graph is dense and Dijkstra when it is sparse.
- Jeff Erickson, Algorithms, Chapter 9: All-Pairs Shortest Paths. https://jeffe.cs.illinois.edu/teaching/algorithms/book/09-apsp.pdf . Backs the core idea and the derivation of the triple loop. It defines the restricted path as the shortest path from `u` to `v` passing only through vertices numbered at most `r`, gives the recurrence in which each `r` either lies on the path or does not, and shows that dropping the third dimension of the memoization table yields the in-place `dist` matrix used here, in `O(V^3)` time. It also backs the binary-heap figure this note now quotes for repeated Dijkstra, stating that Dijkstra from every vertex gives an overall running time of `O(VE log V)`, with a footnote giving `O(V^3)` for the array implementation and `O(VE + V^2 log V)` for the Fibonacci-heap implementation.
- Transitive closure, Wikipedia. https://en.wikipedia.org/wiki/Transitive_closure . Backs the Warshall/bitset variant: the closure is typically stored as a Boolean matrix so that reachability is answered in constant time, and the problem can be solved by the Floyd-Warshall algorithm in `O(n^3)` or by reducing it to Boolean matrix multiplication.
- Johnson's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Johnson%27s_algorithm . Backs the sparse-graph alternative named in the early-exit variant: Johnson's method admits negative edge weights but no negative cycles, uses Bellman-Ford to reweight the graph so that all weights become nonnegative while preserving shortest paths, then runs Dijkstra from each vertex, which is why nonnegativity is a precondition on the repeated-Dijkstra comparison above.
- Bellman-Ford algorithm, Wikipedia. https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm . Backs the single-source alternative recommended when only a few rows are needed and negative weights are present, and it backs the underlying fact this note relies on for negative cycles: with a negative cycle reachable from the source there is no cheapest path, because any path touching the cycle can be made cheaper by walking the cycle again.
- Adjacency matrix, Wikipedia. https://en.wikipedia.org/wiki/Adjacency_matrix . Backs the representation note that Floyd-Warshall assumes a matrix-shaped `dist`, since it gives the matrix as the `n x n` table of edge presence or weight with the diagonal zero for a simple graph, and records that adjacency lists take less storage on a large sparse graph, which is the case this note routes away from the triple loop.
- Directed acyclic graph, Wikipedia. https://en.wikipedia.org/wiki/Directed_acyclic_graph . Backs the prerequisite-and-ordering application: a directed graph is acyclic exactly when it can be topologically ordered, so a cycle detected by weights summing negatively is the inconsistency this note describes in constraint graphs.
