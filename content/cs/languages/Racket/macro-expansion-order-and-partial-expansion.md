---
title: Macro Expansion Order and Partial Expansion
description: "The expander as a small-step machine over syntax objects, the implicit forms that keep every term a binding lookup, and local-expand's stop list."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-07-06
updated:
aliases:
  - local-expand
---

Ask what `5` expands to in Racket and the answer is not "itself." It expands to `(#%datum . 5)`. Ask what `(f x)` expands to when `f` is a variable and the answer is `(#%app f x)`. The expander does not have a case for "this is just a literal" or "this is just a function call". It has a case for "look up the binding of the leading identifier", and it manufactures a leading identifier when the term does not already have one.

> [!note] The idea
> The Racket expander is a **small-step machine whose only real operation is binding lookup**, and the three implicit forms `#%app`, `#%datum`, and `#%top` exist so that no term can escape that operation. Because the lookup consults lexical context, and because a module can rebind `#%app` or `#%datum`, there is no privileged syntactic category outside the macro system. Expansion order is observable for the same reason: transformers are procedures called in a determined sequence, in a determined context, and `local-expand` lets one of them run the expander on a subform and inspect the intermediate result.

## One step, four shapes

Expansion recursively processes a syntax object in a particular phase level, starting with phase level 0. Bindings from the syntax object's lexical information drive the expansion process and cause new bindings to be introduced for the lexical information of sub-expressions, so the annotations described in [[cs/languages/Racket/syntax-objects-and-lexical-context|syntax objects and lexical context]] are the machine's state, not decoration on it.

Each single step in expanding a syntax object at a particular phase level depends on the immediate shape of the syntax object being expanded, and there are four shapes:

1. **An identifier.** Its lexical information determines a binding, and that binding is used to continue. If it is unbound, the expander builds a `#%top` identifier with the same lexical information and uses that binding instead; if `#%top` has no binding either, expansion fails with `exn:fail:syntax`.
2. **A pair whose first element is a bound identifier** (other than a top-level variable). That identifier's binding is used to continue.
3. **Any other pair.** The expander creates a `#%app` identifier from the pair's lexical information and continues with its binding, failing if `#%app` is unbound.
4. **Anything else.** The expander creates a `#%datum` identifier the same way.

The Reference then draws the conclusion the four cases were built for: the possibilities that do not fail lead to an identifier with a particular binding. Every step converges to a lookup. That binding then names one of exactly three things: a transformer, a variable, or a core syntactic form. If it is a transformer whose value is a procedure of one argument, the procedure is called as a syntax transformer and parsing starts again with the syntax-object result.

Reading that as a rewriting relation is the right instinct. It is a small-step semantics in the sense of [[cs/pl/operational-semantics-big-step-small-step|operational semantics]], with syntax objects as configurations, "resolve and dispatch" as the step relation, and the fully expanded core language as the set of normal forms. What the Reference calls a complete expansion is a normal form of that relation. The relationship between that core and the surface language people actually write is the subject of [[cs/languages/Racket/language-design-from-core-to-surface-racket|core to surface]].

## Context is an argument to the step

Each expansion step occurs in a particular context, and transformers and core syntactic forms may expand differently for different contexts. The five are top-level, module-begin, module, internal-definition, and expression, and a `module` form is allowed only in top-level or module context.

Different core forms parse sub-forms in different contexts, and the canonical demonstration is a single form using two. A `let` always parses the right-hand expressions of a binding in an expression context, but it starts parsing the body in an internal-definition context. That is why `(let ([x 1]) (define y 2) (+ x y))` is legal while `(let ([x (define y 2)]) ...)` is not, and it is a fact about the *expander's* dispatch, not about the runtime semantics of `let`. A macro can read the current context with `syntax-local-context` and produce different code accordingly, which is how forms like `define` manage to mean different things at module level and inside a body.

## Order is observable

The transformer is a procedure. Procedures run in an order, can allocate, can consult and mutate compile-time state, and can raise errors. So the sequence in which the expander reaches subforms is not an implementation detail, it is part of the language's behavior.

The phase discipline shows up here too. The call to a syntax transformer is parameterized so that `current-namespace` is a namespace that shares bindings and variables with the namespace being used to expand, except that its base phase is one greater. Expansion at phase 0 runs transformers whose own world sits at phase 1, and in some cases a sub-expression is expanded in a phase deeper, having a bigger phase level number, than the enclosing expression.

The comparison worth drawing is with [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|C++ two-phase name lookup]], which also splits name resolution into a moment before substitution and a moment after. C++ fixes the split at two phases and specifies which names are looked up when; Racket makes the phase a number that can grow without bound and makes the expansion sequence itself something a program can observe and intervene in. The observability is a feature bought at the price of the expander's behavior becoming part of the specification, which is the same trade discussed for runtime in [[cs/pl/evaluation-order-and-strictness|evaluation order and strictness]], moved to compile time.

