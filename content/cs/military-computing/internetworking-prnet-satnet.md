---
title: Cerf, Kahn, and the Internetworking Problem
description: How connecting a wired, a radio, and a satellite network forced the invention of the gateway and TCP/IP.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-06-01
updated:
aliases:
  - Internetworking
  - PRNET
  - SATNET
---

By the mid 1970s the United States had built more than one packet network, and they had nothing in common. The [[arpanet-survivable-communications|ARPANET]] ran over leased telephone lines. PRNET carried packets by radio. SATNET crossed the Atlantic by satellite. Each had its own packet sizes, error rates, and speeds. The military wanted them to behave as a single network, so that a message could start on one and finish on another. The work of making that happen, led by Vint Cerf and Bob Kahn, produced the design the whole internet still runs on.

> [!note] The idea
> Put a machine at each boundary, a gateway, that forwards packets between networks without caring how either works inside, and let reliability live at the endpoints rather than in the networks.

## The gateway

The first move was to stop trying to make the networks alike. Instead Cerf and Kahn put a machine at each boundary, a gateway, whose job was to forward packets from one network into the next without caring how either worked inside. A packet leaving the radio network hit a gateway, which repackaged its outside envelope for the wired network and sent it on. The history of the period records the payoff directly: once gateways existed "it became possible to exchange traffic with other networks independently from their detailed characteristics, thereby solving the fundamental problems of internetworking."

## Reliability at the edges

The second move was to decide where reliability lives. Cerf and Kahn's 1974 paper, "A Protocol for Packet Network Intercommunication," put it at the endpoints rather than inside the networks. The networks would do their best to deliver packets and would not promise much. The sending and receiving hosts would detect loss, reorder, and retransmit. This is the end-to-end principle, and it is why a packet network can be cheap and unreliable in the middle while the connection still feels solid. In 1978 the original protocol was split, with the Internet Protocol handling addressing and forwarding and the Transmission Control Protocol handling the reliable stream on top.

## The 1977 demonstration

The proof came on 22 November 1977. A packet left a Packet Radio Van run by SRI, crossed the radio network, passed through the ARPANET, went out over the Atlantic satellite network to a node in London, and came back, traveling across three different networks as if they were one. Internetworking was no longer a paper argument. The line from that test runs straight to every connection your devices make across cellular, fiber, and satellite links today.

## Related Notes

- [[imp-the-first-router|The IMP, the First Router]], forwarding inside one network
- [[dod-model-and-tcp-ip-standardization|The DoD Model and the TCP/IP Flag Day]], how this design became the standard
- [[paul-baran-and-packet-switching|Paul Baran and the Birth of Packet Switching]], the packet idea underneath it all
- [[network-protocols|Network Protocols]], the layered rules in general
- [[history-of-the-internet|History of the Internet]], the wider story
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Internet protocol suite," Wikipedia. https://en.wikipedia.org/wiki/Internet_protocol_suite . Supports the Cerf and Kahn 1974 paper and the 1978 split of the protocol into TCP and IP.
- "History of the Internet," Wikipedia. https://en.wikipedia.org/wiki/History_of_the_Internet . Supports the existence of PRNET and SATNET, the gateway solving the internetworking problem, and the three-network demonstration of 22 November 1977.
