---
title: Artificial Neural Networks
description: From the single perceptron to the multilayer network, and why stacking simple weighted-sum units is what lets neural networks represent functions a straight line never could.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-13
aliases:
  - multilayer-perceptron
  - feedforward-network
---

A neural network is built from one part repeated many times: a unit that multiplies each input by a weight, adds the results into a single number, and passes that number through a simple function. One such unit draws a straight line through the data and nothing more. The whole story of neural networks is what happens when you stack these units into layers, because the stack can represent shapes that no single unit ever could. That jump, from one line to arbitrary decision regions, is the foundation everything in [[cs/machine-learning/ai-vs-ml-vs-dl|deep learning]] stands on.

> [!note] The idea
> An artificial neural network is a layered composition of simple units. Each unit computes a weighted sum of its inputs, $\text{net} = \mathbf{w}^\top \mathbf{x} + b$, then applies a nonlinear [[cs/deep-learning/activation-functions|activation]] $f(\text{net})$. A single unit is a linear classifier. Feeding the outputs of one layer into the next builds a function that can approximate essentially any input-output mapping, which is what makes networks worth the trouble.

## The Unit

Start with the simplest version, the linear unit. It outputs $\hat{y} = \mathbf{w}^\top \mathbf{x} + b = w_1 x_1 + \dots + w_n x_n + b$, [[cs/math/vectors-and-dot-products|a plain weighted sum plus a bias]]. The weight vector $\mathbf{w}$ (a vector, in the sense of [[cs/math/linear-algebra-fundamentals]]) is the parameter set, and every choice of $\mathbf{w}$ is a different hypothesis. A common trick fixes a dummy input $x_0 = 1$ so the bias $b$ becomes just another weight $w_0$, and the whole thing collapses to $\sum_{i=0}^{n} w_i x_i$.

Add a threshold and you get the linear threshold unit, the classic perceptron: output $+1$ if $\mathbf{w}^\top \mathbf{x} + b > 0$ and $-1$ otherwise. Frank Rosenblatt introduced the perceptron in a 1958 paper and built the Mark I Perceptron, a physical machine designed for image recognition, first demonstrated publicly in 1960. The weighted sum defines a hyperplane, and the unit reports which side of it an input falls on.

![A perceptron unit: inputs times weights, summed, then passed through an activation to produce an output](cs/deep-learning/assets/perceptron-unit.svg)

## What One Unit Can and Cannot Do

Because a threshold unit is a hyperplane, it can only separate classes that a hyperplane can separate. Those are the linearly separable problems. [[cs/math/boolean-algebra|Logical AND]] is one of them: with $w_1 = 1$, $w_2 = 1$, and $b = -\tfrac{3}{2}$, the unit fires only when both inputs are 1, which is exactly AND. Plenty of useful functions have this form.

XOR does not. No single straight line puts $(0,1)$ and $(1,0)$ on one side and $(0,0)$ and $(1,1)$ on the other. Marvin Minsky and Seymour Papert made this limitation precise in their 1969 book *Perceptrons*, and the result stalled neural network research for years. The lesson was not that the perceptron was useless, but that a single unit is fundamentally too weak, so you need networks of units.

Training a single perceptron is simple. The perceptron training rule nudges each weight toward reducing the error on the current example:

$$w_j \leftarrow w_j + \eta \, (y - \hat{y}) \, x_j$$

where $\eta$ is a small learning rate. If the true label exceeds the prediction, push the weights up along $x_j$, otherwise push them down. This rule is guaranteed to converge to a separating hyperplane, but only if the data is linearly separable and $\eta$ is small enough. On XOR it never settles, because no solution exists for it to find.

## Stacking Units Into Layers

The way out of the XOR trap is to add a layer. Take two threshold units that each draw a line, and use their outputs as new coordinates $z_1, z_2$. In that new space the points that were tangled together become linearly separable, and a third unit can finish the job with a single hyperplane. The hidden layer has remapped the inputs into a representation where the problem is easy.

