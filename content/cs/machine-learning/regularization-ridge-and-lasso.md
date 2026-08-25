---
title: "Regularization: Ridge and Lasso"
description: Two penalties on coefficient size that look nearly identical algebraically and behave completely differently. L2 shrinks everything smoothly toward zero. L1 sets coefficients exactly to zero, and the reason is geometric.
draft: false
comments: true
tags:
  - cs
  - machine-learning
  - optimization
date: 2026-04-15
updated:
aliases:
  - Ridge Regression
  - Lasso
  - L1 and L2 Regularization
  - Elastic Net
---

An unconstrained least-squares fit will use every coefficient it is given, however large, to shave a little more error off the training data. Regularization prices that freedom. Both classic penalties do the same structural thing, add a term to the objective that grows with the size of the coefficient vector, and yet they produce qualitatively different models. Ridge gives you a dense model with small weights. Lasso gives you a sparse model with some weights at exactly zero. That is a difference in kind, not degree, and it comes from the shape of a norm.

> [!note] The idea
> The gap between L1 and L2 is not about penalty strength, it is about geometry. Write both as constrained problems minimizing the same residual sum of squares, subject to $\lVert\beta\rVert_1 \le t$ for lasso and $\lVert\beta\rVert_2^2 \le t$ for ridge. Wikipedia describes the resulting regions: the $\ell^1$ constraint region is "a square rotated so that its corners lie on the axes (in general a cross-polytope)," while the $\ell^2$ region is a circle, in general an $n$-sphere, "which is rotationally invariant and, therefore, has no corners." An expanding convex level set tangent to the boundary is likely to touch a corner, and every corner has some coordinates identically zero. Sparsity is what corners do.

## Ridge: shrink everything, exclude nothing

scikit-learn describes ridge regression as addressing problems of ordinary least squares "by imposing a penalty on the size of the coefficients," minimizing the penalized residual sum of squares

$$\min_{w}\ \lVert Xw - y\rVert_2^2 + \alpha\lVert w\rVert_2^2$$

The complexity parameter $\alpha \ge 0$ "controls the amount of shrinkage: the larger the value of $\alpha$, the greater the amount of shrinkage and thus the coefficients become more robust to collinearity." Collinearity is the original motivation. When two features carry nearly the same information, unpenalized least squares can assign them enormous coefficients of opposite sign that nearly cancel, a fit that is [[cs/standards/ieee-754-floating-point|numerically unstable]] and meaningless. The L2 penalty makes that solution expensive.

The precise nature of ridge shrinkage is visible in a clean special case. Under an orthonormal design, Wikipedia states that "ridge regression shrinks all coefficients by a uniform factor of $(1 + N\lambda)^{-1}$ and does not set any coefficients to zero." A uniform multiplicative rescaling can approach zero but never reach it. That is why ridge, in Wikipedia's phrasing, "does not perform covariate selection and therefore does not help to make the model more interpretable."

## Lasso: shrink and select

Lasso swaps the squared L2 norm for the L1 norm. scikit-learn's objective is

$$\min_{w}\ \frac{1}{2n_{\text{samples}}}\lVert Xw - y\rVert_2^2 + \alpha\lVert w\rVert_1$$

and the consequence is stated as a capability, not a tendency: "The Lasso is a linear model that estimates sparse coefficients, i.e., it is able to set coefficients exactly to zero." Its preference for solutions with fewer non-zero coefficients effectively reduces the number of features the solution depends on, which is why scikit-learn notes lasso can be used directly to perform feature selection, and why lasso and its variants "are fundamental to the field of compressed sensing."

The name encodes the two jobs. Wikipedia expands it as "least absolute shrinkage and selection operator," a method that "performs both variable selection and regularization in order to enhance the prediction accuracy and interpretability of the resulting statistical model." Wikipedia also records the history, which is less tidy than the usual telling: lasso was developed independently in the geophysics literature in 1986, and Robert Tibshirani "independently rediscovered and popularized it in 1996, based on Breiman's nonnegative garrote," coining the term in his 1996 paper "Regression Shrinkage and Selection via the lasso" in the *Journal of the Royal Statistical Society, Series B*.

## Why L1 zeroes and L2 does not

The orthonormal case makes the mechanical difference exact. Ridge scales every coefficient by a common factor. Lasso, per Wikipedia, "translates the coefficients towards zero by a constant value and sets them to zero if they reach it." Multiplication never reaches zero; subtraction does. That is the whole story, in one sentence, for the orthonormal case.

The geometric picture generalizes it. Wikipedia's argument is that the L1 ball's corners lie on the coordinate axes, and a convex object tangent to the boundary "is likely to encounter a corner (or a higher-dimensional equivalent) of a hypercube, for which some components of $\beta$ are identically zero." For the $\ell^2$ ball no such distinguished points exist, so "the points on the boundary for which some of the components of $\beta$ are zero are not distinguished from the others and the convex object is no more likely to contact a point at which some components of $\beta$ are zero than one for which none of them are."

