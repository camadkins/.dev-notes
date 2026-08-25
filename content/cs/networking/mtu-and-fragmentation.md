---
title: MTU and Fragmentation
description: Why every link caps packet size, how IP splits an oversized packet to cross a narrow link, and why the modern internet works hard to never fragment at all.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-02-23
updated:
aliases: []
---

Every physical link has a ceiling on how big a chunk it will carry in one go. [[cs/standards/ieee-802-3-ethernet|Ethernet]] will not move a frame larger than a fixed size; a slower serial link caps it lower. An IP packet, meanwhile, can be far larger than any single link along its path. When an oversized packet meets a link too narrow to carry it, something has to give: either the packet is cut into pieces that fit, or it is dropped and the sender is told to send smaller. Both answers exist, and which one the internet prefers has shifted decisively over the decades.

> [!note] The idea
> The maximum transmission unit is the largest packet a link will carry in one transaction. IP can fragment an oversized packet into pieces that fit and have the destination reassemble them, but fragmentation is fragile, so modern hosts instead discover the smallest MTU along the whole path in advance and never send anything bigger.

## MTU: the size ceiling of a link

The maximum transmission unit (MTU) is the size of the largest [[cs/systems/network-protocols|protocol data unit]] that can be communicated in a single network-layer transaction. It is set by the underlying link. Ethernet is the canonical example: its maximum frame size is 1518 bytes, of which 18 bytes are header and frame-check overhead, leaving an MTU of 1500 bytes for the IP packet inside. That 1500 is the number most of the internet is quietly built around.

MTU is a genuine tradeoff, not a value to maximize blindly. A larger MTU brings greater efficiency, because each packet carries more user data while the fixed per-packet overhead stays constant, which lifts bulk throughput and means fewer packets to process for the same data. A smaller MTU can reduce network delay. The link, the medium, and sometimes a negotiation at connect time decide where the ceiling sits.

## IP fragmentation: cutting a packet to fit

When a packet larger than a link's MTU has to cross it, IP fragmentation breaks the packet into smaller pieces so the resulting fragments can pass through a link with a smaller MTU than the original packet, and the fragments are reassembled by the receiving host. RFC 791 describes the procedure. The IP header carries the machinery: an Identification field to group fragments of the same original packet, a Fragment Offset field to place each piece, and the Don't Fragment and More Fragments flags. Reassembly happens at the destination, not at the routers in between, so a packet fragmented early on is not stitched back together until it arrives.

## Path MTU Discovery: avoiding fragmentation entirely

Rather than let routers fragment packets in flight, hosts prefer to find the tightest bottleneck ahead of time and never exceed it. Path MTU Discovery (PMTUD) is a standardized technique for determining the MTU on the network path between two IP hosts, usually with the goal of avoiding IP fragmentation.

In IPv4 it works by a controlled probe. The sender sets the Don't Fragment (DF) flag on outgoing packets. Any device along the path whose MTU is smaller than the packet drops it and sends back an ICMP "Fragmentation Needed" message (Type 3, Code 4) containing its own MTU, letting the source lower its estimate. The process repeats until the packet is small enough to cross the whole path without fragmenting. IPv6 removes in-network fragmentation entirely: routers do not fragment, there is no DF option in the header, and a router with too small an MTU returns an ICMPv6 "Packet Too Big" (Type 2) message instead. IPv6 hosts are required to determine the optimal MTU through Path MTU Discovery before sending.

> [!warning] Why fragmentation is avoided
> Fragmentation multiplies the cost of loss. IP fragmentation can cause excessive retransmissions when fragments encounter packet loss, because a reliable protocol such as TCP must retransmit all of the fragments to recover from the loss of a single one. Losing one small fragment forces the whole original packet to be resent. Fragments also stress the reassembly buffers at the receiver and have been a source of security problems. Discovering the path MTU up front sidesteps all of it.

## Related Notes

- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the IP layer whose packets get fragmented
- [[cs/networking/ipv6-essentials|IPv6 Essentials]] - why IPv6 pushed fragmentation off routers and onto hosts
- [[cs/networking/tcp-congestion-control|TCP Congestion Control]] - why one lost fragment is expensive for a reliable stream
- [[cs/networking/osi-and-tcp-ip-models|OSI and TCP/IP Models]] - MTU lives at the boundary of the link and internet layers

## Sources

- "Maximum transmission unit," Wikipedia. https://en.wikipedia.org/wiki/Maximum_transmission_unit . Supports MTU as the largest PDU communicable in a single network-layer transaction, Ethernet's 1518-byte max frame with 18 bytes overhead yielding a 1500-byte MTU, and the efficiency/delay tradeoff of larger versus smaller MTU.
- "IP fragmentation," Wikipedia. https://en.wikipedia.org/wiki/IP_fragmentation . Supports fragmentation breaking a packet into smaller pieces to cross a link with a smaller MTU and reassembly by the receiving host, RFC 791 describing the procedure with the Identification, Fragment Offset, DF, and MF header fields, and fragmentation causing excessive retransmissions because TCP must resend all fragments to recover from the loss of a single fragment.
- "Path MTU Discovery," Wikipedia. https://en.wikipedia.org/wiki/Path_MTU_Discovery . Supports PMTUD as a technique to determine the path MTU between two IP hosts to avoid fragmentation, the IPv4 DF-flag probe returning ICMP Fragmentation Needed (Type 3, Code 4), and IPv6 routers not fragmenting, returning ICMPv6 Packet Too Big (Type 2), with IPv6 hosts required to use PMTUD before sending.
