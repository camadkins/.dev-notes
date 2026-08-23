---
title: Variadic Templates and Parameter Packs
description: "A pack is a syntactic entity, not a value: what expansion actually does, why the pre-C++17 idiom was recursion, and what a fold expression replaced."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-11
updated:
aliases:
  - Parameter Packs
  - Fold Expressions
  - Pack Expansion
---

`sizeof...(args)` gives you the number of elements. `args[0]` does not give you the first one. You cannot assign a pack to a variable, pass it around, iterate it with a loop, or ask for its third element without reaching for machinery. Every one of those restrictions comes from the same fact, and the fact explains the shape of every variadic idiom written between 2011 and 2017.

> [!note] The idea
> A pack is not a list value. It is a name that is only meaningful where a pattern containing it is followed by an ellipsis, and cppreference defines the language's variadic support as a fixed enumeration of the grammar positions where that is allowed: function argument lists, initializers, template argument lists, function and template parameter lists, base specifiers, member initializer lists, lambda captures, `sizeof...`, alignment specifiers, attribute lists, using-declarations, fold expressions, and a handful more. There is no operation on packs, only places where a pack may be written. That is why the first six years of variadic C++ ran on recursion. Recursion was how you got a pack into a position where a *different*, smaller pack could be written, one element at a time.

## What expansion does

cppreference's definition is exact: a pattern followed by an ellipsis, in which the name of at least one pack appears at least once, is expanded into zero or more instantiations of the pattern, where the name of the pack is replaced by each of the elements from the pack, in order.

The pattern is the part before the ellipsis, and it can be arbitrarily complicated. In `f(&args...)`, cppreference points out the pattern is `&args`, so calling `g(1, 0.2, "a")` expands the arguments to `int E1, double E2, const char* E3` and the pattern to `&E1, &E2, &E3`. The parameter pack in the callee then binds `int*`, `double*`, and `const char**`.

Two packs in the same pattern expand together. cppreference states that if the names of two packs appear in the same pattern they are expanded simultaneously and must have the same length, and its `zip` example produces `Tuple<Pair<short, unsigned short>, Pair<int, unsigned>>` from two two-element lists while a mismatched call is an error. Nesting is defined by position rather than by any explicit ordering syntax: in `f(h(args...) + args...)` the inner expansion runs first, producing a single `h(E1, E2, E3)`, and the outer expansion then produces that same call added to each element in turn.

The empty case gets its own rule, and it is more generous than expected. cppreference states that when a pack has zero elements, the instantiation of a pack expansion does not alter the syntactic interpretation of the enclosing construct, even in cases where omitting the pack expansion entirely would otherwise be ill-formed or would result in a syntax ambiguity, and produces an empty list. `template<class... Bases> struct X : Bases... {}` instantiated with nothing gives a class with no base classes rather than a syntax error at the stray colon.

## What recursion was for

Before C++17, processing a pack meant peeling. You wrote an overload taking one leading parameter plus a pack, did the work on the leading parameter, and recursed with the pack expanded as the new argument list. A second overload with no pack, or with only the terminating case, ended it. The [[cs/dsa/recursion|recursive structure]] was not a stylistic choice; it was the only way to name individual elements, because naming the first element required putting it in a parameter position where the compiler would deduce it separately from the rest.

cppreference's `if constexpr` documentation preserves the modern version of that shape:

```cpp
template<typename T, typename... Rest>
void g(T&& p, Rest&&... rs)
{
    // ... handle p
    if constexpr (sizeof...(rs) > 0)
        g(rs...);   // never instantiated with an empty argument list
}
```

The comment is the whole point. cppreference states that if a `constexpr if` statement appears inside a templated entity and the condition is not value-dependent after instantiation, the discarded statement is not instantiated when the enclosing template is instantiated. The recursion still happens; what disappears is the separate base-case overload, because the call that would have needed it is never generated. This is [[cs/languages/Cpp/constexpr-and-compile-time-computation|`if constexpr`]] doing exactly the job the old empty overload did, with the terminating condition written where a reader can see it.

