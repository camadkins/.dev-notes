---
title: "Variance in and out"
description: "C# decides variance once, at the declaration, with a keyword on the type parameter. The compiler then polices where that parameter may appear, and every call site inherits the answer for free."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-02
updated:
aliases:
  - C# Declaration-Site Variance
  - out and in Generic Modifiers
  - Covariant and Contravariant Type Parameters
---

Two languages can agree that `IEnumerable<string>` ought to be usable where `IEnumerable<object>` is expected, and still disagree completely about who gets to say so. Java hands the decision to whoever writes the parameter list, one site at a time. C# hands it to whoever wrote the interface, once, and then never asks again.

> [!note] The idea
> C# variance is declaration-site. The author of a generic interface or delegate marks a type parameter `out` or `in`, the compiler checks at that declaration that the parameter only ever appears in positions the mark permits, and from then on the conversion is available implicitly at every use with no syntax at all. The cost of that convenience is that the decision is one-shot and total: a type parameter used for both reading and writing cannot be marked either way, and no call site can locally opt into the flexibility the author declined. This is the same safety argument [[cs/pl/subtyping-variance-type-constraints|subtyping theory]] makes about mutable containers, but resolved at the opposite end of the pipe from [[cs/languages/Java/wildcards-and-the-get-put-principle|Java's use-site wildcards]].

## Two keywords, two positions

`out` on a type parameter declares it covariant. The documentation states the rule plainly: for generic type parameters, the `out` keyword specifies that the type parameter is covariant, and covariance lets you use a more derived type than the generic parameter specifies. So `ICovariant<string>` converts implicitly to `ICovariant<object>`, and the direction of the conversion follows the direction of the subtyping relation between the arguments.

`in` declares it contravariant, and contravariance runs the other way: it enables you to use a less derived type than the type specified by the generic parameter. `IComparer<Person>` is usable as an `IComparer<Employee>` when `Employee` inherits `Person`, because a thing that can compare any two people can certainly compare two employees.

The framing that makes both directions memorable is in the overview page: covariance preserves assignment compatibility and contravariance reverses it. Nothing about the values changes. What changes is whether the container's type relation tracks or inverts the element type relation.

## What the compiler checks at the declaration

The keyword is a claim, and the compiler audits it where it is written rather than where it is used. For covariance the conditions are specific. In a generic interface you may declare a type parameter covariant if you use the type parameter only as a return type of interface methods and do not use it as a type of method arguments. There is one carve-out worth knowing, because it looks like a contradiction until you follow it: if a covariant interface has a contravariant generic delegate as a method parameter, you may use the covariant type as a generic type parameter for that delegate. A contravariant slot inside a parameter position flips twice and lands back in output position, which is exactly why `IEnumerable<out T>` can carry a `Func<T, bool>`-shaped idea without breaking.

The second covariance condition is easy to miss and has no analogue in the informal "output position" story: you must not use the type parameter as a generic constraint for the interface's methods. A constraint is a demand placed on the caller, which makes it an input in disguise.

Contravariance gets the mirror rule. You may declare a type contravariant in a generic interface or delegate only if it defines the type of a method's parameters and not the method's return type.

Then there is the rule that catches people who reason purely by position. `in`, `ref`, and `out` parameters must be invariant, meaning they are neither covariant nor contravariant. A `ref` parameter is read and written through the same slot, so it is simultaneously an input and an output and can be neither.

> [!warning] Variance is a reference-type feature
> Covariance and contravariance support reference types, but they do not support value types. Every variance conversion in the language is an implicit reference conversion, and a reference conversion is legal exactly because it changes no bits: a reference to a `string` and a reference to an `object` have the same representation. Substitute a value type for the type parameter and that stops being true, since getting from a stored `int` to an `object` means [[cs/languages/CSharp/value-types-structs-and-boxing|allocating a box and copying]]. The rule is not a limitation bolted on afterward. It falls out of what the conversion is.

## Where the keywords are legal

`out` and `in` are used in generic interfaces and delegates. Not classes. That restriction sounds arbitrary until you notice that a class carries fields, and a field of type `T` is both readable and writable by definition, which is the one combination variance cannot survive. Interfaces and delegates describe pure signatures, so the compiler can decide the question from the member list alone.

A delegate follows the same logic in miniature. In a generic delegate, declare a type covariant if you use it only as a method return type and not for method arguments. `Func<out TResult>` and `Action<in T>` are that rule applied to the two most common shapes in the framework.

> [!example] The declaration carries the whole conversion
> ```csharp
> interface ICovariant<out R> { }
> interface IExtCovariant<out R> : ICovariant<R> { }
> class Sample<R> : ICovariant<R> { }
>
> ICovariant<object> iobj = new Sample<object>();
> ICovariant<string> istr = new Sample<string>();
> iobj = istr;   // legal, because ICovariant is covariant
> ```
> The last assignment needs no cast, no wildcard, and no annotation at the assignment site. Every fact licensing it was written on line one.

## What each end of the pipe buys

Deciding at the declaration means the conversion is invisible where it is used. `IEnumerable<out T>` was marked covariant once, and every LINQ chain, every `foreach`, and every method taking `IEnumerable<object>` inherits the flexibility without a syntax tax. Deciding at the use site means each caller states which half of a two-way type it intends to touch, which is more expressive per site and more verbose everywhere.

The trade shows up as a hard edge in C#. If an author writes `interface IStore<T>` with both a getter and a setter, no keyword is legal, and a caller who only ever reads from an `IStore<Derived>` still cannot pass it where an `IStore<Base>` is wanted. Java's caller can write `IStore<? extends Base>` and get exactly the read-only view. C#'s caller must go find or define a narrower interface.

The deeper point is that variance is not a property of a type. It is a property of how a type parameter is used, and both languages are asking the same question. They differ only in when they demand the answer, which is a recurring shape in [[cs/pl/type-systems-goals-guarantees|what a type system chooses to check and when]].

## Related Notes

- [[cs/languages/Java/wildcards-and-the-get-put-principle|Wildcards and the Get-Put Principle]] - the use-site answer to the same question, decided per parameter instead of per declaration.
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - the theory both designs instantiate, including why a mutable cell is invariant.
- [[cs/languages/CSharp/why-list-is-invariant-and-ienumerable-is-not|Why List Is Invariant and IEnumerable Is Not]] - the rules above applied to the two collection types you touch daily.
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what a compiler is buying when it moves a check earlier.
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the comparative hub for how each runtime treats type arguments.
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - why interfaces, not classes, are where variance can be decided.

## Sources

- "Covariance and Contravariance (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/ . Supports that covariance preserves assignment compatibility while contravariance reverses it, and that variance covers array types, delegate types, and generic type arguments.
- "out (generic modifier) (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/out-generic-modifier . Supports the covariance declaration rules (return-position only, no use as a generic constraint), the contravariant-delegate-parameter exception, the interfaces-and-delegates scope, the delegate rule, the `ICovariant` example, and that variance supports reference types but not value types.
- "in (generic modifier) (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/in-generic-modifier . Supports the contravariance declaration rule, the `IComparer<Person>` to `IComparer<Employee>` example, and the requirement that `in`, `ref`, and `out` parameters be invariant.
