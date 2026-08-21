---
title: constexpr and Compile-Time Computation
description: "constexpr, consteval, and if constexpr as three different modalities (may, must, must not), and the arc from computing with types to running ordinary C++ before the program starts."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-08-18
updated:
aliases:
  - consteval
  - if constexpr
  - Immediate Functions
---

Template metaprogramming computed with types because types were the only thing the compiler would evaluate. Recursive class templates carrying integer constants, specializations as base cases, `enum` members standing in for return values: an entire functional language reconstructed out of the instantiation machinery, because ordinary C++ was not available before the program ran. `constexpr` is the language taking that job back and giving it to functions.

The three keywords that resulted are usually explained as a progression. They are better understood as three different modalities over the same question.

> [!note] The idea
> `constexpr` means **may**, `consteval` means **must**, and `if constexpr` means **must not**. cppreference states that `constexpr` declares it is *possible* to evaluate the value at compile time, and then says outright that invoking a `constexpr` function produces the same result as invoking an equivalent non-`constexpr` function in all respects with only two exceptions, one of which is merely that it may appear in a constant expression. `constexpr` on a function guarantees almost nothing about when it runs. `consteval` is the keyword that actually demands it, and `if constexpr` is the one that reaches into the other direction and removes code that would otherwise have been compiled. Reading `constexpr` as "this runs at compile time" is the single most common misreading of the feature.

## constexpr: possible, not promised

cppreference's definition is careful with the modal verb. The specifier declares that it is possible to evaluate the value of the entities at compile time, and that such entities can then be used where only compile-time constant expressions are allowed, provided that appropriate function arguments are given. The parenthetical is doing real work: whether a particular call is a constant expression depends on the arguments at that call site, not on the declaration.

Two implications ride along and are easy to forget. A `constexpr` specifier on an object declaration implies `const`, and on the first declaration of a function or static data member it implies `inline`. If any declaration of a function has the specifier, every declaration must.

The rules for what may appear in the body are a history of the feature in themselves. In C++11 the body had to be a compound statement enclosing essentially nothing but declarations and, cppreference states, exactly one return statement if the function is not a constructor. C++14 replaced the whitelist with a much shorter blacklist: no `goto`, no labels other than `case` and `default`, no try blocks, no inline assembly, no uninitialized variable definitions, no variables of non-literal type, and no variables of static or thread storage duration. The feature-test macro values track the same story, with `__cpp_constexpr` at `200704L` for C++11, `201304L` for relaxed `constexpr` and non-`const` `constexpr` methods in C++14, and `201603L` for `constexpr` lambdas in C++17. What began as a way to write one expression became a way to write ordinary imperative code that happens to be evaluable early.

## The rule the compiler cannot check

There is a constraint on `constexpr` functions that reads oddly until you notice what it is avoiding. cppreference states that for a non-constructor `constexpr` function that is neither defaulted nor templated, if no argument values exist such that an invocation of the function could be an evaluated subexpression of a core constant expression, the program is ill-formed, no diagnostic required.

Read the shape of that rule rather than its content. It is an existential claim quantified over every possible argument value: *there must exist* some input for which this call is constant. [[cs/math/predicate-logic-and-quantifiers|Quantifying over an infinite domain]] is not something a compiler can discharge in general, and the standard's response is the phrase it reserves for rules it wants to state but cannot require anyone to enforce. The same clause appears for templated `constexpr` functions until C++23, phrased as no specialization existing that would make the function suitable.

cppreference then confirms the gap from the other side, noting that it is possible to write a `constexpr` function whose invocation can never satisfy the requirements of a core constant expression, and giving a C++23 example of a `constexpr void g(int&)` that unconditionally calls a non-`constexpr` function. The declaration is well formed. The promise it makes is empty. A compile-time evaluator built into a general-purpose language inherits the [[cs/history/hilbert-godel-church-computability|limits on what can be decided about programs]], and the standard's way of living with that is to make the unanswerable cases undiagnosed rather than illegal.

## consteval: the keyword that means must

cppreference defines `consteval` as declaring a function to be an immediate function, meaning every potentially-evaluated call must, directly or indirectly, produce a compile-time constant expression. An immediate function is a `constexpr` function subject to the same requirements, and like `constexpr` it implies `inline`, but it may not be applied to destructors, allocation functions, or deallocation functions, and a declaration specifying `consteval` may not also specify `constexpr`.

Its example is the clearest statement of the difference between the two keywords:

```cpp
consteval int sqr(int n) { return n * n; }

constexpr int r  = sqr(100);   // OK
int x = 100;
int r2 = sqr(x);               // Error: call does not produce a constant

consteval int sqrsqr(int n) { return sqr(sqr(n)); }   // Not a constant here, but OK
constexpr int dblsqr(int n)  { return 2 * sqr(n); }   // Error: enclosing function
                                                      // is not consteval
```

`sqrsqr` is fine because a call to an immediate function inside another immediate function is not itself required to be constant; the requirement lands on the outermost call. `dblsqr` fails for exactly that reason inverted: a `constexpr` function might be called at runtime, so it cannot contain a call that must not be.

