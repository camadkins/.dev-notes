---
title: "Géron Catch-Up: Chapters 1, 4, 10"
description: The through-line across Hands-On ML chapters 1, 4, and 10. One loop runs through all three, and Chapter 10 is Chapter 4 stacked into layers.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-20
updated: 2026-07-23
maturity: seed
aliases:
  - geron catch-up
  - hands-on ml study guide
---

You are behind and the three chapters feel like three different subjects. They are not. This note exists to give you the one idea that ties Chapter 1 (the landscape), Chapter 4 (training models), and Chapter 10 (neural nets with Keras) into a single story, then walks each chapter's role in that story. Read the spine first. If nothing else sticks, that does.

Each deep-dive links back to the note where you already worked the details out, so this is a map, not a replacement.

> [!abstract] The one loop (read this even if you read nothing else)
> Every model in these three chapters is the **same four-step loop**:
> 1. **Model** — a function with tunable parameters that turns inputs into a prediction.
> 2. **Cost** — one number saying how wrong the predictions are ([[cs/machine-learning/loss-functions|loss function]]).
> 3. **Gradient** — the slope of that cost with respect to every parameter.
> 4. **Update** — nudge the parameters against the gradient ([[cs/machine-learning/gradient-descent|gradient descent]]), repeat.
>
> **Chapter 1** names the tension this loop must survive: fit the training data *without* memorizing it. **Chapter 4** runs the loop on the simplest models, where you can see every term of the math. **Chapter 10** stacks that exact loop into layers and calls it a neural network; backpropagation is just this loop's gradient step, computed with the chain rule to reach the buried weights.
>
> That's it. The rest is detail.

---

## The through-line in one picture

```
INPUT  ──►  MODEL(θ)  ──►  PREDICTION  ──►  COST(prediction, truth)
              ▲                                     │
              │                                     ▼
           UPDATE θ  ◄──────  GRADIENT of COST w.r.t. θ
```

| | Chapter 4 (linear/logistic regression) | Chapter 10 (neural network) |
|---|---|---|
| **Model** | $\hat{y} = \mathbf{x}^\top \boldsymbol{\theta}$ — one weighted sum | Many weighted sums, stacked in layers, each followed by a nonlinearity |
| **Parameters θ** | one weight per feature + bias | one weight per connection + one bias per neuron (thousands to billions) |
| **Cost** | MSE (regression) or log loss (classification) | same losses — MSE, cross-entropy |
| **Gradient** | derivative by hand / normal equation | **backpropagation** = chain rule through the layers |
| **Update** | gradient descent | the *same* gradient descent (SGD, Adam…) |

The only genuinely new machinery in Chapter 10 is **backprop** (how to get the gradient when parameters are buried under other parameters) and **activation functions** (the nonlinearity that makes stacking layers worth anything). Everything else you already met in Chapter 4.

---

## Chapter 1 — The Landscape (the vocabulary the other chapters assume)

Chapter 1 is not math; it is the map and the vocabulary. Its real job is to plant the **central problem** that Chapters 4 and 10 spend all their effort solving: *generalization*.

### What machine learning is

A program that improves at a task by learning patterns from data, instead of being told the rules explicitly. The classic contrast is the spam filter: the rule-based version is a giant hand-written list of "if contains 'free money' then spam"; the ML version is *shown* labeled emails and figures out the signal itself. You reach for ML when the rules are too many, too fuzzy, or keep changing — see [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]] for where deep learning sits inside this.

### The kinds of learning

- **[[cs/machine-learning/supervised-learning|Supervised]]** — training data comes with the answers (labels). Two flavors: **regression** (predict a number, e.g. house price) and **classification** (predict a category, e.g. spam/ham). *Chapters 4 and 10 are almost entirely supervised.*
- **[[cs/machine-learning/unsupervised-learning|Unsupervised]]** — no labels; find structure yourself (clustering, dimensionality reduction).
- **Self-supervised / semi-supervised / reinforcement** — Géron lists these; you only need to recognize the words for now.
- **Instance-based vs model-based** — memorize examples and compare (k-NN) versus fit parameters to a model and throw the data away. *Everything in Ch 4 and Ch 10 is model-based* — that's why "training" means "finding good parameters."

