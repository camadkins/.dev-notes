---
title: "Regression: Linear, Logistic, and Softmax"
description: The three models that are secretly one. A weighted sum for numbers, the same sum squashed into a probability for classification, and its multiclass form, which is exactly the output layer of a neural network.
draft: false
comments: true
tags:
  - cs
  - machine-learning
  - regression
date: 2026-07-23
updated:
aliases:
  - Linear Regression
  - Softmax Regression
---

Regression is where the machine-learning model zoo starts, and it is worth more attention than its simplicity suggests, because the three models in this note are the same model wearing three hats, and the last of them is the output layer of every neural-network classifier. Master the progression here and a large part of [[cs/deep-learning/artificial-neural-networks|deep learning]] reads as review. The [[cs/machine-learning/generalization-vs-memorization|generalization]] problem, the [[cs/machine-learning/loss-functions|loss]] that measures error, and the [[cs/machine-learning/gradient-descent|gradient descent]] that minimizes it are all assumed here; this note is about the models those tools are applied to.

> [!note] The idea
> All three models compute the same thing first: a weighted sum of the inputs, $\mathbf{x}^\top\mathbf{w} + b$. Linear regression stops there and predicts a number. Logistic regression squashes that sum through the sigmoid into a probability and predicts a class. Softmax regression runs one sum per class and normalizes them into a distribution over many classes. Same linear core, three output shapes, three matching losses. The softmax version is, exactly, the final layer of a neural-net classifier.

## Linear regression: fit a line by least squares

Linear regression predicts a number as a weighted sum of the features. scikit-learn states the fit precisely: `LinearRegression` finds the coefficients $\mathbf{w}$ that minimize the [[cs/statistics/regression-fundamentals|residual sum of squares]] between the observed targets and the model's predictions, solving $\min_\mathbf{w} \lVert X\mathbf{w} - y \rVert_2^2$. That objective is the mean squared error, and there are two ways to reach its minimum. For linear regression it has a closed form, the normal equation, that solves for the best weights directly. But that formula is specific to this one model, and it [[cs/math/matrices-and-linear-transformations|inverts a matrix]] that grows with the number of features, so in practice, and for every model that has no closed form, you minimize the same objective with [[cs/machine-learning/gradient-descent|gradient descent]] instead. This is the split the whole field turns on: one model happens to be solvable in closed form; the general method that scales to everything, including neural networks, is iterative.

Left unconstrained, a linear model can chase noise, so the two standard regularizers penalize the size of the weights. Ridge adds an L2 penalty, $\min_\mathbf{w} \lVert X\mathbf{w} - y\rVert_2^2 + \alpha\lVert\mathbf{w}\rVert_2^2$, shrinking all coefficients smoothly. Lasso adds an L1 penalty, $\alpha\lVert\mathbf{w}\rVert_1$, which, as scikit-learn notes, tends to produce sparse coefficients, driving some exactly to zero and so performing feature selection. These are the same L1/L2 levers that return in deep learning as weight decay, covered in [[cs/deep-learning/regularization-in-deep-learning|regularization]].

## Logistic regression: the same sum, as a probability

Logistic regression is, despite the name, a classifier. scikit-learn is blunt that it is implemented as a linear model for classification rather than regression. It takes the identical linear sum and passes it through the logistic (sigmoid) function to produce a probability of the positive class:

$$\hat{p} = \sigma(\mathbf{x}^\top\mathbf{w} + b), \qquad \sigma(t) = \frac{1}{1 + e^{-t}}$$

Squared error is the wrong loss for a probability, so logistic regression minimizes the cross-entropy (log loss), which punishes confident wrong predictions sharply. The linear core is unchanged; only the output squashing and the loss changed. The [[cs/deep-learning/activation-functions|sigmoid]] you just met is one of the standard neural-network activation functions, met here first in its original home.

## Softmax regression: many classes, one distribution

Softmax regression is the multiclass generalization. Instead of one weight vector it keeps one per class, computes a linear sum for each, and normalizes the sums into a probability distribution with the softmax function:

$$\hat{p}_k = \frac{e^{\mathbf{x}^\top\mathbf{w}_k}}{\sum_{j} e^{\mathbf{x}^\top\mathbf{w}_j}}$$

The probabilities are non-negative and sum to one, and the model is trained, again, with cross-entropy loss. scikit-learn calls this the multinomial logistic regression: one coefficient vector per class, softmax to get class probabilities, cross-entropy to train.

> [!tip] This is the bridge to deep learning
> A neural-network classifier's final layer is softmax regression, and its training loss is cross-entropy, the exact pair defined here. Everything a deep network adds is what comes before that layer: stacked [[cs/deep-learning/artificial-neural-networks|hidden layers]] that learn [[cs/machine-learning/features-and-representations|features]], connected by [[cs/deep-learning/backpropagation|backpropagation]]. The output end is unchanged. When you build a classifier in a framework and write `activation="softmax"` with a cross-entropy loss, you are dropping this note's last model onto the top of a feature learner. Regression is not a warm-up you leave behind; it is the piece the network keeps.

## Related Notes

- [[cs/machine-learning/gradient-descent|Gradient Descent]] - the iterative minimizer used when the closed-form normal equation does not apply, which is almost always
- [[cs/machine-learning/loss-functions|Loss Functions]] - squared error for linear regression, cross-entropy for logistic and softmax
- [[cs/deep-learning/artificial-neural-networks|Artificial Neural Networks]] - a network is stacked feature layers ending in the softmax regression defined here
- [[cs/deep-learning/activation-functions|Activation Functions]] - the sigmoid and softmax, met here in their original regression setting
- [[cs/deep-learning/backpropagation|Backpropagation]] - how the network trains the layers below the regression output
- [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]] - what ridge and lasso regularization trade against
- [[cs/machine-learning/supervised-learning|Supervised Learning]] - the labeled setting all three models live in
- [[cs/statistics/simple-linear-regression|Simple Linear Regression]] - the statistics-side treatment of least-squares line fitting and inference on the coefficients

## Sources

- "Linear Models," scikit-learn User Guide. https://scikit-learn.org/stable/modules/linear_model.html . Supports `LinearRegression` minimizing the residual sum of squares $\min_\mathbf{w}\lVert X\mathbf{w}-y\rVert_2^2$; Ridge adding an L2 penalty and Lasso an L1 penalty that yields sparse coefficients usable for feature selection; logistic regression being a linear model for classification that predicts probabilities via the logistic/sigmoid function and minimizes cross-entropy/log loss; and multinomial (softmax) logistic regression using one coefficient vector per class, softmax-normalized probabilities, and a cross-entropy objective.
