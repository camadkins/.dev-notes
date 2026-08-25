---
title: The ENIAC Programmers and the Invention of Programming
description: How six women made the Army's ballistics computer actually compute, and invented the work of programming in the process.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-02-06
updated:
aliases:
  - ENIAC programmers
---

When ENIAC was finished in the mid 1940s it could calculate an artillery trajectory faster than any machine before it. It could also do nothing at all until someone worked out, in complete detail, how to make it. There was [[cs/history/fortran-and-high-level-languages|no programming language]], [[cs/history/operating-system-concept-batch-to-interactive|no operating system]], and no manual. The people who figured it out were six women, and in doing so they turned a pile of switchable hardware into a computer and invented programming as a distinct kind of work.

> [!note] The idea
> Programming is an activity distinct from the hardware: how to compute something is a problem in its own right, separate from the wiring that carries it out.

## The machine and the task

ENIAC was designed by John Mauchly and J. Presper Eckert to calculate artillery firing tables for the United States Army's Ballistic Research Laboratory. The need was the same one behind the Army's earlier hand computation: every gun and shell required a table of thousands of trajectories, and the war wanted them faster than humans could produce them.

## The six

The original programmers were Kay McNulty, Betty Jennings, Betty Snyder, Marlyn Wescoff, Fran Bilas, and Ruth Lichterman. Because programming languages did not yet exist, they learned the machine by studying its blueprints, tracing how its units passed numbers and signals to each other, so they could plan a calculation the hardware could actually carry out.

## What programming meant then

A program was not text. It was a physical configuration, set up by plugboard wiring and three portable function tables. Getting a program into ENIAC by manipulating its switches and cables could take days. The women broke each calculation into steps the machine could execute in sequence, set the machine to match, and then found and fixed the errors when a run came out wrong. Setup, sequencing, and debugging, which are still the core of software work, all started here.

## Why it counts

Their real invention was conceptual. [[cs/history/von-neumann-architecture|They separated the program from the machine]], treating how to compute something as a problem in its own right, distinct from the wiring that carried it out. That separation is what makes software a thing at all, and it existed in practice before there was a word for it.

## Related Notes

- [[cs/military-computing/ballistics-tables-and-eniac|Ballistics Tables and ENIAC]], the machine and the firing-table problem it served
- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], the stored-program idea that would replace plugboard setup
- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms]], the later vocabulary for what they were doing by hand
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "ENIAC," Wikipedia. https://en.wikipedia.org/wiki/ENIAC . Supports the six primary programmers and their names (Kay McNulty, Betty Jennings, Betty Snyder, Marlyn Wescoff, Fran Bilas, Ruth Lichterman), the design by Mauchly and Eckert to compute artillery firing tables for the Army's Ballistic Research Laboratory, the absence of programming languages, and the setup by plugboard wiring and function tables that could take days.
