---
title: Statistics
description: Foundations of statistical reasoning - probability distributions, inference, regression, and Bayesian methods for data-driven decision making.
draft: false
comments: false
tags:
  - cs
  - statistics
date: 2026-03-12
updated:
aliases: []
---

Statistics provides the mathematical framework for reasoning under uncertainty. These notes cover the core toolkit: how data behaves, how to test claims, how to model relationships, and how to update beliefs as evidence arrives. Start with a cluster overview and follow links into specifics.

### Probability & Foundations

- [[cs/statistics/random-variable|Random Variable]] - the formal bridge from outcomes to numbers; entry point for all distribution and inference concepts
- [[cs/statistics/conditional-probability|Conditional Probability]] - updating probability with new information by restricting the sample space
- [[cs/statistics/bayes-rule|Bayes' Rule]] - reversing conditional probability to compute the probability of a cause given an effect
- [[cs/statistics/expected-value|Expected Value]] - the probability-weighted average outcome of a random variable
- [[cs/statistics/variance-and-covariance|Variance and Covariance]] - measuring spread and co-movement between variables

### Probability Distributions

- [[cs/statistics/probability-distributions|Probability Distributions]] - overview of discrete and continuous families; PMFs, PDFs, and CDFs
- [[cs/statistics/binomial-distribution|Binomial Distribution]] - counting successes in fixed independent trials
- [[cs/statistics/geometric-distribution|Geometric Distribution]] - trials until the first success
- [[cs/statistics/poisson-distribution|Poisson Distribution]] - event counts in a fixed interval at constant rate
- [[cs/statistics/exponential-distribution|Exponential Distribution]] - waiting time between Poisson events
- [[cs/statistics/normal-distribution|Normal Distribution]] - the Gaussian bell curve; foundation for inference

### Statistical Inference

- [[cs/statistics/central-limit-theorem|Central Limit Theorem]] - why sample averages converge to normality
- [[cs/statistics/law-of-large-numbers|Law of Large Numbers]] - why the sample mean converges at all, and how that differs from the CLT
- [[cs/statistics/sampling-and-sampling-distributions|Sampling and Sampling Distributions]] - the distribution of a statistic, and standard error
- [[cs/statistics/hypothesis-testing|Hypothesis Testing]] - null and alternative hypotheses, p-values, significance levels, Type I/II errors, and power
- [[cs/statistics/confidence-intervals|Confidence Intervals]] - interval estimation, and what the coverage claim does not say
- [[cs/statistics/t-distribution-and-t-tests|The t-Distribution and t-Tests]] - heavier tails, degrees of freedom, and the one-sample, two-sample, and paired tests
- [[cs/statistics/maximum-likelihood-estimation|Maximum Likelihood Estimation]] - choosing parameters that make observed data most probable
- [[cs/statistics/bootstrap-and-resampling|Bootstrap and Resampling]] - estimating a sampling distribution by resampling the data you already have

### Regression & Modeling

- [[cs/statistics/regression-fundamentals|Regression Fundamentals]] - multiple linear regression, OLS estimation, residual analysis, and R-squared
- [[cs/statistics/simple-linear-regression|Simple Linear Regression]] - fitting a straight line by minimizing squared errors

### Bayesian Methods

- [[cs/statistics/bayesian-inference|Bayesian Inference]] - prior, likelihood, posterior; updating beliefs with observed data via Bayes' theorem

---

*The full file listing follows below, generated automatically by Quartz.*
