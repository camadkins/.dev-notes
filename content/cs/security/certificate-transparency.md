---
title: Certificate Transparency
description: "How append-only public logs turned CA mis-issuance from invisible to detectable, and why the design detects abuse rather than preventing it."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-05-21
updated:
aliases:
  - Certificate Transparency
  - CT
  - CT logs
---

The web's trust model has a single-point-of-failure baked in: any [[pki-and-x509-certificates|certificate authority]] your browser trusts can issue a valid certificate for *any* domain, including yours, and you would never know. A compromised or coerced CA that issues `google.com` to an attacker produces a certificate that every browser accepts. Before Certificate Transparency, the domain owner had no way to even find out. CT does not remove the CA's power to mis-issue. It removes their ability to do it in secret.

> [!note] The idea
> Certificate Transparency "aims to mitigate the problem of misissued certificates by providing publicly auditable, append-only, untrusted logs of all issued certificates." The logs "do not themselves prevent misissue, but they ensure that interested parties (particularly those named in certificates) can detect such misissuance." The shift is from *prevention* to *guaranteed detectability*: make every certificate public, and the domain owner watching the logs sees any rogue issuance.

## Append-only, and why that word is load-bearing

A public list of certificates is worthless if the log operator can quietly edit it. The whole scheme depends on the log being *[[cs/history/blockchain-and-nakamoto-consensus|append-only]]*, unable to remove or alter an entry after the fact, and CT enforces this cryptographically with a [[cs/dsa/trees|Merkle hash tree]] rather than by trusting the operator. Two proofs make it work: a Merkle audit path proves a specific certificate is included in the log, and a Merkle consistency proof proves that a newer log is a strict superset of an older one, that nothing was removed or rewritten. This is why the logs can be "untrusted", their good behavior is verifiable rather than assumed, the same design instinct behind a [[cryptographic-hash-functions|hash]]-linked ledger.

The spec is explicit that a cheating log gets caught. A log can violate its "append-only property by presenting two different, conflicting views of the Merkle Tree at different times and/or to different parties," and "both forms of violation will be promptly and publicly detectable."

## The SCT: proof a certificate was logged

When a certificate chain is submitted to a log, "a signed timestamp is returned, which can later be used to provide evidence to clients that the chain has been submitted." This is the Signed Certificate Timestamp (SCT). It is the log's signed promise to include the certificate within a bounded window called the Maximum Merge Delay (MMD).

The SCT is what gives CT teeth at the browser. The design's endgame, in the abstract's words, is "that eventually clients would refuse to honor certificates that do not appear in a log, effectively forcing CAs to add all issued certificates to the logs." Once a browser rejects any certificate lacking a valid SCT, a CA that wants its certificates to work *must* log them, which means it cannot mis-issue invisibly. "Misissued certificates that have not been publicly logged, and thus do not have a valid SCT, will be rejected by TLS clients."

## Logs detect nothing; monitors do

A subtle and important division of labor: the logs are dumb. "The logs do not themselves detect misissued certificates; they rely instead on interested parties, such as domain owners, to monitor them and take corrective action when a misissue is detected." A monitor is anyone who "ask[s] them regularly for all new entries" and checks "whether domains they are responsible for have had certificates issued that they did not expect."

So the security property is precise and worth stating carefully. CT guarantees that a mis-issued certificate becomes *publicly visible* within the MMD. It does not guarantee anyone is looking, nor that visibility undoes the harm. What a monitor does after detection "is beyond the scope of this document"; they "invoke existing business mechanisms" like demanding revocation.

> [!warning] Detection has a window, not an alarm
> A logged mis-issued certificate "will appear in that public log within the Maximum Merge Delay," so "the maximum period of time during which a misissued certificate can be used without being available for audit is the MMD." CT bounds how long abuse can hide, it does not make abuse impossible or instantaneous to catch.

## Related Notes

- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the CA trust model whose blind spot CT audits
- [[cryptographic-hash-functions|Cryptographic Hash Functions]] - the Merkle-tree hashing that makes the log append-only
- [[certificate-revocation-ocsp-and-crls|Certificate Revocation: CRLs and OCSP]] - what a monitor invokes after detecting a bad certificate
- [[digital-signatures|Digital Signatures]] - the signature on each SCT and log statement
- [[dnssec|DNSSEC]] - another retrofit that added verifiable trust to a deployed insecure system

## Sources

- "Certificate Transparency," RFC 6962, IETF. https://www.rfc-editor.org/rfc/rfc6962.txt . Supports CT mitigating misissuance via publicly auditable, append-only, untrusted logs that detect rather than prevent misissue; the Merkle-tree audit and consistency proofs enforcing append-only behavior; the promptly-and-publicly-detectable property of a misbehaving log; the signed timestamp (SCT) returned on submission and the goal of clients refusing unlogged certificates; misissued certificates without a valid SCT being rejected by TLS clients; logs not detecting misissue themselves but relying on monitors such as domain owners; and the Maximum Merge Delay bounding the audit window.
