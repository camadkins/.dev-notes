---
title: IPv6 Essentials
description: The 128-bit successor to IPv4, its colon-hexadecimal notation, why the internet needed a bigger address space, and how hosts self-assign addresses with SLAAC while dual-stack bridges the two protocols.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-07-14
updated:
aliases:
  - IPv6
  - SLAAC
  - dual-stack
---

The internet ran out of IPv4 addresses because 32 bits can only count to about four billion, and there are far more than four billion things online. [[nat-and-port-translation|NAT]] bought time by letting many devices hide behind one address, but it did so by breaking the internet's end-to-end model. IPv6 is the structural fix: not a patch on the address shortage but a different address, four times as wide, with enough room that every device can have its own globally unique identity again.

> [!note] The idea
> IPv6 replaces IPv4's 32-bit address with a 128-bit one, expanding the space from about four billion addresses to roughly 3.4 times 10 to the 38th. The width is not the interesting part; the consequence is. With addresses effectively unlimited, a host can generate its own from the network prefix it hears advertised, and NAT stops being necessary.

## Why IPv6 exists

Internet Protocol version 6 is the most recent version of IP, developed by the IETF to deal with the long-anticipated problem of IPv4 address exhaustion, and intended to replace IPv4. It became a full Internet Standard on 14 July 2017. The core change is the address size: IPv4 defined an address as a 32-bit value giving roughly four billion (2^32) addresses, while IPv6 uses 128-bit addresses, yielding a space of 2^128, approximately 3.4 times 10 to the 38th, sometimes written as 340 undecillion.

IPv6 is not backwards-compatible with IPv4, and the two do not interoperate directly. That single fact shapes the entire transition: you cannot simply upgrade and expect old and new to talk. A host or network has to speak both, or translate between them, which is why the rollout has taken decades.

## Notation

Writing 128 bits in dotted decimal would be unreadable, so IPv6 uses colon-hexadecimal. An IPv6 address is represented as eight groups of four hexadecimal digits, each group representing 16 bits, with the groups separated by colons, for example `2001:0db8:85a3:0000:0000:8a2e:0370:7334`.

Because IPv6 addresses are long and often full of zeros, the standard defines a canonical shortened form. Leading zeros in each 16-bit field are suppressed, so `0db8` becomes `db8`. The longest run of consecutive all-zero fields is replaced with a double colon `::`, and if several equal-length runs exist, the leftmost is compressed to avoid ambiguity.

> [!example] Compressing an address
> `2001:0db8:0000:0000:0000:8a2e:0370:7334` drops leading zeros to `2001:db8:0:0:0:8a2e:370:7334`, then collapses the three zero groups to `2001:db8::8a2e:370:7334`. The `::` stands for "as many zero groups as needed to make eight," which is unambiguous because it may appear only once.

## Addressing methods and no broadcast

IPv6 addresses come in three kinds: unicast (one interface), anycast (a group of interfaces, delivered to the nearest one), and multicast (delivered to all interfaces that joined a group). IPv6 does not implement broadcast addressing at all. Broadcast's traditional role is subsumed by multicast to the all-nodes link-local group `ff02::1`. Removing broadcast quietly kills a class of noisy, disruptive traffic that IPv4 networks tolerate.

## SLAAC: a host that addresses itself

The huge address space enables something IPv4 could not do cleanly. On system startup, an IPv6 node automatically creates a link-local address on each IPv6-enabled interface, without any prior configuration, by stateless address autoconfiguration (SLAAC), using a component of the Neighbor Discovery Protocol. That link-local address uses the prefix `fe80::/64`. For a globally routable address, the host listens for a router advertising a network prefix and combines that prefix with an interface identifier to form its own global address, again without a server handing it out. IPv4 leans on [[dhcp-and-address-assignment|DHCP]] to assign addresses from a pool; SLAAC lets the host do it itself, because addresses are no longer scarce enough to need central rationing.

## Dual-stack: living in both worlds

Since IPv4 and IPv6 do not interoperate, the dominant transition strategy is to run both. A dual-stack host has full IPv4 and IPv6 stacks and can reach either kind of peer. When it resolves a name it sends two DNS queries, one for AAAA records (IPv6) and one for A records (IPv4), and prefers IPv6 when a working route exists. When dual-stack network protocols are in place the application layer can be migrated to IPv6, which is how the internet is crossing over gradually rather than in a single cutover.

## Related Notes

- [[ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the 32-bit IPv4 scheme IPv6 succeeds
- [[nat-and-port-translation|NAT and Port Translation]] - the IPv4 workaround IPv6's address space makes unnecessary
- [[arp-and-mac-addressing|ARP and MAC Addressing]] - ARP's job is done by the Neighbor Discovery Protocol in IPv6
- [[dhcp-and-address-assignment|DHCP and Address Assignment]] - the stateful assignment SLAAC can replace
- [[mtu-and-fragmentation|MTU and Fragmentation]] - IPv6 pushes fragmentation entirely onto the end hosts

## Sources

- "IPv6," Wikipedia. https://en.wikipedia.org/wiki/IPv6 . Supports IPv6 as the most recent IP version developed by the IETF to address IPv4 exhaustion, ratified as an Internet Standard on 14 July 2017, the 128-bit address yielding 2^128 (approximately 3.4 x 10^38, 340 undecillion) versus IPv4's ~4 billion, IPv6 not being backwards-compatible with IPv4, dual-stack hosts querying AAAA and A records and the application layer migrating once dual-stack is in place.
- "IPv6 address," Wikipedia. https://en.wikipedia.org/wiki/IPv6_address . Supports the 128-bit address size, the eight-group four-hex-digit colon notation with the example 2001:0db8:85a3:0000:0000:8a2e:0370:7334, leading-zero suppression and :: compression of the longest all-zero run (leftmost if tied), unicast/anycast/multicast with no broadcast (subsumed by ff02::1), and SLAAC creating a link-local fe80::/64 address on startup via the Neighbor Discovery Protocol.
