---
title: "k-Nearest Neighbors: The Model That Refuses to Learn"
description: kNN builds no model at all. It stores the training set and answers each query by taking a vote among the closest stored points, which makes the distance metric the real model and the dimension count the real enemy.
draft: false
comments: true
tags:
  - cs
  - machine-learning
  - supervised-learning
date: 2026-02-17
updated:
aliases:
  - kNN
  - Nearest Neighbor Classifier
  - Instance-Based Learning
---

Every other supervised method compresses a training set into parameters and then throws the data away. k-nearest neighbors does the opposite. scikit-learn classifies neighbor methods as "non-generalizing machine learning methods, since they simply 'remember' all of its training data," and describes the classifier as instance-based learning that "does not attempt to construct a general internal model, but simply stores instances of the training data." Prediction is a lookup: find the $k$ closest stored examples to the query point and take a majority vote among their labels.

> [!note] The idea
> Because kNN has no parameters to fit, the modeling decisions do not disappear, they relocate. The distance metric becomes the model, since it alone defines which stored points count as "similar." The value of $k$ becomes the [[bias-variance-tradeoff|bias-variance]] dial, since it sets how much of the neighborhood gets averaged. And the number of features becomes an active threat rather than a nuisance, because in high dimensions Euclidean distance stops discriminating at all and the notion of a "nearest" neighbor quietly loses meaning.

## Deferred computation, and where the cost goes

Wikipedia describes the mechanic exactly: in kNN classification "the function is only approximated locally and all computation is deferred until function evaluation." Training is free, or nearly so, and the entire cost lands on prediction. That inversion has real consequences. A naive query compares against every stored point, which scikit-learn puts at $O[DN^2]$ for computing all pairwise distances across $N$ samples in $D$ dimensions, infeasible as $N$ grows.

The standard fix is spatial indexing. [[cs/dsa/binary-tree|A KD tree]] recursively partitions the parameter space along the data axes into nested regions, exploiting a triangle-inequality style argument that scikit-learn states directly: if $A$ is very distant from $B$, and $B$ is very close to $C$, then $A$ and $C$ are very distant "without having to explicitly calculate their distance." That prunes whole branches and brings a search down to $O[D N \log(N)]$ or better. The catch appears in the next paragraph of the same document: KD trees are very fast for low-dimensional searches with $D < 20$ but become inefficient as $D$ grows large, which scikit-learn names as one manifestation of the curse of dimensionality. Ball trees exist precisely to handle the higher-dimensional case KD trees give up on.

## The distance metric is the model

There is no weight vector to inspect, so the only thing encoding the analyst's beliefs about similarity is the metric. [[cs/math/vectors-and-dot-products|Euclidean distance]] is the common default, and Wikipedia notes it as the commonly used choice for continuous variables, with the overlap metric ([[cs/military-computing/error-correcting-codes-military-comms|Hamming distance]]) used for discrete variables such as in text classification, and correlation coefficients like Pearson and Spearman used in gene expression microarray work. scikit-learn's dense-matrix metric list runs well past those, including Manhattan, Chebyshev, standardized Euclidean, Mahalanobis, Jaccard, and haversine.

Two properties of the data leak straight through the metric into predictions. First, scale. Since the algorithm relies on distance, Wikipedia notes that when features represent different physical units or come in vastly different scales, feature-wise normalization of the training data can greatly improve accuracy. A feature measured in millimeters will dominate one measured in meters purely by unit choice. Second, relevance. Accuracy "can be severely degraded by the presence of noisy or irrelevant features, or if the feature scales are not consistent with their importance." A linear model can learn a near-zero coefficient for a useless feature. kNN cannot; every feature you hand it participates in the distance with equal standing unless you rescale it yourself.

## k as a bias-variance dial

At $k = 1$ the prediction is the label of the single closest training point, which Wikipedia calls the nearest neighbor algorithm. That decision surface fits every local wrinkle in the training data, including the noise. Raising $k$ averages over a larger neighborhood, and both sources describe the same tradeoff. Wikipedia: larger values of $k$ reduce the effect of noise on the classification but make boundaries between classes less distinct. scikit-learn: "in general a larger $k$ suppresses the effects of noise, but makes the classification boundaries less distinct." That is the [[bias-variance-tradeoff|bias-variance tradeoff]] in one hyperparameter, with no retraining cost to explore it, so $k$ is a natural thing to select on a [[train-validation-test|validation set]].

