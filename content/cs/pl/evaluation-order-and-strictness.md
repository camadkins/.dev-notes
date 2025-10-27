---
title: Evaluation Order & Strictness
description: How evaluation strategy affects when expressions are computed, whether functions are strict, and how non-strictness shapes language behavior.
draft: true
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagram: evaluation_order_comparison.svg — show a side-by-side tree of strict vs non-strict evaluation: (f (g x)) reducing left-to-right vs only if needed.
---

## Why Evaluation Order Matters
In a programming language, *when* and *whether* arguments are evaluated changes everything — performance, side effects, and even termination.  
Evaluation order defines **how the meaning of expressions unfolds** during execution.

Languages that evaluate arguments *before* applying functions behave differently from those that defer evaluation until the value is actually needed.  
This difference shapes the boundary between **strict** and **non-strict** semantics.

> [!note]
> Evaluation order connects syntax (the surface program) to operational semantics (how computation proceeds).  
> Even pure functional programs behave differently under call-by-value vs call-by-need.

---

## Strictness — The Core Idea
A function `f` is **strict** if it always evaluates its argument before producing a result.  
Formally:
```

f ⊥ = ⊥

````
That means: if evaluating the argument diverges (never returns), then `f` itself diverges.

### Examples
- `(+ 1 2)` → both arguments evaluated → **strict in both**.  
- `and(a, b)` → if `a` is `false`, `b` isn’t evaluated → **non-strict in second argument**.  
- `if c then t else e` → only one branch is evaluated → **non-strict in both `t` and `e`**.

> [!tip]
> Strictness is *about necessity*, not order.  
> A function can be non-strict in one argument yet strict in another, depending on how its body uses them.

---

## Evaluation Strategies
There are several strategies for when and how arguments are evaluated.  
They all aim to produce the same mathematical result but differ in the *path* they take.

| Strategy | Description | Typical Languages |
|-----------|--------------|-------------------|
| **Call-by-Value (CBV)** | Evaluate all arguments before calling the function. | C, Java, OCaml, Python |
| **Call-by-Name (CBN)** | Pass unevaluated expressions; evaluate when used. | Algol 60, theoretical calculus |
| **Call-by-Need** | Like call-by-name but cache the result (lazy evaluation). | Haskell |
| **Call-by-Reference** | Pass addresses instead of values. | C++, Ada |
| **Call-by-Push-Value (CBPV)** | A unifying framework mixing CBV/CBN. | Used in PL research |

### Example
```haskell
square x = x * x
main = square (print 3)
````

- **Call-by-Value:** `print 3` runs immediately, side effect happens, result (`()`) passed to `square`.
    
- **Call-by-Need:** `print 3` is delayed until `x` is used. Since `x` is used twice, its result is _shared_ — printed only once.
    

> [!example]  
> **Observational difference**: in Haskell, this prints `3` once; in an eager language, it prints `3` before any computation.

---

## Diagram Explanation — Strict vs Non-Strict

The diagram (suggested: `evaluation_order_comparison.svg`) should visualize a simple call `(f (g x))` in two settings:

- **Strict (CBV):**
    
    1. Evaluate `g x` fully.
        
    2. Apply `f` to the result.  
        → Execution tree reduces _inside-out_ (arguments first).
        
- **Non-Strict (CBN/CBNeed):**
    
    1. Pass `(g x)` unevaluated into `f`.
        
    2. Evaluate `g x` only if `f` actually uses it.  
        → Execution tree reduces _outside-in_ (functions first).
        

Visually, show arrows labeled _“needed value?”_ to indicate deferred computation.  
This captures the intuition that strictness is about **when work happens**.

---

## Short-Circuiting and Partial Strictness

Not all constructs are uniformly strict. Some are strict only in certain positions.

|Construct|Non-strict positions|
|---|---|
|`if c then t else e`|`t`, `e`|
|`and(a, b)`|`b`|
|`or(a, b)`|`b`|
|`pair(a, b)`|none (usually strict in both)|

This selective evaluation is what makes Boolean logic efficient — you don’t compute the second operand unless necessary.

> [!note]  
> In lazy languages, _all_ expressions behave this way by default.  
> In strict languages, short-circuit operators are _special forms_ that override default eagerness.

---

## Strictness and Effects

Strictness interacts subtly with **side effects** (I/O, state, exceptions).  
In an eager language, effects occur immediately.  
In a lazy language, effects happen only when a value is demanded.

> [!warning]  
> This means non-strict evaluation can delay — or even suppress — side effects entirely.  
> A logging expression might never execute if its value isn’t used.

Consider:

```haskell
debug x = trace ("Value is " ++ show x) x
```

If a lazy computation never forces `x`, the debug message never appears.  
That’s why Haskell’s `trace` or `unsafePerformIO` are explicitly marked as unsafe: they break referential transparency if used carelessly.

---

## Formal Semantics Connection

In **denotational semantics**, strictness corresponds to how functions handle the bottom value (⊥).  
A function `f` is _strict_ if it maps ⊥ to ⊥, meaning it cannot produce a result without fully evaluating its argument.

In **operational semantics**, evaluation order is expressed via rules such as:

```
E ⊢ e1 → v1
E ⊢ e2 → v2
--------------------  (App)
E ⊢ (f e1 e2) → f v1 v2
```

Changing when these premises fire (eager vs lazy) changes the entire execution model.

---

## Non-Strict Evaluation and Sharing

Pure call-by-name re-evaluates expressions each time they’re used:

```scheme
(f (+ 1 2) (+ 1 2))
```

Here, `(+ 1 2)` would be computed twice.

**Call-by-need** introduces _sharing_ — results are memoized after first evaluation.

> [!example]  
> In Haskell:
> 
> ```haskell
> let x = expensive() in x + x
> ```
> 
> The function `expensive()` runs once.  
> The second use of `x` reuses the stored result.

This sharing is what makes laziness _practical_: predictable performance and no redundant work.

---

## Performance and Reasoning

Strict evaluation is easy to reason about because order is fixed.  
Lazy evaluation can feel unpredictable — expressions might not execute at all — but it enables powerful patterns like infinite data structures.

|Property|Strict Evaluation|Non-Strict Evaluation|
|---|---|---|
|Predictable timing|✅|❌ (depends on demand)|
|Space usage|Fixed per scope|Can grow due to thunks|
|Termination|Guaranteed if subexpressions terminate|May terminate even when subexpressions wouldn’t|
|Expressiveness|Simpler|More flexible (e.g., define streams)|

> [!tip]  
> Non-strict semantics allow **infinite structures** and **control constructs as functions** — features impossible in purely strict languages.

---

## Practical Design Notes

Language designers often mix strategies:

- **Eager core, lazy syntax:** OCaml’s `lazy` and `force`.
    
- **Lazy core, strict annotation:** Haskell’s `!` or `seq` operators.
    
- **Hybrid optimizations:** compilers detect _strict contexts_ and evaluate early for efficiency.
    

The trick is balancing **predictability** and **laziness benefits**.  
Strict evaluation simplifies reasoning about time and memory; laziness improves modularity and expressiveness.

> [!note]  
> Compilers like GHC (Haskell) and OCaml internally perform _strictness analysis_ to decide when it’s safe to evaluate early.

---

## See also

- [[cs/pl/lambda-calculus-evaluation-strategies|Lambda Calculus — Evaluation Strategies]]
    
- [[cs/pl/booleans-conditionals-semantics|Booleans & Conditionals — Semantics and Evaluation]]
    
- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics — Big-Step & Small-Step]]