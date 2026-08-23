---
title: Derivatives and Gradients
description: "Slope in one dimension, steepest ascent in many: how the derivative becomes the gradient and why negating it is the whole of gradient descent."
draft: false
comments: true
tags:
  - cs
  - math
  - optimization
date: 2026-06-15
updated:
aliases:
  - gradient
  - partial-derivative
  - derivative
---

## Slope, Made Precise

The derivative answers a question you already have an instinct for: if I nudge the input a little, how much does the output move, and in which direction? Formally, the derivative "quantifies the sensitivity to change of a function's output with respect to its input," and at a single point it "is the slope of the tangent line to the graph of the function at that point." Steep graph, large derivative; flat graph, derivative near zero. It is "often described as the instantaneous rate of change," the limiting slope you get as you shrink the gap between two points on the curve to nothing. That limiting step is why derivatives rest on [[limits-and-continuity|limits]].

> [!note] The idea
> Optimization on a computer is derivative-following. The derivative is the local slope, the gradient is that same slope generalized to many inputs, and the gradient "plays a fundamental role in optimization theory, machine learning, and artificial intelligence, where it is used to minimize a function by gradient descent." The non-obvious part is that a purely *local* quantity, the slope right where you stand, is enough to train a model with millions of parameters: you never need to see the whole loss surface, only the slope under your feet.

## From One Input to Many: Partial Derivatives

A model's loss depends on many parameters at once, so a single slope is not enough. The fix is to vary one input while freezing the rest. A partial derivative "is its derivative with respect to one of those variables, with the others held constant." Written $\frac{\partial f}{\partial x_i}$, it measures the slope of $f$ along the $x_i$ axis alone, ignoring how the other inputs might move. Compute one for each input and you have a full set of directional slopes, one per axis. Collecting them is the next step.

## The Gradient: All the Slopes at Once

Stack every partial derivative into a vector and you get the gradient:

$$\nabla f = \left( \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, \dots, \frac{\partial f}{\partial x_n} \right)$$

Its two properties are what make it the central object of ML. First, direction: the gradient points the way the function increases fastest. On a landscape whose height is $H(x, y)$, "the gradient of $H$ at a point is a plane vector pointing in the direction of the steepest slope or grade at that point." Second, magnitude: "the magnitude of the gradient is the rate of increase in that direction, the greatest absolute directional derivative." So the gradient says more than "uphill is that way," it also says "and this steeply."

The gradient also measures the slope in *any* direction, not only the steepest, through a [[vectors-and-dot-products|dot product]]. Project the gradient onto a unit vector along the direction you care about and you get the slope along that path. The Wikipedia hill example makes it concrete: if the steepest slope is 40% and a road runs at 60° from straight uphill, "the slope along the road will be the dot product between the gradient vector and a unit vector along the road, which is 40% times the cosine of 60°, or 20%." Angle away from steepest and the climb gets gentler by exactly $\cos\theta$.

> [!example]
> Let $f(x, y) = x^2 + 3y^2$. The partials are $\frac{\partial f}{\partial x} = 2x$ and $\frac{\partial f}{\partial y} = 6y$, so $\nabla f = (2x, 6y)$. At the point $(1, 1)$ the gradient is $(2, 6)$: the function rises fastest in the direction $(2, 6)$, roughly three times steeper along $y$ than along $x$, which matches the $3y^2$ term. At the minimum $(0, 0)$ the gradient is $(0, 0)$, the flat spot where every partial vanishes.

## Why Gradient Descent Just Negates It

If the gradient points toward the steepest *increase*, then its negative points toward the steepest *decrease*. To minimize a loss $J(\mathbf{w})$, step against the gradient:

$$\mathbf{w} \leftarrow \mathbf{w} - \eta \, \nabla J(\mathbf{w})$$

where $\eta$ is the learning rate controlling step size. That single line, repeated, is [[cs/machine-learning/gradient-descent|gradient descent]], the optimizer under nearly all of machine learning and [[cs/machine-learning/ai-vs-ml-vs-dl|deep learning]]. Each step reads the local slope and moves downhill; the process halts near a point where the gradient is the zero vector, "known as a stationary point." The reason the whole enterprise works is the reason stated in the payload: the gradient is local, cheap to compute by backpropagation, and yet its negation is always the locally best direction to reduce error.

> [!warning]
> A zero gradient marks a stationary point, not necessarily a minimum. It could be a maximum, a saddle, or a plateau. The derivative sees only the immediate neighborhood, so gradient descent can settle into a local minimum or crawl across a flat region while a lower valley sits elsewhere on the surface. This locality is the same strength (cheap, no global view needed) and weakness (no guarantee of the global optimum) at once.

## Related Notes

- [[cs/machine-learning/gradient-descent|Gradient Descent]] - the optimizer that steps opposite the gradient to minimize a loss
- [[limits-and-continuity|Limits and Continuity]] - the limit of a difference quotient is what defines the derivative
- [[vectors-and-dot-products|Vectors and Dot Products]] - the directional derivative is the gradient dotted with a unit direction
- [[cs/machine-learning/loss-functions|Loss Functions]] - the surfaces whose gradients training actually descends

## Sources

- [Derivative (Wikipedia)](https://en.wikipedia.org/wiki/Derivative) - the derivative as sensitivity to change, the slope of the tangent line, and the instantaneous rate of change.
- [Partial derivative (Wikipedia)](https://en.wikipedia.org/wiki/Partial_derivative) - the derivative with respect to one variable while the others are held constant.
- [Gradient (Wikipedia)](https://en.wikipedia.org/wiki/Gradient) - the gradient as direction of steepest ascent, its magnitude as the greatest rate of increase, the dot-product directional slope, and its role in gradient descent.
