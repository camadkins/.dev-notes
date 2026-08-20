---
title: Diffie-Hellman and Key Exchange
description: Diffie-Hellman derives a shared secret over a public channel from discrete-log hardness, but it authenticates nobody, and it is the ephemeral variant, not the exchange itself, that buys forward secrecy.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-04-08
updated:
aliases:
  - Diffie-Hellman
  - key exchange
  - forward secrecy
  - DHE
---

Two people who have never met, shouting across a room where everyone can hear, end up holding the same secret number that nobody else in the room can compute. That is the trick Diffie-Hellman pulls, and the surprising part is not that it works but everything it quietly does not promise.

> [!note] The idea
> Diffie-Hellman lets "two parties that have no prior knowledge of each other to jointly establish a shared secret key over an insecure channel," resting on the hardness of the discrete logarithm. On its own it proves nothing about who is on the other end, and by itself it does not protect old traffic. Authentication and forward secrecy are separate properties bolted on top, and conflating them with the key exchange is a classic error.

## The mechanism

Both sides agree publicly on a modulus p and base g. Alice picks a secret a and sends g^a mod p; Bob picks a secret b and sends g^b mod p. Each raises the other's value to their own secret, and both arrive at g^ab mod p. An eavesdropper sees g, p, g^a, and g^b, and to recover the secret must invert the exponent. "Such a function that is easy to compute but hard to invert is called a one-way function," and here "such a problem is called the discrete logarithm problem." For a prime of a few thousand bits, no known classical algorithm cracks it in feasible time.

## What it does not do

Nothing in the exchange tells Alice she is talking to Bob. The math treats both public values identically, so an active attacker in the middle can run one Diffie-Hellman with Alice and another with Bob, and relay. This is the standard caveat: unauthenticated Diffie-Hellman defeats a passive eavesdropper and falls to an active one. That is why real protocols sign the exchange. "The ephemeral Diffie-Hellman key exchange is often signed by the server using a static signing key," which is exactly where [[digital-signatures|digital signatures]] enter a key agreement.

## Ephemeral is the whole point

The forward-secrecy payoff comes from throwing keys away. Forward secrecy "gives assurances that session keys will not be compromised even if long-term secrets used in the session key exchange are compromised." A server's long-term private key can leak years later, and if each session used a fresh, discarded Diffie-Hellman secret, the recorded ciphertext stays dark. Forward secrecy and authenticity come from different halves of the design, which is why modern TLS pairs an ephemeral Diffie-Hellman (for secrecy) with a signature (for identity).

> [!warning] Two properties, two mechanisms
> "Diffie-Hellman gives forward secrecy" is only true for the ephemeral variant. Static Diffie-Hellman reuses the same secret and gives none. And neither variant authenticates the peer. If a system claims forward secrecy, look for the ephemeral exchange; if it claims to know who you are talking to, look for the signature over it.

## Related Notes

- [[symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]], the hybrid where Diffie-Hellman moves the key and a symmetric cipher moves the data
- [[digital-signatures|Digital Signatures]], what authenticates the otherwise anonymous exchange
- [[rsa-and-computational-hardness|RSA and Computational Hardness]], the other route to public-key key transport
- [[aes-and-block-ciphers|AES and Block Ciphers]], the symmetric half that uses the agreed key
- [[perfect-secrecy-and-the-one-time-pad|Perfect Secrecy and the One-Time Pad]], the pre-public-key answer to key distribution

## Sources

- "Diffie-Hellman key exchange," Wikipedia. https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange . Supports two parties with no prior knowledge jointly establishing a shared secret over an insecure channel, and the one-way function and discrete logarithm problem underlying it.
- "Forward secrecy," Wikipedia. https://en.wikipedia.org/wiki/Forward_secrecy . Supports the definition of forward secrecy as protecting session keys even when long-term secrets are compromised, and the ephemeral Diffie-Hellman being signed by a static key.
