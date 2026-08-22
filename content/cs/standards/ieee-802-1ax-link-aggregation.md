---
title: "IEEE 802.1AX: Link Aggregation"
description: "Everyone calls it 802.3ad and has been wrong since 2008: the clause moved working groups because a security standard sat underneath it in the stack, and what conformance actually requires is much less than what vendors demand."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-08-15
updated:
aliases:
  - 802.1AX
  - LACP Standard
  - 802.3ad
---

Link aggregation is the rare case where you can watch a standards body discover that it filed something in the wrong place, and then move it. The protocol did not change. Its layer in the reference model did not change. What changed was which working group owned it, and the reason was that another standard turned out to sit underneath it.

> [!note] The idea
> Link aggregation moved from 802.3 to 802.1 because **the architecture said it had to**. A sublayer defined in 802.3 had 802.1 layers positioned below it, which inverts the family's layering, and the fix was a formal transfer of the protocol between working groups. The specification's conformance requirements are also far weaker than deployment practice suggests: two links, full duplex, same speed, and that is the standard's demand.

## Where it started

Aggregation was originally Ethernet's own business. Most gigabit channel-bonding used the IEEE mechanism "which was formerly clause 43 of the IEEE 802.3 standard added in March 2000 by the IEEE 802.3ad task force." A single clause inside the Ethernet standard.

Adoption was immediate, which matters for why the name stuck: "Nearly every network equipment manufacturer quickly adopted this joint standard over their proprietary standards." Before 802.3ad, every vendor had its own bonding scheme, and interoperable aggregation between two vendors' switches was not available. That is the ordinary payoff of a standard, arriving quickly because everyone had already built the feature and only needed to agree on the negotiation.

## The layering problem that moved it

Six years later the maintenance process turned up something awkward. "The 802.3 maintenance task force report for the 9th revision project in November 2006 noted that certain 802.1 layers (such as 802.1X security) were positioned in the protocol stack below link aggregation which was defined as an 802.3 sublayer."

That is an architectural inversion. [[cs/standards/ieee-802-1x-port-based-access-control|802.1X authenticates a physical port]] before it is allowed to carry data, so it necessarily operates on each individual link. Aggregation combines several such links into one logical link, so it necessarily operates above them. But aggregation was specified in 802.3 as a MAC sublayer, and 802.1X was specified in 802.1 as a higher-layer function. The document structure said one thing and the stack said the other.

The resolution was procedural rather than technical. The PAR for the transfer records the conclusion directly: "It has been concluded between 802.1 and 802.3 that future development of Link Aggregation would be more appropriate as an 802.1 standard." A task force was formed, "resulting in the formal transfer of the protocol to the 802.1 group with the publication of IEEE 802.1AX-2008 on 3 November 2008." The Ethernet standard's own amendment list records the departure in one line: 802.3ad specified "Link aggregation for parallel links, since moved to IEEE 802.1AX."

The document has kept moving since. "As of February 2025 the current revision of the standard is 802.1AX-2020." The vocabulary of the field did not follow. Vendor documentation, Linux bonding modes and configuration guides still say 802.3ad, which is why "Implementation may follow vendor-independent standards such as Link Aggregation Control Protocol (LACP) for Ethernet, defined in IEEE 802.1AX or the previous IEEE 802.3ad" is the careful way to phrase it.

## LACP as specified

The control protocol is deliberately small. "LACP works by sending frames (LACPDUs) down all links that have the protocol enabled," and a peer running LACP replies on the same links, so the two ends discover independently that several links connect the same pair of devices and may be combined.

The two configured modes are an asymmetry with real consequences. "In active mode, LACPDUs are sent 1 per second along the configured links," while "In passive mode, LACPDUs are not sent until one is received from the other side, a speak-when-spoken-to protocol." Passive on both ends means silence forever and no bundle, which is the single most common LACP misconfiguration and follows directly from the specified behavior rather than from any implementation bug.

