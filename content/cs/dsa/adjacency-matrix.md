---
title: Adjacency Matrix
description: Dense graph representation for O(1) edge queries; memory/time trade-offs vs adjacency list.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-29
aliases: []
---

## Definition
An **adjacency matrix** represents a graph as a square table `A` of size `n × n` (with `n = |V|`), where each cell `A[u][v]` indicates whether an edge from `u` to `v` exists (and optionally stores its **weight**). It provides **constant-time** membership tests and a numerics-friendly layout at the cost of **Θ(n²)** memory.

> [!note] What “dense” means here
> If the expected number of edges `m` is on the order of `n²` (or large enough that bucket iteration dominates), a matrix can simplify logic and speed up **edge tests**.

## Invariants
- **Directed vs undirected:** for undirected graphs enforce **symmetry** `A[u][v] == A[v][u]`.
- **Weighted edges:** store weights in `W[u][v]`; use a sentinel (e.g., `0` or `∞`) to mean “no edge.”
- **Simple vs multigraph:** matrices typically encode **simple** graphs; multigraphs need either **counts** per cell or a **hybrid** (e.g., per-cell lists of edge ids).
- **Domain conventions:** treat self-loops consistently (`A[u][u]`) and document whether `0` is a valid weight distinct from “no edge.”
- **Mask + weight split (alt design):** keep `M[u][v] ∈ {0,1}` for topology and `W[u][v]` for weights. This avoids sentinel ambiguity when `0` is a valid weight.

## Operations
Typical surface API:

- `hasEdge(u, v)` - check membership via direct lookup.
- `addEdge(u, v, w?)` - set `A[u][v]` (and `A[v][u]` if undirected).
- `removeEdge(u, v)` - clear the entry to the sentinel.
- `degree(u)` - count non-sentinel entries in row `u` (out-degree) or column `u` (in-degree).

> [!example] O(1) membership and updates (bool matrix)
> ```cpp
> // hasEdge(u,v)
> bool hasEdge = A[u][v];
>
> // addEdge(u,v) directed
> A[u][v] = true;
>
> // addEdge(u,v) undirected
> A[u][v] = A[v][u] = true;
>
> // removeEdge(u,v)
> A[u][v] = false;       // mirror for undirected
> ```

> [!tip] Degree in O(n)
> - **Out-degree(u)**: count `A[u][*]`.
> - **In-degree(u)**: count `A[*][u]`.
> Maintain degree arrays if you need O(1) queries (update them on edge add/remove).

## Complexity
- **Space:** `Θ(n²)` regardless of `m`.
- **Membership `hasEdge(u,v)`:** `O(1)`.
- **Neighbor iteration:** `O(n)` for a row/column scan.
- **Insert/remove edge:** `O(1)`.

> [!note] Typical costs at a glance
> - **Space**: O(n^2) (bitset rows reduce constants)
> - **hasEdge(u,v)**: O(1)
> - **neighbors(u) iteration**: O(n)
> - **add/remove edge**: O(1)
> - **degree(u)**: O(n) (or O(1) if maintained)

**Matrix vs list (quick contrast):**

|Feature|Adjacency Matrix|Adjacency List|
|---|---|---|
|Space|Θ(n²)|Θ(n + m)|
|`hasEdge(u,v)`|O(1)|O(deg(u)) or expected O(1)\*|
|Neighbor iteration|Θ(n)|Θ(deg(u))|
|Edge insert/remove|O(1)/O(1)|O(1) amortized / O(deg(u))|
|Best for|Dense, fixed-n|Sparse, dynamic|

\* with hash-based buckets.

> [!note] Memory model sanity check
> - Unweighted bool matrix: ~n² **bits** (packed) or n² **bytes** (byte array).
> - Weighted matrix: n² · sizeof(weight).
> - Bitset rows often cut memory by 8× vs byte-per-cell while enabling word-wise ops.

## Implementations
- **2D array (bool/char):** simplest; branchless tests; higher byte cost.
- **Bitset-packed rows:** compress each row into a bitset; supports wide-word ops (e.g., `AND` to intersect neighbor sets).
- **Weight matrices:** `W[u][v]` holds weights with sentinel for “no edge”.

> [!tip] Memory layout
> Store rows **contiguously** (row-major) to make per-row neighbor scans cache-friendly; pre-allocate to avoid costly resizes.

**Initialization (sketch):**
```pseudo
function newMatrix(n, weighted = false, default = 0 or ∞):
    A = 2D array n×n
    for i in 0..n-1:
        for j in 0..n-1:
            A[i][j] = default
    return A
````

> [!example] Bitset row intersections (common neighbors)
> 
> ```
> // Pseudocode: count common neighbors of u and v
> count = popcount( bitset_row[u] AND bitset_row[v] )
> ```
> 
> This is useful for triangle counting and clustering metrics.

> [!tip] Symmetric update helper
> 
> ```cpp
> inline void addUndirected(int u, int v) {
>   A[u][v] = A[v][u] = true;  // or weight W[u][v] = W[v][u] = w
> }
> inline void removeUndirected(int u, int v) {
>   A[u][v] = A[v][u] = false;
> }
> ```

## Examples

**Directed, weighted example** `V = {A,B,C}` with edges `A→B(2)`, `A→C(5)`, `B→C(1)`:

||A|B|C|  
|---|---|---|  
|**A**|0|2|5|  
|**B**|0|0|1|  
|**C**|0|0|0|

- `hasEdge(A, C) = true`, `hasEdge(B, A) = false`
    
- `outDegree(A) = 2`, `inDegree(C) = 2`
    

> [!example] 4-node undirected matrix (simple graph)
> 
> ```
>      0 1 2 3
>   0  0 1 1 0
>   1  1 0 0 1
>   2  1 0 0 1
>   3  0 1 1 0
> ```
> 
> Symmetric across the diagonal. Replace 0/1 with weights for weighted graphs.

**Neighbor iteration (row scan):**

```pseudo
function neighbors(A, u):
    result = []
    for v in 0..n-1:
        if A[u][v] != 0 and A[u][v] != ∞:
            append(result, v)
    return result
