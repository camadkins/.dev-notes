---
title: Singular Value Decomposition
description: "Every matrix is a rotation, a scaling, and another rotation: what the singular values measure and why truncating them is provably the best compression."
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-02-17
updated:
aliases:
  - singular-values
  - low-rank-approximation
---

## Every Matrix Is Three Simple Matrices

The SVD says something surprisingly strong about arbitrary matrices. It "is a factorization of a real or complex matrix into a rotation, followed by a scaling, followed by another rotation." No assumptions about squareness, symmetry, or invertibility are needed: it "generalizes the eigendecomposition of a square normal matrix with an orthonormal eigenbasis to any $m \times n$ matrix."

Formally, the SVD of an $m \times n$ complex matrix $\mathbf{M}$ is a factorization

$$\mathbf{M} = \mathbf{U} \mathbf{\Sigma} \mathbf{V}^{*}$$

where $\mathbf{U}$ "is an $m \times m$ complex unitary matrix, $\mathbf{\Sigma}$ is an $m \times n$ rectangular diagonal matrix with non-negative real numbers on the diagonal, $\mathbf{V}$ is an $n \times n$ complex unitary matrix," and $\mathbf{V}^{*}$ is the conjugate transpose of $\mathbf{V}$. Unitary means the transformation preserves lengths and angles, so all the stretching lives in the diagonal middle factor and nowhere else.

> [!note] The idea
> The diagonal entries of $\mathbf{\Sigma}$ rank the matrix's own directions by importance, and cutting the list short is not a heuristic but the provably optimal compression. Keep only the $t$ largest and you get the best rank-$t$ approximation under the Frobenius norm, a result "known as the Eckart-Young theorem, as it was proved by those two authors in 1936." That is unusual. A greedy truncation that happens to be globally optimal is the reason SVD sits under image compression, recommender systems, and dimensionality reduction rather than competing with them.

## What the Singular Values Actually Measure

The diagonal entries "are known as the singular values of $\mathbf{M}$." They are not arbitrary. "Conventionally they are arranged in descending order (from largest to smallest), which uniquely determines $\mathbf{\Sigma}$," and their count carries structural information: "the number of non-zero singular values, allowing repetitions, is equal to $r$, the rank of $\mathbf{M}$." A matrix with three nonzero singular values has rank three, however large it is.

The geometric reading is the one worth keeping. Take the unit sphere $S$ in $\mathbb{R}^n$. The linear map "maps this sphere onto an ellipsoid in $\mathbb{R}^m$. Non-zero singular values are simply the lengths of the semi-axes of this ellipsoid." So the rotate-scale-rotate story is literal: the first rotation lines up the sphere's axes with the directions the matrix cares about, the scaling stretches each by its singular value, and the second rotation places the resulting ellipsoid in the output space. The largest singular value is the longest semi-axis, the direction the matrix amplifies most.

The paired vector sets name those directions. "The columns of $\mathbf{U}$ and the columns of $\mathbf{V}$ are called left-singular vectors and right-singular vectors" of $\mathbf{M}$. Each $\sigma_j$ comes with an input direction $\mathbf{v}_j$ and an output direction $\mathbf{u}_j$.

This is the connection to [[cs/math/eigenvalues-and-eigenvectors|eigenvalues]], and also the departure from them. Eigendecomposition needs a square matrix with a suitable eigenbasis; the SVD needs nothing, which is why it is the workhorse for the rectangular, rank-deficient, noisy matrices that data actually produces.

## Truncation Is Optimal

The approximation problem is stated plainly: "low-rank approximation refers to the process of approximating a given matrix by a matrix of lower rank. More precisely, it is a minimization problem, in which the cost function measures the fit between a given matrix (the data) and an approximating matrix (the optimization variable), subject to a constraint that the approximating matrix has reduced rank."

The reason this matters beyond storage is modeling: "the rank constraint is related to a constraint on the complexity of a model that fits the data." Rank is a [[cs/machine-learning/bias-variance-tradeoff|complexity budget]].

