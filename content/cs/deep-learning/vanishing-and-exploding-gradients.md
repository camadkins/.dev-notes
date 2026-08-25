---
title: Vanishing and Exploding Gradients
description: Why deep networks stopped training, and the fixes that let them go deep again. Saturation, the variance argument behind Glorot and He initialization, batch norm's role in gradient flow, and clipping.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-23
updated:
aliases: []
---

Stacking layers is supposed to make a network more powerful. For years it did the opposite: past a handful of layers, training stalled. The culprit is what happens to the gradient on its way back through the network. [[cs/deep-learning/backpropagation|Backpropagation]] computes each weight's gradient by multiplying together the local derivatives of every layer between that weight and the loss. Multiply many numbers smaller than one and [[cs/standards/ieee-754-floating-point|the product heads toward zero]]; multiply many numbers larger than one and it explodes. Either way, the layers far from the output get a gradient that is useless, and the network cannot learn. This note is about why that happens and the small set of ideas that fixed it, the content of Géron's Chapter 11 and the training half of the CSCE 479/879 course.

> [!note] The idea
> A gradient flowing back through a deep network is a long product of per-layer terms. If those terms are systematically below one, the gradient vanishes and early layers stop learning; if above one, it explodes and training diverges. The fix is to keep the variance of activations and gradients roughly constant from layer to layer, which comes down to three levers: the right activation (nonsaturating), the right initial weight scale (Glorot or He), and normalization that re-centers each layer's inputs during training. Get the variances near one and depth becomes trainable.

## Why the gradient dies: saturation and scale

Two things push the per-layer terms away from one. The first is a saturating activation. The [[cs/deep-learning/activation-functions|sigmoid]] flattens out for inputs far from zero, so its derivative there is nearly zero; a neuron driven into that flat region passes almost no gradient backward. Glorot and Bengio, in their 2010 analysis of why deep networks were so hard to train, showed the logistic sigmoid is especially bad for this because its nonzero mean tends to drive the top hidden layer into saturation early. The second is the scale of the initial weights. If weights start too small, the signal shrinks layer by layer on the way forward and the gradient shrinks on the way back; too large and both blow up. Their diagnosis was precise: training goes wrong when the transformation each layer applies has [[cs/math/singular-value-decomposition|singular values]] far from one, so activation and gradient magnitudes drift as they propagate.

## Glorot and He initialization: keep the variance at one

The fix Glorot and Bengio proposed is to choose the initial weight scale so that the variance of the outputs equals the variance of the inputs, and the same for gradients flowing backward. Their normalized initialization, now called Xavier or Glorot initialization, sets the spread of the initial weights from the number of inputs and outputs of each layer, and it produced substantially faster convergence on networks that had trained poorly before. The principle is the whole point: initialize so that signal and gradient variance stay near one across depth.

Glorot's derivation assumed a symmetric activation like tanh. ReLU is not symmetric (it zeroes every negative input), so it needs a different constant. He and colleagues supplied it in 2015, deriving an initialization for rectifier networks, now called He or Kaiming initialization. In their words it enabled training extremely deep rectified models directly from scratch, the models that had previously refused to converge, and the resulting networks were the first to surpass human-level performance on the ImageNet classification benchmark. The rule of thumb that comes out of this: use He initialization with ReLU and its relatives, Glorot initialization with tanh or sigmoid. The choice of initializer is not a minor default; it is what decides whether a deep network trains at all.

## Nonsaturating activations

The second lever is the activation itself, covered in full in [[cs/deep-learning/activation-functions|activation functions]]. The short version relevant here: replacing the saturating sigmoid with a nonsaturating rectifier keeps the backward derivative from collapsing to zero across the positive range, which is a large part of why [[cs/deep-learning/artificial-neural-networks|deep networks]] became trainable. ReLU has its own failure mode (a neuron stuck outputting zero passes no gradient, the "dying ReLU" problem), which is what motivated the leaky and exponential variants. The interaction with initialization is the point: He initialization exists precisely because ReLU changed the variance arithmetic that Glorot's tanh derivation assumed.

