---
title: Machine Learning
description: The fundamentals of learning from data, the roots the deep-learning section is built on. Start with what the field even is, then how a model is trained and honestly measured.
draft: false
comments: false
tags:
  - cs
  - machine-learning
date: 2026-07-13
updated: 2026-07-13
aliases:
  - Machine Learning
  - ML
---

The fundamentals of machine learning, built from the University of Nebraska CSCE 479/879 course. This section is the roots. It covers what learning from data means, the paradigms, and the training and evaluation machinery that every model shares, from a linear regression to a deep network. The [[cs/deep-learning/index|deep learning]] section grows out of these ideas, and each note there links back to the fundamental it depends on.

### Start here

- [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]] - the cornerstone: why the three are different kinds of claim, not a difficulty ladder.

### The paradigms

- [[cs/machine-learning/supervised-learning|Supervised Learning]] - learning a function from labeled examples.
- [[cs/machine-learning/unsupervised-learning|Unsupervised Learning]] - finding structure in data with no labels.
- [[cs/machine-learning/generalization-vs-memorization|Generalization vs Memorization]] - why learning means performing on unseen data, not reciting the training set.
- [[cs/machine-learning/features-and-representations|Features and Representations]] - how a problem is described, and the shift deep learning makes by learning the description itself.

### The models

- [[cs/machine-learning/regression|Regression: Linear, Logistic, and Softmax]] - the weighted-sum model in three forms, and the output layer of a neural network.
- [[cs/machine-learning/logistic-regression|Logistic Regression]] - the log-odds model in depth, and why it is a regression that people use as a classifier.
- [[cs/machine-learning/decision-trees-and-ensembles|Decision Trees and Ensembles]] - rule-based models, and the random forests and gradient boosting that win on tabular data.
- [[cs/machine-learning/support-vector-machines|Support Vector Machines]] - the maximum-margin hyperplane, and the kernel trick.
- [[cs/machine-learning/k-nearest-neighbors|k-Nearest Neighbors]] - the model that stores the training set instead of summarizing it.
- [[cs/machine-learning/k-means-clustering|k-Means Clustering]] - Lloyd's alternation, and why initialization decides the answer.
- [[cs/machine-learning/pca-and-dimensionality-reduction|PCA and Dimensionality Reduction]] - the unsupervised workhorse, and the linear ancestor of the autoencoder.

### Training and evaluation

- [[cs/machine-learning/loss-functions|Loss Functions]] - how wrong an answer is.
- [[cs/machine-learning/gradient-descent|Gradient Descent]] - how a model reduces its loss.
- [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]] - overfitting, underfitting, and the sweet spot between them.
- [[cs/machine-learning/regularization-ridge-and-lasso|Regularization: Ridge and Lasso]] - the L2 and L1 penalties, and why only one of them zeroes coefficients out.
- [[cs/machine-learning/train-validation-test|Train, Validation, Test]] - measuring performance honestly and avoiding leakage.
- [[cs/machine-learning/evaluation-metrics|Evaluation Metrics]] - beyond accuracy: precision, recall, and ROC-AUC.

### Connects to

The math these notes lean on lives in [[cs/statistics/index|Statistics]] (probability, regression, maximum likelihood, Bayes) and [[cs/math/index|Mathematics]] (linear algebra). The history of how machine learning went mainstream is in [[cs/history/deep-learning-revolution|The Deep Learning Revolution]].
