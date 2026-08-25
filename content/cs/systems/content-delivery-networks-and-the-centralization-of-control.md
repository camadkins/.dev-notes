---
title: "Content Delivery Networks and the Centralization of Control"
description: "How CDNs make the web fast by caching content at edge servers near users and routing to the nearest one with anycast, and why that same architecture concentrates a huge share of traffic behind a handful of providers, turning each CDN into both a performance win and a chokepoint."
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-28
updated:
aliases:
  - CDN
  - content delivery network
  - edge caching
---

When you load a popular site, the bytes almost never come from the company that owns it. They come from a rented box a few network hops away, in a building in your own city or region, that has kept a copy of the page ready for exactly this moment. The site's real servers might sit on another continent, but you would not know it from the speed. That is a content delivery network at work: a layer of cache servers spread across the world, sitting between you and the origin, whose entire job is to put a copy of the content close enough that distance stops mattering. The result is a faster, more resilient web, bought at the price of routing a large share of all internet traffic through a small number of companies.

> [!note] The idea
> A CDN is a geographically distributed network of cache servers that store copies of a site's content close to users. When you request something, the network routes you to the nearest cache, usually using anycast, so the data travels a short distance instead of crossing the planet. This cuts latency and shields the origin server from load, which is why CDNs serve a large share of all web content. The same concentration that makes this efficient turns each major CDN into a chokepoint: a handful of providers carry a huge fraction of traffic, so one of them can be ordered to block a site, or its failure or withdrawal can take a site offline.

## Edge caching and why it cuts latency

A CDN is, in the plainest terms, a geographically distributed network of proxy servers and their data centers, deployed across many locations and often across multiple internet backbones. These outer servers are the edge: the points of presence closest to where users actually are. Each one keeps cached copies of a site's content, the text, images, scripts, video segments, and downloadable files that make up a modern page.

Two things improve at once. The first is latency. A request that would otherwise travel to a distant origin and back instead terminates at a nearby edge server, so the round trip is shorter and the page paints faster. The physical reason is the one explored in [[cs/systems/physical-layer-of-the-internet|the physical layer of the internet]]: bytes move at a finite speed through real cable, and fewer kilometers of cable means less delay. The second is load on the origin. Every request the edge answers from its own cache is a request the origin never sees, so the company's own servers absorb a fraction of the traffic they otherwise would. That is also why CDNs double as the first line of defense against [[cs/security/denial-of-service-and-ddos|denial-of-service floods]]: the distributed edge absorbs the volume before it reaches the origin. CDNs arose in the late 1990s for exactly this reason, to relieve the performance bottlenecks of an internet that was becoming a critical medium, and they have since grown to serve a large portion of all internet content.

## Anycast and routing to the nearest copy

Caching content near everyone is only half the problem. The other half is steering each request to the right nearby copy automatically, without the user choosing a server or even knowing the network exists. The usual mechanism is [[cs/networking/multicast-broadcast-anycast|anycast]].

Anycast is an addressing and routing method in which a single IP address is shared by servers in many locations at once. When you send a packet to that address, the routers along the way deliver it to the location nearest you, using their ordinary decision-making, typically the lowest number of BGP hops. You connect to one address; the network quietly hands you to whichever instance is closest. This is the same routing trick that lets the [[cs/systems/dns-the-domain-name-system|DNS]] root and major name servers answer from a box down the road rather than a single distant machine, and it is widely used by CDNs for precisely that purpose, to bring content closer to end users. Underneath, it leans on the routing machinery described in [[cs/systems/network-protocols|network protocols]]: anycast is implemented through the Border Gateway Protocol, the same protocol that stitches the internet's networks together. Requests are then directed to whichever edge node is optimal, often the one with the fewest hops or shortest time to the client, which is where performance and cost tend to align, since the server closest to the user is usually both the fastest and the cheapest to serve from.

## The centralization tradeoff and the chokepoint it creates