## Batch normalization: fix the variances during training, not only at the start

Good initialization sets the variances right at step zero, but training moves the weights and the variances drift again. Batch normalization, treated as a regularizer in [[cs/deep-learning/regularization-in-deep-learning|regularization in deep learning]], earns its other role here. Ioffe and Szegedy introduced it in 2015 to fight what they called internal covariate shift, the way each layer's input distribution keeps changing as the layers before it update. By normalizing each layer's inputs per mini-batch, it holds the variances in a good range throughout training, not only at initialization. The consequences are exactly the vanishing-gradient story in reverse: the paper reports it permits much higher learning rates and less careful initialization, and reaches the same accuracy in a fraction of the training steps. Batch norm is a gradient-flow stabilizer that happens to also regularize.

## Exploding gradients and clipping

The mirror problem, gradients that blow up rather than vanish, shows up most in [[cs/deep-learning/recurrent-neural-networks|recurrent networks]], where the same weights are applied at every time step and a factor slightly above one compounds over a long sequence. Pascanu, Mikolov, and Bengio studied exactly this in 2013 and proposed the standard fix: gradient norm clipping. When [[cs/math/vectors-and-dot-products|the gradient's norm]] exceeds a threshold, scale it back before the update step, so a single explosive batch cannot throw the weights to infinity. It does not address the cause the way initialization does, but it keeps training numerically alive while the other levers do their work.

> [!warning] These levers all attack one quantity
> Initialization, activation choice, and normalization look like three separate tricks, but they are three ways to hold the same thing steady: the variance of the signal as it moves forward and the gradient as it moves back. When a deep network will not train, the first questions are always the same. Is the activation saturating? Is the initializer matched to it (He for ReLU, Glorot for tanh)? Are the layer inputs normalized? Depth is only as trainable as the gradient that reaches the bottom.

## Related Notes

- [[cs/deep-learning/backpropagation|Backpropagation]] - the chain-rule product whose per-layer terms vanish or explode
- [[cs/deep-learning/activation-functions|Activation Functions]] - saturation, ReLU, and the nonsaturating variants that keep gradients alive
- [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]] - batch normalization's other role, as a regularizer
- [[cs/machine-learning/gradient-descent|Gradient Descent]] - the update step the gradient feeds, and why a dead gradient stalls it
- [[cs/deep-learning/recurrent-neural-networks|Recurrent Neural Networks]] - where exploding gradients bite hardest and clipping is standard
- [[cs/deep-learning/artificial-neural-networks|Artificial Neural Networks]] - the depth that makes all of this matter

## Sources

- Xavier Glorot and Yoshua Bengio, "Understanding the difficulty of training deep feedforward neural networks," AISTATS 2010 (PMLR v9). https://proceedings.mlr.press/v9/glorot10a.html . Supports the logistic sigmoid being unsuited to deep nets because its nonzero mean drives the top hidden layer into saturation, training failing when each layer's Jacobian has singular values far from one, and the normalized (Xavier/Glorot) initialization keeping activation and gradient variance roughly constant across layers for faster convergence.
- Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun, "Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification," 2015. https://arxiv.org/abs/1502.01852 . Supports the He/Kaiming initialization derived for rectifier (ReLU) networks enabling training of extremely deep models from scratch, and these networks being the first to surpass human-level performance on ImageNet classification.
- Sergey Ioffe and Christian Szegedy, "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift," 2015. https://arxiv.org/abs/1502.03167 . Supports batch normalization normalizing layer inputs per mini-batch to counter internal covariate shift, permitting much higher learning rates and less careful initialization, and reaching the same accuracy in far fewer training steps.
- Razvan Pascanu, Tomas Mikolov, and Yoshua Bengio, "On the difficulty of training Recurrent Neural Networks," 2013. https://arxiv.org/abs/1211.5063 . Supports the vanishing and exploding gradient problems in recurrent networks and the gradient norm clipping strategy proposed to handle exploding gradients.
