---
title: Scoping, Binding, and Closures
description: Lexical scope, environments, and how functions capture variables.
draft: false
tags:
  - cs
  - pl
date: 2025-10-17
updated:
aliases: []
---
## Why:
Scope rules determine what names mean; closures carry their environments to preserve meaning.

## Core definitions
- *Binding*: association of a name to a value/location.
- *Scope*: region where a binding is visible (lexical vs dynamic).
- *Closure*: `(code, env)` pair capturing free variables of a function.

## Idea (lexical scope)
- Name resolution looks up through *static* nesting of blocks/modules, not the call stack.

## Pitfalls
- Shadowing hides outer bindings.
- Simulating closures without capturing the right environment (bugs in callbacks).

## Mini-example
- Let `x=10`. Define `f = λy. x + y`. Return a function `g = λz. f(z)`.  
  Calling `g(5)` yields `15` because `x` in `f` resolves to the lexical `x=10` captured in the closure.
## Diagram

  ![Closure over lexical environment](/cs/pl/assets/closure-env-chain.svg)

**See also**
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]
- [[cs/pl/language-design-values-variables-environments|Language Design — Values, Vars, Environments]]
- [[cs/pl/index|Programming Language Concepts]]