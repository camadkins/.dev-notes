---
title: Babbage's Engines and Ada Lovelace
description: How a Victorian inventor designed a general-purpose programmable machine, and Ada Lovelace wrote the first program for it, a century before electronics.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-05-15
updated:
aliases:
  - Analytical Engine
  - Ada Lovelace
  - Note G
---

A full century before electronic computers, Charles Babbage designed a general-purpose programmable machine, and Ada Lovelace wrote the first program for it. Neither was ever built in their lifetimes, but the ideas were exactly right.

> [!note] The idea
> Separate the machine from the program. Babbage's Analytical Engine was general-purpose, and Lovelace saw that a program, an algorithm with loops and variables, is a thing in its own right, distinct from the hardware that runs it.

## The Analytical Engine

Babbage's Analytical Engine was a proposed general-purpose mechanical computer, distinct from his earlier, single-purpose Difference Engine. Lovelace likened it to the Jacquard loom, which was directed by punched cards, and that analogy is apt: the cards carried the instructions, separate from the machine itself. A general machine plus an exchangeable program is the architecture of computing.

## Note G

In 1843 Lovelace published Note G, [[cs/dsa/recurrence-relations|an algorithm to compute Bernoulli numbers]] on the Analytical Engine. It is generally considered the first algorithm written specifically for a computer, which is why Lovelace is remembered as the first computer programmer. Note G has the shape of real code: it loops, [[cs/dsa/dynamic-programming|it reuses intermediate results]], it operates on [[cs/dsa/arrays|indexed variables]].

## Why it matters

The idea that a machine could be general, and directed by a program you swap out rather than rebuilt, is the idea every computer rests on. It would be realized electronically a century later in the [[cs/history/von-neumann-architecture|stored-program computer]]. The Defense Department's [[cs/military-computing/ada-and-language-standardization|Ada programming language]] is named in Lovelace's honor.

## Related Notes

- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], where the stored program became real
- [[cs/military-computing/ada-and-language-standardization|Ada and Language Standardization]], the modern language named for Lovelace
- [[cs/history/al-khwarizmi-and-the-algorithm|Al-Khwarizmi and the Algorithm]], the concept Lovelace put into code
- [[cs/pl/history-genealogy-of-languages|History and Genealogy of Languages]], where programming languages begin
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Note G," Wikipedia. https://en.wikipedia.org/wiki/Note_G . Supports Ada Lovelace's Note G (published 1843) as an algorithm to calculate Bernoulli numbers using Babbage's Analytical Engine, its standing as generally considered the first algorithm specifically for a computer with Lovelace as the first computer programmer, and the Analytical Engine as a general-purpose machine directed by punched cards.
