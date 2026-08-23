---
title: TypeVar and Generic Functions
description: "A TypeVar is not a type. It is a declaration that two positions in one signature must be filled by the same thing, and the difference between a bound and a constraint decides what the checker infers."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-24
updated:
aliases:
  - Python TypeVar
  - Bound vs Constrained TypeVar
---

The first thing to unlearn is that `T` names a type. It does not. It names a *position* that a checker will fill in later, and the entire value of writing it comes from writing it twice.

```python
from collections.abc import Sequence
from typing import TypeVar

T = TypeVar('T')

def first(l: Sequence[T]) -> T:
    return l[0]
```

The typing specification states the payoff in one line: the contract is that the returned value is consistent with the elements held by the collection. Nothing here says what `T` is. It says that whatever fills the element slot also fills the return slot.

> [!note] The idea
> A type variable is a *sameness constraint*, not a type. Its only power is to appear in more than one place in a signature and force those places to agree. That is why `TypeVar` is a runtime factory call assigned to a name rather than a declaration: Python had no syntax for binding a variable to a scope that spans a signature, so [[cs/languages/Python/type-hints-and-gradual-typing|the annotation side channel]] borrowed assignment and then had to police it with rules the interpreter could not enforce.

## The factory and the rules assignment forced

Generics can be parameterized by using a new factory available in typing called `TypeVar`. That word "factory" is exact. `TypeVar('T')` is a normal function call producing a normal object, bound to a normal module-level name. The type system then imposes conventions the language itself has no way to check.

Two of those rules exist purely because the mechanism is assignment. A `TypeVar()` expression must always directly be assigned to a variable, and it should not be used as part of a larger expression. And the argument to `TypeVar()` must be a string equal to the variable name to which it is assigned. Both would be unnecessary if `T` were a binding form. The string argument is the variable's *real* name, the one that survives into error messages and `repr`, and the assignment target is the name your code actually reads. Nothing in CPython makes them match, so the checker insists.

A third rule follows from the same place: type variables must not be redefined. A `TypeVar` is an object with identity, and reusing that identity in a second declaration would make the checker's scope analysis ambiguous.

## Scope is the part that surprises people

Because the declaration lives at module level, the natural reading is that `T` is one thing across the whole module. It is not. A type variable used in a generic function could be inferred to represent different types in the same code block. Two functions sharing a module-level `T` are two independent generics, and calling one with `int` says nothing about the other.

Inside a class the rule flips. A type variable used in a method of a generic class that coincides with one of the variables that parameterize this class is always bound to that variable. So `T` in a method of `MyClass(Generic[T])` is the class's `T`, fixed for the life of the instance, while a second variable `S` appearing only in one method makes that method a generic function in its own right. One name, two scoping regimes, decided by whether the class happens to list it. This is the [[cs/pl/scoping-binding-and-closures|binding problem]] solved by convention instead of by grammar, and it is the specific mess that PEP 695 was written to end.

The scope rules also forbid the obvious mistake. A generic class nested in another generic class cannot use the same type variables, because the scope of the type variables of the outer class does not cover the inner one.

## Bound and constrained are different mechanisms

By default, a type variable ranges over all possible types. Two ways exist to narrow that, and choosing wrong produces working-looking code that infers the wrong answer.

An upper bound says the substituted type must be a subtype of something. A type variable may specify an upper bound using `bound=` with the `TypeVar` constructor. The rule is that an actual type substituted, explicitly or implicitly, for the type variable must be assignable to the bound. So `ST = TypeVar('ST', bound=Sized)` accepts a `list`, a `set`, a `str`, anything with `__len__`, and the checker keeps the *specific* type it saw.

