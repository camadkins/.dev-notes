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
# potential-diagram: side-by-side parse trees for 1+2*3 and dangling else
---

## Why
Ambiguous grammars lead to multiple interpretations of the same sentence — making computations undefined or implementation-dependent.  
A parser must yield a *unique parse tree* to ensure consistent semantics.

---

## Parse Trees & Derivations
A **parse tree** is a hierarchical representation of how a string is derived from grammar rules:
- **Root**: start symbol  
- **Internal nodes**: nonterminals  
- **Leaves**: terminals (tokens)

Each application of a production rule adds new branches.

> Semantics are computed from leaves upward — the tree defines structure and therefore meaning.

Example grammar:
```
S → P | S + S | S - S | S * S | S / S
P → D | DP
D → 0 | 1 | … | 9
```

String `1 + 2 + 3` produces *two valid trees* — depending on grouping:
```
(S + S) + S     vs     S + (S + S)
```

---

## Ambiguity definition
A grammar **G** is *ambiguous* if ∃ string `w` that has ≥ 2 distinct parse trees.  
This causes compilers to interpret the same input in multiple ways.

---

## Classic cases
- **Arithmetic precedence:**  
  `"1 + 2 * 3"` → `(1 + 2) * 3` vs `1 + (2 * 3)`
- **Dangling else:**  
  ```
  if x > 0
    if y > 0
      print("A");
    else
      print("B");
  ```
  Which `if` does `else` pair with?

---

## Strategies to eliminate ambiguity
1. Define **precedence** and **associativity** in grammar.  
2. Restrict recursive rules to one direction (left or right).  
3. Introduce explicit grouping (parentheses).  
4. Refactor grammar hierarchy (`Expr → Term | Term + Expr`).

---

## Connection to computation models
Precision in grammar mirrors the precision required in computation models:
- Deterministic parsing → deterministic computation.  
- Ambiguity at syntax level → semantic uncertainty.

---

## Pitfalls
- Hidden ambiguity when adding new constructs.  
- Parser generator defaults may silently alter behavior.  
- Precedence rules vary by tool (Yacc/Bison vs ANTLR).

---

## Mini-example
`1 + 2 * 3`
- Tree A (wrong precedence): `(1 + 2) * 3`
- Tree B (correct precedence): `1 + (2 * 3)`

Ambiguity makes expression evaluation order undefined.

---

## Visualization
![Two parse trees for the same string](/cs/pl/assets/ambiguity-two-parses.svg)

---

**See also**
- [[cs/pl/grammars-notation-bnfebnf|Grammars — BNF & EBNF]]
- [[cs/pl/cfg-design-refactoring|CFG Design & Refactoring]]
- [[cs/pl/index|Programming Language Concepts]]
