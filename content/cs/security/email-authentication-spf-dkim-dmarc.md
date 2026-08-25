---
title: "Email Authentication: SPF, DKIM, DMARC"
description: "SMTP authenticates nobody, so three DNS-based layers bolt sender identity on afterward, and the non-obvious catch is that SPF and DKIM verify a different identifier than the From address a human reads, which is the exact gap DMARC's alignment closes."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-02-14
updated:
aliases:
  - SPF
  - DKIM
  - DMARC
---

SMTP was designed to move mail, not to prove who sent it. [[cs/standards/what-a-standard-actually-is|RFC 7208]] states the hole precisely: "Email on the Internet can be forged in a number of ways. In particular, existing protocols place no restriction on what a sending host can use as the 'MAIL FROM' of a message or the domain given on the SMTP HELO/EHLO commands." A sender types whatever return address it likes and the protocol shrugs. Because rewriting the protocol was never realistic, sender authentication was added as three separate layers riding on [[cs/systems/dns-the-domain-name-system|DNS]]. The interesting part is not that each layer works, but that two of them check an identifier the recipient never sees, and the third exists to fix exactly that.

> [!note] The idea
> SPF and DKIM each authenticate a real domain, but neither authenticates the `From:` header a person reads. SPF validates the SMTP envelope sender (`MAIL FROM`/`HELO`); DKIM validates whichever domain chose to sign. A message can pass both while the visible From is a forgery, because the authenticated identifier and the displayed one need not be the same domain. DMARC closes the gap by requiring *identifier alignment*: the authenticated domain must match the From domain, and it lets the domain owner publish a policy for what to do when it does not.

## SPF authorizes hosts, by envelope, in DNS

SPF answers one question: is this sending IP allowed to send for this domain? Per RFC 7208, "ADMDs can authorize hosts to use their domain names in the 'MAIL FROM' or 'HELO' identities. Compliant ADMDs publish Sender Policy Framework (SPF) records in the DNS specifying which hosts are permitted to use their names." The receiver looks up the record and checks whether the connecting server is on the approved list.

The limitation is scope. SPF binds to the envelope sender and the HELO name, not to the header From. RFC 7208 warns that checking SPF against other identities is unsafe: without explicit approval, "checking other identities against SPF version 1 records is [[cs/standards/normative-versus-informative-and-the-word-shall|NOT RECOMMENDED]] because there are cases that are known to give incorrect results." So SPF alone tells you a permitted host relayed the message; it does not tell you the visible author is genuine.

## DKIM signs, and signs for whoever chose to sign

DKIM adds a cryptographic layer. It "permits a person, role, or organization that owns the signing domain to claim some responsibility for a message by associating the domain with the message." The mechanism is a [[cs/security/digital-signatures|digital signature]] over the message, verified with a public key fetched from DNS: "assertion of responsibility is validated through a cryptographic signature and by querying the Signer's domain directly to retrieve the appropriate public key," conceptually the same key-in-DNS pattern that underpins [[cs/security/pki-and-x509-certificates|public-key trust]] elsewhere.

DKIM's honest subtlety is spelled out in its own spec: it "separates the question of the identity of the Signer of the message from the purported author of the message." The signer is whoever holds the key and chose to sign. That can be a forwarding service, a mailing list, or an attacker's own domain, none of which need match the From address. A valid DKIM signature proves *some* domain vouched for the message, not that *the From domain* did.

## DMARC ties the authenticated identity to the visible one

DMARC is the layer that makes SPF and DKIM protect the identifier people actually read. It builds directly on them: "the Sender Policy Framework ([SPF]) and DomainKeys Identified Mail ([DKIM]) provide domain-level authentication." Its contribution is alignment. RFC 7489: "the domain name extracted from a message's RFC5322.From field is the primary identifier in the DMARC mechanism," and "when the domain in the RFC5322.From address matches a domain validated by SPF or DKIM (or both), it has Identifier Alignment." Passing an underlying check is not enough; the passing domain must be the From domain.

DMARC also lets the owner state what receivers should do on failure, published as a policy in DNS. The three levels, per RFC 7489, are `none` ("the Domain Owner requests no specific action be taken regarding delivery," a monitor-only mode), `quarantine` (treat failing mail "as suspicious"), and `reject` ("the Domain Owner wishes for Mail Receivers to reject email that fails the DMARC mechanism check"). The usual path is to deploy at `none`, read the aggregate reports to find every legitimate sender, then tighten toward `reject` once nothing real still fails.

> [!example] Why a passing SPF check can still be a spoof
> An attacker sends from a server that is a valid sender for `bounce.attacker.example`, using that as the envelope `MAIL FROM`, while the header reads `From: security@yourbank.example`. SPF checks the envelope domain, finds the server authorized for it, and passes. The recipient's client shows only `yourbank.example`. Nothing in SPF caught the mismatch, because SPF never looked at the header. DMARC does: it sees the authenticated domain is `attacker.example`, the From domain is `yourbank.example`, alignment fails, and the bank's published `reject` policy tells the receiver to drop it.

## Related Notes

- [[cs/security/digital-signatures|Digital Signatures]] - the primitive DKIM uses to bind a domain to a message
- [[cs/security/pki-and-x509-certificates|PKI and X.509 Certificates]] - the same publish-a-key pattern DKIM applies through DNS
- [[cs/systems/dns-the-domain-name-system|DNS: The Domain Name System]] - the distributed database all three mechanisms publish their records in
- [[cs/security/phishing-and-social-engineering|Phishing and Social Engineering]] - the spoofed-sender attacks these layers are meant to blunt
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] - what a DKIM signature covers to detect message tampering

## Sources

- "Sender Policy Framework (SPF) for Authorizing Use of Domains in Email, Version 1," RFC 7208, IETF. https://www.rfc-editor.org/rfc/rfc7208.txt . Supports that SMTP places no restriction on the MAIL FROM or HELO domain, that ADMDs publish SPF records in DNS specifying which hosts may use their names in the MAIL FROM or HELO identities, and that checking other identities (such as the header From) against SPFv1 records is NOT RECOMMENDED.
- "DomainKeys Identified Mail (DKIM) Signatures," RFC 6376, IETF. https://www.rfc-editor.org/rfc/rfc6376.txt . Supports that DKIM lets a domain owner claim responsibility for a message by associating the domain with it, that responsibility is validated through a cryptographic signature and a public key retrieved from the signer's domain, and that DKIM separates the signer's identity from the purported author.
- "Domain-based Message Authentication, Reporting, and Conformance (DMARC)," RFC 7489, IETF. https://www.rfc-editor.org/rfc/rfc7489.txt . Supports that DMARC builds on SPF and DKIM for domain-level authentication, that the RFC5322.From domain is its primary identifier, that identifier alignment requires the From domain to match a domain validated by SPF or DKIM, and the three published policies none, quarantine, and reject.
