---
title: Compile-Time Computation and begin-for-syntax
description: "Phase levels as separate module instantiations, why the same identifier can hold different values at phase 0 and phase 1, and what that buys over running ordinary code early."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-08-15
updated:
aliases:
  - begin-for-syntax
  - define-for-syntax
---

Two definitions of the same name, in the same module, with no error:

```racket
(define age 3)
(begin-for-syntax (define age 9))
```

The `age` binding at phase level 0 has a value of 3, and the `age` binding at phase level 1 has a value of 9. Not shadowing, not a redefinition warning. Two bindings that coexist, and a single syntax object `#'age` that can be made to mean either one depending on where it is used.

> [!note] The idea
> Racket's phases are not "the same program, run early." Racket effectively allows multiple invocations of a module to exist in the same process but separated by phase, and enforces that different phases cannot communicate in any way other than via the protocol of macro expansion, where the output of one phase is the code used in the next. Compile-time code is therefore running in what amounts to a **separate instantiation with its own bindings and its own mutable state**, connected to the next stage by a one-way channel carrying code. That isolation, and not the ability to compute early, is what distinguishes this from `constexpr`.

## The pipeline metaphor is the specification

The Guide's own framing: a phase can be thought of as a way to separate computations in a pipeline of processes where one produces code that is used by the next, as in a preprocessor feeding a compiler feeding an assembler. It then asks you to imagine two Racket processes with no shared state, where the processes have no way to share anything other than the text piped from one's standard output into the other's standard input.

That is not a teaching analogy that breaks down under pressure. It is very nearly the semantics. Compile-time code cannot reach a runtime variable, because the runtime variable belongs to a different instantiation; runtime code cannot see a compile-time value except as code the compile-time stage emitted. The one-way pipe is the whole interface, and the isolation is the same kind that separate address spaces provide between [[cs/systems/processes-and-threads|processes]], achieved by scoping rules rather than by hardware.

## Every binding carries a phase

Every binding of an identifier exists in a particular phase, and the link between a binding and its phase is represented by an integer phase level. Phase level 0 is the plain runtime phase, which is where an ordinary `define` lands. Wrapping a definition in a single `begin-for-syntax` puts it at phase level 1. `define-for-syntax` is the abbreviation for defining one thing that way.

The bindings do not clash because they are not in the same namespace. That is a stronger statement than it looks. Most languages with a compile-time evaluation feature have exactly one name environment, and the compile-time and runtime meanings of a name have to agree. Racket has a family of environments indexed by an integer.

Syntax objects are what tie the family together. Racket imbues `#'age` with lexical information for all phase levels, so a single syntax object captures both the phase 0 and phase 1 bindings, and the relevant one is determined when the object is eventually used. Evaluate the template in an ordinary position and you get 3; evaluate it inside `begin-for-syntax` and you get 9. Same object, two answers, because the object records context at every level and the use site selects.

## The macro body sits one level up

The rule that explains most confusing phase errors is short. A macro's body executes at one phase higher than the context of its definition. So a macro defined at phase level 0 has a body at phase level 1, and any binding its body references must be at phase level 1. Reaching for a helper function you defined normally, from inside a transformer, fails with an undefined-identifier error even though the helper is right there in the file. It is in the file at the wrong phase.

The fix at the module boundary uses the shifting forms. A phase level is a module-relative concept, and `require` can shift imported bindings: plain `require` shifts nothing, `(require (for-syntax "a.rkt"))` shifts by one, `for-template` shifts by minus one, and `(require (for-meta 5 "a.rkt"))` shifts by five. Using `for-syntax` in a `require` means all the bindings from that module will have their phase levels increased by one, so a value defined at phase 0 over there arrives as a phase 1 binding over here.

> [!example] Why importing twice does not fix it
> A syntax object has a lexical context from the moment it first exists, and one provided from a module retains that context, referencing bindings in its source module rather than at its use site. Define `(define see-button #'button)` at phase 0 in module `a`, import `a` at phase 1 into module `b`, and use `see-button` in a macro. The result is `button: unbound identifier`.
>
> The instinct is to import `a` twice, at phase 0 and phase 1, so that both `button`s exist in `b`. It still fails. The `see-button` reachable from the macro is the one shifted into phase 1, and its captured `#'button` refers to the phase 1 `button` of that shifted instantiation. The phase 0 `button` in `b` comes from a *different instantiation* of `a`, and there is no path from the shifted `see-button` to it. Two instantiations of the same module are two different worlds, exactly as the two-process picture promised. Repairing it needs `syntax-shift-phase-level`, which changes the relative phase the reference points at rather than adding another copy.

