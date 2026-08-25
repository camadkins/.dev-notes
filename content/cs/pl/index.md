---
title: Programming Language Concepts
description: "Core ideas behind language design and semantics: grammars, evaluation, types, effects, and modules."
draft: false
comments: false
tags:
  - cs
  - pl
date: 2025-10-16
updated: 2026-07-27
aliases:
  - Programming Language Concepts
---

PL asks what a language *is* independent of any compiler that implements it. A language is a grammar, a set of evaluation rules, and a set of guarantees, and nearly every design argument in the field is about what a language promises versus what it costs to keep that promise.

The clusters below run roughly from surface to depth: how a language is written down, how it runs, what its types rule out, and how implementations make it fast. Concrete-language treatments live in [[cs/languages/index|Languages]]; this section stays at the level of ideas.

### Orientation

- [[cs/pl/language-overview-syntax-semantics|Syntax and Semantics]] - the two halves of defining a language
- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms]] - models of computation behind the paradigms
- [[cs/pl/levels-of-artificial-languages|Levels of Artificial Languages]] - where programming languages sit among formal languages
- [[cs/pl/history-genealogy-of-languages|History and Genealogy of Languages]] - how the family tree actually branched

### Grammar and parsing

- [[cs/pl/grammars-notation-bnfebnf|Grammars: BNF and EBNF]] - the notation for writing a syntax down
- [[cs/pl/grammar-ambiguity-parse-trees|Ambiguity and Parse Trees]] - when one string has two readings
- [[cs/pl/cfg-design-refactoring|Context-Free Grammar Design]] - refactoring a grammar to say what you meant

### Lambda calculus

The smallest language that can compute anything, and the substrate most semantics are explained on.

- [[cs/pl/lambda-calculus-syntax-substitution|Syntax and Substitution]] - terms, binding, capture-avoiding substitution
- [[cs/pl/lambda-calculus-evaluation-strategies|Evaluation Strategies]] - call by name, call by value, normal order
- [[cs/pl/lambda-calculus-encodings-booleans-pairs-church-numerals|Encodings]] - booleans, pairs, and Church numerals from nothing but functions

### Semantics and evaluation

- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics]] - big-step and small-step rules
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - eager against lazy, and what laziness buys
- [[cs/pl/booleans-conditionals-semantics|Booleans and Conditionals]] - why conditionals cannot be ordinary functions in a strict language
- [[cs/pl/abstract-machines-cek-secd|Abstract Machines: CEK and SECD]] - semantics made mechanical
- [[cs/pl/continuations-cps|Continuations and CPS]] - the rest of the computation as a value

### Binding, state, and control

- [[cs/pl/language-design-values-variables-environments|Values, Variables, Environments]] - what a name denotes
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - lexical scope and captured environments
- [[cs/pl/mutable-state-references-effects|Mutable State, References, Effects]] - what changes when a language admits assignment
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions and Non-Local Control]] - leaving a computation early
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - suspending and resuming a computation

### Type systems

- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what a type system is for
- [[cs/pl/type-soundness-progress-preservation|Type Soundness]] - progress and preservation, the soundness proof shape
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner Type Inference]] - inferring types with no annotations
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and ADTs]] - one implementation, many types
- [[cs/pl/subtyping-variance-type-constraints|Subtyping and Variance]] - when one type may stand in for another
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, Pattern Matching]] - product and sum types, and how you take them apart
- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - ad-hoc polymorphism and dictionary passing
- [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]] - types that constrain how many times a value may be used

### Abstraction and program structure

- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - dispatch as the defining mechanism
- [[cs/pl/modules-signatures-and-separate-compilation|Modules and Signatures]] - sealing an implementation behind an interface
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - programs that write programs, and hygiene

### Implementation

- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - a spectrum rather than a dichotomy
- [[cs/pl/intermediate-representations-and-ssa|Intermediate Representations and SSA]] - the form that makes optimization tractable
- [[cs/pl/garbage-collection-concepts|Garbage Collection Concepts]] - reachability as the definition of live
- [[cs/pl/gc-algorithms-mark-sweep-copying-generational|GC Algorithms]] - mark-sweep, copying, generational
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models]] - threads and locks, actors, and the alternatives

---

*The full file listing follows below, generated automatically by Quartz.*