The solution is the SVD, applied by amputation. "In the case that the approximation is based on minimizing the Frobenius norm of the difference between $\mathbf{M}$ and $\tilde{\mathbf{M}}$ under the constraint that $\operatorname{rank}(\tilde{\mathbf{M}}) = t$, it turns out that the solution is given by the SVD of $\mathbf{M}$," with the truncated $\mathbf{\Sigma}$ being "the same matrix as $\mathbf{\Sigma}$ except that it contains only the $t$ largest singular values (the other singular values are replaced by zero)." Equivalently you keep the first $t$ terms of

$$\mathbf{A}_k = \sum_{j=1}^{k} \sigma_j \mathbf{u}_j \mathbf{v}_j^{\mathsf{T}}$$

The result "is referred to as the matrix approximation lemma or Eckart-Young-Mirsky theorem." Its history is layered: the problem "was originally solved by Erhard Schmidt in the infinite dimensional context of integral operators ... and later rediscovered by C. Eckart and G. Young. L. Mirsky generalized the result to arbitrary unitarily invariant norms."

> [!example]
> Greyscale image compression is the cleanest demonstration. An image stored as an $m \times n$ matrix "can be efficiently represented by keeping the first $k$ singular values and corresponding vectors," and the truncated sum above "gives an image with the best 2-norm error out of all rank-$k$ approximations."
>
> The accounting is direct. Storing $\mathbf{A}_k$ "requires only $k(n+m+1)$ floating-point numbers compared to $nm$ integers." The reason a small $k$ suffices is empirical rather than algebraic: "since the singular values of most natural images decay quickly, most of their variance is often captured by a small $k$."

## Where It Shows Up

"Mathematical applications of the SVD include computing the pseudoinverse, matrix approximation, and determining the rank, range, and null space of a matrix. The SVD is also extremely useful in many areas of science, engineering, and statistics, such as signal processing, least squares fitting of data, and process control."

The rank, range, and null space entries are worth pausing on, because in [[cs/standards/ieee-754-floating-point|floating point]] those are otherwise ill-posed questions. Counting nonzero singular values gives a numerically meaningful rank in a way that row-reduction does not, since you can threshold small singular values instead of testing exact zeros.

The list of relatives explains why the same idea keeps reappearing under different names. Low-rank approximation "is closely related to numerous other techniques, including principal component analysis, factor analysis, total least squares, latent semantic analysis, orthogonal regression, and dynamic mode decomposition." Latent semantic analysis in information retrieval and [[cs/machine-learning/pca-and-dimensionality-reduction|principal component analysis]] in machine learning are, structurally, this one factorization applied to different matrices.

> [!warning]
> The compression guarantee is about a specific error measure, not about perceptual or semantic quality. Eckart-Young minimizes the Frobenius norm of the residual, so the retained content is whatever carries the most squared magnitude. On images the practical task "becomes finding an approximation that balances retaining perceptual fidelity with the number of vectors required to reconstruct the image," which is a judgment the theorem does not make for you. Optimal in norm is not the same as optimal for the application.

## Related Notes

- [[cs/math/eigenvalues-and-eigenvectors|Eigenvalues and Eigenvectors]] - the decomposition SVD generalizes to non-square matrices
- [[cs/math/matrices-and-linear-transformations|Matrices and Linear Transformations]] - the rotate, scale, rotate reading of a matrix
- [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]] - rank, range, and null space, which singular values expose
- [[cs/machine-learning/pca-and-dimensionality-reduction|PCA and Dimensionality Reduction]] - the statistical face of the same truncation
- [[cs/math/vectors-and-dot-products|Vectors and Dot Products]] - orthonormality is what makes the outer factors distortion-free

## Sources

- [Singular value decomposition (Wikipedia)](https://en.wikipedia.org/wiki/Singular_value_decomposition) - the factorization and the shapes of U, Sigma, and V, singular values as ellipsoid semi-axes, the rank count, the Eckart-Young theorem, the truncated sum, and the image-compression storage figures.
- [Low-rank approximation (Wikipedia)](https://en.wikipedia.org/wiki/Low-rank_approximation) - low-rank approximation as a constrained minimization, rank as a model-complexity constraint, the Eckart-Young-Mirsky naming and history, and the related techniques including PCA and latent semantic analysis.
