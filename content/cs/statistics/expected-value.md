---
title: Expected Value
description: The probability-weighted average outcome of a random variable - the center of its distribution and the foundation of average-case analysis.
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

If you could repeat an experiment infinitely many times and average the results, you would get the **expected value**. It is the long-run average, the balance point of the distribution, the single number that summarizes where outcomes tend to land.

Expected value does not have to be a value the random variable can actually take. A fair die has $E[X] = 3.5$ - you will never roll a 3.5, but over thousands of rolls the average converges to it. This is the essence of the law of large numbers.

The power of expected value lies in its **linearity**: you can break complex quantities into simpler pieces, compute each expectation separately, and add them up - no independence required.

## Definition

The **expected value** (or **mean**) of a random variable $X$ is the probability-weighted sum (or integral) of its possible values:

- **Discrete:** $X$ takes values $x_1, x_2, \ldots$ with probability mass function $f(x)$:

$$\mu = E[X] = \sum_{x} x\, f(x)$$

- **Continuous:** $X$ has probability density function $f(x)$:

$$\mu = E[X] = \int_{-\infty}^{\infty} x\, f(x)\, dx$$

> [!note]
> The expected value may not exist if the sum or integral diverges (e.g., the Cauchy distribution has no mean).

## Key Formulas

### Expectation of a function

For any function $g(X)$:

$$E[g(X)] = \sum_{x} g(x)\, f(x) \qquad \text{(discrete)}$$

$$E[g(X)] = \int_{-\infty}^{\infty} g(x)\, f(x)\, dx \qquad \text{(continuous)}$$

This is used constantly - for instance, setting $g(X) = X^2$ gives $E[X^2]$, which appears in the [[variance-and-covariance|variance]] formula.

### Linearity of expectation

For any random variables $X$ and $Y$ and constants $a, b, c$:

$$E[aX + bY + c] = a\, E[X] + b\, E[Y] + c$$

This holds **regardless of whether $X$ and $Y$ are independent**. It is arguably the most useful property in all of probability.

### Expectation of a product (independent case)

If $X$ and $Y$ are independent:

$$E[XY] = E[X] \cdot E[Y]$$

This does **not** hold in general. When $X$ and $Y$ are dependent, the difference $E[XY] - E[X]E[Y]$ is exactly the [[variance-and-covariance|covariance]].

## Example

**Expected sales commission.** A salesperson is working three deals with the following payoffs and close probabilities:

| Deal | Commission | $P(\text{close})$ |
|---|---|---|
| A | \$5,000 | 0.40 |
| B | \$8,000 | 0.25 |
| C | \$2,000 | 0.60 |

The expected commission from each deal: $E_A = 5000 \times 0.40 = \$2{,}000$, $E_B = 8000 \times 0.25 = \$2{,}000$, $E_C = 2000 \times 0.60 = \$1{,}200$.

By linearity (even if the deals are correlated):

$$E[\text{total}] = 2000 + 2000 + 1200 = \$5{,}200$$

**Expected component lifespan.** A component's lifetime follows an exponential distribution with rate $\lambda = 0.002$ failures per hour. Its expected lifespan is:

$$E[T] = \frac{1}{\lambda} = \frac{1}{0.002} = 500 \text{ hours}$$

This directly informs maintenance scheduling and spare-parts inventory.

## Why It Matters in CS

- **Average-case algorithm analysis.** The expected number of comparisons in randomized Quicksort is $E[C] = 2n \ln n \approx 1.39\, n \log_2 n$, derived using linearity of expectation over indicator random variables. See [[best-worst-average-cases|Best, Worst, and Average Cases]].
- **Performance modeling.** Expected response time, expected throughput, and expected queue length (via Little's Law: $E[L] = \lambda\, E[W]$) are the bread and butter of systems performance engineering.
- **Network analysis.** Expected packet delay, expected number of retransmissions, and expected path latency guide protocol design and capacity planning.
- **Machine learning.** Loss functions are expectations: $E[\ell(h(X), Y)]$. Training minimizes empirical expected loss; generalization theory bounds the true expected loss.

## Related Notes

- [[variance-and-covariance|Variance and Covariance]] - measures how far outcomes spread around the expected value
- [[probability-distributions|Probability Distributions]] - each distribution has characteristic expected values
- [[best-worst-average-cases|Best, Worst, and Average Cases]] - expected value defines the average case
- [[quick-sort|Quick Sort]] - average-case $O(n \log n)$ derived via linearity of expectation