A refinement sits between the extremes. Default kNN uses uniform weights, a simple majority vote. scikit-learn's `weights='distance'` instead assigns weights proportional to the inverse of the distance from the query point, so a large $k$ can be used for stability while nearby points still dominate the answer.

> [!tip] kNN is a surprisingly strong baseline
> Wikipedia records a consistency result worth knowing: as the amount of data approaches infinity, the two-class kNN algorithm is guaranteed to yield an error rate no worse than twice the Bayes error rate, the minimum achievable error rate given the distribution of the data. A method with no training and no parameters is asymptotically within a factor of two of the theoretical optimum. scikit-learn adds that despite its simplicity nearest neighbors has succeeded on problems including handwritten digits and satellite image scenes, and that being non-parametric it is often successful where the decision boundary is very irregular.

## The curse of dimensionality, concretely

The failure mode is not slowness, it is meaninglessness. Wikipedia states what the curse means specifically in the kNN context: Euclidean distance "is unhelpful in high dimensions because all vectors are almost equidistant to the search query vector," and offers the picture of points lying more or less on a circle with the query at the center, every distance nearly the same. When the nearest and farthest neighbors sit at almost identical distances, ranking them by distance is close to ranking them by noise, and the vote that follows carries no signal.

The standard mitigation is to shrink $D$ before the algorithm ever runs. Wikipedia notes that for high-dimensional data, with more than roughly ten dimensions, dimension reduction is usually performed prior to applying kNN in order to avoid the curse's effects. This is one of the clearest practical arguments for [[pca-and-dimensionality-reduction|dimensionality reduction]] as a preprocessing step rather than an analysis technique, and one reason [[features-and-representations|feature engineering]] matters more for kNN than for models that can learn to ignore what you give them.

## Related Notes

- [[bias-variance-tradeoff|Bias-Variance Tradeoff]] - what the choice of k trades off
- [[pca-and-dimensionality-reduction|PCA and Dimensionality Reduction]] - the standard preprocessing that makes kNN viable in high dimensions
- [[features-and-representations|Features and Representations]] - why scaling and relevance leak directly into the distance
- [[supervised-learning|Supervised Learning]] - the labeled setting kNN operates in
- [[train-validation-test|Train, Validation, Test]] - where k gets selected
- [[decision-trees-and-ensembles|Decision Trees and Ensembles]] - the other classic non-parametric family, which does build a model
- [[asymptotic-notation|Asymptotic Notation]] - reading the O[DN^2] and O[DN log N] search costs

## Sources

- "Nearest Neighbors," scikit-learn User Guide. https://scikit-learn.org/stable/modules/neighbors.html . Supports neighbor methods as non-generalizing methods that remember all training data; classification as instance-based learning with no general internal model, computed by simple majority vote; the brute-force $O[DN^2]$ cost and the KD tree reduction to $O[DN\log(N)]$ via the distant-A-close-B pruning argument; KD trees being fast for $D < 20$ and degrading as $D$ grows as a manifestation of the curse of dimensionality; the supported dense-matrix metric list; larger k suppressing noise while blurring boundaries; `weights='distance'` weighting by inverse distance; and the handwritten-digit and satellite-image successes of a non-parametric method on irregular boundaries.
- "k-nearest neighbors algorithm," Wikipedia (raw wikitext). https://en.wikipedia.org/w/index.php?title=K-nearest_neighbors_algorithm&action=raw . Supports the local approximation with all computation deferred until function evaluation; Euclidean distance for continuous variables, Hamming/overlap for discrete, and Pearson/Spearman correlation in gene-expression work; feature-wise normalization improving accuracy when scales differ; degradation from noisy or irrelevant features; larger k reducing noise but blurring class boundaries; k = 1 as the nearest neighbor algorithm; the asymptotic two-class error bound of no worse than twice the Bayes error rate; the equidistance explanation of the curse of dimensionality; and dimension reduction being usual above roughly ten dimensions.
