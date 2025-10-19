---
title: Lambda Calculus — Syntax & Substitution
description: Abstract computation with variables, abstraction (λx.M), and application (M N).
draft: false
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# potential-diagram: reduction tree of (λx.M) N showing β-reduction steps
---
## Why
λ-Calculus models *computation as evaluation of functions*.  
It underpins the **functional paradigm**, offering a foundation for reasoning about programs.

---

## Core constructs
- **Variable** `x`  
- **Abstraction** `λx.M` — defines a function with parameter `x` and body `M`  
- **Application** `M N` — applies function `M` to argument `N`

> [!tip] Connection to computation models  
> L2 introduces λ-Calculus as one of three equivalent formal models (with Turing Machines and Predicate Logic).

---

## Substitution & binding
Capture-avoiding substitution replaces free occurrences of variables.  
Use **α-renaming** to prevent variable capture.

Example:  
    (λx.λy.x) y → λz.y    (after renaming inner y to z)

---

## Reduction rules
- **β-reduction:** `(λx.M) N → M[x := N]`  
- **η-reduction:** `λx.(f x) → f` if `x` not free in `f`  
- **Normal form:** expression with no reducible subterms.

---

## Pitfalls
- Forgetting to rename bound variables → variable capture.  
- Confusing **binding** vs **substitution** operations.

---

**See also**  
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding & Closures]]  
- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms & Models of Computation]]  
- [[cs/pl/index|Programming Language Concepts]]
