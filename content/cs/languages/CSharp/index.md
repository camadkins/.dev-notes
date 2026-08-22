---
title: C#
description: Landing page for C#. The reification pole of the section's generics comparison, where the runtime keeps the type arguments and most of Java's restrictions never arise.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-08-21
updated:
aliases:
  - CSharp
  - C Sharp
---

C# shipped generics in 2005, one year after Java, and made the opposite trade. The CLR was changed to carry type arguments into the runtime, so `List<int>` is a real type with a real identity, its own static fields, and its own native code. The list of things erasure forbids is not a list here. What reification costs instead is a runtime that has to know about generics, a JIT that specializes value types and shares reference types, and a dictionary lookup at the seam between those two populations.

This folder makes the contrast concrete rather than asserted. Java's erasure story is owned by [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] and linked from here rather than restated, and the cross-language comparison lives in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]].

### What the runtime keeps

The decision and the machinery under it. Read these in order.

- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - type arguments survive to runtime, and everything below follows
- [[cs/languages/CSharp/generic-specialization-and-code-sharing|Generic Specialization and Code Sharing]] - value types get their own native code, reference types share one canonical body plus a dictionary
- [[cs/languages/CSharp/static-members-in-generic-types|Static Members in Generic Types]] - a per-type storage mechanism that Java has to forbid outright
- [[cs/languages/CSharp/reflection-over-generic-types|Reflection Over Generic Types]] - `typeof(List<>)` and `MakeGenericType`, taking a generic type apart and reassembling it

### Saying what a type parameter must be

Constraints do more work here than in Java, because the body of a generic method is compiled against them and the runtime honors them.

- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - the `where` vocabulary read as a permission system rather than a filter
- [[cs/languages/CSharp/default-of-t-and-the-null-question|default(T) and the Null Question]] - one expression with three behaviors, and a question mark that means two different things
- [[cs/languages/CSharp/generic-math-and-static-abstract-members|Generic Math and Static Abstract Members]] - adding two values of an unknown type required a new kind of interface member

### Variance, decided once by the author

Java asks the caller which wildcard to write. C# asks the library author once, at the declaration, and every call site inherits the answer.

- [[cs/languages/CSharp/variance-in-and-out|Variance, in and out]] - declaration-site variance, and the positions the compiler then polices
- [[cs/languages/CSharp/why-list-is-invariant-and-ienumerable-is-not|Why List Is Invariant and IEnumerable Is Not]] - three answers to one question, and the array that pays for its answer at runtime
- [[cs/languages/CSharp/generic-methods-and-inference-limits|Generic Methods and the Limits of Inference]] - inference reads the arguments and nothing else, which is the point rather than an oversight

### Where reification pays, and where it bills

- [[cs/languages/CSharp/generic-collections-and-the-boxing-tax|Generic Collections and the Boxing Tax]] - the allocation a generic collection avoids, and the quieter second tax it does not
- [[cs/languages/CSharp/ref-structs-spans-and-the-allows-ref-struct-constraint|Ref Structs, Spans, and the allows ref struct Anti-Constraint]] - a type that promises never to reach the heap, and the constraint that widens instead of narrows

### The rest of the language

- [[cs/languages/CSharp/value-types-structs-and-boxing|Value Types, Structs, and Boxing]] - one sentence about what a variable contains, and every rule that follows from it
- [[cs/languages/CSharp/the-il-and-the-jit|The IL and the JIT]] - an assembly ships instructions no processor executes, and the compiler runs late enough to see the whole type system
- [[cs/languages/CSharp/delegates-events-and-the-func-family|Delegates, Events, and the Func Family]] - an object carrying a method and its receiver, which is where every difference from a function pointer starts
- [[cs/languages/CSharp/iterators-and-yield-return|Iterators and yield return]] - a method turned inside out into an object that remembers where it stopped
- [[cs/languages/CSharp/async-await-and-the-state-machine|async, await, and the State Machine]] - `await` starts no thread and waits for nothing, it cuts the method in half
- [[cs/languages/CSharp/linq-and-expression-trees|LINQ and Expression Trees]] - the same clause compiles to a delegate or to a data structure, decided by the static type of the source
- [[cs/languages/CSharp/nullable-reference-types|Nullable Reference Types]] - a compile-time flow analysis over a runtime that has no idea it exists
- [[cs/languages/CSharp/records-and-pattern-matching|Records and Pattern Matching]] - synthesized members, one of which changes what equality means
- [[cs/languages/CSharp/the-clr-garbage-collector|The CLR Garbage Collector]] - generations as a logical view, segments and an 85,000 byte cutoff as the physical machinery
- [[cs/languages/CSharp/unsafe-code-and-the-fixed-statement|Unsafe Code and the fixed Statement]] - `unsafe` makes code unverifiable, and `fixed` exists because the collector moves objects

### Read from the comparative layer

- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the axis this folder sits at one end of
- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the restriction list reification removes
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - tracing collection with a value-type escape hatch
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - marshalling, pinning, and crossing out of managed code

---

*Any pages placed under this folder are auto-listed below by Quartz.*
