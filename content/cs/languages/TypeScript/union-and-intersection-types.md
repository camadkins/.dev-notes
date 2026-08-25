---
title: "Union and Intersection Types"
description: "Combining types by combining their value sets, and why the members you can reach move in the opposite direction from the values you are describing."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-02
updated:
aliases: []
---

Two ways to build a type out of other types, written with a vertical bar and an ampersand, and both of them are easier to reason about once you stop thinking about syntax and start thinking about which values each one admits.

"A union type is a type formed from two or more other types, representing values that may be any one of those types." A value of `string | number` is a value drawn from the string values together with the number values. An intersection goes the other way. "An intersection type combines multiple types into one. This allows you to add together existing types to get a single type that has all the features you need." A value of `Person & Serializable` is a value that belongs to both sets at once, which for object types means it carries the members of both.

> [!note] The idea
> Unions and intersections operate on sets of values, and the set of members you can safely touch runs backwards from that. Widening the value set narrows the usable interface and narrowing the value set widens it. This is why an intersection can name a set with nothing in it: nothing forces the two operands to overlap, and when they do not, TypeScript does not reject the type, it hands you a property typed `never` and lets the emptiness surface wherever you try to produce a value.

## The union is a sum, and the handbook says so

The operations a union permits are the ones every member permits. "TypeScript will only allow an operation if it is valid for every member of the union." Call `.toUpperCase()` on a `string | number` and the compiler stops you, because a number has no such method. Call `.slice(0, 3)` on a `number[] | string` and it is fine, since both arrays and strings have one.

The handbook is explicit that this seems inverted and explains why it is not. "It might be confusing that a union of types appears to have the intersection of those types' properties. This is not an accident - the name union comes from type theory." The union `number | string` is the union of the two value sets, and "notice that given two sets with corresponding facts about each set, only the intersection of those facts applies to the union of the sets themselves." More values, fewer guarantees. The [[cs/math/set-theory-basics|set-theoretic reading]] is not a metaphor imposed after the fact; it is the definition the naming came from.

What TypeScript unions do not have is a tag. In an ML-family language a sum type is a [[cs/pl/parametric-polymorphism-adts|tagged disjoint union]]: the constructor name travels with the value, so the language always knows which branch it is in. A TypeScript union is untagged, so recovering the branch is a runtime problem that the programmer solves with an ordinary JavaScript check, or by adding the tag by hand, which is what [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|discriminated unions]] amount to.

## The intersection is not a product

The symmetry breaks here, and it breaks in a way worth being precise about. A product type packages one value of each operand; a pair of a `string` and a `number` holds both, separately, and neither is a `string` or a `number` on its own. An intersection is not that. `string & number` does not pair a string with a number. It names the values that are simultaneously in both sets, and there are none.

For object types the same operation is much friendlier, and that is what it exists for. "TypeScript provides another construct called intersection types that is mainly used to combine existing object types." Structural typing does the work: an object carrying every member of `Colorful` and every member of `Circle` genuinely belongs to both types, so the intersection is inhabited and its member list is the union of the two member lists. Values narrow, members widen, exactly the mirror of the union case.

## Where it stops being inhabited

Nothing checks that two object types can coexist. Take two declarations that disagree about one property:

```ts
interface Person1 { name: string; }
interface Person2 { name: number; }
type Staff = Person1 & Person2;
```

"In the case of intersection types, properties with different types will be merged automatically. When the type is used later, TypeScript will expect the property to satisfy both types simultaneously, which may produce unexpected results." The property type becomes `string & number`, which no value satisfies. "In contrast, the following code will compile, but it results in a never type," and hovering `staffer.name` shows `name: never`.

Compare that to what happens with two `interface` declarations that share a name. Declaration merging tries to combine them, and "if the properties are not compatible (i.e., they have the same property name but different types), TypeScript will raise an error." Same conflict, two different verdicts: merging rejects it at the declaration, intersection accepts it and pushes the contradiction down into a property type.

> [!warning] An uninhabited type is not an error
> `Staff` above is a perfectly legal type. You can write it, alias it, and use it in a signature. What you cannot do is produce a value for it, and the failure shows up wherever you try, sometimes far from the declaration that caused it. A function returning `never` for a property is the type system reporting that this branch of your model has no members, and [[cs/languages/TypeScript/the-any-unknown-never-triangle|the bottom type]] is the only honest answer it can give.

This is why long chains of intersected configuration types are worth reading with suspicion. Every conflicting key silently degrades to `never` rather than announcing itself, and a `never`-typed property is assignable from nothing, so the error appears at the construction site rather than at the declaration where the mistake actually lives.

## The practical division

Reach for a union when a value is one of several shapes and you plan to distinguish them at runtime. Reach for an intersection when a value is one shape that happens to be described in several places, which is the mixin case: a base response type intersected with a payload type, a props type intersected with the standard HTML attributes. The handbook offers exactly that motivating example, separating consistent error handling into its own type that is merged with a per-response type.

The one habit worth building is to check inhabitance whenever you intersect two types you did not both write. Structural compatibility is not obligation, and the compiler will let two authors disagree in silence.

## Related Notes

- [[cs/math/set-theory-basics|Set Theory Basics]] - the union and intersection the handbook is naming, and where an empty intersection comes from
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]] - tagged sums and real products, the shapes TypeScript unions are and are not
- [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|Discriminated Unions and Exhaustiveness]] - adding by hand the tag a TypeScript union does not carry
- [[cs/languages/TypeScript/structural-typing-and-assignability|Structural Typing and Assignability]] - why an object with both member sets really does inhabit an intersection of object types
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - unions and intersections as least upper and greatest lower bounds in a subtyping lattice
- [[cs/languages/Rust/pattern-matching-and-enums|Pattern Matching and Enums in Rust]] - what a language looks like when the sum type carries its own tag

## Sources

- TypeScript Handbook, "Everyday Types." https://www.typescriptlang.org/docs/handbook/2/everyday-types.html . Supports the definition of a union type, the rule that only operations valid for every member are allowed, and the type-theoretic explanation of why a union of types exposes the intersection of their properties.
- TypeScript Handbook, "Object Types." https://www.typescriptlang.org/docs/handbook/2/objects.html . Supports intersection types as a construct for combining object types, automatic merging of conflicting properties, the resulting `never` property, and the contrasting error raised by incompatible declaration merging.
- TypeScript Handbook, "Unions and Intersection Types." https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html . Supports the description of an intersection as adding types together to get all their members, and the error-handling mixin as the motivating example.
