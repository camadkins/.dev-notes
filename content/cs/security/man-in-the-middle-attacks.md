---
title: Man-in-the-Middle Attacks
description: "Why encryption alone does not stop an on-path attacker, and why authentication is the property that actually closes the gap: whoever relays your traffic can read or rewrite it unless the channel proves who is on the other end."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-01-22
updated:
aliases:
  - MITM
  - on-path attack
  - active attacker
---

A man-in-the-middle attacker sits between two parties who believe they are talking directly to each other, and relays every message. If that is all they did, it would be harmless. The danger is that a relay can also read and rewrite what passes through it. The uncomfortable insight most people miss is that encrypting the traffic does not, by itself, stop this. If the attacker is the one you performed the key exchange *with*, they hold the keys, and the ciphertext is theirs to read.

> [!note] The idea
> Confidentiality and integrity both collapse against an active attacker on the path *unless the channel is authenticated*. Encryption hides content from a passive eavesdropper, but a man in the middle can run two separate encrypted sessions, one with each victim, and sit in the clear between them. What defeats them is not secrecy but proof of identity: binding the cryptographic session to a verified identity so that an impostor's session fails to authenticate. This is the entire reason TLS always authenticates the server.

## Key exchange establishes a secret, not an identity

A [[diffie-hellman-and-key-exchange|Diffie-Hellman key exchange]] lets two parties who have never met agree on a shared secret over an open network. What it does not do is tell either party *who* they agreed with. A man in the middle can complete a key exchange with the client while completing a second one with the server, decrypting and re-encrypting in between. Both endpoints see a properly encrypted connection. Both are wrong about the other end.

TLS closes this by refusing to leave identity unproven. RFC 8446 states the invariant flatly: "The server side of the channel is always authenticated; the client side is optionally authenticated." Authentication is not optional garnish on top of encryption; it is the load-bearing property. The server proves its identity with a certificate chained to a trusted authority (the machinery of [[pki-and-x509-certificates|PKI and X.509 certificates]]), and an impostor who cannot produce a valid signature for the expected name simply fails the handshake, encrypted channel or not.

## Defeating the active attacker, beyond the eavesdropper

The threat model TLS targets is explicitly the strongest one. RFC 8446 requires its guarantees to hold "even in the face of an attacker who has complete control of the network, as described in [RFC3552]." That phrasing is the definition of a man in the middle: someone who can read, drop, reorder, and inject any packet at will. A protocol that only protects against passive listening has not addressed this attacker at all.

Two properties together do the work. First, authentication of the endpoint, so the attacker cannot impersonate the server. Second, tamper-resistance of the negotiation itself. RFC 8446 notes that "the handshake protocol is designed to resist tampering; an active attacker should not be able to force the peers to negotiate different parameters than they would if the connection were not under attack." Without that second property, a man in the middle could quietly downgrade the connection to a weak cipher and break it anyway. Binding every handshake message into the authenticated transcript is what prevents that silent downgrade.

> [!warning] Being the man in the middle is often a network trick, not a crypto break
> An attacker rarely breaks the cryptography to get in the middle. They get there by controlling the path: [[arp-spoofing-and-lan-attacks|ARP spoofing]] to redirect a LAN, a rogue Wi-Fi access point, DNS tampering, or a compromised router. Once on the path, the only thing standing between them and your data is whether the channel authenticates its endpoints. This is why an unauthenticated TLS warning ("certificate does not match") is not a nuisance to click through; it is precisely the alarm that a man in the middle would trip.

## Related Notes

- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]] - agrees a shared secret but proves no identity on its own
- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the identity proof that makes an impostor's session fail
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the protocol that binds encryption to a verified server identity
- [[arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] - a common way an attacker gets onto the path in the first place
- [[digital-signatures|Digital Signatures]] - the primitive by which the server proves its identity in the handshake

## Sources

- "The Transport Layer Security (TLS) Protocol Version 1.3," RFC 8446, IETF. https://www.rfc-editor.org/rfc/rfc8446.txt . Supports that the server side of a TLS channel is always authenticated and the client side optionally, that the security properties must hold even against an attacker with complete control of the network, and that the handshake is designed to resist tampering so an active attacker cannot force weaker negotiated parameters.
