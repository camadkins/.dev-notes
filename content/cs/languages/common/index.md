---
title: Common Concerns
description: The comparative layer. One cross-cutting engineering concern per note, answered several ways across Rust, C++, Python, and Ansible, with the tradeoff named.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-07-22
updated: 2026-07-26
aliases:
  - Cross-Language Concerns
---

Every language that runs on a real machine has to answer the same short list of questions. Who frees the memory? What happens when an operation has no defined meaning? How does a value cross the boundary into code compiled from another language? How does a structure become a sequence of bytes on a wire? The answers differ sharply, and each answer buys something and costs something else.

This cluster takes one such concern per note and reads it across several languages at once. The theory behind each concern already lives in [[cs/pl/index|Programming Language Concepts]]; these notes are about what the theory turns into when it meets a compiler, a linker, and a network. They lean toward the concerns a systems, networking, or security engineer runs into: the machine contract, the wire, and the trust boundary.

#### The generics spine

The longest arc here follows one question through eight notes: what happens to a type parameter between the source you write and the machine code that runs. Start with the survey, then take the pieces in order, because each one is a different place the same design decision surfaces.

- [[cs/languages/common/five-answers-to-the-same-question|Five Answers to the Same Question]] - the entry point: erasure, reification, monomorphization, GC-shape stenciling, and a runtime contract, as five shipped answers to one definition
- [[cs/languages/common/constraining-a-type-parameter|Constraining a Type Parameter]] - bounds, where clauses, concepts, type sets, trait bounds, and protocols as eight expressive ceilings on what T may do
- [[cs/languages/common/variance-use-site-versus-declaration-site|Variance, Use Site versus Declaration Site]] - whether the caller or the library author pays for the subtyping rule, and what changes when it is inferred
- [[cs/languages/common/dispatch-vtables-fat-pointers-and-dictionaries|Dispatch, Vtables, Fat Pointers, and Dictionaries]] - where the method table actually lives, inside the object, beside the pointer, or passed in
- [[cs/languages/common/structural-versus-nominal-typing|Structural versus Nominal Typing]] - compatibility by members or by declaration, and why every structural language had to invent narrowing
- [[cs/languages/common/type-level-computation|Type-Level Computation]] - conditional types, templates, phased macros, and const generics as four answers to what a compiler should compute before the program runs
- [[cs/languages/common/runtime-type-information|Runtime Type Information]] - what survives past the compiler, from whole constructed types down to nothing at all
- [[cs/languages/common/what-generics-cost-to-compile|What Generics Cost to Compile]] - the bill for all of the above, paid in compile time and binary size

#### The machine contract

The concerns that exist because the code eventually becomes instructions on a specific machine. Every note here is about a promise the language makes to hardware, an operating system, or another language's compiler.

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - manual, RAII, reference counting, and tracing GC as four answers to one question
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - why C is the lingua franca every language speaks at the boundary
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - the standard's silence is the compiler's optimization license
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - turning a struct into bytes without the two ends disagreeing
- [[cs/languages/common/numeric-types-and-overflow-semantics|Numbers, Overflow, and the Edge of the Type]] - wrapping, trapping, undefined behavior, and arbitrary precision as four contracts at the edge of a type
- [[cs/languages/common/portability-and-cross-compilation|Portability and Cross-Compilation]] - target triples, ABI defaults, and what makes a binary move between platforms

#### Runtime behavior

What the program does once it is running, when an operation fails, when two threads reach the same value, or when the text is not ASCII.

- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - `Result` and `?` versus exceptions, and the honesty-versus-ergonomics tradeoff
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - the GIL, Rust's `Send`/`Sync`, and where each language puts the data-race problem
- [[cs/languages/common/text-encoding-and-unicode|Text Encoding and What a String Actually Is]] - bytes, code points, and grapheme clusters, and which layer each language exposes

#### Compiling and organizing code

How source becomes a unit the compiler and the package manager can both reason about. The first note is the compile-strategy half of the generics spine above.

- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - duplicate per type at compile time, or erase the types and keep one copy
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - compile-time trees, textual inclusion, and runtime path search

#### Toolchain and ecosystem

The concerns that start outside your source tree, where most of the code in a modern program comes from.

- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - version resolution, semantic versioning, and what a lockfile guarantees
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - lockfiles, reproducible builds, SBOMs, and provenance for code you did not write
- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - desired-state configuration, idempotence, and Ansible's declarative surface over imperative Python

The comparative layer is meant to grow. Any concern that several languages must answer, and answer differently, belongs here.
