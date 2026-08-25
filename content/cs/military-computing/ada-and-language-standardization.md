---
title: Ada and Language Standardization by Mandate
description: How the Defense Department fought a sprawl of hundreds of languages by designing one strongly typed language and requiring it.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-05-30
updated:
aliases: []
---

By the mid 1970s the Defense Department had a software sprawl problem. Hundreds of programming languages were in use across its projects. Every language meant its own [[cs/pl/compilation-vs-interpretation|compilers]], its own training, and its own tooling, and code written in one could not be shared with another. The fix the DoD chose was unusual and characteristically direct: design a single language well enough to cover the work, then require it.

> [!note] The idea
> Standardization by mandate: design one strongly typed language well enough to cover the work, then require it, collapsing a sprawl of incompatible languages into a single standard.

## The working group

In 1975 the High Order Language Working Group formed to reduce that count. Rather than crown an existing language, it wrote a detailed list of requirements and ran a competition among proposals. The winning design became Ada, [[cs/history/babbage-engines-and-lovelace|named for Ada Lovelace]].

## Built for large, long-lived, critical systems

Ada was shaped by what military software has to be: large, long-lived, and unforgiving of error. It is [[cs/pl/type-systems-goals-guarantees|strongly typed]], so the compiler rejects whole categories of mistakes before the program ever runs. It has explicit concurrency built into the language, [[cs/pl/concurrency-models-threads-locks-and-actors|with tasks and synchronous message passing]], rather than bolted on through libraries. The bias throughout is to catch problems early, where they are cheap, instead of in the field, where they are not.

## MIL-STD-1815

The reference manual was approved on December 10, 1980, which is Ada Lovelace's birthday, and [[cs/standards/standards-in-procurement-and-defense-acquisition|given the number MIL-STD-1815]] in honor of her birth year. A language standard with a date and a number turned Ada from a design into a mandate.

## Did the mandate work

It did. The number of high-level languages in use across DoD projects fell from over 450 in 1983 to 37 by 1996. Requiring one strongly typed standard, rather than hoping the field would converge on its own, actually collapsed the sprawl it was built to fight.

## Related Notes

- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]], the strong typing Ada leans on
- [[cs/pl/history-genealogy-of-languages|History and Genealogy of Languages]], where Ada sits in the family
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models]], the tasking Ada builds in
- [[cs/pl/modules-signatures-and-separate-compilation|Modules and Separate Compilation]], the large-system features Ada targets
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Ada (programming language)," Wikipedia. https://en.wikipedia.org/wiki/Ada_(programming_language) . Supports the High Order Language Working Group formed in 1975, the strong typing and explicit concurrency, the MIL-STD-1815 reference manual approved December 10, 1980 on Ada Lovelace's birthday, and the fall in DoD project languages from over 450 in 1983 to 37 by 1996.
