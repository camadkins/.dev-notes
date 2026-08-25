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
aliases: []
---

Networking is the study of getting bytes from one machine to another across equipment nobody controls end to end. The layered model is the organizing idea, so these notes are grouped roughly bottom-up. Read the model note first if you want the map before the territory.

### The layered model

- [[cs/networking/osi-and-tcp-ip-models|The OSI and TCP/IP Models]] - the layering abstraction and where the two models disagree

### Link layer

- [[cs/networking/arp-and-mac-addressing|ARP and MAC Addressing]] - resolving an IP address to a hardware address on the local segment
- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] - carving one physical switch into isolated broadcast domains
- [[cs/networking/wifi-and-802-11|WiFi and 802.11]] - sharing a radio medium without collisions

### Network layer and addressing

- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the prefix as the unit of routing
- [[cs/networking/ipv6-essentials|IPv6 Essentials]] - the larger address space and what changed with it
- [[cs/networking/dhcp-and-address-assignment|DHCP and Address Assignment]] - handing out addresses without touching each host
- [[cs/networking/nat-and-port-translation|NAT and Port Translation]] - many private hosts behind one public address
- [[cs/networking/mtu-and-fragmentation|MTU and Fragmentation]] - what happens when a packet is too big for the next hop
- [[cs/networking/multicast-broadcast-anycast|Multicast, Broadcast and Anycast]] - delivery models beyond one-to-one

### Routing

- [[cs/networking/routing-and-longest-prefix-match|Routing and Longest Prefix Match]] - how a router picks the next hop
- [[cs/networking/ospf-and-link-state-routing|OSPF and Link-State Routing]] - every router building the same map of the area

### Transport

- [[cs/networking/ports-and-sockets|Ports and Sockets]] - the endpoint abstraction applications actually use
- [[cs/networking/tcp-vs-udp|TCP vs UDP]] - reliability and ordering against latency and control
- [[cs/networking/tcp-three-way-handshake|The TCP Three-Way Handshake]] - establishing state before data flows
- [[cs/networking/tcp-congestion-control|TCP Congestion Control]] - keeping a shared network from collapsing
- [[cs/networking/quic-and-udp-transport|QUIC and UDP Transport]] - moving transport into user space to escape ossification

### Application delivery and the edge

- [[cs/networking/http-evolution-1-1-to-3|The Evolution of HTTP, 1.1 to 3]] - head-of-line blocking and the fixes across three versions
- [[cs/networking/proxies-forward-and-reverse|Proxies, Forward and Reverse]] - an intermediary on either side of the request
- [[cs/networking/load-balancing-l4-and-l7|Load Balancing, L4 and L7]] - distributing traffic by connection or by content
- [[cs/networking/cdn-and-edge-caching|CDNs and Edge Caching]] - serving from close to the user

### Operating the network

- [[cs/networking/qos-and-traffic-shaping|QoS and Traffic Shaping]] - deciding what gets to hurt when the link is full
- [[cs/networking/sdn-software-defined-networking|Software-Defined Networking]] - separating the control plane from the forwarding plane

---

*The full file listing follows below, generated automatically by Quartz.*
