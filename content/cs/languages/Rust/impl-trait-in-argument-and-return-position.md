---
title: impl Trait in Argument and Return Position
description: "One keyword, two opposite meanings: in an argument the caller picks the type, in a return the callee does, and the hidden type leaks its auto traits to everyone downstream."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-28
updated:
aliases:
  - APIT and RPIT
  - Abstract Return Types
---

`fn foo(arg: impl Trait)` and `fn bar() -> impl Trait` look like the same feature used twice. They are closer to opposites. The reference names them separately for good reason: the first is an anonymous type parameter, the second is an abstract return type. In the argument, the caller chooses the concrete type and the function knows nothing about it. In the return, the function chooses and the caller knows nothing about it.

> [!note] The idea
> Argument position is universally quantified and return position is existentially quantified, and the direction of the arrow decides who holds the information. That asymmetry is why one of them is pure sugar and the other one is a real feature. `impl Trait` in argument position is syntactic sugar for a generic type parameter like `T: Trait`, except that the type is anonymous and does not appear in the parameter list. `impl Trait` in return position introduces a hidden concrete type that no other syntax can name, and hiding it is the point. The complications that follow, capture rules, auto-trait leakage, and dyn incompatibility, are all consequences of the hidden type being real but unnameable.

## Argument position: sugar with one sharp edge

The two forms are almost equivalent. The caller must provide a type satisfying the declared bounds, and the function can only use the methods available through those bounds. The word doing work is "almost". With a named parameter `T: Trait`, the caller may specify the generic argument explicitly at the call site, as in `foo::<usize>(1)`. With `impl Trait` there is no name to specify. The reference draws the consequence directly: changing a parameter from one form to the other can constitute a breaking change for callers, because it changes the number of generic arguments the function accepts.

That is the first place [[cs/software-engineering/semantic-versioning|semantic versioning]] intersects with this feature, and it catches people who think of the two spellings as interchangeable style. A library that swaps `T: Trait` for `impl Trait` to tidy a signature breaks every caller using a turbofish, in a way the compiler will report at their build rather than yours.

The other consequence, covered in [[cs/languages/Rust/traits-and-generic-bounds|the bounds note]], is that two `impl Trait` parameters are independently chosen types, while two uses of one `T` force the caller to pass the same type twice.

## Return position: naming the unnameable

Return position exists because some types cannot be written down. Closures have a unique, un-writable type, so before this feature the only way to return one was a trait object, `Box<dyn Fn(i32) -> i32>`, which could incur performance penalties from heap allocation and dynamic dispatch. Since it was not possible to fully specify a closure's type and only the `Fn` trait was available, the box was necessary rather than chosen. `fn returns_closure() -> impl Fn(i32) -> i32` returns an unboxed abstract type and avoids those drawbacks.

The same argument applies with more force to [[cs/languages/Rust/iterators-and-adapters|iterator chains]], where the concrete types become very complex, incorporating the types of all previous iterators in the chain. Returning `impl Iterator` exposes only the `Iterator` bound instead of spelling out every adapter type involved.

One rule governs the whole feature: each possible return value from the function must resolve to the same concrete type. Two branches returning two different iterator adapters do not compile, no matter that both implement `Iterator`. The abstract type is one type the caller cannot see, not a choice made per call. When branches genuinely differ, `Box<dyn Trait>` is the tool, and the cost of that choice is priced in the trait object note below.

Because the hidden type is real, it also has to say which generic parameters it may mention. Return-position abstract types automatically capture all in-scope generic parameters, including type, const, and lifetime parameters, higher-ranked ones included. Before the 2024 edition, lifetime parameters not appearing in the bounds of the abstract return type were not automatically captured on free functions and inherent methods, which is one of the quieter edition changes and a common source of confusion when reading older code. A `use<..>` bound gives explicit control: `fn capture<'a, 'b, T>(x: &'a (), y: T) -> impl Sized + use<'a, T>` captures `'a` and `T` only.

## Auto-trait leakage

The design decision with the longest tail is that the abstract type is opaque for named traits and transparent for auto traits. RFC 1522 states it plainly: the type would not be known to implement any other trait, with the exception of auto traits and default traits like `Sized`, and auto traits such as `Send` and `Sync` leak through an abstract return type. That leakage required additional compiler complexity because some non-local type checking becomes necessary.

