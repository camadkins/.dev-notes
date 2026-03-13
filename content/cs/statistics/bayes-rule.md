---
title: Bayes' Rule
description: The formula for reversing conditional probability - computing the probability of a cause given an observed effect.
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

You observe an effect and want to know which cause produced it. The trouble is that you know the probability in the **forward** direction - how likely each cause is to produce the effect - but you need the **reverse**: how likely each cause is, given that the effect occurred.

Bayes' rule is the bridge. It takes a forward conditional probability $P(A \mid B)$, combines it with how common each cause is on its own (the prior), and flips the direction to give $P(B \mid A)$. The more strongly a cause predicts the observed evidence, and the more common that cause is a priori, the more posterior probability it receives.

## Definition

Given a partition $\{B_1, B_2, \ldots, B_k\}$ of the sample space and an observed event $A$ with $P(A) > 0$, Bayes' rule states:

$$P(B_r \mid A) = \frac{P(B_r)\, P(A \mid B_r)}{\sum_{i=1}^{k} P(B_i)\, P(A \mid B_i)}$$

The denominator is the **law of total probability** - it ensures the posterior sums to 1 across all $B_i$.

> [!tip]
> The denominator is often the hardest part to compute. In practice, you can evaluate the numerator for each $B_i$ and then normalize. This is exactly what many inference algorithms do.

### Posterior form (continuous parameter)

When the "cause" is a continuous parameter $\theta$ with prior density $\pi(\theta)$ and the data $x$ have likelihood $f(x \mid \theta)$:

$$\pi(\theta \mid x) = \frac{f(x \mid \theta)\, \pi(\theta)}{g(x)}, \qquad g(x) = \int f(x \mid \theta)\, \pi(\theta)\, d\theta$$

This is the starting point of [[bayesian-inference|Bayesian Inference]], which builds a full framework around this formula - prior selection, conjugacy, sequential updating, and computational methods like MCMC.

## Key Formulas

### Two-event form

For two events $A$ and $B$:

$$P(B \mid A) = \frac{P(A \mid B)\, P(B)}{P(A)}$$

### Odds form

Bayes' rule is sometimes cleaner as an **odds ratio**. The posterior odds of $B_1$ vs. $B_2$ given $A$:

$$\frac{P(B_1 \mid A)}{P(B_2 \mid A)} = \frac{P(B_1)}{P(B_2)} \times \frac{P(A \mid B_1)}{P(A \mid B_2)}$$

$$\text{posterior odds} = \text{prior odds} \times \text{likelihood ratio}$$

The likelihood ratio (also called the **Bayes factor**) measures how much the evidence $A$ favors $B_1$ over $B_2$.

## Example

**Defective product on an assembly line.** A factory has three machines producing bolts:

| Machine | Share of production | Defect rate |
|---|---|---|
| $M_1$ | 30% | 3% |
| $M_2$ | 45% | 2% |
| $M_3$ | 25% | 4% |

A bolt is randomly selected and found to be defective ($D$). Which machine most likely produced it?

First, compute $P(D)$ via total probability:

$$P(D) = 0.30(0.03) + 0.45(0.02) + 0.25(0.04) = 0.009 + 0.009 + 0.010 = 0.028$$

Now apply Bayes' rule for each machine:

$$P(M_1 \mid D) = \frac{0.30 \times 0.03}{0.028} = \frac{0.009}{0.028} \approx 0.321$$

$$P(M_2 \mid D) = \frac{0.45 \times 0.02}{0.028} = \frac{0.009}{0.028} \approx 0.321$$

$$P(M_3 \mid D) = \frac{0.25 \times 0.04}{0.028} = \frac{0.010}{0.028} \approx 0.357$$

Machine $M_3$ is the most likely source despite producing only 25% of bolts, because its defect rate is the highest. Bayes' rule balances volume against defect propensity.

## Why It Matters in CS

- **Naive Bayes classifiers.** Classify a document by computing $P(\text{class} \mid \text{words})$ using Bayes' rule with a conditional independence assumption. Fast, interpretable, and surprisingly effective for text classification and spam filtering.
- **Spam filtering.** The original Bayesian spam filter computes $P(\text{spam} \mid \text{word appears})$ for each word, then combines evidence across the message.
- **Recommendation systems.** Collaborative filtering can be framed as estimating $P(\text{user likes item} \mid \text{observed ratings})$ via Bayesian models.
- **Cybersecurity and risk analysis.** Estimating $P(\text{intrusion} \mid \text{alert pattern})$ by combining base rates of attacks with the likelihood each attack type triggers the observed signature.

## Related Notes

- [[conditional-probability|Conditional Probability]] - the foundation Bayes' rule rearranges
- [[bayesian-inference|Bayesian Inference]] - the full inference framework built around this rule
- [[probability-distributions|Probability Distributions]] - priors and likelihoods are distributions
