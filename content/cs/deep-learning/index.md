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

Deep learning, built from the University of Nebraska CSCE 479/879 course. Where the [[cs/machine-learning/index|machine learning]] section covers learning from data in general, this section is about neural networks with depth, the model class that learns its own [[cs/machine-learning/features-and-representations|representations]] instead of relying on hand-engineered features. Each note links back to the machine-learning fundamental it stands on. The history of how these models took over is in [[cs/history/deep-learning-revolution|The Deep Learning Revolution]].

### Foundations

- [[cs/deep-learning/artificial-neural-networks|Artificial Neural Networks]] - the perceptron to the multilayer network.
- [[cs/deep-learning/backpropagation|Backpropagation]] - how a deep network computes its gradients.
- [[cs/deep-learning/activation-functions|Activation Functions]] - the nonlinearity that makes depth mean something.

### Vision: convolutional networks

- [[cs/deep-learning/convolutional-neural-networks|Convolutional Neural Networks]] - shared local filters that exploit spatial structure.
- [[cs/deep-learning/feature-attribution-and-saliency|Feature Attribution and Saliency]] - gradients with respect to the input, revealing which pixels drove a prediction.
- [[cs/deep-learning/pooling-and-cnn-architectures|Pooling and CNN Architectures]] - downsampling and the LeNet to ResNet arc.

### Sequences and representations

- [[cs/deep-learning/recurrent-neural-networks|Recurrent Neural Networks]] - networks with state over sequences, and LSTM/GRU.
- [[cs/deep-learning/embeddings|Embeddings]] - learned dense vectors whose geometry encodes meaning.
- [[cs/deep-learning/tokenization-and-subword-units|Tokenization and Subword Units]] - how text becomes the integers a model actually sees, and what BPE buys.
- [[cs/deep-learning/attention-and-transformers|Attention and Transformers]] - every position attends to every other, no recurrence, the architecture behind large language models.
- [[cs/deep-learning/self-supervised-learning-and-pretraining|Self-Supervised Learning and Pretraining]] - inventing labels from unlabeled data, and the pretrain-then-finetune pattern.

### Graphs

- [[cs/deep-learning/graph-neural-networks|Graph Neural Networks]] - message passing over graph structure, and permutation invariance.

### Generative models

- [[cs/deep-learning/autoencoders|Autoencoders]] - encoder, bottleneck, decoder, and the variational version.
- [[cs/deep-learning/generative-adversarial-networks|Generative Adversarial Networks]] - generator versus discriminator.
- [[cs/deep-learning/diffusion-models|Diffusion Models]] - reverse a noising process to generate.

### Reinforcement learning

- [[cs/deep-learning/reinforcement-learning|Reinforcement Learning]] - agents, rewards, and Markov decision processes.
- [[cs/deep-learning/deep-reinforcement-learning|Deep Reinforcement Learning]] - neural function approximation, DQN, and policy gradients.

### Training deep networks

- [[cs/deep-learning/vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]] - why depth stalled training, and the initialization and normalization that fixed it.
- [[cs/deep-learning/weight-initialization|Weight Initialization]] - the variance-preserving argument behind Xavier and He.
- [[cs/deep-learning/normalization-batch-and-layer|Normalization: Batch and Layer]] - what each normalizes over, and why transformers reach for layer norm.
- [[cs/deep-learning/faster-optimizers-and-learning-rate-scheduling|Faster Optimizers and Learning Rate Scheduling]] - momentum through Adam, and scheduling the learning rate they share.
- [[cs/deep-learning/transfer-learning|Transfer Learning and Reusing Pretrained Layers]] - reuse a pretrained network instead of training from scratch.
- [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]] - dropout, batch norm, weight decay, early stopping.
- [[cs/deep-learning/meta-learning|Meta-Learning]] - learning to learn across tasks.

### Reading notes

- [[cs/deep-learning/geron-catchup-ch-1-4-10|Géron Catch-Up: Chapters 1, 4, 10]] - the through-line across Hands-On ML chapters 1, 4, and 10.

### Connects to

The fundamentals every note here builds on are in [[cs/machine-learning/index|Machine Learning]]. The linear algebra a network runs on is in [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]], and the governance questions deep learning forced open are in [[cs/geopolitics/ai-governance|AI Governance]]. The probabilistic foundations, maximum likelihood, cross-entropy, and variance, are in [[cs/statistics/index|Statistics]], and the systems that make training at scale possible, parallel and distributed computation across GPUs, are in [[cs/systems/index|Systems]] (see [[cs/systems/processes-and-threads|processes and threads]] and [[cs/systems/distributed-consensus|distributed consensus]]).
