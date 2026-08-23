---
title: ARP and MAC Addressing
description: Why a switched LAN delivers to hardware addresses, how ARP resolves an IP to a MAC, the cache that makes it cheap, and what a gratuitous ARP announces.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-04-15
updated:
aliases:
  - ARP
  - MAC address
  - address resolution protocol
---

An IP address tells the internet where to route a packet across networks. It says nothing about how to hand that packet to the actual network card sitting three feet away on the same wire. Inside one local segment, [[cs/standards/ieee-802-3-ethernet|Ethernet]] does not deliver to IP addresses at all; it delivers to hardware addresses burned into each interface. Something has to bridge the address the network layer knows and the address the link layer uses, and on every LAN that something is ARP.

> [!note] The idea
> Ethernet frames are delivered to layer-2 hardware (MAC) addresses, not [[ip-addressing-and-subnetting|IP addresses]]. Before a host can send an IP packet to another host on the same segment, it uses the Address Resolution Protocol to discover which MAC address owns the target IP. It caches the answer so it does not have to ask again.

## Two addresses, two layers

Every network interface has a MAC address: a 48-bit hardware identifier used to deliver frames on the local link. When a host wants to transmit an IP packet to a target on the same Ethernet segment, a 48-bit Ethernet address must be generated for the frame, because IP addresses and Ethernet addresses are not compatible, being different lengths and values. The [[osi-and-tcp-ip-models|link layer]] moves frames between MAC addresses on one physical segment; the internet layer moves packets between IP addresses across segments. ARP is the translation table between them.

The Address Resolution Protocol is a communication protocol for discovering the link-layer address, such as a MAC address, associated with an internet-layer address, typically an IPv4 address. It was defined in 1982 as part of the [[cs/military-computing/dod-model-and-tcp-ip-standardization|internet protocol suite]], and it operates only within a single broadcast domain. ARP does not cross routers; each hop resolves the next hop's MAC on its own segment.

## The resolution exchange

ARP is a request-response protocol with a deliberately simple shape. To learn the MAC behind an IP, the host broadcasts a request containing the target node's IP address, and the node with that IP address replies with its MAC address. The request goes to everyone on the segment because the sender does not yet know who to ask; only the owner of that IP answers, and it answers with a unicast reply carrying its hardware address.

That is the entire mechanism: one broadcast question, one unicast answer, and the sender now has the MAC it needs to build the frame. In IPv6 this job moves to the Neighbor Discovery Protocol, but the pattern is the same.

## The cache

Broadcasting for every single packet would flood the segment, so ARP keeps its answers. A network node maintains a lookup cache that associates IP and MAC addresses. If the sender already has the mapping cached, it does not need to broadcast the request at all, and when a host receives a request it can cache the requester's mapping too, so a reply is already known when it needs to talk back. Entries expire after a timeout so that stale mappings eventually clear.

A **gratuitous ARP** is an unsolicited announcement a host sends about its own mapping, typically after its address changes so other hosts refresh their caches. It is usually broadcast as an ARP request containing the sender's protocol address in the target field, with the target hardware address set to zero. No one asked for it; the host is proactively updating everyone's cache.

> [!example] A pings B for the first time
> Host A wants to reach `192.168.1.20` (host B) on the same LAN and has no cache entry. A broadcasts "who has `192.168.1.20`?" to the whole segment. B, and only B, replies "that is me, MAC `aa:bb:cc:dd:ee:ff`." A caches the mapping, wraps the IP packet in an Ethernet frame addressed to that MAC, and sends it. The next packet to B needs no broadcast.

> [!warning] ARP trusts every reply
> Nothing in ARP authenticates a reply, and a host will happily overwrite a cache entry from an answer it never requested. That is the opening for [[arp-spoofing-and-lan-attacks|ARP spoofing]], where an attacker forges replies to redirect a victim's traffic through itself. The resolution mechanism here is exactly what that attack abuses; the security note covers the exploitation.

## Related Notes

- [[arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] - how the trust in ARP replies is weaponized
- [[osi-and-tcp-ip-models|OSI and TCP/IP Models]] - the link layer ARP serves
- [[ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the IP addresses ARP maps from
- [[dhcp-and-address-assignment|DHCP and Address Assignment]] - how a host gets the IP it then resolves
- [[network-protocols|Network Protocols]] - where ARP sits among the layered protocols

## Sources

- "RFC 826: An Ethernet Address Resolution Protocol," D. Plummer / RFC Editor. https://www.rfc-editor.org/rfc/rfc826.txt . Supports that transmitting an Ethernet packet requires generating a 48-bit Ethernet address, that host protocol addresses are not always compatible with the corresponding Ethernet address (different lengths or values), and that the protocol dynamically distributes that mapping via broadcast on the Ethernet segment.
- "Address Resolution Protocol," Wikipedia. https://en.wikipedia.org/wiki/Address_Resolution_Protocol . Supports ARP as a protocol for discovering the link-layer (MAC) address associated with an internet-layer (IPv4) address, defined in 1982 as part of the internet protocol suite; the request-response broadcast-then-reply exchange; the per-node lookup cache that avoids re-broadcasting; IPv6 using the Neighbor Discovery Protocol; and the gratuitous ARP announcement broadcast as a request with TPA set to the sender's protocol address and THA set to zero.
