---
title: Margaret Hamilton and Ultra-Reliable Software
description: How the engineer who led Apollo's flight software insisted that software was an engineering discipline, and built code that recovered from its own overload during the first Moon landing.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-01-22
updated:
aliases:
  - Margaret Hamilton
---

The software that guided Apollo to the lunar surface had to work the first time it mattered, with astronauts' lives depending on it, running on a computer small enough to fail under load. Margaret Hamilton led the team that wrote it, and she argued, against the assumptions of the day, that producing software like this was an engineering discipline that deserved the name.

> [!note] The idea
> Reliable software is designed for failure: assume things will go wrong, detect when they do, and recover gracefully instead of crashing.

## Leading the flight software

Hamilton directed the Software Engineering Division at the MIT Instrumentation Laboratory, where she led the development of the onboard flight software for NASA's Apollo Guidance Computer. This was the code that ran in the spacecraft, the program the astronauts actually depended on during the mission.

## Naming the field

She began using the term software engineering, she later explained, to distinguish the work from hardware and other kinds of engineering, and to insist that it be treated as [[cs/standards/ieee-12207-software-life-cycle|part of the larger systems-engineering process]] rather than as an afterthought. At the time, the claim that software warranted an engineering discipline of its own was not widely accepted.

## Designing for failure

Her software was built around [[cs/pl/exceptions-handlers-and-non-local-control|error detection and recovery]] rather than the hope that nothing would go wrong. That design was tested in public during the Apollo 11 landing. The guidance computer became overloaded and raised the 1201 and 1202 alarms. [[cs/systems/interrupts-and-traps|The display-interrupt design]] Hamilton's team had built was able to push the critical information to the astronauts in place of their normal displays, so the people and the machine both kept working through the overload and the landing continued.

## The principle

The lesson underneath it is the one that defines reliable real-time software: assume things will go wrong, detect when they do, and recover gracefully instead of failing. That principle, engineered into the code rather than left to luck, is what kept the first Moon landing on track.

## Related Notes

- [[cs/military-computing/apollo-guidance-computer-and-embedded-systems|The Apollo Guidance Computer]], the machine her software ran on
- [[cs/military-computing/nato-conferences-and-software-engineering|The NATO Conferences and the Software Crisis]], where the field formalized the term she used
- [[cs/software-engineering/testing-strategies|Testing Strategies]], the discipline of proving software works
- [[cs/systems/processes-and-threads|Processes and Threads]], the scheduling and priority her design relied on
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Margaret Hamilton (software engineer)," Wikipedia. https://en.wikipedia.org/wiki/Margaret_Hamilton_(software_engineer) . Supports her leadership of the onboard Apollo flight software at the MIT Instrumentation Laboratory, her use of the term software engineering to distinguish the work, and the error-detection-and-recovery and priority-display design that carried the Apollo 11 landing through the 1201 and 1202 alarms.
