---
title: The Naval Tactical Data System
description: How the Navy put a real-time combat picture on a computer at sea, fusing many ships' sensors into one shared map, its answer to SAGE afloat.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-03-21
updated:
aliases:
  - NTDS
  - Naval Tactical Data System
---

[[sage-and-real-time-systems|SAGE]] put air defense on a computer ashore, in a building that never moved. The Navy needed the same capability at sea, on a pitching ship, fusing many sensors into one picture fast enough to act on. The Naval Tactical Data System was the answer, and it was the Navy's first step into digital combat systems.

> [!note] The idea
> Take radar and other sensor reports from many ships and aircraft, and in real time combine them into a single shared map of the battlespace, kept current as events unfold.

## The Navy's first digital combat system

The Navy began developing NTDS around [[cs/history/the-transistor|a transistorized digital computer]] in 1956, and first deployed it in the early 1960s. It was a computerized information-processing system at a time when most of the fleet's work was still done by hand, by plot and grease pencil.

## Sensor fusion

The heart of NTDS was combination. It took reports from multiple sensors on different ships and aircraft and collated them into a single unified map of the battlespace. [[cs/statistics/bayesian-inference|Merging many noisy, partial views into one coherent picture]] is sensor fusion, and it remains a central problem in combat systems and in autonomous machines today.

## Sharing the picture

NTDS did not keep that picture on one ship. Over radio data links, ships shared what their sensors gathered, [[cs/systems/consistency-models|so an entire task force could see one common map]] rather than each vessel seeing only what its own radar reached. A shared real-time picture across a moving, distributed group of platforms was a genuinely hard thing to build in the early 1960s.

## Lineage

NTDS is the maritime sibling of SAGE and the ancestor of the Aegis combat system. The standard Navy computers that ran its later versions are the subject of the [[an-uyk-navy-standard-computers|AN/UYK]] note.

## Related Notes

- [[sage-and-real-time-systems|SAGE and Real-Time Systems]], the shore-based system NTDS parallels
- [[an-uyk-navy-standard-computers|The AN/UYK Family]], the computers that ran it
- [[distributed-consensus|Distributed Consensus]], the modern form of keeping a shared picture agreed
- [[network-protocols|Network Protocols]], the data links underneath
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Naval Tactical Data System," Wikipedia. https://en.wikipedia.org/wiki/Naval_Tactical_Data_System . Supports NTDS as a U.S. Navy computerized information-processing system, development begun in 1956 with a transistorized digital computer and first deployed in the early 1960s, its collation of reports from multiple sensors on different ships and aircraft into a single unified map, and the sharing of sensor information between ships over wireless data links.
