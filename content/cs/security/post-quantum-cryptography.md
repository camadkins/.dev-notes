---
title: Post-Quantum Cryptography
description: "Shor's algorithm breaks RSA and elliptic-curve crypto on a large quantum computer, which is why NIST standardized lattice-based replacements like ML-KEM in 2024."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-03-11
updated:
aliases:
  - PQC
  - post-quantum cryptography
  - ML-KEM
  - quantum-resistant cryptography
---

The public-key cryptography holding the internet together rests on a bet: that factoring a large number and computing a discrete logarithm are hard. That bet is safe against every classical computer we know how to build. It is not safe against a large quantum one, and the gap is not a constant factor you can outrun with bigger keys. It is a change in complexity class.

> [!note] The idea
> Shor's algorithm "runs in polynomial time" on a quantum computer for both integer factoring and discrete logs, which collapses the exact hardness assumptions under RSA, Diffie-Hellman, and elliptic-curve crypto. Post-quantum cryptography swaps those assumptions for problems, chiefly on lattices, that no efficient quantum algorithm is known to solve. In 2024 NIST finalized the first standards, and the lead one, ML-KEM, rests on the Module Learning with Errors problem rather than factoring.

## Why bigger keys do not save you

The instinct when a cipher weakens is to lengthen the key. That works against a threat that only chips away at the margin. It does not work here, because Shor's algorithm is not a faster search. "Shor's algorithm is a quantum algorithm for finding the prime factors of an integer," and on a quantum computer "to factor an integer N, Shor's algorithm runs in polynomial time, meaning the time taken is polynomial in log N." Polynomial in the number of digits is the same growth rate the honest user pays to *use* the key. Doubling the modulus roughly doubles the attacker's work too, so you can never open a durable gap. Developed "in 1994 by the American mathematician Peter Shor," the algorithm targets the whole family at once: it "could be used to break public-key cryptography schemes, such as the RSA scheme," along with "the finite-field Diffie-Hellman key exchange" and "the elliptic-curve Diffie-Hellman key exchange." That single sweep is why [[elliptic-curve-cryptography|ECC]], the compact modern default, is no safer here than RSA despite its smaller keys.

## Changing the hard problem, not the key size

Post-quantum cryptography does not patch RSA. It moves to problems whose difficulty survives a quantum attacker, and builds fresh primitives on them. NIST's FIPS 203 standardizes a key-encapsulation mechanism called ML-KEM whose "security of ML-KEM is related to the computational difficulty of the Module Learning with Errors problem." Lattice problems like this one have no known efficient quantum solution, and the standard states plainly that "at present, ML-KEM is believed to be secure, even against adversaries who possess a quantum computer." The word "believed" is doing honest work: this is a hardness conjecture, the same kind of bet RSA always was, just one Shor does not touch.

## The standards are already here

The migration is not hypothetical. On "August 13, 2024" NIST approved three standards, "FIPS 203, Module-Lattice-Based Key-Encapsulation Mechanism Standard," "FIPS 204, Module-Lattice-Based Digital Signature Standard," and "FIPS 205, Stateless Hash-Based Digital Signature Standard." These "specify key establishment and digital signature schemes that are designed to resist future attacks by quantum computers, which threaten the security of current standards." FIPS 203 replaces the key exchange, FIPS 204 and 205 replace [[digital-signatures|signatures]], and together they cover the asymmetric jobs a real protocol needs done.

> [!warning] The threat is retroactive
> A large quantum computer may be years away, but the risk to today's traffic is not. An adversary can record encrypted sessions now and decrypt them once the hardware arrives, so any secret that must stay confidential past that horizon is already exposed. This is the same "harvest now, decrypt later" logic that motivates [[perfect-forward-secrecy|forward secrecy]], and it is why the standards shipped before the machine that breaks the old ones exists.

## Related Notes

- [[elliptic-curve-cryptography|Elliptic-Curve Cryptography]], a primary casualty of Shor's algorithm despite its small keys
- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]], whose discrete-log hardness Shor also breaks
- [[digital-signatures|Digital Signatures]], the job FIPS 204 and 205 re-home on quantum-safe problems
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]], and why the symmetric half is far less affected
- [[perfect-forward-secrecy|Perfect Forward Secrecy]], the other answer to record-now-decrypt-later

## Sources

- "Post-Quantum Cryptography FIPS Approved," NIST Computer Security Resource Center, 2024. https://csrc.nist.gov/news/2024/postquantum-cryptography-fips-approved . Supports the August 13, 2024 approval, the titles and numbers of FIPS 203/204/205, and that they are designed to resist future attacks by quantum computers that threaten current standards.
- "Shor's algorithm," Wikipedia. https://en.wikipedia.org/wiki/Shor%27s_algorithm . Supports that Shor's algorithm factors integers on a quantum computer in polynomial time in log N, that it was developed in 1994 by Peter Shor, and that it breaks RSA, finite-field Diffie-Hellman, and elliptic-curve Diffie-Hellman.
- "FIPS 203, Module-Lattice-Based Key-Encapsulation Mechanism Standard," NIST, 2024. https://csrc.nist.gov/pubs/fips/203/final . Supports that FIPS 203 specifies ML-KEM, that its security relates to the Module Learning with Errors problem, and that ML-KEM is believed secure even against an adversary with a quantum computer.