The one-per-second cadence also sets the detection floor. LACP notices a dead peer on a timer, so aggregation is not a fast-failover mechanism on its own; it is a bandwidth and redundancy mechanism whose failure detection runs at protocol speed.

## What conformance actually requires

Deployment practice is much stricter than the standard. In most implementations every port in a bundle is the same physical media type, "However, all the IEEE standard requires is that each link be full duplex and all of them have an identical speed (10, 100, 1,000 or 10,000 Mbit/s)."

Full duplex is not an arbitrary restriction. A half-duplex link runs the collision-detection access method, whose timing assumptions are per-link, and aggregating such links would make the shared medium's arbitration incoherent. Identical speed follows from the distribution requirement: an aggregator that must not reorder a conversation cannot sensibly spread one conversation across links of different rates.

Everything beyond those two conditions (matching media, matching duplex settings on both ends, matching VLAN configuration, matching MTU) is implementation policy, not the standard. Recognizing that boundary is what lets you tell a vendor's requirement from the specification's, and the answer to "why will these two ports not bundle" is usually the vendor's list rather than the IEEE's.

## The clause that governs distribution

The interesting normative constraint is negative. Aggregation must not reorder a conversation. "When balancing traffic, network administrators often wish to avoid reordering Ethernet frames," because TCP treats out-of-order delivery as a signal and pays for it, and "This goal is approximated by sending all frames associated with a particular session across the same link."

Two consequences fall out immediately. A single conversation never goes faster than one member link, so a two-port bundle does not double the throughput of one file transfer. And the distribution function is a hash over flow identifiers, which means load is balanced across flows rather than across bytes, and a few elephant flows can leave one member saturated while another idles. The same reasoning governs [[cs/networking/load-balancing-l4-and-l7|flow affinity in an L4 load balancer]], and the cost of getting it wrong is visible in [[cs/networking/tcp-congestion-control|how TCP interprets out-of-order arrival]].

The standard specifies the requirement (frames of a conversation are not reordered) and leaves the hash to the implementation. That is a textbook case of specifying an observable property rather than a mechanism, and it is why load-balancing behavior differs between vendors while all of them conform.

> [!warning] Static bundles are not conforming aggregation
> "Some switches do not implement the 802.1AX standard but support static configuration of link aggregation." Two statically configured switches will bundle, and a static switch facing an LACP peer will not. There is no negotiation to fail, so the symptom is a link that comes up and forwards into a black hole rather than an error message.

## Related Notes

- [[cs/cisco/etherchannel-and-lacp|EtherChannel and LACP]] for the configuration surface and what breaks in practice.
- [[cs/standards/ieee-802-1x-port-based-access-control|IEEE 802.1X, Port-Based Access Control]] for the standard whose position in the stack forced the transfer.
- [[cs/standards/ieee-802-3-ethernet|IEEE 802.3, Ethernet as a Document]] for the clause that left and the amendment list that records it.
- [[cs/networking/load-balancing-l4-and-l7|Load Balancing, L4 and L7]] for the same flow-affinity hash one layer up.
- [[cs/networking/tcp-congestion-control|TCP Congestion Control]] for why reordering is expensive enough to constrain the standard.
- [[cs/standards/ieee-802-the-family-and-its-split|IEEE 802: The Family and Its Split]] for why 802.1 gets to arbitrate this kind of question.

## Sources

- [Link aggregation (Wikipedia)](https://en.wikipedia.org/wiki/Link_aggregation) backs the clause 43 origin in March 2000, rapid vendor adoption, the 2006 layering finding involving 802.1X, the PAR conclusion transferring the work to 802.1, the publication of 802.1AX-2008 and the current 802.1AX-2020 revision, LACPDU behavior in active and passive modes, the full-duplex and identical-speed conformance requirement, the no-reordering goal and per-session distribution, and the static-configuration mismatch.
- [IEEE 802.3 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.3) backs the 802.3ad amendment entry recording that link aggregation moved to IEEE 802.1AX.
