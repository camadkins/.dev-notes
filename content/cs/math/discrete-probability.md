---
title: Discrete Probability
description: Sample spaces, conditional probability, Bayes' theorem, and expected value for algorithm analysis and randomized methods.
draft: false
comments: false
tags:
  - cs
  - math
date: 2026-03-12
aliases: []
---

## Intuition

Probability quantifies uncertainty. In CS, we use it constantly: analyzing average-case performance, designing randomized algorithms, reasoning about hash collisions, training machine learning models, and modeling network reliability. Discrete probability — where outcomes are countable — covers the majority of what algorithm analysis requires.

Without probability, we could only talk about worst-case and best-case performance — extremes that often misrepresent typical behavior. Average-case analysis via expected value gives a far more realistic picture. Randomized algorithms (quicksort with random pivots, randomized primality testing, sketching algorithms) explicitly use probability to achieve better expected performance or simpler implementations than their deterministic counterparts.

## Core Idea

**Sample spaces and events.** A **sample space** $\Omega$ is the set of all possible outcomes of an experiment. An **event** $A \subseteq \Omega$ is a subset of outcomes. The probability function $P$ assigns a value $P(A) \in [0, 1]$ to each event, with $P(\Omega) = 1$.

**Basic rules:**

- **Complement**: $P(\bar{A}) = 1 - P(A)$
- **Union**: $P(A \cup B) = P(A) + P(B) - P(A \cap B)$
- **Independence**: $A$ and $B$ are independent if $P(A \cap B) = P(A) \cdot P(B)$

**Conditional probability.** The probability of $A$ given $B$ has occurred:

$$P(A \mid B) = \frac{P(A \cap B)}{P(B)}, \quad P(B) > 0$$

**Bayes' theorem.** Reverses the conditioning direction:

$$P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}$$

With a partition $\{A_1, \dots, A_n\}$ of $\Omega$, the denominator expands via the **law of total probability**:

$$P(B) = \sum_{i=1}^{n} P(B \mid A_i) \cdot P(A_i)$$

**Random variables and expected value.** A **random variable** $X: \Omega \to \mathbb{R}$ assigns a number to each outcome. The **expected value** (mean) of a discrete random variable:

$$E[X] = \sum_{x} x \cdot P(X = x)$$

Key properties:

- **Linearity of expectation**: $E[X + Y] = E[X] + E[Y]$, always — even when $X$ and $Y$ are dependent.
- **Variance**: $\text{Var}(X) = E[X^2] - (E[X])^2$, measures spread.

**Useful distributions in CS:**

- **Bernoulli**: single trial, success probability $p$. $E[X] = p$.
- **Binomial**: $n$ independent trials, each with success probability $p$. $E[X] = np$.
- **Geometric**: trials until first success. $E[X] = 1/p$.

**Concentration inequalities.** Beyond expected value, we often need to bound the probability that a random variable deviates far from its mean:

- **Markov's inequality**: for non-negative $X$, $P(X \geq a) \leq \frac{E[X]}{a}$.
- **Chebyshev's inequality**: $P(|X - E[X]| \geq k\sigma) \leq \frac{1}{k^2}$.
- **Chernoff bounds**: exponentially tight bounds for sums of independent random variables — the workhorse for analyzing randomized algorithms.

## Example

**Average-case analysis of linear search.** Searching for a key in an unsorted array of $n$ elements where each position is equally likely. The expected number of comparisons:

$$E[X] = \sum_{i=1}^{n} i \cdot \frac{1}{n} = \frac{1}{n} \cdot \frac{n(n+1)}{2} = \frac{n+1}{2}$$

So on average, linear search examines about half the array.

**Bayes in spam filtering.** Let $S$ = "email is spam" and $W$ = "email contains word 'free'." Given $P(W \mid S) = 0.8$, $P(W \mid \bar{S}) = 0.1$, and $P(S) = 0.3$:

$$P(S \mid W) = \frac{0.8 \cdot 0.3}{0.8 \cdot 0.3 + 0.1 \cdot 0.7} = \frac{0.24}{0.31} \approx 0.774$$

An email containing "free" has about a 77% chance of being spam under this model.

**Linearity of expectation (coupon collector).** To collect all $n$ distinct coupons when each draw is uniform random, the expected draws needed is $n \cdot H_n \approx n \ln n$, proved by decomposing into geometric waiting times and summing expectations — no independence needed thanks to linearity.

**Randomized quicksort.** Choosing a pivot uniformly at random makes quicksort's expected comparisons $2n \ln n \approx 1.39 n \log_2 n$ regardless of input order. The analysis uses linearity of expectation: define indicator variables $X_{ij} = 1$ if elements $i$ and $j$ are ever compared, compute $E[X_{ij}] = \frac{2}{j - i + 1}$, and sum over all pairs.

**Birthday paradox.** In a group of $n$ people, the probability that at least two share a birthday (out of 365 days) exceeds 50% when $n \geq 23$. This is relevant to hash collisions: with $m$ slots, expect a collision after roughly $O(\sqrt{m})$ insertions.

## Related Notes

- [[best-worst-average-cases|Best, Worst & Average Cases]] — probability underpins average-case complexity analysis
- [[combinatorics|Combinatorics]] — counting outcomes is the foundation of computing probabilities
- [[linear-algebra-fundamentals|Linear Algebra Fundamentals]] — Markov chains connect probability with matrix methods
- [[graph-theory|Graph Theory]] — random graphs and probabilistic methods in combinatorics
