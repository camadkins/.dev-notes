---
title: Attention and Transformers
description: The architecture that let every word look at every other word at once, dropped recurrence entirely, and became the engine of every large language model. Self-attention, multi-head attention, and the Transformer stack.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-23
updated:
aliases:
  - Transformers
  - Self-Attention
  - Attention Mechanism
---

[[recurrent-neural-networks|Recurrent networks]] read a sequence one step at a time, threading everything through a single hidden state. That design has two problems: it [[cs/military-computing/illiac-iv-and-parallel-processing|cannot be parallelized]] (step $t$ needs step $t-1$), and distant words interact only weakly, through a long chain of state updates that tends to forget. The Transformer, introduced in 2017, threw out recurrence altogether and replaced it with attention, letting every position in a sequence look directly at every other position, all at once. It is the architecture behind essentially every [[cs/ethics/could-an-llm-be-conscious|large language model]], and it is hackathon 6's destination after the LSTM.

> [!note] The idea
> Attention lets each position in a sequence pull information directly from every other position, weighted by how relevant they are, in a single parallel operation. The Transformer is built almost entirely from stacked self-attention and feed-forward layers, with no recurrence and no convolution. Removing the sequential dependency is what made training parallelize across a whole sequence at once, and letting any word attend to any other is what fixed the long-range-dependency problem recurrence struggled with.

## Scaled dot-product attention

The core operation takes three inputs, all vectors derived from the sequence: a query, a set of keys, and a set of values. Each query is compared against every key by a [[cs/math/vectors-and-dot-products|dot product]] to score relevance, the scores are softmax-normalized into weights, and the output is the weighted sum of the values. The paper writes it in one line:

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$$

The one subtlety is the $\sqrt{d_k}$ divisor. The paper explains that for large key dimension $d_k$, the dot products grow large in magnitude, pushing the softmax into regions where its gradients are extremely small; dividing by $\sqrt{d_k}$ counteracts that so training stays healthy, the same [[vanishing-and-exploding-gradients|vanishing-gradient]] concern that runs through deep learning.

## Self-attention: every position attends to all positions

In self-attention, the queries, keys, and values are all computed from the same sequence. Every position produces a query and compares it against the keys of all positions, so each word's new representation is a blend of the whole sequence, weighted by relevance. This is what the LSTM could only approximate through its cell state: here, a word at the end of a sentence can attend directly to a word at the beginning in a single step, with no information bottleneck between them. In the decoder, a mask prevents a position from attending to future positions, which preserves the left-to-right generation that language models rely on.

## Multi-head attention

Rather than run attention once, the Transformer runs it several times in parallel. The paper uses $h = 8$ heads: the queries, keys, and values are linearly projected into lower-dimensional subspaces ($d_k = d_v = 512/8 = 64$), attention is computed independently in each, and the results are concatenated and projected back. As the authors put it, this lets the model jointly attend to information from different representation subspaces at different positions. One head might track syntactic agreement while another tracks coreference; the split gives attention several relationships to model at once.

## The Transformer stack

A full Transformer stacks $N = 6$ identical layers in an encoder and a decoder. Each layer pairs a multi-head self-attention sublayer with a position-wise feed-forward network (two [[cs/math/matrices-and-linear-transformations|linear transformations]] with a ReLU between). Because there is no recurrence or convolution, the model has no inherent sense of order, so positional encodings, fixed sine and cosine patterns, are added to the input [[embeddings|embeddings]] to inject each token's position. The result trains faster than recurrent models (everything parallelizes) and reached better translation quality with less training time.

> [!tip] Attention is why pretraining took over language
> The Transformer made large-scale pretraining practical, and BERT is the landmark case. Devlin and colleagues pretrained a deep bidirectional Transformer on unlabeled text with a masked-language-model objective (predict hidden words from both left and right context), then showed it could be fine-tuned with a single added output layer to reach state-of-the-art results on eleven NLP tasks. That is [[transfer-learning|transfer learning]] for language: learn general representations once on a huge corpus, adapt cheaply to each task. Every modern language model is this idea scaled up, which is why the architecture in this note is the one worth knowing best.

## Related Notes

- [[recurrent-neural-networks|Recurrent Neural Networks]] - the sequential architecture the Transformer replaced, and the long-range-dependency problem attention solves
- [[embeddings|Embeddings]] - the token vectors that attention operates on, plus the positional encodings added to them
- [[transfer-learning|Transfer Learning and Reusing Pretrained Layers]] - the pretrain-then-fine-tune pattern BERT brought to language
- [[vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]] - the small-gradient softmax regime the $\sqrt{d_k}$ scaling exists to avoid
- [[backpropagation|Backpropagation]] - how the whole attention stack is trained end to end

## Sources

- Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, and Illia Polosukhin, "Attention Is All You Need," 2017. https://arxiv.org/abs/1706.03762 . Supports the Transformer being based solely on attention with no recurrence or convolution (enabling parallelization and better translation with less training); scaled dot-product attention $\text{softmax}(QK^\top/\sqrt{d_k})V$ with the $\sqrt{d_k}$ scaling to avoid small-gradient softmax regions; multi-head attention ($h=8$ heads over projected subspaces, concatenated); self-attention where Q, K, V come from the same sequence; and the $N=6$ encoder-decoder stack with position-wise feed-forward layers and sinusoidal positional encodings.
- Jacob Devlin, Ming-Wei Chang, Kenton Lee, and Kristina Toutanova, "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding," 2018. https://arxiv.org/abs/1810.04805 . Supports BERT pretraining deep bidirectional representations from unlabeled text by conditioning on both left and right context (masked language model), being fine-tunable with one additional output layer, and reaching state-of-the-art results on eleven NLP tasks.
