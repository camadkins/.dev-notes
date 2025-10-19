---
title: History & Genealogy of Languages
description: From early high-level languages to structured, OO, scripting, and modern multiparadigm lines.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
---
## Why
History explains *why* designs look the way they do: domain needs, hardware, and paradigm shifts.

## Core landmarks
- **1950s–60s**: Fortran (scientific), LISP (AI), ALGOL (structure), COBOL (business).
- **1970s**: Pascal (teaching), C (systems), structured programming.
- **1980s–90s**: OO (Smalltalk, C++), Java (VM portability).
- **1990s+**: scripting/rapid prototyping (Perl, Python, JS); later multiparadigm.

## Early Developments (1940s–1960s)

### Machine and Assembly Languages
- **Machine Language (1940s–50s)** — Programs written directly in binary; extremely error-prone and hardware-specific.  
- **Assembly Language (1950s)** — Introduced symbolic mnemonics (e.g., `ADD`, `MOV`); made low-level coding more readable but still tightly coupled to hardware.

### Rise of High-Level Languages
- **Fortran (1957)** — First high-level language for scientific computation; introduced variables, loops, and subroutines.  
- **LISP (1958)** — Designed for AI research; pioneered recursion and list processing.  
- **FLOW-MATIC (1959)** — Business-oriented; directly influenced COBOL’s English-like syntax.  
- **ALGOL (1960)** — Introduced structured code blocks and scope; ancestor to Pascal and C.  
- **COBOL (1960)** — Standardized business language for data-processing systems.

These languages established the core principles — abstraction, portability, and structured control — that all later paradigms built upon.


## Later Developments (1970s–1990s)

### Structured Programming (1970s)
- **Pascal** — Teaching language emphasizing block structure and disciplined control flow; popularized structured design in curricula.  
- **C** — Portable systems programming language with small runtime and direct memory access; enabled UNIX portability and influenced countless descendants.

### Object-Oriented Programming (1980s)
- **Smalltalk** — Pure object-oriented model; everything is an object and communication happens through message passing; pioneered live IDEs and interactive design.  
- **C++** — Extended C with object-oriented features; aimed for zero-overhead abstractions while maintaining system-level performance.

#### Java & the JVM (mid-1990s)
- **Java (1995)** — Compiles to platform-independent bytecode executed by the JVM. Designed for portability, security, and simplicity — “write once, run anywhere.”

### Scripting & Rapid Prototyping (1990s)
- **Perl, Python, and JavaScript** — Focused on ease of use, flexibility, and productivity over raw execution speed. Introduced dynamic typing, interpreted execution, and fast iteration cycles.

## Genealogy (at a glance)
- ALGOL → **C** → **C++** → **Java**  
- LISP → **Scheme** → influences modern functional languages  
- **Perl, Python, JavaScript** form a scripting lane that powers automation and the web.

## Idea
Genealogy shows **influence lines**, not rankings; many modern languages are multiparadigm.

> [!warning] Pitfall
> Reading genealogy as “better vs worse” instead of “inspired by”.

## Diagram
![Language genealogy timeline with influence edges across domains](/cs/pl/assets/language-genealogy.svg "Compressed genealogy overview")

## Modern Perspective
- Thousands of programming languages exist; there is no single “best” one — each reflects design trade-offs between efficiency, abstraction, safety, and flexibility.  
- Language choice depends on paradigm and domain (systems, business, AI, web, scientific).  
- This course emphasizes understanding **principles** — grammars, interpreters, types, and design — rather than memorizing syntax.

## See also
- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms & Models]]
- [[cs/pl/language-overview-syntax-semantics|Language Overview — Syntax vs Semantics]]

## Next
- [[cs/pl/index|Programming Language Concepts]]