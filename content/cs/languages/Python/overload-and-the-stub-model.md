---
title: Overload and the Stub Model
description: "An overload-decorated function raises NotImplementedError if you call it. A stub file shadows the module it describes. Typeshed is that arrangement at the scale of an ecosystem."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases: []
---

`bytes.__getitem__` returns an `int` for an index and a `bytes` for a slice. A union cannot say that.

```python
class bytes:
    @overload
    def __getitem__(self, i: int) -> int: ...
    @overload
    def __getitem__(self, s: slice) -> bytes: ...
```

The specification puts the reason plainly: this description is more precise than would be possible using unions, which cannot express the relationship between the argument and return types. Writing `def __getitem__(self, a: int | slice) -> int | bytes` loses the correlation, and every call site then has to re-narrow a result the callee already knew.

> [!note] The idea
> `@overload` and stub files are the same mechanism at two scales, and the mechanism is a *parallel source of truth*. The overload-decorated definitions are for the benefit of the type checker only, since they will be overwritten by the non-overload-decorated definition, while the latter is used at runtime but should be ignored by a type checker. One name, two descriptions, each invisible to the other's consumer. Scale that up and you get a `.pyi` file that shadows a module; scale it up again and you get typeshed, a maintained-in-parallel API description for most of the standard library.

## What overload declares and what the runtime does with it

In regular modules, a series of overload-decorated definitions must be followed by exactly one non-overload-decorated definition for the same function. Order matters because Python's `def` is an assignment: the last one wins, and every overload above it is discarded by the interpreter as it executes the module.

The runtime consequence is stated exactly: at runtime, calling an overload-decorated function directly will raise `NotImplementedError`. There is nothing in the body to call. The signature was the payload.

Type checkers enforce a small set of structural rules. At least two overload-decorated definitions must be present, and an error should be reported if only one is. The overload-decorated definitions must be followed by an implementation that does not carry the decorator, though overload definitions within stub files, protocols, and on abstract methods within abstract base classes are exempt from this check, because in those contexts there is no implementation to write. If one overload signature is decorated with `staticmethod` or `classmethod`, all overload signatures must be similarly decorated, and the implementation must have a consistent decorator too.

Consistency between the implementation and its overloads is checked in both directions. The implementation should accept all potential sets of arguments that are accepted by the overloads and should produce all potential return types produced by the overloads. In typing terms, the input signature of the implementation should be assignable to the input signatures of all overloads, and the return type of all overloads should be assignable to the return type of the implementation.

The specification also advises restraint. A constrained `TypeVar` can sometimes be used instead, and `concat1[S: (str, bytes)](x: S, y: S) -> S` is equivalent to the two-overload version. The recommendation is that `overload` is only used in cases where a type variable is not sufficient, which is the `map` and `__getitem__` shape where the arity or the argument-to-return relationship varies. [[cs/languages/Python/typevar-and-generic-functions|A constrained type variable]] also does something overloads cannot: it can define constraints for generic class type parameters.

## Matching is a six-step algorithm with a combinatorial escape hatch

When a checker evaluates a call to an overloaded function, only the overloads should be considered for matching purposes, and the implementation, if provided, should be ignored. The implementation is not a fallback. It is not consulted at all.

Step 1 counts positional and keyword arguments to eliminate implausible candidates by shape alone. Step 2 evaluates each survivor as a regular call, considering the types, and it does so silently: during this step, do not generate any user-visible errors, simply record which of the overloads result in evaluation errors. First one that succeeds and stands alone wins.

Step 3 is where it gets expensive. If every overload errored, the checker performs argument type expansion, in which union types can be expanded into their constituent subtypes, one argument at a time from left to right. The specification's own example shows the growth: two arguments typed `int | str` and `int | bytes` expand to four sets, `(int, int)`, `(int, bytes)`, `(str, int)`, and `(str, bytes)`. If all expanded argument lists evaluate successfully, their return types are combined by union to determine the final return type. The cost of this is [[cs/math/combinatorics|the product of the union widths]], which is the honest reason overloaded calls over wide unions are the slow part of a type check.

Step 4 breaks remaining ties by preferring an overload with a variadic parameter when the call supplies an indeterminate number of arguments.

> [!warning] The two descriptions can disagree, and the checker will not notice
> The implementation is validated against its own overloads, but a stub is not validated against the module it shadows. If a stub file is found for a module, the type checker should not read the corresponding real module. That is the design, not a bug: it is what lets stubs be distributed separately from the implementation and developed at a different pace or by different authors. It also means a stale stub is indistinguishable from a correct one to every tool that reads it, and the code it describes may have changed underneath.

## Stub files, and what they are for

