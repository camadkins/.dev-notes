---
title: Loss Functions
description: How a model's wrongness becomes a single number an optimizer can chase, from 0-1 loss to cross-entropy and hinge loss.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-13
aliases:
  - cost-function
  - error-function
---

A learning algorithm cannot act on "the model seems wrong here." It needs wrongness as a number, one it can compute, compare, and reduce. A loss function does exactly that: given a true label $y$ and a prediction $\hat{y}$, it returns $J(y, \hat{y})$, a non-negative score where zero means perfect and bigger means worse. Once the loss exists, all of [[supervised-learning]] collapses into an optimization problem: find the parameters that make the total loss small. This framing is what lets [[gradient-descent]] do the actual work.

> [!note] The idea
> A loss function $J(y, \hat{y})$ maps each (true label, prediction) pair to a non-negative penalty. Training a model means choosing parameters that minimize the sum of these penalties over the training set, while what we actually care about is the expected penalty on new data.

## From One Instance to a Training Objective

The loss is defined per instance. For a training set $\mathcal{X}$, the total training loss of a hypothesis $h$ is

$$\text{error}_{\mathcal{X}}(h) = \sum_{x \in \mathcal{X}} J(y_x, \hat{y}_x)$$

where $y_x$ is the true label and $\hat{y}_x$ is the model's prediction. But minimizing this number is a proxy for the real goal: minimizing the expected loss over the unknown distribution $\mathcal{D}$ the data comes from,

$$\text{error}_{\mathcal{D}}(h) = \mathbb{E}_{x \sim \mathcal{D}}\left[J(y_x, \hat{y}_x)\right]$$

Those two quantities can diverge badly. A flexible model can drive training loss to zero while expected loss climbs, which is the whole subject of [[generalization-vs-memorization]] and the [[bias-variance-tradeoff]].

## The Losses You Actually Meet

**0-1 loss** is the bluntest instrument: $J(y, \hat{y}) = 1$ if $y \neq \hat{y}$, else $0$. Averaged over a test set it is just the error rate, the complement of accuracy in [[evaluation-metrics]]. It matches how classifiers are judged, but it is flat almost everywhere and jumps at decision boundaries, so it offers no gradient to follow. Training uses smoother stand-ins.

**Square loss**, $J(y, \hat{y}) = (y - \hat{y})^2$, is the default for regression (see [[regression-fundamentals]] and [[simple-linear-regression]]). It penalizes big misses quadratically, and it has a clean probabilistic reading: minimizing square loss corresponds to [[maximum-likelihood-estimation]] when the labels are corrupted by [[normal-distribution|Gaussian]] noise.

**Cross-entropy loss** is the workhorse for classification when the model outputs probabilities. For a binary label,

$$J(y, \hat{y}) = -y \ln \hat{y} - (1 - y)\ln(1 - \hat{y})$$

and for $k$ classes with a one-hot label vector it reduces to $-\ln \hat{y}_{i^*}$, the negative log probability the model assigned to the correct class $i^*$. The names "log loss," "logistic loss," and "cross-entropy loss" get used interchangeably, and minimizing it is again maximum likelihood in disguise: the model is punished exactly by how little probability it gave the truth.

**Hinge loss**, $J(y, \hat{y}) = \max(0, 1 - y\hat{y})$ for labels $y \in \{-1, +1\}$, is the maximum-margin loss behind support vector machines. It charges nothing once an example is classified correctly with margin at least 1, and grows linearly with how badly the margin is violated. Stanford's CS231n treats the hinge (SVM) loss and the softmax cross-entropy loss as the two standard choices for linear classifiers, and notes both can work well.

## Why the Choice Matters

The loss function is where you encode what "wrong" means for your problem. Square loss says large errors are disproportionately bad. Cross-entropy says confident wrong probabilities are catastrophic (the loss goes to infinity as $\hat{y}_{i^*} \to 0$). Hinge loss says only margin violations matter at all. The optimizer will exploit whatever definition you hand it, so the loss must be differentiable enough for [[gradient-descent]] and honest enough that minimizing it produces the behavior you actually want.

> [!example]
> A binary classifier sees an example with true label $y = 1$ and predicts $\hat{y} = 0.9$. Square loss charges $(1 - 0.9)^2 = 0.01$. Cross-entropy charges $-\ln 0.9 \approx 0.105$. Now the model predicts $\hat{y} = 0.1$ on the same example: square loss is $(1 - 0.1)^2 = 0.81$, but cross-entropy explodes to $-\ln 0.1 \approx 2.303$. Cross-entropy is far angrier about confident mistakes, which is exactly why it trains probability-outputting classifiers so well.

## Related Notes

- [[supervised-learning]] turns into optimization only once a loss is chosen
- [[gradient-descent]] is the algorithm that actually minimizes the loss
- [[maximum-likelihood-estimation]] shows why square loss and cross-entropy are principled, not arbitrary
- [[bias-variance-tradeoff]] explains why zero training loss is not the goal
- [[evaluation-metrics]] covers what to report after training, which is rarely the raw loss
- [[generalization-vs-memorization]] on the gap between training loss and expected loss
- [[ai-vs-ml-vs-dl]] for where this sits in the bigger picture

## Sources

- https://en.wikipedia.org/wiki/Loss_function (loss/cost function definition as a mapping from outcomes to a real-valued penalty)
- https://en.wikipedia.org/wiki/Cross-entropy (binary and multi-class cross-entropy; "log loss" and "cross-entropy loss" used interchangeably; connection to likelihood)
- https://en.wikipedia.org/wiki/Hinge_loss (hinge loss formula and its use for maximum-margin classification, notably SVMs)
- https://cs231n.github.io/linear-classify/ (hinge/SVM loss vs softmax cross-entropy as the two common classification losses)
- https://www.deeplearningbook.org/contents/ml.html (Goodfellow, Bengio, Courville, *Deep Learning*, ch. 5: loss minimization, capacity, and generalization framing)
- Course framing: CSCE 479/879 (Stephen Scott, UNL), "Regularization and Performance Evaluation" lecture slides
