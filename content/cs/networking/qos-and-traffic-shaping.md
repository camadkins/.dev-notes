---
title: QoS and Traffic Shaping
description: "Why best-effort IP starves real-time traffic under load, how DiffServ marks packets into classes with a 6-bit DSCP, and the shaping-versus-policing choice between delaying excess and dropping it."
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-02-19
updated:
aliases:
  - quality of service
  - DiffServ
  - DSCP
  - traffic shaping
  - policing vs shaping
---

Plain IP is best-effort. Every packet is treated the same, and while the link has spare capacity that is invisible and harmless. The moment a link saturates, queuing delay climbs for everything at once, and that is where the equality becomes a problem. A file download that slows by 30 percent is fine; a voice call that gains 200 milliseconds of jitter is ruined. The two flows want opposite things from the network, and best-effort has no way to tell them apart. Quality of service is the collection of mechanisms that lets a network tell them apart and act on the difference.

> [!note] The idea
> Quality of service is the ability to provide different priorities to different applications, users, or data flows, or to guarantee a certain level of performance to a flow, rather than the achieved quality itself. On IP networks the dominant realization is DiffServ, which stamps each packet with a 6-bit code point so routers apply a per-hop behavior by class. The sharp distinction to hold: shaping and policing both enforce a rate, but shaping *delays* excess traffic by buffering it, while policing *drops* or marks it, which are opposite tools for the same goal.

## What QoS is, and is not

In [[cs/military-computing/paul-baran-and-packet-switching|packet-switched networks]], quality of service refers to traffic prioritization and resource reservation control mechanisms rather than the achieved service quality. It is the ability to give different priorities to different flows, or to guarantee a bit rate, delay, delay variation, or loss rate to a flow. This matters most for real-time streaming multimedia such as voice over IP, multiplayer games, and IPTV, because those require a fairly fixed bit rate and are delay sensitive in a way that bulk transfers are not.

There is an important escape hatch. A best-effort network does not support QoS at all, and the standard alternative to complex QoS machinery is over-provisioning: give the link so much capacity that peak traffic never congests it, and the absence of congestion removes the need for QoS mechanisms in the first place. QoS is what you reach for when capacity is a genuinely limited resource, on a cellular link or a saturated WAN, not when you can simply buy your way out.

## DiffServ and the DSCP

Differentiated services, or DiffServ, is the architecture routers use to classify and manage traffic and provide QoS on modern IP networks. It uses a 6-bit differentiated services code point (DSCP) inside the DS field of the IP header for classification. The DS field replaced the older IPv4 TOS field, and DiffServ has largely supplanted both TOS and the fine-grained IntServ approach as the primary way routers deliver QoS.

The design decision that makes DiffServ scale is where the work happens. It is a coarse-grained, class-based mechanism: rather than tracking individual flows, it places each packet into one of a limited number of traffic classes. The premise is that complicated functions such as classification and policing are done once, at the edge of the network by edge routers, which mark each packet. Core routers then do something cheap: they read the marking and apply a per-hop behavior (PHB), the forwarding treatment associated with that class, using a combination of [[cs/systems/process-scheduling-algorithms|scheduling]] and queue-management policy. Classification is expensive and happens at the border; forwarding by class is cheap and happens everywhere else.

## Policing versus shaping

Both policing and shaping enforce a traffic contract, an agreed rate a flow must stay within, and they differ only in what they do to traffic that exceeds it.

Traffic shaping is a bandwidth-management technique that delays some or all datagrams to bring them into compliance with a desired traffic profile. It is always achieved by delaying packets: excess traffic is buffered and released later at the target rate, smoothing bursts. Traffic policing is the distinct but related practice of packet dropping and packet marking. It monitors traffic for compliance and, where traffic exceeds the contract, may discard the excess immediately, mark it as non-compliant, or leave it, per policy. Shaping buffers and waits; policing drops and moves on.

The choice interacts with [[tcp-congestion-control|TCP]]. Because policing drops packets, a TCP sender treats the loss as congestion and backs off, so policing pushes congestion control to do the rate limiting, at the cost of retransmissions and jitter. Shaping instead holds packets in a buffer, which avoids the drops but adds delay and needs memory. A source that shapes its own output to the contract will not be policed downstream, which is why the two are often deployed as a pair: the sender shapes, the network polices what slips through.

> [!tip] Real-time traffic needs QoS because it cannot wait and cannot resend
> A bulk download tolerates delay and recovers from loss by retransmission. A voice or video stream can do neither: a packet that arrives late is as useless as one that never arrives, and there is no time to ask for it again. That is the whole case for QoS. When a link congests, giving delay-sensitive classes priority in the queue is the only thing that keeps them usable, and over-provisioning aside, marking plus per-hop behavior is how a network delivers that priority.

## Related Notes

- [[tcp-congestion-control|TCP Congestion Control]] - the endpoint feedback loop that policing's drops and shaping's delays both drive
- [[quic-and-udp-transport|QUIC and UDP Transport]] - the transport real-time media favors precisely to escape head-of-line delay
- [[load-balancing-l4-and-l7|Load Balancing, L4 and L7]] - another place classification decides how a packet is treated
- [[routing-and-longest-prefix-match|Routing and Longest Prefix Match]] - the forwarding decision QoS layers priority on top of

## Sources

- "Quality of service," Wikipedia. https://en.wikipedia.org/wiki/Quality_of_service . Backs QoS as traffic prioritization and resource-reservation control (the ability to give different priorities to flows or guarantee a performance level), its importance for delay-sensitive real-time media like VoIP, IPTV, and games, and over-provisioning a best-effort network as the alternative to complex QoS mechanisms.
- "Differentiated services," Wikipedia. https://en.wikipedia.org/wiki/Differentiated_services . Backs DiffServ as the architecture classifying and managing IP traffic for QoS, the 6-bit DSCP in the DS field replacing the IPv4 TOS field, DiffServ as a coarse-grained class-based mechanism, classification and policing done at edge routers while core routers apply per-hop behaviors via scheduling and queue-management policy.
- "Traffic shaping," Wikipedia. https://en.wikipedia.org/wiki/Traffic_shaping . Backs traffic shaping as delaying datagrams to meet a traffic profile (always achieved by delaying packets), its being often confused with traffic policing (the distinct practice of packet dropping and marking), and sources shaping their output to comply with a contract that the network may enforce by policing.
