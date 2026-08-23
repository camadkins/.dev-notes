---
title: "IEEE 802.1AE: MACsec"
description: "A standard that encrypts the wire itself and then explicitly refuses to say where the keys come from, pushing that to 802.1X; plus the SecTAG, the counter that had to be widened, and why hop-by-hop is the point rather than a limitation."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-08-08
updated:
aliases:
  - MACsec
  - 802.1AE
  - SecTAG
---

Most link-layer security arrives as a bolt-on. MACsec is the opposite: it inserts itself into the frame between the addresses and the payload, so that everything a switch would normally read is either still readable or explicitly protected, and the frame remains something an Ethernet bridge can forward. The document that specifies it is notable for what it deliberately leaves out.

> [!note] The idea
> 802.1AE encrypts and authenticates individual Ethernet frames on a single hop, and its most consequential clause is a **scope exclusion**: key management is declared out of scope and handed to 802.1X. Splitting the data plane from the key agreement into two standards owned by the same working group is what lets a silicon implementation of the cipher path ship independently of the software that negotiates keys.

## What it protects, and where

"IEEE 802.1AE (also known as MACsec) is a network security standard that operates at the medium access control layer and defines connectionless data confidentiality and integrity for media access independent protocols."

Two words in that sentence do heavy lifting. Connectionless means each frame is protected on its own, with no session state that a receiver must have accumulated. Media access independent means the protection is defined once for the family rather than per medium, which is the architectural discipline 802.1 imposes across the whole 802 family.

The standard describes the protection in familiar terms: "In common with IPsec and TLS, MACsec defines a security infrastructure to provide data confidentiality, data integrity and data origin authentication." The layer is what differs. [[cs/systems/tls-and-the-https-handshake|TLS protects a connection end to end]] and IPsec protects a packet across a routed path; MACsec protects a frame across one link. Every switch in the path decrypts and re-encrypts, which means a switch sees plaintext. That reads as a weakness against a TLS mental model and is actually the design goal: a bridge must be able to read addresses and tags to forward at all, and MACsec is protecting the segment rather than the conversation.

The threat it addresses is specifically a LAN threat. "MACsec allows unauthorized LAN connections to be identified and excluded from communication within the network," and "By assuring that a frame comes from the station that claimed to have sent it, MACSec can mitigate attacks on Layer 2 protocols." Source-address forgery is the root of most LAN attacks, and origin authentication at layer two removes it as a primitive. That is the connection to [[cs/security/arp-spoofing-and-lan-attacks|ARP spoofing and its relatives]]: they depend on being able to claim to be somebody else on the segment.

## The SecY and the SecTAG

The standard's architectural object is an entity, not a protocol. "The 802.1AE standard specifies the implementation of a MAC Security Entities (SecY) that can be thought of as part of the stations attached to the same LAN, providing secure MAC service to the client." The SecY sits between the MAC and its client, so from above the service looks like ordinary Ethernet.

The frame gains two structures. The Security Tag "is an extension of the EtherType," and an Integrity Check Value is appended as a message authentication code. Putting the SecTAG where an EtherType lives is the same trick 802.1Q used for the VLAN tag: existing parsers already look at that offset, so an unaware device sees an unknown EtherType rather than a corrupt frame.

Inside the SecTAG are three fields worth knowing. A connectivity association number identifies which association within the channel the frame belongs to. "An optional LAN-wide Secure Channel Identifier (SCI), which is not required on point-to-point links," is omitted on the common case to save bytes, which is a small illustration of a standard optimizing the deployment it expects. And "A packet number (PN) to provide a unique initialization vector for encryption and authentication algorithms as well as protection against replay attacks."

That packet number is the field to think hardest about.

## The counter that had to be widened

The default cipher suite is "GCM-AES-128 (Galois/Counter Mode of Advanced Encryption Standard cipher with 128-bit key)," and Galois/Counter Mode has one absolute requirement: never reuse a nonce under the same key. Nonce reuse in GCM does not merely leak plaintext relationships, it exposes the authentication subkey and destroys the integrity guarantee, which is the sharpest instance of the rule in [[cs/security/block-cipher-modes-of-operation|why the mode matters more than the cipher]].

