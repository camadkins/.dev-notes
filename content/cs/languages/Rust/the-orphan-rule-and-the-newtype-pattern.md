---
title: The Orphan Rule and the Newtype Pattern
description: "Coherence is a global property, which is why the check is local and conservative, and why the newtype escape hatch costs you every method the inner type had."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases:
  - Coherence in Rust
  - Newtype Wrapper
---

The rule everyone learns is that you may implement a trait only if the trait or the type is yours. The rule as written is longer, and the extra length is where the interesting behavior lives. Given `impl<P1..=Pn> Trait<T1..=Tn> for T0`, the implementation is valid if `Trait` is local, or if at least one of `T0..=Tn` is a local type and, taking `Ti` as the first such type, no uncovered type parameters `P1..=Pn` appear in `T0..Ti`.

> [!note] The idea
> Coherence means that for any given trait and type, there is one specific implementation that applies. That is a property of the entire linked program, not of any crate in it, and it cannot be checked where it lives, because no crate can see the whole program. So Rust checks a stricter local condition that implies the global one. Every frustration with the orphan rule follows from that gap: the compiler is rejecting an implementation that would have been fine in your program because it cannot prove it will be fine in every program that includes your crate.

## Why the check has to be conservative

The failure mode is specific and worth stating in terms of when it appears. A trait implementation is incoherent if the orphan rules check fails or if there are overlapping implementations, and two implementations overlap when they can be instantiated with the same type. If orphan implementations, meaning a foreign trait implemented for a foreign type, were freely allowed, two crates could implement the same trait for the same type in incompatible ways, creating a situation where adding or updating a dependency could break compilation.

Notice who suffers. Both crates compile. The conflict exists only in the union, which appears at the moment some third party depends on both, and the person holding the error wrote neither implementation and can fix neither. Rust moves that check backward in time to the crate that can act on it. This is [[cs/pl/modules-signatures-and-separate-compilation|separate compilation]] hitting a property that is not separable: a signature can describe what a module provides, but coherence is a claim about what nobody else provides.

The rule also protects the other direction. It enables library authors to add new implementations to their traits without fear of breaking downstream code. Without it, a library could not add something like `impl<T: Display> MyTrait for T` without potentially conflicting with implementations downstream users had already written. Every trait in [[cs/languages/Rust/traits-and-generic-bounds|the standard library]] that grows a new blanket implementation is relying on this.

## Covered, uncovered, and the fundamental carve-out

The precise rule turns on a distinction RFC 2451 defines. A covered type is one appearing as a parameter to another type: in `Vec<T>`, the `T` is covered, while a bare `T` is uncovered. A blanket implementation is any implementation where a type appears uncovered, so `impl<T> Foo for T` and `impl<T> Bar<T> for Vec<T>` are blanket impls, while `impl<T> Bar<Vec<T>> for Vec<T>` is not, since every `T` in it is covered by `Vec`.

That distinction is what RFC 2451 rebalanced. Before it, `impl From<Foo> for Vec<i32>` was allowed and `impl<T> From<Foo> for Vec<T>` was not, which the RFC argues has no good reason behind it, since allowing the concrete version requires all the same restrictions as the generic one. The primary change was to restrict only the appearance of uncovered type parameters.

Then the carve-out. For the purposes of coherence, fundamental types are special. A fundamental type is one for which you cannot add a blanket implementation backwards compatibly, and the set is `&`, `&mut`, and `Box`. Two rules follow. Any time a type `T` is considered local, `&T`, `&mut T`, and `Box<T>` are also considered local, which is why you may write `impl Trait for &MyType` and why the reference notes that `Box<LocalType>` counts as local. And fundamental types cannot cover other types, so the `T` in `Box<T>` is not considered covered, and a bare type parameter behind a `Box` is still uncovered for the purposes of the rule.

The asymmetry is deliberate. [[cs/languages/Rust/smart-pointers-box-rc-refcell|`Box`]] is granted locality-transparency because no blanket impl over it can ever be added backwards compatibly, so nothing downstream can collide with what you write. `Vec` gets no such treatment, since the standard library could in principle add an impl over it later. The carve-out is a promise about what the language will never do, cashed out as freedom for users.

RFC 2451 also settles a versioning question that follows. It amends the earlier compatibility rules to state that adding any blanket implementation for an existing trait is a major breaking change, and that adding any impl with an uncovered type parameter is likewise major. That is a sharper statement than most crates act on, and it belongs in the same mental file as the other invisible breaks catalogued in [[cs/software-engineering/semantic-versioning|semantic versioning]].

