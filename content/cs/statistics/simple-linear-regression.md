---
title: Simple Linear Regression
description: Fitting a single-predictor line through data - the model, least-squares estimation, and interpretation of slope and intercept.
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

Given a scatter plot of two variables, simple linear regression draws the **single best straight line** through the points. "Best" means the line that [[cs/machine-learning/loss-functions|minimizes the total squared vertical distance]] from each point to the line. One predictor, one response, one line. It's the most elementary form of regression and the natural starting point before moving to the multiple-predictor case in [[cs/statistics/regression-fundamentals|Regression Fundamentals]].

## Definition

The **simple linear regression model** expresses a response $Y$ as a linear function of a single predictor $x$:

$$Y_i = \beta_0 + \beta_1 x_i + \varepsilon_i, \quad i = 1, \dots, n$$

- $\beta_0$ - the true **intercept** (value of $Y$ when $x = 0$)
- $\beta_1$ - the true **slope** (change in $E[Y]$ per unit change in $x$)
- $\varepsilon_i \sim \mathcal{N}(0, \sigma^2)$ - independent random errors

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
> For the full OLS derivation, multiple regression extension, residual diagnostics, and $R^2$ interpretation, see [[cs/statistics/regression-fundamentals|Regression Fundamentals]].

## Example

**Predicting chemistry grades.** A professor collects intelligence test scores ($x$) and chemistry grades ($Y$) for 20 students, obtaining $\bar{x} = 110$, $\bar{Y} = 75$, $S_{xy} = 1{,}320$, and $S_{xx} = 4{,}400$.

$$b_1 = \frac{1320}{4400} = 0.30$$

$$b_0 = 75 - 0.30(110) = 42.0$$

The fitted line is $\hat{y} = 42.0 + 0.30x$. Interpretation: each additional point on the intelligence test is associated with a 0.30-point increase in chemistry grade, on average. For a student scoring $x = 120$:

$$\hat{y} = 42.0 + 0.30(120) = 78.0$$

The predicted chemistry grade is 78. The same technique applies to predicting final animal weight from feed consumed - any scenario where one continuous variable drives another.

![Scatter plot of intelligence scores vs chemistry grades with the fitted line y-hat = 42.0 + 0.30x](cs/statistics/assets/simple-regression-fit.svg)

## Why It Matters in CS

Simple linear regression is the "can a straight line explain this?" test. In ML, it's the first model you fit before reaching for anything fancier, because if a line already gets you 90% of the way there, [[cs/deep-learning/artificial-neural-networks|a neural net]] is probably overkill. It sets both a performance floor and an interpretability ceiling.

One underrated use: **[[cs/dsa/algorithm-efficiency|empirical complexity analysis]]**. Plot execution time $T$ against input size $n$ and fit $T = b_0 + b_1 n$. If the fit is tight, your algorithm is linear. Fit $\ln T = b_0 + b_1 \ln n$ instead and $b_1$ estimates the polynomial exponent. This is often faster than deriving the complexity analytically, especially for messy real-world code.

> [!tip]
> When doing exploratory data analysis, fitting a simple regression for each feature individually is a quick way to see which predictors have any marginal relationship with the response. It's not a substitute for multiple regression (confounding is real), but it's a useful first pass.

## Related Notes

- [[cs/statistics/regression-fundamentals|Regression Fundamentals]] - extends to multiple predictors, OLS in matrix form, residual diagnostics, and $R^2$
- [[cs/statistics/maximum-likelihood-estimation|Maximum Likelihood Estimation]] - under normality, MLE of regression coefficients equals OLS
- [[cs/statistics/normal-distribution|Normal Distribution]] - the error distribution assumption $\varepsilon \sim \mathcal{N}(0, \sigma^2)$
- [[cs/statistics/hypothesis-testing|Hypothesis Testing]] - $t$-tests on $b_1$ to assess whether the slope differs from zero
