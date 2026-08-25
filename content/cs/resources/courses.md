---
title: Courses
description: Open courses and teaching material the garden's notes cite, with back-links to the notes that use them.
draft: false
comments: true
tags:
  - cs
  - resources
  - resource/course
date: 2026-07-26
updated:
aliases: []
---

Open course notes and teaching material that notes here actually draw on. This is a short shelf on purpose: a course earns a place by being cited, not by being famous.

### Machine learning and computer vision

**[CS231n: Deep Learning for Computer Vision](https://cs231n.github.io/)**, Stanford University. The course notes are published openly and stand on their own as a text. They are the reference this garden reaches for whenever the question is mechanical rather than conceptual: how a loss is actually computed, how gradients actually flow backward, what a convolution does to a volume.

Cited by [[cs/machine-learning/train-validation-test|Train/Validation/Test]] (classification notes), [[cs/machine-learning/loss-functions|Loss Functions]] (linear classification), [[cs/machine-learning/gradient-descent|Gradient Descent]] (optimization), [[cs/deep-learning/backpropagation|Backpropagation]] (optimization part 2), [[cs/deep-learning/activation-functions|Activation Functions]] and [[cs/deep-learning/artificial-neural-networks|Artificial Neural Networks]] (neural networks part 1), [[cs/deep-learning/convolutional-neural-networks|CNNs]] and [[cs/deep-learning/pooling-and-cnn-architectures|Pooling and CNN Architectures]] (convolutional networks).

### Security and reliability

**[Fuzz Testing of Application Reliability](https://pages.cs.wisc.edu/~bart/fuzz/)**, University of Wisconsin-Madison. The project page for the original fuzz work and the studies that followed it. Worth reading as primary material: fuzzing began as a class project testing whether UNIX utilities would survive random input, and many of them did not.

Cited by [[cs/security/fuzzing|Fuzzing]].

### Engineering practice

**[Google Engineering Practices: Speed of Code Reviews](https://google.github.io/eng-practices/review/reviewer/speed.html)**. Google's published guidance on review turnaround, and one of the few openly available documents that treats review latency as an engineering variable rather than a matter of manners.

Cited by [[cs/software-engineering/code-review|Code Review]].

## Related Notes

- [[cs/resources/index|Resources]]
- [[cs/resources/books|Books]]
- [[cs/resources/papers|Papers]]
- [[cs/resources/code|Code]]

## Sources

- CS231n. https://cs231n.github.io/ . Title "CS231n Deep Learning for Computer Vision" and the statement that the notes accompany the Stanford CS class.
- University of Wisconsin-Madison. https://pages.cs.wisc.edu/~bart/fuzz/ . Title "Fuzz Testing of Application Reliability".
- Google. https://google.github.io/eng-practices/review/reviewer/speed.html . Title "Speed of Code Reviews".
