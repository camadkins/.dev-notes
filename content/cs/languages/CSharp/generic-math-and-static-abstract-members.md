---
title: "Generic Math and Static Abstract Members"
description: "Adding two values of an unknown type took a new kind of interface member, because the operation a numeric algorithm needs is static and no interface could describe a static member until C# 11."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-24
updated:
aliases:
  - INumber
  - Static Virtual Interface Members
---

For twenty years a C# programmer could not write a generic `Sum`. Constraints could demand a constructor, a base class, a value type, an interface, a memory layout. None of them could demand that `T` supports `+`. The obstacle was not that operators are special. It was that operators are static, and an interface could describe instance members only, so there was no way to write down the requirement.

> [!note] The idea
> Arithmetic is an operation on a type rather than on an instance, so abstracting over it requires abstracting over static members, which is a different feature from anything the interface system previously had. The proposal states the gap exactly: "there is currently no way to abstract over static members and write generalized code that applies across types that define those static members," and "this is particularly problematic for member kinds that" only exist in a static form, notably operators. C# 11 made static interface members declarable as abstract; .NET 7 built a numeric interface hierarchy on top of that; `where T : INumber<T>` is what the two produce together. The pattern the result implements is an old one, and the note worth taking is that C# arrived at [[cs/pl/type-classes-and-traits|type classes]] by way of a runtime that could dispatch a static call on a type argument.

## The missing member kind

Before C# 11 the rules were asymmetric in a way nobody had reason to question. Instance members in an interface are implicitly abstract or virtual. Static ones were not eligible: "static interface members today are implicitly non-virtual, and do not allow" the `abstract`, `virtual`, or `sealed` modifiers. A static method in an interface was a helper parked in a convenient namespace, not a requirement on implementers.

The change is one sentence of language design with a long tail. "Static interface members other than fields are allowed to also have the" `abstract` modifier, so "an interface is allowed to specify abstract static members that implementing classes and structs are then required to provide an explicit or implicit implementation of," and, crucially for the use case, "the members can be accessed off of type parameters that are constrained by the interface." Inside a generic method, `T.Zero` is a legal expression.

The proposal's own motivating sketch is worth reading because it is the whole feature in ten lines: an `IAddable<T>` declaring `static abstract T Zero` and `static abstract T operator +`, a struct implementing both, and an `AddAll<T>` that starts from `T.Zero` and accumulates with `+`.

Dispatch is the part that could not be done by a compiler alone. "At runtime, the actual member implementation used is the one that exists on the actual type provided as a type argument." There is no receiver object to look up a method table on, so the call has to be resolved from the type argument itself, which the CLR has because it kept the type argument. This is [[cs/languages/CSharp/reified-generics-in-the-clr|reification]] paying for a language feature two decades after the fact, and it is why the feature reads as ordinary virtual dispatch with the instance removed rather than as a compile-time trick.

## The interface tower

The library half arrived alongside it. ".NET 7 introduces new math-related generic interfaces to the base class library," and "the availability of these interfaces means you can constrain a type parameter of a generic type or method to be" number-like. "In addition, C# 11 and later lets you define static virtual interface members," and since operators must be declared static, that is what allows operators to appear in these interfaces at all.

The hierarchy is deliberately fine-grained, so that a routine asks for exactly the capability it uses. `INumber<TSelf>` "exposes APIs common to comparable number types," described as effectively the real number domain, while `INumberBase<TSelf>` "exposes APIs common to all number types," effectively the complex domain. Below them sit `IBinaryInteger<TSelf>` for bit-level operations such as `PopCount` and `TrailingZeroCount`, `IFloatingPointIeee754<TSelf>` for the constants and behaviors only floating point has, and operator interfaces such as `IAdditionOperators<TSelf,TOther,TResult>` that a domain-specific numeric interface can compose from.

The split between `INumber` and `INumberBase` is not tidiness. `Floor` is meaningless for a complex number and comparison is undefined for one, so a single "number" interface would either lie about what its implementers support or force implementers to throw. The tower is an admission that the arithmetic operations a generic algorithm might need do not form one set, which is the same discovery [[cs/languages/common/numeric-types-and-overflow-semantics|any careful look at numeric types]] produces.

