---
title: Normal Distribution
description: The Gaussian bell curve - parameterized by mean and standard deviation, foundation for statistical inference and machine learning.
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

The normal distribution is the symmetric **bell curve** that shows up whenever many small, independent effects add together. Heights, measurement errors, exam scores - all tend to cluster around a central value with symmetric tails. The curve is entirely described by two numbers: where it is centered and how wide it spreads. This simplicity, combined with the [[central-limit-theorem|Central Limit Theorem]], makes it the single most important distribution in statistics.

## Definition

A continuous random variable $X$ follows a **normal distribution** with mean $\mu$ and standard deviation $\sigma$ (written $X \sim \mathcal{N}(\mu, \sigma^2)$) if its probability density function is:

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x - \mu)^2}{2\sigma^2}\right), \quad -\infty < x < \infty$$

- $\mu$ controls the **center** (location) of the bell.
- $\sigma$ controls the **width** (spread); larger $\sigma$ means flatter and wider.
- The distribution is symmetric about $\mu$, so the mean, median, and mode coincide.

The **standard normal** distribution is the special case $Z \sim \mathcal{N}(0, 1)$. Its CDF is denoted $\Phi(z)$ and serves as the universal reference for all normal probabilities.

## Key Formulas

**Standardizing transformation** - convert any normal variable to standard normal:

$$Z = \frac{X - \mu}{\sigma}$$

This lets you look up probabilities in a single $Z$-table or use a single CDF $\Phi(z)$.

**The 68-95-99.7 rule** (empirical rule):

| Interval | Probability |
|---|---|
| $\mu \pm 1\sigma$ | $\approx 68.3\%$ |
| $\mu \pm 2\sigma$ | $\approx 95.4\%$ |
| $\mu \pm 3\sigma$ | $\approx 99.7\%$ |

**Moment-generating function:**

$$M_X(t) = \exp\!\left(\mu t + \frac{\sigma^2 t^2}{2}\right)$$

**Linear combinations:** If $X_i \sim \mathcal{N}(\mu_i, \sigma_i^2)$ are independent, then $\sum a_i X_i \sim \mathcal{N}\!\left(\sum a_i \mu_i,\; \sum a_i^2 \sigma_i^2\right)$.

## Example

**Manufacturing tolerances.** A machine produces ball bearings whose diameters follow $X \sim \mathcal{N}(10.00,\; 0.02^2)$ mm. Bearings outside the tolerance $10.00 \pm 0.05$ mm are scrapped. What proportion is scrap?

Standardize the upper bound:

$$Z = \frac{10.05 - 10.00}{0.02} = 2.5$$

By symmetry, the proportion outside tolerance is:

$$P(|X - 10| > 0.05) = 2\,[1 - \Phi(2.5)] = 2(0.0062) \approx 1.24\%$$

So about 1.24% of production is scrapped - a number that directly informs cost analysis and quality control decisions.

If the process variance drifted to $\sigma = 0.03$ mm, the scrap rate would jump to $2[1 - \Phi(1.67)] \approx 9.5\%$ - demonstrating how sensitive quality is to the spread parameter.

## Why It Matters in CS

- **Machine learning:** Gaussian Mixture Models cluster data by fitting multiple normal distributions. Weight initialization in neural networks often uses $\mathcal{N}(0, \sigma^2)$.
- **Computer vision:** Gaussian blur convolves images with a normal kernel to reduce noise and detail.
- **Regression:** OLS assumes errors are normally distributed ($\varepsilon \sim \mathcal{N}(0, \sigma^2)$), which justifies $t$-tests on coefficients.
- **Generative models:** Variational autoencoders and diffusion models use the normal distribution as a latent prior.
- **Statistical testing:** many test statistics ($z$, $t$, $\chi^2$) are derived from normal assumptions on the underlying data.

## Related Notes

- [[central-limit-theorem|Central Limit Theorem]] - explains *why* the normal distribution appears so often
- [[probability-distributions|Probability Distributions]] - the normal in context with other distribution families
- [[regression-fundamentals|Regression Fundamentals]] - normality assumption on residuals
- [[bayesian-inference|Bayesian Inference]] - normal priors and conjugate updating
