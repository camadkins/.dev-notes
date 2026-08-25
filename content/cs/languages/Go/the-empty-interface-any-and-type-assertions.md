---
title: "The Empty Interface, any, and Type Assertions"
description: "The pre-generics escape hatch, why an assertion is an identity check rather than a cast, and what the spec says a type switch actually means."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-30
updated:
aliases: []
---

For twelve years, the way you wrote a container in Go that held anything was to hold `interface{}`. Every `sort.Interface` implementation, every `encoding/json` decode target, every "generic" list in every internal utilities package went through the empty interface and came back out through an assertion. The pattern was so universal that Go 1.18 gave it a shorter spelling: the predeclared `any`, which the spec describes as an alias for the empty interface, not a named type of its own.

> [!note] The idea
> `any` is a box, not a top type. Putting a value in it does not convert the value, and taking the value out is not a cast. `x.(T)` compares the type descriptor stored alongside the value against `T` and demands **identity**, not assignability, not convertibility, not a subtype relation. That single design choice is why the escape hatch never quietly widened into a type system: it can only ever hand you back exactly what someone put in.

## What the empty interface actually holds

An interface type defines a type set, and the type set of the empty interface is the set of all non-interface types. Every value is therefore in it, which is what makes `any` usable as a universal parameter type. What it holds is the same pair described in [[cs/languages/Go/interfaces-and-implicit-satisfaction|the interface value representation]]: the concrete value, and a descriptor for that value's full type.

Reflection is built directly on this. `reflect.TypeOf` takes an `interface{}` parameter, and Rob Pike's account of it points out the step people miss: when you call `reflect.TypeOf(x)`, "x is first stored in an empty interface, which is then passed as the argument," and the function then unpacks that interface to recover the type information. Reflection in Go is "a mechanism to examine the type and value pair stored inside an interface variable." There is no separate metadata channel. The box is the metadata.

## The assertion is an identity test

The spec is exact about what `x.(T)` claims. It "asserts that x is not nil and that the value stored in x is of type T." When `T` is not an interface type, the assertion demands that the dynamic type of `x` is **identical** to `T`.

Identical is a strong word here and it is meant literally. A value of a defined type `MyInt` whose underlying type is `int` does not pass `x.(int)`, because the two are different types even though they share a representation and one converts to the other for free. Assertions do not follow conversions, and they do not follow assignability. This is the point where Go refuses to blur the line between a type and its underlying type, and it is the same refusal that makes the language's [[cs/pl/type-systems-goals-guarantees|type discipline]] predictable rather than clever.

When `T` **is** an interface type, the rule changes shape: the assertion holds if the dynamic type of `x` implements `T`. That is the case that lets you narrow from `any` back to `io.Writer` without knowing the concrete type.

There is also a compile-time half. If `T` is not an interface, `T` must implement the interface type of `x`, "otherwise the type assertion is invalid since it is not possible for x to store a value of type T." Asserting a `string` out of an interface with a method `string` does not have is a compile error, not a failed assertion. The check that survives to run time is only the part the compiler cannot decide.

## Panic, or comma-ok

If the assertion is false, the spec says a run-time panic occurs. The special assignment form `v, ok := x.(T)` yields an extra untyped boolean, and when the assertion fails, `ok` is false, `v` is the zero value for `T`, and "No run-time panic occurs in this case."

The design is worth noticing. Go did not make the safe form the default and the panicking form the opt-in. It made the shape of the assignment decide, so the same syntax means "I know this holds and I want to crash if I am wrong" in one context and "tell me whether it holds" in another. The spec's own phrasing for the panicking form is that "even though the dynamic type of x is known only at run time, the type of x.(T) is known to be T in a correct program." The type system stays sound because the run-time check is the thing that makes the static claim true, which is [[cs/pl/type-soundness-progress-preservation|soundness bought with a dynamic guard]] rather than with a static proof.

## What a type switch means

A type switch "compares types rather than values" and is written with the keyword `type` in the position an actual type would occupy. The rules are tight: `x` must be of interface type, every non-interface type listed in a case must implement the type of `x`, and the listed types "must all be different." A case may use the predeclared identifier `nil`, which is selected when the guard expression is a nil interface value, and there may be at most one such case.

The short variable declaration in the guard is where the ergonomics live, and the rule has an edge. In a clause listing exactly one type, the variable has that type. In a clause listing several, or in the default, the variable keeps the type of the guard expression. So a `case bool, string:` gives you back the interface, not a narrowed value.

> [!example] The spec defines the meaning by rewriting
> The specification does not describe the type switch as a dispatch table. It gives an equivalent program: the guard expression is assigned once, then compared to `nil`, then run through a chain of `if i, isInt := v.(int); isInt` clauses in source order. The consequence surfaces with generics. When a type parameter appears in a case and instantiation makes it duplicate another case, the spec says "the first matching case is chosen." Order is semantics, not an implementation detail.

Set against a real sum type, this is the weak version. A type switch over an interface has no closed set of alternatives, so the compiler cannot tell you a case is missing, which is the exhaustiveness guarantee [[cs/pl/records-variants-and-pattern-matching|pattern matching on a variant]] provides and the reason a `default` clause is doing more work in Go than it looks like it is.

## The hatch that generics closed

Everything above is a run-time mechanism sitting where a static one belonged. A pre-1.18 `Min` over `any` had to assert, could not reject a `[]string` against a `[]int` at compile time, and boxed every element on the way in. [[cs/languages/Go/why-go-waited-and-what-changed|The long wait for type parameters]] is best read as an argument about whether that cost was worth paying to avoid the alternative, and the shape of what shipped is easier to judge once you know exactly how much the empty interface was never able to do.

## Related Notes

- [[cs/languages/Go/interfaces-and-implicit-satisfaction]] - the pair an assertion inspects, and the nil-type rule that decides the first half of the assertion
- [[cs/languages/Go/why-go-waited-and-what-changed]] - the argument this escape hatch was the counterproposal to
- [[cs/languages/Go/generics-versus-interfaces-when-to-use-which]] - the modern decision this note is the historical half of
- [[cs/pl/records-variants-and-pattern-matching]] - what a closed set of alternatives buys that an open interface cannot
- [[cs/pl/type-soundness-progress-preservation]] - why a dynamic check is a legitimate way to keep a static type claim honest
- [[cs/languages/Java/type-tokens-and-super-type-tokens]] - the other language's workaround for the same missing information

## Sources

- [The Go Programming Language Specification](https://go.dev/ref/spec) - `any` as an alias for the empty interface, the identity requirement in a type assertion, the comma-ok form, and the type switch rules and rewriting
- [The Laws of Reflection](https://go.dev/blog/laws-of-reflection) - reflection as examination of the type and value pair, and the implicit boxing at a `reflect.TypeOf` call
