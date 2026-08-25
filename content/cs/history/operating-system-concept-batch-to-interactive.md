---
title: "From Batch to Interactive: The Operating System"
description: How the operating system grew from a batch clerk into the resource manager behind interactive, time-shared computing.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-02
updated:
aliases:
  - operating system
  - time-sharing
  - batch processing
---

Early computers ran one job at a time, fed in as a batch and collected later. The operating system grew out of the need to manage the machine automatically, and time-sharing turned it from a batch clerk into the interactive systems we use now.

> [!note] The idea
> An operating system is a resource manager. It decides which program runs, parcels out the processor and memory, and, with time-sharing, lets many users share one machine as if each had it alone.

## Batch processing

In the early days a job ran from start to finish while everyone else waited. Letting a user operate the computer directly was generally far too expensive, because the machine would sit idle while the human thought and typed. So jobs were collected, run in sequence, and their output returned hours later.

## Time-sharing

The answer was to give each user [[cs/systems/process-scheduling-algorithms|a small slice of processing time]], [[cs/systems/context-switching|switching among them so rapidly]] that many people interact with one computer at once, [[cs/systems/virtualization-vms-and-containers|each with the illusion of having it to themselves]].

![Time-sharing: one CPU switches among users in fast slices, so each feels alone on the machine.](cs/history/assets/time-slices.svg)

## CTSS and Multics

The first general-purpose time-sharing system usable for software development, CTSS, grew from a 1959 memo by John McCarthy at MIT. From 1964 the [[cs/military-computing/multics-and-time-sharing-foundations|Multics]] system pushed the idea furthest, modeling computing as a utility like electricity, and Multics is the direct parent of [[cs/history/unix-and-open-source|Unix]].

## Why it matters

Time-sharing dramatically lowered the cost of providing computing and made interactive use, and a whole new class of interactive software, possible. The modern operating system, juggling many programs and users on shared hardware, is its descendant.

## Related Notes

- [[cs/military-computing/multics-and-time-sharing-foundations|Multics and the Engineering of Time-Sharing]], the deep dive
- [[cs/history/unix-and-open-source|Unix and Open Source]], Multics's lean descendant
- [[cs/systems/processes-and-threads|Processes and Threads]], how an OS shares the processor
- [[cs/history/engelbart-and-interactive-computing|Engelbart and the Mother of All Demos]], interactive computing's other root
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Time-sharing," Wikipedia. https://en.wikipedia.org/wiki/Time-sharing . Supports time-sharing as the concurrent sharing of a computer by giving each user a small slice of processing time, its replacement of batch processing, CTSS originating from a 1959 memo by John McCarthy at MIT, Multics from 1964 modeled as a computing utility, and time-sharing enabling interactive computing.
