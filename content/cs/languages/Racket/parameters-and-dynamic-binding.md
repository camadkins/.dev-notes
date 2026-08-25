---
title: Parameters and Dynamic Binding
description: "Parameters as continuation marks over thread cells, why they beat a mutable global, and when dynamic scope is the right answer."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-30
updated:
aliases: []
---

Dynamic scope has a bad reputation earned in Lisps that made it the default. Racket makes it opt-in, gives it a first-class representation, and then uses it for most of the settings the runtime itself needs: the current output port, the current readtable, the print width in error messages. Understanding why those settings are parameters rather than globals is the fastest route into what dynamic binding is actually for.

> [!note] The idea
> A parameter is a setting that is both thread-specific and continuation-specific, and that pair of adjectives is the entire design. Parameters are essentially a derived concept in Racket, defined in terms of continuation marks and thread cells. Because the binding rides on [[cs/languages/Racket/delimited-continuations-and-prompts|a continuation mark on the nearest enclosing frame]], it unwinds automatically when control leaves, survives being captured in a continuation, and travels with that continuation across threads. Because the value lives in a thread cell, one thread's `parameterize` cannot corrupt another's. A mutable global has neither property, which is why replacing a global with a parameter is nearly always an improvement and almost never a regression.

## The behavior, stated exactly

`make-parameter` takes any value and returns a new parameter, initialized to that value in all threads. Applying the parameter as a function returns its current value. `parameterize` associates a new value with a parameter during the evaluation of body expressions, and when control leaves the form, whether through a normal return, an exception, or some other escape, the parameter reverts to its earlier value.

Two clarifications in the Guide separate parameters from things they resemble.

The first: `parameterize` is not a binding form like `let`. Each use of the parameter refers directly to the original definition, so `parameterize` adjusts the value of the parameter during the whole time the body is evaluated, even for uses of the parameter that are textually outside of the body. That is exactly [[cs/pl/scoping-binding-and-closures|the property lexical scope refuses to give you]], and it is the reason parameters exist. A function defined in another module, called five frames down, sees the new value without anyone threading an argument through.

The second cuts the other way. If a use of a parameter is textually inside the body but is not evaluated before the `parameterize` form produces a value, the use does not see the installed value:

```racket
(let ([get (parameterize ([location "with a fox"])
             (lambda () (location)))])
  (get))
; => "here"
```

The closure captured the lexical environment, which never contained the parameter binding in the first place. Dynamic extent is time, not text. Every bug people write with parameters is some version of forgetting that sentence.

## The case against a variable and `set!`

The Guide poses the obvious objection directly: a plain variable plus `set!` solves many of the same problems. It then lists what you lose, and the list is worth memorizing because each entry names a failure mode.

`parameterize` helps automatically reset the value of a parameter when control escapes due to an exception. Adding exception handlers and other forms to rewind a `set!` is relatively tedious, and tedious means it gets skipped on the error path, which is where it matters.

Parameters work with tail calls. The last body in a `parameterize` form is in tail position with respect to the `parameterize` form, so a loop written inside one does not accumulate frames. A `set!`-and-restore pattern written as a `dynamic-wind` cannot say that, because the restore has to happen after the body returns.

Parameters work properly with threads. `parameterize` adjusts the value only for evaluation in the current thread, which avoids race conditions with other threads. A `set!` on a shared box is visible to everyone, immediately, and [[cs/systems/concurrency-primitives|the synchronization needed to make that safe]] is exactly the work a thread cell already did for you.

There is a fourth advantage the Reference adds. `make-parameter` accepts a guard procedure. A guard procedure takes one argument, receives whatever value the parameter procedure is applied to, and returns the value actually stored, or raises an exception to reject the change. The guard is not applied to the initial value. That gives a parameter something a variable cannot have: a validity invariant enforced at every assignment point, without a single caller knowing it exists.

## The implementation explains the semantics

The Reference's model section is short and worth reading literally, because every surprising behavior falls out of it. In the empty continuation, each parameter corresponds to a preserved thread cell, and the parameter procedure accesses and sets that cell's value for the current thread. In a non-empty continuation, the value is determined through a parameterization that is associated with the nearest enclosing continuation frame via a continuation mark whose key is not directly accessible. A parameterization maps each parameter to a preserved thread cell, and the combination of the thread cell and the current thread yields the value. `parameterize` and `call-with-parameterization` install a parameterization into the current continuation's frame.

