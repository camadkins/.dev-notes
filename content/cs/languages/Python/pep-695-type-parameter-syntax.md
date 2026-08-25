---
title: PEP 695 Type Parameter Syntax
description: "def f[T]() is not shorthand. It gives a type parameter a real lexical scope, makes bounds lazily evaluated, and lets the checker infer variance instead of asking you to declare it."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-02
updated:
aliases: []
---

Read the two spellings side by side and the change looks cosmetic.

```python
from typing import Generic, TypeVar
_T_co = TypeVar("_T_co", covariant=True, bound=str)
class ClassA(Generic[_T_co]):
    def method1(self) -> _T_co: ...
```

```python
class ClassA[T: str]:
    def method1(self) -> T: ...
```

The second is shorter. That is the least interesting thing about it. PEP 695 targeted Python 3.12 and its motivation section reads as a list of problems that all have one root: a `TypeVar` was a global object pretending to be a binding.

> [!note] The idea
> The bracket list is a *binding construct*, and that is the whole feature. When the new syntax is used, a new lexical scope is introduced, and this scope includes the type parameters. Once a type parameter has a scope, four separate problems collapse at once: the redundant quoted name disappears, the ordering ambiguity disappears, variance can be inferred rather than declared, and the bound can be evaluated lazily because there is now a place to hang the deferred code object.

## What was actually broken

The PEP is unusually direct about the confusion it targets. The scoping rules for type variables are difficult to understand. Type variables are typically allocated within the global scope, but their semantic meaning is valid only when used within the context of a generic class, function, or type alias. Worse, a single runtime instance of a type variable may be reused in multiple generic contexts, and it has a different semantic meaning in each of these contexts. One object, many meanings, decided by where you happened to mention it. That is the scoping pathology described in [[cs/languages/Python/typevar-and-generic-functions|the TypeVar note]], stated by the people who fixed it.

The knock-on effects were social as much as technical. Because the variable was global, it needed a leading underscore to mark it module-private, and because variance had to be spelled in the constructor, it also needed a suffix, which produced cumbersome names like `_T_contra` and `_KT_co`. Editors made it worse rather than better: when a type parameter is shared among multiple generic classes, functions, and type aliases, all references are semantically equivalent, so "rename all references" renames the wrong things. And the current mechanisms for allocating type variables also requires the developer to supply a redundant name in quotes.

Ordering was its own trap. It is normally based on the order in which they first appear within a class or type alias declaration statement, but a `Generic` or `Protocol` base class could override it. `class ClassA(Mapping[K, V])` orders `K` then `V`; `class ClassB(Mapping[K, V], Generic[V, K])` orders `V` then `K`. Two nearly identical declarations, opposite meanings for `ClassB[int, str]`.

The scale claim is worth keeping honest. An analysis of 25 popular typed Python libraries revealed that type variables, in particular the `typing.TypeVar` symbol, were used in 14% of modules. Not a niche feature, not a universal one.

## What the syntax fixes structurally

There is no need to include `Generic` as a base class. Its inclusion is implied by the presence of type parameters, and it is automatically included in `__mro__` and `__orig_bases__`. Writing it anyway is a runtime error, which removes the override that caused the ordering ambiguity. Type parameter names must be unique within the same class, function, or type alias, and a duplicate name generates a syntax error at compile time, consistent with the requirement that parameter names within a function signature must be unique. The comparison is the tell: type parameters are now parameters, checked by the compiler, not names in a dict.

Bounds and constraints get syntax that maps onto the old keywords. `class ClassA[T: str]` is an upper bound, and if an upper bound is not specified, the upper bound is assumed to be `object`. Constraints use a literal tuple: `class ClassA[AnyStr: (str, bytes)]`. The literal requirement is strict, and `T1 = (bytes, str)` followed by `class ClassE[T: T1]` is a type checker error, because the parser cannot see through a name to count the members.

The `type` statement is the third leg. `type ListOrSet[T] = list[T] | set[T]` replaces the `TypeAlias` dance, and `type` is a new soft keyword, interpreted as a keyword only in this part of [[cs/pl/grammars-notation-bnfebnf|the grammar]] and an ordinary identifier everywhere else. Aliases can now be self-referential without quotes: `type RecursiveList[T] = T | list[RecursiveList[T]]`.

## Lazy evaluation is the runtime half

