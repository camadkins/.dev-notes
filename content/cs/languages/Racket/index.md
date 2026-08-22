---
title: Racket
description: "MoC for Racket - language design experiments, macros, and course-related artifacts."
draft: false
comments: false
tags:
  - cs
  - languages
date: 2025-10-16
updated:
aliases: []
---

Racket is this section's control case. Every other folder here answers the generics question with a static type system of some kind, so it is worth having one language that solves the same problems without one. Parametric polymorphism arrives through contracts checked at runtime, specialization arrives through macros that generate the code a template would have generated, and parameterized components arrive through units rather than type parameters. The claim underneath all of it is that you build a language rather than a library, which reframes what the other folders are trading against.

Read the core layer first. The macro system, the module system, and the typed layer all assume you know what a syntax object is and what the expander does with it.

### The core: reading, expanding, evaluating

- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation in Racket]] - the reader and expander as two separate layers, and why `read-syntax` produces something richer than a list
- [[cs/languages/Racket/language-design-from-core-to-surface-racket|Racket: From Core to Surface]] - desugaring a rich surface syntax into a small core with precise semantics
- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching in Racket]] - what `struct` binds, why opacity is the default, and how generativity bites

### Polymorphism without a type checker

The folder's answer to the section's question, built out of runtime boundaries instead of static ones.

- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - a boundary rather than an assertion, and the flat, chaperone, impersonator hierarchy underneath
- [[cs/languages/Racket/parametric-polymorphism-through-contracts|Parametric Polymorphism Through Contracts]] - an opaque wrapper enforcing at runtime a stronger claim than a type parameter makes
- [[cs/languages/Racket/generic-interfaces-and-gen-colon|Generic Interfaces and the gen Prefix]] - a method table riding on a structure type property, dispatched by argument name
- [[cs/languages/Racket/racket-generics-libraries-and-dispatch|racket/generic in Practice, Fallbacks and Dispatch]] - the four places a generic call can land, and implemented against merely supported

### Typed Racket, where the types do show up

- [[cs/languages/Racket/typed-racket-and-gradual-typing|Typed Racket and Gradual Typing]] - runtime enforcement is what separates this from an optional checker
- [[cs/languages/Racket/occurrence-typing|Occurrence Typing]] - a predicate whose type carries a logical proposition, and what breaks the narrowing
- [[cs/languages/Racket/polymorphic-types-in-typed-racket|Polymorphic Types in Typed Racket]] - `All`, the kind distinction between a type and a type constructor, and where inference gives up
- [[cs/languages/Racket/typed-untyped-boundaries-and-contract-generation|Typed-Untyped Boundaries and Contract Generation]] - compiling a type into a contract, deciding blame, and the types that cannot be translated

### Macros as the specialization mechanism

Where a C++ template generates code, Racket writes the generator by hand and the language gives it a real theory.

- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules in Racket]] - pattern variables, ellipses, and hygiene as an outcome rather than a rule
- [[cs/languages/Racket/syntax-objects-and-lexical-context|Syntax Objects and Lexical Context]] - a datum plus a scope set plus a source location, carried together
- [[cs/languages/Racket/syntax-parse-and-specification-driven-macros|syntax-parse and Specification-Driven Macros]] - syntax classes as named grammar productions, and macros written as specifications
- [[cs/languages/Racket/macro-expansion-order-and-partial-expansion|Macro Expansion Order and Partial Expansion]] - the expander as a small-step machine, and `local-expand`'s stop list
- [[cs/languages/Racket/compile-time-computation-and-begin-for-syntax|Compile-Time Computation and begin-for-syntax]] - phase levels as separate instantiations, and what that buys over running code early

### Modules and the language tower

- [[cs/languages/Racket/the-module-system-and-require-provide|The Module System and require/provide in Racket]] - a static binding structure the compiler can trust, not a runtime table of names
- [[cs/languages/Racket/units-and-signatures|Units and Signatures in Racket]] - first-class parameterized components, and the mutual dependency modules cannot express
- [[cs/languages/Racket/languages-as-modules-and-hash-lang|Languages as Modules and #lang]] - what a `#lang` line resolves to, and the two-location lookup behind it
- [[cs/languages/Racket/reader-extension-and-custom-syntax|Reader Extension and Custom Syntax in Racket]] - notation that is not s-expressions at all, inside a Racket program

### Control

- [[cs/languages/Racket/proper-tail-calls-and-the-loop-question|Proper Tail Calls and the Loop Question]] - no loop primitive, and no such thing as stack overflow
- [[cs/languages/Racket/continuations-and-call-cc|Continuations and call/cc in Racket]] - what `call/cc` captures, and escaping once against re-entering a saved future
- [[cs/languages/Racket/delimited-continuations-and-prompts|Delimited Continuations and Prompts]] - prompt tags, abort semantics, and the single rule separating `shift` from `control`
- [[cs/languages/Racket/parameters-and-dynamic-binding|Parameters and Dynamic Binding]] - continuation marks over thread cells, and when dynamic scope is the right answer

### Data, numbers, and the runtime

- [[cs/languages/Racket/the-numeric-tower|The Numeric Tower]] - exactness as a property orthogonal to the numeric hierarchy, and the contagion rules
- [[cs/languages/Racket/immutable-data-and-persistent-structures|Immutable Data and Persistent Structures]] - structural sharing, and the cost model that makes log N read as constant
- [[cs/languages/Racket/futures-places-and-real-parallelism|Futures, Places, and Real Parallelism]] - why a future stops the moment it needs its continuation
- [[cs/languages/Racket/the-racket-runtime-on-chez|The Racket Runtime on Chez]] - what changed when the C core was swapped out, and why the expander was never part of the port

### Read from the comparative layer

- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the axis Racket sits off of entirely
- [[cs/languages/Cpp/constexpr-and-compile-time-computation|constexpr and Compile-Time Computation]] - the other compile-time computation story
- [[cs/languages/Python/protocols-and-structural-subtyping|Protocols and Structural Subtyping]] - dispatch without inheritance, done another way
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - a static module structure against textual inclusion and path search

---

*Any pages placed under this folder are auto-listed below by Quartz.*
