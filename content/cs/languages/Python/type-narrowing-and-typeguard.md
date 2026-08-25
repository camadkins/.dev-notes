---
title: Type Narrowing, TypeGuard, and TypeIs
description: "TypeGuard promises something about the if branch only. TypeIs promises an intersection in both branches, which is why it must be invariant and why one of them is the one you usually want."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-30
updated:
aliases: []
---

Static type checkers commonly employ a technique called type narrowing to determine a more precise type of an expression within a program's code flow. When it is applied within a block based on a conditional statement, the conditional expression is sometimes called a type guard. Python checkers already support several: `is None`, truthiness, `isinstance`, and comparison against a `Literal`.

Then there is the case the built-ins cannot reach.

```python
def is_str_list(val: list[object]) -> bool:
    return all(isinstance(x, str) for x in val)

def func1(val: list[object]):
    if is_str_list(val):
        print(" ".join(val))   # error: invalid type
```

PEP 647 is precise about what went wrong: this code is correct, but a type checker will report a type error, because the value passed to `join` is understood to be of type `list[object]` and the checker does not have enough information to statically verify that the type is `list[str]` at this point. The knowledge exists. It just has nowhere to live in the signature, since `bool` says nothing about which branch learned what.

> [!note] The idea
> Narrowing is *flow-sensitive typing*: the same name has different types at different program points, which is the type-level counterpart of the renaming that [[cs/pl/intermediate-representations-and-ssa|SSA form]] performs on values. `TypeGuard` and `TypeIs` both let a function participate in that analysis, but they promise different things. `TypeGuard` asserts a type for the positive branch only and is deliberately allowed to name a type that is not narrower than the input. `TypeIs` asserts a set-theoretic intersection in *both* branches, and pays for that strength with a hard assignability requirement and invariance.

## TypeGuard: a promise about the if branch

`TypeGuard` is a special form accepting a single type argument, used to annotate the return type of a user-defined type guard function. Return statements within such a function should return `bool` values, and checkers should verify that all return paths do. It is also valid as the return type of a callable, where it is treated as a subtype of `bool`, so `Callable[..., TypeGuard[int]]` is assignable to `Callable[..., bool]`.

The narrowing target is positional. Type checkers should assume that narrowing applies to the expression passed as the first positional argument, and if the function accepts more arguments, no narrowing is applied to those. For an instance or class method, the first positional argument maps to the second parameter, after `self` or `cls`. That leaves room for the useful two-argument shape, such as `is_str_list(val, allow_empty)`, where only `val` is narrowed.

Change the annotation and the earlier example type-checks: the return type becomes `TypeGuard[list[str]]`, which promises not merely that the return value is boolean, but that a true indicates the input to the function was of the specified type.

> [!warning] The else branch learns nothing
> Some built-in type guards provide narrowing for both positive and negative tests. If `x` is a union of `None` and something else, `x is None` narrows to `None` in the positive case and the other type in the negative case. User-defined type guards apply narrowing only in the positive case, and the type is not narrowed in the negative case. Given `OneOrTwoStrs = tuple[str] | tuple[str, str]`, a `TypeGuard` for the two-element case narrows to `tuple[str, str]` inside the `if` and leaves the full union inside the `else`. Writing `if not is_two_element_tuple(val)` does not change this: the `else` gets `tuple[str, str]` and the `if` gets the unnarrowed union. Exhaustiveness reasoning built on a `TypeGuard` will quietly fail to eliminate the case it just tested.

The asymmetry is not an oversight. The return type of a user-defined type guard will normally refer to a type that is strictly narrower than the type of the first argument, but it is not required to be. That is what allows the motivating example at all, since `list[str]` is not assignable to `list[object]`. `TypeGuard` buys expressiveness by refusing to make a claim strong enough to invert.

## TypeIs: an intersection in both directions

`TypeIs` is similar in usage, behavior, and runtime implementation, and a function annotated as returning one is called a type narrowing function. The same positional rules apply. What differs is the guarantee.

The return type `R` must be assignable to the input type `I`, and the checker should emit an error otherwise, so `def is_str(x: int) -> TypeIs[str]` is rejected outright. Given that, the specification states the semantics in [[cs/math/set-theory-basics|set-theoretic]] terms: for an argument of pre-narrowed type `A`, the positive branch narrows to the intersection of `A` and `R`, and the negative branch narrows to the intersection of `A` and the complement of `R`.

Two consequences follow. Narrowing applies in both the positive and the negative case, so `is_str` on a `str | int` gives `str` in one branch and `int` in the other, which is what people expect the first time and rarely get from `TypeGuard`. And the final narrowed type may be narrower than `R`, because of the constraints of the argument's previously known type: an `isawaitable` returning `TypeIs[Awaitable[Any]]` applied to an `Awaitable[int] | int` yields `Awaitable[int]`, not `Awaitable[Any]`.

