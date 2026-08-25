---
title: Generative Adversarial Networks
description: Two networks locked in a game, a generator forging samples and a discriminator trying to catch them, trained together until the forgeries are good enough to pass as real.
draft: false
comments: true
tags:
  - cs
  - deep-learning
  - generative-models
date: 2026-07-13
aliases:
  - gan
  - gans
  - generator-discriminator
  - minimax-game
---

Most generative models are trained to imitate the data directly, by maximizing how probable the training set looks under the model. A generative adversarial network throws that out and sets up a contest instead. One network, the generator, produces fake samples. A second network, the discriminator, is handed a mix of real training data and the generator's fakes and has to call each one real or fake. The two train against each other. The generator gets better at forging, the discriminator gets better at detecting, and the whole thing improves by escalation. When it works, the generator's output is good enough that the discriminator can do no better than a coin flip.

> [!note] The idea
> A GAN, introduced by Goodfellow and colleagues in 2014, is a game between two networks. The generator $G(z)$ turns a random noise vector $z$ into a sample, aiming to match the training distribution. The discriminator $D(x)$ is a binary classifier estimating the probability that its input is real rather than generated. They train simultaneously with opposed objectives, and the target is a Nash equilibrium where neither network can improve by changing only itself.

## The Two Players

The generator takes a latent noise vector $z$, typically drawn from a standard [[cs/statistics/normal-distribution|Gaussian]] $\mathcal{N}(0, I)$, and maps it through a network to a sample in data space, an image, say. It never sees the real data directly. Its only signal about what real data looks like arrives secondhand, through the discriminator.

The discriminator is an ordinary binary classifier built on the same [[cs/deep-learning/artificial-neural-networks|neural network]] machinery as any other. It receives a sample, sometimes a real one pulled from the dataset and sometimes a fake from the generator, and outputs how real it thinks the sample is. It trains with the [[cs/machine-learning/loss-functions|cross-entropy loss]] you would use for any classification: label 1 for real, label 0 for fake. This is the part that makes GANs clever. The discriminator learns, from data, a rich measure of what real samples look like, and that measure becomes the training signal for the generator. There is no hand-designed loss telling the generator "make it look more like a face." The discriminator supplies that judgment and keeps sharpening it.

![The generator turns noise into fake samples, the discriminator sorts real from fake, and its verdict flows back as the gradient that trains the generator](cs/deep-learning/assets/gan-adversarial-loop.svg)

## The Minimax Game

Write the discriminator as $D$ with parameters $\theta^{(D)}$ and the generator as $G$ with parameters $\theta^{(G)}$. The discriminator wants to minimize its own classification cost $J^{(D)}$, correctly labeling real as real and fake as fake. The generator wants the opposite, for the discriminator to fail on the fakes. The simplest way to write that opposition is to have the generator minimize $J^{(G)} = -J^{(D)}$, a strictly zero-sum game: every bit the discriminator gains, the generator loses, and vice versa.

Training runs both objectives at once through [[cs/machine-learning/gradient-descent]]. Each step draws a minibatch of real $x$ from the dataset and a minibatch of noise $z$ from the prior, then updates $\theta^{(G)}$ to lower $J^{(G)}$ and $\theta^{(D)}$ to lower $J^{(D)}$, often with the Adam optimizer. The solution being sought is not a minimum of a single loss but a Nash equilibrium of the game: a pair $(\theta^{(D)}, \theta^{(G)})$ where each player's parameters are a local best response to the other's. Each player is optimal given that its opponent does not move.

> [!warning]
> A GAN is minimizing two losses that pull against each other, not one, and that makes training famously unstable. The strict $J^{(G)} = -J^{(D)}$ formulation can starve the generator of gradient early on, when the discriminator is winning easily and confidently rejecting every fake. In practice people use alternative generator objectives, several based on [[cs/statistics/maximum-likelihood-estimation|maximum likelihood]], that keep the gradient useful. There is also mode collapse, where the generator finds one output that reliably fools the discriminator and produces only that, abandoning the diversity of the real data.

## What the Latent Space Learns

Because the generator maps a smooth noise space into data space, that latent space picks up structure, and you can do arithmetic in it. In the DCGAN work, a deep convolutional GAN that upsamples with transposed convolutions, researchers found that vector operations on the input noise produced semantic edits on the output. The often-cited result, roughly "man with glasses" minus "man" plus "woman" yields "woman with glasses," shows the latent space has organized itself around meaningful, composable factors, not raw pixels.

> [!example]
> The website thispersondoesnotexist.com serves a fresh face on every reload, each one generated by a GAN and belonging to no real human. It is the clearest demo of the payoff: after adversarial training, sampling a random $z$ and pushing it through the generator yields a novel, photorealistic sample that never existed in the training set. The same recipe trained on bedrooms (the LSUN dataset) produces plausible rooms; trained on faces it produces plausible faces. Later variants like Progressive GAN (grow the image resolution during training) and StyleGAN (control style factors such as hair color and texture) push the fidelity much further.

## Related Notes

- [[cs/deep-learning/artificial-neural-networks]] supply both the generator and the discriminator
- [[cs/machine-learning/loss-functions]] and [[cs/machine-learning/gradient-descent]] drive the two opposed training objectives
- [[cs/statistics/normal-distribution]] is the usual source of the generator's latent noise
- [[cs/deep-learning/autoencoders]] and [[cs/deep-learning/diffusion-models]] are the sibling generative models; a VAE organizes a latent prior and a diffusion model learns to denoise, while a GAN reaches realism through an adversarial game with no explicit likelihood
- [[cs/machine-learning/features-and-representations]] on why arithmetic in the latent space produces semantic edits
- [[cs/machine-learning/ai-vs-ml-vs-dl]] for where generative deep learning sits in the bigger picture

## Sources

- https://arxiv.org/abs/1406.2661 (Goodfellow et al., 2014, "Generative Adversarial Nets": the two-player minimax game, generator/discriminator setup, and training procedure)
- https://en.wikipedia.org/wiki/Generative_adversarial_network (generator vs discriminator, the minimax objective, Nash equilibrium, mode collapse, DCGAN latent arithmetic)
- https://www.deeplearningbook.org/contents/generative_models.html (Goodfellow, Bengio, Courville, *Deep Learning*, ch. 20: GANs among deep generative models, the game-theoretic framing)
- Course framing: CSCE 479/879 (Stephen Scott, UNL), "Autoencoders, GANs, and Diffusion Models" lecture slides
