---
title: Matrices
description: Matrix shapes, indexing conventions, core operations (transpose, mat-vec, mat-mat), and practical considerations like sparsity and cache locality.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-08
aliases: []

---

## Overview

A **matrix** is a rectangular array of numbers with **m rows** and **n columns** (an `m×n` matrix). Beyond the algebra, matrices are a **data layout** with performance implications: **indexing conventions**, **memory layout** (row-major vs column-major), and **sparsity** determine the speed of common operations. This note covers shapes, indexing, core transforms (transpose, identity, diagonal), and outlines of **matrix–vector** and **matrix–matrix** multiplication with attention to **cache** and **sparse** representations.

> [!note]
> Throughout, use **0-based indices** `A[i][j]` with `i∈[0..m-1]`, `j∈[0..n-1]`. Row `i` is length `n`; column `j` is length `m`.

## Motivation

Matrices appear across DS&A and systems:

- **Graph algorithms:** adjacency **matrix** vs [[adjacency-list|Adjacency List]] trade time for space.

- **Dynamic programming:** table-filling is matrix-like; careful iteration order improves locality.

- **Geometry/graphics:** transforms (rotation/scale) use small fixed-size matrices.

- **[[cs/math/matrices-and-linear-transformations|Linear algebra in ML]]:** heavy reliance on mat–vec and mat–mat kernels; cache-friendly layouts and sparsity are decisive.


Understanding shapes and traversals prevents **shape mismatch**, **cache-thrashing loops**, and **silent bugs** in transposes or in-place updates.

## Definition and Formalism

- **Shape:** `A ∈ ℝ^{m×n}` has `m` rows, `n` columns. Row vector: `1×n`. Column vector: `m×1`.

- **Indexing:** `A[i][j]` denotes element at row `i`, column `j`.

- **Special matrices (by shape/values):**

    - **Zero** `0_{m×n}` - all zeros.

    - **Identity** `I_n` - square, ones on diagonal `i==j`, zeros elsewhere.

    - **Diagonal** - only `A[i][i]` possibly nonzero.

    - **Upper/lower triangular** - constrained to one side of diagonal.

    - **Symmetric** - `A = A^T` (square).

- **Transpose:** `B = A^T` with `B[j][i] = A[i][j]` → shape `n×m`.

- **Arithmetic (dimension rules):**

    - Add/subtract: same shape.

    - Mat–vec: `(m×n)·(n×1) → (m×1)`.

    - Mat–mat: `(m×k)·(k×n) → (m×n)`.


> [!tip]
> Think "**row by column**": the inner dimensions (`k`) must match; the outer dimensions become the result shape.

## Example or Illustration

Let

```
A = [[1, 2, 3],
     [4, 5, 6]]            // A is 2×3
x = [7, 8, 9]^T            // x is 3×1
A·x = [1*7+2*8+3*9,
       4*7+5*8+6*9]^T
    = [50, 122]^T          // result 2×1
```

The transpose `A^T` is `3×2`:

```
A^T = [[1,4],
       [2,5],
       [3,6]]
```

## Properties and Relationships

- **Identity as neutral element:** `I_m·A = A` (when shapes allow), `A·I_n = A`.

- **Diagonal scaling:** Multiplying by a diagonal left-scales rows; right-scales columns.

- **Symmetry & transpose:** If `A` is symmetric (`A=A^T`), matrix–vector operations can reuse either lower or upper triangle.

- **Sparsity pattern:** Many real matrices are **sparse** (mostly zeros). Storing only nonzeros reduces memory and speeds operations that skip zeros.

- **Graph tie-in:** An **adjacency matrix** `Adj[u][v]` indicates edges; **row `u`** iteration is `O(n)` regardless of degree, contrasting with adjacency lists (see [[graph-representations|Graph Representations]]).


## Implementation or Practical Context

### Memory layout and traversal

Two canonical layouts:

- **Row-major** (C/C++ vectors of vectors, many DS libs): rows laid out contiguously; `A[i][0..n-1]` is one contiguous block.

- **Column-major** (Fortran, MATLAB, many BLAS): columns are contiguous; `A[0..m-1][j]` is contiguous.


**Rule:** Walk memory in the order it's laid out to exploit caches and prefetchers.

```pseudo
// Row-major: cache-friendly row sweep
for i in 0..m-1:
    sum = 0
    for j in 0..n-1:
        sum += A[i][j] * x[j]
    y[i] = sum
```

```pseudo
// Column-major alternative: prefer column-sweeps
for j in 0..n-1:
    y_add = A[0..m-1][j] * x[j]       // conceptual: scale column j by x[j]
    y += y_add
```

> [!warning]
> **Transposed loops:** In row-major, iterating columns fastest (inner loop over `i`) causes **strided** access and cache misses. Flip loops or pre-transpose as needed.

### Core transforms & kernels

#### Transpose (dense)

Naïve out-of-place:

```pseudo
function TRANSPOSE(B, A):              // B is n×m, A is m×n
    for i in 0..m-1:
        for j in 0..n-1:
            B[j][i] = A[i][j]
```

Blocked/batched transpose (operate on tiles) improves locality:

