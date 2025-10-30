---
title: Compilation vs Interpretation
description: How programming languages execute code through compilation, interpretation, or a blend of both models.
draft: false
tags:
  - cs
  - pl
date: 2025-10-18
updated:
aliases: []
---

## Why Execution Models Matter
Every programming language needs a way to run code.  
Some transform source text into machine instructions before execution (compilation), while others execute directly through an evaluator (interpretation).  
Understanding these two models reveals why languages behave differently in performance, portability, and tooling.

Both approaches describe *how meaning is realized* — not what the language means, but **how that meaning becomes behavior on a computer**.

---

## The Compilation Model
A **compiler** translates source code into a lower-level representation — usually machine code or bytecode — before running it.  
This process happens once, ahead of time.

> [!note]
> Compilation is translation. The goal is to replace interpretation at runtime with a precomputed plan that the hardware can follow directly.

### Stages of Compilation
1. **Lexical analysis** – break code into tokens.  
2. **Parsing** – produce an abstract syntax tree (AST).  
3. **Semantic analysis** – ensure type correctness, scope validity, and other static checks.  
4. **Optimization** – improve runtime efficiency while preserving meaning.  
5. **Code generation** – emit target code for a specific machine or virtual machine.

### Advantages
- High performance — code runs natively.  
- Early error detection — most static errors are caught before execution.  
- Easier optimization — compilers can reason globally about the program.

### Limitations
- Slower development cycle when frequent recompilation is required.  
- Less flexibility for dynamic features or runtime metaprogramming.

---

## The Interpretation Model
An **interpreter** executes code directly by reading and evaluating expressions at runtime.  
Instead of producing an independent executable, it simulates program behavior on the fly.

> [!example]
> A simple arithmetic interpreter might:
> 1. Read an expression like `3 + 4 * 2`.  
> 2. Parse it into a tree.  
> 3. Evaluate subexpressions recursively, returning `11`.

### Advantages
- Immediate feedback — ideal for scripting, REPLs, and education.  
- Platform independence — the same interpreter can run code anywhere.  
- Supports reflection, dynamic typing, and runtime code generation.

### Limitations
- Slower execution — evaluation occurs step-by-step at runtime.  
- Runtime errors may appear late, after partial execution.  
- Harder to optimize without ahead-of-time analysis.

---

## Hybrid and Modern Systems
Most real languages mix both models.

> [!tip]
> Compilation and interpretation are *ends of a spectrum*. Modern runtimes move fluidly between them for the best of both worlds.

### Examples
- **Java / Kotlin** – compile to bytecode, interpreted by the JVM, then optimized via JIT.  
- **Python** – compiles to `.pyc` bytecode files, interpreted by a virtual machine.  
- **JavaScript (V8)** – parses and interprets quickly, then compiles “hot” functions at runtime.  
- **C#** – compiled to IL (Intermediate Language), executed on the .NET CLR.

These systems demonstrate that execution models are design decisions, not fixed categories.

---

## Abstract Machines and Virtual Runtimes
Both compiled and interpreted languages rely on **abstract machines** — formal intermediaries that define what “execution” means.

- Compilers target abstract machines like the **LLVM IR** or **JVM bytecode**.  
- Interpreters implement abstract semantics directly, often using stack or register machines (e.g., CEK, SECD, or VMs).

> [!note]
> Abstract machines separate semantics from hardware. They make language implementation portable and formally analyzable.

For example, the Java Virtual Machine behaves like a stack-based interpreter for bytecode, even though its code was compiled. The boundary between “compiled” and “interpreted” is often just *when and where* translation happens.

---

## Key Trade-offs
| Goal | Compilation | Interpretation |
|------|--------------|----------------|
| **Performance** | Native speed after compilation | Slower due to runtime evaluation |
| **Flexibility** | Less dynamic; fixed binary | High; code can change at runtime |
| **Error discovery** | Early (compile-time) | Late (runtime) |
| **Portability** | Depends on target platform | Often portable via common VM |
| **Tooling** | Better for static analysis | Better for rapid prototyping |

---

## Real-World Considerations
Language designers pick execution strategies based on priorities:
- If **speed and static safety** matter → compilation dominates (C, Rust, Go).  
- If **flexibility and rapid iteration** matter → interpretation prevails (Python, Ruby).  
- Many modern systems aim for **hybrids** — fast startup with adaptive optimization.

> [!warning]
> Don't confuse compilation with static typing or interpretation with dynamic typing.  
> A language can be statically typed yet interpreted (e.g., TypeScript in dev mode), or dynamically typed yet compiled (e.g., LuaJIT).

---

## See also
- [[abstract-machines-cek-secd|Abstract Machines — CEK and SECD]]
- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics — Big-Step & Small-Step]]
- [[cs/pl/history-genealogy-of-languages|History & Genealogy of Languages]]
