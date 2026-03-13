---
title: Network Protocols
description: OSI and TCP/IP models, TCP vs UDP, DNS resolution, and HTTP — the layered abstractions that let machines communicate.
draft: false
comments: false
tags:
  - cs
  - systems
date: 2026-03-12
aliases: []
---

## Intuition

Networking is a stack of agreements. At the bottom, electrical signals or light pulses travel over wires and fiber. At the top, a browser fetches a web page. In between, each layer solves one problem — framing, addressing, routing, reliability, naming, or application semantics — and presents a clean interface to the layer above. The two dominant models that describe this layering are OSI (7 layers, conceptual) and TCP/IP (4 layers, practical).

## Core Idea

**The TCP/IP model** (the one that actually runs the internet):

| Layer | Responsibility | Key Protocols |
|-------|---------------|---------------|
| Application | End-user data formats and semantics | HTTP, DNS, SMTP, SSH |
| Transport | End-to-end delivery, reliability or speed | TCP, UDP |
| Internet | Addressing and routing across networks | IP (v4/v6), ICMP |
| Link | Hop-to-hop delivery on a single network | Ethernet, Wi-Fi (802.11), ARP |

The OSI model adds Presentation and Session layers between Transport and Application; in practice these are folded into the Application layer.

**TCP vs UDP.**

| Property | TCP | UDP |
|----------|-----|-----|
| Connection | Connection-oriented (3-way handshake) | Connectionless |
| Reliability | Guaranteed delivery, in-order, retransmissions | Best-effort, no retransmission |
| Flow/congestion control | Yes (sliding window, AIMD) | None built-in |
| Overhead | Higher (20-byte header + state) | Lower (8-byte header) |
| Use cases | Web, email, file transfer, SSH | DNS queries, video streaming, gaming, VoIP |

TCP's three-way handshake: SYN, SYN-ACK, ACK. After that, data flows as a reliable byte stream. The sender adapts its rate using congestion-control algorithms (Reno, Cubic, BBR).

**DNS (Domain Name System).** Translates human-readable names (`example.com`) into IP addresses (`93.184.216.34`). Resolution is hierarchical:

1. Client asks its **recursive resolver** (usually ISP or `8.8.8.8`).
2. Resolver queries a **root nameserver** (`.`), which points to the **TLD nameserver** (`.com`).
3. TLD nameserver points to the **authoritative nameserver** for `example.com`.
4. Authoritative server returns the A/AAAA record.
5. Results are cached at each hop (TTL-bounded).

**HTTP (HyperText Transfer Protocol).** A request-response protocol over TCP (or QUIC for HTTP/3):

```
GET /index.html HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256

<!DOCTYPE html>...
```

Key evolution: HTTP/1.1 (persistent connections, chunked transfer), HTTP/2 (binary framing, multiplexed streams, header compression), HTTP/3 (QUIC — UDP-based, built-in TLS, eliminates head-of-line blocking at the transport layer).

## Example

What happens when you type `https://example.com` in a browser:

1. **DNS**: resolve `example.com` to an IP address (UDP port 53).
2. **TCP**: open a connection to that IP on port 443 (three-way handshake).
3. **TLS**: negotiate encryption (certificate exchange, key agreement).
4. **HTTP**: send `GET /` over the encrypted channel.
5. **Response**: server returns HTML; browser parses, discovers linked CSS/JS/images, and repeats steps 1-4 for each (often reusing the TCP connection).

At the IP layer, routers forward packets hop by hop using routing tables. At the link layer, each hop uses ARP (or NDP for IPv6) to map IP addresses to MAC addresses for local delivery.

## Related Notes

- [[distributed-consensus|Distributed Consensus]] — what happens when networked machines must agree on shared state
- [[processes-and-threads|Processes & Threads]] — servers use processes or threads to handle concurrent network connections
