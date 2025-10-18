---
title: Language Overview — Syntax vs Semantics
description: What makes a programming language precise, unambiguous, and machine-interpretable.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
---
## Why
Programming languages must be **precise** and **unambiguous** so machines can interpret them reliably.

## Core definitions
- **Syntax**: which strings are well-formed (grammars → ASTs).
- **Static semantics**: constraints like declarations/types beyond raw syntax.
- **Dynamic semantics**: what programs *mean* when executed/evaluated.

> [!tip] Separation of concerns
> Define forms with grammars; define meaning with typing/evaluation rules.

## Idea
Keep syntax lean; push well-formedness (types/scopes) and behavior (evaluation) to semantics layers.

## Pitfalls
- Encoding semantics inside grammar rules (hard to maintain, brittle).
- Treating parser conflicts as semantic issues (often orthogonal).

## Mini-example
Grammar `e ::= n | e + e | e * e`. Precedence/associativity (via levels/EBNF) avoids two parses of `1 + 2 * 3`.

## Diagram
![Syntax vs semantics split: grammar→AST vs typing/eval→behavior](/cs/pl/assets/syntax-semantics-split.svg "Syntax → AST; Semantics → Behavior")

## See also
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]]
- [[cs/pl/type-systems-goals-guarantees|Type Systems — Goals & Guarantees]]

## Next
- [[cs/pl/index|Programming Language Concepts]]