---
title: "Async Rust, Futures, and Pinning"
description: "A future is an inert state machine you poll, and Pin exists because the compiler builds those state machines out of structs that point at themselves."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-08-04
updated:
aliases: []
---

Async Rust looks like a runtime feature and is almost entirely a type-system feature. There is no built-in executor, no green threads, no scheduler in the standard library. What the language ships is a trait with one method, a marker type that constrains where a value may live, and a compiler transform that turns an `async fn` body into a struct. The awkward parts of the API all trace back to a single fact about that struct.

> [!note] The idea
> `Pin` is not about async. It is about a gap in Rust's model that async happened to expose first. Rust assumes every value is trivially movable, and the borrow checker is built on that assumption. A compiler-generated async state machine violates it, because holding a reference across an `.await` means the struct stores a pointer into itself. `Pin` is the type-system patch that lets a library promise a value will not move without adding a "does not move" concept to the language proper.

## The future as a polled state machine

A future is a value that might not have finished computing yet. The trait is one required associated type and one required method. `poll` attempts to resolve the future into a final value, and does not block if the value is not ready. Instead, the current task is scheduled to be woken up when it is possible to make further progress by polling again, using a `Waker` obtained from the `Context` handed to `poll`. The return is `Poll::Pending` or `Poll::Ready(val)`, and once a future has finished, clients should not poll it again.

The pivotal design word in the documentation is inert. Futures alone are inert; they must be actively polled for the underlying computation to make progress. Nothing runs because you created a future. This is the split that separates Rust from a language where an async call schedules work on an ambient runtime: here, the future is a value describing work, and something else has to drive it. An implementation of `poll` should strive to return quickly and should not block, because whatever thread is driving it is also driving everything else.

