---
title: Reader Extension and Custom Syntax in Racket
description: "How #reader, readtables, and #lang reader let a Racket program contain notation that is not s-expressions at all."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-04
updated:
aliases: []
---

Macros operate on data that the reader has already produced, so every macro-based extension inherits parentheses, identifiers, and the rest of [[cs/languages/Racket/s-expressions-and-evaluation|Racket's lexical conventions]]. Reader extension is what you reach for when the notation itself has to change: infix arithmetic, a regexp-like literal, a whole file of prose. It is a different layer with a different protocol, and the protocol is unusually small.

> [!note] The idea
> Racket exposes its own front end as two composable objects rather than one fixed grammar. The reader layer of the Racket language can be extended through the `#reader` form, and a reader extension is implemented as a module that exports functions parsing raw characters into a form to be consumed by the expander layer. That is the total option: your function owns the input port and owes nothing to Racket syntax. The partial option is a readtable, a first-class map from characters to parsing handlers held in a parameter. The choice between them is the same tradeoff as writing a macro versus writing a language, moved down one layer, and it comes with the same rule of thumb: take the smallest hook that does the job, because only the small hook composes.

## `#reader` hands you the port

The syntax is `#reader ‹module-path› ‹reader-specific›`, where the module provides `read` and `read-syntax` and the trailing characters are parsed however those functions see fit. A module of five lines is enough to demonstrate the point:

```racket
#lang racket/base
(provide read read-syntax)
(define (read in) (list (read-string 5 in)))
(define (read-syntax src in) (list (read-string 5 in)))
```

With it, `'(1 #reader "five.rkt" 23456 7 8)` reads as `'(1 ("23456") 7 8)`. The Guide draws out the consequence that matters: the reader functions are not obliged to follow Racket lexical conventions and treat the continuous sequence `234567` as a single number. Only `23456` gets consumed, so the `7` is left in the stream and parsed the usual way afterward. Whitespace is equally unprivileged, so `#reader "five.rkt" 2345 67 8` produces the string `" 2345"` with the leading space intact. There is no tokenizer above your function protecting Racket's assumptions, because the tokenizer is exactly what you replaced.

## `read` versus `read-syntax`, and why source locations decide the quality of the result

The difference is audience. `read` is meant to be used for data while `read-syntax` is meant to be used to parse programs; the first is called when the enclosing stream is parsed by Racket's `read`, the second when it is parsed by `read-syntax`. Nothing requires the two to parse input in the same way, but making them different would confuse programmers and tools.

The idiom worth copying is the inverted one. Implement `read-syntax` directly so it produces syntax objects carrying source positions, then define `read` as `read-syntax` with the wrappers stripped. The Guide's `arith.rkt` reader does this for infix arithmetic, parsing `1*2+3` into `(+ (* 1 2) 3)` using `port-next-location` for positions and `datum->syntax` to attach them.

The payoff shows up in a place beginners never anticipate. Because the reader tracked locations, a downstream syntax error in a form the reader produced still points into the original infix text:

```racket
> (let #reader "arith.rkt" 1*2+3 8)
repl:1:27: let: bad syntax ...
```

A custom notation without source locations is usable exactly once, in a REPL, by its author. With them, it participates in [[cs/pl/language-overview-syntax-semantics|the ordinary syntax-versus-semantics division of labor]] that every other Racket form enjoys: the reader owns the shape, the expander owns the meaning, and errors from the second can still name positions in the first.

## Readtables are the composable hook

A reader extension's ability to parse input characters in an arbitrary way can be powerful, but many cases of lexical extension call for a less general but more composable approach. In much the same way that the expander level of Racket syntax can be extended through macros, the reader level of Racket syntax can be composably extended through a readtable.

The mechanism is stated plainly in the Guide, and it is a description of a hand-written parser rather than a generated one. The Racket reader is [[cs/pl/cfg-design-refactoring|a recursive-descent parser]], and the readtable maps characters to parsing handlers. The default readtable maps the open parenthesis to a handler that recursively parses subforms until it finds a close parenthesis. Which table is in force is not a global: the `current-readtable` parameter determines the readtable used by `read` or `read-syntax`, so an extension can install an extended table and then chain to the ordinary reader. [[cs/languages/Racket/parameters-and-dynamic-binding|That parameter is dynamically scoped]], which is what keeps a notation change confined to the extent of the read it was installed for.

`make-readtable` constructs a new readtable as an extension of an existing one. It accepts a sequence of specifications in terms of a character, a type of mapping for that character, and, for certain mapping types, a parsing procedure. Adding `$` as an infix delimiter is one line:

```racket
(make-readtable (current-readtable) #\$ 'terminating-macro read-dollar)
```

The handler protocol has one wrinkle that catches everyone. The arity depends on which mode the reader is in. In `read` mode, the parser function is given two arguments: the character that triggered the parser function and the input port being read. In `read-syntax` mode, the function must accept four additional arguments that provide the source location of the character.

> [!warning] Composability cuts both ways
> A readtable extension composes with the rest of Racket syntax, which is the point, but it also means a character that used to be ordinary is now not. Every reader that chains through your table inherits the change for the dynamic extent it covers. Reader extensions also run code at read time: `#reader` names a module whose functions execute while the file is being read, before anything resembling evaluation of the program. That is worth holding onto whenever the text being read did not come from you.

## `#lang reader`, where the two layers meet

`#lang reader` is the reader-level counterpart of `#lang s-exp`. Where `s-exp` lets a programmer specify a module language at the expander layer, `reader` lets a programmer specify a language at the reader level. It must be followed by a module path, and that module must provide `read` and `read-syntax`.

The protocol is the same as for `#reader` with one added obligation, and the obligation is the whole difference between extending syntax and defining a language: for `#lang`, the `read` and `read-syntax` functions must produce a `module` form that is based on the rest of the input file for the module. A `#reader` extension returns a datum into a surrounding expression. A `#lang` reader returns the entire program.

The Guide's `literal.rkt` shows the minimum: read the whole port to a string, and return a syntax object for `(module anything racket (provide data) (define data 'str))`. Roughly ten lines produce a language in which a source file is a blob of text and the compiled module exports it. It is also how a `#lang` can stop looking like Racket entirely: the Guide notes that `#lang scribble/manual` has a completely different syntax that does not even look like Racket, which is only possible because the reader, not the expander, decides what a file is. That is [[cs/languages/Racket/languages-as-modules-and-hash-lang|the reason a `#lang` name resolves to a `reader` submodule]] in the first place.

