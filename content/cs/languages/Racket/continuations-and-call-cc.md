---
title: Continuations and call/cc in Racket
description: "What call/cc captures, why Racket's version is delimited by a prompt, and the difference between escaping once and re-entering a saved future."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-03-30
updated:
aliases:
  - call-with-current-continuation
---

Whenever a Scheme expression is evaluated there is a continuation wanting the result of the expression, and that continuation represents an entire default future for the computation. At the top level it might take the result, print it, prompt for the next input, evaluate that, and so on forever. R5RS makes the point that these continuations are ubiquitous and normally hidden behind the scenes, and that programmers do not think much about them. `call-with-current-continuation` is the procedure that hands one to you as an ordinary value.

The general theory of continuations and continuation-passing style is in [[cs/pl/continuations-cps|Continuations and CPS]]. This note is about what Racket specifically gives you, which is not quite the classical operator.

> [!note] The idea
> In Racket, `call/cc` is not a primitive that grabs "the whole rest of the program." It captures the current continuation *up to the nearest prompt*, and applying that continuation first aborts to the prompt and then restores what was saved. Every thread's continuation starts with a prompt, so the classical whole-program behavior is just the default case of a delimited system. The consequence that surprises people: `call-with-composable-continuation` and `call/cc` capture the *same* thing, and differ only in whether application aborts first. Escape versus re-entrant is not two operators. It is one operator used at two different times.

## The classical description, and where it stops

R5RS describes `call-with-current-continuation` as packaging up the current continuation as an **escape procedure** and passing it as an argument to `proc`. That escape procedure, if it is later called, will abandon whatever continuation is in effect at that later time and instead use the continuation that was in effect when the escape procedure was created.

Two properties in that description do most of the work. First, the escape procedure has unlimited extent just like any other procedure in Scheme; it may be stored in variables or data structures and may be called as many times as desired. Second, calling it may cause the invocation of before and after thunks installed using `dynamic-wind`. A continuation is a value with a lifetime and a protocol, not a syntactic jump.

The canonical escape use is a loop exit:

```racket
(call-with-current-continuation
  (lambda (exit)
    (for-each (lambda (x)
                (if (negative? x) (exit x)))
              '(54 0 37 -3 245 19))
    #t))
```

which evaluates to `-3`. R5RS is candid that if all real uses were this simple there would be no need for a procedure with the power of `call-with-current-continuation`, and the rationale says the same thing from the other side: a common use is structured [[cs/pl/exceptions-handlers-and-non-local-control|non-local exit]] from loops or procedure bodies, but the operator is extremely useful for implementing a wide variety of advanced control structures.

The history in the same rationale is worth carrying. Most programming languages incorporate one or more special-purpose escape constructs named `exit`, `return`, or `goto`. In 1965 Peter Landin invented a general purpose escape operator called the J-operator; John Reynolds described a simpler but equally powerful construct in 1972; the `catch` special form in the 1975 report on Scheme is exactly the same as Reynolds's construct. Several Scheme implementors then noticed that the full power of `catch` could be provided by a procedure rather than a special syntactic construct, and the name `call-with-current-continuation` was coined in 1982. The abbreviation `call/cc` exists because opinions differ on the merits of such a long name.

## Racket's version is delimited

The Racket Guide defines a continuation as a value that encapsulates a piece of an expression's evaluation context, and the word "piece" is load-bearing. `call-with-composable-continuation` captures the current continuation starting outside the current function call and running up to the **nearest enclosing prompt**, and each REPL interaction is implicitly wrapped in a prompt.

The Guide's demonstration replaces a leaf with a capture:

```racket
(define saved-k #f)
(define (save-comp!)
  (call-with-composable-continuation
    (lambda (k) (set! saved-k k) 0)))
(+ 1 (+ 1 (+ 1 (save-comp!))))   ; => 3
```

The continuation in `saved-k` encapsulates the program context `(+ 1 (+ 1 (+ 1 ?)))`, and is encapsulated so that it behaves like `(lambda (v) (+ 1 (+ 1 (+ 1 v))))`. So `(saved-k 0)` is `3`, `(saved-k 10)` is `13`, and `(saved-k (saved-k 0))` is `6`.

What is captured is determined dynamically, not syntactically. Calling `save-comp!` from the base case of a recursive `sum` makes `saved-k` become `(lambda (x) (+ 5 (+ 4 (+ 3 (+ 2 (+ 1 x))))))`, so `(saved-k 0)` is `15` and `(saved-k 10)` is `25`. The captured value reflects the [[cs/dsa/stack|call stack]] that existed at capture time, not the text around the capture.

The Reference states the delimiting rule exactly: `call/cc` captures the current continuation up to the nearest prompt tagged by `prompt-tag`, and if no such prompt exists the `exn:fail:contract:continuation` exception is raised. The truncated continuation includes only continuation marks and `dynamic-wind` frames installed since the prompt. `call/cc` is an alias for `call-with-current-continuation`, and the default tag is `(default-continuation-prompt-tag)`, for which each thread's continuation starts with a prompt using the default handler. That last fact is why the classical behavior looks primitive: the prompt is always there, so you never have to install one.

## Abort, then restore

The Reference spells out application of a `call/cc` continuation as a three-step operation. Applying it removes the portion of the current continuation up to the nearest prompt tagged by `prompt-tag` (not including the prompt), or up to the nearest continuation frame shared by the current and captured continuations, whichever is first. While removing continuation frames, `dynamic-wind` post-thunks are executed. Finally the unshared portion of the captured continuation is appended to the remaining continuation, applying `dynamic-wind` pre-thunks.

`call-with-composable-continuation` drops step one. Applying its result does not remove any portion of the current continuation; application always extends the current continuation with the captured continuation. The Guide's one-line contrast is the clearest possible test:

