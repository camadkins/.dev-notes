---
title: Specialization and Why It Is Still Unstable
description: "Dispatch cannot depend on lifetimes because lifetimes are gone by codegen, three innocent crates can compose into a specialization that does, and the standard library ships a restricted subset anyway."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-08
updated:
aliases:
  - min_specialization
  - Overlapping Impls
---

Coherence says one implementation applies for a given trait and type, and overlapping implementations are an error. Specialization proposes a controlled exception: let implementations overlap, and when several apply, use the most specific one. The blanket implementation supplies a `default` method, a narrower implementation overrides it, and code that was written once against the general case gets custom treatment where a better version exists.

The motivation is that abstraction currently costs something. The RFC's example is `Extend`, where an implementation knowing only that its argument converts into an iterator must insert elements one at a time by calling `next`, while extending a vector with a slice admits a much more efficient implementation the optimizer is not always capable of producing automatically.

> [!note] The idea
> The blocker is not overlap checking, which the compiler already does. It is that specialization would make dispatch depend on information that no longer exists when dispatch happens. Rust erases lifetimes before code generation, so a rule that picks an implementation based on a lifetime bound is asking the backend to consult something it does not have. The design's answer is to ignore lifetime information during dispatch, which is sound and also means an implementation you wrote can quietly never be selected. That tradeoff, not missing implementation work, is what has kept the feature unstable since the RFC was opened in June 2015.

## What the compiler already does

The machinery exists. A specialization graph is built during coherence checking, which is the pass that looks for overlapping implementations. Inserting an implementation locates its place in the specialization hierarchy, and if there is no right place, meaning partial overlap without containment, you get an overlap error. That error condition is the precise statement of what specialization relaxes and what it does not: overlap is fine when one implementation contains the other, and remains an error when the two merely intersect.

Trait implementation selection can then succeed even when multiple implementations apply, as long as they belong to the same specialization family, returning the most specialized implementation known to apply.

The word "known" carries weight. If there are inference variables in play, the implementation returned by selection may not be the one actually used at codegen time. The compiler therefore takes special care to avoid projecting associated types unless either the associated type does not use `default`, and so cannot be overridden, or all input types are known concretely. Specialization adds a dispatch rule and also weakens what the type checker may conclude mid-inference, which is a cost paid by code that never specializes anything.

## The lifetime problem

The hard constraint is stated in the RFC without hedging: dispatch cannot depend on lifetime information. Specialization based on lifetimes is ruled out on two independent grounds.

It cannot work, because when the compiler generates code, lifetime information has been erased, so there would be no way to know which specializations soundly apply. [[cs/languages/Rust/lifetimes-as-generic-parameters|Lifetimes are generic parameters]] during type checking and nothing at all afterward, which is exactly the property that makes them free at runtime and useless as a dispatch key. The same erasure that makes [[cs/languages/Rust/monomorphization-and-code-bloat|monomorphization]] cheap forecloses this.

It also should not work, because lifetime inference is subtle and would often produce counterintuitive results. The RFC's illustration is that you could easily fail to get `'static` even where it applies, since inference chooses the smallest lifetime satisfying the other constraints. A dispatch rule keyed on inferred lifetimes would make the selected implementation depend on how tightly the inference engine happened to squeeze a region, which is not a property any programmer reasons about.

## Why it cannot simply be forbidden

The obvious response is to reject implementations that dispatch on lifetimes. The RFC shows why that is harder than it looks, using four crates that are individually unremarkable.

A marker crate defines `trait Marker` and implements it for `u32`. A second crate defines `Foo` with a blanket `default` implementation for all `T` and a specialized implementation for `T: Marker`. A third crate defines `struct Bar<T>` and writes `impl<T: 'static> Marker for Bar<T>`, a perfectly ordinary bound. A fourth crate calls `foo` on a `Bar`. Now the relevant specialization depends on the `'static` lifetime, and it got there through a bound that no author of a specialized implementation ever saw.

The RFC's own summary is the point: all of the crates in isolation look perfectly innocent, and the problem arises only when they are plugged together. Lifetime-dependent specialization can hide behind innocent-looking trait bounds that cross crates, so a local check cannot catch it. This is the same shape as the coherence problem in [[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|the orphan rule]], and it resists the same solution, since flagging traits as lifetime-dependent would ripple through every trait that might one day be used in a specialized implementation.

So the design chose the other branch, described as asking forgiveness rather than permission: be maximally permissive about the implementations you can write, and ignore lifetime information during dispatch.

## What ignoring lifetimes feels like

The consequence is visible in five lines. Given a blanket `default` implementation of `Foo` for all `T` and a specialized `impl Foo for &'static str`, calling `foo` on a string literal prints the default. Specialization refuses to consider the second implementation because it imposes lifetime constraints not present in the more general one, and the RFC pairs the behavior with a lint saying a specialization was missed due to lifetime dependence.

