---
title: Records, Variants & Pattern Matching
description: Structural types and decomposition rules that mirror grammar disjunctions.
draft: false
tags:
  - cs
  - pl
date: 2025-10-19
updated:
aliases: []
# potential-diagram: pattern match tree illustrating variant decomposition
---

## Why
Records and variants give structure to **data definitions**, just as grammars structure **syntax definitions**.  
Pattern matching is the bridge — it deconstructs data according to its variant or record form.

---

## Core ideas

### Records (Product Types)
Group labeled fields:
```
type Point = { x: Int, y: Int }
```
Analogous to a nonterminal expanding into multiple symbols.

**Grammar analogy:**
```
<point> ::= "{" "x" ":" <int> "," "y" ":" <int> "}"
```

### Variants (Sum Types)
Enumerate possible shapes:
```
type Shape = Circle(radius: Int) | Square(side: Int)
```

**Grammar analogy:**
```
<shape> ::= <circle> | <square>
```

Each constructor introduces an alternative branch — much like grammar rules.

---

## Pattern Matching
Deconstructs a value by matching against its constructor pattern.

```
area s =
  match s with
  | Circle(r) -> 3.14 * r * r
  | Square(s) -> s * s
```

**Grammar tie-in:** pattern matching = choosing which production applies.

---

## Design considerations
- Patterns must be **exhaustive** (cover all variants).  
- **Overlapping** patterns → ambiguity (like multiple applicable rules).  
- Static analysis parallels **grammar disambiguation**.

> Structural typing and grammar design share a goal: safe, deterministic decomposition.

---

**See also**
- [[cs/pl/cfg-design-refactoring|CFG Design & Refactoring]]
- [[cs/pl/scoping-binding-and-closures|Scoping & Closures]]
- [[cs/pl/index|Programming Language Concepts]]
