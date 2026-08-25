---
title: Supervised Learning
description: The paradigm where a model learns a function from labeled examples, then predicts the label of inputs it has never seen.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-13
aliases: []
---

Most of the machine learning that reaches production is supervised. You collect examples that already carry the answer, show them to a learning algorithm, and get back a function that fills in the answer for new cases. The whole method rests on one bet: that a pattern which held across the examples you labeled will keep holding on the examples you did not.

> [!note] The idea
> Supervised learning fits a function from input to output using examples where the output is already known (the labels), and its worth is measured entirely by how well that function predicts labels for inputs it never saw during training.

## The setup

You start with a training set of pairs, each an input described by [[cs/machine-learning/features-and-representations|features]] and a known label. A supervised algorithm searches for a hypothesis, a function from inputs to outputs, that agrees with the training pairs and is expected to agree with future ones. In Tom Mitchell's framing the labeled set is the experience E, predicting the label is the task T, and prediction accuracy on unseen data is the performance measure P.

Two shapes cover most problems. When the label is a category the task is classification (spam or not, which digit, which disease). When the label is a continuous number the task is regression, the subject of the garden's [[cs/statistics/regression-fundamentals|regression fundamentals]] and [[cs/statistics/simple-linear-regression|linear regression]] notes.

## How the fitting works

The algorithm needs a way to score a candidate function against the data, which is the job of a [[cs/machine-learning/loss-functions|loss function]], and a way to reduce that score, usually [[cs/machine-learning/gradient-descent|gradient descent]]. Training is the loop: measure the loss on the training pairs, adjust the model to lower it, repeat. That is true whether the model is a linear regression or a deep [[cs/deep-learning/convolutional-neural-networks|convolutional network]], which is why supervised learning sits at the machine learning layer of [[cs/machine-learning/ai-vs-ml-vs-dl|the AI, ML, DL distinction]] rather than the deep learning layer.

> [!warning] The label is the bottleneck
> Supervised learning is only as good as its labels, and labels are expensive. Getting a radiologist to mark ten thousand scans, or paying annotators to tag images, is often the hardest and most costly part of a project. This is exactly the cost that [[cs/machine-learning/unsupervised-learning|unsupervised learning]] tries to avoid.

## Why it can fail

Fitting the training pairs is easy. A model with enough capacity can memorize them outright, which is worthless, because the goal was never the training answers. The real target is [[cs/machine-learning/generalization-vs-memorization|generalization]] to unseen inputs, and the gap between training performance and unseen performance is governed by the [[cs/machine-learning/bias-variance-tradeoff|bias-variance tradeoff]]. This is why supervised results are only trusted when they come from a held-out [[cs/machine-learning/train-validation-test|test set]] and are reported with honest [[cs/machine-learning/evaluation-metrics|metrics]].

> [!example] Trucks vs non-trucks
> Scott's course opens with a toddler learning "truck." Show a fire truck and a toy truck (labeled examples), described by features like number of wheels and whether it hauls cargo, and the learner builds a hypothesis. The test is not whether it re-labels the two it saw, but whether it calls a garbage truck it has never seen a truck. That single question is supervised learning in miniature.

## Related Notes

- [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]], where supervised learning sits in the hierarchy
- [[cs/machine-learning/unsupervised-learning|Unsupervised Learning]], learning without labels
- [[cs/machine-learning/generalization-vs-memorization|Generalization vs Memorization]], the thing supervised learning is really after
- [[cs/machine-learning/features-and-representations|Features and Representations]], how inputs are described
- [[cs/machine-learning/loss-functions|Loss Functions]] and [[cs/machine-learning/gradient-descent|Gradient Descent]], the fitting machinery
- [[cs/statistics/regression-fundamentals|Regression Fundamentals]], the continuous-label case

## Sources

- "Supervised learning," Wikipedia. https://en.wikipedia.org/wiki/Supervised_learning . Supports the definition of learning a function from labeled input-output pairs, the classification vs regression split, and the goal of generalizing to unseen inputs.
- "Machine learning," Wikipedia. https://en.wikipedia.org/wiki/Machine_learning . Supports Tom Mitchell's experience/task/performance framing and supervised learning as a core ML paradigm.
- Goodfellow, Bengio, Courville, *Deep Learning*, MIT Press. https://www.deeplearningbook.org/contents/ml.html . Supports the training-set / hypothesis / generalization structure and the role of loss minimization.
