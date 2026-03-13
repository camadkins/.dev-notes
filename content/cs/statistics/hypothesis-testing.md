---
title: Hypothesis Testing
description: Formulating null and alternative hypotheses, computing p-values, controlling Type I and Type II errors, and understanding statistical power.
draft: false
comments: false
tags:
  - cs
  - statistics
date: 2026-03-12
aliases: []
---

## Intuition

Hypothesis testing is a framework for making **decisions from data**. You start with a default assumption (nothing interesting is happening) and ask: is the observed data surprising enough to reject that assumption? It is the statistical equivalent of *proof by contradiction*—assume the boring explanation and see if the evidence forces you to abandon it.

The tension in every test is between two kinds of mistakes: declaring an effect that is not there (false alarm) and missing an effect that is real (missed detection). The entire framework is built around controlling these error rates.

## Core Idea

### The hypotheses

- **Null hypothesis** $H_0$: the default position. Typically "no effect" or "no difference." Example: $H_0\colon \mu = \mu_0$.
- **Alternative hypothesis** $H_1$ (or $H_a$): the claim you are testing. Example: $H_1\colon \mu \neq \mu_0$ (two-sided) or $H_1\colon \mu > \mu_0$ (one-sided).

The null is never "proven"—it is either rejected or not rejected.

### Test statistic and p-value

A **test statistic** summarizes the data into a single number whose distribution under $H_0$ is known. For a sample mean $\bar{X}$ with known variance:

$$Z = \frac{\bar{X} - \mu_0}{\sigma / \sqrt{n}}$$

Under $H_0$, $Z \sim \mathcal{N}(0, 1)$. When $\sigma$ is unknown, replace it with the sample standard deviation $s$ and use the $t$-distribution with $n - 1$ degrees of freedom.

The **p-value** is the probability of observing a test statistic at least as extreme as the one computed, assuming $H_0$ is true:

$$p = P(|Z| \ge |z_{\text{obs}}| \mid H_0)$$

A small p-value means the data are unlikely under $H_0$.

### Significance level and decision rule

Choose a **significance level** $\alpha$ (commonly 0.05) *before* seeing the data. Reject $H_0$ when $p \le \alpha$. The value $\alpha$ directly controls the Type I error rate.

> [!warning]
> A p-value is **not** the probability that $H_0$ is true. It is the probability of the observed (or more extreme) data *given* $H_0$. Confusing these is the single most common misinterpretation in applied statistics.

### Error types

|  | $H_0$ true | $H_0$ false |
|---|---|---|
| **Reject $H_0$** | Type I error ($\alpha$) | Correct (power) |
| **Fail to reject** | Correct ($1 - \alpha$) | Type II error ($\beta$) |

- **Type I error** (false positive): rejecting $H_0$ when it is true. Rate controlled at $\alpha$.
- **Type II error** (false negative): failing to reject $H_0$ when it is false. Probability denoted $\beta$.
- **Power** $= 1 - \beta$: the probability of correctly rejecting a false $H_0$.

### Power and sample size

Power depends on four quantities: $\alpha$, effect size, sample size $n$, and variability $\sigma$. Increasing $n$ or the effect size increases power. The relationship:

$$n \ge \left(\frac{z_{\alpha/2} + z_\beta}{\delta / \sigma}\right)^2$$

gives the minimum sample size for a two-sided $z$-test to detect effect $\delta$ with power $1 - \beta$ at level $\alpha$.

> [!tip]
> In practice, always do a **power analysis before collecting data**. Running a test on too-small a sample wastes resources and guarantees low power, meaning you will likely miss real effects.

### Multiple testing

When running $m$ tests simultaneously, the probability of at least one false positive rises to $1 - (1 - \alpha)^m$. Common corrections:

- **Bonferroni**: test each at $\alpha / m$. Simple but conservative.
- **Benjamini–Hochberg**: controls the **false discovery rate** (FDR) rather than the family-wise error rate. More powerful for large $m$.

## Example

**A/B test for click-through rate.** A website tests a new button design against the current one. After $n = 1{,}000$ visitors per group:

- Control: $\hat{p}_1 = 0.12$ (120 clicks)
- Treatment: $\hat{p}_2 = 0.15$ (150 clicks)

Under $H_0\colon p_1 = p_2$, the pooled proportion is $\hat{p} = 0.135$. The test statistic:

$$Z = \frac{0.15 - 0.12}{\sqrt{\hat{p}(1-\hat{p})\left(\frac{1}{1000} + \frac{1}{1000}\right)}} = \frac{0.03}{0.0153} \approx 1.96$$

For a two-sided test at $\alpha = 0.05$, the critical value is $z_{0.025} = 1.96$. The p-value is approximately 0.05, right at the boundary—collecting more data would resolve the ambiguity.

## Related Notes

- [[probability-distributions|Probability Distributions]] — test statistics follow known distributions under $H_0$
- [[regression-fundamentals|Regression Fundamentals]] — hypothesis tests on regression coefficients
- [[bayesian-inference|Bayesian Inference]] — an alternative framework that quantifies $P(H_0 \mid \text{data})$ directly
