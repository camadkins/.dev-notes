---
title: Generalization vs Memorization
description: Why learning means performing well on data you have never seen, not reciting the training set, and how the gap between the two is measured.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-13
aliases: []
---

The whole point of machine learning is to do well on data you have not seen yet. A model that scores perfectly on its training examples has proven almost nothing, because storing answers is trivial for a computer. The interesting quantity is not training performance, it is the drop between training performance and performance on fresh data. Keeping that drop small is what "learning" actually means.

> [!note] The idea
> Learning is the ability to generalize from labeled examples to unseen inputs. Memorization, storing the training answers verbatim, is trivial and worthless on its own. The generalization gap, the difference between training error and test error, is the real measure of whether a model learned anything.

## Why memorization is not learning

Scott's course makes the point with a toddler and a cat. A toddler who has seen a fire truck and a toy truck should call a never-seen garbage truck a truck. A cat that recognizes its owner should still recognize them in a photo it has never encountered. In both cases the test is transfer to new instances, not recall of old ones. [[cs/dsa/hash-tables|A lookup table]] that returns the stored label for a training input and shrugs at everything else has memorized without learning.

For a computer this matters more, not less, because memorizing is so easy. A model with enough capacity can drive its training error to zero by fitting every point, including the noise, which is the failure mode called overfitting.

## The generalization gap

Formally, training error is measured on the data the model fit, and generalization error is the [[cs/statistics/expected-value|expected error]] on new samples drawn from the same distribution. The gap between them is the generalization gap. A useful model keeps both low; a memorizing model has near-zero training error and a large gap.

> [!warning] You cannot see generalization error directly
> True generalization error is over the whole data distribution, which you never fully observe. You estimate it with a held-out [[cs/machine-learning/train-validation-test|test set]] the model never trained on. The moment the test set leaks into training, the estimate is worthless, because you are back to measuring memorization.

## What controls the gap

The gap is governed by the [[cs/machine-learning/bias-variance-tradeoff|bias-variance tradeoff]]. Too little model capacity underfits, high error everywhere. Too much capacity overfits, low training error and a wide gap. The sweet spot has enough capacity to capture the real pattern and enough restraint to ignore the noise. Every regularization technique, from weight penalties to [[cs/deep-learning/regularization-in-deep-learning|dropout and early stopping]], exists to push a model back toward that sweet spot when it starts to memorize.

> [!example] The tell
> Training accuracy 99 percent, test accuracy 71 percent is the signature of memorization: the model learned the training set, including its quirks, and did not learn the underlying pattern. Training accuracy 88 percent, test accuracy 85 percent is worse on paper but better in truth, because it generalized.

## Related Notes

- [[cs/machine-learning/supervised-learning|Supervised Learning]], where generalization is the goal
- [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]], what controls the gap
- [[cs/machine-learning/train-validation-test|Train, Validation, Test]], how the gap is estimated honestly
- [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]], how the gap is narrowed
- [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]], why "learned from data" is the ML claim

## Sources

- "Overfitting," Wikipedia. https://en.wikipedia.org/wiki/Overfitting . Supports the contrast between fitting training data (including noise) and generalizing, and memorization as the degenerate case.
- "Generalization error," Wikipedia. https://en.wikipedia.org/wiki/Generalization_error . Supports the definition of generalization error over the data distribution and its estimation via held-out data.
- Goodfellow, Bengio, Courville, *Deep Learning*, MIT Press. https://www.deeplearningbook.org/contents/ml.html . Supports the training-error / generalization-error distinction, capacity, and the role of the gap (Chapter 5).
