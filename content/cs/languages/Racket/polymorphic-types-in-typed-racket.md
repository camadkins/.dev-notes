---
title: Polymorphic Types in Typed Racket
description: "All and its type variables, the kind distinction between a type and a type constructor, and the specific place local type inference gives up."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases: []
---

Two functions, identical except for one word:

```racket
(: list-number-length (-> (Listof Number) Integer))
(: list-string-length (-> (Listof String) Integer))
```

Neither body uses the type of the elements. Typed Racket offers abstraction over types as well as values, so both collapse into one:

```racket
(: list-length (All (A) (-> (Listof A) Integer)))
```

`All` takes a list of type variables and a body type, and the type variables are allowed to appear free in the body of the `All` form. That is the entire surface syntax of polymorphism in the language. What makes the topic worth a note is everything around it: what a type variable can range over, where it is in scope, and the one predictable place the checker stops being able to figure it out on its own.

> [!note] The idea
> Typed Racket has a **kind distinction it enforces but never names**, and a type variable is scoped **lexically over the annotated definition** rather than over the type expression alone. `Listof` is not a type, it is a type constructor, and using one where the other belongs is a compile error with its own message. Meanwhile `(: my-id (All (a) (-> a a)))` puts `a` in scope inside the `define` that follows, so the body can write `[x : a]` and mean the same variable. Both facts follow from the annotation being a separate form from the definition, which is a design choice Typed Racket made and most languages with generics did not.

## Types and type constructors are different

The guide states it plainly: types and type constructors are different. Ask for `(ann 10 (Listof Listof))` and the checker reports that it expected a valid type and got a type constructor. Ask for `(ann 10 (Number Number))` and it reports bad syntax in a type application, expecting a type constructor and getting a type.

This is a kind system doing its job. `Number` has the kind of types; `Listof` has the kind of functions from types to types; applying either in the other's position is a kind error. Typed Racket does not use the word "kind" in the guide and offers no way to write kind annotations, but the two error messages are the arity check a kind system performs. Recognizing the shape saves confusion later, because the same distinction is what separates `Listof` from `(Listof A)` in every polymorphic signature you write.

Users define their own constructors two ways. A polymorphic struct declaration creates a type constructor and defines a namesake structure with one element, whose type is that of the type argument:

```racket
(struct Nothing ())
(struct (A) Just ([v : A]))
(define-type (Maybe A) (U Nothing (Just A)))
```

The type parameters, only `A` here, are written before the type name and can be referred to in the types of the fields. That placement is worth noticing next to plain [[cs/languages/Racket/structs-and-pattern-matching|Racket structs]], where nothing sits in that position at all. `define-type` then builds the union, and `Maybe` is a container for whatever type is supplied.

## Type variables are lexically scoped over the definition

When a `:` annotation includes type variables for parametric polymorphism, the type variables are lexically scoped, which means the type variables are bound in the body of the definition being annotated. That is why this works:

```racket
(: my-id (All (a) (-> a a)))
(define my-id (lambda ([x : a]) x))
```

The `a` inside the `lambda` is the `a` from the annotation above it. In a language where the type parameter is declared inline on the function, this arrangement is unremarkable. In Typed Racket the annotation is a *separate top-level form* that could in principle have nothing to do with the definition's internals, and the language deliberately connects them.

Lexical scope also implies that type variables can be shadowed. Nest a `helper` with its own `(All (a) (-> a a))` annotation inside `my-id` and the inner `a` refers to the helper's variable, not the outer one. Same rules as ordinary variables, which is the point of saying "lexically scoped" rather than inventing a separate discipline.

## No bounds on `All`, one constrained quantifier elsewhere

