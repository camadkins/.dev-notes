---
title: Vectors and Dot Products
description: "Magnitude, direction, and the one product that turns two vectors into a single number: why the dot product and cosine similarity run modern ML."
draft: false
comments: true
tags:
  - cs
  - math
  - linear-algebra
date: 2026-02-09
updated:
aliases:
  - dot-product
  - cosine-similarity
---

## An Arrow With a Length

Start with the object itself. A Euclidean vector is "a geometric object that has magnitude (or length) and direction," the arrow you draw from one point to another. In code it is just an ordered list of numbers, $\mathbf{v} = (v_1, \dots, v_n)$, but the geometric reading is what makes it useful: the numbers are coordinates of an arrow in $n$-dimensional space. Add two vectors and you chain the arrows tip to tail; scale one and you stretch it. Everything downstream (similarity, projection, gradients) is built from those two moves plus one product.

> [!note] The idea
> The dot product is the bridge between algebra and geometry. Computed algebraically it is "the sum of the products of the corresponding entries of the two sequences of numbers." Read geometrically it is "the product of their lengths and the cosine of the angle between them." Because both formulas name the same number, you can measure an angle you cannot see by doing arithmetic you can, and that is exactly the trick that lets a machine compare two documents it does not understand.

## Magnitude Is the Dot Product of a Vector With Itself

A vector's length is not a separate definition bolted on; it falls out of the dot product. The magnitude is "the square root of the dot product of a vector by itself." For $\mathbf{v} = (v_1, \dots, v_n)$,

$$\|\mathbf{v}\| = \sqrt{\mathbf{v} \cdot \mathbf{v}} = \sqrt{v_1^2 + \dots + v_n^2}$$

which is the Pythagorean theorem extended to $n$ dimensions. This is why "distance" and "similarity" in a feature space are computable at all: once you can dot two vectors, you can measure how long each one is and how far apart their tips sit.

## The Dot Product, Two Ways

The dot product "takes two equal-length sequences of numbers (usually coordinate vectors), and returns a single number." Written both ways, for vectors in $\mathbb{R}^n$:

$$\mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{n} a_i b_i = \|\mathbf{a}\|\,\|\mathbf{b}\|\cos\theta$$

The left side is a loop over coordinates. The right side is a statement about the angle $\theta$ between the arrows. Setting them equal and solving for $\cos\theta$ is the whole game. Two immediate consequences: the product is zero exactly when the vectors are perpendicular ($\cos 90° = 0$), and it is largest when they point the same way ($\cos 0° = 1$).

## Projection: How Much of One Vector Lies Along Another

The scalar projection of $\mathbf{a}$ onto $\mathbf{b}$ answers "how far does $\mathbf{a}$ reach in the direction of $\mathbf{b}$?" It is $\|\mathbf{a}\|\cos\theta$, which the dot product hands you directly once you divide out $\mathbf{b}$'s length:

$$\text{proj length} = \frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{b}\|}$$

Projection is the shadow $\mathbf{a}$ casts on the line through $\mathbf{b}$. It is the mechanism behind [[cs/statistics/simple-linear-regression|least-squares fitting]], where you project a target vector onto the space your model can reach, and behind [[cs/machine-learning/pca-and-dimensionality-reduction|PCA]], where you project data onto the directions that carry the most variance.

## Cosine Similarity: The ML Payoff

Drop the magnitudes and keep only the angle and you get cosine similarity, "the cosine of the angle between the vectors; that is, it is the dot product of the vectors divided by the product of their lengths":

$$\cos\theta = \frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{a}\|\,\|\mathbf{b}\|}$$

The load-bearing property: "the cosine similarity does not depend on the magnitudes of the vectors, but only on their angle." Two proportional vectors score $+1$, two orthogonal vectors score $0$, two opposite vectors score $-1$. That scale-invariance is precisely why it dominates text and [[cs/deep-learning/embeddings|embedding]] search. Represent a document as a vector of word counts and "cosine similarity then gives a useful measure of how similar two documents are likely to be, in terms of their subject matter, and independently of the length of the documents." A long article and a short note on the same topic point the same way even though one arrow is far longer; cosine ignores the length gap and keeps the topical agreement.

> [!example]
> Take $\mathbf{a} = (1, 2, 2)$ and $\mathbf{b} = (2, 0, 1)$.
> Dot product: $(1)(2) + (2)(0) + (2)(1) = 4$.
> Magnitudes: $\|\mathbf{a}\| = \sqrt{1 + 4 + 4} = 3$ and $\|\mathbf{b}\| = \sqrt{4 + 0 + 1} = \sqrt{5}$.
> Cosine similarity: $4 / (3\sqrt{5}) \approx 0.596$, so the angle is about $53.4°$. Scale $\mathbf{b}$ up to $(20, 0, 10)$ and the dot product jumps to $40$, but the cosine stays $0.596$. The angle did not move.

> [!tip]
> For unit-length vectors (magnitude 1), cosine similarity and the raw dot product are the same number. This is why embedding pipelines normalize vectors up front: after normalization a single dot product is a similarity score, and a matrix of dot products is an all-pairs similarity search.

## Related Notes

- [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]] - the broader survey of vectors, spaces, and bases this note drills into
- [[cs/math/matrices-and-linear-transformations|Matrices and Linear Transformations]] - a matrix-vector product is a stack of dot products, one per output row
- [[cs/deep-learning/embeddings|Embeddings]] - learned vectors whose geometry cosine similarity reads for search and retrieval
- [[cs/machine-learning/pca-and-dimensionality-reduction|PCA and Dimensionality Reduction]] - projection onto high-variance directions, built from the same dot product

## Sources

- [Euclidean vector (Wikipedia)](https://en.wikipedia.org/wiki/Euclidean_vector) - a vector as a geometric object with magnitude and direction, and length as the square root of the dot product of a vector with itself.
- [Dot product (Wikipedia)](https://en.wikipedia.org/wiki/Dot_product) - the algebraic sum-of-products definition and the equivalent geometric lengths-times-cosine definition.
- [Cosine similarity (Wikipedia)](https://en.wikipedia.org/wiki/Cosine_similarity) - cosine as dot product over the product of lengths, its magnitude-independence, and the document-comparison use.
