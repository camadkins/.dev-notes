---
title: "Closures: Fn, FnMut, and FnOnce"
description: The three call traits, the four capture modes they are inferred from, why move does not decide the trait, and the one borrow kind that exists only inside closures.
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-05-19
updated:
aliases: []
---

A closure expression produces a closure value with a unique, anonymous type that cannot be written out. That is the sentence to hang everything else on. You cannot name the type, so you can only refer to it through a trait bound, which means the entire design question becomes: which trait does this particular closure get, and who decided?

The general theory of a closure as code plus captured environment is in [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]]. This note is the Rust specifics.

> [!note] The idea
> The Reference describes a closure type as approximately equivalent to a struct which contains the captured values, with a call trait implemented on it. Once you see it that way, the three traits stop being a taxonomy to memorize and become a consequence of the receiver: `FnOnce` consumes the struct, `FnMut` takes it by mutable reference, `Fn` takes it by shared reference. The non-obvious corollary, and the one people get wrong: `move` does not select the trait. The traits implemented by a closure type are determined by what the closure does with captured values, not how it captures them.

## The three traits, read as receivers

Closure types all implement `FnOnce`, indicating they can be called once by consuming ownership of the closure. Some closures implement more specific call traits on top of that: a closure which does not move out of any captured variables implements `FnMut`, callable by mutable reference; a closure which does not mutate or move out of any captured variables implements `Fn`, callable by shared reference.

The Book states the same hierarchy from the caller's side, and adds the framing that the implementations are additive. `FnOnce` applies to closures that can be called once, and all closures implement at least this trait because all closures can be called. A closure that moves captured values out of its body implements `FnOnce` and none of the others, because it can only be called once. `FnMut` applies to closures that do not move captured values out but might mutate them; these can be called more than once. `Fn` applies to closures that neither move nor mutate captured values, and to closures that capture nothing, which is what makes calling one multiple times concurrently sound.

So the bound a library picks is a statement about its own behavior. `unwrap_or_else` on `Option<T>` is declared `pub fn unwrap_or_else<F>(self, f: F) -> T where F: FnOnce() -> T`, and the Book reads the bound out loud: it expresses the constraint that `unwrap_or_else` will not call `f` more than once. Because all closures implement `FnOnce`, that method accepts all three kinds and is as flexible as it can be. `sort_by_key` takes `FnMut` for the opposite reason, that it calls the closure once for each item in the slice.

## Capture modes are inferred, not declared

A capture mode determines how a place expression from the environment is borrowed or moved into the closure. The Reference lists four: immutable borrow (`ImmBorrow`), unique immutable borrow (`UniqueImmBorrow`), mutable borrow (`MutBorrow`), and move (`ByValue`).

Selection is mechanical. Place expressions are captured from the first mode compatible with how the captured value is used inside the closure body, and the mode is not affected by the code surrounding the closure, such as the lifetimes of involved variables or fields, or of the closure itself. The Book gives the same rule in plainer words: the three ordinary ways map to the three ways a function can take a parameter, borrowing immutably, borrowing mutably, and taking ownership, and the closure decides based on what its body does.

One detail is easy to trip on. Values that implement `Copy` that are moved into the closure are captured with `ImmBorrow`. Copying a `[0; 1024]` array inside a closure body does not capture it by value.

The [[cs/languages/Rust/borrowing-and-lifetimes|borrow rules]] then apply to the capture exactly as they would to a hand-written reference. In the Book's `borrows_mutably` example there is no `println!` between the closure's definition and its call, because the mutable borrow of `list` is live across that span and no other borrows are allowed while a mutable borrow exists.

## `move`, and the reason it exists

`move` before the parameter list forces the closure to take ownership of the values it uses from the environment even when the body does not strictly need ownership. Its main use is passing a closure to [[cs/systems/processes-and-threads|a new thread]] so the data is owned by that thread.

The Book's justification is a lifetime argument, not a convenience argument. `thread::spawn(move || println!("From thread: {list:?}"))` needs `move` even though printing needs only a shared reference, because if the main thread kept ownership of `list` and ended before the spawned thread, dropping `list` would leave the thread holding an invalid reference. The compiler requires the move so the reference stays valid. That is the same reasoning that appears again under [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send and Sync]].

