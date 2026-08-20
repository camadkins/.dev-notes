---
title: Limits and Continuity
description: "What it means to get arbitrarily close: the limit concept, continuity as no abrupt jumps, and why both sit underneath every derivative and every convergence proof."
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-07-08
updated:
aliases:
  - limit
  - continuity
  - epsilon-delta
---

## Getting Arbitrarily Close

Calculus is built on a single idea that sounds almost too simple to matter: you can talk rigorously about what a function is *approaching* without ever reaching it. The limit "is a fundamental concept in calculus and analysis concerning the behavior of that function near a particular input which may or may not be in the domain of the function." That last clause is the surprise. A function can have a perfectly definite limit at a point where it is undefined or misbehaves, because a limit is about the neighborhood, not the point itself.

> [!note] The idea
> A limit replaces "what is the value here" with "what value is forced by every path leading in." The function "has a limit $L$ at an input $p$, if $f(x)$ gets closer and closer to $L$ as $x$ moves closer and closer to $p$." That reframing is what makes both the [[derivatives-and-gradients|derivative]] (a limit of slopes) and the notion of convergence (a limit of a sequence) precise. Without it, "instantaneous rate of change" and "the algorithm converges" would be hand-waving.

## The Limit, Stated Carefully

The informal version is a squeeze: "the output value can be made arbitrarily close to $L$ if the input to $f$ is taken sufficiently close to $p$." The formal version pins down "arbitrarily" and "sufficiently" with two quantities. For every tolerance $\varepsilon > 0$ on the output, there must exist a tolerance $\delta > 0$ on the input such that whenever $0 < |x - p| < \delta$, it follows that $|f(x) - L| < \varepsilon$. You name how close to $L$ you demand; the limit guarantees a band around $p$ that delivers it.

The condition is strict. "If some inputs very close to $p$ are taken to outputs that stay a fixed distance apart, then we say the limit does not exist." A function that jumps between two values as you approach $p$, or oscillates without settling, has no limit there. Both one-sided approaches have to agree on the same $L$.

This epsilon-delta machinery is not ancient. It "goes back to Bernard Bolzano who, in 1817, introduced the basics of the epsilon-delta technique" to put continuity on a firm footing, long after Newton and Leibniz had been computing with limits informally.

## Continuity: No Abrupt Jumps

Continuity is the limit concept turned into a property of a whole function. "A continuous function is a function such that a small variation of its argument induces at most a small variation of its value. This implies there are no abrupt changes in value, known as discontinuities." Nudge the input a little and the output moves only a little, everywhere, with no tears in the graph.

Formally, $f$ is continuous at $p$ when three things hold together: $f(p)$ is defined, the limit as $x \to p$ exists, and the two are equal. The limit does the heavy lifting, which is exactly why the history runs this direction: "the epsilon-delta definition of a limit was introduced to formalize the definition of continuity."

> [!example]
> The height of a growing flower, $H(t)$, is continuous: it never teleports, so between any two heights it passes through every value in between. A bank balance $M(t)$ is not. It "would be considered discontinuous since it 'jumps' at each point in time when money is deposited or withdrawn." The flower is calculus-friendly; the balance is a step function, and the step is precisely where the limit from the left and the limit from the right disagree.

## Why CS Rests on Both

Two loads sit on this foundation.

The derivative is defined *as* a limit. The slope of a tangent is the limiting value of the slope of a secant line as the two points merge:

$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$

That quotient is undefined at $h = 0$ (division by zero), which is the whole reason limits exist: they extract the value the expression is heading toward without ever plugging in the forbidden point. A function has to be continuous at a point to be differentiable there, so continuity is the entry ticket to the [[gradient-descent|gradient-based]] optimization that trains models.

The second load is convergence. An iterative method converges when the sequence of its outputs has a limit, and the same epsilon-delta logic (for every tolerance, eventually the iterates stay within it) is what "the algorithm converges to the answer" actually means. Whether it is Newton's method, a fixed-point iteration, or gradient descent settling near a minimum, the guarantee is a statement about a limit.

> [!warning]
> Continuity does not imply differentiability. A function can be continuous everywhere yet have sharp corners where no single tangent slope exists, and the ReLU activation used across neural networks is exactly this case: continuous but with a kink at zero where the derivative is undefined. Frameworks paper over it by assigning a subgradient at the corner. Continuity buys you "no jumps," not "smooth."

## Related Notes

- [[derivatives-and-gradients|Derivatives and Gradients]] - the derivative is the limit of a difference quotient
- [[gradient-descent|Gradient Descent]] - convergence is a statement that the sequence of iterates has a limit
- [[functions-injective-surjective-bijective|Functions: Injective, Surjective, Bijective]] - the function machinery limits and continuity are properties of
- [[asymptotic-notation|Asymptotic Notation]] - limiting behavior of growth rates as input size goes to infinity

## Sources

- [Limit of a function (Wikipedia)](https://en.wikipedia.org/wiki/Limit_of_a_function) - the limit as behavior near a point that may not be in the domain, the closer-and-closer definition, the non-existence condition, and Bolzano's 1817 epsilon-delta technique.
- [Continuous function (Wikipedia)](https://en.wikipedia.org/wiki/Continuous_function) - continuity as small input changes causing small output changes with no abrupt jumps, the flower-versus-bank-account example, and the epsilon-delta formalization of continuity.
