---
title: Cryptographically Secure Randomness
description: Cryptography collapses when its randomness is predictable, and the real security ceiling is the entropy of the seed, not the length of the key it produces.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-04-27
updated:
aliases:
  - CSPRNG
  - secure randomness
  - entropy
  - random number generation
---

Every key, every nonce, every [[diffie-hellman-and-key-exchange|Diffie-Hellman]] secret starts as a random number. That makes the random number generator the quiet foundation the whole edifice sits on, and it is a foundation that fails silently. Predictable randomness does not throw an error. It just hands the attacker a shortcut nobody can see in the ciphertext.

> [!note] The idea
> "At the heart of all cryptographic systems is the generation of secret, unguessable (i.e., random) numbers." An ordinary PRNG that passes statistical randomness tests is not enough, because statistics do not measure guessability by an adversary. The security ceiling of a generated key is the entropy of what seeded it, not the number of bits it prints out. A 128-bit key drawn from a weakly seeded generator has 128 bits of length and far less than 128 bits of security.

## The seed is the ceiling

[[cs/standards/what-a-standard-actually-is|RFC 4086]] makes the point with an example that should be unsettling. "Consider a cryptographic system that uses 128-bit keys. If these keys are derived using a fixed pseudo-random number generator that is seeded with an 8-bit seed, then an adversary needs to search through only 256 keys (by running the pseudo-random number generator with every possible seed), not 2**128 keys as may at first appear to be the case. Only 8 bits of 'information' are in these 128-bit keys." The key looks 128 bits strong and is 8 bits strong. No amount of output length rescues a starved seed, which is why real systems must draw the seed from a genuine [[cs/military-computing/shannon-and-information-theory|entropy source]], and why "the lack of general availability of truly unpredictable sources forms an open wound in the design of cryptographic software."

## Statistical randomness is the wrong test

The trap is thinking a generator is fine because its output looks random. RFC 4086 warns this "can easily fail if pseudo-random data is used that meets only traditional statistical tests for randomness, or that is based on limited-range sources such as clocks." A [[cs/math/number-theory-and-modular-arithmetic|linear congruential generator]] sails through many statistical tests and is trivially predictable from a few outputs. The right measure is adversarial: min-entropy, "the most conservative measure of entropy," which counts the most probable value against you rather than averaging. A cryptographically secure generator must make the next output infeasible to predict even given all previous outputs, a bar an ordinary PRNG never has to clear.

> [!warning] Two different jobs, two different generators
> The generator that shuffles a deck for a game and the generator that mints a session key are not interchangeable. The first needs to look random; the second needs to be unguessable against an adversary who has seen its past output and may know its algorithm. Using the wrong one is a class of bug that leaves the ciphertext looking perfect while the keyspace has quietly collapsed.

## Related Notes

- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]], which needs a fresh unpredictable secret each session
- [[block-cipher-modes-of-operation|Block Cipher Modes of Operation]], where a reused or predictable IV breaks the mode
- [[authenticated-encryption-aead|Authenticated Encryption and AEAD]], whose nonce discipline depends on this
- [[elliptic-curve-cryptography|Elliptic-Curve Cryptography]], recalling the Dual_EC_DRBG episode where a rigged generator undermined ECC
- [[password-hashing-and-salting|Password Hashing and Salting]], where the salt must come from a secure source

## Sources

- "Randomness Requirements for Security," RFC 4086, Eastlake, Schiller, Crocker. https://www.rfc-editor.org/rfc/rfc4086.txt . Supports that unguessable random numbers are at the heart of all cryptographic systems, that the lack of truly unpredictable sources is an open wound in cryptographic software, that generators passing only traditional statistical tests or based on clocks can fail, the 8-bit-seed example where a 128-bit key has only 8 bits of information, and that min-entropy is the most conservative measure of entropy.
