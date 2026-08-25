---
title: Eigenvalues and Eigenvectors
description: "The vectors a transformation cannot turn: the eigen equation, what it means geometrically, and why it powers PCA, PageRank, and stability analysis."
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-05-20
updated:
aliases: []
---

## The Vectors a Transformation Cannot Rotate

Most vectors, when you hit them with a [[cs/math/matrices-and-linear-transformations|matrix]], come out pointing somewhere new. A few special ones do not. An eigenvector "is a (nonzero) vector that has its direction unchanged (or reversed) by a given linear transformation." The transformation may stretch it or flip it, but it stays on its own line. Those privileged directions are the skeleton of the matrix: find them, and you know the axes along which the transformation is nothing more than scaling.

![Under a shear, a generic vector v changes direction while the eigenvector e stays on its own line and is only scaled by lambda.](cs/math/assets/eigenvector-invariant-direction.svg)

> [!note] The idea
> Every square matrix has a set of directions along which it acts as pure multiplication, and those directions expose what the matrix *does* far better than its entries do. "Applying $T$ to the eigenvector only scales the eigenvector by the scalar value $\lambda$, called an eigenvalue." So a messy grid of numbers reduces, along its eigenvectors, to a single number per direction. That reduction is the engine under PCA, PageRank, and any question of the form "what does this system settle into?"

## The Eigen Equation

The whole idea is one equation. For a square matrix $A$, a nonzero vector $\mathbf{v}$ is an eigenvector with eigenvalue $\lambda$ when

$$A\mathbf{v} = \lambda \mathbf{v}$$

The left side applies the full transformation; the right side just scales. Demanding they be equal is demanding that $A$ do nothing to $\mathbf{v}$ except resize it. Rearranged as $(A - \lambda I)\mathbf{v} = \mathbf{0}$, a nonzero solution exists only when $A - \lambda I$ collapses some direction to zero, that is, when

$$\det(A - \lambda I) = 0$$

This is the characteristic polynomial, and its roots are the eigenvalues. Solve it for $\lambda$, then solve the linear system for each $\mathbf{v}$.

> [!example]
> Take $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$. The characteristic polynomial is $\det\!\begin{pmatrix} 2-\lambda & 1 \\ 1 & 2-\lambda \end{pmatrix} = (2-\lambda)^2 - 1 = 0$, giving $\lambda = 3$ and $\lambda = 1$. For $\lambda = 3$ the eigenvector is $(1, 1)$; for $\lambda = 1$ it is $(1, -1)$. Along the $(1,1)$ diagonal the matrix stretches by 3; along the perpendicular $(1,-1)$ diagonal it leaves length unchanged. Two numbers describe the entire transformation.

## Why the Eigenvectors Matter

Eigenvalues and eigenvectors "have a wide range of applications, for example in stability analysis, vibration analysis, atomic orbitals, facial recognition, and matrix diagonalization." Three CS-relevant payoffs stand out.

### PCA finds the axes of variance

[[cs/machine-learning/pca-and-dimensionality-reduction|Principal component analysis]] rotates data onto the directions where it spreads out the most. Those directions are not chosen by hand: "it can be shown that the principal components are eigenvectors of the data's covariance matrix. Thus, the principal components are often computed by eigendecomposition of the data covariance matrix." The eigenvector with the largest eigenvalue is the direction of greatest variance, the single line that "minimizes the average squared perpendicular distance from the points to the line." Keep the top few and you compress high-dimensional data with minimal loss.

### PageRank is a dominant eigenvector

[[cs/history/pagerank-and-web-search|Google's founding algorithm]] ranks pages by treating the web as a matrix. "The PageRank values are the entries of the dominant right eigenvector of the modified adjacency matrix rescaled so that each column adds up to one." The intuition is a random surfer: PageRank "can be understood as a Markov chain in which the states are pages, and the transitions are the links between pages." The steady-state distribution of that walk, the eigenvector with eigenvalue 1, is the ranking. It formalizes the idea that "more important websites are likely to receive more links from other websites."

### Eigenvalues govern stability

When a system evolves by repeated multiplication ($\mathbf{x}_{t+1} = A\mathbf{x}_t$), its long-run behavior is dictated by the eigenvalues. Components along eigenvectors with $|\lambda| > 1$ [[cs/deep-learning/vanishing-and-exploding-gradients|blow up]]; those with $|\lambda| < 1$ decay to zero. This is why the same eigenvalue that tells PCA "this is the important direction" tells a dynamical system "this is the mode that dominates." The largest-magnitude eigenvalue wins, which is exactly why the power iteration used to compute PageRank converges to the dominant one.

> [!warning]
> Not every real matrix has real eigenvalues. A pure 2D rotation has none over the reals (it turns every direction, so no line is preserved), and its characteristic polynomial has complex roots. Symmetric matrices, the kind PCA and many physical systems produce, are the well-behaved case: they always have real eigenvalues and a full set of orthogonal eigenvectors, which is what makes the eigendecomposition clean and numerically stable.

## Related Notes

- [[cs/math/matrices-and-linear-transformations|Matrices and Linear Transformations]] - the transformations whose invariant directions eigenvectors are
- [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]] - the survey that introduces the characteristic polynomial and PageRank
- [[cs/machine-learning/pca-and-dimensionality-reduction|PCA and Dimensionality Reduction]] - principal components are eigenvectors of the covariance matrix
- [[cs/math/graph-theory|Graph Theory]] - the adjacency matrix whose dominant eigenvector PageRank computes

## Sources

- [Eigenvalues and eigenvectors (Wikipedia)](https://en.wikipedia.org/wiki/Eigenvalues_and_eigenvectors) - eigenvector as a direction left unchanged by a transformation, scaled by its eigenvalue, and the range of applications including stability analysis.
- [PageRank (Wikipedia)](https://en.wikipedia.org/wiki/PageRank) - PageRank values as the dominant right eigenvector of the link matrix, the Markov-chain reading, and the link-counting intuition.
- [Principal component analysis (Wikipedia)](https://en.wikipedia.org/wiki/Principal_component_analysis) - principal components as eigenvectors of the covariance matrix and the best-fitting-line variance objective.
