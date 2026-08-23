---
title: Five Answers to the Same Question
description: "One generic definition has five shipped implementations. Java erases, the CLR reifies, Rust and C++ monomorphize, Go stencils by GC shape and passes a dictionary, and Racket checks a contract at the boundary with no static types at all."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
  - type-theory
date: 2026-07-11
updated:
aliases:
  - Five Generic Implementations
  - How Languages Implement Generics
---

Write a function that returns the smaller of two values. You want it to work on integers, on floating point numbers, and on anything else with an order. The abstraction every answer implements is [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]], and there are five distinct implementations of it in production right now. They do not differ because some language designers were smarter. They differ because each team was optimizing a different constraint, and the constraint that decided the answer was usually not performance.

The two-pole version of this story, monomorphization against erasure, is told in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]]. This note is the full board, and two of the five answers are not on that axis at all.

> [!note] The idea
> The implementation of generics is a choice about *where the type information goes*, and there are five live answers: throw it away and cast (Java), keep it in the runtime as a first-class thing (the CLR), duplicate the code so the type is baked into each copy (Rust, C++), duplicate the code only per memory shape and pass the rest in a side table (Go), or never have static types and check the obligation as the value crosses a module boundary (Racket). The non-obvious part is that the deciding constraint differs each time. Java's was a deployed platform it could not break. Go's was build time. Racket's was that it has no static type parameters at all, so the check had to move somewhere else entirely.

## Erase it: Java

Java's generics arrived onto a platform that already carried a large body of non-generic libraries and compiled bytecode. The compiler therefore applies [[cs/languages/Java/generics-and-type-erasure|type erasure]], replacing all type parameters in generic types with their bounds, or with `Object` when the parameters are unbounded, so that the produced bytecode contains only ordinary classes, interfaces, and methods. Casts go in where needed to preserve type safety, and bridge methods are generated to preserve polymorphism in extended generic types.

The payoff Oracle names is narrow and precise: erasure ensures that no new classes are created for parameterized types, so generics incur no runtime overhead. The real payoff is compatibility. Raw types show up in legacy code because lots of API classes, such as the Collections classes, were not generic prior to JDK 5.0, and for backward compatibility assigning a parameterized type to its raw type is still allowed. A pre-generics `Vector` and a generic `Vector<String>` are the same class file. That is the whole design goal, and every irritation Java programmers have with generics descends from it.

The bill: the type is gone at runtime, so nothing downstream can ask for it.

## Reify it: the CLR

The CLR did not carry Java's constraint, so the type parameter could become a runtime entity rather than a compile-time fiction. The common language runtime provides new opcodes and prefixes to support generic types in common intermediate language, and support for generics was added to the `System.Reflection` namespace for examining generic types and generic methods. A reified type parameter can be recovered: you get an array containing the generic type arguments using the `GetGenericArguments` method, and you can build a constructed type by binding type arguments to the type parameters of a generic type definition.

The win is layout, not reflection. Generic collection types generally perform better for storing and manipulating value types because there is no need to box the value types. A `List<int>` in .NET holds machine integers. A `List<Integer>` in Java holds pointers to heap objects, which is a different [[cs/systems/memory-hierarchy-and-caching|cache behavior]] on every traversal.

The bill: the type arguments have to survive into the runtime's metadata, and the specialization work lands where the runtime constructs the type rather than where the compiler emits the assembly.

## Duplicate it: Rust and C++

Rust performs monomorphization, which the Book defines as the process of turning generic code into specific code by filling in the concrete types that are used when compiled. The compiler looks at all the places where generic code is called and generates code for the concrete types the generic code is called with. Because Rust compiles generic code into code that specifies the type in each instance, the program pays no runtime cost for using generics.

C++ templates are the same strategy, older, with the build model left exposed. A specialization is instantiated when it is referenced in a context requiring a complete object type or a function definition, and the definition of a class template must be visible at the point of implicit instantiation, which is why template libraries typically provide all template definitions in the headers. At link time, identical instantiations from different translation units are merged, the linker cleaning up duplication the model guarantees.

The bill lands entirely at build time, and it is not small.

## Stencil by shape and pass a dictionary: Go

