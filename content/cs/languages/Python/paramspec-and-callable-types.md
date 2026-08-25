---
title: ParamSpec and Callable Types
description: "Callable[..., T] does not mean any signature. It means do no validation on arguments. ParamSpec replaces that hole with a variable, and needs two annotations to do it because CPython has no object for a parameter list."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-24
updated:
aliases: []
---

Here is a decorator that type-checks cleanly and then crashes.

```python
R = TypeVar("R")

def add_logging(f: Callable[..., R]) -> Callable[..., Awaitable[R]]:
    async def inner(*args: object, **kwargs: object) -> R:
        await log_to_database()
        return f(*args, **kwargs)
    return inner

@add_logging
def takes_int_str(x: int, y: str) -> int:
    return x + 7

await takes_int_str("b", 2)   # fails at runtime
```

PEP 612 explains the failure exactly. The decorated `takes_int_str` was given the type `Callable[..., Awaitable[int]]`, and an ellipsis in place of parameter types is specified to mean that we do no validation on arguments. The checker did not miss the bug. It was told not to look.

> [!note] The idea
> `...` in a `Callable` is not a wildcard that matches any signature. It is an *instruction to stop checking that position*, which makes it the argument-list analogue of [[cs/languages/Python/any-object-and-never|`Any`]]. `ParamSpec` replaces the hole with a variable, so the parameters of the wrapper become a function of the parameters of the wrapped callable rather than an unchecked blank. The awkward part, and the interesting one, is that Python's calling convention has no single runtime object for a parameter list, so a single type-level parameter list has to be annotated in two places at once.

## The dependency that could not be written

PEP 484 supports dependencies between single types, as in `def append(l: list[T], e: T) -> list[T]`. There was no existing way to do so with a complicated entity like the parameters of a function. That is the whole gap. A decorator is the Python idiom of one function passing all arguments given to it over to another function, done through the combination of `*args` and `**kwargs` in both parameters and arguments, and when one defines a function that takes `(*args, **kwargs)` and goes on to call another function with `(*args, **kwargs)`, the wrapping function can only be safely called in all of the ways that the wrapped function could be safely called.

That is a statement about a relationship, and [[cs/languages/Python/typevar-and-generic-functions|the `TypeVar` mechanism]] can only express relationships between single types. `ParamSpec` extends the same trick to parameter lists, which is [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]] quantified over something that is not a type.

The declaration mirrors `TypeVar` down to the naming rule: `P = ParamSpec("P")` is accepted and `P = ParamSpec("WrongName")` is rejected. The runtime should accept `bound`, `covariant`, and `contravariant` arguments in the declaration just as `typing.TypeVar` does, though the PEP defers the standardization of the semantics of those options to a later PEP. So the keywords are accepted and mean nothing yet.

The rewritten decorator says what the original meant:

```python
P = ParamSpec("P")

def add_logging(f: Callable[P, R]) -> Callable[P, Awaitable[R]]:
    async def inner(*args: P.args, **kwargs: P.kwargs) -> R:
        await log_to_database()
        return f(*args, **kwargs)
    return inner
```

Now `takes_int_str("b", 2)` is correctly rejected by the type checker.

## Two annotations for one thing

A `ParamSpec` captures both positional and keyword accessible parameters, but there unfortunately is no object in the runtime that captures both of these together. Instead, we are forced to separate them into `*args` and `**kwargs`. So the PEP introduces `P.args` to represent the tuple of positional arguments in a given call and `P.kwargs` to represent the corresponding mapping of keywords to values, and then spends most of its specification keeping the halves welded together.

They may only be used as the annotated types for `*args` and `**kwargs`, accessed from a `ParamSpec` already in scope. Storing one in a variable is rejected. Annotating a normal parameter with `P.args` is rejected. Swapping them is rejected. And a function with only one of the two is rejected: `def just_args(*args: P.args)` does not type-check, nor does `def just_kwargs(**kwargs: P.kwargs)`.

The reason is a fact about Python's calling convention. Because the default kind of parameter, written `(x: int)`, may be addressed both positionally and through its name, two valid invocations of a `(*args: P.args, **kwargs: P.kwargs)` function may give different partitions of the same set of parameters. The same call site can put `x` in either bucket. Neither half is meaningful alone, so the specification makes sure that these special types are only brought into the world together, and are used together, so that our usage is valid for all possible partitions.

