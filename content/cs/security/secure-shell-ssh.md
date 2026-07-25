---
title: "The Secure Shell Protocol (SSH)"
description: "How SSH bootstraps an encrypted remote shell from one act of trust, verifying the server host key, and why skipping that check leaves the whole channel open."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-02-16
updated:
aliases:
  - SSH
  - Secure Shell
  - SSH Protocol
---

Telnet and rlogin sent your password across the wire in the clear. Anyone on the path read it. SSH replaced them, and RFC 4251 states the goal plainly: it is "a protocol for secure remote login and other secure network services over an insecure network." The interesting part is not that SSH encrypts, it is *where the security actually comes from*. Encryption alone buys nothing if you handed the key to an impostor. SSH's entire guarantee rests on one earlier step, verifying that the machine you reached is the machine you meant.

> [!note] The idea
> SSH is three protocols stacked. The Transport Layer "provides server authentication, confidentiality, and integrity with perfect forward secrecy," the User Authentication Protocol "authenticates the client to the server," and the Connection Protocol "multiplexes the encrypted tunnel into several logical channels." The confidentiality of the whole stack bootstraps from a single act: the client verifying the server's host key during key exchange. Get that wrong and the encryption protects your traffic to an attacker.

## The three components

The split matters because each layer has a different job and a different failure mode. The transport layer runs first, negotiating "key exchange method, public key algorithm, symmetric encryption algorithm, message authentication algorithm, and hash algorithm," then establishing an encrypted, integrity-protected channel using [[diffie-hellman-and-key-exchange|Diffie-Hellman key exchange]]. Only after that channel exists does user authentication happen, which is why your password or key never crosses an unencrypted link. The connection layer then rides inside, letting a single SSH session carry your shell, a port forward, and an `scp` transfer as separate channels.

Server authentication happens in the transport layer, not the user layer. That ordering is the whole point: the server proves who it is *before* you prove who you are, so you never surrender a credential to an unverified peer.

## The host key is the trust anchor

"The server host key is used during key exchange to verify that the client is really talking to the correct server. For this to be possible, the client must have a priori knowledge of the server's public host key." That last clause is the hard problem. How does the client obtain the right host key in the first place?

RFC 4251 offers two trust models. The first is a local database associating each hostname with its host key: "This method requires no centrally administered infrastructure, and no third-party coordination." The downside is the database "may become burdensome to maintain." The second delegates to a certification authority, where "the client only knows the CA root key, and can verify the validity of all host keys certified by accepted CAs," easing maintenance but placing "a lot of trust ... on the central infrastructure." This is the same tension [[pki-and-x509-certificates|PKI]] resolves for the web, and SSH deliberately made it optional rather than mandatory.

## Trust on first use, and its gap

Most SSH deployments use neither a maintained database nor a CA. They use the middle strategy the RFC describes: "only accept a host key without checking the first time a host is connected, save the key in a local database, and compare against that key on all future connections." This is trust on first use (TOFU), and it is why you see that "authenticity of host ... can't be established" prompt exactly once per server.

The spec is candid about the cost. Accepting a key unchecked on first contact "still provides protection against passive listening; however, it becomes vulnerable to active man-in-the-middle attacks." An attacker who is present during that very first connection can substitute their own host key and sit in the middle forever after, because your saved key is now *their* key. SSH accepted this gap deliberately: "as there is no widely deployed key infrastructure available on the Internet," TOFU "makes the protocol much more usable during the transition time" while still beating telnet by a wide margin.

> [!warning] The fingerprint is the out-of-band check
> The defense against first-connection MITM is to verify the host key fingerprint through a channel the attacker does not control. RFC 4251 anticipates exactly this: a "hexadecimal fingerprint derived from the SHA-1 hash of the public key ... can easily be verified by using telephone or other external communication channels." A blindly accepted fingerprint is a blindly accepted server.

## Related Notes

- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]] - the transport-layer mechanism that establishes SSH's session keys
- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the CA trust model SSH offers as an alternative to local host-key databases
- [[digital-signatures|Digital Signatures]] - how public-key host authentication proves server identity
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] - why SSH negotiates a symmetric cipher after an asymmetric handshake
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the parallel handshake the web took, with mandatory CA trust instead of TOFU

## Sources

- "The Secure Shell (SSH) Protocol Architecture," RFC 4251, IETF. https://www.rfc-editor.org/rfc/rfc4251.txt . Supports SSH as a protocol for secure remote login over an insecure network; the three-component split (transport server authentication/confidentiality/integrity with perfect forward secrecy, user authentication, connection multiplexing); the host key verifying the correct server and requiring a priori client knowledge; the two trust models (local database, CA); trust-on-first-use strategy; the passive-vs-active-MITM tradeoff and usability rationale; and the SHA-1 fingerprint out-of-band check.
- "The Secure Shell (SSH) Transport Layer Protocol," RFC 4253, IETF. https://www.rfc-editor.org/rfc/rfc4253.txt . Supports the negotiation of key exchange, public key, symmetric encryption, MAC, and hash algorithms, and the Diffie-Hellman key exchange establishing the encrypted transport.
