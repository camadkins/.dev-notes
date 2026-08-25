---
title: Integrals and the Fundamental Theorem
description: "The integral as accumulation, and the theorem that turns an infinite sum into a subtraction of two numbers."
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-03-11
updated:
aliases:
  - integral
  - definite-integral
  - fundamental-theorem-of-calculus
---

## Accumulation, Not Area

Area is the picture, accumulation is the idea. An integral "is the continuous analog of a sum, and is used to calculate areas, volumes, and their generalizations." Anywhere a quantity builds up continuously rather than in discrete ticks, an integral is the running total: total distance from a velocity curve, total energy from a power curve, [[cs/statistics/probability-distributions|total probability mass]] from a density. Integration "is one of the two fundamental operations of calculus, along with differentiation," and the two turn out to be the same operation read backwards.

The concrete version is the definite integral, which "computes the signed area of the region in the plane that is bounded by the graph of a given function between two points in the real line." Signed matters: "areas above the horizontal axis of the plane are positive while areas below are negative," so a velocity that goes negative subtracts from the accumulated displacement rather than adding to it.

> [!note] The idea
> The fundamental theorem is a computational shortcut of absurd leverage. It "relates definite integration to differentiation and provides a method to compute the definite integral of a function when its antiderivative is known; differentiation and integration are inverse operations." The non-obvious consequence for anyone writing numerical code: an exact integral costs two function evaluations when an antiderivative exists, and an unbounded number of them when it does not. Whether your program runs a closed-form expression or a quadrature loop is decided entirely by whether the theorem applies, and by whether a symbolic algorithm can find the antiderivative at all.

## Where the Definition Comes From

Newton and Leibniz "thought of the area under a curve as an infinite sum of rectangles of infinitesimal width," which is the right intuition and the wrong level of rigor. The repair came later: "Bernhard Riemann later gave a rigorous definition of integrals, which is based on a limiting procedure that approximates the area of a curvilinear region by breaking the region into infinitesimally thin vertical slabs." That limiting procedure is why the integral, like the derivative, is built on [[cs/math/limits-and-continuity|limits]].

Riemann's construction is also the reason the definition transfers so cleanly into code. It is literally a sum over a partition, then a limit. Delete the limit and you have a loop.

## The Theorem, in Two Halves

The fundamental theorem "links the concept of differentiating a function (calculating its slopes, or rate of change at every point on its domain) with the concept of integrating a function (calculating the area under its graph, or the cumulative effect of small contributions)."

The first half builds an antiderivative out of an integral. "Let f be a continuous real-valued function defined on a closed interval [a, b]" and define

$$F(x) = \int_a^x f(t)\, dt$$

Then F "is uniformly continuous on [a, b] and differentiable on the open interval (a, b)," with $F'(x) = f(x)$ "for all x in (a, b) so F is an antiderivative of f." Accumulate a function, differentiate the accumulation, and you get the function back.

The second half runs the other direction and is the one you actually compute with: "the integral of a function f over a fixed interval is equal to the change of any antiderivative F between the ends of the interval."

$$\int_a^b f(x)\, dx = F(b) - F(a)$$

An infinite summing process collapses to one subtraction. This "greatly simplifies the calculation of a definite integral provided an antiderivative can be found by symbolic integration, thus avoiding numerical integration."

Historically the linkage, not the two operations, was the discovery. "The first published statement and proof of a rudimentary form of the fundamental theorem, strongly geometric in character, was by James Gregory (1638-1675)." "Isaac Barrow (1630-1677) proved a more generalized version of the theorem, while his student Isaac Newton (1642-1727) completed the development of the surrounding mathematical theory."

## When the Shortcut Fails: Two Branches in Computing

The proviso in that sentence, "provided an antiderivative can be found," is where computer science enters, and it splits into two research programs.

**Symbolic integration** tries to find the antiderivative mechanically. It "has been one of the motivations for the development of the first such systems, like Macsyma and Maple." The decision procedure is real: "the Risch algorithm provides a general criterion to determine whether the antiderivative of an elementary function is elementary and to compute the integral if is elementary," and it is "implemented in Mathematica, Maple and other computer algebra systems ... for functions and antiderivatives built from rational functions, radicals, logarithm, and exponential functions." Rule-based integrators take the other route: Rubi "uses over 6600 integration rules to compute integrals."

**Numerical integration** gives up on the antiderivative and approximates the sum directly. "The rectangle method relies on dividing the region under the function into a series of rectangles corresponding to function values and multiplies by the step width to find the sum. A better approach, the trapezoidal rule, replaces the rectangles used in a Riemann sum with trapezoids." Push the idea further and you get Simpson's rule, which "approximates the integrand by a piecewise quadratic function." These are not ad hoc tricks but one family: "Riemann sums, the trapezoidal rule, and Simpson's rule are examples of a family of quadrature rules called the Newton-Cotes formulas."

Dimension breaks the whole family. "The computation of higher-dimensional integrals (for example, volume calculations) makes important use of such alternatives as Monte Carlo integration," which is why [[cs/statistics/expected-value|high-dimensional expectations]] in graphics, physics simulation, and machine learning [[cs/military-computing/monte-carlo-method-and-the-bomb|get sampled]] rather than gridded.

> [!example]
> Take $f(x) = x^2$ on $[0, 3]$. An antiderivative is $F(x) = x^3/3$, so the second part of the theorem gives $\int_0^3 x^2 dx = F(3) - F(0) = 9 - 0 = 9$. Exact, two evaluations, no loop.
>
> Now approximate the same integral with the trapezoidal rule at step width 1, using the values $f(0)=0$, $f(1)=1$, $f(2)=4$, $f(3)=9$. Weighting the endpoints by one half gives $0/2 + 1 + 4 + 9/2 = 9.5$. Off by 0.5 at this coarse spacing, and shrinking the step is the only lever you have. That gap, exact versus arbitrarily-close, is the practical content of the theorem.

> [!warning]
> Both branches have hard limits. On the symbolic side, "functions with closed expressions of antiderivatives are the exception, and consequently, computerized algebra systems have no hope of being able to find an antiderivative for a randomly constructed elementary function." On the numerical side, more accuracy is not free: "higher degree Newton-Cotes approximations can be more accurate, but they require more function evaluations, and they can suffer from numerical inaccuracy due to Runge's phenomenon." Neither branch is a general solution, which is why numerical libraries ship a menu of quadrature routines rather than one.

## Related Notes

- [[cs/math/limits-and-continuity|Limits and Continuity]] - the limiting procedure Riemann used to define the integral rigorously
- [[cs/math/derivatives-and-gradients|Derivatives and Gradients]] - the operation the fundamental theorem inverts
- [[cs/statistics/expected-value|Expected Value]] - a continuous expectation is an integral against a density
- [[cs/math/sequences-and-series|Sequences and Series]] - the discrete sibling of continuous accumulation

## Sources

- [Integral (Wikipedia)](https://en.wikipedia.org/wiki/Integral) - the integral as continuous analog of a sum, signed area, Riemann's limiting definition, symbolic integration and the Risch algorithm, and the Newton-Cotes and Monte Carlo numerical methods.
- [Fundamental theorem of calculus (Wikipedia)](https://en.wikipedia.org/wiki/Fundamental_theorem_of_calculus) - the statement of both parts, the hypotheses on f and F, and the Gregory, Barrow, and Newton history.
