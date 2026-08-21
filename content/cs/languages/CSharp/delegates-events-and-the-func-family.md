---
title: "Delegates, Events, and the Func Family"
description: "A delegate is not a function pointer. It is an object carrying a method and the instance to call it on, and every difference from a raw pointer follows from the second half."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-15
updated:
aliases:
  - C# Delegates
  - Events and the Publisher Subscriber Pattern
  - Func and Action Variance
---

C programmers meeting C# usually file the delegate under "function pointer with better syntax" and get most things right by accident for a while. The model breaks the first time an instance method is assigned. A raw pointer holds an address. A delegate has to hold an address plus the object that address will run against, and once the type carries a target it stops being a pointer and starts being a small object with its own dispatch.

> [!note] The idea
> A delegate is a type that represents references to methods with a particular parameter list and return type, and instantiating one associates the instance with any method having a compatible signature and return type. The compiler treats the return type as part of that signature, which method overload resolution does not. The code associated with a delegate is invoked through a virtual method added to the delegate type, so calling one is a dispatch, not a jump. Everything downstream, chaining, events, and the variance rules on `Func` and `Action`, is built on the fact that a delegate value is an object.

## The typed pointer with a target

You can assign any method from any accessible class or struct that matches the delegate type, static or instance. That flexibility is the stated point: it lets you programmatically change method calls or plug new code into existing classes. The comparison method handed to a sort algorithm is the canonical example, and the reason the sort can be general is that the comparison lives outside the library.

The documentation is precise about one asymmetry worth memorizing. In the context of method overloading, the signature of a method does not include the return value; in the context of delegates, the signature does include the return value. A method must have a return type compatible with the one the delegate declares. Two methods differing only in return type are not overloads, but they are certainly different delegate targets.

C# does also have raw [[cs/dsa/pointer-with-functions|function pointers]], and the documentation puts them beside delegates for exactly the scenarios where you need more control over the calling convention. Choosing a delegate is choosing the object model; choosing a function pointer is choosing the address.

Lambda expressions in certain contexts are compiled to delegate types, which is where the target field earns its keep a second time. A lambda that reads a local from its enclosing scope has to keep that state somewhere, and the delegate's target is where the compiler puts the [[cs/pl/scoping-binding-and-closures|closure]] it built. [[cs/languages/Rust/closures-fn-fnmut-fnonce|Rust makes the same distinction visible in the type system]] with three closure traits; C# hides it behind one delegate type and pays for it with allocations you cannot see in the source.

Delegates can also be chained together, such as calling multiple methods on a single event. A delegate value can hold an invocation list rather than one entry, and invoking it runs each in turn. That is the whole implementation of multicast, and it is only possible because a delegate is a value with room for a list.

## Events restrict who may raise

An event is a member that enables an object to trigger notifications, and the event is of a delegate type. Event handlers are delegate instances added to the event and executed when the event is raised, and users of the event can add or remove their handlers. So far this is a public field of delegate type with two extra verbs.

The `event` keyword adds the one restriction that makes the pattern safe. Events are multicast delegates that you can only invoke from within the class, or derived classes, or struct where you declare them. Outside code can subscribe and unsubscribe, and cannot raise. Without that rule, any consumer holding a reference to a public delegate field could invoke the whole subscriber list, or overwrite it with `=` instead of appending with `+=`. The keyword splits one capability into two and hands out only half.

Access modifiers apply as they do to other members, so an event can be `public`, `private`, `protected`, `internal`, `protected internal`, or `private protected`, and the modifier governs who can subscribe rather than who can raise. The convention of a `protected virtual` raiser method exists because of the same rule: a derived class needs a sanctioned way in, so the base class exposes one.

> [!example] Why the raiser looks like this
> ```csharp
> protected virtual void RaiseSampleEvent()
> {
>     SampleEvent?.Invoke(this, new SampleEventArgs("Hello"));
> }
> ```
> The `?.` is not decoration. An event with no subscribers is null, so raising it unconditionally throws, and the documentation describes this form as raising the event in a thread-safe manner. The null check and the invocation happen against one evaluated value rather than two reads of a field another thread may be unsubscribing from.

