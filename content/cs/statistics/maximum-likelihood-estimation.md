---
title: Maximum Likelihood Estimation
description: Estimating distribution parameters by maximizing the probability of observed data - the theoretical backbone of modern ML training.
draft: false
comments: true
tags:
  - cs
  - statistics
date: 2026-03-12
updated:
aliases: []
---

## Intuition

You observe data and suspect it came from a known family of distributions (normal, Poisson, etc.), but you don't know the exact parameters. **Maximum likelihood estimation** (MLE) asks: *which parameter values would have made the observed data most probable?* Pick those values. It is a simple, principled idea - yet it underpins nearly all of modern statistical inference and machine learning.

## Definition

Let $x_1, x_2, \dots, x_n$ be i.i.d. observations from a distribution with PDF (or PMF) $f(x; \theta)$, where $\theta$ is an unknown parameter (or parameter vector). The **likelihood function** treats the data as fixed and the parameter as variable:

$$L(\theta) = \prod_{i=1}^n f(x_i;\, \theta)$$

The **maximum likelihood estimator** $\hat{\theta}_{\text{MLE}}$ is the value of $\theta$ that maximizes $L(\theta)$:

$$\hat{\theta}_{\text{MLE}} = \arg\max_\theta\; L(\theta)$$

Because products are awkward to differentiate, we almost always work with the **log-likelihood** instead:

$$\ell(\theta) = \ln L(\theta) = \sum_{i=1}^n \ln f(x_i;\, \theta)$$

Since $\ln$ is monotonically increasing, maximizing $\ell(\theta)$ is equivalent to maximizing $L(\theta)$.

![Log-likelihood curve with peak at theta-hat MLE](cs/statistics/assets/likelihood-curve.svg)

## Key Formulas

**Finding the MLE** - set the score function to zero:

$$\frac{\partial \ell(\theta)}{\partial \theta} = 0$$

and verify the second derivative is negative (maximum, not minimum).

**MLE for the normal distribution:** Given $X_i \sim \mathcal{N}(\mu, \sigma^2)$:

$$\hat{\mu}_{\text{MLE}} = \bar{X} = \frac{1}{n}\sum_{i=1}^n X_i, \qquad \hat{\sigma}^2_{\text{MLE}} = \frac{1}{n}\sum_{i=1}^n (X_i - \bar{X})^2$$

> [!note]
> The MLE for $\sigma^2$ divides by $n$, not $n-1$. It is biased but **asymptotically unbiased** and consistent.

**Key asymptotic properties** (for large $n$):

| Property | Meaning |
|---|---|
| **Consistency** | $\hat{\theta} \xrightarrow{p} \theta_0$ as $n \to \infty$ |
| **Asymptotic normality** | $\hat{\theta} \approx \mathcal{N}(\theta_0,\; [I(\theta_0)]^{-1})$ |
| **Efficiency** | Achieves the Cramer-Rao lower bound asymptotically |
| **Invariance** | If $\hat{\theta}$ is MLE of $\theta$, then $g(\hat{\theta})$ is MLE of $g(\theta)$ |

Here $I(\theta)$ is the **Fisher information**: $I(\theta) = -E\!\left[\frac{\partial^2 \ell}{\partial \theta^2}\right]$.

## Example

**Estimating failure probability.** A component is tested $n = 50$ times and fails $k = 8$ times. Each test is Bernoulli with unknown probability $p$. The log-likelihood is:

$$\ell(p) = k \ln p + (n - k) \ln(1 - p)$$

Setting $\frac{d\ell}{dp} = 0$:

$$\frac{k}{p} - \frac{n - k}{1 - p} = 0 \implies \hat{p}_{\text{MLE}} = \frac{k}{n} = \frac{8}{50} = 0.16$$

The MLE says the best estimate of the failure probability is 16%. This is exactly the sample proportion - MLE often recovers familiar estimators as special cases. For lognormal data, the same approach yields MLEs for $\mu$ and $\sigma^2$ by maximizing the log-normal log-likelihood.

## Why It Matters in CS

- **Neural network training:** minimizing [[cs/machine-learning/loss-functions|cross-entropy loss]] is equivalent to maximizing the log-likelihood of the training labels under the model's predicted distribution.
- **[[cs/machine-learning/logistic-regression|Logistic regression]]:** the coefficients are found by maximizing the Bernoulli log-likelihood - there is no closed-form solution, so gradient ascent (or [[cs/dsa/square-root-algorithms|Newton's method]]) is used.
- **Language models:** [[cs/deep-learning/self-supervised-learning-and-pretraining|next-token prediction]] training maximizes $\sum \ln P(w_t \mid w_{<t};\, \theta)$, which is MLE over the training corpus.
- **Model comparison:** the Akaike Information Criterion (AIC) penalizes the maximized log-likelihood by the number of parameters, enabling principled model selection.

## Related Notes

- [[cs/statistics/bayesian-inference|Bayesian Inference]] - Bayesian estimation uses priors instead of pure likelihood maximization
- [[cs/statistics/probability-distributions|Probability Distributions]] - MLE estimates the parameters of these distribution families
- [[cs/statistics/regression-fundamentals|Regression Fundamentals]] - under normality, OLS and MLE yield identical coefficient estimates
- [[cs/statistics/normal-distribution|Normal Distribution]] - canonical MLE example for $\mu$ and $\sigma^2$
