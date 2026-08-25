---
title: VPNs and Tunneling
description: "A VPN as an encrypted tunnel that binds identity to allowed addresses, and IPsec versus WireGuard as the tradeoff between configurability and a small auditable codebase."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-06-14
updated:
aliases:
  - VPN
  - virtual private network
  - tunneling
  - WireGuard
  - IPsec
---

A tunnel is a simple trick with a large payoff: wrap each packet of a private conversation [[cs/networking/osi-and-tcp-ip-models|inside another packet]], encrypt the wrapper, and send it across a network you do not trust. To the untrusted network in between, you are shipping opaque blobs to one endpoint. To the two endpoints, once they unwrap and decrypt, it is as if a private wire ran directly between them. That is a VPN, and the interesting engineering question is not *that* it encrypts but *how it decides* which packets belong to which peer.

> [!note] The idea
> A VPN builds an encrypted, authenticated tunnel across a hostile network so remote endpoints behave as if on one private LAN. The hard part is binding cryptographic identity to network identity: which keys are allowed to speak for which IP addresses. IPsec and WireGuard answer that with opposite philosophies, one maximally configurable, one deliberately minimal and auditable, and the contrast is a clean lesson in security-through-simplicity.

## The services a tunnel provides

[[cs/standards/what-a-standard-actually-is|RFC 4301]], the IPsec architecture, enumerates what "security for IP" actually means. The protection covers "access control, connectionless integrity, data origin authentication, detection and rejection of replays (a form of partial sequence integrity), confidentiality (via encryption), and limited traffic flow confidentiality." Confidentiality (nobody reads it), integrity and origin authentication (nobody forged or altered it), and replay rejection (nobody records and resends it) are the core guarantees any serious tunnel must give. Encryption alone gives only the first; a VPN that skips authentication and replay protection is not secure, merely private-looking.

IPsec offers two modes, and the tunnel case is the VPN case: "in tunnel mode, AH and ESP are applied to tunneled IP packets," where the original packet becomes the payload of a new one with a fresh outer header. This is what lets a remote laptop's traffic emerge onto the corporate network as though it originated there.

## The binding problem, and two answers

The subtle part is authorization, not encryption. Once a packet is decrypted, the receiver must decide whether the sender was *allowed* to claim that source address, or an authenticated peer could impersonate any host on the network. The WireGuard paper states this as the fundamental principle: "The fundamental principle of a secure VPN is an association between peers and the IP addresses each is allowed to use as source IPs." WireGuard makes the binding brutally direct: "peers are identified strictly by their public key, a 32-byte Curve25519 point," and a table maps each public key to its permitted addresses. Identity *is* the key; there is no separate account, certificate, or negotiation of who you are.

IPsec takes the other road. The WireGuard paper's own critique is that IPsec is "itself a complicated protocol with much choice and malleability," and "the complexity, as well as the sheer amount of code, of this solution is considerable," with administrators facing "a completely separate set of firewalling semantics and secure labeling for IPsec packets." That flexibility, negotiable ciphers, multiple key-exchange modes, fine-grained policy, is genuinely useful in heterogeneous enterprise environments. But flexibility is attack surface and configuration risk.

## Why small is a security property

WireGuard's design thesis is that a VPN you can *read* is a VPN you can *trust*. The paper's headline claim: "WireGuard can be simply implemented for Linux in less than 4,000 lines of code, making it easily audited and verified." Set that against IPsec plus IKE, which run to tens of thousands of lines across multiple daemons. Fewer lines mean fewer places for a bug, and a codebase small enough to be [[cs/software-engineering/code-review|reviewed end to end]] is a codebase whose security claims can actually be checked rather than merely asserted. WireGuard also fixes its cipher suite (Curve25519 for [[cs/security/diffie-hellman-and-key-exchange|key exchange]], ChaCha20-Poly1305 for the [[cs/security/symmetric-vs-asymmetric-cryptography|symmetric]] transform) rather than negotiating it, removing the downgrade attacks and misconfiguration that cipher agility invites.

> [!warning] Simplicity is a deliberate tradeoff, not a free lunch
> WireGuard's minimalism is bought by giving things up: no cipher negotiation, no built-in dynamic address assignment, no crypto agility to swap a broken primitive without a version bump. IPsec's complexity buys interoperability across decades of vendors and standards. The right choice depends on whether you value an auditable core or maximal configurability. The general lesson holds beyond VPNs: every line of security-critical code you cannot audit is a line you are trusting on faith.

## Related Notes

- [[cs/security/firewalls|Firewalls]] - the chokepoint a VPN tunnel passes through as opaque, uninspectable traffic
- [[cs/security/diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]] - how the two endpoints agree on a shared key over a hostile network
- [[cs/security/symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] - the public-key identity plus symmetric bulk encryption a VPN combines
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the other dominant way to build an encrypted authenticated channel
- [[cs/systems/onion-routing-and-anonymity-networks|Onion Routing and Anonymity Networks]] - tunneling taken further, to hide the route itself and not only the content

## Sources

- "Security Architecture for the Internet Protocol," RFC 4301, IETF. https://www.rfc-editor.org/rfc/rfc4301.txt . Supports the set of IPsec security services (access control, connectionless integrity, data origin authentication, replay detection and rejection, confidentiality via encryption, and limited traffic flow confidentiality) and tunnel mode applying AH and ESP to tunneled IP packets.
- Donenfeld, J. A., "WireGuard: Next Generation Kernel Network Tunnel," June 1, 2020. https://www.wireguard.com/papers/wireguard.pdf . Supports the fundamental VPN principle of associating peers with the source IPs they may use; peers identified strictly by a 32-byte Curve25519 public key; the critique of IPsec as complex with considerable code and separate firewalling semantics; and WireGuard being implementable in less than 4,000 lines of code, making it easily audited and verified.
