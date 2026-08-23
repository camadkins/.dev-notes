---
title: "Generic Specialization and Code Sharing"
description: "The CLR splits generic instantiations into two populations by memory shape: value types get their own native code, and every reference type shares one canonical body plus a dictionary."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-27
updated:
aliases:
  - Shared Generics
  - Generic Dictionaries
---

`List<int>` and `List<string>` are distinct types with distinct identities. They are not distinct compiled code. One of them got its own native method bodies with the integer representation baked in; the other is running a canonical body that has no idea which reference type it is holding and looks the answer up when it needs to. The CLR made that split deliberately, and the line it drew is not between generic and non-generic, or between library and user code. It is between things that fit in a machine word the same way and things that do not.

> [!note] The idea
> Reification forces a decision that erasure never has to make: if every instantiation is a real type, how many copies of the machine code are there? The CLR answers by instantiation *shape*. Value type arguments get a specialized code body each, because an `int` and a `double` and a user struct have different sizes and different layouts, so no single body can serve them. Reference types all have identical size and layout, so they share one body and recover the parts that differ from a side table called a generic dictionary. The whole performance story of .NET generics, including the reason `List<int>` holds unboxed integers, falls out of that one classification.

## The value type path

The documentation describes the mechanism directly. "When a generic type is first constructed with a value type as a parameter, the runtime creates a specialized generic type with the supplied parameter or parameters substituted in the appropriate locations in the CIL," and "specialized generic types are created one time for each unique value type that is used as a parameter." Substituting `int` into the intermediate language of `List<T>` produces code whose backing array is a genuine `int[]`, whose indexer returns an `int`, and whose comparisons operate on machine integers.

The payoff is stated in the same page: "conversions are no longer necessary because each specialized generic class natively contains the value type." That sentence is the difference between a generic collection and the pre-generic `ArrayList` it replaced. The .NET documentation puts the consequence in the advantages list, that "generic collection types generally perform better for storing and manipulating value types because there is no need to box the value types."

Boxing is the operation being avoided, and it is worth being concrete about what it costs. Storing an `int` in a collection of `object` requires allocating a heap object to hold it, writing the value in, and storing the pointer. Reading it back requires following that pointer and copying the value out. A million integers become a million small heap allocations plus an array of a million pointers, and iterating them is a million dependent loads into scattered addresses. The specialized `List<int>` is one array of contiguous four-byte values. That is a garbage collection difference, an allocation difference, and above all a locality difference, which is the part that dominates on real hardware and which [[cs/systems/memory-hierarchy-and-caching|the memory hierarchy]] explains better than any microbenchmark. The growth behavior and amortized cost of the container itself are the ordinary [[cs/dsa/dynamic-arrays|dynamic array]] story, unchanged by generics; what generics changed is what sits in the array's slots.

## The reference type path

Reference types get the opposite treatment. "The first time a generic type is constructed with any reference type, the runtime creates a specialized generic type with object references substituted for the parameters in the CIL," and every later reference type argument reuses it. The justification is one clause long: "this is possible because all references are the same size."

The runtime's own design document is blunter about why this matters. Shared generics exists because "for certain instantiations, the generated code will almost be identical with the exception of a few instructions, so in order to reduce the memory footprint, and the amount of time we spend jitting these generic methods, the runtime will generate a single special canonical version of the code, which can be used by all compatible instantiations of the method." A program using `Dictionary<string, Customer>`, `Dictionary<string, Order>`, and forty other reference-typed dictionaries compiles the dictionary implementation once.

## What sharing costs, in instructions

The shared body cannot hard-code anything that differs between instantiations, and some things do differ even when the sizes match. A method that calls `typeof(List<T>)` needs a different type handle depending on `T`. The specialized value-type body would load that handle as an immediate operand. The canonical body cannot, so, as the design document explains, it fetches the value "from the *generic dictionary* of the instantiation" that is executing, where "the generic dictionary is a data structure used by shared generic code to fetch instantiation-specific information. It is basically an array where the entries are instantiation-specific type handles, method handles, field handles, method entry points, etc..."

In machine terms, an immediate becomes a chain of loads: read the generic context, read the dictionary pointer out of it, read the slot out of the dictionary. That is the price of the sharing, and it is paid on exactly the operations that need to know which instantiation is running, not on ordinary field access or array indexing.

> [!example] The same call, two ways
> A canonical body needing the type handle of `List<T>` runs roughly:
> ```
> mov rcx, generic context
> mov rcx, [rcx + offset of the per-instantiation info]   ; the dictionary
> mov rcx, [rcx + dictionary slot for List<T>]
> ```
> The `List<int>` body, being specialized, loads the handle as a constant. Three dependent loads against one immediate, on the instructions that care.

## Against the two neighbours

[[cs/languages/Cpp/templates-and-generic-programming|C++ templates]] take the value-type path for everything. Every instantiation is stamped out at compile time with all types substituted, which yields the fastest possible code and no dictionary anywhere, at the cost of compiling the same template body once per distinct argument list and shipping all of it. [[cs/languages/Rust/traits-and-generic-bounds|Rust monomorphization]] does the same, with the same bargain: no runtime indirection, no runtime type information, and a binary that grows with the instantiation count. Both do their specialization before the program exists, so neither can specialize for a type discovered at runtime.

The CLR sits between the two and refuses to answer the question uniformly. It monomorphizes where the layout forces it and shares where the layout permits it, and it defers the whole decision to load time, which is what makes an instantiation that appears only through reflection possible at all. That flexibility is the same property [[cs/languages/CSharp/reified-generics-in-the-clr|reification]] buys elsewhere, viewed from the code-generation side.

> [!warning] The sharing is not general
> The design document states the limit: "this feature is currently only supported for instantiations over reference types because they all have the same size/properties/layout/etc... For instantiations over primitive types or value types, the runtime will generate separate code bodies for each instantiation." A library generic over many struct types multiplies its native code by the number of those types. That is usually a good trade and occasionally a startup-time or binary-size problem, and it is the reason a heavily struct-generic library behaves more like a C++ template library than like the rest of .NET.

## Related Notes

- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the decision that makes this code-generation question exist
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the same axis across four languages, with the CLR as the hybrid
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - full monomorphization, decided at compile time
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - why unboxed contiguous storage wins by more than the allocation count
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]] - the container cost model that generics leave intact
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - what the avoided boxing allocations would otherwise cost

## Sources

- "Generics in the runtime (C# programming guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/generics-in-the-run-time . Supports the per-value-type specialization rule, that specialized types are created once per unique value type, that conversions are unnecessary because the specialized class natively contains the value type, that reference type instantiations share a single specialized version, and that this is possible because all references are the same size.
- "Shared Generics Design," dotnet/runtime documentation. https://raw.githubusercontent.com/dotnet/runtime/main/docs/design/coreclr/botr/shared-generics.md . Supports the motivation for a single canonical code body, the role and contents of the generic dictionary, the load chain the canonical code performs, and the limitation of sharing to reference type instantiations.
- "Generics in .NET," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/generics/ . Supports that generic collection types generally perform better for value types because no boxing is needed.
