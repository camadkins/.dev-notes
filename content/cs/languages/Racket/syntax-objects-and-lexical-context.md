---
title: Syntax Objects and Lexical Context
description: "A syntax object is a datum plus a scope set plus a source location, and every property the macro system has follows from carrying all three together."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-16
updated:
aliases:
  - Syntax Objects
  - datum->syntax
  - Lexical Context in Racket
---

`'(+ 1 2)` and `#'(+ 1 2)` print differently for a reason:

```racket
> (syntax->datum #'(+ 1 2))
'(+ 1 2)
> #'(+ 1 2)
#<syntax:eval:1:0 (+ 1 2)>
```

The second carries `eval:1:0` in its printed form. That is a file, a line, and a column, riding along with the data. It is also carrying something invisible in the printout, which is what `+` means here, and the pair of those two attachments is the entire subject of this note.

> [!note] The idea
> A syntax object is a triple: **datum, lexical context, source location**, and the design consequence is that lexical context cannot be created, only donated. `datum->syntax` does not take an optional context argument with a sensible default. It *requires* an existing syntax object to borrow from. Because there is no way to conjure context out of a bare symbol, every identifier in an expansion necessarily traces back to some piece of syntax that already existed, either the macro's template or the macro's input. Hygiene is not enforced on top of that representation, it is what the representation leaves as the only possibility.

## The three parts

The input and output of a macro transformer, meaning source and replacement forms, are represented as syntax objects. A syntax object contains symbols, lists, and constant values essentially corresponding to the quoted form of an expression, and in addition to this quoted content it associates source-location and lexical-binding information with each part of the form.

Both attachments earn their keep. The source-location information is used when reporting syntax errors, and the lexical-binding information allows the macro system to maintain lexical scope. Note the phrase *each part of the form*: this is not one record wrapping the outside of a tree, it is annotation distributed through it, which is why `syntax-e` behaves the way it does.

```racket
> (syntax-e #'(+ 1 2))
'(#<syntax:eval:1:0 +> #<syntax:eval:1:0 1> #<syntax:eval:1:0 2>)
```

`syntax->datum` strips everything and hands back plain data. `syntax-e` unwraps a single layer of source-location and lexical-context information, leaving sub-forms that have their own information wrapped as syntax objects. It always leaves the wrappers around sub-forms represented via symbols, numbers, and other literal values, unwrapping further only when it unwraps a pair. A macro that takes a form apart with `syntax-e` therefore keeps the context of every piece it did not explicitly discard, which is the default a macro system wants.

## Binding is a property of the object, not of the name

The Reference's model of binding makes the annotation concrete. A form is represented as a syntax object, and each syntax object has an associated set of scopes. Parsing a binding form updates a global table that maps a combination of an identifier's symbol and scope set to its meaning, which is a variable, a syntactic form, or a transformer.

Resolution is then a lookup on a *pair*, not a name. Nested binding contexts such as nested functions create nested scopes, while macro expansion creates scopes that overlap in more complex ways, and among the candidate bindings the identifier refers to the one whose scope set is a superset of all others. If no such binding exists, the reference is ambiguous and triggers a syntax error when parsed as an expression. A binding shadows any binding with the same symbol but a subset of scopes.

That is a partial order with a maximum, and both halves matter. Ordinary shadowing is the case where the candidates happen to be totally ordered by inclusion, so a maximum always exists and nobody notices the machinery. Macro expansion produces overlapping scope sets where two candidates can be incomparable, and there the maximum can fail to exist, which is exactly the ambiguity error. Most languages cannot report that error because their scoping is a stack and a stack always has a top. Racket's is a family of sets ordered by inclusion, in the sense of [[cs/math/relations-and-equivalence|relations and partial orders]], and the price of the extra expressiveness is a failure mode that a lexically nested language does not have.

The identifier operations follow from the same representation. `free-identifier=?` determines whether two identifiers refer to the same binding, so `(free-identifier=? #'car #'also-car)` is true after `(require (only-in racket/base [car also-car]))`, despite the symbols differing. Comparing identifiers by name is almost never what a macro wants; comparing them by binding is. The full scope-set mechanism and how it produces hygiene is the subject of [[cs/languages/Racket/hygienic-macros-and-syntax-rules|hygienic macros and syntax-rules]].

## Context has to be borrowed

The one operation that builds a syntax object from raw data is `datum->syntax`, and its signature is the design statement:

```racket
> (datum->syntax #'lex '(+ 1 2) #'srcloc)
#<syntax:eval:1:0 (+ 1 2)>
```

