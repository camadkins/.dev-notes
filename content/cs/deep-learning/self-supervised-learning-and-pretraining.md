---
title: Self-Supervised Learning and Pretraining
description: How models learn from unlabeled data by inventing their own supervision, from masked-token prediction to contrastive objectives, and why pretrain-then-finetune became the default pipeline.
draft: false
comments: true
tags:
  - cs
  - deep-learning
  - unsupervised-learning
date: 2026-06-14
aliases:
  - self-supervised learning
  - SSL
  - pretraining
  - masked language modeling
  - contrastive learning
---

Labels are the expensive part of [[cs/machine-learning/supervised-learning|supervised learning]]. Text, images, audio, and video exist in effectively unlimited quantity; annotated text, images, audio, and video do not. Self-supervised learning is the move that makes the unlabeled pile usable: train the model on a task whose answers are already inside the data, then keep the representation and throw the task away.

> [!note] The idea
> Self-supervised learning trains a model on a task using the data itself to generate supervisory signals, rather than relying on externally-provided labels. The pretext task is disposable scaffolding. Nobody cares whether a model can guess a deleted word or tell two crops of the same photo apart. What matters is that succeeding at a well-chosen pretext task is impossible without building the representation you actually wanted, and that representation transfers.

## The two-step shape

The paradigm has a fixed structure. First the model solves an auxiliary or pretext task using pseudo-labels, labels generated automatically from the data rather than annotated by a person, which initializes the model parameters. Then the actual task is performed with supervised or unsupervised learning on top of those parameters. Tasks are designed so that solving them requires capturing essential features or relationships in the data, typically by augmenting or transforming the input to create pairs of related samples, one serving as input and the other as the supervisory signal.

That second phase is [[cs/deep-learning/transfer-learning|transfer learning]] by another name, and it is where the economics change. Pretraining is done once, expensively, on [[cs/law/gdpr-as-it-reaches-us-engineers|a giant unlabeled corpus]]. Fine-tuning is done many times, cheaply, on whatever small labeled dataset a particular problem happens to have.

## Masked language modeling

The clearest instance is BERT, which is trained by masked token prediction and next sentence prediction, learning contextual latent representations of tokens in their context.

In masked language modeling, 15% of tokens are randomly selected for the masked-prediction task, and the training objective is to predict the masked token given its context. The selection procedure has a wrinkle worth understanding, because it exposes a general hazard in inventing your own supervision. A selected token is replaced with a `[MASK]` token with probability 80%, replaced with a random word token with probability 10%, and left alone with probability 10%.

> [!warning] The pretext task must not deform the input distribution
> Masking every selected token would mean the model only ever sees inputs containing `[MASK]`, while at deployment it sees ordinary sentences that contain none. That gap is the dataset shift problem: the distribution of inputs seen during training differs significantly from the distribution encountered during inference. The 80/10/10 split exists to blunt it. Wikipedia's account also records the later verdict that more diverse training objectives are generally better.

> [!example] One masking draw
> Take "my dog is cute", tokenized as `my` `dog` `is` `cute`, and suppose the 4th token is picked. With probability 80% it becomes `my dog is [MASK]`; with probability 10% it is replaced by a uniformly sampled random token, say `my dog is happy`; with probability 10% nothing changes and the input stays `my dog is cute`. The model's 4th output vector is then passed to a decoder layer producing a probability distribution over the 30,000-dimensional [[cs/deep-learning/tokenization-and-subword-units|vocabulary]].

The payoff is architectural reuse. A task head is necessary for pretraining but usually unnecessary downstream. You remove the pretraining head, replace it with a newly initialized module suited to the task, feed the model's latent representation into it, and fine-tune, which yields sample-efficient transfer. BERT was meant as a general pretrained model: after pretraining, it can be fine-tuned with fewer resources on smaller datasets for natural language inference, text classification, question answering, and generation.

The historical contrast is with context-free embeddings. Word2vec or GloVe generate a single vector per vocabulary word, so "running" gets the same representation in "He is running a company" and "He is running a marathon". BERT, pretrained bidirectionally on a plain text corpus, produces a different [[cs/deep-learning/embeddings|contextual embedding]] in each sentence.

## Contrastive objectives

