---
title: Compilation vs Interpretation
description: Edit–compile–run vs direct execution; where optimization and feedback happen.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
---
## Why
How source becomes behavior: ahead-of-time codegen vs stepwise execution by an interpreter.

## Core distinctions
- **Compilation**: translate whole program → machine/bytecode; fast run, slower cycle; strong global optimization.
- **Interpretation**: execute constructs directly; slower run, fast feedback & debugging.
- **Hybrids**: bytecode + JIT blur the line.

> [!tip] Design lever
> Choose based on deployment constraints, feedback needs, and optimization budget.

## Mini-example
Same `sum` program: compiled to native (fast runtime) vs interpreted in a REPL (fast iteration).

## Diagram
![Two pipelines: compile→machine vs interpret; feedback loops and optimization points](/cs/pl/assets/compile-vs-interpret.svg "Compilation and interpretation pipelines")

## See also
- [[cs/pl/levels-of-artificial-languages|Levels of Artificial Languages]]
- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms & Models]]

## Next
- [[cs/pl/index|Programming Language Concepts]]