---
title: Network Protocols
description: OSI and TCP/IP models, TCP vs UDP, DNS resolution, and HTTP - the layered abstractions that let machines communicate.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-03-12
updated:
aliases: []
---

## Overview

Every time you hit a URL, your request passes through at least four protocol layers before it reaches the server. Each layer solves exactly one problem and trusts the layers below it to handle the rest. This is the core design philosophy of network protocols: layered abstraction. You don't think about voltage on copper when you write an HTTP request, and that's the whole point.

> [!note]
> There are two models people reference: OSI (7 layers, mostly a teaching tool) and TCP/IP (4 layers, what actually runs the internet). In practice, the OSI Presentation and Session layers get folded into the Application layer, so the TCP/IP model is what you'll encounter in real systems.

---

## The TCP/IP Stack

| Layer | Responsibility | Key Protocols |
|-------|---------------|---------------|
| Application | End-user data formats and semantics | HTTP, DNS, SMTP, SSH |
| Transport | End-to-end delivery, reliability or speed | TCP, UDP |
| Internet | Addressing and routing across networks | IP (v4/v6), ICMP |
| Link | Hop-to-hop delivery on a single network | Ethernet, Wi-Fi (802.11), ARP |

The key insight here is that each layer only talks to its peer on the other machine. Your browser's HTTP layer talks to the server's HTTP layer, even though the actual bits pass through every layer on both sides. This is what makes the whole thing composable.

---

## TCP vs UDP

This is one of those comparisons that comes up constantly, and the tradeoff is straightforward once you see it: TCP gives you reliability at the cost of overhead, UDP gives you speed at the cost of "figure it out yourself."

| Property | TCP | UDP |
|----------|-----|-----|
| Connection | Connection-oriented (3-way handshake) | Connectionless |
| Reliability | Guaranteed delivery, in-order, retransmissions | Best-effort, no retransmission |
| Flow/congestion control | Yes (sliding window, AIMD) | None built-in |
| Overhead | Higher (20-byte header + state) | Lower (8-byte header) |
| Use cases | Web, email, file transfer, SSH | DNS queries, video streaming, gaming, VoIP |

TCP's [[cs/networking/tcp-three-way-handshake|three-way handshake]]: SYN, SYN-ACK, ACK. After that, data flows as a reliable byte stream. The sender adapts its rate using [[cs/networking/tcp-congestion-control|congestion-control algorithms]] (Reno, Cubic, BBR).

> [!tip]
> A quick way to remember which to use: if losing a packet would break your application (file transfer, database queries), use TCP. If a dropped packet just means a slightly choppy frame (video call, game state), UDP is probably fine.

UDP shows up in DNS because queries are small, latency matters, and if you don't get a response you just ask again. No need for a full connection setup for a single question-and-answer exchange.

---

## DNS Resolution

[[cs/systems/dns-the-domain-name-system|DNS]] translates human-readable names (`example.com`) into IP addresses (`93.184.216.34`). The resolution process is hierarchical, which is something I didn't fully appreciate until I traced through it:

1. Client asks its **recursive resolver** (usually ISP or `8.8.8.8`).
2. Resolver queries a **root nameserver** (`.`), which points to the **TLD nameserver** (`.com`).
3. TLD nameserver points to the **authoritative nameserver** for `example.com`.
4. Authoritative server returns the A/AAAA record.
5. Results are cached at each hop (TTL-bounded).

> [!warning]
> DNS caching means changes don't propagate instantly. If you update a DNS record, old values can persist until the TTL expires at every cache in the chain. This catches people off guard during migrations.

---

## HTTP

A request-response protocol that originally ran over TCP, now increasingly over QUIC (HTTP/3):

```
GET /index.html HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256

<!DOCTYPE html>...
```

[[cs/networking/http-evolution-1-1-to-3|The evolution of HTTP]] tells you a lot about what bottlenecks mattered at each stage:

- **HTTP/1.1** added persistent connections and chunked transfer (stop opening a new TCP connection for every image on a page).
- **HTTP/2** introduced binary framing, multiplexed streams, and header compression (stop waiting for one resource before requesting the next).
- **HTTP/3** moved to QUIC (UDP-based, built-in TLS) to eliminate head-of-line blocking at the transport layer. TCP's guarantee that bytes arrive in order actually hurts when you're multiplexing independent streams, because one lost packet stalls everything behind it.

---

## Putting It Together: What Happens When You Type a URL

This is the classic interview question, and walking through it connects all the layers:

1. **DNS**: resolve `example.com` to an IP address (UDP port 53).
2. **TCP**: open a connection to that IP on port 443 (three-way handshake).
3. **[[cs/systems/tls-and-the-https-handshake|TLS]]**: negotiate encryption (certificate exchange, key agreement).
4. **HTTP**: send `GET /` over the encrypted channel.
5. **Response**: server returns HTML; browser parses, discovers linked CSS/JS/images, and repeats steps 1-4 for each (often reusing the TCP connection).

At the IP layer, routers forward packets hop by hop using routing tables. At the link layer, each hop uses [[cs/networking/arp-and-mac-addressing|ARP]] (or NDP for IPv6) to map IP addresses to MAC addresses for local delivery.

> [!note]
> The browser reusing TCP connections is a huge performance win. Without connection reuse, every resource on a page (and modern pages load dozens) would require a fresh three-way handshake plus TLS negotiation. HTTP/2 takes this further by multiplexing multiple requests over a single connection.

## Related Notes

- [[cs/systems/distributed-consensus|Distributed Consensus]] - what happens when networked machines must agree on shared state
- [[cs/systems/processes-and-threads|Processes & Threads]] - servers use processes or threads to handle concurrent network connections
- [[cs/systems/dns-the-domain-name-system|DNS - The Domain Name System]] - the name-resolution layer in depth
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the encryption step between TCP and HTTP in depth

## Sources

- "Internet protocol suite," Wikipedia. https://en.wikipedia.org/wiki/Internet_protocol_suite . Supports the four-layer TCP/IP stack (Link, Internet, Transport, Application) and the layered-abstraction framing used in the Overview and stack table.
- "Transmission Control Protocol," Wikipedia. https://en.wikipedia.org/wiki/Transmission_Control_Protocol . Supports the TCP description as connection-oriented, reliable, in-order, error-checked byte-stream delivery with congestion control, and its use by web, email, file transfer, and SSH.
- "User Datagram Protocol," Wikipedia. https://en.wikipedia.org/wiki/User_Datagram_Protocol . Supports UDP as connectionless and best-effort with no handshake, no guaranteed delivery or ordering, and reliability left to the application, matching the TCP-vs-UDP table.
- "Domain Name System," Wikipedia. https://en.wikipedia.org/wiki/Domain_Name_System . Supports the hierarchical resolution chain through recursive, root, TLD, and authoritative name servers and the role of caching with TTLs.
