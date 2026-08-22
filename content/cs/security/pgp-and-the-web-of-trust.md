---
title: PGP and the Web of Trust
description: "How OpenPGP replaces a hierarchy of certificate authorities with a peer-signed graph, and why it encodes trust as a quantified, delegable quantity."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-03-11
updated:
aliases:
  - PGP and the Web of Trust
  - Web of Trust
  - OpenPGP trust model
---

In [[pki-and-x509-certificates|X.509 PKI]] the question "is this key really theirs?" has one kind of answer: a certificate authority your software already trusts put its signature on it. Authority flows down a tree from a small set of roots. OpenPGP, the format PGP and GnuPG implement, answers the same question with no roots at all. Anyone can sign anyone's key, and validity is something your own keyring computes from the signatures it has collected. That inversion, from a delegated hierarchy to [[cs/math/graph-theory|a peer-signed graph]], is the web of trust.

> [!note] The idea
> A PGP key's binding to an identity is asserted not by an authority but by other users who signed it, and each signature carries a graded claim about how carefully the signer checked. OpenPGP goes further and lets you sign a key as a *trusted introducer*, delegating your judgment about that person's future signatures. Trust becomes a quantity that flows through a graph you assemble yourself, rather than a yes/no verdict handed down from a root.

## A signature is a claim, and the claim has a strength

When you sign someone's key in OpenPGP you are certifying a statement: this User ID (a name and email) belongs to the holder of this public key. The self-signature on a key is, in [[cs/standards/what-a-standard-actually-is|RFC 4880]]'s words, the statement "My name X is tied to my signing key K" and is "corroborated by other users' certifications." Your signature is one such corroboration.

The spec makes those corroborations gradeable. Certification signatures come in levels 0x10 through 0x13. A `0x11` "Persona" certification means the issuer "has not done any verification of the claim that the owner of this key is the User ID specified." A `0x13` "Positive" certification means the issuer "has done substantial verification of the claim of identity." So the graph records more than *that* Alice signed Bob's key; it can record *how hard she looked* before doing so. In practice, the RFC notes, most implementations make their key signatures as plain `0x10` certifications and "few differentiate between the types," which is one of the model's quiet weaknesses: the expressive grading exists but is rarely used.

## Trust signatures: delegating your judgment

The deeper mechanism is the Trust Signature, and it is what makes the structure a genuine *web* rather than a flat pile of endorsements. A trust signature carries two octets, a level (depth) and a trust amount. Level 1 "means that the signed key is asserted to be a valid trusted introducer, with the 2nd octet of the body specifying the degree of trust." Level 2 asserts the key is "trusted to issue level 1 trust signatures, i.e., that it is a 'meta introducer'." Generally, "a level n trust signature asserts that a key is trusted to issue level n-1 trust signatures."

This is delegation without a central authority. If you mark Carol as a trusted introducer, keys *Carol* certifies become valid to *you* without your ever meeting the people behind them. A meta-introducer lets you trust Carol's choice of introducers, one level up. The trust is also fractional: the amount runs 0 to 255, where "values less than 120 indicate partial trust and values of 120 or greater indicate complete trust," with the spec suggesting 60 for partial and 120 for complete. Two partial endorsements can combine to make a key valid where one would not. Validity, then, is the output of a small computation your keyring runs over the signatures and trust amounts it holds, not a lookup against a root store.

## What you gain, and the wall it hits

The gain is the removal of a single point of failure. There is no [[certificate-transparency|CA whose compromise forges any identity]]; an attacker must instead insinuate a bad key into enough of your trusted introducers' judgments, which is far harder to do quietly. The trust is also yours: you decide who introduces whom, at what strength.

The cost is scale. Every edge in the graph is a human act of verification, ideally an in-person key-fingerprint check. The grading that would make weak edges visible is mostly unused. Trust does not transit cleanly across social distance, and a newcomer with no signatures is invisible to everyone. The web of trust is [[cs/history/blockchain-and-nakamoto-consensus|genuinely decentralized]] and genuinely hard to bootstrap, which is why the centralized PKI it critiques still runs the public web.

> [!warning] Signing is not encrypting
> A key signature says nothing about whether the key is *good* cryptographically; it attests only to the name-to-key binding. A perfectly valid, heavily signed key can still use a weak algorithm, and a technically strong key with no signatures gives you no reason to believe it is the right person's.

## Related Notes

- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the hierarchical CA model the web of trust rejects
- [[digital-signatures|Digital Signatures]] - the primitive every certification and trust signature is built from
- [[cryptographic-hash-functions|Cryptographic Hash Functions]] - what a key fingerprint actually is
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] - why a public key needs its identity bound at all
- [[certificate-transparency|Certificate Transparency]] - a different fix for the same CA trust problem

## Sources

- "OpenPGP Message Format," RFC 4880, IETF. https://www.rfc-editor.org/rfc/rfc4880.txt . Supports the self-signature statement "My name X is tied to my signing key K" corroborated by other users' certifications; the 0x10 to 0x13 certification levels and their verification meanings (Persona doing no verification, Positive doing substantial verification); most implementations using 0x10 and few differentiating; the Trust Signature format with level (depth) and trust amount, the trusted-introducer and meta-introducer semantics, the "level n asserts trust to issue level n-1 signatures" rule; and the 0 to 255 trust amount with the 120 threshold between partial and complete trust.
