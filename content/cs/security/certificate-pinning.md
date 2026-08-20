---
title: Certificate Pinning
description: "Pinning narrows which certificate authorities can vouch for a host, trading CA-flexibility for a self-inflicted denial-of-service risk that only a backup pin contains."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-04-29
updated:
aliases:
  - Certificate Pinning
  - Public Key Pinning
  - HPKP
  - Key Pinning
---

The [[pki-and-x509-certificates|X.509 trust model]] has a structural flaw: your browser trusts hundreds of certificate authorities, and *any one of them* can issue a valid certificate for *your* domain. A single compromised or coerced CA anywhere in that set can mint a certificate an attacker uses for a [[man-in-the-middle-attacks|man-in-the-middle]] against your users, and TLS will accept it without complaint. Certificate pinning attacks that flaw from the other end: instead of trusting whatever certificate a trusted CA signs, the client remembers the *specific* key it expects and rejects everything else.

> [!note] The idea
> Pinning binds a hostname to a small set of expected public keys. RFC 7469's HTTP Public Key Pinning made the server tell the browser, over a header, which Subject Public Key Info fingerprints to expect, and then "will require that the host presents a certificate chain including at least one Subject Public Key Info structure whose fingerprint matches one of the pinned fingerprints for that host." The security win is stated precisely: "By effectively reducing the number of trusted authorities who can authenticate the domain during the lifetime of the pin, pinning may reduce the incidence of man-in-the-middle attacks due to compromised Certification Authorities." You are not adding trust, you are subtracting it.

## Pin the key, not the certificate

The pin is a hash of the Subject Public Key Info (the SPKI), not of the whole certificate. That choice matters: certificates get reissued constantly with new serial numbers, validity dates, and signatures while the underlying key pair stays the same. Pinning the SPKI lets a site rotate its certificate through normal renewal without breaking the pin, as long as the key survives. It also lets you pin an intermediate or root in your own chain rather than the leaf, which is the usual practical choice.

The match is existential, not universal: the chain must contain *at least one* SPKI whose fingerprint is pinned. That is what makes rotation survivable and what the next section makes dangerous.

## Trust on first use, and why that is not a footnote

RFC 7469 is explicit that "key pinning is a trust-on-first-use (TOFU) mechanism. The first time a UA connects to a host, it lacks the information necessary to perform Pin Validation." On that first contact the browser has nothing to compare against, so an attacker positioned there sees an unprotected handshake, and worse, "such a MITM can inject its own PKP header into the HTTP stream, and pin the UA to its own keys." Pinning defends every connection after the first, not the first.

The honest framing from the spec: pinning "is not a perfect defense against MITM attackers capable of passing certificate chain validation procedures, nothing short of pre-shared keys can be." What it buys is real but bounded, it "allows UAs to detect in-process MITM attacks after the initial communication" by shrinking the attacker's usable set of CAs to the ones you pinned.

## The failure mode is you

Pinning's defining risk is not the attacker, it is the operator. Because a pinned client refuses any chain lacking a pinned key, a site that loses its pinned key, or pins to a set that later becomes invalid, locks its own users out. RFC 7469 warns plainly that "hosts may make themselves unavailable by pinning to a set of SPKIs that becomes invalid." The pin outlives your ability to fix the mistake, for as long as the pin's max-age.

The mandated cushion is the Backup Pin: a fingerprint for a secondary, not-yet-deployed key pair kept offline. "Because having a backup key pair is so important to recovery, UAs MUST require that hosts set a Backup Pin." If the primary key is lost or compromised, the operator deploys the backup and previously-pinned clients connect without error. Pinning without a valid backup pin is a loaded gun pointed at your own availability.

> [!warning] Hostile pinning turns the weapon around
> The same TOFU gap enables an attack RFC 7469 calls "hostile pinning": an attacker who obtains a valid certificate for a domain can serve a pinning header that pins to "a set of SPKIs of the attacker's choice," and a UA that "has not previously noted pins for that host" may adopt them, "preventing access to the legitimate site." The spec notes this persists only for the max-age and is mitigated by preloading pins in the UA. This fragility is why the RFC opens by warning that deploying pinning safely "will require operational and organizational maturity."

## Related Notes

- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the "any CA can sign for anyone" flaw pinning narrows
- [[man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - the attack pinning is aimed at
- [[certificate-transparency|Certificate Transparency]] - a detection-based alternative to pinning's prevention
- [[hsts-and-http-security-headers|HSTS and HTTP Security Headers]] - the sibling header-driven policy, sharing the same trust-on-first-use gap
- [[cryptographic-hash-functions|Cryptographic Hash Functions]] - what an SPKI fingerprint is

## Sources

- "Public Key Pinning Extension for HTTP," RFC 7469, IETF. https://www.rfc-editor.org/rfc/rfc7469.txt . Supports the requirement that a presented chain include at least one SPKI whose fingerprint matches a pinned fingerprint; pinning reducing the number of trusted authorities that can authenticate the domain and thereby reducing CA-compromise MITM; pinning as a trust-on-first-use mechanism with no protection on the first connection and the injected-PKP-header risk; the statement that it is not a perfect defense and that nothing short of pre-shared keys can be; detection of in-process MITM after initial communication; hosts making themselves unavailable by pinning to a set that becomes invalid; and the mandatory Backup Pin requirement.
