---
title: "Reflection Over Generic Types"
description: "typeof(List<>), MakeGenericType, and GetGenericArguments: the runtime keeps generic type definitions, constructed types, and type parameters as first-class objects a program can take apart and reassemble."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-04
updated:
aliases:
  - MakeGenericType
  - Open Generic Types
---

`typeof(List<>)` is legal C#. The angle brackets are empty, the comma count in `typeof(Dictionary<,>)` is load-bearing, and no variable can ever have that type. The syntax looks like a hack and is instead the language admitting something precise: a generic type definition is a real entity in the runtime's type system, distinct from any of its instantiations, and there has to be some way to name it.

> [!note] The idea
> Reflection over generics works because the runtime holds three separate kinds of thing and can convert between them. A generic type definition is a template. A constructed type is that template with arguments applied. A type parameter is itself represented by a `Type` object, carrying its position, its constraints, and its variance. Reflection reads all three and, with `MakeGenericType`, runs the construction step at runtime with type arguments the compiler never saw. Everything in this note is the capability that erasure removes, which is why the equivalent Java code has to reconstruct type arguments from signature metadata on declarations rather than reading them off values.

## Definitions, constructed types, and the empty brackets

The specification explains the odd syntax. An unbound generic type "is not itself a type, and cannot be used as the type of a variable, argument or return value, or as a base type," and the only construct that can reference one is a `typeof` expression. C# needs a way to hand `List<>` to reflection and no way to accidentally declare a field of it, so it carved out exactly one expression form and left the argument list empty.

From there, reflection treats generics like everything else. "Information about generic types is obtained in the same way as information about other types" by examining a `Type` object; the difference is that this one has a list of `Type` objects representing its parameters. `IsGenericType` says whether the type is generic at all, `IsGenericTypeDefinition` says whether it is the uninstantiated template, and `GetGenericArguments` returns the array of arguments or parameters. On a definition, the array holds parameters; on a constructed type, it holds arguments; `IsGenericParameter` on each element tells you which case you are in.

The parameters are inspectable objects, not names. "In the type system, a generic type parameter is represented by an instance of" `Type`, just as ordinary types are, and it carries `GenericParameterPosition` for its index in the list. Its constraints are readable: `GetGenericParameterConstraints` returns the base class and interface constraints in one array, with the documentation warning that "constraints are not guaranteed to be in any particular order," and `GenericParameterAttributes` exposes the special constraints as flags, including the parameterless-constructor, reference-type, and non-nullable-value-type requirements, masked apart from the variance flags that share the same enum.

That last detail is the one people miss. Constraints are not compiler bookkeeping thrown away after checking. They are metadata in the assembly, readable at runtime, which is what allows a generic container framework to validate a type argument it was handed as a string.

## Construction at runtime

The other half is building a constructed type that never appeared in source. "A generic type is like a template. You can't create instances of it unless you specify real types for its generic type parameters," and doing that at runtime is `MakeGenericType`, which "substitutes the elements of an array of types for the type parameters of the current generic type definition and returns a `Type` object representing the resulting constructed type."

The failure modes are the interesting documentation. Calling it on something that is not a generic type definition throws `InvalidOperationException`. Supplying the wrong count throws, because "the number of elements in typeArguments is not the same as the number of type parameters in the current generic type definition." And supplying a type that violates a `where` clause throws too, when "any element of typeArguments does not satisfy the constraints specified for the corresponding type parameter" of the definition. The constraint system is enforced by the runtime, not only by the compiler, which follows from constraints being metadata rather than compile-time-only checks.

