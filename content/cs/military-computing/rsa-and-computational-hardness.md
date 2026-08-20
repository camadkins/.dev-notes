---
title: RSA and Computational Hardness
description: How public-key cryptography let strangers communicate secretly without sharing a secret first, by resting security on the difficulty of factoring.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-05-03
updated:
aliases:
  - RSA
  - public-key cryptography
---

Until the mid 1970s, secret communication had a chicken-and-egg problem. To send an encrypted message you and the recipient had to already share a secret key, and the only fully secure way to share a key was the impractical one that [[perfect-secrecy-and-the-one-time-pad|perfect secrecy]] demands. RSA broke the cycle. It lets two people who have never met exchange secret messages without ever sharing a secret in advance, and it does so by leaning on a problem mathematicians believe is genuinely hard.

> [!note] The idea
> Split the key in two. A public half, which anyone may use to encrypt a message to you, and a private half, which only you hold and which alone can decrypt. Security rests not on hiding a shared key but on a computation that is easy in one direction and infeasible to reverse.

## Public and private keys

RSA was publicly described in 1977 by Ron Rivest, Adi Shamir, and Leonard Adleman, whose initials name it. In their scheme a user's private key is a pair of large prime numbers, chosen at random and kept secret. The matching public key is the product of those primes, which the user can publish freely. Anyone can encrypt a message using the public product. Only the holder of the two primes can undo it.

## Why factoring

The whole thing rests on an asymmetry. Multiplying two large primes together is fast and easy. Recovering those primes from the product, the factoring problem, is, as far as anyone has been able to show, infeasible once the numbers are large enough. That gap between easy-forward and hard-backward is the trapdoor: the public key reveals the product, but turning it back into the secret primes would take more computation than is available.

## Computational, not perfect

RSA is not unbreakable in the way a one-time pad is. It is computationally secure. A code-breaker who could factor the product, or who waited for a fast enough computer, could in principle break it. The bet is that no such computation is feasible in any useful timeframe. Trading the absolute guarantee of perfect secrecy for that practical bet is exactly what made secret communication possible at the scale of the modern world.

## Related Notes

- [[perfect-secrecy-and-the-one-time-pad|Perfect Secrecy and the One-Time Pad]], the unconditional guarantee RSA trades away
- [[des-standardization-and-symmetric-crypto|DES and the Politics of a Standard Cipher]], the symmetric standard of the same era
- [[turing-and-computability|Turing and Computability]], the theory of what is feasible to compute
- [[combinatorics|Combinatorics]], the mathematics of primes and counting behind it
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "RSA (cryptosystem)," Wikipedia. https://en.wikipedia.org/wiki/RSA_(cryptosystem) . Supports the public description of RSA in 1977 by Rivest, Shamir, and Adleman, its nature as a public-key system with a private key of two secret primes and a public key that is their product, and its security resting on the difficulty of factoring the product of two large primes.