So a parameter lookup is a mark lookup, then a thread-cell read. That two-step is why the following all hold at once. `parameterize` introduces a fresh thread cell for the dynamic extent of its body, so nesting works. When a new thread is created, its initial continuation gets the creating thread's parameterization, and because each cell is preserved, the new thread inherits the parameter values of its creator. When a continuation is moved from one thread to another, settings introduced with `parameterize` effectively move with the continuation, because they were never stored in the thread to begin with.

Direct assignment is the odd one out. Calling the parameter procedure with a value changes the value in a thread cell, and therefore changes the setting only for the current thread. The Reference notes a consequence for the collector that catches people building long-lived servers: the value originally associated through `parameterize` remains reachable as long as the continuation is reachable, even if the parameter is later mutated.

> [!warning] Mutation is still available and still worse
> A parameter can be set imperatively, and inside an active `parameterize` the assignment affects only that parameterization. Using `parameterize` is generally preferable to updating a parameter value imperatively, for much the same reasons that binding a fresh variable with `let` is preferable to using `set!`. [[cs/pl/mutable-state-references-effects|The general argument about effects]] applies unchanged; the parameter mechanism just makes the disciplined version cheaper than the undisciplined one, which is the only reliable way to win that argument.

## When dynamic binding is the right tool

The pattern to look for is a setting that many layers deep in a call chain must observe, that the intermediate layers have no reason to know about, and that must be restored when the operation finishes or fails. Output redirection, [[cs/languages/Racket/reader-extension-and-custom-syntax|the readtable in force during a read]], a database transaction handle, a locale, a random seed, a security clearance for the current request. Threading each of those through every signature is invasive and gets skipped; making each a global is unsafe under concurrency and unsound under escape.

The tell that you have the wrong tool is when the callee's behavior becomes hard to predict from its arguments. Racket's own naming convention exists to make that visible: parameters are named `current-something`, so a reader can tell at a glance which values arrive dynamically. Parameters correspond to preserved thread fluids in Scsh, and the lineage matters: this is the Scheme community's second attempt at dynamic binding, made after the first attempt taught everyone what goes wrong when it is the default.

## Related Notes

- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the lexical default that parameters deliberately depart from
- [[cs/pl/mutable-state-references-effects|Mutable State, References, and Effects]] - the general case of the argument against `set!`
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - the races a thread cell removes without a lock
- [[cs/languages/Racket/delimited-continuations-and-prompts|Delimited Continuations and Prompts]] - continuation marks, the mechanism a parameterization rides on
- [[cs/languages/Racket/reader-extension-and-custom-syntax|Reader Extension and Custom Syntax]] - `current-readtable` as a parameter in practice
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame]] - guard procedures as a per-assignment check, and where that idea generalizes

## Sources

- "4.13 Dynamic Binding: parameterize," The Racket Guide. https://docs.racket-lang.org/guide/parameterize.html . Supports `make-parameter` and applying a parameter to read it, `parameterize` installing a value for the body and reverting on normal return, exception, or escape, `parameterize` not being a binding form and affecting textually external uses, the closure example where the use does not see the installed value, imperative assignment affecting only the active parameterization, the preference for `parameterize` over imperative update, and the three listed advantages over `set!` covering exception escape, tail position, and per-thread adjustment.
- "4.14 Parameters," The Racket Reference. https://docs.racket-lang.org/reference/parameters.html . Supports parameters corresponding to preserved thread fluids in Scsh, `parameterize` introducing a fresh thread cell for the dynamic extent of its body, thread creation inheriting the creator's parameterization, settings moving with a continuation across threads, direct assignment changing only the current thread's cell, the reachability consequence for values installed by `parameterize`, and the guard procedure including its one argument, its ability to reject a value, and its non-application to the initial value.
- "1.1 Evaluation Model," The Racket Reference. https://docs.racket-lang.org/reference/eval-model.html . Supports parameters being a derived concept defined in terms of continuation marks and thread cells, a parameter being both thread-specific and continuation-specific, the empty-continuation thread-cell correspondence, the parameterization carried on the nearest enclosing frame via an inaccessible continuation mark, and parameterizations mapping parameters to preserved thread cells.
