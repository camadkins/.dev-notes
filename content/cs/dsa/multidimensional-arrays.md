---
title: Multidimensional Arrays
description: Row-major vs column-major layouts, linearization formulas, and cache-friendly traversal patterns for 2D and higher dimensions.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-09
aliases: []

---

## Overview

**Multidimensional arrays** store elements in a 1D memory region and use **linearization** to map `(i, j, k, …)` indices to byte offsets. Two canonical layouts dominate:

- **Row-major** (C/C++ default): rows are contiguous.

- **Column-major** ([[cs/history/fortran-and-high-level-languages|Fortran]]/MATLAB default): columns are contiguous.


Performance hinges on **strides** and **access order**. Traversing along the **contiguous dimension** maximizes [[cs/systems/memory-hierarchy-and-caching|cache locality]] and memory bandwidth. This note gives exact offset formulas, common pitfalls, and practical traversal patterns for transposes, convolutions, and higher dimensions.

> [!note]
> Treat layout as part of the **data structure contract**. Many bugs and slowdowns arise when code assumes the wrong layout or ignores strides.

## Motivation

Algorithms on tables - dynamic programming, image filters, matrix ops, adjacency matrices - are limited by **memory throughput** more than arithmetic. Knowing how indices map to addresses lets you:

- Write loops that hit **contiguous cache lines**.

- Implement **transpose** and **stencil** passes that avoid strided misses.

- Safely interoperate with libraries expecting specific layouts.


## Definition and Formalism

Consider a rectangular `rows × cols` array `A` of element size `elem` bytes with **base address** `base`.

### Row-major (C-style)

- **Offset (2D)**: `off = (i*cols + j) * elem`

- **Address**: `addr = base + off`

- **Strides**:

    - Increment `j` (across columns): stride = `elem` (contiguous)

    - Increment `i` (down rows): stride = `cols * elem` (row jump)


### Column-major (Fortran-style)

- **Offset (2D)**: `off = (j*rows + i) * elem`

- **Address**: `addr = base + off`

- **Strides**:

    - Increment `i`: stride = `elem` (contiguous)

    - Increment `j`: stride = `rows * elem`


### General D-dimensional row-major

Let extents be `N0, N1, …, N{D-1}` and indices `i0..i{D-1}`. The **row-major** byte offset is:

```
off = ((((i0*N1 + i1)*N2 + i2) * ... * N{D-1} + i{D-1}) * elem)
```

Column-major reverses the nesting order (earlier indices vary fastest in column-major).

> [!tip]
> For bounds checking, use **half-open ranges** `[0..Ni)` per dimension. Out-of-range indices produce incorrect offsets and memory errors in unchecked languages.

## Example or Trace

Let `A` be `3×4` doubles (`elem=8`) in **row-major**. For `(i=2, j=1)`,
`off = (2*4 + 1)*8 = 72` bytes → `addr = base + 72`.

**Cache-friendly sum (row-major):**

```pseudo
sum = 0
for i in 0..rows-1:
    for j in 0..cols-1:       // inner loop is contiguous
        sum += A[i][j]
```

**Cache-hostile variant (row-major):**

```pseudo
sum = 0
for j in 0..cols-1:
    for i in 0..rows-1:       // large stride = cols*elem
        sum += A[i][j]
```

> [!warning]
> Walking the **non-contiguous** dimension in the inner loop (columns for row-major, rows for column-major) causes **strided access**, frequent cache misses, and TLB churn.

## Properties and Relationships

- **Layout dictates stride**: inner-loop dimension should be the **contiguous** one for best locality.

- **Matrix operations** intertwine with layout: naive transpose or multiply can be memory-bound unless tiled.

- **Rectangular vs jagged**: a rectangular array is one contiguous block; a **jagged** array is an array of pointers to rows (extra indirection, poorer cross-row locality).

- **Interoperability**: FFI between C (row-major) and Fortran (column-major) must agree on layout or use explicit transposes.


## Implementation or Practical Context

### Matrix Transpose (blocked)

Naive element-wise transpose is strided for one operand. Use **tiling** so both reads and writes are mostly contiguous.

```pseudo
function TRANSPOSE_BLOCKED(B, A, rows, cols, BS):
    for ii in 0..rows-1 step BS:
        for jj in 0..cols-1 step BS:
            i_max = min(ii+BS, rows)
            j_max = min(jj+BS, cols)
            for i in ii..i_max-1:
                for j in jj..j_max-1:
                    B[j][i] = A[i][j]
```

- Pick `BS` so that two `BS×BS` tiles fit in cache (e.g., 32–128 depending on element size and cache).

