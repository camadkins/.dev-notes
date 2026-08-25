---
title: The Integrated Circuit
description: How building whole circuits on one chip of silicon turned logic design into a fabrication problem and launched the chip era.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-02-07
updated:
aliases:
  - integrated circuit
  - microchip
---

A [[cs/history/the-transistor|transistor]] is one switch. A useful computer needs millions of them, plus the wiring between them, and soldering those by hand does not scale. The integrated circuit solved that by building the whole circuit, components and connections together, on a single piece of silicon.

> [!note] The idea
> Monolithic integration. Fabricate the transistors, resistors, and their interconnections together on one chip, so the unit of manufacture is a complete circuit rather than a single part. Building logic becomes a problem of fabrication, not assembly.

## Two inventors

Jack Kilby at Texas Instruments demonstrated the first working integrated circuit on 12 September 1958. About six months later, Robert Noyce at Fairchild Semiconductor developed the first practical monolithic IC, using silicon and the planar process. [[cs/geopolitics/semiconductor-supply-chains|Noyce's version could be mass-produced]], where Kilby's relied on fragile external gold-wire connections, and it is Noyce's approach that the industry built on.

## Why it matters

Integration is what turned the transistor from [[cs/military-computing/anfsq7-and-fault-tolerant-hardware|a better tube]] into the basis of an entire industry. Once a whole circuit could be fabricated on a chip, complexity could grow by improving fabrication rather than by adding parts, which is the engine behind [[cs/history/moores-law|Moore's law]] and, soon after, the [[cs/history/the-microprocessor|microprocessor]].

## The demand behind it

The early integrated circuit was expensive, too expensive for most buyers. What carried it through its infancy was military and space demand, the story told in [[cs/military-computing/minuteman-guidance-and-integrated-circuits|the Minuteman note]]. This note is the invention; that one is the economics that kept it alive until it got cheap.

## Related Notes

- [[cs/history/the-transistor|The Transistor]], the component being integrated
- [[cs/history/the-mosfet|The MOSFET]], the transistor that integrates best
- [[cs/history/the-microprocessor|The Microprocessor]], a whole CPU as one integrated circuit
- [[cs/military-computing/minuteman-guidance-and-integrated-circuits|Minuteman Guidance and the Integrated Circuit]], the demand story
- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]], the modern industry it became
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Integrated circuit," Wikipedia. https://en.wikipedia.org/wiki/Integrated_circuit . Supports Jack Kilby's first working integrated circuit at Texas Instruments on 12 September 1958, Robert Noyce's first practical monolithic IC at Fairchild about six months later using the planar process, and the definition of an integrated circuit as many components and interconnections fabricated on a single chip of semiconductor.
