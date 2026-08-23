---
title: "Generics Over a Structural Type System"
description: "In a nominal language a type parameter names a promise. In TypeScript it is a hole in a shape, and every question about it is answered by comparing members."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-27
updated:
aliases:
  - TypeScript Generics
  - Structural Generics
---

Two classes, no relationship between them, and an assignment that compiles:

```ts
class Car {
  drive() {}
}
class Golfer {
  drive() {}
}
let w: Car = new Golfer();
```

The handbook is blunt about why. "Again, this isn't an error because the structures of these classes are the same." Nothing was declared, nothing was implemented, nothing inherited. The two shapes match, so the two types are interchangeable.

That single rule is the thing to hold onto before reading any TypeScript generic. A type parameter looks exactly like the one in Java or C#, and it does a different job, because the machinery that consumes it is different.

> [!note] The idea
> In a nominal system, `T` is a promise about identity: whatever you substitute must have *declared* that it belongs. In TypeScript, `T` is a hole punched in a shape, and after substitution the compiler throws away the fact that a generic was ever involved and compares the resulting members. So a type parameter here is not primarily a device for reusing a container. It is an input to a type-level computation whose output is then checked the same way a hand-written object literal would be. Every strange behavior downstream, from bivariance to why variance annotations were optional for a decade, falls out of that one substitution-then-compare model.

## The rule underneath

"Type compatibility in TypeScript is based on structural subtyping. Structural typing is a way of relating types based solely on their members. This is in contrast with nominal typing." The handbook gives the contrast directly: given an interface `Pet` with a `name` property and an unrelated class `Dog` with a `name` property, the assignment works, and "In nominally-typed languages like C# or Java, the equivalent code would be an error because the Dog class does not explicitly describe itself as being an implementer of the Pet interface."

The check itself is one-directional and shallow-sounding but recursive: "The basic rule for TypeScript's structural type system is that x is compatible with y if y has at least the same members as x." Extra members on the source are fine. "Only members of the target type ( Pet in this case) are considered when checking for compatibility. This comparison process proceeds recursively, exploring the type of each member and sub-member."

This is a deliberate accommodation of the language underneath, not an accident of implementation. "Because JavaScript widely uses anonymous objects like function expressions and object literals, it's much more natural to represent the kinds of relationships found in JavaScript libraries with a structural type system instead of a nominal one." The type system was retrofitted onto a decade of shipped JavaScript, and shipped JavaScript passes object literals around. A system that demanded declared implementations would have described almost none of it. What [[cs/pl/type-systems-goals-guarantees|a type system is trying to buy you]] was fixed here by what the runtime already looked like.

## What that does to a type parameter

The handbook introduces generics the way every language does, as "being able to create a component that can work over a variety of types rather than a single one." The constraint syntax also looks familiar:

```ts
interface Lengthwise {
  length: number;
}
function loggingIdentity<Type extends Lengthwise>(arg: Type): Type {
  console.log(arg.length);
  return arg;
}
```

The `extends` is where the difference bites. In Java, `<T extends Lengthwise>` admits exactly the types whose declarations name `Lengthwise` in an `implements` or `extends` clause. Here it admits anything shaped right, which is why `loggingIdentity({ length: 10, value: 3 })` type-checks against an interface that object literal has never heard of. The constraint is a membership test over shapes, not a lookup in a declared [[cs/pl/subtyping-variance-type-constraints|subtype hierarchy]].

The consequence that surprises people who arrive from a nominal language is that `Box<T>` has no identity of its own. Two generic types declared separately, instantiated with anything, are related if and only if their expansions are related. There is no branded `Box` to disagree about. This is also why the ubiquitous "nominal typing in TypeScript" recipes all work by smuggling a structurally unique member into the shape, usually an unused private field or a phantom property. They are not turning nominal typing on. They are making two structures genuinely different so the structural check separates them.

## Erased, and for a different reason

TypeScript compiles away every type, so a generic leaves nothing behind. "TypeScript's type system is also not reified: There's nothing at runtime that will tell us that obj is Pointlike . In fact, the Pointlike type is not present in any form at runtime." For generics specifically: "Because TypeScript's type system is fully erased, information about e.g. the instantiation of a generic type parameter is not available at runtime."

That sentence describes the same observable outcome as [[cs/languages/Java/generics-and-type-erasure|erasure in Java]] and arrives from the opposite direction. Java erased type arguments to keep already-compiled class files linking against newly generic libraries, which is why the erased form still carries a real class with a real name and why `instanceof` works on the raw type. TypeScript has no such obligation and no such artifact, because the output is JavaScript and JavaScript has never had a type to erase. Java gave something up. TypeScript never had it. [[cs/languages/CSharp/reified-generics-in-the-clr|The CLR took the third road]] and kept the type arguments alive at runtime, which is available only to a language that owns its own runtime.

## The soundness bill

A structural system that has to describe real JavaScript ends up accepting programs it cannot prove safe, and the handbook says so on the record: "TypeScript's type system allows certain operations that can't be known at compile-time to be safe. When a type system has this property, it is said to not be 'sound'. The places where TypeScript allows unsound behavior were carefully considered."

The clearest case sits right where generics live, in function types. "When comparing the types of function parameters, assignment succeeds if either the source parameter is assignable to the target parameter, or vice versa. This is unsound because a caller might end up being given a function that takes a more specialized type, but invokes the function with a less specialized type." The justification is empirical rather than theoretical: "In practice, this sort of error is rare, and allowing this enables many common JavaScript patterns." The `strictFunctionTypes` flag turns the check back on for function-type positions, and the escape hatch that remains, method parameters staying bivariant, exists because the DOM and the standard library are written that way.

Hold that model steady, and the rest of this folder reads as one idea taken seriously. If a type parameter is an input to a computation over shapes, then the natural next questions are what you may compute with it, and how far the computation can go.

## Related Notes

- [[cs/languages/TypeScript/generic-constraints-and-defaults|Generic Constraints and Defaults]] - what `extends` admits once membership is by shape
- [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|keyof, typeof, and Indexed Access]] - the operators that turn a shape into a computable key set
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what a checker is trading away when it accepts unsound rules on purpose
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - erasure as a compatibility bargain, against erasure by construction
- [[cs/languages/Go/interfaces-and-implicit-satisfaction|Interfaces and Implicit Satisfaction]] - the other mainstream language that relates types by shape, and where it stops
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - the theory the structural check is an instance of

## Sources

- TypeScript Handbook, "Type Compatibility." https://www.typescriptlang.org/docs/handbook/type-compatibility.html . Supports the structural subtyping basis, the Pet and Dog nominal contrast, the at-least-the-same-members rule, the recursive comparison over members, the JavaScript motivation, the soundness disclaimer, and function parameter bivariance.
- TypeScript Handbook, "TypeScript for Java/C# Programmers." https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html . Supports the identical-structures Car and Golfer example, the non-reified type system, and the erasure of generic type parameter instantiations at runtime.
- TypeScript Handbook, "Generics." https://www.typescriptlang.org/docs/handbook/2/generics.html . Supports the definition of generics as components that work over a variety of types and the Lengthwise constraint example.
