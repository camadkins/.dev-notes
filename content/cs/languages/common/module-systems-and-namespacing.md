---
title: Module Systems and Namespacing
description: "How a language carves up name space and finds the code behind an import. Compile-time trees, textual inclusion, and runtime path search, and what each one costs at build time."
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-06-24
updated:
aliases:
  - Imports and Namespacing
  - How Imports Resolve
---

Two libraries both define `Config`. Somebody has to decide which one you meant, and every language answers with a namespace mechanism plus a resolution rule. The mechanisms look like syntax trivia (`use`, `#include`, `import`) and they are not: the resolution rule determines whether a name collision is a compile error or a runtime surprise, whether your build takes a minute or twenty, and whether two versions of the same library can coexist in one program.

> [!note] The idea
> A module system answers two separate questions and languages often answer them at different times. The first is naming: what is this identifier bound to. The second is location: which file provides that binding. Rust answers both entirely at compile time, from a module tree rooted in the crate. C's textual `#include` answers naming by pasting the file into your translation unit, which is why the same header gets re-parsed in every unit that uses it and why C++ added real modules. Python answers naming at compile time and location at runtime, by searching a mutable list of directories on first import. Resolution timing is the whole story, because a system that resolves at build time can be checked, cached, and versioned, while one that resolves at run time can be shadowed by a stray file in the working directory.

## Rust: one tree, rooted at the crate, private by default

Rust's model is a tree the compiler walks, and none of it touches the filesystem at import sites. Compilation starts at the crate root, usually `src/lib.rs` for a library crate or `src/main.rs` for a binary. A `mod garden;` declaration in that root tells the compiler to look for that module's code in a fixed set of places: inline in braces, in `src/garden.rs`, or in `src/garden/mod.rs`. Submodules follow the same rule one level down, under a directory named for the parent. Once a module is in the tree, anything in it can be named from anywhere in the crate by its path, so an `Asparagus` type in the garden's vegetables module is `crate::garden::vegetables::Asparagus`, subject to privacy.

Two design choices make this more than an organizing convention. First, code within a module is private from its parent modules by default; making a module public takes `pub mod`, and making its items public takes `pub` on each item. Privacy is opt-out, so the public surface of a crate is a deliberate list rather than everything you happened to write. Second, `use` is purely a shortcut: it creates a local alias for a long path within a scope, so writing `use crate::garden::vegetables::Asparagus;` lets you say `Asparagus` afterwards. Importing does not execute anything or search anywhere, which is why the same identifier means the same thing in every build of that crate.

The versioning consequence follows from the unit boundary. Because the crate, not the file, is the unit the compiler and the package manager both work in, a dependency's internal module names cannot collide with yours, and two crates can define `Config` without conflict. That is what makes it tractable for a resolver to have multiple versions of a library present in one dependency graph, discussed in [[cs/languages/common/build-systems-and-dependency-management|build systems and dependency management]].

## C and C++: textual inclusion, and the modules that replace it

Most C++ projects span multiple translation units that need to share declarations and definitions, and headers have been the mechanism for that since C. The mechanism is textual: the preprocessor pastes the header's contents into each unit before the compiler sees them. That gives no namespacing of its own (hence C's convention of prefixing every public symbol with a library-specific tag) and it means the standard library headers you include are recompiled in every translation unit that includes them.

C++20 modules exist to replace that. cppreference describes them as a language feature to share declarations and definitions across translation units, an alternative to some use cases of headers, and, importantly, orthogonal to namespaces. A module unit begins with a module declaration such as `export module helloworld;`, and only declarations marked `export` become visible to importers. Names attached to a named module but not exported have module linkage, which is a genuinely new kind of encapsulation for C++: `f()` in `lib_A` and `f()` in `lib_B` refer to different entities without either being `static` or hidden in a namespace.

