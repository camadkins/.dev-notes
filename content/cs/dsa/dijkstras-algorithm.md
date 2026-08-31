---
title: Dijkstra's Algorithm  
description: Single-source shortest paths on non-negative weighted graphs using a priority queue and a settled/frontier partition.  
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16  
updated:  
aliases: []
---

## Overview

**Dijkstra’s algorithm** computes **single-source shortest paths** in graphs with **non-negative edge weights**. It maintains a set `S` of **settled** vertices (final distances) and a **priority queue** keyed by current best tentative distances for a **frontier** of discovered vertices. Each step removes the vertex with minimum tentative distance, **relaxes** its outgoing edges, and repeats until all reachable vertices are settled. The method is correct because removing the smallest tentative distance is safe when all edges are non-negative.

![Dijkstra state after popping b: settled set S with final distances, frontier PQ with tentative keys, and relaxation edges highlighted](cs/dsa/assets/dijkstra-frontier.svg)

## Core Idea

Maintain distances `dist[u]` initialized to `∞` (`dist[s]=0`). Use a **min-priority queue** keyed by `dist`. Repeatedly:

1. **Extract-min** `u` from the PQ (this finalizes `dist[u]`).
    
2. For each outgoing edge `(u,v,w≥0)`, attempt **relaxation**: if `dist[u]+w < dist[v]`, update `dist[v]` and parent `π[v]=u`, and reflect the new key in the PQ.
    

Non-negativity ensures the smallest tentative distance is **globally minimal** among all unsettled vertices, so once popped, a vertex’s distance cannot be improved.

## Algorithm Steps / Pseudocode

`G` is directed or undirected with non-negative weights. Two PQ patterns are common:

- **Decrease-key**: maintain one handle per vertex in the PQ and decrease its key on improvement.
    
- **Push-many (no decrease-key)**: push a new pair `(dist[v], v)` whenever improved; when a popped pair is **stale** (doesn’t match `dist[v]`), skip it.
    

```pseudo
function DIJKSTRA(G, s):
    for each vertex v in V(G):
        dist[v] = ∞
        π[v] = NIL
    dist[s] = 0

    // choose one:
    // (A) decrease-key structure
    PQ = new MinPQ()
    for each v in V(G):
        PQ.insert(v, dist[v])              // or only insert s; others on discovery

    // main loop
    while PQ not empty:
        (u, d) = PQ.extract_min()
        if d != dist[u]: continue          // this line enables push-many pattern
        for each edge (u, v, w) in Adj[u]:
            if w < 0: error("negative edge not allowed")
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                π[v] = u
                if PQ.has_handle(v): PQ.decrease_key(v, dist[v])
                else PQ.insert(v, dist[v])
    return (dist, π)
```

> [!tip]  
> **Push-many vs decrease-key.** Use decrease-key with a handle-based PQ (e.g., pairing heap, Fibonacci, or a binary heap with indices). If your PQ lacks decrease-key, **push-many** plus a “skip stale pops” check keeps the algorithm correct with a small constant-factor overhead.

## Example or Trace

Consider source `s` and edges (undirected, shown as two directed edges) with weights non-negative:

- `s→a:4`, `s→b:2`, `a→c:3`, `b→a:1`, `b→d:7`, `c→d:2`, `c→e:5`, `d→e:1`
    

1. Init: `dist[s]=0`, others `∞`; PQ=`[(s,0)]`.
    
2. Pop `s` (settled). Relax `s→a(4)` → `dist[a]=4`; `s→b(2)` → `dist[b]=2`. PQ=`[(b,2),(a,4)]`.
    
3. Pop `b` (settled at 2). Relax `b→a(1)` → `dist[a]=3` (improved from 4), `π[a]=b`; relax `b→d(7)` → `dist[d]=9`. PQ now has updated `(a,3)`, `(d,9)`.
    
4. Pop `a` (settled at 3). Relax `a→c(3)` → `dist[c]=6`. PQ adds `(c,6)`.
    
5. Pop `c` (6). Relax `c→d(2)` → `dist[d]=8` (improved from 9); `c→e(5)` → `dist[e]=11`.
    
6. Pop `d` (8). Relax `d→e(1)` → `dist[e]=9` (improved from 11) with `π[e]=d`.
    
7. Pop `e` (9). Done. Parents define shortest-path tree.
    

![Dijkstra stepwise trace showing PQ contents, popped vertex, relaxed edges, and distance updates per iteration](cs/dsa/assets/dijkstra-trace.svg)

## Complexity Analysis

Let `n = |V|`, `m = |E|`.

- With a **binary heap**: each `extract_min` is `O(log n)` (≤ `n` times), each successful relaxation does a `decrease_key` `O(log n)` (≤ `m` times). **Time:** `O((n + m) log n)`. **Space:** `O(n)`.
    
