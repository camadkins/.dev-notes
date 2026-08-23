---
title: "Constraint Interfaces and Type Sets"
description: "Go got operator constraints without inventing a constraint language, by redefining an interface as a set of types rather than a set of methods."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-15
updated:
aliases:
  - Go Type Sets
  - Approximation Element
  - Union Constraint Element
---

Write a generic function that returns the smaller of two values and you hit the wall at once. The body wants to evaluate `x < y`. A constraint is an interface, an interface is a list of methods, and the less-than operator is not a method. Every language adding generics on top of operators meets this, and the usual answer is to invent something: concepts in C++, traits in Rust, a fresh construct with fresh syntax.

Go's answer was to change the meaning of a word it already had.

> [!note] The idea
> An interface used to denote a set of methods. It now denotes a set of types, and the method list is just one way of describing that set. Robert Griesemer states the shift plainly: "Go 1.18 also changed how we view interfaces: while in the past an interface defined a set of methods, now an interface defines a set of types." The reframing costs nothing, because "This new view is completely backward compatible": for any method list you can imagine the infinite set of types implementing it. What it buys is the ability to name the set directly instead of describing it through methods, which is the only way to say something about an operator. Every piece of new constraint syntax in Go, the union bar and the tilde, is machinery for building a set of types by hand.

## From methods to types

The old and new readings agree on every interface that existed before Go 1.18. The introduction to generics makes the equivalence explicit: "Until recently, the Go spec said that an interface defines a method set, which is roughly the set of methods enumerated in the interface." Then the pivot: "But another way of looking at this is to say that the interface defines a set of types, namely the types that implement those methods."

Both readings pick out the same interfaces, so no existing code changes meaning. The gain is expressive reach: "For our purposes, though, the type set view has an advantage over the method set view: we can explicitly add types to the set, and thus control the type set in new ways."

The spec now defines type sets compositionally, and the definitions read like [[cs/math/set-theory-basics|elementary set theory]] because that is what they are. "The type set of the empty interface is the set of all non-interface types." "The type set of a non-empty interface is the intersection of the type sets of its interface elements." "The type set of a method specification is the set of all non-interface types whose method sets include that method." Intersection is what makes a multi-element interface stricter, which is exactly what a list of requirements should do. These sets are not enumerable objects. The spec is careful that the quantification covers "types declared in the program at hand, but all possible types in all possible programs, and hence is infinite."

One structural rule causes real confusion later: "By construction, an interface's type set never contains an interface type." Type sets hold concrete types only, and interfaces relate to them by a subset rule instead, since `T` implements `I` when "T is an interface and the type set of T is a subset of the type set of I."

## Why unions and tildes exist

Once a constraint is a set of types, the question becomes how to write one down. Methods describe sets only indirectly, and operators need something else. The reason a hand-written set works at all is a property of Go. Griesemer notes it while discussing equality: unlike other operations, `==` is defined not on "a limited set of predeclared types" but on an infinite variety including arrays, structs, and interfaces. The implication for everything except equality is the useful half. Arithmetic and ordering operators work only on a small, closed family of predeclared types and the types defined from them, so the set of types supporting `<` can be written out by hand.

The spec provides exactly three notations. "In their most general form, an interface element may also be an arbitrary type term T, or a term of the form ~T specifying the underlying type T, or a union of terms."

A bare type term is the degenerate case: "The type set of a non-interface type term is the set consisting of just that type." The union bar assembles alternatives. "The vertical bar expresses a union of types (or sets of types in this case)," and the type set of a union "is the union of the type sets of the terms." This is how `int | int8 | int16` becomes a constraint.

The tilde is the element people find strange, and it exists for a reason that has nothing to do with operators and everything to do with how Go programs are written. A program that declares `type MyString string` can still use `<` on `MyString` values, so a constraint listing only `string` would reject a type that supports every operation the function needs. The tilde closes that gap: "The expression ~string means the set of all types whose underlying type is string," which "includes the type string itself as well as all types declared with definitions such as type MyString string." Go's defined types create a family per predeclared type, and the tilde is the quantifier over that family. Without it, every generic numeric function would silently exclude every domain-specific type its users had defined.

