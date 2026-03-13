---
title: Conditional Probability
description: Updating probability with new information by restricting the sample space - foundation for Bayesian reasoning, Markov chains, and probabilistic models.
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

Imagine you know something has happened - a piece of evidence, an observation, a constraint. Conditional probability answers: **how does this new information change the likelihood of other events?**

The idea is simple. When you learn that event $A$ occurred, you throw away every outcome where $A$ didn't happen. Your universe shrinks from the full sample space $S$ down to just $A$. Now you ask: of the outcomes that remain, what fraction also satisfy $B$? That fraction is the conditional probability $P(B \mid A)$.

This "reduced sample space" perspective is what makes conditional probability the gateway to all of Bayesian reasoning - every update, every inference, every learned model starts here.

## Definition

The **conditional probability** of $B$ given $A$ is defined as:

$$P(B \mid A) = \frac{P(A \cap B)}{P(A)}, \quad \text{provided } P(A) > 0$$

The requirement $P(A) > 0$ is essential - conditioning on an impossible event is undefined.

> [!note]
> $P(B \mid A)$ is itself a valid probability measure. It satisfies all three Kolmogorov axioms when $A$ is treated as the new sample space.

## Key Formulas

### Multiplicative (product) rule

Rearranging the definition gives the probability of a joint event:

$$P(A \cap B) = P(A)\, P(B \mid A)$$

This extends to chains of events:

$$P(A \cap B \cap C) = P(A)\, P(B \mid A)\, P(C \mid A \cap B)$$

### Independence test

Two events $A$ and $B$ are **independent** if and only if:

$$P(B \mid A) = P(B)$$

Equivalently, $P(A \cap B) = P(A)\, P(B)$. Knowing $A$ occurred tells you nothing new about $B$.

### Law of total probability

For a partition $\{B_1, B_2, \ldots, B_k\}$ of the sample space:

$$P(A) = \sum_{i=1}^{k} P(B_i)\, P(A \mid B_i)$$

This bridges conditional and unconditional probabilities and is the denominator in [[bayes-rule|Bayes' Rule]].

## Example

**Flight punctuality.** An airline reports: 85% of flights depart on time and 82% both depart and arrive on time. What is the probability a flight arrives on time, given that it departed on time?

Let $D$ = departs on time, $A$ = arrives on time.

$$P(A \mid D) = \frac{P(D \cap A)}{P(D)} = \frac{0.82}{0.85} \approx 0.965$$

So if a flight leaves on schedule, there is a 96.5% chance it also lands on schedule - departure punctuality is a strong signal of arrival punctuality.

Now suppose only 15% of flights depart late, and of those, 30% still arrive on time:

$$P(A \mid D^c) = 0.30$$

Using total probability: $P(A) = 0.85 \times 0.965 + 0.15 \times 0.30 = 0.865$. Late departures sharply reduce the chance of an on-time arrival.

## Why It Matters in CS

- **Natural language processing.** Language models estimate $P(w_n \mid w_1, \ldots, w_{n-1})$ - the probability of the next word conditioned on all preceding words. Every autocompletion and translation system is built on conditional probability.
- **Markov chains.** A Markov process defines transition probabilities $P(X_{t+1} \mid X_t)$, assuming conditional independence from earlier states. This powers PageRank, MCMC sampling, and reinforcement learning.
- **Bayesian networks.** Each node stores a conditional probability table $P(X \mid \text{parents}(X))$. The full joint distribution factors into a product of conditionals, making inference tractable.
- **Conditional independence.** Two features $X$ and $Y$ may be dependent overall but independent given a third variable $Z$. Recognizing this structure ($P(X,Y \mid Z) = P(X \mid Z)\,P(Y \mid Z)$) reduces model complexity dramatically.

## Related Notes

- [[bayes-rule|Bayes' Rule]] - reverses the conditioning direction using conditional probability
- [[probability-distributions|Probability Distributions]] - the distributions that conditional probabilities operate over
- [[bayesian-inference|Bayesian Inference]] - the full framework for updating beliefs with data
