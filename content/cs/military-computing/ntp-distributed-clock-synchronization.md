---
title: NTP and Distributed Clock Synchronization
description: How a hierarchy of time servers and a little arithmetic keep millions of clocks aligned over a network that delays every message unpredictably.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-02-09
updated:
aliases:
  - Network Time Protocol
  - NTP
---

Two computers that disagree about the time [[cs/systems/logical-clocks-lamport-and-vector|cannot agree about order]]. They cannot decide [[cs/systems/two-phase-commit-and-distributed-transactions|which transaction came first]], [[cs/security/pki-and-x509-certificates|when a certificate expired]], or how to merge two logs. Keeping clocks aligned sounds easy until you notice that the only way to tell a remote machine the time is to send it a message, and the message takes a while to arrive, and that delay is never the same twice. [[cs/standards/ieee-1588-precision-time-protocol|The Network Time Protocol]], designed by David L. Mills at the University of Delaware and documented in RFC 958 in 1985, solves this well enough that it has kept the internet's clocks in step ever since.

> [!note] The idea
> Spread authoritative time outward through a hierarchy of servers, and cancel the network's unknown delay with four timestamps from a single exchange.

## A hierarchy of strata

NTP arranges time sources into levels it calls strata. At the top, stratum 0, are the reference clocks themselves, such as atomic clocks and GPS receivers, which are not on the network. A stratum 1 server is directly attached to one of those references. A stratum 2 server sets its clock from stratum 1 servers, a stratum 3 from stratum 2, and so on down. Each level is a little less accurate than the one above, and the tree spreads authoritative time outward to millions of machines without every machine needing its own atomic clock.

![NTP strata: reference clocks at stratum 0 feed a tree of servers, each level synchronizing from the one above.](cs/military-computing/assets/ntp-stratum-hierarchy.svg)

## Measuring time across a noisy link

The harder problem is the delay. A client cannot simply accept the timestamp a server sends, because that timestamp is already stale by the unknown travel time. NTP gets around this with four timestamps from a single exchange: when the client sent its request, when the server received it, when the server replied, and when the client got the reply. Call them t0, t1, t2, and t3. The protocol computes the clock offset as ((t1 minus t0) plus (t2 minus t3)) divided by 2, and the round-trip delay as (t3 minus t0) minus (t2 minus t1). The arithmetic assumes the path takes about the same time in each direction, and under that assumption the travel time cancels out, leaving an estimate of how far the two clocks actually differ. The client nudges its clock toward that offset, repeats, and converges.

## Why it endures

NTP has been running since before 1985, which makes it one of the oldest internet protocols still in daily use. It was built on the [[cs/military-computing/darpa-and-the-funding-of-ai|DARPA]]-funded internet, and the same design carries time across data centers, financial systems, and phone networks today.

## Related Notes

- [[cs/military-computing/gps-control-segment|The GPS Control Segment]], one of the stratum-0 references NTP leans on
- [[cs/military-computing/gps-and-distributed-time|GPS and Distributed Time]], the other side of time as a distributed problem
- [[cs/systems/distributed-consensus|Distributed Consensus]], agreement across unreliable links
- [[cs/systems/network-protocols|Network Protocols]], the layer NTP rides on
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Network Time Protocol," Wikipedia. https://en.wikipedia.org/wiki/Network_Time_Protocol . Supports David L. Mills as designer, the RFC 958 documentation in 1985 and operation since before 1985, the stratum hierarchy, and the offset and round-trip-delay formulas.
- RFC 958, "Network Time Protocol (NTP)," D. Mills, 1985. https://www.rfc-editor.org/rfc/rfc958 . The primary specification.
