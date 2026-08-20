---
title: The GPS Control Segment
description: How a master control station and a ring of monitor stations keep a satellite constellation honest, a planet-scale feedback loop.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-04-25
updated:
aliases:
  - GPS control segment
  - GPS ground segment
---

A GPS receiver works by trusting two things about every satellite it hears: that the satellite knows exactly where it is, and that its clock is exactly right. Neither is true on its own. Orbits drift under the tug of the moon and the sun, and atomic clocks, for all their precision, wander. Position fixes good to a few meters depend on someone keeping those satellites honest, and that someone is on the ground. The part of GPS that does it is the control segment, and seen as a system it is a closed feedback loop wrapped around the planet.

> [!note] The idea
> Keep a satellite constellation honest with a feedback loop: measure each satellite's true state from the ground, compute the error, upload a correction, and repeat.

## Monitor, compute, upload

The control segment is made of a master control station, a backup master control station, several ground antennas, and a set of monitor stations spread around the world, in places like Hawaii, Kwajalein Atoll, Ascension Island, and Diego Garcia. The monitor stations do nothing but watch. They track every satellite as it passes and measure where it actually is and what its clock actually reads. That stream of observations flows to the master control station at Schriever Space Force Base in Colorado, operated by the 2nd Space Operations Squadron.

There the real work happens. From the tracking data the station estimates each satellite's true orbit and the true error in its clock, then computes a correction. The ground antennas upload that correction to the satellite, which adjusts its onboard orbital model and steers its clock back into line, held to within a few nanoseconds.

## A control loop the size of the sky

Stated as control theory, the constellation is the plant and the ground segment is the controller. The monitor stations measure the system's state, the master control station compares that state to where the satellites should be and computes the error, and the upload applies a correction. Then the cycle repeats. The accuracy in your phone is not a property the satellites have on their own. It is a property the ground continuously maintains, one estimate and one upload at a time.

## Related Notes

- [[gps-and-distributed-time|GPS and Distributed Time]], how a receiver turns these signals into a position
- [[ntp-distributed-clock-synchronization|NTP and Distributed Clock Synchronization]], the same problem of distributed time on the ground
- [[distributed-consensus|Distributed Consensus]], keeping distributed state agreed and correct
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Global Positioning System," Wikipedia. https://en.wikipedia.org/wiki/Global_Positioning_System . Supports the control segment as a master control station, an alternate master control station, ground antennas, and monitor stations; the master control station at Schriever Space Force Base operated by the 2nd Space Operations Squadron; and the process of monitor stations tracking the satellites while the master control station computes and uploads orbit and clock corrections that hold the satellite clocks to within a few nanoseconds.
