---
title: Any, object, and Never
description: "Any is not a set of values, it is an unknown static type. That forces a separate consistency relation, which is symmetric, reflexive, and not transitive. Never is the bottom, and reaching it is a proof."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-17
updated:
aliases:
  - typing.Any
  - typing.Never
  - Python Bottom Type
  - Consistency Relation
---

The usual summary is that `Any` turns off checking and `object` accepts everything. That is true enough to use and wrong about why. The specification's framing is sharper: `Any` represents an unknown static type, and it denotes some unknown set of runtime values.

The contrast with `object` follows immediately. If an expression has the type `object`, a static type checker should ensure that operations on the expression are valid for all Python objects, or else emit a static type error, which allows very few operations. `x.foo` on an `object` is an error because not all Python objects have an attribute `foo`. An expression typed as `Any`, on the other hand, should be assumed to have *some* specific static type, but which static type is not known, and a checker should not emit errors on an expression if `Any` might represent a static type which would avoid the error.

One says "I know nothing beyond existence." The other says "I know there is an answer and I am not telling you." [[cs/languages/Python/type-hints-and-gradual-typing|The introductory framing]] treats these as an escape hatch and its safe cousin; the machinery underneath is more interesting than that.

> [!note] The idea
> Because `Any` is not a set of values, it is not in the domain of the subtype relation at all, so Python's type system cannot decide assignment with subtyping alone. It defines *materialization*, then *consistency*, then assignability on top of both. The payoff is a relation with a property no subtyping relation has: the consistency relation is not transitive. `tuple[int, int]` is consistent with `tuple[Any, int]`, and `tuple[Any, int]` is consistent with `tuple[str, int]`, but `tuple[int, int]` is not consistent with `tuple[str, int]`. That single failure of transitivity is the formal shape of "gradual."

## Types are sets, and gradual types are ranges of sets

The foundation is ordinary. A type such as `str` describes the set of values whose `__class__` is `str` or a subclass, subtyping corresponds to the [[cs/math/set-theory-basics|subset relation]], and because the subset relation on sets is transitive and reflexive, the subtype relation is also transitive and reflexive.

A gradual type breaks that. `tuple[int, Any]` does not represent a single set of Python objects; rather, it represents a bounded range of possible sets of values. It might be the set of all tuples of two integers, or the set of all tuples of an integer and a string, or some other set of tuple values. The fully static type meaning "all length-two tuples whose first element is an integer" has a different spelling: `tuple[int, object]`. And the difference is observable, since an expression of type `tuple[int, Any]` can be assigned to a target typed `tuple[int, int]`, whereas assigning `tuple[int, object]` to `tuple[int, int]` is a static type error.

`object` is the ceiling of the range. The fully static type `object` is the upper bound for the possible sets of values represented by `Any`, exactly as `tuple[int, object]` is the upper bound for `tuple[int, Any]`.

## Materialization, consistency, assignability

Since `Any` represents an unknown static type, it is not in the domain of the subtype, supertype, or equivalence relations on static types. So the specification builds three relations in sequence.

**Materialization** transforms a more dynamic type to a more static type. Given a gradual type, replacing zero or more occurrences of `Any` with some type, which can be different for each occurrence, produces a materialization. `tuple[int, str]` and `tuple[Any, str]` are both materializations of `tuple[Any, Any]`. The relation is transitive and reflexive, so it defines a preorder on gradual types.

**Consistency** is defined on top of it. Two fully static types are consistent only if they are the same type. Two gradual types are consistent if and only if there exists some fully static type which is a materialization of both. From that, `Any` is consistent with every type and every type is consistent with `Any`. The relation is symmetric, so if `A` is consistent with `B`, `B` is consistent with `A`, and it is reflexive. It is not transitive.

**Assignability** is consistent subtyping: a type `B` is a consistent subtype of `A` if there exists a materialization of each, both fully static, where one is a subtype of the other. Consistent subtyping defines assignability for Python, and an expression can be assigned to a variable, passed as an argument, or returned from a function if its type is a consistent subtype of the annotation. Unlike consistency, the assignable-to relation is not generally symmetric.

> [!example] A relation that is reflexive and symmetric but not transitive
> Consistency is not an equivalence relation, and the missing axiom is the interesting one. [[cs/math/relations-and-equivalence|Equivalence requires all three]]: reflexive, symmetric, transitive. Consistency has the first two and drops the third, and the `tuple[int, int]` chain through `tuple[Any, int]` shows exactly how. Each hop is licensed by a different materialization of the same `Any`, and nothing forces the two hops to pick the same one. That is why a value can launder its type through an `Any`-shaped intermediary and arrive somewhere the checker would have rejected directly.

The payoff for accepting that is the gradual guarantee. In a fully dynamically typed program, a checker assigns `Any` to all expressions and should emit no errors. Adding annotations may produce errors, if the program is not correct or if the static types are not able to fully represent the runtime types. But removing type annotations, making the program more dynamic, should not result in additional static type errors. That directional promise is the contract that makes annotating a large codebase one function at a time survivable.

## Where Any leaks in without being written

