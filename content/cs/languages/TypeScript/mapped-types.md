---
title: "Mapped Types"
description: "A mapped type is a fold from a union of keys into an object type, with independent control over the key set, the key names, the value types, and the modifiers."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-19
updated:
aliases:
  - TypeScript Mapped Types
  - Key Remapping
---

The syntax arrived by generalizing something that already existed. "Mapped types build on the syntax for index signatures, which are used to declare the types of properties which have not been declared ahead of time." An index signature says every key of some kind maps to some value type. A mapped type says the same thing about a specific, computed set of keys.

```ts
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
```

"In this example, OptionsFlags will take all the properties from the type Type and change their values to be a boolean."

> [!note] The idea
> Read the construct as four independent choices rather than one piece of syntax. Where the keys come from, what each key is renamed to, what each key maps to, and which modifiers are added or removed. Only the third is what people usually mean by "mapping." The first is the interesting one, because the key source is an ordinary union and has nothing to do with the object type being transformed, which makes a mapped type a fold from a set into a shape rather than a transformation of a shape into another shape.

## The source is a union, not an object

The handbook's definition puts the key set first: "A mapped type is a generic type which uses a union of PropertyKey s (frequently created via a keyof ) to iterate through keys to create a type."

"Frequently" is doing real work in that sentence. `keyof Type` is the common source because [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|keyof turns a shape into its key union]], but the construct never required a shape. It requires a union. The handbook makes the general case explicit, saying you can map over arbitrary unions, of any type at all, rather than only over unions of `string`, `number`, and `symbol`.

```ts
type EventConfig<Events extends { kind: string }> = {
  [E in Events as E["kind"]]: (event: E) => void;
};
```

Given a union of two event shapes, this produces an object with one handler per event kind, keyed by the string in each member's `kind` field. Nothing here started as an object type with keys to transform. A union of unrelated shapes went in, and a dictionary came out. That is a fold, and it is the reason mapped types keep showing up in library code that has no obvious "map one type to another" flavor.

## Renaming, filtering, and the key function

The `as` clause, available "In TypeScript 4.1 and onwards," inserts a computation between the iteration variable and the key it produces:

```ts
type MappedTypeWithNewProperties<Type> = {
  [Properties in keyof Type as NewKeyType]: Type[Properties];
};
```

Two idioms follow from it. The first builds new names, usually with [[cs/languages/TypeScript/template-literal-types|template literal types]]: a `Getters` mapped type turns `name: string` into `getName: () => string` by remapping the key to `` `get${Capitalize<string & Property>}` ``.

The second is the one worth pausing on. "You can filter out keys by producing never via a conditional type."

```ts
type RemoveKindField<Type> = {
  [Property in keyof Type as Exclude<Property, "kind">]: Type[Property];
};
```

Applied to a shape with `kind` and `radius`, this yields a shape with only `radius`. The key clause is a function from the source key set to the output key set, and mapping a key to `never` removes it. Seen that way, the whole feature is [[cs/math/functions-injective-surjective-bijective|a function between two finite sets]] with the usual questions attached. Is it total, or does it drop members by sending them to `never`? Is it injective, or do two source keys arrive at the same output name? Is it onto the keys you expected? Every mapped-type bug that produces a smaller object than intended is one of those three questions answered in a way the author did not notice.

## Modifiers, and the sign convention

"There are two additional modifiers which can be applied during mapping: readonly and ? which affect mutability and optionality respectively." The control over them is explicit and signed: "You can remove or add these modifiers by prefixing with - or + . If you don't add a prefix, then + is assumed."

```ts
type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};
type Concrete<Type> = {
  [Property in keyof Type]-?: Type[Property];
};
```

Those two are `Mutable` and `Required` from the standard library, minus the branding. `Partial` and `Readonly` are the same declarations with the signs flipped. Once the four knobs are visible, most of the standard utility types stop looking like built-ins and start looking like one-liners that happen to ship with the compiler.

The default `+` is a small but real design decision. It means the naive reading of `{ [K in keyof T]?: T[K] }` as "add optionality" is correct, and that removing a modifier is the marked case requiring a symbol. Modifier removal is rarer and more dangerous, so it costs a character.

> [!example] A predicate over the values
> Mapped types compose with [[cs/languages/TypeScript/conditional-types|conditional types]], and the handbook's closing example is a compliance query:
>
> ```ts
> type ExtractPII<Type> = {
>   [Property in keyof Type]: Type[Property] extends { pii: true } ? true : false;
> };
> ```
>
> Given a `DBFields` type where `name` carries `pii: true` and `id` does not, the result is `{ id: false; name: true }`. The iteration comes from the mapped type and the decision from the conditional, and the output is a boolean map over a schema that a developer can read at a glance in an editor. The 2.8 release notes push the same combination one step further, using a mapped type to build keys and then indexing the whole thing with `[keyof T]` to collapse it back into a union of the keys that survived.

## What it is closest to

A mapped type generates declarations from other declarations, which is what [[cs/pl/macros-and-metaprogramming|a macro system]] does, with two differences that matter. It runs in the type checker rather than in a syntax expander, so it cannot invent runtime code, only descriptions of it. And it is total over its input by construction: there is no way to write a mapped type that handles some keys and forgets others, because the iteration is the language's, not yours.

That is the trade the type level keeps making. Less power than a macro, and a guarantee that the transformation covers everything it was pointed at.

## Related Notes

- [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|keyof, typeof, and Indexed Access]] - where the key union usually comes from and how the value type is fetched
- [[cs/languages/TypeScript/template-literal-types|Template Literal Types]] - the string arithmetic that makes key remapping worth doing
- [[cs/languages/TypeScript/conditional-types|Conditional Types]] - the predicate half of the filtering idioms
- [[cs/math/functions-injective-surjective-bijective|Functions: Injective, Surjective, Bijective]] - the questions to ask about any key remapping clause
- [[cs/pl/macros-and-metaprogramming|Macros & Metaprogramming]] - generating declarations from declarations, with more power and fewer guarantees
- [[cs/languages/TypeScript/distributive-conditional-types|Distributive Conditional Types]] - how the mapped-then-indexed idiom collapses back to a union

## Sources

- TypeScript Handbook, "Mapped Types." https://www.typescriptlang.org/docs/handbook/2/mapped-types.html . Supports the index signature origin, the definition as an iteration over a union of property keys, the OptionsFlags example, the two mapping modifiers and the plus and minus prefix convention, the CreateMutable and Concrete examples, key remapping with as from TypeScript 4.1, the never-based key filtering, mapping over arbitrary unions with the EventConfig example, and the ExtractPII conditional example with its result.
- TypeScript 2.8 release notes, "Conditional Types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html . Supports the combination of a mapped type with a conditional and the indexed collapse back into a union of surviving keys.
- TypeScript Handbook, "Keyof Type Operator." https://www.typescriptlang.org/docs/handbook/2/keyof-types.html . Supports the claim that keyof produces the key union that mapped types iterate.