- For **square** matrices and row-major layout, this reduces conflict misses dramatically.


### Convolution and Stencil Walks

2D **convolution** touches a neighborhood around `(i,j)`. Use row-major friendly loops (or column-major equivalents) and **row ring buffers** to reuse loaded lines.

```pseudo
for i in 1..rows-2:
    preload rows i-1, i, i+1 into small buffers
    for j in 1..cols-2:
        out[i][j] = k00*A[i-1][j-1] + k01*A[i-1][j] + ... + k22*A[i+1][j+1]
```

- Maintain a sliding window of `W` rows; advance by evicting the oldest.

- Unroll the inner loop modestly to help the compiler vectorize.


### Dynamic Programming Tables

DP tables (e.g., edit distance) benefit from picking the **inner varying dimension** to be contiguous. If recurrence reads `(i-1, j)`, `(i, j-1)`, `(i-1, j-1)`, keep `j` as the **inner loop** in row-major.

### Rectangular vs Jagged Layouts

- **Rectangular**: one `rows*cols*elem` block. Good for BLAS-style kernels; simple pointer arithmetic.

- **Jagged** (`T**` or `vector<vector<T>>`): each row allocated separately.

    - Pros: flexible per-row lengths; cheap row insert/delete.

    - Cons: extra pointer chasing, poorer cross-row locality, harder to vectorize.


> [!note]
> Many high-level languages expose **jagged** by default. For performance-critical paths, prefer a **flat buffer** with manual indexing.

### Padding, Alignment, and SIMD

- **Row padding**: widen each row so `row_bytes` is a multiple of cache-line or SIMD width. Formula becomes `addr = base + i*row_stride + j*elem`.

- **Alignment**: align base and row starts (e.g., 32 bytes for AVX). Misalignment hurts vector loads/stores.

- **Prefetching**: moderate prefetch distance on the inner loop can help long rows.


### Bounds & Safety

- Index checks in safe languages prevent OOB but add overhead; hoist checks or use slices when possible.

- In C/C++, stick to **half-open** loops and compute linear indices carefully:

    - Row-major: `idx = i*cols + j`

    - Column-major: `idx = j*rows + i`


### Higher Dimensions (3D and beyond)

For `A[Z][Y][X]` in row-major (`X` is fastest-varying):

```
off = ((z*Y + y)*X + x) * elem
```

Common access patterns:

- 3D stencils: tile by slabs or bricks (`Z×Y×X` blocks) to keep working sets in cache.

- Transform orders to make the **innermost** loop the **unit stride** dimension.


## Complexity and Performance

- **Address computation** is `O(1)`. The bottleneck is **memory**: bandwidth, cache, and TLB.

- Well-tiled transposes and stencils achieve **2–10×** speedups over naive loops by improving **spatial** and **temporal** locality.

- Matrix–matrix multiply can be made compute-bound with **blocking** and **register tiling** even in plain languages.


## Common Pitfalls or Edge Cases

> [!warning]
> **Wrong layout assumption.** Passing row-major buffers into column-major libraries (or vice versa) silently scrambles results unless transposed or flagged correctly.

> [!warning]
> **Transposed inner loops.** Inner loop over non-contiguous dimension causes strided access; swap loop order or tile.

> [!warning]
> **Jagged vs rectangular confusion.** `A[i][j]` on a jagged array incurs extra pointer reads and can degrade performance vs a flat buffer.

> [!warning]
> **In-place transpose for non-square arrays.** Requires permutation cycles over linear indices; easier and typically faster to use an out-of-place buffer.

> [!warning]
> **Element size changes.** When switching `T`, recompute strides: `row_stride = cols * sizeof(T)` (row-major), `col_stride = rows * sizeof(T)` (column-major).

## Example (Matrix Transpose and Convolution Walk)

- **Transpose**: use `TRANSPOSE_BLOCKED` with `BS` tuned to cache. For small square matrices, unroll inner loops; for large ones, add **software prefetch** on `A`.

- **Convolution**: iterate `j` as the inner loop in row-major; keep a 3-row ring buffer; maintain coefficients in registers; consider padding to avoid line aliasing.


## Summary

Multidimensional arrays are **1D buffers with a view** defined by layout and strides. Correct **linearization formulas** and **stride-aware traversal** determine whether your code runs at memory speed or stalls on cache misses. Prefer contiguous-dimension inner loops, tile for transposes and stencils, choose **rectangular** layouts for performance-critical kernels, and pad/align to match cache and SIMD widths.

## Related Notes

- [[cs/dsa/matrices|Matrices]]

- [[cs/dsa/arrays|Arrays]]

- [[cs/dsa/graph-representations|Graph Representations]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
