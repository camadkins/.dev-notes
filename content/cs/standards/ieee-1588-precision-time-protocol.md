---
title: "IEEE 1588 and the Precision Time Protocol"
description: "PTP as a specification. The clock hierarchy it defines, the profiles that keep one standard usable across four industries, and why its accuracy claim is really a requirement on hardware rather than on the algorithm."
draft: false
comments: true
tags:
  - cs
  - standards
  - distributed-systems
date: 2026-08-05
updated:
aliases:
  - PTP
  - Precision Time Protocol
---

The algorithm at the heart of the Precision Time Protocol is not clever. A reference clock announces the time, a follower notes when the announcement arrived, and the two exchange a second pair of messages to estimate how long the network took. That is the same round-trip estimate [[cs/military-computing/ntp-distributed-clock-synchronization|NTP]] has used since the 1980s, and on paper there is no reason it should be a thousand times more accurate. The gap between the two protocols is almost entirely a matter of what the standard requires of everything the message touches on its way through.

> [!note] The idea
> IEEE 1588 buys its accuracy by moving the timestamp closer to the wire and by making the switches in between confess how long they held the packet. The specification is written so that a device with timestamping silicon and a device without it can both conform, and so that the difference shows up in a message you can see: an implementation that cannot stamp the transmit time inside the `Sync` message has to send a `Follow_Up` message afterward carrying the real value. The protocol on the wire is a public record of which parts of your network have hardware support.

## What the standard claims

The IEEE Standards Association scope statement for the current edition is terse. The standard defines a protocol "that provides precise synchronization of clocks in packet-based networked systems," and it "supports synchronization accuracy and precision in the sub-microsecond range with minimal network and local computing resources." One sentence further along, it says sub-nanosecond time transfer accuracy can be achieved in a properly designed network.

That last clause is the one to read twice. "Properly designed" is doing enormous work, and the standard is honest about it: the project scope explicitly says the protocol "specifies how corrections for path asymmetry are made, if the asymmetry values are known." If the path from reference to follower is longer in one direction than the other, and nobody has measured the difference, the round-trip estimate splits the error evenly and is wrong by half the asymmetry. No amount of protocol can recover that. It is a physical property of the cabling and the queues.

## The clock hierarchy

The standard describes an architecture for clock distribution consisting of one or more network segments and one or more clocks, organized into a small vocabulary of device types. An ordinary clock has a single network connection and is either the source of or the destination for a synchronization reference. A boundary clock has multiple network connections and synchronizes one network segment to another. The root timing reference for the whole domain is called the grandmaster, elected rather than configured, which is what the standard means when it says default profiles permit simple systems to be installed and operated without the need for user management.

The 2008 edition added the piece that makes the whole design work in a real switched network: the transparent clock. It modifies PTP messages as they pass through the device, correcting the timestamps for the time spent traversing the network equipment. That is the standardized answer to queueing delay. Rather than trying to estimate a switch's residence time from outside, the standard requires the switch to measure it and write the correction into the packet. A network of transparent clocks turns a variable, load-dependent delay into a known quantity carried alongside the data.

The rest of the accuracy budget goes to where the timestamp is taken. Not all reference clocks can present an accurate timestamp in the `Sync` message, because it is only after transmission completes that some implementations can retrieve the true send time from their network hardware. Those implementations send a `Follow_Up` message to convey it. Devices with PTP capability built into their network hardware can put the accurate timestamp in the `Sync` message itself and skip the `Follow_Up` entirely. Everything else being equal, that one difference, software timestamp in the kernel versus hardware timestamp at the MAC, is the difference between milliseconds and nanoseconds.

## Where it beats NTP, in the designers' own words

John Eidson, who led the 1588-2002 standardization effort, put the positioning plainly: IEEE 1588 "is designed for local systems requiring accuracies beyond those attainable using NTP," and "is also designed for applications that cannot bear the cost of a GPS receiver at each node, or for which GPS signals are inaccessible." That is a specific niche between two existing answers, not a general replacement for either. Wide-area synchronization over the public internet is still NTP territory, because PTP's model assumes you control the switches. A submarine hull, an aircraft, or a substation is precisely where [[cs/military-computing/gps-and-distributed-time|a GPS-derived time reference]] cannot reach every node, and that is where the protocol earns its keep.

