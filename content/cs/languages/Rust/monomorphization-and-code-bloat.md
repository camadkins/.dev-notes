---
title: Monomorphization and Code Bloat
description: "One machine-code copy per instantiation is what buys Rust its zero-cost generics, and the bill arrives as binary size, compile time, and cache pressure."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-24
updated:
aliases:
  - Rust Code Bloat
  - Monomorphization Cost
---

Assembly has no type parameters. Whatever a language does with generics, the machine eventually executes instructions that operate on a fixed layout at a fixed width, so every generic system has to decide when the parameter is discharged. Rust discharges it at compile time, in full, for every combination that the program actually uses. The compiler development guide states the choice plainly: Rust monomorphizes all generic types, meaning the compiler stamps out a different copy of the code of a generic function for each concrete type needed. Use a `Vec<u64>` and a `Vec<String>` and the generated binary contains two copies of the generated code for `Vec`.

> [!note] The idea
> The famous claim that Rust generics are free is a claim about one axis only. Using generic types will not make a program run any slower than concrete types would, because after monomorphization there is no genericity left at runtime to pay for. What the claim conceals is that the cost did not vanish, it moved: it was converted from a per-call runtime tax into a per-instantiation compile-time and space tax. Erasure and reification make the opposite conversion. There is no implementation of generics that avoids paying somewhere, only implementations that choose which resource to spend.

## What the compiler actually emits

The Book's worked example is deliberately small. Two uses of `Option<T>`, one holding an `i32` and one holding an `f64`, cause the compiler to read the values used in `Option<T>` instances, identify the two kinds in play, and expand the generic definition into two definitions specialized to `i32` and `f64`, replacing the generic definition with the specific ones. The output resembles hand-written `Option_i32` and `Option_f64` enums. Because the code that specifies the type in each instance is what gets compiled, no runtime cost is paid for generics, and the running program performs as it would if each definition had been duplicated by hand. That last phrase is the honest one: duplicated by hand is exactly what the binary contains.

The mechanics sit at a specific place in the pipeline. Before the compiler can generate machine code it has to know which concrete instantiations exist, a step called collection, performed by the monomorphization collector. For `fn banana() { peach::<u64>(); }` called from `main`, the collector returns the list `[main, banana, peach::<u64>]`, and those are the functions that will have machine code generated for them. Monomorphization is the first step in the backend, run just before MIR lowering and codegen, which is why a type error in a generic body is caught once at the definition while a codegen cost is paid once per instantiation.

## Where the copies land

Copies are not merely numerous, they are placed in a way that affects incremental rebuilds. After collection the compiler partitions the items into codegen units, and for better incremental build times the partitioner creates two codegen units for each source-level module: one for stable, non-generic code, and one for the more volatile monomorphized instances. The separation is an admission that instantiated code churns more than the code that produced it.

Across crate boundaries the placement is stricter. For a non-generic function in an upstream crate, that function does not appear in any codegen unit of the downstream crate at all. For a generic function, regardless of inlining, all monomorphized instances from the upstream crate appear within a single codegen unit for the downstream crate, and that codegen unit survives even after the post-inlining stage. A generic dependency therefore contributes code to your crate's own compilation output in a way a concrete dependency does not. This is the structural reason a heavily generic library is felt by its consumers rather than absorbed by its author.

## The size bill and the levers against it

The development guide names the tradeoff without hedging: the result is fast programs, but it comes at the cost of compile time, since creating all those copies can take a while, and binary size, since all those copies might take a lot of space.

Binary size is not only a disk concern. Instructions are fetched through the same cache hierarchy as data ([[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]]), so a hot loop calling four instantiations of the same algorithm occupies four times the instruction footprint of one, even though each copy individually runs at the speed the zero-cost claim promises. Speed per call and speed per working set are different quantities, and monomorphization optimizes the first.

The compiler exposes levers that trade the other direction. `-C opt-level=s` optimizes for binary size and `-C opt-level=z` does so more aggressively, with the documented caveat that `z` often results in larger binaries than `s`. Link-time optimization uses whole-program analysis to produce better optimized code at the cost of longer linking time, with `thin` LTO taking substantially less time than `fat` while achieving similar gains. None of these remove instantiations, they compress what the instantiations produced.

The design lever that does remove instantiations belongs to the author, not the flag: hoist the type-independent body of a generic function into a non-generic inner function and keep the generic wrapper thin. Every instantiation then duplicates only the wrapper.

## Priced against the other three implementations

The section's comparison becomes concrete here. [[cs/languages/Java/generics-and-type-erasure|Java erases]] type arguments, so one class file serves every instantiation: minimum code size, no compile-time explosion, and a runtime cost paid in boxing and casts plus a permanent loss of type information. [[cs/languages/CSharp/generic-specialization-and-code-sharing|The CLR reifies]] and then splits the difference, specializing value types while sharing a single native body across all reference types, which recovers most of Rust's speed for the value-type cases without duplicating the reference-type cases. [[cs/languages/Go/generics-implementation-gc-shape-stenciling|Go's GC shape stenciling]] generalizes that idea by keying the copies on memory shape rather than on the type itself, so all pointer-shaped arguments share one stencil and pass a dictionary for what the shape does not determine.

Rust sits at the extreme of that axis on purpose. It has no runtime to consult, no uniform pointer representation to fall back on, and it wants generic code to be inlinable and specializable by LLVM the way hand-written concrete code is. Sharing a body across instantiations would put a dictionary lookup or an indirect call on paths that the language advertises as free. The consequence is that Rust's generics behave like [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]] in the type checker and like macro expansion in the backend, and the cost model belongs to the second half.

> [!tip] The practical read
> When a Rust binary is surprisingly large, the first question is not which crate is big, it is which generic functions have many instantiations. A generic taking a `impl Into<String>` argument, called from thirty places with thirty argument types, is thirty bodies. Interning the parameter at the boundary is a size fix with no runtime cost.

## Related Notes

- [[cs/languages/Rust/generic-code-and-compile-times|Generic Code and Compile Times]] - the other half of the same bill, and the techniques that reduce it
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the cross-language framing of the axis this note prices for Rust
- [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|Trait Objects, Vtables, and Fat Pointers]] - the opt-out, where one body serves every type at the cost of an indirect call
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - why instruction footprint is a performance quantity rather than a storage one
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and Algebraic Data Types]] - the type-theory reading of what generics promise before any compiler decides how to implement them
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - where bounds are checked once at the definition, and what `dyn` costs instead

## Sources

- "Monomorphization," Rust Compiler Development Guide. https://rustc-dev-guide.rust-lang.org/backend/monomorph.html . Supports the stamping of one copy per concrete type, the `Vec<u64>` and `Vec<String>` example, the compile-time and binary-size costs, collection and the monomorphization collector with the `[main, banana, peach::<u64>]` list, monomorphization as the first backend step run just before MIR lowering and codegen, the two-codegen-unit-per-module partition, and the cross-crate behavior of non-generic versus generic functions.
- "Generic Data Types," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-01-syntax.html . Supports the claim that generics impose no runtime slowdown relative to concrete types, the definition of monomorphization, the `Option<T>` expansion into `i32` and `f64` specializations, and the "duplicated each definition by hand" characterization.
- "Codegen Options," The rustc Book. https://doc.rust-lang.org/rustc/codegen-options/index.html . Supports `-C opt-level=s` and `-C opt-level=z` as size-oriented optimization levels with the note that `z` often produces larger binaries than `s`, and the description of fat versus thin LTO as whole-program analysis traded against link time.
