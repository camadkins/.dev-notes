---
title: Grammar Ambiguity & Parse Trees
description: Detect when one string has multiple parse trees and how to resolve ambiguity.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
---
## Why:
Ambiguous grammars make semantics unclear; compilers need a *single* parse.

## Core definitions
- *Ambiguity*: ∃ string `w` with ≥2 distinct parse trees.
- Typical fix: precedence/associativity declarations or grammar refactoring.

## Idea (classic cases)
- Arithmetic: ensure `*` > `+`, right precedence/associativity rules.
- *Dangling else*: force `else` to pair with nearest unmatched `if`.

## Pitfalls
- Hidden ambiguity reappears after adding constructs.
- Relying solely on parser defaults (tool-specific behavior).

## Mini-example
- `1 + 2 * 3`  
  - Tree A (wrong precedence): `(1 + 2) * 3`  
  - Tree B (correct precedence): `1 + (2 * 3)`.

## Diagram
  ![Two parse trees for the same string](/cs/pl/assets/ambiguity-two-parses.svg)

**See also**
- [[cs/pl/grammars-notation-bnfebnf|Grammars — BNF & EBNF]]
- [[cs/pl/cfg-design-refactoring|CFG Design & Refactoring]]
- [[cs/pl/index|Programming Language Concepts]]