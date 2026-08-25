---
title: Unicast, Broadcast, Multicast, Anycast
description: "The four IP delivery modes by who receives the packet: one-to-one, one-to-all, one-to-a-group (with IGMP), and one-to-the-nearest (anycast, the trick behind resilient DNS and CDNs)."
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-06-11
updated:
aliases:
  - IP delivery modes
  - anycast
  - multicast
  - broadcast vs multicast vs anycast
---

Almost everything you do online is one computer talking to one other computer: your laptop to a specific server, its reply back to you. That is one delivery mode out of four, and it is worth knowing the other three because each answers a different question about *who* a packet is for. The destination address stops being "this one machine" and starts meaning "everyone here," or "the members of this group," or "whichever copy is closest." The routing machinery changes underneath each answer.

> [!note] The idea
> IP has four delivery modes distinguished by the sender-to-receiver relationship: unicast is one-to-one, broadcast is one-to-all within a subnet, multicast is one-to-a-subscribed-group, and anycast is one-to-the-nearest-of-many. Anycast is the subtle one: many machines share the same address and the routing system quietly hands each sender to the closest instance, which is why it underpins resilient DNS and CDNs.

## Unicast: one to one

Unicast is a one-to-one transmission from one point in the network to another: one sender and one receiver, each identified by a network address. This is the default and the overwhelming majority of traffic. A TCP connection is unicast on both directions; the packet names exactly one destination and the network's job is to get it there. The other three modes are all departures from this baseline, each relaxing the "exactly one receiver" assumption in a different way. The Broadcasting article frames the split cleanly: unicast is the point-to-point method in which each sender communicates with one receiver, in contrast with all-to-all methods.

## Broadcast: one to all

Broadcast delivers a message to all nodes in the network using a one-to-all association: a single datagram from one sender is routed to all endpoints associated with the broadcast address, and the network replicates the datagram as needed to reach every recipient. The scope is deliberately bounded. A broadcast is limited to a **broadcast domain**, generally an entire subnet, which is exactly the boundary a [[cs/networking/vlans-and-802-1q-trunking|VLAN]] carves and a router refuses to forward across. This is why protocols that must reach everyone locally before addresses are known, like [[cs/networking/arp-and-mac-addressing|ARP]] and DHCP discovery, use broadcast: they have no specific address to aim at yet, so they shout to the whole segment. It is also why large flat networks get expensive, since every broadcast touches every host.

## Multicast: one to a group

Broadcast wastes effort when only some hosts care. Multicast fixes that: it delivers a message to a group of nodes that have expressed interest, using a one-to-many association, where the destination address designates a subset, not necessarily all, of the reachable nodes. The efficiency is in the replication policy. The source sends a packet only once, and the network elements (routers and switches) replicate it only where needed, along the branches of a distribution tree that actually lead to group members, and only to segments that currently contain members. IPTV is the canonical case: one video stream sent once fans out to every subscriber tuned to that channel, instead of a separate copy per viewer.

Membership is dynamic, and the protocol that manages it is the **Internet Group Management Protocol (IGMP)**. Destination nodes send IGMP membership-report and leave-group messages to join and drop a group, the example being a viewer changing TV channels, and IGMP is what controls IP multicast delivery. Multicast scales to a large receiver population precisely because the source needs no prior knowledge of who or how many receivers there are; it just sends to the group address and lets the network sort out replication. The catch is reach: IP multicast is always available within the local subnet, but multicast routing across a wider area must be configured, and much of the Internet does not carry it.

## Anycast: one to the nearest

Anycast is the one that looks like magic until you see the mechanism. It delivers a message to any one out of a group of nodes, typically the one nearest the sender, using a one-to-one-of-many association: many potential receivers are all identified by the same destination address, and the routing algorithm selects the single nearest one by some distance or cost measure. In practice a single IP address is shared by servers in multiple locations, and routers direct packets to the location nearest the sender using their normal decision-making, typically the lowest number of [[cs/networking/routing-and-longest-prefix-match|BGP]] hops.

The sender does nothing special; it sends to one address, and the network's ordinary routing quietly delivers to whichever instance is closest. That property makes anycast the backbone of two systems in this garden. The [[cs/systems/dns-the-domain-name-system|DNS]] root and major name servers use it so a query is answered by a nearby box rather than one distant machine, and many initial anycast deployments were exactly DNS servers over UDP. The same trick steers each user of a [[cs/systems/content-delivery-networks-and-the-centralization-of-control|CDN]] to the nearest edge PoP. Anycast pairs naturally with connectionless protocols; a stateless [[cs/networking/tcp-vs-udp|UDP]] query to whichever instance answers is safe, whereas long-lived stateful connections need care in case routing shifts a flow to a different instance mid-session.

![The four IP delivery modes: unicast reaches one node, broadcast reaches every node in the subnet, multicast reaches only subscribed group members, and anycast reaches the single nearest of several nodes sharing one address](cs/networking/assets/delivery-modes.svg)

> [!example] Same source, four destinations
> A host wants to send a datagram. Under unicast it names one server and reaches exactly that server. Under broadcast it targets the subnet's broadcast address and every host on the segment receives a copy. Under multicast it targets a group address, and only the hosts that joined that group via IGMP get the packet, delivered once and replicated by routers along the way. Under anycast it targets an address advertised from ten cities at once, and BGP delivers it to the single nearest city, the other nine never seeing it.

> [!warning] Anycast is a routing property, not a protocol
> There is no "anycast packet" on the wire that looks different from unicast; most routers cannot tell them apart. Anycast is created by advertising the same address from multiple locations and letting normal routing pick the nearest. The delivery mode lives in how the address is announced, not in the datagram, which is why it degrades gracefully to plain unicast routing where anycast-aware handling is absent.

## Related Notes

- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the address ranges reserved for broadcast and multicast
- [[cs/networking/arp-and-mac-addressing|ARP and MAC Addressing]] - a canonical broadcast protocol, and Ethernet's own multicast bit
- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] - the broadcast domain that bounds a broadcast
- [[cs/systems/dns-the-domain-name-system|DNS]] - the system anycast makes resilient and fast
- [[cs/systems/content-delivery-networks-and-the-centralization-of-control|Content Delivery Networks]] - anycast steering users to the nearest edge
- [[cs/networking/routing-and-longest-prefix-match|Routing and Longest Prefix Match]] - the BGP hop-count decision anycast rides on

## Sources

- "Broadcasting (networking)," Wikipedia. https://en.wikipedia.org/wiki/Broadcasting_%28networking%29 . Backs the four-way split: broadcast as one-to-all delivering a single datagram to all endpoints of the broadcast address with the network replicating as needed (scope generally a subnet); multicast as one-to-many-of-many to a subset of nodes; anycast as one-to-one-of-many routed to the nearest member sharing one destination address; and unicast/point-to-point as one sender to one receiver.
- "Multicast," Wikipedia. https://en.wikipedia.org/wiki/Multicast . Backs multicast as group communication where the source sends a packet only once and the network replicates it only where needed, IGMP membership-report and leave-group messages controlling IP multicast delivery (the IPTV channel-change example), and IP multicast being available within the local subnet while wider-area multicast routing must be configured and is often unsupported.
- "Anycast," Wikipedia. https://en.wikipedia.org/wiki/Anycast . Backs anycast being a single IP address shared by devices in multiple locations with routers directing packets to the nearest by lowest BGP hop count, and its wide use by CDNs and name servers, with early deployments being DNS servers over UDP.
