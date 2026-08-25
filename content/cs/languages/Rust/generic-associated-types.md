---
title: Generic Associated Types
description: "GATs let an associated type take its own parameters, which is what the lending iterator needed, and the six and a half years between RFC and stabilization is the interesting part."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-14
updated:
aliases: []
---

An ordinary associated type is a single type chosen by the implementor. `Vec<T>` iterates and its `Item` is `T`, fixed for that implementation, and nothing about the caller can change it. That is exactly the property that makes `Iterator` pleasant, and it is also a ceiling. Some types want to hand out something whose type depends on how long the caller intends to hold it, and a fixed answer cannot express that.

> [!note] The idea
> Generic associated types allow generics (type, lifetime, or const) on associated types. That sounds like a syntactic rounding-out, and the announcement frames it that way, noting that generics were already allowed on freestanding type aliases and on functions in traits so this merely permits them on type aliases in traits. The consequence is larger than the framing. An associated type with a lifetime parameter is a function from a lifetime to a type, which is a type constructor rather than a type, and once a trait can hold one, a method can return something borrowed from `self` whose lifetime is the borrow the caller just made. That single capability is what unlocks the family of APIs that had been waiting on it.

## The lending iterator problem

The canonical example is a trait that looks almost exactly like `Iterator` and behaves completely differently.

```rust
trait LendingIterator {
    type Item<'a> where Self: 'a;
    fn next<'a>(&'a mut self) -> Self::Item<'a>;
}
```

The announcement describes what changed in one sentence: this version of the trait allows the `next` function to return an item that borrows from `self`.

Try to write that with a plain associated type and the failure is instructive. `type Item;` names one type, chosen when the impl is written, with no lifetime in scope to mention. A borrow of `self` inside `next` has a lifetime introduced by the call, and it cannot appear in a type that was fixed earlier. The type simply has nowhere to put the information. This is the same reason `Iterator` implementations that want to yield overlapping views of a buffer end up cloning, yielding indices, or reaching for `unsafe`: the trait's shape forces each yielded item to be independent of the iterator's own borrow state.

The window example is the one the announcement uses. `WindowsMut<'x, T>` holds `&'x mut [T]` and its `Item<'a>` is `&'a mut [T]`, overlapping mutable slices of the same array handed out one at a time. Each item is valid only while the borrow of the iterator lasts, which is precisely the contract [[cs/languages/Rust/lifetimes-as-generic-parameters|a lifetime parameter]] exists to state, and precisely what an ordinary associated type cannot say.

The RFC saw this from the start. Its summary is that it allows type constructors to be associated with traits, calls the feature associated type constructors, and lists streaming iterators and collection traits as the unique-to-Rust use cases for higher-kindedness that it resolves. It also positions itself honestly as an incremental step toward the more general feature commonly called higher-kinded types, without providing the forms of abstraction popular in Haskell. Anyone reading GATs as Rust arriving at [[cs/pl/parametric-polymorphism-adts|full higher-kinded polymorphism]] is reading past the RFC's own scoping.

## Why it took six and a half years

The RFC has a start date of 2016-04-29. GATs became stable in Rust 1.65, and the announcement is blunt about the gap: over six and a half years after the original RFC was opened. Two things account for it, and both are about the machinery underneath rather than the surface syntax.

The first is that GATs stress the borrow checker and the trait solver in combination. The stabilization post enumerates limitations it shipped with. A `for<'a> I::Item<'a>: Debug` bound currently implies that `I::Item<'a>` must outlive `'static`, which is a bug the post calls the most limiting and annoying of the set, and one that requires compiler refactorings that are not a short-term project. A `LendingIterator` version of `filter` fails to borrow-check for a reason the post identifies as a known limitation in the current borrow checker, expected to be solved in a future iteration such as [[cs/languages/Rust/the-borrow-checker-nll-and-polonius|Polonius]]. Shipping a feature whose natural uses trip existing analyses is not a matter of writing the parser.

