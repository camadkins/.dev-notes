---
title: Grammar Ambiguity & Parse Trees
description: How ambiguity arises in grammars, how to visualize it with parse trees, and how to refactor rules using precedence and associativity.
draft: false
comments: true
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagram: grammar_ambiguity_parse_trees.svg - show two parse trees for "a + b * c" and a refactored unambiguous grammar with precedence layers.
---

## Why Ambiguity Matters
An ambiguous grammar allows multiple valid parse trees for the same input string - meaning the language can’t assign a single, deterministic meaning.  
In compilers, ambiguity is fatal: the parser cannot decide which structure to build, and downstream stages (like semantic analysis or code generation) may interpret the same program differently.

> [!note]
> Ambiguity is a property of the grammar, *not* the language itself.  
> Some languages can be described by both ambiguous and unambiguous grammars - it’s the grammar’s job to enforce unique structure.

---

## Derivations and Parse Trees
A grammar defines how to build valid sentences by applying **production rules** from a start symbol.  
Each complete derivation can be visualized as a **parse tree**.

- **Leftmost derivation:** always expand the leftmost nonterminal first.  
- **Rightmost derivation:** expand the rightmost first.  
- For an *unambiguous grammar*, both yield the same parse tree for every string.

> [!example]
> **Grammar**
> ```
> E → E + E | E * E | ( E ) | id
> ```
> **Input:** `a + b * c`  
> Two valid trees exist:
> 1. `(a + b) * c`
> 2. `a + (b * c)`  
> This grammar is ambiguous because both trees produce the same string but with different structure.

---

## Diagram - Ambiguous Parse Trees
The diagram (`grammar_ambiguity_parse_trees.svg`) should show:
1. Two trees side by side for `a + b * c`:  
   - Left tree: `E → E + E → (a + b) * c`  
   - Right tree: `E → E * E → a + (b * c)`  
2. Highlight operator nodes (`+` and `*`) and show how precedence changes structure.  
3. Below, a clean refactored grammar layering precedence levels (`Expr`, `Term`, `Factor`).

This visual reinforces that ambiguity arises from unclear operator precedence and associativity.

---

## Fixing Ambiguity - Precedence and Associativity
To eliminate ambiguity, we split the grammar by operator *precedence* and define *associativity* explicitly.

### Precedence Hierarchy
```

Expr → Expr + Term | Expr - Term | Term  
Term → Term * Factor | Term / Factor | Factor  
Factor → ( Expr ) | id | num

```
- Operators defined lower bind tighter (`*` before `+`).  
- Each nonterminal level corresponds to one precedence group.  
- Parentheses reintroduce explicit grouping.

### Associativity
The recursion direction determines grouping order:
- **Left-associative:** `Expr → Expr + Term`  → groups left to right.  
- **Right-associative:** `Pow → Base ^ Pow`  → groups right to left.

> [!tip]
> Associativity resolves *ties* within the same precedence level.  
> Precedence resolves *conflicts* between levels.

---

## Alternative Forms
| Form | Example | Ambiguity |
|------|----------|------------|
| Infix | `a + b * c` | Ambiguous without rules |
| Prefix | `+ a * b c` | Unambiguous |
| Postfix | `a b c * +` | Unambiguous and easier for machines |

Prefix and postfix forms avoid ambiguity by encoding precedence directly in syntax.

---

## Classic Example - Dangling Else
A textbook case of ambiguity:
```

Stmt → if Expr then Stmt | if Expr then Stmt else Stmt | other

```
For:
```

if E1 then if E2 then S1 else S2

```
Two parses are possible:
1. Else matches inner `if`
2. Else matches outer `if`

### Solution
Add an optional nonterminal:
```

Stmt → if Expr then Stmt OptElse | other  
OptElse → else Stmt | ε

```
Now the structure is deterministic: each `else` matches the closest unmatched `if`.

> [!note]
> Parser generators like YACC or ANTLR use *disambiguation rules* (like associativity or precedence declarations) to enforce this automatically.

---

## Sources of Ambiguity
1. **Operator precedence gaps** - multiple rules compete for the same syntax.  
2. **Overlapping productions** - shared prefixes that create multiple derivations.  
3. **Implicit optionality** - missing explicit `ε` productions can lead to multiple parses.  
4. **Grammar extensions** - adding new rules without revisiting existing ones can silently reintroduce ambiguity.

> [!warning]
> Parser tools often choose one parse arbitrarily without warning.  
> Always check grammar ambiguity manually or with diagnostic flags (`-Wall` in ANTLR, `--ambiguity` in Bison).

---

## Practical Guidelines
1. **Design for hierarchy:** organize grammars by operator precedence early.  
2. **Check associativity:** make it explicit for every binary operator.  
3. **Use parentheses liberally:** they anchor precedence clearly.  
4. **Visualize parse trees:** ambiguity is easier to see than to reason about abstractly.  
5. **Validate with examples:** ambiguous grammars often fail at predictable edge cases.

> [!tip]
> Ambiguity is a design smell - it hints your grammar doesn’t communicate intent clearly.  
> A clean grammar is one whose structure mirrors how programmers naturally think about the language.

---

## Related Notes
- [[grammars-notation-bnfebnf|Grammars - BNF & EBNF]]
- [[cfg-design-refactoring|CFG Design & Refactoring]]
- [[programming-paradigms-models-of-computation|Programming Paradigms & Models of Computation]]