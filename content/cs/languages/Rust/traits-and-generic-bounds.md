---
title: Traits and Generic Bounds in Rust
description: "Defining and implementing traits, bounds as a contract the compiler checks, the orphan rule and why coherence needs it, and the static-versus-dynamic dispatch tradeoff."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-02-17
updated:
aliases:
  - Rust Traits
  - Trait Bounds and dyn
---

A trait defines the functionality a particular type has and can share with other types. The Book notes the resemblance to interfaces in other languages, with some differences, and the differences are where the interesting design sits. The type-theory ancestry (Haskell type classes, the dictionary-passing translation) is in [[cs/pl/type-classes-and-traits|Type Classes and Traits]]. This note is the Rust engineering: what a bound actually promises, what the orphan rule forbids and why, and what changes when you write `dyn`.

> [!note] The idea
> A trait bound is a contract checked once, at the definition site, rather than at every call. In a dynamically typed language, calling an undefined method is a runtime error. Rust moves those errors to compile time, so the generic body needs no runtime behavior check at all, which is how the flexibility of generics comes without the usual price. The corollary is that the moment you erase the concrete type behind `dyn`, that check has to be re-paid as a runtime pointer lookup, and the trait must satisfy an extra set of rules to be eligible at all.

## Defining and implementing

A type's behavior is the set of methods you can call on it, and different types share behavior when the same methods work on all of them. A trait definition groups method signatures together to name a set of behaviors needed to accomplish some purpose.

Methods can carry default implementations, and that is where traits start diverging from a plain interface. A default implementation can call other methods in the same trait even when those other methods have no default. The Book's example defines `summarize_author` as required and `summarize` as a default that calls it, so the trait provides a lot of useful functionality while requiring implementors to specify a small part of it. Overriding a default uses the same syntax as implementing a required method, so adding a default later breaks no existing implementor.

## The orphan rule

The restriction that catches everyone eventually: you can implement a trait on a type only if either the trait or the type, or both, are local to your crate.

Concretely, in an `aggregator` crate you can implement the standard library's `Display` on your own `SocialPost` type, because the type is local. You can implement your own `Summary` trait on `Vec<T>`, because the trait is local. You cannot implement `Display` for `Vec<T>`, because both are defined in the standard library and neither is yours.

This restriction is part of a property called coherence, and more specifically the orphan rule, so named because the parent type is not present. The justification is stated plainly and is worth internalizing: the rule ensures that other people's code cannot break yours and vice versa. Without it, two crates could implement the same trait for the same type, and Rust would not know which implementation to use.

Read the justification carefully and it is an argument about linking, not about style. The ambiguity the Book describes appears only when two crates that each compiled fine are combined, so the conflict surfaces at integration time, in code neither author wrote. The orphan rule pushes the check back to the point where a single author can act on it.

## Bounds: `impl Trait`, `T: Trait`, and `where`

`fn notify(item: &impl Summary)` is the concise form. It is syntax sugar for a longer form known as a trait bound, `fn notify<T: Summary>(item: &T)`, which is more verbose but expresses more. The distinction matters at two parameters: `impl Trait` is appropriate if you want the arguments to be allowed to have different types, while the generic form `fn notify<T: Summary>(item1: &T, item2: &T)` forces both to be the same type.

Multiple bounds combine with `+`, as in `&(impl Summary + Display)` or `<T: Summary + Display>`. Once a signature has several generics with several bounds each, the information piles up between the function name and the parameter list and the signature gets hard to read, which is what the `where` clause exists to relieve.

Two uses of bounds go beyond parameter checking.

**Conditional methods.** An `impl` block can carry its own bounds, so a type gets a method only when its type parameter qualifies. `Pair<T>` always has `new`, but `impl<T: Display + PartialOrd> Pair<T>` gives it `cmp_display` only when the inner type can be compared and printed. The API surface of a generic type becomes a function of its parameter.

**Blanket implementations.** Implementations of a trait on any type satisfying some bound are called blanket implementations, and they are used extensively in the standard library. The canonical one is `impl<T: Display> ToString for T`, which is why `3.to_string()` works: integers implement `Display`, so they get `ToString` for free. Blanket implementations show up in a trait's documentation under the Implementors section.

## Static dispatch and the `dyn` alternative

Generics resolve by monomorphization: the compiler generates nongeneric implementations of functions and methods for each concrete type used in place of a generic parameter. The resulting code does static dispatch, meaning the compiler knows what method you are calling at compile time. The cross-language version of this tradeoff, against type erasure, is in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics: Monomorphization vs Erasure]].

