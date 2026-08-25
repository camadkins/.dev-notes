---
title: Bootstrap and Resampling
description: "Efron's bootstrap, resampling with replacement to approximate a sampling distribution, and permutation tests as an exact distribution-free alternative."
draft: false
comments: true
tags:
  - cs
  - statistics
date: 2026-07-08
updated:
aliases: []
---

Classical inference gets a standard error by writing down a formula. That works for a mean and gets ugly fast for a median, a correlation coefficient, or a ratio of variances. Resampling replaces the formula with computation: perturb the data you already have, recompute the statistic, and read the spread off the resulting histogram.

> [!note] The idea
> Bootstrapping models the unknowable inference of population from sample by the knowable inference of sample from resample. The true error of a statistic against its population value is unknown because the population is unknown. In a bootstrap resample the "population" is the observed sample, which *is* known, so the quality of inference from resample to sample is measurable. If the empirical distribution $\hat{J}$ is a reasonable approximation to the true $J$, the measured quality transfers.

## The procedure

Bootstrapping estimates properties of an estimand by measuring them under sampling from an approximating distribution, and the standard choice is the empirical distribution function of the observed data. For i.i.d. observations, that means constructing resamples with replacement, each of equal size to the observed data set.

Take heights of $N$ people as a [[cs/statistics/sampling-and-sampling-distributions|sample]] from the world population. One sample gives one estimate of the mean and no sense of its variability. Draw a new sample of size $N$ from the observed data *with replacement* (resampling five times from [1,2,3,4,5] might give [2,5,4,4,1]), so for large $N$ there is virtually zero probability the resample equals the original. Compute the mean. Repeat, typically 1,000 or 10,000 times. The histogram of bootstrap means estimates the shape of the sampling distribution of the mean, and the method applies to almost any statistic or estimator.

The exhaustive version [[cs/math/combinatorics|enumerates every possible resample]] instead of sampling them, which is only tractable for tiny data. There are $\binom{2n-1}{n}$ distinct resamples, giving 126 for $n = 5$, 92,378 for $n = 10$, and about $5.91 \times 10^{16}$ for $n = 30$.

> [!example]
> Ten coin flips, $x_i = 1$ for heads. The classical route assumes the average is normally distributed and uses a [[cs/statistics/t-distribution-and-t-tests|$t$-statistic]]. That justification is shaky in one direction and fine in another: individual flips are Bernoulli, not normal, so the per-flip reading is a poor approximation, while the average-of-many reading is valid in infinitely large samples by the [[cs/statistics/central-limit-theorem|central limit theorem]]. If you would rather not lean on either, resample. One bootstrap resample might be $x_2, x_1, x_{10}, x_{10}, x_3, x_4, x_6, x_7, x_1, x_9$ (duplicates appear because sampling is with replacement, and the resample has the same number of points as the original). Its mean is $\mu_1^*$. Repeat 100 times for $\mu_1^*, \dots, \mu_{100}^*$, the empirical bootstrap distribution of the sample mean, from which a bootstrap confidence interval follows.

The key result in Efron's founding paper is that sampling *with* replacement performs favorably compared to prior methods like the jackknife, which samples without replacement. Variants since then include schemes that sample without replacement and ones that build resamples larger or smaller than the original data.

## Why bother

The bootstrap's advantage is simplicity: a direct route to standard errors and [[cs/statistics/confidence-intervals|confidence intervals]] for complex estimators like percentile points, odds ratios, and correlation coefficients, where no analytical form or applicable central limit theorem exists. It handles complex sampling designs, including stratified ones. It checks the stability of results. Although the true interval is usually unknowable, the bootstrap is asymptotically more accurate than standard intervals built from the sample variance plus normality assumptions. And it avoids the cost of repeating an experiment to get more sample data.

Adèr et al. recommend it in three situations: when the theoretical distribution of the statistic is complicated or unknown, when the sample size is insufficient for straightforward inference, and when power calculations must be run off a small pilot sample.

On the number of resamples, more computing power has pushed recommendations upward, but the returns are limited. Increasing the resample count cannot add information to the original data; it only reduces random sampling error arising from the bootstrap procedure itself. There is evidence that counts above 100 produce negligible improvement in standard error estimation, and Efron has indicated that even 50 is likely to give fairly good standard errors.

> [!warning]
> Naive bootstrapping does not always yield asymptotically valid results and can lead to inconsistency. It is asymptotically consistent under some conditions but gives no general finite-sample guarantees, and the result may depend on the representativeness of the sample. The apparent simplicity conceals assumptions (independence, adequate sample size) that other approaches would state formally. Athreya showed that a naive bootstrap of the sample mean from a population lacking finite variance, such as a power law distribution, produces a bootstrap distribution that does not converge to the same limit as the sample mean, so Monte Carlo confidence intervals from it can mislead. His conclusion: "Unless one is reasonably sure that the underlying distribution is not heavy tailed, one should hesitate to use the naive bootstrap."

## Schemes

