---
title: Languages as Modules and #lang
description: "What #lang resolves to, the reader and expander starting points a language supplies, and the two-location lookup that turns a name into a language."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-15
updated:
aliases:
  - hash-lang
---

The claim that Racket lets you build a language rather than a library is [[cs/languages/Racket/language-design-from-core-to-surface-racket|the design philosophy of the system]]. This note is about the plumbing that makes the claim literally true, because the mechanism turns out to be smaller and stranger than the slogan suggests.

> [!note] The idea
> `#lang whatever` is not a compiler directive and not a mode switch. It is a name that gets resolved to a module by trying exactly two paths, and the module it finds hands back two things: a reader that turns characters into a `module` form, and a module language whose exported bindings, including the implicit ones, define what the body may say. Nothing about a language is privileged. A language is a module that happens to export the right names, and the most powerful of those names is `#%module-begin`, because it wraps the entire body and can rewrite or reject it wholesale.

## A module language is just the second sub-form

Start with the ordinary `module` form: `(module name-id initial-module-path decl ...)`. Since the initial-import module determines even the most basic bindings that are available in a module's body, such as `require` itself, the initial import can be called a module language. `racket` and `racket/base` are the common ones, and you define your own by writing a module that provides a suitable set of names.

The cheapest way is subtraction. Using `provide` subforms like `all-from-out`, `except-out`, and `rename-out`, a module can re-export `racket` with pieces removed or renamed:

```racket
(module raquet racket
  (provide (except-out (all-from-out racket) lambda)
           (rename-out [lambda function])))
```

Any module written in `'raquet` now has `function` and no `lambda`. That is a real language change, expressed entirely with the export machinery any module already has.

## The implicit forms are where the leverage is

Subtract too much and the language stops working:

```racket
(module just-lambda racket (provide lambda))
(module identity 'just-lambda (lambda (x) x))
; module: no #%module-begin binding in the module's language
```

`#%module-begin` is an implicit form that wraps the body of a module, and it must be provided by a module that is to be used as a module language. Three siblings do the same job at finer grain: `#%app` for function calls, `#%datum` for literals, and `#%top` for identifiers with no binding. They can be used explicitly in a module, but they exist mainly to allow a module language to restrict or change the meaning of implicit uses.

The consequence is that a language author intercepts syntax the source never wrote. The Guide demonstrates by building a language that is not a dialect of Racket at all: a module language that restricts functions to one argument, restricts calls to one argument, restricts the body to a single expression, rejects all literals, and treats unbound identifiers as quoted symbols. Every one of those restrictions is a `rename-out` of a macro over one of the four implicit names. What comes out is [[cs/pl/lambda-calculus-syntax-substitution|the untyped lambda calculus]] as an installed, checkable language, in about a dozen lines, with real error messages pointing at real source positions.

In practice, module languages rarely redefine `#%app`, `#%datum`, and `#%top`. Redefining `#%module-begin` is the frequently useful one, because a body wrapper can collect every top-level expression into a value and export it. An HTML description language does exactly that: the alternate `#%module-begin` gathers the body into a quasiquoted list, binds it as `page`, and provides it, so a module in that language contains no `provide` and no quasiquoting boilerplate at all.

## What `#lang` actually resolves to

Everything above is reachable through the longhand `module` form. `#lang` adds the reader half. When a source program starts with `#lang language`, the language determines the way that the rest of the module is parsed at the reader level, and that reader-level parse must produce a `module` form as a syntax object. The second sub-form of the `module` form it produces is the module language, so a language named after `#lang` controls both reader-level and expander-level parsing.

The name itself is deliberately impoverished. The syntax of a language intentionally overlaps with the syntax of a module path, so `racket` or `scribble/manual` work in both places, but the syntax of a language is far more restricted than a module path: only the ASCII letters, digits, `/` (not at either end), `_`, `-`, and `+` are allowed. Keeping the syntax of `#lang` simple, in turn, is important because the syntax is inherently inflexible and non-extensible. The protocol lets a language refine and define syntax in a practically unconstrained way, but the `#lang` protocol itself must remain fixed so that various different tools can boot into the extended world. Editors, package tools, and the compiler all have to read that first line before they know anything else, which is the same reason [[cs/pl/levels-of-artificial-languages|every layered notation keeps its outermost layer dumb]].

