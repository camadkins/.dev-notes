---
title: The Microprocessor
description: How putting a whole CPU on a single chip made the computer a commodity component cheap enough to embed in anything.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-02-08
updated:
aliases:
  - microprocessor
  - Intel 4004
---

By 1971 you could put many components on a chip. Intel's question was whether you could put a whole central processing unit on one. The answer, the Intel 4004, turned the computer from a cabinet of boards into a commodity part cheap enough to embed in almost anything.

> [!note] The idea
> Integrate the entire [[von-neumann-architecture|CPU]], the arithmetic unit, registers, and control, onto a single chip. The processor stops being a machine you build and becomes a component you buy.

## The 4004

Released on 15 November 1971, the Intel 4004 was the first commercial microprocessor, a complete CPU on one chip with about 2,300 transistors. It came together from Ted Hoff's proposal for a simpler architecture, the design work of Stanley Mazor and Masatoshi Shima, and Federico Faggin's [[cs/geopolitics/semiconductor-supply-chains|silicon-gate implementation]] that fit it all onto a single die.

## Why it changed everything

A CPU on a chip is cheap, small, and easy to embed. The same kind of part that ran a calculator could run a cash register, [[cs/military-computing/apollo-guidance-computer-and-embedded-systems|a car's engine controller]], or a personal computer. Computing escaped the machine room and spread into ordinary objects, which is the world we live in now.

## The lineage

The microprocessor is the [[the-integrated-circuit|integrated circuit]] applied to the processor itself, and [[moores-law|Moore's law]] is why each new generation packed in more transistors and ran faster. The instruction-set stability that lets one software base survive across those generations is the idea the [[ibm-system-360|System/360]] introduced.

## Related Notes

- [[the-integrated-circuit|The Integrated Circuit]], the technology the microprocessor is built from
- [[von-neumann-architecture|Von Neumann Architecture]], the CPU model placed on the chip
- [[moores-law|Moore's Law]], why microprocessors kept improving
- [[ibm-system-360|The IBM System/360]], the instruction-set-as-contract idea
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Intel 4004," Wikipedia. https://en.wikipedia.org/wiki/Intel_4004 . Supports the 4004's release on 15 November 1971 as the first commercial microprocessor, a complete CPU on a single chip with about 2,300 transistors, designed by Faggin, Hoff, Mazor, and Shima.