For univariate problems, resampling individual observations with replacement (case resampling) is usually acceptable. Subsampling, which resamples without replacement, is valid under much weaker conditions. Small samples may favor a parametric bootstrap; other problems favor a smooth bootstrap.

[[cs/statistics/regression-fundamentals|Regression]] is the case where naive case resampling is most suspect. Explanatory variables are often fixed or at least observed with more control than the response, and their range defines the information they carry. Resampling cases therefore loses some of that information in each bootstrap sample, which is why residual resampling and the other regression-specific alternatives exist.

There is also a Bayesian reading. Reweighting the initial data with weights $w_i^J = x_i^J - x_{i-1}^J$, where $\mathbf{x}^J$ is a sorted list of $N-1$ uniform random numbers on $[0,1]$ bracketed by 0 and 1, makes the induced parameter distributions interpretable as [[cs/statistics/bayesian-inference|posterior distributions]].

## Permutation tests

A permutation test (also re-randomization test or shuffle test) is an *exact* [[cs/statistics/hypothesis-testing|hypothesis test]] on two or more samples, with null $H_0\colon F = G$ that all samples come from the same distribution. The null distribution of the test statistic is obtained by computing its value under possible rearrangements of the observed data, which makes it a form of resampling.

The mechanics for two groups: compute the observed difference in sample means $T_\text{obs}$; pool the observations; recompute the difference for every way of dividing the pooled values into groups of size $n_A$ and $n_B$. That set of differences is the exact distribution under the null that group labels are exchangeable. The one-sided p-value is the proportion of sampled permutations with a difference greater than $T_\text{obs}$; the two-sided version uses absolute differences against $|T_\text{obs}|$. Many implementations count the observed data as one of the permutations so the p-value can never be zero.

The design principle is that the way treatments were allocated to subjects is mirrored in the analysis. If labels are exchangeable under the null, the test yields exact significance levels, and confidence intervals can be derived from the tests. The theory evolved from the work of Ronald Fisher and E. J. G. Pitman in the 1930s.

When complete enumeration is impractical, generate the reference distribution by [[cs/military-computing/monte-carlo-method-and-the-bomb|Monte Carlo sampling]] of a small random subset of the possible replicates, giving an asymptotically equivalent approximate (or Monte Carlo, or random) permutation test. The realization that this applies to any permutation test on any dataset was an important breakthrough in applied statistics; the earliest known references are Eden and Yates (1933) and Dwass (1957).

### Bootstrap tests versus permutation tests

Phillip Good's formulation of the difference: "Permutations test hypotheses concerning distributions; bootstraps test hypotheses concerning parameters. As a result, the bootstrap entails less-stringent assumptions."

Bootstrap tests are not exact. Permutation tests are, but only because of the exchangeability assumption, and that assumption bites. A permutation test of location, like a permutation $t$-test, requires equal variance under the normality assumption, so it shares the classic $t$-test's Behrens-Fisher weakness. The fixes mirror the parametric ones: use the Welch statistic with Satterthwaite adjustment, or switch to a bootstrap-based test. A permutation test on a properly studentized statistic can be asymptotically exact even when exchangeability fails.

## History

The bootstrap was first described by Bradley Efron in "Bootstrap methods: another look at the jackknife" (1979), inspired by earlier work on the jackknife. Among the names his colleagues suggested instead: *Swiss Army Knife*, *Meat Axe*, *Swan-Dive*, *Jack-Rabbit*, and *Shotgun*.

## Related Notes

- [[cs/statistics/sampling-and-sampling-distributions|Sampling and Sampling Distributions]] - the object the bootstrap approximates
- [[cs/statistics/confidence-intervals|Confidence Intervals]] - bootstrapping is one of the two main construction routes
- [[cs/statistics/hypothesis-testing|Hypothesis Testing]] - permutation tests as an exact alternative to parametric tests
- [[cs/statistics/t-distribution-and-t-tests|t-Distribution and t-Tests]] - the parametric method resampling replaces, and the shared Behrens-Fisher problem
- [[cs/statistics/central-limit-theorem|Central Limit Theorem]] - the asymptotic justification you avoid needing
- [[cs/statistics/law-of-large-numbers|Law of Large Numbers]] - Monte Carlo resampling converges by the same argument
- [[cs/statistics/bayesian-inference|Bayesian Inference]] - the Bayesian bootstrap reweighting reading

## Sources

- [Bootstrapping (statistics) (Wikipedia)](https://en.wikipedia.org/wiki/Bootstrapping_%28statistics%29) - the resample-to-sample analogy, the with-replacement procedure and 1,000 to 10,000 repetition scale, the exhaustive resample counts, the coin-flip worked example, the advantages and disadvantages including Athreya's heavy-tail warning, the resample-count recommendations, the regression and Bayesian schemes, and Efron 1979 with the rejected names.
- [Permutation test (Wikipedia)](https://en.wikipedia.org/wiki/Permutation_test) - the exact-test definition and exchangeability requirement, the pooling and relabeling mechanics with one- and two-sided p-values, the Fisher and Pitman lineage, Monte Carlo permutation testing with the Eden/Yates and Dwass references, and Good's distinction between permutation and bootstrap tests.
