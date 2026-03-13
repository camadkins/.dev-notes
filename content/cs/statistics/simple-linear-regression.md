---
title: Simple Linear Regression
description: Fitting a straight line to data by minimizing squared errors—the simplest predictive model and gateway to all regression methods.
draft: false
comments: false
tags:
  - cs
  - statistics
date: 2026-03-12
aliases: []
---

## Intuition

You have a cloud of points—study hours on the x-axis, exam scores on the y-axis—and you want to draw the single straight line that best summarizes the relationship. "Best" means the line whose predictions are closest to the actual values overall. Simple linear regression finds that line by minimizing the total squared distance between each observed point and the line. The result gives you two numbers: a slope (how much $Y$ changes per unit of $X$) and an intercept (the predicted $Y$ when $X = 0$).

## Definition

Simple linear regression models a response variable $Y$ as a linear function of a single predictor $X$:

$$Y_i = \beta_0 + \beta_1 X_i + \varepsilon_i, \quad i = 1, \dots, n$$

where $\beta_0$ is the **intercept**, $\beta_1$ is the **slope**, and $\varepsilon_i$ is the error term (assumed independent with mean zero and constant variance $\sigma^2$).

The **ordinary least squares** (OLS) estimators minimize the residual sum of squares $\text{RSS} = \sum (Y_i - \hat{Y}_i)^2$:

$$\hat{\beta}_1 = \frac{\sum_{i=1}^n (X_i - \bar{X})(Y_i - \bar{Y})}{\sum_{i=1}^n (X_i - \bar{X})^2}, \qquad \hat{\beta}_0 = \bar{Y} - \hat{\beta}_1 \bar{X}$$

The fitted values are $\hat{Y}_i = \hat{\beta}_0 + \hat{\beta}_1 X_i$, and the residuals are $e_i = Y_i - \hat{Y}_i$.

## Key Formulas

| Formula | Meaning |
|---|---|
| $\hat{\beta}_1 = \frac{\sum (X_i - \bar{X})(Y_i - \bar{Y})}{\sum (X_i - \bar{X})^2}$ | Slope: change in $Y$ per unit change in $X$ |
| $\hat{\beta}_0 = \bar{Y} - \hat{\beta}_1 \bar{X}$ | Intercept: predicted $Y$ when $X = 0$ |
| $R^2 = 1 - \frac{\text{RSS}}{\text{TSS}}$ | Proportion of variance in $Y$ explained by $X$ |
| $\text{SE}(\hat{\beta}_1) = \frac{s}{\sqrt{\sum (X_i - \bar{X})^2}}$ | Standard error of slope ($s$ = residual std dev) |
| $t = \frac{\hat{\beta}_1}{\text{SE}(\hat{\beta}_1)}$ | Test statistic for $H_0: \beta_1 = 0$ |

## Example

**Predicting exam score from study hours.** Suppose five students report:

| Hours ($X$) | Score ($Y$) |
|---|---|
| 1 | 52 |
| 2 | 58 |
| 3 | 65 |
| 4 | 70 |
| 5 | 80 |

$\bar{X} = 3$, $\bar{Y} = 65$. Computing:

$$\hat{\beta}_1 = \frac{(1-3)(52-65) + \cdots + (5-3)(80-65)}{(1-3)^2 + \cdots + (5-3)^2} = \frac{66}{10} = 6.6$$

$$\hat{\beta}_0 = 65 - 6.6 \times 3 = 45.2$$

So $\hat{Y} = 45.2 + 6.6X$. Each additional hour of study predicts a 6.6-point increase. A student studying 6 hours would be predicted to score $45.2 + 6.6(6) = 84.8$.

## Why It Matters in CS

- **Performance modeling**: predicting response time from request rate, memory usage from input size, or build time from codebase size.
- **Feature engineering gateway**: understanding simple regression is prerequisite to multiple regression, regularization, and all supervised learning.
- **A/B testing analysis**: estimating the effect of a single treatment variable on a metric.
- **Baseline model**: the first model to try before reaching for nonlinear or ensemble methods—if a line fits well, complexity is wasted.

## Related Notes

- [[regression-fundamentals|Regression Fundamentals]] — extends to multiple predictors, residual diagnostics, and $R^2_{\text{adj}}$
- [[variance-and-covariance|Variance and Covariance]] — the slope formula is $\text{Cov}(X,Y) / \text{Var}(X)$
- [[normal-distribution|Normal Distribution]] — residuals are assumed normally distributed for inference
- [[maximum-likelihood-estimation|Maximum Likelihood Estimation]] — MLE under Gaussian errors yields the same OLS estimates
- [[hypothesis-testing|Hypothesis Testing]] — $t$-tests assess whether the slope differs from zero
