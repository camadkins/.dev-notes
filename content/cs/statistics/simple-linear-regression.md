---
title: Simple Linear Regression
description: Fitting a single-predictor line through data—the model, least-squares estimation, and interpretation of slope and intercept.
draft: false
comments: false
tags:
  - cs
  - statistics
date: 2026-03-12
aliases: []
---

## Intuition

Given a scatter plot of two variables, simple linear regression draws the **single best straight line** through the points. "Best" means the line that minimizes the total squared vertical distance from each point to the line. With one predictor and one response, this is the most elementary form of regression—a building block before moving to the multiple-predictor case covered in [[regression-fundamentals|Regression Fundamentals]].

## Definition

The **simple linear regression model** expresses a response $Y$ as a linear function of a single predictor $x$:

$$Y_i = \beta_0 + \beta_1 x_i + \varepsilon_i, \quad i = 1, \dots, n$$

- $\beta_0$ — the true **intercept** (value of $Y$ when $x = 0$)
- $\beta_1$ — the true **slope** (change in $E[Y]$ per unit change in $x$)
- $\varepsilon_i \sim \mathcal{N}(0, \sigma^2)$ — independent random errors

The goal is to estimate $\beta_0$ and $\beta_1$ from observed data $(x_i, Y_i)$.

## Key Formulas

**Estimated regression equation:**

$$\hat{y} = b_0 + b_1 x$$

where $b_0$ and $b_1$ are the **least-squares estimates** that minimize the residual sum of squares:

$$\text{RSS} = \sum_{i=1}^n (Y_i - \hat{y}_i)^2$$

**Slope estimate:**

$$b_1 = \frac{\sum_{i=1}^n (x_i - \bar{x})(Y_i - \bar{Y})}{\sum_{i=1}^n (x_i - \bar{x})^2} = \frac{S_{xy}}{S_{xx}}$$

**Intercept estimate:**

$$b_0 = \bar{Y} - b_1 \bar{x}$$

**Estimated error variance:**

$$s^2 = \frac{\text{RSS}}{n - 2} = \frac{\sum_{i=1}^n (Y_i - \hat{y}_i)^2}{n - 2}$$

The denominator is $n - 2$ because two parameters ($b_0$, $b_1$) are estimated.

> [!note]
> For the full OLS derivation, multiple regression extension, residual diagnostics, and $R^2$ interpretation, see [[regression-fundamentals|Regression Fundamentals]].

## Example

**Predicting chemistry grades.** A professor collects intelligence test scores ($x$) and chemistry grades ($Y$) for 20 students, obtaining $\bar{x} = 110$, $\bar{Y} = 75$, $S_{xy} = 1{,}320$, and $S_{xx} = 4{,}400$.

$$b_1 = \frac{1320}{4400} = 0.30$$

$$b_0 = 75 - 0.30(110) = 42.0$$

The fitted line is $\hat{y} = 42.0 + 0.30x$. Interpretation: each additional point on the intelligence test is associated with a 0.30-point increase in chemistry grade, on average. For a student scoring $x = 120$:

$$\hat{y} = 42.0 + 0.30(120) = 78.0$$

The predicted chemistry grade is 78. The same technique applies to predicting final animal weight from feed consumed—any scenario where one continuous variable drives another.

## Why It Matters in CS

- **Supervised learning baseline:** simple linear regression is the first model to try before more complex learners—it establishes a performance floor and interpretability ceiling.
- **Empirical complexity analysis:** plotting execution time $T$ against input size $n$ and fitting $T = b_0 + b_1 n$ tests whether an algorithm is linear. Fitting $\ln T = b_0 + b_1 \ln n$ estimates the polynomial exponent.
- **Feature importance:** in exploratory data analysis, fitting simple regressions for each feature individually reveals which predictors have marginal predictive power before building a full model.
- **Calibration:** simple linear regression calibrates sensor readings, maps raw pixel intensities to physical measurements, and linearizes instrument response curves.

## Related Notes

- [[regression-fundamentals|Regression Fundamentals]] — extends to multiple predictors, OLS in matrix form, residual diagnostics, and $R^2$
- [[maximum-likelihood-estimation|Maximum Likelihood Estimation]] — under normality, MLE of regression coefficients equals OLS
- [[normal-distribution|Normal Distribution]] — the error distribution assumption $\varepsilon \sim \mathcal{N}(0, \sigma^2)$
- [[hypothesis-testing|Hypothesis Testing]] — $t$-tests on $b_1$ to assess whether the slope differs from zero
