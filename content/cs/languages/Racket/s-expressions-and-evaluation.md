---
title: S-Expressions and Evaluation in Racket
description: "The reader and expander as two separate layers, what a datum actually is, and why read-syntax mode produces something richer than a list."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-02-17
updated:
aliases:
  - Racket S-Expressions
  - The Racket Reader
---

`(+ 1 2)` looks like a function call, and it is one. It is also a three-element list whose first element is a symbol. Both descriptions are true at once, and the reason they are both true is that Racket parses source text in two passes that most languages fuse into one.

The Guide states the split plainly. The syntax of Racket is not defined directly in terms of character streams; instead the syntax is determined by two layers, a **reader** layer which turns a sequence of characters into lists, symbols, and other constants, and an **expander** layer which processes the lists, symbols, and other constants to parse them as an expression. Nothing about "expression" exists until the second layer runs. The first layer only knows about data.

> [!note] The idea
> "Code as data" is not a metaphor about how Lisp feels. It is a claim about types: the reader's output and `quote`'s output are the same values, built by the same code path, so the Guide can define `quote` by saying its value is the same value that `read` would produce given the datum. The non-obvious consequence is that the reader does structural work before any notion of evaluation exists. It can rearrange a form, and it does, which is why `(1 . < . 2)` evaluates to `#t`: the reader moved the middle element to the front and handed the expander an ordinary `(< 1 2)`.

## What the reader actually is

The Reference describes it as a recursive-descent parser that can be configured through a readtable and various other parameters. Reading from a stream produces one **datum**, and if the result datum is a compound value then reading it typically requires the reader to call itself recursively to read the component data. So the reader is not a tokenizer feeding a grammar. It is a single recursive function whose return type is "a Racket value."

Dispatch is character-driven. Whitespace and the characters `( ) [ ] { } " , ' \` ;` are delimiters; a delimited sequence starting with any other character is typically parsed as a symbol, number, or extflonum. `(`, `[`, and `{` all start a pair or list, `"` starts a string, `;` starts a line comment, and `#` has a special meaning as an initial character whose interpretation depends on what follows.

For a parenthesized form, the reader recursively reads data until the matching close paren, handling a delimited `.` specially. With no delimited dot among the elements, it produces a list containing the results of the recursive reads. With two data separated by a delimited dot it creates a pair, and more generally, given two or more data where the last is preceded by a delimited dot it constructs nested pairs, pairing the next-to-last element with the last, then the third-to-last with that pair, and so on.

The third case is the strange one. If the reader finds three or more data between matching parentheses and a pair of delimited dots surrounds any element other than the first and last, the result is a list with the dot-surrounded element first, followed by the others in read order. The Reference names the purpose directly: this convention supports a kind of infix notation at the reader level. The Guide's example is `(1 . < . 2)` producing `#t`, and `'(1 . < . 2)` printing as `'(< 1 2)` so you can watch the rewrite happen. Racket programmers use the convention sparingly, mostly for asymmetric binary operators such as `<` and `is-a?`.

The plain single dot leaks into expressions too. `(+ 1 . (2))` evaluates to `3`, because `(+ 1 . (2))` is just another way of writing `(+ 1 2)`. The Guide is careful to say this is practically never a good idea to write, and that it is a consequence of how Racket's syntax is defined rather than a feature. As a demonstration it is perfect: the expander never sees a dot, because dots are a reader-level notation for pair structure.

## Quote as a hole punched back to the reader

`(quote datum)` produces a constant. The Guide's definition of what may appear in that position is where the two layers touch: the syntax of a datum is technically specified as anything that the `read` function parses as a single element, and the value of the `quote` form is the same value that `read` would produce given the datum. A datum can be a symbol, boolean, number, string, character, keyword, the empty list, a pair or list containing more such values, a vector, a hash table, or a box containing another such value.

There is exactly one documented exclusion, and it is informative. A datum cannot be a printed representation that starts with `#<`, so it cannot be `#<void>`, `#<undefined>`, or a procedure. The boundary of "code as data" is the boundary of what the printer can round-trip.

The `'` shorthand is handled entirely in the reader. When the reader encounters `'` it recursively reads one datum and forms a new list containing the symbol `quote` and the following datum. So `'apple` reads equal to `(list 'quote 'apple)`, and the same mechanism gives `` ` `` for `quasiquote`, `,` for `unquote`, `,@` for `unquote-splicing`, `#'` for `syntax`, and `` #` `` for `quasisyntax`, with longer prefixes taking precedence over shorter ones. You can see the desugaring by quoting a quote: `(car ''road)` is `'quote`.

## Pairs, and why lists are the special case

`cons` accepts any two values in either position, a list being only one possibility for the second argument, and the general result of `cons` is a **pair**. A value produced by `cons` is therefore not always a list. When the second argument is neither empty nor itself produced by `cons`, the value prints between parentheses with a dot in between, as `(cons 1 2)` printing `'(1 . 2)`.