Three new contexts hold expressions that represent static types: `TypeVar` bounds, `TypeVar` constraints, and the value of type aliases. These expressions may contain references to names that are not yet defined, because aliases may be recursive or mutually recursive, and bounds may refer back to the current class. Under eager evaluation, every one of those would need quoting.

The mechanism is the same one [[cs/languages/Python/type-hints-and-gradual-typing|PEP 649 uses for annotations]]: each expression is saved in a code object, and the code object is evaluated only when the corresponding attribute is accessed, meaning `TypeVar.__bound__`, `TypeVar.__constraints__`, or `TypeAliasType.__value__`. After a successful evaluation the value is cached and later calls return it without re-running the code object.

The split between what runs when is precise. Eagerly evaluated: the type parameters of generic type aliases, the type parameters and annotations of generic functions, and the type parameters and base class expressions of generic classes. Lazily evaluated: the value of generic type aliases, the bounds of type variables, and the constraints of type variables.

> [!warning] A bound can change meaning between two reads
> As a consequence of lazy evaluation, the value observed for an attribute may depend on the time the attribute is accessed. The PEP's own example binds `X = int`, declares `class Foo[T: X, U: X]`, prints `Foo.T.__bound__` and gets `int`, rebinds `X = str`, then prints `Foo.U.__bound__` and gets `str`. Same class, same source line, two different bounds, because the first read froze its cache and the second had not run yet. Any tool reading `__bound__` at runtime is reading a snapshot of module state at first access, not a property of the class. This is the same class of hazard as [[cs/pl/mutable-state-references-effects|deferred evaluation over mutable bindings]] anywhere else, and the checker cannot see it at all.

## Variance stops being your problem

The PEP eliminates the need for variance to be specified for type parameters. Instead, type checkers infer the variance of type parameters based on their usage within a class. The justification is that checkers already had the machinery: Python type checkers already include the ability to determine the variance of type parameters for the purpose of validating variance within a generic protocol class, and that capability can be used for all classes whether or not they are protocols.

This is a real reduction in what a beginner must know. The PEP says so plainly: the concept of variance is an advanced detail of type theory that is not well understood by most Python developers, yet they must confront this concept today when defining their first generic class. The inference has boundaries, though. A `TypeVarTuple` or `ParamSpec` is always considered invariant, with no further inference needed, and a traditional `TypeVar` keeps whatever its constructor said.

## Related Notes

- [[cs/languages/Python/variance-in-python-generics|Variance in Python Generics]] - what the checker is inferring, and the naming convention that is now vestigial
- [[cs/languages/Python/typevar-and-generic-functions|TypeVar and Generic Functions]] - the constructor form and the scoping rules this replaced
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - what "introduces a new lexical scope" buys, in general
- [[cs/pl/grammars-notation-bnfebnf|Grammars: BNF and EBNF]] - soft keywords are a grammar trick, not a lexer one
- [[cs/pl/mutable-state-references-effects|Mutable State, References, and Effects]] - why deferred evaluation over a mutable global is a hazard
- [[cs/languages/TypeScript/generics-over-a-structural-type-system|Generics Over a Structural Type System]] - one of the languages in PEP 695's appendix survey of type parameter syntax

## Sources

- "PEP 695 - Type Parameter Syntax," Python Enhancement Proposals. https://peps.python.org/pep-0695/ . Supports the Python 3.12 target, the before-and-after `ClassA` examples, the scoping-rules confusion and the reuse of one runtime type variable across contexts with different meanings, the underscore and variance-suffix naming pressure including `_T_contra` and `_KT_co`, the rename-all-references problem, the redundant quoted name, the `Mapping[K, V]` ordering example with and without a `Generic` base, the 14% of modules figure from 25 libraries, `Generic` being implied and explicitly writing it being a runtime error, the unique-name syntax error and its comparison to function parameters, the `object` default upper bound, the literal-tuple requirement for constraints and the `T1` counterexample, the `type` soft keyword and recursive aliases, the introduction of a new lexical scope containing the type parameters, the three lazily evaluated contexts and their motivation, the code-object mechanism with caching on `__bound__`, `__constraints__`, and `__value__`, the eager versus lazy split, the `Foo[T: X, U: X]` example printing `int` then `str`, variance inference replacing declaration, the reuse of protocol variance machinery for all classes, the statement that variance is an advanced detail not well understood, and `TypeVarTuple` and `ParamSpec` always being considered invariant.
