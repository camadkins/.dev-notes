---
title: "Logistic Regression: Modeling Log-Odds, Not Classes"
description: The model with the misleading name. It fits a straight line to the log-odds of an event, squashes that line into a probability with the sigmoid, and only becomes a classifier when you bolt a threshold onto its output.
draft: false
comments: true
tags:
  - cs
  - machine-learning
  - regression
date: 2026-05-12
updated:
aliases:
  - Logit Model
  - Logit Regression
  - Sigmoid Classifier
---

The name is the first obstacle. Logistic regression is taught as the entry point to classification, and yet it is called regression, and the disagreement is not sloppiness. Wikipedia's statistics-side framing says the model "simply models probability of output in terms of input and does not perform statistical classification (it is not a classifier), though it can be used to make a classifier, for instance by choosing a cutoff value." scikit-learn's ML-side framing says the opposite about its own implementation: "Despite its name, it is implemented as a linear model for classification rather than regression in terms of the scikit-learn/ML nomenclature." Both are right, and the gap between them is exactly one line of code: a threshold.

> [!note] The idea
> Logistic regression is genuinely a regression. What it regresses is not the class and not the probability, but the **log-odds** of the event, $\ln\frac{p}{1-p}$, which it models as a plain linear combination of the inputs. That quantity is unbounded, so a straight line fits it honestly, and the sigmoid is just the inverse transform that carries the line back into $(0,1)$. Classification is a decision made afterward on the probability, not something the model itself does. Everything strange about the name dissolves once you see that the line lives in log-odds space.

## Why log-odds and not probability

A probability is trapped in $[0, 1]$. A linear combination $\beta_0 + \beta_1 x_1 + \cdots + \beta_m x_m$ is not, it ranges over the whole real line, so fitting a line directly to a probability produces predictions below zero and above one for extreme inputs. The logit transform fixes the mismatch by moving the target instead of crippling the model. Wikipedia states the practical effect plainly: transforming with the logit converts the probability, bounded between 0 and 1, into a variable ranging over $(-\infty, +\infty)$, "thereby matching the potential range of the linear prediction function on the right side of the equation."

So the model equation is a linear regression, written on the transformed target:

$$\operatorname{logit} p(x) = \ln\left(\frac{p(x)}{1-p(x)}\right) = \beta_0 + \beta_1 x$$

Exponentiate both sides and the odds themselves come out multiplicative:

$$\frac{p(x)}{1-p(x)} = e^{\beta_0 + \beta_1 x}$$

This gives coefficients a clean reading that linear regression cannot offer for a probability. Wikipedia spells out the consequence: the odds multiply by $e^{\beta_1}$ for every 1-unit increase in $x$. Additive on the log-odds scale, multiplicative on the odds scale, and something messier and nonlinear on the probability scale. That last part is why people misread logistic coefficients, they read a coefficient as if it moved probability by a fixed amount, and it does not.

## The sigmoid is the inverse, not the model

Inverting the logit gives the standard logistic function, a sigmoid taking any real input $t$ and returning a value strictly between zero and one:

$$\sigma(t) = \frac{e^t}{e^t + 1} = \frac{1}{1 + e^{-t}}$$

Put the linear predictor in for $t$ and you get the familiar prediction rule. scikit-learn writes its fitted binary model as $\hat{p}(X_i) = \operatorname{expit}(X_i w + w_0) = 1/(1 + \exp(-X_i w - w_0))$. Same function, different notation. Worth keeping straight: the sigmoid is not an arbitrary squashing choice bolted on for convenience, it is the exact inverse of the link function the model was defined with. scikit-learn frames the whole thing structurally as a generalized linear model "with a Binomial / Bernoulli conditional distribution and a Logit link." Choose a different link and you get a different model, the probit, which uses a normal CDF instead.

This is also where the [[activation-functions|sigmoid activation]] used in neural networks comes from. It is met here first, in its original statistical home, doing a specific job rather than serving as a generic nonlinearity.

## Fitting by maximum likelihood

Least squares has no role here. The natural objective is the probability of having observed the labels you actually observed, and [[maximum-likelihood-estimation|maximum likelihood estimation]] maximizes exactly that. Wikipedia gives the likelihood as a product over the training set, one factor per example,

$$L = \prod_{k: y_k = 1} p_k \prod_{k: y_k = 0} (1 - p_k)$$

and its logarithm, the log-likelihood, collapses into a single summed expression:

$$\ell = \sum_{k=1}^{K}\left(y_k \ln p_k + (1 - y_k)\ln(1 - p_k)\right)$$

Negate that and you have the binary cross-entropy that scikit-learn minimizes, whose cost function is written as a sum of $-y_i \log(\hat{p}(X_i)) - (1 - y_i)\log(1 - \hat{p}(X_i))$ terms plus a regularization term. Cross-entropy loss and negative log-likelihood are the same object approached from two directions, which is a useful thing to know before meeting cross-entropy again in [[loss-functions|loss functions]] and again in every deep classifier.

