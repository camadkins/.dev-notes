---
title: Maximum Likelihood Estimation
description: Choosing parameter values that make observed data most probable—the dominant frequentist estimation framework and foundation for modern machine learning.
draft: false
comments: false
tags:
  - cs
  - statistics
date: 2026-03-12
aliases: []
---

## Intuition

Imagine you flip a coin 10 times and get 7 heads. What value of the coin's bias $p$ makes that outcome most plausible? MLE answers: try every possible $p$, compute how likely the data would be under each one, and pick the $p$ that scores highest. That winning value is the **maximum likelihood estimate**. You are not saying $p$ is random—you are finding the single fixed value that best explains what you observed.

The idea generalizes to any model with parameters: find the parameter values under which the observed data had the greatest probability of occurring.

## Definition

Given observed data $D = (x_1, \dots, x_n)$ assumed to be drawn independently from a distribution with parameter(s) $\theta$, the **likelihood function** is:

$$L(\theta) = \prod_{i=1}^n f(x_i \mid \theta)$$

where $f$ is the PMF (discrete) or PDF (continuous). The **maximum likelihood estimator** is:

$$\hat{\theta}_{\text{MLE}} = \arg\max_\theta\; L(\theta)$$

Because products are unwieldy, we almost always work with the **log-likelihood**:

$$\ell(\theta) = \sum_{i=1}^n \ln f(x_i \mid \theta)$$

Maximizing $\ell$ is equivalent to maximizing $L$ (logarithm is monotonically increasing). The MLE is found by solving the **score equation** $\frac{d\ell}{d\theta} = 0$ and verifying a maximum via the second derivative.

### Properties

- **Consistency**: as $n \to \infty$, $\hat{\theta}_{\text{MLE}} \to \theta_{\text{true}}$ in probability.
- **Asymptotic normality**: $\hat{\theta}_{\text{MLE}}$ is approximately normal for large $n$, enabling confidence intervals.
- **Efficiency**: achieves the Cramér–Rao lower bound asymptotically—no unbiased estimator has smaller variance.
- **Invariance**: if $\hat{\theta}$ is the MLE of $\theta$, then $g(\hat{\theta})$ is the MLE of $g(\theta)$ for any function $g$.

## Key Formulas

| Formula | Meaning |
|---|---|
| $L(\theta) = \prod_{i=1}^n f(x_i \mid \theta)$ | Likelihood: joint probability of data given $\theta$ |
| $\ell(\theta) = \sum_{i=1}^n \ln f(x_i \mid \theta)$ | Log-likelihood (easier to optimize) |
| $\frac{d\ell}{d\theta} = 0$ | Score equation: first-order condition for the MLE |
| $I(\theta) = -E\!\left[\frac{d^2 \ell}{d\theta^2}\right]$ | Fisher information: precision of the MLE |
| $\text{Var}(\hat{\theta}) \approx \frac{1}{I(\hat{\theta})}$ | Approximate variance via Fisher information |

## Example

**Estimating a Poisson rate.** A server logs request counts per second: $x = (3, 5, 4, 7, 6)$. Assuming $X_i \sim \text{Poisson}(\lambda)$:

$$\ell(\lambda) = \sum_{i=1}^5 \left[x_i \ln \lambda - \lambda - \ln(x_i!)\right]$$

Taking the derivative and setting it to zero:

$$\frac{d\ell}{d\lambda} = \frac{\sum x_i}{\lambda} - n = 0 \implies \hat{\lambda}_{\text{MLE}} = \frac{\sum x_i}{n} = \frac{25}{5} = 5$$

The MLE for the Poisson rate is the sample mean—intuitive and exact. The Fisher information gives $I(\lambda) = n/\lambda$, so $\text{SE}(\hat{\lambda}) \approx \sqrt{5/5} = 1.0$.

## Why It Matters in CS

- **Training ML models**: logistic regression, neural networks, and language models are all trained by maximizing (log-)likelihood (or equivalently minimizing cross-entropy loss).
- **Probabilistic programming**: MLE provides point estimates; pairing it with Fisher information yields confidence intervals without full Bayesian computation.
- **Model comparison**: the log-likelihood feeds into AIC and BIC, the standard criteria for choosing between competing models.
- **Connection to Bayesian inference**: MLE equals the MAP estimate under a uniform prior. Understanding MLE clarifies when and why priors matter.

## Related Notes

- [[bayesian-inference|Bayesian Inference]] — adds a prior to the likelihood; posterior mode with uniform prior equals MLE
- [[normal-distribution|Normal Distribution]] — MLE for $\mu$ is $\bar{x}$; asymptotic normality of MLEs relies on CLT
- [[poisson-distribution|Poisson Distribution]] — example: MLE for $\lambda$ is the sample mean
- [[simple-linear-regression|Simple Linear Regression]] — OLS estimates are the MLEs under Gaussian error assumptions
- [[hypothesis-testing|Hypothesis Testing]] — likelihood ratio tests compare nested models via their log-likelihoods