Three defaults matter more than the keyword itself. A function parameter without an annotation is assumed to be annotated with `Any`. A generic type used without type parameters has them assumed to be `Any`, so a bare `Mapping` is `Mapping[Any, Any]` and a bare `tuple` in annotation context is `tuple[Any, ...]`. And a bare `Callable` is equivalent to `Callable[..., Any]`.

Since 3.11, `Any` can also be used as a base class, which is useful for avoiding type checker errors with classes that can duck type anywhere or are highly dynamic. A class whose ancestry includes the unknown inherits the unknown.

## Never proves something

Since Python 3.11 the `typing` module contains `Never`, which represents the bottom type, a type that represents the empty set of Python objects. `Never` and `NoReturn` represent the same thing, and static type checkers treat both equivalently; the difference is convention, with `NoReturn` conventionally used in return annotations and `Never` typically used in other locations. `NoReturn` was added in 3.6.2 and `Never` in 3.11.

As a return type, it constrains the function: checkers will ensure that functions annotated as returning `NoReturn` truly never return, either implicitly or explicitly, so a function that calls `sys.exit(1)` only on one branch is an error because the other branch implicitly returns `None`. Checkers will also recognize that the code after calls to such functions is unreachable and behave accordingly.

As a *parameter* type, it does the more interesting job. A function taking a `Never` parameter can never be legally called, because no value has that type, which turns a call into an assertion. The documented pattern uses it for exhaustiveness: a `match` over `int | str` with an `int` case, a `str` case, and a wildcard case that calls the never-callable function. Inside the wildcard, the argument has been narrowed to `Never`, so the call is accepted. Add a third member to the union later and the wildcard narrows to something inhabited, and the same line becomes a type error.

That is what makes `Never` a proof rather than a label. Reaching a position typed `Never` means [[cs/languages/Python/type-narrowing-and-typeguard|narrowing]] eliminated every alternative, and the checker rejecting a `Never`-typed call is the checker telling you it could not eliminate them all.

## Related Notes

- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - reflexive, symmetric, transitive, and what dropping one of them buys
- [[cs/math/set-theory-basics|Set Theory Basics]] - the subset reading of subtyping that gradual types deliberately break
- [[cs/languages/TypeScript/the-any-unknown-never-triangle|The any, unknown, never Triangle]] - a language with a third point, `unknown`, that Python spells `object`
- [[cs/languages/Python/type-narrowing-and-typeguard|Type Narrowing, TypeGuard, and TypeIs]] - how an expression arrives at `Never` in the first place
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the relation assignability is built on top of
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what the gradual guarantee promises and what it declines to

## Sources

- "Type system concepts," Specification for the Python type system. https://typing.readthedocs.io/en/latest/spec/concepts.html . Supports `Any` representing an unknown static type denoting an unknown set of runtime values, the contrast with `object` requiring operations valid for all Python objects with the `x.foo` example, the instruction that a checker should not emit errors where `Any` might represent a type avoiding them, gradual types representing a bounded range of possible sets of values with the `tuple[int, Any]` discussion and the `tuple[int, object]` spelling, the observable assignment difference between `tuple[int, Any]` and `tuple[int, object]` into `tuple[int, int]`, `object` as the upper bound for the sets represented by `Any`, nominal types corresponding to subclassing with subtyping as the subset relation and the transitivity and reflexivity that follow, `Any` not being in the domain of the subtype, supertype, or equivalence relations, the definition of materialization by replacing occurrences of `Any` and its transitivity and reflexivity as a preorder, the consistency definition for fully static and gradual types, `Any` being consistent with every type, the explicit statement that the consistency relation is not transitive with the `tuple[int, int]`, `tuple[Any, int]`, and `tuple[str, int]` chain, consistency being symmetric and reflexive, the definition of consistent subtyping and its identification with assignability, assignability governing variables, arguments, and returns, the assignable-to relation not being generally symmetric, and the gradual guarantee including the no-errors baseline and the promise that removing annotations should not add errors.
- "Special types in annotations," Specification for the Python type system. https://typing.readthedocs.io/en/latest/spec/special-types.html . Supports every type being assignable to `Any` and `Any` to every type, an unannotated function parameter being assumed `Any`, an unparameterized generic assuming `Any` parameters with `Mapping` as `Mapping[Any, Any]` and bare `tuple` as `tuple[Any, ...]`, a bare `Callable` being `Callable[..., Any]`, `Any` being usable as a base class for highly dynamic or duck-typed classes, the `NoReturn` special form for functions that never return normally with `sys.exit` as an example, checkers ensuring such functions truly never return with the implicit-`None` error case, checkers treating code after such calls as unreachable, and `Never` existing since Python 3.11 as the bottom type representing the empty set of Python objects and being interchangeable with `NoReturn` despite differing conventions.
- "typing - Support for type hints," Python Standard Library. https://docs.python.org/3/library/typing.html . Supports `Any` as a special type indicating an unconstrained type with bidirectional assignability, `Any` becoming usable as a base class in 3.11, `Never` and `NoReturn` representing the bottom type with no members, their use both for functions that never return and for functions that should never be called because there are no valid arguments, the `never_call_me` and `int_or_str` exhaustiveness example where the wildcard case is accepted, the statement that `Never` and `NoReturn` have the same meaning and are treated equivalently by checkers, and the version history adding `NoReturn` in 3.6.2 and `Never` in 3.11.
