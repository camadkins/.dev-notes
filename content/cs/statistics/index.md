---
title: Statistics
description: Foundations of statistical reasoning—probability distributions, inference, regression, and Bayesian methods for data-driven decision making.
draft: false
comments: false
tags:
  - cs
  - statistics
date: 2026-03-12
aliases: []
---

Statistics provides the mathematical framework for reasoning under uncertainty. These notes cover the core toolkit: how data behaves, how to test claims, how to model relationships, and how to update beliefs as evidence arrives. Start with a cluster overview and follow links into specifics.

### Probability & Foundations

- [[conditional-probability|Conditional Probability]] — updating probability with new information by restricting the sample space
- [[bayes-rule|Bayes' Rule]] — reversing conditional probability to compute the probability of a cause given an effect
- [[expected-value|Expected Value]] — the probability-weighted average outcome of a random variable
- [[variance-and-covariance|Variance and Covariance]] — measuring spread and co-movement between variables

### Probability Distributions

- [[probability-distributions|Probability Distributions]] — overview of discrete and continuous families; PMFs, PDFs, and CDFs
- [[binomial-distribution|Binomial Distribution]] — counting successes in fixed independent trials
- [[geometric-distribution|Geometric Distribution]] — trials until the first success
- [[poisson-distribution|Poisson Distribution]] — event counts in a fixed interval at constant rate
- [[exponential-distribution|Exponential Distribution]] — waiting time between Poisson events
- [[normal-distribution|Normal Distribution]] — the Gaussian bell curve; foundation for inference
- [[central-limit-theorem|Central Limit Theorem]] — why sample averages converge to normality

### Statistical Inference

- [[hypothesis-testing|Hypothesis Testing]] — null and alternative hypotheses, p-values, significance levels, Type I/II errors, and power
- [[maximum-likelihood-estimation|Maximum Likelihood Estimation]] — choosing parameters that make observed data most probable

### Regression & Modeling

- [[regression-fundamentals|Regression Fundamentals]] — multiple linear regression, OLS estimation, residual analysis, and R-squared
- [[simple-linear-regression|Simple Linear Regression]] — fitting a straight line by minimizing squared errors

### Bayesian Methods

- [[bayesian-inference|Bayesian Inference]] — prior, likelihood, posterior; updating beliefs with observed data via Bayes' theorem

---

*The full file listing follows below, generated automatically by Quartz.*
