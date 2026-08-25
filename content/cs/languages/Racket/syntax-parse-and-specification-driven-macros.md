---
title: syntax-parse and Specification-Driven Macros
description: "Syntax classes as named grammar productions, the progress heuristic that picks which failure to report, and macros written as specifications rather than rewrites."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-29
updated:
aliases:
  - syntax-parse
  - define-syntax-class
---

Write `let` as a pattern macro and it works, right up until someone makes a mistake:

```racket
(define-syntax-rule (mylet ([var rhs] ...) body ...)
  ((lambda (var ...) body ...) rhs ...))

> (mylet ([1 a]) (add1 a))
lambda: not an identifier, identifier with default, or keyword
  at: 1
  in: (lambda (1) (add1 a))
```

The error names `lambda`, a form the user never wrote, at a position inside code the user never wrote. As the syntax-parse documentation puts it, in some cases the macro merely fails with an uninformative error message, and in others it blithely accepts illegal syntax and passes it along, with strange consequences. The reason is structural: `define-syntax-rule` has one pattern and two outcomes, match or do not match, so a partial match has nowhere to report from.

> [!note] The idea
> `syntax-parse` turns a macro from a rewrite rule into a **grammar with named productions**, and then does the thing a rewrite rule cannot: it treats every failed alternative as a candidate error and picks the best one. It records all potential errors along with the progress made before each, and reports only the error with the most progress, where progress is a left-to-right traversal of the term. That single heuristic is why a two-clause macro with overlapping shapes still blames the right thing, and it is borrowed straight from how recursive-descent parsers report failures.

## Annotations make patterns into specifications

The first step toward validation and high-quality error reporting is annotating each of the macro's pattern variables with the syntax class that describes its acceptable syntax. An annotated pattern variable is written by concatenating the pattern variable name, a colon character, and the syntax class name:

```racket
(syntax-parse stx
  [(_ ((var:id rhs:expr) ...) body ...+)
   #'((lambda (var ...) body ...) rhs ...)])
```

The annotations do not appear in the template, only in the pattern. `...` means match zero or more repetitions of the preceding pattern and `...+` means match one or more, though only `...` may be used in the template.

Now `(mylet (["a" 1]) (add1 a))` reports `expected identifier at: "a"`, naming the user's term at the user's position. The class did the work, not the expansion.

> [!warning] `expr` is weaker than it sounds
> The `expr` syntax class does not actually check that the term it matches is a valid expression. Doing that would require calling the macro expander. Instead, `expr` just means not a keyword. This is not a shortcoming so much as a boundary: full validation of an expression is expansion, and expansion at pattern-match time would change when side effects and definitions occur. A macro that genuinely needs the expanded form has to ask for it explicitly through partial expansion.

## A syntax class is a production with a description

`define-syntax-class` names a shape and attaches human vocabulary to it:

```racket
(define-syntax-class binding
  #:description "binding pair"
  (pattern (var:id rhs:expr)))
```

With that in place, `(mylet (a 1) (+ a 2))` stops saying `bad syntax` and starts saying `expected binding pair at: a`. The class also exposes `b.var` and `b.rhs`, the nested attributes formed from the annotated pattern variable `b` and the attributes of the class.

There is a scoping rule here that catches people once: by default, a syntax class only exports its patterns' pattern variables as attributes, not their nested attributes. A class built out of other classes has to re-export what it wants visible, typically with `#:with`, which matches a pattern against a computed term. The alternative is declaring nested attributes explicitly with `#:attribute`, at the cost of writing `bs.b.var` at every use.

Naming shapes is what makes them reusable. Adding named `let` to `mylet` is a second clause that mentions the same `distinct-bindings` class and needs about three lines, and both clauses keep their error quality. That is the ordinary benefit of factoring a grammar into named productions rather than inlining every alternative, as in [[cs/pl/grammars-notation-bnfebnf|BNF and EBNF]], with the addition that each production carries the noun phrase the error message should use.

Constraints beyond shape go in side conditions. `#:fail-when` is followed by two expressions, the condition and the error message, and when the condition evaluates to anything but false the pattern fails. The detail that matters for message quality: if the condition evaluates to a syntax object, that syntax object is used to pinpoint the cause of the failure. So `check-duplicate-identifier` returning the offending identifier makes the error point at the duplicate rather than at the whole binding list.

## The progress heuristic

