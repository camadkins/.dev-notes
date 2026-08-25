---
title: OSPF and Link-State Routing
description: "The interior gateway protocol where every router floods a description of its own links, builds an identical map of the network, and runs Dijkstra to compute its own shortest paths."
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-05-28
updated:
aliases:
  - OSPF
  - link-state routing
  - link-state advertisement
  - Dijkstra SPF
---

Two families of routing protocol answer the same question, "which way to everywhere," in opposite styles. A distance-vector router knows only what its neighbors tell it: each neighbor hands over its own routing table, its list of conclusions, and the router trusts those conclusions and adds itself in. A link-state router refuses to trust conclusions. It wants the raw facts, who connects to whom, and insists on drawing its own map and computing its own answers. OSPF is the dominant protocol built on that second philosophy, and the difference in what gets shared explains almost everything about how it behaves.

> [!note] The idea
> Open Shortest Path First is an interior gateway protocol that uses link-state routing: every router floods link-state advertisements describing only the links it is directly connected to, so every router assembles the same map of the whole topology, then independently runs a method based on Dijkstra's algorithm to compute its own shortest-path tree to every destination. The non-obvious part is *what* is shared. Distance-vector protocols share routing tables (conclusions); link-state protocols share only connectivity (facts), which is why the technique is summed up as each router "telling the world about its neighbors."

## Link-state versus distance-vector

Link-state routing protocols are one of the two main classes of routing protocol for [[cs/military-computing/paul-baran-and-packet-switching|packet-switched networks]], the other being distance-vector. The basic concept is that every node constructs a map of the connectivity of the network [[cs/dsa/graphs|as a graph]] showing which nodes connect to which, then independently calculates the best next hop to every possible destination, and that collection of best next hops forms its routing table.

The contrast is precise. Distance-vector protocols work by having each node share its routing table with its neighbors. In a link-state protocol, the only information passed between nodes is connectivity related. A distance-vector router accepts a neighbor's summary of how far away things are; a link-state router accepts only the neighbor's list of direct links and reaches its own conclusions. That is why link-state protocols converge on a new loop-free structure quickly after a failure: the map changes everywhere at once, and every router recomputes from the same map, rather than waiting for revised conclusions to propagate hop by hop.

## Flooding link-state advertisements

The first job is to give every node the same map. Each node first determines which neighbors it can reach over working links, using a reachability protocol it runs periodically with each directly connected neighbor. Then each node periodically, and whenever connectivity changes, sends a short message called a link-state advertisement. The LSA identifies the node producing it, identifies all the other nodes (routers or networks) it is directly connected to, and carries [[cs/systems/logical-clocks-lamport-and-vector|a sequence number]] that increases each time the source makes a new version.

That sequence number is what makes flooding safe. An LSA is forwarded to every other node, and each keeps the highest sequence number it has seen for a given source, so stale copies are discarded and the newest description of each link wins. Once every router holds every current LSA, they all hold the identical link-state database, the shared map, from which each computes independently.

## Dijkstra and the shortest-path tree

With the map in hand, OSPF computes the shortest-path tree for each route using a method based on [[cs/networking/routing-and-longest-prefix-match|Dijkstra's algorithm]]. The edges of that graph are weighted by link metrics associated with each routing interface, expressed as simple unitless numbers; cost factors may reflect a link's round-trip time, throughput, or reliability. Routes of equal cost let OSPF balance traffic across them. The output, the router's own shortest-path tree, is then presented as a routing table to the internet layer, which forwards packets by destination IP address alone.

## Areas and the backbone

Flooding every LSA to every router does not scale to a large network, so OSPF divides the network into routing areas to simplify administration and limit how far detailed topology information travels. Areas are identified by 32-bit numbers written in dotted-decimal form. By convention, area 0 (0.0.0.0) is the backbone, and every other area must connect to it. The connection is held by an area border router, which maintains a separate link-state database for each area it serves and advertises summarized routes between them. Inside an area every router shares the full map; across areas they exchange summaries, which keeps the detailed flooding local while still giving every router reachability to the rest.

> [!warning] OSPF is interior; BGP is exterior
> OSPF is an interior gateway protocol (IGP), operating within a single autonomous system, an administrative domain under one operator. [[cs/systems/bgp-and-internet-routing-as-control|BGP]] is the exterior protocol that stitches autonomous systems together across the internet. The split is not cosmetic: an IGP optimizes shortest paths on metrics it trusts because one operator owns the whole map, while BGP routes between operators who do not share maps and make decisions on policy and trust rather than a global shortest path. OSPF finds the best path inside your network; BGP negotiates paths between networks that will not show each other their internals.

## Related Notes

- [[cs/networking/routing-and-longest-prefix-match|Routing and Longest Prefix Match]] - the forwarding lookup that OSPF's computed routes feed into
- [[cs/systems/bgp-and-internet-routing-as-control|BGP and Internet Routing]] - the exterior gateway protocol OSPF is the interior counterpart to
- [[cs/systems/network-protocols|Network Protocols]] - where routing protocols sit in the layered stack
- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the CIDR prefixes OSPF advertises and summarizes

## Sources

- "Open Shortest Path First," Wikipedia. https://en.wikipedia.org/wiki/Open_Shortest_Path_First . Backs OSPF as a link-state interior gateway protocol operating within a single autonomous system, gathering link-state information to construct a topology map, computing the shortest-path tree using a method based on Dijkstra's algorithm with unitless link-cost metrics and equal-cost balancing, converging within seconds after a link failure, and dividing the network into areas identified by 32-bit dotted-decimal numbers with area 0 as the backbone connected via area border routers holding separate per-area databases.
- "Link-state routing protocol," Wikipedia. https://en.wikipedia.org/wiki/Link-state_routing_protocol . Backs link-state as one of two main routing-protocol classes (the other distance-vector), every node building a connectivity map and independently computing best next hops, the contrast that distance-vector shares routing tables while link-state passes only connectivity information, the "telling the world about its neighbors" characterization, and link-state advertisements that identify the producing node and its directly connected nodes and carry an increasing sequence number, flooded to all nodes.
