---
title: Matrices and Linear Transformations
description: "A matrix is a function you can hold in your hand: how multiplication encodes composition, what rank measures, and why the identity and inverse close the loop."
draft: false
comments: true
tags:
  - cs
  - math
  - linear-algebra
date: 2026-04-02
updated:
aliases:
  - matrix-multiplication
  - linear-transformations
---

## A Grid of Numbers That Moves Space

The single most useful sentence in linear algebra is that a matrix is a verb, not a noun. "Linear transformations can be represented by matrices," which means an $m \times n$ grid of numbers is a machine that takes a vector in $\mathbb{R}^n$ and returns one in $\mathbb{R}^m$. Rotation, scaling, shearing, projection: each is a linear transformation, and each collapses into one matrix. Multiply that matrix by a vector and you have applied the motion. The [[cs/math/linear-algebra-fundamentals|standard survey]] states the same claim as "every matrix is a function"; this note follows that claim down into how the functions combine.

> [!note] The idea
> Matrix multiplication is not arithmetic that happens to be defined on grids. It exists "to represent the composition of linear maps that are represented by matrices." So $AB$ is the single matrix that does "$B$ first, then $A$," and the strange row-times-column rule is the only rule that makes that composition come out right. Once you read $AB$ as "do $B$, then $A$," the non-commutativity ($AB \neq BA$) stops being a quirk and becomes obvious: putting on socks then shoes is not the same as shoes then socks.

## The Matrix-Vector Product Is a Stack of Dot Products

Applying a matrix to a vector is where the transformation happens. Each entry of the output is the [[cs/math/vectors-and-dot-products|dot product]] of one row of the matrix with the input vector:

$$(A\mathbf{x})_i = \sum_{j} A_{ij}\, x_j$$

Read column-first instead and you get an equally useful picture: $A\mathbf{x}$ is a weighted sum of the columns of $A$, with the entries of $\mathbf{x}$ as the weights. That second reading is why the set of reachable outputs is called the column space. It is literally everything the columns can build.

## Multiplication as Composition

For the product $AB$ to exist, "the number of columns in the first matrix must be equal to the number of rows in the second matrix," and "the result matrix has the number of rows of the first and the number of columns of the second matrix." That dimension rule is not bookkeeping; it is the [[cs/pl/type-systems-goals-guarantees|type signature]] of function composition. If $B: \mathbb{R}^p \to \mathbb{R}^n$ and $A: \mathbb{R}^n \to \mathbb{R}^m$, then the middle dimension $n$ has to match for "$B$ then $A$" to make sense, and the composite maps $\mathbb{R}^p \to \mathbb{R}^m$.

Two properties follow directly from the composition reading:

- **Associative.** $(AB)C = A(BC)$, because doing three transformations in a fixed order does not care how you parenthesize them.
- **Not commutative.** Matrix multiplication "is non-commutative, even when the product remains defined after changing the order of the factors." A rotation followed by a projection is a different map from a projection followed by a rotation.

## Rank: How Much Space Survives

When a transformation runs, it can flatten space. Rank measures how much dimension comes out the other side. Formally, "the rank of a matrix $A$ is the dimension of the vector space generated (or spanned) by its columns," which "corresponds to the maximal number of linearly independent columns of $A$." A remarkable fact makes rank well-defined from either side: the column rank and the row rank of a matrix are always equal.

Rank is the honest measure of a transformation's power. "Rank is thus a measure of the 'nondegenerateness' of the system of linear equations and linear transformation encoded by $A$." Full rank means the map keeps every dimension and the system $A\mathbf{x} = \mathbf{b}$ is well-behaved. A rank deficit means the transformation squashes some directions to zero, information is lost, and no inverse can recover it.

> [!example]
> The columns $(1,0,1)$, $(0,1,1)$, $(1,1,2)$ form a rank-2 matrix, not rank 3. The first two columns are independent, but the third is exactly their sum, so the three columns are linearly dependent. The transformation maps 3D space onto a 2D plane. Whatever detail lived in the third direction is gone, which is precisely why the matrix has no inverse.

## Identity and Inverse: Closing the Loop

Composition needs a "do nothing" element and an "undo" element, and matrices supply both. The identity matrix $I$ has ones on the diagonal and zeros elsewhere; $I\mathbf{x} = \mathbf{x}$ leaves every vector where it was, so $I$ is the neutral element of composition ($AI = IA = A$). The inverse $A^{-1}$ is the transformation that composes back to the identity:

$$A A^{-1} = A^{-1} A = I$$

An inverse exists only for a square, full-rank matrix. That is the same statement as "no dimension was flattened": if the forward map lost a direction (rank deficit), no map can rebuild it, so $A^{-1}$ cannot exist. Solving $A\mathbf{x} = \mathbf{b}$ is asking for the input that lands on $\mathbf{b}$; when $A^{-1}$ exists the answer is unique, and in practice you factor rather than invert because forming $A^{-1}$ outright is slower and less [[cs/standards/ieee-754-floating-point|numerically stable]].

> [!tip]
> Graphics pipelines lean on the composition reading constantly. A vertex passes through model, view, and projection matrices as one chained product, and "4x4 transformation matrices are widely used in 3D computer graphics, as they allow to perform translation, scaling, and rotation of objects by repeated matrix multiplication." The extra dimension is the trick that lets translation, which is not linear on its own, ride along as matrix multiplication.

## Related Notes

- [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]] - the survey that first states "every matrix is a function"
- [[cs/math/vectors-and-dot-products|Vectors and Dot Products]] - each output entry of a matrix-vector product is one dot product
- [[cs/math/eigenvalues-and-eigenvectors|Eigenvalues and Eigenvectors]] - the directions a square matrix scales without rotating
- [[cs/dsa/matrices|Matrices (data structure)]] - how the same grid is stored and indexed in memory

## Sources

- [Transformation matrix (Wikipedia)](https://en.wikipedia.org/wiki/Transformation_matrix) - linear transformations are represented by matrices, composed by multiplying them, with 4x4 matrices used in 3D graphics.
- [Matrix multiplication (Wikipedia)](https://en.wikipedia.org/wiki/Matrix_multiplication) - the column-equals-row dimension rule, multiplication as composition of linear maps, and non-commutativity.
- [Rank (linear algebra) (Wikipedia)](https://en.wikipedia.org/wiki/Rank_%28linear_algebra%29) - rank as the dimension of the column space, the maximal number of independent columns, and a measure of nondegenerateness.
