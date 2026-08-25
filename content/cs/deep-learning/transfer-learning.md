---
title: Transfer Learning and Reusing Pretrained Layers
description: Don't train from scratch. Why the early layers of a network trained on a big dataset transfer to new tasks, the freeze-then-fine-tune workflow, and the batch-norm trap that silently ruins it.
draft: false
comments: true
tags:
  - cs
  - deep-learning
  - training
date: 2026-07-23
updated:
aliases:
  - Transfer Learning
  - Fine-Tuning
  - Reusing Pretrained Layers
---

Training a deep network from scratch needs a large labeled dataset and [[cs/geopolitics/compute-as-a-governable-resource|a lot of compute]], and most problems have neither. Transfer learning is the way around that, and it is arguably the single most important practical technique in Géron's Chapter 11: instead of starting from random weights, start from a network already trained on a big related dataset, keep the [[cs/machine-learning/features-and-representations|features]] it learned, and retrain only the parts that are specific to your task. A model that would need a million images trained from zero can be adapted with a few thousand.

> [!note] The idea
> A deep network trained on a large dataset learns features in a useful order: the early layers learn general things (edges, textures, colors) that are useful for almost any vision task, while the later layers learn features specific to the original problem. Transfer learning reuses the general early layers as a fixed feature extractor and retrains only the task-specific top on your data. You inherit millions of images' worth of feature learning for the cost of training a small head.

## Why it works: general early layers, specific late layers

The reason transfer learning works is empirical and was pinned down by Yosinski and colleagues in 2014, who measured how transferable a network's features are layer by layer. Their finding is the foundation for the whole technique: the first layer learns features resembling Gabor filters and color blobs that are general enough to appear in almost any trained vision network, and as you go deeper the features become progressively more specific to the original task. Two things make late layers transfer worse: they are specialized to the source task, and splitting a network between co-adapted layers disrupts learning. The practical headline is the encouraging part. Initializing with transferred features beats random initialization even when the source and target tasks are fairly different, and the boost to generalization lingers even after fine-tuning on the new task. Pretraining on a large dataset like ImageNet genuinely helps downstream tasks.

## The workflow: freeze, add, train, then fine-tune

The Keras transfer-learning guide lays out the standard recipe, and it is worth knowing as a fixed sequence:

1. Take a base model pretrained on a large dataset and load its weights.
2. Freeze the base by setting its layers to `trainable = False`, so training cannot change them.
3. Add a new, trainable head on top of the base's output for your task.
4. Train the new head on your dataset. Only the head learns; the pretrained features are held fixed.
5. Optionally fine-tune: unfreeze some or all of the base and continue training at a very low learning rate.

The freeze in step two is the crucial move. As the guide puts it, you freeze the pretrained layers so as to avoid destroying any of the information they contain during future training rounds. Early in training the new head outputs garbage and produces large gradients; if the base were unfrozen, those gradients would flow back and wreck the very features you wanted to reuse. Freeze first, let the head settle, and only then consider fine-tuning.

## Fine-tuning at a low learning rate

Fine-tuning unfreezes the base and lets the whole network adjust to the new task, but it must be done gently. The pretrained weights are already good, so you nudge them with a very low learning rate, small enough that the update does not undo what was learned. This is where the low-learning-rate discipline from [[cs/deep-learning/vanishing-and-exploding-gradients|training deep networks]] pays off directly: fine-tuning is the case where too large a step does more than slow convergence, it actively destroys the pretrained weights.

> [!warning] The batch-norm trap that silently ruins fine-tuning
> The most common way to break transfer learning is subtle. A base model with [[cs/deep-learning/regularization-in-deep-learning|batch normalization]] layers carries non-trainable statistics (running mean and variance) learned on the source data. If you unfreeze the base for fine-tuning without care, those statistics start updating on your small new batch, and the Keras guide warns this can suddenly destroy what the model has learned. The fix is to keep the batch-norm layers in inference mode during fine-tuning, calling the base with `training=False`, so the running statistics stay frozen even as the weights adjust. A fine-tune that mysteriously collapses is almost always this.

## Why this connects to the architectures

Transfer learning is the reason the [[cs/deep-learning/pooling-and-cnn-architectures|classic CNN architectures]] matter beyond history. You rarely design a [[cs/deep-learning/convolutional-neural-networks|convolutional network]] from scratch; [[cs/languages/common/software-supply-chain-and-provenance|you download a ResNet]] or an EfficientNet pretrained on ImageNet and transfer it. The architecture you pick is the feature extractor you inherit. That is why the field converged on a handful of well-trained backbones: a good pretrained base is a reusable asset, and transfer learning is how you spend it.

## Related Notes

- [[cs/machine-learning/features-and-representations|Features and Representations]] - the general-to-specific feature hierarchy that makes early layers transferable
- [[cs/deep-learning/convolutional-neural-networks|Convolutional Neural Networks]] - the vision models most often reused via transfer learning
- [[cs/deep-learning/pooling-and-cnn-architectures|Pooling and CNN Architectures]] - the pretrained backbones (ResNet and friends) you transfer from
- [[cs/deep-learning/vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]] - why fine-tuning demands a low learning rate
- [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]] - batch normalization, and why its running statistics must stay frozen during fine-tuning

## Sources

- Jason Yosinski, Jeff Clune, Yoshua Bengio, and Hod Lipson, "How transferable are features in deep neural networks?", NeurIPS 2014. https://arxiv.org/abs/1411.1792 . Supports early layers learning general features (Gabor filters and color blobs) that transfer across tasks, later layers becoming progressively task-specific, co-adaptation between layers hindering transfer, and transferred initialization beating random initialization with a generalization boost that lingers after fine-tuning.
- "Transfer learning & fine-tuning," Keras Developer Guides (François Chollet). https://keras.io/guides/transfer_learning/ . Supports the freeze-add-train-then-fine-tune workflow, freezing via `trainable = False` to avoid destroying pretrained information, fine-tuning at a very low learning rate, and keeping BatchNormalization layers in inference mode (`training=False`) during fine-tuning so their running statistics do not update and destroy the learned representations.
