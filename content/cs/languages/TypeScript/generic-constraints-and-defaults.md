---
title: "Generic Constraints and Defaults"
description: "A constraint is a shape test that pays out twice: it narrows what callers may pass and widens what the body may do. A default is a separate mechanism that is easy to confuse with it."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-14
updated:
aliases: []
---

The error that motivates the whole feature is this one:

```ts
function loggingIdentity<Type>(arg: Type): Type {
  console.log(arg.length);
  // Property 'length' does not exist on type 'Type'.
  return arg;
}
```

An unconstrained type parameter is a value about which nothing is known. The handbook says exactly that: "the compiler could not prove that every type had a .length property, so it warns us that we can't make this assumption." Adding `Type extends Lengthwise` fixes it, and the fix is worth reading in both directions at once.

> [!note] The idea
> A constraint is one clause that pays out on both sides of the function boundary. Callers lose freedom, because the set of admissible arguments shrinks. The body gains it, because inside the declaration the compiler now knows something. Those two effects are the same fact stated from opposite sides, which is why a constraint can never be added purely as documentation. Defaults look like they belong to the same feature and do a different job entirely: a default supplies a type argument that was never written, and it never tells the body anything.

## The shape test

The mechanism is unremarkable syntax over a structural check. "Instead of working with any and all types, we'd like to constrain this function to work with any and all types that also have the .length property. As long as the type has this member, we'll allow it, but it's required to have at least this member."

```ts
interface Lengthwise {
  length: number;
}
function loggingIdentity<Type extends Lengthwise>(arg: Type): Type {
  console.log(arg.length);
  return arg;
}
```

Because assignability here is by shape, the interface named in the constraint is a description rather than a club to join. An object literal with a `length` number satisfies it without ever mentioning `Lengthwise`, which puts TypeScript in the same family as [[cs/languages/Go/constraint-interfaces-and-type-sets|Go's constraint interfaces]] and a long way from [[cs/languages/Java/bounded-type-parameters|a bound in Java]], where the argument type has to have declared the relationship in its own source.

The handbook elsewhere offers the frame that makes the rest of this folder legible: "Going back to the idea of types as sets". A constraint is a predicate that carves a subset out of the space of all types, and the generic declaration is quantified over that subset. Nothing about that framing is metaphorical, and [[cs/math/set-theory-basics|the usual set vocabulary]] transfers cleanly: the union `string | number` really is a union, `never` really is the empty set, and a constraint that admits nothing produces a function nobody can call.

What it is not is a [[cs/pl/type-classes-and-traits|type class]]. A Haskell constraint or a Rust trait bound names a dictionary of operations that gets resolved and, at least conceptually, passed alongside the value. A TypeScript constraint resolves to nothing at all, because the whole type layer is erased before the code runs. The body learns what it may write; the emitted JavaScript learns nothing.

## Constraints that mention other parameters

The second form is where constraints stop being membership tests and start being computations. "You can declare a type parameter that is constrained by another type parameter."

```ts
function getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {
  return obj[key];
}
let x = { a: 1, b: 2, c: 3, d: 4 };
getProperty(x, "a");
getProperty(x, "m");
// Argument of type '"m"' is not assignable to parameter of type '"a" | "b" | "c" | "d"'.
```

The constraint on `Key` is not a fixed set. It is derived from whatever `Type` turned out to be, using [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|the keyof operator]], and the error message shows the union the compiler computed for this particular call. Two type parameters resolved in order, the second constrained by the first, is the smallest possible example of the type level doing work rather than just recording an annotation. Everything in this folder past this point is that idea scaled up.

The order matters and is directional: a constraint may refer to type parameters declared to its left. The dependency graph has to bottom out somewhere.

## Defaults are a different mechanism

TypeScript 2.3 added default type arguments to collapse overload stacks. The release notes give the before, three overloads to cover the optional cases, and the after:

```ts
declare function create<T extends HTMLElement = HTMLDivElement, U = T[]>(
  element?: T,
  children?: U
): Container<T, U>;
```

Four rules govern them, and they read like the rules for optional value parameters because they are the same rules one level up. "A type parameter is deemed optional if it has a default." "Required type parameters must not follow optional type parameters." "Default types for a type parameter must satisfy the constraint for the type parameter, if it exists." And "When specifying type arguments, you are only required to specify type arguments for the required type parameters. Unspecified type parameters will resolve to their default types."

The third rule is the one that keeps constraints and defaults from drifting apart: a default has to be a member of the set its own constraint carves out. The rules also allow a declaration merge to introduce a default for an existing type parameter, which is how library authors add a parameter to a published interface without breaking every consumer that wrote no type arguments at all.

> [!warning] A constraint is not a default
> `<T extends string>` does not mean "T is string unless told otherwise." Written alone, with nothing to infer from, `T` resolves to its constraint only in specific positions, and inside the body it stays an unknown subtype of `string`. That distinction bites in two familiar places. You cannot return an arbitrary `string` where `T` is expected, because the caller may have supplied the narrower `"a" | "b"`. And you cannot construct a `T` from nothing, for the same reason. If you want a fallback, write `<T extends string = string>` and say so.

The interaction with inference has one rule that is easy to miss and useful once known: "If a default type is specified and inference cannot choose a candidate, the default type is inferred." A default is the last resort in the inference algorithm rather than a value overwritten by it, so it fires exactly when the call site gave the compiler nothing to work from. That is the seam where constraints, defaults, and inference meet, and it is the reason a generic helper can be written to behave sensibly when called with no arguments at all.

## Related Notes

- [[cs/languages/TypeScript/generics-over-a-structural-type-system|Generics Over a Structural Type System]] - why the interface in a constraint is a description, not a membership card
- [[cs/languages/TypeScript/contextual-typing-and-inference|Contextual Typing and Inference]] - the algorithm a default is the last resort inside
- [[cs/pl/type-classes-and-traits|Type Classes & Traits]] - constraints that carry an implementation, for contrast with constraints that carry nothing
- [[cs/math/set-theory-basics|Set Theory Basics]] - the subset vocabulary that describes what a constraint actually does
- [[cs/languages/Go/constraint-interfaces-and-type-sets|Constraint Interfaces and Type Sets]] - the same structural idea with the set spelled out explicitly
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - a clause-based constraint language over a nominal system

## Sources

- TypeScript Handbook, "Generics." https://www.typescriptlang.org/docs/handbook/2/generics.html . Supports the missing .length error and its explanation, the Lengthwise constraint and its at-least-this-member rule, and constraining one type parameter by another with keyof.
- TypeScript 2.3 release notes. https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html . Supports the introduction of generic parameter defaults, the create example, the optionality rule, the ordering rule, the constraint satisfaction rule, the partial specification rule, and the fallback-on-failed-inference rule.
- TypeScript Handbook, "TypeScript for Java/C# Programmers." https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html . Supports the types-as-sets framing used to describe what a constraint selects.