> [!example] Building a type the compiler never saw
> ```csharp
> Type definition = typeof(Dictionary<,>);
> Console.WriteLine(definition.IsGenericTypeDefinition);        // True
> Console.WriteLine(definition.GetGenericArguments().Length);   // 2
>
> Type keyType   = Type.GetType(userSuppliedKeyTypeName)!;
> Type valueType = Type.GetType(userSuppliedValueTypeName)!;
>
> Type constructed = definition.MakeGenericType(keyType, valueType);
> object instance  = Activator.CreateInstance(constructed)!;
> ```
> Nothing here was decided at compile time except the shape. This is how object-relational mappers build `DbSet<TEntity>` for entities discovered by scanning an assembly, how dependency injection containers resolve `IRepository<Order>` from a registration of `IRepository<>`, and how a deserializer materializes a collection whose element type came out of a wire format.

## What it costs

Two attributes on `MakeGenericType` name the price, and both are about deployment rather than speed. `RequiresDynamicCode` carries the message that "the native code for this instantiation might not be available at runtime," which is the ahead-of-time compilation problem stated exactly: if the set of instantiations is only known while the program runs, a compiler that ran before the program cannot have generated them. `RequiresUnreferencedCode` says trimming cannot validate annotations on the arguments, because a trimmer removes what nothing references and a reflective construction references nothing statically.

This is the sharp edge of reification. The same property that lets a program build `List<Customer>` from two strings is the property that stops a tool from proving which types the program needs. Runtime metaprogramming and whole-program analysis pull in opposite directions, and the resolution in .NET has been to push work back toward [[cs/pl/macros-and-metaprogramming|compile-time generation]] via source generators, so the code exists before the trimmer runs.

> [!warning] Constructing types from untrusted names is an attack surface
> `Type.GetType(name)` followed by `MakeGenericType` and `Activator.CreateInstance` is a type-name-to-object pipeline. When any part of that name comes from input, the caller has handed an attacker a constrained choice of which types get loaded and instantiated, which is the exact shape of [[cs/security/insecure-deserialization|insecure deserialization]]: the payload is not data, it is a type selection, and the gadget is whatever the constructed type does during construction. The mitigation is the ordinary one, an allowlist of permitted types rather than a denylist of known-bad ones, and it belongs in the same discussion as [[cs/languages/common/serialization-and-wire-formats|the format itself]].

The comparison worth holding is with [[cs/languages/Java/generics-and-type-erasure|erasure]]. Java reflection can read generic signatures off declarations, because signature attributes survive in the class file, so a field declared `List<String>` can be identified as such. What it cannot do is ask an existing `ArrayList` object what its element type is, because the object has no such record, and it cannot construct a distinct runtime type for `List<String>` because there is only one `List` class. The generic type definition and the constructed type are separate objects in the CLR and the same object on the JVM, and every difference in this note reduces to that.

## Related Notes

- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the property the entire reflection surface rests on
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - what reflection can and cannot recover once the arguments are gone
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - the constraints reflection reads back as metadata
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - what type construction from untrusted input turns into
- [[cs/pl/macros-and-metaprogramming|Macros & Metaprogramming]] - the compile-time alternative that AOT and trimming push toward
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - the main consumer of runtime generic construction

## Sources

- "How to: Examine and instantiate generic types with reflection," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/framework/reflection-and-codedom/how-to-examine-and-instantiate-generic-types-with-reflection . Supports that generic type information is obtained by examining a Type object, that a constructed type is created by binding type arguments to a generic type definition, that a type parameter is itself represented by a Type instance, that GetGenericParameterConstraints returns constraints in no guaranteed order, and that a generic type is a template requiring real types before instances can be created.
- "Type.MakeGenericType(Type[]) Method," .NET API reference, Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/api/system.type.makegenerictype . Supports the method summary, the exceptions for a non-definition receiver, wrong argument count, and arguments that fail the declared constraints, and the RequiresDynamicCode message about native code for an instantiation possibly being unavailable at runtime.
- "Types," C# language standard (draft v8), dotnet/csharpstandard. https://raw.githubusercontent.com/dotnet/csharpstandard/draft-v8/standard/types.md . Supports that an unbound generic type is not itself a type and cannot be used as the type of a variable, argument, return value, or base type.
