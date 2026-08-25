---
title: Higher-Ranked Trait Bounds
description: "What for<'a> quantifies over, why a closure taking a borrow of its caller's local cannot be typed without it, and where the quantifier is allowed to sit."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-04
updated:
aliases:
  - HRTB
---

Most bounds are statements about a type: `T: Clone` says this one type implements this one trait. A higher-ranked bound is a statement about infinitely many. Trait bounds may be higher ranked over lifetimes, and such bounds specify a bound that is true for all lifetimes. The syntax is `for<'a>`, and the Nomicon's reading of it is the right one: `for<'a>` can be read as "for all choices of `'a`", producing an infinite list of trait bounds that the type must satisfy.

> [!note] The idea
> Ordinary generic parameters are chosen by the caller, once, at the call site. A higher-ranked lifetime is chosen by the callee, repeatedly, at every use. That is why the quantifier has to appear in the bound rather than in the function's parameter list: the lifetime being quantified does not exist yet when the function is called, and it will take a different value on each invocation inside the body. `for<'a>` is [[cs/math/predicate-logic-and-quantifiers|universal quantification]] moved inside a type, and moving a quantifier inward is exactly the move that separates a rank-1 type system from a higher-ranked one.

## The problem it solves

The Nomicon builds the motivation from a struct holding a closure.

```rust
struct Closure<F> {
    data: (u8, u16),
    func: F,
}

impl<F> Closure<F> where F: Fn(&(u8, u16)) -> u8 {
    fn call(&self) -> u8 { (self.func)(&self.data) }
}
```

Try to desugar the elided lifetimes and the wheels come off. `call` takes `&'a self` and passes `&self.data`, so `F` is applied to a reference whose lifetime is tied to that borrow. What lifetime should the bound on `F` name? The Nomicon states the obstacle exactly: the lifetime we care about cannot be named until we enter the body of `call`, and it is not a fixed lifetime either, since `call` works with any lifetime `self` happens to have at that point.

There is no lifetime parameter that can be added to the `impl` block to fix this. A parameter on the `impl` would be chosen once, when the type is instantiated, and the requirement is that `F` work for every borrow of `self` that any caller will ever take. The desugaring is therefore a quantifier rather than a parameter:

```rust
impl<F> Closure<F> where for<'a> F: Fn(&'a (u8, u16)) -> u8 { ... }
```

The reference's own minimal case makes the same point in five lines. `fn call_on_ref_zero<F>(f: F) where for<'a> F: Fn(&'a i32)` can call `f(&zero)` on a local, and the note attached to it says why nothing weaker works: only a higher-ranked bound can be used here, because the lifetime of the reference is shorter than any possible lifetime parameter on the function. A borrow of a local created inside the body is strictly shorter than anything the caller could have named, so a caller-chosen `'a` can never be small enough.

This is the general shape of every honest HRTB: a value flows from inside the callee out to a bound the caller supplied. [[cs/languages/Rust/lifetimes-as-generic-parameters|Ordinary lifetime parameters]] flow the other direction, from caller to callee, and that is why they are not enough here.

## Where the quantifier may sit

Two placements are legal and they are not quite the same thing.

```rust
fn call_on_ref_zero<F>(f: F) where for<'a> F: Fn(&'a i32) { }
fn call_on_ref_zero<F>(f: F) where F: for<'a> Fn(&'a i32) { }
```

The reference calls these functions equivalent and identifies the only difference as the scope of the lifetime parameter: written just before the trait, the lifetime extends only to the end of that trait instead of over the whole bound. With one trait in the bound there is nothing to distinguish. With `F: for<'a> Fn(&'a i32) + Send`, the `'a` covers the `Fn` and not the `Send`, which is what you want, since `Send` has nothing to quantify.

Almost nobody writes either form, because the sugar hides it. Writing `F: Fn(&i32)` elides a higher-ranked bound, the same way `&i32` in a function signature elides a lifetime parameter. That is what the Nomicon means by saying there are not many places outside the `Fn` traits where HRTBs are encountered, and that even those have nice magic sugar for the common cases. The syntax becomes visible at the moment the sugar stops covering your case, which is usually when a closure is stored in a struct, passed through a trait, or returned behind a `Box`.