### The one problem that never goes away: generalization

A model that does well on data it has never seen has **generalized**; a model that only does well on the data it trained on has **memorized**. See [[cs/machine-learning/generalization-vs-memorization|generalization vs memorization]].

> [!warning] The two failure modes
> - **Overfitting** — the model is too flexible; it fits the noise in the training set. Great training score, poor test score. (Think: memorizing the answer key instead of learning the subject.)
> - **Underfitting** — the model is too simple to capture the real pattern. Poor everywhere.
>
> This is the [[cs/machine-learning/bias-variance-tradeoff|bias–variance tradeoff]], and it is the *reason* Chapter 4's regularization and Chapter 10's dropout/early-stopping exist. Keep this pair in your head; every technique later is a lever on it.

### How you even measure generalization

You cannot judge generalization on data the model trained on, so you hold data back. See [[cs/machine-learning/train-validation-test|train / validation / test]].

- **Training set** — the model learns from it.
- **Validation set** — you tune knobs (hyperparameters, model choice) against it.
- **Test set** — touched once, at the very end, to estimate real-world performance.

The cardinal sin is letting test data leak into training or tuning; your score becomes a lie. Géron also flags **data mismatch** (validation data must look like production data) and the **no-free-lunch theorem** (no single model is best for every problem — you must try and compare).

> [!tip] What Chapter 1 is really setting up
> Everything after this is: build a model flexible enough to fit the signal (avoid underfitting) but constrained enough not to fit the noise (avoid overfitting), and *measure* which side you're on using held-out data. Chapters 4 and 10 are just increasingly powerful models pursuing that same balance.

---

## Chapter 4 — Training Models (the loop, with every term visible)

This is the most important chapter of the three, because it shows the whole loop on models simple enough that you can see all the math. Master this and Chapter 10 becomes "the same thing, bigger."

### 1. The model: linear regression

Predict a number as a weighted sum of the features plus a bias term:

$$\hat{y} = \theta_0 + \theta_1 x_1 + \dots + \theta_n x_n = \mathbf{x}^\top \boldsymbol{\theta}$$

The $\theta$'s are the parameters. "Training" = finding the $\theta$'s that make $\hat{y}$ close to the true $y$ across the training set. That's step 1 of the loop.

### 2. The cost: Mean Squared Error

"Close" needs a number. For regression that number is the **MSE** — average squared gap between prediction and truth:

$$\text{MSE}(\boldsymbol{\theta}) = \frac{1}{m} \sum_{i=1}^{m} \left( \mathbf{x}^{(i)\top} \boldsymbol{\theta} - y^{(i)} \right)^2$$

Squared, so over- and under-shooting both count as positive error and big misses hurt more. This is step 2. See [[cs/machine-learning/loss-functions|loss functions]] for why squared error specifically. **Training = find the $\boldsymbol{\theta}$ that minimizes this.** There are two ways to do it, and the whole chapter hinges on the contrast.

### 3a. Minimize directly: the Normal Equation (closed form)

For linear regression with MSE, calculus gives an exact formula for the minimizing $\boldsymbol{\theta}$ — no iteration:

$$\hat{\boldsymbol{\theta}} = (\mathbf{X}^\top \mathbf{X})^{-1} \mathbf{X}^\top \mathbf{y}$$

> [!note] Why you can't just always use this
> It requires inverting an $(n+1)\times(n+1)$ matrix ($n$ = number of features). That's roughly $O(n^{2.4})$ to $O(n^3)$ — fine for a few features, hopeless when $n$ is large, and it only exists because linear-regression-with-MSE happens to have a clean closed form. Neural networks have **no** such formula. So you need a method that works *for any differentiable model*.

### 3b. Minimize iteratively: Gradient Descent (the method that scales to everything)

Instead of solving for the minimum, walk downhill on the cost surface. This is steps 3–4 of the loop, and it's the method that carries all the way to Chapter 10.

$$\boldsymbol{\theta} \leftarrow \boldsymbol{\theta} - \eta \, \nabla_{\boldsymbol{\theta}} \, \text{MSE}(\boldsymbol{\theta})$$