Stub files, also called type stubs, are syntactically valid Python files with a `.pyi` suffix that provide type information for untyped Python packages and modules. The specification lists four purposes, and the first is the one with no alternative: they are the only way to add type information to extension modules. A C extension has no Python source for annotations to live in.

The rest are organizational. Stubs can provide type information for packages that do not wish to add them inline. They can be distributed separately, which is especially useful when adding type annotations to existing packages. And they can act as documentation, succinctly explaining the external API of a package, without including implementation details or private members, which makes a stub a machine-checked version of the [[cs/software-engineering/api-design|public interface]] a library intends.

Two syntactic rules make stubs portable in a way ordinary modules are not. They should be parseable in all Python versions supported by the implementation and still supported by CPython, so a stub supporting 3.11 must not use the `type` alias statement. But type checkers should evaluate all annotation expressions as if they are quoted, so forward references do not need to be quoted and the `|` union operator introduced in 3.10 may be used even in stubs supporting 3.9 and older. A stub is parsed, never executed, so its annotations are exempt from the runtime evaluation rules that constrain [[cs/languages/Python/type-hints-and-gradual-typing|real annotations]].

Function bodies are the ellipsis literal and nothing else: using a function or method body other than the ellipsis literal is undefined, and `pass` in a class body is undefined.

## Typeshed as the ecosystem-scale version

The typeshed project contains type stubs for the standard library, vendored or handled specially by type checkers, and type stubs for third-party libraries that do not ship their own type information, typically distributed via PyPI. Policies regarding the stubs collected there are decided separately and described in the project's documentation. So the authoritative description of the standard library's types lives outside CPython, on its own release cadence, governed by its own project.

The inline alternative exists. Package maintainers who wish to support type checking of their code must add a marker file named `py.typed` to their package, and this marker applies recursively, so if a top-level package includes it, all its sub-packages must support type checking as well. A single empty file is what separates a library whose annotations count from one whose annotations a checker will ignore.

## Related Notes

- [[cs/languages/TypeScript/declaration-files-and-ambient-types|Declaration Files and Ambient Types]] - the same shadow-file arrangement, with DefinitelyTyped in typeshed's role
- [[cs/languages/Python/typevar-and-generic-functions|TypeVar and Generic Functions]] - the mechanism the spec recommends trying before reaching for overloads
- [[cs/math/combinatorics|Combinatorics]] - why argument type expansion is the expensive step
- [[cs/software-engineering/api-design|API Design]] - a stub as an executable statement of the public interface
- [[cs/languages/Python/typevartuple-and-variadic-generics|TypeVarTuple and Variadic Generics]] - a feature that falls back on per-rank overloads and says so
- [[cs/languages/Python/the-import-system|The Import System]] - what the checker is deliberately not doing when a stub is present

## Sources

- "Overloads," Specification for the Python type system. https://typing.readthedocs.io/en/latest/spec/overload.html . Supports the `bytes.__getitem__` overload example and the statement that it is more precise than a union which cannot express the argument-to-return relationship, the requirement in regular modules for exactly one non-decorated definition following the overloads, the statement that the decorated definitions are for the type checker only and are overwritten while the implementation is used at runtime and ignored by the checker, `NotImplementedError` on calling an overload-decorated function directly, the minimum of two overloads, the required implementation with the stub, protocol, and abstract-method exemptions, the `staticmethod` and `classmethod` consistency rule, the implementation-consistency rules in both directions with the assignability phrasing, the equivalence of a constrained type variable to a two-overload definition and the recommendation to use overloads only when a type variable is not sufficient, the note that type variables can also constrain generic class type parameters, the rule that only overloads are considered for matching with the implementation ignored, step 1 eliminating implausible candidates by argument counts, step 2 evaluating silently and recording errors, step 3 argument type expansion with the four-set example and the union of return types, and step 4 preferring variadic parameters.
- "Distributing type information," Specification for the Python type system. https://typing.readthedocs.io/en/latest/spec/distributing.html . Supports stub files being `.pyi` files providing type information for untyped packages and modules, stubs being the only way to add type information to extension modules, providing types for packages that do not want them inline, separate distribution allowing development at a different pace or by different authors, stubs acting as documentation of the external API without implementation details or private members, the rule that a type checker should not read the real module when a stub is found, the parseability requirement across supported Python versions with the `type` statement example, annotation expressions being evaluated as if quoted with the `|` operator usable in stubs supporting 3.9, function bodies other than the ellipsis literal being undefined and `pass` in class bodies being undefined, the description of the typeshed project covering the standard library and third-party libraries with separately decided policies, and the `py.typed` marker file requirement applying recursively to sub-packages.
