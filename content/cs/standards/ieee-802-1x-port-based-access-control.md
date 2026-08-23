---
title: "IEEE 802.1X: Port-Based Access Control"
description: "The standard specifies an envelope and a pair of logical ports, not an authentication method: the uncontrolled port is the hole in the wall through which a device that has not been authenticated is allowed to speak."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-07-08
updated:
aliases:
  - 802.1X
  - EAPOL
  - Port-Based Network Access Control
---

Every access-control system faces the same bootstrap problem. To decide whether to let something in, you have to talk to it, and talking to it is already letting it in a little. 802.1X answers that with a piece of specification design worth stealing: it splits one physical port into two logical ones and gives the unauthenticated device exactly one channel, wide enough to authenticate on and nothing else.

> [!note] The idea
> 802.1X specifies **an encapsulation and a port model, not an authentication scheme**. It carries somebody else's protocol (EAP) inside a LAN frame, and it defines a controlled port that stays shut until an outside authority says otherwise plus an uncontrolled port that exists solely to carry the conversation that opens the first one. The switch never evaluates a credential; it enforces a decision made elsewhere.

## What the standard actually contains

"IEEE 802.1X is an IEEE Standard for port-based network access control," and its technical contribution is narrow and precise: it "defines the encapsulation of the Extensible Authentication Protocol (EAP) over wired IEEE 802 networks" and over wireless ones, known as EAP over LAN or EAPOL.

Read that as a division of labor. EAP is an IETF protocol and a framework rather than a method, so what credentials are exchanged, whether certificates are involved, and how mutual authentication works are all outside 802.1X. IEEE specified the envelope and left the letter to somebody else. That is why one deployment runs EAP-TLS and another runs PEAP with password credentials while both conform to the same IEEE standard, and it is a clean example of a standard deliberately declining to specify the part that will change fastest.

Its position in the stack is stated explicitly: "802.1X is part of the logical link control (LLC) sublayer of the 802 reference model." That is the placement that later forced [[cs/standards/ieee-802-1ax-link-aggregation|link aggregation out of 802.3 and into 802.1]], because a mechanism that authenticates individual physical links must sit below anything that bundles them.

The media coverage grew by amendment, and the sequence is a nice fossil record of the LAN itself. "EAPOL was originally specified for IEEE 802.3 Ethernet, IEEE 802.5 Token Ring, and FDDI" in 802.1X-2001, "but was extended to suit other IEEE 802 LAN technologies such as IEEE 802.11 wireless in 802.1X-2004." The 2001 edition addressed token ring and FDDI, two technologies that were already dying, and did not address wireless, the technology that would make 802.1X ubiquitous. Standards are written against the world their authors can see.

## Three parties, and why the third one exists

"802.1X authentication involves three parties: a supplicant, an authenticator, and an authentication server." The supplicant is the device seeking access, the authenticator is the switch or access point holding the door, and the authentication server holds the credentials and makes the decision.

The separation is the whole point. A switch that stored credentials would need every user's secret on every switch, which is unmanageable and a magnificent target. Instead the authenticator relays: EAP data travels in EAPOL frames between supplicant and authenticator, then gets re-encapsulated between authenticator and server using RADIUS or Diameter. The switch is a pipe with a gate, which is why the [[cs/cisco/tacacs-vs-radius|RADIUS side of the exchange]] matters as much as the LAN side, and why the whole design is a recognizable ancestor of [[cs/security/zero-trust-architecture|zero trust]]: no device is trusted by virtue of where it plugged in.

The distinction between the authenticator's role and the server's is also the cleanest concrete illustration of [[cs/security/authentication-vs-authorization|authentication against authorization]] in a protocol. The server authenticates. The authenticator enforces, and may also receive attributes (a VLAN, an ACL) that express what the authenticated device is allowed to do.

## The controlled and uncontrolled ports

