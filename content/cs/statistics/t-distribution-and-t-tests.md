---
title: t-Distribution and t-Tests
description: "Student's t as the price of estimating sigma, why degrees of freedom control the tails, and the one-sample, two-sample, and paired forms of the test."
draft: false
comments: true
tags:
  - cs
  - statistics
date: 2026-06-14
updated:
aliases:
  - t-test
---

The [[cs/statistics/normal-distribution|normal]] machinery for testing a mean assumes you know $\sigma$. You almost never do. Substituting the sample standard deviation $s$ introduces a second source of randomness into the test statistic, and the resulting distribution is fatter in the tails than a normal. Student's $t$ is the exact accounting of that extra uncertainty.

> [!note] The idea
> The $t$ distribution generalizes the standard normal, is symmetric around zero and bell-shaped like it, but has heavier tails, and the tail mass is controlled entirely by the degrees-of-freedom parameter $\nu$. The two endpoints are instructive: at $\nu = 1$, $t_\nu$ is the standard Cauchy distribution with very fat tails and no mean; as $\nu \to \infty$ it becomes $\mathcal{N}(0,1)$ with very thin tails. Small samples do not merely give you a wider interval, they give you a qualitatively different distribution.

## Where the distribution comes from

The characterization is a ratio. $t_\nu$ is the distribution of

$$T = \frac{Z}{\sqrt{V/\nu}}$$

where $Z$ is standard normal, $V$ is chi-squared with $\nu$ degrees of freedom, and $Z$ and $V$ are independent. The numerator is the signal; the denominator is the randomness in the variance estimate. Its density is

$$f(t) = \frac{\Gamma\!\left(\frac{\nu+1}{2}\right)}{\sqrt{\pi\nu}\,\Gamma\!\left(\frac{\nu}{2}\right)}\left(1 + \frac{t^2}{\nu}\right)^{-(\nu+1)/2}.$$

The moments make the heavy tails concrete. For $\nu$ degrees of freedom, the expected value is 0 when $\nu > 1$, the [[cs/statistics/variance-and-covariance|variance]] is $\nu/(\nu-2)$ when $\nu > 2$, skewness is 0 when $\nu > 3$, and excess kurtosis is $6/(\nu - 4)$ when $\nu > 4$. Moments of order $\nu$ or higher do not exist at all. A $t$ with 3 degrees of freedom has no finite kurtosis; a $t$ with 1 has no mean.

Shifting the constant gives the *noncentral* $t$: the distribution of $(Z + \mu)\sqrt{\nu/V}$ has noncentrality parameter $\mu$, and that is the object used to study the power of a $t$-test.

## The test

A Student's $t$-test is any [[cs/statistics/hypothesis-testing|hypothesis test]] whose test statistic follows a $t$ distribution under the null. It applies where the statistic would be normal if a scaling term were known, and that scaling term is typically an unknown nuisance parameter estimated from the data. A $Z$-test often yields very similar results, because the $t$-test converges to the $Z$-test as the dataset grows.

### One-sample

Testing $H_0\colon \mu = \mu_0$:

$$t = \frac{\bar{x} - \mu_0}{s/\sqrt{n}}, \qquad \text{df} = n - 1.$$

The parent population does not have to be normal, but the distribution of sample means is assumed to be. If the observations are independent and the second moment exists, the [[cs/statistics/central-limit-theorem|central limit theorem]] makes $t$ approximately $\mathcal{N}(0,1)$, though only approximately, since the CLT would apply exactly if $s$ were the true standard deviation rather than an estimate. That gap is why $t$ follows Student's $t$ asymptotically rather than the normal outright.

### Two-sample, independent

Strictly, the name Student's $t$-test belongs to the version that also assumes equal population variances. With that assumption:

$$t = \frac{\bar{X}_1 - \bar{X}_2}{s_p\sqrt{\frac{1}{n_1} + \frac{1}{n_2}}}, \qquad s_p = \sqrt{\frac{(n_1-1)s_{X_1}^2 + (n_2-1)s_{X_2}^2}{n_1 + n_2 - 2}}.$$

The pooled standard deviation $s_p$ is defined so that its square is an unbiased estimator of the common variance whether or not the population means are equal. Total degrees of freedom are $n_1 + n_2 - 2$.

Drop the equal-variance assumption and you get **Welch's $t$-test**, which estimates the two variances separately:

$$t = \frac{\bar{X}_1 - \bar{X}_2}{\sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}}},$$

with degrees of freedom from the Welch-Satterthwaite equation

$$\text{d.f.} = \frac{\left(\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}\right)^2}{\frac{(s_1^2/n_1)^2}{n_1-1} + \frac{(s_2^2/n_2)^2}{n_2-1}}.$$

Here the denominator is not a pooled variance, and the distribution of the statistic is only *approximated* by a $t$: the true distribution depends slightly on the two unknown population variances, which is the Behrens-Fisher problem.

### Paired

When one sample is tested twice (repeated measures) or two samples are matched into pairs, form the differences and test them as a one-sample problem:

