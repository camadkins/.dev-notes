---
title: HTTP Evolution, 1.1 to 3
description: How the web's request protocol went from reusing one connection, to multiplexing over one, to running independent streams over QUIC to escape TCP's head-of-line stall.
draft: false
comments: true
tags:
  - cs
  - networking
  - web
date: 2026-06-28
updated:
aliases:
  - HTTP/2 vs HTTP/3
  - HTTP versions
  - QUIC HTTP
---

Every version of [[cs/history/world-wide-web|HTTP]] asks the same thing: fetch a resource by name over a network. What changed across HTTP/1.1, HTTP/2, and HTTP/3 is not the request but the plumbing beneath it, and each jump was a response to the previous version's specific bottleneck. Read in order, the three versions are a running argument about how to move many small requests fast without tripping over the transport underneath.

> [!note] The idea
> HTTP/1.1 made connections reusable so they did not have to be reopened per resource. HTTP/2 made one connection carry many parallel requests by multiplexing them. HTTP/3 moved off TCP entirely onto QUIC over UDP, so a single lost packet no longer stalls every request at once.

## HTTP/1.1: reuse the connection

HTTP/1.1, first published as RFC 2068 in January 1997, resolved ambiguities and introduced a decisive improvement: a connection could be reused, which saved time. Earlier HTTP opened a fresh [[cs/networking/tcp-three-way-handshake|TCP connection]] for every resource, paying the handshake cost again and again to load one page's worth of images and scripts. Persistent connections, the keep-alive behavior, let a single connection stay open and serve resource after resource.

HTTP/1.1 also added pipelining, which allowed a second request to be sent before the answer to the first had fully arrived, lowering latency. In practice pipelining was fragile and [[cs/standards/when-the-standard-loses-to-the-implementation|rarely deployed]], because responses still had to come back in request order. That ordering constraint on a single connection is the exact problem the next version set out to remove.

## HTTP/2: multiplex over one connection

HTTP/2 differs from HTTP/1.1 in two ways that matter here. It is a binary protocol rather than a text protocol, so it cannot be typed by hand but it enables better optimization. More importantly, it is a multiplexed protocol: parallel requests can be made over the same connection, removing the constraints of HTTP/1.x. It also compresses headers, which are often near-identical across a burst of requests, cutting that duplicated overhead.

Multiplexing means many logical request-response streams share one TCP connection at once, interleaved rather than queued. That erased HTTP/1.1's one-response-at-a-time ordering problem at the HTTP layer. But it relocated the problem one level down, because all those streams still ride a single TCP connection.

## HTTP/3: independent streams over QUIC

HTTP/3, defined in RFC 9114, is HTTP over QUIC, and QUIC is designed to provide much lower latency. Like HTTP/2 it is multiplexed, but the transport underneath is different. HTTP/2 runs over a single TCP connection, so packet-loss detection and retransmission handled at the TCP layer can block all streams: one dropped packet halts delivery of every multiplexed stream until it is resent. This is [[cs/networking/tcp-vs-udp|head-of-line blocking]] pushed down to the transport.

QUIC runs multiple streams over UDP and implements packet-loss detection and retransmission independently for each stream, so if an error occurs, only the stream with data in that packet is blocked. The other streams keep flowing. By owning loss recovery itself instead of inheriting TCP's single-stream model, HTTP/3 finally delivers on the promise HTTP/2 made but its transport undercut.

> [!example] One lost packet, three protocols
> Loading a page pulls twenty resources. Under HTTP/1.1 they queue on a reused connection, largely one response at a time. Under HTTP/2 all twenty stream in parallel over one TCP connection, until a single packet drops and TCP stalls every one of them until the retransmit lands. Under HTTP/3 the same drop stalls only the one stream that lost data; the other nineteen arrive uninterrupted.

> [!tip] Each version fixed the last one's bottleneck
> Reuse the connection (1.1), then run many requests over it at once (2), then stop letting one loss freeze them all (3). The application-facing request never changed; the transport engineering under it did.

## Related Notes

- [[cs/networking/tcp-vs-udp|TCP vs UDP]] - the head-of-line trade-off that pushed HTTP/3 onto UDP
- [[cs/networking/tcp-three-way-handshake|The TCP Three-Way Handshake]] - the per-connection cost HTTP/1.1 reuse avoided
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the encryption layer these versions negotiate
- [[cs/systems/network-protocols|Network Protocols]] - where HTTP sits in the layered stack
- [[cs/systems/dns-the-domain-name-system|DNS]] - the lookup that precedes any HTTP request

## Sources

- "Evolution of HTTP," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP . Supports HTTP/1.1 (RFC 2068, January 1997) allowing a connection to be reused and adding pipelining; HTTP/2 being a binary, multiplexed protocol that allows parallel requests over one connection and compresses headers; and HTTP/3 (RFC 9114) being HTTP over QUIC, where HTTP/2 over a single TCP connection can block all streams on loss while QUIC runs multiple streams over UDP with independent per-stream loss detection so only the affected stream is blocked.
