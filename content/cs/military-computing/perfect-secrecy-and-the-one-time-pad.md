---
title: Perfect Secrecy and the One-Time Pad
description: How Shannon proved that unbreakable encryption is possible, exactly what it costs, and why a single reused key destroys it.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-01-23
updated:
aliases:
  - one-time pad
  - perfect secrecy
---

Almost all encryption is breakable in principle. Given enough computing time, the ciphertext gives the plaintext up. The one-time pad is the exception. Used correctly it cannot be broken at all, not with any amount of computing, and Claude Shannon proved both why it works and what it costs.

> [!note] The claim
> A cipher can be perfectly secret, but only if its key is at least as long as the message, truly random, never reused, and kept secret.

## What perfect secrecy means

Shannon defined perfect secrecy precisely: the ciphertext gives an attacker no additional information about the plaintext. Seeing the encrypted message tells you nothing you did not already know. The one-time pad achieves this. Each symbol of the message is combined with a fresh, random symbol of key, so every possible plaintext of the same length is equally consistent with the ciphertext.

## The four conditions

The guarantee holds only when four conditions are all met. The key must be at least as long as the plaintext, it must be [[cs/security/cryptographically-secure-randomness|truly random]], it must never be reused in whole or in part, and it must be kept completely secret.

![A one-time pad combines each bit of the message with a fresh random key bit; the same key turns the ciphertext back into the message.](cs/military-computing/assets/one-time-pad-xor.svg)

## What it costs

Here is the catch Shannon proved. Perfect secrecy requires a key at least as long as the message. To send a megabyte secretly you must already share a megabyte of secret key. [[cs/security/diffie-hellman-and-key-exchange|Distributing that much key, securely]], for everything you might ever want to say, is so impractical that the world mostly settles for [[cs/security/aes-and-block-ciphers|ciphers that are merely too expensive to break]] rather than impossible. The one-time pad marks the boundary of what secrecy can be, and the price of reaching it.

> [!warning] Reuse destroys it
> If the same key encrypts two messages, an attacker who has both ciphertexts can compute their bitwise combination, which equals the combination of the two plaintexts, with the key cancelled out. That single mistake leaks both messages, and it is exactly the mistake that brought down the cipher in the [[cs/military-computing/venona-and-one-time-pad-reuse|VENONA]] story.

## Related Notes

- [[cs/military-computing/shannon-and-information-theory|Shannon and Information Theory]], the framework this proof comes from
- [[cs/military-computing/venona-and-one-time-pad-reuse|VENONA and the Cost of Reusing a One-Time Pad]], the rule above broken in practice
- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]], the practical alternative to perfect secrecy
- [[cs/military-computing/cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]], the wider context
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "One-time pad," Wikipedia. https://en.wikipedia.org/wiki/One-time_pad . Supports the four conditions for unbreakability, Shannon's proof that perfect secrecy requires a key at least as long as the message, the definition of perfect secrecy as the ciphertext giving no additional information about the plaintext, and the fact that reusing the key lets an attacker recover the combination of the two plaintexts.