If you come from [[cs/languages/CSharp/constraints-on-type-parameters|C# generic constraints]] or Java's `<T extends Comparable<T>>`, the first thing you go looking for is the bound, and `All` does not have one. There is no place in `(All (A) ...)` to say that `A` must be a subtype of something. The union types and occurrence typing usually absorb the cases a bound would have covered: instead of constraining `A`, you take a `(U String Symbol)` and narrow.

The one genuinely constrained quantifier in the language is the row variable, and it lives in the class system. A class type can carry `#:row-var r`, and `row-inst` instantiates the row-polymorphic type of an expression with a specific row:

```racket
(: id (All (r #:row) (-> (Class #:row-var r) (Class #:row-var r))))
```

That is a quantifier ranging over the *rest of a class's members* rather than over a single type, which lets a mixin be typed once for every class it could be applied to. It is a narrower tool than a subtype bound and, for the problem it solves, a sharper one.

## Where inference gives up, exactly

Typed Racket's local type inference algorithm is currently not able to infer types for polymorphic functions that are used on higher-order arguments that are themselves polymorphic. The canonical failure is short enough to memorize:

```racket
(map cons '(a b c d) '(1 2 3 4))
```

This does not type-check. `map` is polymorphic, `cons` is polymorphic, and the algorithm cannot solve for `map`'s variables while `cons`'s are still open. The word *local* is the tell: unlike the global constraint solving of [[cs/pl/hindleymilner-type-inference|Hindley-Milner inference]], local type inference propagates information between adjacent expressions and does not unify across an entire definition. Passing a polymorphic value as an argument is exactly the case where the information does not flow far enough.

The fix is `inst`, which instantiates the polymorphic argument at a specific type: `(map (inst cons Symbol Integer) '(a b c d) '(1 2 3 4))`. The expression being instantiated must have a polymorphic type that can be applied to the supplied number of type variables, and `inst` is legal only in expression contexts.

> [!warning] Omitted type arguments silently become Any
> For non-poly-dotted functions, fewer arguments than the type has variables can be provided, and the omitted types default to `Any`. This behavior was added in version 1.12 of `typed-racket-lib`, and the guide's own example shows its consequence: `(foldr (inst my-cons α) null lst)` type-checks and produces `Any` rather than an error about a missing type argument. A partial instantiation is not a mistake the checker reports, it is a request for `Any`, and the precision loss shows up somewhere downstream where it will be harder to connect back.

## One inference behavior that runs the other way

The checker also generalizes without being asked. To make programming with invariant type constructors such as `Boxof` easier, Typed Racket generalizes types that are used as arguments to invariant type constructors. So `(box 0)` gets type `(Boxof Integer)`, not `(Boxof Zero)`, even though `0` has type `Zero`.

The narrow type would be technically correct and useless, since a `(Boxof Zero)` can only ever hold `0`, and invariance under [[cs/pl/subtyping-variance-type-constraints|subtyping and variance]] means it would not be usable where a `(Boxof Integer)` is expected. Generalization is the checker guessing your intent, and it guesses well in the common case. Worth knowing about anyway, because it means the type you get is sometimes wider than the one you would have derived by hand, and when you actually wanted the singleton you have to say so with an annotation.

## Related Notes

- [[cs/pl/hindleymilner-type-inference|Hindley-Milner and Type Inference]] - global unification, and why local inference fails where it does
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - the bounded quantifier Typed Racket's All does not have
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - why invariance makes the checker generalize a box's element type
- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching in Racket]] - the untyped struct form that the polymorphic declaration extends
- [[cs/languages/Racket/occurrence-typing|Occurrence Typing]] - narrowing a union, which is how Typed Racket handles many cases a bound would cover
- [[cs/languages/Go/type-inference-in-go|Type Inference in Go]] - another local inference algorithm and another documented list of what it will not do

## Sources

- "4 Types in Typed Racket," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/types.html . Supports Typed Racket abstracting over types as well as values, the type versus type constructor distinction with the `(Listof Listof)` and `(Number Number)` errors, `All` taking type variables and a body type with the variables free in the body, the `list-number-length` and `list-string-length` duplication motivating it, the polymorphic struct declaration creating a type constructor and namesake structure with parameters written before the type name and usable in field types, the `Maybe` definition, and type variables in a `:` annotation being lexically scoped over the annotated definition and shadowable.
- "2 Special Form Reference," The Typed Racket Reference. https://docs.racket-lang.org/ts-reference/special-forms.html . Supports `inst` requiring a polymorphic type applicable to the supplied number of type variables, `inst` being legal only in expression contexts, omitted type arguments for non-poly-dotted functions defaulting to `Any` as added in version 1.12, and `row-inst` instantiating a row-polymorphic type at a specific row with the `(All (r #:row) ...)` class example.
- "8 Caveats and Limitations," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/caveats.html . Supports local type inference being unable to infer types for polymorphic functions used on polymorphic higher-order arguments, the `(map cons ...)` failure and its `inst` fix, and Typed Racket generalizing types used as arguments to invariant type constructors such as `Boxof`.
