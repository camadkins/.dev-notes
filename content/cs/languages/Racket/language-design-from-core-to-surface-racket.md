---
title: Racket — From Core to Surface
description: Macro expansion and desugaring from surface language into a small core with precise semantics.
draft: true
tags:
  - cs
  - languages
  - racket
date: 2025-10-24
updated:
aliases: []
# potential-diagram: pipeline Source → Macro Expander → Desugared Core → Evaluator
---

## Why
Racket separates **surface syntax** (macros, convenient forms) from a **core language** with well-defined semantics.  
Programs are **expanded** (desugared) before evaluation.

## Core vs Surface
- **Surface**: rich syntax via macros, domain-specific extensions.
- **Core**: a small set of forms with precise semantics (easy to reason about).

## Desugaring pipeline
    Source (surface) → macro expansion → Core forms → evaluation

## Tiny desugar example (schematic)
    (when c e)   ⇒   (if c (begin e) (void))

## Notes
- Macro expansion runs **before** evaluation.
- Reasoning about programs happens at the **core** level; surfaces are convenience layers.

**See also**
- [[cs/pl/lambda-calculus-evaluation-strategies|Lambda Calculus — Evaluation Strategies]]
- [[cs/languages/racket/index|Racket]]
