---
title: Regression Fundamentals
description: Simple and multiple linear regression—OLS estimation, residual diagnostics, R-squared, and the assumptions that make it all work.
draft: false
comments: false
tags:
  - cs
  - statistics
date: 2026-03-12
aliases: []
---

## Intuition

Regression answers the question: **how does one variable change when another changes?** If you plot study hours against exam scores and see an upward trend, regression draws the "best" line through the cloud of points. "Best" means the line that makes the smallest total prediction errors. Once you have the line, you can predict scores for new students and quantify how much each extra hour of study is worth on average.

The power of regression is that it extends naturally: from one predictor (simple regression) to many (multiple regression), and from straight lines to curves. It is the workhorse of applied statistics and machine learning alike.

## Core Idea

### Simple linear regression

Model a response $Y$ as a linear function of one predictor $X$:

$$Y_i = \beta_0 + \beta_1 X_i + \varepsilon_i, \quad i = 1, \dots, n$$

where $\beta_0$ is the intercept, $\beta_1$ is the slope, and $\varepsilon_i$ is the error term.

### Ordinary least squares (OLS)

OLS chooses $\hat{\beta}_0$ and $\hat{\beta}_1$ to minimize the **residual sum of squares**:

$$\text{RSS} = \sum_{i=1}^n (Y_i - \hat{Y}_i)^2 = \sum_{i=1}^n (Y_i - \hat{\beta}_0 - \hat{\beta}_1 X_i)^2$$

Taking partial derivatives and setting them to zero gives:

$$\hat{\beta}_1 = \frac{\sum_{i=1}^n (X_i - \bar{X})(Y_i - \bar{Y})}{\sum_{i=1}^n (X_i - \bar{X})^2}, \qquad \hat{\beta}_0 = \bar{Y} - \hat{\beta}_1 \bar{X}$$

### Multiple linear regression

With $p$ predictors, the model becomes:

$$Y = X\beta + \varepsilon$$

where $X$ is the $n \times (p+1)$ design matrix (including a column of ones for the intercept), $\beta$ is the $(p+1) \times 1$ coefficient vector, and $\varepsilon$ is the $n \times 1$ error vector. The OLS solution:

$$\hat{\beta} = (X^T X)^{-1} X^T Y$$

> [!tip]
> In practice, never invert $X^T X$ directly—use a QR decomposition or SVD for numerical stability. Most statistical libraries handle this automatically.

### Residuals

The **residual** for observation $i$ is $e_i = Y_i - \hat{Y}_i$. Residuals are the diagnostic window into model quality:

- **Residuals vs. fitted values**: should show no pattern (random scatter). Patterns indicate nonlinearity or heteroscedasticity.
- **Normal Q-Q plot**: residuals should fall on a straight line if the normality assumption holds.
- **Scale-location plot**: checks for constant variance (homoscedasticity).

### Key assumptions (LINE)

| Letter | Assumption | Violation symptom |
|---|---|---|
| **L** | **L**inearity — $E[Y \mid X]$ is linear in $X$ | Curved residual pattern |
| **I** | **I**ndependence — errors are independent | Autocorrelation in time-series data |
| **N** | **N**ormality — errors are normally distributed | Heavy tails in Q-Q plot |
| **E** | **E**qual variance — $\text{Var}(\varepsilon_i) = \sigma^2$ | Fan or funnel shape in residuals |

### R-squared

**Coefficient of determination** $R^2$ measures the proportion of variance in $Y$ explained by the model:

$$R^2 = 1 - \frac{\text{RSS}}{\text{TSS}} = 1 - \frac{\sum (Y_i - \hat{Y}_i)^2}{\sum (Y_i - \bar{Y})^2}$$

$R^2 \in [0, 1]$. Higher is better, but adding predictors always increases $R^2$. Use **adjusted $R^2$** to penalize for unnecessary predictors:

$$R^2_{\text{adj}} = 1 - \frac{(1 - R^2)(n - 1)}{n - p - 1}$$

> [!warning]
> A high $R^2$ does not imply causation, nor does it mean the model is correctly specified. Always inspect residuals before trusting $R^2$.

## Example

**Predicting house prices.** Suppose we regress sale price ($Y$, in thousands) on square footage ($X$) for $n = 50$ homes and obtain:

$$\hat{Y} = 25.3 + 0.112 X$$

Interpretation: each additional square foot is associated with a \$112 increase in price, on average. The intercept $25.3$ is the estimated price at zero square footage (not meaningful here—extrapolation beyond the data range).

With $R^2 = 0.74$, square footage explains 74% of the variance in sale price. The remaining 26% is due to factors not in the model (location, condition, lot size, etc.)—motivation for multiple regression.

## Related Notes

- [[probability-distributions|Probability Distributions]] — OLS residuals are assumed normally distributed
- [[hypothesis-testing|Hypothesis Testing]] — $t$-tests and $F$-tests assess coefficient significance
- [[bayesian-inference|Bayesian Inference]] — Bayesian regression places priors on $\beta$
