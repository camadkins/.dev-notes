---
title: Grammars - BNF & EBNF
description: Understanding context-free grammar notation, BNF and EBNF syntax, and how they formally define language structure.
draft: false
comments: true
tags:
  - cs
  - pl
date: 2025-10-18
updated:
aliases: []
# diagram: grammar_hierarchy_and_bnf_example.svg - illustrate grammar hierarchy (regular → CFG → CSL → recursive enumerable) and show a BNF vs EBNF comparison with example parse expansion.
---

## Overview
A **grammar** defines the valid sentences of a language - whether natural or programming. In computer science, grammars formally specify how sequences of symbols (like source code) can be constructed.  

BNF (Backus–Naur Form) and EBNF (Extended Backus–Naur Form) are the most common notations used to express **context-free grammars (CFGs)**, which underlie programming languages and most compiler front ends.

> [!note]
> Grammars aren’t just about syntax - they define structure, which allows parsers, compilers, and interpreters to *understand* code rather than just recognize keywords.

---

## Why Grammars Matter
Every programming language, from C to Python to Rust, relies on a grammar to define:
- What constitutes valid syntax.
- How expressions and statements nest.
- How operators and keywords interact.
- How to parse programs automatically.

Without grammars, compiler design would be ad hoc and error-prone.  
A formal grammar gives structure to language design - and guarantees that the same syntax can be recognized by multiple tools consistently.

> [!tip]
> Learning BNF and EBNF helps you not only understand how compilers work but also how to **design DSLs, configuration parsers, and interpreters** - or reason about ambiguity, recursion, and precedence.

---

## Chomsky Hierarchy - Where BNF Fits
Grammars fall into a formal hierarchy based on expressive power:

| Type | Name | Production Form | Recognized By |
|------|------|-----------------|----------------|
| **Type 3** | Regular Grammars | `A → aB` or `A → a` | Finite automata |
| **Type 2** | Context-Free Grammars (CFGs) | `A → α` (A is a single nonterminal) | Pushdown automata |
| **Type 1** | Context-Sensitive Grammars | `αAβ → αγβ` | Linear bounded automata |
| **Type 0** | Unrestricted Grammars | No restrictions | Turing machines |

BNF and EBNF are **notations for Type-2 (context-free) grammars**, which are powerful enough to express programming language syntax while still efficiently parseable.

---

## Grammar Components
A grammar `G` is defined as a 4-tuple:
```

G = (V, Σ, R, S)

```
where:
- **V** → nonterminals (syntactic categories like `<expr>`, `<stmt>`).  
- **Σ** → terminals (tokens such as identifiers, numbers, operators).  
- **R** → production rules (`<expr> ::= <term> | <expr> + <term>`).  
- **S** → start symbol (usually the root nonterminal, e.g. `<program>`).

Example:
```

V = { , , }  
Σ = { +, *, (, ), id }  
S =  
R = { ::= | + , ... }

```
This definition provides the formal backbone of both BNF and EBNF syntax.

---

## Backus–Naur Form (BNF)
BNF expresses grammar rules in a simple, recursive, and machine-readable way.

### Basic Syntax
| Symbol | Meaning |
|--------|----------|
| `<...>` | Nonterminal (syntactic category) |
| `::=` | “is defined as” |
| `|` | Alternation (OR) |
| Terminals | Usually written as literal tokens (`id`, `+`, `if`) |

### Example - Arithmetic Expressions
```

::= | + | -  
::= | * | /  
::= ( ) | id | num

```

This grammar describes the structure of simple arithmetic expressions.  
Each nonterminal recursively defines valid combinations of lower-level forms.

> [!note]
> Recursive definitions like `<expr> ::= <expr> + <term>` are *left-recursive* - a hallmark of context-free grammars that can describe nested and chained constructs naturally.

---

## Extended Backus–Naur Form (EBNF)
EBNF expands BNF with operators for optionality, repetition, grouping, and other shorthand notations that make grammars easier to read and write.

### EBNF Extensions
| Symbol | Meaning |
|--------|----------|
| `[ ... ]` | Optional element (0 or 1 occurrence) |
| `{ ... }` | Repetition (0 or more occurrences) |
| `( ... )` | Grouping |
| `+` | One or more (in some variants) |
| `?` | Optional (alternative syntax) |
| `:=` or `=` | Often replaces `::=` in EBNF dialects |

> [!example]
> The same arithmetic grammar in EBNF:
> ```
> expr   = term { ("+" | "-") term } ;
> term   = factor { ("*" | "/") factor } ;
> factor = "(" expr ")" | id | num ;
> ```

This version is functionally equivalent but cleaner and avoids left recursion.  
EBNF’s `{ ... }` and `[ ... ]` make it more expressive for human readers and parser generators.

---

## BNF vs EBNF - Expressiveness and Readability
While both describe the same class of languages (context-free), **EBNF** is more compact and expressive.

| Feature | BNF | EBNF |
|----------|-----|------|
| Optional elements | Verbose (must create a new rule) | `[ ... ]` |
| Repetition | Requires recursion | `{ ... }` |
| Grouping | Implicit | Explicit via `( ... )` |
| Readability | Machine-oriented | Human-friendly |
| Parser use | Classic (YACC, Bison) | Modern (ANTLR, PEG, recursive descent) |