- With a **d-ary heap**: `extract_min = O(d log_d n)`, `decrease_key = O(log_d n)`. Choose `d` to balance operations (see [[cs/dsa/d-ary-heap|D-ary Heap]]).
    
- With a **Fibonacci heap**: **Time:** `O(m + n log n)`, because `decrease_key` is `O(1)` amortized there while `extract_min` stays `O(log n)` amortized. **Pairing heaps** do not reach this bound: their `decrease_key` is provably not `O(1)` amortized (there is an `Omega(log log n)` lower bound), and the best proved upper bound is `O(2^(2*sqrt(log log n)))`, which is `o(log n)` but above constant. They are chosen for practical speed, not for this bound.
    
- **Dense graphs** with adjacency matrix: `O(n^2)` array-scan version (no PQ) is competitive when `m ≈ n^2`.
    

## Optimizations or Variants

- **Early exit:** If only the distance to a target `t` is required, stop when `t` is popped (settled).
    
- **Edge bucketing:** For **integer weights in `[0..C]`**, Dial’s algorithm uses a bucket queue to get `O(m + nC)`. Combining a radix heap with a Fibonacci heap gives `O(m + n*sqrt(log C))`, and a van Emde Boas tree as the queue gives `O(m + n log C / log log nC)`.
    
- **0-1 BFS:** If weights are only `0` or `1`, a deque yields `O(n + m)` (special case distinct from general Dijkstra).
    
- **Bidirectional Dijkstra:** Run forward from `s` and backward from `t`; meet in the middle to reduce explored region (requires consistent potentials for directed graphs).
    
- **Heuristic potentials:** With feasible potentials `h` (no negative reduced weights), Dijkstra on **[[cs/math/linear-programming-and-duality|reduced costs]]** supports A*-like search (still needs non-negative reduced edges).
    

## Applications

- **Routing / navigation** on road networks (non-negative travel times).
    
- **[[cs/networking/ospf-and-link-state-routing|Network planning]]**: least-cost trees when costs are additive and non-negative.
    
- **Scheduling / project planning** where tasks have non-negative durations and dependencies.
    
- **As a subroutine**: in Johnson’s algorithm for all-pairs on sparse graphs with reweighted non-negative edges.
    

## Common Pitfalls or Edge Cases

> [!warning]  
> **Negative edges.** Any negative edge invalidates the greedy choice. Use Bellman–Ford or Johnson’s reweighting before Dijkstra.

> [!warning]  
> **Visited too early.** Do **not** mark a vertex “visited” on discovery. Only treat it as settled when it is **popped** from the PQ; otherwise improvements get ignored.

> [!warning]  
> **Decrease-key vs push-many.** If you mix patterns (e.g., mark visited on discovery _and_ push-many), you can finalize a suboptimal distance. Stick to one consistent pattern.

> [!warning]  
> **Zero-weight edges.** Allowed; they can create many ties. Ensure the PQ handles equal keys deterministically and that push-many skips stale entries.

> [!warning]  
> **Overflow & infinity.** Use sufficiently wide numeric types; initialize `∞` to a sentinel larger than any reachable distance.

## Implementation Notes or Trade-offs

- **PQ choice:** Binary heap is simple and fast in practice; **d-ary heaps** (e.g., `d=4` or `8`) can reduce height and speed `decrease_key`-heavy workloads; Fibonacci/pairing heaps favor extremely many `decrease_key` operations.
    
- **Graph storage:** Use adjacency lists for sparse graphs. With a **binary heap** on top of them the worst case is `O((n + m) log n)`, which simplifies to `O(m log n)` **only on connected graphs**, where `m >= n - 1`.
    
- **Parent recovery:** Store `π[v]` on each improvement to rebuild shortest paths. If multiple equal shortest paths exist, tie-break consistently for stable trees.
    
- **Unreachable vertices:** Leave `dist=∞` and `π=NIL`; they never enter `S`.
    

## Summary

Dijkstra’s algorithm grows a **settled set** outward from the source, always expanding the **smallest tentative distance** next. With non-negative edges, each pop finalizes a vertex’s distance. Efficient implementations hinge on a consistent PQ strategy (**decrease-key** or **push-many**), proper relaxation, and a data structure tuned to graph density and workload.

## Related Notes

- [[cs/dsa/breadth-first-search-algorithms|Breadth-First Search Algorithms]]
    
- [[cs/dsa/greedy-algorithms|Greedy Algorithms]]
    
- [[cs/dsa/d-ary-heap|D-ary Heap]]
    
- [[cs/dsa/graph-representations|Graph Representations]]

## Sources

