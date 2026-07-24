---
title: Deep Learning
description: Neural networks with depth, the architectures that learn their own features. Built on the machine-learning fundamentals, from the perceptron through CNNs, sequence models, generative models, and reinforcement learning.
draft: false
comments: false
tags:
  - cs
  - deep-learning
date: 2026-07-13
updated: 2026-07-13
aliases:
  - Deep Learning
  - DL
  - neural networks
---

Deep learning, built from the University of Nebraska CSCE 479/879 course. Where the [[cs/machine-learning/index|machine learning]] section covers learning from data in general, this section is about neural networks with depth, the model class that learns its own [[features-and-representations|representations]] instead of relying on hand-engineered features. Each note links back to the machine-learning fundamental it stands on. The history of how these models took over is in [[deep-learning-revolution|The Deep Learning Revolution]].

### Foundations

- [[artificial-neural-networks|Artificial Neural Networks]] - the perceptron to the multilayer network.
- [[backpropagation|Backpropagation]] - how a deep network computes its gradients.
- [[activation-functions|Activation Functions]] - the nonlinearity that makes depth mean something.

### Vision: convolutional networks

- [[convolutional-neural-networks|Convolutional Neural Networks]] - shared local filters that exploit spatial structure.
- [[feature-attribution-and-saliency|Feature Attribution and Saliency]] - gradients with respect to the input, revealing which pixels drove a prediction.
- [[pooling-and-cnn-architectures|Pooling and CNN Architectures]] - downsampling and the LeNet to ResNet arc.

### Sequences and representations

- [[recurrent-neural-networks|Recurrent Neural Networks]] - networks with state over sequences, and LSTM/GRU.
- [[embeddings|Embeddings]] - learned dense vectors whose geometry encodes meaning.
- [[attention-and-transformers|Attention and Transformers]] - every position attends to every other, no recurrence, the architecture behind large language models.

### Generative models

- [[autoencoders|Autoencoders]] - encoder, bottleneck, decoder, and the variational version.
- [[generative-adversarial-networks|Generative Adversarial Networks]] - generator versus discriminator.
- [[diffusion-models|Diffusion Models]] - reverse a noising process to generate.

### Reinforcement learning

- [[reinforcement-learning|Reinforcement Learning]] - agents, rewards, and Markov decision processes.
- [[deep-reinforcement-learning|Deep Reinforcement Learning]] - neural function approximation, DQN, and policy gradients.

### Training deep networks

- [[vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]] - why depth stalled training, and the initialization and normalization that fixed it.
- [[faster-optimizers-and-learning-rate-scheduling|Faster Optimizers and Learning Rate Scheduling]] - momentum through Adam, and scheduling the learning rate they share.
- [[transfer-learning|Transfer Learning and Reusing Pretrained Layers]] - reuse a pretrained network instead of training from scratch.
- [[regularization-in-deep-learning|Regularization in Deep Learning]] - dropout, batch norm, weight decay, early stopping.
- [[meta-learning|Meta-Learning]] - learning to learn across tasks.

### Connects to

The fundamentals every note here builds on are in [[cs/machine-learning/index|Machine Learning]]. The linear algebra a network runs on is in [[linear-algebra-fundamentals|Linear Algebra Fundamentals]], and the governance questions deep learning forced open are in [[ai-governance|AI Governance]]. The probabilistic foundations, maximum likelihood, cross-entropy, and variance, are in [[cs/statistics/index|Statistics]], and the systems that make training at scale possible, parallel and distributed computation across GPUs, are in [[cs/systems/index|Systems]] (see [[processes-and-threads|processes and threads]] and [[distributed-consensus|distributed consensus]]).
