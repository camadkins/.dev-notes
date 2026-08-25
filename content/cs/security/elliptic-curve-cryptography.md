---
title: Elliptic-Curve Cryptography
description: ECC matches RSA's security with far smaller keys because it rests on the elliptic-curve discrete-log problem, which makes it the default asymmetric primitive in modern TLS and mobile.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-02-23
updated:
aliases:
  - ECC
  - elliptic curve cryptography
  - ECDH
  - Curve25519
---

Public-key cryptography always trades key size for security. Push the security level up and the key gets bigger. What makes elliptic curves interesting is not that they are faster or cleverer, but that they buy the same security at a fraction of the key size, and the reason lives in the hard problem underneath, not in the code.

> [!note] The idea
> Elliptic-curve cryptography "allows smaller keys to provide equivalent security, compared to cryptosystems based on modular exponentiation in finite fields, such as the RSA cryptosystem." Its security rests on a different hard problem than RSA's, the elliptic-curve discrete logarithm problem, and that problem resists attack so well per bit that a 256-bit curve key stands in for a 3072-bit RSA key.

## Where the small keys come from

[[cs/military-computing/rsa-and-computational-hardness|RSA]] leans on the difficulty of factoring a large composite. ECC leans on something else: "a central hardness assumption is the [[cs/math/number-theory-and-modular-arithmetic|elliptic curve discrete logarithm problem]] (ECDLP)." Points on a curve form a group, you can add a base point to itself a secret number of times to get a public point, and recovering that secret count from the two points is the hard direction. The payoff is concrete. Wikipedia's benchmark: "a 256-bit elliptic curve public key should provide comparable security to a 3072-bit RSA public key." The gap is not an implementation trick or a bandwidth optimization bolted on afterward. It falls straight out of the fact that matching a given security level takes far fewer bits on a well-chosen curve than in a finite field. That is why ECC became the default for TLS handshakes and for constrained devices where every byte of key and signature costs.

## The curve has to be chosen carefully

A smaller key is worthless if the curve leaks the secret through a side channel. [[cs/standards/what-a-standard-actually-is|RFC 7748]] specifies Curve25519 and Curve448 precisely because they "lend themselves to constant-time implementation and an exception-free scalar multiplication that is resistant to a wide range of side-channel attacks, including timing and cache attacks." The general group law on an elliptic curve treats point doubling and point addition differently, which historically gave [[cs/security/side-channel-attacks|timing and power side channels]] a foothold; Montgomery and Edwards curves were adopted in part to erase that difference. So the curve is not a neutral parameter. Its shape decides whether an implementation can run in constant time at all.

> [!warning] Not all named curves are equal
> The NIST P-curves and the newer Curve25519 family both target the same security levels, but they differ in how easily they resist implementation attacks and in how their parameters were generated. Choosing a curve is a security decision, not a performance knob.

## Related Notes

- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]], the factoring-based scheme ECC undercuts on key size
- [[cs/security/diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]], whose elliptic-curve variant (ECDH) is where ECC does its everyday work
- [[cs/security/symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]], the hybrid design ECC slots into as the asymmetric half
- [[cs/security/side-channel-attacks|Side-Channel Attacks]], the reason curve choice and constant-time code matter
- [[cs/security/post-quantum-cryptography|Post-Quantum Cryptography]], the coming break that retires ECDLP entirely

## Sources

- "Elliptic-curve cryptography," Wikipedia. https://en.wikipedia.org/wiki/Elliptic-curve_cryptography . Supports that ECC allows smaller keys for equivalent security compared to RSA, that its central hardness assumption is the elliptic curve discrete logarithm problem, and that a 256-bit elliptic curve key gives security comparable to a 3072-bit RSA key.
- "Elliptic Curves for Security," RFC 7748, IRTF CFRG. https://www.rfc-editor.org/rfc/rfc7748.txt . Supports that Curve25519 and Curve448 are specified for constant-time, exception-free scalar multiplication resistant to timing and cache side-channel attacks, at the ~128-bit and ~224-bit security levels.
