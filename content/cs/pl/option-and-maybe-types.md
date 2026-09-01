---
title: Option and Maybe Types
description: "An option type is A + 1, a sum with a real tag. A nullable type is A with a flag, and the difference shows up the moment you try to nest one."
draft: false
comments: true
tags:
  - cs
  - pl
  - type-theory
  - error-handling
date: 2026-08-31
updated:
aliases:
  - Maybe
---

An option type, also called a maybe type, is a polymorphic type representing encapsulation of an optional value, used as the return type of functions that may or may not return a meaningful value. It has a constructor that is either empty, often named `None` or `Nothing`, or that encapsulates the original data type `A`, often written `Just A` or `Some A`. The point of the definition is where the second case *puts* the value: inside a constructor, behind a tag, unreachable without going through the tag.

> [!note] The idea
> In type theory the option type is written `A? = A + 1`. For a given set of values in `A`, the option type adds exactly one additional value, the empty one, to the set of valid values. The `+` is a sum, not a union, so the added value is distinguishable from every value of `A` even when `A` already contains something that looks empty. A nullable type widens `A` in place; an option type builds a new type with `A` as a component. Everything that follows, exhaustiveness, nesting, and the fact that you cannot forget the check, is downstream of that one structural difference.

## The nesting test

The cleanest way to tell the two apart is to put one inside another. Option types support nesting, so `Maybe (Maybe String)` is not `Maybe String`. Nullable types do not, so `String??` is `String?`. That is not a syntax quirk. It says the nullable annotation is idempotent, which means it carries a single bit that is either already set or not, and a bit cannot record how many layers set it.

Idempotence sounds harmless until a layer needs to distinguish two absences. A cache lookup returning `Maybe (Maybe User)` says outer-`Nothing` for "not cached" and `Just Nothing` for "cached, and the answer is that no such user exists". Collapse the two and the cache cannot memoize a negative result, which is exactly the lookup you most want to memoize. With nullable types the fix is a second return channel, an out parameter, or a sentinel, all of which are the same admission: the type system stopped modelling the problem one case too early.

Generic code makes this bite without anyone nesting deliberately. A `first(xs)` over a `List<T>` returns `Option<T>`, and it is correct for every `T`. Written against nullable types it is correct for every `T` except the ones that are themselves nullable, where an empty list and a list whose first element is null become indistinguishable. This is the same failure `Dictionary.TryGetValue` was invented to route around.

## It is a tagged union, and that is all it is

Option is a particular case of a [[cs/pl/records-variants-and-pattern-matching|tagged union]], with `Nothing` as the nullary constructor of a singleton type. In a language with tagged unions the option type can be expressed as the tagged union of the encapsulated type plus a unit type, and needs no special support. Haskell's `Maybe`, Rust's `Option`, and OCaml's `option` are all ordinary two-constructor declarations in the language's own [[cs/pl/parametric-polymorphism-adts|algebraic data type]] machinery, not primitives.

That is worth stating because it inverts the usual framing. Option is not a feature a language adds to fix null; it is what you get for free once you have sum types, and null is the thing languages reach for when they do not have them. A language with sum types and [[cs/languages/Rust/pattern-matching-and-enums|exhaustive pattern matching]] gets the checking as a consequence of the compiler's ordinary duty to prove every constructor was handled, which is why nobody had to design an option-specific static analysis.

The 1965 origin is well documented, and the author's own assessment is worth reading precisely. Tony Hoare introduced the null reference in ALGOL W while designing the first comprehensive type system for references in an object-oriented language, with the goal that all use of references should be absolutely safe. He put null in anyway, in his words, "simply because it was so easy to implement", and he calls it "my billion-dollar mistake". The temptation is the real content: null is easy to implement, because widening a representation costs nothing and adding a tag costs a word and a branch. Option types are the design that pays the word.

## Chaining, and why the ceremony stays bounded

The objection to option types is that they force a check at every level, so a three-deep lookup becomes three nested matches. The answer is that option is a monad: `return` is `Just`, `Nothing >>= f` is `Nothing`, and `(Just x) >>= f` is `f x`. Bind propagates the failure without the caller writing a branch for it, and the monadic nature is useful for tracking failure and errors efficiently.