## Variance, and why `Func` reads backwards

Variance is a property of a generic interface or delegate type's type parameter, and it controls which implicit conversions exist between constructed types using different type arguments. By default generic type parameters are invariant: even when one type argument derives from another, `List<Derived>` and `List<Base>` are unrelated. Covariant type parameters let you substitute a more derived type, so an `IEnumerable<Derived>` is assignable to an `IEnumerable<Base>`. Contravariant type parameters let you substitute a base type where a derived one was expected, so an `Action<Base>` is assignable to an `Action<Derived>`.

That second one looks wrong and is not. When an `Action<Base>` is invoked as if it were an `Action<Derived>`, its argument must be a `Derived`, and a `Derived` can always be passed safely to a method whose parameter is `Base`. The general rule is one sentence: a covariant type parameter can be used as the return type of a delegate, and contravariant type parameters can be used as parameter types.

The `Func` family is that rule made concrete. The `Func` generic delegates have covariant return types and contravariant parameter types; the `Action` generic delegates have contravariant parameter types only, having no return. The last type parameter of a `Func` specifies the return value and is covariant with `out`, while the others are contravariant with `in`. So a `Func<Base, Derived>` can be assigned to a `Func<Base, Base>`, to a `Func<Derived, Derived>`, and to a `Func<Derived, Base>`, which combines both effects. The [[cs/pl/subtyping-variance-type-constraints|theory behind that shape]] predates C# by decades, and [[cs/languages/CSharp/variance-in-and-out|the `in` and `out` keywords]] are how an author declares it once instead of at every use site.

> [!warning] Three limits worth knowing before you rely on this
> Variant type parameters are restricted to generic interface and generic delegate types, so a class can never be variant. Variance applies only to reference types: specify a value type for a variant type parameter and that parameter is invariant for the resulting constructed type, which is why `IEnumerable<int>` converts to nothing useful. And variance does not apply to delegate combination. Given an `Action<Derived>` and an `Action<Base>`, you cannot combine them even though the result would be type safe, because delegates combine only if their types match exactly.

The last one is the sharp edge in practice. Assignment is variant and `+=` is not, so a subscriber list assembled from handlers with related but unequal signatures fails to build even where every individual assignment would have been legal.

## Related Notes

- [[cs/languages/CSharp/variance-in-and-out|Variance in and out]] - the declaration-site keywords this note only uses.
- [[cs/languages/CSharp/why-list-is-invariant-and-ienumerable-is-not|Why List Is Invariant and IEnumerable Is Not]] - the same rule applied to the collection interfaces.
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - where the parameter and return positions get their signs.
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - what the target field is really holding when a lambda captures.
- [[cs/dsa/pointer-with-functions|Pointers with Functions]] - the primitive a delegate is often mistaken for.
- [[cs/languages/Rust/closures-fn-fnmut-fnonce|Closures: Fn, FnMut, and FnOnce]] - capture made explicit in the type system instead of hidden in an object.

## Sources

- "Delegates (C# Programming Guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/delegates/ . Supports the delegate definition and compatible-signature association, assignment of static or instance methods from any accessible type, the return type being part of the signature for delegates but not for overloading, the callback and sort-comparison motivation, the virtual method used to invoke delegate code, the function pointer and calling convention contrast, delegate chaining, and lambda expressions compiling to delegate types.
- "event (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/event . Supports the definition of an event and its delegate type, handlers as delegate instances added and removed by users, the restriction that events can only be invoked from the declaring class, derived classes, or struct, the list of permitted access modifiers, and the protected virtual raiser with the null-conditional invocation described as thread-safe.
- "Covariance and Contravariance in Generics," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/generics/covariance-and-contravariance . Supports the definition of variance and the invariant default, the covariant and contravariant substitution rules with the IEnumerable and Action examples, the safety argument for contravariant parameters, the return-position and parameter-position rule, the covariance and contravariance of the Func and Action families and the out and in markings, the four Func assignments, and the restrictions on variance to interfaces and delegates, to reference types, and away from delegate combination.
