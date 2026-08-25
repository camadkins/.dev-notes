---
title: Features and Representations
description: How a learning problem is described to a model, why the description often decides success more than the algorithm, and the shift deep learning makes by learning the description itself.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-13
aliases: []
---

A learning algorithm never sees the world. It sees numbers you chose to describe the world, and those numbers decide most of the outcome. Two teams with the same algorithm and the same data can get very different results because one described the inputs well and the other did not. The description is called the feature representation, and understanding it is the difference between blaming your model and fixing your inputs.

> [!note] The idea
> A feature is a measured property used to describe an example, and the set of features is the representation the model actually learns from. Classical machine learning depends on humans engineering good features by hand; deep learning's defining move is to learn the representation itself from raw input.

## Features: the description you choose

To recognize trucks, Scott's course describes each vehicle by features like number of wheels (an integer), relative height (height divided by width), and whether it hauls cargo (yes or no). Those are deliberate choices. Pick features that expose the pattern and a simple model succeeds; pick poor ones and no model recovers. Good features are informative, not redundant, and comparable in scale, which is why practitioners standardize and combine raw measurements before training.

This hand-work is feature engineering, and for decades it was where most of the effort and most of the expertise in a machine learning project lived. A [[cs/statistics/simple-linear-regression|linear model]] on well-engineered features often beat a fancier model on raw ones.

## Representation: what the model works in

The representation is the space the model reasons in. Raw pixels are a representation, but a poor one for recognizing objects, because the thing you care about (is there a cat?) is tangled across thousands of correlated values. A good representation untangles the factors of variation so that the target becomes easy to read off. [[cs/math/linear-algebra-fundamentals|Linear algebra]] is the language here: features are vectors, and a representation is a chosen coordinate system.

> [!tip] Representation learning is the deep learning bet
> Instead of engineering features by hand, a deep network learns them. Early layers of a [[cs/deep-learning/convolutional-neural-networks|convolutional network]] discover edges and textures, later layers discover parts and objects, all driven by the training signal. This is why deep learning sits at its own layer in [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]]: it makes a claim about representation itself, where classical machine learning only claims to learn from data.

## Learned representations elsewhere

The idea shows up wherever raw symbols are turned into useful vectors. Word [[cs/deep-learning/embeddings|embeddings]] replace arbitrary word indices with dense vectors whose geometry encodes meaning. An [[cs/deep-learning/autoencoders|autoencoder]] learns a compressed representation by forcing data through a bottleneck. In every case the model is doing for itself the work a human used to do by hand.

> [!warning] Garbage in stays garbage
> A learned representation still starts from whatever raw signal you feed it. Deep learning reduces the need for hand-engineered features, but it does not remove the need for relevant, sufficient, unbiased input data. The representation can only be as good as what it is built from.

## Related Notes

- [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]], where representation learning defines the DL layer
- [[cs/machine-learning/supervised-learning|Supervised Learning]], which consumes these features
- [[cs/deep-learning/embeddings|Embeddings]], learned representations of discrete symbols
- [[cs/deep-learning/autoencoders|Autoencoders]], learned compressed representations
- [[cs/deep-learning/convolutional-neural-networks|Convolutional Neural Networks]], which learn spatial features layer by layer
- [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]], the vector language of representations

## Sources

- "Feature (machine learning)," Wikipedia. https://en.wikipedia.org/wiki/Feature_%28machine_learning%29 . Supports the definition of a feature as a measurable property and the importance of informative, discriminating features.
- "Feature engineering," Wikipedia. https://en.wikipedia.org/wiki/Feature_engineering . Supports hand-designing features from raw data as a central, effort-heavy step in classical ML.
- "Feature learning," Wikipedia. https://en.wikipedia.org/wiki/Feature_learning . Supports representation learning as automatically discovering features from raw data, contrasted with manual feature engineering.
- Goodfellow, Bengio, Courville, *Deep Learning*, MIT Press. https://www.deeplearningbook.org/contents/ml.html . Supports representation as the space that makes a task easy and deep learning as layered representation learning.
