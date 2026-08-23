---
title: Type-Level Computation
description: "TypeScript conditional and mapped types, C++ templates and constexpr, Racket macros running at a numbered phase, and Rust const generics with a deliberate ceiling. Four answers to the question of what a compiler should let you compute before the program runs."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
  - type-theory
date: 2026-07-16
updated:
aliases:
  - Compile-Time Computation
  - When a Type System Becomes a Language
---

There is a moment in the life of a type system when it stops describing values and starts computing, which moves work across [[cs/pl/compilation-vs-interpretation|the line between compiling and running]]. Somebody writes a type that inspects another type and produces a third, and the compiler is now an interpreter for a language nobody designed on purpose. Four languages in this section crossed that line by different routes, and the interesting comparison is not which one computes the most. It is which one admits what it has built and gives you tools for it.

> [!note] The idea
> Every compile-time computation facility answers one question: is the compile-time language the same language as the run-time language? Racket says yes, explicitly, and numbers the phases so the two can coexist without colliding. C++ said no for two decades, then said yes with `constexpr`, and now runs both a template metalanguage and ordinary early-evaluated C++ side by side. TypeScript says no and its compile-time language is a pure functional one with no statements, no variables, and no debugger. Rust says yes only inside a fence, restricting const generic parameters to a short list of primitive types. The consequence that decides your afternoon is that a compile-time language which is not the run-time language cannot be printed, stepped, or tested with the tools you already own.

## TypeScript: an accidental functional language in the type position

Conditional types help describe the relation between the types of inputs and outputs, and they take a form that looks a little like conditional expressions, `condition ? trueExpression : falseExpression`, in JavaScript. That is a branch. Add the ability to bind: [[cs/languages/TypeScript/conditional-types|conditional types provide a way to infer from the types being compared against in the true branch using the `infer` keyword]], which declaratively introduces a new generic type variable instead of specifying how to retrieve a piece of the structure.

Branch, bind, and recurse, and you have a language. It is a pure functional one, evaluated by the checker, and it is genuinely useful: `ReturnType`, `Awaited`, and the router type definitions in modern web frameworks are all written in it. The cost is that the surface was never designed for programming. There are no named intermediate values except by defining another type alias, no way to log anything, and no execution model exposed to the author. When a deeply recursive type stops working the feedback is a checker error about instantiation depth rather than a stack trace.

## C++: two compile-time languages in one file

C++ templates were designed for parametric code and turned out to be able to compute, through specialization as pattern matching and instantiation as recursion. That is the language that produced the type-trait library and the reputation for unreadable error messages.

`constexpr` is the second answer and a much better one. The specifier declares that it is possible to evaluate the value of the entities at compile time, so `constexpr` specifies that the value of a variable or function can appear in constant expressions, and such entities can then be used where only compile-time constant expressions are allowed, provided appropriate function arguments are given. The important part is what it is not: a `constexpr` function is ordinary C++, written with loops and locals and ordinary control flow, that the compiler happens to evaluate early. The same source can also run at run time.

That is the whole design lesson of [[cs/languages/Cpp/constexpr-and-compile-time-computation|constexpr]] compared with template metaprogramming. When the compile-time language is the run-time language, the author already knows it, the debugger already understands it, and a bug can be found by simply running the function.

## Racket: the compile-time language, numbered

Racket built this deliberately, and its vocabulary is the clearest of the four. A macro is a syntactic form with an associated transformer that expands the original form into existing forms; to put it another way, a macro is an extension to the Racket compiler. This is not a niche feature bolted on: most of the syntactic forms of `racket/base` and `racket` are actually macros that expand into a small set of core constructs.

The part with no equivalent elsewhere is phases. A phase can be thought of as a way to separate computations in a pipeline of processes where one produces code that is used by the next, and Racket enforces separation of such phases, where different phases cannot communicate in any way other than via the protocol of macro expansion, in which the output of one phase is the code used in the next. Every binding of an identifier exists in a particular phase. Phase level 0 is the phase used for plain runtime definitions, and an identifier can be defined at a higher phase level using `begin-for-syntax`, which puts it at phase level 1.

