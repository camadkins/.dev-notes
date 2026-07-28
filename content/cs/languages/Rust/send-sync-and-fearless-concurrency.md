---
title: "Send, Sync, and Fearless Concurrency"
description: What the two marker traits actually claim, why they are unsafe and auto-derived at the same time, the exact definition of the data race they exclude, and the race conditions they do not.
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-06-24
updated:
aliases:
  - Send and Sync
  - Rust Thread Safety Traits
---

Most of what Rust offers for concurrency is library code. Channels, `Mutex<T>`, and `Arc<T>` all live in the standard library, and the Book is explicit that almost every concurrency feature in the chapter is part of the standard library rather than the language. Two things are not. `Send` and `Sync` are `std::marker` traits embedded in the language, and they are the reason the library types can be trusted.

> [!note] The idea
> `Send` and `Sync` hold a strange combination of properties. They are unsafe traits, so they are unsafe to implement and other unsafe code is entitled to assume they were implemented correctly. They are also automatically derived, meaning that unlike every other trait, a type composed entirely of `Send` or `Sync` types is itself `Send` or `Sync`. Put those together and you get the actual design: thread safety propagates upward through composition for free, and the only places a human has to think are the leaves where raw pointers or interior mutability enter. The safety of the whole program's concurrency reduces to a handful of hand-audited types.

## What each trait claims

The Nomicon's two-line statement is the one to memorize. A type is `Send` if it is safe to send it to another thread. A type is `Sync` if it is safe to share between threads, and `T` is `Sync` if and only if `&T` is `Send`.

The Book says the same thing operationally. `Send` indicates that ownership of values of the implementing type can be transferred between threads. `Sync` indicates that it is safe for the type to be referenced from multiple threads, which is the same statement as `&T` being `Send`. The biconditional is not decoration; it is what lets one trait be defined entirely in terms of the other, so a checker only has to reason about transfer.

Both are marker traits with no associated items like methods, so "correctly implemented" simply means the type has the intrinsic properties an implementor should have. There is no code to write and nothing to get subtly wrong in a body. What can go wrong is the claim itself: incorrectly implementing `Send` or `Sync` can cause undefined behavior.

## The exceptions are the whole story

Almost all primitives are `Send` and `Sync`, and as a consequence pretty much every type you will interact with is too. The Nomicon lists the major exceptions:

- Raw pointers are neither `Send` nor `Sync`, because they have no safety guards.
- `UnsafeCell` is not `Sync`, and therefore neither are `Cell` and `RefCell`.
- `Rc` is neither `Send` nor `Sync`, because the refcount is shared and unsynchronized.

The Book gives the concrete failure for `Rc<T>`: clone one, transfer the clone to another thread, and both threads might update the reference count at the same time. This is why [[cs/languages/Rust/smart-pointers-box-rc-refcell|`Rc<T>`]] exists for single-threaded situations where you do not want to pay the thread-safe performance penalty, and why `Arc<T>` exists at all. The compiler's message when you try is `the trait Send is not implemented for Rc<Mutex<i32>>`; swapping in `Arc<T>`, which does implement `Send`, compiles. `RefCell<T>` and the `Cell<T>` family do not implement `Sync` because the borrow checking `RefCell<T>` performs at runtime is not thread-safe. `Mutex<T>` does implement `Sync`.

The raw-pointer exclusion is more interesting than it looks. The Nomicon concedes it is strictly speaking more of a lint, since doing anything useful with a raw pointer requires dereferencing it, which is already unsafe. The reason it stands is compositional: keeping raw pointers out prevents types that contain them from being automatically marked thread-safe. Such types have non-trivial untracked ownership, and it is unlikely their author was necessarily thinking hard about thread safety. `Rc` is the example, a type containing a `*mut` that is definitely not thread-safe.

## Escaping the derivation, in both directions

A type not automatically derived can implement the traits directly, and the syntax carries the warning: `unsafe impl Send for MyBox {}`. In the rare case that a type is inappropriately derived as `Send` or `Sync`, the reverse is available too, `impl !Send for SpecialThreadToken {}`, for a type with magic semantics for some synchronization primitive.

The Nomicon then makes a claim that reframes the risk. In and of itself, it is impossible to incorrectly derive `Send` and `Sync`. Only types ascribed special meaning by other unsafe code can cause trouble by being incorrectly `Send` or `Sync`. So the auto-derivation is not a heuristic that might guess wrong; it is sound by construction, and the audit surface is exactly the [[cs/languages/Rust/unsafe-rust-and-its-contract|unsafe code]] that attaches extra meaning to a type.

