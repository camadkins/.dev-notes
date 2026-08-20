---
title: Key Derivation Functions
description: A KDF turns one shared secret into many independent strong keys, and HKDF's extract-then-expand design fixes the fact that a raw Diffie-Hellman value is not itself a usable key.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-06-11
updated:
aliases:
  - KDF
  - key derivation function
  - HKDF
  - extract-then-expand
---

A [[diffie-hellman-and-key-exchange|Diffie-Hellman exchange]] hands you a shared secret. It is tempting to use that number directly as an AES key. Do not. The DH output is secret but it is not uniformly random, and a session usually needs several keys anyway, one to encrypt each direction, maybe one to authenticate. A key derivation function is the piece that turns one imperfect secret into several proper keys.

> [!note] The idea
> A KDF takes "some source of initial keying material and derives from it one or more cryptographically strong secret keys." HKDF does this in two distinct stages, extract then expand. Extract concentrates the possibly non-uniform entropy of the input into one uniform pseudorandom key; expand stretches that key into as many independent output keys as the protocol needs. Skipping extraction, and feeding a raw secret straight into a cipher, is the mistake HKDF is built to prevent.

## Extract, because the input is not uniform

The subtle part is why extraction exists at all. "In many applications, the input keying material is not necessarily distributed uniformly, and the attacker may have some partial knowledge about it (for example, a Diffie-Hellman value computed by a key exchange protocol)." A DH shared secret lives in a structured group, not in the flat space of all bit strings, so its bits are correlated in ways a key must not be. The extract stage runs it through [[message-authentication-codes-hmac|HMAC]] to "concentrate the possibly dispersed entropy of the input keying material into a short, but cryptographically strong, pseudorandom key." Only after that is the material safe to treat as a key.

## Expand, with context binding

Once you hold one uniform pseudorandom key, expand generates the rest. The clever input here is the optional `info` string, and it does more than pad. Its objective is "to bind the derived key material to application- and context-specific information," which "may prevent the derivation of the same keying material for different contexts (when the same input key material ... is used in such different contexts)." That is domain separation: the same shared secret, expanded with `info = "client write"` versus `info = "server write"`, yields two keys that reveal nothing about each other. One secret, many keys, provably unrelated, because the context is folded into the derivation.

> [!example] One handshake secret becomes a keyring
> After a TLS handshake agrees a single secret, HKDF-Expand is called repeatedly with different `info` labels to produce the client and server encryption keys, the IVs, and the finished-message keys. Every key traces back to the same extraction, and the labels keep them independent.

## Related Notes

- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]], the source of the non-uniform secret HKDF has to extract from
- [[message-authentication-codes-hmac|Message Authentication Codes and HMAC]], the primitive HKDF is built on
- [[cryptographic-hash-functions|Cryptographic Hash Functions]], the underlying compression HKDF inherits its assumptions from
- [[password-hashing-and-salting|Password Hashing and Salting]], a related but distinct problem where the KDF must also be deliberately slow
- [[authenticated-encryption-aead|Authenticated Encryption and AEAD]], the consumer of the independent keys HKDF produces

## Sources

- "HMAC-based Extract-and-Expand Key Derivation Function (HKDF)," RFC 5869, Krawczyk and Eronen. https://www.rfc-editor.org/rfc/rfc5869.txt . Supports the definition of a KDF as deriving one or more strong keys from initial keying material, the extract-then-expand paradigm, that input keying material such as a Diffie-Hellman value is not uniformly distributed and extraction concentrates its entropy into a strong pseudorandom key, and that the `info` input binds derived keys to context and prevents deriving the same key material in different contexts.
