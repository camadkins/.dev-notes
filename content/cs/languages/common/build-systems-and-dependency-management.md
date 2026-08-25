---
title: Build Systems and Dependency Management
description: What cargo, pip, and CMake actually guarantee. Version resolution, semantic versioning, lockfiles, and why turning source plus dependencies into a build is a solved-then-unsolved problem.
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-07-22
updated:
aliases: []
---

Between the source you write and the program that runs sits a step every language has to solve and none solves the same way: gather the right versions of every dependency, compile everything in the right order, and produce an artifact. The theory of turning many compilation units into one program is [[cs/pl/modules-signatures-and-separate-compilation|separate compilation and linking]]; a build system is the tool that automates it, and a package manager is the part that decides which code goes in. This note is about what those tools actually promise. It is deliberately the language-and-tooling half of the problem, what `cargo`, `pip`, and `CMake` guarantee about a build; the pipeline half, CI/CD and containers, belongs to [[cs/software-engineering/index|software engineering]].

The reason this is harder than it sounds is that dependencies have dependencies. You ask for two libraries; each pulls in a dozen more; two of those want different versions of the same underlying package. Resolving that into one consistent set is the core problem, and it is where the tools differ.

> [!note] The idea
> A build system answers two questions: which versions of everything do I use, and how do I turn them into an artifact. Version resolution is a constraint-satisfaction problem made tractable by semantic versioning, and reproducibility comes from a lockfile that freezes the answer. The compile step is either a build system or, in C++, a generator that writes one. Each language picks a different point on the tradeoff between "it just works" and "you control everything."

## Resolution: finding one consistent set of versions

The hard part of dependency management is agreement. When many packages each demand version ranges of shared dependencies, the tool must find a single set of concrete versions that satisfies all of them at once. Python's `pip` documents this honestly: determining which version of a dependency to install is dependency resolution, and when an early assumption turns out wrong the resolver backtracks, discarding work and trying another path. Sometimes no consistent set exists at all, and pip's docs name the outcome plainly, "welcome to dependency hell," returning a `ResolutionImpossible` error when one package needs a version another forbids. This is not a pip flaw; it is the shape of the problem, and every package manager, `cargo` and npm included, is solving the same constraint search.

## Semantic versioning: the convention that makes resolution possible

Resolution would be hopeless if any release could break anything. Semantic Versioning is the shared promise that makes the search tractable. Its rule is exact: given `MAJOR.MINOR.PATCH`, you increment MAJOR for incompatible API changes, MINOR for backward-compatible additions, and PATCH for backward-compatible bug fixes. That convention is what lets a package say "I need this dependency at 3.1.0 or later, but below 4.0.0" and trust that any 3.x release stays compatible while 4.0 signals a break. The version number becomes a machine-readable compatibility claim, so the resolver can reason about which upgrades are safe to take automatically and which need a human. SemVer is a social contract enforced by convention, and the whole dependency ecosystem leans on maintainers honoring it.

## Lockfiles: freezing the answer

Resolution decides versions; a lockfile remembers them. As the [[cs/languages/common/software-supply-chain-and-provenance|supply-chain note]] covers, a manifest like `Cargo.toml` states loose ranges, while `Cargo.lock` records the exact resolved versions down to the git SHA so that every build from it is identical. The split is deliberate and universal: the manifest is what you want, the lockfile is what you got, and committing the lockfile is what turns "some compatible set" into "this exact set on every machine." It is the same declared-target-plus-frozen-result shape as the [[cs/languages/common/declarative-models-and-idempotence|declarative configuration]] tools, applied to dependencies.

## The compile step, and C++'s extra layer of indirection

Once the inputs are chosen, something has to compile and link them. Rust's `cargo` and Python's tooling bundle resolution and build into one command, which is why `cargo build` feels like it "just works." C++ carries an extra layer, because it predates unified tooling and must target every platform's native toolchain. `CMake` is not a build system but a build-system generator: you describe the build in `CMakeLists.txt`, and CMake emits native build files, Makefiles, Ninja files, or IDE projects, for whatever platform you are on. One platform-agnostic description becomes many platform-specific builds. The indirection buys portability across every compiler and OS, at the cost of a second concept to learn, and it is a fair emblem of the whole language: more control, more moving parts, closer to the metal.

> [!warning] "It builds on my machine" is a claim about your lockfile
> A build succeeding tells you less than it seems unless the versions were pinned. Without a lockfile, the same manifest can resolve to different dependency sets on different days, so a green build today and a failure tomorrow can come from an upstream release you never touched. The guarantees in this note, reproducibility, safe upgrades, a consistent set, only hold when resolution is frozen. That is why the humble lockfile, not the compiler, is the load-bearing part of a trustworthy build.

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules and Separate Compilation]] - the linking model a build system automates across many compilation units
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - the compiler stages the build step drives
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - lockfiles, reproducible builds, and why the pinned set is a security concern
- [[cs/languages/common/declarative-models-and-idempotence|Declarative Models and Idempotence]] - the same declared-target-with-an-engine shape, applied to configuration instead of dependencies

## Sources

- "Dependency Resolution," pip documentation (PyPA). https://pip.pypa.io/en/stable/topics/dependency-resolution/ . Supports dependency resolution being the process of determining which versions to install, the resolver backtracking when an assumption proves wrong, and "dependency hell" / `ResolutionImpossible` when no consistent set of versions exists.
- "Semantic Versioning 2.0.0," semver.org. https://semver.org/ . Supports the `MAJOR.MINOR.PATCH` scheme, incrementing MAJOR for incompatible API changes, MINOR for backward-compatible additions, PATCH for backward-compatible fixes, and this enabling dependency managers to reason about which upgrades are safe.
- "Cargo.toml vs Cargo.lock," The Cargo Book. https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html . Supports the manifest holding loose version ranges while `Cargo.lock` freezes exact resolved versions for reproducible builds.
- "CMake Tutorial," CMake documentation (Kitware). https://cmake.org/cmake/help/latest/guide/tutorial/index.html . Supports CMake being a cross-platform build-system generator that takes a `CMakeLists.txt` description and emits native build files (Makefiles, Ninja, IDE projects) rather than building directly.
