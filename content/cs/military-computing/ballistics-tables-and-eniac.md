---
title: Ballistics Tables and ENIAC
description: How the wartime demand for artillery firing tables produced the first general-purpose programmable electronic computer.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-02-02
updated:
aliases:
  - ENIAC
---

Every artillery piece needs a firing table: for a given gun, shell, and charge, what elevation lands the round on target, under the conditions of the day. Each table demanded [[cs/math/integrals-and-the-fundamental-theorem|thousands of trajectory calculations]], and in the Second World War they were worked out by hand. That backlog is what produced ENIAC, the first general-purpose programmable electronic computer.

> [!note] The idea
> Programmability. The leap from a machine or a person that computes one fixed thing to a general-purpose machine that can be set up to compute any problem.

## The firing-table problem

A firing table is not one calculation but thousands, one trajectory after another, sweeping across ranges and conditions. Before ENIAC this work was done by human computers, many of them women, at the Army's Ballistic Research Laboratory, and a single trajectory could take a person many hours. As the war demanded more guns and more tables, the human pipeline could not keep up.

## ENIAC

ENIAC was designed by John Mauchly and J. Presper Eckert to calculate artillery firing tables for the United States Army's Ballistic Research Laboratory. It was electronic, [[cs/history/the-transistor|built from thousands of vacuum tubes]], and far faster than anything before it. But [[cs/history/fortran-and-high-level-languages|programming languages did not yet exist]], so a problem was set up in the machine by a combination of plugboard wiring and portable function tables, a physical configuration that could take days to arrange.

## What changed

The deep shift was that one machine could be reconfigured to compute any problem, rather than being built to do a single fixed thing. That is programmability, and it is the property that makes a general-purpose computer general. The people who worked out how to express a calculation in ENIAC's switches and cables, the subject of the [[cs/military-computing/eniac-programmers-and-the-first-software|ENIAC programmers]] note, were inventing the activity of programming as they went.

## Legacy

ENIAC's clumsy patch-cable setup pointed directly at the next idea: storing the program in memory alongside the data, which became the [[cs/history/von-neumann-architecture|von Neumann architecture]] that every later machine followed. And ENIAC itself did not stop at firing tables. Within a few years it was running the first [[cs/military-computing/monte-carlo-method-and-the-bomb|Monte Carlo]] calculations for nuclear weapons design, the same machine turned to an entirely different problem, which is exactly what programmability makes possible.

## Related Notes

- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], the stored-program idea ENIAC's setup motivated
- [[cs/military-computing/eniac-programmers-and-the-first-software|The ENIAC Programmers]], who made the machine compute
- [[cs/military-computing/ford-rangekeeper-analog-fire-control|The Ford Rangekeeper]], the analog way of solving targeting math
- [[cs/military-computing/monte-carlo-method-and-the-bomb|Monte Carlo and the Bomb]], ENIAC put to a new use
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "ENIAC," Wikipedia. https://en.wikipedia.org/wiki/ENIAC . Supports ENIAC's design by Mauchly and Eckert to compute artillery firing tables for the Army's Ballistic Research Laboratory, the absence of programming languages, and program setup by plugboard wiring and portable function tables that could take days.
