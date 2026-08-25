---
title: "Erasure at Runtime and Type Guards"
description: "Types are gone by design rather than by concession, so every runtime check is something a human wrote, and the language only supplies the syntax that connects it back to the checker."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-24
updated:
aliases: []
---

Delete every annotation from a TypeScript file and you have the JavaScript the compiler emits. That is not an implementation detail that happened to work out; it is written down in the goals list as "Use a consistent, fully erasable, structural type system," sitting next to "Impose no runtime overhead on emitted programs" and "Emit clean, idiomatic, recognizable JavaScript code."

The stronger statement is on the non-goals list, and it is the one worth memorizing: TypeScript will not "add or rely on run-time type information in programs, or emit different code based on the results of the type system. Instead, encourage programming patterns that do not require run-time metadata."

> [!note] The idea
> Erasure in TypeScript is not a tax paid for compatibility with an older runtime. It is a commitment made in the opposite direction: the emitted program must not depend on the type system having run. That rules out reified generics, runtime type tests derived from your types, and any validation the compiler could have generated on your behalf. Everything the program knows at runtime is a check some human wrote in plain JavaScript, and the type system's entire contribution is a way to spell that check so the checker will believe its outcome. [[cs/languages/Java/generics-and-type-erasure|Java arrives at an erased runtime too]], by a different route.

## The compiler reads your JavaScript, not the other way around

Narrowing is the mechanism, and the striking part is where it looks. "TypeScript follows possible paths of execution that our programs can take to analyze the most specific possible type of a value at a given position," and it "overlays type analysis on JavaScript's runtime control flow constructs like" `if`/`else`, ternaries, loops, and truthiness checks. Nothing new is introduced into the language. The checker learns the type of a value by reading the same branches the interpreter will take, and "the process of refining types to more specific types than declared is called" narrowing.

The two workhorse guards are both plain JavaScript operators that existed before TypeScript did. "JavaScript supports a typeof operator which can give very basic information about the type of values we have at runtime," and the compiler recognizes its result against a fixed set of strings. "More specifically, in JavaScript x instanceof Foo checks whether the prototype chain of x contains" `Foo.prototype`, and "as you might have guessed, instanceof is also a type guard, and TypeScript narrows in branches guarded by" it.

Notice what each one can and cannot reach. `typeof` distinguishes the eight result strings the handbook enumerates, which means it cannot tell a `User` from an `Order`, since both answer `"object"`. `instanceof` walks the prototype chain, which means it works for anything built with `new` and does nothing for an object literal or a plain parsed payload. Between them they cover the two things JavaScript actually records about a value at runtime, and every interface you declared is invisible to both, because at runtime there is nothing to record.

## User-defined guards fill the gap with a promise

For the shapes the runtime does not track, TypeScript lets you write the check yourself and label it. "To define a user-defined type guard, we simply need to define a function whose return type is a type" predicate, of the form `pet is Fish`, "where parameterName must be the name of a parameter from the current function signature."

```ts
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
```

"Any time isFish is called with some variable, TypeScript will narrow that variable to that specific type if the original type is compatible," and the narrowing runs both ways: "Notice that TypeScript not only knows that pet is a Fish in the if branch;" the `else` branch gets the complement.

Look at the body. The test is a property probe written by hand, with a cast inside it, because there is nothing else available. The predicate in the signature is a claim about what that body proves, and the value of the whole construct rests on the author having written a test that actually establishes it. A guard that returns `true` unconditionally is a well-formed guard. This is the same delegation of trust that a type assertion performs, just packaged as a function and therefore reusable and easy to stop reading.

## Assertion signatures: the throwing variant

TypeScript 3.7 covered the other shape the JavaScript ecosystem had already settled on. "Assertions in JavaScript are often used to guard against improper types being passed in," but "unfortunately in TypeScript these checks could never be properly encoded. For loosely-typed code this meant TypeScript was checking less, and for slightly conservative code it often forced users to use type assertions." The fix follows the same philosophy as everything else here: "Ultimately the goal of TypeScript is to type existing JavaScript constructs in the least disruptive way."

There are two forms. `asserts condition` propagates the truth of a boolean argument; the notes explain that it "says that whatever gets passed into the condition parameter must be true if the assert returns (because otherwise it would throw an error)." That parenthetical is the whole mechanism. The compiler does not verify the function throws. It reasons from a contract the signature declares and the body is expected to keep.

The second form names a type instead of a condition. It "doesn't check for a condition, but instead tells TypeScript that a specific variable or property has a different type," as in `asserts val is string`, so that after the call the variable is narrowed for the rest of the scope. A generic version is the standard non-null helper, asserting `val is NonNullable<T>`.

> [!warning] Guards and assertions emit nothing
> The predicate `pet is Fish` and the signature `asserts val is string` vanish in the output along with every other annotation. What runs is the function body you wrote. If the body is wrong, or absent, or checks a field that a legitimate value can also lack, the compiler is now confidently wrong for the rest of the scope, and the failure lands somewhere downstream with no annotation to blame.

## What this buys and what it costs

The cost is the obvious one: no reflection over your types, no generated validators, no `T` available inside a generic at runtime, and a hard boundary at every place data enters the program where the guarantees stop and hand-written [[cs/math/predicate-logic-and-quantifiers|predicates]] take over. The workaround that has grown up around this gap inverts the usual order: define the check as a value, then let the static type be derived from the check, so that the thing that runs and the thing the compiler believes come from one declaration instead of two.

The benefit is that TypeScript can be deleted. Because the type system never influences emit, a build can be [[cs/pl/compilation-vs-interpretation|a pure syntax transform]], output is readable JavaScript that runs anywhere JavaScript runs, and adoption is incremental in a way a reified system cannot be. That property is what made the language spreadable in the first place, and it is the same property that guarantees it will never check anything for you at runtime.

## Related Notes

- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - erasure adopted for a running platform, and what it forbids there
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the other bargain, where type arguments survive into the runtime and cost something
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - what a type predicate is claiming, and why an unverified one is an assumption rather than a proof
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - what a compiler is allowed to know, and what it is allowed to change
- [[cs/languages/TypeScript/the-any-unknown-never-triangle|The any, unknown, never Triangle]] - the type to give a value at the boundary so the compiler forces the guard to exist
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - a language that does generate the runtime check, and tracks who is at fault when it fails

## Sources

- TypeScript Wiki, "TypeScript Design Goals." https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals . Supports erasability and zero runtime overhead as stated goals, clean idiomatic JavaScript emit, and the non-goal of adding or relying on runtime type information or emitting different code based on the type system.
- TypeScript Handbook, "Narrowing." https://www.typescriptlang.org/docs/handbook/2/narrowing.html . Supports the definition of narrowing over JavaScript control flow, `typeof` and `instanceof` as type guards and what each inspects, the definition and form of a user-defined type predicate, and the two-way narrowing of a guard call.
- TypeScript 3.7 release notes, "Assertion Functions." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html . Supports the pre-3.7 gap for assertion-style checks, the stated goal of typing existing JavaScript constructs, and both forms of assertion signature including the generic `NonNullable` example.
