---
title: NAT and Port Translation
description: How private address reuse and port translation let one public IPv4 address serve a whole network, why that saved IPv4, and what it broke.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-05-02
updated:
aliases:
  - PAT
  - NAPT
---

There are only about four billion IPv4 addresses, and the internet ran out of new ones years ago. Yet billions of phones, laptops, and appliances are online right now, most of them sharing a handful of public addresses. The trick that makes that arithmetic work is a translation box sitting at the edge of every home and office network, quietly rewriting addresses on packets as they cross. It bought the IPv4 internet decades of extra life, and it changed the shape of the network in ways still felt today.

> [!note] The idea
> Network Address Translation rewrites the address information in a packet's IP header as it crosses the border between a private network and the public internet. Port translation extends this so that many private hosts share one public address, distinguished by port number. NAT let IPv4 stretch far past its address limit, and in doing so it broke the internet's end-to-end model.

## Private addresses and why they can be reused

The whole scheme starts with [[cs/networking/ip-addressing-and-subnetting|private address space]]: ranges of IP addresses reserved for use inside a network and never routed on the public internet. Because those addresses are not globally unique, the same block can be reused by any other private network. A single large private block could be used by many separate networks at once, and it routinely is: nearly every home router hands out addresses from the same `192.168.x.x` range with no conflict, because those addresses never leave the local network intact.

NAT is what connects such a realm of private addresses to an external realm with globally unique registered addresses. At the exit point between the two, the NAT device rewrites the private source address on outbound packets to its own public address, and reverses the rewrite on the replies.

## From address translation to port translation

Basic NAT translates addresses alone, mapping one private address to one public address. That still consumes a public address per active host, so it does not by itself solve scarcity. The version that does is [[cs/cisco/asa-nat|Network Address Port Translation (NAPT)]], often called PAT. NAPT is a method by which many network addresses and their TCP or UDP ports are translated into a single public address and its ports.

The port number is the disambiguator. When two internal hosts both open connections through the gateway, NAPT gives each a distinct public source port and records the mapping in a table. A reply arriving for public-port 40001 is rewritten back to the first host, one for 40002 back to the second. One public address multiplexes thousands of simultaneous conversations. This is why a single internet-routable address on a NAT gateway can serve an entire private network.

## Why NAT both saved and complicated IPv4

NAT is a popular and essential tool in conserving global address space in the face of IPv4 address exhaustion. By letting one public address stand in for a whole network, it decoupled the number of devices online from the number of addresses available, which is the only reason the IPv4 internet kept scaling long after the address pool was effectively empty.

The same rewriting broke a founding assumption. In traditional NAT, sessions are unidirectional and outbound from the private network: an inside host can start a conversation out, but an outside host cannot address an inside host directly, because that host has no globally reachable address. Hosts behind NAT do not have [[cs/military-computing/internetworking-prnet-satnet|end-to-end connectivity]] and cannot participate in some internet protocols. Anything that needs an inbound connection, from peer-to-peer to hosting a server, now needs a workaround such as static port forwarding, hole punching, or a relay.

> [!example] One address, two conversations
> Host A (`192.168.1.10`) and host B (`192.168.1.11`) both browse the web through a gateway whose public address is `203.0.113.5`. The gateway rewrites A's packets to `203.0.113.5:40001` and B's to `203.0.113.5:40002`, storing both mappings. Return traffic to `:40001` goes back to A, to `:40002` goes back to B. The outside world sees one address; inside, two hosts never collide.

> [!warning] NAT is not a firewall
> NAT hides internal addresses as a side effect, and that is often mistaken for security. It blocks unsolicited inbound connections only because it has no mapping for them, not because it inspects intent. Real access control is the job of a [[cs/security/firewalls|firewall]]; leaning on NAT for protection is leaning on an accident.

## Related Notes

- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - private address ranges and why IPv4 ran short
- [[cs/networking/dhcp-and-address-assignment|DHCP and Address Assignment]] - how hosts get the private addresses NAT rewrites
- [[cs/networking/tcp-vs-udp|TCP vs UDP]] - the port numbers NAPT uses to keep conversations apart
- [[cs/security/firewalls|Firewalls]] - the actual access-control layer NAT is often confused with
- [[cs/security/vpns-and-tunneling|VPNs and Tunneling]] - one way to restore reachability through NAT

## Sources

- "RFC 3022: Traditional IP Network Address Translator (Traditional NAT)," P. Srisuresh and K. Egevang / RFC Editor. https://www.rfc-editor.org/rfc/rfc3022.txt . Supports NAPT as translating many addresses and their TCP/UDP ports into a single address and its ports, traditional NAT connecting a private realm to a globally registered realm, sessions being unidirectional outbound with inbound only by static maps, and private addresses being reusable across separate stub domains.
- "Network address translation," Wikipedia. https://en.wikipedia.org/wiki/Network_address_translation . Supports NAT as mapping one address space into another by modifying IP header information in transit, being essential to conserving address space in the face of IPv4 exhaustion with one routable address serving an entire private network, and hosts behind NAT lacking end-to-end connectivity.