Lifetime bounds are still allowed where they are not the basis of the choice. An implementation for `T: 'static` and another for `T: 'static + Clone` specialize cleanly, because all implementations in the family impose the same lifetime constraint and the dispatch happens purely on `Clone`. Naming a lifetime without constraining it is also fine, so specializing on being any reference works regardless of lifetime. The rule is not that lifetimes may not appear, it is that they may not be the difference between two implementations.

> [!warning] Silent dead code
> The failure mode is an implementation that compiles, looks correct, and is never selected. The RFC describes such an implementation as effectively dead code, since dispatching to it would depend on information unavailable at codegen. A specialization keyed on `'static` is the common instance, and it is easy to write while chasing a performance win, easy to test wrongly, and invisible unless the lint fires.

## What the standard library uses anyway

The feature has not shipped, but a fenced subset has. `min_specialization` is documented as a minimal, sound subset of specialization intended to be used by the standard library until the soundness issues with specialization are fixed. That is the state of play: the standard library gets the performance the RFC promised for cases like `Extend` from a slice, users get a stable interface with no `default` keyword in it, and the general feature waits on a resolution to a problem that is genuinely about the boundary between type checking and code generation rather than about syntax.

The lesson generalizes past Rust: a dispatch mechanism can only key on information that survives to the point of dispatch. Rust erases lifetimes while keeping types, which is why its specialization story is split down the middle. That constraint is one [[cs/pl/objects-classes-and-dispatch|dispatch mechanisms]] have always been subject to, and the reason [[cs/pl/type-soundness-progress-preservation|soundness]] arguments care about which phase knows what.

## Related Notes

- [[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|The Orphan Rule and the Newtype Pattern]] - coherence and overlap, the rules specialization asks to relax
- [[cs/languages/Rust/auto-traits-and-negative-reasoning|Auto Traits and Negative Reasoning]] - the one place absence of an implementation is trusted, and why specialization cannot borrow the trick
- [[cs/languages/Rust/lifetimes-as-generic-parameters|Lifetimes as Generic Parameters]] - the parameters that exist during checking and are gone by codegen
- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - what the backend does know, and why type-keyed dispatch is free while lifetime-keyed dispatch is impossible
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - most-specific-wins selection as a general language design question
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress and Preservation]] - what a soundness hole is, stated precisely enough to explain a decade of caution

## Sources

- "RFC 1210: impl specialization," The Rust RFC Book. https://rust-lang.github.io/rfcs/1210-impl-specialization.html . Supports the performance and reuse motivations, the `Extend` example with element-at-a-time insertion versus a slice-specific implementation the optimizer cannot always produce, the hard constraint that dispatch cannot depend on lifetime information, the erasure and inference arguments for why lifetime-based specialization cannot and should not be allowed, the four-crate example in which a `'static` bound produces a hidden lifetime-dependent specialization, the observation that the crates look innocent in isolation, the permissive "ask forgiveness" approach, the `&'static str` example printing the default implementation with a lint, the allowed cases where all implementations share a lifetime constraint or merely name a lifetime, and the characterization of a lifetime-differentiated implementation as dead code.
- "min_specialization," The Unstable Book. https://doc.rust-lang.org/unstable-book/language-features/min-specialization.html . Supports `min_specialization` being a minimal, sound subset of specialization intended for use by the standard library until the soundness issues with specialization are fixed.
- "Specialization," Rust Compiler Development Guide. https://rustc-dev-guide.rust-lang.org/traits/specialization.html . Supports the specialization graph being built during coherence checking, insertion producing an overlap error when there is partial overlap without containment, selection succeeding when multiple implementations of one specialization family apply and returning the most specialized one, and the restriction on projecting associated types when inference variables are present unless the associated type cannot be overridden or all input types are concrete.
