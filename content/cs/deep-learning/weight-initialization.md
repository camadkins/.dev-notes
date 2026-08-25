---
title: Weight Initialization
description: Why the scale of the starting weights decides whether a deep network trains at all, and how Glorot and He initialization derive that scale from a variance-preservation argument.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-02-09
aliases: []
---

Before the first forward pass, someone has to fill the weight matrices with numbers. The obvious answer, all zeros, fails immediately: identical weights make every neuron in a layer compute the same thing and receive the same gradient, so they stay identical forever. Zero initialization leads to symmetry in the network, causing all neurons to learn the same features. Biases can safely start at zero, and usually do. Weights cannot.

So the weights are random. The question is how big the random numbers should be, and that turns out to be a real question with a derivable answer rather than a hyperparameter to be guessed.

> [!note] The idea
> A deep network is a long chain of multiplications, and multiplication compounds. If each layer shrinks the variance of its activations by a factor slightly under one, thirty layers later the signal is numerically dead; if each layer grows it slightly, the signal explodes. The fix is to choose the initial weight scale so that variance is preserved through a layer, which makes the factor for the fan-in, the number of inputs feeding each neuron. That single constraint generates the whole family: LeCun, Glorot, and He initialization differ only in whether they balance the forward pass, both passes, or the forward pass with a correction for ReLU discarding half its inputs.

## The variance-preserving argument

A neuron computes a weighted sum of $n$ inputs. If the inputs are roughly independent with some [[cs/statistics/variance-and-covariance|variance]], and the weights are drawn independently with variance $\sigma^2$, the variance of the sum grows with both $n$ and $\sigma^2$. Wide layers therefore amplify more than narrow ones at the same weight scale, which is why the answer has to depend on layer width rather than being a single global number.

LeCun initialization, popularized in LeCun et al. (1998), takes the direct route: sample each weight independently from a distribution with mean 0 and variance $1/n_{l-1}$, where $n_{l-1}$ is the fan-in. The $1/n$ exactly cancels the amplification from summing $n$ terms, and the scheme is designed to preserve the variance of neural activations during the forward pass. If the distribution is uniform, the equivalent is $\mathcal{U}(\pm\sqrt{3/n_{l-1}})$.

Preserving forward variance is only half the problem. [[cs/deep-learning/backpropagation|Backpropagation]] runs the same chain in reverse, and gradients are subject to the same compounding, this time governed by the fan-out. Glorot and Bengio's 2010 paper set out to understand why standard gradient descent from random initialization was doing so poorly with deep networks, and studied how activations and gradients vary across layers and during training, with the idea that training may be more difficult when the [[cs/math/singular-value-decomposition|singular values]] of the Jacobian associated with each layer are far from 1. Their conclusion, sometimes called Xavier initialization, is a compromise between two goals: preserve activation variance on the forward pass and gradient variance on the backward pass. The uniform form samples each weight from

$$W^{(l)}_{ij} \sim \mathcal{U}\!\left(\pm\sqrt{\frac{6}{n_{\text{in}} + n_{\text{out}}}}\right)$$

which splits the difference between the two constraints by averaging fan-in and fan-out. When fan-in and fan-out are equal, Glorot initialization is the same as LeCun initialization. The same paper reported a related finding worth keeping: the logistic sigmoid is unsuited for deep networks with random initialization because of its mean value, which can drive especially the top hidden layer into saturation.

## What ReLU changed

Glorot's derivation assumes an activation that is roughly linear and symmetric near zero. [[cs/deep-learning/activation-functions|ReLU]] is neither. It zeroes every negative input, so on average half the units in a layer contribute nothing, and the variance passed forward is about half what the linear analysis predicts. Glorot initialization performs poorly for ReLU activation for exactly this reason.