And `move` still does not fix the trait. `move` closures may implement `Fn` or `FnMut` even though they capture by move, because the trait follows the body's use of the captured values rather than the capture mechanism.

> [!example] The closure that only gets `FnOnce`
> The Book tries to count `sort_by_key` calls by pushing a captured `String` named `value` into a `sort_operations` vector on each call. The closure captures `value` and then moves it out by transferring ownership to the vector, so it can be called once and only once, and therefore implements only `FnOnce`. The compiler rejects it with `error[E0507]: cannot move out of 'value', a captured variable in an 'FnMut' closure`. The working version increments a `num_sort_operations` counter instead, capturing a mutable reference and staying callable more than once. The lesson is that "how many times can this run" is a type-level property here, not a discipline the programmer maintains.

## Two corners worth knowing

**Unique immutable borrow.** There is a capture mode that cannot be used anywhere else in the language and cannot be written out explicitly. It arises when a closure modifies the referent of a mutable reference held in a non-`mut` binding: `let x = &mut b;` then `*x = true` inside the closure. Borrowing `x` mutably is impossible because `x` is not `mut`, and borrowing it immutably would make the assignment illegal because a `& &mut` reference might not be unique and so cannot safely be used to modify a value. The compiler's answer is a borrow that is immutable but, like a mutable borrow, must be unique. This is one of the few places where the surface language does not expose a distinction the borrow checker actually tracks.

**Function items satisfy the traits too.** If nothing needs capturing, a function name works wherever an `Fn` trait is expected. `unwrap_or_else(Vec::new)` on an `Option<Vec<T>>` yields an empty vector for `None`, and the compiler automatically implements whichever of the `Fn` traits is applicable for a function definition. In the other direction, non-async non-capturing closures can be coerced to function pointers such as `fn(i32, i32) -> i32` with the matching signature.

## Inference locks in on first use

Closures usually need no type annotations, because unlike a function signature they are not an exposed interface; they are stored in variables and used without being named to a library's users. Within that narrow context the compiler [[cs/pl/hindleymilner-type-inference|infers the parameter and return types]].

The inference is one-shot, not polymorphic. The compiler infers one concrete type for each parameter and for the return value, so `let example_closure = |x| x;` called first with a `String` locks `x` and the return type to `String`, and a subsequent call with an integer is `error[E0308]: mismatched types`. An unannotated closure is not generic. It is a concrete type whose annotations you were allowed to omit.

## Related Notes

- [[cs/languages/Rust/iterators-and-adapters|Iterators and Adapters]] - the largest consumer of closures in the standard library, and where the `FnMut` bound shows up constantly
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - the rules the capture modes are instances of
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds]] - why an unnameable type is still usable, through bounds
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - closures as a general language construct, and the environment they close over
- [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send, Sync, and Fearless Concurrency]] - what `move` into a thread buys, stated as a type rule

## Sources

- "Closures: Anonymous Functions that Capture Their Environment," The Rust Programming Language. https://doc.rust-lang.org/book/ch13-01-closures.html . Supports the three `Fn` traits and their additive definitions, the `unwrap_or_else` signature and its `FnOnce() -> T` bound, `sort_by_key` requiring `FnMut` because it calls the closure once per item, the `FnOnce`-only counting example and its `E0507` error, the counter-based fix, the three ordinary capture modes mapping to parameter passing, the `borrows_mutably` example, `move` and the `thread::spawn` lifetime rationale, function names such as `Vec::new` satisfying the `Fn` traits, closures not requiring annotations, and one-shot inference with the `E0308` example.
- "Closure types," The Rust Reference. https://doc.rust-lang.org/reference/types/closure.html . Supports the unique anonymous type that cannot be written out, the struct-of-captured-values model, the four capture modes including `UniqueImmBorrow`, first-compatible-mode selection independent of surrounding code, `Copy` values captured by `ImmBorrow`, the receiver-based statement of `FnOnce`/`FnMut`/`Fn`, the note that `move` closures may still implement `Fn` or `FnMut`, the unique-immutable-borrow example and its justification, and the coercion of non-capturing closures to function pointers.
