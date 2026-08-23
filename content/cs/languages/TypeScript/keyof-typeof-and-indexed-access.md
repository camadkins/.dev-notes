---
title: "keyof, typeof, and Indexed Access"
description: "Three operators form the only bridge between the value world and the type world, and traffic runs one way. Everything computable at the type level starts from something someone wrote down."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-14
updated:
aliases:
  - TypeScript keyof
  - typeof Type Operator
  - Indexed Access Types
---

TypeScript keeps two namespaces, and the compiler will tell you so:

```ts
function f() {
  return { x: 10, y: 3 };
}
type P = ReturnType<f>;
// 'f' refers to a value, but is being used as a type here. Did you mean 'typeof f'?
```

"Remember that values and types aren't the same thing. To refer to the type that the value f has, we use typeof."

That error is the entry point to the three operators this note is about, because they are the machinery that moves between the two worlds.

> [!note] The idea
> `typeof` lifts a value into the type world. `keyof` turns a shape into the set of its keys. Indexed access turns a shape plus a key into the type at that position. Together they close a loop that lets the type level read a program's actual data, which is why so much TypeScript type code starts from a `const` object rather than from a hand-written type. What has no counterpart is the reverse direction. Nothing takes a type and produces a value, because there is no type left by the time values exist. The bridge is one way, and every clever type in a codebase is downstream of a value someone typed out.

## keyof: a shape becomes a set

"The keyof operator takes an object type and produces a string or numeric literal union of its keys." For `{ x: number; y: number }` the result is `"x" | "y"`.

The interesting case is what happens when the shape does not have specific keys. "If the type has a string or number index signature, keyof will return those types instead." A type indexed by `number` gives back `number`. A type indexed by `string` gives back `string | number`, and the reason is a runtime fact rather than a typing one: "this is because JavaScript object keys are always coerced to a string, so obj[0] is always the same as obj["0"]."

That is a small thing with a large moral. A type operator produced an answer shaped by property-access semantics in the language underneath. TypeScript's type level is not free to be tidy, because it is describing something that already exists.

Treating the result as [[cs/math/set-theory-basics|a set]] is not a metaphor here. `keyof T` is finite for a literal shape, unions and intersections behave like the set operations they are named after, and the empty case is a real type. The rest of the type level is operations over these sets, and [[cs/languages/TypeScript/mapped-types|mapped types]] exist to iterate them.

## typeof: a value becomes a type

"JavaScript already has a typeof operator you can use in an expression context," returning a string at runtime. "TypeScript adds a typeof operator you can use in a type context to refer to the type of a variable or property." Same word, different world, and the world is decided by position.

On a primitive it is close to useless: `let s = "hello"; let n: typeof s;` just gives `string`. The value is in combination, which is exactly what the handbook says: "This isn't very useful for basic types, but combined with other type operators, you can use typeof to conveniently express many patterns."

The restriction on it is a deliberate piece of language design. "TypeScript intentionally limits the sorts of expressions you can use typeof on. Specifically, it's only legal to use typeof on identifiers (i.e. variable names) or their properties. This helps avoid the confusing trap of writing code you think is executing, but isn't."

Read that as a statement about the boundary between the two namespaces. A type-context operator that accepted arbitrary expressions would read like a call, and the call would never happen. Restricting it to identifiers and their properties keeps the type language from looking like it runs. The [[cs/pl/language-design-values-variables-environments|separation between a name, the thing it binds, and the environment that resolves it]] is the general form of what these two namespaces are keeping apart.

## Indexed access: a shape plus a key becomes a type

"We can use an indexed access type to look up a specific property on another type."

```ts
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"]; // number
```

The index is itself a type, which is what makes the operator composable rather than a lookup convenience. "The indexing type is itself a type, so we can use unions, keyof , or other types entirely." Indexing by a union of keys gives a union of value types, and indexing by `keyof Person` gives every value type in the shape at once.

Two consequences follow that show up constantly in real code. Indexing an array type by `number` yields its element type. And combining that with `typeof` reads a type straight out of a literal:

```ts
const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];
type Person = (typeof MyArray)[number];
type Age = (typeof MyArray)[number]["age"];
```

All three operators appear in that last line. `typeof` crossed from the value world, `[number]` extracted the element, `["age"]` extracted the field. Nobody wrote a `Person` interface, and if a field is added to the literal the type follows it.

> [!warning] The index must be a type, not a value
> "You can only use types when indexing, meaning you can't use a const to make a variable reference." Writing `const key = "age"; type Age = Person[key];` fails with two errors at once, the second of which suggests `typeof key`. A type alias works where the const does not: `type key = "age"; type Age = Person[key];` is fine. The bracket is not the JavaScript bracket. It shares the notation and takes a different kind of argument, which is the same joke `typeof` plays and the reason both errors point back at the namespace split.

## One way only

Set the three side by side and the asymmetry stands out. Value to type is available and cheap. Type to key set is available. Shape and key to type is available. Type to value does not exist, and cannot, because the type world is gone before the value world runs.

This is where TypeScript and a reified language part company most clearly. [[cs/languages/Java/type-tokens-and-super-type-tokens|Java's type tokens]] exist because a Java programmer occasionally needs a type at runtime and erasure took it away, so the idiom smuggles a `Class` object through the value world to get it back. TypeScript has no such idiom and no such possibility. What it has instead is the opposite trick: rather than carrying types down to runtime, it reaches up from values at compile time and derives the types from them. The `as const` object followed by `typeof` and `keyof` is the everyday form of that move, and it is why so much modern TypeScript declares its data first and its types second.

Everything else in the type level, [[cs/languages/TypeScript/conditional-types|the conditionals]] and the mapped types and the string arithmetic, operates on material these three operators supplied.

## Related Notes

- [[cs/languages/TypeScript/mapped-types|Mapped Types]] - the construct that consumes the key union keyof produces
- [[cs/languages/TypeScript/conditional-types|Conditional Types]] - what the extracted types get tested against
- [[cs/languages/TypeScript/generics-over-a-structural-type-system|Generics Over a Structural Type System]] - why there is nothing left at runtime to travel the other way
- [[cs/pl/language-design-values-variables-environments|Language Design: Values, Variables, and Environments]] - the general account of names, bindings, and the worlds they live in
- [[cs/math/set-theory-basics|Set Theory Basics]] - the vocabulary keyof results actually obey
- [[cs/languages/Java/type-tokens-and-super-type-tokens|Type Tokens and Super Type Tokens]] - the opposite smuggling operation, from types down to runtime

## Sources

- TypeScript Handbook, "Keyof Type Operator." https://www.typescriptlang.org/docs/handbook/2/keyof-types.html . Supports the definition of keyof, its behavior on string and number index signatures, and the key-coercion explanation for the string plus number result.
- TypeScript Handbook, "Typeof Type Operator." https://www.typescriptlang.org/docs/handbook/2/typeof-types.html . Supports the two contexts for typeof, the reminder that values and types are different, the limited usefulness on primitives, and the intentional restriction to identifiers and their properties.
- TypeScript Handbook, "Indexed Access Types." https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html . Supports the property lookup form, the indexing type being a type, indexing an array by number, the combination with typeof over an array literal, and the rule that a const cannot be used as an index.