The gradient $\nabla$ points uphill (steepest increase), so you step *against* it. $\eta$ is the **learning rate** — the step size. You already have the full treatment in [[cs/machine-learning/gradient-descent|gradient descent]]; the essentials Chapter 4 stresses:

- **Learning rate is a gamble.** Too small → training crawls. Too large → you overshoot the valley and can diverge.
- **The MSE surface for linear regression is a convex bowl**, so gradient descent is guaranteed to reach the global minimum. Neural-net surfaces are *not* convex, but the same procedure still finds good-enough parameters in practice.

### 4. Batch, Stochastic, Mini-batch

The knob is **how much data you use to estimate the gradient before each step**:

| Variant | Data per step | Trade |
|---|---|---|
| **Batch GD** | the entire training set | exact gradient, but slow per step on big data |
| **Stochastic GD (SGD)** | one random example | very fast, very noisy — bounces toward the minimum |
| **Mini-batch GD** | a small batch (e.g. 32–256) | the practical default: fast *and* stable |

Mini-batch is what Chapter 10 uses too. Same idea, unchanged.

> [!warning] Feature scaling is not optional for gradient descent
> If one feature ranges 0–1 and another 0–100000, the cost surface is a stretched ravine and gradient descent zig-zags slowly. **Scale your features** (standardize to mean 0, variance 1). The Normal Equation doesn't care about scaling; gradient descent very much does. This bites people constantly.

### 5. Nonlinear data: Polynomial Regression → Learning Curves → bias/variance

You can fit *curved* data with a linear model by adding powers of the features ($x, x^2, x^3, \dots$) as new features. The model is still "linear in the parameters," so nothing about the loop changes — you just have more features.

But now the danger is live: a high-degree polynomial can wiggle through every training point (**overfit**), while degree-1 can't bend at all (**underfit**). How do you *see* which you've got? **Learning curves** — plot training error and validation error as a function of training-set size:

> [!example] Reading a learning curve
> - **Both errors high and close together** → *underfitting*. More data won't help; you need a more powerful model or more features.
> - **Training error low, validation error much higher, big gap** → *overfitting*. More data or more regularization will help.
>
> This is the [[cs/machine-learning/bias-variance-tradeoff|bias–variance tradeoff]] made visual. High bias = underfit; high variance = overfit. Every knob in the rest of the chapter moves you along this axis.

### 6. Regularization — the anti-overfitting levers

Regularization = deliberately constraining the model so it can't fit noise. Chapter 4's linear versions all work by adding a penalty on the *size* of the weights to the cost:

- **Ridge (L2)** — penalty $\alpha \sum \theta_i^2$. Shrinks all weights toward zero smoothly. Keeps every feature but tames them.
- **Lasso (L1)** — penalty $\alpha \sum |\theta_i|$. Drives some weights *exactly* to zero → automatic feature selection (a sparse model).
- **Elastic Net** — a mix of L1 and L2 (a ratio knob between them).
- **Early stopping** — stop training the moment validation error starts rising. Dead simple, remarkably effective, and it reappears verbatim in Chapter 10.

> [!note] The one intuition for all of them
> Big weights let a model make sharp, confident swings to chase individual points — that's overfitting. Penalizing weight size forces smoother, humbler fits. In [[regularization-in-deep-learning|deep learning regularization]] the same idea returns as **weight decay** (L2), plus dropout and others. Same goal, same tradeoff axis.

### 7. Classification with the same loop: Logistic & Softmax Regression

Swap the output and the cost and the *identical* loop now does classification.

- **Logistic regression** — take the linear model's output and squash it through the **sigmoid** into a probability in $(0,1)$:
  $$\hat{p} = \sigma(\mathbf{x}^\top\boldsymbol{\theta}), \qquad \sigma(t) = \frac{1}{1 + e^{-t}}$$
  The cost is no longer MSE but **log loss** (a.k.a. binary cross-entropy) — it punishes confident wrong predictions hard. Minimized by the same gradient descent.
- **Softmax regression** — the multiclass generalization: output a probability for each of $K$ classes (they sum to 1), trained with **cross-entropy** loss. This is *exactly* the output layer of most Chapter 10 classifiers.

