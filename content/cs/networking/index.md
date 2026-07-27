---
title: Networking
description: Addressing, transport, routing, the link layer, and the delivery infrastructure that moves packets between machines.
draft: false
comments: false
tags:
  - cs
  - networking
date: 2026-07-18
updated:
aliases:
  - Networking
---

Networking is the study of getting bytes from one machine to another across equipment nobody controls end to end. The layered model is the organizing idea, so these notes are grouped roughly bottom-up. Read the model note first if you want the map before the territory.

### The layered model

- [[osi-and-tcp-ip-models|The OSI and TCP/IP Models]] - the layering abstraction and where the two models disagree

### Link layer

- [[arp-and-mac-addressing|ARP and MAC Addressing]] - resolving an IP address to a hardware address on the local segment
- [[vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] - carving one physical switch into isolated broadcast domains
- [[wifi-and-802-11|WiFi and 802.11]] - sharing a radio medium without collisions

### Network layer and addressing

- [[ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the prefix as the unit of routing
- [[ipv6-essentials|IPv6 Essentials]] - the larger address space and what changed with it
- [[dhcp-and-address-assignment|DHCP and Address Assignment]] - handing out addresses without touching each host
- [[nat-and-port-translation|NAT and Port Translation]] - many private hosts behind one public address
- [[mtu-and-fragmentation|MTU and Fragmentation]] - what happens when a packet is too big for the next hop
- [[multicast-broadcast-anycast|Multicast, Broadcast and Anycast]] - delivery models beyond one-to-one

### Routing

- [[routing-and-longest-prefix-match|Routing and Longest Prefix Match]] - how a router picks the next hop
- [[ospf-and-link-state-routing|OSPF and Link-State Routing]] - every router building the same map of the area

### Transport

- [[ports-and-sockets|Ports and Sockets]] - the endpoint abstraction applications actually use
- [[tcp-vs-udp|TCP vs UDP]] - reliability and ordering against latency and control
- [[tcp-three-way-handshake|The TCP Three-Way Handshake]] - establishing state before data flows
- [[tcp-congestion-control|TCP Congestion Control]] - keeping a shared network from collapsing
- [[quic-and-udp-transport|QUIC and UDP Transport]] - moving transport into user space to escape ossification

### Application delivery and the edge

- [[http-evolution-1-1-to-3|The Evolution of HTTP, 1.1 to 3]] - head-of-line blocking and the fixes across three versions
- [[proxies-forward-and-reverse|Proxies, Forward and Reverse]] - an intermediary on either side of the request
- [[load-balancing-l4-and-l7|Load Balancing, L4 and L7]] - distributing traffic by connection or by content
- [[cdn-and-edge-caching|CDNs and Edge Caching]] - serving from close to the user

### Operating the network

- [[qos-and-traffic-shaping|QoS and Traffic Shaping]] - deciding what gets to hurt when the link is full
- [[sdn-software-defined-networking|Software-Defined Networking]] - separating the control plane from the forwarding plane

---

*The full file listing follows below, generated automatically by Quartz.*
