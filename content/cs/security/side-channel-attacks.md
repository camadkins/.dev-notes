---
title: Side-Channel Attacks
description: "Why a mathematically perfect algorithm can still leak its secret, and why Spectre and Meltdown proved the leak can come from the CPU's own optimizations."
draft: false
comments: true
tags:
  - cs
  - security
  - computer-architecture
  - cryptography
date: 2026-07-15
updated:
aliases:
  - side-channel attack
  - timing attack
  - Spectre
  - Meltdown
---

Most attacks on a cipher go through the front door: they attack the math, searching the keyspace or the algorithm's structure. A side-channel attack ignores the math entirely and listens to the machine. How long did that operation take? How much power did it draw? What did [[cs/systems/memory-hierarchy-and-caching|the cache]] look like afterward? The algorithm can be provably sound and the implementation still betray the key, because the key influenced something the algorithm's specification never mentioned: the physical behavior of the hardware running it.

> [!note] The idea
> A side-channel attack recovers a secret from the implementation's observable behavior rather than from a flaw in the algorithm. The leak lives in the gap between the abstract computation and its physical execution: timing, power, emissions, cache state. Spectre and Meltdown pushed this to its sharpest form by turning the CPU's own speculative-execution optimizations into the channel, showing that even correct code leaks through microarchitectural state.

## Attacking the implementation, not the algorithm

Wikipedia draws the line precisely: a side-channel attack "uses information inadvertently leaked by a system, such as timing, power consumption, or electromagnetic or acoustic emissions, to gain unauthorized access to sensitive information." These attacks "differ from those targeting flaws in the design of cryptographic protocols or algorithms." That distinction is the whole subject. A cryptanalyst studies the cipher; a side-channel attacker studies the thing computing the cipher, and treats every measurable difference in its behavior as a leak of the data it was computing on.

The canonical example is timing. If a comparison or a [[cs/math/number-theory-and-modular-arithmetic|modular exponentiation]] takes slightly longer for some key bits than others, then "simply by observing variations in how long it takes to perform cryptographic operations, it might be possible to determine the entire secret key." Nothing about the cipher is broken. The secret is reconstructed from a stopwatch.

## The defense is to make behavior independent of the secret

Because the leak is a correlation between the secret and some observable, the fix is to sever that correlation. For timing that means constant-time code: designing "software to be isochronous, that is to run in an exactly constant amount of time, independently of secret values. This makes timing attacks impossible." A constant-time comparison examines every byte regardless of where the first mismatch is, so its duration reveals nothing about the data. This is why security-critical routines avoid early-exit branches on secret data and secret-dependent memory indexing. And it is genuinely hard: even the constant-time approach "can be difficult to implement in practice, since even individual instructions can have variable timing on some CPUs." You are fighting the hardware's optimizations to keep them from encoding your secret.

## Spectre and Meltdown: the CPU as the channel

The 2018 disclosures generalized side channels from cryptographic implementations to the processor itself. Meltdown "breaks the most fundamental [[cs/systems/system-calls-and-the-kernel-boundary|isolation between user applications and the operating system]]," and "allows a program to access the memory, and thus also the secrets, of other programs and the operating system." Spectre "breaks the isolation between different applications," and "allows an attacker to trick error-free programs, which follow best practices, into leaking their secrets." The phrase error-free is the point that made these landmark: the victim program has no bug. It is correct by every conventional standard.

The channel is speculative and out-of-order execution, features CPUs use to run fast by doing work before knowing whether it is needed. That transient work can touch memory it should not, and although the results are discarded architecturally, they leave a footprint in cache state that a timing side channel can read back. The secret is never officially computed; it is speculatively touched, discarded, and then recovered from the microarchitectural residue. That is why these are side-channel attacks and not ordinary memory bugs, and why mitigating them meant slowing the very optimizations that make modern processors fast.

> [!warning] These leaks live below the software's abstraction
> A programmer reasons about a machine that executes instructions in order and forgets discarded work. Real CPUs do neither, and the divergence is the vulnerability. You cannot close a microarchitectural side channel from inside a language whose model does not admit that speculation and caches exist; it takes hardware changes, microcode, or compiler mitigations that deliberately break the optimization. Correctness at the source level does not imply security at the silicon level.

## Related Notes

- [[buffer-overflows|Buffer Overflows]], a memory attack on the software model rather than the hardware beneath it
- [[aes-and-block-ciphers|AES and Block Ciphers]], the kind of algorithm whose implementation timing side channels target
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]], where the mathematically-secure keys a side channel bypasses live
- [[memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]], mitigations that likewise fight the gap between model and machine

## Sources

- "Side-channel attack," Wikipedia. https://en.wikipedia.org/wiki/Side-channel_attack . Supports that a side-channel attack "uses information inadvertently leaked by a system, such as timing, power consumption, or electromagnetic or acoustic emissions," that these "differ from those targeting flaws in the design of cryptographic protocols or algorithms," that timing variations "might" reveal "the entire secret key," and that isochronous constant-time software makes timing attacks impossible but is difficult to implement.
- "Meltdown and Spectre," Graz University of Technology et al. https://meltdownattack.com/ . Supports that Meltdown "breaks the most fundamental isolation between user applications and the operating system" and "allows a program to access the memory ... of other programs and the operating system," and that Spectre "breaks the isolation between different applications" and tricks "error-free programs, which follow best practices, into leaking their secrets."
