---
title: Pascal, Leibniz, and Mechanizing Arithmetic
description: How two seventeenth-century philosophers proved that calculation could be handed to a machine, and why the carry was the hard part.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-04-19
updated:
aliases:
  - Pascaline
  - Stepped Reckoner
---

In the seventeenth century, two philosophers built machines that did arithmetic. They proved something that seems obvious now and was radical then: [[cs/pl/programming-paradigms-models-of-computation|calculation could be delegated to a deterministic mechanism]] that does not think, only turns.

> [!note] The idea
> Represent numbers as the positions of toothed wheels, and arithmetic becomes the turning of gears. The hard part is the carry, propagating a tens-overflow from one digit to the next, which is exactly the problem a digital adder must solve.

## Pascal's Pascaline

In 1642 Blaise Pascal built an operational mechanical calculator with a reliable tens-carry. Its trick was a weighted mechanism, the sautoir, that stored energy as a wheel turned past nine and released it to nudge the next wheel forward. He built about twenty of the machines.

## Leibniz's Stepped Reckoner

Gottfried Leibniz designed a more capable machine from 1672 and built versions in 1694 and 1706. Its stepped drum let it multiply as well as add, and it introduced a movable carriage of the kind mechanical calculators would use for centuries.

## Why the carry matters

The carry is the genuinely hard part of mechanized arithmetic. Adding two digits is easy; handling [[cs/languages/common/numeric-types-and-overflow-semantics|the overflow that ripples down a row of digits]] is where the engineering lives. That same carry propagation is the heart of [[cs/dsa/bitwise-operations|the binary adder inside every modern processor]]. Pascal and Leibniz were solving, in brass, a problem digital hardware still solves today.

## Related Notes

- [[leibniz-and-binary|Leibniz and Binary]], the number system Leibniz also gave computing
- [[antikythera-mechanism-analog-computation|The Antikythera Mechanism]], an even older computing machine
- [[von-neumann-architecture|Von Neumann Architecture]], where arithmetic finally went electronic
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Mechanical calculator," Wikipedia. https://en.wikipedia.org/wiki/Mechanical_calculator . Supports Pascal's 1642 operational calculator with a tens-carry using the weighted sautoir, Leibniz designing the Stepped Reckoner from 1672 and building versions in 1694 and 1706 with a stepped drum that could multiply and a movable carriage, and the use of gears with carry mechanisms to automate arithmetic.
