---
title: DNS
description: How the internet turns names into addresses through a hierarchical, cached, distributed lookup - one of the first planet-scale distributed databases, and a control point states fight over.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-22
updated:
aliases: []
---

People remember `example.com`; routers only move packets toward `93.184.216.34`. Something has to translate one into the other billions of times a day, for every name on Earth, fast enough that you never notice the wait. That something is DNS, and the surprising part is that no single machine holds the answer. The map is split across the whole internet and stitched back together one query at a time.

> [!note] The idea
> DNS is a hierarchical, cached, distributed database. No server knows every name. Instead, authority is delegated down a tree (root, then top-level domain, then the domain's own servers), a resolver walks that tree once, and aggressive caching means almost every later lookup is answered locally. It trades strong consistency for availability and speed, which is exactly the right trade for a global naming layer.

## Delegation: nobody owns the whole map

The name space is a tree read right to left. `www.example.com` is a leaf under `example.com`, which is under the `.com` top-level domain, which is under the root. Each level only knows how to point you at the next one down.

- **Root nameservers** sit at the top. There are thirteen root server identifiers, lettered A through M; each is not one machine but a fleet of physical servers sharing one address through anycast routing, so your query reaches a nearby copy. The root knows one thing: which servers run each TLD.
- **TLD nameservers** (`.com`, `.org`, `.edu`, country codes) know which servers are authoritative for each domain registered under them.
- **Authoritative nameservers** hold the actual records for a domain: the A record (IPv4 address), AAAA (IPv6), MX (mail), and others.

The work of walking this tree is done by a **recursive resolver**, usually run by your ISP or a public service like `8.8.8.8`. Your device just asks the resolver one question and waits for one answer. The resolver does the legwork.

![DNS resolution: a recursive resolver walks the hierarchy from a root nameserver to the TLD server to the authoritative server, and the answer is cached with a TTL on the way back.](cs/systems/assets/dns-resolution.svg)

Most of this happens over [[cs/networking/tcp-vs-udp|UDP]] on port 53. A DNS query is a small question with a small answer, latency matters, and if a packet drops you just ask again, so the [[cs/systems/network-protocols|lightweight, connectionless transport]] fits better than TCP's handshake. Large responses and zone transfers fall back to TCP.

## Caching: why it scales

If every lookup walked all the way to a root server, the roots would melt and every page load would crawl. They do not, because every result carries a **time to live (TTL)** and gets cached at every hop on the way back: in the recursive resolver, in your operating system, in your browser. The second time anyone near you asks for `example.com`, the answer is already local.

> [!warning]
> Caching is also why DNS changes are not instant. Update a record and the old value can linger in caches until the TTL expires at every layer. This is the classic surprise during a migration: the new server is live, but a fraction of users keep hitting the old one for hours. DNS is eventually consistent, not immediately consistent, and the TTL is the knob that sets how eventual.

That trade is deliberate. A naming system for the entire internet cannot afford a global lock or a single source of truth. By delegating authority and leaning on caches, DNS stays available even when parts of it are slow or unreachable, at the cost of brief inconsistency after a change. It is one of the earliest systems to make that [[cs/systems/distributed-consensus|availability-over-consistency]] trade at planet scale.

## A lookup is also a chokepoint

Because resolution is a step every connection takes before any data flows, whoever controls or observes the resolver controls or observes the user. That makes DNS a favorite lever for both censorship and defense:

- **[[cs/security/dnssec|DNS poisoning]] / spoofing** returns a wrong (or null) address for a name, silently blocking or redirecting it. National firewalls use this to make sites simply fail to resolve.
- **Plaintext queries leak.** Classic DNS is unencrypted, so a network observer sees every name you look up even when the page itself is HTTPS.
- **Encrypted DNS** closes that gap. DNS over HTTPS (DoH, RFC 8484) and DNS over TLS (DoT, RFC 7858) wrap queries in [[cs/systems/tls-and-the-https-handshake|TLS]] so they cannot be read or tampered with in transit.
- **DNSSEC** signs records cryptographically, so a resolver can verify an answer is authentic and was not forged, even if it cannot keep it private.

The same hierarchy that makes DNS scale also makes it governable: control a TLD, a root, or a resolver, and you hold a switch over names. That is why the distribution of root servers and the rules of the name space are themselves [[cs/geopolitics/cyber-sovereignty|contested ground]].

> [!example] Resolving example.com cold
> 1. Browser checks its own cache, then asks the OS, then the configured recursive resolver. All cold.
> 2. Resolver asks a **root** server for `example.com`. Root replies: "ask the `.com` servers, here is where they are."
> 3. Resolver asks a **`.com` TLD** server. It replies: "ask `example.com`'s authoritative servers, here they are."
> 4. Resolver asks the **authoritative** server. It returns the A record, `93.184.216.34`, with a TTL of, say, 300 seconds.
> 5. Resolver hands the address back to your machine and caches it. For the next five minutes, anyone using that resolver gets the answer instantly, no tree walk required.

## Related Notes

- [[cs/systems/network-protocols|Network Protocols]] - where DNS sits in the TCP/IP stack and why it rides UDP
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the next step after resolution, and what DoH encrypts DNS inside of
- [[cs/systems/distributed-consensus|Distributed Consensus]] - the consistency trade DNS makes by choosing availability over a single source of truth
- [[cs/history/history-of-the-internet|History of the Internet]] - DNS's origin in 1983 when numeric addresses stopped scaling
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] - DNS poisoning and resolver control as instruments of national censorship

## Sources

- "Domain Name System," Wikipedia. https://en.wikipedia.org/wiki/Domain_Name_System . Supports the hierarchical resolution chain (root, TLD, authoritative), recursive resolvers, TTL-based caching at each level, the thirteen root server identifiers distributed by anycast, UDP port 53, DNSSEC cryptographic signing, and DNS over HTTPS (RFC 8484) and DNS over TLS (RFC 7858).
- "DNS over HTTPS," Wikipedia. https://en.wikipedia.org/wiki/DNS_over_HTTPS . Supports encrypted DNS queries preventing on-path observation and tampering.
