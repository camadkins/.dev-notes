---
title: Discrete Probability
description: Sample spaces, conditional probability, Bayes' theorem, and expected value for algorithm analysis and randomized methods.
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-03-12
updated:
aliases: []
---

## Why Probability Matters for CS

Without probability, you can only talk about worst-case and best-case performance, and those extremes often misrepresent what actually happens. Average-case analysis gives a much more realistic picture. Beyond analysis, randomized algorithms (quicksort with random pivots, randomized primality testing, sketching algorithms) explicitly use probability to get better expected performance or simpler implementations than their deterministic counterparts. Discrete probability, where outcomes are countable, covers the vast majority of what algorithm analysis needs.

## Sample Spaces and Events

A **sample space** $\Omega$ is the set of all possible outcomes of an experiment. An **event** $A \subseteq \Omega$ is a subset of outcomes. The probability function $P$ assigns a value $P(A) \in [0, 1]$ to each event, with $P(\Omega) = 1$.

**Basic rules:**

- **Complement**: $P(\bar{A}) = 1 - P(A)$
- **Union**: $P(A \cup B) = P(A) + P(B) - P(A \cap B)$
- **Independence**: $A$ and $B$ are independent if $P(A \cap B) = P(A) \cdot P(B)$

> [!warning]
> Independence and mutual exclusivity are not the same thing. Mutually exclusive events (if one happens, the other can't) are actually *dependent* unless one of them has probability 0. This trips people up more often than it should.

## Conditional Probability

The probability of $A$ given $B$ has occurred:

$$P(A \mid B) = \frac{P(A \cap B)}{P(B)}, \quad P(B) > 0$$

Conditioning is the mechanism that lets you update beliefs as you learn new information. It's the foundation of Bayesian reasoning and shows up everywhere from spam filters to medical diagnosis.

## Bayes' Theorem

This is the theorem that makes statistics and machine learning work. It reverses the conditioning direction:

$$P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}$$

With a partition $\{A_1, \dots, A_n\}$ of $\Omega$, the denominator expands via the **law of total probability**:

$$P(B) = \sum_{i=1}^{n} P(B \mid A_i) \cdot P(A_i)$$

> [!example]
> **Spam filtering.** Let $S$ = "email is spam" and $W$ = "email contains word 'free'." Given $P(W \mid S) = 0.8$, $P(W \mid \bar{S}) = 0.1$, and $P(S) = 0.3$:
> $$P(S \mid W) = \frac{0.8 \cdot 0.3}{0.8 \cdot 0.3 + 0.1 \cdot 0.7} = \frac{0.24}{0.31} \approx 0.774$$
> An email containing "free" has about a 77% chance of being spam. Naive Bayes classifiers extend this across many features and remain competitive for text classification despite their simplifying assumptions.

## Expected Value

A **random variable** $X: \Omega \to \mathbb{R}$ assigns a number to each outcome. The **expected value** (mean):

$$E[X] = \sum_{x} x \cdot P(X = x)$$

Two properties that get used constantly:

- **Linearity of expectation**: $E[X + Y] = E[X] + E[Y]$, always, even when $X$ and $Y$ are dependent. This is the single most useful fact in probabilistic algorithm analysis.
- **Variance**: $\text{Var}(X) = E[X^2] - (E[X])^2$, measures spread around the mean.

> [!tip]
> Linearity of expectation is shockingly powerful because it requires no independence assumption. You can decompose a complicated random variable into simple indicator variables, compute each expectation trivially, and sum them up. The randomized quicksort analysis and the coupon collector problem both work this way.

## Common Distributions

| Distribution | Setup | $E[X]$ |
|---|---|---|
| **Bernoulli** | Single trial, success probability $p$ | $p$ |
| **Binomial** | $n$ independent trials, each with probability $p$ | $np$ |
| **Geometric** | Trials until first success | $1/p$ |

## Concentration Inequalities

Expected value tells you the average, but you often need to know how tightly a random variable clusters around that average.

- **Markov's inequality**: for non-negative $X$, $P(X \geq a) \leq \frac{E[X]}{a}$. Crude but universally applicable.
- **Chebyshev's inequality**: $P(|X - E[X]| \geq k\sigma) \leq \frac{1}{k^2}$. Uses variance for a tighter bound.
- **Chernoff bounds**: exponentially tight bounds for sums of independent random variables. This is the workhorse for analyzing randomized algorithms and proving "with high probability" guarantees.

> [!note]
> The progression Markov -> Chebyshev -> Chernoff represents increasing tightness at the cost of stronger assumptions. Markov needs non-negativity. Chebyshev needs finite variance. Chernoff needs independence. Knowing when to reach for which one is a recurring theme in algorithm analysis.

## Classic Applications

**Average-case linear search.** Searching for a key in an unsorted array of $n$ elements where each position is equally likely:

$$E[X] = \sum_{i=1}^{n} i \cdot \frac{1}{n} = \frac{n+1}{2}$$

On average, you check about half the array. This is one of the simplest expected value calculations and a good one to internalize.

**Randomized quicksort.** Choosing a pivot uniformly at random gives expected comparisons $2n \ln n \approx 1.39 n \log_2 n$ regardless of input order. The analysis defines indicator variables $X_{ij} = 1$ if elements $i$ and $j$ are ever compared, computes $E[X_{ij}] = \frac{2}{j - i + 1}$, and sums over all pairs. Linearity of expectation does all the heavy lifting.

**Coupon collector.** To collect all $n$ distinct coupons when each draw is uniform random, the expected draws needed is $n \cdot H_n \approx n \ln n$. The trick is decomposing into geometric waiting times and summing expectations.

**Birthday paradox.** In a group of $n$ people, the probability that at least two share a birthday (out of 365 days) exceeds 50% when $n \geq 23$. The CS version: with $m$ hash slots, expect a collision after roughly $O(\sqrt{m})$ insertions. This is why hash tables need to be sized generously.

## Related Notes

- [[best-worst-average-cases|Best, Worst & Average Cases]] - probability underpins average-case complexity analysis
- [[combinatorics|Combinatorics]] - counting outcomes is the foundation of computing probabilities
- [[linear-algebra-fundamentals|Linear Algebra Fundamentals]] - Markov chains connect probability with matrix methods
- [[graph-theory|Graph Theory]] - random graphs and probabilistic methods in combinatorics
