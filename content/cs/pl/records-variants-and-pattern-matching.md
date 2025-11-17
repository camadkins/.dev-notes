---
title: Records, Variants, and Pattern Matching
description: Structural aggregates and sum types; how pattern matching decomposes them and ensures type-safe exhaustive handling.
draft: false
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - record_vs_tuple.svg — compare labeled fields vs positional tuples.
#  - variant_tree.svg — show constructors as branches under a sum type.
#  - match_exhaustiveness.svg — visualize coverage and redundant pattern checks.
---

## Overview
Modern programming languages provide **structured data** through *records* and *variants*.  
Records capture fixed labeled collections of values; variants encode distinct alternatives.  
Together, they form the foundation for **algebraic data types (ADTs)** and safe **pattern matching**.

> [!note]
> Records = product types (fields combined).  
> Variants = sum types (one alternative active).  
> Pattern matching = selective decomposition of those structures.

---

## Records: Product Structures
A **record** groups labeled fields together into one value.  
Unlike tuples, fields are identified by **names** rather than position.

Example (OCaml):
```ocaml
type point = { x: float; y: float }

let move p dx dy = { x = p.x +. dx; y = p.y +. dy }
````

Records make code more self-documenting and robust to field reordering.

|Concept|Tuple|Record|
|---|---|---|
|Identification|by position|by label|
|Extensibility|rigid|flexible (with optional defaults)|
|Example|`(1.0, 2.0)`|`{x=1.0; y=2.0}`|

> [!example]  
> **Diagram (`record_vs_tuple.svg`)**  
> Show two boxes — one positional (tuple) and one labeled (record) — both containing the same values, emphasizing how field names improve readability.

---

## Variants: Sum Structures

A **variant** (also called a _tagged union_) represents a value that can take one of several labeled forms.

Example:

```ocaml
type shape =
  | Circle of float
  | Square of float
  | Rectangle of float * float
```

Each constructor (`Circle`, `Square`, `Rectangle`) tags its data.  
The compiler tracks which variant is active at runtime.

> [!note]  
> Variants correspond to **sum types**:  
> `Shape = Circle(radius) + Square(side) + Rectangle(width,height)`.

Variants can be nested, parameterized, or recursive — enabling expressive hierarchies like:

```ocaml
type 'a tree = Leaf | Node of 'a * 'a tree * 'a tree
```

---

## Pattern Matching

**Pattern matching** destructures values according to their constructors or record fields.

Example:

```ocaml
let area s =
  match s with
  | Circle r -> Float.pi *. r *. r
  | Square a -> a *. a
  | Rectangle (w, h) -> w *. h
```

Each clause tests the constructor and binds its contents to names.  
Pattern matching replaces chains of conditionals with a concise, declarative form.

> [!tip]  
> Matching is _exhaustive_ and _typed_ — every case is checked for consistency by the compiler.

---

## Nested and Guarded Patterns

Patterns can be nested or combined with **guards** for finer control:

```ocaml
match s with
| Rectangle (w, h) when w = h -> "square"
| Rectangle _ -> "rectangle"
| Circle _ -> "circle"
```

Guards (`when ...`) allow conditional matching beyond constructor names.  
Nested patterns can directly decompose structures:

```ocaml
match node with
| Node (x, Leaf, _) -> x
| Node (_, l, r) -> traverse l; traverse r
| Leaf -> ()
```

---

## Exhaustiveness and Redundancy

Compilers perform **exhaustiveness checking** to ensure that every possible variant is handled.  
They also warn about **redundant** (unreachable) patterns.

Example:

```ocaml
match s with
| Circle r -> r*r
| _ -> 0  (* covers all remaining variants *)
```

> [!warning]  
> Non-exhaustive matches cause runtime errors in many languages.  
> Some, like Haskell and OCaml, statically detect missing cases and issue warnings.

> [!example]  
> **Diagram (`match_exhaustiveness.svg`)**  
> Tree visualization: branches for each variant, with missing leaves highlighted as uncovered.

---

## Record Patterns

Pattern matching also works on record fields:

```ocaml
match p with
| { x; y } when x = y -> "diagonal"
| { x; y } -> "non-diagonal"
```

Each field can be selectively matched or ignored:

```ocaml
| { x; _ } -> x
```

Renaming is allowed during binding:

```ocaml
| { x = x_pos; y = y_pos } -> (x_pos, y_pos)
```

> [!note]  
> Partial record patterns are permitted — unmentioned fields are ignored.

---

## Variants with Parameters

Constructors can carry arbitrary payloads:

```ocaml
type value =
  | Int of int
  | Float of float
  | Pair of value * value
```

Each case introduces new bindings during a match:

```ocaml
match v with
| Int n -> string_of_int n
| Pair (a, b) -> "(" ^ show a ^ ", " ^ show b ^ ")"
```

This recursive style forms the basis of interpreters, compilers, and type checkers.

---

## Design Pitfalls

> [!warning]
> 
> - **Missing constructors** → non-exhaustive matches.
>     
> - **Shadowed patterns** → redundant code that never executes.
>     
> - **Variant misuse** → applying the wrong constructor or mismatched arguments.
>     
> - **Overly broad `_` patterns** → suppress exhaustiveness checking, hiding bugs.
>     

> [!tip]  
> Treat `_` as a _temporary placeholder_ during prototyping — replace it with explicit cases for maintainability.

---

## Conceptual Summary

|Concept|Description|Example|
|---|---|---|
|**Record**|Labeled product of values|`{x=1; y=2}`|
|**Variant**|Tagged alternative forms|`Circle r|
|**Pattern Match**|Structured deconstruction|`match s with ...`|
|**Exhaustiveness**|All cases handled|compiler check|
|**Guards**|Conditional refinement|`when w = h`|

---

## Diagram Concepts

- `record_vs_tuple.svg`: labels vs positions in structured data.
    
- `variant_tree.svg`: constructors and their branches.
    
- `match_exhaustiveness.svg`: tree showing coverage analysis.
    

---

## See also

- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & ADTs]]
    
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]]
    
- [[cs/pl/language-design-values-variables-environments|Values, Variables & Environments]]
    
- [[cs/pl/type-systems-goals-guarantees|Type Systems — Goals & Guarantees]]