- Dijkstra's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm . Backs the entire complexity section together with the precondition each bound carries. It states that the complexity bound depends mainly on the data structure used for the vertex set, that the simplest version storing that set as a linked list or array runs in `Theta(|E| + |V|^2) = Theta(|V|^2)` (the dense adjacency-matrix row), that with adjacency lists and a binary heap the worst case is `Theta((|E| + |V|) log |V|)` and simplifies to `Theta(|E| log |V|)` only for connected graphs (the precondition added to the graph-storage note), and that a Fibonacci heap improves this to `Theta(|E| + |V| log |V|)`. It is the source for the corrected integer-weight variants: Dial's algorithm with a bucket queue at `O(|E| + |V|C)`, a radix heap combined with a Fibonacci heap at `O(|E| + |V| sqrt(log C))`, and a van Emde Boas tree at `O(|E| + |V| log C / log log |V|C)`, none of which is the figure this note previously gave for radix heaps. It also backs the push-many pattern (adding nodes unconditionally and checking after extraction that the popped priority still equals `dist[u]`), the lazy-initialization variant that starts the queue with only the source, the bidirectional variant with its two frontiers and settled sets, and the non-negativity requirement in the correctness argument.
- Jessica Su, CS 161 Lecture 11: BFS, Dijkstra's algorithm, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture11.pdf . Backs the operation counts the complexity section rests on: `Insert` is called `n` times, `ExtractMin` `n` times since each vertex is dequeued exactly once, and `DecreaseKey` up to `m` times since that is the total length of all adjacency lists. From those counts it derives each bound with its queue named: `O(n^2 + m) = O(n^2)` for an array, `O((n + m) log n)` for an ordinary heap where `ExtractMin` and `DecreaseKey` are `O(log n)`, and `O(m + n log n)` for a Fibonacci heap. It also backs the shortest-path-tree claim about the parent pointers.
- Jeff Erickson, Algorithms, Chapter 8: Shortest Paths. https://jeffe.cs.illinois.edu/teaching/algorithms/book/08-sssp.pdf . Backs the settled-set argument and the same bounds from a second CLRS-adjacent source: Dijkstra performs at most `E` decrease-key, `V` insert, and `E` extract-min operations, so a standard binary heap supporting each in `O(log V)` yields `O(E log V)`, and a Fibonacci heap improves this to `O(E + V log V)`. It also records that Dijkstra's original formulation scanned the wavefront by brute force and ran in `O(V^2)`, which is faster than the binary-heap implementation when the graph is dense, and it backs the relaxation-and-tense-edge framing of the main loop.
- Fibonacci heap, Wikipedia. https://en.wikipedia.org/wiki/Fibonacci_heap . Backs the amortized costs that produce the `O(m + n log n)` row: insert and decrease-key are `O(1)` amortized while delete-min is `O(log n)` amortized.
- Pairing heap, Wikipedia. https://en.wikipedia.org/wiki/Pairing_heap . Backs the correction separating pairing heaps from Fibonacci heaps. It records that the constant-time conjecture for pairing-heap decrease-key was disproved, that Fredman proved an `Omega(log log n)` amortized lower bound for that operation, and that Pettie's upper bound is `O(2^(2 sqrt(log log n)))`, alongside the note that Fibonacci heaps are the structure performing decrease-key in `O(1)` amortized time. It also backs the practical remark in the PQ-choice paragraph, since it reports experiments finding pairing heaps often faster than theoretically superior pointer-based heaps.
- d-ary heap, Wikipedia. https://en.wikipedia.org/wiki/D-ary_heap . Backs the d-ary row exactly: insert and decrease-priority cost `O(log n / log d)`, delete-min costs `O(d log n / log d)`, and balancing the two by taking `d = m/n` gives Dijkstra a total of `O(m log_(m/n) n)`, an improvement over the binary-heap `O(m log n)` when edges greatly outnumber vertices. It also backs the cache remark, since it notes d-ary heaps have better memory-cache behavior than binary heaps.
- 0-1 BFS, Algorithms for Competitive Programming (cp-algorithms). https://cp-algorithms.com/graph/01_bfs.html . Backs the 0-1 BFS variant: when every edge weight is `0` or `1`, single-source shortest paths can be found in `O(|E|)` with an ordinary deque, appending at the front for a weight-zero edge and at the back for a weight-one edge, because in that setting the distances held in the queue span at most one value.
- Johnson's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Johnson%27s_algorithm . Backs the subroutine application and the reweighting pitfall: Johnson's method reweights edges using Bellman-Ford so that all weights become non-negative while shortest paths are preserved, then runs Dijkstra from each vertex, which is why negative edges must be removed by reweighting rather than fed to Dijkstra directly.
- Bellman-Ford algorithm, Wikipedia. https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm . Backs the negative-edge warning, since Bellman-Ford is the single-source method that admits negative weights and detects a reachable negative cycle, where Dijkstra's greedy choice is invalid.
