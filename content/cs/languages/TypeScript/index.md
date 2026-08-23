---
title: TypeScript
description: Landing page for TypeScript. A structural type system with a Turing-complete type level, sitting on a runtime that erases all of it by design.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-08-21
updated:
aliases: []
---

TypeScript is the strangest answer in this section. Every other language here treats a type parameter as a placeholder for a type someone will supply. TypeScript treats it as an input to a computation that produces a type, and the type level grew into a language of its own: pattern matching, recursion, string manipulation, and a depth budget that exists because no compiler can decide whether your types terminate. The same `<T>` syntax as Java or C#, doing a different job.

The other oddity is what sits underneath. The runtime is JavaScript, which knows nothing about any of it. Java erases for compatibility with code that predates generics; TypeScript erases because there was never anything there to keep. The foundation under all of it is [[cs/languages/TypeScript/structural-typing-and-assignability|structural assignability]], and the comparison against the other four answers lives in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]].

### Generics in a structural system

Why the familiar syntax means something else here.

- [[cs/languages/TypeScript/generics-over-a-structural-type-system|Generics Over a Structural Type System]] - a type parameter as a hole in a shape rather than a named promise
- [[cs/languages/TypeScript/generic-constraints-and-defaults|Generic Constraints and Defaults]] - a shape test that pays out twice, and a separate mechanism easy to confuse with it
- [[cs/languages/TypeScript/contextual-typing-and-inference|Contextual Typing and Inference]] - inference running upward and downward at once, which is what keeps untyped callbacks alive under strict mode
- [[cs/languages/TypeScript/variance-annotations-in-and-out|Variance Annotations, in and out]] - a decade without declaration-site variance, and what the annotations actually bought

### The type level as a language

The part no other folder in this section has. Read these in order; each one is built out of the ones before it.

- [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|keyof, typeof, and Indexed Access]] - the one-way bridge from the value world into the type world
- [[cs/languages/TypeScript/mapped-types|Mapped Types]] - a fold from a union of keys into an object type, with the key names and modifiers under control
- [[cs/languages/TypeScript/conditional-types|Conditional Types]] - an assignability test that suspends itself when the answer depends on a type variable
- [[cs/languages/TypeScript/distributive-conditional-types|Distributive Conditional Types]] - two square brackets decide whether the check maps over a union or tests it whole
- [[cs/languages/TypeScript/infer-and-type-level-pattern-matching|infer and Type-Level Pattern Matching]] - destructuring for types, scoped to the branch that matched
- [[cs/languages/TypeScript/template-literal-types|Template Literal Types]] - strings stop being atoms, and the bill arrives as a cross product
- [[cs/languages/TypeScript/type-level-computation-and-its-limits|Type-Level Computation and Its Limits]] - Turing completeness means no termination check, so what ships is a budget

### Where the types stop

- [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|Erasure at Runtime and Type Guards]] - every runtime check is something a human wrote, and the language only supplies the wiring back to the checker
- [[cs/languages/TypeScript/the-any-unknown-never-triangle|The any, unknown, never Triangle]] - the escape hatch, the top type, and the bottom type, filed under one heading and behaving nothing alike

### The rest of the language

- [[cs/languages/TypeScript/structural-typing-and-assignability|Structural Typing and Assignability]] - compatibility by shape, and the two relations underneath it
- [[cs/languages/TypeScript/union-and-intersection-types|Union and Intersection Types]] - combining value sets, and why reachable members move the opposite way
- [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|Discriminated Unions and Exhaustiveness]] - a literal-typed tag that ordinary JavaScript comparisons can narrow
- [[cs/languages/TypeScript/strict-null-checks|Strict Null Checks]] - removing `null` from the value set of every other type, and why that had to ship as a flag
- [[cs/languages/TypeScript/satisfies-and-const-assertions|satisfies and const Assertions]] - separating checking a value against a type from adopting that type
- [[cs/languages/TypeScript/declaration-files-and-ambient-types|Declaration Files and Ambient Types]] - a signature with no implementation, which is both the power and the hazard
- [[cs/languages/TypeScript/modules-and-resolution|Modules and Resolution]] - a compiler that never loads a module simulating somebody else's file lookup
- [[cs/languages/TypeScript/decorators|Decorators]] - the shipped ECMAScript form, and why the experimental one is a different feature
- [[cs/languages/TypeScript/the-compiler-api-and-emit|The Compiler API and Emit]] - three moving parts, and why the middle one makes type-aware tooling slow

### Read from the comparative layer

- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - erasure by construction against the other four answers
- [[cs/languages/Python/protocols-and-structural-subtyping|Protocols and Structural Subtyping]] - the other structural answer, opt-in instead of default
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the opposite bargain
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - runtime path search against compile-time trees

---

*Any pages placed under this folder are auto-listed below by Quartz.*
