---
title: Meta-Learning
description: Learning to learn - training across many tasks so a model can pick up a new task from a handful of examples, with MAML as the flagship idea.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-13
aliases:
  - MAML
---

Show a child one picture of an okapi and they will recognize okapis for the rest of their life. Show a conventionally trained neural network one picture and it has learned almost nothing, because ordinary [[cs/machine-learning/supervised-learning]] treats every new task as a fresh start requiring thousands of labeled examples. Meta-learning closes that gap by moving the learning up a level: instead of learning one task from many examples, the system learns *across many tasks* how to learn, so that the next task takes only a few examples.

> [!note] The idea
> Treat entire tasks the way ordinary training treats examples. Over many learning episodes, improve the learning algorithm itself (its comparisons, its memory, or its starting point) so that adaptation to a new task becomes fast and data-cheap. The literature calls this "learning to learn."

## Why one level up

Every learning algorithm carries an [[cs/statistics/bayesian-inference|inductive bias]], a set of built-in assumptions about the data, and no single bias works well everywhere. Ordinary training fixes the algorithm and fits the data. Meta-learning instead uses experience from many learning episodes to improve the algorithm, a framing the Hospedales et al. survey (2020) uses to distinguish it from solving each task from scratch with a hand-designed learner. The payoff shows up exactly where deep learning is weakest: settings with a data bottleneck, where a big net would simply memorize its handful of examples (the same failure mode that [[cs/deep-learning/regularization-in-deep-learning]] fights within a single task).

## Few-shot learning, the benchmark setting

The standard proving ground is few-shot classification: learn a task from only a small number of labeled examples per class. Benchmarks phrase it as N-way K-shot, distinguish among N classes given K labeled examples of each. One-shot learning is the special case K = 1, generalizing from exactly one example per class, and zero-shot learning is the limiting case where the target class has no examples at all and the task must be generalized from other classes.

A meta-learner is trained on a stream of small tasks of this shape (different classes each time) and evaluated on its ability to handle a task built from classes it has never seen.

## Three families of approach

The field sorts roughly into three strategies, differing in *what* gets learned at the meta level:

**Metric-based** methods learn an embedding space and a comparison function, then classify new examples by similarity to the few labeled ones, in the spirit of nearest neighbors. Siamese networks, matching networks, and prototypical networks (which compare against a learned prototype per class) are the canonical examples.

**Model-based** methods build fast adaptation into the architecture itself, typically through some form of internal or external memory. Memory-augmented neural networks are the representative case: the network's stored state, not gradient updates, carries the new task.

**Optimization-based** methods keep ordinary gradient training but learn a better optimization process or starting point, so that a few gradient steps suffice. MAML and its relatives (Reptile, the LSTM meta-learner) live here.

## MAML: learn an initialization worth fine-tuning

Model-Agnostic Meta-Learning (Finn, Abbeel, and Levine, 2017) is the cleanest expression of the optimization-based idea. "Model-agnostic" means it assumes nothing about the architecture beyond one thing: the model is trained with [[cs/machine-learning/gradient-descent]]. That makes it applicable to essentially any modern network, including any [[cs/deep-learning/artificial-neural-networks|artificial neural network]] you would train normally.

![MAML's inner loop adapts to each task while the outer loop improves the shared initialization](cs/deep-learning/assets/maml-loops.svg)

The mechanism is two nested loops. The **inner loop** takes the current shared parameters $\theta$ and adapts a copy to one specific task using a small number of gradient steps on a small amount of that task's data. The **outer loop** then asks the meta-question: after that cheap adaptation, how well did the adapted model do? It updates $\theta$ itself to make the answer better next time. Nothing about the trained model is exotic; what is special is where it starts. MAML deliberately optimizes for maximal sensitivity to fine-tuning, an initialization from which a few steps in any task's direction go a long way.

Finn et al. demonstrated the recipe on few-shot image classification (where it was state-of-the-art on standard benchmarks at publication), few-shot regression, and reinforcement learning with neural network policies, which is a strong argument that the idea really is model-agnostic.

> [!example]
> A 5-way 1-shot episode: hand the meta-trained model one labeled photo each of five animal species it has never seen, let it take a few gradient steps on those five images, then ask it to classify new photos of those species. A network trained from scratch on five images would be hopeless. A MAML-trained network can do this because thousands of earlier episodes shaped its initialization for exactly this kind of quick pivot.

## Related Notes

- [[cs/machine-learning/supervised-learning]], the one-task-many-examples baseline meta-learning generalizes
- [[cs/machine-learning/gradient-descent]], the machinery MAML's inner and outer loops both run on
- [[cs/deep-learning/artificial-neural-networks]], the models being meta-trained
- [[cs/deep-learning/regularization-in-deep-learning]], the within-task answer to scarce data; meta-learning is the across-task answer
- [[cs/machine-learning/ai-vs-ml-vs-dl]], where all of this sits in the wider field

## Sources

- Finn, Abbeel, Levine, "Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks," ICML 2017: https://arxiv.org/abs/1703.03400
- Hospedales, Antoniou, Micaelli, Storkey, "Meta-Learning in Neural Networks: A Survey," 2020: https://arxiv.org/abs/2004.05439
- Wikipedia, "Meta-learning (computer science)": https://en.wikipedia.org/wiki/Meta-learning_%28computer_science%29
- Wikipedia, "Few-shot learning": https://en.wikipedia.org/wiki/Few-shot_learning
