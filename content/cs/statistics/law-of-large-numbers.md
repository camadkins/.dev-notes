---
title: Law of Large Numbers
description: "Weak versus strong convergence of the sample mean, the cases where averages fail to converge, and how the LLN differs from the central limit theorem."
draft: false
comments: true
tags:
  - cs
  - statistics
  - probability
date: 2026-02-09
updated:
aliases:
  - LLN
  - Weak Law of Large Numbers
  - Strong Law of Large Numbers
---

Roll one six-sided die and the outcome tells you almost nothing. Roll it ten thousand times and the running average settles near 3.5, which is the [[cs/statistics/expected-value|expected value]] $(1+2+\cdots+6)/6$. The law of large numbers is the theorem that licenses this, and it is what makes every simulation, [[cs/software-engineering/feature-flags-and-trunk-based-development|every A/B test]], and every [[cs/military-computing/monte-carlo-method-and-the-bomb|Monte Carlo estimator]] work.

> [!note] The idea
> The law of large numbers is a statement about *where* the sample mean goes, and it comes in two strengths that differ only in the mode of convergence. The weak law says that for a fixed large $n$, the average is probably close to $\mu$; the strong law says the sequence of averages converges to $\mu$ with probability 1. The gap between those is real: the weak law leaves open that $|\bar{X}_n - \mu| > \varepsilon$ happens infinitely often at infrequent intervals, and there are distributions where exactly that occurs.

## Setup

Take $X_1, X_2, \dots$ an infinite sequence of i.i.d. Lebesgue integrable [[cs/statistics/random-variable|random variables]] with $\operatorname{E}(X_i) = \mu$. Both laws concern the sample average

$$\bar{X}_n = \frac{1}{n}(X_1 + \cdots + X_n).$$

Introductory texts usually add finite variance $\sigma^2$ and no correlation, which gives $\operatorname{Var}(\bar{X}_n) = \sigma^2/n$ and shortens the proof considerably. That assumption is not necessary. Large or infinite variance slows convergence, but the law still holds. Mutual independence can also be weakened to pairwise independence or to exchangeability in both versions.

## Weak law

