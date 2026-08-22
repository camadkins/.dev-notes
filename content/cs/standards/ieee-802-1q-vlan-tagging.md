---
title: "IEEE 802.1Q: VLAN Tagging as Specified"
description: "The document behind the four-byte tag: what PCP and DEI actually say, the reserved VID values you must never transmit, the padding clause nobody reads, and the revision in which 802.1Q swallowed the bridging standard whole."
draft: false
comments: true
tags:
  - cs
  - standards
  - networking
date: 2026-06-27
updated:
aliases:
  - 802.1Q
  - Dot1q Standard
  - QinQ
---

Most people meet 802.1Q as a four-byte tag and stop there. The document is considerably stranger than that. It is now the bridging standard for the whole family, having absorbed the standard that used to hold that title, and the tag itself is the smallest thing in it. How the tagged frame behaves on a switch belongs to [[cs/networking/vlans-and-802-1q-trunking|the VLAN note]]; this is about what the specification says and which of its clauses bite.

> [!note] The idea
> 802.1Q is not a tagging standard that grew, it is **the bridging standard that a tagging amendment took over**. The 2014 revision absorbed 802.1D, so the document that defines VLAN tags now also defines bridging and spanning tree, and the tag's smaller fields carry semantics (priority, drop eligibility, reserved identifiers) that are separately specified and routinely ignored.

## Scope, which is wider than the name suggests

The standard "supports virtual local area networking (VLANs) on an IEEE 802.3 Ethernet network" and defines both the tag format and "the accompanying procedures to be used by bridges and switches in handling such frames." Then it keeps going: "The standard also contains provisions for a quality-of-service prioritization scheme commonly known as IEEE 802.1p and defines the Generic Attribute Registration Protocol."

There is no separate 802.1p document to buy. 802.1p was an amendment whose content lives inside 802.1Q, which is why every vendor manual talks about 802.1p priority while pointing you at 802.1Q for the specification.

The consolidation went much further in 2014. "The 802.1Q-2014 revision incorporated the IEEE 802.1D-2004 standard, which originally defined bridging and Spanning Tree Protocol." A revision of the VLAN standard ate the bridging standard. If you want the current normative text for how a bridge learns addresses and how spanning tree elects a root, you open 802.1Q, not 802.1D. Multiple Spanning Tree arrived the same way: "The 2003 revision of the standard was the first to include the Multiple Spanning Tree Protocol (MSTP), which was originally defined in IEEE 802.1s."

## The tag, field by field

"802.1Q adds a 32-bit field between the source MAC address and the EtherType fields of the original frame," split into a 16-bit tag protocol identifier of 0x8100 and 16 bits of tag control information. The TCI is where the specification gets particular.

**PCP** is "A 3-bit field which refers to the IEEE 802.1p class of service (CoS) and maps to the frame priority level." Three bits, eight priorities, and the standard specifies the field rather than a scheduling policy. What a bridge does with priority 5 against priority 1 is a matter for the queueing model, which is why [[cs/networking/qos-and-traffic-shaping|QoS behavior is configured rather than implied]]. The tag carries a marking, not a guarantee.

**DEI** is one bit, and it used to be called something else. It is the "Drop eligible indicator... (formerly CFI)," and it "May be used separately or in conjunction with PCP to indicate frames eligible to be dropped in the presence of congestion." The rename matters historically: the canonical format indicator existed to flag token-ring bit ordering, and when that concern died the bit was repurposed for congestion policy. One bit of a live wire format was reassigned between revisions, which is only survivable because the old meaning had gone extinct.

**VID** is twelve bits, and the reserved values are more interesting than the range. "The reserved value 0x000 indicates that the frame does not carry a VLAN ID; in this case, the 802.1Q tag specifies only a priority" and is called a priority tag. That is a tagged frame with no VLAN, used purely to carry PCP, and code that assumes a tag implies a VLAN gets it wrong. At the other end, "The VID value 0xFFF is reserved for implementation use; it must not be configured or transmitted." A shall-not on the wire, reserved for management and wildcard matching inside the bridge.

## The native VLAN, as the standard puts it

The standard's own framing is a default rather than a feature: "A frame in the VLAN-aware portion of the network that does not contain a VLAN tag is assumed to be flowing on the native VLAN," and the invariant it protects is that "Each frame must be distinguishable as being within exactly one VLAN."

