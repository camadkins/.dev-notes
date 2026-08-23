---
title: Rust
description: Landing page for Rust. Ownership, zero-cost abstractions, and the unsafe boundary, seen through the cross-language comparative notes.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-07-22
updated: 2026-07-27
aliases: []
---

Rust's defining bet is that memory safety and data-race freedom can be checked at compile time, with no garbage collector and no runtime cost, by making ownership part of the type system. That single decision ripples through every concern below: it is why Rust needs an `unsafe` keyword, why its foreign-function boundary is where the guarantees stop, and why its answer to "who frees the memory" is different in kind from every other language here.

Rust is also this section's monomorphization pole, and the only language here where the generic system carries the safety proof as well as the abstraction. A lifetime is declared in the same angle brackets as a type parameter, which means the borrow checker and the trait solver are working on one system rather than two. The price is paid in compiled output and compile time, and the folder is honest about it. The comparison against erasure, reification, and stenciling lives in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]].

### The ownership system

The foundation. Everything else in the folder assumes these six.

- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves]] - the three rules, move semantics, `Copy`, and the specified drop order at scope exit
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - shared versus mutable borrows, the aliasing rule as both safety and optimization, and what elision does
- [[cs/languages/Rust/the-borrow-checker-nll-and-polonius|The Borrow Checker: NLL and Polonius]] - what the checker actually computes, and what a datalog reformulation is meant to buy
- [[cs/languages/Rust/drop-order-and-raii-in-rust|Drop Order and RAII in Rust]] - where destructors run, what suppresses them, and the leak the language declines to forbid
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - the cases single compile-time ownership cannot express
- [[cs/languages/Rust/interior-mutability-and-the-cell-family|Interior Mutability and the Cell Family]] - `Cell`, `RefCell`, `OnceCell`, and the one primitive the compiler treats as a special case

### Traits and the generic vocabulary

A bound is the starting point, not the whole language. These notes go past `T: Trait` in the order the vocabulary was actually built.

- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds]] - bounds as a compile-time contract, and the static versus dynamic dispatch choice
- [[cs/languages/Rust/associated-types-vs-type-parameters|Associated Types vs Type Parameters]] - an input to impl selection against an output of it, which is why `Iterator` carries an `Item`
- [[cs/languages/Rust/lifetimes-as-generic-parameters|Lifetimes as Generic Parameters]] - the only thing in Rust that produces subtyping, declared in the same brackets as `T`
- [[cs/languages/Rust/const-generics|Const Generics]] - parameterizing by a value rather than a type, and the macro-generated impls it retired
- [[cs/languages/Rust/generic-associated-types|Generic Associated Types]] - an associated type that takes its own parameters, and six and a half years of getting there
- [[cs/languages/Rust/higher-ranked-trait-bounds|Higher-Ranked Trait Bounds]] - what `for<'a>` quantifies over, and the closure that cannot be typed without it
- [[cs/languages/Rust/impl-trait-in-argument-and-return-position|impl Trait in Argument and Return Position]] - one keyword with two opposite meanings, and a hidden type that leaks its auto traits

### What monomorphization costs

The pole, priced.

- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - one machine-code copy per instantiation, billed as binary size and cache pressure
- [[cs/languages/Rust/generic-code-and-compile-times|Generic Code and Compile Times]] - what the compiler redoes per instantiation, and which levers actually reduce the work
- [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|Trait Objects, Vtables, and Fat Pointers]] - the runtime-dispatch alternative, and every dyn-compatibility rule falling out of what fits in the table

### Coherence and the limits

What the system refuses, and why the refusals are load-bearing.

- [[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|The Orphan Rule and the Newtype Pattern]] - a global property enforced by a local, conservative check
- [[cs/languages/Rust/auto-traits-and-negative-reasoning|Auto Traits and Negative Reasoning]] - the only place the compiler treats a missing impl as a fact
- [[cs/languages/Rust/specialization-and-why-it-is-still-unstable|Specialization and Why It Is Still Unstable]] - three innocent crates composing into a dispatch that depends on lifetimes

### Values, patterns, and failure

- [[cs/languages/Rust/pattern-matching-and-enums|Pattern Matching and Enums]] - exhaustiveness as a compile error, refutability, and the binding modes that insert `ref` for you
- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling: Result, Option, and ?]] - failure in the return type, and what `?` desugars to
- [[cs/languages/Rust/panic-unwinding-and-abort|Panic, Unwinding, and Abort]] - a build-time choice, and the precise sense in which a panic is not an exception
- [[cs/languages/Rust/slices-vec-and-capacity|Slices, Vec, and Capacity]] - a pointer and a length, three fields, and a capacity number you can trust
- [[cs/languages/Rust/string-vs-str-and-utf8|String vs str, and the UTF-8 Invariant]] - two string types for the same reason there are two sequence types, and the question indexing cannot answer

### Abstraction without cost

- [[cs/languages/Rust/iterators-and-adapters|Iterators and Adapters]] - one required method, lazy adapters, and the benchmark behind the zero-cost claim
- [[cs/languages/Rust/closures-fn-fnmut-fnonce|Closures: Fn, FnMut, and FnOnce]] - the three call traits, the four capture modes, and why `move` does not pick the trait

### Macros, crates, and the build

- [[cs/languages/Rust/macros-declarative-and-procedural|Macros: Declarative and Procedural]] - mixed-site hygiene, token-stream plugins, and when a generic was the better tool
- [[cs/languages/Rust/cargo-crates-and-the-module-tree|Cargo, Crates, and the Module Tree]] - the crate as the compiler's unit of work, and why feature unification forces features to be additive

### Concurrency and the unsafe boundary

- [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send, Sync, and Fearless Concurrency]] - two marker traits, auto-derived through composition, and the data race they exclude
- [[cs/languages/Rust/async-rust-futures-and-pinning|Async Rust, Futures, and Pinning]] - an inert state machine you poll, and why `Pin` exists at all
- [[cs/languages/Rust/unsafe-rust-and-its-contract|Unsafe Rust and Its Contract]] - the five superpowers, proof obligations created and discharged, and what Miri proves
- [[cs/languages/Rust/ffi-and-the-c-abi-in-rust|FFI and the C ABI in Rust]] - the exact point where the compiler stops proving and starts trusting your declaration

### Read from the comparative layer

The cross-cutting substance lives in the common notes, read from Rust's angle:

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - ownership, borrowing, and `Rc`/`Arc` as Rust's answer
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - `extern "C"`, `#[repr(C)]`, and crossing out of safe Rust
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what `unsafe` actually permits, and the invariants you must uphold
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - serde and the derive-macro approach to encoding

---

*Any pages placed under this folder are auto-listed below by Quartz. See also the [[cs/pl/index|Programming Language Concepts]] theory this builds on.*