> [!tip] The payoff for Chapter 10
> A neural-net classifier's final layer **is** softmax regression, and its loss **is** cross-entropy. The sigmoid you just met is one of the [[activation-functions|activation functions]]. Chapter 4 didn't just teach regression — it pre-built Chapter 10's output layer and one of its activations.

---

## Chapter 10 — Neural Networks with Keras (the loop, stacked)

Now stack the loop. A neuron is a linear model ($\mathbf{x}^\top\boldsymbol{\theta}$) followed by a nonlinearity. A network is layers of those. See [[artificial-neural-networks|artificial neural networks]] for the full arc; here's the through-line.

### 1. Perceptron → why one layer isn't enough

The **perceptron** is a single layer of these neurons. It can only carve the input space with a straight line, so it famously **cannot learn XOR** — a problem that is not linearly separable. That limitation nearly killed the field. The fix: stack layers.

### 2. The Multilayer Perceptron (MLP), and why activations must be nonlinear

An MLP has an input layer, one or more **hidden layers**, and an output layer. Here is the single most important subtlety in the whole chapter:

> [!warning] Why the nonlinearity is the entire point
> Stack two *linear* layers and the result is still just linear — $W_2(W_1\mathbf{x}) = (W_2 W_1)\mathbf{x}$, one matrix. You gained nothing. The **[[activation-functions|activation function]]** (ReLU, sigmoid, tanh…) inserted between layers is the nonlinearity that lets depth actually build richer functions. Without it, a 100-layer network is exactly as powerful as linear regression. **ReLU** — $\max(0, z)$ — is the modern default because it's cheap and trains well.

This is also the answer to "what does a hidden layer *do*?" — it learns [[cs/machine-learning/features-and-representations|features]] automatically, instead of you hand-engineering polynomial terms like you did in Chapter 4.

### 3. Backpropagation = the gradient step of the loop (chain rule edition)

Here is the only genuinely new machine in Chapter 10, and it's less new than it looks.

In Chapter 4 you took the gradient of the cost with respect to a handful of weights — doable by hand. In a network, a weight in the first layer affects the cost only *through* every layer after it. To get its gradient you apply the **chain rule** repeatedly, layer by layer, from the output backward. That backward sweep is **[[backpropagation|backpropagation]]**.

> [!abstract] Backprop in one breath
> 1. **Forward pass** — run inputs through the network, compute the prediction and the cost. (This is just the model + cost, steps 1–2.)
> 2. **Backward pass** — apply the chain rule from the output back to every weight, computing $\partial\,\text{cost}/\partial\,\theta$ for all of them. (This is step 3, the gradient — for buried parameters.)
> 3. **Update** — gradient descent step on every weight. (Step 4, unchanged: SGD, Adam, etc.)
>
> Backprop is **not a new optimizer**. It's how you *obtain the gradient* efficiently when the parameters are stacked. The update is the same gradient descent from Chapter 4. That's the whole trick, and it's why this chapter is Chapter 4 wearing more layers.

### 4. Building it in Keras — the loop, in code

The Sequential API maps one-to-one onto the loop. Read the comments against the four steps:

```python
import tensorflow as tf
from tensorflow import keras

# MODEL (step 1): stack layers. Each Dense layer = weighted sums + activation.
model = keras.Sequential([
    keras.layers.Flatten(input_shape=[28, 28]),   # e.g. a 28x28 image → 784 inputs
    keras.layers.Dense(300, activation="relu"),    # hidden layer + nonlinearity
    keras.layers.Dense(100, activation="relu"),    # another hidden layer
    keras.layers.Dense(10,  activation="softmax"), # output = softmax regression (Ch 4!)
])

# COST (step 2) + UPDATE rule (step 4): pick the loss and the optimizer (gradient descent).
model.compile(
    loss="sparse_categorical_crossentropy",  # cross-entropy — the Ch 4 classification loss
    optimizer="sgd",                          # the Ch 4 gradient-descent update
    metrics=["accuracy"],
)

# GRADIENT (step 3) + looping: fit runs forward pass → backprop → update, epoch after epoch.
history = model.fit(X_train, y_train, epochs=30,
                    validation_data=(X_valid, y_valid))  # validation set from Ch 1!
```

