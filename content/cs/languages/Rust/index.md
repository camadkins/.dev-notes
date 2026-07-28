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

Rust-specific study collects here.

### The ownership system

- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves]] - the three rules, move semantics, `Copy`, and the specified drop order at scope exit
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - shared versus mutable borrows, the aliasing rule as both safety and optimization, and what elision does
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - the cases single compile-time ownership cannot express, and interior mutability

### Types and failure

- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds]] - bounds as a compile-time contract, the orphan rule, and static versus dynamic dispatch
- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling: Result, Option, and ?]] - failure in the return type, what `?` desugars to, and when to panic instead

### Read from the comparative layer

The cross-cutting substance lives in the common notes, read from Rust's angle:

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - ownership, borrowing, and `Rc`/`Arc` as Rust's answer
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - `extern "C"`, `#[repr(C)]`, and crossing out of safe Rust
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what `unsafe` actually permits, and the invariants you must uphold
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - serde and the derive-macro approach to encoding

---

*Any pages placed under this folder are auto-listed below by Quartz. See also the [[cs/pl/index|Programming Language Concepts]] theory this builds on.*
