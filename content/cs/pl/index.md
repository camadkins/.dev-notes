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

- [[language-overview-syntax-semantics|Syntax and Semantics]] - the two halves of defining a language
- [[programming-paradigms-models-of-computation|Programming Paradigms]] - models of computation behind the paradigms
- [[levels-of-artificial-languages|Levels of Artificial Languages]] - where programming languages sit among formal languages
- [[history-genealogy-of-languages|History and Genealogy of Languages]] - how the family tree actually branched

### Grammar and parsing

- [[grammars-notation-bnfebnf|Grammars: BNF and EBNF]] - the notation for writing a syntax down
- [[grammar-ambiguity-parse-trees|Ambiguity and Parse Trees]] - when one string has two readings
- [[cfg-design-refactoring|Context-Free Grammar Design]] - refactoring a grammar to say what you meant

### Lambda calculus

The smallest language that can compute anything, and the substrate most semantics are explained on.

- [[lambda-calculus-syntax-substitution|Syntax and Substitution]] - terms, binding, capture-avoiding substitution
- [[lambda-calculus-evaluation-strategies|Evaluation Strategies]] - call by name, call by value, normal order
- [[lambda-calculus-encodings-booleans-pairs-church-numerals|Encodings]] - booleans, pairs, and Church numerals from nothing but functions

### Semantics and evaluation

- [[operational-semantics-big-step-small-step|Operational Semantics]] - big-step and small-step rules
- [[evaluation-order-and-strictness|Evaluation Order and Strictness]] - eager against lazy, and what laziness buys
- [[booleans-conditionals-semantics|Booleans and Conditionals]] - why conditionals cannot be ordinary functions in a strict language
- [[abstract-machines-cek-secd|Abstract Machines: CEK and SECD]] - semantics made mechanical
- [[continuations-cps|Continuations and CPS]] - the rest of the computation as a value

### Binding, state, and control

- [[language-design-values-variables-environments|Values, Variables, Environments]] - what a name denotes
- [[scoping-binding-and-closures|Scoping, Binding, and Closures]] - lexical scope and captured environments
- [[mutable-state-references-effects|Mutable State, References, Effects]] - what changes when a language admits assignment
- [[exceptions-handlers-and-non-local-control|Exceptions and Non-Local Control]] - leaving a computation early
- [[coroutines-and-generators|Coroutines and Generators]] - suspending and resuming a computation

### Type systems

- [[type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what a type system is for
- [[type-soundness-progress-preservation|Type Soundness]] - progress and preservation, the soundness proof shape
- [[hindleymilner-type-inference|Hindley-Milner Type Inference]] - inferring types with no annotations
- [[parametric-polymorphism-adts|Parametric Polymorphism and ADTs]] - one implementation, many types
- [[subtyping-variance-type-constraints|Subtyping and Variance]] - when one type may stand in for another
- [[records-variants-and-pattern-matching|Records, Variants, Pattern Matching]] - product and sum types, and how you take them apart
- [[type-classes-and-traits|Type Classes and Traits]] - ad-hoc polymorphism and dictionary passing
- [[ownership-and-linear-types|Ownership and Linear Types]] - types that constrain how many times a value may be used

### Abstraction and program structure

- [[objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - dispatch as the defining mechanism
- [[modules-signatures-and-separate-compilation|Modules and Signatures]] - sealing an implementation behind an interface
- [[macros-and-metaprogramming|Macros and Metaprogramming]] - programs that write programs, and hygiene

### Implementation

- [[compilation-vs-interpretation|Compilation vs Interpretation]] - a spectrum rather than a dichotomy
- [[intermediate-representations-and-ssa|Intermediate Representations and SSA]] - the form that makes optimization tractable
- [[garbage-collection-concepts|Garbage Collection Concepts]] - reachability as the definition of live
- [[gc-algorithms-mark-sweep-copying-generational|GC Algorithms]] - mark-sweep, copying, generational
- [[concurrency-models-threads-locks-and-actors|Concurrency Models]] - threads and locks, actors, and the alternatives

---

*The full file listing follows below, generated automatically by Quartz.*