The weak law (Khinchin's law) says the sample mean converges *in probability* to $\mu$: for any positive $\varepsilon$,

$$\lim_{n\to\infty}\Pr\left(|\bar{X}_n - \mu| < \varepsilon\right) = 1.$$

Read it as a promise about margins. Name any nonzero margin, however small, and a sufficiently large sample makes it very likely the observed average sits inside that margin. Chebyshev proved a version as early as 1867 for series with bounded but non-identical variances, and his proof works so long as the variance of the average of the first $n$ values goes to zero. Khinchin showed in 1929 that for i.i.d. variables it suffices that the expected value exists.

## Strong law

The strong law (Kolmogorov's law) says the sample average converges *almost surely*:

$$\Pr\left(\lim_{n\to\infty}\bar{X}_n = \mu\right) = 1.$$

The probability that the whole sequence of averages converges to $\mu$ equals one. Kolmogorov proved this for i.i.d. variables with an expected value in 1930, and showed in 1933 that for the average to converge almost surely on anything, the variables must have an expected value. The modern proof is more complex than the weak law's and relies on passing to an appropriate subsequence. Viewed from higher ground, the strong law is a special case of the pointwise ergodic theorem, which is what justifies reading the expected value as a long-term average at all.

## Why "weak" and "strong"

Almost-sure convergence implies convergence in probability, so the strong law implies the weak law. The names encode that implication rather than any difference in the conclusion's target.

The direction that matters is the converse failing. The weak law holds under conditions where the strong law does not. One constructed case: let $X_k$ be $\pm\sqrt{k/\log\log\log k}$ with probability $1/2$ each, so $\operatorname{Var}(X_k) = k/\log\log\log k$. Kolmogorov's criterion fails because the relevant partial sum is asymptotic to $\log n / \log\log\log n$, which is unbounded. The distribution of the average narrows toward zero width (standard deviation asymptotic to $1/\sqrt{2\log\log\log n}$), but for a given $\varepsilon$ the probability that the average returns above $\varepsilon$ after the $n$th trial does not go to zero. Other examples come from random variables whose expected value exists only as a conditionally convergent integral or series, such as $\sin(X)e^X/X$ for $X$ exponential with parameter 1, where the Dirichlet-integral reading gives $\pi/2$.

## When it fails outright

The average may fail to converge at all. Averages of $n$ draws from the [[cs/statistics/probability-distributions|Cauchy distribution]] or from a Pareto distribution with $\alpha < 1$ do not converge as $n$ grows, and the reason is heavy tails. The two cases fail differently: the Cauchy distribution has no expectation, while the Pareto ($\alpha < 1$) expectation is infinite.

The Cauchy case is easy to generate. Let each random number be the tangent of an angle uniform on $[-90°, +90°]$. The median is zero, the expected value does not exist, and the average of $n$ such variables has the *same distribution as one* of them, so it never concentrates anywhere.

> [!warning]
> The law says nothing about small samples and offers no self-correction mechanism. There is no principle that a few observations will match the expected value, and no principle that a streak of one value gets balanced by the others. That belief is the [[cs/statistics/conditional-probability|gambler's fallacy]]. Selection bias is also immune: if the trials embed a selection bias, increasing the number of trials leaves the bias exactly where it was.

Even in the well-behaved fair-coin case, the convergence is subtler than it sounds. The *proportion* of heads converges to 1/2 almost surely, while the *absolute difference* between head and tail counts almost surely grows large. The expected difference grows, just more slowly than the number of flips, so the ratio of that difference to $n$ still goes to zero.

## Against the central limit theorem

The two theorems answer different questions about the same quantity. The law of large numbers says $\bar{X}_n \to \mu$; it names the limit. The [[cs/statistics/central-limit-theorem|central limit theorem]] says the distribution of a *normalized* version of the sample mean converges to a standard normal, so that the limiting distribution of $(\bar{X}_n - \mu)\sqrt{n}$ is normal with mean 0 and variance $\sigma^2$. It names the shape of the fluctuation around that limit, and it requires finite positive variance, which the law of large numbers does not.

One is a statement of consistency, the other a statement of the error's scale and shape. You need the first to know that estimating works and the second to attach a [[cs/statistics/confidence-intervals|confidence interval]] to the estimate.

> [!example]
> Monte Carlo integration is the law of large numbers used directly as an algorithm. To integrate $f$ on $[a, b]$: draw $U_1, \dots, U_n$ i.i.d. uniform on $[0,1]$, set $X_i = a + (b-a)U_i$, and compute $(b-a)\frac{f(X_1) + \cdots + f(X_n)}{n}$. By the strong law this converges to $(b-a)\operatorname{E}(f(X_1)) = \int_a^b f(x)\,dx$. For $f(x) = \cos^2(x)\sqrt{x^3+1}$ on $[-1, 2]$, which is hard by traditional methods, the algorithm gives $\int_{-1}^{2} f(x)\,dx = 0.905$ at $n = 25$.

## History

Gerolamo Cardano (1501 to 1576) stated without proof that the accuracy of empirical statistics improves with the number of trials. Jacob Bernoulli proved a special form for a binary random variable, taking over 20 years to reach a sufficiently rigorous proof, published in *Ars Conjectandi* in 1713. He called it his "golden theorem"; it became known as Bernoulli's theorem. Poisson named it *la loi des grands nombres* in 1837, and the French name stuck. Chebyshev, Markov, Borel, Cantelli, Kolmogorov, and Khinchin refined it afterward, and their work produced the weak/strong split.

## Related Notes

- [[cs/statistics/expected-value|Expected Value]] - the quantity the sample mean converges to
- [[cs/statistics/central-limit-theorem|Central Limit Theorem]] - describes the fluctuation around that limit rather than the limit itself
- [[cs/statistics/random-variable|Random Variable]] - the i.i.d. sequence the law is stated over
- [[cs/statistics/sampling-and-sampling-distributions|Sampling and Sampling Distributions]] - the sampling distribution of $\bar{X}_n$ is what collapses to a point
- [[cs/statistics/variance-and-covariance|Variance and Covariance]] - $\operatorname{Var}(\bar{X}_n) = \sigma^2/n$ is the shortcut proof
- [[cs/statistics/bootstrap-and-resampling|Bootstrap and Resampling]] - resampling estimators rely on the same convergence

## Sources

- [Law of large numbers (Wikipedia)](https://en.wikipedia.org/wiki/Law_of_large_numbers) - weak and strong statements and their modes of convergence, the Chebyshev/Khinchin/Kolmogorov results and dates, the counterexample where only the weak law holds, the Cauchy and Pareto failure cases, the coin-flip absolute-difference subtlety, the Monte Carlo algorithm and worked integral, and the Cardano-to-Poisson history.
- [Central limit theorem (Wikipedia)](https://en.wikipedia.org/wiki/Central_limit_theorem) - the CLT statement about the normalized sample mean and its finite-positive-variance requirement, used for the contrast.