The second is trait objects. For a trait object to be well-formed it must specify a value for all associated types, which is why `dyn Iterator` is rejected until you write `dyn Iterator<Item = T>`. GATs make the requirement quantified rather than concrete: specifying `Item<'static>` fixes one lifetime, while the well-formed thing to demand is `for<'a> LendingIterator<Item<'a> = &'a str>`, a value for every lifetime. The post says the team has a solid idea of how to implement that in future iterations of the trait solver but that doing it in the current one is more difficult, so traits with GATs are not object safe in the initial stabilization. That is a design constraint traceable straight to how the solver represents obligations, not to anything about GATs as a language feature.

## The where clause you have to write

The rule that surprises users is that a GAT declaration frequently requires a `where Self: 'a` clause on the trait itself. Omit it and the compiler errors with a note that the bound is currently required to ensure that impls have maximum flexibility.

The reasoning is mechanical. For methods that use the GAT, any bounds that can be proven must also be present on the GAT itself. `fn next<'a>(&'a mut self) -> Self::Item<'a>` takes `&'a mut self`, from which `Self: 'a` follows, so the bound is required on `Item`. The constraint exists because clauses cannot be added to associated types in impls that are absent from the trait, so leaving it off the trait would disallow a large set of otherwise reasonable impls. The reference states the same rule in its own vocabulary, that generic associated type declarations may require a list of where clauses depending on the functions in the trait and how the GAT is used, and that these rules may be loosened in the future.

> [!warning] What GATs are not
> They are not a way to make a trait generic over a container. `type Item<'a>` parameterized by a lifetime is the well-supported case, and the stabilization shipped with enough rough edges around quantified bounds that library authors should reach for a GAT when the borrow relationship genuinely requires one, not as a default flourish. The feature earns its place where the alternative is cloning on every yield or writing the same API three times.

The broader lesson is one [[cs/pl/type-systems-goals-guarantees|type system design]] keeps teaching. A feature's cost is not the syntax it adds, it is the interaction surface it opens with every analysis the compiler already runs. GATs are a small extension to what a trait may declare and a large extension to what the solver must prove, and the six and a half years were spent on the second number.

## Related Notes

- [[cs/languages/Rust/associated-types-vs-type-parameters|Associated Types vs Type Parameters]] - the ordinary case, and why the associated position is the determined one
- [[cs/languages/Rust/lifetimes-as-generic-parameters|Lifetimes as Generic Parameters]] - what it means for a type to be parameterized by a region rather than by a type
- [[cs/languages/Rust/higher-ranked-trait-bounds|Higher-Ranked Trait Bounds]] - the `for<'a>` quantifier that GAT bounds need and that the solver finds hard
- [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|Trait Objects, Vtables, and Fat Pointers]] - why every associated type must be pinned down before a `dyn` type is well-formed
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and Algebraic Data Types]] - type constructors, higher kinds, and what GATs deliberately stop short of
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - the general shape of paying for expressiveness in solver complexity

## Sources

- "Generic associated types to be stable in Rust 1.65," The Rust Blog. https://blog.rust-lang.org/2022/10/28/gats-stabilization/ . Supports GATs allowing generics on associated types, the framing that generics were already permitted on freestanding type aliases and trait functions, the `LendingIterator` definition and its ability to return an item borrowing from `self`, the six-and-a-half-year gap since the RFC, the implied `'static` limitation from higher-ranked bounds, the borrow-checker limitation in `filter` and the reference to Polonius, the requirement that a trait object specify all associated types, the non-object-safety of traits with GATs, and the required `where Self: 'a` bound with its rationale.
- "RFC 1598: generic_associated_types," The Rust RFC Book. https://rust-lang.github.io/rfcs/1598-generic_associated_types.html . Supports the 2016-04-29 start date, the summary allowing type constructors to be associated with traits, the name associated type constructors, the positioning as an incremental step toward higher-kinded types, and streaming iterators and collection traits as the motivating use cases.
- "Associated Items," The Rust Reference. https://doc.rust-lang.org/reference/items/associated-items.html . Supports associated types with generic parameters and where clauses being called generic associated types, and the statement that GAT declarations may require where clauses depending on the trait's functions and how the GAT is used.
