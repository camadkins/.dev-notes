---
title: Runtime Type Information
description: "What survives past the compiler differs enormously: the CLR keeps whole constructed types, Go keeps a dynamic type descriptor, C++ keeps a type_info for polymorphic classes, Rust keeps an opt-in TypeId, Java keeps almost nothing, and TypeScript keeps nothing at all."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-09
updated:
aliases: []
---

Ask a running program what type a value is. Six languages in this section give six different answers, ranging from a full constructed generic type with its arguments intact to nothing whatsoever, and the difference is not a detail of introspection APIs. It decides how serialization libraries are written, whether dependency injection is possible without code generation, and what a plugin system can look like.

> [!note] The idea
> Runtime type information is a spectrum, and a language's position on it is fixed by how it compiled generics in the first place. Reification keeps the type arguments, erasure discards them, monomorphization makes them unnecessary by baking them in, and dynamic languages never had a compile-time type to lose. The consequence worth internalizing: type information that the runtime refuses to keep does not stop being needed. It moves to build time as code generation, or to the programmer as a hand-passed token, or to the wire format as an embedded type tag. Nobody escapes the requirement, they only choose where to pay it.

## The full end: the CLR

.NET keeps everything. Reflection support exists specifically for examining generic types and generic methods, and the operations are the ones you would want if the type parameter were a real thing at run time, because it is. You can get an array containing the generic type arguments using the `GetGenericArguments` method, and you can go the other way, creating a `Type` object that represents a constructed type by binding type arguments to the type parameters of a generic type definition.

That second capability is what separates reification from mere reflection. A .NET program can *construct* `List<Customer>` at run time from a `Type` it was handed, and instantiate it. That is the reason .NET serializers and containers can be written without a build step, and the same property that makes runtime plugin loading straightforward.

## The nothing end: TypeScript

TypeScript is the clean opposite. Most TypeScript-specific code gets erased away, and type annotations are completely erased, with the handbook stating the rule as a slogan: type annotations never change the runtime behavior of your program. What is left is JavaScript, which retains only what JavaScript retains. For some values, such as the primitives `string` and `number`, we can identify their type at run time using the `typeof` operator, and beyond that the language offers nothing about the types you wrote.

This is a deliberate design constraint rather than an oversight, and it is the reason every TypeScript runtime validation library is a *value*-level library with a type-level shadow. See [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|erasure at runtime and type guards]].

## Java: erasure and the shape of the workarounds

Java is closer to TypeScript than most Java programmers expect. Because the compiler erases all type parameters in generic code, you cannot verify which parameterized type for a generic type is being used at run time. The tutorial states the consequence flatly: the runtime does not keep track of type parameters, so it cannot tell the difference between an `ArrayList<Integer>` and an `ArrayList<String>`.

The restriction list that follows is a catalog of everything the missing information forbids. You cannot use casts or `instanceof` with parameterized types, because `instanceof` requires a reifiable type. You cannot create arrays of parameterized types. You cannot create static fields of type parameters. The documented fallback is exactly as thin as it sounds: the most you can do is use an unbounded wildcard to verify that the list is an `ArrayList`.

What Java kept is the class, which is why the workarounds all route through `Class` objects passed by hand, and why the [[cs/languages/Java/type-tokens-and-super-type-tokens|type token]] pattern exists at all. That pattern is the clearest illustration of the general principle here: [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|erasure did not remove the need for the type]], it moved the responsibility for carrying it from the runtime to the programmer.

## Go: a dynamic type, always present

Go never had generics for most of its life and never erased anything, because every interface value already carried its dynamic type. The `reflect` package implements run-time reflection, allowing a program to manipulate objects with arbitrary types, and its typical use is to take a value with static type `interface{}` and extract its dynamic type information by calling `TypeOf`, which returns a `Type`.

The language-level version is the type assertion: `x.(T)` asserts that the value stored in `x` is of type `T`, and if `T` is an interface type it asserts that the dynamic type of `x` implements the interface `T`. Generics did not change this. Go's dictionaries carry run-time type descriptors as their type argument entries, so a generic Go function has access to the same descriptors an interface value would have.

## C++: RTTI, but only where you asked for it

C++ takes a middle position and charges for it. The Itanium ABI records why type information must exist at all: the C++ language definition implies that information about types be available at run time for three distinct purposes, to support the `typeid` operator, to match an exception handler with a thrown object, and to implement the `dynamic_cast` operator. The identity property is specified too: two `type_info` pointers point to equivalent type descriptions if and only if the pointers are equal.

