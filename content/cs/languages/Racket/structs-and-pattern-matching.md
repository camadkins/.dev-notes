---
title: Structs and Pattern Matching in Racket
description: "What struct binds, why opacity is the default, how generativity bites, and the match form that reuses constructor names as destructuring patterns."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-08
updated:
aliases:
  - Racket struct
  - Racket match
  - struct transparent
---

`(struct posn (x y))` is one line that binds four things. It is worth naming them before anything else, because almost every later design decision in Racket's struct system is a consequence of what this form does and does not create.

The Guide lists them. `posn` becomes a constructor function taking as many arguments as there are field identifiers and returning an instance. `posn?` becomes a predicate taking a single argument and returning `#t` if it is an instance of the structure type. `posn-x` and `posn-y` become accessors, one per field, each extracting the corresponding value. And `struct:posn` becomes a **structure type descriptor**, a value that represents the structure type as a first-class value.

New datatypes are normally created with `struct`. Even the class-based object system is implemented in terms of structure types.

> [!note] The idea
> A `struct` form does not describe a type. It *creates* one, at evaluation time, distinct from every structure type that already exists, including one with the same name and the same fields. Everything that feels surprising about Racket structs follows from that generativity plus a deliberate default of opacity: values print without their contents, `equal?` degenerates to identity, and a `struct` form nested inside a function silently manufactures a new incompatible type on every call. The compensating design is that the constructor name is simultaneously usable as a **pattern**, so destructuring costs no extra declaration.

## The form places no constraints on field values

`(struct posn (x y))` says nothing about what `x` and `y` may hold. The Guide is explicit: a `struct` form places no constraints on the kinds of values that can appear for fields, so `(posn "apple" #f)` produces a perfectly good `posn` even though those are not valid coordinates for the obvious uses. Enforcing constraints on field values, such as requiring them to be numbers, is normally the job of a [[cs/languages/Racket/contracts-and-blame|contract]].

That division of labor is the whole reason Racket's contract system is as elaborate as it is. The struct system supplies representation and identity; the contract system supplies obligation.

Mutation is opt-in and per-field. The `#:mutable` struct option causes all fields to be mutable and introduces a `set-posn-x!`-style mutator for each field; used as a field option instead, it makes an individual field mutable, so `(struct person (name [age #:mutable]))` gets `set-person-age!` and no `set-person-name!`. For the non-mutating case, `struct-copy` clones a structure and optionally updates specified fields in the clone, a process sometimes called a **functional update** because the result is a structure with updated field values while the original is not modified.

Subtyping is a positional extension. `(struct 3d-posn posn (z))` inherits the fields of its supertype, and the subtype constructor accepts values for the subtype fields *after* the supertype fields. An instance of the subtype can be used with the predicate and accessors of the supertype, so `(posn? p)` is `#t` and `(posn-x p)` works. There is no `3d-posn-x` selector; referencing it is an error, and the supertype's `posn-x` is the way to reach the inherited field.

## Opacity is a decision, not an oversight

By default an instance prints in a way that does not show any information about the fields' values. Structure types are **opaque**. Adding `#:transparent` after the field-name sequence makes an instance print like a call to the constructor, showing its field values, and also allows reflective operations such as `struct?` and `struct-info` to be used on its instances.

The Guide gives the rationale rather than leaving it implicit. Structure types are opaque by default because opaque instances provide more encapsulation guarantees: a library can use an opaque structure to encapsulate data, and clients cannot manipulate the data except as the library allows. Keeping accessors and mutators private to a module means no other module can rely on the representation.

Opacity reaches further than printing. A generic `equal?` comparison automatically recurs on the fields of a transparent structure type, but defaults to mere instance identity for opaque ones:

```racket
(struct glass (width height) #:transparent)
(equal? (glass 1 2) (glass 1 2))   ; => #t

(struct lead (width height))
(define slab (lead 1 2))
(equal? slab slab)                 ; => #t
(equal? slab (lead 1 2))           ; => #f
```

