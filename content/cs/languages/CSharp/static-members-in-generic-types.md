---
title: "Static Members in Generic Types"
description: "Every closed constructed type gets its own set of static fields, which turns a declaration Java has to forbid into a per-type storage mechanism with no equivalent anywhere else in the language."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-15
updated:
aliases:
  - Per-Instantiation Statics
  - Static Fields in Generic Classes
---

Put a static field in a generic class and ask how many of it there are. The question has three plausible answers: one for the whole class, one for every instance, or one for every set of type arguments. C# picks the third, and the choice is not a corner case in the specification. It is a small storage mechanism hiding in plain sight, keyed by types, allocated by the runtime, and free at the point of use.

> [!note] The idea
> The C# standard states it without hedging: "there is only one set of static fields for each non-generic class or closed constructed type, regardless of the number of instances of the class or closed constructed type." A closed constructed type is `Cache<string>`, not `Cache<T>`, so `Cache<string>` and `Cache<int>` have separate static storage that never interacts. Java cannot offer this and does not try; its tutorial forbids the declaration outright with "static fields of type parameters are not allowed." The same three lines of source, on two runtimes, produce a compile error in one and a type-indexed table in the other.

## The rule, stated twice

The specification says it in the chapter on classes and again in the chapter on types, from two directions. The classes chapter contrasts the generic case with the ordinary one: a static field in a non-generic class identifies exactly one storage location, and each distinct closed constructed type "has its own set of static fields, regardless of the number of instances of the closed constructed type."

The types chapter adds the edge cases. "Closed constructed types that are identity convertible share a single set of static variables. Otherwise, each closed constructed type has its own set of static variables. Since an open type does not exist at run-time, there are no static variables associated with an open type." Two consequences follow. Aliased types that are identity convertible, such as `int` and `System.Int32` as arguments, do not accidentally double the storage. And there is no such thing as "the static field of `Cache<T>`," because `Cache<T>` never exists at runtime, only its closed instantiations do.

Initialization follows the same partition. The standard's rule for class initialization begins "to initialize a new closed class type, first a new set of static fields" for that particular closed type is created and default-initialized, and the static field initializers and static constructor then run for those fields. Static construction is per instantiation, not per generic definition, so a static constructor in a generic class runs once for `Cache<string>` and again for `Cache<int>`.

> [!example] The counter that counts per type
> ```csharp
> class Tracker<T>
> {
>     public static int Created;
>     public Tracker() => Created++;
> }
>
> _ = new Tracker<string>();
> _ = new Tracker<string>();
> _ = new Tracker<int>();
>
> Console.WriteLine(Tracker<string>.Created);  // 2
> Console.WriteLine(Tracker<int>.Created);     // 1
> ```
> Nothing keys the two counters apart at runtime. They were never the same field. The compiler resolved `Tracker<string>.Created` and `Tracker<int>.Created` to different storage locations, and the runtime allocated each one when it constructed that closed type.

## The question Java has to refuse

Java's tutorial argues the restriction from the erased side, and the argument is worth reading precisely because it is correct given its premises. It sets up `MobileDevice<T>` with a `static T os` field, instantiates it as `MobileDevice<Smartphone>`, `MobileDevice<Pager>`, and `MobileDevice<TabletPC>`, and then asks what the actual type of `os` is: "it cannot be Smartphone, Pager, and TabletPC at the same time. You cannot, therefore, create static fields of type parameters."

The reasoning is airtight and its conclusion is local. The field cannot have three types at once *because there is only one field*, and there is only one field because there is only one class after erasure. Give the runtime the type arguments, as [[cs/languages/CSharp/reified-generics-in-the-clr|the CLR does]], and there are three classes, three fields, and three unambiguous types. The restriction was never about static fields. It was about erasure, which is the pattern the whole of [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Java's restriction list]] follows.

## What the mechanism is actually good for

A per-instantiation static is a lookup table whose key is a type and whose lookup happens at compile time. The idiomatic uses all exploit that.

**Type-keyed caches.** Reflection over a type is expensive and its results never change, so a serializer computes the property list for `T` once and stores it in a `static` field of a generic helper class. Every later call for that `T` reads a static field. The alternative in a non-generic design is a `Dictionary<Type, PropertyInfo[]>` guarded for concurrent access, which is the same idea implemented as a runtime [[cs/dsa/hash-tables|hash table]] with a hash, a probe, and a lock on every access. The generic static is that table with the hashing done by the compiler and the bucket handed to the JIT as a constant address.

**Per-type singletons and defaults.** `Comparer<T>.Default` is the canonical example in the base class library: one instance per element type, created on first use by the static constructor for that instantiation, reached without a lookup.

**Per-type identity.** Assigning a small dense integer id to each type used with a generic component is a two-line static field, and the id becomes a constant load rather than a dictionary probe. Message dispatch tables and entity component systems lean on this hard.

> [!warning] It is still global mutable state, once per type
> The mechanism multiplies statics rather than removing them, and every hazard of [[cs/pl/mutable-state-references-effects|global mutable state]] applies per instantiation: initialization order, thread safety, lifetime tied to the load context rather than to anything the program controls, and test isolation that has to reset each closed type separately. Static constructors do give you one guarantee, running once per closed type with the runtime handling the race, so lazy initialization of a per-type cache is safe by construction. Mutation after that point is yours to protect, and `Tracker<T>.Created++` above is a data race in any program with threads.

The instructive part is the shape of the whole thing. Reification did not add a feature called "per-type storage." It made an existing feature, the static field, mean something new in a context where an erasing language had to declare the context illegal. That is the recurring pattern in this folder: reification rarely adds syntax, it removes the reason a restriction existed.

## Related Notes

- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the runtime property that makes three separate fields possible
- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the same declaration as a compile error, with the reasoning
- [[cs/languages/CSharp/generic-specialization-and-code-sharing|Generic Specialization and Code Sharing]] - why the storage is separate even when the code is shared
- [[cs/dsa/hash-tables|Hash Tables]] - the runtime data structure a per-type static replaces
- [[cs/pl/mutable-state-references-effects|Mutable State, References & Effects]] - the hazards this mechanism inherits and multiplies
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - where static members sit relative to instances and dispatch

## Sources

- "Classes," C# language standard (draft v8), dotnet/csharpstandard. https://raw.githubusercontent.com/dotnet/csharpstandard/draft-v8/standard/classes.md . Supports that each distinct closed constructed type has its own set of static fields regardless of instance count, that there is only one set of static fields per non-generic class or closed constructed type, and that initializing a new closed class type creates a new set of static fields for that closed type.
- "Types," C# language standard (draft v8), dotnet/csharpstandard. https://raw.githubusercontent.com/dotnet/csharpstandard/draft-v8/standard/types.md . Supports that identity-convertible closed constructed types share one set of static variables, that otherwise each closed constructed type has its own, and that an open type has no static variables because it does not exist at run time.
- "Restrictions on Generics," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html . Supports that Java forbids static fields whose types are type parameters, and the MobileDevice example asking what the actual type of the shared static field would be.
