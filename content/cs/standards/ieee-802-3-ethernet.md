---
title: "IEEE 802.3: Ethernet as a Document"
description: "The base standard still calls itself a CSMA/CD access method although almost nothing in the field uses it, absorbs every new speed as a lettered amendment, and once had to be amended before a VLAN tag could legally fit in a frame."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-08-11
updated:
aliases:
  - 802.3
  - Standard for Ethernet
---

The document has a strange property: its own title used to name a technology that most conforming equipment does not implement. The IEEE standard for Ethernet is built around carrier-sense multiple access with collision detection, and on a modern switched full-duplex link there is no carrier sense, no collision, and no detection. The mechanism survives in the text because the text is a contract with forty years of continuity obligations, not a description of current practice.

> [!note] The idea
> 802.3 is a **base document plus an unbroken chain of lettered amendments**, and its growth pattern is the interesting part. New speeds arrive as amendments that add a physical layer and leave the MAC alone; that stability of the MAC is exactly why a 1980s frame format still runs at 400 Gbit/s. When something does force a MAC change, as VLAN tagging did, it is visible as a discrete amendment with a date on it.

## What the base document covers

The scope is layers one and two only. "IEEE 802.3 is a working group and a collection of standards defining the physical layer and data link layer" media access control of wired Ethernet, and it sits under the family's architecture layer: "802.3 standards support the IEEE 802.1 network architecture." Bridging, VLANs and security are not in here. They are in 802.1, and 802.3 is the medium underneath them.

The access method is named in the document itself: "802.3 also defines a LAN medium access control method using carrier-sense multiple access with collision detection (CSMA/CD)." That definition dates from a shared coaxial cable where every station heard every transmission and had to back off after a collision. The mechanism was made irrelevant by a single amendment, discussed below, and yet it remains normative because half-duplex shared-medium operation is still specified and some deployments still use it. A standard rarely deletes anything. It marks it obsolete and carries it.

There is also an international identity. "The international standard IEEE/ISO/IEC 8802-3-2021 was adopted from 802.3-2018," which is how an IEEE document becomes citable in jurisdictions and contracts that recognize ISO and IEC rather than IEEE.

Even the title has been negotiated. The document was originally named for the access method rather than for Ethernet, and it kept that convention until 2012, "because of sensitivities around using a commercial product as the basis for a standard." The name Ethernet came from a company, and the committee spent thirty years not saying it.

## How the speeds got absorbed

Read the amendment list as a growth log and the pattern is unmistakable. 802.3i added 10BASE-T over twisted pair in 1990. 802.3u added Fast Ethernet in 1995. 802.3z added 1000BASE-X over fiber in 1998 and 802.3ab added 1000BASE-T over copper in 1999. 802.3ae added 10 Gigabit over fiber in 2002. The current working group is still doing it: its active projects include the "IEEE P802.3dj 200 Gb/s, 400 Gb/s, 800 Gb/s, and 1.6 Tb/s Ethernet Task Force."

Each of those amendments adds a physical layer and leaves the frame alone. Same addressing, same framing, same maximum payload, four orders of magnitude of speed. That deliberate stability is what makes a bridge able to forward between a 10 Mbit/s port and a 400 Gbit/s port without touching the frame, and it is the single most valuable property the standard has.

Periodically the accumulated amendments are rolled up. 802.3-1998 was "A revision of the base standard incorporating earlier amendments and errata," and the same has happened for 2002, 2005, 2008, 2012, 2015, 2018 and 2022, each absorbing the letters issued since the last one. The maintenance work is continuous and has its own task force: "IEEE P802.3 (IEEE 802.3du) Revision to IEEE Std 802.3-2022 Maintenance #18 Task Force." Eighteen maintenance cycles on one standard.

The working group's own self-description is unglamorous and accurate: "The IEEE 802.3 Working Group develops standards for Ethernet networks." Underneath that sentence are task forces, study groups and ad hocs, which is the internal structure every large 802 working group grows to run several amendments in parallel.

## One clause with real consequence

802.3ac, approved 1998-09, is a single-purpose amendment with an outsized footprint: "Max frame size extended to 1522 bytes to allow inclusion of a Q-tag." And "The Q-tag includes 802.1Q VLAN information and 802.1p priority information."

Sit with what that means procedurally. 802.1 designed VLAN tagging, but 802.1 does not own the Ethernet frame. The tag is four bytes inserted into the frame, which pushed the maximum frame past the 1518-byte limit that 802.3 had made normative. So VLANs could not legally exist until 802.3 was amended to permit the longer frame, and a separate working group had to run a separate project to make room. Two committees, one field.

The engineering consequence outlived the paperwork. Any device on the path that enforced the old 1518-byte limit would drop tagged frames as oversized, which is the origin of the baby-giant frame problem that plagued early VLAN deployments across third-party equipment. The size accounting also propagates upward, because a tag consumes bytes that the payload can no longer use, which is where this connects to [[cs/networking/mtu-and-fragmentation|the MTU arithmetic that decides whether a packet survives a path]]. The behavior of the tag itself belongs to [[cs/networking/vlans-and-802-1q-trunking|the VLAN note]]; what 802.3ac contributes is the fact that the room for it had to be legislated.

## The amendment that retired the access method

The other consequential clause is 802.3x, approved 1997-03: "Full duplex and flow control; also incorporates DIX framing, so there is no longer a DIX/802.3 split."

Two things in one line. Full duplex means a station transmits and receives simultaneously on a dedicated link, which makes collisions impossible and CSMA/CD unnecessary. The access method that the standard was named after became optional in practice within a few years, without ever being removed from the document. And the second clause finally closed the fork between DIX framing and 802.3 framing that had existed since 1980, folding the commercial specification into the standard that had been written to replace it.

802.3x also brought PAUSE, a link-level flow control frame that lets a receiver tell a sender to stop. That mechanism has a long tail of operational trouble in converged networks, where pausing one link stalls unrelated traffic, and it is a good example of a standardized feature that is correct as specified and dangerous as deployed.

> [!warning] Watch what leaves the document
> 802.3ad, approved 2000-03, specified "Link aggregation for parallel links, since moved to IEEE 802.1AX." Everyone still calls it 802.3ad. The clause has not been in 802.3 for over a decade, which makes vendor documentation citing 802.3ad a reliable indicator of copy-and-paste rather than a reading of the current standard.

## Related Notes

- [[cs/standards/ieee-802-1q-vlan-tagging|IEEE 802.1Q, VLAN Tagging]] for the tag that 802.3ac had to make room for.
- [[cs/standards/ieee-802-1ax-link-aggregation|IEEE 802.1AX, Link Aggregation]] for the clause that left 802.3 and where it went.
- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] for the maintenance cycle that keeps absorbing these letters.
- [[cs/networking/mtu-and-fragmentation|MTU and Fragmentation]] for what the four extra bytes cost on a path.
- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] for how the tagged frame actually behaves on a switch.
- [[cs/military-computing/alohanet-random-access|ALOHAnet and Random Access]] for the ancestor of the access method the standard is still named after.

## Sources

- [IEEE 802.3 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.3) backs the scope of the standard, the CSMA/CD access method, the 802.1 architecture relationship, the ISO adoption as 8802-3-2021, the 2012 renaming and its reason, the amendment list including 802.3x, 802.3ac and 802.3ad, and the rollup revisions.
- [IEEE 802.3 Ethernet Working Group](https://www.ieee802.org/3/) backs the working group's remit and its current task forces, including the multi-terabit project and the maintenance revision task force.
