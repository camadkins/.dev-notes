---
title: "Discriminated Unions and Exhaustiveness"
description: "Putting a literal-typed tag on every member of a union so ordinary JavaScript comparisons narrow it, and using the bottom type to turn a forgotten case into a compile error."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-15
updated:
aliases: []
---

Model a shape as one interface with optional fields and the type checker cannot help you. "The problem with this encoding of Shape is that the type-checker doesn't have any way to know whether or not radius or sideLength are present based on the kind property." Optionality says a field might be missing; it says nothing about which combinations of present and absent fields are legal.

The fix is to stop describing one loose shape and start describing several exact ones, each carrying a literal-typed field that identifies it:

```ts
interface Circle { kind: "circle"; radius: number; }
interface Square { kind: "square"; sideLength: number; }
type Shape = Circle | Square;
```

"When every type in a union contains a common property with literal types, TypeScript considers that to be a discriminated union, and can narrow out the members of the union."

> [!note] The idea
> The tag is a value, and the check on it is ordinary JavaScript. What TypeScript adds is that the comparison is also a proposition about the type, so the same `switch` that a plain JavaScript author would have written is what selects the variant. The interesting half is the failure mode rather than the success: because `never` is assignable to everything and nothing is assignable to `never`, a variable that should have been narrowed to nothing is exactly a case you forgot, and that fact converts an unhandled variant from a runtime surprise into a type error at the line where you swore you were done.

## What the compiler actually does with the tag

The rule is more mechanical than it looks. A discriminant property type guard is an equality or inequality comparison between a property access and a string literal, and it "narrows the type of x to those constituent types of x that have a discriminant property p with one of the possible values of" the tested value. Checking `shape.kind === "circle"` removes every member of the union whose `kind` cannot be `"circle"`, so what remains is `Circle`, and `shape.radius` becomes reachable without a cast.

The negative branch works for free. Test one tag out of three and the `else` holds the other two, still as a union, ready to be narrowed again. TypeScript 2.0 shipped this in exactly this form, extending the type guard machinery to `switch` statements at the same time, and at the time the feature "currently only support[ed] discriminant properties of string literal types," with boolean and numeric literals named as future work.

None of this is a language keyword. A discriminated union is a design pattern that the checker recognizes, which is what makes it portable to whatever your data already looks like. Redux actions, RPC responses, parser results, and state machine states are all discriminated unions whether or not anyone called them that; the handbook makes the same point, noting that they are good "for representing any sort of messaging scheme in JavaScript, like when sending messages over the network (client/server communication), or encoding mutations in a state management framework." This is the shape that [[cs/pl/records-variants-and-pattern-matching|variants and pattern matching]] give you as a first-class construct in ML-family languages, rebuilt from string literals and `switch`.

## The never trick

Add a `default` clause that tries to assign the narrowed value to a variable of type `never`:

```ts
function getArea(shape: Shape) {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.sideLength ** 2;
    default:
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

Why this works comes straight out of the definition of the bottom type. "The never type is assignable to every type; however, no type is assignable to never (except never itself). This means you can use narrowing and rely on never turning up to do exhaustive checking in a switch statement." When every case is handled, control flow analysis proves the `default` is reachable only with a value of type `never`, and assigning `never` to `never` is fine. "Adding a `default` to our getArea function which tries to assign the shape to never will not raise an error when every possible case has been handled."

Then add a third variant. Declare a `Triangle` with `kind: "triangle"`, widen `Shape` to include it, and the `default` clause now receives a `Triangle`. The compiler reports `Type 'Triangle' is not assignable to type 'never'`, and it reports it at the one place in the codebase that failed to keep up. That is the whole return on the pattern: adding a case to the data model produces a finite list of compile errors instead of a silent `undefined` at 3am.

> [!example] Reading the error backwards
> The error text names the variant you forgot, not the case you wrote. `Type 'Triangle' is not assignable to type 'never'` at line 40 of a reducer means the union gained a `Triangle` and this reducer never learned about it. The value being unassignable is the diagnosis, not the disease.

## What it does not check

The tag is data, and it arrives from wherever your data arrives from. TypeScript verifies that the branch you took matches the tag you tested; it does not verify that the object came with the tag it claims. Parse a JSON body, assert it into `Shape`, and a payload with `kind: "circle"` and no `radius` narrows to `Circle` and reads `undefined` for the radius, because the check happened at compile time against a type that was asserted rather than proven. This is the ordinary [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|erasure boundary]], and it is the same boundary that makes trusting shapes decoded from a wire format an [[cs/security/insecure-deserialization|input validation problem]] rather than a typing one. Exhaustiveness protects the code you write against changes to the model. Nothing protects the model against the network.

Two smaller caveats. Exhaustiveness only means anything for a closed union, so a union that some other module can extend gives you nothing; sealing the set is the precondition. And the `never` assignment must be a statement the compiler evaluates, which is why the idiom writes a `const` rather than a comment: an exhaustiveness check that is not compiled is not a check.

## Related Notes

- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the first-class version of this pattern, where the tag is the constructor and the compiler owns it
- [[cs/languages/Rust/pattern-matching-and-enums|Pattern Matching and Enums in Rust]] - exhaustiveness as a language rule rather than an idiom you opt into
- [[cs/languages/Java/records-sealed-types-and-pattern-matching|Records, Sealed Types, and Pattern Matching]] - sealing a hierarchy so the compiler can enumerate the variants
- [[cs/languages/TypeScript/the-any-unknown-never-triangle|The any, unknown, never Triangle]] - the assignability rules that make the never trick work at all
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - what happens when the tag on an untrusted object is taken at face value
- [[cs/languages/TypeScript/union-and-intersection-types|Union and Intersection Types]] - the untagged union this pattern is compensating for

## Sources

- TypeScript Handbook, "Narrowing." https://www.typescriptlang.org/docs/handbook/2/narrowing.html . Supports the failure of the optional-field encoding, the definition of a discriminated union and the discriminant property, the switch-based narrowing example, the messaging-scheme motivation, the assignability characterization of `never`, the exhaustiveness idiom, and the error produced when a new variant is added.
- TypeScript 2.0 release notes, "Tagged union types" and "The never type." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html . Supports the introduction of tagged unions in 2.0, the formal form of a discriminant property type guard, the narrowing rule it implements, the string-literal-only limitation at the time, and the assignability characteristics of `never`.