Go is the interesting one, because it refused both poles on purpose. Pure stenciling would mean a distinct function instantiation for every set of type arguments, so instead the implementation passes a dictionary along with every call to a generic function or method, and the dictionary provides the information about the type arguments that allows a single function instantiation to run correctly for many distinct type arguments. But full dictionary passing costs speed, so the compiler shares an instantiation among sets of type arguments that have the same *gcshape*: two concrete types are in the same gcshape grouping if and only if they have the same underlying type or they are both pointer types.

That rule is why every pointer type in a Go program collapses into one instantiation, and it is doing real work for the collector, which needs to know which words in a frame are pointers. Each dictionary is statically defined at compile time, so this is a compile-time side table rather than runtime reflection, and it is [[cs/languages/Go/generics-implementation-gc-shape-stenciling|a compromise placed deliberately between the two poles]].

## Check it at the boundary: Racket

Racket has no static type parameters to erase, reify, or stencil. Its answer is a runtime obligation attached where code changes hands. A contract establishes a boundary between two parties, and whenever a value crosses this boundary, the contract monitoring system performs contract checks, making sure the partners abide by the established contract. Racket encourages contracts mainly at module boundaries. When a value violates one, the monitoring system signals a violation of the contract and blames the module for breaking its promises.

Blame is the part with no analogue in the other four. An erased Java cast that fails tells you a cast failed. A contract violation names the guilty module, which is the difference between a stack trace and an accusation.

> [!warning] Every one of these is called zero cost by somebody
> Rust means no runtime cost, paid for in build time and binary size. Java means no new classes per instantiation, paid for in lost runtime type information. Go means a bounded number of instantiations, paid for in a dictionary indirection on constrained calls. Racket means no compile-time cost at all, paid for on every boundary crossing. When a language advertises zero cost, the question that separates the claims is which resource absorbed it.

Read a new language's generics this way and the syntax stops mattering. Ask what happens to `T` after type checking, and the reflection story, the code size, and whether a library can ship as a binary all follow from the answer.

## Related Notes

- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - dictionary passing as a general constraint-resolution strategy, which Go rediscovered
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - why "at compile time" is the axis all five answers sort on
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the keep-the-type answer in detail
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - the boundary answer, including who gets blamed
- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - the duplicate-it answer and what it does to a binary
- [[cs/languages/common/what-generics-cost-to-compile|What Generics Cost to Compile]] - the build-time bill each of these five hands you

## Sources

- "Type Erasure," The Java Tutorials (Oracle). https://docs.oracle.com/javase/tutorial/java/generics/erasure.html . Supports erasure replacing type parameters with their bounds or Object, the bytecode containing only ordinary classes and methods, inserted casts, bridge methods, and no new classes being created for parameterized types.
- "Raw Types," The Java Tutorials (Oracle). https://docs.oracle.com/javase/tutorial/java/generics/rawTypes.html . Supports raw types appearing in legacy code because API classes such as the Collections classes were not generic prior to JDK 5.0, and the backward-compatibility allowance for assigning a parameterized type to its raw type.
- "Generics in .NET," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/generics/ . Supports the CLR providing new CIL opcodes and prefixes for generic types, reflection support for examining generic types and methods, and generic collections avoiding boxing for value types.
- "How to: Examine and Instantiate Generic Types with Reflection," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/framework/reflection-and-codedom/how-to-examine-and-instantiate-generic-types-with-reflection . Supports recovering generic type arguments via GetGenericArguments and constructing a type by binding type arguments to a generic type definition.
- "Generic Data Types," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-01-syntax.html . Supports the definition of monomorphization, the compiler generating code for every concrete type a generic is called with, and the no-runtime-cost claim.
- "Templates," cppreference.com. https://en.cppreference.com/w/cpp/language/templates.html . Supports instantiation on reference in a complete-type context, definitions needing to be visible at the point of implicit instantiation (hence header-only template libraries), and link-time merging of identical instantiations.
- "Go 1.18 Implementation of Generics via Dictionaries and Gcshape Stenciling," Go design documents. https://go.googlesource.com/proposal/+/refs/heads/master/design/generics-implementation-dictionaries-go1.18.md . Supports dictionary passing on every generic call, one instantiation serving many type arguments, gcshape sharing, the same-underlying-type-or-both-pointers rule, and dictionaries being statically defined at compile time.
- "Contracts and Boundaries," The Racket Guide. https://docs.racket-lang.org/guide/contract-boundaries.html . Supports contracts establishing a boundary, checks running whenever a value crosses it, contracts being encouraged at module boundaries, and violations blaming the offending module.