The scope is the interesting part. Full RTTI applies only to dynamic class types, which are the ones with virtual functions and therefore a vtable pointer to hang it from. A `struct Point { int x, y; }` carries nothing, which is what a systems programmer wants, and is also why `typeid` on a non-polymorphic value tells you the static type rather than the dynamic one.

## Rust: opt in, and narrower than it looks

Rust's `std::any` module is described as utilities for dynamic typing or type reflection. As `dyn Any`, a borrowed trait object gains `is` and `downcast_ref` methods, to test whether the contained value is of a given type and to get a reference to the inner value as that type.

Then the sentence that defines the ceiling: `dyn Any` is limited to testing whether a value is of a specified concrete type, and cannot be used to test whether a type implements a trait. That is precisely inverted from what Java, C#, and C++ offer, where the natural runtime question is "does this implement that interface" and the answer is a lookup. In Rust the interface question is settled at compile time and never asked again, so the runtime facility that survives is identity only.

> [!warning] The information does not disappear, it relocates
> A serializer needs to know a value's fields and their types. .NET asks the runtime. Java asks the runtime for the class and the programmer for the type argument. Go asks `reflect`. Rust and C++ have to be told at compile time, which is why their serialization ecosystems are built on derive macros and templates rather than on introspection. Every step down this spectrum converts a runtime lookup into a build-time obligation, which is faster and more type-safe, and also means that a type nobody generated code for simply cannot participate.

The security corollary is worth stating plainly. Rich runtime type information is what makes [[cs/security/insecure-deserialization|deserialization attacks]] possible in the first place, because a wire format that names a type and a runtime that can construct arbitrary named types is a remote-instantiation primitive. The same reflection capability that makes [[cs/software-engineering/dependency-injection-and-inversion-of-control|dependency injection containers]] pleasant in .NET and Java is the capability an attacker borrows. Convenience and attack surface are, here, the same mechanism seen from two sides.

## Related Notes

- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - what a compiler is entitled to throw away, and what a runtime must keep
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - why a compile-time proof makes runtime checks redundant, and where that argument fails
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - the place a program most often needs the type it no longer has
- [[cs/languages/Go/the-empty-interface-any-and-type-assertions|The Empty Interface, any, and Type Assertions]] - Go's runtime type question in ordinary code
- [[cs/languages/CSharp/reflection-over-generic-types|Reflection Over Generic Types]] - the full-information end of the spectrum in detail
- [[cs/languages/common/five-answers-to-the-same-question|Five Answers to the Same Question]] - the compilation strategy that fixes each language's position on this spectrum

## Sources

- "How to: Examine and Instantiate Generic Types with Reflection," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/framework/reflection-and-codedom/how-to-examine-and-instantiate-generic-types-with-reflection . Supports recovering generic type arguments with GetGenericArguments and constructing a Type by binding type arguments to a generic type definition.
- "Generics in .NET," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/generics/ . Supports reflection support existing specifically for examining generic types and generic methods.
- "The Basics," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/2/basic-types.html . Supports TypeScript-specific code and type annotations being erased, annotations never changing runtime behavior, and typeof identifying only primitive types at run time.
- "Restrictions on Generics," The Java Tutorials (Oracle). https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html . Supports erasure preventing runtime verification of a parameterized type, the runtime not distinguishing ArrayList of Integer from ArrayList of String, instanceof requiring a reifiable type, the array and static-field restrictions, and the unbounded-wildcard fallback.
- "reflect package," pkg.go.dev. https://pkg.go.dev/reflect . Supports the package implementing run-time reflection and extracting dynamic type information from an interface value via TypeOf.
- "The Go Programming Language Specification." https://go.dev/ref/spec . Supports type assertions checking the stored value's type, and the interface case checking that the dynamic type implements the interface.
- "Go 1.18 Implementation of Generics via Dictionaries and Gcshape Stenciling," Go design documents. https://go.googlesource.com/proposal/+/refs/heads/master/design/generics-implementation-dictionaries-go1.18.md . Supports dictionary type entries always being run-time type descriptors.
- "Itanium C++ ABI." https://itanium-cxx-abi.github.io/cxx-abi/abi.html . Supports the three purposes requiring run-time type information, RTTI being required only for dynamic class types, and the pointer-equality property of type_info.
- "std::any," The Rust Standard Library. https://doc.rust-lang.org/std/any/index.html . Supports the module being utilities for dynamic typing or type reflection, the is and downcast_ref methods on dyn Any, and dyn Any being limited to concrete-type identity rather than trait implementation.