The escape is `#:methods` with `gen:equal+hash`, implementing three procedures: an equality procedure whose third argument is used instead of `equal?` for recursive testing so that data cycles can be handled correctly, and primary and secondary hash procedures for use with hash tables. The equality procedure is not required to recursively compare the fields; the Guide's example of a set structure comparing members irrespective of internal order is exactly the case that motivates the freedom. The obligation that comes with it is that the hash functions must produce the same value for any two structures that are supposed to be equivalent.

## Generativity, and the bug it causes

Each time a `struct` form is evaluated it generates a structure type distinct from all existing structure types, even if some other structure type has the same name and fields. The Guide calls this useful for enforcing abstractions and implementing programs such as interpreters, and immediately warns about placing a `struct` form in positions evaluated multiple times.

The demonstration is memorable because the error message looks impossible:

```racket
(define (add-bigger-fish lst)
  (struct fish (size) #:transparent)   ; new every time
  (cond [(null? lst) (list (fish 1))]
        [else (cons (fish (* 2 (fish-size (car lst)))) lst)]))

(add-bigger-fish null)                      ; => (list (fish 1))
(add-bigger-fish (add-bigger-fish null))    ; fish-size: contract violation
                                            ;   expected: fish?  given: (fish 1)
```

"Expected `fish?`, given `(fish 1)`" is correct and not a typo. The value printed as `(fish 1)` belongs to the previous call's structure type. Lifting the `struct` form to module level fixes it, and the same expression then yields `(list (fish 2) (fish 1))`.

Prefab types are the opposite extreme. A transparent structure type prints in a way that shows its content, but the printed form cannot be used in an expression to get the structure back, unlike the printed form of a number, string, symbol, or list. A **prefab** ("previously fabricated") structure type is a built-in type known to the Racket printer and expression reader; infinitely many such types exist, indexed by name, field count, supertype, and other details. Its printed form resembles a vector but starts with `#s` and carries the prefab type's name as the first element. Prefab types trade every encapsulation guarantee for round-tripping through [[cs/languages/Racket/s-expressions-and-evaluation|the reader]].

## The constructor name is also a pattern

`match` supports pattern matching on arbitrary Racket values, as opposed to functions like `regexp-match` that compare regular expressions to byte and character sequences. It takes the result of the target expression and tries each pattern in order; as soon as it finds a match it evaluates the corresponding expression sequence for the result. Pattern variables are treated like wildcards, and each is bound in the result expression to the input fragment it matched. From `racket/base` you need `(require racket/match)`.

Most Racket literal expressions can be used as patterns, and constructors like `cons`, `list`, and `vector` create patterns matching pairs, lists, and vectors. The distinction between them is real, not cosmetic: matching `'(1 . 2)` against `(list 1 2)` fails and against `(cons 1 2)` succeeds, and matching `#(1 2)` against `(list 1 2)` fails and against `(vector 1 2)` succeeds.

