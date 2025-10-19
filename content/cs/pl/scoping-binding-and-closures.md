---
title: Scoping, Binding, and Closures
description: Understanding lexical environments and variable capture in language semantics.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
# potential-diagram: closure environment chain (already embedded)
---

## Why
Scope defines *where* names are visible.  
Binding defines *which* entity a name refers to.  
Together, they ensure consistent interpretation of variables across execution contexts.

---

## Recap
- **Static (lexical) scope:** resolved by textual position.  
- **Dynamic scope:** resolved by call history.  
- **Binding:** links identifiers to values or storage locations.  

---

## Grammar connection
Grammar nonterminals create syntactic scopes:  
- Declarations introduce symbols (`let`, `lambda`).  
- Blocks limit visibility (`{}` or `begin ... end`).  
- Nested rules mirror nested scopes.

> In CFG design, scope resembles nonterminal lifetimes — each expansion defines a valid name region.

Example CFG fragment:
```
<block> ::= "{" <decls> <stmts> "}"
<decls> ::= <decl> | <decl> <decls>
<decl> ::= "let" <id> "=" <expr> ";"
```

This models local bindings that vanish after block completion.

---

## Closures
A **closure** packages a function with its environment — preserving the scope in which it was defined.

```
let makeAdder(x) = lambda y. x + y
```
Returns a closure capturing `x`.

At runtime, the function retains access to `x` even outside the defining scope.

---
## Diagram

  

  ![Closure over lexical environment](/cs/pl/assets/closure-env-chain.svg)

---

## Pitfalls
- Capturing mutable variables leads to unintended side effects.  
- Copying environments incorrectly breaks variable references.  
- Recursive bindings must reference partially initialized closures.

---

## TODOs
- Add example tracing lexical scope with nested lambdas.  
- Annotate closure diagram with captured variables.

---

**See also**
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]
- [[cs/pl/cfg-design-refactoring|CFG Design & Refactoring]]
- [[cs/pl/index|Programming Language Concepts]]