Sometimes you cannot know the types. A GUI `Screen` holding a heterogeneous list of components needs a `Vec<Box<dyn Draw>>`, a vector of trait objects. A trait object is made by specifying a pointer, such as a reference or a `Box<T>`, then the `dyn` keyword, then the trait. Wherever a trait object is used, the type system still ensures at compile time that any value used in that context implements the trait, so you never have to check at runtime whether a value has a method, and code that would fail that check does not compile.

The cost is dynamic dispatch, which is when the compiler cannot tell at compile time which method you are calling and must emit code that figures it out at runtime. Rust uses the pointers inside the trait object to find the method. That lookup has a runtime cost static dispatch does not, and it also prevents the compiler from inlining the method, which in turn blocks some optimizations. The Book's guidance is direct: if you will only ever have homogeneous collections, generics and trait bounds are preferable because the definitions get monomorphized to the concrete types.

## Dyn compatibility: not every trait can be a trait object

There are rules about where dynamic dispatch is allowed, called dyn compatibility, and the Reference spells them out. The concept was formerly known as object safety.

A trait is dyn compatible if all its supertraits are dyn compatible, `Sized` is not a supertrait (it must not require `Self: Sized`), it has no associated constants, and it has no associated types with generics. Every associated function must be either dispatchable from a trait object or explicitly non-dispatchable.

A dispatchable function must have no type parameters (lifetime parameters are fine), must be a method that does not use `Self` except in the receiver type, and must take a receiver of `&Self`, `&mut Self`, `Box<Self>`, `Rc<Self>`, `Arc<Self>`, or `Pin<P>` over one of those. It must not have an opaque return type, which rules out `async fn` (with its hidden `Future` type) and return-position `impl Trait`. The escape hatch is a `where Self: Sized` bound, which marks a function explicitly non-dispatchable: the trait stays dyn compatible and that particular function simply is not callable through the trait object. The `AsyncFn`, `AsyncFnMut`, and `AsyncFnOnce` traits are not dyn-compatible.

Read the list backwards and it is one requirement: a vtable holds one function pointer per method, so anything whose identity is not fixed by the time the vtable is built is excluded. A generic method would need one entry per instantiation. A method returning `Self` would need a return size not known until runtime. The Reference's own comments say exactly this, that the `Self` type is not known until runtime and that generics are not compatible with vtables.

> [!example] Why `fn param(&self, other: Self)` cannot dispatch
> Given `Box<dyn NonDispatchable>`, the receiver's concrete type is hidden. A method taking a second `Self` argument would require the caller to produce a value of that same hidden type, and the Reference's comment names the hole precisely: `other` may be a different concrete type from the receiver. Adding `where Self: Sized` resolves it by removing the method from the trait object's interface rather than from the trait.

## Related Notes

- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - the ad-hoc polymorphism theory, dictionary passing, and how traits relate to type classes
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics: Monomorphization vs Erasure]] - the code-size and dispatch tradeoff read across languages
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - `Copy` and `Drop` as traits whose interaction the compiler enforces
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - why a trait object needs a pointer, and what `Box<dyn Trait>` costs
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - vtables and dynamic dispatch as a general language-implementation mechanism
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - bounded polymorphism as a general idea

## Sources

- "Defining Shared Behavior with Traits," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-02-traits.html . Supports the definition of a trait and its comparison to interfaces, default implementations calling other trait methods, the orphan rule and coherence with the `Display`/`Vec<T>` example and the two-crates rationale, `impl Trait` as sugar for a trait bound, `+` for multiple bounds, `where` clauses, conditional `impl` blocks (`Pair<T>`), blanket implementations including `impl<T: Display> ToString for T`, and the claim that Rust moves method-existence errors to compile time.
- "Using Trait Objects to Abstract over Shared Behavior," The Rust Programming Language. https://doc.rust-lang.org/book/ch18-02-trait-objects.html . Supports trait-object syntax (pointer plus `dyn` plus trait), `Vec<Box<dyn Draw>>` for heterogeneous collections, compile-time checking that values implement the trait, monomorphization producing static dispatch, dynamic dispatch's runtime lookup cost and loss of inlining, and the preference for generics with homogeneous collections.
- "Traits," The Rust Reference. https://doc.rust-lang.org/reference/items/traits.html . Supports the dyn-compatibility rules: supertraits, no `Self: Sized` supertrait, no associated constants, no generic associated types, the dispatchable-function requirements and permitted receiver types, the exclusion of `async fn` and return-position `impl Trait`, the explicit `where Self: Sized` opt-out, `AsyncFn`/`AsyncFnMut`/`AsyncFnOnce` not being dyn-compatible, and the former name "object safety".
