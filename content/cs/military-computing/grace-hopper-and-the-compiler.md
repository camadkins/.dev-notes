---
title: Grace Hopper and the Birth of the Compiler
description: How a Navy officer's conviction that machines should do the translating produced the compiler and the first English-like programming languages.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-02-25
updated:
aliases:
  - Grace Hopper
  - A-0 System
  - FLOW-MATIC
---

In the early 1950s, programming a computer meant writing numeric machine code by hand for one specific machine. Grace Hopper, a U.S. Navy officer who would retire a rear admiral, thought that had it backward. The machine was the thing that was good at tedious, error-prone translation, so the machine should do it. Acting on that conviction, she built some of the first tools that [[cs/pl/compilation-vs-interpretation|turned human-readable instructions into machine code]], and pointed the way to the languages programmers use now.

> [!note] The idea
> Compilation: people should write in a readable, machine-independent language, and a compiler should do the work of translating it into machine instructions.

## A program that writes a program

By 1952 Hopper had finished the A-0 system, which she called a compiler. It took named routines and [[cs/languages/Cpp/translation-units-linkage-and-the-build-model|assembled and linked them into runnable machine code]], so a programmer could call for a routine by name instead of copying its numbers by hand. The idea that a program could prepare another program for the machine was unfamiliar at the time, and it met resistance from people who assumed computers could only do arithmetic.

## Toward English

Hopper pushed past assembling routines toward something a person could simply read. Her department produced FLOW-MATIC, one of the first languages built around English-like statements, so the text of a program described what it did in words rather than in codes.

![Hopper's idea: a person writes readable source, and a compiler translates it into machine code.](cs/military-computing/assets/compiler-flow.svg)

## The line to COBOL

FLOW-MATIC's ideas carried directly into COBOL, the business-oriented language that came to run a large share of the world's banking and administrative software, much of which still runs today. The thread from Hopper's work to a running COBOL payroll system is direct.

## What she actually changed

The durable idea is the one she started with: people should write in a readable, [[cs/languages/common/portability-and-cross-compilation|machine-independent language]], and a compiler should turn that into instructions. Every [[cs/history/fortran-and-high-level-languages|high-level language]] since rests on it.

## Related Notes

- [[cs/pl/history-genealogy-of-languages|History and Genealogy of Languages]], where this fits in the family tree
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]], the mechanism Hopper helped invent
- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], the machine the compiler targets
- [[cs/history/turing-and-computability|Turing and Computability]], the theory of what these machines can do
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Grace Hopper," Wikipedia. https://en.wikipedia.org/wiki/Grace_Hopper . Supports her U.S. Navy service, the A-0 system finished by 1952 which she called a compiler, the development of FLOW-MATIC as an English-like language, and FLOW-MATIC's influence on COBOL.
