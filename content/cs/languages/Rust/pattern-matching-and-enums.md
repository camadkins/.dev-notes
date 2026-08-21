---
title: Pattern Matching and Enums in Rust
description: Match arms as ordered patterns, the exhaustiveness check the compiler actually performs, refutability as the line between match and let, and the binding modes that quietly insert ref for you.
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-01-28
updated:
aliases:
  - Rust match
  - Rust Enums and Patterns
  - if let and let else
---

An enum variant is not required to look like its siblings. The Reference's example declares `Quit` with no data, `WriteString(String)` with one field, `Move { x: i32, y: i32 }` with named fields, and `ChangeColor(u8, u8, u8)` with three, all under one type. A `match` over that value then has to say something about every shape, and the compiler holds it to that. The theory this instantiates is in [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]]; what follows is the Rust surface and the two mechanisms underneath it.

> [!note] The idea
> The power of `match` comes from the expressiveness of the patterns and the fact that the compiler confirms that all possible cases are handled. Those are two separate machines, and the second one is the interesting one: exhaustiveness turns "did I handle every case" from a code-review question into a type error. The non-obvious part sits below both. Patterns operate in different binding modes, and when a reference value is matched by a non-reference pattern it is automatically treated as a `ref` or `ref mut` binding. `if let Some(y) = x` where `x: &Option<i32>` silently gives you `y: &i32`, and none of that appears in the source you wrote.

## Arms are ordered, and the whole thing is an expression

A `match` compares a value against a series of patterns and executes code based on which matches. Each arm has two parts, a pattern and some code, separated by `=>`. The Book's image for the semantics is a coin-sorting machine: values pass through each pattern in turn, and at the first pattern the value fits, it falls into the associated block.

Two details follow from "arms are an ordered list of patterns."

The scrutinee is not restricted the way an `if` condition is. With `if` the condition must evaluate to a Boolean; the value handed to a `match` can be any type. Order matters, so a catch-all arm has to come last. If a catch-all were placed earlier the later arms would never run, and Rust warns about arms added after one.

The code associated with each arm is an expression, and the value of the matching arm's expression is the value of the whole `match`. That is why `match` shows up on the right of a `let` and as a function's tail so often.

## Binding to the parts

Match arms can bind to the parts of the values that match the pattern, and this is how data comes out of an enum variant. Change `Coin::Quarter` to hold a `UsState`, write `Coin::Quarter(state)` as an arm's pattern, and `state` is bound to the inner value inside that arm's body.

The Reference's `Message` match shows how far the destructuring goes. `Message::Move { x, y: 0 }` matches only the moves whose `y` field is zero while binding `x`. `Message::Move { .. }` catches the rest, where the rest pattern `..` stands in for all remaining fields of a variant, as opposed to `_`, which stands in for a single field. Tuple-variant fields can even be addressed by index in braces, as `Message::ChangeColor { 0: red, 1: green, 2: _ }`. And when destructuring named fields, `fieldname` alone is shorthand for `fieldname: fieldname`.

## Exhaustiveness is a compile error, not a lint

Omitting a case is `error[E0004]: non-exhaustive patterns`, and the diagnostic names the pattern you forgot. Matches in Rust are exhaustive: every last possibility must be exhausted for the code to be valid. The Book ties this straight back to `Option<T>`, where being forced to handle `None` is what makes the billion-dollar mistake impossible. The [[cs/languages/Rust/error-handling-result-and-question-mark|`Result` and `Option`]] note covers what you then do with those cases.

Exhaustiveness does not mean enumerating everything by hand. A named catch-all arm satisfies it: match `3` and `7` as literals and then `other => move_player(other)`, and the last pattern matches all values not specifically listed, which meets the requirement even though a `u8` has 256 of them. When the value is not needed, `_` is a special pattern that matches any value and does not bind to it, so no unused-variable warning fires. When nothing should happen, the unit value `()` is the arm's body.

## Refutability, and why `if let` gives something up

A pattern is refutable when it has the possibility of not being matched by the value it is matched against; irrefutable patterns always match. `let (x, y) = (1, 2)` is irrefutable. `if let (a, 3) = (1, 2)` is refutable and does not match.

That single distinction explains the shape of the whole family. `if let` takes a pattern and an expression separated by `=`, and works the same way as a `match` where the expression is the scrutinee and the pattern is its first arm. It is [[cs/pl/language-overview-syntax-semantics|syntax sugar]] for a `match` that runs code when the value matches one pattern and ignores all other values. The trade is stated plainly in the Book: less typing, less indentation, less boilerplate, but you lose the exhaustive checking that `match` enforces.

