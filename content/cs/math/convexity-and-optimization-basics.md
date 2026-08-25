---
title: Convexity and Optimization Basics
description: "Why the shape of a search space decides whether optimization is tractable, and what convexity buys you about local minima."
draft: false
comments: true
tags:
  - cs
  - math
  - optimization
date: 2026-06-28
updated:
aliases:
  - convex-set
  - convex-function
  - convex-optimization
---

## The Shape That Makes Search Easy

Optimization in general is brutal, and convexity is the property that rescues a large slice of it. The headline: "many classes of convex optimization problems admit polynomial-time algorithms, whereas mathematical optimization is in general NP-hard." Same objective-and-constraints framing, wildly different [[cs/dsa/time-complexity-analysis|computational fates]], and the deciding factor is geometry.

Two definitions carry the whole idea. A set of points "is convex if it contains every line segment between two points in the set." Formally, for a subset $C$ of a vector or affine space over the reals, $C$ is convex if "for all x and y in C, the line segment connecting x and y is included in C. This means that the affine combination $(1 - t)x + ty$ belongs to C for all x,y in C and t in the interval [0, 1]." The negative examples are the intuitive ones: "a solid cube is a convex set, but anything that is hollow or has an indent, such as a crescent shape, is not convex."

A function is convex when the same no-indent condition holds for the region above its graph. "A real-valued function is called convex if the line segment between any two distinct points on the graph of the function lies above or on the graph of the function between the two points. Equivalently, a function is convex if its epigraph (the set of points on or above the graph of the function) is a convex set." Informally, "a convex function graph is shaped like a cup, while a concave function's graph is shaped like a cap."

> [!note] The idea
> Convexity converts a global claim into a local check, and that is the entire source of its power. "Any local minimum of a convex function is also a global minimum." An algorithm that can only see its immediate neighborhood, such as [[cs/machine-learning/gradient-descent|gradient descent]], normally has no way to know whether a flat spot is the best answer or a trap. Under convexity, finding a local minimum *is* finding the global one, so a myopic procedure earns a global guarantee for free. Everything else in convex optimization is downstream of this one sentence.

## Local Becomes Global

Convex minimization is defined exactly where those two definitions meet: it "studies the problem of minimizing convex functions over convex sets (or, equivalently, maximizing concave functions over convex sets)." Three properties follow, and they are the reason practitioners work hard to phrase problems in convex form:

- "every point that is local minimum is also a global minimum"
- "the optimal set is convex"
- "if the objective function is strictly convex, then the problem has at most one optimal point"

The uniqueness result appears on the function side too: "a strictly convex function will have at most one global minimum," and "a strictly convex function on an open set has no more than one minimum." Strict convexity buys you not merely a good answer but *the* answer.

Compare that to what a non-convex surface offers. Gradient descent halts near a point where the gradient vanishes, which by itself says nothing about whether a deeper valley exists elsewhere. The pathology is not in the algorithm, it is in the landscape. Convexity removes the pathology rather than working around it.

## Checking Convexity

The practical test in one dimension is second-order. "A twice differentiable function of one variable is convex on an interval if and only if its second derivative is non-negative there; this gives a practical test for convexity." Geometrically, such a function "curves up, without any bends the other way (inflection points)." One-way strengthening: "if its second derivative is positive at all points then the function is strictly convex, but the converse does not hold."

Convexity is also robust under the operations you would want. A convex set stays convex under affine maps, since the definition "implies that convexity is invariant under affine transformations." And there is a canonical way to manufacture a convex set from an arbitrary one: "the intersection of all the convex sets that contain a given subset A of Euclidean space is called the convex hull of A. It is the smallest convex set containing A."