Read those two sentences together and the native VLAN stops looking like a convenience and starts looking like the mechanism that keeps the invariant total. Every frame must belong to exactly one VLAN, so an untagged frame arriving in a VLAN-aware region needs an answer, and the native VLAN is that answer. The security consequence is that the assignment is made by configuration on each port rather than by anything in the frame, so two ends of a link can disagree about which VLAN untagged traffic belongs to. That disagreement is the substrate for [[cs/security/arp-spoofing-and-lan-attacks|VLAN hopping and the other LAN-layer attacks]], and it comes directly from a default that the specification had to provide.

## Two clauses with consequences

**Frame size and the FCS.** "Because inserting the VLAN tag changes the frame, 802.1Q encapsulation forces a recalculation of the original frame check sequence field in the Ethernet trailer." A bridge that tags cannot pass the trailer through untouched, so tagging is a rewrite rather than an encapsulation. And the size limit had to be legislated elsewhere: "The IEEE 802.3ac standard increased the maximum Ethernet frame size from 1518 bytes to 1522 bytes to accommodate the four-byte VLAN tag," with the durable operational artifact that "Some network devices that do not support the larger frame size will process these frames successfully but may report them as baby giant anomalies."

**The padding clause.** This one is almost never read and is a small masterpiece of specification. "The minimum frame size remains 64 bytes, but a bridge may extend the minimum frame size from 64 to 68 bytes on transmission. This allows a tag to be popped without needing additional padding."

Work it through. A 64-byte tagged frame that has its tag removed becomes 60 bytes, which is below the Ethernet minimum, so the bridge that pops the tag would have to re-pad it and recompute the checksum. Transmitting 68 bytes instead means the frame survives tag removal without any of that. This is a specification anticipating an operation two hops downstream and spending four bytes to keep it cheap. It is also a *may*, so it is exactly the sort of clause that produces subtle behavior differences between conforming implementations.

## Double tagging

Stacking tags was a separate project. "IEEE 802.1ad is an amendment to the IEEE 802.1Q-1998 networking standard which adds support for provider bridges," known informally as QinQ, and "It was incorporated into the base 802.1Q standard in 2011."

The key specified detail is that the outer tag is not simply another 0x8100 tag: "In such cases, 802.1ad specifies a TPID of 0x88a8 for service-provider outer S-TAG." A distinct EtherType for the service tag is what lets a bridge tell whose tag it is looking at, so a provider can carry a customer's already-tagged traffic without the two VLAN spaces colliding. Where an implementation accepts 0x8100 as an outer tag anyway, the ambiguity is what makes double-tagging attacks possible.

One more amendment worth knowing by name: "MVRP replaced the slower GARP VLAN Registration Protocol (GVRP) in 2007 with the IEEE 802.1ak-2007 amendment." Configuration protocols inside the standard get replaced too.

## Related Notes

- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] for how tagged frames actually move through a switched network.
- [[cs/standards/ieee-802-3-ethernet|IEEE 802.3, Ethernet as a Document]] for the amendment that made room for the tag.
- [[cs/standards/ieee-802-1d-and-spanning-tree|IEEE 802.1D and Spanning Tree]] for the standard 802.1Q absorbed in 2014.
- [[cs/security/arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] for what the native VLAN default and tag ambiguity enable.
- [[cs/networking/qos-and-traffic-shaping|QoS and Traffic Shaping]] for the scheduling that PCP marks but does not specify.
- [[cs/cisco/trunking-and-802-1q|Trunking and 802.1Q]] for the configuration surface a vendor puts over these clauses.

## Sources

- [IEEE 802.1Q (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.1Q) backs the standard's scope, the 802.1p and GARP provisions, the 2014 incorporation of 802.1D, the MSTP history, the tag field layout, PCP and DEI semantics, the reserved VID values, the minimum-frame-size clause, the FCS recalculation, the baby-giant behavior, the 802.1ad S-TAG TPID, and the MVRP replacement of GVRP.
- [IEEE 802.1ad (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.1ad) backs 802.1ad as a provider-bridge amendment to 802.1Q-1998 and its incorporation into the base standard in 2011.
