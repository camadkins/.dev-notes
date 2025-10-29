---
title: Functions
description: Procedure abstraction with parameters, return values, and well-defined contracts; covers call stacks, parameter passing, purity, and tail calls.
draft: true
tags:
- cs
- dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
# - call-stack-frame.svg — Annotated stack frames across a nested call: saved return address, parameters, locals, and caller/callee-saved registers; shows growth and return unwinding.
# - tail-call-vs-regular.svg — Side-by-side call trees: ordinary recursion grows depth per call; tail-recursive version reuses a single frame under TCO.
---

## Overview
A **function** (procedure) packages a computation behind a **name**, a **parameter list**, and a **result**. Functions enable **abstraction**, **reuse**, and **reasoning**: callers rely on an interface (inputs/outputs, pre/postconditions) while implementations hide details. Key axes include **parameter passing** (by value/reference), **purity** (side effects vs none), **call-stack behavior**, and **tail calls**. Clear contracts keep codebases correct and testable. :contentReference[oaicite:0]{index=0}

> [!example]
> **Diagram (`call-stack-frame.svg`)** — Show three stacked frames for `main → f → g`. Each frame labels: return address, parameters, locals, saved registers, and the caller link. Arrows illustrate `call` pushing a frame and `return` popping it.

## Motivation
Functions give names to patterns and **separate the what from the how**:
- **Readability:** Small, single-purpose functions communicate intent.
- **Reuse:** One tested implementation, many call sites.
- **Testing/verification:** Contracts and pure functions support unit tests and formal reasoning.
- **Composition:** Complex behavior emerges from composing simple building blocks.

## Definition and Formalism
A function has:
- **Signature:** `name(param₁: T₁, …, param_k: T_k) → R`
- **Contract:**  
  - **Preconditions:** what callers must guarantee (e.g., `n ≥ 0`).  
  - **Postconditions:** what the function guarantees on return (e.g., result is sorted).  
  - **Effects:** state changes or I/O (ideally explicit).
- **Body:** a sequence/expression computing the result.

**Purity.** A function is **pure** if, for the same inputs, it returns the same output and causes **no observable side effects** (no mutation, I/O, global state). Purity simplifies caching, testing, and parallelization.

**Totality.** A **total** function returns for all valid inputs (no non-terminating or exception-only paths). When totality isn’t feasible, document failure modes.

## Example or Illustration
### Spec-driven utility (pure)
```pseudo
// spec:
// PRE: n ≥ 0
// POST: returns the sum of A[0..n-1]
// EFFECTS: none (pure)
function SUM_PREFIX(A, n):
    s = 0
    for i in 0..n-1:
        s = s + A[i]
    return s
````

### Validating preconditions (defensive)

```pseudo
function SAFE_AT(A, i):
    if i < 0 or i ≥ length(A): error "index out of bounds"
    return A[i]
```

> [!tip]  
> Keep **pure core logic** separate from **effectful wrappers**. Validate inputs at the boundary, then pass clean data to a pure worker.

## Properties and Relationships

- **Parameters & results:** Inputs flow through parameters; results return via the function value (plus optional out-parameters or mutated structures when using references).
    
- **Composition:** `h(x) = g(f(x))` composes two functions; associativity of composition supports pipeline designs.
    
- **Equational reasoning:** For pure functions, `f(a)` can be replaced with its value anywhere—no side effects to worry about.
    

## Implementation or Practical Context

### 1) Parameter Passing

- **Pass-by-value:** Callee receives a **copy**. Mutating the parameter doesn’t affect the caller’s object (unless the value is a pointer/reference).
    
- **Pass-by-reference:** Callee operates on the **original** object; mutations are visible to the caller. Useful for large structures to avoid copies.
    
- **Const/reference hybrids:** Pass a reference for performance but mark **read-only** to preserve functional style.
    

See also [[cs/dsa/pass-by-value-and-pass-by-reference|Pass by Value and Pass by Reference]].

### 2) Call Stack and Frames

Each `call` typically:

1. Saves the **return address**.
    
2. Creates a **stack frame** (activation record) with parameters, locals, and saved registers.
    
3. Transfers control to the callee.
    

On `return`, the frame is popped, revealing the caller’s frame. Deep recursion consumes stack space; large or unbounded depth risks overflow.

> [!example]  
> **Diagram (`tail-call-vs-regular.svg`)** — Left: regular recursion where each call adds a frame (`fact(n)` after `fact(n−1)`). Right: tail recursion where `factTR(n, acc)` returns the recursive call’s result directly; with TCO, the frame is reused.

### 3) Tail Calls and Tail Recursion

A **tail call** is a call that occurs as the **final action** of a function. With **tail-call optimization (TCO)**, the runtime/compiler reuses the current frame instead of pushing a new one, keeping **O(1)** stack space.

```pseudo
// regular factorial (not tail-recursive)
function FACT(n):
    if n == 0: return 1
    else: return n * FACT(n-1)

// tail-recursive factorial
function FACT_TR(n, acc):
    if n == 0: return acc
    else: return FACT_TR(n-1, n*acc)
```

> [!warning]  
> **Not all languages guarantee TCO.** If TCO is unavailable, prefer iterative forms for deep recursions to avoid stack overflow. See [[cs/dsa/recursion|Recursion]] and [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]].

### 4) Pre/Postconditions and Contracts

- **Preconditions** check **caller obligations** early (fast-fail).
    
- **Postconditions** assert **results** (e.g., `is_sorted(A)` after sorting).
    
- **Invariants** document stable properties across the function’s execution (e.g., loop invariants in algorithms).
    

Contracts can be expressed via assertions, types (e.g., non-empty list type), or documentation. They clarify behavior and enable automated tests.

### 5) Effects and Side-Effect Management

When side effects are necessary:

- Isolate them to a small boundary layer.
    
- Keep **order** explicit (e.g., log → write → close).
    
- Avoid hidden global state; prefer explicit parameters (dependency injection).
    

### 6) Exceptions and Totality

Define failure behavior:

- **Checked** vs **unchecked** exceptions (language-dependent).
    
- **Error returns** or **option types** (`None`/`null` vs rich error objects).
    
- **Total wrappers** that capture failures (e.g., `try_map`) to keep core pipelines predictable.
    

## Common Misunderstandings

> [!warning]  
> **“Pure” but mutates globals.** Reading/writing globals, random numbers, time, or I/O breaks purity; document effects explicitly.

> [!warning]  
> **Confusing reference with aliasing control.** Passing by reference doesn’t mean **any** code can mutate. Use `const`/immutable references unless mutation is required.

> [!warning]  
> **Hidden preconditions.** If a function assumes “array is sorted” or “non-null pointer,” put it in the signature or docs and validate when feasible.

> [!warning]  
> **Tail recursion ≠ always faster.** It saves stack space but may not beat straightforward loops in constant factors. Prefer clarity, then optimize hot paths.

## Summary

Functions encapsulate behavior with a clean **interface** and, ideally, clear **contracts**. Prefer **pure**, **total** functions for core logic; push validation and effects to the edges. Understand the **call stack** and when depth matters; use **tail recursion** or iterative forms to control space. Choose parameter passing deliberately (value vs reference), and make side effects and failure modes explicit. These habits yield code that is easier to test, reason about, and maintain.

## See also

- [[cs/dsa/recursion|Recursion]]
    
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]]
    
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
    
- [[cs/dsa/dynamic-programming|Dynamic Programming]]