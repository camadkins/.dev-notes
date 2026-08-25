---
title: "Reified Generics in the CLR"
description: "The runtime keeps the type arguments, so a constructed generic type is a real type with a real identity, and the entire list of things erasure forbids simply is not a list here."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-02
updated:
aliases: []
---

Ask a running .NET program what type a `List<string>` is and it answers `System.Collections.Generic.List<System.String>`. Ask the same of a `List<int>` and it answers something different. The two are not the same class wearing different compile-time labels. They are two distinct types in the runtime's own type system, each with its own identity, its own method table, and its own static storage. That single fact is the root of this entire folder.

> [!note] The idea
> Reification means the type argument survives compilation and exists as a first-class thing the running program can consult. C#'s own documentation states the position plainly, that C# generics are "similar to generics in Java or templates in C++, but with full runtime type information and no type erasure." The consequence is not one feature. It is the removal of a whole category of restriction: `typeof(T)`, `new T()`, `new T[n]`, and `x is List<int>` all work, and they work for the same reason, which is that there is a real type argument sitting in the runtime for the code to ask about.

## Where the type argument actually lives

The mechanism starts in the compiled output. When a generic type or method is compiled to common intermediate language, the documentation says, "it contains metadata that identifies it as having type parameters." The type parameters are not erased away by the compiler and reconstructed by convention. They are part of what the assembly says about itself, and the runtime reads them when it loads the type.

The C# standard draws the line that matters with two terms. An open type "is a type that involves type parameters"; a closed type is one that does not. `List<T>` inside the body of a generic class is open. `List<int>` is closed. The rule the standard then states is the whole reification story in one sentence: "At run-time, all of the code within a generic type declaration is executed in the context of a closed constructed type that was created by applying type arguments to the generic declaration." Every type parameter is bound to a particular runtime type before a single instruction of that method body runs.

The standard goes further and closes the door on the alternative. "The run-time processing of all statements and expressions always occurs with closed types, and open types occur only during compile-time processing." There is no moment at runtime where `T` is a mystery. There is no code path that executes with an unresolved parameter and hopes a cast will save it.

## The four things this buys

The reason to care is a list of specific capabilities, each of which is missing from a language that erases. This is the direct counterpole to [[cs/languages/Java/generics-and-type-erasure|Java's erasure]], and the fastest way to understand either language is to read the two lists against each other.

**You can name the type.** `typeof(T)` inside a generic method yields the `Type` object for whatever the caller supplied. The runtime documentation puts it as reflection being able to query an instantiated generic class such that "both its actual type and its type parameter can be ascertained." A logging helper can print the element type of the collection it was handed without being told what it is.

**You can construct one.** With a `new()` constraint on the parameter, `new T()` compiles and runs, because at the point of execution `T` is a closed type with a known constructor. The constraint is what makes the compiler willing; reification is what makes the runtime able.

**You can allocate an array of them.** `new T[16]` is an ordinary array allocation of a known element type. In a language where `T` is erased to its bound, the same expression would create an array whose element type is a lie, which is why erased languages forbid it rather than let the lie escape.

**You can test for it.** `obj is List<int>` is a real runtime check against a real type. The negative case is as informative as the positive: a `List<int>` is not a `List<long>`, and the runtime knows it, because the two are separate closed constructed types rather than two names for one erased class.

> [!example] The identity check
> ```csharp
> object a = new List<int>();
> object b = new List<string>();
> Console.WriteLine(a.GetType() == b.GetType());          // False
> Console.WriteLine(a.GetType().GetGenericTypeDefinition()
>                == b.GetType().GetGenericTypeDefinition()); // True
> Console.WriteLine(a is List<int>);                       // True
> Console.WriteLine(a is List<long>);                      // False
> ```
> Both objects share a generic type definition and differ as constructed types. On the JVM the first line prints `true`, because both objects are instances of the same `ArrayList` class and the type argument was thrown away at compile time.

## Reification is a runtime commitment, not a compiler trick

The distinction worth holding onto is where the work happens. Erasure is a decision a compiler can make alone, which is precisely why it was available to a language that could not change its virtual machine. Reification is not available to a compiler alone. It requires the loader to construct types on demand, the metadata format to carry parameter lists, and the just-in-time compiler to produce code for instantiations that did not exist when the assembly was built. That is a cost paid by the platform rather than the language, and it is the reason this is a story about [[cs/pl/compilation-vs-interpretation|what a runtime does with compiled code]] rather than a story about syntax.

The bill arrives in a few places. Type loading is not free, and a program that constructs many distinct instantiations pays for each one. Ahead-of-time compilation and trimming become harder, because the set of instantiations a program will need is no longer knowable by reading the call sites. The tradeoff read across languages is in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]], and the specific machinery the CLR uses to keep the cost down is in [[cs/languages/CSharp/generic-specialization-and-code-sharing|Generic Specialization and Code Sharing]].

> [!warning] Reified does not mean one copy of the code per type argument
> The natural assumption is that if every instantiation is a distinct type, every instantiation must also have distinct machine code. It does not. The runtime creates a specialized version for each unique value type, but "every time that a constructed type is instantiated with a reference type as its parameter, regardless of what type it is, the runtime reuses the previously created specialized version of the generic type." Distinct type identity and distinct compiled code are separate questions, and the CLR answers them differently.

What the theory calls this is a faithful implementation of [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]] with the type argument preserved as data. The language gets to keep the abstraction and still hand the abstraction back to the programmer at runtime, which is unusual, and the rest of this folder is the accounting of what that costs and what it makes possible.

## Related Notes

- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the counterpole, and the reason this note's capability list reads as a list at all
- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the restriction list this design removes, item by item
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the same tradeoff read across four languages
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]] - the theory both implementations are instances of
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - why reification is a platform cost rather than a compiler cost
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - the third answer, where everything happens before the program runs

## Sources

- "Generic types and methods," C# fundamentals, Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/generics . Supports the framing that C# generics carry full runtime type information and no type erasure, and the description of constraints enabling operations on a type parameter.
- "Generics in the runtime (C# programming guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/generics-in-the-run-time . Supports that compiled generic code carries metadata identifying it as having type parameters, and that reflection can ascertain both the actual type and the type parameter of an instantiated generic class.
- "Types," C# language standard (draft v8), dotnet/csharpstandard. https://raw.githubusercontent.com/dotnet/csharpstandard/draft-v8/standard/types.md . Supports the open and closed type definitions, that all code in a generic type declaration runs in the context of a closed constructed type, and that run-time processing always occurs with closed types while open types occur only at compile time.
