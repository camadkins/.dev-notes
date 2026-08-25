---
title: QUIC over UDP
description: "Why the transport under HTTP/3 is a multiplexed, secure protocol built on UDP: independent streams, a one-round-trip handshake, 0-RTT resumption, and connections that survive an IP change."
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-07-08
updated:
aliases:
  - QUIC
  - QUIC transport
  - QUIC protocol
---

For thirty years the reliable-transport slot on the internet belonged to TCP, and anything that wanted ordered, loss-recovered delivery inherited TCP's whole model: one byte stream, one handshake before the first byte, one connection bolted to one pair of IP addresses. QUIC keeps the guarantees and throws out the packaging. It runs on [[cs/networking/tcp-vs-udp|UDP]], the protocol that promises nothing, and rebuilds reliability on top in a way TCP could not because TCP's design was [[cs/standards/when-the-standard-loses-to-the-implementation|frozen into operating-system kernels and middleboxes]] decades ago.

> [!note] The idea
> QUIC is a UDP-based, multiplexed, secure transport. Each stream recovers its own losses, so one dropped packet stalls only its stream and not the others; the transport and TLS handshakes are fused into a single low-latency exchange; a resumed connection can send application data in its very first packet (0-RTT); and a connection is named by an ID rather than an IP pair, so it survives the client moving networks.

## Reliability rebuilt on UDP, per stream

RFC 9000 titles the protocol plainly: "QUIC: A UDP-Based Multiplexed and Secure Transport." It provides applications with flow-controlled streams for structured communication, low-latency connection establishment, and network path migration. The word that matters is *streams*, plural, each independent.

This is the fix for the failure mode described in [[cs/networking/tcp-vs-udp|TCP vs UDP]]. When [[cs/networking/http-evolution-1-1-to-3|HTTP/2]] multiplexes many requests over a single TCP connection, TCP still sees one byte stream, so a single lost packet blocks delivery of every multiplexed request until the retransmit lands. QUIC flow-controls each stream separately and retransmits lost data at the QUIC level, not the UDP level, so if an error occurs in one stream the protocol stack keeps servicing the others. The classic example: a dropped packet carrying a favicon no longer freezes the rest of the page. Because [[cs/security/authenticated-encryption-aead|packets are encrypted individually]] rather than as records inside one bytestream, a partial packet does not hold up decryption of the ones behind it either.

## One handshake instead of two

TCP with [[cs/systems/tls-and-the-https-handshake|TLS]] pays for its layering. TCP first opens a connection with its own [[cs/networking/tcp-three-way-handshake|handshake]], and only then does TLS negotiate keys on top, each round trip adding real delay over long distances. QUIC folds these together. When a client opens a connection, the setup exchange carries the TLS key material and protocol list as part of the initial handshake, eliminating the need to build an unencrypted pipe and then negotiate security as separate steps. Security is not an add-on here; QUIC always encrypts, using TLS 1.3 for the cryptographic handshake.

## 0-RTT: data before the handshake finishes

The handshake saving compounds on a return visit. RFC 9001 defines the feature exactly: "The 0-RTT feature in QUIC allows a client to send application data before the handshake is complete. This is made possible by reusing negotiated parameters from a previous connection." The client remembers the critical parameters and presents a TLS session ticket that lets the server recover the same state, so the very first flight of packets can already carry a request. The cost is a specific hazard, called out in the same RFC: 0-RTT data can be captured and replayed, so it is safe only for requests that tolerate being repeated.

## Connection migration: the connection is not the address

TCP identifies a connection by the four-tuple of source and destination IP and port. Change any of them and the connection is a different connection, which is why walking out of Wi-Fi onto cellular tears down every TCP connection and rebuilds them one timeout at a time. QUIC identifies a connection by a connection ID that is independent of the source address. The original connection ID stays valid even if the client's IP address changes, so the connection is re-established by simply sending a packet that carries the ID. The download continues across the network switch instead of restarting.

> [!example] The same page load, TCP versus QUIC
> Twenty resources stream in parallel. Under HTTP/2 on TCP, one lost packet stalls all twenty until it is resent, the first byte waits on two stacked handshakes, and stepping from Wi-Fi to cellular drops the whole session. Under HTTP/3 on QUIC, the lost packet stalls only its own stream, the handshake completes in one round trip (or zero on a repeat visit), and the network switch is invisible because the connection ID never changed.

> [!warning] QUIC is more than "HTTP/3's transport"
> HTTP/3 was its first application, but QUIC is a general-purpose transport. DNS-over-QUIC, tunnelling, and SMB-over-QUIC all ride it. One deployment friction remains: some middleboxes rate-limit or block UDP, so stacks like Chromium's race a QUIC and a TCP connection at once and fall back with negligible latency.

## Related Notes

- [[cs/networking/tcp-vs-udp|TCP vs UDP]] - the head-of-line trade-off QUIC escapes by owning loss recovery per stream
- [[cs/networking/http-evolution-1-1-to-3|HTTP Evolution, 1.1 to 3]] - why HTTP/3 moved off TCP onto QUIC
- [[cs/networking/tcp-three-way-handshake|The TCP Three-Way Handshake]] - the connection setup QUIC fuses with TLS
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the TLS 1.3 handshake QUIC builds in
- [[cs/networking/tcp-congestion-control|TCP Congestion Control]] - the loss-recovery discipline QUIC reimplements above UDP

## Sources

- "RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport," J. Iyengar, M. Thomson (eds.) / RFC Editor. https://www.rfc-editor.org/rfc/rfc9000.txt . Backs the protocol title and that QUIC provides flow-controlled streams, low-latency connection establishment, and network path migration.
- "QUIC," Wikipedia. https://en.wikipedia.org/wiki/QUIC . Backs QUIC being multiplexed over UDP with per-stream loss recovery so one stream's loss does not block others, packets encrypted individually, the fused key-exchange-in-handshake, the connection identifier surviving an IP change, TLS 1.3 use, and the middlebox/UDP fallback behavior.
- "RFC 9001: Using TLS to Secure QUIC," M. Thomson, S. Turner (eds.) / RFC Editor. https://www.rfc-editor.org/rfc/rfc9001.txt . Backs the 0-RTT definition (sending application data before the handshake completes by reusing parameters from a previous connection) and its replay hazard.
