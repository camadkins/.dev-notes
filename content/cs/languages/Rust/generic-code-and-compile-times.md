---
title: Generic Code and Compile Times
description: "Why a generic-heavy Rust crate compiles slowly, what the compiler does once per instantiation, and which levers actually reduce the work rather than reshuffle it."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
  - build-systems
date: 2026-07-02
updated:
aliases: []
---

Rust's reputation for slow builds is usually blamed on the borrow checker, which is the wrong suspect. Borrow checking runs on a function body once, in terms of regions, and it does not multiply. The multiplication happens after type checking, in the backend, and it is driven by how many distinct concrete types flow through generic code. A crate with one generic function used at forty types is closer, in backend work, to a crate with forty functions than to a crate with one.

> [!note] The idea
> Rust's front end is roughly proportional to the source you wrote. Its back end is proportional to the source the compiler wrote on your behalf. [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization]] is the multiplier between them, and it fires per crate that instantiates, not per crate that defines. That is why compile time responds so poorly to the intuitive fixes (buy a faster machine, split the file) and so well to the counterintuitive one: change the number of distinct types that reach a generic body.

## What happens once per instantiation

The pipeline gives the shape of the bill. Type checking and borrow checking happen on the generic definition, in terms of the parameter. Then the monomorphization collector runs, just before MIR lowering and codegen, and enumerates the concrete instantiations the program needs. Everything downstream of that point is per instantiation: MIR is monomorphized, LLVM IR is generated, LLVM optimizes it, and machine code is emitted, for every distinct concrete type. The compiler development guide is direct that this is where the time goes, describing monomorphization as fast programs bought at the cost of compile time, since creating all those copies can take a while.

Two consequences follow that are easy to miss.

First, the front end lies about the size of the job. A one-line generic wrapper can generate as much LLVM IR as a large concrete module, because the wrapper is not what gets compiled, its instantiations are. Since monomorphization is the first step of the backend, a crate can finish type checking quickly and then spend the bulk of its build in code generation, which is why front-end timings are a poor proxy for how long a full build will take.

Second, the work does not stay in the crate that wrote the generic. For a non-generic upstream function, the function does not appear in any codegen unit of the downstream crate. For a generic upstream function, regardless of inlining, all monomorphized instances appear within a single codegen unit for the downstream crate, and that unit exists even after the post-inlining stage. A generic-heavy dependency exports work into every consumer's build, once per consumer, forever. This is the compile-time reading of a fact that [[cs/pl/modules-signatures-and-separate-compilation|separate compilation]] normally guarantees against: the promise that a compiled dependency is compiled is only true for its non-generic surface.

## The parallelism that is available, and the parallelism that is not

Inside a crate the compiler splits work into codegen units so LLVM can process them in parallel. The flag documentation states the tradeoff without softening it: increasing parallelism may speed up compile times, but may also produce slower code, and setting `codegen-units=1` may improve the performance of generated code but may be slower to compile. The default is 16 for non-incremental builds and 256 for incremental builds, where the finer split allows caching to be more granular.

Incremental compilation is the other lever the profile controls. It causes rustc to save additional information to disk which is reused when recompiling the crate, improving re-compile times, and the extra information lives in the target directory. Cargo turns it on for the `dev` profile (`incremental = true`, `codegen-units = 256`) and off for `release` (`incremental = false`, `codegen-units = 16`). Notably, incremental compilation is only used for workspace members and path dependencies, so no amount of incremental tuning helps with a registry dependency that must be built from scratch.

Above the crate, parallelism is Cargo's problem, and the crate is the unit it can schedule. Splitting a monolith into several crates gives Cargo independent units to build concurrently and gives incremental compilation smaller blast radii, which is the same argument [[cs/languages/common/build-systems-and-dependency-management|build systems]] make about targets generally. It also has a cost that is specific to Rust: generics and `#[inline]` functions cross the boundary, so the split does not fully insulate the consumer.

## Levers that actually reduce work

Everything above reshuffles or parallelizes the work. Three moves remove it.

**Shrink the generic surface.** Split a generic function into a thin generic shell and a non-generic inner function that does the real work. `fn open<P: AsRef<Path>>(p: P)` becomes a wrapper that calls `fn open_inner(p: &Path)`. Every instantiation then duplicates a conversion and a call rather than the whole body. It is the highest-leverage change available to a library author, because the reduction lands in every downstream crate at once rather than only in the crate that defines the function.

**Erase where erasure is free.** Replacing a generic parameter with `dyn Trait` collapses N instantiations into one body plus an indirect call. On a cold path (argument parsing, setup, error formatting) the dispatch cost is unmeasurable and the codegen saving is real. The judgment is per call site, and it is the same judgment [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|the trait object note]] frames from the runtime side.

**Stop instantiating at many types.** A generic taking `impl Into<String>` or `impl AsRef<str>` and called from thirty sites with thirty argument types produces thirty bodies for what is, semantically, one function. Converting at the boundary and passing a concrete type costs one allocation and removes twenty-nine copies.

> [!warning] Release builds are a separate problem
> `lto = "fat"` performs optimizations across all crates in the dependency graph, and `codegen-units = 1` removes intra-crate parallelism to give LLVM a whole-crate view. Both trade build time for run time deliberately, and both are wrong defaults for the edit-compile-test loop. Configure them on `release` and leave `dev` alone. A team that measures build time on release builds and then optimizes the wrong profile is measuring a number nobody waits on.

The organizational version of this is that generic code is a shared cost, and shared costs need an owner. In a workspace where every crate depends on one heavily generic core crate, the core crate's authors control everyone else's build times without seeing the bill. That asymmetry is exactly what build dashboards in [[cs/software-engineering/continuous-integration|continuous integration]] exist to surface, and it is worth measuring per crate rather than per repository, because the aggregate hides which definition is doing the multiplying.

## Related Notes

- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - the same multiplication, priced in binary size and cache footprint instead of seconds
- [[cs/languages/Rust/cargo-crates-and-the-module-tree|Cargo, Crates, and the Module Tree]] - why the crate, not the file, is the unit that Cargo can schedule and cache
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the general guarantee that generics partially void
- [[cs/software-engineering/continuous-integration|Continuous Integration]] - where build time becomes a team-level cost rather than a personal annoyance
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - caching, incrementality, and dependency graphs across ecosystems
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - the contrast: erasure means one artifact per source class, and the work moves to load time

## Sources

- "Monomorphization," Rust Compiler Development Guide. https://rustc-dev-guide.rust-lang.org/backend/monomorph.html . Supports monomorphization as the first backend step run just before MIR lowering and codegen, the compile-time cost of creating the copies, and the cross-crate rule that non-generic upstream functions appear in no downstream codegen unit while all monomorphized generic instances land in a single downstream codegen unit that survives post-inlining.
- "Codegen Options," The rustc Book. https://doc.rust-lang.org/rustc/codegen-options/index.html . Supports codegen units as the intra-crate parallelism mechanism, the parallelism-versus-code-quality tradeoff, the `codegen-units=1` characterization, the 16 and 256 defaults, and fat LTO performing optimizations across all crates in the dependency graph.
- "Profiles," The Cargo Book. https://doc.rust-lang.org/cargo/reference/profiles.html . Supports incremental compilation saving reusable information to the target directory, its restriction to workspace members and path dependencies, and the default `dev` and `release` profile settings for `incremental`, `codegen-units`, and `lto`.