Wikipedia positions the lasso as sitting between two older methods: its estimates "share features of both ridge and best subset selection regression since they both shrink the magnitude of all the coefficients, like ridge regression and set some of them to zero, as in the best subset selection case." Best subset selection is [[cs/math/combinatorics|combinatorial]]. Lasso obtains a similar selection effect from [[cs/math/convexity-and-optimization-basics|a convex problem]], which is why it is tractable at scale.

> [!warning] Lasso is unstable under correlated features
> scikit-learn names the failure directly in its Elastic-Net section: "Lasso is likely to pick one of these at random, while elastic-net is likely to pick both." If two features are nearly duplicates, L1 has no reason to prefer either, so it keeps one and zeroes the other, and a resampled dataset may flip which one survives. Reading the surviving coefficient as "this feature matters and that one does not" is the mistake this warns against. Sparse does not mean identified.

## Elastic Net: both penalties

Elastic Net adds both terms, with scikit-learn describing it as "a linear regression model trained with both $\ell_1$ and $\ell_2$-norm regularization of the coefficients," a combination that "allows for learning a sparse model where few of the weights are non-zero like Lasso, while still maintaining the regularization properties of Ridge." The mix parameter $\rho$ sets the convex combination:

$$\min_{w}\ \frac{1}{2n_{\text{samples}}}\lVert Xw - y\rVert_2^2 + \alpha\rho\lVert w\rVert_1 + \frac{\alpha(1-\rho)}{2}\lVert w\rVert_2^2$$

scikit-learn's stated case for it is exactly the correlated-feature problem above, plus a stability property: trading off between lasso and ridge "allows Elastic-Net to inherit some of Ridge's stability under rotation."

> [!tip] These penalties are everywhere, under other names
> The same two terms show up far outside linear regression. [[cs/machine-learning/logistic-regression|Logistic regression]] in scikit-learn applies regularization by default and offers the identical $\ell_1$, $\ell_2$, and Elastic-Net choices. The [[cs/machine-learning/support-vector-machines|SVM]] objective's $\lVert w\rVert^2$ margin term plays the same role, which is why Wikipedia describes the soft-margin SVM as equivalent to empirical risk minimization with Tikhonov regularization under the hinge loss. The neural-network side has its own family of methods, covered in [[cs/deep-learning/regularization-in-deep-learning|regularization in deep learning]]. Learning the ridge/lasso distinction once pays off repeatedly, because the mechanism does not change when the model does.

## Related Notes

- [[cs/machine-learning/regression|Regression: Linear, Logistic, and Softmax]] - the models these penalties were first attached to
- [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]] - what alpha moves you along
- [[cs/machine-learning/generalization-vs-memorization|Generalization vs Memorization]] - the failure regularization exists to prevent
- [[cs/machine-learning/logistic-regression|Logistic Regression]] - where the same penalty menu reappears, applied by default
- [[cs/machine-learning/support-vector-machines|Support Vector Machines]] - the margin term as an L2 regularizer
- [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]] - L2 as weight decay, plus the neural-specific methods
- [[cs/machine-learning/features-and-representations|Features and Representations]] - lasso as an automatic feature selector
- [[cs/machine-learning/train-validation-test|Train, Validation, Test]] - where alpha and the L1 ratio get chosen

## Sources

- "Linear Models," scikit-learn User Guide. https://scikit-learn.org/stable/modules/linear_model.html . Supports ridge imposing a penalty on coefficient size with the $\lVert Xw-y\rVert_2^2 + \alpha\lVert w\rVert_2^2$ objective and alpha controlling shrinkage and robustness to collinearity; the Lasso objective with the $\alpha\lVert w\rVert_1$ penalty, its ability to set coefficients exactly to zero, its preference for fewer non-zero coefficients, its use for feature selection, and its role in compressed sensing; and the Elastic-Net objective combining both norms via `l1_ratio`, its motivation for correlated features where lasso picks one at random, and its inherited stability under rotation.
- "Lasso (statistics)," Wikipedia (raw wikitext). https://en.wikipedia.org/w/index.php?title=Lasso_%28statistics%29&action=raw . Supports the expansion "least absolute shrinkage and selection operator" and the description of lasso as performing both variable selection and regularization; the 1986 geophysics origin and Tibshirani's 1996 rediscovery, naming, and paper "Regression Shrinkage and Selection via the lasso" in the *Journal of the Royal Statistical Society, Series B*; ridge shrinking coefficients by a uniform factor $(1+N\lambda)^{-1}$ without setting any to zero and therefore not performing covariate selection; lasso translating coefficients toward zero by a constant value and setting them to zero on arrival; the shared features with ridge and best subset selection; and the geometric interpretation of the $\ell^1$ constraint region as a rotated square with corners on the axes versus the cornerless rotationally invariant $\ell^2$ ball.
- "Support vector machine," Wikipedia (raw wikitext). https://en.wikipedia.org/w/index.php?title=Support_vector_machine&action=raw . Supports the soft-margin SVM being equivalent to empirical risk minimization with Tikhonov regularization under the hinge loss.