The spec fences the tilde in tightly: in `~T`, "the underlying type of T must be itself, and T cannot be an interface." So `~MyString` is illegal, because `MyString` is already downstream of `string`. Unions carry their own rule, that "the type sets of all non-interface terms must be pairwise disjoint," so `~int | MyInt` is rejected as redundant rather than silently accepted.

## What the constraint then permits

The type set does double duty. It says which type arguments are legal, and it says what the function body may do. Griesemer states the second half explicitly, that a constraint "also determines the operations that are possible on values of a type parameter." The rule for operations is a quantifier over the set: "More generally, an operation such as + or * that is supported by all types in the type set defined by a constraint is permitted with values of the corresponding type parameter."

That is the whole mechanism. There is no table mapping operators to constraints and no operator method; the compiler checks that every type in the set supports the operation. Compare [[cs/pl/type-classes-and-traits|the type class approach]], where the language names each operation as a nameable capability and types opt in by implementing it; Go names the types and derives the capabilities. The trade shows up against [[cs/languages/Rust/traits-and-generic-bounds|Rust's trait bounds]], which reach user-defined operators; a Go type set cannot, since it can only enumerate types the language already gave operators to.

> [!warning] These interfaces are second-class on purpose
> An interface containing a union or a tilde cannot be used as a variable type. The spec: "Interfaces that are not basic may only be used as type constraints, or as elements of other interfaces used as constraints." The blog put it the same way at launch: "For now, interfaces that use the new syntactic forms may only be used as constraints." A constraint is a compile-time object, and Go declined to make it a runtime one.

Griesemer's summary is not overstated: "Interfaces as type sets is a powerful new mechanism and is key to making type constraints work in Go." One predeclared name escapes this scheme entirely, because its type set cannot be written with unions and tildes at all, which is the subject of [[cs/languages/Go/comparable-ordered-and-the-constraint-library|comparable and ordered]].

## Related Notes

- [[cs/math/set-theory-basics|Set Theory Basics]] - intersection, union, and subset, which are the whole of the type set calculus
- [[cs/pl/type-classes-and-traits|Type Classes & Traits]] - naming the operation instead of the types, the design Go declined
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - what a constraint reaches when operators are nameable
- [[cs/languages/Go/comparable-ordered-and-the-constraint-library|comparable, Ordered, and the Constraint Library]] - the one type set the notation cannot describe
- [[cs/languages/Go/type-parameters-and-constraints|Type Parameters and Constraints]] - where a constraint appears and what it binds
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - the alternative of bounding by a subtyping relation

## Sources

- The Go Programming Language Specification. https://go.dev/ref/spec . Supports the three interface element forms, the compositional definitions of type sets for the empty interface, non-empty interfaces, method specifications, type terms, tilde terms and unions, the infinite quantification, the rule that a type set never contains an interface type, the subset rule for interface implementation, the restrictions on tilde terms and on union disjointness, and the constraint-only status of non-basic interfaces.
- Robert Griesemer, "All your comparable types," The Go Blog, 17 February 2023. https://go.dev/blog/comparable . Supports the shift from method sets to type sets and its backward compatibility, the observation that equality is unusual in not being limited to predeclared types, that constraints determine both acceptable type arguments and permitted operations, and the rule that an operation is permitted when all types in the type set support it.
- Robert Griesemer and Ian Lance Taylor, "An Introduction To Generics," The Go Blog, 22 March 2022. https://go.dev/blog/intro-generics . Supports the old method set reading and the new type set reading, the advantage of adding types explicitly, the meaning of the vertical bar and of the tilde including the MyString case, and that the new syntactic forms may only be used as constraints.