## Compared with `constexpr`

Set this beside [[cs/languages/Cpp/constexpr-and-compile-time-computation|constexpr in C++]] and the designs are almost opposites in their goals.

`constexpr` asks: can this ordinary function be evaluated during compilation? The function is written once, lives in the single namespace everything else lives in, and may execute at compile time or run time depending on context. The value it produces is a *value*, folded into the program. The restrictions exist to make evaluation possible during translation, and the payoff is a constant where a computation was.

`begin-for-syntax` asks a different question: what should the *compiler for this module* be able to compute? Its output is not primarily a value but code, delivered through the expansion protocol. Its code is separated from runtime code rather than shared with it, so a compile-time helper does not become part of the runtime program and cannot accidentally be called from it.

Two practical consequences follow. Racket's compile-time language is the full language, including mutation, file access, and network calls, because it is a separate program rather than a restricted evaluator running inside the compiler. And Racket's compile-time computation composes across stages without bound, since `for-meta 5` is as legal as `for-syntax`, whereas `constexpr` has exactly one earlier stage.

The cost is the confusion described above. C++ programmers do not have to think about which phase a name is bound in, because there is one. Racket programmers do, in exchange for a compile-time stage that is a real programming environment rather than a subset.

## What the isolation costs elsewhere

The separation is thorough enough that other tools have to opt into it explicitly, and Typed Racket is the clearest example. Typed Racket type-checks all expressions at the run-time phase of a module and prevents errors that would occur at run time. But expressions at compile time, including computations inside macros, are not checked, so `(begin-for-syntax (+ 1 "foo"))` compiles and then raises an ordinary contract violation. Expressions inside macros defined in Typed Racket are likewise not type-checked, though the macro's expansion always is.

That is the phase separation showing through the type system. The checker is a phase 0 tool. Phase 1 is a different instantiation running a different program, and covering it would mean type-checking the compiler as well as the compiled. Knowing this changes how you write a typed macro: put logic you want checked in the *expansion*, not in the transformer body, since only one of the two gets looked at. The general shape of what the checker does and does not enforce is in [[cs/languages/Racket/typed-racket-and-gradual-typing|Typed Racket and gradual typing]], and the stage machinery the transformer body runs inside is in [[cs/languages/Racket/macro-expansion-order-and-partial-expansion|expansion order and partial expansion]].

Seen whole, phases are Racket's answer to a question that [[cs/pl/compilation-vs-interpretation|compilation and interpretation]] usually leaves implicit: when a language lets a program extend its own compiler, what stops the compiler and the program from becoming one thing? The answer is an integer on every binding.

## Related Notes

- [[cs/languages/Cpp/constexpr-and-compile-time-computation|constexpr and Compile-Time Computation]] - one namespace and a restricted evaluator, the opposite trade
- [[cs/systems/processes-and-threads|Processes and Threads]] - isolation with a one-way channel, which is what a phase boundary reproduces
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - the stage boundary phases make explicit and countable
- [[cs/languages/Racket/macro-expansion-order-and-partial-expansion|Macro Expansion Order and Partial Expansion]] - the expander that runs phase 1 code and consumes its output
- [[cs/languages/Racket/typed-racket-and-gradual-typing|Typed Racket and Gradual Typing]] - a phase 0 tool, and what it therefore cannot see
- [[cs/languages/Racket/syntax-objects-and-lexical-context|Syntax Objects and Lexical Context]] - the objects that carry lexical information at every phase level at once

## Sources

- "16.2.6 General Phase Levels," The Racket Guide. https://docs.racket-lang.org/guide/phases.html . Supports the pipeline-of-processes framing and the two-process analogy with only piped text shared, Racket allowing multiple invocations of a module separated by phase and enforcing that phases communicate only through the macro-expansion protocol, every binding existing in a phase represented by an integer phase level, `begin-for-syntax` defining at phase level 1 with no clash against a phase 0 definition of the same name, syntax objects carrying lexical information for all phase levels with the relevant binding determined at use, a syntax object having a lexical context from the moment it exists and retaining its source module's context when provided, a macro's body executing one phase higher than its definition context, phase levels being module-relative with `for-syntax`, `for-template`, and `for-meta` shifts, `for-syntax` increasing imported bindings by one, the failed double-import example and its explanation in terms of separate instantiations, and `syntax-shift-phase-level` as the repair.
- "8 Caveats and Limitations," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/caveats.html . Supports Typed Racket type-checking all run-time-phase expressions and preventing errors that would occur at run time, compile-time expressions including computations inside macros not being checked, expressions inside macros defined in Typed Racket not being type-checked, and the macro's expansion always being type-checked.
