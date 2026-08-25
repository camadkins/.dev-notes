---
title: Shannon and Information Theory
description: How Claude Shannon turned the vague idea of information into a measurable quantity and founded a field that underlies cryptography, compression, and all reliable communication.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-05-31
updated:
aliases:
  - information theory
  - Shannon entropy
---

Before 1948, information was a loose idea. You could have more or less of it, but no one could say how much. [[cs/history/shannon-boolean-algebra-switching|Claude Shannon]], working at Bell Labs in the years around the Second World War, turned information into a quantity you could measure in numbers, and the paper that did it founded an entire field.

> [!note] The idea
> Information is the reduction of uncertainty, and it can be measured. The unit is the bit.

## A measure of uncertainty

Shannon's paper, "A Mathematical Theory of Communication," appeared in the Bell System Technical Journal in 1948 and is the founding work of information theory. Its central quantity is entropy, a measure of how uncertain a source of messages is. A source that always sends the same symbol carries no information, because you already know what is coming. A source whose next symbol is genuinely unpredictable carries the most. Entropy puts a number on exactly that.

## The bit

Shannon introduced [[cs/history/leibniz-and-binary|the bit as the unit of information]], the amount carried by a single yes-or-no answer when both answers are equally likely. Measuring information in bits is so ordinary now that it is easy to forget someone had to define it.

## Channel capacity

The paper also introduced channel capacity and the noisy channel coding theorem: every communication channel has a maximum rate at which information can be sent across it with arbitrarily small error, no matter how noisy the channel is, as long as you stay under that limit. This is the result that says reliable communication over an unreliable medium is possible, and it tells you exactly how fast.

## Why it matters here

Information theory is the foundation under several notes in this cluster. It sets how much secrecy a key can buy, which is the heart of [[cs/military-computing/perfect-secrecy-and-the-one-time-pad|perfect secrecy]]. It underlies data compression, including [[cs/dsa/huffman-coding|Huffman coding]]. And the same wartime concern with secret communication led Shannon to the cryptographic work that sits right next to this paper.

## Related Notes

- [[cs/military-computing/perfect-secrecy-and-the-one-time-pad|Perfect Secrecy and the One-Time Pad]], Shannon's result applied to cryptography
- [[cs/dsa/huffman-coding|Huffman Coding]], compression resting on entropy
- [[cs/math/discrete-probability|Discrete Probability]], the mathematics entropy is built from
- [[cs/military-computing/cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]], the secrecy side of Shannon's work
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "A Mathematical Theory of Communication," Wikipedia. https://en.wikipedia.org/wiki/A_Mathematical_Theory_of_Communication . Supports Shannon's 1948 publication in the Bell System Technical Journal as the founding work of information theory, and its introduction of information entropy, the bit as a unit of information, channel capacity, and the noisy channel coding theorem.
