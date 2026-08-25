---
title: Structural versus Nominal Typing
description: "TypeScript, Go, and Python protocols decide compatibility by members. Java, C#, and Rust decide it by declaration. The structural languages bought retrofitting and lost identity, which is why every one of them had to invent narrowing."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-25
updated:
aliases: []
---

Two questions look the same and are not. "Does this value have the members I need?" and "Did somebody declare that this type satisfies this contract?" [[cs/pl/type-systems-goals-guarantees|A type system]] answers one or the other, and the answer decides who can extend your library, whether two identical-looking types can be told apart, and whether the compiler can help at all once a value is behind an abstraction.

> [!note] The idea
> Structural typing decouples a type's definition from the contracts it satisfies, which is what makes retrofitting possible: a type written before your interface existed can satisfy it anyway. The price is identity. If compatibility is decided purely by members, two types with the same members are the same type, and the compiler cannot distinguish a `UserId` from an `OrderId` or tell you which branch of a union you are in. That missing identity is why every structural language in wide use grew a *narrowing* mechanism, a flow-sensitive way to recover the specific type the assignability rules deliberately forgot. Nominal languages get identity free and pay in coupling, most explicitly in Rust, where coherence forces the orphan rule.

## The two rules, stated by the languages themselves

TypeScript is the clearest. Type compatibility in TypeScript is based on structural subtyping, and structural typing is a way of relating types based solely on their members, in contrast with nominal typing. The handbook makes the comparison itself: in nominally typed languages like C# or Java, the equivalent code would be an error because the `Dog` class does not explicitly describe itself as being an implementer of the `Pet` interface. The design reason is stated too, and it is about the host language rather than about type theory. Because JavaScript widely uses anonymous objects like function expressions and object literals, [[cs/languages/TypeScript/structural-typing-and-assignability|a structural system fits the code that already exists]].

Go reached the same place from another direction. An interface type defines a type set, a variable of interface type can store a value of any type in that set, and such a type is said to implement the interface. Nothing is declared. A type implements `io.Writer` by having the method, and [[cs/languages/Go/interfaces-and-implicit-satisfaction|the interface can be defined after the type it describes]], in a package the type's author never heard of.

Python's protocols are the retrofit, and PEP 544 states the grievance precisely. PEP 484 only specifies the semantics of nominal subtyping, and the problem with the abstract base classes it relies on is that a class has to be explicitly marked to support them, which is unpythonic and unlike what one would normally do in idiomatic dynamically typed Python code. Protocols are automatically extensible and work with additional, unrelated classes that happen to implement the required protocol.

The nominal side is just as explicit. In Java, to use an interface you write a class that implements the interface, and when an instantiable class implements an interface it provides a method body for each of the methods declared in the interface. The word `implements` is a declaration and there is no other route.

## What nominal typing is actually buying: coherence

Rust is the most instructive nominal language here, because it pays a visible cost for the property it wants. A trait can be implemented for a type only if either the trait or the type, or both, are local to the current crate. You can implement `Display` for your own type, and you can implement your own trait for `Vec<T>`, but you cannot implement `Display` for `Vec<T>`, because both are defined in the standard library.

The Book explains why in one sentence that names the real stake: this restriction is part of a property called coherence, and more specifically the orphan rule, and it ensures that other people's code cannot break your code and vice versa. Without the rule, two crates could implement the same trait for the same type and Rust would not know which implementation to use.

That is the nominal argument in miniature. A declared relationship is *unique*, and uniqueness is what lets a compiler pick one implementation, one vtable, one meaning for a program regardless of which crates are linked in. Structural systems avoid the problem by not attaching implementations to types at all, checking shape at the point of use, which also means they cannot offer what coherence offers.

## Why the structural languages all invented narrowing

Structural assignability is generous on the way in and useless on the way out. Once a value is typed as `Fish | Bird`, or as a Go `interface{}`, the members that made it assignable are no longer visible. Every structural language solved this the same way, with a local mechanism that recovers a specific type inside a block.