cppreference adds a rule that closes the obvious escape. A pointer or reference to an immediate function can be taken but cannot escape constant expression evaluation, so `constexpr auto e = g();` is ill-formed when `g` returns the address of an immediate function, because a pointer to one is not a permitted result of a constant expression. And it notes that a non-lambda, non-special-member, non-templated `constexpr` function cannot implicitly become an immediate function; users must explicitly mark it `consteval`.

## if constexpr: the branch that is not compiled

The third keyword operates on statements rather than values. cppreference states that in a `constexpr if` statement the condition must be a contextually converted constant expression of type `bool`, and if it yields `true` the false statement is discarded, otherwise the true statement is.

Discarded means more than not executed. Two consequences show how much more. Return statements in a discarded statement do not participate in function return type deduction, so `get_value` can `return *t;` in one branch and `return t;` in the other and deduce `int` in both instantiations. And a discarded statement can ODR-use a variable that is not defined anywhere, which cppreference demonstrates with an `extern int x;` that never needs a definition.

The rule that makes it useful inside templates is the one that replaced the recursive base case: if a `constexpr if` statement appears inside a templated entity and the condition is not value-dependent after instantiation, the discarded statement is not instantiated when the enclosing template is instantiated. That is what lets the recursive [[cs/languages/Cpp/variadic-templates-and-parameter-packs|pack-peeling function]] guard its own recursion with `if constexpr (sizeof...(rs) > 0)` and never require a separate terminating overload.

> [!warning] It is not #if
> cppreference says this in as many words: outside a template, a discarded statement is fully checked, and `if constexpr` is not a substitute for the `#if` preprocessing directive. Its example puts `int* p = i;` inside `if constexpr (false)` in a non-template function and notes it is an error even though the statement is discarded. Discarding happens after the code is parsed and, outside a template, after it is checked. The preprocessor deletes text; `if constexpr` selects a branch of a program that must already be a program.

## What it replaced

The arc runs in one direction. Questions that once had to be encoded as [[cs/languages/Cpp/sfinae-and-enable-if|substitution failures]] became `constexpr` predicates. Branching that once had to be spread across overloads and tag types became one `if constexpr`. Computation that once had to be written as recursive class templates became functions with loops and local variables. cppreference's remark that `constexpr` constructors are permitted for classes that are not literal types, with `std::shared_ptr`'s default constructor as the example enabling constant initialization, shows how far the reach extends: this is not a numeric-constants feature any more.

What did not change is the relationship to [[cs/pl/macros-and-metaprogramming|metaprogramming in general]]. Compile-time evaluation is still a second evaluator running over the same source, with its own rules about what it may touch, and the boundary between the two is still where the confusing errors live. The difference is that the second evaluator now speaks the same language as the first.

## Related Notes

- [[cs/languages/Cpp/variadic-templates-and-parameter-packs|Variadic Templates and Parameter Packs]] - the recursion `if constexpr` terminates without a base-case overload
- [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE and enable_if]] - compile-time questions before the language had a way to ask them
- [[cs/languages/Cpp/concepts-and-requires-clauses|Concepts and requires Clauses]] - constraints as compile-time predicates over types rather than values
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - the shape of the rule the standard states but cannot require anyone to check
- [[cs/history/hilbert-godel-church-computability|Hilbert, Gödel, Church, and the Limits of Computation]] - why a compile-time evaluator has undiagnosed corners at all
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the wider family of second evaluators running over source

## Sources

- "constexpr specifier," cppreference.com. https://en.cppreference.com/w/cpp/language/constexpr.html . Supports the definition of `constexpr` as declaring compile-time evaluation possible with appropriate arguments, the implied `const` and `inline` and the all-declarations rule, the C++11 single-return-statement body restriction and the C++14 blacklist, the statement that a `constexpr` invocation matches a non-`constexpr` one except for appearing in a constant expression and copy elision, the ill-formed-no-diagnostic-required rule when no argument values could make the call constant, the note that a `constexpr` function may never satisfy a core constant expression with the C++23 example, the note that a non-templated `constexpr` function cannot implicitly become immediate, the `std::shared_ptr` constant-initialization remark, and the `__cpp_constexpr` feature-test values.
- "consteval specifier," cppreference.com. https://en.cppreference.com/w/cpp/language/consteval.html . Supports the definition of an immediate function, the requirement that every potentially-evaluated call produce a constant expression, the implied `inline` and the exclusions for destructors and allocation functions, the ban on combining `consteval` with `constexpr`, the `sqr`, `sqrsqr`, and `dblsqr` example, and the rule that a pointer to an immediate function cannot escape constant expression evaluation.
- "if statement," cppreference.com. https://en.cppreference.com/w/cpp/language/if.html . Supports the `constexpr if` condition requirement and which statement is discarded, return statements in a discarded statement not participating in return type deduction, a discarded statement ODR-using an undefined variable, the non-instantiation of the discarded statement inside a templated entity, and the statement that outside a template a discarded statement is fully checked and `if constexpr` is not a substitute for `#if`.
