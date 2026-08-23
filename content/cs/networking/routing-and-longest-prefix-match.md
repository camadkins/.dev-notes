---
title: Routing and Longest Prefix Match
description: How a router turns a destination address into a next hop by consulting its routing table, matching the most specific prefix, and ranking sources by administrative distance.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-04-18
updated:
aliases:
  - longest prefix match
  - routing table
  - administrative distance
---

A packet arrives at a router carrying nothing but a destination address. The router has to answer one question fast, millions of times a second: out which interface, toward which neighbor, does this packet go next? It does not know the whole path to the destination and does not need to. It only needs the next hop. Everything about routing is machinery for answering that single question from a table of possibilities where several answers can all be correct at once.

> [!note] The idea
> A router forwards by looking up the destination address in its routing table and choosing the entry whose network prefix matches the most leading bits of the address. When one destination matches several entries, the most specific one wins, and when two protocols disagree about a route, administrative distance breaks the tie before the table is ever consulted.

## The routing table

The routing table, also called the routing information base (RIB), is a data table stored in a router or a network host that lists the routes to particular network destinations, and in some cases the metrics associated with those routes. Each entry pairs a destination network, written as a [[ip-addressing-and-subnetting|CIDR prefix]], with the next hop and outgoing interface that move a packet toward it. The router does not store a route to every individual host on the internet; it stores routes to networks, and lets the prefix stand in for all the hosts inside.

Where do the entries come from? Some are static, fixed by an administrator. Most are learned. The construction of routing tables is the primary goal of routing protocols like OSPF and [[bgp-and-internet-routing-as-control|BGP]], which flood or advertise reachability so each router can build a local picture of the topology around it. The table is the distilled result: a map compact enough to consult on every packet.

## Longest prefix match

Because entries name networks rather than hosts, a single destination address can fall inside more than one entry at once. A router holding both `192.168.0.0/16` and `192.168.20.16/28` matches the address `192.168.20.19` against both: the address lives inside each network. Something has to decide which entry to use.

The rule is longest prefix match, an algorithm used by routers in IP networking to select an entry from a routing table. The most specific of the matching entries, the one with the longest subnet mask, wins. It carries this name because it is also the entry where [[cs/dsa/compressed-trie|the largest number of leading address bits]] of the destination match the bits in the table entry. Between the `/16` and the `/28`, the `/28` matches 28 leading bits versus 16, so it is more specific and it is chosen. Specificity is treated as intent: a longer prefix is a more deliberate statement about where that exact block of addresses should go.

At the bottom of the table sits the default route, which has the shortest possible prefix match, a catch-all to fall back on when every other entry fails to match. It is the `/0` that matches everything and loses to any real route, which is exactly why it works as a last resort.

> [!example] Two matches, one winner
> Destination `192.168.20.19` is looked up. Entry `192.168.0.0/16` matches (first 16 bits agree). Entry `192.168.20.16/28` also matches (first 28 bits agree). Longest prefix match picks the `/28`, because 28 matched bits beat 16. Had neither matched, the packet would ride the default route out.

## Administrative distance

Longest prefix match settles competition inside one table, but a router often runs several routing protocols at once, and two of them can each offer a route to the same network. Installing both risks routing loops, so the router must pick one before the route ever enters the table. That is the job of administrative distance.

Administrative distance is a number of arbitrary units assigned to dynamic routes, static routes, and directly connected routes, used to rank routes from most preferred (low value) to least preferred (high value). When multiple paths to the same destination are available, the router keeps the one with the lowest administrative distance. The values are per-protocol and set by the vendor: [[cs/cisco/static-routing-and-administrative-distance|on Cisco routers]], OSPF has a default administrative distance of 110 and RIP has 120, so an OSPF-learned route displaces a RIP-learned one to the same destination. Administrative distance is trust, encoded as a number; longest prefix match is specificity. The first decides which protocol's route gets installed, the second decides which installed route forwards the packet.

## Related Notes

- [[ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the CIDR prefixes that routing tables match against
- [[bgp-and-internet-routing-as-control|BGP and Internet Routing]] - the protocol that fills tables with interdomain routes
- [[network-protocols|Network Protocols]] - where routing sits among the layered protocols
- [[osi-and-tcp-ip-models|OSI and TCP/IP Models]] - routing is the internet layer's core task

## Sources

- "Routing table," Wikipedia. https://en.wikipedia.org/wiki/Routing_table . Supports the routing table (RIB) as a data table stored in a router or host listing routes to network destinations with optional metrics, and the construction of routing tables being the primary goal of routing protocols.
- "Longest prefix match," Wikipedia. https://en.wikipedia.org/wiki/Longest_prefix_match . Supports LPM as an algorithm routers use to select a routing-table entry, the most specific entry (longest subnet mask / most matching leading bits) winning, the 192.168.0.0/16 vs 192.168.20.16/28 example resolving to the /28, and the default route having the shortest possible prefix as a fallback.
- "Administrative distance," Wikipedia. https://en.wikipedia.org/wiki/Administrative_distance . Supports AD as an arbitrary-unit value ranking routes from most preferred (low) to least preferred (high), the router keeping the lowest-AD route when multiple paths exist, and OSPF defaulting to 110 versus RIP's 120 on Cisco routers.
