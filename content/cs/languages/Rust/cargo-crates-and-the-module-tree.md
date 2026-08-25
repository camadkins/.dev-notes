---
title: "Cargo, Crates, and the Module Tree"
description: "The crate as the compiler's unit of work, the module tree inside it, and why feature unification forces features to be additive."
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-07-24
updated:
aliases: []
---

Rust's organizational vocabulary has four words that people use interchangeably and should not: package, crate, module, and path. Getting them apart is worth doing once, because two of them are compiler concepts and two are Cargo concepts, and almost every confusing build error lives on that seam.

> [!note] The idea
> The crate, not the file and not the module, is the compilation unit. A crate is the smallest amount of code that the Rust compiler considers at a time, which means the whole thing is type-checked, monomorphized, and optimized together, and modules inside it are purely a namespacing and privacy device with no separate-compilation consequences at all. That single fact explains the module system's shape, the good cross-module inlining, and the long compile times that come with a big crate.

## Package, crate, module

A crate can come in one of two forms: a binary crate, which compiles to an executable and must have a `main`, or a library crate, which has no `main`, does not compile to an executable, and defines functionality intended to be shared. When people say "crate" they usually mean the second. Every crate has a crate root, a source file the compiler starts from that makes up the root module of the crate. Crates can contain modules, and those modules may be defined in other files that get compiled with the crate.

A package is a bundle of one or more crates providing a set of functionality, described by a `Cargo.toml`. The counting rules are asymmetric and worth memorizing: a package can contain as many binary crates as you like, but at most one library crate, and it must contain at least one crate. Cargo supplies the conventions that connect the two levels. `src/main.rs` is the crate root of a binary crate named after the package, `src/lib.rs` is the crate root of the library crate, and each file in `src/bin` becomes its own binary crate. Cargo passes those crate roots to `rustc`; `rustc` never learns what a package is.

Modules within the crate form a tree rooted at the crate root, and they do two things: they carve the namespace, and they enforce privacy, with items private to their parent module by default and `pub` opening them one level. What they do not do is create a compilation boundary. This is the opposite arrangement from [[cs/pl/modules-signatures-and-separate-compilation|module systems built for separate compilation]], where a module has a signature the compiler can check against independently. Rust puts the compilation boundary at the crate and the interface boundary at the module, which is why splitting a large crate into several crates helps your build times and moving code between modules does not.

## The resolver

One of Cargo's primary tasks is to determine the versions of dependencies to use based on the version requirements specified in each package. That process is called dependency resolution and is performed by the resolver, with the result stored in `Cargo.lock`, which locks the dependencies to specific versions and keeps them fixed over time.

Three policies do most of the work. Cargo generally prefers the highest version currently available. It assumes packages follow [[cs/software-engineering/semantic-versioning|SemVer]] and will unify dependency versions if they are SemVer compatible, and if two compatible versions cannot be unified because of conflicting version requirements, Cargo will error. The unification is not only about disk space: Cargo reuses versions where possible to reduce build times and allow types from common dependencies to be passed between APIs. That second reason is the load-bearing one. Two copies of the same library at different major versions produce two distinct types with the same name, and a value of one cannot be passed to a function expecting the other, which is the error every Rust programmer eventually reads twice before understanding.

Where unification is possible but blocked by conflicting specifications, the resolver backtracks, and errors if no solution is found, rather than selecting multiple versions. It prefers to fail over to quietly duplicating.

## Why features must be additive

Features are the conditional-compilation knobs a package exposes, and their semantics follow from one decision. Features are unique to the package that defines them, so enabling a feature on one package does not enable a same-named feature elsewhere. And when a dependency is used by multiple packages, Cargo will use the union of all features enabled on that dependency when building it, which is what ensures only a single copy of the dependency is used.

Union is the whole story. If your crate depends on `foo`, which enables two features of `winapi`, and on `bar`, which enables two different ones, `winapi` is built with all four. Nobody chose that combination. It is the join of choices made independently by authors who have never met.

A consequence of this is that features should be additive: enabling a feature should not disable functionality, and it should usually be safe to enable any combination of features. A feature should not introduce a SemVer-incompatible change. The rule is not style advice, it is forced by unification, because any feature that removes something can be turned on by a transitive dependency you did not choose and cannot see, breaking your build from three levels down.

The canonical worked example is `no_std`. Do not define a `no_std` feature; define a `std` feature that enables `std`. Both spellings look equivalent to their author and only one survives unification, because the presence of a feature must add capability, never subtract it. Mutually exclusive features are documented as a rare case to be avoided if at all possible, since they require coordinating every use of the package in the dependency graph. When they cannot be avoided, the advice is a `compile_error!` to detect the combination, which is an admission that the type system cannot express the constraint.

> [!warning] Additivity is a monotonicity requirement, not a naming convention
> Read the feature system as a lattice and the rule becomes obvious. Every package computes a set of enabled features, the sets combine by union as you move up the graph, and a build must stay correct as that set grows. A feature that gates additional code is monotone. A feature that switches an implementation, changes a type signature, or removes a method is not, and it will eventually break someone whose only mistake was depending on two crates that both depend on yours. The debugging tool for this is `cargo tree -e features`, which shows which package enabled which feature; the design tool is refusing to write the non-monotone feature in the first place. The same monotonicity discipline shows up wherever independently made choices are merged in a [[cs/languages/common/build-systems-and-dependency-management|build system]].

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the alternative arrangement, where the module is the compilation unit
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - how other languages divide names, files, and units
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] - the contract the resolver assumes every published crate honors
- [[cs/languages/Go/modules-and-the-import-path|Modules and the Import Path]] - minimal version selection as the other answer to the same resolution problem
- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - why the crate being the unit of work costs what it costs
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - what a lockfile is actually pinning, and against what

## Sources

- "Packages and Crates," The Rust Programming Language. https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html . Supports the crate as the smallest amount of code the compiler considers at a time, crates containing modules defined in other files, the binary and library crate forms, the crate root as the compiler's starting file and root module, the package as a bundle of crates described by `Cargo.toml`, and the at-most-one-library and at-least-one-crate rules with the `src/main.rs`, `src/lib.rs`, and `src/bin` conventions.
- "Dependency Resolution," The Cargo Book. https://doc.rust-lang.org/cargo/reference/resolver.html . Supports the resolver's job and name, `Cargo.lock` locking versions over time, preferring the highest available version, the SemVer-compatibility unification rule and the error when compatible versions cannot be unified, the build-time and type-compatibility reasons for reusing versions, and backtracking rather than selecting multiple versions.
- "Features," The Cargo Book. https://doc.rust-lang.org/cargo/reference/features.html . Supports features being unique to their defining package, the union rule for feature unification and its single-copy purpose, the `winapi` four-feature example, the additivity requirement and the prohibition on SemVer-incompatible features, the `std` versus `no_std` guidance, and the treatment of mutually exclusive features including the `compile_error!` workaround.
