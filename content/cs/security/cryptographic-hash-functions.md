---
title: Cryptographic Hash Functions
description: A cryptographic hash is a one-way fingerprint defined by three separate resistance properties, and which one a break destroys decides whether the hash is dead or still fine.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-01-22
updated:
aliases:
  - hash function
  - collision resistance
  - preimage resistance
---

Ask what a cryptographic hash "is secure against" and the honest answer is: against which of three different things? The properties are not one guarantee stated three ways. They are separate, they fail separately, and a hash that is catastrophically broken for one job can stay perfectly serviceable for another.

> [!note] The idea
> A cryptographic hash maps an input of any length to a fixed-length output that stands in for it, "a compact representative image (sometimes called an imprint, digital fingerprint, or message digest) of an input string." Its strength is three distinct resistances: preimage, second-preimage, and collision. Different applications lean on different ones, so a collision break is fatal for signatures and a non-event for other uses of the same function.

## Three resistances, not one

The Handbook of Applied Cryptography lists them precisely. Preimage resistance means "for essentially all pre-specified outputs, it is computationally infeasible to find any input which hashes to that output," the one-way property: given a digest, you cannot recover an input. Second-preimage resistance means "given x, to find a 2nd-preimage x0 6= x such that h(x) = h(x0)," you cannot find a different message matching a specific one. Collision resistance means "it is computationally infeasible to find any two distinct inputs x, x0 which hash to the same output," with the crucial difference that "here there is free choice of both inputs."

That last freedom is why collision resistance is the hardest to hold. The attacker picks both messages, so the birthday bound halves the effective security in bits. A 160-bit hash offers roughly 80 bits of collision resistance, not 160.

## Why the hierarchy matters

The three are not interchangeable, and matching the property to the job is the whole design discipline. A [[digital-signatures|digital signature]] hashes the message and signs the digest, so if an adversary can find a collision they can get a signature on one document and bind it to another. Signatures need collision resistance. A password stored as a hash needs preimage resistance so the stored value does not reveal the password. Confusing the two is how systems get built on the wrong guarantee.

## The fall of SHA-1

This is where the theory meets a real headstone. "In February 2017, CWI Amsterdam and Google announced they had performed a collision attack against SHA-1, publishing two dissimilar PDF files which produced the same SHA-1 hash." That was the SHAttered result, roughly 2 to the 63.1 evaluations, about 100,000 times faster than a brute-force collision search. NIST had already seen it coming: it "formally deprecated use of SHA-1 in 2011 and disallowed its use for digital signatures in 2013," and the standing guidance is to "remove SHA-1 from products as soon as possible and instead use SHA-2 or SHA-3."

> [!tip] Broken for one job, safe for another
> The same 2017 result that killed SHA-1 for certificates did not kill it everywhere: "However, SHA-1 is still secure for HMAC." HMAC's security rests on a keyed property, not on collision resistance, so a public collision attack does not touch it. "SHA-1 is broken" is only true once you name the property, which is the entire lesson of this note.

## Related Notes

- [[digital-signatures|Digital Signatures]], where collision resistance is load-bearing
- [[password-hashing-and-salting|Password Hashing and Salting]], which needs preimage resistance and deliberately does not use a plain fast hash
- [[aes-and-block-ciphers|AES and Block Ciphers]], whose authenticated modes lean on a hash-like integrity check
- [[rsa-and-computational-hardness|RSA and Computational Hardness]], the trapdoor that signs the digest
- [[shannon-and-information-theory|Shannon and Information Theory]], the confusion-and-diffusion roots of the design

## Sources

- A. Menezes, P. van Oorschot, S. Vanstone, "Handbook of Applied Cryptography," Chapter 9, CRC Press, 1996. https://cacr.uwaterloo.ca/hac/about/chap9.pdf . Supports the "digital fingerprint / representative image" description and the three definitions of preimage, second-preimage, and collision resistance, including the free choice of both inputs in the collision case.
- "SHA-1," Wikipedia. https://en.wikipedia.org/wiki/SHA-1 . Supports the February 2017 CWI Amsterdam and Google collision with two dissimilar PDFs, NIST deprecating SHA-1 in 2011 and disallowing it for digital signatures in 2013, the guidance to move to SHA-2 or SHA-3, and that SHA-1 remains secure for HMAC.
