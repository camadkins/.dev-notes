---
title: "Support Vector Machines: Maximizing the Margin"
description: Among the infinitely many hyperplanes that separate two classes, the SVM picks the one with the widest gap. Only the points touching that gap matter, and a kernel function buys nonlinearity without ever visiting the high-dimensional space.
draft: false
comments: true
tags:
  - cs
  - machine-learning
  - optimization
date: 2026-06-04
updated:
aliases:
  - SVM
---

Fit a linear classifier to two separable classes and you immediately have a problem of embarrassment: there are many hyperplanes that classify the data, and nothing in the training error distinguishes them. The support vector machine resolves the tie with a geometric principle. Wikipedia states the choice and the reason: pick the hyperplane representing the largest separation, or margin, between the two classes, because "in general the larger the margin, the lower the generalization error of the classifier." A lower generalization error means the implementer is less likely to experience [[cs/machine-learning/generalization-vs-memorization|overfitting]].

> [!note] The idea
> Two independent ideas got fused into one model, and separating them is the key to understanding SVMs. The first is the **maximum-margin criterion**, a tie-breaking rule that turns classification into a constrained optimization problem whose answer depends on only a handful of training points. The second is the **kernel trick**, a computational identity that lets any algorithm written purely in terms of dot products operate in a high-dimensional feature space it never actually constructs. The margin idea came first; Wikipedia records that Boser, Guyon, and Vapnik suggested applying the kernel trick to maximum-margin hyperplanes in 1992, and that the soft-margin version used in software packages was proposed by Corinna Cortes and Vapnik in 1993 and published in 1995. The trick is not specific to SVMs, it just found its most famous home there.

## The margin, and why only some points count

Treat each data point as a $p$-dimensional vector and ask whether a $(p-1)$-dimensional hyperplane can separate the two classes. Wikipedia describes the construction for linearly separable data: select two parallel hyperplanes separating the classes so the distance between them is as large as possible, call that region the margin, and the maximum-margin hyperplane is the one lying halfway between them.

The consequence is the model's most distinctive property. Wikipedia states it directly: the max-margin hyperplane "is completely determined by those $\mathbf{x}_i$ that lie nearest to it," and those points are called support vectors. Every training point sitting comfortably on the correct side of the margin contributes nothing to the boundary's position. Delete it and the fitted model is unchanged. scikit-learn lists the practical payoff among the method's advantages: an SVM "uses a subset of training points in the decision function (called support vectors), so it is also memory efficient."

This is a sharp contrast with [[cs/machine-learning/logistic-regression|logistic regression]], where every training example contributes a gradient term forever, and with [[cs/machine-learning/k-nearest-neighbors|kNN]], which keeps the entire training set. The SVM keeps only the points on the frontier.

## Soft margin: what to do when no gap exists

Real data is rarely separable, and a hard-margin formulation simply has no solution when the classes overlap. The soft margin fixes this by charging a price for violations instead of forbidding them, using the hinge loss

$$\max\left(0, 1 - y_i(\mathbf{w}^\mathsf{T}\mathbf{x}_i - b)\right)$$

which Wikipedia describes as zero when $\mathbf{x}_i$ lies on the correct side of the margin, and otherwise proportional to the distance from the margin. The full objective becomes

$$\lVert\mathbf{w}\rVert^2 + C\left[\frac{1}{n}\sum_{i=1}^{n}\max\left(0, 1 - y_i(\mathbf{w}^\mathsf{T}\mathbf{x}_i - b)\right)\right]$$

where $C > 0$ "determines the trade-off between increasing the margin size and ensuring that the $\mathbf{x}_i$ lie on the correct side of the margin." scikit-learn gives the same parameter an operational reading: $C$ "trades off misclassification of training examples against simplicity of the decision surface. A low C makes the decision surface smooth, while a high C aims at classifying all training examples correctly." Its guidance for noisy data is to decrease $C$, since "decreasing C corresponds to more regularization."

Read that objective again and it is a familiar shape: a penalty on $\lVert\mathbf{w}\rVert^2$ plus a data-fitting loss. Wikipedia makes the connection explicit, noting the SVM technique is equivalent to empirical risk minimization with Tikhonov regularization where the loss function is the hinge loss. The margin term is an [[cs/machine-learning/regularization-ridge-and-lasso|L2 regularizer]] in disguise, which is why $C$ behaves exactly like an inverse regularization strength.

## The kernel trick

The optimization problem, written in dual form, touches the training data only through [[cs/math/vectors-and-dot-products|dot products]] $\varphi(\mathbf{x}_i)\cdot\varphi(\mathbf{x}_j)$ between transformed points. Given a kernel function satisfying $k(\mathbf{x}_i, \mathbf{x}_j) = \varphi(\mathbf{x}_i)\cdot\varphi(\mathbf{x}_j)$, you can substitute $k$ for every such dot product and the algorithm proceeds unchanged. Wikipedia summarizes the effect: the kernel trick, "where dot products are replaced by kernels," lets the algorithm fit the maximum-margin hyperplane in a transformed feature space, and "although the classifier is a hyperplane in the transformed feature space, it may be nonlinear in the original input space."

