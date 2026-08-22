---
title: "Certificate Revocation: CRLs and OCSP"
description: "Why a compromised key before expiry forces certificate revocation, and how CRLs and OCSP trade coarse-grained lists against timely queries with weak positive answers."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-03-28
updated:
aliases:
  - Certificate Revocation
  - CRL
  - OCSP
  - Certificate Revocation List
---

A [[pki-and-x509-certificates|certificate]] carries an expiry date, and "when a certificate is issued, it is expected to be in use for its entire validity period." But keys leak. If a private key is compromised in month one of a two-year certificate, the certificate is still cryptographically valid for the remaining twenty-three months. Revocation is the only recourse: a way to say "ignore this certificate, it is dead" before its own clock runs out. The two standard mechanisms make opposite tradeoffs, and neither is clean.

> [!note] The idea
> Revocation exists because a certificate can become invalid before it expires, through "compromise or suspected compromise of the corresponding private key." A CRL is a periodically published, signed list of dead certificates; its weakness is *staleness*, revocation is only as fresh as the last list. OCSP answers a live per-certificate query for timeliness, but its "good" answer is a surprisingly weak statement, and the entire scheme assumes the relying party can actually reach the responder.

## CRLs: a signed list, published on a schedule

[[cs/standards/what-a-standard-actually-is|The original X.509 method]] is a bulletin board. Each CA "periodically issu[es] a signed data structure called a certificate revocation list (CRL). A CRL is a time-stamped list identifying revoked certificates that is signed by a CA or CRL issuer and made freely available in a public repository." To use a certificate safely, a verifier "acquires a suitably recent CRL and checks that the certificate serial number is not on that CRL."

The elegant part is that a CRL is signed, so it "may be distributed by exactly the same means as certificates themselves, namely, via untrusted servers and untrusted communications." You do not need a trusted channel to fetch it; the [[digital-signatures|signature]] proves it is genuine.

The unavoidable weakness is timing. "One limitation of the CRL revocation method ... is that the time granularity of revocation is limited to the CRL issue period." If a CA issues CRLs daily and a key is compromised an hour after publication, that revocation "will not be reliably notified to certificate-using systems until all currently issued CRLs are scheduled to be updated," which "may be up to one hour, one day, or one week depending on the frequency that CRLs are issued." During that gap the compromised certificate still checks out against every [[cs/systems/dns-the-domain-name-system|cached CRL]].

## OCSP: ask about one certificate, right now

The Online Certificate Status Protocol was built to shrink that gap. It provides a way "to obtain timely information regarding the revocation status of certificates," used "in lieu of, or as a supplement to, checking against a periodic CRL." Instead of downloading a whole list, the client asks a responder about one certificate: "An OCSP client issues a status request to an OCSP responder and suspends acceptance of the certificates in question until the responder provides a response." The responder returns one of three states, `good`, `revoked`, or `unknown`.

That looks like a strict upgrade over CRLs, but the `good` answer is weaker than intuition suggests.

> [!warning] "good" does not mean "genuine"
> The OCSP `good` state "indicates that no certificate with the requested certificate serial number currently within its validity interval is revoked." Crucially, it "does not necessarily mean that the certificate was ever issued or that the time at which the response was produced is within the certificate's validity interval." A responder can answer `good` for a serial number that no CA ever issued. `good` means "not on the revoked list", not "this is a real, valid certificate", a distinction that has enabled real attacks.

The three states also split responsibility deliberately. `revoked` "indicates that a certificate with the requested serial number should be rejected," a definitive stop. `unknown` means the responder "doesn't know about the certificate being requested," which merely lets "the client ... decide whether it wants to try another source of status information (such as a CRL)." The client, not the responder, owns the final decision when status is uncertain, and that is where the practical soft spot lives: an availability failure looks a lot like `unknown`, and a relying party that proceeds anyway has effectively skipped revocation entirely.

## Related Notes

- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the certificates whose early death revocation handles
- [[digital-signatures|Digital Signatures]] - what makes a CRL trustworthy over an untrusted channel
- [[certificate-transparency|Certificate Transparency]] - detects a bad certificate; revocation is what a monitor then demands
- [[cryptographic-hash-functions|Cryptographic Hash Functions]] - the serial numbers and digests that identify certificates in these lists
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - where a browser must decide whether to trust the presented certificate

## Sources

- "Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile," RFC 5280, IETF. https://www.rfc-editor.org/rfc/rfc5280.txt . Supports certificates expected to be used for their whole validity period; revocation on key compromise; the CRL as a periodically issued, signed, time-stamped list of revoked serial numbers in a public repository; verifiers acquiring a suitably recent CRL; CRLs distributable over untrusted servers and communications; and the time-granularity limitation bounded by the CRL issue period (up to an hour, day, or week).
- "X.509 Internet Public Key Infrastructure Online Certificate Status Protocol - OCSP," RFC 6960, IETF. https://www.rfc-editor.org/rfc/rfc6960.txt . Supports OCSP providing timely revocation status in lieu of or supplementing a periodic CRL; the client suspending acceptance until the responder replies; the good/revoked/unknown states; the caveat that good does not necessarily mean the certificate was ever issued or is within its validity interval; revoked meaning the certificate should be rejected; and unknown letting the client try another status source such as a CRL.