The build-time consequence is the point of the feature. Because an import consumes a compiled module interface rather than a stream of tokens, the interface is processed once rather than once per consumer. There is also a preprocessor consequence that shows the seam between the two models: `#include` should not be used inside a module unit outside the global module fragment, because everything included would become part of the module, and importing a header unit differs from including it in that macros already defined at the point of import do not affect how the header is processed. Headers configured by macros therefore still need the global module fragment escape hatch. A module system that inherits a text-substitution ancestor cannot be purely semantic on the first try.

## Python: names at compile time, files at run time

Python's `import fibo` does something subtly different from what people assume. It does not add the module's function names to your namespace; it adds only the module name, and you reach the contents through it as `fibo.fib`. Each module has its own private namespace serving as the global namespace for functions defined in it, so a module author can use module-level globals without clashing with a user's. The `from fibo import fib` variant copies specific names into your namespace and does not bind the module name itself. Statements at module top level are executed only the first time the module name is encountered in an import, which is what makes imports cheap after the first and also what makes import side effects a real category of bug.

Location is resolved at run time. When `spam` is imported, the interpreter first checks built-in modules listed in `sys.builtin_module_names`, and failing that searches for `spam.py` in the directories in `sys.path`, which is initialized from the directory containing the input script (or the current directory), then `PYTHONPATH`, then an installation-dependent default that by convention includes a `site-packages` directory. Programs can modify `sys.path` after initialization. To speed up loading, the compiled version of each module is cached in `__pycache__` as `module.version.pyc`.

> [!warning] Runtime search means a file can shadow a library
> The directory containing the running script is placed at the beginning of the search path, ahead of the standard library path, so a script in that directory is loaded instead of a library module with the same name. The Python docs call this an error unless the replacement is intended. A file named `random.py` next to your program silently becomes the `random` module for that program. No compile-time module system can produce this failure mode, because none of them resolve a name against the current working directory.

## The tradeoff, stated plainly

Compile-time resolution (Rust, and C++ modules) is checkable, cacheable, and lets the build system reason about the dependency graph before anything runs, at the price of a rigid layout and a real toolchain to enforce it. Textual inclusion is trivially simple and composes with anything, at the price of quadratic re-parsing and no encapsulation beyond naming convention. Runtime resolution is maximally flexible, supporting plugins, monkey patching, and paths assembled on the fly, at the price that the identity of an imported module is a property of the environment rather than of the source. Pick by which failure you would rather debug: a build error, a link error, or a wrong module loaded in production.

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the theory of module interfaces and why separate compilation needs them
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - what the module boundary means once versions and resolvers get involved
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - why C++ template definitions have to live in headers, and what that costs
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - name resolution one level down, inside a single file
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - why "which file provided this name" is a security question too

## Sources

- "Defining Modules to Control Scope and Privacy," The Rust Programming Language (official book). https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html . Supports compilation starting at the crate root (`src/lib.rs` or `src/main.rs`), the fixed lookup locations for `mod garden;` and submodules, paths such as `crate::garden::vegetables::Asparagus`, code within a module being private from its parent by default with `pub mod` and `pub` to opt out, and `use` creating a scoped shortcut for a long path.
- "Modules," cppreference.com. https://en.cppreference.com/w/cpp/language/modules.html . Supports headers being the traditional way to share declarations across translation units, modules being a language feature for that purpose and orthogonal to namespaces, `export module` declarations with only exported declarations visible to importers, non-exported names attached to a named module having module linkage (the `lib_A`/`lib_B` `f()` example), `#include` not belonging inside a module unit outside the global module fragment, and header-unit imports ignoring macros defined at the point of import.
- "Modules," The Python Tutorial. https://docs.python.org/3/tutorial/modules.html . Supports `import fibo` binding only the module name, each module having its own private namespace, module-level statements running only on first import, the search order (built-in modules in `sys.builtin_module_names`, then `sys.path` from script directory, `PYTHONPATH`, and the installation default including `site-packages`), `sys.path` being modifiable at runtime, the script directory preceding the standard library path so same-named scripts shadow library modules, and `__pycache__` caching compiled modules.
