---
title: Hygienic Macros and syntax-rules in Racket
description: "Pattern variables and ellipses, what define-syntax-rule really expands to, and the scope-set mechanism that makes hygiene an outcome rather than a rule."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-02
updated:
aliases:
  - define-syntax-rule
---

The three-line macro every Racket tutorial starts with is a good place to see the entire problem:

```racket
(define-syntax-rule (swap x y)
  (let ([tmp x]) (set! x y) (set! y tmp)))
```

Use it on two variables named `tmp` and `other` and the naive expansion is wrong. `(let ([tmp 5] [other 6]) (swap tmp other) (list tmp other))` should produce `(6 5)`, but substituting the template textually gives `(let ([tmp tmp]) (set! tmp other) (set! other tmp))`, whose result is `(5 6)`. The Guide names the failure exactly: the naive expansion confuses the `tmp` in the context where `swap` is used with the `tmp` that is in the macro template.

Racket does not produce that expansion. It produces one in which the template's binder appears as `tmp_1`, distinct from the user's `tmp`, and the answer is `(6 5)`. The general framing of macro systems and the hygiene property is in [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]]; this note is about the Racket mechanism underneath, which is more interesting than "the expander renames things."

> [!note] The idea
> Hygiene in Racket is not a renaming pass bolted onto expansion. Binding is resolved by **scope sets**: every syntax object carries a set of scopes, and a reference resolves to the binding whose scope set is the largest subset of the reference's own. Before the expander hands a form to a transformer it adds a fresh macro-introduction scope to the whole thing, and in the transformer's *result* the presence of that scope is flipped. Template-introduced identifiers keep it, use-site identifiers do not, and the two therefore cannot resolve to each other. The renaming you see in the expansion is a display artifact. The real mechanism is set inclusion.

## Patterns, templates, and the star

A pattern-based macro replaces any code that matches a pattern with an expansion that uses parts of the original syntax that match parts of the pattern. `define-syntax-rule` binds a macro that matches a single pattern. The pattern must always start with an open parenthesis followed by an identifier, which names the macro; after that initial identifier, other identifiers are macro **pattern variables** that can match anything in a use of the macro. The template is used in place of a matching form, with each instance of a pattern variable in the template replaced by whatever the pattern variable matched.

One pattern is often not enough. `define-syntax` with the `syntax-rules` transformer supports transformers that match multiple patterns starting with the same identifier:

```racket
(define-syntax rotate
  (syntax-rules ()
    [(rotate a b)   (swap a b)]
    [(rotate a b c) (begin (swap a b) (swap b c))]))
```

`define-syntax-rule` is itself a macro that expands into `define-syntax` with a `syntax-rules` form containing exactly one pattern and template. The Reference gives the equivalence precisely: `(define-syntax-rule (id . pattern) template)` is equivalent to `(define-syntax id (syntax-rules () [(id . pattern) template]))`, with the caveat that syntax errors may be phrased in terms of the pattern.

For a variable-arity macro, the pattern language has a Kleene star written `...`. When a pattern variable is followed by `...` in a pattern it must be followed by `...` in the template too; it effectively matches a sequence of zero or more forms and is replaced in the template by the same sequence. The ellipsis also works on a whole sub-template. In the Guide's `shift-to` helper, `...` follows `(set! to from)` in the template, which causes that expression to be duplicated as many times as necessary to use each identifier matched in the `to` and `from` sequences. If the number of `to` and `from` matches differs, macro expansion fails with an error.

The Reference is more precise about what the ellipsis does to a pattern variable's binding. For each pattern variable bound by the sub-pattern followed by an ellipsis, the larger pattern binds the same pattern variable to a *list* of values, one per matched element, with an incremented **depth marker**. A nested ellipsis gives lists of lists with a depth marker of 2, and so on. Depth is the type system of the pattern language, and mismatched depth between pattern and template is what the error messages are really complaining about.

## Two things that only look like identifiers

The `(literal-id ...)` list in `syntax-rules` is easy to skim past. It changes what an identifier in a pattern means. Ordinarily an `id` in a pattern matches any [[cs/languages/Racket/syntax-objects-and-lexical-context|syntax object]], provided it is not bound to `...` or `_` and does not have the same binding as any `literal-id`, and it becomes a pattern variable for the clause. An `id` that *does* have the same binding as a `literal-id` instead matches only a syntax object that is an identifier with the same binding in the sense of `free-identifier=?`, and the match introduces no pattern variables.

That is a stronger rule than "matches the symbol `else`." Literal matching is by binding, not by spelling, so a user who has rebound `else` locally will not accidentally trigger your literal clause, and a user who imported it under a different name still will.

`syntax-rules` itself has a definition rather than being primitive. The Reference states it as equivalent to a `lambda` over `syntax-case` with each template wrapped in `syntax-protect` and `#'`, and notes a detail worth knowing: each clause's leading `id` position binds no identifier in the corresponding template, which in particular means the `id` positions are ignored, and conventionally they should be written `_`. The macro's own name in the pattern is decoration.

## Where hygiene actually comes from

The Reference's syntax model gives the machinery. Bindings and references are determined through **[[cs/pl/scoping-binding-and-closures|scope sets]]**. A scope corresponds to a region of the program, either part of the source or synthesized through elaboration; nested binding contexts create nested scopes, while macro expansion creates scopes that overlap in more complex ways. A form is represented as a syntax object, and each syntax object has an associated set of scopes.

Resolution is then a [[cs/math/set-theory-basics|set-inclusion]] query. When a form parses as the binding of an identifier, parsing updates a global table mapping the combination of an identifier's symbol and scope set to its meaning. An identifier refers to a particular binding when the symbols are the same and the reference's scope set is a superset of the binding's scope set. If several bindings qualify, the identifier refers to the one whose set is a superset of all the others; if no such binding exists, the reference is **ambiguous** and triggers a syntax error when parsed as an expression. Shadowing falls out of the same rule: a binding shadows any binding with the same symbol but a subset of scopes.