Resolution is a two-location lookup, and worth memorizing because it explains the shape of every language package on the shelf. A language is not used directly as a module path. First, Racket looks for a `reader` submodule of the main module for the language. If that is not a valid module path, the language name is suffixed with `/lang/reader`. If neither is valid, an error is raised. The resulting module supplies `read` and `read-syntax` functions using a protocol similar to the one for `#reader`.

> [!warning] The lookup implies an installation requirement
> A consequence of the way that a `#lang` language is turned into a module path is that the language must be installed in a collection, the way `racket` and `slideshow` are collections distributed with Racket. You cannot write `#lang "my-lang.rkt"` and point at a file. Two escapes exist: `s-exp` lets a programmer specify a module language using general module path syntax while `s-exp` handles the reader-level responsibilities, and the `reader` language lets you specify a reader-level implementation using a general module path. Note the asymmetry those escapes reveal: unlike `racket`, `s-exp` cannot be used as a module path with `require`. It is a language and nothing else.

## Why this is the interesting design

A macro can extend a language, and it can only do so at the expander layer, within the parameters of the existing lexical conventions. Two limits follow: a macro cannot restrict the syntax available in its context or change the meaning of surrounding forms, and it cannot escape parenthesized notation. `#lang` removes both limits by letting a module define the starting point of the expander layer and, through the reader submodule, [[cs/languages/Racket/reader-extension-and-custom-syntax|the starting point of the reader layer]] as well, then packaging both under one conveniently named language.

The design decision worth stealing is the refusal to add a language mechanism. There is no language registry, no language class, no plugin interface. There is a naming convention (`reader` submodule, then `/lang/reader`), an export contract (four implicit forms), and the module system that already existed. A language in Racket costs a directory and a `provide` line, which is why the ecosystem has hundreds of them, and [[cs/pl/macros-and-metaprogramming|why the usual argument about macros splintering a community]] lands differently here: the splinters are separately named, separately installed, and separately documented modules rather than invisible local dialects.

## Related Notes

- [[cs/languages/Racket/language-design-from-core-to-surface-racket|Racket: From Core to Surface]] - the philosophy this note gives the mechanism for
- [[cs/languages/Racket/reader-extension-and-custom-syntax|Reader Extension and Custom Syntax]] - the other half of a language, where the notation stops being s-expressions
- [[cs/pl/levels-of-artificial-languages|Levels of Artificial Languages]] - the layering that a fixed outer protocol and an extensible inner one implement
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the layer `#lang` sits above, and the limits that motivated it
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus: Syntax and Substitution]] - the calculus the Guide implements as a module language in a dozen lines
- [[cs/languages/Racket/the-module-system-and-require-provide|The Module System and require/provide]] - the export machinery a language is built entirely out of

## Sources

- "17.1 Module Languages," The Racket Guide. https://docs.racket-lang.org/guide/module-languages.html . Supports the initial import being called a module language, building a variant of `racket` with `all-from-out`, `except-out`, and `rename-out`, the missing `#%module-begin` error, `#%module-begin` as the implicit body wrapper that a module language must provide, `#%app`, `#%datum`, and `#%top`, the purpose of implicit forms in restricting implicit uses, the lambda-calculus module language, and the HTML page-description example.
- "17.3 Defining new #lang Languages," The Racket Guide. https://docs.racket-lang.org/guide/hash-languages.html . Supports the language determining reader-level parsing, the reader-level parse producing a `module` form as a syntax object, and the second sub-form specifying the module language.
- "17.3.1 Designating a #lang Language," The Racket Guide. https://docs.racket-lang.org/guide/hash-lang_syntax.html . Supports the overlap with module-path syntax, the restricted character set, the inflexible-and-non-extensible rationale for keeping `#lang` simple, the fixed protocol so tools can boot into the extended world, the two-location lookup through a `reader` submodule then `/lang/reader`, the `read` and `read-syntax` protocol, the collection installation requirement, and the `s-exp` and `reader` escapes.
- "17 Creating Languages," The Racket Guide. https://docs.racket-lang.org/guide/languages.html . Supports the two limits on macros and the framing of `#lang` as packaging a reader and expander starting point under one name.
