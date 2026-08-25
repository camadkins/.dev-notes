---
title: Constraining a Type Parameter
description: "Every generic language needs a way to say what T is allowed to do. Java bounds, C# where clauses, C++ concepts, Go type sets, Rust trait bounds, TypeScript structural extends, Python protocols, and Racket predicates are eight answers with different expressive ceilings."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-24
updated:
aliases: []
---

An unconstrained type parameter is nearly useless. C# states the consequence bluntly: without any constraints, the type argument could be any type, and the compiler can only assume the members of `System.Object`. So every language with generics ships a mechanism for saying what `T` must be able to do, and that is where the real design differences live. The generic syntax across these languages is nearly interchangeable. The constraint syntax is not.

> [!note] The idea
> Constraint mechanisms sort by what kind of thing they can say about `T`. Most can only say *`T` has these members*, which is why Java, C#, and Rust constraints are lists of types or traits. Two languages say more: Go constraints describe a *set of types*, which lets them talk about built-in operators no method signature can name, and C++ concepts are compile-time predicates over expressions, which lets them talk about anything the compiler can evaluate. The ceiling of a constraint system is not how much it can reject but how much of the requirement it can state, and everything it cannot state ends up as a comment.

## The naming answer: Java, C#, Rust

Java's bounded type parameters exist because there may be times when you want to restrict the types that can be used as type arguments in a parameterized type, as when a method on numbers should accept only instances of `Number` or its subclasses. The bound is a type name, and Java allows several: a type variable with multiple bounds is a subtype of all the types listed in the bound, and if one of the bounds is a class it must be specified first.

C# says the same with a different keyword. Constraints inform the compiler about the capabilities a type argument must have, specified using the `where` contextual keyword. What C# adds is a set of constraints that are not type names at all: you can require a non-nullable value type, a reference type, or a public parameterless constructor. Those describe how the type is *represented and created* rather than what it inherits, which is a distinction only a runtime that lays out value types inline can make.

Rust's version is a trait bound. A trait defines the functionality a particular type has and can share with other types, and trait bounds specify that a generic type can be any type that has certain behavior, written after a colon inside angle brackets. Because Rust traits can be implemented for types you did not define, the bound is a claim about a relationship rather than about inheritance, which is the [[cs/pl/type-classes-and-traits|type-class model]] rather than the subtyping one.

All three share a ceiling: the requirement has to be a name somebody declared. If what you need is "supports `+`" and the language has no interface for that, you cannot say it.

## The set answer: Go

Go went at that ceiling directly. In Go, type constraints must be interfaces, and an interface type defines a type set: a variable of interface type can store a value of any type in that set, and every member of the set implements the interface. Extending interfaces to describe sets rather than method lists is what let constraints name things a method cannot.

`constraints.Ordered` is the demonstration. The vertical bar expresses a union of types, and the tilde widens each term: `~string` means the set of all types whose underlying type is `string`. When used as a type constraint, the type set defined by an interface specifies exactly the types that are permitted as type arguments. The payoff is what the body may then do: if the type of an operand is a type parameter `P` with constraint `C`, operations are permitted if they are permitted by all types in the type set of `C`.

That last rule is the trick. A [[cs/languages/Go/constraint-interfaces-and-type-sets|type set is a constraint that licenses operators]] such as `<` and `+`, without inventing a `Comparable` interface for the built-in types to implement. Java never got that. C# arrived at the same destination from another direction: an interface may declare `static abstract` operators, a pattern that enables the compiler to determine the containing type for the overloaded operators.

## The predicate answer: C++

C++ constrained templates by accident for years. The mechanism was SFINAE: when substituting the explicitly specified or deduced type for the template parameter fails, the specialization is discarded from the overload set instead of causing a compile error, and cppreference notes plainly that this feature is used in template metaprogramming. It worked and it was miserable, because the constraint was a deliberately induced substitution failure and the error message described the failure rather than the requirement.

C++20 named the thing. Templates may be associated with a constraint, which specifies the requirements on template arguments and can be used to select the most appropriate function overloads and template specializations. Named sets of such requirements are called concepts, and a concept is a named set of requirements whose definition must appear at namespace scope. The line that matters: each concept is a predicate, evaluated at compile time, and becomes part of the interface of a template where it is used as a constraint.

Predicate is the strongest word here. A [[cs/languages/Cpp/concepts-and-requires-clauses|concept can require that an expression compiles]], that it has a particular type, that it is `noexcept`, none of which is a membership question. The cost is that a constraint system this expressive is a second language running at compile time, which is the subject of [[cs/languages/common/type-level-computation|type-level computation]].

## The shape answer: TypeScript and Python