The leak is a feature for callers and a hazard for authors. A caller can spawn the result of a function returning `impl Iterator` onto another thread if the hidden type happens to be `Send`, without the author having written `Send` anywhere. The RFC's own justification is that a large part of the point of auto traits was to cut across abstraction barriers and provide information about a type without its author explicitly opting in.

The hazard is the mirror image. It has to be considered a silent breaking change to change a function with an abstract return type in a way that removes an auto trait implementation. Add an `Rc` to the closure's captures, or swap a channel for one that is not `Sync`, and downstream code stops compiling with no visible change to your signature. The RFC notes this is not new, since a struct with private fields has the same property, and that the practical mitigation is to add explicit bounds either to the API or to the crate's test suite so the property is asserted somewhere a test can catch. Writing `-> impl Iterator<Item = T> + Send` converts an accident into a contract.

This is where the feature stops being a convenience and starts being an interface-design decision, of the kind [[cs/pl/modules-signatures-and-separate-compilation|abstract types in module signatures]] have always presented: what you hide is not merely unspecified, it is a promise you did not make and may not be able to keep changing.

## What it changed in traits

Functions in traits may also use `impl Trait`, as a syntax for an anonymous associated type. Every `impl Trait` in the return type of an associated function in a trait desugars to an anonymous associated type, and the return type appearing in the implementation's signature determines that type's value. Rust 1.75 shipped support for `async fn` and return-position `impl Trait` in traits, with limitations described in the announcement and expected to be lifted in future releases.

The desugaring explains both the power and the restriction. Since the trait now carries an associated type whose value differs per impl, the compiler can dispatch statically to each implementation's concrete future or iterator with no allocation, which is exactly what [[cs/languages/Rust/async-rust-futures-and-pinning|async traits]] needed. It also explains why such a trait is not usable behind `dyn` without help: a vtable entry needs a fixed return layout, and an anonymous associated type differing per impl does not provide one.

## Related Notes

- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - the bound forms this note builds on, including why two `impl Trait` parameters are not one type
- [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|Trait Objects, Vtables, and Fat Pointers]] - the boxed alternative for when branches must return different types
- [[cs/languages/Rust/async-rust-futures-and-pinning|Async Rust, Futures, and Pinning]] - the unnameable future types that made return-position `impl Trait` in traits urgent
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] - why auto-trait leakage and parameter-form changes are breaking changes that no signature diff reveals
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - abstract types as a general interface tool, and the obligations that come with hiding
- [[cs/languages/Rust/associated-types-vs-type-parameters|Associated Types vs Type Parameters]] - what an anonymous associated type is, spelled out

## Sources

- "Impl trait," The Rust Reference. https://doc.rust-lang.org/reference/types/impl-trait.html . Supports the two positions and their names, `impl Trait` in argument position as sugar for `T: Trait` with an anonymous type absent from the parameter list, the turbofish difference and the resulting breaking change, abstract return types exposing only the named trait, the same-concrete-type rule for all return paths, closures having unique un-writable types and the `Box<dyn Fn>` alternative with its heap allocation and dynamic dispatch, complex iterator chain types, automatic capture of all in-scope generic parameters, the 2024 edition change for lifetimes, the `use<..>` precise-capturing bound, and the desugaring of return-position `impl Trait` in traits to an anonymous associated type.
- "RFC 1522: conservative impl trait," The Rust RFC Book. https://rust-lang.github.io/rfcs/1522-conservative-impl-trait.html . Supports abstract return types not being known to implement other traits except auto traits and defaults like `Sized`, auto traits such as `Send` and `Sync` leaking through, the non-local type checking this requires, the argument that auto traits are meant to cut across abstraction barriers, the classification of removing an auto trait implementation as a silent breaking change, the parallel with structs having private fields, and the mitigation of asserting auto traits with explicit bounds in the API or the test suite.
- "Announcing Rust 1.75.0," The Rust Blog. https://blog.rust-lang.org/2023/12/28/Rust-1.75.0/ . Supports Rust 1.75 supporting `async fn` and return-position `impl Trait` in traits, and the initial release carrying limitations expected to be lifted later.
