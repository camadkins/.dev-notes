---
title: Regularization in Deep Learning
description: Why deep nets need deliberate handicaps, and how weight decay, early stopping, dropout, batch normalization, and data augmentation provide them.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-13
aliases: []
---

A deep network with enough parameters can drive its training loss to nearly zero by memorizing the training set, noise and all. That is [[cs/machine-learning/generalization-vs-memorization|overfitting]], and deep nets are unusually good at it because their hypothesis space is enormous relative to what most problems actually require. Regularization is the family of countermeasures: deliberate constraints on training that give up a little training accuracy in exchange for better performance on data the network has never seen.

> [!note] The idea
> Do not minimize training loss alone. Constrain the fit (penalize large weights, stop training early, inject noise, enlarge the data) so the network is forced to learn the pattern instead of the particulars. This is the deep-learning face of the general [[cs/machine-learning/bias-variance-tradeoff]]: every technique here buys variance reduction at the price of some bias.

## Weight decay: penalize complexity directly

The most direct approach modifies the objective. Instead of minimizing the loss $J(\theta; \mathcal{X}, y)$ alone, minimize

$$\tilde{J}(\theta; \mathcal{X}, y) = J(\theta; \mathcal{X}, y) + \alpha\,\Omega(\theta)$$

where $\Omega(\theta)$ is [[cs/math/convexity-and-optimization-basics|a complexity penalty on the parameters]] and $\alpha \geq 0$ sets the exchange rate between fitting the data and staying simple. Goodfellow, Bengio, and Courville treat these parameter norm penalties as the classical core of regularization in chapter 7 of *Deep Learning*.

The $L^2$ penalty, $\Omega(\theta) = \tfrac{1}{2}\lVert\theta\rVert_2^2$, is what people usually mean by weight decay. It pulls every weight toward zero. That matters for networks specifically because large weights push activation functions into their strongly nonlinear regimes, making the learned function more complex than the data justifies. The $L^1$ penalty, $\Omega(\theta) = \lVert\theta\rVert_1$, also penalizes large weights but has a different character: it can drive individual weights exactly to zero, producing sparse solutions, which is why $L^1$ shows up in feature selection (the LASSO family of methods). Both penalties act through the same [[cs/machine-learning/gradient-descent]] machinery as the loss itself.

## Early stopping: quit while you are ahead

Train a net long enough and a familiar picture emerges: training error keeps falling while validation error bottoms out and then climbs. Past that turning point, every additional step fits the training data better and generalizes worse. Early stopping is the regularizer that simply refuses to continue. Hold out a validation set (see [[cs/machine-learning/train-validation-test]]), track validation error during training, and stop when it starts to deteriorate, keeping the parameters from the best validation point. The validation error serves as a proxy for generalization error, which is exactly why the examples used for stopping cannot also be used to fit the model.

It is hard to beat for cost. You were computing validation error anyway, and the technique adds no new terms to the objective.

## Dropout: train an ensemble by demolition

Dropout (Srivastava, Hinton, Krizhevsky, Sutskever, and Salakhutdinov, JMLR 2014) randomly removes units, along with their connections, from the network during training. Each training step samples a random mask, so each step trains a different "thinned" subnetwork drawn from [[cs/math/combinatorics|an exponential number of possibilities]] that all share weights.

![Dropout randomly masks units during a training step](cs/deep-learning/assets/dropout-masking.svg)

The point of the demolition is to prevent units from co-adapting, where a unit only works as part of a specific committee of other units. Under dropout, a unit cannot rely on any particular colleague being present, so it must learn features that are useful on their own. At test time, running the whole exponential ensemble would be absurd, so dropout approximates the ensemble average with a single unthinned network whose weights are scaled down to match the training-time expectations. The authors reported that this simple recipe reduced overfitting and improved state-of-the-art results across vision, speech recognition, document classification, and computational biology benchmarks. The variance-reduction logic is the same as [[cs/machine-learning/decision-trees-and-ensembles|bagging an ensemble of decision trees]], with one twist: the thinned subnetworks share weights instead of being trained independently.

## Batch normalization: stabilizer first, regularizer second

Batch normalization (Ioffe and Szegedy, 2015) attacks a training pathology the authors called internal covariate shift: the distribution of each layer's inputs keeps changing during training because the parameters of the layers before it keep changing. Their fix normalizes layer inputs per mini-batch (subtract the batch mean, divide by the batch standard deviation), then restores expressive power through learned scale and shift parameters $\gamma$ and $\beta$.

Strictly speaking this is an optimization aid. It permits much higher learning rates and less careful initialization, and the paper reports matching a state-of-the-art image classifier's accuracy with 14 times fewer training steps. But it earns its place in this note because the batch statistics inject noise that has a regularizing side effect: the authors found that in some cases it reduces or even eliminates the need for dropout.

## Data augmentation: buy generalization with fake data

Overfitting is worst when the hypothesis space is huge and the dataset is small, so one honest fix is more data. When you cannot collect more, manufacture it. Data augmentation enlarges the training set with transformed copies of existing examples (translations, rotations, scalings, noise injection for images) that change the input without changing the label. The network is forced to become invariant to transformations it will meet in the wild.

> [!warning]
> The transformations must actually preserve the label. Mirror a "b" and you get a "d"; rotate a "6" far enough and it becomes a "9". And when you split data for evaluation, keep every augmented copy on the same side of the split as its original, or the test set silently leaks into training.

> [!example]
> A digit classifier trained on 10,000 handwritten digits can become a classifier trained on 60,000 by adding small shifts and rotations of each image, five variants apiece. None of the new images required a human labeler, and the classifier learns that a shifted "3" is still a "3". The one forbidden move: letting an augmented copy of a test image appear in the training set.

## Related Notes

- [[cs/machine-learning/generalization-vs-memorization|overfitting]], the failure mode all of this exists to prevent
- [[cs/machine-learning/bias-variance-tradeoff]], the general principle these techniques trade on
- [[cs/machine-learning/train-validation-test]], the data discipline that early stopping and honest evaluation depend on
- [[cs/machine-learning/gradient-descent]], the optimizer these penalties and schedules act through
- [[cs/deep-learning/artificial-neural-networks]], the models being regularized
- [[cs/machine-learning/ai-vs-ml-vs-dl]], where deep learning sits in the wider field
- [[cs/deep-learning/meta-learning]], a different answer to small data: learn across tasks instead of constraining one

## Sources

- Srivastava, Hinton, Krizhevsky, Sutskever, Salakhutdinov, "Dropout: A Simple Way to Prevent Neural Networks from Overfitting," JMLR 15:1929-1958, 2014: https://jmlr.org/papers/v15/srivastava14a.html
- Ioffe and Szegedy, "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift," 2015: https://arxiv.org/abs/1502.03167
- Goodfellow, Bengio, Courville, *Deep Learning*, chapter 7, "Regularization for Deep Learning": https://www.deeplearningbook.org/contents/regularization.html
- Wikipedia, "Early stopping": https://en.wikipedia.org/wiki/Early_stopping
