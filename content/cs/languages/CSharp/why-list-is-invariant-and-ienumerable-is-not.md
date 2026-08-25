---
title: "Why List Is Invariant and IEnumerable Is Not"
description: "IEnumerable of T is covariant, List of T can never be, and the array sitting inside List of T is covariant anyway. Three answers to one question, and the array pays for its answer at runtime."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-21
updated:
aliases: []
---

The line that trips people up is short:

```csharp
List<object> list = new List<string>();   // compiler error
IEnumerable<object> seq = new List<string>();  // fine
```

Same object on the right, two different static types on the left, two different answers. The object being constructed did not change. What changed is which of its capabilities the left-hand side promises to expose.

> [!note] The idea
> Covariance is safe exactly when the type parameter is unreachable from any input position, and a mutable container fails that test by construction: it has both a getter and a setter for `T`. `IEnumerable<out T>` can be covariant because reading is all it does. `List<T>` cannot be covariant no matter how you use it, because the type carries the write. C# is consistent about this everywhere except arrays, where it inherited covariance from the CLR and has been paying for it since, one type check per element store.

## The rule, applied to the two types

`IEnumerable<T>` has exactly one member of interest, and it hands `T` values out. That satisfies the covariance condition, and .NET Framework 4 introduced variance support for several existing generic interfaces on that basis. `IEnumerable<T>` is on the list with `T` covariant, alongside `IEnumerator<T>`, `IQueryable<T>`, and `IGrouping<TKey, TElement>`. The contravariant entries are the ones that only take `T` in: `IComparer<T>`, `IEqualityComparer<T>`, and `IComparable<T>`. .NET Framework 4.5 extended the covariant set with `IReadOnlyList<T>` and `IReadOnlyCollection<T>`, which is the clearest possible statement of the underlying rule. The framework did not make `IList<T>` covariant. It shipped a second, read-only interface over the same data and made that one covariant instead.

The documentation phrases the payoff as a return-type rule: covariance permits a method to have a more derived return type than that defined by the generic type parameter of the interface. `IEnumerable<string>.GetEnumerator` returning strings is a perfectly good `IEnumerable<object>` enumerator, because every string it yields already is an object.

`List<T>` gets no such treatment, and the reason has two layers. The shallow one is syntactic: [[cs/languages/CSharp/variance-in-and-out|the `out` and `in` modifiers are only legal on interfaces and delegates]], never on classes, so `List<out T>` is not expressible. The deeper one is that even if it were expressible, `List<T>.Add(T item)` puts `T` in an input position and the declaration would be rejected. The docs state the consequence directly for the case people actually hit: although `List<T>` implements the covariant interface `IEnumerable<T>`, you cannot implicitly convert `List<string>` to `List<object>`. Classes that implement variant interfaces are themselves still invariant.

That is why the second line of the example compiles. You are not converting the list. You are viewing it through an interface that only exposes the safe half.

> [!warning] Variance is reference-types-only
> Variance in generic interfaces is supported for reference types only, and value types do not support variance. `IEnumerable<int>` cannot be implicitly converted to `IEnumerable<object>`, because integers are represented by a value type. The conversion each element would need is not a reference conversion, it is [[cs/languages/CSharp/value-types-structs-and-boxing|a boxing conversion]], and a boxing conversion cannot be performed by reinterpreting a reference. It has to allocate.

## The hole in the floor: arrays

Now the inconsistency. Covariance for arrays enables implicit conversion of an array of a more derived type to an array of a less derived type. So `string[]` converts to `object[]` without a cast, and the Microsoft documentation says in the same breath that this operation is not type safe.

The unsoundness is immediate once you have the wider reference. An `object[]` accepts an `object` in a store, but the array underneath is still a `string[]`, and the store would corrupt it:

```csharp
string[] names = { "dog", "cat", "fish" };
object[] objs = (object[])names;

object obj = (object)13;
objs[2] = obj;   // always reached: 13 is not a string
```

The comment in the official sample is exact about which branch runs. Storing `13` into that array throws, every time.

The mechanism is a runtime check on the store, not a compile-time one. `ArrayTypeMismatchException` is the exception thrown when an attempt is made to store an element of the wrong type within an array, and it is raised when the system cannot convert the element to the type declared for the array. It is not a library-level guard some collection class chose to add. It is enforced by the instruction set: the intermediate-language instructions that throw it are `ldelem`, `ldelema`, and `stelem`, which are the loads, address-takes, and stores of array elements themselves. The exception even carries its own HRESULT, `COR_E_ARRAYTYPEMISMATCH`, with the value `0x80131503`.

> [!example] Where the check lives
> The guard is not in `Array`, and it is not in any collection class. It is attached to the element-access instructions themselves, and the list of instructions that raise it includes `ldelema`, the one that takes the address of an element. Handing out a writable reference to a slot is treated as dangerous as writing to it, because it is. A design decision taken once in the type system turns into a condition the execution engine evaluates at each store, forever. That is the shape of the trade [[cs/pl/mutable-state-references-effects|mutation forces everywhere]]. A read-only view would need no check at all, because the operation that can violate the invariant would not exist.

## Two ways to buy the same flexibility

Both conversions exist to solve one problem: a method that wants to accept a sequence of anything derived from some base type. C# now offers two ways to get there, and they differ in when the safety argument is made.

The array route grants the conversion unconditionally and defers the question to each individual store. Nothing is proved up front, so nothing is known, so every write must ask. The generic-interface route refuses the conversion unless the interface's own declaration already rules out writes, which means the proof is finished at the conversion and no write can ever be attempted through that reference. C# supports covariance and contravariance in generic interfaces and delegates from .NET Framework 4 onward, with implicit conversion of generic type parameters, which is why `IEnumerable<object> seq = new List<string>();` costs nothing at all at runtime.

The array behavior stays because removing it would break the conversion, not the check. Every existing `object[]` parameter that has ever been handed a `string[]` depends on it.

The practical reading: a `List<T>` is a growable buffer with a [[cs/dsa/dynamic-arrays|backing array and an amortized growth policy]], and the collection's invariance is not a limitation the API imposes on you. It is the API refusing to inherit the array's bug.

## Related Notes

- [[cs/languages/CSharp/variance-in-and-out|Variance in and out]] - the declaration-site rules that decide which interfaces qualify.
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - why a type that reads and writes can be neither covariant nor contravariant.
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]] - the growth and copy behavior underneath a List of T.
- [[cs/pl/mutable-state-references-effects|Mutable State, References & Effects]] - the general form of the argument that mutation is what costs you.
- [[cs/languages/Java/wildcards-and-the-get-put-principle|Wildcards and the Get-Put Principle]] - Java hit the same array hole and answered the generic half differently.
- [[cs/languages/CSharp/generic-collections-and-the-boxing-tax|Generic Collections and the Boxing Tax]] - the other half of what generics bought over the untyped collections.

## Sources

- "Variance in Generic Interfaces (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/variance-in-generic-interfaces . Supports the .NET Framework 4 and 4.5 variant-interface lists, the covariance return-type rule, that classes implementing variant interfaces remain invariant, the `List<string>` to `List<object>` failure, and the reference-types-only restriction with the `IEnumerable<int>` example.
- "Covariance and Contravariance (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/ . Supports that array covariance permits converting an array of a more derived type to one of a less derived type, and that the operation is not type safe.
- "ArrayTypeMismatchException Class," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/api/system.arraytypemismatchexception . Supports the exception definition, the store-of-wrong-type condition, the `string[]` to `object[]` code sample and its always-reached branch, the MSIL instructions that throw it, and the HRESULT value.
