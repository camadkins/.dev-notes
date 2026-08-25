---
title: The IMP, the First Router
description: How the box BBN built to sit between each ARPANET host and the network became the first router.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-02-06
updated:
aliases:
  - IMP
---

When the ARPANET was being built at the end of the 1960s, the hard part was not [[cs/systems/physical-layer-of-the-internet|the long-distance lines]]. It was the question of what sits at each site between a local computer and the network. The host computers of the day were expensive, incompatible, and busy. Asking each one to also handle routing for everyone else was a bad plan. Bolt Beranek and Newman, the firm that won the contract, answered with a separate machine whose only job was to move packets. They called it the Interface Message Processor, and it is the direct ancestor of the router.

> [!note] The idea
> A router is a dedicated machine that reads a packet's destination and forwards it onward, independent of the hosts it serves. The IMP was the first of them.

## A computer whose only job was to forward

An IMP was a ruggedized Honeywell DDP-516 minicomputer fitted with special interfaces and software. It did not run user programs. It connected on one side to its local host and on the other to the phone lines reaching the neighboring IMPs. The first one was delivered to Leonard Kleinrock's group at UCLA on 30 August 1969, where it fronted an SDS Sigma 7 host. The IMPs together formed the subnet, a network of forwarding machines underneath the hosts, and that separation is the whole idea. The host worried about applications. The IMP worried about delivery.

## Store and forward

BBN described the IMP plainly as a messenger that would store and forward. A packet arrives. The IMP holds it, checks it, looks at where it is bound, and sends it on to the next IMP along a path toward the destination. No circuit is reserved, and no IMP needs a map of the whole network. Each one makes a local handoff, and the packet hops its way across. If a line is busy or down, the packet waits or takes another hop. This is packet switching turned into hardware.

## Why it counts as the first router

A router is exactly this: a dedicated device that [[cs/networking/routing-and-longest-prefix-match|reads a packet's destination and forwards it toward that destination]], independent of the hosts it serves. The IMP drew that boundary for the first time. Wikipedia's own summary is blunt about the lineage, calling the IMP "the first generation of gateways, which are known today as routers." Every router since has been a faster, smaller version of the machine BBN rolled into UCLA on a hand truck in 1969.

## Related Notes

- [[cs/military-computing/paul-baran-and-packet-switching|Paul Baran and the Birth of Packet Switching]], the idea the IMP made physical
- [[cs/military-computing/arpanet-survivable-communications|ARPANET and Survivable Communications]], the network the IMPs built
- [[cs/military-computing/internetworking-prnet-satnet|Cerf, Kahn, and the Internetworking Problem]], what happened when IMP subnets had to meet other networks
- [[cs/systems/network-protocols|Network Protocols]], the rules the forwarded packets obey
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Interface Message Processor," Wikipedia. https://en.wikipedia.org/wiki/Interface_Message_Processor . Supports BBN as builder, the ruggedized Honeywell DDP-516 basis, the first delivery to UCLA on 30 August 1969 with an SDS Sigma 7 host, the store-and-forward role, and the description as the first generation of gateways known today as routers.