Text has an obvious pretext task because deleting a word leaves an unambiguous target. Images do not. The dominant answer there is contrastive: instead of predicting content, predict which things go together.

Contrastive self-supervised learning uses both positive and negative examples, with a loss that minimizes [[cs/math/vectors-and-dot-products|the distance between positive sample pairs]] while maximizing the distance between negative pairs. The positives come from augmentation. Two random crops, color jitters, or flips of the same image are declared a positive pair, and everything else in the batch is a negative.

SimCLR (Chen, Kornblith, Norouzi, and Hinton, 2020) stripped this down to essentials, removing the specialized architectures and memory banks earlier methods needed, then studied which parts actually mattered. Three findings came out of it. The composition of data augmentations plays a critical role in defining effective predictive tasks, since the augmentations are the pretext task. Introducing a learnable nonlinear transformation between the representation and the contrastive loss substantially improves representation quality, which means the layer you keep should not be the layer the loss is applied to. And contrastive learning benefits from larger batch sizes and more training steps compared to supervised learning, a direct consequence of negatives being drawn from the batch.

The numbers make the label-efficiency case concretely. A linear classifier trained on SimCLR's self-supervised representations reached 76.5% top-1 accuracy on ImageNet, a 7% relative improvement over the previous state of the art, matching the performance of a supervised ResNet-50. Fine-tuned on only 1% of the labels, it reached 85.8% top-5 accuracy, outperforming AlexNet with 100 times fewer labels.

Not every method needs negatives. Non-contrastive self-supervised learning uses only positive examples and, counterintuitively, converges on [[cs/math/convexity-and-optimization-basics|a useful local minimum]] rather than collapsing to the trivial zero-loss solution of calling everything positive. Making that work requires an extra predictor on the online side that does not backpropagate on the target side, which is an odd-looking constraint until you see it as the thing preventing collapse.

## Where reconstruction fits

Training an [[cs/deep-learning/autoencoders|autoencoder]] is intrinsically self-supervised, since the output has to be an optimal reconstruction of the input itself. Wikipedia's survey files this under autoassociative self-supervised learning: the model associates the data with itself, learning a latent representation by minimizing reconstruction error. In current usage, though, "self-supervised" more often refers to a designed pretext task, and the design of that task is where the human judgment moved after it left the labeling process.

## Related Notes

- [[cs/deep-learning/transfer-learning]], the second half of the pipeline that pretraining feeds
- [[cs/deep-learning/autoencoders]], reconstruction as the earliest self-supervised objective
- [[cs/deep-learning/embeddings]], the representations pretraining is trying to produce
- [[cs/deep-learning/tokenization-and-subword-units]], the vocabulary masked language modeling predicts over
- [[cs/deep-learning/attention-and-transformers]], the architecture BERT pretrains
- [[cs/machine-learning/unsupervised-learning]], the wider family of label-free methods
- [[cs/machine-learning/supervised-learning]], the labeled regime this exists to economize on
- [[cs/deep-learning/meta-learning]], a different route to learning from little labeled data

## Sources

- "Self-supervised learning," Wikipedia. https://en.wikipedia.org/wiki/Self-supervised_learning . Supports the definition of the paradigm, the two-step pretext-then-task structure with pseudo-labels, the augmentation-pairs framing, the contrastive loss definition, non-contrastive learning and its predictor requirement, and autoassociative self-supervision via autoencoders.
- "BERT (language model)," Wikipedia. https://en.wikipedia.org/wiki/BERT_%28language_model%29 . Supports masked token prediction and next sentence prediction, the 15% selection and 80/10/10 replacement rule, the dataset shift rationale, the "my dog is cute" worked example and 30,000-dimensional vocabulary output, head replacement for downstream fine-tuning, and the contrast with context-free word2vec and GloVe embeddings.
- Ting Chen, Simon Kornblith, Mohammad Norouzi, and Geoffrey Hinton, "A Simple Framework for Contrastive Learning of Visual Representations," arXiv:2002.05709. https://arxiv.org/abs/2002.05709 . Supports SimCLR removing specialized architectures and memory banks, the three findings on augmentation composition, the learnable nonlinear projection, batch size and training length, and the 76.5% linear-evaluation and 85.8% top-5 with 1% labels results.