```pseudo
function TRANSPOSE_BLOCKED(B, A, BS):  // BS = block size
    for ii in 0..m-1 step BS:
        for jj in 0..n-1 step BS:
            for i in ii..min(ii+BS-1, m-1):
                for j in jj..min(jj+BS-1, n-1):
                    B[j][i] = A[i][j]
```

#### Matrix–vector (gemv)

Row-major pattern shown above; complexity **Θ(m·n)**.

#### Matrix–matrix (gemm)

Classical triple loop (**Θ(m·k·n)**):

```pseudo
function MATMUL(C, A, B):              // A m×k, B k×n, C m×n
    for i in 0..m-1:
        for t in 0..k-1:
            a = A[i][t]
            for j in 0..n-1:
                C[i][j] += a * B[t][j]
```

- The loop order `i–t–j` (a.k.a. **ijk** with hoisted `a`) improves reuse of `A[i][t]` and gives row-major friendly access to `B[t][j]` if `B` is laid out row-major; otherwise block both `A` and `B` by tiles to keep [[cs/systems/memory-hierarchy-and-caching|cache lines hot]].


> [!tip]
> **Blocking (tiling)** is essential for performance: operate on `BS×BS` submatrices so that a tile fits in L1/L2 cache. This changes constant factors dramatically even though asymptotics stay `Θ(n^3)`.

#### Identity & diagonal helpers

```pseudo
function MAKE_IDENTITY(I, n):
    fill I with 0
    for i in 0..n-1: I[i][i] = 1

function SCALE_ROWS_BY_DIAG(B, D, A):  // B = D*A, D diagonal (D[i][i])
    for i in 0..m-1:
        for j in 0..n-1:
            B[i][j] = D[i] * A[i][j]
```

### Sparse representations

Storing only **nonzeros**:

- **COO (Coordinate):** list of `(i, j, val)` triplets.

- **CSR (Compressed Sparse Row):** arrays `row_ptr[0..m]`, `col_idx[0..nnz-1]`, `val[0..nnz-1]`. Row `i` nonzeros live in slice `row_ptr[i]..row_ptr[i+1]-1`.

- **CSC (Compressed Sparse Column):** column-major analog.


**Sparse mat–vec (CSR):**

```pseudo
function SPMV_CSR(y, A_csr, x):       // y = A*x
    for i in 0..m-1:
        sum = 0
        for p in row_ptr[i]..row_ptr[i+1]-1:
            j = col_idx[p]
            sum += val[p] * x[j]
        y[i] = sum
```

- Complexity: `Θ(nnz)` ops; memory traffic dominates. Reordering rows/cols can improve locality of `x[j]`.


### Complexity snapshots

- **Transpose:** `Θ(m·n)` operations; strictly memory-bound.

- **Mat–vec:** `Θ(m·n)` (dense), `Θ(nnz)` (sparse).

- **Mat–mat:** classical `Θ(m·k·n)`; advanced algorithms (Strassen, `O(n^ω)`) reduce exponent `ω<3` but are complex and numerically sensitive; not typical for hand-rolled DS&A code.


## Common Misunderstandings

> [!warning]
> **Shape mismatch.** Multiplication `(m×k)·(k×n)` requires inner dimensions equal. Unit tests should assert shapes at runtime.

> [!warning]
> **Row vs column major confusion.** Traversal order must match layout. A nested loop that steps down columns in a row-major array will appear "`Θ(m·n)` slow" but spend time on cache misses.

> [!warning]
> **In-place transpose of non-square matrices.** A true in-place transpose for `m≠n` requires complex cycle decomposition on a single buffer; prefer out-of-place or block-swap into a new buffer.

> [!warning]
> **Integer overflow.** Accumulators in mat–mat can overflow 32-bit quickly. Promote to 64-bit (or wider) when multiplying and summing integers.

> [!warning]
> **Sparse misuse.** Sparse formats win only when `nnz ≪ m·n`. On moderately dense data, indirection and poor locality can make sparse slower than dense.

## Broader Implications

- **Algorithm design:** Many DP and table algorithms are "matrix programs"; understanding strides and blocking yields large **constant-factor** speedups.

- **Graphs:** Adjacency matrices enable **O(1)** edge queries but cost `Θ(n^2)` space; choose representation based on density and operation profile (see [[graph-representations|Graph Representations]]).

- **Numerics & stability:** Accumulation order matters for [[cs/standards/ieee-754-floating-point|floating-point]]; pairwise (tree) summation reduces roundoff error versus naive left-to-right.

- **Parallelism:** Mat–mat (GEMM) is highly parallelizable via tiling; mat–vec less so but benefits from threading over rows/blocks and careful NUMA placement.


## Summary

Matrices combine **shape** rules, **indexing**, and **layout** realities. Know the dimension algebra, implement core transforms (transpose, identity, diagonal scaling), and write **cache-aware** mat–vec/mat–mat kernels. For large, mostly-zero problems, adopt **sparse** formats like CSR/CSC to achieve `Θ(nnz)` performance. Validate shapes, respect memory layout, and choose representations that fit the problem's **density** and **access patterns**.

## Related Notes

- [[arrays|Arrays]]

- [[graph-representations|Graph Representations]]

- [[algorithm-efficiency|Algorithm Efficiency]]

- [[logarithmic-functions|Logarithmic Functions]]
