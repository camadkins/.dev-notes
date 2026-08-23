---
title: OSI and TCP/IP Models
description: The seven-layer OSI reference model, the four-layer TCP/IP suite, and why TCP/IP is the stack that actually runs the internet.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-02-18
updated:
aliases:
  - OSI model
  - TCP/IP model
---

Two machines can only talk if they agree on the rules at every level, from [[cs/systems/physical-layer-of-the-internet|the voltage on the wire]] to the meaning of a web request. Rather than write one giant rulebook, network designers split the rules into layers, where each layer solves one problem and treats the layer below it as a service it does not have to understand. Two layering schemes get taught side by side. One is a formal reference model that names seven layers. The other is the four-layer family of protocols that carries real traffic.

> [!note] The idea
> OSI is a seven-layer reference model built for teaching and standards coordination. TCP/IP is a four-layer suite of protocols that actually moves packets. When you trace a real connection you are walking the TCP/IP stack, and the OSI layers map onto it loosely.

## The OSI reference model

The Open Systems Interconnection model comes from the [[cs/standards/what-a-standard-actually-is|International Organization for Standardization]]. It is a reference model, meaning it exists to give standards a common vocabulary, not to be shipped as running code. It partitions communication into seven abstraction layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application, numbered 1 to 7 from the wire up.

The value of OSI is the shared language. When someone says a bug is "a layer 2 problem," they mean the data-link layer that moves frames on one physical segment, distinct from a "layer 3 problem" in routing between networks. The seven names give engineers a coordinate system for pointing at exactly where something breaks.

## The TCP/IP four layers

The Internet protocol suite, commonly called TCP/IP, is the framework that organizes the protocols used on the internet. It classifies protocols into four layers by scope. From lowest to highest: the link layer handles data that stays within a single network segment; the internet layer provides internetworking between independent networks; the transport layer handles host-to-host communication; and the application layer provides process-to-process exchange for applications.

| TCP/IP layer | Job | Example protocols |
|--------------|-----|-------------------|
| Application | End-user data formats and semantics | HTTP, DNS, SMTP, SSH |
| Transport | Host-to-host delivery, reliable or best-effort | TCP, UDP |
| Internet | Addressing and routing across networks | IP, ICMP |
| Link | Delivery within one physical segment | Ethernet, Wi-Fi, ARP |

Each layer talks only to its peer on the other machine and leans on the layer beneath it. The application does not know whether the bits ride fiber or radio, and the wire does not know whether it carries email or video. That separation is what lets one layer change without disturbing the others. This is the same four-layer scheme the Defense Department standardized as the [[dod-model-and-tcp-ip-standardization|DoD model]].

## Why TCP/IP is what runs

OSI has seven layers, TCP/IP has four, and the difference tells you which one won. In practice the OSI Presentation and Session layers get folded into the application layer, because real applications handle formatting and session state themselves rather than delegating to a separate protocol layer. So the TCP/IP model is the one you meet in running systems, while the OSI numbering survives as a naming convention on top of it.

The suite's protocols were built, deployed, and iterated by the Internet Engineering Task Force, and they were carrying traffic before the OSI model's own protocol stack was finished. [[cs/standards/when-the-standard-loses-to-the-implementation|Reality shipped first]]. The internet standardized on TCP/IP, and OSI became the map people use to describe it.

> [!example] Rough layer mapping
> OSI Application, Presentation, Session collapse into TCP/IP **Application** (HTTP, DNS). OSI Transport maps to TCP/IP **Transport** (TCP, UDP). OSI Network maps to TCP/IP **Internet** (IP). OSI Data Link and Physical collapse into TCP/IP **Link** (Ethernet, Wi-Fi). Seven names, four working boxes.

## Related Notes

- [[network-protocols|Network Protocols]] - the layered stack in general, plus TCP vs UDP and DNS
- [[ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the internet layer's addressing scheme in depth
- [[tcp-three-way-handshake|The TCP Three-Way Handshake]] - how the transport layer opens a connection
- [[dod-model-and-tcp-ip-standardization|The DoD Model and the TCP/IP Flag Day]] - how the four-layer model became law
- [[physical-layer-of-the-internet|The Physical Layer of the Internet]] - what actually sits under the link layer

## Sources

- "OSI model," Wikipedia. https://en.wikipedia.org/wiki/OSI_model . Supports OSI as a reference model from ISO providing a common basis for standards coordination, and the seven abstraction layers (Physical, Data Link, Network, Transport, Session, Presentation, Application) numbered 1 to 7.
- "Internet protocol suite," Wikipedia. https://en.wikipedia.org/wiki/Internet_protocol_suite . Supports TCP/IP as a four-layer framework classifying protocols by scope (link, internet, transport, application), the per-layer responsibilities, and IETF maintenance of the standards.