```

> [!note] Algebraic hint (Boolean closure)  
> Repeated Boolean matrix multiplication (or Warshall’s algorithm) computes reachability (transitive closure) directly on the matrix.

## Pitfalls

- **Space blow-up** on large **sparse** graphs; Θ(n²) can exceed memory/[[cs/systems/memory-hierarchy-and-caching|caches]] quickly.
    
- **Symmetry drift** in undirected graphs if only one side is updated.
    
- **Sentinel misuse** in weighted matrices (e.g., conflating `0` weight with “no edge”).
    
- **Vertex addition cost:** resizing an `n×n` matrix can be expensive without a fixed maximum `n`.
    
- **Growth strategy:** adding vertices requires resizing n×n; prefer a fixed **max n** or grow in **blocks** (e.g., +K rows/cols) to amortize copies.
    

## When to use

Choose an adjacency matrix when:

- The graph is **dense** or `n` is modest and bounded (Θ(n²) is acceptable).
    
- You need frequent **O(1) membership** checks.
    
- Algorithms benefit from random access and dense math (e.g., [[cs/dsa/floyd-warshall|Floyd–Warshall]] or [[cs/math/matrices-and-linear-transformations|algebraic methods]]).
    
- The graph is relatively **static** (few vertex insertions), or you can **pre-allocate** to the maximum size.
    
- When set operations on neighbor sets (e.g., intersections for triangles) benefit from **bitset rows** and word-wise arithmetic.
    

## Related Notes

- [[cs/dsa/graph-representations|Graph Representations]]
    
- [[cs/dsa/adjacency-list|Adjacency List]]
    
- [[cs/dsa/floyd-warshall|Floyd–Warshall]]

## Sources

- Adjacency matrix, Wikipedia. https://en.wikipedia.org/wiki/Adjacency_matrix . Backs the core invariants and the memory model: the matrix is symmetric for an undirected graph and may be asymmetric for a directed one, a simple graph's diagonal entries are all zero because self-loops are disallowed there, degree is read off as the sum of a vertex's row or column (the `degree(u)` operation), multigraphs are handled by storing the number of edges in each cell and allowing nonzero diagonal entries (the counts-per-cell variant), and a one-bit-per-entry packing occupies about `|V|^2 / 8` bytes for a directed graph, which is the eightfold saving over byte-per-cell that the bitset row claims, with the added benefit of locality of reference. It also backs the space pitfall, stating that adjacency lists need less storage on a large sparse graph because they spend nothing on absent edges.
- Jeff Erickson, Algorithms, Chapter 5: Basic Graph Algorithms. https://jeffe.cs.illinois.edu/teaching/algorithms/book/05-graphs.pdf . Backs the complexity block and the matrix-versus-list table: deciding whether two vertices are joined by an edge takes `Theta(1)` by looking in the appropriate slot, listing all neighbors of a vertex takes `Theta(V)` by scanning the corresponding row or column and this is unavoidable even for a low-degree vertex, and the matrix requires `Theta(V^2)` space regardless of how many edges the graph actually has, so it is space-efficient only for very dense graphs. It also backs the list column of the table at `Theta(V + E)` space with degree-proportional neighbor listing, and the practical argument in the When to use section, that on sufficiently dense graphs matrices are simpler and faster because they avoid pointer chasing and hashing and are contiguous blocks of memory.
- Graph (abstract data type), Wikipedia. https://en.wikipedia.org/wiki/Graph_%28abstract_data_type%29 . Backs the vertex-addition pitfall with a figure rather than a warning: adding or removing a vertex in the matrix representation is `O(|V|^2)` because the matrix must be resized and copied, which is exactly why this note recommends a fixed maximum `n` or block growth. It also backs the closing recommendation that a matrix is preferred when the graph is dense, meaning the edge count is close to `|V|^2`, or when edge lookups must be fast.
- Transitive closure, Wikipedia. https://en.wikipedia.org/wiki/Transitive_closure . Backs the algebraic hint: the closure is typically stored as a Boolean matrix so reachability is answered in constant time, it can be computed by the Floyd-Warshall algorithm in `O(n^3)`, and reducing the problem to adjacency-matrix multiplication is what makes Boolean matrix multiplication an alternative route to it.
- Adjacency list, Wikipedia. https://en.wikipedia.org/wiki/Adjacency_list . Backs the contrast column of the quick-comparison table: list space is proportional to edges plus vertices, neighbor listing costs time proportional to the degree, and the edge test costs time proportional to the minimum degree of the two vertices rather than the matrix's constant time.
- Degree (graph theory), Wikipedia. https://en.wikipedia.org/wiki/Degree_%28graph_theory%29 . Backs the out-degree and in-degree split used by the row-count and column-count definitions of `degree(u)` on a directed matrix.
