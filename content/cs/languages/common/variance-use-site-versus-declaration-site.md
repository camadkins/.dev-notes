---
title: Variance, Use Site versus Declaration Site
description: "Java makes every caller spell out variance with a wildcard. C# makes the library author declare it once with in and out. TypeScript infers it structurally and Python defaults to invariant. Four answers, four different people paying."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-02
updated:
aliases:
  - Use-Site vs Declaration-Site Variance
  - Wildcards vs in and out
---

`Dog` is a subtype of `Animal`. Is `List<Dog>` a subtype of `List<Animal>`? The safe answer is no, and every statically typed language with generics gives that answer by default, because a `List<Animal>` reference to a `List<Dog>` would let you insert a cat. The safe answer is useless for read-only work, so each language builds an escape hatch, and the hatches differ in one respect that shows up in every signature: who has to say the words.

> [!note] The idea
> Variance annotation is a question of location, and location decides who absorbs the complexity. Declaration-site variance (C#) is written once by the library author and is invisible to everybody else, at the cost of being fixed for all uses. Use-site variance (Java wildcards) is written by each caller at each call, which is more flexible and pushes an unfamiliar syntax into every signature in the ecosystem. Structural systems (TypeScript) mostly compute variance rather than being told it, which makes the annotation a documentation and error-checking feature rather than a load-bearing one. And the languages that got variance wrong got it wrong in the same place twice: arrays, deliberately, for compatibility with code written before generics existed.

## Java: every caller, every time

Java generics are invariant, and the tutorial states the case without softening it. Inheritance of regular classes follows the rule that class `B` is a subtype of class `A` if `B extends A`, and this rule does not apply to generic types. Although `Integer` is a subtype of `Number`, `List<Integer>` is not a subtype of `List<Number>`, and in fact these two types are not related.

The recovery is the wildcard, applied at the point of use. To create a relationship between these classes so that code can access `Number` methods through a `List<Integer>`, you write an upper bounded wildcard. Which wildcard to write is decided by a rule the tutorials call the in-and-out principle: an "in" variable serves up data to the code, an "out" variable holds data for use elsewhere, and the guideline is that an in variable is defined with an upper bounded wildcard using the `extends` keyword, while an out variable is defined with a lower bounded wildcard using the `super` keyword. That is [[cs/languages/Java/wildcards-and-the-get-put-principle|the get-put principle]], written as a rule about direction of data flow.

The cost is distributed and permanent. Every method that wants to be flexible about its parameter has to carry a wildcard, and the tutorials warn about the one place this leaks worst: using a wildcard as a return type should be avoided because it forces programmers using the code to deal with wildcards. Java's own signatures are proof of the tax. `Collections.copy` and `Stream.flatMap` are unreadable to a beginner for exactly this reason.

The compensating benefit is real. The same `List<T>` can be used covariantly in one call and contravariantly in the next, because the caller decides. No declaration-site system can do that.

## C#: the author, once

C# moved the decision to the point of declaration. Covariance and contravariance enable implicit reference conversion for array types, delegate types, and generic type arguments, where covariance preserves assignment compatibility and contravariance reverses it. You declare variant generic interfaces by using the `in` and `out` keywords for generic type parameters, and a generic interface or delegate is called variant if its generic parameters are declared covariant or contravariant.

The rules are checked at declaration, not at use. Declaring a type parameter covariant with `out` requires that the type is used only as a return type of interface methods and not used as a type of method arguments. Declaring it contravariant with `in` means the contravariant type can be used only as a type of method arguments and not as a return type of interface methods. Get it wrong and the interface does not compile, which is the point: the author is the one who knows.

Two consequences fall out that Java does not have. Classes are invariant regardless, so [[cs/languages/CSharp/why-list-is-invariant-and-ienumerable-is-not|`List<T>` cannot be made covariant even though `IEnumerable<T>` is]]. And variance does not travel: when you extend a variant generic interface, you have to use `in` and `out` to explicitly specify whether the derived interface supports variance, because the compiler does not infer the variance from the interface that is being extended.

The other limit is representational. Value types do not support variance at all, because the conversions in question are *reference* conversions and an `int` boxed into an `object` is a different object rather than the same one viewed differently.

## TypeScript: computed, then optionally stated

In a purely structural type system, the question mostly dissolves. You can plug in types in place of each type parameter and check whether each matching member is structurally compatible, so variance is a *derived* property of the members rather than a declared one. TypeScript worked this way for years with no variance syntax at all.

Version 4.7 added [[cs/languages/TypeScript/variance-annotations-in-and-out|optional `in` and `out` modifiers]], and the stated reason is readability rather than soundness: it can be useful for a reader to explicitly see how a type parameter is used at a glance. When a `T` is used in both an output and input position, it becomes invariant. The annotation is a claim the compiler checks against what it already computed, closer to a test than to a declaration.

TypeScript also carries the most honest documented unsoundness on this page. When comparing the types of function parameters, assignment succeeds if either the source parameter is assignable to the target parameter, or vice versa. The handbook says outright that this is unsound, because a caller might end up being given a function that takes a more specialized type but invokes the function with a less specialized type. That is bivariance chosen on purpose, and it is a good example of [[cs/pl/type-systems-goals-guarantees|a type system trading a guarantee for ergonomics]] with its eyes open.

## Python: invariant unless you say otherwise

Python's variance lives on the `TypeVar` rather than on the class or the use. By default, manually created type variables are invariant, and they may be explicitly marked covariant or contravariant by passing `covariant=True` or `contravariant=True`, which makes variance a keyword argument rather than a keyword. PEP 544 established the convention that goes with it, writing `T_co` for the covariant variable and `T_contra` for the contravariant one, so a reader sees the variance in the parameter name even though it was decided elsewhere. Generic protocols support explicitly declared variance, and type checkers warn if the inferred variance differs from the declared one.

Newer Python moved toward the TypeScript position. The variance of type variables is inferred by type checkers when they are created through the type parameter syntax or when `infer_variance=True` is passed. The naming convention survives as documentation for a decision the checker now makes on its own.

> [!warning] Every one of them made the same exception for arrays
> C# documents that covariance for arrays enables implicit conversion of an array of a more derived type to an array of a less derived type, and then states plainly that this operation is [[cs/pl/type-soundness-progress-preservation|not type safe]], showing a store that produces a runtime exception. Java has the identical hole, for the identical reason: arrays predate generics and pre-generic code needed them to be covariant to be useful. The generics designers got invariance right and the arrays stayed broken, which is the clearest evidence available that variance decisions are settled by compatibility rather than by theory.

Who pays: Java charges the caller a syntax tax on every signature and buys maximum flexibility. C# charges the author one decision and buys clean call sites that can never be bent. TypeScript charges nobody and buys a checked comment. Python charges a keyword and a naming convention. The newer work is all at the inference-first end.

## Related Notes

- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the theory of co-, contra-, and invariance these four are implementing
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and ADTs]] - the abstraction whose subtype relation variance is describing
- [[cs/languages/Python/variance-in-python-generics|Variance in Python Generics]] - the keyword-argument answer in detail
- [[cs/languages/TypeScript/structural-typing-and-assignability|Structural Typing and Assignability]] - why variance is derived rather than declared in TypeScript
- [[cs/languages/common/structural-versus-nominal-typing|Structural versus Nominal Typing]] - the deeper split that decides whether variance needs syntax at all
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - the compatibility exception, in Java form

