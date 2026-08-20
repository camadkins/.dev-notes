---
title: DNSSEC
description: "How DNSSEC turns DNS answers into signed data verified by a chain from the root, closing cache poisoning while deliberately leaving your queries in the clear."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-04-02
updated:
aliases:
  - DNSSEC
  - DNS Security Extensions
  - Domain Name System Security Extensions
---

The original [[dns-the-domain-name-system|Domain Name System]] had no way to tell a real answer from a forged one. A resolver asked "what is the address for example.com" and believed whatever came back, which is why cache poisoning worked: inject a plausible reply faster than the real server, and the resolver caches your lie. DNSSEC fixes this without encrypting anything. It signs the data itself, so a forged answer fails verification even if it arrives first.

> [!note] The idea
> DNSSEC "add[s] data origin authentication and data integrity to the Domain Name System." It does not protect the channel; it protects the *records*. Each DNS record set is signed, and a resolver rebuilds trust by "forming an authentication chain from a newly learned public key back to a previously known authentication public key," bottoming out at a configured trust anchor, in practice the root key. A poisoned answer has no valid signature in that chain, so it is rejected.

## Object security, not channel security

The design choice that makes DNSSEC work at internet scale is that it secures the *object*, not the *conversation*. "The key that signs a zone's data is associated with the zone itself and not with the zone's authoritative name servers." A signature travels with the record set through any cache, over any transport, and still verifies. That is what lets DNSSEC ride the existing untrusted, cache-everywhere DNS infrastructure without replacing it, exactly the property that separates it from a [[tls-and-the-https-handshake|TLS]]-style secured channel.

Concretely, DNSSEC adds four record types. The RRSIG carries the digital signature over a record set. The DNSKEY holds a zone's public key. The DS (Delegation Signer) sits in the parent zone and commits to the child's key. The NSEC record handles the awkward case below.

## The authentication chain

Verification is a walk down the tree. A resolver "authenticate[s] zone information by forming an authentication chain from a newly learned public key back to a previously known authentication public key." The typical chain the spec gives is `DNSKEY->[DS->DNSKEY]*->RRset`: the root's DNSKEY is trusted a priori, the root signs a DS record pointing at `.com`'s key, `.com` signs a DS pointing at `example.com`'s key, and `example.com` signs the actual address record.

The DS record is the hinge that makes this work across organizational boundaries. It "resides at a delegation point in a parent zone and indicates the public key(s) corresponding to the private key(s) used to self-sign the DNSKEY RRset at the delegated child zone's apex." Each parent vouches only for its child's key, not for the child's data, so no single authority signs the whole namespace. This is the same delegated-trust shape as a [[pki-and-x509-certificates|certificate chain]], mapped onto the DNS hierarchy. Break any link, and everything below it fails to validate, which is by design.

## Proving a name does not exist

Signing existing records is the easy half. The hard half is proving a *negative*, that `nonexistent.example.com` genuinely has no record, without a signed statement for every possible name. DNSSEC solves this with the NSEC record, which "explicitly describe[s] the gaps, or 'empty space', between domain names in a zone." NSEC records are sorted and chained, so a signed NSEC saying "nothing exists between `alpha` and `gamma`" is a verifiable proof that `beta` does not exist. Without it, an attacker could forge a "no such name" reply to suppress a real record.

> [!warning] DNSSEC does not hide your queries
> A repeated misconception: DNSSEC is not encryption. "DNSSEC is not designed to provide confidentiality, access control lists, or other means of differentiating between inquirers." Anyone on the path still sees which names you look up. The design assumed "all data in the DNS is thus visible," so integrity was the goal and privacy was left to other protocols. It also "provides no protection against denial of service attacks."

## Related Notes

- [[dns-the-domain-name-system|DNS: The Domain Name System]] - the naming system whose original trust gap DNSSEC closes
- [[digital-signatures|Digital Signatures]] - the RRSIG mechanism that makes a record set verifiable
- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the same delegated-chain trust model, applied to certificates
- [[cryptographic-hash-functions|Cryptographic Hash Functions]] - the digests underlying DS records and signatures
- [[certificate-transparency|Certificate Transparency]] - another bolt-on that added auditable trust to an existing insecure system

## Sources

- "DNS Security Introduction and Requirements," RFC 4033, IETF. https://www.rfc-editor.org/rfc/rfc4033.txt . Supports DNSSEC adding data origin authentication and data integrity; the four new record types (RRSIG, DNSKEY, DS, NSEC); zone data signed by a key associated with the zone not the name servers (object vs channel security); the authentication chain formed back to a configured trust anchor; the DNSKEY->[DS->DNSKEY]*->RRset chain and the DS record at delegation points; the NSEC record describing gaps between names to authenticate non-existence; and the explicit non-goals, that DNSSEC is not designed to provide confidentiality and offers no protection against denial of service.