That single definition is what every syntactic convenience over options compiles into. Rust's `?` operator, Haskell's `do` blocks, and OCaml's `let*` are surface forms of the same bind. Compare against the alternatives and the trade sharpens: [[cs/pl/exceptions-handlers-and-non-local-control|exceptions]] also propagate a failure without per-level branching, and they do it by leaving the type unchanged, which means the caller has no signature-level warning that the propagation exists. Options make the possibility visible in the type and pay for it with a combinator. Which of those is ceremony depends entirely on whether you think the caller should have been told.

## Where the retrofits land

A language that shipped null and later wanted safety cannot get the sum type back, because the runtime representation is already fixed. What it can do is track a second, compile-time-only fact about each reference.

[[cs/languages/CSharp/nullable-reference-types|C#'s nullable reference types]] are the clearest example: `string?` and `string` are the same runtime type, `System.String`, and the compiler tracks a two-valued null-state across the program and warns on contradictions. [[cs/languages/TypeScript/strict-null-checks|TypeScript's `strictNullChecks`]] takes the other retrofit route available in a structurally typed language and removes `null` and `undefined` from the value set of every other type, so `string | null` becomes a real [[cs/languages/TypeScript/union-and-intersection-types|union]] you must narrow. Kotlin, Swift, and Dart each pick a variant of the same move.

> [!warning]
> A retrofit gives you the diagnostic, not the guarantee. C#'s analysis produces warnings, has documented holes at `default(T)` and array creation, and has an escape hatch, all because the runtime never learned the distinction. That is a legitimate engineering position and it is a different thing from a type: the option type's promise is enforced by the same mechanism that enforces every other constructor, while the retrofit's promise is enforced by a checker you can switch off. [[cs/pl/type-soundness-progress-preservation|Soundness]] is the word for what the second one is not claiming.

## Related Notes

- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the tagged union option is a two-case instance of
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]] - where `A + 1` comes from, and the rest of the algebra
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - the frame for judging what a type is promising versus what a checker is warning about
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the other way to propagate failure, and what it hides from the signature
- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling in Rust: Result, Option, and ?]] - options and their two-parameter sibling in a language built around them
- [[cs/languages/Rust/pattern-matching-and-enums|Pattern Matching and Enums in Rust]] - the exhaustiveness check that makes the tag impossible to skip
- [[cs/languages/CSharp/nullable-reference-types|Nullable Reference Types]] - the retrofit, and what it can and cannot promise
- [[cs/languages/TypeScript/strict-null-checks|Strict Null Checks]] - the same retrofit through a structural union instead of an annotation

## Sources

- "Option type," Wikipedia. https://en.wikipedia.org/wiki/Option_type . Backs the definition of an option or maybe type as a polymorphic type encapsulating an optional value, used as the return type of functions that may or may not return a meaningful value, with an empty constructor (`None` or `Nothing`) or one encapsulating `A` (`Just A` or `Some A`); the core difference from nullable types being that option types support nesting (`Maybe (Maybe String)` is not `Maybe String`) while nullable types do not (`String??` equals `String?`); the type-theoretic reading `A? = A + 1` as adding exactly one additional value to the valid values of `A`; option types being expressible in languages with tagged unions as the tagged union of the encapsulated type plus a unit type, and being a particular case of a tagged union with `Nothing` as a nullary singleton constructor; and the monad definition with `return = Just`, `Nothing >>= f = Nothing`, `(Just x) >>= f = f x`, useful for efficiently tracking failure and errors.
- "Null pointer," Wikipedia. https://en.wikipedia.org/wiki/Null_pointer . Backs Tony Hoare's 2009 statement that he invented the null reference in 1965 as part of ALGOL W, the quoted passages "I call it my billion-dollar mistake" and that he could not resist putting in a null reference "simply because it was so easy to implement", and the context that he was designing the first comprehensive type system for references in an object-oriented language with the goal that all use of references be absolutely safe.
- "Nullable type," Wikipedia. https://en.wikipedia.org/wiki/Nullable_type . Backs nullable types as a feature allowing a value to be set to NULL instead of the usual possible values of the data type, and the C# 2.0 declaration form `int? x`.