## The newtype workaround, and what it actually costs

The escape hatch is to make the type local. Wrap the foreign type in a tuple struct with one field, and the wrapper is local to your crate, so you may implement the foreign trait on it. Wanting `Display` on `Vec<String>` is the Book's example, blocked because both are foreign, and solved with `struct Wrapper(Vec<String>)` plus `impl fmt::Display for Wrapper`. The name comes from Haskell, and the pattern has no runtime performance penalty, since the wrapper type is elided at compile time.

The cost is not performance, it is interface. `Wrapper` is a new type, so it does not have the methods of the value it holds. Recovering them means implementing every method of the inner type on the wrapper as a delegation to `self.0`, or implementing `Deref` to return the inner type, which hands over every method at once. If you want only some of them, you write only those manually.

Both recovery paths are worse than they look. Manual delegation is a maintenance obligation that grows every time the inner type gains a method. The Book's phrasing about the other path is precise: `Deref` gives the wrapper the methods of the inner type. Trait implementations are not methods, so generic code bounded by a trait the inner type satisfies still rejects the wrapper. And the wrapper is a distinct type at every API boundary, so values crossing into or out of foreign functions need wrapping and unwrapping, free at runtime and noisy in the source.

> [!warning] What newtype cannot buy back
> It cannot make the foreign trait apply to the foreign type. If some other library's function takes `Vec<String>` and internally calls a method from the trait you implemented on your wrapper, your implementation is invisible to it. Newtype creates a new type that satisfies the trait, not a new fact about the old type. When you actually need the foreign type itself to gain behavior, the honest options are upstreaming the implementation or defining your own local trait and implementing it for the foreign type, which the orphan rule permits.

The Book notes the pattern is useful even when traits are not involved, and that is the frame to keep. A newtype around `u64` distinguishing a user id from a byte count buys type safety at zero runtime cost, with the same wrapping noise as its price. The difference is only that there you chose the wrapper and here the compiler chose it for you.

## Related Notes

- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - the basic statement of the rule, and blanket implementations from the user's side
- [[cs/languages/Rust/cargo-crates-and-the-module-tree|Cargo, Crates, and the Module Tree]] - what "local" means, and why the crate is the boundary the rule is written against
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - `Box` as a fundamental type, plus the `Deref` mechanism the newtype workaround leans on
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] - blanket implementations as major breaking changes, and other breaks a signature diff will not show
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - why some properties resist being checked one compilation unit at a time
- [[cs/languages/Rust/specialization-and-why-it-is-still-unstable|Specialization and Why It Is Still Unstable]] - the other half of coherence, where overlapping implementations are the question rather than orphans

## Sources

- "Implementations," The Rust Reference. https://doc.rust-lang.org/reference/items/implementations.html . Supports the definitions of incoherence and overlapping implementations, the orphan rule statement requiring the trait or one type to be local, the definition of an orphan implementation, the two-crates conflict scenario and its dependency-update failure mode, the guarantee that library authors may add implementations without breaking downstream code, the `impl<T: Display> MyTrait for T` example, the formal rule with uncovered type parameters, and the fundamental-type notes that `Box<LocalType>` is local while the `T` in `Box<T>` is not covered.
- "RFC 2451: re-rebalancing coherence," The Rust RFC Book. https://rust-lang.github.io/rfcs/2451-re-rebalancing-coherence.html . Supports coherence meaning one specific implementation applies for any given trait and type, the covered and uncovered type definitions, the blanket-impl definition with examples, the fundamental-type definition covering `&`, `&mut`, and `Box`, the propagation of locality through them, the rule that fundamental types cannot cover other types, the motivating asymmetry between `impl From<Foo> for Vec<i32>` and its generic form, the restriction to uncovered parameters as the primary change, and the amendment making any blanket impl or uncovered-parameter impl a major breaking change.
- "Advanced Traits," The Rust Programming Language. https://doc.rust-lang.org/book/ch20-02-advanced-traits.html . Supports the newtype pattern as a way around the orphan rule, the tuple-struct wrapper being local and therefore implementable, the `Wrapper(Vec<String>)` and `Display` example, the Haskell origin of the term, the absence of a runtime penalty with the wrapper elided at compile time, the loss of the inner type's methods, delegation and `Deref` as the two recovery routes, and the note that the pattern is useful even when traits are not involved.