The time scale differs too. Unix time is based on Coordinated Universal Time and is subject to leap seconds, while PTP is based on International Atomic Time, which has none. A protocol whose entire purpose is a monotonic, uniformly spaced tick cannot be built on a scale that occasionally repeats a second.

## Profiles, the mechanism that keeps it one standard

Customization is supported by means of profiles, and profiles are the reason IEEE 1588 has not fragmented into four incompatible protocols. Several have been defined for applications including telecommunications, electric power distribution, and audiovisual uses. A profile fixes the options, message rates, and transport for one industry while leaving the core protocol untouched, which lets a telecom deployment and a power-substation deployment both claim conformance to the same document without pretending their requirements are the same.

The most consequential adaptation lives outside the 1588 numbering entirely. IEEE 802.1AS is an adaptation of PTP, called gPTP, for use with Audio Video Bridging and Time-Sensitive Networking, which puts precision time inside [[cs/standards/ieee-802-the-family-and-its-split|the 802 family]] and therefore inside every bridge that implements TSN.

Transport is deliberately plain. In 1588-2002 all messages were multicast; 1588-2008 added an option for devices to negotiate unicast transmission on a port-by-port basis. Time-critical event messages go to UDP port 319 and general messages to 320, with defined [[cs/networking/multicast-broadcast-anycast|multicast group addresses]] for IPv4, IPv6, and raw Ethernet.

> [!warning] Version compatibility is a real hazard
> IEEE 1588-2008, also known as PTP Version 2, is not backward compatible with the 2002 version. Message rates changed too: under 1588-2002 the reference broadcast is up to once per second, and under 1588-2008 up to ten per second are permitted. Mixing generations on one segment is not a degraded mode, it is a non-working mode, which is why the amendment list on the current edition (1588a through 1588g, published between 2022 and 2024) matters more here than in most standards.

The contrast with [[cs/systems/logical-clocks-lamport-and-vector|logical clocks]] is worth holding onto. Lamport and vector clocks give up on physical time entirely and order events by causality, which is the right answer when you cannot trust the network. PTP takes the opposite bet: constrain the network hard enough, in hardware, and physical time becomes trustworthy again to within a nanosecond. Both are valid engineering, and which one applies is decided by whether you own the switches.

## Related Notes

- [[cs/military-computing/ntp-distributed-clock-synchronization|NTP and Distributed Clock Synchronization]] - the same round-trip estimate without the hardware requirements
- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] - the alternative that abandons physical time instead of fixing it
- [[cs/military-computing/gps-and-distributed-time|GPS and Distributed Time]] - the reference PTP is usually distributing when a grandmaster is traceable
- [[cs/networking/qos-and-traffic-shaping|QoS and Traffic Shaping]] - the queueing delay that transparent clocks exist to cancel
- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] - why 1588 carries six lettered amendments on top of a 2019 base

## Sources

- IEEE SA, "IEEE 1588-2019, IEEE Standard for a Precision Clock Synchronization Protocol for Networked Measurement and Control Systems." https://standards.ieee.org/ieee/1588/6825/ . Backs the scope statement, the sub-microsecond and sub-nanosecond accuracy claims, profiles and default profiles, the path-asymmetry clause, timing domains, conformance requirements, and the published amendment list.
- "Precision Time Protocol," Wikipedia. https://en.wikipedia.org/wiki/Precision_Time_Protocol . Backs the ordinary, boundary, transparent, and grandmaster clock definitions, the Sync and Follow_Up timestamping distinction, the round-trip transit measurement, the Eidson quotation on positioning against NTP and GPS, the TAI time scale, the 802.1AS adaptation, the multicast and unicast transports and port numbers, the 2002 to 2008 incompatibility, and the message-rate change.
