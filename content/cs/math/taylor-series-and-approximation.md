---
title: Taylor Series and Approximation
description: "Rebuilding a function from its derivatives at a single point: Taylor polynomials, the remainder that bounds the error, and the truncations numerical code actually runs."
draft: false
comments: true
tags:
  - cs
  - math
  - algorithms
date: 2026-03-14
updated:
aliases:
  - taylor-series
  - taylor-polynomial
  - maclaurin-series
  - taylors-theorem
---

## A Function Rebuilt From One Point

Measure everything you can about a function at a single location, its value, its slope, its curvature, and every higher derivative, and that pile of numbers is enough to write down a polynomial. "In mathematical analysis, the Taylor series or Taylor expansion of a function is an infinite sum of terms that are expressed in terms of the function's derivatives at a single point." The ambition is worth pausing on: purely local data, extended into a formula meant to describe the function away from that point. "For most common functions, the function and the sum of its Taylor series are equal near this point."

For $f$ infinitely differentiable at $a$, the series is

$$f(a)+\frac{f'(a)}{1!}(x-a)+\frac{f''(a)}{2!}(x-a)^{2}+\cdots=\sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x-a)^{n}$$

Centering at zero earns the construction a second name: "a Taylor series is also called a Maclaurin series when 0 is the point where the derivatives are considered, after Colin Maclaurin, who made extensive use of this special case of Taylor series in the 18th century." The general method is attributed to Taylor, though not exclusively: "Taylor's theorem is named after Brook Taylor, who stated a version of it in 1715, although an earlier version of the result was already mentioned in 1671 by James Gregory."

Nothing evaluates an infinite sum. What machines evaluate is a prefix of it. "The partial sum formed by the first n + 1 terms of a Taylor series is a polynomial of degree n that is called the nth Taylor polynomial of the function." Those finite objects are the actual deliverable: "Taylor polynomials are approximations of a function, which become generally more accurate as n increases."

> [!note] The idea
> The useful object is not the infinite series, it is a truncation carrying a bound on what was discarded. "Taylor's theorem gives quantitative estimates on the error introduced by the use of such approximations," which converts an analytic identity into an engineering contract: pick a degree, get a polynomial you can evaluate with additions and multiplications, and get an explicit error term you can budget against. That contract is literal rather than metaphorical, and it predates electronic computing. Taylor's theorem "provided the mathematical basis for some landmark early computing machines: Charles Babbage's difference engine calculated sines, cosines, logarithms, and other transcendental functions by numerically integrating the first 7 terms of their Taylor series."

## The Remainder Carries the Guarantee

"The error incurred in approximating a function by its degree n Taylor polynomial is called the remainder and is denoted by the function Rn(x). Taylor's theorem can be used to obtain a bound on the size of the remainder." Written out, the theorem is an exact identity rather than an approximation:

$$f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(x-a)^{k}+R_{n}(x)$$

The base version of the theorem is qualitative, which is precisely the limitation that motivates the sharper forms. "It does not tell us how large the error is in any concrete neighborhood of the center of expansion, but for this purpose there are explicit formulas for the remainder term (given below) which are valid under some additional regularity assumptions on f."

The estimate that gets used in practice comes from bounding a single higher derivative. "Suppose that f is (k + 1)-times continuously differentiable in an interval I containing a. Suppose that there are real constants q and Q such that $q \leq f^{(k+1)}(x) \leq Q$ throughout I. Then the remainder term satisfies the inequality"

$$q\frac{(x-a)^{k+1}}{(k+1)!} \leq R_k(x) \leq Q\frac{(x-a)^{k+1}}{(k+1)!}$$

"if x > a, and a similar estimate if x < a. This is a simple consequence of the Lagrange form of the remainder."

Having an inequality rather than a limit statement is what makes the practical questions answerable, and the article names all three: estimate the error for a degree-$k$ polynomial on a given interval, find the smallest degree meeting a tolerance on a given interval, or find the largest interval on which a fixed degree meets a tolerance. Degree, interval, and accuracy are three knobs, and the remainder bound lets you solve for whichever one you did not fix.

> [!example]
> Set $k = 1$. The truncation is the linear approximation $f(a) + f'(a)(x-a)$, the derivative that needs bounding is $f''$, and with $q \leq f''(x) \leq Q$ across the interval the estimate reads
> $$q\frac{(x-a)^{2}}{2} \leq R_1(x) \leq Q\frac{(x-a)^{2}}{2}$$
> Error is controlled by the *square* of the distance from the center, so halving that distance cuts the bound to a quarter. That is the quantitative content behind the vague claim that a tangent line is a good approximation nearby, and it is the same squaring that shows up in [[derivatives-and-gradients|first-order methods]] when they are analyzed for how fast they improve.

## Convergence Is Not Accuracy

Two distinct questions get conflated constantly, and separating them is most of the value of this topic.

The first is whether the series describes the function at all. "A Taylor series is formed from the values of all derivatives of a function at a single point, but this does not by itself imply that the series converges to the function. In general, a Taylor series may fail to converge, or it may converge to a function different from the original one." Convergence itself is a matter of the remainder vanishing: the series "represents the function at a point precisely when the remainder terms in Taylor's theorem tend to zero at that point."

The second is whether the truncation is any good in the region you care about, and that is genuinely independent. "The radius of convergence should not be confused with the quality of approximation by a low-degree Taylor polynomial. A Taylor polynomial may approximate a function accurately near the center even if the full Taylor series has a small radius of convergence. Conversely, near the boundary of the interval or disk of convergence, the Taylor series may converge slowly. Outside the radius of convergence, the Taylor series does not represent the function." A small radius is not a verdict on a degree-3 approximation near the center, and a large radius is not a promise of fast convergence at the edge.

The functions with no such trouble anywhere have a name. "A function whose Taylor series converges to the function throughout the whole complex plane is called an entire function. Polynomials, the exponential function, and the sine and cosine functions are entire functions."

> [!warning]
> Smoothness does not rescue you. "In real analysis, infinite differentiability does not imply analyticity," and the counterexample is standard: the function equal to $e^{-1/x^{2}}$ for $x \neq 0$ and $0$ at the origin has a Taylor series at zero that "is therefore the zero series, even though the function itself is not identically zero. This gives a standard example of a non-analytic smooth function." The consequence for anyone tuning a numerical routine is blunt: "there are functions, even infinitely differentiable ones, for which increasing the degree of the approximating polynomial does not increase the accuracy of approximation." Adding terms is not a universally valid fix.

## Where Truncations Show Up in Computing

The general move is to keep the first few terms and discard the rest. "Taylor polynomials are used to approximate functions near a point. Keeping only the first nonzero terms often gives a simpler model of a more complicated expression. For example, the small-angle approximation $\sin x \approx x$ comes from the first term of the Taylor series for sine, and higher-order approximations are obtained by retaining more terms." The two lowest truncations are common enough to have their own labels: "the first-order Taylor polynomial is the linear approximation of the function, and the second-order Taylor polynomial is often referred to as the quadratic approximation."

Evaluating transcendental functions is the original application and still the everyday one. Taylor's theorem "gives simple arithmetic formulas to accurately compute values of many transcendental functions such as the exponential function and trigonometric functions," which is what a math library is doing when it returns a sine: arithmetic on a polynomial standing in for a function the hardware cannot compute directly.

The first-order truncation is not only an approximation, it is a complete algorithm. "In numerical analysis, the Newton–Raphson method, also known simply as Newton's method, named after Isaac Newton and Joseph Raphson, is a root-finding algorithm which produces successively better approximations to the roots (or zeroes) of a real-valued function." Its update step is the degree-1 Taylor polynomial solved for zero: "the improved guess, x1, is the unique root of the linear approximation of f at the initial guess, x0." The payoff is measured in digits, since for a simple root "the number of correct digits of the approximation roughly doubles with each additional step."

Why stop at first order? The question has been asked and answered by experiment. "Since higher-order Taylor expansions offer more accurate local approximations of a function f, it is reasonable to ask why Newton's method relies only on a second-order Taylor approximation. In the 19th century, Russian mathematician Pafnuty Chebyshev explored this idea by developing a variant of Newton's method that used cubic approximations." Higher order costs more derivatives per step, which is the tradeoff any numerical routine is implicitly making when it picks a truncation degree.

> [!tip]
> When you see a constant factor in a numerical routine that looks arbitrary, check whether it is a factorial from a discarded remainder term. Truncation degree is a design parameter, and the remainder inequality is how you defend the choice instead of tuning it by feel.

## Related Notes

- [[derivatives-and-gradients|Derivatives and Gradients]] - the derivatives at a single point that the whole expansion is built from
- [[sequences-and-series|Sequences and Series]] - partial sums, convergence, and the radius of convergence machinery
- [[limits-and-continuity|Limits and Continuity]] - the limit statements underneath convergence and the remainder going to zero
- [[integrals-and-the-fundamental-theorem|Integrals and the Fundamental Theorem]] - the integral form of the remainder and the continuous counterpart to summing terms
- [[convexity-and-optimization-basics|Convexity and Optimization Basics]] - where quadratic approximations get used to drive a search
- [[gradient-descent|Gradient Descent]] - a first-order method, meaning it keeps exactly one term past the constant

## Sources

- [Taylor series (Wikipedia)](https://en.wikipedia.org/wiki/Taylor_series) - the definition as an infinite sum of derivative terms, the Maclaurin special case, Taylor polynomials as partial sums, the remainder notation, the failure of a series to converge to its function, the non-analytic smooth counterexample, radius of convergence versus approximation quality, entire functions, and the small-angle application.
- [Taylor's theorem (Wikipedia)](https://en.wikipedia.org/wiki/Taylor%27s_theorem) - the 1715 attribution and Gregory's 1671 precedent, linear and quadratic approximation naming, the asymptotic nature of the base theorem, the explicit remainder inequality from bounding a higher derivative, the three practical error questions, transcendental function evaluation, and Babbage's difference engine.
- [Newton's method (Wikipedia)](https://en.wikipedia.org/wiki/Newton%27s_method) - the method as root-finding, the step as the root of the linear approximation, the doubling of correct digits at a simple root, and Chebyshev's cubic-approximation variant.
