---
title: "infer and Type-Level Pattern Matching"
description: "infer is destructuring for types: a binding introduced inside a pattern, scoped to the branch that matched. Repeat the name and the compiler unifies the candidates."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-01
updated:
aliases: []
---

Here is the same type written twice. The first version knows how to reach into an array type. The second version does not, and is better.

```ts
type Flatten<Type> = Type extends any[] ? Type[number] : Type;
type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;
```

The handbook explains the difference in terms of who does the work: "we used the infer keyword to declaratively introduce a new generic type variable named Item instead of specifying how to retrieve the element type of Type within the true branch. This frees us from having to think about how to dig through and probing apart the structure of the types we're interested in."

> [!note] The idea
> `infer` turns the left side of a conditional from a test into a pattern with holes, and the true branch into the body where those holes are bound. That is destructuring, one level up from values. The part with no equivalent in value-level destructuring is what happens when you use the same hole twice: instead of an error or a last-write-wins, the compiler collects every candidate and combines them, taking a union when the positions were covariant and an intersection when they were contravariant. Type-level pattern matching is unification wearing a ternary.

## Where the binding lives

The scope rules are small and worth memorizing, because most `infer` mistakes are scope mistakes. "Within the extends clause of a conditional type, it is now possible to have infer declarations that introduce a type variable to be inferred. Such inferred type variables may be referenced in the true branch of the conditional type. It is possible to have multiple infer locations for the same type variable."

Three facts in three sentences. The declaration site is the `extends` clause of [[cs/languages/TypeScript/conditional-types|a conditional type]] and nowhere else. The use site is the true branch and nowhere else, which is the same restriction that governs narrowing generally: the false branch is the branch where the pattern did not match, so there is nothing to name. And the same variable may appear in several places in one pattern.

There is one prohibition on the declaration site: "It is not possible to use infer declarations in constraint clauses". A constraint has to be checkable before any argument arrives, and a pattern with an unbound hole is not.

## Repeating a hole

This is the behavior that separates `infer` from ordinary destructuring, and the 2.8 notes give both directions with worked results.

```ts
type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;
type T10 = Foo<{ a: string; b: string }>; // string
type T11 = Foo<{ a: string; b: number }>; // string | number
```

"The following example demonstrates how multiple candidates for the same type variable in co-variant positions causes a union type to be inferred." Flip the positions and the combining operation flips too:

```ts
type Bar<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void } ? U : never;
type T21 = Bar<{ a: (x: string) => void; b: (x: number) => void }>; // string & number
```

"Likewise, multiple candidates for the same type variable in contra-variant positions causes an intersection type to be inferred."

The choice of operator is not arbitrary. A value read out of two places has to be usable as either, so the union is the safe answer. A value written into two places has to satisfy both, so the intersection is. The same reasoning that decides variance decides which way the candidates merge, and the fact that a candidate list is being resolved at all is the family resemblance to [[cs/pl/hindleymilner-type-inference|unification-based inference]]. TypeScript is not solving a global constraint system, but inside one pattern it is doing the same job: reconciling several observations of one variable into a single type.

The 2.8 notes also state the algorithm the conditional uses to collect these candidates: "for each type variable introduced by an infer (more later) declaration within U collect a set of candidate types by inferring from T to U (using the same inference algorithm as type inference for generic functions)". The same machinery that infers a type argument at a call site is being pointed at a pattern.

## The standard extractions

Almost every utility type in the standard library is one conditional and one `infer`. The return type extractor is the canonical example:

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

Chaining them gives a sequential match. `Unpacked` peels one layer from an array, a function, or a promise, in order, and the notes give the results: `Unpacked<Promise<string[]>>` is `Promise<string>` after one pass and `string` after two. One `infer` removes one constructor, which is why the deeply recursive versions in the standard library have to call themselves.

> [!warning] Overloads collapse to the last signature
> Pattern matching against a function type with more than one call signature does not consider all of them. "When inferring from a type with multiple call signatures (such as the type of an overloaded function), inferences are made from the last signature (which, presumably, is the most permissive catch-all case). It is not possible to perform overload resolution based on a list of argument types." An overloaded `stringOrNum` declared with `string`, then `number`, then the catch-all yields `string | number` from `ReturnType`, not the specific overload you had in mind. Library authors order their overloads narrowest first for call resolution, which puts the least useful signature exactly where the type-level extraction will read it.

## Matching strings

Once [[cs/languages/TypeScript/template-literal-types|template literal types]] arrived, the same keyword started matching string shapes, and the pattern vocabulary got a lot larger. The 4.5 release notes use the trimming case: "the following TrimLeft type removes spaces from the beginning of a string-like type. If given a string type that has a space at the beginning, it immediately feeds the remainder of the string back into TrimLeft ."

```ts
type TrimLeft<T extends string> = T extends ` ${infer Rest}` ? TrimLeft<Rest> : T;
```

The pattern is a literal space followed by a hole. Match, bind the tail, recurse. Written at the value level in any language with pattern matching, this is the first exercise in the chapter. [[cs/pl/records-variants-and-pattern-matching|Structural pattern matching over variants]] is the general form, and [[cs/languages/Racket/structs-and-pattern-matching|Racket's match]] is the version where the patterns and the bindings are ordinary syntax rather than a keyword smuggled into a ternary.

What that comparison makes visible is the cost of the smuggling. There is no arm list, no compiler-checked exhaustiveness, and no way to bind a hole outside the branch that matched it. What there is instead is a pattern language that runs at compile time over the shapes of a codebase, which no value-level matcher can reach.

## Related Notes

- [[cs/languages/TypeScript/conditional-types|Conditional Types]] - the only place an infer declaration is allowed to appear
- [[cs/languages/TypeScript/template-literal-types|Template Literal Types]] - the pattern vocabulary that turned infer into a string parser
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - destructuring with bindings, at the level where it was invented
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner & Type Inference]] - reconciling several observations of one variable, which is what repeated infer does
- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching in Racket]] - the same idea with arms, guards, and no ternary
- [[cs/languages/TypeScript/type-level-computation-and-its-limits|Type-Level Computation and Its Limits]] - where recursive extraction runs out of budget

## Sources

- TypeScript Handbook, "Conditional Types." https://www.typescriptlang.org/docs/handbook/2/conditional-types.html . Supports the two Flatten formulations, the declarative introduction of a type variable with infer, and the overloaded call signature rule.
- TypeScript 2.8 release notes, "Conditional Types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html . Supports the declaration and reference scope of infer, multiple infer locations for one variable, the prohibition in constraint clauses, the union result for covariant candidates, the intersection result for contravariant candidates, the candidate collection algorithm, the ReturnType definition, and the Unpacked chain and its results.
- TypeScript 4.5 release notes, "Tail-Recursion Elimination on Conditional Types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html . Supports the TrimLeft example and its description as removing leading spaces by feeding the remainder back into itself.
