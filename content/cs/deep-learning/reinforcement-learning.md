---
title: Reinforcement Learning
description: "Learning to act from reward alone: agents and environments, Markov decision processes, policies, value functions, and the Q-learning update."
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-07-13
aliases:
  - q-learning
  - markov-decision-process
---

A supervised learner gets told the right answer for every training example. A reinforcement learner never does. It takes an action, the world changes, and a number comes back saying how well things went, often long after the action that actually mattered. From that thin signal (no labels, no correct outputs, just reward) the agent has to work out which actions were good. This is the setup behind programs that taught themselves backgammon, Atari, and Go: play, observe, adjust, repeat.

> [!note] The idea
> Reinforcement learning is one of the three basic machine learning paradigms, alongside [[cs/machine-learning/supervised-learning]] and [[cs/machine-learning/unsupervised-learning]]. An agent interacts with an environment over discrete time steps: it observes a state, chooses an action, and receives a reward plus the next state. The goal is a policy, a mapping from states to actions, that maximizes expected discounted cumulative reward.

## The Agent-Environment Loop

Everything in RL happens inside one loop. At time $t$ the agent observes state $s_t$, picks action $a_t$, and the environment responds with a reward $r_t$ and a new state $s_{t+1}$. Then the loop runs again.

![The reinforcement learning loop: the agent sends actions to the environment, which returns states and rewards](cs/deep-learning/assets/rl-agent-environment-loop.svg)

Where [[cs/machine-learning/supervised-learning]] trains on labeled pairs (input, correct output) and [[cs/machine-learning/unsupervised-learning]] hunts for structure in unlabeled data, here the training experience has the form $\langle (s, a), r \rangle$: this action in this state earned this reward. Nobody says what the best action was, and nobody reveals what the other actions would have earned. Three consequences follow.

First, reward is delayed. The move that lost the game may have happened forty turns before the final score arrives, so the learner faces a credit assignment problem: figuring out which earlier decision deserves blame or praise for a reward that shows up late.

Second, the agent has to balance exploration against exploitation. Should it take the action it currently believes is best (exploit), or try something else in case its beliefs are wrong (explore)? A standard compromise is the $\varepsilon$-greedy rule: [[cs/dsa/greedy-algorithms|act greedily]] most of the time, but with probability $\varepsilon$ pick a random action.

Third, the agent influences its own training data. Because it chooses the actions, it chooses which states it visits and which experiences it collects. The dataset is not fixed in advance the way a supervised training set is.

## Markov Decision Processes

The standard formalization of the environment is a Markov decision process (MDP), named for the mathematician Andrey Markov. An MDP has four pieces: a set of states $S$, a set of actions $A$, a transition function giving the probability that action $a$ in state $s$ leads to state $s'$, and a reward function for the immediate reward received along the way.

The word Markov carries the key assumption: the next state and reward depend only on the current state and action, not on the history of how the agent got there. If you know $s_t$ and $a_t$, everything earlier is irrelevant for predicting what happens next. The transition and reward functions may be deterministic or stochastic, and, crucially for what follows, the agent does not necessarily know them.

## Policies and Value Functions

What the agent is trying to learn is a policy $\pi : S \rightarrow A$, a rule for choosing an action in every state. To compare policies we need a score, and the standard one is the discounted return: from a starting state $s$, following $\pi$,

$$V^{\pi}(s) = \mathbb{E}\left[ r_t + \gamma r_{t+1} + \gamma^2 r_{t+2} + \cdots \right]$$

where the discount factor $\gamma$ (between 0 and 1) makes rewards arriving sooner count more. $V^{\pi}(s)$ is called the value of state $s$ under policy $\pi$, and the optimal policy $\pi^*$ is the one that maximizes it for every state.

Suppose the agent somehow learned $V^*$, the value function of the optimal policy. Could it act optimally? Only with a model. The greedy choice is the action maximizing immediate reward plus discounted value of the resulting state, and computing that requires knowing which state each action leads to and what reward it pays. When the transition and reward functions are unknown, knowing $V^*$ alone is not enough.