`let...else` closes the remaining gap. It takes a pattern on the left and an expression on the right, very similar to `if let`, but has no `if` branch, only an `else` branch. If the pattern matches, it binds the value from the pattern in the outer scope. If it does not match, the program flows into the `else` arm, which must return from the function.

> [!example] The refactor `let...else` exists for
> The Book's `describe_state_quarter` has to get a `UsState` out of a `Coin` or bail. Written with `if let`, one branch produces a value and the other returns from the function entirely, which is awkward to follow. Written as `let Coin::Quarter(state) = coin else { return None; };`, the binding lands in the function body's own scope and the rest of the function proceeds on the happy path with no branch structure at all. Same refutable pattern, different disposal of the failure.

## Binding modes: the `ref` you did not write

The last mechanism is the one that makes matching on references bearable, and it is invisible.

If a binding pattern does not explicitly say `ref`, `ref mut`, or `mut`, it uses the default binding mode. That mode starts in "move" and uses move semantics. The compiler then walks the pattern from the outside inward, and each time a reference is matched using a non-reference pattern, it automatically dereferences the value and updates the mode. References set the default binding mode to `ref`. Mutable references set it to `ref mut`, unless the mode is already `ref`, in which case it stays `ref`. If the dereferenced value is still a reference, the process repeats. Non-reference patterns are all patterns except bindings, wildcards, const patterns of reference types, and reference patterns.

The consequence is the example above: `let x: &Option<i32> = &Some(3); if let Some(y) = x { ... }` gives `y` the type `&i32`, because `y` was converted to `ref y`. You matched a reference with a non-reference pattern and the compiler adjusted.

The ergonomics come with a fence. A binding pattern may explicitly specify `ref` or `ref mut`, or specify mutability with `mut`, only when the default binding mode is "move", so `let [ref x] = &[()];` is an error. A reference pattern may likewise only appear when the mode is "move", so `let [&x] = &[&()];` is an error too. Both restrictions are 2024-edition behavior; before it, bindings could specify `ref`/`ref mut` even when the default mode was not "move", and `mut` on such a binding set the mode back to "move".

> [!warning] Mixing move and reference bindings partially moves the scrutinee
> Move bindings and reference bindings can be mixed in one pattern, and doing so results in a partial move of the object bound to, after which the object cannot be used. This applies only if the type cannot be copied. Bind a `String` field by value out of a struct and both the whole struct and that field are off limits afterward, which is [[cs/languages/Rust/ownership-and-moves|the ordinary move rule]] reaching into pattern syntax.

## Related Notes

- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling: Result, Option, and ?]] - the two enums that make exhaustiveness pay for itself
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - what a by-value binding in a pattern actually does to the scrutinee
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - product and sum types, and matching as their elimination form
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and Algebraic Data Types]] - where `Option<T>` sits in the general theory
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - the reference types that binding modes exist to smooth over

## Sources

- "The `match` Control Flow Construct," The Rust Programming Language. https://doc.rust-lang.org/book/ch06-02-match.html . Supports `match` comparing a value against a series of patterns, the claim that the compiler confirms all possible cases are handled, arm structure and the coin-sorting-machine image, any-type scrutinee versus a Boolean `if` condition, arm bodies being expressions whose value is the match's value, binding to parts of values with the `Coin::Quarter(UsState)` example, `error[E0004]` and the exhaustiveness requirement, the `Option` and billion-dollar-mistake connection, the named catch-all `other` arm and the ordering warning, `_` as a non-binding wildcard, and `()` as an empty arm body.
- "Concise Control Flow with `if let` and `let...else`," The Rust Programming Language. https://doc.rust-lang.org/book/ch06-03-if-let.html . Supports `if let` syntax and its equivalence to a `match` whose first arm is the pattern, the description of `if let` as syntax sugar, the loss of exhaustive checking as the trade, and the `let...else` semantics including outer-scope binding, the mandatory return in `else`, and the `describe_state_quarter` refactor.
- "Patterns," The Rust Reference. https://doc.rust-lang.org/reference/patterns.html . Supports the `Message` enum with variants of differing shapes and its destructuring match, `_` standing in for a single field versus `..` for the remaining fields, the named-field shorthand, the definition of refutable and irrefutable patterns with examples, binding modes including the default "move" mode, outside-in traversal, automatic dereference updating the mode, the `ref`/`ref mut` rules, the non-reference-pattern definition, the `&Option<i32>` example yielding `&i32`, the 2024-edition restrictions on explicit `ref`/`mut` and reference patterns, and partial move when move and reference bindings are mixed.
