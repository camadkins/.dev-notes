---
title: Delimited Continuations and Prompts
description: "Prompt tags, abort semantics, and the single reduction-rule difference that separates shift from control."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-27
updated:
aliases: []
---

[[cs/languages/Racket/continuations-and-call-cc|Racket's `call/cc` is already delimited]], because every thread's continuation begins with a prompt. That note covers capture. This one covers the delimiter itself: what a prompt is, what a tag buys, and why the research literature contains four families of operators that all look like they do the same thing.

> [!note] The idea
> A prompt is not a special construct bolted onto the continuation. It is a special kind of continuation frame annotated with a specific prompt tag, essentially a continuation mark. Once the delimiter is an ordinary frame carrying an ordinary mark, two things follow that do not follow for undelimited `call/cc`. Capture up to the nearest prompt with a given tag yields a value with a finite, known extent, which makes it behave like a function instead of like a jump. And because tags are generative, two libraries can each install their own prompts in the same program without either one intercepting the other's aborts. Composability of control abstractions is a naming problem, and the tag is the name.

## The three operations on a prompt

The Reference describes the layer in terms of what operations are available at a prompt. Various operations allow the capture of frames in the continuation from the redex position out to the nearest enclosing prompt with a particular prompt tag, and such a continuation is sometimes called a delimited continuation. Other operations extend the current continuation with a captured one, specifically a composable continuation. Yet others abort the computation to the nearest enclosing prompt with a particular tag, or replace the continuation up to that prompt with another one. When a delimited continuation is captured, the marks associated with the relevant frames are captured too.

`call-with-continuation-prompt` installs one. It applies `proc` to the given arguments with the current continuation extended by a prompt, tagged by a `prompt-tag` that must come from `default-continuation-prompt-tag` or `make-continuation-prompt-tag`. The `handler` argument specifies a handler procedure to be called in tail position with respect to the `call-with-continuation-prompt` call when the installed prompt is the target of an `abort-current-continuation` call with that tag.

`abort-current-continuation` is the other half. It resets the current continuation to that of the nearest prompt tagged by the given tag in the current continuation, and if no such prompt exists, `exn:fail:contract:continuation` is raised. The values passed are delivered as arguments to the target prompt's handler procedure.

Read those two paragraphs as a pair and a familiar shape appears. Install a frame, name it, unwind to it from arbitrary depth, run a handler with the values you unwound with, and fail loudly if no such frame is in scope. That is [[cs/pl/exceptions-handlers-and-non-local-control|exception handling]], written in its general form. Exceptions are the special case where the handler never resumes.

## Tags are generative for a reason

`make-continuation-prompt-tag` creates a prompt tag that is not `equal?` to the result of any other value, including prior or future results of the same function. A library that wants a private control boundary allocates one at module level, and no other library can abort to it by accident, because no other library can construct that tag.

The default tag is the shared one. Its handler protocol is a convention rather than a rule: when `abort-current-continuation` is used with the default tag, a single thunk should generally be supplied that suits the default prompt handler, and a `call-with-continuation-prompt` on the default tag should generally accept a single thunk. If `handler` is `#f`, the default handler accepts a single abort thunk and calls `(call-with-continuation-prompt abort-thunk prompt-tag #f)`. That is, the default handler re-installs the prompt and continues with a given thunk, which is why aborting to the default prompt behaves like restarting rather than like escaping.

## Barriers, and where they show up uninvited

Delimiting is only half the safety story. A continuation barrier is another kind of continuation frame that prohibits certain replacements of the current continuation: a continuation can be replaced by another only when the replacement introduces no barriers, which prevents downward jumps into a protected context.

The list of places Racket installs one automatically is longer than most people expect. Racket installs a continuation barrier around evaluation in the following contexts, preventing full-continuation jumps into the evaluation context protected by the barrier: applying an exception handler, an error escape handler, or an error display handler; applying a macro transformer, evaluating a compile-time expression, or applying a module name resolver; applying a custom-port procedure, an event guard, or a parameter guard; applying a security-guard procedure; applying a will procedure; and evaluating or loading code from the stand-alone Racket command line.

That list is a map of the places where re-entering an old continuation would corrupt an invariant the runtime depends on. A macro transformer that could be resumed twice would expand a program twice; a parameter guard that could be resumed would validate a value into a context that no longer exists.

## Four operator families, one distinction that matters

`racket/control` provides various control operators from the research literature on higher-order control operators, plus a few extra convenience forms. They are implemented in terms of `call-with-continuation-prompt`, `call-with-composable-continuation`, and the rest, and they generally work sensibly together. Many are redundant: `reset` and `prompt` are interchangeable.

The differences live entirely in the reduction rules, which the Reference states directly. For `control`, among the earliest operators for higher-order control:

```
(prompt E[(control k expr)]) => (prompt ((lambda (k) expr) (lambda (v) E[v])))
```

For Danvy and Filinski's `shift`:

```
(reset E[(shift k expr)]) => (reset ((lambda (k) expr) (lambda (v) (reset E[v]))))
```

Compare the captured function in each. `control` hands back `(lambda (v) E[v])`. `shift` hands back `(lambda (v) (reset E[v]))`. One `reset`, and it changes everything about how the captured continuation behaves when invoked: a `shift`-captured continuation re-delimits itself, so invoking it cannot leak control past the boundary it came from, while a `control`-captured one splices its context into whatever prompt is current at the time of the call. The zero-suffixed family (`prompt0`, `control0`, `shift0`) generalizes further by dropping the outer delimiter from the rule, so the abort removes the prompt instead of reinstating it.

This is exactly the kind of comparison that [[cs/pl/operational-semantics-big-step-small-step|small-step reduction rules over evaluation contexts]] exist to make legible. Prose descriptions of these four families read as near-synonyms. The rules differ in one subterm and the difference is decidable by looking.

> [!example] The two-line demonstration
> `(% (+ 2 (fcontrol 5)) (lambda (v k) (k v)))` produces `7`, and `(% (+ 2 (fcontrol 5)) (lambda (v k) v))` produces `5`. Same capture, same delimiter, same value. The only difference is whether the handler chooses to invoke the captured continuation. That choice, made by the handler rather than by the capturing operator, is the whole reason delimited operators subsume exceptions, generators, and backtracking at once. Racket's support for prompts and composable continuations closely resembles Sitaram's `%` and `fcontrol` operator, which is why these two forms appear in the library alongside the Danvy-Filinski pair.

The practical upshot for a working programmer is narrower than the theory suggests. You will rarely write `shift` by hand. You will use [[cs/pl/coroutines-and-generators|generators]], engines, and web-server continuations that are built on prompts, and the tag discipline is what lets all three coexist in one program without a private convention about who owns the boundary.

## Related Notes

- [[cs/languages/Racket/continuations-and-call-cc|Continuations and call/cc]] - capture, composable continuations, and escape continuations
- [[cs/pl/continuations-cps|Continuations and CPS]] - the theory and the transformation that makes continuations explicit
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the abort-to-a-named-frame pattern in its restricted form
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - what most programmers actually consume prompts through
- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics: Big-Step and Small-Step]] - the notation that makes the four operator families distinguishable
- [[cs/pl/abstract-machines-cek-secd|Abstract Machines: CEK and SECD]] - where the continuation is a data structure you can point at

## Sources

- "1.1 Evaluation Model," The Racket Reference. https://docs.racket-lang.org/reference/eval-model.html . Supports a prompt being a continuation frame annotated with a prompt tag and essentially a continuation mark, capture out to the nearest enclosing prompt yielding a delimited continuation, composable continuations extending the current continuation, abort and replace operations, marks being captured with the frames, and the definition and downward-jump effect of a continuation barrier.
- "10.4 Continuations," The Racket Reference. https://docs.racket-lang.org/reference/cont.html . Supports `call-with-continuation-prompt` and its tag and handler arguments, the handler being called in tail position, `abort-current-continuation` resetting to the nearest tagged prompt with `exn:fail:contract:continuation` otherwise, values delivered to the handler, generative prompt tags, the default handler re-installing the prompt with a thunk, the full list of contexts where Racket installs barriers, the description of `racket/control` as operators from the research literature implemented in terms of the primitives, `reset` and `prompt` being interchangeable, the reduction rules for `control`, `shift`, and the zero-suffixed generalizations, the `%` and `fcontrol` examples yielding `7` and `5`, and the resemblance to Sitaram's operators.
