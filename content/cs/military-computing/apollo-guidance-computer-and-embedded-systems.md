---
title: The Apollo Guidance Computer
description: How the computer that flew to the Moon defined embedded real-time computing, and proved its design by surviving an overload during the first landing.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-04-30
updated:
aliases:
  - Apollo Guidance Computer
  - AGC
---

A guidance computer for Apollo had two demands that pull against each other. It had to be small and light enough to fly on a spacecraft, and it had to be reliable enough to trust with the lives of the crew. The Apollo Guidance Computer, built at the MIT Instrumentation Laboratory under Charles Stark Draper, met both, and in doing so it defined what an embedded real-time computer is.

> [!note] The idea
> Embedded real-time computing: do the critical work on time in a small, rugged package, and when overloaded, shed the least important tasks instead of failing.

## Small enough to fly

To save weight and space, the AGC was among the first computers built on silicon [[cs/military-computing/minuteman-guidance-and-integrated-circuits|integrated circuits]], at a time when those chips were new and costly. Its programs were not stored in ordinary memory but woven by hand into core rope memory, where the path of a wire through or around a [[cs/military-computing/whirlwind-and-core-memory|magnetic core]] encoded a bit. The result was a computer that fit on a spacecraft and held its program permanently.

## Priority scheduling

What made the AGC trustworthy was how it handled time and overload. It ran a small [[cs/history/operating-system-concept-batch-to-interactive|real-time operating system]] built around an executive and [[cs/systems/process-scheduling-algorithms|a priority-driven scheduler]]. Tasks ran in order of importance, and when more work arrived than the computer could finish, it did not seize up. It shed the least important tasks and kept the critical ones running on time.

## The 1202 alarms

That design was tested in the most public way possible. During the Apollo 11 landing, the AGC was pushed past its capacity and began raising [[cs/systems/interrupts-and-traps|1201 and 1202 program alarms]]. Because of its priority scheduling, it automatically dropped the low-priority work, kept the guidance and control tasks running, and the landing went on. A lesser design would have hung at exactly the wrong moment.

## The pattern it set

The AGC is the model for embedded real-time computing: do the critical work on time, and when overloaded, degrade gracefully instead of failing. That principle runs through flight controllers, medical devices, and engine computers today.

## Related Notes

- [[cs/military-computing/minuteman-guidance-and-integrated-circuits|Minuteman Guidance and the Integrated Circuit]], the other program that drove early chips
- [[cs/systems/processes-and-threads|Processes and Threads]], scheduling and preemption in general
- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]], the industry these programs seeded
- [[cs/software-engineering/testing-strategies|Testing Strategies]], the discipline ultra-reliable software demands
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Apollo Guidance Computer," Wikipedia. https://en.wikipedia.org/wiki/Apollo_Guidance_Computer . Supports the MIT Instrumentation Laboratory origin under Charles Stark Draper, the use of silicon integrated circuits, core rope memory, the priority-scheduled real-time executive, and the graceful recovery from the 1201 and 1202 alarms during the Apollo 11 landing.
