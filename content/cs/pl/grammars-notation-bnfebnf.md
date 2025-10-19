---
title: Grammars & Notation (BNF/EBNF)
description: Specify syntax with CFGs using BNF/EBNF; terminals vs nonterminals.
draft: false
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# potential-diagram: production graph illustrating recursion and precedence levels
---

## Why
Grammars define the *atomic structure* of programs — the building blocks from which all computations are composed.  
They describe how *basic symbols* (tokens) form valid **sentences** in a language.

Every programming language has an associated grammar defining valid syntax.  
A sentence (program) is *syntactically correct* if it conforms to that grammar.

---

## Syntax vs Semantics
- **Syntax**: The *structure* or *form* of a language.  
  - Wrong syntax → invalid sentence.  
  - Correct syntax ≠ guaranteed meaning.
- **Semantics**: The *meaning* or behavior of syntactically valid sentences.  
  - Semantics depend on syntactic structure.

> Programming languages must be **precise**, **unambiguous**, and **machine-interpretable** — unlike natural language.

---

## Core definitions
A grammar `G` = (T, N, S, P):
- **T**: Terminals (symbols in the actual program text)
- **N**: Nonterminals (syntactic categories like `<Expr>`, `<Stmt>`)
- **S**: Start symbol (root category)
- **P**: Production rules defining how symbols expand

**Example (BNF):**
```bnf
<expr> ::= <expr> "+" <term> | <term>
<term> ::= <term> "*" <factor> | <factor>
<factor> ::= "(" <expr> ")" | <id> | <num>
```

This describes arithmetic expressions that support nesting and operator precedence.

---

## Informal vs Formal Grammar
| Type | Description | Example |
|------|--------------|----------|
| Informal | English-like, intuitive but ambiguous | “A binary number is a sequence of 0s and 1s.” |
| Formal | Symbolic and precise | `<X> → 0 | 1<X>` |

Formal grammars remove ambiguity and enable mechanical validation by compilers and interpreters.

---

## Context-Free Grammars (CFG)
A **Context-Free Grammar (CFG)** is a 4-tuple `(T, N, S, P)`:
- **T**: Terminals  
- **N**: Nonterminals  
- **S**: Start symbol  
- **P**: Production rules where each rule replaces a *single* nonterminal.

CFGs define **languages** that allow nested structure (crucial for programming languages).

Example:
```
T = {0, 1}
N = {X}
S = X
P:
  1. X → 0
  2. X → 1
  3. X → 0X
  4. X → 1X
```
Language: all binary strings.

---

## Derivations
A **derivation** is the process of applying production rules to generate valid strings:
```
X ⇒ 0X ⇒ 01X ⇒ 010
```

A program `P` is syntactically valid **iff** its token sequence belongs to the language `L(G)` produced by grammar `G`.

> [!example] Grammar for real numbers
> ```
> Terminals: {0–9, +, -, .}
> Nonterminals: Real, Part, Digit, Sign
> Start: Real
> Productions:
>   1. Real → SignPart.Part | SignPart
>   2. Sign → + | -
>   3. Part → Digit | DigitPart
>   4. Digit → 0 | 1 | … | 9
> ```

---

## Role in computation models
- In **imperative** languages → grammar defines statements and control flow.
- In **functional** languages → grammar defines expressions and bindings.
- In **logic** languages → grammar defines predicates and facts.

Grammars formalize *syntax-level composition*; computation models formalize *semantic-level execution*.

---

## Chomsky Hierarchy (Types of Grammars)
| Type | Description | Example use |
|------|--------------|--------------|
| Type 3 — Regular | Simple patterns (regex, scanners) | Tokenization |
| Type 2 — Context-Free | Nested syntax (CFG) | Programming languages |
| Type 1 — Context-Sensitive | Context constraints | Type systems (theoretical) |
| Type 0 — Unrestricted | Most general | Turing Machines |

---

## Pitfalls
- **Left recursion** breaks top-down parsers.  
- **Ambiguity** creates multiple valid parse trees.  
- **Over-generalization** makes grammars permissive but meaningless.  
- **Missing base case** → infinite recursion.

---

## TODOs
- Visualize production graph.  
- Add FIRST/FOLLOW note for parser design.  
- Include an example of left-recursion elimination.

---

**See also**
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]]
- [[cs/pl/cfg-design-refactoring|CFG Design & Refactoring]]
- [[cs/pl/index|Programming Language Concepts]]
