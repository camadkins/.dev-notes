---
title: Linear Algebra Fundamentals
description: Vectors, matrices, linear transformations, and eigenvalues - the mathematical core of graphics, ML, and scientific computing.
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-03-12
updated:
aliases: []
---

## Why Linear Algebra Keeps Showing Up

Linear algebra keeps showing up everywhere in CS. The moment you need to rotate something on screen, compress data, train a model, or solve a system of equations, you're doing linear algebra whether you call it that or not. The reason is simple: linearity is the most tractable structure we have. When you can phrase a problem as a matrix operation, you get access to decades of fast, well-understood algorithms. And even when a problem is nonlinear, the first thing we do is approximate it linearly (gradients, Jacobians, Taylor expansions) because that's where the tools are.

> [!note]
> If you take one thing from this note: **every matrix is a function**. An $m \times n$ matrix $A$ is a linear map from $\mathbb{R}^n$ to $\mathbb{R}^m$. Once that clicks, everything else (rank, null space, eigenvalues) becomes a question about the behavior of that function.

## Vectors and Vector Spaces

A vector $\mathbf{v} \in \mathbb{R}^n$ is an ordered $n$-tuple of real numbers. A **vector space** is a set of vectors closed under addition and scalar multiplication. The **dimension** of a space equals the size of any basis for it.

A set of vectors $\{\mathbf{v}_1, \dots, \mathbf{v}_k\}$ **spans** a space if every vector in that space can be written as a linear combination of them. The set is a **basis** if it spans the space and is linearly independent, meaning no vector in the set is redundant. For $\mathbb{R}^n$, the standard basis has $n$ vectors: $\mathbf{e}_1 = (1,0,\dots,0)^T$, etc.

> [!tip]
> Thinking in terms of span and basis is more useful than thinking about individual vectors. The question "what can this set of vectors reach?" comes up constantly, from solving systems of equations to understanding what a neural network layer can represent.

## Matrices as Transformations

An $m \times n$ matrix $A$ represents a linear map from $\mathbb{R}^n$ to $\mathbb{R}^m$. The key operations:

- **Matrix-vector product** $A\mathbf{x}$: applies the transformation to $\mathbf{x}$.
- **Matrix multiplication** $AB$: composes two transformations (apply $B$ first, then $A$).
- **Transpose** $A^T$: swaps rows and columns; $(AB)^T = B^T A^T$.
- **Inverse** $A^{-1}$: exists when $A$ is square and $\det(A) \neq 0$.

A function $T: \mathbb{R}^n \to \mathbb{R}^m$ is linear if $T(\alpha \mathbf{u} + \beta \mathbf{v}) = \alpha T(\mathbf{u}) + \beta T(\mathbf{v})$. Every such transformation can be represented by a matrix. Rotation, scaling, shearing, projection are all linear and compose via matrix multiplication. This is exactly what happens in a graphics pipeline: a vertex $\mathbf{v}$ in object space becomes a pixel via $\mathbf{v}' = P \cdot V \cdot M \cdot \mathbf{v}$, where each matrix is $4 \times 4$ (using homogeneous coordinates so translation becomes linear too). GPUs are essentially [[cs/military-computing/illiac-iv-and-parallel-processing|massively parallel]] matrix multiplication engines.

## Eigenvalues and Eigenvectors

For a square matrix $A$, a nonzero vector $\mathbf{v}$ is an **eigenvector** with **eigenvalue** $\lambda$ if:

$$A\mathbf{v} = \lambda \mathbf{v}$$

Eigenvalues are roots of the **characteristic polynomial** $\det(A - \lambda I) = 0$. Eigenvectors reveal the directions along which a transformation acts as pure scaling, which is enormously useful for understanding what a matrix "does."

> [!example]
> Consider $A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$. The characteristic polynomial is $(2 - \lambda)(3 - \lambda) = 0$, giving eigenvalues $\lambda_1 = 2$ and $\lambda_2 = 3$. For $\lambda_1 = 2$: eigenvector $\mathbf{v}_1 = (1, 0)^T$. For $\lambda_2 = 3$: eigenvector $\mathbf{v}_2 = (1, 1)^T$. The matrix stretches space by factor 2 along $(1,0)$ and by factor 3 along $(1,1)$.

