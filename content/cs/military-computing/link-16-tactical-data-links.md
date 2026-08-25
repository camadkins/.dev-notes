---
title: Link 16 and Time-Slotted Tactical Data
description: How military platforms share one jam-resistant channel by dividing time into slots, the scheduled opposite of random access.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-05-23
updated:
aliases:
  - JTIDS
  - MIDS
---

A formation of aircraft, ships, and ground stations needs to [[cs/networking/multicast-broadcast-anycast|share one picture of the battlespace]], each contributing its own radar and sensor tracks, all over the same radio band, in the presence of [[cs/security/denial-of-service-and-ddos|an enemy trying to jam them]]. ALOHA's answer, let everyone transmit and recover from collisions, is wrong here, because collisions under jamming are exactly what the adversary wants. Link 16, the tactical data link used across NATO, takes the opposite approach. It schedules.

> [!note] The idea
> Divide time into slots and give each participant its own, so many platforms share one jam-resistant channel without ever colliding. The scheduled opposite of ALOHA.

## Time-division multiple access

Link 16 is built on time-division multiple access, or TDMA. Time is cut into small intervals, and a participant transmits only during the intervals allotted to it. Because no two terminals are sending in the same interval, their transmissions do not collide. Where ALOHA resolves contention after the fact with random backoff, TDMA prevents contention in advance by handing out time.

![Time-division multiple access: each terminal transmits only in its assigned slots, so transmissions never collide.](cs/military-computing/assets/link-16-tdma-slots.svg)

The tradeoff is the mirror image of ALOHA's. A scheduled channel never wastes capacity on collisions and [[cs/networking/qos-and-traffic-shaping|gives predictable timing]], which matters for a weapons system. It pays for that with rigidity, since a slot reserved for a terminal that has nothing to say sits idle.

## Jamming and frequency hopping

Sharing time is only useful if the signal survives contact with an enemy. Link 16 uses [[cs/security/comsec-principles|frequency-hopping spread spectrum]], meaning the transmission jumps rapidly across many frequencies in a pattern known to the friendly terminals. An adversary who does not know the pattern cannot easily jam the whole band or follow a single conversation, which is what makes the link jam-resistant.

## How it is fielded

Link 16 is not a single radio but a service carried by a family of terminals, the Joint Tactical Information Distribution System and its smaller successor, the Multifunctional Information Distribution System. Those terminals are what put TDMA tactical data onto aircraft and ships.

## Related Notes

- [[cs/military-computing/alohanet-random-access|ALOHAnet and Random Access]], the contended counterpart to scheduled access
- [[cs/systems/network-protocols|Network Protocols]], where channel access sits in the stack
- [[cs/military-computing/cyber-warfare-and-the-fifth-domain|Cyber Warfare and the Fifth Domain]], the modern contest over military signals
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Link 16," Wikipedia. https://en.wikipedia.org/wiki/Link_16 . Supports Link 16 as a NATO tactical data link, its TDMA basis, its jam-resistant frequency-hopping spread-spectrum waveform, and its implementation through JTIDS and MIDS terminals. The general definition of TDMA as time-slot sharing is standard. The article does not state that Link 16 is "nodeless," so that claim is omitted.
