---
title: PKI and X.509 Certificates
description: A certificate is just a signed data structure; the trust lives in a chain terminating at a preinstalled root, which is also where the whole model is most fragile.
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-06-17
updated:
aliases:
  - PKI
  - X.509
  - certificate authority
  - chain of trust
---

A [[digital-signatures|digital signature]] can prove a message came from whoever holds a particular private key. It cannot tell you whose key that is. Public-key infrastructure is the machinery built to answer that second question at internet scale, and its answer is [[cs/dsa/recursion|quietly recursive]]: trust a key because a key you already trust vouched for it.

> [!note] The idea
> PKI binds identities to public keys using certificates, which are "data structures that bind public key values to subjects," where "the binding is asserted by having a trusted CA digitally sign each certificate." Verifying a stranger's key means building a certification path from it up to a certificate authority you already trust. The math of signatures is the easy part; the hard part is the trust topology wrapped around it, and that is where PKI both scales and breaks.

## The problem PKI solves

The plain statement of need, from [[cs/standards/what-a-standard-actually-is|RFC 5280]]: "Users of a public key require confidence that the associated private key is owned by the correct remote subject (person or system) with which an encryption or digital signature mechanism will be used." Diffie-Hellman and RSA give you keys; they do not tell you the key labeled "your bank" belongs to your bank. A certificate is a signed assertion that closes that gap, and because its "signature and timeliness can be independently checked," it can be handed around over untrusted networks without losing its meaning.

## Chains, not certificates

Trust does not live in a single certificate. You believe a certificate only if you already trust the key that signed it, and if you do not, you need a certificate for that key too. "In general, a chain of multiple certificates may be needed, comprising a certificate of the public key owner (the end entity) signed by one CA, and zero or more additional certificates of CAs signed by other CAs. Such chains, called [[cs/math/graph-theory|certification paths]], are required because a public key user is only initialized with a limited number of assured CA public keys." The chain has to terminate somewhere it is trusted by fiat: a root. Browsers ship with those roots preinstalled, "pre-installed intermediate certificates issued and signed by a certificate authority, by public keys certified by so-called root certificates."

## Where the scaling turns into fragility

That preinstalled root store is the load-bearing assumption and the weak point at once. Any CA in the store can vouch for any name, so the security of every site depends on the least trustworthy CA a browser trusts. A single compromised root does not leak one site; it can impersonate the whole web until the root is pulled, which is why revocation is a first-class part of the system and why "browsers have to issue a security patch to revoke intermediary certificates issued by a compromised root certificate authority."

> [!warning] The certificate is not the trust
> Reading a certificate proves nothing on its own. What matters is whether its chain validates to a root you already hold, and whether any link has been revoked. A valid signature on a certificate for the wrong subject, issued by a CA that should not have issued it, is exactly how real PKI failures happen.

## Related Notes

- [[digital-signatures|Digital Signatures]], the primitive a certificate is built from
- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]], the key agreement a certificate authenticates
- [[secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]], the same root-to-leaf trust pattern in firmware
- [[kerberos-authentication|Kerberos Authentication]], a different answer to trusting strangers, via a shared trusted third party
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]], the hybrid a certificate ultimately protects

## Sources

- "Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile," RFC 5280, IETF, May 2008. https://www.rfc-editor.org/rfc/rfc5280.txt . Supports certificates as data structures binding public key values to subjects asserted by a trusted CA's signature, users needing confidence the private key is owned by the correct subject, and the certification-path chain from an end entity through CAs to a limited set of assured CA public keys.
- "Public key infrastructure," Wikipedia. https://en.wikipedia.org/wiki/Public_key_infrastructure . Supports browsers shipping pre-installed intermediate and root certificates, and browsers having to patch to revoke intermediary certificates from a compromised root CA.