$$t = \frac{\bar{X}_D - \mu_0}{s_D/\sqrt{n}},$$

where $\bar{X}_D$ and $s_D$ are the mean and standard deviation of the pairwise differences, $\mu_0$ is zero when testing whether the average difference is nonzero, and $n$ is the number of *pairs*.

Pairing is a form of blocking. It has greater power than the unpaired test when the paired units are similar with respect to noise factors independent of group membership. Measuring blood pressure in the same patients before and after a medication makes [[cs/software-engineering/feature-flags-and-trunk-based-development|each patient their own control]], eliminating the random inter-patient variation and raising power. The costs are two: every subject must be examined twice, and because half the sample now depends on the other half, the paired test has only $n/2 - 1$ degrees of freedom where $n$ is the total number of observations. Pairs become the test units, so the sample has to be doubled to reach the same degrees of freedom an unpaired design would have had.

> [!warning]
> Independence versus pairing is a design fact, not a data fact, and it is generally not testable from the data. If the data are known to be dependent by design, a dependent test must be used. With *partially* paired data, the independent test may give invalid results because the statistic might not follow a $t$ distribution, while the dependent test is sub-optimal because it throws the unpaired observations away.

## Assumptions and robustness

The simplest form of the test assumes three things: $\bar{X} \sim \mathcal{N}(\mu, \sigma^2/n)$, that $s^2(n-1)/\sigma^2$ follows a $\chi^2$ distribution with $n-1$ degrees of freedom, and that $Z$ and $s$ are independent. Normality of the individual data values is not required if these conditions hold.

Robustness is better than the assumption list suggests. Most two-sample $t$-tests are robust to all but large deviations. Student's original test is highly robust to unequal variances when the two sample sizes are equal, while Welch's test is insensitive to variance equality regardless of whether sample sizes are similar. The CLT usually rescues the normality requirement for moderately large samples, but the sample size needed for convergence depends on the skewness of the original data, and can run from 30 to 100 or higher.

For large $n$, Slutsky's theorem shows the sample-variance distribution barely matters: $\sqrt{n}(\bar{X} - \mu) \xrightarrow{d} N(0, \sigma^2)$ by the CLT, $s^2 \xrightarrow{p} \sigma^2$ by the [[cs/statistics/law-of-large-numbers|law of large numbers]], and the ratio [[cs/math/limits-and-continuity|converges in distribution]] to $N(0,1)$.

## The brewery

The distribution was first derived as a posterior distribution in 1876 by Helmert and Lüroth, and appeared in more general form as the Pearson type IV distribution in Karl Pearson's 1895 paper. It is therefore an example of Stigler's Law of Eponymy: the name honors someone else.

That someone is William Sealy Gosset, who published it in English in 1908 in *Biometrika* as "The Probable Error of a Mean" under the pseudonym "Student". He worked at the Guinness Brewery in Dublin and devised the test as an economical way to monitor the quality of stout. He cared about small samples because that was what the work gave him, such as the chemical properties of barley. Two accounts of the pseudonym circulate: that his employer preferred staff to publish under pen names, and that Guinness did not want competitors to know they were using the $t$-test on raw material. Gosset spent the first two terms of the 1906 to 1907 academic year on Guinness study leave in Karl Pearson's Biometric Laboratory at University College London, and his identity was known to fellow statisticians and to Pearson as editor-in-chief. Ronald Fisher made it famous, naming it "Student's distribution" and using the letter $t$ for the test value.

## Related Notes

- [[cs/statistics/hypothesis-testing|Hypothesis Testing]] - the decision framework the $t$-test instantiates
- [[cs/statistics/normal-distribution|Normal Distribution]] - the limit of $t_\nu$ as $\nu \to \infty$
- [[cs/statistics/confidence-intervals|Confidence Intervals]] - the same pivot, inverted into an interval
- [[cs/statistics/central-limit-theorem|Central Limit Theorem]] - what makes the normality assumption survivable
- [[cs/statistics/sampling-and-sampling-distributions|Sampling and Sampling Distributions]] - $t$ is the sampling distribution of the standardized mean when $\sigma$ is estimated
- [[cs/statistics/variance-and-covariance|Variance and Covariance]] - the pooled variance estimator and the $\nu/(\nu-2)$ variance
- [[cs/statistics/bootstrap-and-resampling|Bootstrap and Resampling]] - permutation tests as a distribution-free alternative

## Sources

- [Student's t-distribution (Wikipedia)](https://en.wikipedia.org/wiki/Student%27s_t-distribution) - the heavier-tail characterization and the Cauchy/normal endpoints, the density, the moments including nonexistence at order $\nu$, the $Z/\sqrt{V/\nu}$ characterization and noncentral $t$, and the Helmert/Lüroth/Pearson/Gosset/Fisher history.
- [Student's t-test (Wikipedia)](https://en.wikipedia.org/wiki/Student%27s_t-test) - the definition of the test and its relation to the $Z$-test, the one-sample, pooled two-sample, Welch, and paired formulas with their degrees of freedom, the assumption list and robustness results, the Slutsky argument, and the Guinness/study-leave history.