Read that against the other three. TypeScript's type level and value level share a file and have no name for their relationship. C++ has templates, `constexpr`, and the preprocessor, three compile-time mechanisms with three different evaluation models and no unified account of when each runs. Racket gives the pipeline an integer, forbids the levels from leaking into each other, and lets you write [[cs/languages/Racket/compile-time-computation-and-begin-for-syntax|ordinary Racket at any of them]]. That is what [[cs/pl/macros-and-metaprogramming|macros and metaprogramming]] look like when the design is intentional rather than emergent.

## Rust: a fence, on purpose

Rust wanted compile-time values without the metalanguage. Const generic parameters allow items to be generic over constant values, and the `const` identifier introduces a name in the value namespace for the constant parameter, with all instances of the item instantiated with a value of the given type.

Then the fence. The only allowed types of const parameters are the integer types, `char`, and `bool`. Not structs, not strings, not arbitrary user types. And const parameters must be standalone when used in a type or array repeat expression, which is the rule that keeps arithmetic out of type position. Both restrictions are choices, not oversights, and their effect is that a Rust programmer who wants to compute a type gets told no early, in a language they can read, instead of being handed a metalanguage and left to discover its limits by hitting them.

> [!warning] The bill is compile time, and it is charged in a resource nobody budgets
> Type-level computation is executed by the compiler on every build, single-threaded per instantiation, with no memoization the author controls and no profiler pointed at it. A recursive conditional type or a deep template instantiation is an interpreter loop running inside your edit-compile cycle. C++ makes the mechanism visible through instantiation counts and link time. TypeScript hides it until an editor stops responding. In both cases the compute is real, and the cost is paid by every developer on the team on every build, which is the least efficient possible place to put an expensive computation.

The comparison in one line: TypeScript computes types and cannot compute values, C++ computes both with two unrelated mechanisms, Racket computes anything at a numbered phase with the ordinary language, and Rust computes a small set of values and refuses the rest. The pattern across all four is that compile-time power arrived either by accident or by fence, and the languages that got it by accident spent the next decade adding the tooling that a designed version would have shipped with.

## Related Notes

- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - when an expression is evaluated, which is the question phases answer at the language level
- [[cs/history/lisp-and-functional-programming|Lisp and Functional Programming]] - where the compile-time-is-run-time idea came from, long before C++ rediscovered it
- [[cs/languages/Rust/const-generics|Const Generics]] - the fenced version in full, including what the fence forbids
- [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|Template Instantiation and the Two-Phase Rule]] - how the C++ template metalanguage actually gets evaluated
- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules]] - the safety property that makes a compile-time language usable by strangers
- [[cs/languages/TypeScript/type-level-computation-and-its-limits|Type-Level Computation and Its Limits]] - where the TypeScript type language runs out

## Sources

- "Conditional Types," TypeScript Handbook. https://www.typescriptlang.org/docs/handbook/2/conditional-types.html . Supports conditional types describing the relation between input and output types, their conditional-expression form, and the infer keyword introducing a type variable in the true branch.
- "constexpr specifier," cppreference.com. https://en.cppreference.com/w/cpp/language/constexpr.html . Supports constexpr specifying that a variable or function can appear in constant expressions, declaring that the value can be evaluated at compile time, and such entities being usable where only constant expressions are allowed.
- "Macros," The Racket Guide. https://docs.racket-lang.org/guide/macros.html . Supports a macro being a syntactic form with an associated transformer, a macro being an extension to the Racket compiler, and most racket and racket/base forms being macros over a small core.
- "General Phase Levels," The Racket Guide. https://docs.racket-lang.org/guide/phases.html . Supports phases as a pipeline where one stage produces code for the next, the enforced separation between phases, bindings existing at a particular phase level, phase 0 being run time, and begin-for-syntax placing a definition at phase level 1.
- "Generic parameters," The Rust Reference. https://doc.rust-lang.org/reference/items/generics.html . Supports const generic parameters making items generic over constant values, the const identifier naming a value-namespace parameter, the closed list of allowed const parameter types, and the standalone requirement in type and array repeat expressions.