> [!example] Why TypeIs must be invariant
> Unlike `TypeGuard`, `TypeIs` is invariant in its argument type: `TypeIs[B]` is not a subtype of `TypeIs[A]` even when `B` is a subtype of `A`. The specification's example is worth walking. A function takes an `int | str` plus a callable that accepts an `object` and returns `TypeIs[int]`, adds one in the true branch and concatenates a string in the false branch. Pass `is_bool`, which returns `TypeIs[bool]`, and note that `bool` is a subtype of `int`. Call it with `1`. The narrower returns false, because `1` is not a `bool`, so the else branch runs and tries `"hello " + x` with `x` bound to `1`. The code fails at runtime. If the call were allowed, type checkers would fail to detect this error. Covariance is unsound precisely because `TypeIs` makes a claim about the *negative* branch, and a narrower test produces more false results than the wider one it was substituted for.

## Where the guarantee stops

The intersection semantics are aspirational. In practice, the theoretic types for strict type guards cannot be expressed precisely in the Python type system, and type checkers should fall back on practical approximations of these types. The guidance offered is a rule of thumb rather than an algorithm: a checker should use the same narrowing logic as, and get results consistent with, its handling of `isinstance()`. That leaves real room for two conforming checkers to disagree about a branch, and the specification says so while noting the guidance allows for changes and improvements if the type system is extended in the future.

The other silent failure is upstream. Both forms depend on a function body that actually verifies what the annotation claims, and nothing checks that. `TypeGuard[list[str]]` on a function that returns `True` unconditionally is a well-typed lie, which puts these forms in the same family as [[cs/languages/Python/runtime-checkable-protocols-and-their-limits|a runtime-checkable protocol check]]: a narrowing whose strength rests entirely on a promise the tooling cannot audit.

Generic type guards work as expected, so `is_two_element_tuple[T](val: tuple[T, ...]) -> TypeGuard[tuple[T, T]]` narrows a `tuple[str, ...]` to `tuple[str, str]`, and [[cs/languages/Python/typevar-and-generic-functions|the type variable]] carries through the narrowing.

## Related Notes

- [[cs/pl/intermediate-representations-and-ssa|Intermediate Representations and SSA]] - the same flow-sensitive renaming, applied to values instead of types
- [[cs/math/set-theory-basics|Set Theory Basics]] - the intersection and complement `TypeIs` is specified in terms of
- [[cs/languages/Python/any-object-and-never|Any, object, and Never]] - what an empty narrowing result actually is
- [[cs/languages/Python/runtime-checkable-protocols-and-their-limits|Runtime-Checkable Protocols and Their Limits]] - the other place a check licenses more than it proves
- [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|Erasure at Runtime and Type Guards]] - the same feature in a language whose predicate signatures came first
- [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|Discriminated Unions and Exhaustiveness]] - narrowing that does close both branches, and what it costs to set up

## Sources

- "Type narrowing," Specification for the Python type system. https://typing.readthedocs.io/en/latest/spec/narrowing.html . Supports `TypeGuard` being a special form with a single type argument used on the return of a user-defined type guard, the requirement that all return paths return `bool`, its validity as a callable return type and treatment as a subtype of `bool` with the `Callable[..., TypeGuard[int]]` assignability example, narrowing applying to the first positional argument only with no narrowing of additional arguments and the method offset after `self` or `cls`, the generic `is_two_element_tuple` example, the statement that the return type is normally but not necessarily strictly narrower and the `list[str]` and `list[object]` justification, built-in guards narrowing both branches with the `x is none` example while user-defined type guards narrow only the positive case, the `OneOrTwoStrs` example including the `not` form, `TypeIs` being similar in usage, behavior, and runtime implementation with functions called type narrowing functions, the requirement that the return type be assignable to the input type with an error otherwise and the `def is_str(x: int) -> TypeIs[str]` rejection, the intersection and complement formulation for the positive and negative narrowed types, the statement that the theoretic types cannot be expressed precisely and checkers should fall back on practical approximations consistent with `isinstance()`, narrowing applying in both cases with the `str | int` example, the final narrowed type being narrower than the declared one with the `isawaitable` example, `TypeIs` invariance with the `takes_narrower` and `is_bool` walkthrough including the runtime failure and the note that checkers would fail to detect the error.
- "PEP 647 - User-Defined Type Guards," Python Enhancement Proposals. https://peps.python.org/pep-0647/ . Supports the description of type narrowing as a technique for determining a more precise type within a program's code flow, the term type guard for the conditional expression, the built-in guard forms, the `is_str_list` example being correct while the checker reports an error because the value is understood as `list[object]`, the statement that the checker lacks the information to verify `list[str]` at that point, and the meaning of the changed return type as promising not merely a boolean but that a true result indicates the input was of the specified type.
