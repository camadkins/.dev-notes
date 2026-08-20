---
title: The MOSFET, the Transistor That Made Chips Possible
description: How a voltage-controlled silicon transistor became the device that scales to billions per chip and runs every processor today.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-04-25
updated:
aliases:
  - MOSFET
---

The first [[the-transistor|transistors]] worked, but they were not easy to pack by the million onto a single chip. The transistor that made that possible, and that runs every processor and memory chip in use today, is the MOSFET.

> [!note] The idea
> The MOSFET is a voltage-controlled switch. A voltage on an insulated gate decides whether current flows in the channel beneath it. Being voltage-controlled and cheap to fabricate in silicon, it is the design that scales to billions of switches on one chip.

## The invention

The first working MOSFET was built by Mohamed Atalla and Dawon Kahng at Bell Labs, proposed in 1959 and demonstrated in 1960. Its defining feature is an insulated gate whose voltage controls the conductivity of the device, so it switches on a voltage rather than a current.

## Why it won

The MOSFET is by far the most common transistor in digital circuits; billions appear in a single memory chip or microprocessor. Its silicon-and-oxide construction is cheap to produce and easy to integrate, which is exactly what mass [[the-integrated-circuit|integration]] demanded. The earlier bipolar transistor was a fine device, but the MOSFET was the one that fabrication could multiply without limit.

## What it enables

MOSFETs are the switches that implement [[boole-and-boolean-algebra|logic gates]] and store bits, by the billion, on every chip. The entire tower of modern computing, and the steady march of [[moores-law|Moore's law]], rests on shrinking this one device.

## Related Notes

- [[the-transistor|The Transistor]], the device the MOSFET refined
- [[the-integrated-circuit|The Integrated Circuit]], where MOSFETs are packed together
- [[moores-law|Moore's Law]], the scaling that shrinking MOSFETs drives
- [[cs/history/index|History of Computing]], the section index

## Sources

- "MOSFET," Wikipedia. https://en.wikipedia.org/wiki/MOSFET . Supports the invention by Mohamed Atalla and Dawon Kahng at Bell Labs (1959-1960), the MOSFET as by far the most common transistor in digital circuits with billions per chip, and its insulated voltage-controlled gate and suitability for integration.
