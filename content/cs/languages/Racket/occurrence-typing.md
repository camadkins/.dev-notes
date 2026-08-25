---
title: Occurrence Typing
description: "Typing the flow of a predicate test, why a Racket predicate's type carries a logical proposition, and what breaks the narrowing."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-04
updated:
aliases: []
---

Racket programmers dispatch on predicates. That is the idiom, it predates the type system by decades, and any type checker retrofitted onto the language has to make it work or be useless:

```racket
(: flexible-length (-> (U String (Listof Any)) Integer))
(define (flexible-length str-or-lst)
  (if (string? str-or-lst)
      (string-length str-or-lst)
      (length str-or-lst)))
```

`str-or-lst` has a union type. `string-length` does not accept a union. The function type-checks anyway, and the reason is the feature the Guide names as one of Typed Racket's distinguishing type system features: occurrence typing, which allows the type system to ascribe more precise types based on whether a predicate check succeeds or fails.

> [!note] The idea
> The narrowing is not a special case in the checker for `if` plus a known predicate list. It falls out of the *type of the predicate itself*. `string?` has type `(-> Any Boolean : String)`, and everything after the colon is a pair of logical propositions: what is learned when the result is true, and what is learned when it is false. The checker's job in a conditional is then ordinary propositional reasoning over those facts, which is why the same machinery works for user-defined predicates that declare their own propositions, works through `cond` and `when` without additional cases, and produces `assert` as a derived form rather than a primitive.

## The proposition is part of the type

Ask the REPL for the type of `string?` and it answers `(-> Any Boolean : String)`. The first two parts are an ordinary function type. The third part, after the colon, represents the logical propositions the typechecker learns from the result of applying the function: if the check succeeds, the argument variable has type `String`, and if it fails, the argument variable does not have type `String`.

Predicate types in Typed Racket are annotated with logical propositions that tell the typechecker what additional information is gained when a predicate check succeeds or fails, and predicates for all built-in types are annotated with similar propositions that allow the type system to reason logically about predicate checks.

With that in place, `flexible-length` needs no cleverness. In the true branch the checker holds "`str-or-lst` is a `String`" and narrows the union to `String`. In the false branch it holds the negation, and since the declared type was `(U String (Listof Any))`, process of elimination leaves `(Listof Any)`. Both halves are elimination steps of the sort catalogued in [[cs/math/propositional-logic|propositional logic]], run over a set of facts that grows as control flow descends into a branch. The type system is a small theorem prover whose axioms are attached to procedures.

## Your predicates are second-class until you say otherwise

This is the part that surprises people porting code. Write a predicate that clearly implies a type and the checker will not believe you:

```racket
(: listof-string? (-> (Listof Any) Boolean))
(define (listof-string? lst) (andmap string? lst))
```

Used in a `cond`, this fails to narrow, and the Guide is explicit about why: Typed Racket fails to narrow the type because no proposition was specified for `listof-string?`. The body is not analyzed for what it implies. Inlining the body would have worked, since `andmap` and `string?` both carry propositions, but the moment the logic is wrapped in a function the propositions stop at the abstraction boundary and only the declared type crosses.

