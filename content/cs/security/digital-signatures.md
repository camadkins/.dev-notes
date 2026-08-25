---
title: Digital Signatures
description: A digital signature signs a message's hash, not the message, and that one design choice is what makes it efficient, format-agnostic, and existentially unforgeable all at once.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-05-30
updated:
aliases:
  - hash-then-sign
  - non-repudiation
---

The textbook picture of a signature is "encrypt with your private key, anyone decrypts with your public key." Almost no real system does that. It signs a hash of the document instead, and the reasons why reveal what a signature is actually for.

> [!note] The idea
> A digital signature is "a mathematical scheme for verifying the authenticity of digital messages or documents." In practice "the message to be signed is first hashed to produce a short digest" and the digest is signed. Hash-then-sign is not a shortcut. It is what delivers efficiency, cross-format compatibility, integrity of the whole message, and provable unforgeability together, and it is why signatures are the engine under certificates and code signing.

## Three guarantees from one operation

Verification with the public key answers three questions at once. Authenticity: the signer holds the matching private key, so a valid signature "gives a recipient confidence that the message came from a sender known to the recipient." Integrity: any change to the message changes its hash, so the signature no longer verifies. Non-repudiation: "an entity that has signed some information cannot at a later time deny having signed it," because only the private-key holder could have produced it. Encryption alone gives none of these; a message can be secret and still forged.

## Why you sign the hash

Signing the digest rather than the raw message is deliberate on three counts. For efficiency, the operation runs over a short fixed digest instead of a long document. For compatibility, some schemes operate only on numbers [[cs/math/number-theory-and-modular-arithmetic|modulo a composite]], so a hash converts arbitrary input "into the proper format." For integrity across a long message, "the receiver of the signed blocks is not able to recognize if all the blocks are present and in the appropriate order" without a hash binding the whole thing into one digest. Collapse the message to one [[cs/security/cryptographic-hash-functions|hash]] first and all three fall out.

This is also where [[cs/math/proof-techniques|the security proof]] lives. Hash-then-sign, modeled with an idealized hash, "is existentially unforgeable, even against a chosen-plaintext attack." It also explains why a broken hash breaks the signature: find a collision and you can move a valid signature onto a second document.

## The guarantee has an expiry

A signature's promises are conditional on something outside the math. "These authentication, non-repudiation etc. properties rely on the secret key not having been revoked prior to its usage." A leaked private key that is not revoked keeps implicating its owner; a revoked key must be checkable, or old signatures cannot be trusted. That dependency is precisely what [[cs/security/pki-and-x509-certificates|public-key infrastructure]] exists to manage, and it is why a signature scheme in isolation is only half a system.

> [!example] Verifying a software update
> A vendor publishes a patch and its signature. The patch is not secret; the point is that "computers running the software must verify the authenticity of the patch before applying it, lest they become victims to malware." The device hashes the patch, checks the signature against the vendor's public key, and installs only on a match. Integrity and origin, verified before a single byte executes.

## Related Notes

- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]], the digest that actually gets signed
- [[cs/security/pki-and-x509-certificates|PKI and X.509 Certificates]], what makes the verifier trust the public key
- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]], the trapdoor behind the first practical signatures
- [[cs/security/secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]], signatures verifying code before it runs
- [[cs/security/diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]], the anonymous exchange a signature authenticates

## Sources

- "Digital signature," Wikipedia. https://en.wikipedia.org/wiki/Digital_signature . Supports the definition as a scheme for verifying authenticity, hashing the message to a short digest before signing, the efficiency/compatibility/integrity reasons for signing a hash, existential unforgeability of hash-then-sign, non-repudiation of origin, the reliance on the key not being revoked, and the software-update verification example.
