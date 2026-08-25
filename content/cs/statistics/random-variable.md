---
title: Random Variable
description: A function that assigns numerical values to outcomes of a random experiment - the formal bridge between probability and statistics.
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

A random variable is just a **rule that turns outcomes into numbers**. Flip a coin and you get heads or tails - but if you assign heads = 1 and tails = 0, you now have a random variable. Roll two dice and sum the faces: that sum is a random variable. The outcome is still random, but now it lives on a number line, so you can compute averages, measure spread, and apply the full machinery of mathematics.

Random variables are the entry point to everything else in statistics. Without them, concepts like expected value, variance, and distributions have no object to act on.

## Definition

A **random variable** $X$ is a function from a sample space $S$ to the real numbers:

$$X: S \to \mathbb{R}$$

Each outcome $s \in S$ maps to a real number $X(s)$. The randomness comes from the underlying experiment, not from $X$ itself - $X$ is a deterministic function applied to a random outcome.

### Discrete vs. continuous

| Type | Values | Described by | Example |
|---|---|---|---|
| **Discrete** | Countable set $\{x_1, x_2, \dots\}$ | Probability mass function $P(X = x)$ | Number of bugs in a release |
| **Continuous** | Uncountable interval | Probability density function $f(x)$ | Response time of an API call |

For a discrete random variable, probabilities are assigned to individual values: $P(X = x)$. For a continuous random variable, probability is defined over intervals: $P(a \le X \le b) = \int_a^b f(x)\, dx$, and $P(X = x) = 0$ for any single point.

![Random variable as a function mapping sample space to real numbers](cs/statistics/assets/random-variable-mapping.svg)

## Key Formulas

**Probability mass function (discrete):**

$$f(x) = P(X = x), \quad \sum_x f(x) = 1$$

**Probability density function (continuous):**

$$P(a \le X \le b) = \int_a^b f(x)\, dx, \quad \int_{-\infty}^{\infty} f(x)\, dx = 1$$

**Cumulative distribution function (both types):**

$$F(x) = P(X \le x)$$

**Expected value:**

$$E[X] = \sum_x x\, f(x) \quad \text{or} \quad E[X] = \int_{-\infty}^{\infty} x\, f(x)\, dx$$

**Variance:**

$$\text{Var}(X) = E[(X - \mu)^2] = E[X^2] - (E[X])^2$$

## Example

**Modelling [[cs/networking/tcp-congestion-control|packet loss]].** A network link drops each packet independently with probability $p = 0.02$. Define $X$ = number of dropped packets in a batch of $n = 100$.

Each packet is a Bernoulli trial, so $X \sim \text{Binomial}(100, 0.02)$:

$$E[X] = np = 100 \times 0.02 = 2$$

$$\text{Var}(X) = np(1-p) = 100 \times 0.02 \times 0.98 = 1.96$$

The random variable $X$ lets us move from "packets might get dropped" to precise quantitative statements: on average 2 drops per batch, with standard deviation $\approx 1.4$. This informs retry buffer sizing and SLA calculations.

## Why It Matters in CS

- **Formalizing randomness.** Randomized algorithms ([[cs/dsa/quick-sort|quicksort pivot selection]], hash functions, skip lists) are analyzed by defining random variables over their internal coin flips.
- **Algorithm analysis.** The running time of a randomized algorithm is a random variable. Its expected value gives the average-case complexity; its variance tells you how reliable that average is.
- **Probabilistic data structures.** [[cs/dsa/hash-tables|Bloom filters]], count-min sketches, and HyperLogLog all define random variables whose distributions determine error guarantees.
- **Machine learning.** [[cs/machine-learning/features-and-representations|Features]] are random variables. Labels are random variables. The entire supervised learning framework is built on the joint distribution $P(X, Y)$.

## Related Notes

- [[cs/statistics/expected-value|Expected Value]] - the mean of a random variable
- [[cs/statistics/variance-and-covariance|Variance and Covariance]] - measures spread and co-movement of random variables
- [[cs/statistics/probability-distributions|Probability Distributions]] - the families that random variables follow
- [[cs/statistics/binomial-distribution|Binomial Distribution]] - a discrete random variable counting successes
- [[cs/statistics/normal-distribution|Normal Distribution]] - the most common continuous random variable model
- [[cs/statistics/poisson-distribution|Poisson Distribution]] - a discrete random variable for event counts
