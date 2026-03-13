---
title: Language Overview — Syntax vs Semantics
description: Distinguishing syntax, static semantics, and dynamic semantics — how programming languages define structure, constraints, and meaning.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
# diagrams:
#  - syntax_semantics_layers.svg — show grammar → AST → typing → evaluation pipeline.
#  - syntax_ambiguity_example.svg — illustrate ambiguous parse resolved via grammar refinement.
---

## Overview
Every programming language has two faces: **syntax** (form) and **semantics** (meaning).  
A program’s syntax defines *what it looks like*; semantics define *what it does*.  
Together, they make languages both interpretable by machines and predictable for humans.

> [!note]
> Syntax is about *shape* — what strings count as well-formed.  
> Semantics is about *behavior* — what those well-formed strings mean.

---

## Syntax — Form and Structure
The **syntax** of a language describes the set of *valid programs* using grammatical rules.  
It is usually specified via a **context-free grammar (CFG)** or an equivalent formalism.

### Concrete Syntax
Defines how programs are written:
```

expr ::= n  
| expr + expr  
| expr * expr

```

Here, numeric literals (`n`), addition, and multiplication are valid.  
However, this grammar is ambiguous — it doesn’t encode precedence or associativity.

### Abstract Syntax
Parsers convert **concrete syntax** into **abstract syntax trees (ASTs)** that remove surface details (like parentheses or commas).

Example:
```

1 + 2 * 3

```
becomes:
```

Add(Num(1), Mul(Num(2), Num(3)))

```

> [!tip]
> Grammar → AST → semantics is the canonical pipeline.  
> Syntax defines *form*; semantics operates on the *tree*.

---

## Semantics — Meaning
Semantics gives formal meaning to well-formed programs.  
There are two primary kinds:

### 1. Static Semantics
Defines rules that constrain programs **before execution** — beyond syntax but not yet behavior.  
Examples:
- Variables must be declared before use.
- Types of operands must match.
- No duplicate definitions in a scope.

These are checked by the compiler or type checker.

Formally:
```

Γ ⊢ e : τ

```
means “under typing environment Γ, expression `e` has type τ.”

> [!note]
> Static semantics ensures well-typedness — it’s a *filter* on syntactically valid programs.

---

### 2. Dynamic Semantics
Defines **how programs execute** — the actual meaning during evaluation.

Approaches:
- **Operational semantics:** defines computation as state transitions (`⟨e, σ⟩ → ⟨e', σ'⟩`).
- **Denotational semantics:** maps programs to mathematical functions or domains.
- **Axiomatic semantics:** defines properties of programs using logical assertions.

> [!tip]
> Static semantics = “can it run?”  
> Dynamic semantics = “what happens when it runs?”

---

## The Relationship Between Syntax and Semantics
Syntax filters out malformed programs; semantics explains the behavior of the rest.

| Layer | Role | Typical Tool |
|--------|------|---------------|
| **Syntax** | Structure of valid programs | Grammar / Parser |
| **Static Semantics** | Well-formedness rules (scope, types) | Type checker |
| **Dynamic Semantics** | Runtime behavior | Evaluator / Interpreter |

### Example
Consider this grammar and semantic pair:
```

e ::= n | e + e  
⟦n⟧ = integer literal  
⟦e1 + e2⟧ = ⟦e1⟧ + ⟦e2⟧

```
The grammar specifies legal structure; semantics defines meaning.

---

## Formalization Pipeline
A modern language definition proceeds in layers:

```

Source Code  
↓  
Syntax (Grammar)  
↓  
AST (Abstract Syntax)  
↓  
Static Semantics (Typing Rules)  
↓  
Dynamic Semantics (Evaluation Rules)

```

Each layer refines precision:
1. **Syntax:** identifies possible forms.
2. **Static semantics:** filters invalid ones.
3. **Dynamic semantics:** defines execution behavior.

> [!example]
> **Diagram idea** (`syntax_semantics_layers.svg`):  
> A vertical flow diagram showing source text → parser → AST → type checker → evaluator.  
> Each arrow labeled with what that stage enforces or produces.

---

## Ambiguity and Precedence
A syntax is **ambiguous** if one program has multiple parse trees.  
This usually happens when precedence or associativity isn’t explicitly encoded.

Example:
```

expr ::= expr + expr | expr * expr | n

```
The string `1 + 2 * 3` can be parsed as:
- `(1 + 2) * 3`
- `1 + (2 * 3)`

Refining the grammar or using **precedence levels** fixes the ambiguity:
```

E ::= E + T | T  
T ::= T * F | F  
F ::= n

```

> [!warning]
> Grammar-level ambiguity affects parsing, not semantics.  
> Semantic ambiguity (undefined meaning) is a different issue — e.g., dividing by zero or uninitialized variables.

---

## Static vs Dynamic Checking
| Property | Static Check | Dynamic Check |
|-----------|---------------|---------------|
| Type errors | ✅ Compile-time | ❌ |
| Array bounds | ❌ | ✅ |
| Division by zero | ❌ | ✅ |
| Syntax | ✅ | ❌ |

A sound type system aims to *push as many checks as possible* into the static phase to detect errors early.

---

## Operational Semantics Example
Let’s define evaluation rules for arithmetic:

### Expressions
```

e ::= n | e + e

```

### Small-step Semantics
```

⟨n1 + n2, σ⟩ → ⟨n3, σ⟩  
where n3 = n1 + n2

```
### Big-step Semantics
```

──────────────  
⟨n, σ⟩ ⇓ n  
⟨e1, σ⟩ ⇓ n1 ⟨e2, σ⟩ ⇓ n2  
──────────────────────────────  
⟨e1 + e2, σ⟩ ⇓ n1 + n2

```

> [!note]
> Small-step semantics defines *how* computation proceeds;  
> big-step semantics defines *what* the result is.

---

## Why the Separation Matters
Separating syntax and semantics leads to:
- **Clearer specifications:** grammars handle structure, semantics handle meaning.
- **Modular tools:** parsers, type checkers, and evaluators are independent.
- **Safer compilers:** static rules guarantee semantic properties.

Without this separation, the language definition becomes tangled and harder to reason about.

> [!tip]
> This separation mirrors software architecture itself — parsing, validation, and execution are distinct passes.

---

## Common Pitfalls
> [!warning]
> - Encoding semantic constraints in grammar rules (e.g., forcing variable declaration order in BNF).  
> - Treating parser errors as type errors.  
> - Ignoring ambiguity — assuming all grammars are unambiguous by default.  
> - Defining semantics *informally* (e.g., “it works like Python”) without formal rules.

---

## Conceptual Summary
| Concept | Meaning | Example |
|----------|----------|----------|
| Syntax | Form | Grammar rules define what’s valid |
| Static Semantics | Validity constraints | Type correctness, variable scope |
| Dynamic Semantics | Execution meaning | Evaluation, state transitions |

Together, they provide a **complete formal definition** of a programming language — unambiguous, analyzable, and implementable.

---

## See also
- [[grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]]
- [[type-systems-goals-guarantees|Type Systems — Goals & Guarantees]]
- [[language-design-values-variables-environments|Language Design — Values, Variables, and Environments]]
- [[programming-paradigms-models-of-computation|Programming Paradigms & Models of Computation]]