The MACsec nonce is built from the packet number, and the packet number is a counter. A counter that wraps under a live key is a nonce reuse. In 2013 the 802.1AEbw amendment defined the extended packet number cipher suites, GCM-AES-XPN-128 and GCM-AES-XPN-256, specifically to widen the packet number to 64 bits. An entire amendment whose technical content is that a counter field was too narrow for the link speeds that arrived after publication.

That is worth sitting with as a general lesson about specification. The 2006 standard was correct. The field was adequate for the rates of its time. What made it a problem was the rest of the industry going faster, and the fix could not be a configuration change because the nonce construction is part of the cipher suite and therefore part of the negotiated contract. A width chosen in a wire format is one of the most expensive decisions a standard makes, which is the same argument as [[cs/languages/common/numeric-types-and-overflow-semantics|the one about what happens at the edge of a fixed-width type]], with the difference that here overflow is a cryptographic catastrophe rather than a wrong number.

The standard also anticipates key rotation in its association model: "More than one association is permitted within the channel for the purpose of key change without traffic interruption (standard requires devices to support at least two)." Two associations is a shall, and it exists so that a new key can be installed and adopted without a gap. Any long-lived encrypted channel needs this property, and it is a clean example of a standard mandating the minimum resource count that makes an operation possible rather than mandating the operation.

## The scope exclusion

The most important sentence in the document is about what it does not do. "Key management and the establishment of secure associations is outside the scope of 802.1AE, but is specified by 802.1X-2010."

That split is deliberate and productive. The data path (parse the SecTAG, run GCM, verify the ICV, check the packet number) is per-frame work at line rate and belongs in hardware. Key agreement is occasional, complicated, involves identity and certificates, and belongs in software. Putting them in one standard would force one conformance claim over two completely different engineering problems. Putting them in two lets a switch ASIC implement 802.1AE while the control plane implements the MACsec Key Agreement of [[cs/standards/ieee-802-1x-port-based-access-control|802.1X-2010]], and lets either be revised without reopening the other.

It also produces the tidy operational story: 802.1X decides who may talk, and the same exchange yields the keys that protect what they say. Authentication and confidentiality out of one negotiation, specified separately, which is the layer-two counterpart of the discipline behind keeping key management distinct from traffic encryption.

Amendments since have followed the usual pattern: 256-bit keys in 2011, extended packet numbering in 2013, Ethernet data encryption devices in 2017, a 2018 revision, and a 2023 amendment adding protection against traffic-analysis correlation of frame sizes and timings with user identity.

## Related Notes

- [[cs/standards/ieee-802-1x-port-based-access-control|IEEE 802.1X, Port-Based Access Control]] for the standard that supplies the keys MACsec refuses to specify.
- [[cs/standards/ieee-802-1q-vlan-tagging|IEEE 802.1Q, VLAN Tagging as Specified]] for the same EtherType-extension trick used for a different purpose.
- [[cs/security/block-cipher-modes-of-operation|Block Cipher Modes of Operation]] for why a wrapping counter is fatal under GCM.
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] for the end-to-end alternative and what hop-by-hop gives up.
- [[cs/security/arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] for the attacks that origin authentication at layer two removes.
- [[cs/security/comsec-principles|COMSEC Principles]] for the separation of key management from traffic protection as doctrine.

## Sources

- [IEEE 802.1AE (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.1AE) backs the standard's definition and layer, the exclusion of key management to 802.1X-2010, the SecY entity, the SecTAG as an EtherType extension, the ICV, the connectivity association and packet number fields, the optional SCI, the two-association requirement for key change, the GCM-AES-128 default cipher suite, the 802.1AEbn and 802.1AEbw amendments, and the later publication history.
- [IEEE 802.1X (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.1X) backs the modification of EAPOL for use with IEEE 802.1AE in 802.1X-2010.