A constructor bound with `struct` can also be used as a pattern constructor. The Guide's example defines `(struct shoe (size color))` and `(struct hat (size style))` without `#:transparent`, and `(match (hat 23 'bowler) [(shoe 10 'white) "bottom"] [(hat 23 'bowler) "top"])` returns `"top"`. Struct patterns are resolved through the constructor binding rather than through runtime reflection, so opacity does not stand in their way the way it stands in `equal?`'s way.

Unquoted, non-constructor identifiers in a pattern are pattern variables bound in the result expressions, except `_`, which does not bind and is therefore the usual catch-all. `else` is not a reserved catch-all: if `else` appears in a pattern its binding from `racket/base` may be shadowed, which can cause problems with `cond` and `case`, and the Guide shows `case` failing with a syntax error for exactly this reason. To match against a value already bound to an identifier rather than rebinding the name, use `==`.

The ellipsis appears again, with the same shape it has in [[cs/languages/Racket/hygienic-macros-and-syntax-rules|macro patterns]] and a different implementation. Within a list or vector pattern `...` lets the preceding sub-pattern match any number of consecutive elements, and a pattern variable under an ellipsis is bound in the result to a list of matches. `(match '(1 2 3 4) [(list 1 x ... 4) x])` gives `'(2 3)`, and `(match (list (hat 23 'bowler) (hat 22 'pork-pie)) [(list (hat sz styl) ...) (apply + sz)])` gives `45`. Ellipses nest, binding pattern variables to lists of lists.

> [!example] `match` with quasiquote, as a one-line interpreter step
> Quasiquote can be used to build patterns, and the rule inverts the usual reading: unquoted portions of a normal quasiquoted form mean regular Racket evaluation, while inside a pattern the unquoted portions mean go back to regular pattern matching. The Guide uses it to desugar a binding form in a single clause.
>
> ```racket
> (match `{with {x 1} {+ x 1}}
>   [`{with {,id ,rhs} ,body} `{{lambda {,id} ,body} ,rhs}])
> ; => '((lambda (x) (+ x 1)) 1)
> ```
>
> The first quasiquote is a pattern and the second builds an expression. That is `let` reduced to a lambda application, written as one rewrite rule, which is close to the shortest honest illustration of [[cs/pl/lambda-calculus-syntax-substitution|why `let` is not primitive]].

> [!tip] Destructuring where an identifier is required
> `match-let` and `match-lambda` support patterns in positions that otherwise must be identifiers. `match-let` generalizes `let` to a destructuring bind, so `(match-let ([(list x y z) '(1 2 3)]) (list z y x))` produces `'(3 2 1)`.

## Related Notes

- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame]] - the layer that enforces what a `struct` form deliberately does not
- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation]] - the reader that prefab structures round-trip through
- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules]] - a second ellipsis-bearing pattern language, operating on syntax instead of values
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the type-theoretic account, including exhaustiveness
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the alternative datatype mechanism, itself built on structure types
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds]] - a statically checked take on the same "attach behavior to a data definition" problem

## Sources

- "5 Programmer-Defined Datatypes," The Racket Guide. https://docs.racket-lang.org/guide/define-struct.html . Supports `struct` as the normal way to create datatypes with classes implemented on top of structure types, the four bindings a `struct` form introduces (constructor, predicate, per-field accessors, structure type descriptor), the absence of constraints on field values with `(posn "apple" #f)` and the deferral to contracts, `struct-copy` as a functional update, structure subtypes with inherited fields, positional subtype constructors, supertype predicate and accessor reuse and the missing `3d-posn-x` selector, opacity by default with its encapsulation rationale, `#:transparent` printing and reflective access via `struct?` and `struct-info`, `equal?` recurring on transparent fields versus identity on opaque ones with the `glass`/`lead` examples, `gen:equal+hash` with its three procedures and cycle-safe recursive comparison plus the hash-consistency obligation, structure type generativity and the `add-bigger-fish` failure and fix, prefab structure types with their reader round-tripping and `#s` printed form, and the `#:mutable` struct and field options.
- "12 Pattern Matching," The Racket Guide. https://docs.racket-lang.org/guide/match.html . Supports `(require racket/match)` for `racket/base`, `match` operating on arbitrary Racket values as opposed to `regexp-match`, in-order clause trial with pattern variables bound as wildcards, literal expressions as patterns, `cons`/`list`/`vector` constructor patterns and the `'(1 . 2)` and `#(1 2)` discrimination examples, `struct`-bound constructors as pattern constructors with the `shoe`/`hat` example, `_` as the non-binding catch-all, the `else` shadowing hazard with `cond` and `case`, `==` for matching an already-bound value, ellipsis behavior in list and vector patterns with the `(list 1 x ... 4)` and `hat` summing examples and nested ellipses, quasiquote patterns with the inverted unquote reading and the `with` rewrite example, and `match-let`/`match-lambda` for destructuring binds.
