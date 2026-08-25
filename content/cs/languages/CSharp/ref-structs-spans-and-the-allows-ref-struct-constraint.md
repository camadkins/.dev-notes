---
title: "Ref Structs, Spans, and the allows ref struct Anti-Constraint"
description: "A ref struct is a type the compiler promises will never reach the heap. That promise is what made Span fast and what kept it out of every generic method in the framework until C# 13 invented a constraint that widens instead of narrows."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-08-04
updated:
aliases: []
---

Most type-system features tell you what a type can do. `ref struct` is the opposite: it is a list of things a type is forbidden to do, accepted voluntarily, in exchange for one guarantee the runtime can then rely on absolutely.

> [!note] The idea
> Declaring a struct `ref` tells the compiler to enforce that instances live on the stack and never escape to the managed heap. Every restriction on a `ref struct` exists to make that unfalsifiable, and the restriction people hit hardest was the one on generics: if `T` could be a `ref struct`, then any generic method might box it, field it, or array it, and the guarantee would evaporate. C# 13's `allows ref struct` resolves this by inverting the usual direction of a constraint. Instead of narrowing what `T` may be, it widens the set and simultaneously narrows what the method body may do with `T`, propagating every ref-struct restriction into the type parameter itself.

## The guarantee and its price

You allocate instances of a `ref struct` type on the stack, and they cannot escape to the managed heap. To ensure that property, the compiler limits their usage, and the list is long enough to be worth reading in full rather than remembering as a vibe:

- A `ref struct` cannot be the element type of an array.
- It cannot be the type of a field in a class or in a non-`ref` struct.
- It cannot be boxed to `System.ValueType` or `System.Object`.
- It cannot be captured in a lambda expression or a local function.
- Before C# 13, it could not be used in an async method at all; beginning with C# 13, a `ref struct` variable cannot be used in the same block as an `await` expression.
- Before C# 13, it could not be used in iterators; beginning with C# 13, `ref struct` types and `ref` locals may be used in iterators provided they are not in code segments with a `yield return`.
- Before C# 13, it could not implement interfaces; beginning with C# 13, it can, subject to the ref-safety rules.
- Before C# 13, it could not be a type argument.

Every entry closes one route to the heap. An array element and a class field both live inside a heap object. A captured variable lives in a compiler-generated closure class, which is a heap object. A boxed value is on the heap by definition. Async methods and iterators hoist their locals into a generated state machine. The list is not a matter of taste, it is the enumeration of ways a local could outlive its frame.

The reward is a type that costs nothing to create. `System.Span<T>` and `System.ReadOnlySpan<T>` are the canonical examples in .NET: `Span<T>` is a `ref struct` allocated on the stack rather than on the managed heap, and it provides a type-safe and memory-safe representation of a contiguous region of arbitrary memory. Slicing an array or a `stackalloc` buffer produces a `Span<T>` with no [[cs/systems/memory-allocators-and-fragmentation|trip to the allocator]] and nothing for the collector to track.

The documentation is candid about the flip side: because it is a stack-only type, `Span<T>` is unsuitable for many scenarios that require storing references to buffers on the heap. A field of type `Span<T>` in a class is a compile error, which is exactly the intent.

## Why generics were the sharp edge

The interface and generic restrictions hurt more than the others, and the language proposal says why. The inability for a `ref struct` to implement interfaces means they cannot participate in fairly fundamental abstraction techniques of .NET. A `Span<T>`, even though it has all the attributes of a sequential list, cannot participate in methods that take `IReadOnlyList<T>` or `IEnumerable<T>`. Instead, specific methods must be coded for `Span<T>` that have virtually the same implementation.

That is the practical shape of the problem: whole parallel API surfaces, duplicated for spans, because the abstraction mechanism was closed to them.

The reason for the closure is structural. Consider a plain generic method `void Stash<T>(T value)`. Its body is compiled once against the general rules for a type parameter, and those rules permit boxing, permit assigning `value` to a field, permit putting it in an array. A caller who supplied a `ref struct` for `T` would be handing a stack-only value into a body already licensed to put it on the heap. The type system had no way to mark that `T` as special, so it barred `ref struct` type arguments outright.

