---
title: DES and the Politics of a Standard Cipher
description: How the first public standard cipher was built from IBM's Lucifer, shortened by the NSA, and argued over, in the first reckoning with trusting government cryptography.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-01-17
updated:
aliases:
  - DES
---

By the early 1970s, banks, agencies, and companies all needed to encrypt data, and they needed to do it the same way [[cs/standards/conformance-testing-and-plugfests|so their systems could talk]]. That called for a single standard cipher that anyone could use and everyone could trust. The Data Encryption Standard became that cipher, and the argument over it is the first time the public had to ask whether it could trust cryptography that the government helped design.

> [!note] The idea
> A block cipher scrambles a fixed-size block of data under a key. Its strength depends heavily on how long that key is, and DES shipped with a 56-bit key.

## From Lucifer to DES

DES grew out of Lucifer, a cipher developed at IBM based on a design by Horst Feistel. After review it was published as an official [[cs/standards/what-a-standard-actually-is|Federal Information Processing Standard]] for the United States in 1977, which made it the default way to encrypt unclassified government and commercial data for a generation.

## The NSA's hand

The [[cs/military-computing/cryptography-codebreaking-and-the-nsa|National Security Agency]] was involved in the review, and two of its fingerprints drew attention. After consultation with the NSA, the effective key length was set at 56 bits; the agency had convinced IBM that a key that size was sufficient. A shorter key means fewer possible keys, which means a brute-force search is more feasible for an adversary with enough computing power, and the NSA had more than anyone.

> [!warning] The controversy
> The classified parts of the design fed suspicion. The internal substitution tables, the S-boxes, were changed during the process, and the changes were not explained. As IBM's Alan Konheim put it, "We sent the S-boxes off to Washington. They came back and were all different." Combined with the shortened key, this raised a lasting question about whether the standard had been quietly weakened.

## The lasting question

DES forced a question into the open that has never fully closed: can you trust a cipher that a national intelligence agency helped shape, when part of its reasoning stays secret? [[cs/law/encryption-export-history-and-the-crypto-wars|Every later debate over government influence on cryptographic standards]] is a continuation of the one that started here.

## Related Notes

- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]], the public-key approach that arrived alongside DES
- [[cs/military-computing/cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]], the agency at the center of it
- [[cs/geopolitics/surveillance-and-privacy|Surveillance and Privacy]], the civil-liberties stakes of trusted crypto
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]], how states contest control of standards
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Data Encryption Standard," Wikipedia. https://en.wikipedia.org/wiki/Data_Encryption_Standard . Supports DES growing from IBM's Lucifer (Horst Feistel's design), its publication as a Federal Information Processing Standard in 1977, the NSA consultation and the reduction to a 56-bit key, and the controversy over the changed S-boxes including the Alan Konheim quotation.