## Partial expansion

`local-expand` expands a syntax object in the lexical context of the expression currently being expanded, and its `stop-ids` argument controls how far it goes. Three regimes:

- **Empty list.** The form is recursively expanded, with expansion proceeding to sub-expressions, and the result is guaranteed to be a fully-expanded form.
- **A non-empty list.** The core forms (`begin`, `quote`, `set!`, `#%plain-lambda`, `if`, `let-values`, `#%plain-app`, `#%top`, and the rest) are implicitly added to the list. Expansion proceeds recursively, stopping when the expander encounters any of the forms in `stop-ids`, and the result is the partially-expanded form.
- **`#f`.** The form is expanded only as long as its outermost form is a macro, without proceeding to sub-expressions. This is the "peel one layer" mode, and in it the implicit `#%app`, `#%datum`, and `#%top` identifiers are never introduced.

Partial expansion is what lets a macro see enough of its input to make a decision without committing to expanding the whole thing. A form that needs to know which of its body's subforms are definitions has to expand each one far enough to see whether it turns into `define-values`, then stop, because expanding further would fix the meaning of code the macro still intends to rearrange.

> [!warning] Stopping changes what the result looks like
> The stop list interacts with the implicit forms in a way that surprises people the first time. When the expander would normally introduce a `#%app`, `#%datum`, or `#%top` identifier, it checks whether an identifier with the same binding appears in `stop-ids`, and if so the identifier is not introduced. The result of expansion is then the bare application, literal data expression, or unbound identifier rather than one wrapped in the respective explicit form. So a partially expanded result is not simply a prefix of a fully expanded one, it can be *shaped differently*, and code that pattern-matches on `#%app` in a partial expansion has to account for its absence.
>
> One more asymmetry: independent of `stop-ids`, when `local-expand` encounters an identifier that has a local binding but no binding in the current expansion context, the variable is left as-is rather than triggering an out-of-context syntax error. That leniency is what makes it practical to expand a fragment lifted out of its original position.

## Why this is the interesting part of the macro system

Pattern matching and hygiene are what make macros usable. The expander's algorithm is what makes them *composable*, because a macro that can call the expander is a macro that can be written against the expansion of code it did not write. Every serious Racket macro that implements a binding form, a definition context, or a new `#lang` is written against the model above rather than against a template language, and the four-case dispatch is short enough to keep in your head while you do it.

## Related Notes

- [[cs/languages/Racket/syntax-objects-and-lexical-context|Syntax Objects and Lexical Context]] - the state the expander steps over
- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics: Big-Step and Small-Step]] - reading expansion as a step relation with normal forms
- [[cs/languages/Racket/language-design-from-core-to-surface-racket|Racket: From Core to Surface]] - the fully expanded core language expansion terminates in
- [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|Template Instantiation and the Two-Phase Rule]] - another language that splits name lookup across compile-time stages
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - the same observability question, one stage later
- [[cs/languages/Racket/syntax-parse-and-specification-driven-macros|syntax-parse and Specification-Driven Macros]] - why `expr` cannot validate an expression without invoking this machinery

## Sources

- "1.2 Syntax Model," The Racket Reference. https://docs.racket-lang.org/reference/syntax-model.html . Supports expansion recursively processing a syntax object at a phase level starting from 0, bindings from lexical information driving expansion and introducing bindings for sub-expressions, sub-expressions sometimes expanding at a deeper phase, each step depending on the immediate shape of the syntax object, the four shape cases with `#%top`, `#%app`, and `#%datum` introduction and their `exn:fail:syntax` failures, every non-failing case leading to an identifier with a binding, the transformer/variable/core-form trichotomy, a one-argument transformer procedure being called with parsing restarted on its result, the transformer call parameterizing `current-namespace` to a namespace whose base phase is one greater, expansion contexts and their list, and `let` parsing right-hand sides in expression context and its body in internal-definition context.
- "12.4 Syntax Transformers," The Racket Reference. https://docs.racket-lang.org/reference/stxtrans.html . Supports `local-expand` expanding in the lexical context of the expression currently being expanded, `stop-ids` controlling how far expansion goes, the empty-list case producing a guaranteed fully-expanded form, the non-empty-list case implicitly adding the core forms and stopping at any listed form to yield a partially-expanded form, the `#f` case expanding only while the outermost form is a macro and never introducing the implicit identifiers, the suppression of `#%app`, `#%datum`, and `#%top` introduction when a same-binding identifier is in `stop-ids`, and locally bound identifiers with no binding in the current expansion context being left as-is.
