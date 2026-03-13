---
title: Exponential Distribution
description: Modelling the continuous waiting time between independent events in a Poisson process.
draft: false
comments: false
tags: [cs, statistics]
date: 2026-03-12
aliases: []
---

## Intuition

If events arrive according to a Poisson process (independently, at a constant average rate), the **exponential distribution** describes how long you wait between consecutive events. It is the continuous counterpart of the geometric distribution and shares its memoryless property: the probability of waiting at least $t$ more units is the same regardless of how long you have already waited.

## Definition

A random variable $X$ follows an exponential distribution $X \sim \text{Exp}(\beta)$ if it represents the time (or distance) between successive events in a Poisson process with mean inter-arrival time $\beta = 1/\lambda$.

$X$ takes non-negative real values $x \geq 0$.

> **Parameterization note:** some texts use the rate $\lambda = 1/\beta$ directly, writing $f(x) = \lambda e^{-\lambda x}$. The formulas below use $\beta$ (mean lifetime) as the parameter.

## Key Formulas

**Probability Density Function (PDF):**

$$f(x; \beta) = \frac{1}{\beta} e^{-x/\beta}, \quad x \geq 0$$

**Cumulative Distribution Function (CDF):**

$$F(x) = 1 - e^{-x/\beta}$$

**Mean:**

$$\mu = \beta$$

**Variance:**

$$\sigma^2 = \beta^2$$

**Memoryless Property:**

$$P(X > s + t \mid X > s) = P(X > t)$$

This is the only continuous distribution with this property. It means past survival gives no information about remaining lifetime.

**Relationship to Poisson:**

If events arrive at rate $\lambda$, then inter-arrival times are $\text{Exp}(1/\lambda)$ and the count in time $t$ is $\text{Pois}(\lambda t)$.

## Example

An electronic component has an average life of $\beta = 5$ years (exponentially distributed). What is the probability it lasts more than 8 years?

$$P(X > 8) = 1 - F(8) = e^{-8/5} = e^{-1.6} \approx 0.2019$$

There is roughly a 20% chance the component survives past 8 years. Notice that, by the memoryless property, a component that has already lasted 3 years still has the same 20% chance of lasting 8 more years beyond that point:

$$P(X > 11 \mid X > 3) = P(X > 8) \approx 0.2019$$

We can also compute the median lifetime. Setting $F(m) = 0.5$:

$$1 - e^{-m/\beta} = 0.5 \implies m = \beta \ln 2 = 5 \ln 2 \approx 3.47 \text{ years}$$

The median is always less than the mean for an exponential distribution, reflecting its right skew.

**Hazard rate:** the exponential has a constant hazard (failure) rate $h(x) = 1/\beta = \lambda$. This means a 5-year-old component is no more likely to fail in the next instant than a brand-new one — a strong assumption that limits the model to components without wear-out.

## Why It Matters in CS

- **Reliability engineering**: Mean Time Between Failures (MTBF) for hardware components is modelled exponentially, enabling maintenance scheduling and redundancy planning.
- **Operating systems**: process service times in scheduling analysis often assume exponential distributions, yielding tractable queueing models (M/M/1).
- **Web server performance**: response-time modelling uses exponential assumptions for service duration, driving capacity planning and load balancer configuration.
- **Simulation**: generating exponential random variates via the inverse-transform method ($X = -\beta \ln U$, where $U \sim \text{Uniform}(0,1)$) is a building block of discrete-event simulation.

## Related Notes

- [[poisson-distribution|Poisson Distribution]] — counts events in an interval; the exponential models time between those events
- [[normal-distribution|Normal Distribution]] — another foundational continuous distribution, used when many independent factors combine additively
- [[probability-distributions|Probability Distributions]] — overview of the broader distribution taxonomy
