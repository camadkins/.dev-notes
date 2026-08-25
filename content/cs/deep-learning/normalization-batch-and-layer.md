---
title: Normalization, Batch and Layer
description: What batch normalization and layer normalization actually average over, why one behaves differently at inference and the other does not, and why transformers picked layer norm.
draft: false
comments: true
tags:
  - cs
  - deep-learning
  - training
date: 2026-03-18
aliases:
  - batch norm
  - layer norm
  - BatchNorm
  - LayerNorm
---

Every hidden layer in a deep network sees inputs produced by the layers beneath it, and those layers are still learning. The distribution arriving at layer twenty in step one looks nothing like the distribution arriving at step ten thousand. Normalization layers pin that moving target down: rescale each layer's activations to a fixed mean and [[cs/statistics/variance-and-covariance|variance]], then hand the network two learned parameters so it can undo the rescaling wherever the rescaling was a bad idea.

> [!note] The idea
> Batch norm and layer norm compute the same statistics and apply the same affine correction. They differ in one thing, the axis they average over. Batch norm averages a feature across the examples in a mini-batch, which couples every example's forward pass to whoever else is in the batch. Layer norm averages the features within one example, which does not. That single axis choice determines everything downstream: batch size sensitivity, whether training and inference compute the same function, and whether the layer drops cleanly into a sequence model.

## What each one averages over

Both layers do the same three steps. Compute a mean $\mu$ and variance $\sigma^2$, normalize with $\hat{x}_i = (x_i - \mu)/\sqrt{\sigma^2 + \epsilon}$, then apply a learned scale and shift $y_i = \gamma_i \hat{x}_i + \beta_i$. The $\epsilon$ [[cs/standards/ieee-754-rounding-and-exceptions|keeps the denominator away from zero]]; $\gamma$ and $\beta$ exist so the network can learn to undo the normalization when normalizing hurt.

The difference is the summation index. Batch normalization operates on the activations of a layer for each mini-batch, taking the statistics of one feature across the batch dimension. Layer normalization, in the other direction, normalizes across all the features within a single data sample: $\mu = \frac{1}{D}\sum_{i=1}^{D} x_i$ over the $D$ neurons in the layer, for that one example alone.

Picture [[cs/dsa/multidimensional-arrays|the activation tensor as a table]] with examples down the rows and features across the columns. Batch norm normalizes a column. Layer norm normalizes a row.

Ioffe and Szegedy introduced batch norm in 2015 to attack what they named internal covariate shift, the fact that each layer's input distribution keeps changing as earlier parameters change. Their framing is that this slows training by requiring lower learning rates and careful parameter initialization, and makes saturating nonlinearities notoriously hard to train. Making normalization part of the model architecture instead of a preprocessing step let them use much higher learning rates and be less careful about [[cs/deep-learning/weight-initialization|initialization]], reaching the same accuracy as a state-of-the-art image classifier with 14 times fewer training steps. The internal-covariate-shift explanation itself has not aged as cleanly as the technique; the Wikipedia survey of the area notes the original claim has both supporters and detractors in the later literature.

## The train/inference split, and why only batch norm has one

A batch norm layer at training time needs a batch. At inference you may be classifying exactly one image, and even if you are not, you do not want the prediction for one input to depend on which other inputs happened to be batched alongside it. So batch norm keeps running estimates during training and freezes them for evaluation. During training the mean and variance are computed on the fly per batch, usually accumulated as an exponential moving average; during inference those accumulated values are used instead.

> [!warning] The frozen statistics are a real discrepancy
> Training and inference are running two different functions. Wikipedia's survey states this train-test disparity degrades performance, and describes work that shrinks it by simulating the moving average at inference time. This is also why small batches hurt batch norm: with a handful of examples the per-batch statistics are noisy estimates of the population statistics the inference path will use.

Layer normalization has no such split. Ba, Kiros, and Hinton designed it so that, unlike batch normalization, layer normalization performs exactly the same computation at training and test times. Nothing is accumulated because nothing needs to be: the statistics come from the single example in front of the layer. Batch size 1 and batch size 1024 give bit-identical results for any given example.

## Why transformers use layer norm

The motivation in the layer norm paper is explicitly the two places batch norm gets awkward. The effect of batch normalization is dependent on the mini-batch size, and it is not obvious how to apply it to [[cs/deep-learning/recurrent-neural-networks|recurrent neural networks]]. Sequence models are where this bites hardest. A batch of sequences has ragged lengths, so a given timestep may be present in every sequence or only in the longest one, and the batch statistics at that timestep are computed over whatever subset happens to be there. Layer norm sidesteps the question by never looking across the batch; in recurrent networks and transformers it is applied individually to each timestep, over the hidden vector at that step.

That property is what makes it the default in [[cs/deep-learning/attention-and-transformers|transformer]] architectures, where Wikipedia's survey calls it a key component. The paper's own claim is narrower and empirical: layer normalization is very effective at stabilizing the hidden state dynamics in recurrent networks, and substantially reduces training time compared with previously published techniques.

> [!example] Two arrangements, same layer
> The original 2017 transformer placed its layer norms after each sub-layer's residual addition, the "post-LN" configuration. It was difficult to train, and required careful hyperparameter tuning plus a learning rate warm-up that starts small and gradually increases. The "pre-LN" convention, normalizing before the sub-layer instead, was proposed several times in 2018 and found to be easier to train, requiring no warm-up and converging faster. Same normalization, one position moved, and a whole class of training instability goes away.

Batch norm still earns its place in convolutional vision models, where batches are large and the batch axis is statistically well behaved. The choice is not about which layer is better in the abstract. It is about whether coupling examples inside a batch buys you anything.

## Related Notes

- [[cs/deep-learning/weight-initialization]], the other lever on activation scale, applied once instead of every forward pass
- [[cs/deep-learning/vanishing-and-exploding-gradients]], the failure mode both initialization and normalization exist to hold off
- [[cs/deep-learning/regularization-in-deep-learning]], where batch norm's noise shows up as a side-effect regularizer
- [[cs/deep-learning/attention-and-transformers]], the architecture layer norm became standard in
- [[cs/deep-learning/recurrent-neural-networks]], the case that motivated layer norm in the first place
- [[cs/deep-learning/faster-optimizers-and-learning-rate-scheduling]], the warm-up schedules post-LN transformers needed
- [[cs/deep-learning/convolutional-neural-networks]], where batch norm remains the common choice

## Sources

- Sergey Ioffe and Christian Szegedy, "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift," arXiv:1502.03167. https://arxiv.org/abs/1502.03167 . Supports internal covariate shift as the stated motivation, normalization per mini-batch as part of the architecture, higher learning rates and less careful initialization, and the 14x fewer training steps result.
- Jimmy Lei Ba, Jamie Ryan Kiros, and Geoffrey E. Hinton, "Layer Normalization," arXiv:1607.06450. https://arxiv.org/abs/1607.06450 . Supports layer norm computing statistics over all summed inputs to the neurons in a layer on a single training case, the per-neuron adaptive bias and gain, identical computation at training and test time, batch-size dependence and RNN awkwardness of batch norm, and the stabilization result.
- "Normalization (machine learning)," Wikipedia. https://en.wikipedia.org/wiki/Normalization_%28machine_learning%29 . Supports the batch-versus-feature axis contrast, the LayerNorm formulas, running statistics frozen at inference and the resulting train-test disparity, LayerNorm applied per timestep in RNNs and transformers, and the post-LN versus pre-LN training story.
