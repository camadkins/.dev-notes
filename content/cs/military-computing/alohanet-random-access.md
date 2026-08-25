---
title: ALOHAnet and Random Access
description: How a network across the Hawaiian islands solved the problem of many senders sharing one channel, and seeded Ethernet and Wi-Fi.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-03-28
updated:
aliases: []
---

The University of Hawaii had a practical problem in the late 1960s. Its campuses sat on different islands, wired connections between them were impractical, and many terminals needed to reach a central computer over radio. They all had to share one channel. If two stations transmitted at the same instant, their signals collided and both messages were lost. The work that began in September 1968 under Norman Abramson, and went operational in June 1971 as ALOHAnet, answered that problem with a scheme so simple it sounds reckless, and that scheme is the root of how [[cs/standards/ieee-802-3-ethernet|Ethernet]] and [[cs/networking/wifi-and-802-11|Wi-Fi]] share a channel today.

> [!note] The idea
> Let every station transmit whenever it has data, detect collisions afterward, and retransmit after a random delay. No coordination, just recovery.

## The pure ALOHA rule

A station with data to send just sends it. It does not listen first and does not wait for a turn. After sending, it waits for an acknowledgement. If the acknowledgement arrives, the message got through. If it does not, the station assumes a collision, waits a random amount of time, and sends again. The random wait is the trick. If two stations collide and both retried immediately, they would collide forever. Random backoff makes it likely that on the retry they pick different moments and one of them succeeds. This is a random-access channel, and it trades guaranteed delivery for needing no coordination at all.

## Slotted ALOHA

Pure ALOHA wastes capacity, because a collision can happen whenever any two transmissions overlap even slightly. A refinement called slotted ALOHA divides time into fixed slots and requires every station to begin only at the start of a slot. Now two messages either share a slot completely or not at all, which halves the window in which a collision can begin and roughly doubles the best-case throughput to [[cs/statistics/poisson-distribution|about 36.8 percent of the channel]].

## The lineage

The pure ALOHA idea, transmit freely and recover from collisions, became the basis for Ethernet's method of sharing a wire and for the random-access behavior in later wireless standards. Robert Metcalfe drew on it directly when he designed Ethernet. The shared-channel problem never went away. Every device on your home network still resolves it with a descendant of the rule Hawaii published in 1971.

## Related Notes

- [[cs/military-computing/link-16-tactical-data-links|Link 16 and Time-Slotted Tactical Data]], the opposite approach, where slots are assigned rather than contended
- [[cs/systems/network-protocols|Network Protocols]], where channel access fits in the stack
- [[cs/systems/distributed-consensus|Distributed Consensus]], another problem of coordination without a central authority
- [[cs/military-computing/paul-baran-and-packet-switching|Paul Baran and the Birth of Packet Switching]], the packet idea ALOHAnet carried over radio
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "ALOHAnet," Wikipedia. https://en.wikipedia.org/wiki/ALOHAnet . Supports the University of Hawaii origin under Norman Abramson, the June 1971 operational date, the random-access rule with retransmission after a collision, the slotted-ALOHA throughput of about 36.8 percent, and the influence on Ethernet and Wi-Fi.