What makes this a trick rather than a definition is that $\varphi$ is never evaluated. The mappings are designed, Wikipedia notes, "to ensure that dot products of pairs of input data vectors may be computed easily in terms of the variables in the original space." You get the geometry of a high-dimensional, possibly infinite-dimensional space at the cost of a scalar function on the original inputs. scikit-learn lists the standard menu: linear $\langle x, x'\rangle$, polynomial $(\gamma\langle x,x'\rangle + r)^d$, RBF $\exp(-\gamma\lVert x - x'\rVert^2)$, and sigmoid $\tanh(\gamma\langle x,x'\rangle + r)$.

> [!example] Two knobs on an RBF SVM
> scikit-learn describes what $C$ and $\gamma$ each control on an RBF kernel. $C$ is common to all kernels and governs the misclassification-versus-smoothness trade. $\gamma$ "defines how much influence a single training example has. The larger gamma is, the closer other examples must be to be affected." A large $\gamma$ makes each support vector's influence local and the boundary wiggly; a small one makes it broad and the boundary smooth. Because the two interact, scikit-learn advises a grid search "with C and gamma spaced exponentially far apart to choose good values," which is a rare case of documentation naming the log-scale search directly.

> [!warning] Scale your features first
> scikit-learn is explicit that "Support Vector Machine algorithms are not scale invariant, so it is highly recommended to scale your data," suggesting each attribute be scaled to $[0,1]$ or $[-1,+1]$, or standardized to mean 0 and variance 1, with the identical scaling applied to test vectors. The reason is structural rather than numerical: the margin is a geometric distance, and the RBF kernel measures $\lVert x - x'\rVert$, so changing a feature's units changes the shape of the problem. This is the same failure mode [[cs/machine-learning/k-nearest-neighbors|kNN]] has, and it is easy to miss because the model still trains and reports a score.

## Where SVMs are strong and where they are not

scikit-learn's own list is unusually candid. The advantages: effective in high-dimensional spaces, still effective when the number of dimensions exceeds the number of samples, memory efficient through the support-vector subset, and versatile through swappable kernels. The disadvantages: when the number of features is much greater than the number of samples, careful choice of kernel and regularization term is crucial to avoid overfitting, and SVMs "do not directly provide probability estimates, these are calculated using an expensive [[cs/statistics/bootstrap-and-resampling|five-fold cross-validation]]."

That last one is the practical difference from logistic regression that decides many real projects. If you need a calibrated probability rather than a label, the SVM does not hand you one, because nothing in the maximum-margin objective asks for a probability. Its output is a signed distance from a boundary, and distance is not [[cs/statistics/maximum-likelihood-estimation|likelihood]].

## Related Notes

- [[cs/machine-learning/logistic-regression|Logistic Regression]] - the probabilistic linear classifier SVMs are usually compared against
- [[cs/machine-learning/loss-functions|Loss Functions]] - hinge loss alongside cross-entropy and squared error
- [[cs/machine-learning/regularization-ridge-and-lasso|Regularization: Ridge and Lasso]] - the L2 penalty that the margin term turns out to be
- [[cs/machine-learning/k-nearest-neighbors|k-Nearest Neighbors]] - the other method that stores training points, though it stores all of them
- [[cs/machine-learning/bias-variance-tradeoff|Bias-Variance Tradeoff]] - what C and gamma move along
- [[cs/machine-learning/features-and-representations|Features and Representations]] - the kernel as an implicit feature map
- [[cs/math/vectors-and-dot-products|Vectors and Dot Products]] - the operation the kernel trick substitutes for
- [[cs/machine-learning/generalization-vs-memorization|Generalization vs Memorization]] - the margin argument for why a wider gap generalizes better

## Sources

- "Support vector machine," Wikipedia (raw wikitext). https://en.wikipedia.org/w/index.php?title=Support_vector_machine&action=raw . Supports the maximum-margin hyperplane definition and the larger-margin/lower-generalization-error rationale; the two parallel hyperplanes bounding the margin; the max-margin hyperplane being completely determined by the nearest points, called support vectors; Boser, Guyon, and Vapnik applying the kernel trick to maximum-margin hyperplanes in 1992 and the soft-margin version proposed by Corinna Cortes and Vapnik in 1993, published 1995; the hinge loss formula and its zero-inside-the-margin behavior; the $\lVert w\rVert^2 + C[\cdot]$ objective and C as the margin-versus-correctness trade-off; the kernel identity $k(x_i,x_j) = \varphi(x_i)\cdot\varphi(x_j)$ with dot products replaced by kernels, yielding a boundary nonlinear in the input space; the design goal that kernel dot products be computable in the original space; and the equivalence to empirical risk minimization with Tikhonov regularization under hinge loss.
- "Support Vector Machines," scikit-learn User Guide. https://scikit-learn.org/stable/modules/svm.html . Supports the listed advantages (high-dimensional effectiveness, dimensions exceeding samples, memory efficiency via the support-vector subset, kernel versatility) and disadvantages (overfitting risk when features far exceed samples, no direct probability estimates without expensive five-fold cross-validation); the kernel function list including linear, polynomial, RBF, and sigmoid forms; C trading misclassification against decision-surface simplicity with low C smooth and high C fitting all training examples; decreasing C corresponding to more regularization for noisy observations; gamma controlling how much influence a single training example has; the exponentially-spaced grid search advice; and the non-scale-invariance warning with the [0,1] / [-1,+1] / standardize recommendations.
