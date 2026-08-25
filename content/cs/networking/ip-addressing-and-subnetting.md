---
title: IP Addressing and Subnetting
description: How IPv4 addresses split into network and host bits, and how CIDR notation and subnet masks draw that line anywhere you want.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-05-09
updated:
aliases: []
---

An IP address is the label the internet layer uses to route a packet toward a destination. The clever part is that a single address encodes two things at once: which network the host lives on, and which host it is inside that network. Routers care about the first part, local delivery cares about the second, and the boundary between them is not fixed by the address itself. Subnetting is the practice of choosing where that boundary falls.

> [!note] The idea
> An IPv4 address is 32 bits split into a network prefix and a host identifier. A subnet mask (written in CIDR as a slash and a number) says how many leading bits are the network. Routers match on the prefix; the host bits pick a machine inside it.

## The 32-bit address

IPv4 uses a 32-bit address space, which gives 4,294,967,296 (2^32) unique addresses. Humans read those 32 bits as four octets in decimal, separated by periods, for example `192.168.10.4`. Each octet is 8 bits, so its decimal value runs 0 to 255.

Those 32 bits carry a hidden seam. The address divides into two fields: the network number, also called the [[cs/systems/bgp-and-internet-routing-as-control|routing prefix]], and the rest field, also called the host identifier. Everything on the same subnet shares the same network number and differs only in the host part.

## Subnet masks and the network/host split

A subnet is a logical subdivision of an IP network, and dividing a network into two or more networks is called subnetting. The tool that marks the split is the subnet mask: a 32-bit pattern of leading ones followed by zeros. A [[cs/dsa/bitwise-operations|bitwise AND]] of the mask against any address in the network yields that network's routing prefix. The ones cover the network bits, the zeros cover the host bits.

![The address 192.168.10.0/24 split into 24 network bits across the first three octets and 8 host bits in the last octet.](cs/networking/assets/subnet-network-host-bits.svg)

Inside any subnet, two host values are reserved and cannot be assigned to a machine. The all-zeros host value is the network address of the subnet, and the all-ones host value is its broadcast address. That is why a subnet with an 8-bit host field holds 256 addresses but only 254 usable hosts.

## CIDR notation

Classless Inter-Domain Routing (CIDR) is the method used to allocate addresses for IP routing. Its notation writes an IP address followed by a suffix giving the number of prefix bits, like `192.168.10.0/24`. The `/24` means the first 24 bits are the network, which is exactly the mask `255.255.255.0` with its 24 leading one-bits.

CIDR is built on variable-length subnet masking, where network prefixes can be any length instead of the fixed lengths of the old classful design. That flexibility is the whole point: a `/30` gives you a tiny 4-address block for a point-to-point link, while a `/16` gives you a large block for a campus. An address belongs to a CIDR block when its initial n bits match the block's prefix, so the router only has to compare the leading bits to decide where a packet goes.

> [!example] Reading 192.168.10.0/24
> Prefix length 24, so 24 network bits and 8 host bits. Mask is `255.255.255.0`. The network address is `192.168.10.0`, the broadcast is `192.168.10.255`, and the assignable hosts run `192.168.10.1` through `192.168.10.254`. Change the `/24` to `/25` and you have split it into two subnets of 128 addresses each.

## Related Notes

- [[cs/networking/osi-and-tcp-ip-models|OSI and TCP/IP Models]] - addressing is the internet layer's job in the stack
- [[cs/systems/network-protocols|Network Protocols]] - where IP sits among the layered protocols
- [[cs/systems/bgp-and-internet-routing-as-control|BGP and Internet Routing]] - how prefixes get advertised between networks
- [[cs/networking/tcp-three-way-handshake|The TCP Three-Way Handshake]] - what happens once two addressed hosts want a connection

## Sources

- "IPv4," Wikipedia. https://en.wikipedia.org/wiki/IPv4 . Supports the 32-bit address space yielding 4,294,967,296 (2^32) unique addresses and the dotted-decimal representation of four octets separated by periods.
- "Subnet," Wikipedia. https://en.wikipedia.org/wiki/Subnet . Supports a subnet as a logical subdivision of an IP network, subnetting as dividing a network into more networks, the split into network number/routing prefix and host identifier, the subnet mask bitwise-AND yielding the routing prefix, and the all-zeros/all-ones host values reserved for the network and broadcast addresses.
- "Classless Inter-Domain Routing," Wikipedia. https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing . Supports CIDR as a method for allocating IP addresses for routing, the notation of an address plus a prefix-length suffix, the mask 255.255.255.0 having 24 leading one-bits, VLSM allowing variable-length prefixes versus fixed-length classful prefixing, and an address matching a CIDR block when its initial n bits equal the prefix.
