---
title: Subtyping, Variance & Type Constraints
description: How subtyping extends type systems with inheritance-like relationships, and how variance rules maintain safety in generic and functional contexts.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagrams:
#  - variance_ladder.svg — depict covariant, invariant, and contravariant relationships on a vertical ladder.
#  - function_variance.svg — show contravariant parameters and covariant results in function subtyping.
#  - bounded_types.svg — visualize upper and lower type constraints with examples of generic bounds.
---

## Overview
Subtyping adds **hierarchy** to type systems, enabling reuse and polymorphism.  
When combined with generics or functions, however, it introduces **variance problems** — subtle but essential for type safety.

> [!note]
> Subtyping extends type systems *horizontally* (via relationships between types), while parametric polymorphism extends them *vertically* (via generic abstraction).

---

## What Is Subtyping?
A type `A` is a **subtype** of `B` (`A <: B`) if every value of `A` can safely be used wherever a `B` is expected.

Formally:
```

A <: B ⇒ for all contexts C[•], if C[B] is valid, then C[A] is valid

````
This property is known as **substitutability** — the foundation of type-safe reuse.

Example:
```java
class Animal {}
class Dog extends Animal {}

Animal a = new Dog();  // OK: Dog <: Animal
````

> [!tip]  
> Subtyping ≠ inheritance, but many OO languages conflate the two.  
> In pure type theory, subtyping is a _semantic relation_, not a syntactic one.

---

## The Subtyping Relation

Subtyping is **reflexive** and **transitive**:

```
A <: A
A <: B  and  B <: C  ⇒  A <: C
```

Languages extend this with additional rules for:

- **Function types**
    
- **Product / record types**
    
- **Union and intersection types**
    
- **Generic type constructors**
    

---

## Function Types and Variance

Functions flip the direction of subtyping on parameters.

```
(A → B) <: (A' → B')  ⇔  A' <: A  ∧  B <: B'
```

|Component|Direction|Intuition|
|---|---|---|
|**Parameter (input)**|Contravariant|Accepts _more general_ arguments|
|**Result (output)**|Covariant|Returns _more specific_ results|

Example (in type-lambda form):

```
Parent → Child  <:  Animal → Object
```

Because:

- `Animal` is broader than `Parent` (contravariant on input),
    
- `Child` is narrower than `Object` (covariant on output).
    

> [!example]  
> **Diagram (`function_variance.svg`)**  
> Arrows showing how subtyping reverses on inputs and preserves direction on outputs.

---

## Variance of Type Constructors

When a type constructor `F` (like `List` or `Box`) wraps a type `T`, the question arises:

> If `A <: B`, does that imply `F[A] <: F[B]`?

### Possible Answers

|Variance|Rule|Example|Safe For|
|---|---|---|---|
|**Covariant**|`A <: B ⇒ F[A] <: F[B]`|`List[Dog] <: List[Animal]`|Read-only containers|
|**Contravariant**|`A <: B ⇒ F[B] <: F[A]`|`Comparator[Animal] <: Comparator[Dog]`|Consumers (function arguments)|
|**Invariant**|Neither direction holds|`Array[Dog] ≮: Array[Animal]`|Mutable containers|

> [!warning]  
> Covariance becomes unsafe when mutation is allowed — you could insert a `Cat` into an array of `Dog`.

---

## Example — Why Arrays Are Invariant

Java allows **covariant arrays**, but it’s unsound:

```java
Animal[] animals = new Dog[1];
animals[0] = new Cat(); // Runtime ArrayStoreException
```

The type system lets it compile but must insert runtime checks to preserve safety.  
Modern designs (like generics in Java or C#) default to **invariance** for mutable types.

---

## Variance Ladder

Covariance, invariance, and contravariance form a conceptual ladder of generality.

|Variance|Symbol|Meaning|Example|
|---|---|---|---|
|Covariant|`+`|Preserves subtyping|`List[+T]`|
|Invariant|`0`|No subtyping|`Array[T]`|
|Contravariant|`-`|Reverses subtyping|`Func[-T]`|

> [!example]  
> **Diagram (`variance_ladder.svg`)**  
> Three stacked levels with arrows showing direction of substitution.

---

## Bounded Type Parameters

To control variance and maintain soundness, languages introduce **type bounds**:

### Upper Bounds

`T <: U` — type parameter `T` must be a subtype of `U`.

```java
class Box<T extends Number> { ... }
```

### Lower Bounds

`L <: T` — type parameter `T` must be a supertype of `L`.

```java
void copy(List<? super Integer> dest, List<? extends Integer> src)
```

These enable _safe reuse_ across hierarchies:

- Upper bounds restrict outputs.
    
- Lower bounds restrict inputs.
    

> [!example]  
> **Diagram (`bounded_types.svg`)**  
> Vertical arrow diagram showing allowed instantiations under `extends` and `super`.

---

## Type Constraints and Type Inference

Type inference engines enforce and propagate subtyping relations:

```
Γ ⊢ e : A
A <: B
──────────────
Γ ⊢ e : B
```

This _subsumption rule_ allows using an expression of a subtype wherever a supertype is expected.

Constraints (`T <: U`, `L <: T`) form a **constraint graph**, solved during compilation.

> [!note]  
> In Hindley–Milner-like systems, explicit subtyping is often replaced by typeclass constraints or structural matching.

---

## Interaction with Polymorphism

Subtyping and polymorphism interact in two main ways:

1. **Ad-hoc polymorphism (overloading)** — multiple implementations for distinct subtypes.
    
2. **Parametric polymorphism** — one generic definition for all types.
    
3. **Subtype polymorphism** — one definition reused through subtyping hierarchy.
    

> [!tip]  
> Languages like Scala, Kotlin, and TypeScript unify these under flexible variance annotations and bounded generics.

---

## Conceptual Summary

|Concept|Meaning|Rule|
|---|---|---|
|**Subtyping**|Safe substitutability|`A <: B`|
|**Variance**|How subtyping lifts through type constructors|Covariant (+), Contravariant (-), Invariant (0)|
|**Function Subtyping**|Inputs contra, outputs co|`(A→B) <: (A'→B')` if `A' <: A` and `B <: B'`|
|**Bounds**|Restrict valid substitutions|`T <: U`, `L <: T`|
|**Constraints**|Relations solved during inference|`Γ ⊢ e : A` and `A <: B ⇒ Γ ⊢ e : B`|

---

## See also

- [[cs/pl/hindleymilner-type-inference|Hindley–Milner Type Inference]]
    
- [[cs/pl/type-systems-goals-guarantees|Type Systems — Goals & Guarantees]]
    
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]]
    
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & ADTs]]