Macro expansion plugs into that with two scope operations. Before the expander passes a syntax object to a transformer, the syntax object is extended with a fresh **macro-introduction scope** that applies to all sub-syntax-objects. In the result of the transformer the presence of that scope is flipped, so introduced syntax objects retain it and use-site syntax objects do not. Additionally, if the use of a transformer is in the same definition context as its binding, the use-site syntax object gets a fresh **use-site scope** that is *not* flipped in the result, so only use-site syntax objects carry it.

The Reference's own example is the cleanest demonstration:

```racket
(define x 12)
(define-syntax m (syntax-rules () [(_ id) (let ([x 10]) id)]))
(m x)
```

The expansion prints as `(let ([x 10]) x)`, and the result is `12`, not `10`. The transformer introduces the binding `x` while the referencing `x` was present in the argument to the transformer, so the introduced `x` is left with one fresh scope and the reference has a different fresh scope, which means the two are not `bound-identifier=?`. The printed form is a lie by omission; the scope sets differ.

The use-site scope exists to solve the reverse problem, and it is asymmetric on purpose. A use-site scope on a *binding* identifier is ignored when the definition is in the same context where the use-site scope was introduced, which allows a macro to expand to a visible definition: `(define-syntax m (syntax-rules () [(_ id) (define id 5)]))` followed by `(m x)` and then `x` really does define and then reference the same `x`. When the binding is not part of the definition context where the macro was used, the use-site scope is not ignored, and a macro expanding to `(let ([x 4]) (let ([id 5]) x))` under `(m x)` leaves the inner binder unable to capture the body's `x`.

> [!example] Faking gensym with lexical scope alone
> The Guide's call-by-reference extension needs to synthesize a `get` and `put!` name per function argument, and it notes the constraint directly: the pattern language provides no way to synthesize identifiers based on existing identifiers. The workaround is to iterate the macro once per argument, accumulating `(id get put)` triples, so that `(define-for-cbr do-f (a b) () (swap a b))` becomes `(define-for-cbr do-f (b) ([a get_1 put_1]) ...)` and then `(define-for-cbr do-f () ([a get_1 put_1] [b get_2 put_2]) ...)`. The subscripts on `get_1` and `get_2` are inserted by the macro expander to preserve lexical scope, since the `get` generated by one iteration should not bind the `get` generated by another. The Guide's own summary is that the technique is essentially tricking the macro expander into generating fresh names.

> [!warning] Bare macro identifiers are a syntax error unless you ask for otherwise
> Given the definitions above, `swap` and `rotate` must be used after an open parenthesis; `(+ swap 3)` reports `swap: bad syntax in: swap`. An **identifier macro** is a pattern-matching macro that works when used by itself without parentheses, and writing one requires dropping to `syntax-case` with an `identifier?` guard, because `syntax-case` clauses may specify additional guard conditions after the pattern. Assignment through `set!` needs a further step, an assignment transformer built with `make-set!-transformer`, with `set!` declared in the literal list.

## Related Notes

- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation]] - where syntax objects come from, and why the reader leaves lexical information empty
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the comparative view across C, PL/I, Rust, and Scheme
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the ordinary lexical scope that scope sets generalize
- [[cs/languages/Racket/language-design-from-core-to-surface-racket|Language Design from Core to Surface]] - expansion as the road from surface syntax to a small core
- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching]] - `match` patterns, which are a different pattern language with similar shape
- [[cs/languages/Python/decorators|Decorators in Python]] - the mild end of the same spectrum, a transformation applied at definition time

## Sources

- "16.1 Pattern-Based Macros," The Racket Guide. https://docs.racket-lang.org/guide/pattern-macros.html . Supports the definition of a pattern-based macro, `define-syntax-rule` pattern and template mechanics with the `swap` example, the naive expansion producing `(5 6)` versus Racket's `tmp_1` expansion producing `(6 5)`, the `define-syntax` plus `syntax-rules` multi-pattern form and the `rotate` examples, `define-syntax-rule` being itself a macro expanding to `syntax-rules`, the `...` sequence rules including template duplication in `shift-to` and the equal-count requirement, `(+ swap 3)` reporting bad syntax, identifier macros and the `identifier?` guard, `make-set!-transformer` for assignment, and the call-by-reference example's lack of identifier synthesis with the `get_1`/`get_2` fresh-name trick.
- "1.2 Syntax Model," The Racket Reference. https://docs.racket-lang.org/reference/syntax-model.html . Supports bindings and references being determined through scope sets, scopes corresponding to program regions with macro expansion creating overlapping scopes, forms being syntax objects with associated scope sets, the symbol-plus-scope-set binding table and the superset resolution rule with ambiguity as a syntax error, shadowing by scope-set subset, the fresh macro-introduction scope added before a transformer call and flipped in its result, the use-site scope and its non-flipping, the `(m x)` example returning 12 rather than 10 with the `bound-identifier=?` explanation, and the use-site-scope exception that lets a macro expand to a visible definition.
- "12.1 Pattern-Based Syntax Matching," The Racket Reference. https://docs.racket-lang.org/reference/stx-patterns.html . Supports the `syntax-rules` equivalence to `lambda` over `syntax-case` with `syntax-protect`, the ignored leading `id` positions and the `_` convention, the `define-syntax-rule` equivalence, the rule that an `id` pattern matches any syntax object unless bound to `...`/`_` or matching a literal, literal identifiers matching by `free-identifier=?` and introducing no pattern variables, and ellipsis pattern variables binding lists of values with an incremented depth marker.
