---
title: Decision Trees and Ensembles
description: One tree is interpretable and overfits; a forest of them wins. How a tree splits the feature space, why it has high variance, and how bagging and boosting turn weak trees into the workhorse of tabular machine learning.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-23
updated:
aliases:
  - Decision Trees
  - Random Forests
  - Gradient Boosting
  - Ensembles
---

Decision trees are the other main branch of the model zoo from [[cs/machine-learning/regression|regression]], and they answer a different question: instead of fitting a smooth weighted sum, they carve the feature space into boxes with a sequence of yes/no rules. A single tree is the most interpretable model in machine learning and one of the most prone to overfitting, and the resolution of that tension, combining many trees into an ensemble, produces the models that still win most competitions on tabular data, often beating deep networks there.

> [!note] The idea
> A decision tree predicts by asking a sequence of simple threshold questions and following the branches to a leaf, which makes it transparent but high-variance: a small change in the data can grow a completely different tree. An ensemble fixes this by combining many trees. Bagging (random forests) trains many trees independently on random subsets and averages them, which cancels their errors and cuts variance. Boosting trains trees in sequence, each correcting what the ensemble so far got wrong, which cuts bias. Weak, unstable trees become a strong, stable predictor.

## The tree: split the space to make it pure

scikit-learn describes a decision tree as a non-parametric supervised method that predicts by learning simple decision rules inferred from the features, which amounts to a piecewise-constant approximation. Training is a recursive greedy split: at each node the algorithm picks the feature and threshold that best separate the classes, measured by a purity criterion, Gini impurity or entropy (information gain), and repeats on each side until the leaves are pure or a stopping rule fires. Structurally the model is a [[cs/dsa/binary-tree|binary tree]] when the splits are binary, and a prediction is a single root-to-leaf traversal, so inference costs $O(\log n)$ in a balanced tree, the same logarithmic descent as [[cs/dsa/binary-search|binary search]].

The appeal is transparency. scikit-learn calls it a white-box model: any prediction is explained by the boolean rules along its path, the tree can be visualized, and it needs little data preparation (no feature scaling, unlike [[cs/machine-learning/gradient-descent|gradient-based]] models). The cost is stated just as plainly. Trees overfit: left unpruned they build over-complex rules that do not generalize, so you need pruning, a maximum depth, or a minimum leaf size to control them. And they are unstable: small variations in the data can produce a completely different tree. That instability is exactly the [[cs/machine-learning/bias-variance-tradeoff|high variance]] end of the tradeoff, and scikit-learn names the fix in the same breath, using trees within an ensemble.

## Bagging and random forests: average away the variance

The general ensemble principle, in scikit-learn's words, is that combining the predictions of several base estimators improves generalizability and robustness over a single one. Bagging is the parallel version: build many trees, each on a bootstrap sample (a random subset drawn with replacement) of the data, and average their predictions. A random forest adds a second dose of randomness, considering only a random subset of features at each split. The purpose of both, per scikit-learn, is to decrease the variance of the forest by combining diverse trees, at the cost of a slight increase in bias. Each tree still overfits its own sample, but their errors are decoupled, so averaging cancels them. A forest is a committee of overfitters that is not itself overfit.

## Boosting: correct the errors in sequence

Boosting attacks the other end of the tradeoff. Instead of independent trees, it builds them sequentially, each new one fitted to the errors the ensemble has made so far. In gradient boosting, each added tree is fitted to the negative gradient of the loss, the direction that most reduces the remaining error, which is [[cs/machine-learning/gradient-descent|gradient descent]] performed in the space of functions rather than parameters. The trees are typically shallow (weak on their own), and the sequence turns them into a strong predictor that reduces bias as well as variance. XGBoost, the scalable gradient-boosting system of Chen and Guestrin, is the best-known instance, widely used to reach state-of-the-art results on tabular machine-learning challenges through a sparsity-aware split algorithm and systems engineering that scales to billions of examples. When a Kaggle tabular competition is won, it is usually by gradient-boosted trees.

> [!tip] Ensembles are the classical cousin of dropout
> The ensemble idea reaches into deep learning directly. [[cs/deep-learning/regularization-in-deep-learning|Dropout]] works by randomly deleting neurons each training step, which trains an implicit ensemble of many thinned networks that share weights and get averaged at test time, the same variance-reduction logic as bagging a forest of trees. When you meet dropout as "training an ensemble by demolition," this is the model it is imitating. Trees also stand as the honest counterpoint to neural networks: on structured tabular data, a boosted forest is frequently the stronger and cheaper choice, and knowing when not to reach for a deep net is part of knowing the field.

## Related Notes

- [[cs/machine-learning/regression|Regression]] - the smooth-weighted-sum branch of the model zoo that trees contrast with
- [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]] - a single tree is high-variance; bagging cuts variance, boosting cuts bias
- [[cs/machine-learning/gradient-descent|Gradient Descent]] - gradient boosting fits each tree to the negative gradient of the loss
- [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]] - dropout as the neural-network echo of ensemble averaging
- [[cs/machine-learning/supervised-learning|Supervised Learning]] - the labeled setting trees and forests operate in
- [[cs/machine-learning/generalization-vs-memorization|Generalization vs Memorization]] - why an unpruned tree memorizes and an ensemble generalizes
- [[cs/dsa/binary-tree|Binary Tree]] - the data structure a decision tree is built on, and the root-to-leaf traversal a prediction walks
- [[cs/dsa/binary-search|Binary Search]] - the same logarithmic descent that makes tree inference cheap

## Sources

- "Decision Trees," scikit-learn User Guide. https://scikit-learn.org/stable/modules/tree.html . Supports decision trees being a non-parametric supervised method learning simple decision rules (a piecewise-constant approximation), splitting by Gini impurity or entropy, being an interpretable white-box model needing little data preparation, and overfitting / being unstable (small data changes give a completely different tree) unless controlled by pruning/depth/leaf-size or used within an ensemble.
- "Ensembles: Gradient boosting, random forests, bagging, voting, stacking," scikit-learn User Guide. https://scikit-learn.org/stable/modules/ensemble.html . Supports ensembles combining several base estimators to improve generalizability/robustness; bagging building estimators on random subsets and aggregating; random forests adding bootstrap sampling plus random per-split feature selection to decrease variance at a slight bias cost; and boosting building estimators sequentially, each correcting the ensemble's errors, with gradient boosting fitting to negative gradients.
- Tianqi Chen and Carlos Guestrin, "XGBoost: A Scalable Tree Boosting System," KDD 2016. https://arxiv.org/abs/1603.02754 . Supports XGBoost being a scalable end-to-end tree boosting system widely used to achieve state-of-the-art results on many machine-learning challenges, via a sparsity-aware split-finding algorithm, a weighted quantile sketch, and systems engineering that scales beyond billions of examples.
