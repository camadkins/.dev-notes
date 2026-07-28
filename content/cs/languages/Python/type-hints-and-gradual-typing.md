---
title: Type Hints and Gradual Typing
description: "Annotations are data the interpreter stores and never checks. What that buys, what Any actually means, and how PEP 649 changed when an annotation expression runs."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-05-29
updated:
aliases:
  - Python Type Hints
  - PEP 484
  - Python Annotations
---

```python
def greeting(name: str) -> str:
    return 'Hello ' + name
```

Nothing in that function is enforced. The `typing` documentation says it plainly in a note at the top: the Python runtime does not enforce function and variable type annotations, and they can be used by third party tools such as type checkers, IDEs, and linters. PEP 484 says the same thing from the other direction. While these annotations are available at runtime through the usual `__annotations__` attribute, no type checking happens at runtime. Instead, the proposal assumes the existence of a separate off-line type checker which users can run over their source code voluntarily, and PEP 484's own summary of what such a checker is: essentially a very powerful linter.

> [!note] The idea
> Python's type system is a *side channel*, not a runtime mechanism. The interpreter's entire contribution is to record annotation expressions and hand them back when asked; every judgment about whether a program is well-typed happens in a different process, run by a tool that is not the interpreter. That is what makes the system gradual rather than optional-in-name-only: because nothing at runtime depends on the annotations, a codebase can be annotated one function at a time, and unannotated code stays legal and unchecked forever by design.

## What the syntax was before it meant anything

PEP 3107 introduced syntax for function annotations, but the semantics were deliberately left undefined. Annotations were a place to put an expression next to a parameter, and the language committed to nothing about what it meant. PEP 484's motivation was that there had been enough third-party usage for static type analysis that the community would benefit from a standard vocabulary and baseline tools in the standard library. Its contribution was a provisional module of standard definitions plus conventions for situations where annotations are not available.

Notably PEP 484 did not close the door on other uses. It explicitly does not prevent other uses of annotations, nor does it require or forbid any particular processing of annotations, even when they conform to the specification. The comparison the PEP draws is to PEP 333 and web frameworks: the value is coordination, not enforcement.

Two design choices from that era still shape the ergonomics. The bracket notation `Sequence[int]` was chosen so that no new syntax needs to be added to the language, and it works at runtime by implementing `__getitem__()` in the metaclass, though its significance is primarily to an offline type checker. And the whole proposal is strongly inspired by mypy.

PEP 484's stated priority ordering is worth carrying: of static analysis, potential runtime type checking, and code generation, static analysis is the most important, including off-line checkers such as mypy plus a standard notation IDEs can use for code completion and refactoring.

## The non-goals are the load-bearing part

PEP 484's Non-goals section is short and unusually blunt. Runtime type checking is not in scope: while the typing module contains some building blocks for it, in particular `get_type_hints()`, third party packages would have to be developed to implement specific runtime type checking functionality, for example using decorators or metaclasses. Using type hints for performance optimizations is left as an exercise for the reader.

Then the sentence that settles the argument about where Python is headed: Python will remain a dynamically typed language, and the authors have no desire to ever make type hints mandatory, even by convention.

The gradualism follows mechanically from the annotation rules. Any function without annotations should be treated as having the most general type possible, or ignored, by any type checker, and functions with the `@no_type_check` decorator should be treated as having no annotations. For a checked function, the default annotation for arguments and for the return type is `Any`. The `self`-shaped exception is carved out: if the first argument of an instance or class method is not annotated, it is assumed to have the type of the containing class for instance methods, and a type object type corresponding to the containing class object for class methods.

## Any is not a type, it is a hole

`Any` is the piece that makes gradual typing work and the piece most often misread. A static type checker will treat every type as assignable to `Any` and `Any` as assignable to every type. That is bidirectional, and it is the whole trick.

The consequence is that no type checking is performed when assigning a value of type `Any` to a more precise type. The `typing` documentation's own example assigns an `Any`-typed name holding an `int` into a name declared `str`, and reports that the static type checker did not report an error even though the variable receives an `int` value at runtime. Any operation or method call is permitted on a value of type `Any`. This behavior allows `Any` to be used as an escape hatch when you need to mix dynamically and statically typed code.

`object` is the deliberate contrast. Every type is a subtype of `object`, but unlike `Any` the reverse is not true, so `object` is not a subtype of every other type. When the type of a value is `object`, a type checker will reject almost all operations on it, and assigning it to a variable or using it as a return value of a more specialized type is a type error. `Any` says "stop checking"; `object` says "check, and I promise nothing beyond existence."

And unannotated code is `Any`-shaped by default: all functions without a return type or parameter types implicitly default to using `Any`. That is the mechanism by which a half-annotated codebase does not immediately drown in errors, and also the mechanism by which a half-annotated codebase quietly checks much less than its authors assume. The relationship between checked and unchecked regions is the same tension covered in [[cs/pl/type-systems-goals-guarantees|type systems, goals, and guarantees]].

