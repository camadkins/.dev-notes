---
title: Fortran and the High-Level Language
description: How Fortran proved a compiler could turn human-readable code into machine code efficient enough to replace assembly, opening the high-level era.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-04-25
updated:
aliases:
  - Fortran
  - high-level language
---

In the 1950s, [[cs/pl/levels-of-artificial-languages|programming meant assembly language]]: writing the processor's own instructions by hand. Fortran changed that. It proved [[cs/pl/compilation-vs-interpretation|a compiler could turn human-readable code into machine code]] efficient enough that even the assembly programmers would accept it.

> [!note] The idea
> Write in a high-level notation close to ordinary mathematics, and let a compiler translate it into efficient machine instructions. The programmer thinks in formulas; the machine still receives optimized code.

## The IBM team

Fortran was developed at IBM by a team led by John Backus, and it first appeared in 1957, with the first compiler delivered that April. The goal was a practical alternative to assembly for [[cs/standards/ieee-754-floating-point|the numerically intensive work scientists and engineers needed]].

## Why it mattered

The open question of the day was whether a compiler could generate code good enough to compete with hand-written assembly. Fortran's compiler did, and that settled the argument: it produced code efficient enough for assembly programmers to accept a high-level replacement. Fortran is the oldest high-level language still in common use, which is a measure of how completely it won.

## The lineage

Fortran built on the idea [[cs/military-computing/grace-hopper-and-the-compiler|Grace Hopper]] had championed, that the machine should do the translating. It opened the door to every language that followed, the family traced in [[cs/pl/history-genealogy-of-languages|the genealogy of languages]], beginning with its near contemporary, [[cs/history/lisp-and-functional-programming|Lisp]].

## Related Notes

- [[cs/military-computing/grace-hopper-and-the-compiler|Grace Hopper and the Compiler]], the idea Fortran proved at scale
- [[cs/history/lisp-and-functional-programming|Lisp and Functional Programming]], its very different sibling
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]], the mechanism underneath
- [[cs/pl/history-genealogy-of-languages|History and Genealogy of Languages]], where Fortran sits
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Fortran," Wikipedia. https://en.wikipedia.org/wiki/Fortran . Supports Fortran's development at IBM by a team led by John Backus, its first appearance in 1957 with the first compiler delivered in April 1957, and that it produced code efficient enough for assembly programmers to accept a high-level replacement.