He, Zhang, Ren, and Sun derived the correction in 2015: a robust initialization method that particularly considers the rectifier nonlinearities. Sample each weight from $\mathcal{N}(0,\ 2/n_{l-1})$. The factor of 2 compensates for the half of the signal ReLU discards. Their stated payoff was structural: the method enables training extremely deep rectified models directly from scratch, and lets them investigate deeper and wider architectures. The paper (which also introduced the Parametric ReLU) reported 4.94% top-5 test error on ImageNet 2012, a 26% relative improvement over the ILSVRC 2014 winner GoogLeNet at 6.66%, and claimed to be the first result to surpass the human-level performance figure of 5.1% reported by Russakovsky et al. on that benchmark.

> [!example] Reading the constant
> The whole family is one formula with one knob. Variance $1/n_{\text{in}}$ preserves the forward pass through a linear layer. Variance $2/(n_{\text{in}} + n_{\text{out}})$ balances forward and backward. Variance $2/n_{\text{in}}$ preserves the forward pass through a layer whose activation throws away half the signal. Every one of these is "cancel the fan-in amplification, then adjust for what the nonlinearity does."

## Where this sits now

> [!warning] Initialization got less load-bearing, not irrelevant
> Weight initialization is only the starting condition; nothing keeps the variance in range after training moves the weights. Wikipedia's survey observes that the impact of initialization on tuning the variance has become less important as methods appeared to tune variance automatically, with [[cs/deep-learning/normalization-batch-and-layer|batch normalization]] handling the forward pass and momentum-based optimizers handling the backward pass. It also names the resulting tension directly: careful initialization decreases the need for normalization, and normalization decreases the need for careful initialization, with tradeoffs on both sides, since batch normalization makes training examples in a minibatch dependent while weight initialization is architecture-dependent.

The historical stakes were larger than a convergence-speed footnote. Before the 2010s, deep networks were commonly initialized by [[cs/machine-learning/unsupervised-learning|unsupervised generative pre-training]], layer by layer, because directly training them by backpropagation was too hard. A 2013 paper by Sutskever, Martens, Dahl, and Hinton demonstrated that with well-chosen hyperparameters, momentum gradient descent with weight initialization was sufficient, without needing quasi-Newton methods or generative pre-training. Getting the starting scale right is part of what made plain backpropagation on deep networks work.

## Related Notes

- [[cs/deep-learning/vanishing-and-exploding-gradients]], the compounding failure this scale choice is defending against
- [[cs/deep-learning/normalization-batch-and-layer]], the per-step alternative to getting the starting scale right
- [[cs/deep-learning/activation-functions]], whose shape determines which constant the formula takes
- [[cs/deep-learning/backpropagation]], the backward pass Glorot initialization balances against
- [[cs/deep-learning/artificial-neural-networks]], the fan-in and fan-out this all depends on
- [[cs/machine-learning/gradient-descent]], the optimizer whose starting point this is
- [[cs/deep-learning/self-supervised-learning-and-pretraining]], the modern descendant of the pre-training that initialization partly replaced

## Sources

- "Weight initialization," Wikipedia. https://en.wikipedia.org/wiki/Weight_initialization . Supports zero initialization causing symmetry, LeCun initialization at variance 1/fan-in preserving forward activation variance, the Glorot uniform bound and its forward/backward compromise, Glorot performing poorly for ReLU, He initialization sampling from N(0, 2/fan-in), the history of generative pre-training and the 2013 momentum result, and the initialization-versus-normalization tension.
- Xavier Glorot and Yoshua Bengio, "Understanding the difficulty of training deep feedforward neural networks," PMLR 9:249-256, 2010. https://proceedings.mlr.press/v9/glorot10a.html . Supports the paper's stated objective, the sigmoid saturation finding, the Jacobian singular values framing, and the proposal of a new initialization scheme with substantially faster convergence.
- Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun, "Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification," arXiv:1502.01852. https://arxiv.org/abs/1502.01852 . Supports the rectifier-aware initialization derivation, training extremely deep rectified models from scratch, PReLU, and the 4.94% / 6.66% / 5.1% ImageNet figures.
