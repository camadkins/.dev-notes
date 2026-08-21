---
title: "Strict Null Checks"
description: "The flag that removes null and undefined from the value set of every other type, and why a change that fundamental had to arrive as an option."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-13
updated:
aliases:
  - strictNullChecks
  - Null Safety in TypeScript
---

For the first four years of the language, a `string` was not a string. "The type checker previously considered null and undefined assignable to anything. Effectively, null and undefined were valid values of every type and it wasn't possible to specifically exclude them (and therefore not possible to detect erroneous use of them)." Every annotation you wrote carried two silent extra inhabitants, and every dereference was a bet.

TypeScript 2.0 added a flag that takes them out.

> [!note] The idea
> `strictNullChecks` is not a lint rule layered over the type system. It changes what every type in the program denotes. Before the flag, the domain of `string` includes `null` and `undefined`; after it, the domain of `string` is strings, and absence has to be spelled out as `string | null`. Nothing new was added to the type system to express nullability, because a union already expressed it. What the flag did was stop the type checker from lying about the value set of every existing type.

## What actually changes

"In strict null checking mode, the null and undefined values are not in the domain of every type and are only assignable to themselves and any (the one exception being that undefined is also assignable to" `void`. That single rule produces every downstream consequence.

The first is that `T` and `T | undefined` stop being the same thing. Under the old rules they were synonymous, because `undefined` was a subtype of every `T`; under the flag only the union admits the missing value. Nullable types are therefore just [[cs/languages/TypeScript/union-and-intersection-types|union types]], with no special syntax and no separate concept to learn. "Control flow based type analysis is particularly relevant in strictNullChecks mode because nullable types are represented using union types."

The second is that ordinary narrowing does the work. An `if (x === null) return;` removes `null` from the type of `x` in the rest of the function, using exactly the same machinery that narrows any other union. Nothing about nullability is special-cased, which is why the feature composes so well with everything the checker learned later.

The third catches a different bug entirely. "Furthermore, in strictNullChecks mode, control flow based type analysis includes definite assignment analysis for local variables of types that don't permit the value" `undefined`. Declare `let x: number` and read it before any assignment, and that is now an error, because there is no legal value the variable could hold yet. That is a [[cs/pl/language-design-values-variables-environments|statement about what a variable denotes before it is bound]], not about null at all, and it falls out for free once `undefined` is no longer a member of `number`.

The fourth is quiet and touches every interface you have written. "When compiled in strictNullChecks mode, optional properties and methods automatically have undefined included in their type." A `b?: number` is `number | undefined`, so the question mark and the union stop being two separate ideas.

## The escape hatch and its shape

Sometimes you know something the checker cannot prove. "A new ! post-fix expression operator may be used to assert that its operand is non-null and non-undefined in contexts where the type checker is unable to conclude that fact." Validate an entity in a helper function, then read `e!.name`, and the assertion says the helper guaranteed it.

The important property of `!` is where it lives. The "non-null assertion operator is simply removed in the emitted JavaScript code." It generates no check, no throw, and no runtime cost. It is a claim you are making to the compiler, and if the claim is false the program fails at the dereference with the same `TypeError` it would have thrown without any types at all. Every `!` is a place where the [[cs/pl/type-systems-goals-guarantees|guarantee the type system offers]] has been switched off by hand, which is why they are worth counting in a codebase.

> [!warning] Optional chaining is not the same thing
> The `?.` operator, added in TypeScript 3.7, is emitted code: "optional chaining lets us write code where TypeScript can immediately stop running some expressions if we run into a null or undefined." The `!` operator is emitted as nothing. One is a runtime guard, the other is a promise, and they sit one character apart.

## Why it was opt-in

The obvious answer is that turning it on breaks code, which is true and insufficient. The deeper reason is that null-awareness is a property of a whole compilation, not of a file. "In practical terms, strict null checking mode requires that all files in a compilation are null- and undefined-aware." One dependency whose declaration file says `find(): T` rather than `T | undefined` reintroduces the hole for every consumer, and in 2016 that described essentially every declaration file in existence.

The design that made adoption possible is a compatibility rule pointing the other way. "In particular, the null and undefined types are automatically erased from union types in regular type checking mode (because they are subtypes of all other types), and the ! non-null assertion expression operator is permitted but has no effect in regular type checking mode." A library author could update declarations to the honest signatures immediately, and consumers who had not yet flipped the flag saw no change at all, because the unions collapsed back. That is what let the ecosystem migrate ahead of its users rather than in lockstep with them.

The payoff is easy to state. "Setting strictNullChecks to true will raise an error that you have not made a guarantee that the loggedInUser exists before trying to use it." `Array.prototype.find` can fail, its return type says so, and the flag is what makes the type system willing to mention it. With the flag off, "null and undefined are effectively ignored by the language. This can lead to unexpected errors at runtime."

That is the usual arc for a correctness flag: opt-in while the ecosystem catches up, then a default in the strict family that nobody remembers choosing. The retrofit problem is not unique to TypeScript either. [[cs/languages/CSharp/nullable-reference-types|C# faced the same hole]] in a nominal, compiled language and had to solve the same migration question, which is worth reading next to this one.

## Related Notes

- [[cs/languages/CSharp/nullable-reference-types|Nullable Reference Types]] - the same retrofit in a nominal, compiled language, with a gentler enforcement model
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what a type is claiming about a value, which is exactly what this flag corrects
- [[cs/languages/TypeScript/union-and-intersection-types|Union and Intersection Types]] - the construct that carries nullability once the flag is on
- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling in Rust: Result, Option, and ?]] - a language that never had the hole, and what absence looks like when it is a data type from the start
- [[cs/pl/language-design-values-variables-environments|Language Design: Values, Variables, and Environments]] - definite assignment analysis and the question of what an unbound variable holds
- [[cs/languages/TypeScript/the-any-unknown-never-triangle|The any, unknown, never Triangle]] - the other place where assignability rules decide how much the checker is allowed to assume

## Sources

- TypeScript 2.0 release notes, "Null- and undefined-aware types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html . Supports the prior treatment of `null` and `undefined` as members of every type, the domain change under the flag, the divergence of `T` from `T | undefined`, control flow analysis over nullable unions, definite assignment analysis, optional properties gaining `undefined`, the non-null assertion operator and its erasure, the whole-compilation requirement, and the backwards compatibility rule for declaration files.
- TypeScript tsconfig reference, "strictNullChecks." https://www.typescriptlang.org/tsconfig/strictNullChecks.html . Supports the behavior when the flag is off, the runtime error consequence, and the `Array.prototype.find` example that the flag turns into a compile error.
- TypeScript 3.7 release notes, "Optional Chaining." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html . Supports the description of `?.` as an operator that stops evaluating an expression on `null` or `undefined`.