Two clauses that both begin with a parenthesized form create a real problem. `(mylet loop (["a" 1]) (add1 a))` fails against the plain clause because `loop` is not a binding sequence, and fails against the named clause because `"a"` is not an identifier. Both failures are true. Reporting the wrong one produces the notoriously useless macro error that complains about a shape the user was not attempting.

The mechanism is stated directly: `syntax-parse` records a list of all the potential errors along with the progress made before each error, and only the error with the most progress is reported. Progress is based on a left-to-right traversal of the syntax. In the example above, `expected distinct-bindings at loop` stops at the first argument, while `expected identifier at "a"` gets further into the term, so the second wins. When two failures reach the same term, the deeper one wins.

This is the furthest-failure heuristic that recursive-descent and packrat parsers use to report syntax errors, applied to macro arguments. The justification is the same in both settings and worth stating: the alternative that consumed the most input before dying is the alternative the author was most likely writing. It is a heuristic and it can be wrong, but it is wrong far less often than reporting the first or last failure. The [[cs/dsa/backtracking-algorithms|backtracking search]] underneath does more than abandon a failed branch. It keeps a scored record of how far the branch got, and the score is what makes the search's output legible to a human.

The heuristic also has a documented rough edge. For a duplicate-variable failure the progress associated with the error is the whole argument term, not the second occurrence of the duplicated identifier, since the side condition runs after the shape matched. Side conditions therefore score as failures at the position where their enclosing pattern began.

## Macros as specifications, not rewrites

The syntax-parse introduction makes an argument that is easy to skip past. Macros must validate their syntax and report appropriate errors, and separately, the macro writer benefits from the machine-checked specification of syntax in the form of more readable, maintainable code. The second half is the durable claim. The pattern in a `syntax-parse` clause is simultaneously the matcher, the documentation of the accepted grammar, and the source of the error vocabulary. Change the accepted syntax and all three move together, because they are one artifact.

Compare the fragment specifiers in [[cs/languages/Rust/macros-declarative-and-procedural|Rust's declarative macros]], where `$e:expr` plays the annotation role but there is no way to name a composite shape, attach a description to it, or reuse it across arms. You get the classification without the abstraction, so a complex macro's grammar stays inline and its errors stay generic. The gap between the two systems is not pattern matching power, it is whether the grammar can be factored.

None of this replaces what [[cs/languages/Racket/hygienic-macros-and-syntax-rules|syntax-rules]] does. Hygiene is orthogonal and `syntax-parse` inherits it unchanged. What changes is that the macro now has a vocabulary for what it accepts, and therefore a vocabulary for what it rejects.

## Related Notes

- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules in Racket]] - the pattern language this extends, and the hygiene it inherits
- [[cs/pl/grammars-notation-bnfebnf|Grammars: BNF and EBNF]] - named productions, which is what a syntax class is
- [[cs/dsa/backtracking-algorithms|Backtracking Algorithms]] - the search over clauses, and scoring branches rather than discarding them
- [[cs/languages/Rust/macros-declarative-and-procedural|Macros: Declarative and Procedural]] - fragment specifiers without composable named shapes
- [[cs/languages/Racket/syntax-objects-and-lexical-context|Syntax Objects and Lexical Context]] - the source locations that make a pinpointed error possible at all
- [[cs/pl/cfg-design-refactoring|CFG Design and Refactoring]] - factoring alternatives so that two clauses can share a production

## Sources

- "1.1 Introduction," Syntax: Meta-Programming Helpers (the syntax-parse documentation). https://docs.racket-lang.org/syntax/stxparse-intro.html . Supports the `mylet` running example and the `define-syntax-rule` version's poor errors including blithely accepting illegal syntax, macros needing to validate syntax and report errors, the machine-checked specification argument, annotating pattern variables with syntax classes and the colon notation, `...` versus `...+` and the template restriction, `expr` not checking for a valid expression and meaning not a keyword, `define-syntax-class` with `#:description` improving the message, nested attributes and the default of not exporting nested attributes, `#:with` matching a pattern against a computed term, `#:fail-when` taking a condition and message with a syntax-object result pinpointing the failure, reuse of a syntax class making the named-let clause about three lines, and the progress mechanism recording all potential errors, reporting only the one with the most progress, using a left-to-right traversal, and scoring a duplicate-variable failure at the argument term.
