---
title: Message Authentication Codes and HMAC
description: A MAC binds a secret key to a message so a receiver can verify integrity and authenticity together, and HMAC's nested design exists to defeat the length-extension attack that breaks the naive construction.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-03-14
updated:
aliases:
  - MAC
  - HMAC
---

A plain [[cs/security/cryptographic-hash-functions|hash]] tells you whether data changed by accident. It says nothing about who produced it, because anyone can recompute the hash of anything. Add a secret key and the guarantee changes shape: now only someone who holds the key could have produced the tag. That is a message authentication code, and the way HMAC constructs one from an ordinary hash is more subtle than it looks.

> [!note] The idea
> A MAC is an "integrity check based on a secret key," giving a receiver both integrity (the message was not altered) and authenticity (it came from someone holding the key) in a single tag. HMAC builds a MAC from any iterated hash function, but it wraps the hash in a specific two-pass nested structure. That structure is not decoration. It is what stops an attacker from forging tags with a length-extension attack.

## Why a bare hash of key and message fails

The obvious construction is to prepend the key and hash: MAC = H(key ‖ message). It is broken. With most Merkle-Damgard hash functions, "it is easy to append data to the message without knowing the key and obtain another valid MAC," the length-extension attack, because the hash's final state is exactly the internal state an attacker needs to keep hashing. Appending the key instead, H(message ‖ key), has the mirror flaw: an attacker who finds a collision in the unkeyed hash gets a MAC collision for free. Both naive orderings leak.

## What HMAC actually does

HMAC uses "two passes of hash computation," deriving an inner and an outer key from the secret and computing H(key ‖ H(key ‖ message)). "No known extension attacks have been found against the current HMAC specification ... because the outer application of the hash function masks the intermediate result of the internal hash." The nesting hides the state that the length-extension attack depends on. [[cs/standards/what-a-standard-actually-is|RFC 2104]] lists the design goals plainly: use existing hash functions unmodified, preserve their performance, and keep "a well understood cryptographic analysis of the strength of the authentication mechanism based on reasonable assumptions on the underlying hash function." HMAC also makes the underlying hash replaceable, which is why HMAC-SHA256 slid in when SHA-1 aged out.

> [!tip] The weakness is structural, not per-hash
> That the flaw lives in the Merkle-Damgard construction, not in any one hash, is confirmed from the other direction: Keccak (SHA-3) "does not have the length-extension weakness, hence does not need the HMAC nested construction," and can be keyed by simply prepending the key. HMAC's nesting is a fix for a specific structural property of the hashes it was built on.

## Forgery is an online attack

The strongest known attack on HMAC is a [[cs/math/discrete-probability|birthday attack]] on the hash's collisions, and RFC 2104 shows it is "totally impractical for minimally reasonable hash functions." For a 128-bit hash the attacker "needs to acquire the correct message authentication tags computed (with the _same_ secret key K!) on about 2**64 known plaintexts," which the RFC estimates would "take 250,000 years in a continuous 1Gbps link." Crucially this is an online attack requiring tags under the target key, unlike an offline collision search on an unkeyed hash. The secret key changes the economics of the attack entirely.

## Related Notes

- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]], the unkeyed primitive HMAC keys and hardens
- [[cs/security/authenticated-encryption-aead|Authenticated Encryption and AEAD]], which folds a MAC and a cipher into one primitive
- [[cs/security/key-derivation-functions|Key Derivation Functions]], HKDF is built directly on HMAC
- [[cs/security/digital-signatures|Digital Signatures]], the asymmetric analogue that adds non-repudiation a shared-key MAC cannot
- [[cs/security/password-hashing-and-salting|Password Hashing and Salting]], another place keyed and salted hashing changes the attack model

## Sources

- "HMAC: Keyed-Hashing for Message Authentication," RFC 2104, Krawczyk, Bellare, Canetti. https://www.rfc-editor.org/rfc/rfc2104.txt . Supports the definition of a MAC as a secret-key integrity check, HMAC's design goals, and the birthday-attack bound requiring roughly 2**64 tags under the same key (250,000 years on a 1Gbps link).
- "HMAC," Wikipedia. https://en.wikipedia.org/wiki/HMAC . Supports the two-pass nested construction, the length-extension flaw in H(key ‖ message), that HMAC's outer hash masks the intermediate result, and that Keccak/SHA-3 needs no nesting because it lacks the length-extension weakness.
