---
title: "default(T) and the Null Question"
description: "One expression that returns zero, null, or a zeroed struct depending on the argument, and a question mark that means two entirely different things depending on which constraint is in scope."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases:
  - default(T)
  - Nullable Type Parameters
---

Write a generic method that has to return something when it finds nothing. You cannot write `return null`, because `T` might be `int`. You cannot write `return 0`, because `T` might be `string`. There is exactly one expression that works, and the fact that the language needed to invent it says something about where the value and reference type worlds meet.

> [!note] The idea
> `default(T)` is the single expression that produces a value of an unconstrained type parameter, and the reason it has to exist is that C# has two disjoint notions of "nothing" that generics force into one slot. Zero for value types, null for reference types. The question mark then splits along the same seam and, worse, means different things on either side of it: `T?` on a `struct`-constrained parameter is `Nullable<T>`, a real runtime type with storage for a flag, while `T?` on a `class`-constrained parameter is a compile-time annotation with no runtime existence at all. `default(T)` is where the seam is visible, and the `default` constraint is the patch the language needed once the two spellings collided.

## What the operator does

"A default value expression produces the default value of a type," and "the argument to the default operator must be the name of a type or a type parameter." That second clause is the point. `default` is the one construct in the language whose meaning is resolved per instantiation without the author choosing a branch.

The documentation's own demonstration is the clearest possible illustration, printing `default(T)` for three arguments and getting three unrelated answers. The default of `int?` is null, because `Nullable<int>` has no value. The default of `System.Numerics.Complex` is `(0, 0)`, because a struct's default is all of its fields at their own defaults. The default of `List<int>` is null, because it is a reference type and a reference to nothing is null.

There is also a `default` literal, usable "when the compiler can infer the expression type," which is why `T initialValue = default` appears in signatures where the explicit form would just repeat the parameter name.

> [!example] The lookup with no answer
> ```csharp
> static T FindOrDefault<T>(IEnumerable<T> items, Func<T, bool> predicate)
> {
>     foreach (var item in items)
>         if (predicate(item)) return item;
>     return default;             // 0 for int, null for string, zeroed for a struct
> }
> ```
> The caller of `FindOrDefault<int>` cannot distinguish "found the value 0" from "found nothing," which is why the library convention is a `TryGet` pattern returning `bool` with an `out` parameter. The alternative design is [[cs/languages/Rust/error-handling-result-and-question-mark|Rust's Option]], which makes absence a case of the type rather than a value inside it, and pays for it with an unwrap at every use.

## Nothing is not null when T is a value type

The unconstrained case has a rule that catches people, and the documentation states it plainly. Unbounded type parameters "can be converted to and from System.Object or explicitly converted to any interface type," and "you can compare them to null. If an unbounded parameter is compared to null, the comparison always returns false if the type argument is a value type."

That is not a bug and not a special case in the comparison. A value type instantiation has no null, so the comparison is a constant false, and the specialized code body for that instantiation folds it away entirely. Guarding a generic method with `if (arg == null) throw ...` therefore silently does nothing for every value type argument. The correct test for "is this the default" is `EqualityComparer<T>.Default.Equals(value, default)`, which dispatches to the right notion of emptiness per instantiation.

## The two meanings of the question mark

Nullable value types are a runtime construct. `int?` is `Nullable<int>`, a struct with a value and a flag, a distinct type in the runtime's type system with distinct storage. Nullable reference types are the opposite: "the runtime behavior of your program is unchanged. Nullable reference types are entirely a compile-time feature," and "the annotation doesn't change the runtime type," so `string` and `string?` are both `System.String`.

Two spellings, identical syntax, and one of them is [[cs/languages/CSharp/reified-generics-in-the-clr|reified]] while the other is not. Generics are where that collision has to be resolved, because `T?` has to mean something before anyone knows which side `T` lands on.

The rules the documentation gives are worth reading in order. Originally "`T?` can be used with either the struct or class constraint, but one of them must be present," and "when the class constraint was used, `T?` referred to the nullable reference type for `T`." That restriction was later lifted: "`T?` can be used when neither constraint is applied. In that case, `T?` is interpreted as `T?` for value types and reference types," with one exception that prevents an infinite regress, since if `T` is already a `Nullable<T>` then "`T?` is the same as `T`," rather than becoming `T??`.

That relaxation is what produced the `default` constraint. "Because `T?` can now be used without either the class or struct constraint, ambiguities can arise in overrides or explicit interface implementations," and the reason is a rule about inheritance rather than about nullability: "in both those cases, the override doesn't include the constraints, but inherits them from the base class." A derived method needed a way to say the base applied neither, and `where T : default` is that statement. It is a piece of syntax that exists purely to name the absence of two other pieces of syntax.

> [!warning] The annotation is a warning system, not a guarantee
> `default(T)` for a `T` the caller declared as non-nullable still yields null at runtime, and the compiler can only warn about it. Null-state analysis works with two states, not-null and maybe-null, and it is diagnostics rather than enforcement: the null-forgiving operator `!` overrides it by assertion, the analysis does not trace into method bodies, and any assembly compiled in a nullable-oblivious context contributes no information at all. This is a [[cs/languages/Python/type-hints-and-gradual-typing|gradual typing]] arrangement in everything but name, with the same property that the guarantees hold exactly as far as the annotated region extends. Treating a warning-based analysis as a soundness property is the mistake [[cs/pl/type-soundness-progress-preservation|progress and preservation]] exist to make precise.

The design lesson generalizes past C#. A language that bolts a nullability discipline onto an existing runtime gets a compile-time feature, and a language that had the discipline from the start gets a runtime one. Generics are the place where a program has to name both at once, which is why this corner of the language has more special rules than its size suggests, and why the shape of those rules is a better guide to [[cs/pl/type-systems-goals-guarantees|what a type system is promising]] than any statement of intent.

## Related Notes

- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - where the default constraint sits in the full where vocabulary
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - why one question mark is reified and the other is not
- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling in Rust: Result, Option, and ?]] - absence as a case of the type instead of a value in it
- [[cs/languages/Python/type-hints-and-gradual-typing|Type Hints and Gradual Typing]] - the same bargain of annotations that do not bind the runtime
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what a warning-based discipline can and cannot promise
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress & Preservation]] - the formal version of the gap this note is about

## Sources

- "Default value expressions," C# reference, Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/default . Supports that a default value expression produces the default value of a type, that the operator's argument must be a type name or type parameter, the printed defaults for a nullable int, a struct, and a list, and the existence and inference rule of the default literal.
- "Constraints on type parameters (C# Programming Guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters . Supports the unbounded type parameter rules including the null comparison always returning false for a value type argument, the history and current meaning of T? with and without the class and struct constraints, the Nullable case not becoming a double question mark, and the reason the default constraint exists.
- "Nullable reference types," C# guide, Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references . Supports that nullable reference types are entirely a compile-time feature that leaves runtime behavior unchanged, that the annotation does not change the runtime type, and the two-state not-null and maybe-null null-state analysis.
