---
title: The Physical Layer of the Internet
description: The cloud is a metaphor resting on a finite, mappable substrate - submarine fiber cables carrying nearly all intercontinental traffic, internet exchange points where networks physically meet, anycast-distributed root servers, and the chokepoints all of this creates.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-28
updated:
aliases:
  - undersea cables
  - submarine cables
  - IXP
---

"The cloud" is a metaphor that hides a body. When you stream a film from another continent, the bits do not float; they travel as pulses of light through a glass thread the width of a garden hose lying on the seabed, surface at a fortified building on a beach, hop through a switch in a city datacenter where two networks agreed to meet, and find your address by way of a server that answered from somewhere it chose not to tell you. Every layer of logical abstraction the internet sells you, packets, addresses, names, sits on a layer of concrete geography: a finite set of cables, buildings, and switches that can be mapped, owned, tapped, and cut.

> [!note] The idea
> The internet's logical control plane (routing, peering, name resolution) is overlaid on a physical substrate that is small, concentrated, and geographic. Intercontinental traffic funnels through a few hundred submarine cables landing at a handful of stations; networks interconnect at internet exchange points that are literally rooms full of switches; the name system bootstraps from thirteen logical root servers. Wherever logical control meets physical geography you get a chokepoint, and a chokepoint is simultaneously where the system is efficient, where it is governed, and where it is vulnerable to surveillance and sabotage.

## The cables under the ocean

Roughly 99% of intercontinental data traffic crosses the ocean floor through submarine fiber-optic cables, not satellites. These are the load-bearing wires of the global internet, and they carry not only web traffic but military transmissions and financial settlements. A modern cable is a slim armored bundle of optical fibers with repeaters spaced along its length to keep the light strong over thousands of kilometers.

What matters structurally is where the cable touches land. Each end terminates at a cable landing station, a building near the coast that houses the submarine line terminal equipment converting the optical signal into the terrestrial network. Landing stations are scarce and known. A country may have only one or two, which makes them both a single point of failure and a single point of control: damage the station and the cable behind it goes dark, and whoever holds the station holds the traffic. This is one half of why the [[cs/history/history-of-the-internet|history of the internet]] is also a history of physical geography, the descendant of the same telegraph cables laid across the Atlantic in the nineteenth century.

## Where networks meet: IXPs and peering

A submarine cable carries one network's traffic to a coast, but the internet is a network of networks, and they have to hand traffic to each other somewhere. That somewhere is usually an internet exchange point. An IXP is a physical thing: one or more network switches, typically sitting in a datacenter that already has connections to many distinct networks, to which participating internet service providers plug in and exchange data destined for each other.

The economics are the point. Without an IXP, two networks in the same city might have to send traffic to each other by way of an upstream transit provider, who bills for it, possibly routing the bits through another city or continent and back. By meeting directly at an exchange, the networks peer: traffic passing through is typically unbilled, latency drops because the data never leaves town, and each network reduces the share of its traffic it must pay a transit provider to carry. Public peering happens at the shared IXP fabric; private peering is a direct link between two networks. Either way, interconnection is a physical act in a specific building, which is why the map of major IXPs is also a map of where the internet's traffic is densest and most concentrated. This is the layer beneath the abstractions in [[cs/systems/network-protocols|network protocols]]: routing decisions about which path a packet takes are constrained by which networks have physically chosen to meet, and where.

## Names from anywhere: root servers and anycast

The same pattern, logical control mapped onto distributed physical hardware, governs how names become addresses. Every recursive [[cs/systems/dns-the-domain-name-system|DNS]] resolution can begin at the root of the name hierarchy, and the root is served by thirteen logical root servers, named `a` through `m`. That number is not arbitrary: it was fixed by the practical size of an early DNS response that had to fit in a single unfragmented UDP packet.

