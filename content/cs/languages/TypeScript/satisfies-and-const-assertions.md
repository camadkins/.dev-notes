---
title: "satisfies and const Assertions"
description: "Two operators that separate checking a value against a type from adopting that type, and what as const actually stops."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases:
  - The satisfies Operator
  - as const in TypeScript
---

An annotation does two jobs at once and most of the time you only wanted one of them. Writing `const palette: Record<Colors, string | RGB> = { ... }` checks the object against the type, which is what you asked for, and it also declares that the variable has that type, which throws away everything specific the compiler had worked out about the literal you just wrote.

The release notes state the problem exactly: "TypeScript developers are often faced with a dilemma: we want to ensure that some expression matches some type, but also want to keep the most specific type of that expression for inference purposes."

> [!note] The idea
> Checking and declaring are separate operations that annotation syntax happens to bundle. `satisfies` performs the check and discards the declaration; `as const` suppresses the widening that inference performs by default. Both are ways of telling the compiler to keep what it already knew, and neither leaves anything behind at runtime, which is why `as const` freezes a type and freezes nothing else.

## The cost of an annotation

Take an object whose values are deliberately heterogeneous:

```ts
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  bleu: [0, 0, 255],
};
```

There is a typo. Without an annotation nothing catches it, and `palette.green.toUpperCase()` works because inference knows `green` is a string. Add the annotation and the typo is caught, but now every property has the declared value type, so `palette.green` might be a tuple and the string method is an error. "We could try to catch that bleu typo by using a type annotation on" `palette`, "but we'd lose the information about each property."

That is not a wart in the annotation; it is what an annotation means. Declaring a type is a promise to treat the value as nothing more than that type from here on, and [[cs/languages/TypeScript/contextual-typing-and-inference|inference]] cheerfully surrenders the finer result it had computed.

## satisfies checks and steps back

TypeScript 4.9 added an operator for the other half. "The new satisfies operator lets us validate that the type of an expression matches some type, without changing the resulting type of that expression."

```ts
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  bleu: [0, 0, 255],
} satisfies Record<Colors, string | RGB>;
```

The typo is an error, and `palette.green.toUpperCase()` still compiles, because the inferred type survived the check. The constraint is applied as a test rather than adopted as a description.

The interesting uses go past validation. Check against `Record<Colors, unknown>` and you get exactly-the-right-keys checking: "we could ensure that an object has all the keys of some type, but no more," so an extra `"platypus"` key is an error while each property keeps its own precise type, and `favoriteColors.green` is still known to be `false` rather than `unknown`. Go the other way with `Record<string, string | RGB>` when "maybe we don't care about if the property names match up somehow, but we do care about the types of each property."

This is why `satisfies` reads so well on configuration and route tables and design tokens, the places where an object is simultaneously a value people index into and a contract something else consumes. The [[cs/software-engineering/api-design|contract]] gets enforced without flattening the value into it.

## const assertions and what widening is

The other half of keeping specific types is stopping the compiler from generalizing them in the first place. By default `let x = "hello"` infers `string`, not `"hello"`, because a mutable binding is expected to hold other strings later. That generalization is widening, and it is usually right and occasionally ruinous.

"TypeScript 3.4 introduces a new construct for literal values called const assertions. Its syntax is a type assertion with const in place of the type name (e.g. 123 as" `const`). It does three things. First, "no literal types in that expression should be widened (e.g. no going from" `"hello"` to `string`). Second, "object literals get readonly properties." Third, "array literals become readonly tuples."

The result is that a whole nested literal keeps its exact shape from one annotation. `[10, 20] as const` is `readonly [10, 20]`, a two-element tuple of two specific numbers, not `number[]`. A shape array written with `as const` narrows correctly in a `switch` with no annotations anywhere, because "the const assertion allowed TypeScript to take the most specific type of the expression." Pair that with [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|typeof and keyof]] and a plain JavaScript object becomes the single source of both the runtime values and the union of their types.

## What it does not freeze

The word `const` invites a misreading and the notes correct it directly. "Another thing to keep in mind is that const contexts don't immediately convert an expression to be fully immutable."

```ts
let arr = [1, 2, 3, 4];
let foo = { name: "foo", contents: arr } as const;

foo.name = "bar";      // error
foo.contents = [];     // error
foo.contents.push(5);  // works
```

Two separate limits are visible there. The assertion is shallow with respect to values that came from elsewhere: `contents` is the same array object as `arr`, and `arr` was never in a const context, so pushing to it is fine. And `readonly` is a statement the [[cs/pl/mutable-state-references-effects|type checker enforces about references]], not a property of the object. Nothing is frozen at runtime, no `Object.freeze` is emitted, and any code that reaches the same object without going through the readonly view mutates it freely.

> [!warning] It only attaches to literals
> "One thing to note is that const assertions can only be applied immediately on simple literal expressions." `(60 * 60 * 1000) as const` is an error; `3_600_000 as const` is fine, and `Math.random() < 0.5 ? (0 as const) : (1 as const)` works because each assertion sits on a literal. The operator annotates a written-down value, not a computed one.

## Choosing between them

They answer different questions and compose. `as const` is about how precisely a value should be read; `satisfies` is about what a value must conform to. A tokens object often wants both: `as const` so each entry keeps its literal type, `satisfies` so a missing key is caught the day the design system adds one. What neither does is [[cs/pl/language-design-values-variables-environments|change what the binding holds]] at runtime, since both erase completely, which is the same bargain every other type-level feature in this language makes.

## Related Notes

- [[cs/languages/TypeScript/contextual-typing-and-inference|Contextual Typing and Inference]] - where widening happens and why the default is usually the one you want
- [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|keyof, typeof, and Indexed Access]] - the operators that turn an `as const` object into a type
- [[cs/pl/mutable-state-references-effects|Mutable State, References & Effects]] - why a readonly view of a shared object is not immutability
- [[cs/software-engineering/api-design|API Design]] - configuration objects that are both a value and a contract, which is the case `satisfies` was built for
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - a language where the restriction on a reference is enforced rather than erased
- [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|Erasure at Runtime and Type Guards]] - the reason neither operator can freeze anything

## Sources

- TypeScript 4.9 release notes, "The satisfies Operator." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html . Supports the stated dilemma, the loss of per-property information under an annotation, the definition of `satisfies` as validation without changing the resulting type, the exact-keys use with `Record<Colors, unknown>`, and the value-only use with `Record<string, string | RGB>`.
- TypeScript 3.4 release notes, "const assertions." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html . Supports the introduction and syntax of const assertions, the three effects on widening, object properties, and array literals, the most-specific-type result, the literal-expressions-only caveat, and the shallow, non-immutable nature of a const context.
