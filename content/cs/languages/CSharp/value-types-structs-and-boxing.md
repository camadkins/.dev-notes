---
title: "Value Types, Structs, and Boxing"
description: "One sentence about what a variable contains generates every rule that follows: copy semantics, no inheritance, the definitely-assigned default, and the allocation a boxing conversion performs."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-14
updated:
aliases:
  - C# Value Semantics
  - Struct vs Class in C#
  - What a Boxing Conversion Allocates
---

Nearly every C# question that starts "why does my struct do that" resolves to one distinction, and the documentation states it in a single line. A variable of a value type contains an instance of the type. A variable of a reference type contains a reference to an instance of the type. Everything else is bookkeeping around those two sentences.

> [!note] The idea
> Value semantics are not about where memory lives, they are about what the variable holds. Because a value-type variable holds the instance itself, assigning it, passing it, or returning it copies the instance. That copy is shallow, which produces the one genuinely surprising case: a struct with a reference-type field copies the reference, so the copy and the original still share the object it points at. A boxing conversion is the escape hatch from all of this, and it works by allocating a fresh heap object and putting the value inside, which is why it costs what it costs.

## Copying is the default everywhere

By default, on assignment, when passing an argument to a method, and when returning a method result, C# copies variable values. For value-type variables that means copying the corresponding instances. The documentation's own demonstration is worth reading for the output alone:

```csharp
var p1 = new MutablePoint(1, 2);
var p2 = p1;
p2.Y = 200;
// p1 after p2 is modified: (1, 2)
// p2: (1, 200)

MutateAndDisplay(p2);        // sets p.X = 100 inside
// Point mutated in a method: (100, 200)
// p2 after passing to a method: (1, 200)
```

The method mutated a point and the caller's point did not change, because the method received a copy. Operations on a value-type variable affect only that instance, the one stored in the variable. This is [[cs/dsa/pass-by-value-and-pass-by-reference|pass by value]] taken all the way down to user-defined aggregate types, which is precisely what a class does not do.

The struct documentation adds the performance footnote: when you pass a structure-type variable to a method or return one, the whole instance is copied, and pass by value can affect performance in high-performance scenarios involving large structure types. The `in`, `ref`, and `out` modifiers exist to skip that copy when the struct is big enough to care.

## The copy is shallow, and that is the trap

Here is the case that catches people who learned "structs are copied" as a slogan. If a value type contains a data member of a reference type, copying the value-type instance copies only the reference to the reference-type instance. Both the copy and the original then have access to the same object.

```csharp
public struct TaggedInteger
{
    public int Number;
    private List<string> tags;
    // AddTag appends to tags
}

var n1 = new TaggedInteger(0);
n1.AddTag("A");        // 0 [A]

var n2 = n1;
n2.Number = 7;
n2.AddTag("B");

Console.WriteLine(n1); // 0 [A, B]
Console.WriteLine(n2); // 7 [A, B]
```

`n2.Number = 7` did not touch `n1`, exactly as the copy rule promises. `n2.AddTag("B")` changed what `n1` prints, because the two structs hold the same `List<string>`. The value semantics are real and they stop at the first reference. This is why the documentation recommends defining immutable value types, and why `readonly struct` exists: a `readonly struct` requires every field to be `readonly` and every property to be read-only or init-only, which guarantees no member modifies the struct's state.

## What a struct can and cannot be

A structure type is a value type that can encapsulate data and related functionality. Structure types have value semantics; class types have reference semantics. The limitations follow from the layout rather than from taste. A structure type cannot inherit from another class or structure type and cannot be the base of a class, though it can implement interfaces. You cannot declare a finalizer in one. A constructor must initialize all instance fields.

The initialization rules are the same principle from another angle. A variable of a struct type directly contains the data for that struct, so all of its fields must be definitely assigned when it is created, and the default value of a struct definitely assigns all fields to zero. That is also why a `default` expression and an array allocation both bypass a parameterless constructor: `default(Measurement)` and `new Measurement[2]` produce all-zero instances even when the type declares a constructor that would have set something else.

The `struct` constraint plugs this into generics. Writing `where T : struct` specifies that the type parameter is a non-nullable value type, and both structure and enumeration types satisfy it.

## The box

A boxing conversion is how a value gets to be treated as an object. For any structure type except a `ref struct`, boxing and unboxing conversions exist to and from `System.ValueType` and `System.Object`, and they also exist between a structure type and any interface it implements.

What actually happens is concrete. The runtime allocates a new `System.Object` instance on the managed heap and wraps the value inside it. The original value is unaffected, since it was copied in. Boxing is implicit, so it happens wherever a conversion to `object` or to an interface appears, including places you did not write one on purpose.

```csharp
int i = 123;
object o = i;      // allocation
i = (int)o;        // checked cast, copy back out
```

Three costs stack up here, and separating them is the useful part.

The allocation itself: a new object must be allocated and constructed, which is real work relative to a plain assignment. The collector's share: that object now exists, so it must be traced, and a loop that boxes creates garbage at loop speed, which is a very different profile from [[cs/pl/garbage-collection-concepts|a program that allocates rarely]]. And the locality loss: an array of 10,000 structs is 10,000 instances laid out end to end, while an array of 10,000 boxed values is 10,000 pointers to objects scattered wherever the allocator put them, so the second one misses [[cs/systems/memory-hierarchy-and-caching|cache]] on almost every element.

> [!warning] The implicit ones are the expensive ones
> Explicit boxing is easy to see. The implicit boxing is where the cost hides: passing a struct to a method that takes an interface parameter, calling a non-overridden `Object` method on it, using it as a key in something that compares through `object`, or adding it to a collection typed as `object`. Each of these is a conversion to `object` or to an interface, and each therefore allocates. The generic collections exist in large part to remove exactly these conversions from the common paths, which is [[cs/languages/CSharp/generic-collections-and-the-boxing-tax|the boxing tax note]] in one sentence.

The last observation to carry away: the box is not the struct. It is an object holding a copy of the struct. Unboxing copies the value back out, so mutating a boxed value through an interface and expecting the original to change is a category error, and mutating the original and expecting the box to follow is the same error in the other direction.

## Related Notes

- [[cs/languages/CSharp/generic-collections-and-the-boxing-tax|Generic Collections and the Boxing Tax]] - what these conversions cost once they run per element.
- [[cs/languages/CSharp/ref-structs-spans-and-the-allows-ref-struct-constraint|Ref Structs, Spans, and the allows ref struct Anti-Constraint]] - the value type that is forbidden to be boxed at all.
- [[cs/dsa/pass-by-value-and-pass-by-reference|Pass-by-Value vs Reference]] - the general form of the copy rule, outside any one language.
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - why contiguity is worth more than the instruction count suggests.
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - what an extra allocation actually obligates the runtime to do later.
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - where the struct constraint fits among the others.

## Sources

- "Value types (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types . Supports the variable-contains-an-instance definition, the copy-on-assignment/argument/return rule, the MutablePoint example and its output, the shallow-copy behavior with the TaggedInteger example, the recommendation to define immutable value types, and the kinds of value types.
- "Structure types (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/struct . Supports the struct definition and value-versus-reference semantics, the inheritance and finalizer limitations, the constructor requirement, the whole-instance copy on pass and its performance note, readonly struct rules, definite assignment and default values, the struct constraint, and the boxing conversions to ValueType, Object, and implemented interfaces.
- "Boxing and Unboxing (C# Programming Guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing . Supports what boxing converts, the heap wrap in a System.Object instance, implicit boxing versus explicit unboxing, and the allocation and cast cost.