The architecture works, and that is exactly the problem. Because CDNs serve such a large portion of internet content, and because the field is dominated by a short list of providers, an enormous share of the web's traffic now passes through a handful of companies. The content delivery market is led by names like Akamai, Cloudflare, Amazon CloudFront, Fastly, and Google Cloud CDN. A site that wants edge performance and DDoS protection typically buys it from one of them, which means that company sits in the path of every request to that site.

Sitting in the path is leverage. A CDN that carries a site can be compelled by a government to block it, filtering the content for an entire region at the edge without ever touching the origin, which makes the CDN a natural instrument of the kind of state-level control discussed in [[cs/geopolitics/cyber-sovereignty|cyber sovereignty]]. The leverage also runs the other way: a CDN can decide on its own to stop carrying a customer, and when a major provider withdraws service, the site it dropped can become slow or unreachable for much of the world. Either way, the decision about whether a site is fast, reachable, or blocked has migrated from the site's owner to the network that fronts it. The performance win and the control point are the same piece of infrastructure.

## The single point of failure a few large CDNs create

Concentration also means correlated failure. When one site goes down, that is a problem for one company. When one CDN goes down, that is a problem for every site behind it at once. Because a few providers front so much of the web, an outage or misconfiguration at a single CDN can knock thousands of unrelated sites offline simultaneously, including services that share nothing except their choice of provider. The very design that gives CDNs their resilience, many edge servers so no single machine is critical, hides a fragility at the layer above: the control plane, the routing logic, and the company itself are shared, and a fault there propagates to everyone downstream.

This is the recurring shape of the modern internet. As with the [[cs/systems/physical-layer-of-the-internet|landing stations and exchange points]] that funnel physical traffic, the places where the network is most efficient are the places where it is most concentrated, most governable, and most exposed. A CDN is efficient because it is shared, and it is a chokepoint for the same reason.

> [!example] A cached request
> 1. You request an image from a popular site. Your DNS lookup resolves its hostname to an anycast address the CDN advertises from many locations (see [[cs/systems/dns-the-domain-name-system|DNS]]).
> 2. BGP routes your request to the nearest edge server, the point of presence with the fewest hops to you, perhaps in your own city.
> 3. The edge server checks its cache. On a hit, it returns the stored copy immediately, and the origin server never hears about your request.
> 4. On a miss, the edge fetches the file from the origin once, sends it to you, and keeps a copy so the next nearby visitor gets a hit.
> 5. Most of the work, and the decision about whether to serve you at all, happened at a server owned by the CDN, not the site.

## Related Notes

- [[cs/systems/physical-layer-of-the-internet|The Physical Layer of the Internet]] - the finite cable and exchange-point geography that edge caching shortens, and the same chokepoint pattern at the substrate
- [[cs/systems/dns-the-domain-name-system|DNS]] - the lookup that points you at a CDN's anycast address, and the root servers that use the same routing trick
- [[cs/systems/network-protocols|Network Protocols]] - BGP and the routing layer that anycast is built on
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] - why states care that a CDN can filter a site for a whole region at the edge

## Sources

- "Content delivery network," Wikipedia. https://en.wikipedia.org/wiki/Content_delivery_network . Supports CDNs being geographically distributed networks of proxy servers and data centers that provide performance and availability through distribution relative to end users, edge servers caching content close to users, requests being algorithmically directed to optimal nearby nodes (fewest hops or shortest time), CDNs arising in the late 1990s to alleviate Internet performance bottlenecks and now serving a large portion of Internet content, and the market being led by a short list of providers including Akamai, Cloudflare, Amazon CloudFront, Fastly, and Google Cloud CDN.
- "Anycast," Wikipedia. https://en.wikipedia.org/wiki/Anycast . Supports anycast being a routing method in which a single IP address is shared by servers in multiple locations, routers directing packets to the nearest location by lowest BGP hop count, anycast being widely used by content delivery networks and name servers to bring content closer to end users, and anycast being implemented via the Border Gateway Protocol.