## Sources

- "Wildcards and Subtyping," The Java Tutorials (Oracle). https://docs.oracle.com/javase/tutorial/java/generics/subtyping.html . Supports ordinary subtyping not applying to generic types, List of Integer not being a subtype of List of Number, and upper bounded wildcards creating the relationship.
- "Guidelines for Wildcard Use," The Java Tutorials (Oracle). https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html . Supports the in and out variable framing, extends for in variables and super for out variables, and the warning against wildcards in return types.
- "Covariance and Contravariance (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/ . Supports variance enabling implicit reference conversion, covariance preserving and contravariance reversing assignment compatibility, the definition of a variant interface, and array covariance being not type safe.
- "Creating Variant Generic Interfaces (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/creating-variant-generic-interfaces . Supports the in and out keywords, the return-position rule for out, the argument-position rule for in, classes being invariant, value types not supporting variance, and variance not being inferred when extending an interface.
- "TypeScript 4.7 release notes." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html . Supports structural checking making variance derivable, the readability rationale for optional in and out modifiers, and a type parameter used in both positions being invariant.
- "Type Compatibility," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/type-compatibility.html . Supports function parameter bivariance and the handbook's own statement that it is unsound.
- "typing," The Python Standard Library. https://docs.python.org/3/library/typing.html . Supports manually created type variables being invariant by default, explicit covariant and contravariant keyword arguments, and variance being inferred under the type parameter syntax or infer_variance.
- "PEP 544: Protocols: Structural subtyping (static duck typing)." https://peps.python.org/pep-0544/ . Supports generic protocols supporting explicitly declared variance and type checkers warning when inferred and declared variance disagree.