> [!example] NewType is static-only, and its runtime residue is nearly nothing
> `UserId = NewType('UserId', int)` gives a checker a type it treats as if it were a subclass of the original type, so `get_user_name(UserId(42351))` passes while `get_user_name(-1)` fails. You may still perform all `int` operations on a `UserId`, but the result will always be of type `int`. At runtime the statement `Derived = NewType('Derived', Base)` makes `Derived` a callable that immediately returns whatever parameter you pass it, so `Derived(some_value)` does not create a new class or introduce much overhead beyond that of a regular function call. The documentation gives the sharpest possible statement of the identity: the expression `some_value is Derived(some_value)` is always true at runtime.

## When the annotation expression actually runs

The one place the runtime genuinely participates is evaluation timing, and that has changed twice. Python's original semantics for annotations required them to be eagerly evaluated, at the time the annotated object was bound, which caused chronic problems for static type analysis users due to forward-reference and circular-reference problems. PEP 563's answer was stringized annotations, in which annotations were automatically converted into strings by Python, and that solved the forward-reference and circular-reference problems but in turn caused chronic problems for runtime users of annotations.

PEP 649, "Deferred Evaluation Of Annotations Using Descriptors," is the third approach and targets Python 3.14. It adds a new dunder attribute `__annotate__` to functions, classes, and modules, holding a reference to a function which computes and returns that object's annotations dict. At compile time the compiler writes the expressions computing the annotations into their own function and stores a reference to it in `__annotate__`; `__annotations__` is redefined as a data descriptor which calls this annotation function once and caches the result. The point is that this delays the evaluation of annotations expressions until the annotations are examined, which solves many circular reference problems. PEP 649 also adds a keyword-only `format` parameter to `inspect.get_annotations` and `typing.get_type_hints`, with `inspect.VALUE = 1` as the default returning the conventional Python values.

The practical payoff shows up in `typing.TYPE_CHECKING`, a constant assumed to be `True` by static type checkers and `False` at runtime. A module which is expensive to import, and which only contains types used for typing annotations, can be safely imported inside an `if TYPE_CHECKING:` block. That prevents the module from being imported at runtime, and because annotations are not eagerly evaluated, using undefined symbols in annotations is harmless as long as you do not later examine them. This is the clearest demonstration of the side-channel thesis: an annotation can name something that does not exist in the running process.

> [!warning] The escape hatch has a cost the checker cannot report
> `if TYPE_CHECKING:` imports and lazily evaluated annotations mean a name in an annotation may be unresolvable at runtime. Code that introspects annotations, a serializer, a dependency injector, a validation library, hits `NameError` on exactly those names. The documented recourse is `annotationlib.get_annotations()` with a `format` of `annotationlib.Format.STRING` or `annotationlib.Format.FORWARDREF`, which retrieves the annotations without raising `NameError`. Static-only and runtime-consumed annotations are different use cases sharing one syntax, and the split is where most annotation bugs live.

## Related Notes

- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what a type system is for, and what "checked" buys
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the assignability relation `Any` deliberately short-circuits
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner Type Inference]] - the inference tradition Python's checkers borrow from without the full algorithm
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - `__getitem__` on a metaclass is what makes `Sequence[int]` a runtime-legal expression
- [[cs/languages/Python/decorators|Decorators in Python]] - `functools.wraps` copies `__annotations__`, which is why wrapped functions keep their hints
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - where a type system can and cannot replace runtime error handling

## Sources

- "PEP 484 - Type Hints," Python Enhancement Proposals. https://peps.python.org/pep-0484/ . Supports PEP 3107 leaving annotation semantics deliberately undefined, the `greeting` example, annotations being available via `__annotations__` with no runtime type checking and an assumed separate off-line checker acting as a powerful linter, the mypy inspiration and the bracket notation avoiding new syntax via metaclass `__getitem__`, static analysis being the most important goal, the Non-goals text on runtime checking needing third party packages and performance optimization being left to the reader, the statement that Python will remain dynamically typed with no desire to make hints mandatory, and the annotation-meaning rules including `@no_type_check`, the `Any` default, and the implicit first-argument type for instance and class methods.
- "typing - Support for type hints," Python Standard Library. https://docs.python.org/3/library/typing.html . Supports the note that the Python runtime does not enforce annotations and that third party tools consume them, the bidirectional assignability of `Any`, the worked example where assigning an `Any` value to a `str` passes checking while holding an `int` at runtime, `Any` as an escape hatch for mixing dynamic and static code, unannotated functions defaulting to `Any`, the `object` contrast, the `NewType` semantics including subclass-like treatment by checkers, `int`-typed results of operations, the zero-overhead callable at runtime and the `some_value is Derived(some_value)` identity, and `TYPE_CHECKING` being `True` for checkers and `False` at runtime with the expensive-import pattern and the `annotationlib.get_annotations()` recourse.
- "PEP 649 - Deferred Evaluation Of Annotations Using Descriptors," Python Enhancement Proposals. https://peps.python.org/pep-0649/ . Supports the original eager-evaluation semantics and the forward- and circular-reference problems they caused, PEP 563's stringized annotations solving those while breaking runtime consumers, the Python-Version 3.14 target, the `__annotate__` attribute and compiler-generated annotation function, `__annotations__` becoming a caching data descriptor, the delay of evaluation until annotations are examined, and the `format` keyword-only parameter added to `inspect.get_annotations` and `typing.get_type_hints` with `inspect.VALUE = 1` as the default.
