---
title: The Ford Rangekeeper and Analog Fire Control
description: How the Navy solved a brutal real-time targeting problem with gears and cams, a working computer that was never digital.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-03-04
updated:
aliases:
  - Ford rangekeeper
  - Mark 1 Fire Control Computer
---

Long before the Navy had digital computers at sea, it had a computer that solved one of the hardest real-time problems in warfare: where to aim a gun on a moving, rolling ship to hit a moving target with a shell that takes most of a minute to arrive. The Ford Mark 1 Fire Control Computer did it with gears, cams, and shafts, and it is a clear window into what computation looked like before it went digital.

> [!note] The idea
> Analog computation. Instead of representing numbers as digits, the machine represented them as physical quantities, the angle of a shaft or the position of a cam, and let the motion of the mechanism carry out the mathematics continuously.

## The problem

The ship, its gun, and the target are all moving, and the shell flies for many seconds. Hitting requires continuously computing a lead angle, where to aim ahead of the target, and correcting for gravity, wind, and the way a spinning shell drifts. Doing that by hand, fast enough and accurately enough, is hopeless. It had to be mechanized.

## A mechanical computer

The Mark 1 was [[cs/history/antikythera-mechanism-analog-computation|an electromechanical analog computer]], developed by Hannibal C. Ford of the Ford Instrument Company. It automatically computed the lead angles and added corrections for gravity, relative wind, and the magnus effect, the drift of a spinning shell. It was electrically linked to the gun mounts and drove them toward the solution it computed.

## Continuous, not stepwise

A [[cs/history/von-neumann-architecture|digital computer]] works in discrete steps. The rangekeeper's shafts and gears [[cs/math/limits-and-continuity|turned continuously, so its answer updated smoothly the instant any input changed]], with no stepping at all. That continuity is the defining trait of analog computation. The Mark 1 was reliable enough to serve from World War II up to 1991 and possibly later.

## What it teaches

The word computer did not always mean digital. For decades the dominant form of real-time computing was analog: [[cs/pl/programming-paradigms-models-of-computation|a physical mechanism arranged to be a working model of a mathematical relationship]]. The rangekeeper is one of the finest examples, and a reminder that the digital computer won a contest it did not start out leading.

## Related Notes

- [[cs/military-computing/ballistics-tables-and-eniac|Ballistics Tables and ENIAC]], the same targeting math taken digital
- [[cs/military-computing/naval-tactical-data-system|The Naval Tactical Data System]], the Navy's later digital combat computing
- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], the digital model that displaced analog
- [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]], the mathematics a rangekeeper mechanized
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Mark I Fire Control Computer," Wikipedia. https://en.wikipedia.org/wiki/Mark_I_Fire_Control_Computer . Supports the Mark 1 as an electromechanical analog computer developed by Hannibal C. Ford of the Ford Instrument Company, its automatic computation of lead angles with corrections for gravity, relative wind, and the magnus effect, its electrical link to the gun mounts, and its U.S. Navy service from World War II up to 1991 and possibly later.
