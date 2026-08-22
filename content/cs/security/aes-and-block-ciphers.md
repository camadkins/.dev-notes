---
title: AES and Block Ciphers
description: AES is a substitution-permutation block cipher, but in practice its real security lives in the mode of operation wrapped around it, not the cipher itself.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-03-19
updated:
aliases:
  - AES
  - block cipher modes
  - mode of operation
---

A block cipher is a strange primitive. On its own it does exactly one thing: it maps one fixed-size block of bits to another under a key. AES is the block cipher the world settled on, and the counterintuitive lesson of using it is that once the cipher is strong, almost every real-world break comes from how you chain it across many blocks, not from the cipher.

> [!note] The idea
> AES encrypts exactly 128 bits at a time. Any message longer than one block has to be split and the cipher applied repeatedly, and the rule for that repetition, the mode of operation, is where confidentiality and integrity are actually won or lost.

## What AES is

AES "is based on a design principle known as a substitution-permutation network," which repeatedly substitutes and shuffles bytes across a set number of rounds. It is a symmetric-key algorithm, so the same key encrypts and decrypts, which puts it on the fast side of the [[symmetric-vs-asymmetric-cryptography|symmetric/asymmetric divide]]. NIST selected three members of the Rijndael family, "each with a block size of 128 bits, but three different key lengths: 128, 192 and 256 bits," and announced it "as the US [[cs/standards/what-a-standard-actually-is|FIPS PUB 197]] (FIPS 197) standard on November 26, 2001." It superseded [[des-standardization-and-symmetric-crypto|DES]].

## The block problem

Because AES only transforms 128 bits, you need a rule for messages larger than that. "A mode of operation describes how to repeatedly apply a cipher's single-block operation to securely transform amounts of data larger than a block." The naive rule, Electronic Codebook (ECB), encrypts each block independently with the same key. That means identical plaintext blocks produce identical ciphertext blocks, and structure survives encryption: encrypt a bitmap in ECB and "the overall image may still be discerned, as the pattern of identically colored pixels in the original remains visible in the encrypted version." The cipher did its job perfectly; the mode leaked the picture anyway.

## Modes carry the real security

Better modes randomize each block's encryption so identical plaintext no longer yields identical ciphertext. The strongest go further and protect against tampering, beyond eavesdropping alone: "some modern modes of operation combine confidentiality and authenticity in an efficient way, and are known as authenticated encryption modes." GCM is the common one. This is the payload of the whole topic. Choosing AES tells you almost nothing about whether a system is safe; choosing ECB versus an authenticated mode tells you almost everything.

> [!warning] The failure is in the wiring
> A perfect block cipher in ECB mode is a broken system. When you see "AES-256" in a product sheet, the question that decides its security is the mode, and whether it authenticates, not the key length.

## Related Notes

- [[symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]], where the fast symmetric half fits
- [[des-standardization-and-symmetric-crypto|DES and the Politics of a Standard Cipher]], the block cipher AES replaced
- [[cryptographic-hash-functions|Cryptographic Hash Functions]], the integrity primitive authenticated modes lean on
- [[shannon-and-information-theory|Shannon and Information Theory]], the confusion-and-diffusion roots of the design

## Sources

- "Advanced Encryption Standard," Wikipedia. https://en.wikipedia.org/wiki/Advanced_Encryption_Standard . Supports AES being a substitution-permutation network, a symmetric-key algorithm with a 128-bit block and 128/192/256-bit keys selected from Rijndael, and its announcement as FIPS PUB 197 on November 26, 2001.
- "Block cipher mode of operation," Wikipedia. https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation . Supports the definition of a mode of operation, the ECB pattern-leakage (image discernible from identically colored pixels), and authenticated encryption modes combining confidentiality and authenticity.