## The anti-constraint

`allows ref struct` opens the door by adding a clause that does something no previous `where` clause did. The syntax sits in the constraint list:

```csharp
T Identity<T>(T p) where T : allows ref struct => p;

Span<int> local = Identity(new Span<int>(new int[10]));
```

The proposal is precise about how this differs from everything else in a `where` clause: other syntax items limit the set of types that can fulfill a generic parameter, while `allows ref struct` expands the set. It is effectively an anti-constraint, because it removes the implicit constraint that a `ref struct` cannot satisfy a generic parameter, and the new `allows` keyword prefix exists to make that inversion visible at a glance.

Widening the inputs has to be paid for by narrowing the body, and it is. A type parameter bound by `allows ref struct` has all of the behaviors of a `ref struct` type: instances cannot be boxed, instances participate in lifetime rules like a normal `ref struct`, the type parameter cannot be used in static fields or as array elements, and instances can be marked `scoped`. The compiler checks the generic body against the strictest possible `T`, so the guarantee survives.

> [!warning] Implementing an interface still does not let you cast to it
> The ability to implement interfaces does not affect the existing limitation against boxing. Even if a `ref struct` implements a particular interface, it cannot be directly cast to that interface, because the cast is a boxing action. A `ref struct File : IDisposable` cannot be assigned to an `IDisposable` variable. It can only be reached through a type parameter constrained to `IDisposable` and `allows ref struct`, where the call is made without a conversion.

A few structural rules follow. A type parameter with `allows ref struct` cannot also carry a `class` constraint or a constraint to a known reference type, since those would contradict it outright. The `allows ref struct` clause must be the last constraint in the `where` clause. And the anti-constraint is not inherited: a type parameter constrained to another type parameter that allows ref structs does not silently acquire the permission.

> [!tip] What to take from the shape of it
> The whole feature is escape analysis expressed in the type system rather than inferred by an optimizer. That is the bargain [[cs/pl/ownership-and-linear-types|ownership and linear types]] make, and it is what [[cs/languages/Rust/borrowing-and-lifetimes|a Rust slice borrow]] encodes: a value naming a region it does not own, with the compiler proving the region outlives the name. C# arrived late and on a different budget, which is why it reads as a prohibition list rather than a lifetime calculus, but the theorem is the same.

## Related Notes

- [[cs/languages/CSharp/value-types-structs-and-boxing|Value Types, Structs, and Boxing]] - the stack-versus-heap distinction every restriction above is protecting.
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - the ordinary constraints that narrow, for contrast with the one that widens.
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - what a heap allocation actually costs, and why avoiding it is worth a list of rules.
- [[cs/pl/ownership-and-linear-types|Ownership & Linear Types]] - the theory behind proving that a reference does not outlive what it points at.
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes in Rust]] - the same guarantee, enforced by a lifetime system rather than a prohibition list.
- [[cs/systems/processes-and-threads|Processes & Threads]] - why a per-thread stack makes the escape question meaningful in the first place.

## Sources

- "ref struct types (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/ref-struct . Supports stack allocation and the no-escape guarantee, the full list of usage limitations including arrays, fields, boxing, lambda capture, async, iterators, interfaces, and type arguments, the before-and-after C# 13 changes, and that Span and ReadOnlySpan are the framework examples.
- "ref struct interfaces," C# language proposal, dotnet/csharplang. https://raw.githubusercontent.com/dotnet/csharplang/main/proposals/csharp-13.0/ref-struct-interfaces.md . Supports the motivation about Span and IReadOnlyList, the `allows ref struct` syntax and Identity example, the expands-versus-limits framing, the anti-constraint definition and the reason for the `allows` prefix, the four inherited ref-struct behaviors, the no-cast-to-interface rule, and the constraint-ordering and inheritance notes.
- "Span Struct," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/api/system.span-1 . Supports that Span is a ref struct allocated on the stack rather than the managed heap, its description as a type-safe and memory-safe view over a contiguous region of arbitrary memory, and the stack-only limitation for heap-stored buffers.