## Related Notes

- [[cs/languages/Racket/languages-as-modules-and-hash-lang|Languages as Modules and #lang]] - the expander half, and the lookup that finds this reader
- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation]] - the lexical conventions a reader extension is permitted to ignore
- [[cs/pl/cfg-design-refactoring|CFG Design and Refactoring]] - what a recursive-descent parser demands of the grammar it implements
- [[cs/pl/language-overview-syntax-semantics|Language Overview: Syntax vs Semantics]] - the reader/expander split as a concrete instance of the distinction
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - the general hazard of a parser that runs supplied code while reading input
- [[cs/languages/Racket/parameters-and-dynamic-binding|Parameters and Dynamic Binding]] - why `current-readtable` is a parameter rather than a global

## Sources

- "17.2 Reader Extensions," The Racket Guide. https://docs.racket-lang.org/guide/hash-reader.html . Supports `#reader` extending the reader layer, a reader extension being a module exporting character-parsing functions, the `#reader` syntax and the `five.rkt` example including the unconsumed `7` and the retained whitespace, the `read` versus `read-syntax` distinction and the warning against divergence, the `arith.rkt` infix reader with `port-next-location` and `datum->syntax`, the surviving source location in the `let` error, readtables as the more composable approach, the recursive-descent characterization and the character-to-handler mapping, `current-readtable`, `make-readtable` and its specification triples, and the two-argument versus six-argument handler protocol.
- "17.3.2 Using #lang reader," The Racket Guide. https://docs.racket-lang.org/guide/hash-lang_reader.html . Supports `reader` as a meta-language operating at the reader level in contrast to `s-exp` at the expander level, the requirement to provide `read` and `read-syntax`, the obligation to produce a `module` form based on the rest of the input file, and the `literal.rkt` whole-file-as-string language.
- "17 Creating Languages," The Racket Guide. https://docs.racket-lang.org/guide/languages.html . Supports the framing of the reader layer and expander layer as separately extensible starting points.
- "6.2 Module Syntax," The Racket Guide. https://docs.racket-lang.org/guide/Module_Syntax.html . Supports `#lang scribble/manual` having a completely different syntax that does not look like Racket.