In addition to a datum, `datum->syntax` needs an existing syntax object to donate its lexical context, and optionally another syntax object to donate its source location. The two donors are independent, which is how the example takes binding information from one place and blame-reporting information from another.

Ask what would happen if the context argument were optional. A macro could then synthesize a bare identifier with no lexical context at all, and the expander would have to invent a rule for what such an identifier means. Any such rule is a hygiene violation waiting to be discovered, because the identifier would resolve by name rather than by scope set. Requiring a donor removes the case. It also means that writing a deliberately unhygienic macro is not a hack around the system but a normal use of it: donate the *use site's* context and the introduced identifier becomes visible to the user's code, which is precisely how anaphoric macros are built in Racket. The system does not forbid capture, it forbids capture by accident.

When the datum argument already contains syntax objects, those are preserved intact in the result, so deconstructing with `syntax-e` eventually produces the syntax objects that were given. Context you have is never destroyed by rebuilding a form around it.

> [!warning] Two things a syntax object is not
> It is not a parse tree of the target language. The datum inside `#'(if a b c)` is a list of four things, and nothing has decided yet whether `if` is a conditional, a variable, or a macro. That decision belongs to the expander and depends on the scope set, which is why the same written form can mean different things in different modules.
>
> It is also not merely a renamed symbol. Older macro systems achieved hygiene by alpha-renaming the template's identifiers, and renaming loses information: the printed program no longer says what the programmer wrote, and source locations drift. Carrying scopes as a separate annotation keeps the original symbol and the original position intact while still distinguishing two identifiers that print identically. The renaming you see in an expanded `tmp_1` is a display convenience for that distinction, not the mechanism.

## Why the reader has to cooperate

None of this works unless syntax objects exist before macro expansion begins, which means the reader has to produce them rather than producing plain lists. It does, and that is the connection back to [[cs/languages/Racket/s-expressions-and-evaluation|s-expressions and evaluation]]: `read-syntax` is like `read` but produces a syntax object with source-location information, taking a source name that should generally be a path for the source file. The Reference adds a detail that gives away how early the decision is made: line counting should typically be enabled on the port so that source locations in syntax objects are in characters rather than bytes. Column numbers are a property of how the port was configured before a single form was parsed. A macro system that wants to report an error at the user's original column has to commit to keeping that information at the reader, and every later stage has to agree not to throw it away. The distributed annotation and the donation requirement are both consequences of that commitment.

Seen from a distance, a syntax object is what you get when the compile-time environment described in [[cs/pl/scoping-binding-and-closures|scoping, binding, and closures]] stops being a side table the compiler consults and becomes a field on the data itself. Everything else about Racket macros is a consequence of moving that information into the value.

## Related Notes

- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules in Racket]] - what the scope sets on these objects are used for
- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation in Racket]] - the reader that must attach source locations before anything else can
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the environment concept that a scope set relocates onto the data
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - subset ordering with a maximum, and the ambiguity error when there is none
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the general problem this representation was designed to solve
- [[cs/languages/Rust/macros-declarative-and-procedural|Macros: Declarative and Procedural]] - a token stream with spans, the same idea with a different binding story

## Sources

- "16.2.1 Syntax Objects," The Racket Guide. https://docs.racket-lang.org/guide/stx-obj.html . Supports macro transformer input and output being syntax objects, a syntax object associating source-location and lexical-binding information with each part of the form, source locations being used for syntax errors and lexical-binding information maintaining lexical scope, `syntax->datum` versus `syntax-e` and the single-layer unwrapping rule with wrappers always left on literals, `free-identifier=?` determining whether two identifiers refer to the same binding including the renamed-import example, and `datum->syntax` requiring an existing syntax object to donate lexical context with an optional second donor for source location and preserving embedded syntax objects intact.
- "1.2 Syntax Model," The Racket Reference. https://docs.racket-lang.org/reference/syntax-model.html . Supports a form being represented as a syntax object with an associated set of scopes, parsing a binding updating a global table keyed on symbol and scope set, nested binding contexts creating nested scopes while macro expansion creates overlapping ones, resolution picking the binding whose scope set is a superset of all others with ambiguity as a syntax error otherwise, and shadowing being defined by subset of scopes.
- "13.6 Reading," The Racket Reference. https://docs.racket-lang.org/reference/Reading.html . Supports `read-syntax` producing a syntax object with source-location information, the source name generally being a path for the source file, and line counting on the port determining whether source locations are measured in characters or bytes.
