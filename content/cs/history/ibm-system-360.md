---
title: The IBM System/360 and Computer Architecture
description: How a 1964 family of computers created the idea of the instruction set architecture as a stable contract, separate from how any one machine implements it.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-02-19
updated:
aliases:
  - IBM System/360
  - instruction set architecture
---

Before 1964, buying a bigger computer usually meant rewriting your software for it. IBM's System/360 ended that, and in doing so it created one of the most important ideas in how processors are designed: the separation of architecture from implementation.

> [!note] The idea
> Define an instruction set architecture, the contract of what instructions exist and what they do, and hold it fixed across a whole family of machines. Software written to the contract runs on every model, cheap or expensive, slow or fast.

## A family, one architecture

The System/360, announced on 7 April 1964, was a family of computers that shared a single instruction set. A customer could buy the model that fit a particular need and budget, knowing they could move to a larger model later without losing the programs they already ran. Compatibility across a price range was the radical promise.

## Architecture versus implementation

The design deliberately distinguished architecture, the instruction set the programmer sees, from implementation, how a given model actually realizes it, often using microcode. The same instruction could be wired cheaply in a small model and built for speed in a large one. The contract stayed fixed while the hardware underneath varied.

## Why it endures

This idea, the instruction set as a stable contract, governs processor design to this day. It is why decades of software keep running on new chips, and why [[the-microprocessor|microprocessor]] families like x86 and ARM hold their instruction sets steady while reinventing the silicon beneath them generation after generation.

## Related Notes

- [[the-microprocessor|The Microprocessor]], where the ISA-as-contract idea lives today
- [[von-neumann-architecture|Von Neumann Architecture]], the underlying machine model
- [[virtual-memory|Virtual Memory]], another abstraction the mainframe era refined
- [[cs/history/index|History of Computing]], the section index

## Sources

- "IBM System/360," Wikipedia. https://en.wikipedia.org/wiki/IBM_System/360 . Supports the System/360's 1964 announcement as a family of computers sharing a single instruction set for software compatibility, and its deliberate distinction between architecture and implementation (using microcode), allowing compatible models across a range of prices.
