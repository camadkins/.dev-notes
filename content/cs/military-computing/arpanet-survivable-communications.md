---
title: ARPANET and Survivable Communications
description: How the Defense Department turned packet switching from a paper idea into the first wide-area network, the technical ancestor of the internet.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-01-18
updated:
aliases:
  - ARPANET
---

[[paul-baran-and-packet-switching|Packet switching]] began as an argument on paper about how a network could survive a nuclear strike. ARPANET is where that argument became a running network. Funded by the Defense Department's Advanced Research Projects Agency, it was the first large packet-switched network, and it is [[cs/history/history-of-the-internet|the direct technical ancestor of the internet]].

> [!note] The idea
> Build the survivable, packet-switched network that the theory described, and see it work. ARPANET is the bridge from the concept of packet switching to the global network that grew out of it.

## From idea to hardware

The intellectual groundwork was already laid. Paul Baran's RAND studies argued for distributed networks that [[cs/networking/routing-and-longest-prefix-match|route messages as independent blocks]], and packet switching gave a way to do it. ARPA funded the project to actually build such a network among research institutions, turning a survivability concept into wires, machines, and [[cs/systems/network-protocols|protocols]].

## The first nodes

The first node was established at UCLA in 1969. On 29 October 1969 the first host-to-host message was sent across the network, from UCLA to the Stanford Research Institute. The system crashed partway through the word "login," so the first message ever sent was "lo," before the connection came back. The network was declared operational in 1971.

## The forwarding subnet

ARPANET did not ask its host computers to handle routing. Between each host and the network sat a dedicated machine, the Interface Message Processor, that stored and forwarded packets. That machine, the subject of the [[imp-the-first-router|IMP]] note, is the ancestor of the router.

## Toward the internet

ARPANET was one network. Connecting it to others, packet radio and satellite networks, forced the invention of [[internetworking-prnet-satnet|gateways and TCP/IP]], and the [[dod-model-and-tcp-ip-standardization|standardization]] that followed turned a research network into the foundation of the internet.

## Related Notes

- [[paul-baran-and-packet-switching|Paul Baran and the Birth of Packet Switching]], the idea ARPANET realized
- [[imp-the-first-router|The IMP, the First Router]], the machine that ran the network
- [[internetworking-prnet-satnet|Cerf, Kahn, and the Internetworking Problem]], what came next
- [[history-of-the-internet|History of the Internet]], the wider story
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "ARPANET," Wikipedia. https://en.wikipedia.org/wiki/ARPANET . Supports ARPANET as an ARPA-funded network, the first node established at UCLA in 1969, the first host-to-host message between UCLA and the Stanford Research Institute on 29 October 1969 (with the first transmitted characters being "lo"), and the network being declared operational in 1971.
