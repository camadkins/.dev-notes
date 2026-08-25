---
title: TLS and the HTTPS Handshake
description: How two strangers agree on a secret over a wiretapped wire - public-key cryptography used once to bootstrap a fast symmetric channel, the certificate chain that proves who you are talking to, and the plaintext field censors read.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-22
updated:
aliases:
  - TLS
  - HTTPS
  - SSL
---

The padlock in your address bar stands for a small miracle: your browser and a server it has never met agree on a shared secret, in the open, while anyone on the path can read every byte they exchange, and the eavesdropper still cannot derive the secret. That is the job of TLS, the protocol underneath the S in HTTPS. The trick is not to keep the conversation secret from the start. It is to use slow public-key cryptography for a single opening move, then switch to fast symmetric encryption for everything else.

> [!note] The idea
> TLS runs expensive asymmetric cryptography exactly once, at the start, to do two things: prove the server is who it claims (via a certificate) and agree on one ephemeral shared key without ever sending it. Everything after that is encrypted with cheap symmetric crypto using that key. Public-key math solves the impossible-looking part (agreeing on a secret in public); symmetric crypto does the bulk work.

## The handshake

When you connect to an `https://` URL, before any page data moves, client and server run a handshake:

1. **ClientHello.** The client opens with the TLS versions and cipher suites it supports, a random value, and a key share. It also names the host it wants in the Server Name Indication (SNI) field, because one IP may serve many sites.
2. **Certificate.** The server replies with its X.509 certificate, which binds its hostname to a public key and is signed by a certificate authority. The client checks that signature chains up to a CA it already trusts. This is the authentication step: it is how you know you are talking to the real server and not an impostor in the middle.
3. **Key agreement.** Both sides use [[cs/military-computing/rsa-and-computational-hardness|public-key cryptography]] to arrive at the same shared secret without transmitting it. In modern TLS this is an ephemeral Diffie-Hellman exchange, so the secret exists only for this session.
4. **Switch to symmetric.** From the shared secret both sides derive [[cs/military-computing/des-standardization-and-symmetric-crypto|symmetric keys]] and encrypt the rest of the connection with a fast cipher like AES. The asymmetric work is done.

![The TLS handshake: client and server exchange a hello and a certificate, agree an ephemeral key with public-key cryptography, then switch to fast symmetric encryption for the session.](cs/systems/assets/tls-handshake.svg)

TLS 1.3, published in 2018 as RFC 8446, compressed this to a single round trip (with an optional zero-round-trip resumption mode for repeat visits), and dropped a pile of old, weak options. It is the current standard, the latest step in a lineage that began with Netscape's SSL in the mid-1990s.

## Why asymmetric, then symmetric

Public-key cryptography solves a problem symmetric crypto cannot: agreeing on a key with someone you have never met, over a channel everyone can read. But it is slow, far too slow to encrypt a video stream or a busy server's traffic. Symmetric crypto is fast but assumes both sides already share a key. TLS uses each for what it is good at. The handshake is the expensive bridge from "we share nothing" to "we share one key," crossed once per session.

> [!tip]
> This split is the whole reason HTTPS is practical at scale. If every byte needed public-key operations, the web would buckle. Instead the costly part happens once, at connection setup, and amortizes over the entire session.

## Forward secrecy and the trust anchor

Two properties make modern TLS strong, and one structural weakness keeps it interesting:

- **Forward secrecy.** Because the session key comes from an *ephemeral* Diffie-Hellman exchange, it is thrown away when the connection ends. If the server's long-term private key leaks years later, an attacker who recorded today's traffic still cannot decrypt it. Each session's secret died with the session.
- **Certificate authorities are the trust anchor, and its weak point.** The whole model rests on your device trusting a set of CAs. A CA that is compromised, coerced, or tricked into issuing a certificate for a name it should not can let an attacker impersonate that site. Certificate Transparency logs exist precisely to make such mis-issuance detectable.

## The one field censors read

The handshake hides its contents, but historically it leaked one thing in the clear: the SNI. The client announces the hostname it wants at the very start, in plaintext, so a passive observer or a national firewall can see which site you are visiting even though the page itself is encrypted. That is the mechanism behind [[cs/geopolitics/cyber-sovereignty|SNI-based filtering]]: block the handshake the moment the forbidden name appears, without decrypting anything.

The fix is Encrypted Client Hello (ECH), which encrypts the whole ClientHello, hostname included. Browsers began enabling it by default in 2023. It closes the last obvious leak in an otherwise-private handshake, and it is one front in the ongoing contest between [[cs/geopolitics/surveillance-and-privacy|surveillance and privacy]].

> [!example] Clicking a padlock
> 1. DNS resolves `example.com` to an IP (see [[cs/systems/dns-the-domain-name-system|DNS]]).
> 2. TCP opens a connection to that IP on port 443.
> 3. **ClientHello** goes out: supported ciphers, a random, a key share, the SNI.
> 4. Server returns its **certificate** plus its key share. The browser verifies the cert chains to a trusted CA and matches the hostname.
> 5. Both sides derive the same session key from the two key shares. No key ever crossed the wire.
> 6. The browser sends `GET /` encrypted with the symmetric key. The padlock appears. Everything from here is fast symmetric crypto.

## Related Notes

- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]] - the public-key idea the handshake leans on, and why a backdoor cannot be selective
- [[cs/military-computing/des-standardization-and-symmetric-crypto|DES and Symmetric Crypto]] - the fast symmetric ciphers that carry the session once the key is agreed
- [[cs/systems/network-protocols|Network Protocols]] - where TLS sits between TCP and HTTP in the stack
- [[cs/systems/dns-the-domain-name-system|DNS]] - the lookup that happens just before the handshake, and what DoH protects with TLS
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] - SNI filtering as a censorship technique, and ECH as the countermeasure
- [[cs/geopolitics/surveillance-and-privacy|Surveillance & Privacy]] - the encryption debate over whether lawful access can ever be built in safely

## Sources

- "Transport Layer Security," Wikipedia. https://en.wikipedia.org/wiki/Transport_Layer_Security . Supports TLS providing authentication, confidentiality, and integrity for HTTPS; the handshake using asymmetric cryptography and X.509 certificates from certificate authorities to agree a symmetric session key; TLS 1.3 published as RFC 8446 in August 2018 with 1-RTT (and optional 0-RTT) handshakes; forward secrecy via ephemeral Diffie-Hellman; and the lineage from Netscape's SSL.
- "Server Name Indication," Wikipedia. https://en.wikipedia.org/wiki/Server_Name_Indication . Supports SNI carrying the requested hostname in plaintext (readable by network filters and censors) and Encrypted Client Hello (ECH) encrypting the full ClientHello, with default browser support arriving in 2023.