What `async fn` compiles to is a state machine. Each `.await` is a suspension point where control returns to the caller with `Pending`, so the generated struct has a variant per suspension point holding exactly the locals that are live across it. The same transform appears in [[cs/languages/CSharp/async-await-and-the-state-machine|C# async methods]] and, in a more general form, in [[cs/pl/coroutines-and-generators|coroutines and generators]]. It is a mechanical translation from a function whose stack frame persists across suspension into a value that carries the frame with it, which is what makes async cheap: no OS stack, just a struct sized at compile time.

## The problem the transform creates

If the source function held a reference to one of its own locals across an `.await`, the generated struct now has a field pointing at another field of the same struct. That is a self-referential type, and Rust has no support for those. The NLL RFC's appendix listed self-referential structs among the limitations it was not fixing, noting that for futures especially this mattered, and the resolution arrived as a library type rather than a language rule.

The reason it is a problem is stated flatly in the `pin` documentation. All values in Rust are trivially movable, which means the address at which a value is located is not necessarily stable in between borrows. When a value is moved, the compiler copies it byte for byte from one location to another, and the compiler is allowed to move a value to a new address without running any code to notify that value that its address has changed. Move a self-referential struct and the internal pointer still points to the old address, not into the new location, and it is now invalid.

There are only two ways to fix this in general. Have the value detect that it moved and fix up its own pointers, which is what C++ move constructors do. Or guarantee that the address does not change while pointers to it are expected to be valid. Rust can move values without notifying them, so the first option is ruled out on the spot. Everything about `Pin` follows from having exactly one option left.

## What `Pin` promises

A value has been pinned when it has been put into a state where it is guaranteed to remain located at the same place in memory from the time it is pinned until its `drop` is called. `Pin<Ptr>` is a pointer wrapper that enforces this by subtraction: it exposes an API that has no safe way to get a `&mut T` out, and moving a value requires a `&mut` to it. Anything that wants to interact with the pinned value in a way that could violate the guarantee must use `unsafe` to mark that the promise is upheld by the user and not the compiler. From the outside, the property that matters is that as long as you do not use `unsafe`, it is impossible to create or misuse a pinned value in a way that is unsound.

This is why `Future::poll` takes `self: Pin<&mut Self>` and not `&mut self`. The signature is the handoff: a future is freely movable when created, becomes address-sensitive the first time it is polled, and every subsequent poll relies on that address being stable. Encoding the transition in the receiver type means the executor cannot get it wrong, and `Pin` living on the pointer rather than the value is what makes the transition expressible at all.

The lifecycle that the `pin` module describes generalizes past async. A value is created and can be freely moved; an operation makes it depend on its own address; further operations use internal `unsafe` that assumes the address is stable; and before invalidation it is dropped, giving it a chance to notify anything holding pointers to it. That last step is a real obligation, and it is why the [[cs/languages/Rust/drop-order-and-raii-in-rust|drop guarantee]] is part of the pinning contract rather than an aside. Intrusive linked lists have the same shape, which is the other example the documentation works through.

> [!warning] `Unpin` is the escape hatch, and it is the common case
> The vast majority of Rust types have no address-sensitive states, and those types implement the `Unpin` auto trait, which cancels the restrictive effects of `Pin` when the pointee is `Unpin`. `Pin<Box<T>>` where `T: Unpin` functions identically to a plain `Box<T>`. Primitives, references, `Box<T>`, and `String` are all `Unpin`. The trait exists to keep an API that requires `Pin` for soundness usable by the many types that do not care, and `Future::poll` is the prime example. The trap is the direction of the negation: a type that relies on pinning for soundness must opt out by adding a `PhantomPinned` field, because the compiler otherwise takes the conservative stance of marking a type `Unpin` when all its fields are. Forget that and your safe-looking type is unsound. The compiler applies the same field-wise auto-derivation to `Send` and `Sync`, treated in [[cs/languages/Rust/send-sync-and-fearless-concurrency|fearless concurrency]].

The whole apparatus is a good illustration of a language solving a problem out of library parts. C++ answered address sensitivity with move constructors, a language feature that runs code on every move. Rust answered it with a wrapper type, an auto trait, and a documented contract, keeping moves free and pushing the cost onto the small number of types that genuinely cannot move. The cost lands as API friction rather than runtime work, and [[cs/pl/continuations-cps|the continuation]] each `.await` implicitly captures stays a compile-time construct.

## Related Notes

- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - the general form of the suspend-and-resume transform an `async fn` gets
- [[cs/languages/CSharp/async-await-and-the-state-machine|async, await, and the State Machine]] - the same compiler transform in a language with a garbage collector and no move problem
- [[cs/languages/Rust/the-borrow-checker-nll-and-polonius|The Borrow Checker: NLL and Polonius]] - where self-referential structs were named as an open limitation
- [[cs/languages/Rust/drop-order-and-raii-in-rust|Drop Order and RAII in Rust]] - the drop step that the pinning contract depends on
- [[cs/pl/continuations-cps|Continuations and CPS]] - what an await point is capturing, stated without the machinery
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models: Threads, Locks, and Actors]] - where polled futures sit among the alternatives

## Sources

- "Future in std::future," Rust standard library documentation. https://doc.rust-lang.org/std/future/trait.Future.html . Supports the definition of a future, the `poll` method and its non-blocking behavior, task wakeup through the `Waker`, the rule against polling a finished future, futures being inert and requiring active polling, and the advice that `poll` return quickly.
- "Module std::pin," Rust standard library documentation. https://doc.rust-lang.org/std/pin/index.html . Supports the definition of moving and pinning, all values being trivially movable with unstable addresses, the compiler moving values without notification, the self-referential-pointer invalidation, async state machines as the key self-referential example, the two options and why fix-up is ruled out, the address-sensitive lifecycle including drop, the unsafe-promise framing and the soundness of safe use, and the `Unpin` auto trait with its `PhantomPinned` opt-out.
- "RFC 2094: Non-lexical lifetimes," The Rust RFC Book. https://rust-lang.github.io/rfcs/2094-nll.html . Supports self-referential structs being listed as a limitation the borrow-checker work did not fix, and futures being called out as a case where it matters.
