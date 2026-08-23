---
title: VENONA and the Cost of Reusing a One-Time Pad
description: How U.S. codebreakers read Soviet cables protected by a provably unbreakable cipher, by exploiting a mistake in how it was used.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-04-06
updated:
aliases:
  - Venona
  - Venona project
---

The one-time pad is provably unbreakable. The VENONA project read Soviet messages that were encrypted with one anyway. That contradiction is not a paradox, and resolving it gives one of the most durable lessons in all of cryptography.

> [!note] The lesson
> VENONA never broke the mathematics of the one-time pad. It exploited a mistake in how the pad was used. Cryptography fails at the implementation far more often than at the algorithm.

## The effort

VENONA was a United States counterintelligence program begun during the Second World War by the Army's Signal Intelligence Service and later absorbed by the [[cryptography-codebreaking-and-the-nsa|National Security Agency]]. It ran a remarkably long time, from February 1943 to October 1980, working to decrypt Soviet intelligence cables that had been protected with one-time pads.

## The blunder

A one-time pad is only secure if the key is never reused, and the Soviets reused it. The company that manufactured their pads produced around 35,000 pages of duplicate key. As the mathematics of [[perfect-secrecy-and-the-one-time-pad|perfect secrecy]] guarantees, reused key material is fatal: where the same key encrypted two different messages, the protection collapses. American codebreakers found those reused pages and used them to decrypt part of the traffic.

> [!example] Why reuse is fatal
> When one key encrypts two messages, combining the two ciphertexts cancels the key and leaves the two plaintexts combined together. From there a patient analyst can tease the two messages apart. The pad was perfect; using a page twice was not.

## Why it endures

The decrypts mattered historically, exposing espionage networks over decades. The lesson matters longer. A perfect algorithm wrapped around a flawed procedure is not secure. The weak point in a cryptographic system is almost never the cipher. It is the [[cs/security/hardware-security-modules-and-key-management|key handling]], the [[cs/security/cryptographically-secure-randomness|randomness]], the reuse, the human process around the math.

## Related Notes

- [[perfect-secrecy-and-the-one-time-pad|Perfect Secrecy and the One-Time Pad]], the rule VENONA's targets broke
- [[cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]], the agency that ran it
- [[surveillance-and-privacy|Surveillance and Privacy]], the modern weight of state codebreaking
- [[hypothesis-testing|Hypothesis Testing]], the statistical work of separating overlaid messages
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Venona project," Wikipedia. https://en.wikipedia.org/wiki/Venona_project . Supports VENONA as a U.S. Army Signal Intelligence Service program later absorbed by the NSA, its run from February 1943 to October 1980, the Soviet manufacture of about 35,000 pages of duplicate one-time-pad key, and the decryption of part of the traffic made possible by that reuse.