> [!example]
> Take $f(x) = x^2$ on the real line. Its second derivative is the constant $2$, which is positive everywhere, so by the test above $f$ is strictly convex. Strict convexity gives at most one global minimum, and at $x = 0$ the derivative is zero, so that point is it. No search over the rest of the line is required.
>
> Now take $f(x) = x^3 - x$. Its second derivative is $6x$, negative for $x < 0$ and positive for $x > 0$, so the function is not convex on the whole line. The second-derivative test fails exactly where the graph bends the other way, and a downhill method started on the wrong side has no local information telling it so.

## The Algorithms This Unlocks

Convex problems come with a mature solver stack, organized by constraint type.

Unconstrained and equality-constrained problems are the easy end: "as the equality constraints are all linear, they can be eliminated with linear algebra and integrated into the objective, thus converting an equality-constrained problem into an unconstrained one." For a twice-differentiable convex objective, "Newton's method can be used. It can be seen as reducing a general unconstrained convex problem, to a sequence of quadratic problems." It "can be combined with line search for an appropriate step size, and it can be mathematically proven to converge quickly." Among the alternatives, "other efficient algorithms for unconstrained minimization are gradient descent (a special case of steepest descent)."

Inequality constraints are harder. "A common way to solve them is to reduce them to unconstrained problems by adding a barrier function, enforcing the inequality constraints, to the objective function. Such methods are called interior point methods." A separate family trades sophistication for simplicity: "subgradient methods can be implemented simply and so are widely used."

## Where CS Meets It

The application list is broad and unmistakably computational: convex optimization models problems "in a wide range of disciplines, such as automatic control systems, estimation and signal processing, communications and networks, electronic circuit design, data analysis and modeling, finance, statistics (optimal experimental design), and structural optimization." Named instances include "variations of statistical regression (including regularization and quantile regression)," "model fitting (particularly multiclass classification)," and "combinatorial optimization."

Those three touch most of the [[cs/machine-learning/ai-vs-ml-vs-dl|machine learning]] stack. Fitting a [[cs/machine-learning/regression|regression]] model, adding a penalty as in [[cs/machine-learning/regularization-ridge-and-lasso|ridge and lasso]], and training a classifier are all optimization problems whose solvability depends on the shape of the objective, which is why loss functions are so often chosen for convenience of geometry as much as for statistical meaning.

> [!warning]
> Deep learning objectives are not convex, and the guarantees above simply do not apply to them. The claim "every local minimum is a global minimum" is a theorem about convex functions, not a general property of optimization, and it is not something [[cs/machine-learning/loss-functions|a loss surface]] inherits by being differentiable or well-behaved. Convexity is worth knowing precisely because it draws the line: on one side, polynomial-time algorithms with global guarantees; on the other, the general problem that "is in general NP-hard."

## Related Notes

- [[cs/machine-learning/gradient-descent|Gradient Descent]] - the local method whose global guarantee comes entirely from convexity
- [[cs/math/derivatives-and-gradients|Derivatives and Gradients]] - the first and second derivatives that test convexity and drive the search
- [[cs/math/set-theory-basics|Set Theory Basics]] - subsets, intersections, and the operations behind the convex hull
- [[cs/machine-learning/loss-functions|Loss Functions]] - the objectives whose shape decides whether optimization is tractable
- [[cs/machine-learning/support-vector-machines|Support Vector Machines]] - a classifier posed as a constrained optimization problem

## Sources

- [Convex set (Wikipedia)](https://en.wikipedia.org/wiki/Convex_set) - the line-segment definition of convexity, the affine-combination form, the cube and crescent examples, invariance under affine transformations, and the convex hull as the smallest containing convex set.
- [Convex function (Wikipedia)](https://en.wikipedia.org/wiki/Convex_function) - the graph and epigraph definitions, the cup and cap picture, the second-derivative test, and the local-minimum-is-global and uniqueness results.
- [Convex optimization (Wikipedia)](https://en.wikipedia.org/wiki/Convex_optimization) - convex minimization's scope, the polynomial-time versus NP-hard contrast, the three listed properties, the Newton, gradient-descent, interior-point, and subgradient algorithms, and the application areas.