The catch is that maximum likelihood here has no closed form. Wikipedia is explicit that logistic regression's parameters are most commonly estimated by MLE and that this "does not have a closed-form expression, unlike linear least squares." Setting the derivatives to zero yields conditions like $\sum_k (y_k - p_k) x_k = 0$, which are nonlinear in the coefficients and cannot be solved algebraically. So you fall back to an iterative numerical method, which is [[gradient-descent|gradient descent]] and its relatives in the ML world, and iteratively reweighted least squares or a quasi-Newton method such as L-BFGS in the statistics world. [[regression|Linear regression]] has a normal equation; logistic regression never does. That difference, not the sigmoid, is the real structural break between the two.

> [!example] Reading a fitted model on three scales
> Wikipedia works a two-variable model with base 10, $t = \log_{10}\frac{p}{1-p} = -3 + x_1 + 2x_2$. At $x_1 = x_2 = 0$ the log-odds are $-3$, so the odds are $10^{-3}$, one-to-1000, and the probability is $1/1001$. Increasing $x_1$ by one raises the log-odds by 1, multiplying the odds by $10^1$. Increasing $x_2$ by one raises the log-odds by 2, multiplying the odds by $10^2$. Note what the source stresses about the third scale: the effect of $x_2$ on the log-odds is twice that of $x_1$, and its effect on the odds is ten times greater, but the effect on the probability is not ten times greater. Three scales, three different stories, one linear model.

## The threshold is not part of the model

The fitted model outputs a number in $(0,1)$. Turning that into a predicted label requires picking a cutoff, and scikit-learn documents its own choice: the predicted probability "can be used as a classifier by applying a threshold (by default 0.5) to it. This is how it is implemented in scikit-learn, so it expects a categorical target, making the Logistic Regression a classifier." The default 0.5 is a convention, not a derivation. Moving it trades precision against recall without retraining anything, which is why the [[evaluation-metrics|ROC and precision-recall curves]] sweep the threshold rather than fixing it. A model that looks bad at 0.5 on an imbalanced problem is often a fine model read at the wrong cutoff.

> [!warning] Regularization defaults differ by culture
> scikit-learn notes that regularization "is applied by default, which is common in machine learning but not in statistics," and that turning it off amounts to setting `C` to a very high value. A statistician fitting the same data in a stats package and an engineer fitting it in scikit-learn can get different coefficients from identical inputs, purely from this default. The penalty options offered are $\ell_1$, $\ell_2$, and Elastic-Net, the same levers covered in [[regularization-ridge-and-lasso|ridge and lasso]].

## Related Notes

- [[regression|Regression: Linear, Logistic, and Softmax]] - the three-model progression this note zooms in on
- [[maximum-likelihood-estimation|Maximum Likelihood Estimation]] - the estimation principle that produces the cross-entropy objective
- [[loss-functions|Loss Functions]] - cross-entropy as negative log-likelihood
- [[gradient-descent|Gradient Descent]] - the iterative fit used because no closed form exists
- [[activation-functions|Activation Functions]] - the sigmoid in its neural-network role
- [[evaluation-metrics|Evaluation Metrics]] - what changes when you move the decision threshold
- [[regularization-ridge-and-lasso|Regularization: Ridge and Lasso]] - the L1 and L2 penalties applied by default here
- [[supervised-learning|Supervised Learning]] - the labeled setting this model lives in

## Sources

- "Logistic regression," Wikipedia (raw wikitext). https://en.wikipedia.org/w/index.php?title=Logistic_regression&action=raw . Supports the model as one that models the log-odds of an event as a linear combination of inputs; the statistics-side position that it is not itself a classifier but can be made into one with a cutoff; the logit and its inverse the standard logistic function $\sigma(t) = 1/(1+e^{-t})$; the odds equation and the "odds multiply by $e^{\beta_1}$ per 1-unit increase" reading; the logit's practical effect of mapping $(0,1)$ onto $(-\infty,+\infty)$ to match the linear predictor's range; the likelihood and log-likelihood formulas; MLE having no closed-form expression unlike linear least squares, requiring IRLS or L-BFGS; and the worked base-10 example with $\beta_0=-3$, $\beta_1=1$, $\beta_2=2$.
- "Linear Models," scikit-learn User Guide. https://scikit-learn.org/stable/modules/linear_model.html . Supports the "despite its name, implemented as a linear model for classification" framing; the GLM view with a Binomial/Bernoulli conditional distribution and logit link; the fitted probability $\operatorname{expit}(X_i w + w_0)$; the regularized cross-entropy cost function; the default 0.5 threshold making it a classifier in scikit-learn; and regularization being applied by default, common in ML but not in statistics, with $\ell_1$, $\ell_2$, and Elastic-Net penalty choices.
