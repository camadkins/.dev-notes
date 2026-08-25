---
title: Pooling and CNN Architectures
description: How pooling downsamples feature maps for efficiency and invariance, and how the LeNet to AlexNet to ResNet arc shows that depth, made trainable, is what scaled convolutional networks.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-13
aliases: []
---

A [[cs/deep-learning/convolutional-neural-networks|convolutional network]] that only ever convolved would carry full-resolution feature maps through every layer, which is wasteful and brittle. Two ideas fix that. Pooling shrinks the maps between convolutions, and better architectures figured out how to stack many layers without training falling apart. The history of image models is mostly the history of making networks deeper without breaking them.

> [!note] The idea
> Pooling downsamples feature maps by summarizing each small region with one value, buying efficiency and a bit of translation invariance. The progression from LeNet to AlexNet to ResNet shows the same lesson repeated: the payoff is depth, and each architecture is a trick for making more depth trainable.

## Pooling: summarize and shrink

After a convolution, a pooling layer slides a small window over each feature map and replaces the window with a single summary. Max pooling takes the largest value, keeping the strongest response; average pooling takes the mean. The effect is to reduce the map's height and width, which cuts computation for later layers and gives small translation invariance, because a feature shifting by one pixel usually lands in the same pooled cell. Pooling has no learned weights of its own; it is a fixed downsampling step between learned convolutions.

> [!warning] Pooling is not mandatory
> Modern designs sometimes drop pooling in favor of strided convolutions that downsample and learn at the same time. Pooling is a useful default, not a law. The invariance it grants is also a tradeoff, since discarding position information can hurt tasks that need it.

## The architecture arc

Stacking convolution and pooling into a classifier is old; making it deep and trainable is what took time.

- **LeNet-5 (LeCun, 1998)** established the template: convolution, pooling, convolution, pooling, then fully connected layers, trained by [[cs/deep-learning/backpropagation|backpropagation]]. It read handwritten digits, most famously to read bank checks.
- **AlexNet (2012)** was the same template scaled up: eight learned layers, [[cs/deep-learning/activation-functions|ReLU]] activations, dropout, and GPU training. It won ImageNet by a wide margin and started the modern era, the story told in [[cs/history/deep-learning-revolution|the deep learning revolution]] note.
- **ResNet (He et al., 2015)** solved the problem that plain networks got worse past a couple dozen layers. Its residual connections let each layer learn a change to its input rather than a fresh transformation, so gradients flow through skip paths and networks of over a hundred layers train successfully. ResNet won ImageNet 2015 with 152 layers.

The through-line is depth. Each jump added layers, and each needed one enabling trick, ReLU and GPUs for AlexNet, residual connections for ResNet, to keep [[cs/machine-learning/gradient-descent|gradient descent]] working at that depth.

> [!tip] Depth is the point
> More layers means a longer chain of [[cs/machine-learning/features-and-representations|learned representations]], from edges to parts to objects. The architectures differ mostly in how they keep training stable as that chain gets longer, which is also why [[cs/deep-learning/regularization-in-deep-learning|regularization]] like dropout and batch normalization shows up alongside them.

## Related Notes

- [[cs/deep-learning/convolutional-neural-networks|Convolutional Neural Networks]], the convolution operation these architectures stack
- [[cs/history/deep-learning-revolution|The Deep Learning Revolution]], AlexNet in historical context
- [[cs/deep-learning/activation-functions|Activation Functions]], the ReLU that helped AlexNet train
- [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]], dropout and batch norm used in these models
- [[cs/machine-learning/gradient-descent|Gradient Descent]], what residual connections keep working at depth
- [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]], the deep learning layer these models define

## Sources

- "Convolutional neural network," Wikipedia. https://en.wikipedia.org/wiki/Convolutional_neural_network . Supports max/average pooling as downsampling with translation invariance, LeNet-5 (LeCun, 1998), and the AlexNet template.
- "AlexNet," Wikipedia. https://en.wikipedia.org/wiki/AlexNet . Supports AlexNet (2012) as a deep CNN with ReLU, dropout, and GPU training that won ImageNet by a large margin.
- Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun, "Deep Residual Learning for Image Recognition," 2015. https://arxiv.org/abs/1512.03385 . Supports ResNet reformulating layers as learning residual functions with reference to their inputs (F(x)+x via skip connections) so gradients flow through shortcut paths, very deep networks (152 layers, far deeper than VGG) training successfully and gaining accuracy from depth, and winning the ILSVRC 2015 classification task.
- Stanford CS231n, "Convolutional Networks." https://cs231n.github.io/convolutional-networks/ . Supports pooling mechanics, strided-convolution alternatives, and typical convolution/pool/fully-connected layer patterns.