> [!example] The method that could not be written
> ```csharp
> static T Add<T>(T left, T right) where T : INumber<T> => left + right;
>
> static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
> {
>     T total = T.Zero;                 // a static member, reached through the parameter
>     foreach (var v in values) total += v;
>     return total;
> }
> ```
> `T.Zero` is the line that was impossible before. It calls a static member of whatever type the caller supplied, and the documentation notes the method "can be used with any of .NET's built-in numeric types, because they've all been updated to implement" the interface. The alternative it replaces is the one the same page describes, where "previously you had to add an overload of the method for each type."

## What Java does instead

Nothing, and the reason is structural rather than an oversight. [[cs/languages/Java/generics-and-type-erasure|Erasure]] replaces "all type parameters in generic types with their bounds or Object if the type parameters are unbounded," so inside a generic method the parameter is a reference type: `Object`, or `Number`, or `Comparable`. Java's arithmetic operators are defined on primitives, and a bound is never a primitive, so there is no bound a Java author could write that would make `left + right` compile. The gap is not one missing interface. It is that the mechanism which would let an interface carry an operator, static members that implementers must supply and that a type parameter can reach, is exactly the mechanism a type parameter erased to its bound cannot support.

The workaround Java libraries actually use is an explicit strategy object, passed in alongside the values: an interface with `add`, `zero`, and `multiply` instance methods, implemented once per numeric type, threaded through every call. That works, costs an interface dispatch per operation and a parameter on every signature, and is a faithful reimplementation by hand of what a dictionary-passing compiler would generate. Seeing the two side by side is the cleanest illustration of why [[cs/pl/objects-classes-and-dispatch|dispatch without a receiver]] is a distinct capability rather than a syntactic convenience: with static abstracts the dictionary is the type argument, and the runtime already had it.

> [!warning] The constraint is wider than most algorithms need
> `where T : INumber<T>` is the convenient constraint and rarely the correct one. Ask for the narrowest interface the body actually uses, because the wide constraint silently excludes implementers that are number-like in the way you need and not in every other way. The documentation aims the feature at library authors first, noting they "will benefit most from the generic math interfaces, because they can simplify their code base by removing" redundant overloads; application code that reaches for `INumber<T>` on a method used with exactly two types has paid the abstraction cost for nothing. The other caveat is the ordinary one for numeric abstraction, that overflow, rounding, and precision remain the concrete type's business and a generic algorithm inherits whatever the instantiation does.

## Related Notes

- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the runtime property that makes a static call on a type parameter dispatchable
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - where an interface constraint sits in the rest of the vocabulary
- [[cs/pl/type-classes-and-traits|Type Classes & Traits]] - the pattern this feature reinvents, and the dictionary-passing implementation it avoids
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - why the same feature has no path on an erasing runtime
- [[cs/languages/common/numeric-types-and-overflow-semantics|Numbers, Overflow, and the Edge of the Type]] - the concrete behavior a generic numeric algorithm inherits
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - dispatch with the receiver removed

## Sources

- "Generic math," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/generics/math . Supports that .NET 7 introduced math-related generic interfaces, that they let a type parameter be constrained to be number-like, that C# 11 static virtual interface members are what allow operators to be declared in them, the Add example constrained to INumber, that built-in numeric types were updated to implement it, the descriptions of INumber and INumberBase as the real and complex domains, the prior situation of one overload per type, and the guidance that library authors benefit most.
- "Static abstract members in interfaces," C# language proposal, dotnet/csharplang. https://raw.githubusercontent.com/dotnet/csharplang/main/proposals/csharp-11.0/static-abstracts-in-interfaces.md . Supports the motivation that there was no way to abstract over static members, that this is most problematic for members that exist only in static form such as operators, that static interface members were previously implicitly non-virtual and could not take the abstract modifier, that static members other than fields may now be abstract, that implementers must supply them, that they can be accessed off constrained type parameters, and that the implementation used at runtime is the one on the actual type argument.
- "Type Erasure," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/erasure.html . Supports that Java replaces all type parameters with their bounds, or with Object when unbounded.
