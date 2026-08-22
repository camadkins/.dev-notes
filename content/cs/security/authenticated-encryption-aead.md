---
title: Authenticated Encryption and AEAD
description: AEAD modes fuse confidentiality and integrity into one keyed primitive, freeing the designer from the error-prone job of hand-composing a cipher with a separate MAC.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-05-02
updated:
aliases:
  - AEAD
  - authenticated encryption
  - AES-GCM
  - ChaCha20-Poly1305
---

For years the standard advice was: encrypt for secrecy, then MAC for integrity, and be very careful how you bolt the two together. The care was the problem. Encrypt-then-MAC, MAC-then-encrypt, which key for which, what exactly the MAC covers, all of it was a minefield that produced a long line of real vulnerabilities. AEAD removes the minefield by making both properties one operation.

> [!note] The idea
> Authenticated encryption "in addition to providing confidentiality for the plaintext that is encrypted, provides a way to check its integrity and authenticity." AEAD adds the ability to also authenticate associated data that travels in the clear. The design win is that it replaces the fragile hand-composition of a cipher and a [[message-authentication-codes-hmac|MAC]] with "a single cryptoalgorithm," so the caller never has to get the composition right.

## What the single primitive buys you

[[cs/standards/what-a-standard-actually-is|RFC 5116]] is explicit about the failure mode it retires. Using AEAD "frees the user of the AEAD of the need to consider security aspects such as the relative order of authentication and encryption and the security of the particular combination of cipher and MAC, such as the potential loss of confidentiality through the MAC." Those are exactly the decisions that went wrong repeatedly when people wired encryption and authentication together by hand. Fold them into one analyzed algorithm and the whole class of composition bugs disappears. The two AEAD families in wide use, AES-GCM and ChaCha20-Poly1305, both take a key, a nonce, the plaintext, and the associated data, and return ciphertext plus an authentication tag.

## Associated data authenticates what you cannot encrypt

The "AD" is the part people miss. A packet has [[cs/networking/routing-and-longest-prefix-match|a header that has to stay readable for routing]] but must not be tampered with. AEAD authenticates that "Associated Data (AD), also called 'additional authenticated data,' that is not encrypted." So a single call encrypts the payload and binds the visible header to it, and any change to either is caught at decryption. That is why AEAD, not raw encryption, is the primitive underneath [[cs/systems/tls-and-the-https-handshake|TLS records]] and [[vpns-and-tunneling|modern VPN protocols]].

> [!warning] The nonce is the sharp edge
> AEAD moves the composition risk into one remaining rule: never repeat a nonce under the same key. RFC 8439 requires the ChaCha20-Poly1305 nonce to be "unique per invocation with the same key, so it MUST NOT be randomly generated. A counter is a good way to implement this." Reuse a nonce and the guarantees collapse. The primitive is safe, but its one precondition is not optional.

## Related Notes

- [[aes-and-block-ciphers|AES and Block Ciphers]], the cipher AES-GCM builds on
- [[block-cipher-modes-of-operation|Block Cipher Modes of Operation]], where GCM sits as an authenticated counter mode
- [[message-authentication-codes-hmac|Message Authentication Codes and HMAC]], the integrity half AEAD absorbs
- [[cryptographically-secure-randomness|Cryptographically Secure Randomness]], relevant when a nonce must be unique and unpredictable
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]], AEAD is the symmetric workhorse the hybrid design hands the bulk data to

## Sources

- "An Interface and Algorithms for Authenticated Encryption," RFC 5116, McGrew. https://www.rfc-editor.org/rfc/rfc5116.txt . Supports the definition of authenticated encryption and AEAD, that providing both services in a single cryptoalgorithm replaces the separate cipher and MAC, and that AEAD frees the user from reasoning about the order of authentication and encryption and the cipher/MAC combination; also that associated data is authenticated but not encrypted.
- "ChaCha20 and Poly1305 for IETF Protocols," RFC 8439, Nir and Langley. https://www.rfc-editor.org/rfc/rfc8439.txt . Supports that the ChaCha20-Poly1305 nonce must be unique per key and must not be randomly generated, with a counter as the recommended construction.