This is a two-layer feedforward network, also called a multilayer perceptron. Signals flow one direction, from inputs through one or more hidden layers to the outputs, with no loops. Each hidden unit learns a feature, and later layers combine features into more useful features. That composition of simple functions is precisely the mechanism the [[cs/history/deep-learning-revolution]] scaled up: with two hidden layers of threshold units you can carve out any union of intersections of halfspaces, which covers arbitrarily complicated decision regions.

## What Networks Can Represent

The theoretical backing is the universal approximation theorem. George Cybenko proved in 1989 that a feedforward network with a single hidden layer of sigmoidal units can approximate [[cs/math/limits-and-continuity|any continuous function on a bounded domain]] to any desired accuracy. Kurt Hornik sharpened this in 1991, showing the power comes from the multilayer architecture itself rather than the specific activation function chosen.

Read that result carefully, because it is easy to oversell. It is an existence theorem. It promises that a network with the right weights exists, but says nothing about how to find those weights (that job belongs to [[cs/deep-learning/backpropagation]] and [[cs/machine-learning/gradient-descent]]), and it may demand an impractically large hidden layer. A network that can represent a function is not the same as one you can train to compute it, and a big enough network can also overfit, which is why regularization matters. Representational power is the license to try, not a guarantee of success.

> [!example]
> Build AND as a single threshold unit with weights $w_1 = 1$, $w_2 = 1$, bias $b = -\tfrac{3}{2}$, firing when $w_1 x_1 + w_2 x_2 + b > 0$.
>
> | $x_1$ | $x_2$ | $\text{net} = x_1 + x_2 - 1.5$ | output |
> |---|---|---|---|
> | 0 | 0 | $-1.5$ | 0 |
> | 0 | 1 | $-0.5$ | 0 |
> | 1 | 0 | $-0.5$ | 0 |
> | 1 | 1 | $+0.5$ | 1 |
>
> One line does AND perfectly. Try the same for XOR and you will fail: the four points cannot be split by any single line, so XOR needs a hidden layer to first remap the inputs into a separable space.

## Related Notes

- [[cs/deep-learning/backpropagation]] is how a multilayer network actually learns its weights
- [[cs/deep-learning/activation-functions]] are the nonlinearities that give a stacked network its power
- [[cs/machine-learning/gradient-descent]] is the optimizer that the training rule generalizes to
- [[cs/machine-learning/loss-functions]] define the error the network is trained to reduce
- [[cs/math/linear-algebra-fundamentals]] for weights and inputs as vectors and the weighted sum as a dot product
- [[cs/history/deep-learning-revolution]] on how scaling these networks changed the field
- [[cs/machine-learning/ai-vs-ml-vs-dl]] for where neural networks sit in the bigger picture

## Sources

- https://en.wikipedia.org/wiki/Perceptron (Rosenblatt's 1958 perceptron, the Mark I Perceptron machine for image recognition, and convergence only on linearly separable data)
- https://en.wikipedia.org/wiki/Perceptrons_%28book%29 (Minsky and Papert, 1969: a single perceptron cannot represent XOR)
- https://en.wikipedia.org/wiki/Linear_separability (linearly separable classes and the separating hyperplane a threshold unit defines)
- https://en.wikipedia.org/wiki/Feedforward_neural_network (feedforward architecture: signals flow input to output with no cycles)
- https://en.wikipedia.org/wiki/Multilayer_perceptron (the multilayer perceptron as a stack of units with nonlinear activations)
- https://en.wikipedia.org/wiki/Universal_approximation_theorem (Cybenko 1989 and Hornik 1991; existence theorems that do not tell you how to find the weights)
- https://www.deeplearningbook.org/contents/mlp.html (Goodfellow, Bengio, Courville, *Deep Learning*, ch. 6: deep feedforward networks)
- https://cs231n.github.io/neural-networks-1/ (Stanford CS231n: neurons as weighted sums plus a nonlinearity, layered into networks)
- Course framing: CSCE 479/879 (Stephen Scott, UNL), "Basic Artificial Neural Networks" lecture slides
