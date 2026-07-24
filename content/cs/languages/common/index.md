---
title: Common Concerns
description: The comparative layer. One cross-cutting engineering concern per note, answered several ways across Rust, C++, Python, and Ansible, with the tradeoff named.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-07-22
updated: 2026-07-22
aliases:
  - Cross-Language Concerns
---

Every language that runs on a real machine has to answer the same short list of questions. Who frees the memory? What happens when an operation has no defined meaning? How does a value cross the boundary into code compiled from another language? How does a structure become a sequence of bytes on a wire? The answers differ sharply, and each answer buys something and costs something else.

This cluster takes one such concern per note and reads it across several languages at once. The theory behind each concern already lives in [[cs/pl/index|Programming Language Concepts]]; these notes are about what the theory turns into when it meets a compiler, a linker, and a network. They lean toward the concerns a systems, networking, or security engineer runs into: the machine contract, the wire, and the trust boundary.

### The machine contract

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - manual, RAII, reference counting, and tracing GC as four answers to one question
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - why C is the lingua franca every language speaks at the boundary
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - the standard's silence is the compiler's optimization license
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - turning a struct into bytes without the two ends disagreeing

### Runtime behavior

- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - `Result` and `?` versus exceptions, and the honesty-versus-ergonomics tradeoff
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - the GIL, Rust's `Send`/`Sync`, and where each language puts the data-race problem

### Toolchain and ecosystem

- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - version resolution, semantic versioning, and what a lockfile guarantees
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - lockfiles, reproducible builds, SBOMs, and provenance for code you did not write
- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - desired-state configuration, idempotence, and Ansible's declarative surface over imperative Python

### Planned

The comparative layer is meant to grow. One more note is planned and not yet written:

- Generics in practice (Rust monomorphization vs C++ templates vs Java erasure vs Python duck typing)