> [!example] When the error tells you to write it
> The situation that sends people looking for `for<'a>` is a closure that borrows through a parameter and is then stored or passed onward, where the compiler complains that the closure's argument lifetime does not match the one the bound requires. Read that as a single concrete lifetime having been fixed for a parameter that needs to be quantified. The fix is a bound of the form `F: for<'a> FnMut(&'a T)` on the function or struct that holds the closure, which changes the requirement from working at one lifetime to working at all of them.

## Quantifiers and subtyping

Higher-ranked types also participate in Rust's other source of subtyping. Higher-ranked function pointers and trait objects are subtypes of the types given by substitutions of the higher-ranked lifetimes, so `for<'a> fn(&'a i32) -> &'a i32` is a subtype of `fn(&'static i32) -> &'static i32`, and one higher-ranked lifetime may be substituted for another, making `for<'a, 'b> fn(&'a i32, &'b i32)` a subtype of `for<'c> fn(&'c i32, &'c i32)`.

The direction is the useful part. A function that works for all lifetimes is usable where a function that works for one specific lifetime is required, which is the substitution principle again: a stronger promise stands in for a weaker one. That is also why the two-lifetime version is a subtype of the one-lifetime version rather than the reverse. Requiring both arguments to share a lifetime is a stronger demand on the caller, so it is the weaker function.

Inference is where the cost appears. Rust asks you to write `for<'a>` instead of discovering it, and quantifier placement is precisely the boundary where inference stops being decidable in the ordinary way, which [[cs/pl/hindleymilner-type-inference|Hindley-Milner inference]] draws in its own terms. The compiler will insert the quantifier for you in the elided cases and will not guess at it in the rest.

Higher-ranked bounds are also where several newer features get hard, which is why the [[cs/languages/Rust/generic-associated-types|generic associated types]] note spends its second half on the trait solver rather than on syntax. Once a bound quantifies, the solver stops checking one obligation and starts reasoning about an infinite family of them, and every analysis downstream of it has to be able to do the same.

## Related Notes

- [[cs/languages/Rust/closures-fn-fnmut-fnonce|Closures: Fn, FnMut, and FnOnce]] - the traits that make HRTBs necessary and then hide them behind sugar
- [[cs/languages/Rust/lifetimes-as-generic-parameters|Lifetimes as Generic Parameters]] - the caller-chosen case, and the variance rules that quantification sits on top of
- [[cs/languages/Rust/generic-associated-types|Generic Associated Types]] - where quantified bounds are load-bearing and still rough
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - what "for all" means, and why the position of the quantifier changes the statement
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner and Type Inference]] - why inference is comfortable with quantifiers on the outside and not on the inside
- [[cs/languages/Rust/impl-trait-in-argument-and-return-position|impl Trait in Argument and Return Position]] - the other place where a bound's position, not its content, decides what it means

## Sources

- "Higher-Rank Trait Bounds," The Rustonomicon. https://doc.rust-lang.org/nomicon/hrtb.html . Supports the `Closure<F>` example, the failed desugaring, the observation that the lifetime cannot be named until the body of `call` is entered and is not fixed, the `for<'a> F: Fn(&'a (u8, u16)) -> u8` desugaring, the reading of `for<'a>` as "for all choices of `'a`" producing an infinite list of bounds, and the remark that HRTBs are rare outside the `Fn` traits and usually hidden by sugar.
- "Trait and lifetime bounds," The Rust Reference. https://doc.rust-lang.org/reference/trait-bounds.html . Supports trait bounds being higher ranked over lifetimes and specifying a bound true for all lifetimes, the `for<'a> &'a T: PartialEq<i32>` example, the `call_on_ref_zero` example with the explanation that the reference's lifetime is shorter than any possible lifetime parameter on the function, and the equivalence of the two quantifier placements differing only in the scope of the lifetime parameter.
- "Subtyping and Variance," The Rust Reference. https://doc.rust-lang.org/reference/subtyping.html . Supports higher-ranked function pointers and trait objects being subtypes of the types given by substitutions of their higher-ranked lifetimes, including the `'static` substitution and the substitution of one higher-ranked lifetime for another.