Here is the clause that makes the standard elegant. "802.1X-2001 defines two logical port entities for an authenticated port," the controlled port and the uncontrolled port. The controlled port is switched between authorized and unauthorized states and carries ordinary traffic only in the first. And "The uncontrolled port is used by the 802.1X PAE to transmit and receive EAPOL frames."

One physical port, two logical ones, with a hard rule about what may cross each. Before authentication, "only 802.1X traffic is allowed; other traffic, such as the Internet Protocol (and with that TCP and UDP), is dropped." The unauthenticated device can speak, but only in one protocol, to one entity, for one purpose. That is a minimal-privilege channel expressed in the frame parser rather than in a policy engine, and it is far more robust than filtering by rule, because the attack surface exposed to an unauthenticated device is one EtherType wide.

That EtherType is worth memorizing: "EAPOL operates over the data link layer, and in Ethernet II framing protocol has an EtherType value of 0x888E." And the authenticator "will periodically transmit EAP-Request Identity frames to a special Layer 2 MAC address" reserved on the local segment, so the exchange is addressed to a group address that bridges do not forward. Authentication traffic stays on the link it is authenticating.

The 2004 amendment extended the model in the direction people forget: "802.1X-2004 defines the equivalent port entities for the supplicant; so a supplicant implementing 802.1X-2004 may prevent higher-level protocols from being used if it is not content that authentication has successfully completed." The client gets a controlled port too. A laptop can refuse to send traffic to a network that failed to prove itself, which turns 802.1X from a defense of the network against devices into a mutual arrangement, and matters enormously on wireless where a rogue access point is trivial to stand up.

## The 2010 amendment and what it enabled

The last significant extension links this standard to the one that encrypts the link. "The EAPOL was also modified for use with IEEE 802.1AE" and 802.1AR in 802.1X-2010. That amendment added the key agreement that MACsec needs, so the same exchange that authenticates a device can also establish the keys that protect its frames. Details of that relationship belong to [[cs/standards/ieee-802-1ae-macsec|the MACsec note]].

> [!warning] The standard's authority ends at the port
> 802.1X authorizes a port, not a device or a session. Once the controlled port is authorized, anything reachable through that physical port inherits the authorization, which is why a small unmanaged switch or a hub behind an authenticated port defeats the mechanism entirely unless the authenticator adds per-MAC extensions that the base standard does not specify.

Implementation quality is the usual story. "Windows defaults to not responding to 802.1X authentication requests for 20 minutes after a failed authentication," a behavior chosen by one vendor with no basis in the standard, and one of the more effective ways to make a correctly specified protocol feel broken.

## Related Notes

- [[cs/cisco/tacacs-vs-radius|TACACS+ vs RADIUS]] for the protocol that carries the decision back to the authenticator.
- [[cs/standards/ieee-802-1ae-macsec|IEEE 802.1AE, MACsec]] for the standard that consumes 802.1X key agreement.
- [[cs/standards/ieee-802-1ax-link-aggregation|IEEE 802.1AX, Link Aggregation]] for the layering conflict this standard's position created.
- [[cs/security/zero-trust-architecture|Zero-Trust Architecture]] for the modern generalization of refusing to trust a network position.
- [[cs/security/authentication-vs-authorization|Authentication vs Authorization]] for the split between the server's job and the authenticator's.
- [[cs/cisco/portfast-and-bpdu-guard|PortFast and BPDU Guard]] for the other family of controls applied at the same access port.

## Sources

- [IEEE 802.1X (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.1X) backs the standard's scope, the EAP encapsulation definition, the media coverage in 802.1X-2001 and its extension in 802.1X-2004, the LLC sublayer placement, the three-party model, the controlled and uncontrolled port entities, the unauthorized-state traffic rule, the EAPOL EtherType and the group address used for identity requests, the supplicant-side port entities, the 802.1AE modification in 802.1X-2010, and the Windows retry behavior.
- [Link aggregation (Wikipedia)](https://en.wikipedia.org/wiki/Link_aggregation) backs the finding that 802.1X security sat below link aggregation in the stack.