Thirteen logical servers would be a dangerous concentration if it meant thirteen machines. It does not. Through a routing technique called anycast, each logical root server is announced from many physical instances scattered across the world (well over a thousand in total), and the network simply delivers your query to the nearest one. You ask `k.root-servers.net` and get an answer from a box that might be at an exchange point down the road, without ever learning which one. Anycast turns a tiny, centralized-looking namespace into a geographically resilient one, and it is also a quiet instrument of cyber-sovereignty: a country that hosts root server instances inside its own borders keeps name resolution working even if its external links are degraded, which is why root-instance distribution is a live concern in [[cs/geopolitics/cyber-sovereignty|cyber sovereignty]].

## Chokepoints, surveillance, and sabotage

Concentration buys efficiency and pays for it in exposure. The same scarcity that makes landing stations and IXPs economically sensible makes them targets. Because nearly all transoceanic traffic funnels through a small number of cables and stations, the physical layer is the natural place to either listen or break.

Surveillance lives here. Upstream collection taps the cable or its terminal equipment directly, copying traffic in bulk before it ever reaches an application, which is why so much of the [[cs/geopolitics/surveillance-and-privacy|surveillance and privacy]] debate is really about who controls the wire. Submarine cables can be tapped by specialized submarines and unmanned underwater vehicles, and intelligence services have historically targeted landing stations and the network management systems behind them. Sabotage lives here too: an anchor dragged across a cable, or a strike on a landing station, can sever a region's connectivity, and the open ocean is hard to police. End-to-end encryption blunts the listening (you cannot read what you cannot decrypt), but it does nothing against the cutting. The substrate remains finite, mappable, and reachable, which is the whole reason the cloud has a body worth defending.

> [!example] A packet crossing an ocean
> 1. Your browser resolves a hostname; the lookup may walk up to a [[cs/systems/dns-the-domain-name-system|root server]] instance reached by anycast, likely a box at a nearby exchange point.
> 2. The packet leaves your ISP and reaches an internet exchange point, where your ISP peers with the network that can carry it toward the destination.
> 3. To cross the ocean it enters a submarine cable at a coastal landing station, where terminal equipment turns it into light.
> 4. It travels thousands of kilometers as photons through glass, boosted by repeaters on the seabed, possibly passing equipment a state would very much like to tap.
> 5. It surfaces at a landing station on the far coast, converts back to an electrical signal, and reaches another exchange point.
> 6. From there it routes through the destination network to the server. The reply makes the same physical journey home, none of it in any cloud.

## Related Notes

- [[cs/history/history-of-the-internet|History of the Internet]] - how today's cable map descends from nineteenth-century telegraph lines across the same oceans
- [[cs/systems/network-protocols|Network Protocols]] - the logical routing layer whose choices are constrained by where networks physically peer
- [[cs/systems/dns-the-domain-name-system|DNS]] - the name system that bootstraps from the thirteen root servers described here
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] - why states care about hosting root-server instances and controlling landing stations
- [[cs/geopolitics/surveillance-and-privacy|Surveillance & Privacy]] - upstream cable tapping as the physical-layer face of mass surveillance
- [[cs/military-computing/sosus-undersea-signal-processing|SOSUS]] - the precedent for treating the seabed as an instrumented, listenable space

## Sources

- "Submarine communications cable," Wikipedia. https://en.wikipedia.org/wiki/Submarine_communications_cable . Supports submarine fiber cables carrying 99%25 of intercontinental data traffic (including military and financial transmissions), cable landing stations housing submarine line terminal equipment, and the surveillance and sabotage exposure via cable tapping by submarines and UUVs and the targeting of landing stations.
- "Internet exchange point," Wikipedia. https://en.wikipedia.org/wiki/Internet_exchange_point . Supports IXPs operating physical switch infrastructure in datacenters where ISPs interconnect, public versus private peering, and the cost and latency reductions from peering rather than routing through billed upstream transit providers.
- "Root name server," Wikipedia. https://en.wikipedia.org/wiki/Root_name_server . Supports the thirteen logical root servers %28a through m%29 limited by unfragmented UDP packet size, anycast addressing replicating each into far more physical instances worldwide, and most physical instances now being located outside the United States.
