---
title: Lifetimes as Generic Parameters
description: "A lifetime is declared in the same angle brackets as T and N, it is the only thing in Rust that produces subtyping, and 'static is a bound because it is not a name you are allowed to bind."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-21
updated:
aliases:
  - Rust Variance
  - Why Is 'static a Bound
---

Most people meet `'a` as punctuation the compiler demands and eventually stops demanding. The mental model that follows is that lifetimes are annotations, comments the borrow checker happens to read. The grammar says otherwise. Functions, type aliases, structs, enumerations, unions, traits, and implementations may be parameterized by types, constants, and lifetimes, all three declared in one list, with the order restricted to lifetime parameters first and then type and const parameters intermixed. `struct Ref<'a, T> where T: 'a` has two parameters, not one parameter and a note.

> [!note] The idea
> Treating lifetimes as parameters is not a pedagogical framing, it is the reason Rust has subtyping at all. The reference states the scope precisely: subtyping is restricted to variance with respect to lifetimes and to types with higher-ranked lifetimes, and if lifetimes were erased from types, the only subtyping left would be type equality. Every variance rule in the language exists to answer one question, which is when a longer-lived thing may be used where a shorter-lived thing was expected. Get that wrong in one direction and correct programs stop compiling. Get it wrong in the other and the type system stops preventing [[cs/security/use-after-free-and-heap-exploitation|use-after-free]].

## Subtyping, in the one place it lives

The canonical example is small enough to hold in the head. String literals have `'static` lifetime, and yet a `&'static str` can be assigned to a variable of type `&'a str` inside a function generic over `'a`. Since `'static` outlives `'a`, `&'static str` is a subtype of `&'a str`.

The direction surprises people. The longer lifetime gives the more specific type, so `'static` sits at the bottom of the subtype ordering rather than the top. This is the ordinary [[cs/pl/subtyping-variance-type-constraints|subtyping]] substitution principle applied to a resource: more guarantee is a subtype of less guarantee.

The second case is higher-ranked. Function pointers and trait objects quantified over a lifetime are subtypes of the types obtained by substituting for that higher-ranked lifetime, so `for<'a> fn(&'a i32) -> &'a i32` is a subtype of `fn(&'static i32) -> &'static i32`, and one higher-ranked lifetime may be substituted for another. That case has its own note in [[cs/languages/Rust/higher-ranked-trait-bounds|`for<'a>` bounds]]; what matters here is that both sources of subtyping are lifetimes wearing different hats.

## Variance is a property of the container

Variance is a property that generic types have with respect to their arguments: how the subtyping of a parameter affects the subtyping of the type. `F<T>` is covariant over `T` when `T` being a subtype of `U` implies `F<T>` is a subtype of `F<U>`, contravariant when the implication runs the other way, and invariant when no relation can be derived.

The built-in assignments are worth memorizing because they explain most confusing borrow errors:

| Type | Variance in `'a` | Variance in `T` |
|---|---|---|
| `&'a T` | covariant | covariant |
| `&'a mut T` | covariant | invariant |
| `*const T` | | covariant |
| `*mut T` | | invariant |
| `[T]` and `[T; n]` | | covariant |
| `fn() -> T` | | covariant |
| `fn(T) -> ()` | | contravariant |
| `UnsafeCell<T>` | | invariant |
| `dyn Trait<T> + 'a` | covariant | invariant |

The one that bites is `&'a mut T` being covariant in `'a` and invariant in `T`. Shrinking the borrow is safe, because a shorter loan of the same slot cannot outlive the longer one. Changing what the slot holds is not, because a mutable reference is readable and writable: covariance would let you pass a `&mut Vec<&'static str>` where a `&mut Vec<&'short str>` is expected, write a short-lived reference through it, and then read that reference back out through the original long-lived type. Invariance is what forbids the write and the read from disagreeing.

Contravariance appears exactly once in that table, in function arguments, which is why it rarely comes up outside higher-order code. A function that accepts any lifetime is usable where a function accepting one specific lifetime is required, since it promises less about its input. Readers coming from [[cs/languages/CSharp/variance-in-and-out|`in` and `out` annotations]] will recognize the same in-versus-out reasoning, with the difference that C# makes the programmer declare it per interface parameter while Rust infers it from field types.

