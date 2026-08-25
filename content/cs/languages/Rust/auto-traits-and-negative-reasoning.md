---
title: Auto Traits and Negative Reasoning
description: "Send, Sync, Unpin, and the two unwind-safety traits are implemented by absence of objection, which is the only place in Rust where the compiler treats a missing impl as a fact."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-08-15
updated:
aliases: []
---

Rust's trait system is open in a specific sense: any crate may add an implementation, subject to the orphan rule, so the fact that a type does not implement a trait today is never a fact you can build on. It is the absence of evidence, and the next release of some dependency may supply the evidence. That is why you cannot write `where T: !Clone`, and why an impl that fires only when no other impl matches is not expressible.

Five traits are exempt. `Send`, `Sync`, `Unpin`, `UnwindSafe`, and `RefUnwindSafe` are auto traits, and for them the compiler reasons about absence directly.

> [!note] The idea
> An auto trait inverts the default. Instead of holding when someone writes an impl, it holds unless someone objects, with the compiler deriving it structurally from a type's components. That inversion is what makes negative information reliable: whether a struct is `Send` is a function of its own fields rather than of what impls exist anywhere in the program, so it is knowable from the type's definition and stays knowable as the dependency graph grows. The price is that removing an auto trait becomes a change to a type's public contract that no signature shows.

## The derivation rules

If no explicit implementation and no negative implementation is written for an auto trait, the compiler implements it automatically by structural rules. References, raw pointers of both kinds, arrays, and slices implement the trait if their element type does. Function item types and function pointers implement it unconditionally. Structs, enums, unions, and tuples implement it if all of their fields do. Closures implement it if the types of all their captures do, so a closure capturing a `T` by shared reference and a `U` by value implements the auto traits that both `T` and `U` do.

Read that list as a recursion with a base case and one property follows: auto trait membership is decided by the transitive closure of a type's fields, and nothing else about a type can affect it. That is why adding a single field can silently change a public API's threading behavior.

There is one rule that is not purely structural. For generic types, if a generic implementation is available, the compiler does not automatically implement the trait for types that could use that implementation but fail its bounds. The standard library's implementation of `Send` for `&T` where `T` is `Sync` is the example: because that implementation exists, the compiler will not fall back to an automatic `Send` for a reference whose referent is `Send` but not `Sync`. A hand-written implementation displaces the automatic one entirely rather than supplementing it.

## Negative implementations

The other half of the mechanism is explicit refusal. Auto traits can have negative implementations, written `impl !AutoTrait for T` in the standard library documentation, which override the automatic ones. `*mut T` carries a negative implementation of `Send`, so a raw mutable pointer is not `Send` even when its target is.

The restriction that matters is the next sentence in the reference: there is currently no stable way to specify additional negative implementations, and they exist only in the standard library. Ordinary crates therefore have exactly one way to opt a type out of an auto trait, which is to give it a field that is already out. A `PhantomData` holding a raw pointer type is the usual trick, and it works because `PhantomData<T>` is a zero-sized type considered to own a `T` for the purposes of variance, drop check, and auto traits, while raw pointers are neither `Send` nor `Sync`. You cannot say no directly, so you say it by composition.

The nomicon supplies the reason the standard library's exclusions are where they are. Raw pointers are neither `Send` nor `Sync` because they have no safety guards, `UnsafeCell` is not `Sync`, and therefore neither is `Cell` or `RefCell`, and `Rc` is neither `Send` nor `Sync` because its reference count is shared and unsynchronized. `Rc` and `UnsafeCell` are described as fundamentally not thread-safe, since they enable unsynchronized shared mutable state. Raw pointers are a softer case, marked thread-unsafe more as a lint, since doing anything useful with one requires a dereference that is already unsafe.

Those exclusions are the mechanism behind [[cs/languages/Rust/send-sync-and-fearless-concurrency|fearless concurrency]]. `Send` and `Sync` are unsafe traits, so other unsafe code may assume they are correctly implemented, and since they are marker traits with no methods, correct implementation just means having the intrinsic properties an implementor should have. The error you get moving an `Rc` into a thread is not a special case in the thread API, it is the structural derivation failing three types down, and what it prevents is the class of bug catalogued under [[cs/security/race-conditions-and-toctou|race conditions]].

