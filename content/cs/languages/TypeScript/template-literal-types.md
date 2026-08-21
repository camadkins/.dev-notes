---
title: "Template Literal Types"
description: "Strings stopped being atoms in the type system and became structures that can be built and taken apart. The bill arrives as a cross product."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases:
  - TypeScript Template Literal Types
  - Type-Level Strings
---

A string literal type used to be a point with no interior. `"top"` was a single inhabitant and the only thing you could do with it was compare it to another one. TypeScript 4.1 gave it structure.

```ts
type World = "world";
type Greeting = `hello ${World}`; // "hello world"
```

"They have the same syntax as template literal strings in JavaScript , but are used in type positions. When used with concrete literal types, a template literal produces a new string literal type by concatenating the contents."

> [!note] The idea
> The feature is usually explained as string concatenation for types, which understates it in one direction and overstates it in another. It understates it because interpolating a union does not concatenate, it enumerates: the resulting type is every string the pattern could produce, so a template over unions is a cross product and its size is the product of the sizes. It overstates it because there is no string data anywhere. The type is a finite set of literals the compiler must be able to write down, and the moment a pattern would produce something unbounded, the mechanism stops.

## Building

With concrete literals the behavior is plain concatenation. With a union it is expansion: "When a union is used in the interpolated position, the type is the set of every possible string literal that could be represented by each union member."

The rule composes, and this is where the cost appears. "For each interpolated position in the template literal, the unions are cross multiplied." Two locale unions of two members each combine into a four-member union, and prefixing three language codes yields twelve.

The 4.1 release notes give the motivating case with the arithmetic stated outright: aligning vertically with "top", "middle", and "bottom" and horizontally with "left", "center", and "right" means "there are 9 possible strings where each of the former strings is connected with each of the latter strings using a dash." Writing those nine out by hand is the status quo the feature replaced, and the compiler now derives them, along with a spell-checked error listing all nine when someone writes `top-middel`.

Nine is fine. The growth is [[cs/math/combinatorics|multiplicative]], so the type has as many members as the product of every interpolated union, and the docs attach a caution rather than a hard limit: "We generally recommend that people use ahead-of-time generation for large string unions, but this is useful in smaller cases." Two positions over unions of a hundred members each is ten thousand literals the checker has to materialize and then compare.

## Taking apart

The other direction arrived with the same feature, and it is the one that changed what libraries could express. A template literal in a pattern position, with [[cs/languages/TypeScript/infer-and-type-level-pattern-matching|an infer hole]] in it, matches and destructures.

The handbook's worked example is an event API. Given an object, a method `on` should accept `"firstNameChanged"` and hand the callback a `string`, while `"ageChanged"` hands it a `number`. Four steps make it work, and the handbook lists them: the literal argument is captured as a literal type, that literal is validated against the union of valid attributes, the attribute's type is looked up with an indexed access, and the result types the callback.

```ts
type PropEventSource<Type> = {
  on<Key extends string & keyof Type>(
    eventName: `${Key}Changed`,
    callback: (newValue: Type[Key]) => void
  ): void;
};
```

"When a user calls with the string 'firstNameChanged' , TypeScript will try to infer the right type for Key . To do that, it will match Key against the content before 'Changed' and infer the string 'firstName' . Once TypeScript figures that out, the on method can fetch the type of firstName on the original object, which is string in this case."

That is parsing. A string was matched against a pattern, a substring was bound to a variable, and the binding was used as a key. Every typed router, every typed selector, every typed query builder that appeared in TypeScript libraries after 4.1 is some version of those four steps.

Character-level work follows the same shape, treating [[cs/dsa/strings|the string as a sequence]] and recursing on the tail. The 4.5 release notes use a trim:

```ts
type TrimLeft<T extends string> = T extends ` ${infer Rest}` ? TrimLeft<Rest> : T;
```

And immediately report the ceiling: "This type can be useful, but if a string has 50 leading spaces, you'll get an error." That limitation is the reason 4.5 shipped tail-recursion elimination for conditional types, and the reason string-heavy type code is written with accumulator parameters.

## The four built-ins

Four string manipulation types are supplied by the compiler rather than by the standard library: `Uppercase`, `Lowercase`, `Capitalize`, and `Uncapitalize`. "These types come built-in to the compiler for performance and can't be found in the .d.ts files included with TypeScript."

They are the tell that this is a real evaluator with primitives, not a syntax trick. Case conversion cannot be expressed by pattern matching over an alphabet without an enormous mapping table, so the compiler implements it natively and exposes it as an intrinsic. `Capitalize` is what makes the standard getter-generating [[cs/languages/TypeScript/mapped-types|mapped type]] readable:

```ts
type Getters<Type> = {
  [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property];
};
```

Key remapping supplies the iteration, the template supplies the name, and the intrinsic supplies the one operation neither of them could perform.

> [!warning] The set has to be writable
> Every template literal type is a finite union the compiler enumerates. That is why `` `${number}` `` and `` `${string}` `` behave differently from the literal cases, and why a pattern that would generate an unbounded set is not the same kind of object as one over three alignments. When a type produces an error about excessive depth or an editor becomes unresponsive on a route table, the usual cause is a cross product nobody counted. The docs' advice to generate large unions ahead of time is not a stylistic preference. It is an instruction to move the enumeration out of the checker.

## Related Notes

- [[cs/languages/TypeScript/infer-and-type-level-pattern-matching|infer and Type-Level Pattern Matching]] - the binding mechanism that turns a template into a parser
- [[cs/languages/TypeScript/mapped-types|Mapped Types]] - key remapping, the feature template literals were built to serve
- [[cs/languages/TypeScript/type-level-computation-and-its-limits|Type-Level Computation and Its Limits]] - the recursion budget that character-level string types spend
- [[cs/math/combinatorics|Combinatorics]] - why an extra interpolation multiplies rather than adds
- [[cs/dsa/strings|Strings]] - the sequence view that head-and-tail recursion assumes
- [[cs/languages/TypeScript/keyof-typeof-and-indexed-access|keyof, typeof, and Indexed Access]] - the lookup step that makes a parsed key useful

## Sources

- TypeScript Handbook, "Template Literal Types." https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html . Supports the syntax and concatenation behavior, the union expansion rule, the cross multiplication of interpolated unions, the recommendation to generate large string unions ahead of time, the four steps behind the typed event API, the inference walkthrough for firstNameChanged, and the four intrinsic string manipulation types with the note that they are built into the compiler.
- TypeScript 4.1 release notes, "Template Literal Types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html . Supports the introduction of the feature, the hello world concatenation example, and the nine-string alignment example.
- TypeScript 4.5 release notes, "Tail-Recursion Elimination on Conditional Types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html . Supports the TrimLeft example and the failure at fifty leading spaces.