[[cs/history/pagerank-and-web-search|Google's original PageRank]] is an eigenvector application. The web is modeled as a matrix $M$ where $M_{ij}$ is the probability of following a link from page $j$ to page $i$. The dominant eigenvector (eigenvalue $\lambda = 1$) gives the steady-state page rankings. This is the theorem that made web search work.

## Fundamental Subspaces and Rank

The **null space** of $A$ is $\{\mathbf{x} : A\mathbf{x} = \mathbf{0}\}$, the set of inputs the transformation kills. The **column space** is the set of all possible outputs $A\mathbf{x}$. The rank-nullity theorem ties them together:

$$\text{rank}(A) + \text{nullity}(A) = n$$

for an $m \times n$ matrix. This tells you exactly how many "degrees of freedom" a system of equations has.

Other key structural facts:

- **Rank**: dimension of the column space; determines solvability of $A\mathbf{x} = \mathbf{b}$.
- **Determinant**: $\det(A) \neq 0$ iff $A$ is invertible; geometrically, it measures volume scaling.
- **Orthogonality**: vectors $\mathbf{u} \cdot \mathbf{v} = 0$ are orthogonal. Orthonormal bases simplify nearly every computation, which is why algorithms keep constructing them (Gram-Schmidt, QR factorization).

## Systems and Solving Them

The equation $A\mathbf{x} = \mathbf{b}$ asks: which input $\mathbf{x}$ maps to output $\mathbf{b}$ under transformation $A$? Three cases:

- **Unique solution** when $A$ is invertible.
- **Infinitely many** when the rank is less than $n$ but $\mathbf{b}$ is in the column space.
- **No solution** otherwise.

**Gaussian elimination** solves this in $O(n^3)$ time. In practice we almost never compute $A^{-1}$ directly; we factor or reduce instead.

> [!warning]
> When $A\mathbf{x} = \mathbf{b}$ has no exact solution (overdetermined system), the best approximation minimizes $\|A\mathbf{x} - \mathbf{b}\|^2$. The solution $\mathbf{x} = (A^T A)^{-1} A^T \mathbf{b}$ is the foundation of linear regression. If you've ever fit a line to data, this is what's happening underneath.

## SVD: The Swiss Army Knife

**Singular Value Decomposition** factorizes any matrix as $A = U\Sigma V^T$. It's central to [[cs/machine-learning/pca-and-dimensionality-reduction|dimensionality reduction]] (PCA), recommendation systems, and data compression.

Netflix-style recommendations factorize a sparse user-item rating matrix via SVD. The top $k$ singular values and their vectors capture the $k$ most significant latent factors (genre preference, production era, etc.), enabling predictions for unrated items.

## Computational Notes

- Naive matrix multiplication of two $n \times n$ matrices: $O(n^3)$.
- [[cs/dsa/divide-and-conquer|Strassen's algorithm]]: $O(n^{2.807})$.
- Current best theoretical bound: approximately $O(n^{2.37})$, though practical implementations rarely beat Strassen for typical sizes.

> [!tip]
> **2D rotation** is a good sanity check for linear algebra intuition. The matrix $R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$ rotates a vector by $\theta$ counterclockwise. Apply $R(90°)$ to $(1, 0)^T$ and you get $(0, 1)^T$. If that doesn't feel obvious yet, work through a few by hand until it does.

## Related Notes

- [[cs/math/graph-theory|Graph Theory]] - adjacency matrices are the bridge between graph theory and linear algebra
- [[cs/math/discrete-probability|Discrete Probability]] - Markov chains use stochastic matrices and eigenvector analysis
- [[cs/math/mathematical-induction|Mathematical Induction]] - induction on matrix dimension proves many linear algebra theorems
- [[cs/math/combinatorics|Combinatorics]] - counting arguments for matrix properties like the permanent and determinant
