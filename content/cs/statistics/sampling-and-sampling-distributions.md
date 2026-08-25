---
title: Sampling and Sampling Distributions
description: "The distribution of a statistic across all possible samples, standard error as its spread, and the design tradeoffs between simple random, stratified, and cluster sampling."
draft: false
comments: true
tags:
  - cs
  - statistics
date: 2026-05-27
updated:
aliases: []
---

Every statistic you compute is itself a [[cs/statistics/random-variable|random variable]]. Draw a different sample and you get a different sample mean. The whole apparatus of inference rests on characterizing *that* variation, not the variation of the individual observations, and the object holding it is the sampling distribution.

> [!note] The idea
> A sampling distribution is the distribution of a statistic, treated as a random variable, over all possible samples of size $n$ from the same population. It is the simplification that makes inference tractable: instead of reasoning about the joint distribution of all $n$ individual sample values, you reason about the one-dimensional distribution of the statistic. In practice you observe a single sample, and the sampling distribution is found theoretically or simulated, never enumerated.

## What it depends on

Four things determine a sampling distribution: the underlying population distribution, which statistic you chose, the sampling procedure, and the sample size. Change any one and the distribution changes.

Take a normal population $\mathcal{N}(\mu, \sigma^2)$ and repeatedly compute the sample mean. The sampling distribution of the mean is $\mathcal{N}(\mu, \sigma^2/n)$, exactly normal because the population is. Swap the mean for the sample median and you get a different sampling distribution from the same population, one that is generally not normal, though it may be close for large $n$.

| Population | Statistic | Sampling distribution |
|---|---|---|
| $\mathcal{N}(\mu, \sigma^2)$ | sample mean $\bar{X}$ | $\mathcal{N}(\mu, \sigma^2/n)$ |
| $\operatorname{Bernoulli}(p)$ | sample proportion $\bar{X}$ | $n\bar{X} \sim \operatorname{Binomial}(n, p)$ |
| two independent normals | $\bar{X}_1 - \bar{X}_2$ | $\mathcal{N}\!\left(\mu_1 - \mu_2,\ \frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}\right)$ |

Sampling distributions can be close to normal even when the population is not, which is the content of the [[cs/statistics/central-limit-theorem|central limit theorem]]. When $\sigma$ is unknown, $T = (\bar{X} - \mu)\sqrt{n}/S$ follows a [[cs/statistics/t-distribution-and-t-tests|Student's $t$ distribution]] with $\nu = n - 1$ degrees of freedom, and $T$ is a pivotal quantity whose distribution does not depend on $\sigma$.

The normal-mean case is about as simple as populations and statistics get. For other combinations the formulas are more complicated and often have no closed form at all. Then you approximate the sampling distribution by [[cs/military-computing/monte-carlo-method-and-the-bomb|Monte Carlo simulation]], [[cs/statistics/bootstrap-and-resampling|bootstrap]] methods, or asymptotic distribution theory.

## Standard error

The standard error of a statistic is the standard deviation of its sampling distribution. For the sample mean with uncorrelated samples,

$$\sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}},$$

where $\sigma$ is the population standard deviation. This is the number that goes into a [[cs/statistics/confidence-intervals|confidence interval]], and its practical meaning is a design constraint. Because of the $1/\sqrt{n}$ factor, halving the error requires quadrupling the sample, and reducing it tenfold requires a hundred times as many observations. That curve is what makes cost-benefit tradeoffs in study design nontrivial.

For the sample *total* rather than the mean, the standard error moves the other way: $\sigma_{\Sigma x} = \sigma\sqrt{n}$.

> [!warning]
> Standard error is not standard deviation. The standard deviation describes the spread of individual observations; the standard error describes the spread of the estimate. Reporting one where the reader expects the other overstates or understates precision by a factor of $\sqrt{n}$.

When the target is a finite population that will not change over time and the sampling fraction $f$ is large (roughly 5% or more), the standard error estimate must be multiplied by a finite population correction:

$$\operatorname{FPC} = \sqrt{\frac{N - n}{N - 1}}.$$

Sampling half a small population genuinely does pin the mean down better than the uncorrected formula admits.

## Probability sampling

A probability sample is one where every element has a *known* nonzero probability of being sampled and random selection enters at some point. Known, not equal. When every element does have the same probability, the design is called equal probability of selection (EPS), also described as self-weighting because every sampled unit carries the same weight.

The contrast is nonprobability sampling, where some elements have no chance of selection or the probabilities cannot be determined. Because selection is nonrandom, nonprobability sampling does not permit estimation of sampling errors at all. Worth remembering: nonresponse effects can turn *any* probability design into a nonprobability one if the nonresponse characteristics are not well understood, since nonresponse effectively modifies each element's selection probability.

### Simple random sampling

In a simple random sample (SRS) of a given size, all subsets of the sampling frame have equal probability of selection, so each element does too, and so does any given pair, triple, and so on. The frame is not subdivided. This minimizes bias and simplifies analysis; in particular the variance among results within the sample is a good indicator of population variance, which makes accuracy easy to estimate.

