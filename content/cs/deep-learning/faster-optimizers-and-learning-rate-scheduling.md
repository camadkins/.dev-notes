---
title: Faster Optimizers and Learning Rate Scheduling
description: The update rules that train deep nets in practice. Momentum, AdaGrad, RMSProp, and Adam as successive fixes to plain SGD, plus how to schedule the learning rate that all of them share.
draft: false
comments: true
tags:
  - cs
  - deep-learning
  - training
  - optimization
date: 2026-07-23
updated:
aliases:
  - Faster Optimizers
  - Adam Optimizer
  - Learning Rate Scheduling
---

[[gradient-descent|Gradient descent]] introduces the optimizer family at a glance: momentum, AdaGrad, RMSProp, Adam, each a tweak to how the step is taken. This note is the level Géron's Chapter 11 and the CSCE 479/879 lectures actually work at, the update rules written out, because for deep networks the choice of optimizer and the schedule of its learning rate are among the highest-leverage decisions you make. Plain stochastic gradient descent trains a deep net eventually; the right optimizer trains it in a fraction of the steps.

The reason these exist is that the raw gradient is a poor guide on the [[cs/math/convexity-and-optimization-basics|loss surfaces]] deep networks produce. Those surfaces have long narrow ravines where SGD zig-zags across the walls instead of moving down the floor, and vast plateaus where the gradient is tiny and progress crawls. Each optimizer below is a specific fix for one of those pathologies, and they stack into Adam.

> [!note] The idea
> Every optimizer here is still gradient descent: compute the gradient, step against it, repeat. What changes is how the step is shaped. Momentum adds memory of past gradients so persistent directions build speed. AdaGrad and RMSProp give each parameter its own learning rate scaled by how large its gradients have been. Adam combines the two. On top of all of them sits one shared knob, the learning rate, and scheduling it, high early and low late, is often worth as much as the optimizer choice itself.

## Momentum: give the step memory

Plain SGD forgets everything between steps; each update sees only the current gradient. Momentum keeps a running average of past gradients and steps along that instead:

$$\mathbf{m} \leftarrow \beta\,\mathbf{m} + \eta\,\nabla J(\boldsymbol{\theta}), \qquad \boldsymbol{\theta} \leftarrow \boldsymbol{\theta} - \mathbf{m}$$

The momentum term $\beta$ (typically around 0.9) controls how much history carries forward. Persistent directions accumulate and the optimizer picks up speed along the ravine floor, while oscillations across the walls cancel out. Sutskever and colleagues showed in 2013 that this is not a minor speedup: with good initialization and well-tuned momentum, first-order methods reach a level of performance on deep and recurrent networks previously thought to require far more expensive second-order methods, and networks trained without momentum did markedly worse. Momentum is what lets SGD cross plateaus and roll through small local dips.

A refinement called Nesterov accelerated gradient sharpens the correction. Instead of measuring the gradient at the current position, it measures it slightly ahead, at the point where the accumulated momentum is about to carry the parameters, and uses that look-ahead gradient in the update. The extra accuracy usually converges a little faster and overshoots less. Sutskever's 2013 result was specifically about this look-ahead form of momentum, which is why the paper's headline is that carefully tuned momentum methods, the look-ahead form included, can stand in for second-order optimization.

## AdaGrad: a learning rate per parameter

Momentum shapes the direction; AdaGrad shapes the size, separately for every parameter. It accumulates the square of each parameter's gradients and divides the step by the square root of that running total:

$$\mathbf{s} \leftarrow \mathbf{s} + \nabla J \otimes \nabla J, \qquad \boldsymbol{\theta} \leftarrow \boldsymbol{\theta} - \eta\,\nabla J \oslash \sqrt{\mathbf{s} + \epsilon}$$

Parameters that have seen large gradients get their learning rate scaled down; parameters that have seen small ones keep a large rate. Duchi, Hazan, and Singer, who introduced it in 2011, framed the payoff for sparse data: frequently occurring features get small learning rates and rare but informative features get large ones, which lets the optimizer "find needles in haystacks" of predictive but seldom-seen features. Its weakness on deep networks is built into the formula: $\mathbf{s}$ only grows, so the effective learning rate keeps shrinking and can stall before reaching a good minimum.

## RMSProp: forget the distant past

RMSProp fixes AdaGrad's one flaw by making the accumulator forget. Instead of summing all past squared gradients, it keeps an exponentially decaying average:

$$\mathbf{s} \leftarrow \beta\,\mathbf{s} + (1 - \beta)\,\nabla J \otimes \nabla J$$

Old gradients fade, so the effective learning rate no longer marches to zero, and the per-parameter adaptation tracks the recent geometry of the surface rather than the whole history. This one change is what makes adaptive learning rates practical for neural networks. RMSProp was never published in a paper; it is commonly credited to an unpublished lecture by Geoffrey Hinton, and it survives because it works, appearing as a built-in optimizer in every major framework.