TypeScript calls it by name: the compiler follows possible paths of execution that a program can take to analyze the most specific possible type of a value at a given position, and the process of refining types to more specific types than declared is called narrowing. When the built-in checks are not enough, you write your own: define a function whose return type is a type predicate, in the form `parameterName is Type` where the parameter name must be a parameter of the current signature, and any time it is called TypeScript will narrow that variable to that specific type if the original type is compatible.

Go's version is the type assertion. The notation `x.(T)` is called a type assertion; if `T` is an interface type, it asserts that the dynamic type of `x` implements the interface `T`, and if the assertion is false a run-time panic occurs. The comma-ok form and the type switch are the ergonomic wrappers, but the mechanism is the same: reintroduce a concrete type at a point where the static type has forgotten it.

Python needed two rounds. Protocols deliberately do not participate in runtime checks by default, since the default semantics is that `isinstance()` and `issubclass()` fail for protocol types. So static narrowing arrived instead: `TypeIs` annotates the return type of a user-defined type predicate function, and it aims to benefit type narrowing, a technique used by static type checkers to determine a more precise type of an expression within a program. Usually type narrowing is done by analyzing conditional code flow and applying the narrowing to a block of code.

Three languages, three mechanisms, one shape. Narrowing is the tax on structural typing, and the nominal languages barely need it, because a nominal type never stopped knowing what it was.

> [!warning] Structural typing quietly deletes distinctions you wanted
> If a user id and an order id are both aliases for a string, a structural system says they are the same type, because by its own rule they are. Python ships the standard workaround in the standard library: use the `NewType` helper to create distinct types, and the static type checker will treat the new type as if it were a subclass of the original type, which is useful in helping catch logical errors. The trick underneath is always the same, which is to attach something the shapes do not share. That structural languages keep reaching for it is a strong hint that identity is a genuine requirement rather than a nominal-language habit, and that structural systems end up recovering it by simulation. Rust never needs the workaround, because [[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|its newtype is the ordinary way to declare a type]].

The engineering read: structural typing lowers [[cs/software-engineering/coupling-and-cohesion|coupling]] between a type and the abstractions it satisfies, which is what you want in a large ecosystem where the interface is defined downstream of the data. Nominal typing raises that coupling on purpose and buys back two things: the ability to say that identical-looking types are different, and the guarantee that a program has one meaning.

## Related Notes

- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the theory of what a subtype relation is, before the structural or nominal choice
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the tagged alternative that makes narrowing unnecessary
- [[cs/languages/Python/runtime-checkable-protocols-and-their-limits|Runtime-Checkable Protocols and Their Limits]] - what happens when a structural check is asked to run at run time
- [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|Discriminated Unions and Exhaustiveness]] - the pattern that gives a structural system back its tags
- [[cs/languages/Go/the-empty-interface-any-and-type-assertions|The Empty Interface, any, and Type Assertions]] - Go's narrowing mechanism in detail
- [[cs/languages/common/constraining-a-type-parameter|Constraining a Type Parameter]] - the same split, seen from inside a generic signature

## Sources

- "Type Compatibility," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/type-compatibility.html . Supports TypeScript compatibility being structural subtyping, structural typing relating types solely by members, the contrast with nominal typing in C# and Java, and the JavaScript-shaped design rationale.
- "Narrowing," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/2/narrowing.html . Supports the definition of narrowing as refining types along paths of execution, and user-defined type predicates of the form parameterName is Type.
- "The Go Programming Language Specification." https://go.dev/ref/spec . Supports an interface type defining a type set, implementation being membership in that set, and type assertions including the interface case and the run-time panic on failure.
- "PEP 544: Protocols: Structural subtyping (static duck typing)." https://peps.python.org/pep-0544/ . Supports PEP 484 covering only nominal subtyping, the explicit-marking problem, protocols working with unrelated classes, and isinstance and issubclass failing for protocol types by default.
- "typing," The Python Standard Library. https://docs.python.org/3/library/typing.html . Supports TypeIs annotating a user-defined type predicate function and narrowing being done by analyzing conditional code flow.
- "Interfaces," The Java Tutorials (Oracle). https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html . Supports Java requiring a class to declare that it implements an interface and to supply a body for each declared method.
- "Defining Shared Behavior with Traits," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-02-traits.html . Supports the locality restriction on trait implementations, the coherence property and orphan rule, and the ambiguity the rule prevents.
