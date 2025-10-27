---
title: Hindley–Milner & Type Inference
description: How the Hindley–Milner (HM) type system infers principal types using unification, let-polymorphism, and Algorithm W.
draft: true
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# diagram: hm_type_inference_flow.svg — visualize Algorithm W’s flow: constraint generation, unification, generalization, and instantiation at use sites.
---

## Overview
The **Hindley–Milner type system (HM)** is the foundation of type inference in functional languages such as ML, OCaml, and Haskell (in their pure fragments).  
Its power lies in automatically assigning the *most general* — or **principal** — types to expressions *without explicit annotations*.

HM achieves this by combining:
1. **Polymorphism** (via universal quantification).  
2. **Constraint-based reasoning** (through unification).  
3. **Let-generalization** (creating reusable polymorphic definitions).

> [!note]
> HM is sometimes called the *Damas–Milner* system, after the formal proofs that established its soundness and completeness.

---

## Core Concepts
### 1. Types and Type Schemes
A **type** describes a single shape of value (e.g. `Int → Int`).  
A **type scheme** generalizes a type over one or more variables:
```

∀α. α → α

```
means: for *any* type `α`, this expression maps `α` to itself.

In HM:
- **Monotypes (τ):** concrete or variable types (`Int`, `α → β`).
- **Polytypes (σ):** universally quantified schemes (`∀α. τ`).

### 2. Type Environment
The environment (Γ) maps identifiers to type schemes:
```

Γ = { id : ∀α. α → α, 3 : Int, true : Bool }

````
During inference, Γ expands as we process `let` bindings or lambda abstractions.

---

## The Essence of HM Polymorphism
HM supports **let-polymorphism**, meaning only `let`-bound definitions are generalized.  
Functions created anonymously (`λx. e`) are *monomorphic* until bound to a name.

### Example
```ml
let id = λx. x in (id 3, id true)
````

1. `id` is assigned a fresh variable type: `α → α`.
    
2. At the `let`, we **generalize** `α`, producing the scheme `∀α. α → α`.
    
3. When used, each `id` is **instantiated** independently:
    
    - First as `Int → Int`
        
    - Then as `Bool → Bool`  
        Thus, the expression has type `(Int, Bool)`.
        

> [!tip]  
> “Generalize at definition, instantiate at use.”  
> This simple rule is the engine of polymorphism in HM.

---

## Algorithm W — Structure

Algorithm W is the canonical type inference procedure for HM.  
It systematically traverses an expression and synthesizes a type along with a _substitution_ (mapping of type variables to concrete types).

Each inference step returns `(S, τ)` — a substitution and a type.

### Step-by-step Skeleton

1. **Variables**
    
    ```
    W(Γ, x) = (∅, instantiate(Γ(x)))
    ```
    
    Look up `x` in the environment and instantiate its scheme.
    
2. **Lambda (λx.e)**
    
    ```
    W(Γ, λx.e) =
        let α be fresh
        W(Γ ∪ {x:α}, e) = (S1, τ1)
        return (S1, S1(α → τ1))
    ```
    
    Assign a fresh type variable to the argument and infer the body.
    
3. **Application (e1 e2)**
    
    ```
    W(Γ, e1 e2) =
        W(Γ, e1) = (S1, τ1)
        W(S1Γ, e2) = (S2, τ2)
        α fresh
        S3 = unify(S2(τ1), τ2 → α)
        return (S3∘S2∘S1, S3(α))
    ```
    
    Enforce that `e1`’s type is a function taking `e2`’s type as input.
    
4. **Let-binding (let x = e1 in e2)**
    
    ```
    W(Γ, let x = e1 in e2) =
        W(Γ, e1) = (S1, τ1)
        σ = generalize(S1Γ, τ1)
        W(S1Γ ∪ {x:σ}, e2) = (S2, τ2)
        return (S2∘S1, τ2)
    ```
    
    Infer `e1`, generalize over unbound type variables, and use in `e2`.
    

---

## Constraint Generation and Unification

### 1. Constraints

Every subexpression generates **type equality constraints** that must hold.  
For example:

```
f x → f : α → β, x : α ⇒ result : β
```

creates the constraint:  
`f` must have a function type from `α` to `β`.

### 2. Unification

Unification is the process of solving these constraints — finding substitutions that make both sides identical.

#### Example

```
unify(α → Int, Bool → β)
```

yields `{ α ↦ Bool, β ↦ Int }`.