## Adam: momentum meets RMSProp

Adam, adaptive moment estimation, is the combination that became the default. It keeps momentum's running average of the gradient (the first moment $\mathbf{m}$) and RMSProp's running average of the squared gradient (the second moment $\mathbf{s}$), corrects both for their initialization bias toward zero, and uses them together for the step. Kingma and Ba, in the 2014 paper, describe it as computing individual adaptive learning rates from estimates of the first and second moments, combining the advantages of AdaGrad and RMSProp, being computationally efficient with little memory, and needing little tuning. The standard hyperparameters, $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$, work across a wide range of problems, which is much of why Adam is the first thing most people reach for.

## Learning rate scheduling: the knob above all of them

Every optimizer here shares one hyperparameter, and it is the most important one: the learning rate $\eta$. Too high and training diverges; too low and it crawls. The insight of scheduling is that the best rate is not constant. A large rate early makes fast progress across the surface, and a small rate late settles precisely into a minimum. Common schedules include power and [[cs/math/logarithms-and-exponentials|exponential decay]] (for example $\eta_0 \cdot 0.1^{t/s}$, dropping by a factor every $s$ steps), performance scheduling (cut the rate when the [[cs/machine-learning/train-validation-test|validation loss]] stops improving), and the 1cycle policy. Keras exposes these as learning-rate schedule objects such as `ExponentialDecay`, `PiecewiseConstantDecay`, and `CosineDecay`, which you pass in place of a fixed rate.

The 1cycle policy is worth naming on its own. Smith's super-convergence work raises the learning rate to a large value and then lowers it, all within a single cycle, and reports training an order of magnitude faster than standard schedules on several benchmarks, with the high mid-cycle rate acting as a regularizer that lets you dial back other regularization. Scheduling the shared learning rate well is frequently worth as much as upgrading the optimizer underneath it.

> [!warning] Adam is a strong default, not a free lunch
> Reaching for Adam and forgetting the learning rate is the common mistake. Adam adapts a per-parameter scale, but the global learning rate you set still gates everything, and a good schedule on plain SGD-with-momentum sometimes generalizes better than default Adam. The practical order: start with Adam to get training moving, then, if the final model matters, try SGD-with-momentum plus a real schedule and compare. The optimizer and the schedule are two dials, and tuning only one leaves performance on the table.

## Related Notes

- [[gradient-descent|Gradient Descent]] - the base loop and the one-line tour of this same family, from the machine-learning side
- [[vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]] - initialization sets the surface up; the optimizer takes the steps across it
- [[backpropagation|Backpropagation]] - the algorithm that produces the gradient each optimizer consumes
- [[regularization-in-deep-learning|Regularization in Deep Learning]] - early stopping and the regularizing side effect of a high mid-cycle learning rate
- [[artificial-neural-networks|Artificial Neural Networks]] - the deep networks whose loss surfaces make these optimizers necessary

## Sources

- Ilya Sutskever, James Martens, George Dahl, and Geoffrey Hinton, "On the importance of initialization and momentum in deep learning," ICML 2013 (PMLR v28). https://proceedings.mlr.press/v28/sutskever13.html . Supports momentum (and Nesterov's variant) with good initialization letting first-order methods train deep and recurrent networks to a level previously thought to need second-order methods, and networks performing markedly worse without well-tuned momentum.
- John Duchi, Elad Hazan, and Yoram Singer, "Adaptive Subgradient Methods for Online Learning and Stochastic Optimization," JMLR 2011. https://www.jmlr.org/papers/v12/duchi11a.html . Supports AdaGrad adapting a per-parameter learning rate from the geometry of past gradients, giving frequent features small rates and rare features large rates, and being well suited to sparse, highly predictive features.
- Diederik Kingma and Jimmy Ba, "Adam: A Method for Stochastic Optimization," 2014. https://arxiv.org/abs/1412.6980 . Supports Adam computing individual adaptive learning rates from first- and second-moment estimates of the gradient, combining AdaGrad and RMSProp, being computationally efficient with little memory, needing little tuning, and the standard hyperparameters (learning rate, $\beta_1$, $\beta_2$).
- Leslie N. Smith and Nicholay Topin, "Super-Convergence: Very Fast Training of Neural Networks Using Large Learning Rates," 2017. https://arxiv.org/abs/1708.07120 . Supports the 1cycle policy (raise then lower the learning rate within one cycle) enabling training an order of magnitude faster on standard benchmarks, with the large mid-cycle rate acting as regularization.
- "Optimizers," Keras 3 API documentation. https://keras.io/api/optimizers/ . Supports the available optimizers (SGD with momentum, RMSprop, Adam, AdamW, Adagrad, Nadam) and the learning-rate schedule objects (`ExponentialDecay`, `PiecewiseConstantDecay`, `CosineDecay`) passed in place of a fixed learning rate.
