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

## Intuition

Linear algebra is the mathematics of lines, planes, and their higher-dimensional generalizations. At its heart it studies **linear transformations** - functions that preserve addition and scalar multiplication. In CS, linear algebra is everywhere: 3D rendering multiplies matrices to transform vertices, machine learning optimizes over weight matrices, search engines rank pages via eigenvectors, and signal processing decomposes signals into frequency components.

The reason linear algebra appears so often is that linearity is the simplest structure beyond mere sets. When a problem can be expressed as a system of linear equations or a matrix operation, an entire arsenal of efficient, well-understood algorithms becomes available. Even inherently nonlinear problems are often approximated locally by linear models (gradients, Jacobians).

## Core Idea

**Vectors and vector spaces.** A vector $\mathbf{v} \in \mathbb{R}^n$ is an ordered $n$-tuple of real numbers. A **vector space** is a set of vectors closed under addition and scalar multiplication. The **dimension** of a space equals the size of any basis for it.

**Matrices.** An $m \times n$ matrix $A$ represents a linear map from $\mathbb{R}^n$ to $\mathbb{R}^m$. Key operations:

- **Matrix-vector product** $A\mathbf{x}$: applies the transformation to $\mathbf{x}$.
- **Matrix multiplication** $AB$: composes two transformations.
- **Transpose** $A^T$: swaps rows and columns; $(AB)^T = B^T A^T$.
- **Inverse** $A^{-1}$: exists when $A$ is square and $\det(A) \neq 0$.

**Linear transformations.** A function $T: \mathbb{R}^n \to \mathbb{R}^m$ is linear if $T(\alpha \mathbf{u} + \beta \mathbf{v}) = \alpha T(\mathbf{u}) + \beta T(\mathbf{v})$. Every linear transformation can be represented by a matrix. Common geometric transformations (rotation, scaling, shearing, projection) are all linear and compose via matrix multiplication.

**Eigenvalues and eigenvectors.** For a square matrix $A$, a nonzero vector $\mathbf{v}$ is an **eigenvector** with **eigenvalue** $\lambda$ if:

$$A\mathbf{v} = \lambda \mathbf{v}$$

Eigenvalues are roots of the **characteristic polynomial** $\det(A - \lambda I) = 0$. Eigenvectors reveal the directions along which a transformation acts as pure scaling.

**Key results for CS:**

- **Rank**: the dimension of the column space; determines solvability of $A\mathbf{x} = \mathbf{b}$.
- **Determinant**: $\det(A) \neq 0$ iff $A$ is invertible; geometrically, it measures volume scaling.
- **Singular Value Decomposition (SVD)**: factorizes any matrix as $A = U\Sigma V^T$, central to dimensionality reduction (PCA), recommendation systems, and data compression.
- **Orthogonality**: vectors $\mathbf{u} \cdot \mathbf{v} = 0$ are orthogonal; orthonormal bases simplify nearly every computation.

**Systems of linear equations.** The equation $A\mathbf{x} = \mathbf{b}$ asks: which input $\mathbf{x}$ maps to output $\mathbf{b}$ under transformation $A$? The system has a unique solution when $A$ is invertible, infinitely many when the rank is less than $n$ but $\mathbf{b}$ is in the column space, and no solution otherwise. **Gaussian elimination** solves this in $O(n^3)$ time.

**Computational complexity.** Matrix multiplication of two $n \times n$ matrices takes $O(n^3)$ naively; Strassen's algorithm achieves $O(n^{2.807})$. The current best theoretical bound is approximately $O(n^{2.37})$, though practical implementations rarely beat Strassen for typical sizes.

## Example

**Rotation in 2D.** The matrix that rotates a vector by angle $\theta$ counterclockwise:

$$R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$$

Applying $R(90°)$ to $\mathbf{v} = (1, 0)^T$ gives $(0, 1)^T$ - the vector rotated a quarter turn.

**PageRank (eigenvector application).** Google's original PageRank models the web as a matrix $M$ where entry $M_{ij}$ is the probability of following a link from page $j$ to page $i$. The dominant eigenvector of $M$ (eigenvalue $\lambda = 1$) gives the steady-state ranking of all pages.

**Solving a linear system.** Given $A\mathbf{x} = \mathbf{b}$ with $A$ invertible, the unique solution is $\mathbf{x} = A^{-1}\mathbf{b}$. In practice, we use Gaussian elimination ($O(n^3)$) or iterative methods rather than computing the inverse directly.

**Eigenvalue example.** Consider $A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$. The characteristic polynomial is $(2 - \lambda)(3 - \lambda) = 0$, giving eigenvalues $\lambda_1 = 2$ and $\lambda_2 = 3$. For $\lambda_1 = 2$: solving $(A - 2I)\mathbf{v} = 0$ gives eigenvector $\mathbf{v}_1 = (1, 0)^T$. For $\lambda_2 = 3$: eigenvector $\mathbf{v}_2 = (1, 1)^T$. The matrix stretches space by factor 2 along $(1,0)$ and by factor 3 along $(1,1)$.

**SVD in recommendation systems.** Netflix-style recommendations factorize a sparse user-item rating matrix via SVD into $U\Sigma V^T$. The top $k$ singular values and their vectors capture the $k$ most significant latent factors (e.g., genre preference, production era), enabling predictions for unrated items.

**Graphics pipeline.** 3D rendering chains together model, view, and projection matrices. A vertex $\mathbf{v}$ in object space becomes a pixel via $\mathbf{v}' = P \cdot V \cdot M \cdot \mathbf{v}$, where each matrix is $4 \times 4$ (using homogeneous coordinates to handle translation as a linear operation). GPUs are essentially massively parallel matrix multiplication engines.

**Least squares.** When $A\mathbf{x} = \mathbf{b}$ has no exact solution (overdetermined system), the best approximation minimizes $\|A\mathbf{x} - \mathbf{b}\|^2$. The solution is $\mathbf{x} = (A^T A)^{-1} A^T \mathbf{b}$, the foundation of linear regression in machine learning.

**Span, basis, and dimension.** A set of vectors $\{\mathbf{v}_1, \dots, \mathbf{v}_k\}$ **spans** a space if every vector in that space can be written as a linear combination of them. The set is a **basis** if it spans the space and is linearly independent - no vector in the set is redundant. The number of vectors in any basis is the **dimension** of the space. For $\mathbb{R}^n$, the standard basis has $n$ vectors: $\mathbf{e}_1 = (1,0,\dots,0)^T$, etc.

**Null space and column space.** The **null space** of $A$ is $\{\mathbf{x} : A\mathbf{x} = \mathbf{0}\}$ - the set of inputs the transformation kills. The **column space** is the set of all possible outputs $A\mathbf{x}$. The rank-nullity theorem ties them together:

$$\text{rank}(A) + \text{nullity}(A) = n$$

for an $m \times n$ matrix. This theorem is one of the most useful structural results in linear algebra - it tells you exactly how many "degrees of freedom" a system of equations has.

## Related Notes

- [[graph-theory|Graph Theory]] - adjacency matrices are the bridge between graph theory and linear algebra
- [[discrete-probability|Discrete Probability]] - Markov chains use stochastic matrices and eigenvector analysis
- [[mathematical-induction|Mathematical Induction]] - induction on matrix dimension proves many linear algebra theorems
- [[combinatorics|Combinatorics]] - counting arguments for matrix properties like the permanent and determinant