TypeScript uses `extends` as well, but the thing on the right is a shape rather than a name. You may want a generic function that works on a set of types where you have some knowledge about what capabilities that set will have, so you must list the requirement as a constraint on what `Type` can be, typically by writing an interface with the members you need. No type ever declares that it satisfies that interface. Assignability decides.

Python's protocols are the same idea, arrived at deliberately. PEP 484 only specifies the semantics of nominal subtyping, and its abstract base classes have a stated problem: a class has to be explicitly marked to support them, which is unpythonic and unlike what one would normally do in idiomatic dynamically typed Python code. Structural subtyping matches the runtime semantics of duck typing, where an object that has certain properties is treated independently of its actual runtime class, and protocols work with additional, unrelated classes that happen to implement the required protocol.

## The value answer: Racket

Racket has no type parameter to constrain, so it constrains the value at the module boundary. The contract system allows programmers to define their own contracts as functions, and every function that accepts one argument can be treated as a predicate and thus used as a contract. Combinators such as `and/c` and `or/c` build compound checks out of simple ones, and a regular expression used as a contract accepts the strings and byte strings that match it.

Rank the expressiveness honestly and Racket wins and loses at once. Any computable property of a value can be a contract, which no static system here can match, and the check fires only after the program is running.

> [!tip] The question that separates them
> Ask what a constraint mechanism can say about `T` beyond a list of members. Java and C#: almost nothing, plus a few representation facts. Rust: an implementation relationship. Go: a set of types, therefore operators. C++: any compile-time predicate. Racket: any computable predicate, checked late. That ordering, rather than the syntax, tells you which requirements fit in the signature and which end up in the docstring, which is a question about [[cs/pl/type-systems-goals-guarantees|what a type system is able to guarantee at all]].

## Related Notes

- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the theory these eight mechanisms are approximating
- [[cs/languages/Java/bounded-type-parameters|Bounded Type Parameters]] - the naming answer in full, including multiple bounds
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - bounds as implementation relationships rather than inheritance
- [[cs/languages/Python/protocols-and-structural-subtyping|Protocols and Structural Subtyping]] - the shape answer as a deliberate retrofit
- [[cs/languages/Racket/parametric-polymorphism-through-contracts|Parametric Polymorphism Through Contracts]] - constraint as a runtime obligation on a value
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - what "predicate" means in the sense C++ concepts borrow it
- [[cs/languages/common/five-answers-to-the-same-question|Five Answers to the Same Question]] - the companion question: what happens to T after checking

## Sources

- "Constraints on type parameters," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters . Supports constraints informing the compiler about required capabilities, the unconstrained case being limited to System.Object members, and the where keyword.
- "Bounded Type Parameters," The Java Tutorials (Oracle). https://docs.oracle.com/javase/tutorial/java/generics/bounded.html . Supports the motivation for restricting type arguments, the Number example, multiple bounds, and the class-first ordering rule.
- "Defining Shared Behavior with Traits," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-02-traits.html . Supports traits defining shared functionality and trait bounds specifying that a generic type must have certain behavior, written after a colon inside angle brackets.
- "The Go Programming Language Specification." https://go.dev/ref/spec . Supports an interface type defining a type set, a variable of interface type storing any value in that set, and every member of the type set implementing the interface.
- "An Introduction To Generics," The Go Blog. https://go.dev/blog/intro-generics . Supports the vertical bar as a union of types, the tilde token meaning all types with a given underlying type, the type set specifying exactly the permitted type arguments, and operations being permitted only if permitted by all types in the set.
- "SFINAE," cppreference.com. https://en.cppreference.com/w/cpp/language/sfinae.html . Supports substitution failure discarding a specialization from the overload set instead of erroring, and the technique being used in template metaprogramming.
- "Constraints and concepts," cppreference.com. https://en.cppreference.com/w/cpp/language/constraints.html . Supports constraints specifying requirements on template arguments and selecting overloads, concepts being named sets of requirements defined at namespace scope, and each concept being a compile-time predicate that forms part of a template's interface.
- "Generics," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/2/generics.html . Supports writing a generic function over a set of types with known capabilities, and listing the requirement as a constraint on what the type parameter can be.
- "PEP 544: Protocols: Structural subtyping (static duck typing)." https://peps.python.org/pep-0544/ . Supports PEP 484 specifying only nominal subtyping, the explicit-marking problem with abstract base classes, structural subtyping matching duck typing, and protocols working with unrelated classes that happen to implement them.
- "Simple Contracts on Functions," The Racket Guide. https://docs.racket-lang.org/guide/contract-func.html . Supports programmer-defined contracts as functions, any one-argument function serving as a predicate contract, the and/c and or/c combinators, and regular expressions used as contracts.
