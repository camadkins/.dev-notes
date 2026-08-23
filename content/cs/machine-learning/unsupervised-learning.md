---
title: Unsupervised Learning
description: Finding structure in data that carries no labels, through clustering and dimensionality reduction, when there is no answer key to learn from.
draft: false
comments: true
tags:
  - cs
  - machine-learning
  - unsupervised-learning
date: 2026-07-13
aliases:
  - unsupervised learning
  - clustering
---

Labels are expensive, and most data in the world arrives without them. Unsupervised learning is what you do when nobody has told you the right answer: you look for structure that is already latent in the data itself. There is no teacher, so success is judged by whether the structure the model finds is useful, not by accuracy against a known key.

> [!note] The idea
> Unsupervised learning discovers structure in unlabeled data, most often by grouping similar points together (clustering) or by compressing high-dimensional data into fewer meaningful axes (dimensionality reduction), without any target output to imitate.

## Two main jobs

**Clustering** partitions points into groups so that members of a group resemble each other more than they resemble members of other groups. Algorithms like k-means and hierarchical clustering formalize "resemble" with a distance in feature space. The output is a grouping the data suggested on its own, useful for customer segmentation, anomaly detection, or exploratory analysis.

**Dimensionality reduction** finds a smaller set of axes that still captures most of the variation in the data. Principal component analysis is the classic linear version, keeping the directions of greatest [[cs/statistics/variance-and-covariance|variance]]. The payoff is compression, visualization, and denoising, all of which make downstream [[supervised-learning|supervised]] models easier to train.

> [!tip] The contrast that defines it
> [[supervised-learning|Supervised learning]] asks "what is the label?" and needs an answer key. Unsupervised learning asks "what structure is here?" and needs none. That single difference, the presence or absence of labels, is what separates the two paradigms at the machine learning layer of [[ai-vs-ml-vs-dl|AI vs ML vs DL]].

## Where deep learning meets it

Some of the most important deep models are unsupervised or self-supervised at heart. An [[cs/deep-learning/autoencoders|autoencoder]] learns to compress and reconstruct its input with no labels at all, and its bottleneck is a learned [[features-and-representations|representation]]. Word [[cs/deep-learning/embeddings|embeddings]] are learned from raw text by predicting context, again without human labels. These systems turn the label bottleneck of supervised learning into an advantage: the data supervises itself.

> [!warning] Harder to evaluate
> Without labels there is no clean accuracy number. Judging a clustering or an embedding often means inspecting it, measuring internal cohesion, or checking whether it helps a downstream task. The lack of a ground-truth answer is both the appeal (no labeling cost) and the difficulty (no obvious score).

## Related Notes

- [[supervised-learning|Supervised Learning]], the labeled counterpart
- [[ai-vs-ml-vs-dl|AI vs ML vs DL]], where this paradigm sits
- [[features-and-representations|Features and Representations]], what clustering and reduction operate on
- [[cs/deep-learning/autoencoders|Autoencoders]] and [[cs/deep-learning/embeddings|Embeddings]], deep unsupervised representations
- [[cs/statistics/variance-and-covariance|Variance and Covariance]], the spread that dimensionality reduction preserves

## Sources

- "Unsupervised learning," Wikipedia. https://en.wikipedia.org/wiki/Unsupervised_learning . Supports the definition of learning structure from unlabeled data and the clustering vs dimensionality-reduction split.
- "Cluster analysis," Wikipedia. https://en.wikipedia.org/wiki/Cluster_analysis . Supports clustering as grouping by similarity and names k-means and hierarchical methods.
- "Dimensionality reduction," Wikipedia. https://en.wikipedia.org/wiki/Dimensionality_reduction . Supports reducing to fewer axes that capture variation, with PCA as the linear case.
