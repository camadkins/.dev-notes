---
title: Exceptions, Handlers, and Non-Local Control
description: How exceptions provide structured non-local control flow, propagate through call stacks, and relate to continuations and resource cleanup.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagram: exception_propagation_flow.svg — visualize stack frames, an exception being raised, handlers catching, and finally-block cleanup.
---

## Why Exceptions Exist
Most programs fail sometimes.  
Exceptions give a structured, predictable way to handle errors and other “unusual” outcomes without cluttering normal control flow.  
Instead of returning special codes or flags everywhere, exceptions let a computation *jump* directly to the nearest handler that can deal with the problem.

This jump is a form of **non-local control** — skipping normal return paths and transferring execution elsewhere.

> [!note]
> The key is *structured escape*: exceptions let you leave multiple nested function calls in a single step while maintaining cleanup guarantees.

---

## The Semantics of Raising and Handling
When an exception is raised, the program begins **stack unwinding** — discarding active frames until a matching handler is found.

Formally, we can model this using **big-step semantics**:
```

⟨raise e, σ⟩ ⇓ exception(e)  
⟨try e1 with x -> e2, σ⟩ ⇓ v if ⟨e1, σ⟩ ⇓ v  
⟨try e1 with x -> e2, σ⟩ ⇓ v2 if ⟨e1, σ⟩ ⇓ exception(v1) and ⟨e2[x ← v1], σ⟩ ⇓ v2

````
These rules mean:
- If `e1` runs normally, no exception is caught.
- If `e1` raises, the handler binds the value and continues.

> [!example]
> ```pseudo
> try {
>   open h; f(); close h
> } with ex -> close h; 0
> ```
> Even if `f()` fails, the handler executes `close h`.  
> This is how *finally* or *RAII* ensures resource safety.

---

## Stack Unwinding
During propagation, the runtime walks back through stack frames:
1. If a frame has a `try/with` or `catch` block, control transfers there.  
2. Otherwise, it’s discarded.  
3. Cleanup actions run as the stack unwinds.

> [!tip]
> **Finally** blocks run whether or not an exception occurred.  
> This symmetry keeps side effects (like closing files) consistent across both normal and exceptional paths.

---

## Determinism and Propagation
With a single active exception and one nearest enclosing handler, propagation is deterministic — there’s no ambiguity about where control goes.  
If the handler itself raises another exception, the process continues upward.

Languages differ in how they handle *multiple matches*:
- **ML / OCaml:** first syntactic match wins.  
- **Python / Java:** first matching type in lexical order.  
- **Haskell:** exceptions are typed and use monadic propagation (`Either`, `IO`).

> [!warning]
> Catch-all handlers (`catch (Exception e) { ... }`) are dangerous: they can swallow programming errors, leaving the program in a corrupted state.

---

## Exceptions as Continuations
Exceptions can be modeled directly in **Continuation-Passing Style (CPS)**:
- The *normal continuation* represents “what to do next if all goes well.”  
- The *exception continuation* represents “what to do if an error occurs.”

When an exception is raised, the computation invokes the *exception continuation*, skipping the normal path entirely.

> [!note]
> This equivalence shows that exceptions are not a separate mechanism — they’re structured continuations with one entry (raise) and one recovery point (handler).

---

## Example: Translating to CPS
Consider:
```scheme
(try (f x) with e -> g e)
````

Translates roughly to:

```scheme
(f* x  (λv. v)  (λe. g e))
```

Here `f*` takes two continuations:

- the normal continuation `(λv. v)`
    
- and the exceptional continuation `(λe. g e)`
    

If `f*` calls its second continuation, control jumps directly to the handler, bypassing everything in between.

This insight connects exception semantics to abstract machines (like CEK/SECD), which explicitly represent continuations as part of runtime state.

---

## Dynamic Extent and Lifetime

Handlers have **dynamic extent** — they exist only while their associated block is active.  
Once control leaves the block (normally or via another exception), the handler is gone.

This is why re-entering an old handler or jumping into a closed scope causes undefined behavior in low-level languages.  
Languages like JavaScript or Python disallow it by design; Scheme permits it only through delimited continuations.

---

## Exception Safety

Exception safety means guaranteeing consistent state after an error.  
In practice, this means:

1. **Basic guarantee:** invariants are preserved; program continues in a valid state.
    
2. **Strong guarantee:** either the operation completes or no effect occurs.
    
3. **No-throw guarantee:** an operation can’t raise exceptions at all.
    

C++ enforces this explicitly through RAII (Resource Acquisition Is Initialization): destructors automatically run during stack unwinding.

> [!tip]  
> In functional languages, purity often replaces exception safety — immutable data ensures that partially completed computations can’t corrupt shared state.

---

## Common Pitfalls

> [!warning]
> 
> 1. **Swallowing exceptions:** catching everything hides real bugs.
>     
> 2. **Effect reordering:** lazy or asynchronous evaluation can defer side effects, so exceptions appear “out of order.”
>     
> 3. **Uncaught exceptions:** reaching the top level often terminates the process.
>     
> 4. **Mixed paradigms:** mixing exceptions with monads, promises, or callbacks can lead to duplicated error paths.
>     

Always prefer localized handlers near the point of recovery, not at the outermost level.

---

## Exceptions vs Other Control Mechanisms

|Mechanism|Type|Resumable?|Purpose|
|---|---|---|---|
|`return`|Local|No|Normal completion|
|`break` / `continue`|Local|No|Loop control|
|`throw` / `raise`|Non-local|No (usually)|Error signaling|
|`call/cc`|General|Yes|Capturing continuations|
|`yield`|Delimited|Yes|Coroutines, generators|

Resumable exceptions (e.g., Smalltalk, Common Lisp) blur this line by allowing the handler to resume the computation rather than abort it.  
Modern systems rarely support this directly because it complicates reasoning about state.

---

## Diagram Explanation — Exception Propagation Flow

The diagram (`exception_propagation_flow.svg`) should show:

1. **Stack frames**: function calls nested vertically.
    
2. A red arrow labeled `raise e` moving upward, skipping intermediate frames.
    
3. A highlighted frame labeled “handler,” where control resumes.
    
4. Side arrows labeled “finally” or “cleanup” running on the way up.
    
5. A successful catch transferring execution horizontally to the handler’s body.
    

This visualization helps students see exception handling as structured _stack unwinding_ rather than arbitrary jumps.

---

## In Practice

Most modern languages unify exception handling with structured cleanup and type checking:

- **Python / Java / C#:** exceptions integrate with resource management (`try-with-resources`).
    
- **OCaml / Haskell:** prefer algebraic error types but still support runtime exceptions.
    
- **Rust:** avoids exceptions entirely; it encodes error propagation via `Result<T, E>` and pattern matching.
    

Understanding exceptions through **non-local control** clarifies why they interact cleanly with continuations, CPS, and semantics — they’re all different views of the same idea: **control as a first-class value**.

---

## See also

- [[cs/pl/continuations-cps|Continuations & CPS]]
    
- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics — Big-Step & Small-Step]]
    
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]