---
title: "Distributive Conditional Types"
description: "Whether a conditional type maps over a union or tests it whole is decided by the syntax of the check, not by the types involved. Two square brackets flip it."
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

Read this and predict the answer:

```ts
type ToArray<Type> = Type extends any ? Type[] : never;
type StrArrOrNumArr = ToArray<string | number>;
```

The condition is `extends any`, which every type satisfies, so the false branch is unreachable and the type looks like an identity wrapper. The result is `string[] | number[]`, not `(string | number)[]`.

Nothing about the union caused that. The shape of the expression did.

> [!note] The idea
> Distribution is triggered syntactically, by the checked type being a bare type parameter with nothing wrapped around it, and it happens at instantiation rather than at declaration. That makes it one of the few places in TypeScript where the meaning of an expression depends on how it is written rather than on what the types are, and it is why the standard suppression trick is a pair of square brackets that change nothing semantically except the nakedness of the operand.

## The rule

The 2.8 release notes name the condition exactly. "Conditional types in which the checked type is a naked type parameter are called distributive conditional types . Distributive conditional types are automatically distributed over union types during instantiation."

The rewrite is mechanical: "an instantiation of T extends U ? X : Y with the type argument A | B | C for T is resolved as (A extends U ? X : Y) | (B extends U ? X : Y) | (C extends U ? X : Y)". The handbook walks the same expansion for `ToArray`, from `ToArray<string> | ToArray<number>` to `string[] | number[]`.

Two words in that definition carry the weight. *Naked* means the type parameter appears alone on the left of `extends`, not inside an array, a tuple, an object type, or a function type. *Instantiation* means the distribution is a consequence of the deferral rule from [[cs/languages/TypeScript/conditional-types|the base conditional]]: a conditional over an unbound parameter is suspended, and the union is unrolled at the moment the argument arrives.

Inside the branches, the parameter no longer means the union. "In instantiations of a distributive conditional type T extends U ? X : Y , references to T within the conditional type are resolved to individual constituents of the union type (i.e. T refers to the individual constituents after the conditional type is distributed over the union type)." That is why `Type[]` in the true branch produced two separate array types instead of one array of the union. Each `Type` was a different type by then.

The behavior is worth naming honestly for what it is: mapping a function over the members of a set and collecting the results. [[cs/math/set-theory-basics|Union types are sets of values]], the conditional is the function, and the result is the image. The unusual part is that TypeScript decides whether to map over the set or apply the function to the set as a whole based on a syntactic cue.

## What it buys

Filtering a union is the payoff, and the notes present it as such: "The distributive property of conditional types can conveniently be used to filter union types."

```ts
type Diff<T, U> = T extends U ? never : T;
type Filter<T, U> = T extends U ? T : never;

type T30 = Diff<"a" | "b" | "c" | "d", "a" | "c" | "f">; // "b" | "d"
type T31 = Filter<"a" | "b" | "c" | "d", "a" | "c" | "f">; // "a" | "c"
```

Every member is tested independently, the rejected ones are mapped to `never`, and the surviving ones are collected back into a union. Those two helpers shipped in the standard library as `Exclude` and `Extract`, and one more was defined on top of them in the same release: "type NonNullable T = Diff T , null | undefined ; // Remove null and undefined from T".

This is set subtraction implemented with a ternary, and it works only because of distribution. Without it, `"a" | "b" | "c" | "d" extends "a" | "c" | "f"` is a single false test and `Diff` would return the whole union unchanged.

> [!example] Selecting keys by the type of their value
> Combine distribution with a mapped type and the pattern generalizes from filtering unions to filtering object types. The 2.8 notes give it directly:
>
> ```ts
> type FunctionPropertyNames<T> = {
>   [K in keyof T]: T[K] extends Function ? K : never;
> }[keyof T];
> type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
> ```
>
> The mapped type replaces each property's value with either its own key or `never`, and the trailing `[keyof T]` indexes the result with every key at once, producing the union of what is left. For an interface with `id`, `name`, `subparts`, and `updatePart`, the notes report `FunctionPropertyNames` as `"updatePart"` and its complement as `"id" | "name" | "subparts"`. Two features that look unrelated compose into a query language over shapes, and [[cs/languages/TypeScript/mapped-types|the mapped type]] is doing the iteration while the conditional does the predicate.

## Turning it off

"Typically, distributivity is the desired behavior. To avoid that behavior, you can surround each side of the extends keyword with square brackets."

```ts
type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never;
type ArrOfStrOrNum = ToArrayNonDist<string | number>; // (string | number)[]
```

The mechanism is worth stating plainly because the trick is usually taught as a magic incantation. `[Type]` is a one-element tuple type. The checked type is now a tuple, not a bare parameter, so it fails the naked-parameter test, so no distribution happens, so the assignability check runs once against `[any]` with the full union inside. The brackets on the right side are there to keep the comparison meaningful, since a tuple has to be compared against a tuple.

Once the shape is understood the idiom generalizes. Any wrapper suppresses distribution, and the tuple is chosen because it adds the least meaning of the available wrappers.

The practical rule that follows: write the naked form when you want a per-member transformation, and the bracketed form when you are asking a yes-or-no question about the union as a whole. Confusing the two is the source of the standard puzzle in which a check for `never` never fires, because distributing over a union with no members produces no branches to collect.

Sum types in a language with [[cs/pl/records-variants-and-pattern-matching|real variants]] make this distinction at the pattern level instead, one arm per constructor, decided by the author rather than inferred from syntax. [[cs/languages/Rust/pattern-matching-and-enums|Rust's match]] over an enum is the same computation with the exhaustiveness obligation made explicit, and no way to accidentally test the whole enum at once.

## Related Notes

- [[cs/languages/TypeScript/conditional-types|Conditional Types]] - the deferral rule that distribution rides on
- [[cs/languages/TypeScript/mapped-types|Mapped Types]] - the iteration half of the key-filtering pattern
- [[cs/math/set-theory-basics|Set Theory Basics]] - unions as sets, and what mapping a function over one means
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the same case analysis, decided by the author instead of by syntax
- [[cs/languages/Rust/pattern-matching-and-enums|Pattern Matching and Enums in Rust]] - per-constructor dispatch with an exhaustiveness check
- [[cs/languages/TypeScript/infer-and-type-level-pattern-matching|infer and Type-Level Pattern Matching]] - what the individual branch can extract once it has one member

## Sources

- TypeScript 2.8 release notes, "Conditional Types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html . Supports the naked type parameter definition, automatic distribution during instantiation, the formal rewrite over a three-member union, the resolution of the parameter to individual constituents, the union filtering idiom with Diff and Filter, the NonNullable definition, and the FunctionPropertyNames example with its results.
- TypeScript Handbook, "Conditional Types." https://www.typescriptlang.org/docs/handbook/2/conditional-types.html . Supports the ToArray example and its expansion, the statement that distributivity is typically desired, and the square bracket suppression with the ToArrayNonDist result.
