---
title: "Macros: Declarative and Procedural"
description: "macro_rules pattern matching with mixed-site hygiene, procedural macros as compiler plugins over token streams, and when a generic would have been the better tool."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-18
updated:
aliases:
  - macro_rules
  - Procedural Macros
---

Rust has two macro systems that share a name and almost nothing else. One is a pattern-matching rewriter with its own miniature grammar, run by the compiler over your syntax. The other is an arbitrary Rust program that the compiler loads and calls during your build. They solve overlapping problems and they fail in opposite ways, which is the useful thing to know about them.

> [!note] The idea
> The dividing line is not power, it is what the macro can see. A declarative macro sees a fixed set of syntactic fragment kinds and gets hygiene applied to it by the expander. A procedural macro sees an undifferentiated token stream and gets nothing applied to it at all. Choosing between them is choosing whether you want the compiler to protect you from name capture, and the price of that protection is that you can only match shapes the fragment grammar can name. Neither is a substitute for [[cs/languages/Rust/monomorphization-and-code-bloat|monomorphized generics]], which solve the "same code, many types" problem without leaving the type system.

## `macro_rules!`, a rewriter with a grammar

`macro_rules` allows users to define syntax extensions in a declarative way, called macros by example. Each has a name and one or more rules, and each rule has two parts: a matcher describing the syntax that it matches, and a transcriber describing the syntax that will replace a successfully matched invocation. Expansion can produce expressions, statements, items including traits and impls, types, or patterns, which is a wider set of positions than most languages allow a macro to occupy.

Matching binds metavariables by fragment specifier. `$name:expr` matches an expression, `$name:ty` a type, `$name:ident` an identifier, `$name:tt` a single token tree. The specifier is what separates this from textual substitution: the expander parses the fragment with the real Rust parser and hands the transcriber a parsed thing, so a matched `expr` cannot silently re-associate when it lands inside a larger expression. That is the bug C's preprocessor is famous for and the reason its macros are written with defensive parentheses.

Two mechanical facts explain most of the confusing errors. Expansion tries each macro rule in turn and transcribes the first successful match, and if that results in an error, future matches are not tried. So the first rule that matches is the one you get, even if a later rule would have worked. And when matching, no lookahead is performed: if the compiler cannot unambiguously determine how to parse the invocation one token at a time, it is an error. A matcher like `($($i:ident)* $j:ident)` fails on a single identifier, because the expander will not look past it to discover that the repetition should have taken zero items.

## Hygiene, precisely

Macros by example have mixed-site hygiene. Loop labels, block labels, and local variables are looked up at the macro definition site, while other symbols are looked up at the macro invocation site. A macro that mentions `x` and `func()` will see the definition site's `x` and the call site's `func`, in the same expansion. The rule is not "everything is hygienic"; it is a split, and the split is chosen so that a macro cannot accidentally capture a caller's local while still being able to call a function the caller supplied.

The consequence people trip over is that locals introduced by an expansion are not shared between invocations, so `m!(define)` followed by `m!(refer)` does not compile even though the concatenated text would. Hygiene is [[cs/pl/scoping-binding-and-closures|scoping]] applied to generated code, and treating a macro as text is exactly the mental model it exists to invalidate. Cross-crate reference gets its own device: the `$crate` metavariable refers to the crate defining the macro and can be used at the start of a path to look up items or macros which are not in scope at the invocation site. Note that it does not confer visibility. A private item referenced through `$crate` still fails from outside its crate.

Scheme and Racket got here first, and [[cs/languages/Racket/hygienic-macros-and-syntax-rules|`syntax-rules`]] is the direct ancestor of the matcher-and-transcriber form. The general theory sits in [[cs/pl/macros-and-metaprogramming|macros and metaprogramming]].

## Procedural macros, which are compiler plugins

Procedural macros allow creating syntax extensions as execution of a function, in three flavors: function-like `custom!(...)`, derive macros behind `#[derive(CustomDerive)]`, and attribute macros. You can sort of think of them as functions from an AST to another AST. They must be defined in the root of a crate with the crate type `proc-macro`, may not be used from the crate where they are defined, and as functions they must either return syntax, panic, or loop endlessly. Panics become compiler errors; endless loops are not caught by the compiler, which hangs the compiler.

The interface is a token stream, not an AST. Procedural macros operate over token streams instead of AST nodes, which is a far more stable interface over time for both the compiler and for the macros targeting it. This is a real engineering decision with a visible cost: `syn` and `quote` exist because every non-trivial proc macro has to parse Rust out of that stream itself, and they are among the heaviest dependencies in a typical build. The compiler declines to expose its AST so that it stays free to change it, and the ecosystem pays with a reimplemented parser.

Two properties follow from "this is a program the compiler runs." Procedural macros run during compilation and thus have the same resources that the compiler has: the same standard input, error, and output, and the same file access. The Reference draws the conclusion directly, that procedural macros have the same security concerns that Cargo's build scripts have. A dependency with a derive macro can read your filesystem at build time. That is the [[cs/languages/common/software-supply-chain-and-provenance|supply chain]] surface, and it is not hypothetical.

And they are unhygienic. A procedural macro behaves as if the output token stream was simply written inline to the code it is next to, so it is affected by external items and also affects external imports. The mitigations are the ones you would expect from a preprocessor: use absolute paths like `::std::option::Option` rather than `Option`, and give generated functions names unlikely to clash, like `__internal_foo`. Every token does carry a `Span`, an opaque value representing an extent of source code, used primarily for error reporting, which is why a good derive macro can point its error at your struct field rather than at the expansion.

> [!tip] The tradeoff against generics
> Reach for a generic first. A generic is type-checked once at definition, participates in inference, and produces errors that name your types. A macro is checked only after expansion, so its errors describe code the user never wrote. Macros earn their place where the abstraction is over syntax rather than over types: a variable number of heterogeneous arguments, a trait implementation derived from a struct's fields, a DSL with its own grammar, or an item that must be generated at a position where no value can live. `vec!` exists because the arity is variable; `#[derive(Clone)]` exists because the implementation is a function of the field list, which is not a value a generic can quantify over.

## Related Notes

- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the general design space, from textual substitution to staged compilation
- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules in Racket]] - the ancestor of the matcher and transcriber form, with full hygiene
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - what hygiene is protecting, stated as a binding problem
- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - the type-level tool to prefer when the abstraction is over types
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - why arbitrary code at build time is a security boundary
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - where expansion sits in the pipeline, before type checking and after parsing

## Sources

- "Macros By Example," The Rust Reference. https://doc.rust-lang.org/reference/macros-by-example.html . Supports the declarative framing, the matcher and transcriber structure, the expansion positions, the first-match transcription rule, the no-lookahead restriction, mixed-site hygiene and the definition-site versus invocation-site split, locals not being shared across invocations, and `$crate` with its visibility caveat.
- "Procedural Macros," The Rust Reference. https://doc.rust-lang.org/reference/procedural-macros.html . Supports the three flavors, the AST-to-AST framing, the `proc-macro` crate-type requirement, the return-panic-or-loop rule and the hang, token streams as a more stable interface than AST nodes, macros running with the compiler's resources and sharing build-script security concerns, procedural macros being unhygienic and the absolute-path mitigation, and `Span` as an opaque source extent used for error reporting.
