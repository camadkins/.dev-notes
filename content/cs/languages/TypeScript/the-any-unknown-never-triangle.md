---
title: "The any, unknown, never Triangle"
description: "Three types people file under one heading: the escape hatch that turns checking off, the top type that admits everything, and the bottom type that admits nothing."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-05
updated:
aliases: []
---

Put these three on a lattice and only two of them fit. `unknown` sits at the top, above every type. `never` sits at the bottom, below every type. `any` is not on the diagram, because it is not a position in the ordering. It is a hole in the ordering.

> [!note] The idea
> `unknown` and `never` are duals, and the handbook says so outright: "unknown and never are like inverses of each other." Everything is assignable to `unknown` and nothing is assignable to `never`; `unknown` is assignable to nothing except `any`, while "never is assignable to everything." `any` breaks the symmetry because it is assignable in both directions at once, which is precisely what a top type and a bottom type each refuse to do. Treating `any` as "the type I use when I do not know" mislabels the tool: it is not a description of a value, it is an instruction to stop checking.

## any: the switch, not the type

The handbook introduces `any` as a type "that you can use whenever you don't want a particular value to cause typechecking errors," and then lists what it permits on a value: you can access any property of it, which will in turn be of type `any`, "call it like a function, assign it to (or from) a value of any type, or pretty much anything else that's syntactically legal."

Read the middle clause again. Property access on an `any` yields another `any`. That is the whole problem in one clause. `any` is not confined to the expression you wrote it on; it flows outward through every access, every call result, and every assignment, and each hop looks like ordinary well-typed code. A single annotation at the edge of a module can quietly untype an entire call chain, and nothing in the build output will mention it.

There is also the version you did not write. "When you don't specify a type, and TypeScript can't infer it from context, the compiler will typically default to" `any`. The handbook is direct about the consequence: "You usually want to avoid this, though, because any isn't type-checked. Use the compiler flag noImplicitAny to flag any implicit any as an error." Implicit `any` is the same hole arrived at by omission rather than intent, which is worse, because nobody chose it and nobody will find it by grepping.

Formally, `any` is what separates the two compatibility relations. Assignment compatibility is subtype compatibility plus the rules that permit assignment to and from `any` in both directions. So `any` is not an unusually permissive type; it is the clause in the assignability rules that says stop asking.

## unknown: the honest top

TypeScript 3.0 filled the gap with a new top type, `unknown`, which the release notes describe as one that "is the type-safe counterpart of" `any`. The rule that makes it useful is one-directional. Anything is assignable to it, "but unknown isn't assignable to anything but itself and any without a type assertion or a control flow based narrowing. Likewise, no operations are permitted on an unknown without first asserting or narrowing to a more specific type."

That is the correct shape for a value from outside the program. Anything can go in, which is what "I received something" means, and nothing comes out until you prove what it is, which is what a check is for. Where `any` says the compiler should assume you were right, `unknown` says the compiler will wait. The proof obligation is discharged by ordinary narrowing, so `unknown` composes with `typeof`, `instanceof`, and [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|user-defined type guards]] rather than requiring anything new.

Its algebraic behavior confirms the position. The release notes annotate the two tables directly: "In a union an unknown absorbs everything," so `unknown | string` is `unknown`, and "In an intersection everything absorbs unknown," so `unknown & string` is `string`. That is exactly how a [[cs/math/set-theory-basics|universal set]] behaves under union and intersection, which is a decent way to remember which direction each operator moves.

## never: the type with no values

`never` is the empty set. Nothing inhabits it, so nothing is assignable to it, while it is assignable to everything, vacuously, because there is no value that could violate the claim. The consequence for functions follows without any extra rule: if a function is annotated to return a value of an uninhabited type, it cannot return normally at all, which is why a function that throws or loops forever ends up with this type.

Its usefulness is entirely in what its appearance tells you. A narrowing that reduces a union to `never` means every possibility has been eliminated, which is what makes it the mechanism behind [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|exhaustiveness checking]]. A property that comes out as `never` means the type you built has no inhabitants, which is what an intersection of incompatible object types produces. In both cases `never` is a diagnosis. It is the checker telling you it has proved a set empty, and the only question worth asking is whether you meant it to be.

## The boundary problem

Every program has a perimeter: a parsed response body, a message off a socket, a value read from `localStorage`, a field from a config file. On the outside there is no type information, and on the inside there has to be one. What you write at that seam decides what the rest of the type system is worth.

Annotate the perimeter as `any` and the assurance evaporates, silently and transitively. The compiler will happily let a number-shaped hole flow into a function expecting a string, into a template, into a query. This is the same category of failure as [[cs/security/insecure-deserialization|trusting the shape of deserialized input]]: the danger is not that the data is wrong, it is that a component downstream was written under a guarantee that no longer holds, and no tool reports the moment the guarantee was dropped. A type assertion is worth the same as `any` here, since asserting `as User` on a parsed body performs no check either.

Annotate it as `unknown` and the compiler forces the validation to exist. It will not let a single field be read until something narrows the value, which turns a diffuse question about discipline into a concrete list of places the checker refuses to compile. That is the practical argument for `unknown` over `any` at every I/O boundary. The same argument applies to a caught exception, which is a value arriving from outside the current function with no declared shape and every reason to be narrowed before it is read.

> [!tip] The one-line test
> Ask which direction the assignment needs to go. Data coming in, where you must prove something before use: `unknown`. A branch that must be impossible: `never`. Neither of those describes what you want: you probably want a real type, and reaching for `any` is a decision to stop being checked, which is worth making on purpose or not at all.

## Related Notes

- [[cs/languages/TypeScript/structural-typing-and-assignability|Structural Typing and Assignability]] - the two compatibility relations, and how `any` is the difference between them
- [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|Discriminated Unions and Exhaustiveness]] - the pattern that turns `never` from a curiosity into a maintenance tool
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - what an unchecked assumption about the shape of external data costs
- [[cs/math/set-theory-basics|Set Theory Basics]] - universal and empty sets, and why they behave inversely under union and intersection
- [[cs/languages/Go/the-empty-interface-any-and-type-assertions|The Empty Interface, any, and Type Assertions]] - a different language solving the same problem with a checked assertion instead of a flag
- [[cs/languages/TypeScript/union-and-intersection-types|Union and Intersection Types]] - where a `never`-typed property comes from in the first place

## Sources

- TypeScript Handbook, "Everyday Types." https://www.typescriptlang.org/docs/handbook/2/everyday-types.html . Supports the description of `any` as a way to avoid typechecking errors, the list of operations it permits including property access yielding `any`, the default to `any` when inference fails, and the `noImplicitAny` flag.
- TypeScript 3.0 release notes, "New unknown top type." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html . Supports `unknown` as a top type introduced in 3.0, its one-directional assignability, the requirement to assert or narrow before any operation, and its absorbing behavior in unions and intersections.
- TypeScript Handbook, "Type Compatibility." https://www.typescriptlang.org/docs/handbook/type-compatibility.html . Supports the inverse relationship between `unknown` and `never`, and the role of `any` in extending subtype compatibility into assignment compatibility.
