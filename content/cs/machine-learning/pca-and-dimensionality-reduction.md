---
title: PCA and Dimensionality Reduction
description: When you have too many features, find the few directions that carry the signal. How principal component analysis rotates data onto its axes of maximum variance, and why it is the linear ancestor of the autoencoder.
draft: false
comments: true
tags:
  - cs
  - machine-learning
  - unsupervised-learning
date: 2026-07-23
updated:
aliases:
  - PCA
  - Principal Component Analysis
  - Dimensionality Reduction
---

Most of the model zoo so far has been supervised. Principal component analysis is the flagship of the [[cs/machine-learning/unsupervised-learning|unsupervised]] side: it takes unlabeled, high-dimensional data and finds the handful of directions that actually carry the variation, discarding the rest. High dimensionality is a genuine problem, distances lose meaning, models overfit, and nothing can be visualized past three axes, and PCA is the standard first tool against it. It is also, in a way worth seeing early, the linear special case of the [[cs/deep-learning/autoencoders|autoencoder]], which makes it a clean bridge from classical machine learning into deep representation learning.

> [!note] The idea
> Data with many features usually varies mostly along a few directions and barely along the rest. PCA finds those directions, the principal components, as the orthogonal axes of maximum variance in the data, and re-expresses each point in terms of them. Keep the top few components and you have projected the data into far fewer dimensions while preserving most of its spread. It is a rotation onto the axes that matter, followed by dropping the axes that do not.

## Finding the axes of variance

scikit-learn describes PCA as decomposing a dataset into a set of successive orthogonal components that explain a maximum amount of the variance. Concretely, it centers the data, then finds the direction along which the points are most spread out; that is the first principal component. The second is the direction of most remaining variance that is orthogonal to the first, and so on. Each component is a linear combination of the original features, and together they form a new, decorrelated coordinate system ordered by how much variance each one captures. scikit-learn computes them with the Singular Value Decomposition, the standard linear-algebra factorization for exactly this.

Dimensionality reduction is then just truncation: keep the top $k$ components and project the data onto them. Because the components are ordered by variance, the first few usually retain most of the information, so a dataset with hundreds of features can often be squeezed to a handful of dimensions with little loss. That projection is what makes PCA useful for visualization (project to two dimensions and plot), for decorrelating and whitening inputs before models that assume it, and for cutting the feature count before a supervised model to fight overfitting.

## The statistics underneath

PCA is a geometric name for an idea from statistics: the principal components are the eigenvectors of the data's [[cs/statistics/variance-and-covariance|covariance matrix]], and the variance each explains is its eigenvalue. Maximizing variance along orthogonal directions and diagonalizing the covariance matrix are the same operation, which is why PCA both compresses data and removes the linear correlations between features. This is the concrete payoff of the covariance and eigen-decomposition machinery that the statistics and linear-algebra notes develop in the abstract.

> [!tip] PCA is the linear ancestor of the autoencoder
> An [[cs/deep-learning/autoencoders|autoencoder]] is a neural network that squeezes its input through a narrow bottleneck and reconstructs it, learning a compressed code in the middle. If you strip an autoencoder down to linear activations and a squared-error loss, it recovers exactly the subspace PCA finds; the bottleneck learns to span the top principal components. The autoencoder's power is that it does not have to stay linear, its layers and nonlinearities let it find curved, low-dimensional structure PCA cannot. Seeing PCA first makes the autoencoder legible: it is dimensionality reduction with the linear restriction lifted, the same move that [[cs/deep-learning/artificial-neural-networks|neural networks]] make everywhere. This is also why learned [[cs/deep-learning/embeddings|embeddings]], dense low-dimensional vectors, are the deep-learning descendants of a PCA projection.

## Related Notes

- [[cs/machine-learning/unsupervised-learning|Unsupervised Learning]] - the label-free setting PCA is a flagship method of
- [[cs/deep-learning/autoencoders|Autoencoders]] - the nonlinear neural generalization of PCA
- [[cs/deep-learning/embeddings|Embeddings]] - learned low-dimensional representations, the deep-learning descendant of a PCA projection
- [[cs/machine-learning/features-and-representations|Features and Representations]] - PCA as a way to build compact features from raw ones
- [[cs/statistics/variance-and-covariance|Variance and Covariance]] - the covariance matrix whose eigenvectors are the principal components
- [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]] - reducing dimensionality as a lever against overfitting

## Sources

- "Decomposing signals in components (matrix factorization problems): PCA," scikit-learn User Guide. https://scikit-learn.org/stable/modules/decomposition.html . Supports PCA decomposing a dataset into successive orthogonal components explaining maximum variance, being computed via Singular Value Decomposition, centering the data before projection, projecting to a lower-dimensional space for dimensionality reduction, and whitening for downstream models such as SVMs and K-Means.
