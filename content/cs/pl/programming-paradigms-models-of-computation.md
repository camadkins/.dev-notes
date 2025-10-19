---
title: Programming Paradigms & Models of Computation
description: How languages organize computation (imperative, functional, logic, OO) and the abstract machines behind them.
draft: false
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# potential-diagram: simple illustration of atomic → composition → abstraction pipeline
---
## Why
Paradigms define *styles of thought* in programming.  
Computation models supply the mathematical foundation for those styles.

---

## Constituents of Programming
- **Atomic computation** – smallest operations the language allows (arithmetic, boolean ops, assignment).  
- **Composition** – sequencing or combining atomic steps (conditionals, loops).  
- **Abstraction** – packaging compositions into reusable units (functions, procedures, objects).

> [!tip] Three C’s  
> **Compute → Compose → Conceal** — the recurring pattern in language design.

---

## Core computation models
| Model | Origin | Foundation | Used by |
|-------|--------|------------|---------|
| **Turing Machine** | 1936 – Turing | stepwise state transitions on tape | Imperative languages |
| **Lambda Calculus** | 1930s – Church | function abstraction & application | Functional languages |
| **Predicate Logic** | 1950s | rule-based inference / proof search | Logic programming |

These models are **equivalent in power** (Church-Turing Thesis) but emphasize different *ways of expressing* computation.

---

## Paradigms overview
- **Imperative** → commands + mutable memory  
- **Functional** → expression evaluation, no side effects  
- **Logic** → goals and rules, proof search  
- **OO** → objects with identity, encapsulated state

| Paradigm | Invariant | Strength | Weakness |
|----------|-----------|----------|----------|
| Imperative | correctness over state transitions | efficient, intuitive | side-effects, mutability |
| Functional | referential transparency | modular, parallel | less natural for stateful tasks |
| Logic | sound inference | declarative clarity | performance, control |
| OO | behavioral contracts | encapsulation | complex hierarchies |

---

## Composition example
    Imperative:
    x = 0
    while x < 5:
        x += 1

    Functional:
    (define (count n) (if (= n 5) 'done (count (+ n 1))))

---

## What makes a good language
- **Simplicity** – few basic constructs, minimal exceptions  
- **Compositional semantics** – parts combine predictably  
- **Portability** – consistent behavior across machines  
- **Maintainability** – avoid redundant constructs  

A “good” design balances *machine efficiency* with *human clarity*.

---

## Why study functional ideas
- Encourage precise, mathematical reasoning.  
- Emphasize immutability → predictable behavior.  
- Facilitate parallelism → no shared mutable state.  
- Reduce ambiguity → clear semantics for evaluation.

---

**See also**  
- [[cs/pl/language-overview-syntax-semantics|Language Overview — Syntax vs Semantics]]  
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]]  
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]  
- [[cs/pl/index|Programming Language Concepts]]