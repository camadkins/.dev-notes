---
title: Parametric Polymorphism & Algebraic Data Types
description: How parametric polymorphism enables generic programming and how algebraic data types structure data through products, sums, and pattern matching.
draft: false
comments: true
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - adt_product_sum.svg - illustrate product (Pair) and sum (Option) types as trees.
#  - polymorphism_universality.svg - show polymorphic function instantiated with different types.
#  - pattern_matching_flow.svg - visualize branching on sum types with exhaustive vs partial coverage.
---

## Overview
**Parametric polymorphism** and **algebraic data types (ADTs)** are foundational tools for expressing reusable, type-safe abstractions.  
They let us write code that works *for any type* while retaining full static guarantees.

> [!note]
> Polymorphism = generality of behavior.  
> ADTs = generality of structure.

Together, they allow a language to encode rich relationships between data and operations - without runtime type checks or code duplication.

---

## Parametric Polymorphism
Parametric polymorphism means that **functions and types can be written generically**, operating uniformly across all type instances.

### Example
In ML or Haskell notation:
```sml
fun id x = x
(* id : 'a -> 'a *)
````

- `'a` is a **type parameter**.
    
- The function `id` behaves the same way for `int`, `bool`, or any other type.
    

### Key Idea

The function cannot depend on the _specifics_ of `'a` - it must behave _uniformly_.  
This is enforced by the **type system**: no operations are allowed on `'a` except passing it through.

> [!tip]  
> “Parametric” means parameters appear _in_ the type; “ad hoc” polymorphism (like overloading) uses _multiple definitions_ per type.

---

## Type Schemes

Type systems express generality through **type schemes**:

```
∀α. τ
```

Read: “for all types α, the expression has type τ.”

Example:

```
id : ∀α. α → α
```

Contrast this with monomorphic typing:

```
id_int : int → int
```

### Instantiation

Each usage of a polymorphic function specializes the type:

```
id 3     : int
id true  : bool
```

---

## Algebraic Data Types (ADTs)

ADTs combine types through **product** and **sum** constructions - forming the algebra of data.

### Product Types

Combine multiple fields together (like tuples or records):

```sml
datatype pair = Pair of int * bool
(* isomorphic to int × bool *)
```

Each instance contains _both_ components.

### Sum Types

Represent alternatives - a value of _one of several shapes_:

```sml
datatype option = None | Some of int
(* isomorphic to 1 + int *)
```

|Concept|Meaning|Example|
|---|---|---|
|**Product**|“and”|`Person = Name × Age`|
|**Sum**|“or”|`Option A = None + Some A`|

> [!example]  
> **Diagram idea (`adt_product_sum.svg`)**
> 
> - Product type → one node with multiple children (fields).
>     
> - Sum type → parent node with alternative branches (constructors).
>     

---

## Parameterized ADTs

ADTs themselves can be **generic**:

```sml
datatype 'a option = None | Some of 'a
datatype ('a, 'b) pair = Pair of 'a * 'b
```

Now `option` works for _any type `'a`_, and `pair` for _any types `'a`, `'b`_`.

These are **type constructors**: they take types as arguments to build new types.

---

## Pattern Matching

Pattern matching decomposes ADTs according to their constructors:

```sml
fun size opt =
  case opt of
      None => 0
    | Some _ => 1
```

The compiler enforces:

- **Exhaustiveness:** all variants are handled.
    
- **Non-redundancy:** no unreachable patterns.
    

### Example (Nested)

```sml
datatype 'a tree = Leaf | Node of 'a * 'a tree * 'a tree

fun count t =
  case t of
      Leaf => 0
    | Node (_, l, r) => 1 + count l + count r
```

> [!tip]  
> Pattern matching is a **semantic inverse** of data construction - it unpacks the structure guaranteed by the type.

> [!example]  
> **Diagram idea (`pattern_matching_flow.svg`)**  
> Flowchart with `case` branches labeled by constructors (`None`, `Some`) showing full vs partial coverage.

---

## Laws of Parametric Polymorphism

A parametric function cannot behave differently for different type arguments - this constraint yields **free theorems** (Wadler, 1989).

For example:

```
map : ∀α β. (α → β) → List α → List β
```

must satisfy:

- **Identity:** `map id = id`
    
- **Composition:** `map (g ∘ f) = map g ∘ map f`
    

Such properties follow automatically from the function’s type alone.

> [!note]  
> These theorems are _semantic consequences_ of parametricity - not explicit syntax rules.

---

## ADTs and Data Abstraction

ADTs naturally support **data abstraction** - users manipulate values only through constructors and pattern matches.

Example (Option abstraction):

```sml
val x = Some 42
val y = None
```

Without unsafe reflection, code cannot observe hidden representation details.

### Benefits

- **Safety:** exhaustive and type-checked case coverage.
    
- **Expressiveness:** direct encoding of logical alternatives.
    
- **Composability:** ADTs interact cleanly with polymorphism.
    

---

## Relationship to Type Inference

Systems like **Hindley–Milner (HM)** automatically infer polymorphic types:

```sml
fun fst (x, _) = x
(* fst : 'a * 'b -> 'a *)
```

Rules:

1. Generalize type variables when defining functions.
    
2. Instantiate them when functions are used.
    

> [!note]  
> ADTs + HM = static polymorphism with **type inference and safety**.  
> This combination defines the type systems of ML, OCaml, and Haskell.

---

## Recursive ADTs

Recursive ADTs encode **inductive structures** like lists and trees:

```sml
datatype 'a list = Nil | Cons of 'a * 'a list
```

Their structure matches **inductive reasoning** - recursion in code corresponds to induction in proofs.

---

## Conceptual Summary

|Concept|Description|Example|
|---|---|---|
|Parametric Polymorphism|Uniform behavior for all types|`id : ∀α. α → α`|
|ADT - Product|Combine data|`Pair(a, b)`|
|ADT - Sum|Alternate cases|`Option a = None|
|Pattern Matching|Deconstruct ADTs|`case xs of Nil => ...|
|Type Inference|Generalizes automatically|`fun f x = x` → `'a -> 'a`|

> [!tip]  
> ADTs model _what data can be_, polymorphism defines _what can be done_ with it.

---

## Diagram Concepts

- `adt_product_sum.svg`: product and sum type structure.
    
- `polymorphism_universality.svg`: show the same polymorphic function applied to multiple type instantiations.
    
- `pattern_matching_flow.svg`: depict case analysis and exhaustiveness checking.
    

---

## Related Notes

- [[hindleymilner-type-inference|Hindley–Milner Type Inference]]
    
- [[records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]]
    
- [[type-systems-goals-guarantees|Type Systems - Goals & Guarantees]]