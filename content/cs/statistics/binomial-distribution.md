---
title: Binomial Distribution
description: Counting successes in a fixed number of independent Bernoulli trials with constant probability.
draft: false
comments: false
tags: [cs, statistics]
date: 2026-03-12
aliases: []
---

## Intuition

Imagine flipping a coin $n$ times and counting heads. More generally, any time you repeat a yes/no experiment a fixed number of times with the same probability of success on each trial, the total number of successes follows a **binomial distribution**. The key ingredients are: a fixed count of trials, two possible outcomes per trial, independence between trials, and a constant success probability.

## Definition

A random variable $X$ follows a binomial distribution $X \sim B(n, p)$ if it represents the number of successes in $n$ independent Bernoulli trials, each with success probability $p$ and failure probability $q = 1 - p$.

$X$ can take integer values $x = 0, 1, 2, \ldots, n$.

Four conditions must hold for a binomial model to apply:

1. The number of trials $n$ is fixed in advance.
2. Each trial has exactly two outcomes (success or failure).
3. Trials are mutually independent.
4. The probability of success $p$ is constant across all trials.

## Key Formulas

**Probability Mass Function (PMF):**

$$b(x; n, p) = \binom{n}{x} p^x q^{n-x}, \quad x = 0, 1, \ldots, n$$

where $\binom{n}{x} = \frac{n!}{x!(n-x)!}$ is the binomial coefficient.

**Mean:**

$$\mu = np$$

**Variance:**

$$\sigma^2 = npq$$

**Standard Deviation:**

$$\sigma = \sqrt{npq}$$

The binomial coefficient $\binom{n}{x}$ counts the number of ways to choose which $x$ of the $n$ trials are successes.

## Example

Four identical electronic components are subjected to a shock test. Each has a 75% chance of surviving ($p = 0.75$). What is the probability that exactly 2 survive?

$$P(X = 2) = \binom{4}{2}(0.75)^2(0.25)^2 = 6 \cdot 0.5625 \cdot 0.0625 = 0.2109$$

So there is roughly a 21% chance that exactly 2 of the 4 components survive.

The expected number of survivors is $\mu = 4 \cdot 0.75 = 3$, with variance $\sigma^2 = 4 \cdot 0.75 \cdot 0.25 = 0.75$.

We can also compute the probability that *at least* 3 survive:

$$P(X \geq 3) = P(X=3) + P(X=4) = \binom{4}{3}(0.75)^3(0.25)^1 + \binom{4}{4}(0.75)^4(0.25)^0$$

$$= 4 \cdot 0.4219 \cdot 0.25 + 1 \cdot 0.3164 \cdot 1 = 0.4219 + 0.3164 = 0.7383$$

So there is about a 74% chance that 3 or more components survive the test.

## Why It Matters in CS

- **Network reliability**: modelling the number of packet losses across $n$ transmissions, each with independent loss probability $p$.
- **Cryptography and coding theory**: error-correcting codes rely on binomial models to predict the number of bit errors in a block.
- **Chip quality control**: semiconductor manufacturing uses binomial sampling to estimate defect rates across wafers.
- **A/B testing**: conversion counts in online experiments follow a binomial model, forming the basis for statistical significance tests.

## Related Notes

- [[probability-distributions|Probability Distributions]] — overview that introduces the binomial alongside other distributions
- [[geometric-distribution|Geometric Distribution]] — models trials until the *first* success rather than counting successes in $n$ trials
- [[poisson-distribution|Poisson Distribution]] — approximates the binomial when $n$ is large and $p$ is small

> **Note:** [[probability-distributions|Probability Distributions]] covers the binomial at an overview level. This note provides a deeper treatment with worked examples and CS applications.
