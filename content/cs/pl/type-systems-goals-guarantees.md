---
title: Type Systems — Goals & Guarantees
description: What well-typed programs can’t do; safety vs expressiveness trade-offs.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
---
## Why
Types rule out classes of runtime errors *by construction*.

## Core definitions
- *Type system*: static/dynamic rules assigning types to phrases.
- *Safety*: no *stuck* states during evaluation (progress + preservation).
- Design axes: static vs dynamic; nominal vs structural; inference vs annotation.

## Idea (soundness sketch)
- *Progress*: a well-typed closed term is a value or can step.
- *Preservation*: if `t : T` and `t → t'` then `t' : T`.  
  Together prevent certain runtime type errors.

# Pitfalls
- Over-restrictive types that block valid programs.
- Confusing runtime checks (dynamic) with compile-time guarantees (static).

## Mini-example
- Typed arithmetic: if `n : Int` and `m : Int` then `n + m : Int`; `true + 1` is rejected statically.

## Diagram
  ![Type soundness: progress & preservation](/cs/pl/assets/type-soundness-progress-preservation.svg)

**See also**
- [[cs/pl/language-overview-syntax-semantics|Language Overview — Syntax vs Semantics]]
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]
- [[cs/pl/index|Programming Language Concepts]]