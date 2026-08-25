---
title: ILLIAC IV and Parallel Processing
description: How an ARPA-funded supercomputer made the first serious attempt at doing one operation on many pieces of data at once.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-03-01
updated:
aliases:
  - ILLIAC IV
  - SIMD
---

There are two ways to make a computer faster. One is to build a quicker processor. The other is to [[cs/systems/numa-and-multiprocessor-memory|use many processors that all perform the same operation on different data at the same time]]. ILLIAC IV, funded by ARPA, was the first serious attempt at the second, and it gave the field a model of parallelism that turned out to matter far more than the machine itself.

> [!note] The idea
> SIMD parallelism: a single control unit broadcasts one instruction to many processing elements at once, each applying it to its own slice of data.

## One instruction, many data

The design put a single control unit in charge of a large array of processing elements. The control unit [[cs/history/von-neumann-architecture|read one instruction stream]] and broadcast each instruction to every processing element at once. Each element then carried out that same instruction on its own slice of data.

![A SIMD array: one control unit broadcasts a single instruction to many processing elements, each working on its own data.](cs/military-computing/assets/illiac-iv-simd.svg)

This arrangement is called SIMD, for single instruction, multiple data. It is a poor fit for work full of branches and decisions, since every element must do the same thing. It is a superb fit for work that applies the same operation across a large block of numbers, such as physics simulations and [[cs/math/linear-algebra-fundamentals|linear algebra]].

## Built smaller than planned

ILLIAC IV was designed for 256 processing elements across four quadrants, but budget cuts limited construction to a single quadrant of 64. Even so, it was the first massively parallel computer, and it proved the architecture was real rather than theoretical. In November 1975 it was connected to the [[cs/military-computing/arpanet-survivable-communications|ARPANET]] at NASA Ames, making it [[cs/history/cloud-computing-and-virtualization|an early supercomputer that researchers could reach over a network]].

## Legacy

SIMD did not stay exotic. The same idea, one instruction driving many data lanes, lives inside every modern graphics processor and inside the vector units of ordinary CPUs. ILLIAC IV was the first machine to take it seriously.

## Related Notes

- [[cs/military-computing/cray-1-and-vector-processing|The Cray-1 and Vector Processing]], a different route to data parallelism
- [[cs/military-computing/arpanet-survivable-communications|ARPANET and Survivable Communications]], the network ILLIAC IV joined
- [[cs/math/linear-algebra-fundamentals|Linear Algebra Fundamentals]], the math SIMD accelerates
- [[cs/systems/processes-and-threads|Processes and Threads]], parallelism in the general case
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "ILLIAC IV," Wikipedia. https://en.wikipedia.org/wiki/ILLIAC_IV . Supports the ARPA funding, the SIMD design with one control unit feeding the processing elements, the reduction from 256 designed elements to a single quadrant of 64 built, the description as the first massively parallel computer, and the connection to the ARPANET in November 1975.
