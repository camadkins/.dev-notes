---
title: Continuations & CPS
description: How continuations represent the rest of a computation and enable control operators, early exits, and advanced flow structures.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
---

## What a Continuation Is
A **continuation** represents *what should happen next* — the rest of a computation after the current expression finishes.  
When a program executes, every expression has some continuation waiting for its result. CPS (Continuation-Passing Style) makes this continuation *explicit*.

> [!note]
> Think of a continuation as a saved call stack frame or callback.  
> Instead of returning a value, a function calls another function — the continuation — with that value.

---

## Direct vs Continuation-Passing Style
In normal (direct) style, a function returns a value:
```scheme
(+ 1 2)   ; returns 3 to caller
````

In CPS, a function doesn’t return; it _passes_ the result to its continuation:

```scheme
(λk. (+ 1 2) → k 3)
```

Every function gets an extra parameter, `k`, representing the rest of the program.  
Returning means _invoking_ that continuation.

> [!tip]  
> CPS converts control flow into explicit function calls, turning hidden stack behavior into explicit structure.  
> This is why CPS is key to implementing interpreters, optimizers, and advanced control flow features.

---

## The CPS Transformation

The CPS transform rewrites every expression so that control is never implicit.  
For example:

|Direct Style|CPS Form|
|---|---|
|`v`|`λk. k v`|
|`(f a)`|`λk. f* (λfv. a* (λav. fv av k))`|

Here, every intermediate value gets wrapped in a lambda that takes a continuation.  
Instead of computing a result and returning it, each stage passes the result to its next continuation.

> [!example]  
> **Simple addition in CPS**
> 
> ```scheme
> (+ 1 2)
> ```
> 
> becomes
> 
> ```scheme
> (λk. (+ 1 2) → (k 3))
> ```
> 
> The computation `(+ 1 2)` has no hidden caller — its only way to continue is by calling `k`.

---

## Why CPS Matters

1. **Uniform control** — early exits, exceptions, and coroutines can all be expressed through continuations.
    
2. **Optimization** — tail-call elimination and inlining become simple transformations.
    
3. **Compiler targets** — many compilers (Scheme, ML, Haskell) lower to CPS internally for optimization and analysis.
    
4. **Language design** — continuations unify flow control: returning, breaking, and throwing are all “jumping to a continuation.”
    

> [!tip]  
> CPS is like turning every call into a `goto`, but structured and safe.

---

## `call/cc`: Capturing the Continuation

The Scheme primitive **`call/cc`** (“call with current continuation”) lets a program _capture_ its current continuation as a first-class function.

```scheme
(call/cc (λk
  (k 42)  ; immediately returns 42 to the call/cc site
  0))
```

Result: `42`.

Here, `(λk ...)` receives the current continuation as `k`.  
When `k` is called, execution jumps back to the `call/cc` site with the provided value — even if it’s deep inside another computation.

> [!example]  
> **Short-circuit using `call/cc`**
> 
> ```scheme
> (call/cc (λk
>   (if (null? xs) (k 0)     ; early exit
>     (+ (car xs) (cadr xs)))))
> ```
> 
> If `xs` is empty, `(k 0)` returns immediately to the `call/cc` caller.  
> Otherwise, evaluation continues normally.

---

![Direct-style call stack vs CPS horizontal chain](assets/cps-transform.svg)

---

## Common Pitfalls

> [!warning]
> 
> 1. **Escaping continuations** can be re-entered or reused, leading to strange effects (like re-running code twice).
>     
> 2. **Non-local control** complicates resource cleanup; finalizers or try/finally blocks may not run as expected.
>     
> 3. **Stack reasoning** becomes harder — continuations flatten the call hierarchy.
>     

Languages that expose full continuations (Scheme, Racket) restrict them with discipline, while others (ML, Haskell) use delimited variants like `shift/reset`.

---

## In Practice

Continuations underpin modern control operators:

- **Exceptions** capture “what to do next if something fails.”
    
- **Async/await** in JS mirrors CPS under the hood.
    
- **Coroutines** suspend and resume by saving their continuation state.
    
- **Generators** (Python, C#) rely on continuation reification to yield results sequentially.
    

Understanding CPS reveals how all these features share one idea:  
execution is just **explicitly passing control**.

---

## See also

- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions & Non-local Control]]
    
- [[abstract-machines-cek-secd|Abstract Machines — CEK and SECD]]
    
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]