> [!tip]
> Think of EBNF as “BNF + syntactic sugar.”  
> It doesn’t describe new languages; it just does so more elegantly.

---

## EBNF Example - Conditional Statements
A snippet of a small language:
```

stmt = "if" expr "then" stmt [ "else" stmt ] ;  
expr = term { ("+" | "-") term } ;  
term = factor { ("*" | "/") factor } ;  
factor = ident | number | "(" expr ")" ;

```

This defines an `if`-statement with an optional `else`, plus arithmetic expressions.  
A parser can automatically generate a syntax tree directly from these rules.

---

## Grammar Design and Readability
Good grammars communicate meaning clearly - both to compilers and to humans.  

When writing or studying grammars:
1. **Keep rules short and specific.** Each rule should define one clear syntactic category.  
2. **Prefer EBNF for documentation.** It reads like a language specification.  
3. **Use recursion only where it mirrors structure.** Avoid infinite loops via nontermination.  
4. **Avoid ambiguity.** Ambiguous grammars make parsing non-deterministic (multiple valid trees).  
5. **Validate with examples.** Try expanding derivations to ensure the grammar behaves as expected.

> [!warning]
> Ambiguous grammars can still be syntactically correct - but your parser might interpret the same input differently on separate passes.

---

## Derivations and Parse Trees
Derivations show how strings are generated from a grammar.

### Leftmost Derivation
Always expand the leftmost nonterminal first.
```

⇒ +  
⇒ +  
⇒ +  
⇒ id +  
⇒ id +  
⇒ id + num

```

### Parse Tree
A tree structure shows the same process visually:
```

```
    <expr>
   /  |   \
```

+  
| |  
  
| |  
num  
|  
id

```

Every parse tree corresponds to one complete derivation.

---

## Eliminating Left Recursion
Many parser generators (like recursive descent) cannot handle **left-recursive** rules.  
To make them compatible, you must refactor into **right-recursive** or iterative form.

### Example
BNF:
```

::= + |

```
Right-recursive (EBNF equivalent):
```

expr = term { "+" term } ;

```
This version is better for predictive parsing and clearer for human readers.

> [!tip]
> EBNF makes left-recursion removal trivial - its `{}` and `[]` constructs directly express repetition and optionality.

---

## Diagram Explanation - Grammar Hierarchy & BNF Comparison
`grammar_hierarchy_and_bnf_example.svg` should contain two panels:
1. **Top:** Chomsky hierarchy pyramid (Regular → CFG → CSL → Unrestricted).  
   - Highlight “Context-Free” and label “BNF / EBNF live here.”  
2. **Bottom:** A comparison of BNF vs EBNF for an expression grammar:  
   - Left side shows recursive `<expr> ::= <expr> + <term>`  
   - Right side shows compact EBNF `expr = term { "+" term }`  

Arrows should connect equivalent forms to visualize how EBNF simplifies grammar notation while preserving semantics.

---

## Grammar Validation and Tools
In practice, grammars are tested and debugged using parser generators or analyzers.

| Tool | Style | Notes |
|------|--------|-------|
| **YACC / Bison** | BNF / LALR | Used in C/C++ compiler pipelines. |
| **ANTLR** | EBNF-like | Generates LL(*) parsers in Java, Python, Go, etc. |
| **PEG / Packrat** | EBNF / PEG syntax | Deterministic parsing, supports backtracking. |
| **Marpa / Earley** | Full CFG | Handles ambiguous grammars efficiently. |

When preparing for exams or building a compiler, focus on:
- Recognizing grammar types.  
- Converting between BNF and EBNF.  
- Understanding parser compatibility (LL, LR, recursive descent).

---

## Common Pitfalls
> [!warning]
> 1. **Hidden ambiguity:** grammars that seem fine but produce multiple parse trees.  
> 2. **Left recursion:** prevents top-down parsing.  
> 3. **Unreachable nonterminals:** rules that never appear in derivations.  
> 4. **Missing base cases:** recursive rules without termination paths.  
> 5. **Incorrect precedence encoding:** leads to incorrect expression grouping.

Always test with small sample strings and expand derivations manually when unsure.

---

## Real-World Context
- **C, Java, and Pascal** grammars were historically written in BNF.  
- **Modern languages (Go, Swift, Rust)** use EBNF or PEG-like syntax for readability.  
- **ECMAScript (JavaScript)** uses its own formal EBNF variant in the official specification.  
- **SQL, XML, and JSON** are defined via context-free grammars but often documented using EBNF for clarity.

BNF remains the universal “lingua franca” of language definition, but EBNF dominates modern documentation.

---

## Summary
BNF and EBNF are two notations for defining context-free grammars:
- BNF: minimal, formal, and compatible with parser theory.  
- EBNF: human-readable, concise, and practical for design and documentation.  
Both share the same expressive power but differ in **clarity and convenience**.

> [!important]
> For exam prep:  
> - Know how to convert BNF ⇄ EBNF.  
> - Understand derivations, parse trees, and recursion removal.  
> - Identify grammar type by Chomsky hierarchy.  
> - Recognize ambiguity and precedence issues in expression grammars.

---

## Related Notes
- [[grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]]
- [[cfg-design-refactoring|CFG Design & Refactoring]]
- [[programming-paradigms-models-of-computation|Programming Paradigms & Models of Computation]]