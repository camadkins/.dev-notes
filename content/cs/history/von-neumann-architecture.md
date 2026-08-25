---
title: Von Neumann Architecture
description: The stored-program concept, fetch-decode-execute cycle, and how a 1945 design report shaped every general-purpose CPU that followed.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-12
updated:
aliases: []
---

## Intuition

Early electronic computers like ENIAC were programmed by physically rewiring patch cables - changing the program meant changing the hardware. John von Neumann's key insight, documented in the 1945 "First Draft of a Report on the EDVAC," was to store both **instructions and data in the same memory**. This one idea made computers reprogrammable by software alone and established the template that virtually every general-purpose processor still follows.

Picture a machine with a single memory bank, a processing unit that can do arithmetic and logic, and a control unit that reads instructions from memory one at a time. That is the von Neumann architecture - and it is still, at its core, how your laptop works.

---

## Core Idea

### The Stored-Program Concept

Before von Neumann, "program" and "data" lived in different worlds. The stored-program concept unifies them:

- Instructions are encoded as numbers and stored in the same memory as the data they operate on.
- A program counter (PC) tracks which instruction to execute next.
- Programs can modify themselves (or other programs) because [[cs/pl/macros-and-metaprogramming|code is just data in memory]].

This unification is what makes general-purpose computing possible. A single machine can run any program without physical reconfiguration.

### Components of the Architecture

The classic von Neumann machine has five subsystems:

1. **Memory (Main Store)** - [[cs/dsa/arrays|a linear array of addressable cells]], each holding a fixed-width word. Stores both instructions and data.
2. **Arithmetic-Logic Unit (ALU)** - performs arithmetic operations (add, subtract, multiply) and logical operations (AND, OR, NOT, comparisons).
3. **Control Unit (CU)** - fetches instructions from memory, decodes them, and orchestrates the ALU, memory, and I/O accordingly.
4. **Input** - [[cs/systems/io-devices-and-drivers|devices that feed data into memory]] (keyboard, card reader, network interface).
5. **Output** - devices that present results (display, printer, network interface).

The CPU encompasses the ALU and CU. Modern processors add registers, caches, pipelines, and multiple cores, but the conceptual model remains von Neumann's.

### The Fetch-Decode-Execute Cycle

Every instruction passes through three phases:

1. **Fetch** - The CU reads the instruction at the address held in the program counter, then increments the PC.
2. **Decode** - The CU interprets the instruction's opcode and operands, determining which ALU operation to perform and which memory addresses or registers are involved.
3. **Execute** - The ALU carries out the operation; results are written back to a register or memory.

This cycle repeats indefinitely (or until a halt instruction). Branch instructions modify the PC, enabling loops and conditionals. The cycle is the heartbeat of every conventional processor.

![The fetch-decode-execute cycle: the control unit fetches an instruction, decodes it, the ALU executes it, then the program counter advances and the cycle repeats.](cs/history/assets/fetch-decode-execute.svg)

### The Von Neumann Bottleneck

Because instructions and data share the same memory bus, the CPU must alternate between fetching instructions and fetching/storing data. This creates a bandwidth limitation called the **von Neumann bottleneck** - the processor can compute faster than it can move data to and from memory.

Modern mitigations include:

- **[[cs/systems/memory-hierarchy-and-caching|Cache hierarchies]]** (L1, L2, L3) that keep frequently used data close to the CPU.
- **Pipelining** - overlapping fetch, decode, and execute stages of successive instructions.
- **Harvard-style separation** at the cache level (separate instruction and data caches) while maintaining a unified main memory.
- **Prefetching and branch prediction** to reduce stalls.

> [!note]
> The Harvard architecture (separate instruction and data memories) is a true alternative, used in some DSPs and microcontrollers. Most modern CPUs are "modified Harvard" - unified main memory but split caches.

### From EDVAC to Modern CPUs

The lineage from von Neumann's report to today's processors:

- **1945 - EDVAC report**: First formal description of stored-program architecture.
- **1948 - Manchester Baby**: First machine to run a stored program from electronic memory.
- **1951 - UNIVAC I**: The first US computer designed from the outset for business and administrative use (an earlier US stored-program machine, EDVAC, was completed around 1949 for scientific work).
- **1960s–70s - Minicomputers and microprocessors**: The architecture shrinks onto fewer chips (Intel 4004, 1971).
- **1980s–present - RISC vs CISC, multicore, out-of-order execution**: Massive performance gains while preserving the stored-program abstraction.

Every step added layers of optimization, but the programmer's mental model - sequential instructions operating on shared memory - remains von Neumann's.

---

## Example

**Tracing a simple addition through the cycle:**

Suppose memory contains the instruction `ADD R1, R2, R3` at address 0x0010, meaning "add the contents of R2 and R3, store the result in R1."

1. **Fetch**: CU reads the word at address 0x0010 into the instruction register. PC becomes 0x0014 (next instruction).
2. **Decode**: CU recognizes the `ADD` opcode, identifies source registers R2 and R3, and destination register R1.
3. **Execute**: ALU receives the values from R2 and R3, computes their sum, and writes it to R1. Status flags (zero, carry, overflow) are updated.

The cycle then repeats for the instruction at 0x0014. This mechanical rhythm - fetch, decode, execute - is the same whether the instruction is an addition, a branch, or a memory load.

---

## Related Notes

- [[cs/history/turing-and-computability|Turing & Computability]] - the theoretical model that von Neumann's hardware realizes
- [[cs/history/unix-and-open-source|Unix & Open Source]] - the software layer built atop stored-program machines
- [[cs/history/history-of-the-internet|History of the Internet]] - networking connects von Neumann machines into a global system

## Sources

- "Von Neumann architecture," Wikipedia. https://en.wikipedia.org/wiki/Von_Neumann_architecture . Supports the origin in von Neumann's 1945 "First Draft of a Report on the EDVAC," the stored-program concept (instructions and data share one memory), the components (ALU, control unit, memory, input/output), and the von Neumann bottleneck as named by John Backus in his 1977 ACM Turing Award lecture.
- "Manchester Baby," Wikipedia. https://en.wikipedia.org/wiki/Manchester_Baby . Supports the Manchester Baby (SSEM) running the first stored program on 21 June 1948.
- "UNIVAC I," Wikipedia. https://en.wikipedia.org/wiki/UNIVAC_I . Supports the 1951 UNIVAC I as the first US computer designed at the outset for business and administrative use, and notes EDVAC (completed around 1949) as an earlier US stored-program machine built for scientific use.
- "Intel 4004," Wikipedia. https://en.wikipedia.org/wiki/Intel_4004 . Supports the 1971 release (15 November 1971) of the Intel 4004 as an early single-chip microprocessor.
