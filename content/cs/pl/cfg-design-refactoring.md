---
title: CFG Design & Refactoring
description: Building and refining context-free grammars for clarity, precedence, and parser compatibility.
draft: false
tags:
  - cs
  - pl
date: 2025-10-19
updated:
aliases: []
# potential-diagram: before/after grammar refactor showing left recursion elimination
---

## Why
Designing grammars for real programming languages requires balancing **clarity**, **precision**, and **parser compatibility**.  
A theoretically correct grammar may still fail to parse efficiently or unambiguously.  
Refactoring helps ensure deterministic parsing and modular syntax evolution.

---

## Goals of CFG Design
- Express valid structures unambiguously.  
- Encode **precedence** and **associativity** directly in the grammar.  
- Eliminate **left recursion** for recursive-descent parsers.  
- Factor shared prefixes for efficient predictive parsing.  
- Preserve *readability* and *modularity* for human maintenance.

> [!tip] Many compiler bugs stem from grammar drift — a mismatch between what the parser accepts and what the language designers intended.

---

## Common Grammar Issues

### 1. **Left Recursion**
A rule like:
```
Expr → Expr + Term | Term
```
causes infinite recursion in a top-down parser.

**Refactor (Right Recursion):**
```
Expr → Term Expr'
Expr' → + Term Expr' | ε
```

This converts recursion into iterative expansion, allowing LL(1) parsing.

---

### 2. **Left Factoring**
If two rules share a prefix, predictive parsers can’t decide which to apply.

**Before:**
```
Stmt → if Expr then Stmt else Stmt
Stmt → if Expr then Stmt
```

**After (Factored):**
```
Stmt → if Expr then Stmt Stmt'
Stmt' → else Stmt | ε
```

This eliminates the classic **dangling else** ambiguity.

---

### 3. **Operator Precedence**
To encode precedence levels:
```
Expr → Term | Expr + Term | Expr - Term
Term → Factor | Term * Factor | Term / Factor
Factor → (Expr) | id | num
```

Higher-precedence rules appear deeper in the derivation hierarchy.  
Parentheses enforce grouping explicitly.

---

### 4. **Epsilon and Empty Productions**
ε-productions enable optional constructs but may introduce ambiguity.  
Prefer explicit alternatives when possible.

Example:
```
OptElse → else Stmt | ε
```

---

### 5. **Grammar Modularity**
Separate concerns:
- **Expressions** → arithmetic / boolean.  
- **Statements** → assignment, control flow.  
- **Declarations** → variable/function definitions.

Each can evolve independently while preserving integration via nonterminals.

---

## CFG Refactoring Workflow
1. Identify **recursion and prefix conflicts**.  
2. Apply **left recursion elimination**.  
3. **Factor prefixes** to simplify parser decisions.  
4. Validate grammar with sample programs.  
5. Document assumptions (ε, precedence, associativity).

> Grammar evolution is iterative — each pass trades off clarity vs parser simplicity.

---

## Micro Example
Before:
```
Expr → Expr + Expr | Expr * Expr | id
```
Ambiguous: order of operations undefined.

After refactor:
```
Expr → Term ExprTail
ExprTail → + Term ExprTail | ε
Term → Factor TermTail
TermTail → * Factor TermTail | ε
Factor → id
```

Now `*` binds tighter than `+`.

---

## TODOs
- Add diagram of LL(1) parse steps.  
- Include FIRST/FOLLOW sets example for Expr grammar.  
- Add example of EBNF grouping vs explicit rules.

---

**See also**
- [[cs/pl/grammars-notation-bnfebnf|BNF & EBNF]]
- [[cs/pl/grammar-ambiguity-parse-trees|Ambiguity & Parse Trees]]
- [[cs/pl/scoping-binding-and-closures|Scoping & Closures]]
- [[cs/pl/index|Programming Language Concepts]]
