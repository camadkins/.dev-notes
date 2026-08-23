---
title: Feature Attribution and Saliency
description: Asking a black box why. How gradients with respect to the input, not the weights, reveal which pixels drove a prediction, and how Integrated Gradients fixes what a single gradient gets wrong.
draft: false
comments: true
tags:
  - cs
  - deep-learning
  - interpretability
date: 2026-07-23
updated:
aliases:
  - Saliency Maps
  - Integrated Gradients
  - Feature Attribution
  - Interpretability
---

A trained network predicts, but it does not explain. For a model deciding whether an image contains a tumor, or whether a signal is a threat, "the network says yes" is not enough; [[cs/ethics/the-responsibility-gap|you need to know why]], both to trust it and to catch it deciding for the wrong reason. Feature attribution is the interpretability tool that answers "which parts of the input drove this prediction," and for images the answer is a heatmap over the pixels. This is hackathon 9's subject, and it is the one interpretability pillar the garden did not yet have. It matters most exactly where models are used to make consequential, [[cs/law/gdpr-as-it-reaches-us-engineers|auditable decisions]].

> [!note] The idea
> The gradient of the predicted class score with respect to the input, not the weights, tells you which input features most change the prediction. Compute that gradient and its magnitude is a saliency map: bright where a pixel matters, dark where it does not. This is the same [[backpropagation|backpropagation]] machinery used in training, pointed at the input image instead of the parameters. A single gradient is a local snapshot and can mislead, so Integrated Gradients improves on it by accumulating gradients along a path from a blank baseline to the real input.

## Vanilla saliency: the gradient with respect to the input

The original method is disarmingly simple. Simonyan, Vedaldi, and Zisserman showed in 2013 that you can build a class saliency map for an image by computing the gradient of the class score with respect to the input pixels. Where that gradient is large, a small change in the pixel would swing the score most, so that pixel is the most influential to the classification; where it is near zero, the pixel barely matters. The key move is what you differentiate against. Training computes the gradient of the loss with respect to the weights, to update them. Saliency computes the gradient of the output with respect to the input, to explain it. Same [[cs/math/derivatives-and-gradients|chain rule]], opposite target, and the output is a heatmap you can lay over the image to see where the network looked.

## Integrated Gradients: why one gradient is not enough

A single gradient has a blind spot: it is a local measurement at one point, and deep networks saturate. A feature can be fully responsible for a confident prediction and yet have a near-zero gradient there, because the score has already flattened out, so the vanilla map underweights it. Sundararajan, Taly, and Yan addressed this in 2017 with Integrated Gradients, which attributes a prediction by [[cs/math/integrals-and-the-fundamental-theorem|integrating the gradients]] along a straight-line path from a baseline input (typically a black image, representing "absence") to the actual input. Summing the gradients across that path captures the feature's contribution as the input is dialed up from nothing to its real value, rather than only its influence at the endpoint. Their method is derived to satisfy two axioms, Sensitivity and Implementation Invariance, that they show most existing attribution methods violate, which is what gives it a principled footing rather than being one heuristic among many.

> [!warning] Attribution shows where, not whether the reason is good
> A saliency map tells you which pixels the network used, not whether it should have. That is exactly its value: it catches the classic failure where a model reaches the right answer for the wrong reason, keying on a watermark, a hospital tag, or a background texture rather than the object. It also connects directly to the security side of deep learning. Hackathon 9 runs attribution on ImageNet-A, a set of natural images that fool a classifier, and the gap between where the model looks and where a human would look is the visible signature of that fragility. For any model deployed in a setting where its decisions must be trusted and audited, attribution is part of the accountability the [[ai-governance|governance of AI]] increasingly demands.

## Related Notes

- [[backpropagation|Backpropagation]] - the same gradient machinery, differentiated against the input instead of the weights
- [[convolutional-neural-networks|Convolutional Neural Networks]] - the image classifiers saliency and integrated gradients are usually applied to
- [[transfer-learning|Transfer Learning and Reusing Pretrained Layers]] - the pretrained models whose decisions you most often need to interpret
- [[ai-governance|AI Governance]] - why interpretability and auditability matter where models make consequential decisions

## Sources

- Karen Simonyan, Andrea Vedaldi, and Andrew Zisserman, "Deep Inside Convolutional Networks: Visualising Image Classification Models and Saliency Maps," 2013. https://arxiv.org/abs/1312.6034 . Supports the class saliency map being computed as the gradient of the class score with respect to the input pixels, highlighting the image regions most influential to the classification (the vanilla gradient saliency method).
- Mukund Sundararajan, Ankur Taly, and Qiqi Yan, "Axiomatic Attribution for Deep Networks," 2017. https://arxiv.org/abs/1703.01365 . Supports Integrated Gradients attributing a prediction to input features by integrating gradients along a straight-line path from a baseline (e.g. a black image) to the input, and satisfying the Sensitivity and Implementation Invariance axioms that most other attribution methods fail.
