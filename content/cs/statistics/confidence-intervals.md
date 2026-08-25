---
title: Confidence Intervals
description: "Interval estimation, coverage as a property of the procedure rather than the interval, and why the 95% probability reading is wrong."
draft: false
comments: true
tags:
  - cs
  - statistics
date: 2026-04-18
updated:
aliases:
  - Interval Estimation
  - Confidence Level
---

## Intuition

A point estimate throws away the one thing you most want to know: how much you should trust it. Reporting "the average screen time is 3 hours per day" hides whether the data pinned that number down or barely constrained it. A confidence interval replaces the point with a range plus a stated confidence level, so the width of the answer carries the precision of the answer.

The subtle part is what the confidence level attaches to. It is a property of the *recipe*, not of the numbers the recipe produced on your one sample.

> [!note] The idea
> A 95% confidence level is a guarantee about the long-run behavior of the interval-construction procedure, not a probability statement about the specific interval you computed. Under [[cs/statistics/hypothesis-testing|frequentist]] assumptions the true parameter is a fixed constant and the interval endpoints are the random quantities, so once you plug your data in, the realized interval either covers the parameter or it does not. There is no probability left to assign.

## Definition

Let $X$ be a random sample from a distribution with parameter $\theta$ to be estimated. A confidence interval for $\theta$ with confidence level $\gamma$ is an interval $(u(X), v(X))$ determined by [[cs/statistics/random-variable|random variables]] $u(X)$ and $v(X)$ satisfying

$$P(u(X) < \theta < v(X)) = \gamma$$

for all parameter values. The level $\gamma$ is usually written $1 - \alpha$, with $\alpha$ small (often 0.05). Read the probability carefully: it is over the randomness in $X$, which is what makes $u$ and $v$ random.

Some authors relax the equality to $P(u(X) < \theta < v(X)) \ge \gamma$, describing the level as "at least $100\gamma\%$". When the coverage probability can be strictly larger than $\gamma$ for some parameter values, the interval is called **conservative**: it errs on the safe side.

## Constructing one

Two widely applicable routes are [[cs/statistics/central-limit-theorem|the central limit theorem]] and [[cs/statistics/bootstrap-and-resampling|bootstrapping]]. The CLT route works only for large samples, since it leans on the asymptotic normality of

$$\frac{\bar{X} - \mu}{S / \sqrt{n}}.$$