Notice how much of this is Chapters 1 and 4 by another name: `softmax` and `crossentropy` are Chapter 4's classifier and loss, `sgd` is Chapter 4's optimizer, and `validation_data` is Chapter 1's held-out set for spotting overfitting. The *only* new lines are the stacked `Dense` layers and their `relu` activations.

### 5. The knobs Chapter 10 adds (all levers on the same bias/variance axis)

- **Number of hidden layers / neurons** — more capacity = more power = more overfitting risk.
- **Learning rate** — still the single most important hyperparameter, exactly as in Chapter 4.
- **Optimizer** — SGD, momentum, Adam. Same downhill loop, smarter steps (see [[cs/machine-learning/gradient-descent|the momentum/Adam family]]).
- **Regularization** — early stopping (a Keras callback — the *same* early stopping from Ch 4), plus dropout and L2 weight decay (see [[regularization-in-deep-learning|regularization in DL]]).
- **Epochs / batch size** — how many passes over the data and how big each mini-batch is (Chapter 4's mini-batch knob).

---

## The map: Chapter 4 → Chapter 10

Keep this table next to you. When Chapter 10 feels alien, find the row — you already learned the left column.

| Chapter 4 idea | Becomes in Chapter 10 | Changed? |
|---|---|---|
| Linear model $\mathbf{x}^\top\theta$ | one neuron (pre-activation) | + a nonlinearity after it |
| Parameters $\theta$ | weights & biases of every connection | just far more of them |
| MSE / log loss / cross-entropy | the network's loss | identical losses |
| Gradient by hand / normal equation | **backpropagation** (chain rule) | new *method*, same *goal* |
| Gradient descent (batch/SGD/mini-batch) | SGD / momentum / Adam | same loop, smarter step |
| Feature scaling | input normalization | same reason (well-shaped surface) |
| Polynomial features (hand-made) | hidden layers (learned features) | now automatic |
| Ridge/Lasso, early stopping | weight decay, dropout, early stopping | same anti-overfit goal |
| Sigmoid / softmax output | activation & output layers | same functions |
| Train/val/test, learning curves | `validation_data`, monitoring | identical discipline |

---

## Self-test (retrieval beats re-reading)

Cover the guide and answer these out loud. If any is fuzzy, that's exactly the section to reread.

1. State the four-step loop that runs through all three chapters.
2. Why can't you use the Normal Equation to train a neural network? What do you use instead, and why does *that* generalize to any model?
3. What does feature scaling do to the cost surface, and which minimization method needs it?
4. You plot learning curves: training error low, validation error high, big gap. Overfit or underfit? What are two fixes?
5. What does each of Ridge, Lasso, and early stopping actually constrain, and what's the shared intuition?
6. In one sentence: what is backpropagation, and what part of the loop is it? Is it an optimizer?
7. Why must the activation function be nonlinear? What happens to a deep network if it isn't?
8. In the Keras snippet, name which line corresponds to each of the four loop steps.
9. Where inside a neural-net classifier does Chapter 4's softmax regression live?
10. Name three things a neural network borrows *unchanged* from Chapter 4.

> [!tip] How to actually catch up
> Don't reread linearly. Work Chapter 4 by hand until the loop is reflex — do the gradient-descent worked example in [[cs/machine-learning/gradient-descent|your gradient descent note]], then this guide's self-test #1–5. Only then open Chapter 10; it will read as review with two new words (backprop, activation). The through-line is the whole shortcut.

---

## Related notes

- Foundations you already have: [[gradient-descent]] · [[loss-functions]] · [[bias-variance-tradeoff]] · [[train-validation-test]] · [[supervised-learning]] · [[generalization-vs-memorization]]
- The Chapter 10 deep dives: [[artificial-neural-networks]] · [[backpropagation]] · [[activation-functions]] · [[regularization-in-deep-learning]] · [[features-and-representations]]
- Where it all sits: [[cs/machine-learning/ai-vs-ml-vs-dl|AI vs ML vs DL]] · [[cs/deep-learning/index|Deep Learning index]]

*Source: Aurélien Géron, Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow, 3rd ed. — Chapters 1, 4, 10. This guide is a connective map; the derivations and standard facts are the book's, restated for the through-line.*
