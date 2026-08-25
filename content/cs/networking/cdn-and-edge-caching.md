---
title: CDN Edge Caching
description: "The caching machinery inside a CDN: hits and misses at the edge, freshness set by Cache-Control max-age, the edge-to-shield-to-origin hierarchy, and how much load the origin never sees."
draft: false
comments: true
tags:
  - cs
  - networking
  - web
date: 2026-01-19
updated:
aliases: []
---

The [[cs/systems/content-delivery-networks-and-the-centralization-of-control|content delivery network]] note frames the CDN as a geographic and political object: cache servers spread worldwide, reached by anycast, and the concentration that makes them a chokepoint. This note goes inside one of those edge servers and asks the mechanical question the geography sits on top of. When a request lands at an edge PoP, what actually decides whether the byte is already there, how long it stays valid, and what happens when it is not. The whole performance win rests on the answer, because an edge server that has to ask the origin on every request has saved no one anything.

> [!note] The idea
> A CDN edge server is an HTTP cache placed near users. Whether it can answer from its own store (a hit) or must fetch from the origin (a miss) is governed by cache freshness, and freshness is set by the origin itself through Cache-Control, chiefly a max-age lifetime. Every hit is a request the origin never sees, so the design goal is to keep as many requests as possible answerable at the edge for as long as the content stays valid.

## Hit, miss, and the pull model

A CDN edge is a shared cache: unlike the private cache in your browser, which holds responses for one user, an edge server holds responses that can be reused across many users. When a request arrives, the edge checks its store. On a **hit**, it returns the stored copy immediately and the origin hears nothing. On a **miss**, it fetches the object from the origin once, returns it to the client, and keeps a copy so the next nearby visitor gets a hit. This is the pull model: the CDN does not need the whole site pushed to it in advance, it lazily pulls each object the first time someone asks for it, then serves the rest of the demand from the copy. The first visitor pays the miss; everyone after them, within the object's valid lifetime, is served locally.

## Freshness: max-age and the stale line

The cache cannot serve a copy forever, or a changed page would never reach anyone. HTTP gives every stored response one of two states, fresh or stale. A fresh response is still valid and can be reused; a stale one has expired and must be checked before reuse. The line between them is age against a lifetime the origin declares, most directly with the `Cache-Control: max-age` directive. MDN's own example is exact: `Cache-Control: max-age=604800` marks a response fresh for one week (604,800 seconds); while its age is under that, the edge serves it straight from cache, and once its age passes it, the response is stale. (HTTP/1.0 expressed the same idea with an absolute `Expires` date.) This declared lifetime is what people loosely call the object's TTL at the edge. Set it long and the origin is shielded but changes propagate slowly; set it short and content stays current but the edge asks the origin more often.

When a stale object is requested, the edge does not always re-download it. It can revalidate: send the origin a conditional request (for example `If-Modified-Since`) asking whether the object changed. If it did not, the origin replies with a small "not modified" and no body, and the edge refreshes the existing copy's freshness cheaply instead of transferring the whole object again.

## The cache hierarchy and origin shield

Edge servers are the outer layer, but they are not the only layer. A large CDN arranges caches in a hierarchy so a miss at one edge does not always fall all the way through to the origin. Wikipedia's CDN component breakdown names the pieces: the **origin server** holds the source content, **CDN entry points** are the servers that fetch content from the origin, **edge servers** serve requests to clients, and an **origin shield** is a CDN tier that protects the origin under heavy traffic. The shield is a designated intermediate cache that all the edges consult on a miss, so instead of hundreds of edge PoPs each independently hammering the origin for the same newly requested object, they converge on the shield, which fetches from the origin once and fans the answer back out. A miss becomes a hit one tier up, not a trip to the source.

## Origin offload: the number that matters

The point of all of this is offload. Every request answered from an edge or shield cache is a request the origin never processes, so a site behind a CDN can serve a large share of its traffic without its own servers ever seeing it. That is the same effect the [[cs/systems/content-delivery-networks-and-the-centralization-of-control|systems view]] describes as the CDN doubling as denial-of-service protection: the distributed cache tier absorbs the volume, including a [[cs/security/denial-of-service-and-ddos|flood]], before it reaches the origin. High cache-hit ratios are the metric CDN operators optimize, because the hit ratio is directly the fraction of load the origin is spared.

> [!example] Following one image through the tiers
> 1. A user requests a product image. Anycast routing (see [[cs/systems/content-delivery-networks-and-the-centralization-of-control|CDN routing]]) sends it to the nearest edge PoP.
> 2. Edge cache miss. The edge asks the origin shield, not the origin directly.
> 3. Shield miss. The shield fetches the image from the origin once and caches it, then returns it to the edge, which caches it and answers the user.
> 4. The image carried `Cache-Control: max-age=86400`, so for the next day every nearby user is an edge hit and the origin is never contacted again.
> 5. After a day the edge copy goes stale. The next request triggers a conditional revalidation; if the image is unchanged the origin replies "not modified" and the edge keeps serving its copy.

> [!warning] The origin still owns cache policy
> The edge does not decide how long to hold content; the origin does, through the headers it sends. A misconfigured origin that sends no `Cache-Control`, or `no-store`, gets little or no offload no matter how many PoPs front it, and one that sets an over-long max-age can pin a stale page in caches worldwide until it expires or is explicitly purged. Caching moves the copies to the edge; it does not move the decision.

## Related Notes

- [[cs/systems/content-delivery-networks-and-the-centralization-of-control|Content Delivery Networks]] - the anycast routing and centralization picture this note's caching sits inside
- [[cs/systems/dns-the-domain-name-system|DNS]] - the lookup that points a client at the CDN before any cache is consulted
- [[cs/networking/http-evolution-1-1-to-3|HTTP Evolution, 1.1 to 3]] - the request protocol whose headers carry the cache directives
- [[cs/systems/physical-layer-of-the-internet|The Physical Layer of the Internet]] - the finite distance edge caching exists to shorten
- [[cs/security/denial-of-service-and-ddos|Denial of Service and DDoS]] - the flood the cache tier absorbs before the origin

## Sources

- "Content delivery network," Wikipedia. https://en.wikipedia.org/wiki/Content_delivery_network . Backs CDNs being geographically distributed proxy servers deployed at points of presence (PoPs) called edges, requests directed to optimal nodes by fewest hops or shortest time, and the component roles: origin server, CDN entry points that fetch from the origin, edge servers that serve clients, and an origin shield that protects the origin under heavy traffic.
- "HTTP caching," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching . Backs private caches (one client) versus shared caches, stored responses being fresh or stale, freshness set by Cache-Control max-age (the max-age=604800 one-week example), HTTP/1.0 using the Expires header, and conditional revalidation with If-Modified-Since when a response is stale.