That inference is the part worth stating plainly. The variance of a struct, enum, or union is decided by looking at the variance of the types of its fields, and if a parameter is used in positions with different variances, the parameter is invariant. Variance is therefore not something you write, it is something you cause, which is why adding one `UnsafeCell<&'b f64>` field can make a previously flexible type reject callers that used to compile. Outside a struct, enum, or union, the variance for parameters is checked at each location separately, so a lifetime used covariantly in one component of a tuple and invariantly in another may still be shrunk in the covariant position.

## Why `'static` is a bound

Now the question in the title. If lifetimes are parameters, why can you not declare `'static` as one?

Because the reference forbids the name: `'_` and `'static` are not valid lifetime parameter names. `'static` denotes one specific concrete lifetime, the whole program, so it is an argument you may pass, never a parameter you may bind. Everything expressed with it therefore has to be expressed as a constraint on something else, which is what a bound is.

The bound has two forms and they mean different things. `'a: 'b` is read as `'a` outlives `'b`, a relation between two lifetimes. `T: 'a` means that all lifetime parameters of `T` outlive `'a`, a constraint on the borrows a type contains. The reference's examples pin the semantics: with `'a` an unconstrained lifetime parameter, `i32: 'static` and `&'static str: 'a` are satisfied, but `Vec<&'a ()>: 'static` is not.

> [!warning] `T: 'static` does not mean the value lives forever
> It means the type contains no borrow shorter than `'static`. Every owned type satisfies it, which is why `i32: 'static` holds, and a `String` you are about to drop satisfies it too. The bound constrains what a type may borrow from, not how long a particular value survives. Reading it as "must be leaked" is the single most common misreading of a Rust signature, and it turns the sensible bound on a thread spawn into a mystery.

Lifetime bounds are also inferred more aggressively than trait bounds. Bounds required for types to be well-formed are sometimes implied: inside a function taking `x: &'a T`, you may assume `T: 'a` without writing it, because the reference type could not be well-formed otherwise. Only lifetime bounds are implied, though, and trait bounds still have to be explicitly added, which is why `struct IsDebug<T: Debug>(T)` forces every function mentioning it to restate `T: Debug`. The asymmetry is deliberate: the compiler will reconstruct a fact it could have derived from a type's shape, and will not reconstruct a fact that depends on which impls happen to exist.

With all of this in view, [[cs/languages/Rust/borrowing-and-lifetimes|the borrow checker]] reads differently. It is not a separate pass enforcing a side condition, it is the type checker doing ordinary work over a parameter kind whose values are regions of the program.

## Related Notes

- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes in Rust]] - the operational side, where these parameters are inferred and checked
- [[cs/languages/Rust/higher-ranked-trait-bounds|Higher-Ranked Trait Bounds]] - the second source of subtyping, quantified rather than substituted
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the general theory Rust applies to exactly one parameter kind
- [[cs/languages/CSharp/variance-in-and-out|Variance, in and out]] - declared variance in a language with reference subtyping everywhere, for contrast
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - what the invariance of `&mut T` is buying, stated as an attack rather than a rule
- [[cs/languages/Rust/generic-associated-types|Generic Associated Types]] - what becomes expressible once an associated type can take a lifetime parameter of its own

## Sources

- "Generic parameters," The Rust Reference. https://doc.rust-lang.org/reference/items/generics.html . Supports items being parameterizable by types, constants, and lifetimes, the restriction that lifetime parameters come first in the parameter list, and the rule that `'_` and `'static` are not valid lifetime parameter names.
- "Subtyping and Variance," The Rust Reference. https://doc.rust-lang.org/reference/subtyping.html . Supports subtyping being restricted to variance with respect to lifetimes and higher-ranked lifetimes, the collapse to type equality if lifetimes were erased, `&'static str` as a subtype of `&'a str`, the higher-ranked function-pointer and trait-object subtype relations, the definitions of covariance, contravariance, and invariance, the built-in variance table, the derivation of struct variance from field variance with conflicting positions forcing invariance, and per-location variance checking outside composite types.
- "Trait and lifetime bounds," The Rust Reference. https://doc.rust-lang.org/reference/trait-bounds.html . Supports bounds restricting which types and lifetimes may be used as parameters, `'a: 'b` read as `'a` outlives `'b`, `T: 'a` meaning all lifetime parameters of `T` outlive `'a`, the `i32: 'static` and `Vec<&'a ()>: 'static` examples, implied lifetime bounds from well-formedness, and the rule that only lifetime bounds are implied while trait bounds must be explicit.
