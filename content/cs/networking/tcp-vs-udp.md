---
title: TCP vs UDP
description: A reliable ordered byte stream versus connectionless datagrams, the head-of-line blocking that reliability buys, and how to pick between them.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-03-11
updated:
aliases:
  - TCP versus UDP
  - transport protocol choice
---

Both TCP and UDP sit at the transport layer, both ride on IP, and both use port numbers to hand data to the right process. That is where the resemblance ends. One spends effort to hide the network's unreliability from you; the other hands you the network's raw behavior and gets out of the way. Choosing between them is choosing what you want the transport layer to do on your behalf, and what you would rather do yourself.

> [!note] The idea
> TCP is a connection-oriented protocol that delivers a reliable, ordered stream of bytes. UDP is a connectionless protocol that sends independent datagrams with no delivery or ordering guarantee. Reliability is not free: the same in-order guarantee that makes TCP dependable can stall a whole stream behind one lost packet.

## What TCP promises

TCP is one of the main protocols of the internet suite, providing reliable, ordered, and error-checked delivery of a stream of octets between applications communicating over an IP network. To deliver on that, it first opens a connection with the [[tcp-three-way-handshake|three-way handshake]], numbers every byte, acknowledges what arrives, retransmits what does not, and reassembles segments into the exact order the sender wrote them. The application reads a clean, gap-free byte stream and never sees the losses and reorderings that happened underneath.

That contract is what the World Wide Web, email, remote administration, and file transfer are built on. When correctness of the whole payload matters more than the latency of any one piece, TCP is the default.

## What UDP promises

UDP promises almost nothing, deliberately. It was defined to give application programs a way to send messages with a minimum of protocol mechanism. Its own specification is blunt about the trade: the protocol is transaction oriented, and delivery and duplicate protection are not guaranteed. There is no connection, no sequence numbering carried for you, no retransmission. A datagram is sent and may arrive, may not, or may arrive after a later one.

That sounds like a defect until you notice what it removes: no handshake round trip before the first byte, no head-of-line stalls, no connection state to hold. For real-time voice, video, gaming, and DNS lookups, a datagram that arrives late is worse than one that never arrives, so UDP's refusal to wait and retransmit is the feature. The specification itself points the other way for anyone who needs order and reliability: applications requiring ordered reliable delivery of streams of data should use TCP.

## The cost of ordering: head-of-line blocking

TCP's in-order delivery has a specific failure mode. Head-of-line blocking is a performance-limiting phenomenon that occurs when a queue of packets is held up by the first packet in the queue. Because TCP must hand bytes to the application in order, a single lost segment forces every segment that arrived after it to sit in a buffer, delivered by the network but withheld from the application, until the missing one is retransmitted and fills the gap.

For one bulk transfer that is fine. For many independent things multiplexed over one connection, it means one lost packet stalls all of them. This is exactly the pressure that pushed [[http-evolution-1-1-to-3|HTTP/3]] off TCP and onto QUIC over UDP, where independent streams do not block each other.

> [!example] Same loss, two outcomes
> A packet carrying bytes 5,000 to 6,000 is dropped; bytes 6,000 to 10,000 arrive fine. Over TCP the receiving application sees nothing past byte 5,000 until the retransmission lands, even though later bytes are already in memory. Over UDP each datagram is independent, so the loss affects only its own datagram and the application decides whether to care.

> [!warning] UDP is not "faster TCP"
> Choosing UDP means signing up to handle, or to not need, everything TCP was doing for you: ordering, loss recovery, duplicate detection, and congestion control. Skip congestion control carelessly and a UDP flood can harm the network and yourself. UDP is the right tool when you genuinely do not want those guarantees, not merely when you want less overhead.

## Related Notes

- [[tcp-three-way-handshake|The TCP Three-Way Handshake]] - the connection setup UDP skips entirely
- [[network-protocols|Network Protocols]] - where TCP and UDP sit in the layered stack
- [[osi-and-tcp-ip-models|OSI and TCP/IP Models]] - the transport layer that hosts both
- [[http-evolution-1-1-to-3|HTTP Evolution]] - why HTTP/3 abandoned TCP to escape head-of-line blocking
- [[dns-the-domain-name-system|DNS]] - a canonical UDP workload

## Sources

- "RFC 768: User Datagram Protocol," J. Postel / RFC Editor. https://www.rfc-editor.org/rfc/rfc768.txt . Supports UDP as a minimum-mechanism, transaction-oriented protocol where delivery and duplicate protection are not guaranteed, and the note that applications needing ordered reliable stream delivery should use TCP.
- "Transmission Control Protocol," Wikipedia. https://en.wikipedia.org/wiki/Transmission_Control_Protocol . Supports TCP as a main internet-suite protocol providing reliable, ordered, error-checked delivery of a stream of bytes, relied on by the Web, email, remote administration, and file transfer.
- "Head-of-line blocking," Wikipedia. https://en.wikipedia.org/wiki/Head-of-line_blocking . Supports head-of-line blocking as a performance-limiting phenomenon where a queue of packets is held up by the first packet in the queue.
