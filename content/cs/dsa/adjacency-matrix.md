---
title: Adjacency Matrix — Dense Graph Representation
description: Boolean or weighted matrix storing edges in O(1) lookup time; optimal for dense graphs but memory-expensive for sparse ones.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - adjacency_matrix_layout.svg — square V×V grid; rows = sources, columns = destinations.
#  - directed_vs_undirected_matrix.svg — symmetric vs asymmetric entries in the matrix.
#  - matrix_vs_list_density.svg — contrast storage cost between adjacency matrix and adjacency list as density increases.
---

## Overview
An **adjacency matrix** represents a graph as a square table `M` of size `V × V`, where each cell `M[u][v]` indicates whether an edge from vertex `u` to `v` exists.  
It provides **constant-time edge queries** and clean mathematical properties, but uses **Θ(V²)** memory even if few edges exist.  
This makes it ideal for **dense graphs**, small networks, and graph algorithms that require direct algebraic manipulation.

> [!note]
> Think of the adjacency matrix as the *truth table* of connectivity: fast to read, expensive to store.

---

## Model & Representation

Let `G = (V, E)` where `|V| = n`.

- For **unweighted graphs**, each entry is boolean:  
  `M[u][v] = 1` if `(u, v) ∈ E`, else `0`.

- For **weighted graphs**, each entry stores the weight or cost:  
  `M[u][v] = w` if edge `(u, v)` exists, else `∞` or `0`.

- For **undirected graphs**, the matrix is **symmetric**:  
  `M[u][v] = M[v][u]`.

> [!example]
> **Diagram (`adjacency_matrix_layout.svg`)** — Square `V×V` grid; rows represent source vertices, columns represent destinations; shaded cells show existing edges.

### Initialization
```pseudo
function newMatrix(n, weighted = false, default = 0 or ∞):
    M = 2D array of size n×n
    for i in 0..n-1:
        for j in 0..n-1:
            M[i][j] = default
    return M
````

**Space complexity:** Θ(n²)  
**Edge existence test:** O(1)  
**Iteration:** O(n²) if scanning all entries; O(deg(u)) if row-iterating with sparse check.

---

## Operations & Complexity

|Operation|Time|Space|Description|
|---|---|---|---|
|`hasEdge(u, v)`|O(1)|Θ(1)|Direct index lookup|
|`addEdge(u, v)`|O(1)|Θ(1)|Assign entry `M[u][v]` = `1` or `w`|
|`removeEdge(u, v)`|O(1)|Θ(1)|Set entry to `0` or `∞`|
|`neighbors(u)`|Θ(n)|—|Scan row `M[u][*]`|
|`degree(u)`|Θ(n)|—|Count non-zero entries in row|
|`memory`|—|Θ(n²)|Independent of edge count `m`|

> [!warning]  
> For sparse graphs (`m ≪ n²`), Θ(n²) memory can overwhelm caches and dramatically reduce performance.

---

## Example

Consider directed weighted graph `V = {A, B, C}` with edges:  
`A→B (2)`, `A→C (5)`, `B→C (1)`.

||A|B|C|
|---|---|---|---|
|**A**|0|2|5|
|**B**|0|0|1|
|**C**|0|0|0|

- `hasEdge(A, C)` → `true`
    
- `hasEdge(B, A)` → `false`
    
- `outDegree(A)` = 2
    
- `inDegree(C)` = 2
    

> [!example]  
> **Diagram (`directed_vs_undirected_matrix.svg`)** — Compare directed (asymmetric) vs undirected (symmetric) matrices.

---

## Iteration Example (Row Scan)

```pseudo
function neighbors(M, u):
    result = []
    for v in 0..n-1:
        if M[u][v] != 0 and M[u][v] != ∞:
            append(result, v)
    return result
```

- **Time:** Θ(n)
    
- Works well for dense graphs (`m ≈ n²`); wasteful for sparse.
    

---

## Matrix Properties & Uses

### Graph density and choice

- **Dense graphs** (`m > n log n`): adjacency matrix preferred.
    
- **Sparse graphs**: adjacency list is more memory efficient (Θ(n + m)).
    

### Algebraic graph theory

- **Powers of `M`** give **path counts**:
    
    - `(M²)[u][v]` = number of 2-step paths from `u` to `v`.
        
    - More generally: `(Mᵏ)[u][v]` counts k-length walks.
        
- Enables vectorized algorithms (matrix multiplication, eigenvector centrality, etc).
    

### Shortest paths

- Suits **Floyd–Warshall** (Θ(n³)) and **transitive closure** algorithms.
    
- Works poorly for Dijkstra/BFS on sparse graphs due to row scanning cost.
    

---

## Comparison with Adjacency Lists

|Feature|Adjacency Matrix|Adjacency List|
|---|---|---|
|Space|Θ(n²)|Θ(n + m)|
|`hasEdge(u, v)`|O(1)|O(deg(u)) or O(1)*|
|Neighbor iteration|Θ(n)|Θ(deg(u))|
|Edge insertion|O(1)|O(1) amortized|
|Edge deletion|O(1)|O(deg(u))|
|Weighted graphs|Direct entry value|Edge tuple `(v, w)`|
|Sparse graphs|Wasteful|Efficient|
|Dense graphs|Ideal|Overhead from containers|

* Using hash-based buckets.

> [!tip]  
> Adjacency matrices enable simple **parallelization** and **GPU acceleration** since they fit naturally in dense numeric arrays.

---

## Pitfalls

> [!warning]  
> **Sparse explosion:** Memory scales with `n²` regardless of actual edges.  
> Even 10⁴ vertices yield 10⁸ entries (~400 MB for booleans, several GB for floats).

> [!warning]  
> **Iteration cost:** Even if vertex `u` has 3 edges, its row has `n` entries to scan.

> [!warning]  
> **Edge symmetry mistakes:** For undirected graphs, forgetting to mirror `M[u][v] = M[v][u]` breaks degree calculations.

---

## When to Use

- Graph is **dense** or **small** (`n ≤ 1000`).
    
- Frequent `hasEdge(u, v)` queries or **matrix algebra** (e.g., transitive closure).
    
- **Static graphs** where edge count rarely changes.
    
- Memory capacity is not a bottleneck.
    

---

## Summary

- **Space:** Θ(n²); **Time:** O(1) edge operations.
    
- Excellent for **dense**, **static**, or **algebraically analyzed** graphs.
    
- Poor for **sparse**, **dynamic**, or **iterative traversal** workloads.
    

> [!example]  
> **Diagram (`matrix_vs_list_density.svg`)** — Visualize memory vs density; list storage grows with `m`, matrix with `n²`.

---

## See also

- [[cs/dsa/adjacency-list|Adjacency List]]
    
- [[cs/dsa/graph-representations|Graph Representations]]
    
- [[cs/dsa/floyd-warshall|Floyd–Warshall Algorithm]]
    
- [[cs/dsa/graphs|Graphs]]