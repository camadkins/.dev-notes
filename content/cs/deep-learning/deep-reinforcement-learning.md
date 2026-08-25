---
title: Deep Reinforcement Learning
description: "Replacing the Q-table with a neural network: DQN and the Atari results, experience replay, target networks, and policy gradient methods."
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-13
aliases:
  - deep-rl
  - deep-q-network
  - policy-gradient
---

Tabular Q-learning stores one number for every state-action pair, and its convergence guarantee assumes every pair gets visited again and again. That works in a grid world. It cannot work when the state is a screen of pixels, where the number of possible states is too large to enumerate, let alone revisit. Deep reinforcement learning makes the same move the rest of deep learning made: stop tabulating the function and approximate it with a network trained by gradient descent.

> [!note] The idea
> Swap the Q-table for a parameterized function. A neural network $Q_\theta$ takes the state and outputs an estimated value for every action, and learning becomes [[cs/machine-learning/gradient-descent]] on a loss built from the reward signal. The same trick applies one level up: policy gradient methods skip values entirely and train the policy itself.

## From Table to Function Approximator

The machinery already exists. [[cs/deep-learning/artificial-neural-networks]] approximate functions from labeled samples, so treat each interaction as a training sample. After experiencing $(s, a, r, s')$, build the label

$$y = r + \gamma \max_{a'} Q_\theta(s', a')$$

and take a gradient step on the squared difference between $y$ and $Q_\theta(s, a)$, an ordinary regression [[cs/machine-learning/loss-functions|loss]]. The tabular convergence proofs no longer apply, but in exchange the method scales to enormous state spaces, and states the agent never saw can still get sensible values because the network generalizes.

This looks like [[cs/machine-learning/supervised-learning]], but two things are off. The labels are bootstrapped, computed from the network's own current estimates rather than from ground truth. And the data distribution shifts as the policy improves, because the agent's actions determine what it experiences next. Both differences matter, and both bite (more below).

The idea predates the deep learning era. Gerald Tesauro's TD-Gammon, built at IBM's Watson Research Center in the early 1990s, trained a neural network by temporal-difference learning through self-play and by 1993 played backgammon just slightly below the level of the top human players.

## DQN: Atari from Pixels

The result that put deep RL on the map was the deep Q-network (DQN). In 2013, Mnih et al. trained a convolutional network with a variant of Q-learning to play seven Atari 2600 games from raw pixels, beating all previous approaches on six of them and a human expert on three. The 2015 follow-up in *Nature* scaled the same recipe to 49 games: receiving only the pixels and the game score as input, DQN surpassed all previous algorithms and reached a level comparable to a professional human games tester, using the same algorithm, network architecture, and hyperparameters on every game.

The engineering is worth reading closely. Frames are converted to grayscale and cropped to 84 by 84, and the last four are stacked so the input carries motion information. Rather than feeding the network a state and an action, the network takes only the state and outputs one Q estimate per action, so a single forward pass scores every option. Actions are chosen $\varepsilon$-greedily during training. And because score scales vary wildly across games, rewards are clipped to +1 and -1, which lets one set of hyperparameters work everywhere at the cost of blinding the agent to reward magnitudes.

![DQN training loop: emulator frames flow through the convolutional network to epsilon-greedy action selection, while transitions accumulate in replay memory and minibatches drive gradient steps against a frozen target network](cs/deep-learning/assets/dqn-training-loop.svg)

## Why the Naive Version Diverges

Straightforwardly combining Q-learning with a deep network tends to be unstable, and the two DQN fixes address the two problems named above.

Experience replay attacks correlated data. Consecutive frames are nearly identical, and training on them in order violates the independence that gradient methods expect. So transitions $(s, a, r, s')$ go into [[cs/dsa/circular-queue|a replay memory]], and training minibatches are sampled from it uniformly at random, breaking the correlations and smoothing learning over many past behaviors.

The target network attacks the moving-label problem. If the same weights $\theta$ produce both the prediction and the target $y$, every gradient step also drags the target, and the regression chases itself. DQN computes targets with a separate frozen copy $\theta^-$ that is refreshed from $\theta$ only every $C$ updates, so the labels hold still between refreshes.

> [!warning]
> The failure mode to remember: a network generating its own training labels is a feedback loop, not a dataset. Deep RL without replay and a stable target can and does diverge, which is why these two tricks appear in nearly every descendant of DQN.

## Policy Gradients

Q-learning is value-based: it learns what actions are worth and derives the policy by taking the argmax. Policy gradient methods take the direct route instead. Parameterize the policy itself as $\pi_\theta(a \mid s)$, a network that outputs action probabilities, and do gradient ascent on the expected return. The first algorithm of this family is REINFORCE (Williams, 1992): sample episodes with the current policy, then adjust $\theta$ to raise the log-probability of actions in proportion to the return that followed them.

> [!example]
> The intuition, stripped of notation: suppose taking action $a_t$ in state $s_t$ ends up winning 90 percent of the time. Then $\pi_\theta(a_t \mid s_t)$ should go up, and the gradient of $\log \pi_\theta$ scaled by the return moves it up. Actions followed by bad outcomes get pushed down the same way.

Raw returns make a noisy training signal, so a baseline is subtracted from the return before scaling the gradient, which [[cs/statistics/variance-and-covariance|reduces variance]] without biasing the estimate. The natural baseline is an estimate of the state's value, and once you train a second network to provide it you have an actor-critic method: the actor is the policy network choosing actions, the critic is the value network judging them.

The showcase for policy gradients is AlphaGo (Silver et al., 2016, *Nature*). Its policy network was first trained by supervised learning on human expert games, then improved by policy-gradient reinforcement learning through self-play, and finally combined with a value network inside [[cs/military-computing/monte-carlo-method-and-the-bomb|Monte Carlo tree search]]. The full system achieved a 99.8 percent win rate against other Go programs and defeated the human European Go champion five games to zero, the first time a program beat a professional at full-size Go.

For the foundations these methods build on, start at [[cs/deep-learning/reinforcement-learning]]; for where all of this sits in the larger picture, see [[cs/machine-learning/ai-vs-ml-vs-dl]].

## Related Notes

- [[cs/deep-learning/reinforcement-learning]]
- [[cs/deep-learning/artificial-neural-networks]]
- [[cs/machine-learning/gradient-descent]]
- [[cs/machine-learning/loss-functions]]
- [[cs/machine-learning/supervised-learning]]
- [[cs/machine-learning/ai-vs-ml-vs-dl]]

## Sources

- Mnih, V. et al., "Playing Atari with Deep Reinforcement Learning," 2013: [arxiv.org/abs/1312.5602](https://arxiv.org/abs/1312.5602) (architecture, preprocessing, replay, reward clipping, seven-game results)
- Mnih, V. et al., "Human-level control through deep reinforcement learning," *Nature*, 2015: [nature.com/articles/nature14236](https://www.nature.com/articles/nature14236) (49 games, pixels and score only, professional-tester-level performance)
- [Q-learning, Wikipedia](https://en.wikipedia.org/wiki/Q-learning) (deep Q-learning section: experience replay, periodically updated targets)
- Williams, R. J., "Simple statistical gradient-following algorithms for connectionist reinforcement learning," *Machine Learning*, 1992: [link.springer.com/article/10.1007/BF00992696](https://link.springer.com/article/10.1007/BF00992696)
- [Policy gradient method, Wikipedia](https://en.wikipedia.org/wiki/Policy_gradient_method) (REINFORCE as the first policy gradient method, baselines)
- [Actor-critic algorithm, Wikipedia](https://en.wikipedia.org/wiki/Actor-critic_algorithm) (actor and critic roles)
- Silver, D. et al., "Mastering the game of Go with deep neural networks and tree search," *Nature*, 2016: [nature.com/articles/nature16961](https://www.nature.com/articles/nature16961)
- [TD-Gammon, Wikipedia](https://en.wikipedia.org/wiki/TD-Gammon)
- Sutton, R. S. and Barto, A. G., *Reinforcement Learning: An Introduction*, 2nd edition, MIT Press, 2018: [incompleteideas.net/book/the-book.html](http://incompleteideas.net/book/the-book.html)

*Course context: CSCE 479/879 Deep Learning, University of Nebraska-Lincoln (Stephen Scott), reinforcement learning unit.*
