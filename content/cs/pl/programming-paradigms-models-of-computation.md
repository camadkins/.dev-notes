---
title: Programming Paradigms & Models of Computation
description: How languages organize computation (imperative, functional, logic, OO) and the abstract machines behind them.
draft: false
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
---
## Why:
Paradigms shape how we think (state & commands vs expressions & evaluation). Models define *what counts* as a computation.

## Core definitions
- *Imperative*: explicit state `σ` and commands mutate `σ_{t}→σ_{t+1}`.
- *Functional*: evaluation by expression rewriting; functions are values; referential transparency.
- *Logic*: computation as proof search (goals, facts, rules).
- *OO*: objects encapsulate state + behavior; dynamic dispatch.
- *Models of computation*: λ-calculus, Turing machines, abstract machines (CEK/SECD).

## Idea (compare by invariants)
- Imperative: invariant = correctness over *mutable state transitions*.
- Functional: invariant = *no observable effects*; evaluation order shouldn’t change results.
- Logic: invariant = *sound derivations* under inference rules.
- OO: invariant = *class/representation contracts* respected under substitution.

## Pitfalls
- Confusing syntax with paradigm (a language may support multiple paradigms).
- Assuming “more features ⇒ more expressive” (often just more convenient).

## Mini-example
- Sum 1..n  
  - Imperative: `s:=0; for i=1..n: s:=s+i`  
  - Functional: `fold (+) 0 [1..n]`  
  - Logic: `sum(0, [], 0). sum(N, [H|T], S) :- sum(N1, T, S1), N is N1+1, S is S1+H.`

## Diagram
  
  ![Paradigms taxonomy](/cs/pl/assets/paradigms-taxonomy.svg)

**See also**
- [[cs/pl/language-overview-syntax-semantics|Language Overview — Syntax vs Semantics]]
- [[cs/pl/levels-of-artificial-languages|Levels of Artificial Languages]]
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]]
- [[cs/pl/index|Programming Language Concepts]]