The fix is to declare it: `(: listof-string? (-> (Listof Any) Boolean : (Listof String)))`. That is a claim you are making, not one the checker verified from the body, which puts it in the same family as a hand-written type predicate in [[cs/languages/Python/type-narrowing-and-typeguard|Python's TypeGuard]] or a TypeScript `x is T` signature. The annotation is trusted.

Sometimes only one direction is sound. Consider a predicate that returns true only for symbols that are not `cond`, `else`, or `if`. Anything satisfying it is a `Symbol`, but failing it proves nothing, since `'else` fails too. Typed Racket lets you say exactly that with a one-sided proposition, `(: legal-id? (Any -> Boolean : #:+ Symbol))`, which captures the idea that a true result means the argument is a `Symbol` without making any claim at all about values for which the predicate returns false. There is a negative form as well, for types that specify propositions only about the values that make a predicate return false.

That asymmetry is worth dwelling on, because a system with only two-sided narrowing forces you to over-claim in the negative branch or give up narrowing entirely.

## Assert is not a primitive

Arithmetic is where the checker runs out of information. `(- b a)` on two `Positive-Integer` values has type `Integer`, because the difference of two positive integers need not be positive. The Guide's remedy is `(assert (- b a) positive?)`, and the important observation is what `assert` is: a derived concept in Typed Racket and a natural consequence of occurrence typing. The expansion is a `let`, an `if` on the predicate, and an `error` in the false branch. The narrowing that gives the whole expression type `Positive-Integer` is the same narrowing that types `flexible-length`.

That also tells you what an assertion costs. It type-checks, but the assertion may raise an exception at run time if the predicate returns false. An assert is a runtime check that buys a static fact, which is the honest trade and the same one made at every [[cs/languages/Racket/contracts-and-blame|contract]] boundary.

## What stops the narrowing

Three limits, each for a different reason.

**Mutation.** If a variable is ever mutated with `set!` in the scope where it is defined, Typed Racket cannot use occurrence typing on it. The stated justification is not aliasing but concurrency: the precaution is needed to ensure that concurrent modification of a variable does not invalidate Typed Racket's knowledge of the type of that variable. A narrowed fact is only stable while nothing can change the binding underneath it. This also means top-level REPL variables can never be refined, because the scope of a top-level variable includes future top-level interactions, which may include mutations. Moving the code into a module or a `let` restores narrowing.

**Immutability of the field.** Occurrence typing can work with accessors to immutable structure fields, so `(and (apple? obj) (number? (apple-a obj)))` narrows the field access itself. Mutable fields get no such treatment, for the same reason mutable variables do not.

**Macro expansion order.** Because Typed Racket type checks code after macro expansion, forms like `match` are difficult to reason about completely, and in a `match` clause the type of an identifier is often not updated to reflect the fact that a previous pattern failed to match. So the `cond` version of a function type-checks while the `match` version of the same logic does not. The checker sees only what the expander produced, and the sequencing information that a human reads off the pattern order has been compiled into a shape the propositions cannot recover. Typed Racket does recover part of it through `let`-aliasing, since it reasons about `let`-bound variables that alias non-mutated identifiers and immutable accesses, which is exactly the pattern macros like `match` generate internally. This is the type system paying the standard tax of [[cs/pl/macros-and-metaprogramming|macro-based language extension]]: analyses run on the core language and lose the surface language's structure.

> [!warning] Not the same thing as a conditional type
> [[cs/languages/TypeScript/conditional-types|TypeScript's conditional types]] and occurrence typing get confused because both involve a test producing a type. They operate at different levels. A conditional type is a computation *in the type language*, evaluated by the checker on types, with no runtime term corresponding to the test. Occurrence typing runs on a real runtime test in a real branch, and the propositions describe what that runtime test tells you about a term. TypeScript's nearest equivalent is its narrowing plus user-defined type predicates, not its type-level conditionals. Knowing which of the two a language gives you tells you whether you can compute types from types or only refine terms from tests.

## Related Notes

- [[cs/math/propositional-logic|Propositional Logic]] - the elimination reasoning the checker performs on a branch's accumulated facts
- [[cs/languages/Python/type-narrowing-and-typeguard|Type Narrowing, TypeGuard, and TypeIs]] - user-declared predicates and the same trust boundary
- [[cs/languages/TypeScript/conditional-types|Conditional Types]] - type-level computation, the thing occurrence typing is not
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - why checking after expansion costs the checker information
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - the runtime-check-for-static-fact trade that assert makes
- [[cs/languages/Racket/typed-racket-and-gradual-typing|Typed Racket and Gradual Typing]] - the surrounding system, and what enforcement the narrowed types get

## Sources

- "5 Occurrence Typing," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/occurrence-typing.html . Supports occurrence typing ascribing more precise types based on whether a predicate check succeeds or fails, the `flexible-length` example and its branch-by-branch narrowing, the `(-> Any Boolean : String)` type of `string?` and the meaning of its third part, propositions being attached to all built-in type predicates, the `listof-string?` failure and its fix by declaring a proposition, one-sided `#:+` propositions with the `legal-id?` example and the existence of a negative form, `assert` as a derived consequence of occurrence typing with its runtime exception, the `set!` restriction and its concurrency justification, the top-level variable consequence, narrowing through immutable structure accessors, and `let`-aliasing.
- "8 Caveats and Limitations," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/caveats.html . Supports Typed Racket type checking code after macro expansion, `match` being difficult to reason about as a result, and identifier types in a `match` clause not being updated to reflect earlier pattern failures.
