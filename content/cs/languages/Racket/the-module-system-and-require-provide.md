---
title: The Module System and require/provide in Racket
description: "Why a Racket module is a static binding structure the compiler can trust, not a runtime table of names."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-02
updated:
aliases:
  - Racket Modules
  - require and provide
---

Each Racket module typically resides in its own file, and a file that starts with `#lang racket` is one module with a name derived from the filename. That much looks like every other language with files and imports. The interesting part is what Racket refuses to let you do afterward, and what it gets in exchange.

> [!note] The idea
> A Racket module is not a namespace object you look things up in at run time. It is a set of bindings resolved during expansion, and the system deliberately forbids the operations that would make it dynamic. An importing module cannot assign to an imported variable, a definition never assigned inside its own module is treated as a constant, and re-declaring a module is generally rejected. Those three prohibitions are one design decision seen from three angles: the module graph is a set of facts fixed before the program runs, so both the human reader and the compiler get to reason from them. The [[cs/languages/common/module-systems-and-namespacing|module systems that treat a module as a mutable dictionary]] buy flexibility by giving exactly this up.

## One file, one module, and paths that behave like URLs

The common organization is the boring one: put module files in a directory, possibly with subdirectories, and have them reference each other through relative paths. Racket normalizes the platform question out of existence here. Unix-style relative paths are used for relative module references on all platforms, much like relative URLs in HTML pages, so `(require "db/lookup.rkt")` means the same thing on Windows as on Linux.

Installed libraries are reached by a different kind of path. A collection is a hierarchical grouping of installed library modules, and a module in a collection is referenced through an unquoted, suffixless path such as `racket/date`. The resolution rules are small and worth knowing because they explain the shapes you see in real code: if the unquoted path contains no slash, `require` automatically adds `/main`, so `(require slideshow)` is equivalent to `(require slideshow/main)`; `require` implicitly adds a `.rkt` suffix; and it then searches the collection directories.

## The longhand form, and the bootstrap problem

`#lang` at the start of a file is a shorthand for a `module` form. The longhand is `(module name-id initial-module-path decl ...)`, where `initial-module-path` is an initial import and each `decl` is an import, export, definition, or expression.

That middle position answers a question most module systems never have to face. If `require` is itself just a binding, where does the first `require` come from? The docs are direct: the `initial-module-path` is needed because even the `require` form must be imported for further use in the module body, and in other words, the initial-module-path import bootstraps the syntax that is available in the body. A module names its own vocabulary as its second sub-form. Once you see that, `#lang` stops looking like a pragma and starts looking like what it is, which is the mechanism [[cs/languages/Racket/languages-as-modules-and-hash-lang|that lets a module serve as a language]].

Declaration is separate from evaluation. Declaring a module does not immediately evaluate the body definitions and expressions of the module; a `require` at the top level both imports bindings and instantiates the module, and later requires do not re-run the body. Inside a module, `require` only introduces bindings.

## provide is an export list, not a visibility keyword

By default all of a module's definitions are private to the module, and `provide` names the ones to be made available. The list is checked for a property that a dictionary-shaped module could not enforce: each identifier can be exported at most once from a module across all the `provide` forms within the module. More precisely, the external name for each export must be distinct, though the same internal binding may be exported several times under different external names via `rename-out`.

This is why `all-defined-out` is discouraged in the Guide's own words. An export list that is computed rather than written stops documenting the interface, and it trains programmers to think definitions can be added freely without consequence.

## The prohibition that pays for itself

Here is the part that separates Racket's modules from an import statement that copies entries out of a table. `set!` on variables defined within a module is limited to the body of the defining module. A module is allowed to change the value of its own definitions, and such changes are visible to importing modules. However, an importing context is not allowed to change the value of an imported binding. Try it and you get `set!: cannot mutate module-required identifier`.

The Guide gives both halves of the payoff. The prohibition on assignment of imported variables helps support modular reasoning about programs: a function that matches against a regexp defined in its own module will keep matching the same thing no matter what any other module does. And for essentially the same reason that it helps programmers, the prohibition on assignment to imports also allows many programs to be executed more efficiently, because [[cs/pl/compilation-vs-interpretation|a compiler that knows a value cannot change]] can inline and constant-fold across the module boundary instead of reloading a cell.

The rule extends inward. When a module contains no assignment to an identifier defined within it, that identifier is a constant that cannot be changed, not even by re-declaring the module. Consequently, re-declaration of a module is not generally allowed. File-based modules dodge the issue because they load on demand and a previously loaded declaration satisfies future requests, but redefining a module in the REPL will fail if it re-defines a previously constant binding. For exploration and debugging purposes, the Racket reflective layer provides a `compile-enforce-module-constants` parameter to turn the enforcement off, which is an admission that the guarantee is a compiler contract rather than a syntactic accident.

> [!warning] Static does not mean sealed
> The static structure is about binding, not about privacy in the security sense. A module can always grant others the ability to change its exports by providing a mutator function. What the system guarantees is that the change goes through a name the module itself chose to export, so [[cs/pl/scoping-binding-and-closures|the binding structure a reader sees in the source]] is the binding structure that runs.

## Submodules, and why they load independently

A `module` form nested inside a module declares a submodule, referenced by the enclosing module through a quoted name. Running a module does not necessarily run its submodules; the enclosing module runs a submodule only if it requires it. When a file is compiled with `raco make`, the outer module's code and a submodule's code can be loaded independently, which is how `main` and `test` submodules avoid costing anything in production. Submodules can be nested within submodules, and a submodule can be referenced directly by a module other than its enclosing module by using a submodule path.

`module*` inverts the direction: a `module`-declared submodule can be required by its enclosing module but cannot require it back, while a `module*`-declared submodule can require its enclosing module. Given `#f` in place of an initial module path, a `module*` submodule sees all of the enclosing module's bindings, including ones never exported, which is the sanctioned way to expose extra bindings to tests without widening the public interface.

## Related Notes

- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - the cross-language comparison this note is one data point in
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the theory of interfaces and what separate compilation requires of them
- [[cs/dsa/hash-tables|Hash Tables]] - the runtime structure a module deliberately is not, and the lookup cost avoided by resolving names early
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - why a fixed module graph is what lets a compiler commit to a decision
- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules]] - macros are exported through the same `provide` machinery as functions
- [[cs/languages/Rust/cargo-crates-and-the-module-tree|Cargo, Crates, and the Module Tree]] - another statically resolved module tree, with the package layer fused in

## Sources

- "6.1 Module Basics," The Racket Guide. https://docs.racket-lang.org/guide/module-basics.html . Supports each module residing in its own file, the relative-path organization, Unix-style relative paths on all platforms, the definition of a collection, and the `/main` and `.rkt` resolution rules for collection paths.
- "6.2 Module Syntax," The Racket Guide. https://docs.racket-lang.org/guide/Module_Syntax.html . Supports `#lang` as shorthand for `module`, the longhand `(module name-id initial-module-path decl ...)` form, the bootstrap role of the initial module path, declaration not triggering evaluation, and the submodule and `module*` behavior including independent loading and the `#f` initial-path case.
- "6.6 Assignment and Redefinition," The Racket Guide. https://docs.racket-lang.org/guide/module-set.html . Supports the `set!` restriction and its error message, the modular-reasoning and efficiency rationales, the constant treatment of unassigned definitions, the general prohibition on re-declaration, and the `compile-enforce-module-constants` escape hatch.
- "6.5 Exports: provide," The Racket Guide. https://docs.racket-lang.org/guide/module-provide.html . Supports definitions being private by default, the at-most-once export rule with distinct external names, `rename-out`, and the argument against `all-defined-out`.