> [!warning]  
> Unification fails if you try to equate incompatible structures, e.g. `Int` and `Bool`, or recursive types like `α = α → β`.

---

## Let-Generalization and Instantiation

Generalization turns a monotype into a type scheme by quantifying over _free variables_ that don’t appear in the environment.

```
generalize(Γ, τ) = ∀α. τ
   where α ∈ free(τ) – free(Γ)
```

Instantiation replaces quantified variables with fresh ones:

```
instantiate(∀α. τ) = τ[α ↦ α₁, α₂, …]
```

Together, these steps allow the system to reuse polymorphic bindings safely while preserving soundness.

---

## Example: Type Inference by Hand

Consider:

```ml
let compose = λf. λg. λx. f (g x)
in compose
```

1. Assign fresh variables:
    
    ```
    f : α, g : β, x : γ
    ```
    
2. Infer inside out:
    
    - `g x` ⇒ requires `β = γ → δ`
        
    - `f (g x)` ⇒ requires `α = δ → ε`
        
3. Therefore:
    
    ```
    compose : (δ → ε) → (γ → δ) → γ → ε
    ```
    
4. Generalize all free variables:
    
    ```
    ∀α β γ δ ε. (δ → ε) → (γ → δ) → γ → ε
    ```
    
    or simplified:
    
    ```
    ∀a b c. (b → c) → (a → b) → a → c
    ```
    

> [!note]  
> This example illustrates how nested lambdas and applications accumulate constraints that unify into the final principal type.

---

## Principal Types

The **principal type** is the most general type that any other valid type can be derived from by substitution.

Formally:

> A type `σ` is principal for expression `e` in environment `Γ` if for every other type `σ'` such that `Γ ⊢ e : σ'`,  
> there exists a substitution `S` with `S(σ) = σ'`.

This ensures type inference is **complete** — it finds the single most general typing consistent with the program.

> [!tip]  
> Principal types guarantee _modularity_: changing how a polymorphic function is used never changes its own definition’s type.

---

## Implementation Details

### Substitutions

Substitutions map type variables to types and must be applied recursively throughout the environment and all pending constraints.

```
S = { α ↦ Int, β ↦ Bool → γ }
S(Int → β) = Int → (Bool → γ)
```

Composition of substitutions (`S2 ∘ S1`) means “apply S1, then S2”.

### Occurs Check

Unification must prevent infinite recursive types:

```
unify(α, α → Int)  → fail
```

because it would imply an infinite type structure.

### Efficiency

Algorithm W runs in almost linear time in practice, though pathological cases (deeply nested polymorphism) can increase complexity.

---

## Extensions Beyond Classic HM

The pure HM system assumes a purely functional, first-order, let-bound environment.  
Modern languages extend it in several directions:

|Extension|Purpose|Example System|
|---|---|---|
|**Type classes / constraints**|Overloaded polymorphism|Haskell|
|**Rank-n polymorphism**|Quantifiers inside function arguments|GHC extensions|
|**Generalized algebraic data types (GADTs)**|Refinement of type relationships|OCaml, Haskell|
|**Row polymorphism**|Extensible records / variants|OCaml, TypeScript, Koka|
|**Effect systems**|Track purity or side effects|Koka, Eff, F★|

> [!note]  
> Each extension adds expressive power but often breaks HM’s guarantee of principal types — inference becomes partial or requires user annotations.

---

## Diagram Explanation — Algorithm W Flow

`hm_type_inference_flow.svg` should illustrate:

1. Expression tree traversal by Algorithm W.
    
2. For each node: generation of constraints, unification of types, and substitution propagation.
    
3. A `let` node showing generalization into a type scheme and instantiation at use sites.
    
4. Arrows labeled `S1`, `S2`, `S3` showing substitution composition order.
    

This makes the interaction between environment, constraints, and unification visible at a glance.

---

## Common Pitfalls

> [!warning]
> 
> - Forgetting to **generalize** at a `let` — losing polymorphism.
>     
> - Failing to apply **all substitutions** when unifying nested expressions.
>     
> - Omitting the **occurs check**, leading to infinite types.
>     
> - Confusing **instantiation** (use site) with **generalization** (definition site).
>     
> - Assuming polymorphism applies to lambdas; it applies only to `let`.
>     

---

## See also

- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & ADTs]]
    
- [[cs/pl/type-soundness-and-progress|Type Soundness & Progress Theorems]]
    
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]
    
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order & Strictness]]