## The fold

C++17 added the operation the pack never had. cppreference describes a fold expression as reducing a pack over a binary operator, in four forms:

```
( pack op ... )              // unary right fold
( ... op pack )              // unary left fold
( pack op ... op init )      // binary right fold
( init op ... op pack )      // binary left fold
```

Thirty-two operators are allowed, and in a binary fold both must be the same. The expansions are spelled out: a unary left fold `(... op E)` becomes `(((E1 op E2) op ...) op EN)`, and a unary right fold `(E op ...)` becomes `(E1 op (... op (EN-1 op EN)))`. cppreference's worked example is worth keeping because it shows the associativity is real and not a formality:

```cpp
template<typename... Args>
bool all(Args... args) { return (... && args); }

bool b = all(true, true, true, false);
// expands as ((true && true) && true) && false
```

Left and right folds differ in [[cs/pl/evaluation-order-and-strictness|grouping]], which for `&&` and `||` also decides which operands are reached at all, and for user-defined operators can decide whether the expression compiles.

The empty pack forced a decision the earlier machinery never had to make: what does reducing nothing produce? cppreference gives the answer as a hard restriction rather than a convention. When a unary fold is used with a pack expansion of length zero, only three operators are allowed, and each has a defined value: logical AND yields `true`, logical OR yields `false`, and the comma operator yields `void()`. Every other operator is simply forbidden on an empty pack, because the language declines to invent an identity element for it. If you need one, that is what the binary form's `init` is for.

The one syntactic trap: cppreference notes that if the expression used as `init` or as `pack` has an operator with precedence below cast at the top level, it must be parenthesized, so `(args + ... + 1 * 2)` is an error and `(args + ... + (1 * 2))` is fine. The required outer parentheses of a fold expression are also not optional.

> [!warning] Same length, or nothing
> The simultaneous-expansion rule bites in real code. Two packs in one pattern must have the same number of elements, and there is no zip-shortest or padding behavior to fall back on. If you are writing something that consumes two independent packs, the language will let you declare it and then reject the instantiation, which is a design constraint worth discovering at the whiteboard rather than at the call site.

## Related Notes

- [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|Template Instantiation and the Two-Phase Rule]] - what "the discarded statement is not instantiated" means mechanically
- [[cs/languages/Cpp/constexpr-and-compile-time-computation|constexpr and Compile-Time Computation]] - the branch that removed the base-case overload
- [[cs/languages/Cpp/concepts-and-requires-clauses|Concepts and requires Clauses]] - constraining a pack, and the fold expanded constraints that came with it
- [[cs/dsa/recursion|Recursion]] - the control structure variadic C++ ran on before it had a reduction
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - why left versus right fold changes more than the parentheses
- [[cs/languages/Rust/macros-declarative-and-procedural|Macros: Declarative and Procedural]] - repetition handled in a macro expander instead of the type system

## Sources

- "Parameter pack," cppreference.com. https://en.cppreference.com/w/cpp/language/parameter_pack.html . Supports the kinds of pack and the definition of a variadic template, the definition of pack expansion and the pattern rule, the `f(&args...)` example with the resulting types, the simultaneous-expansion same-length rule with the `zip` example, nested expansion ordering, the empty-pack rule about not altering syntactic interpretation with the base-specifier example, and the enumeration of expansion loci.
- "Fold expressions," cppreference.com. https://en.cppreference.com/w/cpp/language/fold.html . Supports the four fold forms, the thirty-two permitted operators and the same-operator requirement in binary folds, the expansions of left and right folds, the `all` example and its parenthesization, the three operators permitted on an empty pack with their values, and the precedence rule requiring parentheses.
- "if statement," cppreference.com. https://en.cppreference.com/w/cpp/language/if.html . Supports the recursive variadic example with `sizeof...(rs) > 0`, and the rule that a discarded statement whose condition is not value-dependent after instantiation is not instantiated with the enclosing template.
