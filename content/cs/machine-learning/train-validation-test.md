---
title: Train, Validation, and Test Sets
description: Why honest evaluation requires three disjoint datasets, one to fit, one to tune, and one you touch exactly once.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-13
aliases:
  - data-splits
  - holdout-set
---

Grading a student on the exact problems they studied measures memory, not understanding. The same is true of models: performance on the data used for training says almost nothing about performance on data the model has never seen, and the whole point of [[cs/machine-learning/supervised-learning]] is the never-seen part. The fix is procedural and non-negotiable: partition your labeled data by role, and never let information from evaluation data leak into the choices that build the model. Professor Scott's version, repeated like a safety brief, is simply: don't test on the training set.

> [!note] The idea
> Split the labeled data three ways. The **training set** fits the model's parameters. The **validation set** gives an unbiased look at the fit while you tune hyperparameters and decide when to stop. The **test set** is independent data, drawn from the same distribution, used exactly once at the end to estimate generalization. Data that influenced any modeling decision can no longer provide an unbiased estimate.

## The Three Roles

![A dataset split into train, validation, and test partitions, annotated with the role of each](cs/machine-learning/assets/train-validation-test-split.svg)

The **training set** is what [[cs/machine-learning/gradient-descent]] actually sees. The [[cs/machine-learning/loss-functions|loss]] is computed on it and the weights are fit to it.

The **validation set** exists because training involves choices the training loss cannot referee: learning rate, architecture, regularization strength, how long to train. You evaluate candidate settings on the validation set and keep what performs well. CS231n describes this precisely: the validation set is used essentially as a fake test set to tune the hyperparameters. It also drives [[cs/deep-learning/regularization-in-deep-learning|early stopping]], since a validation error that starts climbing while training error keeps falling is the classic sign of [[cs/machine-learning/bias-variance-tradeoff|overfitting]]. Note what this implies: the validation set participates in model building. It is spent.

The **test set** is the one dataset that influenced nothing. It is independent of every fitting and tuning decision but follows the same distribution as the training data, and that independence is what makes its error an [[cs/statistics/sampling-and-sampling-distributions|unbiased estimate]] of real-world performance. The discipline is strict and CS231n states it flatly: evaluate on the test set only a single time, at the very end. Every peek before then converts test data into validation data, and your final number stops being trustworthy.

## Why Leakage Ruins the Estimate

The failure mode is always the same: information flows from evaluation data into the model, and the evaluation becomes flattery. Testing on training data is the blatant version, but the subtle versions bite harder. Tuning hyperparameters against the test set is training on it, one bit at a time. If you augment data by duplicating and transforming instances, the copies of one original must not straddle the train/test boundary, or the model is being tested on near-duplicates of what it studied (a warning straight from the course slides). The estimator only means something if the test set stayed clean.

## When Data Is Scarce: Cross-Validation

A three-way split costs data, and with a small dataset a single small validation set gives noisy, untrustworthy signals. $k$-fold [[cs/statistics/bootstrap-and-resampling|cross-validation]] is the standard remedy: partition the data into $k$ equal folds, then train $k$ times, each time holding out a different fold for evaluation and training on the rest, and average the results. Every example gets used for both training and evaluation, just never in the same round. The course leans on this same machinery for comparing two learning algorithms, pairing the per-fold results with a statistical test (see [[cs/statistics/hypothesis-testing]]) rather than trusting a single split's difference.

> [!warning]
> Validation performance is an honest guide for choosing between models, but it is not an honest final report. The model you picked won the validation set partly by fitting its quirks. That is exactly what the untouched test set is for, and why it only works once.

## Related Notes

- [[cs/machine-learning/bias-variance-tradeoff]] explains the overfitting this split is designed to catch
- [[cs/machine-learning/generalization-vs-memorization]] on why unseen-data performance is the only score that counts
- [[cs/machine-learning/evaluation-metrics]] covers what to compute on the test set once you finally use it
- [[cs/statistics/hypothesis-testing]] for judging whether a measured difference between models is real
- [[cs/machine-learning/gradient-descent]] interacts with the validation set through early stopping
- [[cs/machine-learning/supervised-learning]] supplies the labeled data being partitioned

## Sources

- https://en.wikipedia.org/wiki/Training,_validation,_and_test_data_sets (roles of the three sets; validation as unbiased evaluation during hyperparameter tuning; rising validation error as an overfitting signal; test set independent but same distribution)
- https://cs231n.github.io/classification/ (validation set as a fake test set for hyperparameter tuning; evaluate on the test set only a single time, at the very end; cross-validation when validation data is small)
- https://en.wikipedia.org/wiki/Cross-validation_%28statistics%29 ($k$-fold procedure: partition into $k$ folds, rotate the held-out fold, average)
- Course framing: CSCE 479/879 (Stephen Scott, UNL), "Regularization and Performance Evaluation" lecture slides (don't test on the training set; augmentation duplicates must not span splits; $k$-fold CV with paired $t$ tests)