```racket
; with save-comp!  (composable)
(+ 1 (saved-k 0))   ; => 4
; with save-cc!    (call/cc)
(+ 1 (saved-k 0))   ; => 3
```

The composable continuation returns 3 into the surrounding `(+ 1 _)`, giving 4. The `call/cc` continuation aborts that `(+ 1 _)` away first, so its 3 goes straight to the prompt. This is the reason for the names. Continuations in Racket are sometimes called delimited continuations, since a program can introduce new delimiting prompts, and the ones from `call-with-composable-continuation` are called composable because they do not have a built-in abort. Other Scheme systems traditionally support a single prompt at program start instead of allowing new prompts.

Arguments supplied to an applied continuation become the result values for the restored continuation, and if multiple arguments are supplied the continuation receives multiple results. R5RS is stricter here: except for continuations created by `call-with-values`, all continuations take exactly one value, and passing no value or more than one to such a continuation is unspecified. A continuation can also be invoked from a thread other than the one where it was captured.

## Escape continuations are a different, cheaper thing

Racket has a separate operator for the exit-a-loop case. `call-with-escape-continuation`, aliased `call/ec`, is like `call/cc` except that `proc` is not called in [[cs/languages/Racket/proper-tail-calls-and-the-loop-question|tail position]] and the continuation procedure supplied to `proc` can only be called during the dynamic extent of the `call/ec` call. That single restriction is the difference between an escape and a re-entry: a `call/cc` continuation can be stashed and resumed after its original context has already returned, and a `call/ec` continuation cannot.

The Reference is unusually blunt about why the operator exists. A continuation obtained from `call-with-escape-continuation` is actually a kind of prompt, and escape continuations are provided mainly for backwards compatibility, since they pre-date general prompts in Racket. In the BC implementation, `call/ec` is implemented more efficiently than `call/cc`, so it can sometimes be substituted to improve performance in those older variants.

Both have binding-form sugar. `(let/cc k body ...+)` is equivalent to `(call/cc (lambda (k) body ...))`, and `(let/ec k body ...+)` to the same over `call/ec`.

> [!example] Why `dynamic-wind` has to be part of the story
> `dynamic-wind` applies three thunks in order, the value of the expression being what `value-thunk` returns, with `pre-thunk` invoked before and `post-thunk` after. Its special properties are manifest when control jumps into or out of the `value-thunk` application, either due to a prompt abort or a continuation invocation: every time control jumps into the application `pre-thunk` is invoked, and every time control jumps out `post-thunk` is invoked. A re-entrant continuation therefore does not merely restore a stack. It re-runs every entry handler on the way in and every exit handler on the way out, which is what keeps resource acquisition and release paired when control flow stops being a tree.

> [!warning] Capture is not free, and not always legal
> The captured continuation is delivered to `proc`, which is called in tail position with respect to the `call/cc` call, so the operator itself adds no frame. Application is where the cost and the failure modes live. If applying a continuation would introduce a continuation barrier by replacing the current continuation, `exn:fail:contract:continuation` is raised, and `call-with-composable-continuation` raises the same exception at capture time if a continuation barrier appears before the closest matching prompt, because applying the result would always fail.

## Related Notes

- [[cs/pl/continuations-cps|Continuations and CPS]] - the general theory, and continuation-passing style as an implementation route
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the constrained special case that most languages ship instead
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - a re-entrant control structure that continuations can implement directly
- [[cs/pl/abstract-machines-cek-secd|Abstract Machines: CEK and SECD]] - where the continuation appears as an explicit machine component
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - a one-shot, non-reentrant slice of the same idea
- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation]] - the evaluation context that a continuation is a piece of

## Sources

- "10.3 Continuations," The Racket Guide. https://docs.racket-lang.org/guide/conts.html . Supports the definition of a continuation as encapsulating a piece of an expression's evaluation context, `call-with-composable-continuation` capturing from outside the current call up to the nearest enclosing prompt, each REPL interaction being implicitly wrapped in a prompt, the `(+ 1 (+ 1 (+ 1 ?)))` worked example with its `3`/`13`/`6` results, dynamic rather than syntactic capture in the `sum` example, `call/cc` aborting to the current prompt before restoring, the `4` versus `3` contrast between composable and `call/cc` continuations, the single-prompt convention in other Scheme systems, and the delimited/composable terminology.
- "10.4 Continuations," The Racket Reference. https://docs.racket-lang.org/reference/cont.html . Supports `call/cc` capturing up to the nearest prompt tagged by `prompt-tag` with `exn:fail:contract:continuation` otherwise, the truncated continuation including only marks and `dynamic-wind` frames since the prompt, `proc` being called in tail position, the abort-then-append application semantics with post-thunks and pre-thunks, multiple arguments becoming multiple results, the continuation-barrier exceptions at application and at composable capture, cross-thread invocation, `call/cc` as an alias, `call-with-composable-continuation` never removing continuation frames, `call/ec` restrictions and its backwards-compatibility and BC-performance rationale, `let/cc` and `let/ec` equivalences, the per-thread default prompt, and the `dynamic-wind` thunk ordering and jump-in/jump-out behavior.
- "Revised^5 Report on the Algorithmic Language Scheme, section 6.4," schemers.org. https://schemers.org/Documents/Standards/R5RS/HTML/r5rs-Z-H-9.html . Supports the escape-procedure description of `call-with-current-continuation`, its unlimited extent and repeated callability, `dynamic-wind` thunks being invoked by it, the one-value rule outside `call-with-values`, the `-3` loop-exit example, the rationale that continuations represent an entire default future and are normally hidden, the structured-non-local-exit versus advanced-control-structures framing, and the Landin 1965 J-operator, Reynolds 1972, 1975 Scheme report `catch`, and 1982 naming history.