## Why absence is trusted here and nowhere else

The general prohibition on negative reasoning is not squeamishness, it is a consequence of the open world. Coherence guarantees one implementation per trait and type, but nothing guarantees that no implementation will ever be added, so a rule that fires on the absence of an impl would be unstable under exactly the kind of change the [[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|orphan rule]] is designed to make safe. The specialization RFC frames the same tension from the other side when discussing negative bounds as an alternative design: they are fundamentally closed, making some specialization possible up front while not easily supporting downstream crates in specializing further.

Auto traits escape by never depending on the set of impls in the first place. The derivation reads only the type's own components, and the only override lives in the crate that defines the type, or in the standard library. Absence becomes a property of a definition rather than a property of a search, and a property of a definition is stable under linking. Stated as logic, ordinary trait resolution asks whether some implementation exists somewhere, a question whose negation cannot be settled without seeing everywhere. Auto trait resolution asks a question about a finite tree of fields, whose negation is settled by inspection, which is the same reason [[cs/math/predicate-logic-and-quantifiers|a bounded quantifier]] can be negated when an unbounded one cannot.

> [!warning] The consequence for library authors
> An auto trait is part of your public interface even though you never wrote it. Adding an `Rc` to a private field of a public struct removes `Send` and breaks every downstream caller who sent the type across a thread boundary, with no change to any signature. Auto traits may also be added as an extra bound on a trait object, so `Box<dyn Error + Send>` is legal even though a trait object normally admits only one trait, which puts the property directly into downstream signatures. The defensive move is asserting the bound in your own test suite, since that is the only way to notice when it disappears.

`Unpin` belongs to the same family and catches people out for the opposite reason: nearly everything is `Unpin` automatically, and the types that are not, chiefly self-referential generated futures, are the ones [[cs/languages/Rust/async-rust-futures-and-pinning|pinning]] exists to protect. The auto trait is doing the same job there as it does for threads, which is to carry an unstated structural property outward through every generic that touches the type.

## Related Notes

- [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send, Sync, and Fearless Concurrency]] - what the two thread-related auto traits mean and how the standard library uses them
- [[cs/languages/Rust/interior-mutability-and-the-cell-family|Interior Mutability and the Cell Family]] - `UnsafeCell` as the type whose non-`Sync` status propagates everywhere
- [[cs/languages/Rust/async-rust-futures-and-pinning|Async Rust, Futures, and Pinning]] - `Unpin` as the auto trait that decides whether a value may be moved after being pinned
- [[cs/languages/Rust/specialization-and-why-it-is-still-unstable|Specialization and Why It Is Still Unstable]] - the feature that wants negative reasoning and cannot have it
- [[cs/security/race-conditions-and-toctou|Race Conditions and TOCTOU]] - the bug class the derivation is preventing at compile time
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - why negating a claim over an open domain is a different act from negating one over a closed one

## Sources

- "Special types and traits," The Rust Reference. https://doc.rust-lang.org/reference/special-types-and-traits.html . Supports the list of auto traits, the automatic implementation rules for references, pointers, arrays, slices, function items and pointers, aggregates, and closures, the generic-implementation exception with the `Send` for `&T` where `T: Sync` example, negative implementations written `impl !AutoTrait for T` with `*mut T` as an instance, the absence of any stable way to add negative implementations outside the standard library, `PhantomData<T>` counting as owning a `T` for auto trait purposes, and auto traits being addable as an extra bound on a trait object.
- "Send and Sync," The Rustonomicon. https://doc.rust-lang.org/nomicon/send-and-sync.html . Supports `Send` and `Sync` as unsafe marker traits whose correct implementation means having the intrinsic properties, the automatic derivation for types composed of `Send` or `Sync` types, and the exception list covering raw pointers, `UnsafeCell` with `Cell` and `RefCell`, and `Rc` with its unsynchronized reference count, including the note that raw pointers are marked thread-unsafe more as a lint.
- "RFC 1210: impl specialization," The Rust RFC Book. https://rust-lang.github.io/rfcs/1210-impl-specialization.html . Supports the characterization of negative bounds as fundamentally closed, permitting specialization decided up front while not easily supporting downstream crates in specializing further.