## Q-Learning

The fix is to learn a different function. Define $Q(s, a)$ as the [[cs/statistics/expected-value|expected discounted return]] of taking action $a$ in state $s$ and acting optimally afterward. If the agent knows $Q$, the optimal action in any state is simply

$$\pi^*(s) = \operatorname{argmax}_a Q(s, a)$$

with no model of the environment required. This is why Q-learning is called model-free: it compares actions directly rather than predicting where they lead.

$Q$ obeys a recursive identity, since the value of acting optimally now includes acting optimally next: $Q(s,a)$ equals the immediate reward plus $\gamma \max_{a'} Q(s', a')$ for the resulting state $s'$. Q-learning turns that identity into an update rule. Keep a table of estimates, and after each experience $(s, a, r, s')$ move the entry toward the reward just seen plus the discounted best estimate for the next state:

$$Q(s, a) \leftarrow (1 - \alpha) \, Q(s, a) + \alpha \left( r + \gamma \max_{a'} Q(s', a') \right)$$

where $\alpha$ is a learning rate. In a deterministic world $\alpha = 1$ suffices; with stochastic transitions and rewards, a decaying learning rate [[cs/statistics/law-of-large-numbers|averages the noise out]]. Q-learning was introduced by Chris Watkins in 1989, and Watkins and Dayan published a convergence proof in 1992: for a finite MDP, if every state-action pair is visited infinitely often (with appropriate learning rates), the estimates converge to the true $Q$, and greedy action selection on the learned table is optimal.

> [!example]
> A classic toy world: a grid where every move pays reward 0 except entering the goal square, which pays 100, with $\gamma = 0.9$. Suppose the agent moves right into a square whose current action estimates are 66, 81, and 100. The update sets
>
> $$Q(s_1, a_{\text{right}}) \leftarrow 0 + 0.9 \times \max\{66, 81, 100\} = 90.$$
>
> No reward arrived on this step, yet the estimate rose to 90 because the move led somewhere valuable. Value propagates backward from the goal, one update at a time, until every square knows its distance-discounted worth.

The tabular version has a hard limit: the table needs one entry per state-action pair, and the convergence guarantee assumes every pair is visited again and again. That is fine for grids and hopeless for pixels, which is exactly where [[cs/deep-learning/deep-reinforcement-learning]] picks up. For where RL sits in the broader hierarchy, see [[cs/machine-learning/ai-vs-ml-vs-dl]].

## Related Notes

- [[cs/machine-learning/supervised-learning]]
- [[cs/machine-learning/unsupervised-learning]]
- [[cs/machine-learning/ai-vs-ml-vs-dl]]
- [[cs/deep-learning/deep-reinforcement-learning]]

## Sources

- Sutton, R. S. and Barto, A. G., *Reinforcement Learning: An Introduction*, 2nd edition, MIT Press, 2018. Full text free online: [incompleteideas.net/book/the-book.html](http://incompleteideas.net/book/the-book.html)
- [Reinforcement learning, Wikipedia](https://en.wikipedia.org/wiki/Reinforcement_learning) (third paradigm framing, exploration vs exploitation, MDP formulation)
- [Markov decision process, Wikipedia](https://en.wikipedia.org/wiki/Markov_decision_process) (MDP components, Markov property, discounted objective)
- [Q-learning, Wikipedia](https://en.wikipedia.org/wiki/Q-learning) (update rule, model-free property, history)
- Watkins, C. J. C. H. and Dayan, P., "Q-learning," *Machine Learning*, 1992: [link.springer.com/article/10.1007/BF00992698](https://link.springer.com/article/10.1007/BF00992698)

*Course context: CSCE 479/879 Deep Learning, University of Nebraska-Lincoln (Stephen Scott), reinforcement learning unit.*
