---
title: Poisson Distribution
description: Modelling the count of independent events occurring in a fixed interval at a constant average rate.
draft: false
comments: true
tags: [cs, statistics]
date: 2026-03-12
updated:
aliases: []
---

## Intuition

Some events happen at a roughly constant average rate: server requests per second, typos per page, radioactive decays per minute. The **Poisson distribution** counts how many such events occur in a fixed interval of time or space. It works best when events are independent, arrive one at a time, and the average rate does not change across the interval.

## Definition

A random variable $X$ follows a Poisson distribution $X \sim \text{Pois}(\mu)$ if it represents the number of events occurring in a fixed interval (time, area, volume, etc.) where events happen independently at a constant average rate.

$X$ can take non-negative integer values $x = 0, 1, 2, \ldots$

The parameter $\mu = \lambda t$ is the expected number of events in the interval of length $t$ with rate $\lambda$.

Three assumptions underlie the Poisson model:

1. **Independence**: the occurrence of one event does not affect the probability of another.
2. **Proportionality**: for a small sub-interval $\Delta t$, $P(\text{one event}) \approx \lambda \Delta t$.
3. **No simultaneous events**: $P(\text{two or more events in } \Delta t) \approx 0$.

## Key Formulas

**Probability Mass Function (PMF):**

$$p(x; \mu) = \frac{e^{-\mu} \mu^x}{x!}, \quad x = 0, 1, 2, \ldots$$

**Mean:**

$$E[X] = \mu$$

**Variance:**

$$\text{Var}(X) = \mu$$

A distinctive (and useful) feature: the mean and variance are equal. This gives you a quick diagnostic - if your observed variance is much larger than the mean, a Poisson model probably doesn't fit (overdispersion).

**Standard Deviation:**

$$\sigma = \sqrt{\mu}$$

**Moment Generating Function:**

$$M(t) = e^{\mu(e^t - 1)}$$

**Poisson approximation to the binomial:**

When $n$ is large and $p$ is small, $B(n, p) \approx \text{Pois}(np)$. A common rule of thumb is $n \geq 20$ and $p \leq 0.05$.

## Example

Aircraft arrive at an airport at an average rate of 2 per hour ($\lambda = 2$). What is the probability that exactly 5 arrive in a 2-hour window?

Here $\mu = \lambda t = 2 \cdot 2 = 4$.

$$P(X = 5) = \frac{e^{-4} \cdot 4^5}{5!} = \frac{0.0183 \cdot 1024}{120} \approx 0.1563$$

There is roughly a 15.6% chance of exactly 5 arrivals in the 2-hour period.

We can also find the probability of *no* arrivals in a 30-minute window ($\mu = 2 \cdot 0.5 = 1$):

$$P(X = 0) = \frac{e^{-1} \cdot 1^0}{0!} = e^{-1} \approx 0.3679$$

So there is about a 37% chance of a quiet half-hour with no aircraft arrivals.

**As a binomial approximation:** if 1000 components each fail independently with probability $p = 0.003$, the expected number of failures is $\mu = np = 3$. Rather than computing $\binom{1000}{x}(0.003)^x(0.997)^{1000-x}$, we use $P(X = x) \approx e^{-3} \cdot 3^x / x!$.

## Why It Matters in CS

The entire field of queueing theory starts with "assume arrivals are Poisson." The M/M/1 queue, the M/M/c queue, basically every tractable queueing model uses this as the arrival process because it makes the math work out to closed-form solutions for wait times and queue lengths. When you size a buffer on a router or set autoscaling thresholds on a web server, there's a good chance a Poisson assumption is somewhere in the analysis.

> [!warning]
> Real network traffic is often *bursty*, which violates the independence assumption and produces overdispersion (variance >> mean). The Poisson is a starting point, not gospel. If your observed variance is three times your mean, you need a different model.

The mean-equals-variance property also makes Poisson a natural baseline for anomaly detection. If your error logs normally see $\mu = 5$ errors per minute, observing 15 in a single minute is a clear signal - you can compute exactly how unlikely that is without fitting anything more complicated.

## Related Notes

- [[exponential-distribution|Exponential Distribution]] - models the continuous time *between* Poisson events
- [[binomial-distribution|Binomial Distribution]] - the Poisson approximates the binomial for large $n$ and small $p$
- [[probability-distributions|Probability Distributions]] - broader taxonomy of discrete and continuous distributions