SRS is vulnerable to sampling error precisely because it uses no information about the population. A simple random sample of ten people from a country produces five men and five women *on average*, but any given draw is likely to overrepresent one sex. It also cannot deliver subsamples, so a question like "is cognitive ability an equally good predictor of job performance [[cs/ethics/social-categories-and-machine-learning|across racial groups]]" is not answerable from an SRS.

### Stratified sampling

Organize the frame into distinct strata by category, then sample each stratum as an independent sub-population. The ratio of the sample size to the population size is the sampling fraction.

Stratification pays off in four ways. It supports inference about specific subgroups that would be lost in a general random sample. It gives more efficient estimates when strata are chosen for relevance to the criterion rather than convenience, and provided each stratum is proportional to the group's population size, it is never *less* efficient than SRS. Data are sometimes more readily available per stratum than for the whole population. And since each stratum is an independent population, different sampling approaches can be applied to different strata.

The approach is most effective when three conditions hold: within-stratum variability is minimized, between-stratum variability is maximized, and the stratifying variables are strongly correlated with the dependent variable of interest.

The costs are real. Identifying strata raises the cost and complexity of both selection and estimation. With multiple criteria, a stratifying variable related to one may be unrelated to another. And with many strata or a minimum sample size per group, stratification can demand a larger sample than other methods.

*Poststratification* applies stratification after sampling, typically when no appropriate stratifying variable was known beforehand. It follows a simple random sample and can implement weighting to improve estimate precision, at the price of the usual post hoc hazards.

### Cluster sampling

Select respondents in groups. Survey 100 city blocks and interview every household in the selected blocks rather than scattering households across the city. Clustering cuts travel and administrative cost, and it removes the need for a sampling frame listing every element in the population: you need a block-level map of the city plus household-level maps of only the 100 selected blocks.

The tradeoff is variance. Cluster sampling generally increases the variability of estimates above SRS, depending on how much clusters differ from one another relative to within-cluster variation, so it requires a larger sample than SRS to reach the same accuracy. The cost savings can still make it the cheaper option overall.

*Multistage sampling* is the common implementation, embedding two or more levels of units: build clusters, randomly select primary units from each, then subsample within those, surveying only the ultimate units. It is random subsampling of preceding random samples, and it can eliminate the work of describing clusters that never get selected.

> [!example]
> A probability sample need not be an equal-probability sample. To estimate total adult income on a street, visit each household, enumerate the adults, and randomly select one per household. A person living alone is certain to be selected; a person in a two-adult household has a one-in-two chance. To reflect that, the income of the selected person from a two-adult household is counted twice toward the total. What makes it a probability sample is that each person's probability is *known*, not that the probabilities are equal.

## Where the error comes from

Total survey error splits into sampling and non-sampling error, and the term covers systematic bias as well as random variation. Sampling errors are induced by the sample design: selection bias, where the true selection probabilities differ from those assumed in the calculation, and random sampling error, the variation from selecting elements at random.

Non-sampling errors come from data collection, processing, or design, and they are the ones a bigger sample cannot fix: over-coverage (data from outside the population), under-coverage (the frame misses population elements), measurement error (respondents misunderstand a question), processing error (coding mistakes), and non-response bias.

## Related Notes

- [[cs/statistics/central-limit-theorem|Central Limit Theorem]] - why the sampling distribution of the mean is approximately normal regardless of the population
- [[cs/statistics/law-of-large-numbers|Law of Large Numbers]] - the sampling distribution of the mean concentrates on $\mu$ as $n$ grows
- [[cs/statistics/confidence-intervals|Confidence Intervals]] - built directly from the standard error
- [[cs/statistics/t-distribution-and-t-tests|t-Distribution and t-Tests]] - the sampling distribution of the mean when $\sigma$ must be estimated
- [[cs/statistics/bootstrap-and-resampling|Bootstrap and Resampling]] - approximates a sampling distribution when no closed form exists
- [[cs/statistics/variance-and-covariance|Variance and Covariance]] - the population $\sigma^2$ that drives the standard error
- [[cs/statistics/hypothesis-testing|Hypothesis Testing]] - test statistics are evaluated against their sampling distribution under $H_0$

## Sources

- [Sampling distribution (Wikipedia)](https://en.wikipedia.org/wiki/Sampling_distribution) - the definition, the four determining factors, the population/statistic table, the standard error formulas for the mean and the total, and the note that closed forms often do not exist.
- [Standard error (Wikipedia)](https://en.wikipedia.org/wiki/Standard_error) - the standard error as the standard deviation of the sampling distribution, the quadrupling-observations consequence of $1/\sqrt{n}$, and the finite population correction with its 5% sampling-fraction threshold.
- [Sampling (statistics) (Wikipedia)](https://en.wikipedia.org/wiki/Sampling_%28statistics%29) - probability versus nonprobability sampling, the street-income example, SRS properties and weaknesses, the stratified sampling benefits/drawbacks/conditions, cluster and multistage sampling, and the sampling versus non-sampling error taxonomy.
