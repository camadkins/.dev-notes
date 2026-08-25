---
title: The Bias-Variance Tradeoff
description: Why models fail in two opposite ways, underfitting and overfitting, and how expected error decomposes into bias, variance, and irreducible noise.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-13
aliases:
  - overfitting
  - underfitting
---

A model can be wrong in two opposite ways. It can be too rigid to capture the real pattern, so it misses systematically no matter what data you show it. Or it can be so flexible that it molds itself to every quirk of the particular training set it saw, quirks that will not be there next time. The first failure is bias, the second is variance, and reducing one tends to feed the other. Every decision about model complexity is a negotiation between them, which makes this the theory behind [[cs/machine-learning/generalization-vs-memorization]].

> [!note] The idea
> For squared error, a learning algorithm's expected generalization error on a new point decomposes into a sum of three terms:
> $$\text{expected error} = \text{bias}^2 + \text{variance} + \text{irreducible error}$$
> Bias is systematic error from wrong assumptions in the model. Variance is sensitivity to which particular training set you happened to draw. The irreducible error comes from noise in the problem itself and no model can remove it.

## The Decomposition

Imagine [[cs/statistics/sampling-and-sampling-distributions|retraining the same algorithm on many different training sets drawn from the same source]], then asking how it does on average at a fixed test point. Bias measures how far the average prediction sits from the truth: a high-bias model is wrong in the same direction every time, because its assumptions cannot express the target. Variance (the same quantity from [[cs/statistics/variance-and-covariance]], applied to the predictions themselves) measures how much those predictions scatter across retrainings: a high-variance model gives you a substantially different function every time the data changes. The noise term is the floor, the error you would keep even with the ideal model, because the labels themselves are noisy (in [[cs/statistics/regression-fundamentals]] this is the error term the model never claims to explain).

## Underfitting and Overfitting

The two ends of the tradeoff have names. **Underfitting** is the high-bias end: the model is too simple for the structure in the data and performs poorly even on the training set. Fitting a straight line through an obviously curved relationship underfits. **Overfitting** is the high-variance end: the analysis corresponds too closely to the particular training data, capturing its residual noise as if it were signal, and so fails on new data. The signature is a gap: training error keeps falling while error on held-out data stalls or climbs (which is exactly what the validation curve in [[cs/machine-learning/train-validation-test]] is for).

The course puts the overfitting mechanism well: when the set of candidate functions is complex relative to what the problem actually needs, there are many more "wrong" functions available that happen to fit the training sample, and a powerful learner will find one. Any set of $n$ points can be fit by a polynomial of degree $n-1$, but if the truth is quadratic, the degree $n-1$ fit has spent most of its capacity memorizing noise.

![Bias falling and variance rising as model complexity grows, with total error forming a U shape and a sweet spot between underfitting and overfitting](cs/machine-learning/assets/bias-variance-tradeoff.svg)

## Living With the Tradeoff

As model complexity grows, bias falls and variance rises, so total expected error traces a U shape. The goal is the basin of that U, not the far right of the training-error curve, and that changes how you act:

- **Judge models on held-out data.** Training [[cs/machine-learning/loss-functions|loss]] alone rewards variance. The [[cs/machine-learning/train-validation-test]] split exists to expose it.
- **More data helps.** [[cs/statistics/law-of-large-numbers|Variance shrinks as training sets grow, because idiosyncrasies average out]]; with enough data you can afford a more complex model.
- **Constrain the model when data is scarce.** [[cs/deep-learning/regularization-in-deep-learning|Regularization, early stopping, and smaller architectures]] all trade a little bias for a large cut in variance. That trade is often favorable.

One honest caveat: the clean U shape is the classical picture, and it is a property of squared-error analysis and model families you can order by complexity. It remains the right first mental model, and it is the one this course (and most of practice) reasons with.

> [!example]
> Fit polynomials of degree 1, 2, and 9 to ten noisy points sampled from a quadratic. The line (degree 1) misses the curvature everywhere: high bias, and even its training error is poor. The degree 9 polynomial threads every point exactly, training error zero, but between the points it swings wildly, and a fresh sample from the same quadratic lands nowhere near it: high variance. The quadratic fit has modest training error and the best error on new samples. Nothing about the training scores alone would have told you degree 9 was the worst of the three.

## Related Notes

- [[cs/machine-learning/generalization-vs-memorization]] is this tradeoff seen from the behavioral side
- [[cs/machine-learning/train-validation-test]] is the measurement discipline that detects overfitting
- [[cs/statistics/variance-and-covariance]] for the statistical machinery behind the variance term
- [[cs/statistics/regression-fundamentals]] and [[cs/statistics/simple-linear-regression]] for the squared-error setting where the decomposition is exact
- [[cs/machine-learning/loss-functions]] on why training loss is a proxy, not the target
- [[cs/machine-learning/gradient-descent]] can overfit simply by running too long, hence early stopping

## Sources

- https://en.wikipedia.org/wiki/Bias%E2%80%93variance_tradeoff (decomposition of expected generalization error into bias, variance, and irreducible error from noise in the problem itself; complexity tradeoff)
- https://en.wikipedia.org/wiki/Overfitting (overfitting as an analysis corresponding too closely to the training data and failing on additional data; extracting residual variation as if it were structure; underfitting as the opposite failure)
- https://www.deeplearningbook.org/contents/ml.html (Goodfellow, Bengio, Courville, *Deep Learning*, ch. 5: capacity and generalization framing)
- Course framing: CSCE 479/879 (Stephen Scott, UNL), "Regularization and Performance Evaluation" lecture slides (complexity relative to the problem, polynomial example, larger datasets mitigating overfitting)
