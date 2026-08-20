---
title: "BGP and Internet Routing as Control"
description: "How the internet's global routing runs on mutual trust between networks with no central authority, why a single false route announcement can blackhole or redirect a country's traffic, and how that makes routing a lever of state control."
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-28
updated:
aliases:
  - BGP
  - internet routing
---

There is no master map of the internet. No central office decides that traffic for a Tokyo bank should leave New York heading west across the Pacific rather than east through Europe. Instead the path is stitched together hop by hop from claims that thousands of independent networks make to each other, in real time, about which addresses they can reach. The protocol that carries those claims is the Border Gateway Protocol, and it is the closest thing the internet has to a global nervous system. What makes it remarkable, and dangerous, is that it works almost entirely on trust: when a network announces a route, its neighbors believe it.

> [!note] The idea
> The internet is not one network but tens of thousands of separate ones, each called an autonomous system, that agree to carry each other's traffic. BGP is how they tell each other which blocks of addresses they can deliver to, and along what path. It is a path-vector protocol with no central authority: routing decisions emerge from networks advertising routes and their neighbors accepting them on faith. That trust-by-default is the source of both the system's scale and its fragility. A single false announcement, accepted and re-advertised by trusting neighbors, can pull a whole region's traffic toward the wrong place, which is why routing is also a lever of state control.

## Autonomous systems and path-vector routing

The internet is built from autonomous systems (ASes): large independent networks, run by an ISP, a university, a government, or a company like Google, each identified by a number. Individual IP addresses are grouped into prefixes (address blocks like `192.0.2.0/24`), and each prefix is owned by some AS. The job of getting a packet across the world is the job of getting it from the AS where it starts to the AS that owns the destination prefix, across whatever chain of networks lies between.

BGP is the exterior gateway protocol that the ASes use to exchange this reachability information. It is classified as a path-vector protocol: when an AS advertises that it can reach a prefix, the advertisement carries the whole sequence of ASes the traffic would traverse to get there. A router compares the paths it learns from its neighbors and, guided by local policy and rule-sets a network administrator configures, picks one to use and one to pass along. There is no global authority computing the best route. The map assembles itself out of many local decisions, sitting on top of the ordinary [[network-protocols|network protocols]] and the [[physical-layer-of-the-internet|the physical layer of the internet]] that actually move the bits.

## Trust by default and route propagation

Here is the load-bearing fact about BGP: by default the protocol is designed to trust all route announcements sent by peers, and many ISPs do not rigorously check them. When an AS announces "I can deliver traffic for this prefix," its neighbors generally accept the claim, install it, and re-advertise it to their own neighbors, who do the same. A route ripples outward across the internet because each network believes the one before it.

That design is what lets the internet scale to tens of thousands of independent operators with no central coordinator. It is also a standing structural weakness. There is no built-in check that the AS announcing a prefix actually owns it, or that the path it advertises is real. Authority over a chunk of the address space is asserted, not proved. The same property that makes routing decentralized and resilient also means the system has no native immune response to a lie.

> [!example] One announcement, propagating
> 1. AS 64500 announces to its neighbors: "I originate `203.0.113.0/24`, send that traffic to me."
> 2. Each neighbor, trusting the claim by default, installs the route and re-advertises it: "reach `203.0.113.0/24` via AS 64500, through me."
> 3. Their neighbors do the same, prepending their own AS to the path, and the announcement spreads across the internet within minutes.
> 4. Routers everywhere now believe the shortest or most-preferred way to that prefix runs toward AS 64500, whether or not AS 64500 has any right to it.

## When a false route hijacks a country

Because announcements are trusted, a false one is a weapon. A BGP hijack is the illegitimate takeover of address blocks by corrupting routing tables: an AS announces a prefix it does not own, or announces a more specific (and therefore preferred) sub-prefix of someone else's block, or claims a shorter path than really exists. Trusting neighbors propagate the lie, and traffic that should have gone to the rightful owner is pulled toward the attacker instead, where it can be dropped (a blackhole), inspected, or impersonated.