The printing rule is a single sentence with a large consequence: use the dot notation unless the dot is immediately followed by an open parenthesis, in which case remove the dot, the open parenthesis, and the matching close parenthesis. That is why `'(0 . (1 . 2))` prints as `'(0 1 . 2)` and `'(1 . (2 . (3 . ())))` prints as `'(1 2 3)`. A list is not a distinct data structure. It is a chain of pairs ending in the empty list that the printer has been told to collapse.

Symbols are the other half of code-as-data. The intrinsic value of a symbol is nothing more than its character content, and in that sense symbols and strings are almost the same thing, with the main difference being how they print. The Guide is emphatic that a printed symbol should not be confused with an identifier: the symbol `(quote map)` has nothing to do with the `map` identifier or the function bound to it, except that the two happen to be made up of the same letters. `(symbol? map)` is `#f` while `(symbol? (quote map))` is `#t`.

## The mode that makes hygiene possible

The reader can be invoked in either of two modes, read mode or **read-syntax** mode. In read-syntax mode the result is always a syntax object that includes source-location and (initially empty) lexical information wrapped around the sort of datum that read mode would produce, and in the case of pairs, vectors, and boxes the content is also wrapped recursively as a syntax object.

That parenthetical, "initially empty," is the whole story of Racket's macro system in three words. The reader does not know about binding, so it attaches no lexical information; the expander fills it in as it walks the program. Two identifiers that read as the same interned symbol can therefore carry different lexical information and refer to different bindings. A Lisp whose reader produces bare lists has thrown that information away before macro expansion begins, and its macros cannot be hygienic without reintroducing it by hand.

Interning is mode-dependent in a way worth knowing. Symbols and keywords are interned in both read and read-syntax mode, while symbols, keywords, strings, byte strings, regexps, characters, and numbers produced in read-syntax mode are interned, meaning such values in the result of `read-syntax` are always `eq?` when they are `equal?`. Interned values are only weakly held by the reader's internal table, so they may be garbage collected if no longer otherwise reachable.

> [!example] Following `'(1 . < . 2)` through both layers
> The characters reach the reader. It sees `'`, recursively reads one datum, and will wrap the result in a `quote` list. Reading that datum, it sees `(`, reads `1`, `.`, `<`, `.`, `2`, and finds a pair of delimited dots surrounding an element that is neither first nor last. That triggers the infix conversion, producing the list `(< 1 2)`. Wrapping in quote gives `(quote (< 1 2))`. The expander receives that, sees `quote` in operator position, and produces a constant: the three-element list. Printed, it is `'(< 1 2)`. Remove the leading `'` from the source and the same reader output goes to the expander unquoted, where `<` is now an identifier in operator position, and the answer is `#t`.

> [!warning] The reader is configurable, so "Racket syntax" is not fixed
> The Reference describes reader behavior *using the default readtable*, and says explicitly that the reader can be configured through a readtable and various other parameters. Several behaviors documented here are parameterized, for instance the `` ` ``, `,`, and `,@` forms are disabled when `read-accept-quasiquote` is `#f`, in which case an `exn:fail:read` exception is raised. Treat the rules above as the default configuration rather than as the language.

## Related Notes

- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules]] - what the expander does with those syntax objects
- [[cs/languages/Racket/language-design-from-core-to-surface-racket|Language Design from Core to Surface]] - the expansion pipeline this note sits at the front of
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - program transformation as a general capability
- [[cs/pl/language-overview-syntax-semantics|Language Overview: Syntax and Semantics]] - the syntax/semantics split that the reader/expander split is one implementation of
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar, Ambiguity, and Parse Trees]] - what parsing looks like when the output is a tree rather than a value
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - where read, expand, and evaluate fall in a pipeline

## Sources

- "2.4 Pairs, Lists, and Racket Syntax," The Racket Guide. https://docs.racket-lang.org/guide/Pairs__Lists__and_Racket_Syntax.html . Supports the two-layer reader/expander description, `cons` accepting any two values and producing a pair rather than always a list, the dot printing rule and its worked collapses, symbols as character content with `(quote map)` distinct from the `map` identifier, the `(car ''road)` desugaring demonstration, `(+ 1 . (2))` evaluating to 3, and the two-dot infix conversion with `(1 . < . 2)`.
- "1.3 The Reader," The Racket Reference. https://docs.racket-lang.org/reference/reader.html . Supports the reader being a recursive-descent parser configured by a readtable, reading producing one datum with recursive reads for compound values, the delimiter set and dispatch characters, the pair/list reading rules including the delimited-dot and infix-dot cases, read mode versus read-syntax mode and syntax objects carrying source-location and initially empty lexical information with recursive wrapping, the `'`/`` ` ``/`,`/`,@`/`#'`/`` #` `` prefix table with `'apple` reading equal to `(list 'quote 'apple)`, the `read-accept-quasiquote` parameter, and the interning rules including weak holding.
- "4.10 Quoting: quote and '," The Racket Guide. https://docs.racket-lang.org/guide/quote.html . Supports `quote` producing a constant, a datum being anything `read` parses as a single element, the value of `quote` equalling what `read` would produce, the list of admissible datum kinds, and the exclusion of printed representations starting with `#<`.
