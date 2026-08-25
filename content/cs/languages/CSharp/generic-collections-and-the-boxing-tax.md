---
title: "Generic Collections and the Boxing Tax"
description: "What a boxing conversion actually costs, why a generic collection of a value type does not pay it, and the second, quieter tax that only IEquatable and EqualityComparer Default remove."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-08-11
updated:
aliases: []
---

The usual pitch for generic collections is type safety: you stop writing casts and the compiler catches your mistakes earlier. That is true and it is the smaller half. The larger half is that a collection which knows its element type at runtime can store the elements themselves rather than references to copies of them, and for value types that difference is an allocation per element.

> [!note] The idea
> Boxing converts a value type to `object` or to an interface it implements, and doing so allocates a new object on the managed heap and copies the value into it. A collection whose element type is `object` therefore taxes every value-type element once on the way in and again on the way out. Generic collections remove that tax from storage, but a second tax survives in the comparison path, because `Object.Equals` takes an `object` parameter and calling it on a struct boxes the argument. `IEquatable<T>` exists to give the collection a strongly typed equality method to call instead, and `EqualityComparer<T>.Default` is the mechanism that finds it.

## What a box is

Boxing is the process of converting a value type to the type `object` or to any interface type implemented by that value type. When the runtime boxes a value type, it wraps the value inside a `System.Object` instance and stores it on the managed heap. Unboxing extracts the value type back out. The asymmetry in the syntax reflects the asymmetry in safety: boxing is implicit, unboxing is explicit.

```csharp
int i = 123;
object o = i;      // boxes: new heap object, value copied in
i = (int)o;        // unboxes: checked cast, value copied out
```

The performance note in the documentation is blunt. In relation to simple assignments, boxing and unboxing are computationally expensive processes. When a value type is boxed, a new object must be allocated and constructed, and to a lesser degree the cast required for unboxing is also expensive.

Unpack "allocated and constructed" and the real bill appears. The box is a full `System.Object` instance, so a boxed `int` costs whatever an object costs plus the four bytes it actually carries. It is a separate allocation, so a thousand boxed integers are a thousand objects for [[cs/pl/garbage-collection-concepts|the collector]] to trace rather than one array to walk past. And each one sits wherever the allocator put it, so reading a collection of boxes is a chase through the heap rather than a sequential scan.

## The untyped collection

The documentation's own example of an untyped list makes the pattern visible:

```csharp
List<object> mixedList = [];
for (int j = 1; j < 5; j++)
{
    mixedList.Add(j);   // each element j is boxed when added
}
```

Every `int` added there is boxed, because the parameter type is `object` and getting an `int` into an `object` is precisely the conversion that allocates. That is the shape a collection had to take before generics existed, `ArrayList` being the one everyone remembers: whatever it stores, the compiler sees `object` going in.

The tax repeats on the way out. Reading elements back gives you `object`, and arithmetic on `object` does not compile: the operator `*` cannot be applied to operands of type `object` and `object`. The elements cannot be multiplied or added to a sum until they are unboxed, and the unboxing must be done explicitly.

```csharp
sum += (int)mixedList[j] * (int)mixedList[j];
```

Two casts, two unboxings, per term. In a loop, that is the whole cost model.

`List<int>` pays none of it. Its element type is `int`, so `Add` takes an `int` and the assignment into the backing store is a copy of four bytes into a slot sized for four bytes. No conversion to `object` appears anywhere, and boxing is by definition a conversion to `object` or to an interface. Where the conversion is absent, so is the box. The storage underneath is an `int[]`, with [[cs/dsa/dynamic-arrays|the growth and amortized append cost of a dynamic array]] and nothing else in between, and its elements are contiguous, which is the part a benchmark actually notices.

> [!warning] The interface conversion boxes too
> Boxing is not only about `object`. Converting a value type to an interface it implements boxes it as well. A `struct` assigned to an `IComparable` variable, or passed to a method taking `IDisposable`, is on the heap for the duration. So passing a `struct` to a method that takes an `IComparable<T>` parameter allocates at the call, while a generic method declared `where T : IComparable<T>` never writes that conversion at all, even though the two signatures look interchangeable from the outside.

## The second tax: comparison

Storage is solved. Equality is not, at least not for free. Ask a `List<Point>` whether it contains a particular `Point` and something has to compare elements. The obvious implementation calls `Object.Equals(object)`, and that signature takes an `object`, which means every comparison boxes both operands. A `Contains` scan over a thousand structs would allocate two thousand boxes and throw them all away.

`IEquatable<T>` closes that. The interface defines an `Equals` method that determines the equality of instances of the implementing type, taking a `T` rather than an `object`, so no conversion occurs. The documentation is explicit about who uses it: `IEquatable<T>` is used by generic collection objects such as `Dictionary<TKey, TValue>`, `List<T>`, and `LinkedList<T>` when testing for equality in methods such as `Contains`, `IndexOf`, `LastIndexOf`, and `Remove`. It should be implemented for any object that might be stored in a generic collection, and for a value type you should always implement it and override `Equals(object)` for better performance.

The dispatch mechanism is the part worth memorizing, because it explains why a struct that forgets to implement the interface silently gets the slow path rather than an error. `EqualityComparer<T>.Default` checks whether type `T` implements `System.IEquatable<T>` and, if so, returns an `EqualityComparer<T>` that uses that implementation. Otherwise it returns one that uses the overrides of `Object.Equals` and `Object.GetHashCode` provided by `T`.

> [!tip] Two paths, one property access
> `EqualityComparer<T>.Default` is a single fork with a silent failure mode. Implement `IEquatable<T>` and every generic collection comparison on your struct is a direct, unboxed call. Skip it and everything still works, at the cost of a box per operand on every comparison, which in a [[cs/dsa/hash-tables|hash table bucket scan]] means a box per probe. Nothing in the type system will tell you which branch you landed on.

The shape recurs anywhere the framework offers a typed member next to an older untyped one, and the reason is always the same reason [[cs/languages/CSharp/reified-generics-in-the-clr|the runtime keeps the type argument at all]]. Knowing `T` is what makes it possible to skip the trip through `object`, and the trip through `object` is where the allocation lives.

## Related Notes

- [[cs/languages/CSharp/value-types-structs-and-boxing|Value Types, Structs, and Boxing]] - where a value lives and what a box actually allocates.
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - why a generic collection can have a real value-type layout instead of an object array.
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]] - the growth and amortization model of the backing store underneath List of T.
- [[cs/dsa/hash-tables|Hash Tables]] - where the per-comparison cost multiplies by the probe count.
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - why an allocation per element is worse than it looks.
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the language that cannot remove this tax, and boxes every element of a generic collection.

## Sources

- "Boxing and Unboxing (C# Programming Guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing . Supports the definition of boxing, the heap wrap in a System.Object instance, implicit boxing and explicit unboxing, the allocation and cast cost statements, and the `List<object>` example with its per-element boxing and required explicit unboxing.
- "IEquatable Interface," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/api/system.iequatable-1 . Supports what the interface defines, the generic collections and methods that use it, the recommendation to implement it for anything stored in a generic collection, and the value-type performance guidance.
- "EqualityComparer.Default Property," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.equalitycomparer-1.default . Supports the two-branch behavior of Default: the IEquatable implementation when present, and the Object.Equals and Object.GetHashCode overrides otherwise.
