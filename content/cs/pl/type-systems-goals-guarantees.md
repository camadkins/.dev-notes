---
title: Type Systems — Goals & Guarantees
description: Why programming languages enforce types, how static typing ensures safety through soundness, and what guarantees emerge from progress and preservation.
draft: true
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - type_system_overview.svg — overview: source → type checker → evaluation → result.
#  - static_vs_dynamic.svg — contrast static vs dynamic typing with pipeline diagrams.
#  - type_safety_pipeline.svg — reused from “Type Soundness — Progress & Preservation.”
---

## Overview
A **type system** is a formal method for classifying program phrases according to the *kinds of values* they compute.  
It acts as a **static contract** between programmer and compiler — ensuring that operations are applied only to compatible values.

> [!note]
> The type system doesn’t predict the *result* of computation — only that the computation will make sense.

---

## Motivation
Types serve multiple overlapping goals:

1. **Safety** — prevent runtime errors (e.g., adding numbers to strings).  
2. **Abstraction** — describe interfaces and modules.  
3. **Documentation** — types communicate program intent.  
4. **Optimization** — compilers use type information for efficient code generation.  
5. **Proof connection** — under Curry–Howard, types correspond to logical propositions.

> [!tip]
> “A type system is a lightweight proof system that every programmer uses.” — Benjamin Pierce

---

## Static vs Dynamic Typing
| Aspect | Static Typing | Dynamic Typing |
|--------|----------------|----------------|
| **Checking** | Compile-time | Runtime |
| **Error detection** | Early (before execution) | Late (during execution) |
| **Flexibility** | Restrictive but safe | Flexible but risky |
| **Examples** | Haskell, Java, Rust | Python, JavaScript, Lisp |

### Example
Static typing rejects this program *before* running:
```ml
3 + true  (* type error: cannot add Bool to Int *)
````

Dynamic typing detects it _at runtime_:

```python
3 + True  # raises TypeError
```

> [!example]  
> **Diagram (`static_vs_dynamic.svg`)**  
> Two parallel flows: one showing compile-time type check → safe execution,  
> and one showing runtime type error during evaluation.

---

## Type Judgments and Rules

Type systems are defined by **typing judgments** of the form:

```
Γ ⊢ e : T
```

Read as “under context Γ (a mapping of variables to types), expression `e` has type `T`.”

Each rule constrains how valid programs are built.

### Example — Arithmetic

```
⊢ n : Int
⊢ m : Int
───────────────────────
⊢ n + m : Int
```

### Example — Function Abstraction

```
Γ, x:T₁ ⊢ e : T₂
────────────────────────────
Γ ⊢ (λx:T₁. e) : T₁ → T₂
```

The combination of these rules defines _what programs are well-typed_ in a language.

---

## Type Soundness

The **goal** of any well-designed type system is _soundness_ — that is:

> **A well-typed program will not “go wrong.”**

Formally, type soundness is the combination of:

- **Progress** — a well-typed expression is either a value or can take a step.
    
- **Preservation** — evaluation preserves types across each step.
    

These correspond to **safety** and **stability** of execution.

|Theorem|Statement|Meaning|
|---|---|---|
|**Progress**|If `⊢ e : T`, then `e` is a value or `e → e'`.|Never gets stuck.|
|**Preservation**|If `⊢ e : T` and `e → e'`, then `⊢ e' : T`.|Type consistency holds.|

> [!note]  
> Together, they imply that **typed programs can only “go wrong” if the type checker is wrong.**

> [!example]  
> **Diagram (`type_safety_pipeline.svg`)**  
> Flow: `Source → Type Checker → Evaluator → Result`,  
> with “Progress” and “Preservation” labeled at the transition and feedback stages.

---

## Example: Preventing Stuck States

Consider this untyped fragment:

```ml
if 3 then true else false
```

Evaluation gets stuck — `3` isn’t a Boolean.

Adding typing prevents this:

```
⊢ if e1 then e2 else e3 : T
  requires ⊢ e1 : Bool  and  ⊢ e2 : T, ⊢ e3 : T
```

Thus the ill-typed form never reaches execution.

> [!warning]  
> A _stuck term_ is syntactically valid but has no reduction rule — the classic indicator of a type error.

---

## Nominal vs Structural Typing

|Model|Basis|Example|
|---|---|---|
|**Nominal**|Explicit declarations (by name)|Java, C#, Swift|
|**Structural**|Compatibility by shape (fields, members)|TypeScript, OCaml, Go|

### Example (Structural)

```ocaml
type point = { x: int; y: int }
type pixel = { x: int; y: int; color: string }

(* point and pixel share structure, but differ by field sets *)
```

### Example (Nominal)

```java
class Point { int x, y; }
class Pixel extends Point { String color; }
```

Nominal typing enforces hierarchy; structural typing favors flexibility.

---

## Weak vs Strong Typing

|Property|Weak Typing|Strong Typing|
|---|---|---|
|**Conversions**|Implicit and lenient|Explicit and enforced|
|**Examples**|C, JavaScript|Rust, ML, Haskell|

Example:

```c
int x = 1;
float y = x + 0.5; // implicit conversion — weakly typed
```

```rust
let x: i32 = 1;
let y = x as f32 + 0.5; // explicit cast — strongly typed
```

> [!note]  
> “Strong” ≠ “Static.” A dynamically typed language can still be strong (e.g., Python disallows `3 + "a"`).

---

## Types as Logical Propositions

Under the **Curry–Howard correspondence**:

|Programming|Logic|
|---|---|
|Term `e`|Proof|
|Type `T`|Proposition|
|`Γ ⊢ e : T`|“`e` is a proof of `T`”|

Thus, type checking is _proof verification_, and type inference is _proof search_.

> [!tip]  
> Every type rule corresponds to an inference rule in logic.  
> For example, function types mirror implication (`→`), and product types mirror conjunction (`∧`).

---

## Extending Type Systems

Once the fundamentals (soundness, safety, progress) are established, languages add richer features:

- **Polymorphism:** generalize over types (`∀α. α → α`).
    
- **Subtyping:** allow safe substitution (`A <: B`).
    
- **Effects & Monads:** track stateful or impure computations.
    
- **Dependent Types:** allow types to depend on values.
    
- **Refinements:** encode logical predicates within types.
    

Each extension must re-prove **progress** and **preservation**, maintaining the safety invariant.

---

## Conceptual Summary

|Goal|Guarantee|Consequence|
|---|---|---|
|**Type Checking**|Detects errors statically|No runtime type mismatches|
|**Progress**|Well-typed programs reduce|No stuck states|
|**Preservation**|Reduction preserves types|Type safety|
|**Soundness**|Progress + Preservation|“Well-typed programs do not go wrong”|

> [!note]  
> Type systems don’t guarantee correctness — only _well-formedness_.  
> A well-typed infinite loop is still infinite.

---

## Diagram Concepts

- `type_system_overview.svg`: Pipeline showing typing and evaluation phases.
    
- `static_vs_dynamic.svg`: Contrast two execution models with error timing.
    
- `type_safety_pipeline.svg`: Shared visual of progress and preservation interplay.
    

---

## See also

- [[cs/pl/type-soundness-progress-preservation|Type Soundness — Progress & Preservation]]
    
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]]
    
- [[cs/pl/hindleymilner-type-inference|Hindley–Milner Type Inference]]
    
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & ADTs]]