Inside the function, `args` has the type `P.args`, not `tuple[P.args, ...]` as would be with a normal annotation. This special case is necessary to encapsulate the heterogeneous contents of the args and kwargs of a given call, which cannot be expressed by an indefinite tuple or dictionary type. The three rules that follow are the entire mechanism: a `Callable[P, R]` can be called with `(*args, **kwargs)` if and only if `args` has the type `P.args` and `kwargs` has the type `P.kwargs`, and those types both originated from the same function declaration; and a function declared `def inner(*args: P.args, **kwargs: P.kwargs) -> X` has type `Callable[P, X]`. Two conversions and an identity check, and parameter-preserving [[cs/languages/Python/decorators|decorators]] become checkable.

## Concatenate, and what it buys

The semantics of `Concatenate[X, Y, P]` are that it represents the parameters represented by `P` with two positional-only parameters prepended. That covers decorators that add, remove, or transform a finite number of parameters. `def add(x: Callable[P, int]) -> Callable[Concatenate[str, P], bool]` applied to `def bar(x: int, *args: bool) -> int` should return a callable taking a `str`, then `x: int`, then `*args: bool`. `def remove(x: Callable[Concatenate[int, P], int]) -> Callable[P, bool]` goes the other way.

The positional-only part is load-bearing. While any function that returns an `R` can satisfy `Callable[P, R]`, only functions that can be called positionally in their first position with an `X` can satisfy `Callable[Concatenate[X, P], R]`. A function declared `def two(*, x: int) -> int` is rejected; `def four(*args: int) -> int` is accepted.

> [!warning] Some decorators are still untypable, and the PEP names them
> Two classes remain out of reach: those that add, remove, or change a *variable* number of parameters, and those that add, remove, or change keyword-only parameters. The PEP gives the canonical casualty by name, stating that `functools.partial` will remain untypable even after this PEP. A feature whose specification names a standard library function it cannot describe is being honest about its ceiling, and the ceiling is exactly where [[cs/pl/type-systems-goals-guarantees|a type system stops being a total description]] of what a program does.

## The runtime holds none of this

`ParamSpec` is a `typing` object with a name attribute. `P.args` and `P.kwargs` describe values that exist only during a call, which is why the specification had to invent the pairing rule instead of pointing at an object. Placing keyword-only parameters between the `*args` and `**kwargs` is forbidden, not because the interpreter would object, but because the checker could no longer prove the two halves reconstruct one parameter list.

## Related Notes

- [[cs/languages/Python/decorators|Decorators in Python]] - the pattern the whole feature exists to annotate
- [[cs/languages/Python/typevar-and-generic-functions|TypeVar and Generic Functions]] - the same sameness constraint over single types
- [[cs/languages/Python/typevartuple-and-variadic-generics|TypeVarTuple and Variadic Generics]] - the sibling feature that quantifies over a tuple of types instead
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and Algebraic Data Types]] - quantification over things that are not types
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what an explicit unchecked position costs
- [[cs/languages/CSharp/delegates-events-and-the-func-family|Delegates, Events, and the Func Family]] - a language that names each arity instead of abstracting over the list

## Sources

- "PEP 612 - Parameter Specification Variables," Python Enhancement Proposals. https://peps.python.org/pep-0612/ . Supports the bracketed `Callable` parameter-list syntax and callback protocols as the two prior options and their inability to forward parameter types, the `add_logging` example that type checks and fails at runtime, the ellipsis meaning that no validation is done on arguments, the description of the decorator idiom passing all arguments through `*args` and `**kwargs` and the safety statement about the wrapping function, PEP 484 supporting dependencies between single types with the `append` example and the absence of any way to do so for parameters, the `ParamSpec("P")` naming rule with `WrongName` rejected, the deferral of `bound`, `covariant`, and `contravariant` semantics to a later PEP, the rewritten decorator correctly rejecting the bad call, the absence of a runtime object capturing positional and keyword parameters together, the introduction of `P.args` and `P.kwargs` and their restriction to `*args` and `**kwargs` annotations with the rejected misuses, the partition argument about parameters addressable both positionally and by name, the rule that `args` has type `P.args` rather than an indefinite tuple and why, the if-and-only-if calling rule and the declaration-to-`Callable` rule, the semantics of `Concatenate` as prepending positional-only parameters with the `add`, `remove`, and `transform` examples, the rule that only functions callable positionally in their first position satisfy a `Concatenate` type with the accepted and rejected decorator examples, the two remaining unsupported decorator classes including the statement that `functools.partial` will remain untypable, and the prohibition on keyword-only parameters between `*args` and `**kwargs`.
