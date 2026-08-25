---
title: The Order of Volatility
description: "Collection order is a forensic decision, not a convenience, because every second of an investigation spends evidence that is decaying at different rates, and the cheapest data to collect is usually the data that will still be there tomorrow."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-02
updated:
aliases: []
---

A running machine is a set of nested clocks, each erasing itself at its own speed. CPU registers turn over in nanoseconds. The ARP cache ages out in minutes. A temporary filesystem survives until reboot. A disk survives until someone overwrites the sectors. Archival media survives until the tape degrades. When an examiner touches that machine, the touch itself consumes some of the fastest clocks, and there is no way to touch nothing. The only available choice is what to spend first.

> [!note] The idea
> Volatility ordering is a **scheduling problem with lossy deadlines**, and its counterintuitive consequence is that the correct first action is the one most likely to alter the system. Reading memory perturbs memory. Waiting for a cleaner method does not preserve the evidence, it destroys it, because the decay continues while you deliberate. The order exists to make the loss deliberate and documented rather than accidental and deniable.

## The canonical list

RFC 3227, published as a best current practice in February 2002, states the rule as a guiding principle of evidence collection: proceed from the volatile to the less volatile. It then gives an example ordering for a typical system, and the list is worth reading as a hierarchy of half-lives rather than as a checklist.

At the top sit registers and cache, which are gone the instant another instruction runs and are effectively uncollectable on a live machine. Below them come routing table, ARP cache, process table, kernel statistics, and memory, all of which live in RAM and die at power-off. Below those are temporary file systems, then disk, then remote logging and monitoring data that is relevant to the system in question, then physical configuration and network topology, then archival media at the bottom.

Two entries in that list are easy to skim past and repay attention. The first is that the [[cs/networking/arp-and-mac-addressing|ARP cache]] and the routing table sit in the same tier as the [[cs/systems/processes-and-threads|process table]]. They are network state, but they are network state stored in volatile kernel memory, and losing them costs you the answer to "what was this box talking to." The second is that remote logging data sits below disk. Logs shipped to a [[cs/security/siem-and-security-logging|central collector]] are the least volatile machine-generated evidence you have, which is precisely why an attacker who cannot reach the collector will focus on the local copies instead.

## Why the ordering is a forensic decision rather than a convenience

The tempting reading is that volatile data should be collected first because it is about to disappear, which is true and shallow. The deeper reason is that the ordering determines what your eventual account of the machine can even be about.

RFC 3227 pairs the ordering with a set of prohibitions that make the reasoning visible. Do not shut down until evidence collection is complete, because much evidence may be lost and the attacker may have altered the startup and shutdown scripts to destroy evidence. Do not trust the programs on the system; run evidence gathering programs from appropriately protected media. Do not run programs that modify the access time of all files on the system. And, memorably, note that when removing external avenues for change, simply disconnecting or filtering from the network may trigger deadman switches that detect when they are off the net and wipe evidence.

Each of those is an ordering constraint in disguise. "Do not shut down first" is a statement that the RAM tier outranks the disk tier. "Do not run tar" is a statement that access timestamps are themselves a tier that a careless collection destroys. The deadman switch warning is the sharpest: the standard containment reflex, pulling the network cable, is a collection action with a destructive side effect, and the order of volatility is what tells you it has to come after the volatile capture rather than before it.

NIST's SP 800-86 gives the same rule in planning language. The collection plan should prioritize the data sources, establishing the order in which the data should be acquired based on the likely value of the data, the volatility of the data, and the amount of effort required. Note that volatility is one of three inputs, not the only one. A slow acquisition of a low-value volatile source can be the wrong call when a fast acquisition of a high-value one is available, and the plan is where that tradeoff gets recorded.

## Clock drift, and why it belongs here

RFC 3227 asks the collector to note the difference between the system clock and UTC, and to indicate for each timestamp whether UTC or local time is used. It repeats the point in the collection steps: record the extent of the system's clock drift.

This looks like housekeeping and is actually the hinge of the entire timeline. Every artifact you will later recover carries a timestamp generated by a clock you did not control, and the moment you correlate two machines you are implicitly claiming their clocks agreed. If the drift is not recorded during collection, it cannot be recovered afterward, because the evidence of the drift was the running clock and the running clock is gone. Drift is therefore itself a volatile artifact, and it decays at the same rate as the machine's power state. The same problem in distributed systems produces [[cs/systems/logical-clocks-lamport-and-vector|logical clocks]], which sidestep wall time entirely. A forensic examiner does not get that option, because a court wants to know when, not merely in what order.

> [!example] A live Windows host, in order
> Photograph the screen and record the wall-clock time against a known-good reference. Capture physical memory, which takes the registers tier off the table but preserves process, network, and credential state. Collect the volatile operating system data that memory alone will not decode cleanly, such as the routing and ARP tables. Only then remove the machine from the network. Only then decide between a clean shutdown and pulling power, knowing that one runs shutdown scripts an attacker may have modified and the other loses anything not yet flushed to disk. Image the disk last, because the disk is the only tier that will still be there in an hour.

> [!warning] The list is an example, not a specification
> RFC 3227 presents its ordering as an example order of volatility for a typical system. It predates smartphones, SSDs with background garbage collection, and cloud instances whose underlying storage vanishes with the instance. The principle survives the examples. The specific tiers must be re-derived for each platform, which is exactly what the per-platform arc of this section is for.

## Related Notes

- [[cs/forensics/memory-acquisition|Memory Acquisition]] is the top of this list in practice, and the note explains why capturing it is never a clean snapshot.
- [[cs/forensics/chain-of-custody|Chain of Custody]] records the ordering decisions this note describes, which is what makes them defensible later.
- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] is where recorded clock drift is finally spent.
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] is the same tiering read as a performance structure rather than an evidentiary one.
- [[cs/security/incident-response-lifecycle|The Incident Response Lifecycle]] contains the containment step whose reflex this ordering deliberately delays.
- [[cs/military-computing/ntp-distributed-clock-synchronization|NTP and Distributed Clock Synchronization]] is the machinery that makes cross-host timestamps comparable when it is running, and whose absence makes drift recording mandatory.

## Sources

- [RFC 3227, Guidelines for Evidence Collection and Archiving](https://www.rfc-editor.org/rfc/rfc3227.html) backs the volatile-to-less-volatile principle, the example ordering, the prohibitions on shutdown and on trusting local programs, the deadman switch warning, and the clock drift requirements.
- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the three-input prioritization of data sources by value, volatility, and effort.