That is why the abstraction advice works. Most uses of raw pointers should be encapsulated behind an abstraction sufficient for `Send` and `Sync` to be derived, and all of Rust's standard collections are `Send` and `Sync` when they contain `Send` and `Sync` types, in spite of their pervasive use of raw pointers to manage allocations and complex ownership. Most iterators into these collections are `Send` and `Sync` because they largely behave like an `&` or `&mut` into the collection.

## What "data race" means here, precisely

Safe Rust guarantees an absence of data races, and the Nomicon defines one with three conditions: two or more threads concurrently accessing a location of memory, one or more of them being a write, and one or more of them being unsynchronized. A data race has undefined behavior and is therefore impossible to perform in Safe Rust.

The mechanism is worth stating in order, because most descriptions collapse it. Data races are prevented mostly through Rust's ownership system alone, since it is impossible to alias a mutable reference and therefore impossible to perform a data race. Interior mutability makes this more complicated, and that complication is largely why `Send` and `Sync` exist. The traits are not the primary defense. They are the patch that keeps [[cs/languages/Rust/borrowing-and-lifetimes|the aliasing rule]] intact once types that route around it enter the picture.

> [!warning] General race conditions are still "safe"
> Rust does not prevent general race conditions, and the Nomicon calls this mathematically impossible in situations where you do not control the scheduler, which is the normal OS environment. Frameworks such as RTIC, which do control preemption, can prevent them. Consequently it is considered safe for a Rust program to deadlock or do something nonsensical with incorrect synchronization; that is a general race condition or resource race, and Rust cannot prevent all logic errors. A race condition on its own cannot violate memory safety in a Rust program. Only in conjunction with some other unsafe code can it.

The distinction is the honest scope of the marketing phrase. Once the code compiles, the type system and the borrow checker ensure it will not end up with data races or invalid references. Compiling says nothing about whether your locks are taken in a consistent order.

## Related Notes

- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - the interior-mutability types that force `Send` and `Sync` to exist
- [[cs/languages/Rust/unsafe-rust-and-its-contract|Unsafe Rust and Its Contract]] - the code that can make an incorrect `unsafe impl` matter
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - the aliasing rule that does most of the data-race prevention
- [[cs/languages/Rust/closures-fn-fnmut-fnonce|Closures: Fn, FnMut, and FnOnce]] - why `move` is required on a closure handed to `thread::spawn`
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - how other languages handle the same hazard
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models: Threads, Locks, and Actors]] - the model space these traits sit inside

## Sources

- "Send and Sync," The Rustonomicon. https://doc.rust-lang.org/nomicon/send-and-sync.html . Supports the definitions of `Send` and `Sync` including the `T: Sync` iff `&T: Send` biconditional, both being unsafe traits that other unsafe code may assume are correct, marker traits having no associated items, undefined behavior from an incorrect implementation, automatic derivation through composition, the exception list (raw pointers, `UnsafeCell`/`Cell`/`RefCell`, `Rc`), the lint rationale for excluding raw pointers, `unsafe impl` and `impl !Send`, the claim that incorrect derivation is impossible absent other unsafe code, and standard collections and their iterators being `Send`/`Sync`.
- "Extensible Concurrency with Send and Sync," The Rust Programming Language. https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html . Supports most concurrency features living in the standard library while `Send` and `Sync` are `std::marker` traits embedded in the language, the ownership-transfer and multi-thread-reference phrasings, the `Rc<T>` refcount race and its single-threaded rationale, the `the trait Send is not implemented for Rc<Mutex<i32>>` error and the `Arc<T>` fix, `RefCell<T>` and `Cell<T>` not being `Sync` because runtime borrow checking is not thread-safe, `Mutex<T>` being `Sync`, and the type system plus borrow checker preventing data races and invalid references once the code compiles.
- "Data Races and Race Conditions," The Rustonomicon. https://doc.rust-lang.org/nomicon/races.html . Supports the three-part definition of a data race, data races being undefined behavior and impossible in Safe Rust, prevention resting mostly on the ownership system and the impossibility of aliasing a mutable reference, interior mutability as the reason `Send` and `Sync` exist, Rust not preventing general race conditions, the scheduler-control argument and the RTIC example, deadlock being considered safe, and a race condition alone not violating memory safety.