Constraints say the substituted type must be one of a fixed list. `TypeVar` supports constraining parametric types to a fixed set of possible types, and those types cannot themselves be parameterized by type variables. The canonical case is `AnyStr = TypeVar('AnyStr', str, bytes)`, which lets `concat` take two `str` or two `bytes` and rejects the mix. There should be at least two constraints if any are given, and specifying a single constraint is disallowed, which tells you the feature is a disjunction, not a bound spelled differently.

> [!warning] Constraints round up, bounds do not
> The specification is blunt about the consequence: subtypes of types constrained by a type variable should be treated as their respective explicitly listed base types in the context of the type variable. Pass a `class MyStr(str)` into a function using `AnyStr` and the call is valid, but `AnyStr` is set to `str` and not `MyStr`, so the inferred return type is `str`. Your subclass is silently widened away. A bound never does this: type constraints cause the inferred type to be exactly one of the constraint types, while an upper bound just requires that the actual type is assignable to the bound. If you want the caller's precise type back, you want a bound. If you want a small closed menu with per-branch checking, you want constraints.

The bound has its own limitation worth naming: the bound itself cannot be parameterized by type variables. You cannot write a bound that depends on another type parameter, which is the point where Python's system stops short of the F-bounded polymorphism that [[cs/languages/Java/recursive-generic-bounds-and-self-types|Java expresses with a recursive bound]], and part of why `Self` exists as a separate feature.

> [!example] The hole in the middle
> Additionally, `Any` is a valid value for every type variable. A `list[Any]` satisfies `Sequence[T]` and binds `T` to `Any`, which then propagates into the return type. Consider a function annotated `list[Any]`, which the specification notes is equivalent to omitting the generic notation and just saying `list`. The sameness constraint still holds, but both sides are now holes, so it constrains nothing. Generic code called from unannotated code inherits that condition wholesale, which is the ordinary way a well-typed function ends up proving nothing at all.

## Why this counts as polymorphism

What `TypeVar` buys is [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]] enforced by an external tool: one function body, checked once, valid for every substitution, with the substitution chosen at each call site by inference rather than by annotation. Python's checkers do this with local unification rather than the full [[cs/pl/hindleymilner-type-inference|Hindley-Milner]] algorithm, which is why inference stops at function boundaries and why an unannotated parameter defeats it entirely.

The runtime, meanwhile, participates in none of it. `first` compiles to the same bytecode with or without the annotations, and `T` is a live object nobody consults.

## Related Notes

- [[cs/languages/Python/pep-695-type-parameter-syntax|PEP 695 Type Parameter Syntax]] - the syntax that turns these conventions into real binding forms
- [[cs/languages/Python/variance-in-python-generics|Variance in Python Generics]] - the other keyword arguments `TypeVar` accepts, and why they are declared at the definition
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and Algebraic Data Types]] - the general shape Python is approximating
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - what "assignable to the bound" means as a relation
- [[cs/languages/Java/bounded-type-parameters|Bounded Type Parameters]] - the same idea with a grammar behind it, and multiple bounds
- [[cs/languages/Go/type-parameters-and-constraints|Type Parameters and Constraints]] - a language that made constraints the only mechanism and dropped bounds

## Sources

- "Generics," Specification for the Python type system. https://typing.readthedocs.io/en/latest/spec/generics.html . Supports the contract that the returned value is consistent with the elements held by the collection, the assignment and matching-name rules for `TypeVar()`, the prohibition on redefining a type variable, the scoping rules for a type variable in a generic function and in a method of a generic class, the nested-class scope rule, the default that a type variable ranges over all possible types, the upper-bound mechanism and its assignability requirement, the bound not being parameterizable by type variables, constraints as a fixed set with at least two members, the rule that subtypes of constrained types are treated as their listed base types with the `MyStr` example inferring `str`, the exactly-one-of versus assignable-to contrast, and `Any` being a valid value for every type variable.
- "PEP 484 - Type Hints," Python Enhancement Proposals. https://peps.python.org/pep-0484/ . Supports `TypeVar` being introduced as a new factory available in `typing` for parameterizing generics.