For a normal population with unknown variance, that same quantity has an exact [[cs/statistics/t-distribution-and-t-tests|Student's $t$ distribution]] with $n - 1$ degrees of freedom, which makes it a **pivotal quantity**: its distribution does not depend on the unobservable $\mu$ and $\sigma^2$. Pivoting the inequality $P(-c \le T \le c) = 0.95$ around $\mu$ produces the familiar form

$$\left[\bar{x} - \frac{cs}{\sqrt{n}},\; \bar{x} + \frac{cs}{\sqrt{n}}\right],$$

or in NIST's notation, $\bar{Y} \pm t_{1-\alpha/2,\,N-1} \cdot s/\sqrt{N}$. Two factors set the width. Growing $N$ narrows the interval through the $\sqrt{N}$ term, and a larger sample standard deviation widens it, so noisy data yields wider intervals at the same confidence level.

## What the level does not mean

Published studies show that even [[cs/forensics/the-daubert-standard-and-expert-testimony|professional scientists]] often misinterpret confidence intervals. A 95% confidence level does *not* mean:

- for a given realized interval, that there is a 95% probability the parameter lies inside it;
- that 95% of the sample data lie within the interval;
- that a repeat experiment's estimate has a 95% probability of landing inside the interval you already computed.

The concrete version from the article: a factory samples 25 metal rods and gets a 95% interval of 36.8 to 39.0 mm for mean length. The true mean could be 37 mm (inside) or 40 mm (outside); either way whether it falls between 36.8 and 39.0 is a matter of fact, not probability. The second bullet fails on arithmetic alone here, since 95% of 25 is not an integer.

> [!warning]
> The comparison misreadings are just as common. Two groups are not necessarily indistinguishable because their intervals overlap, and they are not necessarily different because one group's interval excludes the other's mean. Neither rule holds in general, and experienced researchers still apply both.

The correct reading is the repeated-sampling one: if the same sampling procedure were repeated 100 times from the same population, roughly 95 of the resulting intervals would contain the true mean. Equivalently, phrased forward in time about a sample not yet drawn, there is a 95% probability that the interval computed from a given *future* sample will cover the parameter.

## The counterexample that makes it bite

Welch's example is the standard demonstration that coverage and epistemic certainty come apart. Take $X_1, X_2$ independent from a uniform $(\theta - 1/2, \theta + 1/2)$ distribution. The optimal 50% confidence procedure sets the half-width to $|X_1 - X_2|/2$ when $|X_1 - X_2| < 1/2$ and to $(1 - |X_1 - X_2|)/2$ otherwise.

When $|X_1 - X_2| \ge 1/2$, intervals from this procedure are *guaranteed* to contain $\theta$. When the two observations sit close together, the interval is tiny and excludes almost every reasonable parameter value, even though close observations mean you effectively have one data point's worth of information. The 100% coverage in one regime and near-0% in the other average out to the nominal 50%. The procedure is optimal by classical criteria and still tells you nothing about the precision of any particular estimate.

## Neighbors

A **prediction interval** covers a future individual observation rather than a parameter. For a single roll of a fair six-sided die no exact 95% prediction interval exists, while for a twenty-sided die $[1, 19]$ works, since 95% of rolls land at 19 or below. Confidence intervals quantify uncertainty about parameters; prediction intervals quantify uncertainty about future observations.

A **credible interval** is the [[cs/statistics/bayesian-inference|Bayesian]] object that genuinely does carry "95% probability the parameter is in here". In common settings such as estimating a normal mean with known variance, the two coincide under non-informative priors, which is exactly why the misinterpretation so often survives contact with reality.

> [!example]
> NIST's worked case on the ZARR13 data set: $N = 195$, mean 9.261460, standard deviation 0.022789, and $t_{1-0.025,\,194} = 1.9723$. The limits are $9.261460 \pm 1.9723 \times 0.022789/\sqrt{195}$, giving a 95% interval of $(9.258242, 9.264679)$. The same machinery converts to a one-sample $t$-test: against $H_0\colon \mu = 5$ the statistic is $T = 2611.284$ with 194 degrees of freedom, far outside the critical region $|T| > 1.9723$.

## History

Methods for binomial-proportion intervals appeared from the 1920s, in work by Wilson (1927) and Clopper and Pearson (1934). The general ideas developed in the early 1930s, and the first thorough and general account came from Jerzy Neyman in 1937, in "Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability". Neyman later recounted that the work originated around 1930 from a question by his student Waclaw Pytkowski, who was studying farm economics and wanted to characterize the precision of an estimated [[cs/machine-learning/regression|regression coefficient]] non-dogmatically.

Adoption in medicine lagged the theory badly. Confidence intervals were promoted in medical journals in the 1970s, became widely used only in the 1980s, and by 1988 journals were requiring them.

## Related Notes

- [[cs/statistics/hypothesis-testing|Hypothesis Testing]] - an interval and a two-sided test at the same $\alpha$ are two views of one calculation
- [[cs/statistics/central-limit-theorem|Central Limit Theorem]] - supplies the large-sample normal approximation most intervals rest on
- [[cs/statistics/t-distribution-and-t-tests|t-Distribution and t-Tests]] - the exact pivotal quantity when $\sigma$ is unknown
- [[cs/statistics/bootstrap-and-resampling|Bootstrap and Resampling]] - builds intervals without a closed-form sampling distribution
- [[cs/statistics/bayesian-inference|Bayesian Inference]] - credible intervals are the object people think confidence intervals are
- [[cs/statistics/sampling-and-sampling-distributions|Sampling and Sampling Distributions]] - the sampling distribution is what coverage is defined over

## Sources

- [Confidence interval (Wikipedia)](https://en.wikipedia.org/wiki/Confidence_interval) - definition and coverage property, the list of common misinterpretations, the metal-rod and die examples, Welch's uniform-location counterexample, and the Neyman 1937 history including the Pytkowski origin.
- [NIST/SEMATECH e-Handbook 1.3.5.2, Confidence Limits for the Mean](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm) - the $t$-based formula, the two factors controlling interval width, the explicit "not a 95% probability" note, and the ZARR13 worked example.