The classic accident shows the blast radius. In February 2008 Pakistan's telecom authority tried to block YouTube domestically by announcing a route for YouTube's address space inside its own network, but the announcement leaked into the global BGP table and was accepted worldwide, black-holing a large portion of YouTube's traffic for users far beyond Pakistan. A related failure mode, the route leak (defined by the IETF in RFC 7908), happens when an AS re-advertises routes beyond their intended scope, contravening policy, and the systemic trust of BGP turns a local mistake into a global one. In June 2019 a Swiss network leaked more than forty thousand routes to China Telecom, which accepted and propagated them, rerouting large amounts of European mobile traffic through China.

This is the point where a network protocol becomes a political instrument. The same lever that blocks YouTube inside a border can redirect or sever traffic at the scale of a country. A state that controls its ASes can announce, withdraw, or filter routes to wall off its slice of the internet, the technical substrate of the "splinternet" and of national kill-switches. Routing control is one of the concrete mechanisms behind [[cyber-sovereignty|cyber sovereignty]], the claim that a government can govern the network inside its borders. And because so many things resolve through it, a hijack of the wrong prefix can knock out higher-level services like [[dns-the-domain-name-system|DNS]] along with everything that depends on them.

## RPKI: a partial defense

The obvious fix is to make origin claims provable instead of trusted. The Resource Public Key Infrastructure (RPKI) does exactly this for the origin question: it ties address blocks to their rightful owners with cryptographic certificate chains, so a router can check whether the AS announcing a prefix is actually authorized to originate it. Route origin validation built on RPKI lets networks filter out announcements that fail the check, catching both accidental leaks and deliberate origin hijacks.

It is a partial defense for two reasons. First, RPKI is not yet universally deployed, and a protection only works where it is turned on; a hijack still spreads through networks that do not validate. Second, origin validation proves who may originate a prefix, not that the entire advertised AS path is genuine, so a more sophisticated attacker who forges a path rather than just an origin can still slip through. The deeper layer, cryptographically validating the whole path, remains hard and incomplete. The arc here is the same one [[tls-and-the-https-handshake|TLS]] walked for the web: a system built on trust gradually bolting on cryptography to make trust verifiable, one layer at a time.

## Related Notes

- [[cyber-sovereignty|Cyber Sovereignty]], routing control as the technical substrate of national kill-switches and the splinternet
- [[network-protocols|Network Protocols]], the stack BGP sits at the top of, gluing autonomous systems together
- [[physical-layer-of-the-internet|The Physical Layer of the Internet]], the cables and routers the advertised paths actually run over
- [[dns-the-domain-name-system|DNS]], the naming layer that depends on the routes BGP carries
- [[paul-baran-and-packet-switching|Packet Switching]], the hop-by-hop forwarding idea BGP scales to the whole planet

## Sources

- "Border Gateway Protocol," Wikipedia. https://en.wikipedia.org/wiki/Border_Gateway_Protocol . Supports BGP as a standardized exterior gateway protocol exchanging routing and reachability information among autonomous systems, its classification as a path-vector protocol, routing decisions made from paths and administrator-configured policies, and prefixes being originated and owned by autonomous systems.
- "BGP hijacking," Wikipedia. https://en.wikipedia.org/wiki/BGP_hijacking . Supports BGP being designed by default to trust all route announcements sent by peers and ISPs rarely filtering them, the three hijack methods (announcing a prefix not owned, a more specific prefix, or a falsely shorter path), the resulting traffic diversion and complete loss of connectivity, the February 2008 Pakistan black-holing of YouTube, route leaks as defined in RFC 7908 and the June 2019 China Telecom leak of European traffic, and RPKI authenticating route origins via cryptographic certificate chains while not yet being widely deployed.
