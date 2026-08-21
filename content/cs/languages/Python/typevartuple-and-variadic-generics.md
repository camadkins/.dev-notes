---
title: TypeVarTuple and Variadic Generics
description: "A type variable that stands for a tuple of types, driven almost entirely by array shape. What it deliberately cannot do is the more instructive half: no arithmetic, no splitting, one per parameter list."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-04
updated:
aliases:
  - TypeVarTuple
  - PEP 646
  - Python Variadic Generics
  - Unpack
---

```python
def to_gray(videos: Array): ...
```

From the signature alone, it is not obvious what shape of array we should pass for the `videos` argument. Possibilities include batch by time by height by width by channels, or time by batch by channels by height by width. PEP 646 opens on that annotation because the entire feature was built for it.

The PEP names three costs of the ambiguity. Documentation, since without the required shape being clear in the signature, the user must hunt in the docstring or the code in question. Catching shape bugs before runtime, which is particularly important for machine learning code, where iteration times can be slow. And preventing subtle shape bugs, because in the worst case, use of the wrong shape will result in the program appearing to run fine, but with a subtle bug that can take days to track down.

> [!note] The idea
> A `TypeVarTuple` is a placeholder not for a single type but for a tuple of types. That one move is enough to type a class generic in its *rank*, which no fixed-arity generic can do. The constraint worth carrying is the reason the feature stops where it does: there is no way to peer inside a `TypeVarTuple` to see what its individual types are. Everything the PEP declines to support, splitting, arithmetic, multiple packs, follows from that single opacity.

## Why arity had to become a parameter

The obvious workaround is a class per rank: `Array1(Generic[Axis1])`, `Array2(Generic[Axis1, Axis2])`, and so on. The PEP rejects it as clumsy, since it requires users to unnecessarily pepper their code with 1s, 2s, and so on for each rank necessary, and it forces array library authors to duplicate implementations throughout multiple classes. Variadic generics are necessary for an array that is generic in an arbitrary number of axes to be cleanly defined as a single class.

The result is short:

```python
DType = TypeVar('DType')
Shape = TypeVarTuple('Shape')

class Array(Generic[DType, *Shape]):
    def __abs__(self) -> Array[DType, *Shape]: ...
    def __add__(self, other: Array[DType, *Shape]) -> Array[DType, *Shape]: ...
```

Type variable tuples behave like a number of individual type variables packed in a tuple. Unpacking with the star operator makes `Generic[*Shape]` behave as if we had simply written `Generic[T1, T2]`, except that it allows parameterisation with an arbitrary number of type parameters. The star is a new use of an existing operator: unpacking a `TypeVarTuple` or tuple type is the typing equivalent of unpacking a variable or a tuple of values, borrowed from the [[cs/dsa/multidimensional-arrays|shape and rank]] vocabulary the numerical libraries already spoke.

The PEP is agnostic about what fills the axes. Semantic labels via `NewType('Height', int)` and literal sizes via `Literal` are both demonstrated, and that decision is left to library authors.

## Always unpacked, and why

A `TypeVarTuple` must always be used unpacked, prefixed by the star operator. The two reasons given are unusually candid about human factors. First, to avoid potential confusion about whether to use a type variable tuple in a packed or unpacked form, which the PEP illustrates with a developer wondering whether to write `Shape`, `tuple[Shape]`, or `tuple[*Shape]`. Second, to improve readability, since the star also functions as an explicit visual indicator that the type variable tuple is not a normal type variable.

The star required a grammar change and is therefore available only in new versions of Python, so `Unpack` exists as a spelling that works in older ones: `Generic[Unpack[Shape]]` means what `Generic[*Shape]` means. Two syntaxes for one operation, one of them a function-shaped workaround for a parser limitation, is the same [[cs/languages/Python/type-hints-and-gradual-typing|bolted-on quality]] PEP 695 later attacked in the ordinary generics syntax.

## The restrictions are the specification

**One pack per list.** Only a single type variable tuple may appear in a type parameter list. The reason is that multiple type variable tuples make it ambiguous which parameters get bound to which type variable tuple: given `Array[int, str, bool]` with two packs, nothing decides the split.

**No variance, constraints, or bounds.** To keep this PEP minimal, `TypeVarTuple` does not yet support variance, type constraints, or type bounds, leaving the decision of how these arguments should behave to a future PEP, when variadic generics have been tested in the field. As of this PEP, type variable tuples are invariant.

**No unions inside the pack.** If the same `TypeVarTuple` appears twice in a signature and receives `tuple[int]` and `tuple[str]`, one plausible inference would be a tuple of a union. The PEP forbids it: type unions may not appear within the tuple. That keeps a pack a sequence of definite types rather than a lattice join, which is what makes it behave like a [[cs/pl/records-variants-and-pattern-matching|product type]] and not a variant.

**Packs cannot be split.** An unpacked arbitrary-length tuple *can* be split between the `TypeVar`s and the `TypeVarTuple` in an alias, on the assumption that it contains at least as many items as there are `TypeVar`s. A `TypeVarTuple` cannot: `Camelot = tuple[T, *Ts1]` subscripted with `*Ts2` is not valid, because unlike an unpacked arbitrary-length tuple, there is no way to peer inside the `TypeVarTuple` to see what its individual types are.

> [!warning] Shape arithmetic is out of scope, which is most of what shape checking wants
> As of this PEP, it is not yet possible to describe arithmetic transformations of array dimensions, and the PEP gives the example `def repeat_each_element(x: Array[N]) -> Array[2*N]`. It considers this out of scope and plans to propose additional mechanisms in a future PEP. The workaround for reaching individual axes is [[cs/languages/Python/overload-and-the-stub-model|overloads]] with one `TypeVar` per axis, and the PEP admits the cost directly: having to specify overloads for each possible rank is a rather cumbersome solution, but it is the best we can do without additional type manipulation mechanisms. So the feature typed the shape and left the shape *algebra* undone, which is why a transpose can be annotated and a reshape usually cannot.

## The `*args` payoff

PEP 484 states that when a type annotation is provided for `*args`, every argument must be of the type annotated, so `*args: int` means all arguments are `int`. That limits our ability to specify the type signatures of functions that take heterogeneous argument types. Annotating `*args: *Ts` changes the rule: the types of the individual arguments become the types in the type variable tuple, so `args_to_tuple(1, 'a')` infers `tuple[int, str]`. If no arguments are passed, the type variable tuple behaves like an empty tuple.

Prefixes and suffixes work too, which is how `os.execle`, taking a path, a variable number of arguments, and a trailing environment, gets a signature at all: `*args: *tuple[*Ts, Env]`.

The PEP was accepted for Python 3.11, with the caveat that details around multiple unpackings in a type expression are not specified precisely, which gives individual type checkers some leeway. Two conforming checkers may disagree there, and the PEP says so.

## Related Notes

- [[cs/languages/Cpp/variadic-templates-and-parameter-packs|Variadic Templates and Parameter Packs]] - a variadic mechanism that *can* look inside the pack, and what that costs
- [[cs/languages/Python/paramspec-and-callable-types|ParamSpec and Callable Types]] - the sibling feature quantifying over parameter lists instead of type lists
- [[cs/dsa/multidimensional-arrays|Multidimensional Arrays]] - what a shape is, and why rank is the thing that varies
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the product-type reading of a tuple of types
- [[cs/languages/Python/overload-and-the-stub-model|Overload and the Stub Model]] - the fallback for reaching individual axes
- [[cs/languages/Python/pep-695-type-parameter-syntax|PEP 695 Type Parameter Syntax]] - where `*Ts` gained a declaration form in the parameter list

## Sources

- "PEP 646 - Variadic Generics," Python Enhancement Proposals. https://peps.python.org/pep-0646/ . Supports `TypeVarTuple` enabling parameterisation with an arbitrary number of types and its array-shape motivation for NumPy and TensorFlow, the `to_gray` signature ambiguity with the two candidate axis orders, the three reasons the shape matters including hunting in the docstring, slow machine learning iteration, and programs that appear to run fine with a subtle bug, the per-rank class workaround being clumsy and duplicating implementations, the statement that variadic generics are necessary for a single class generic in an arbitrary number of axes, the `Array` class definition, a type variable tuple being a stand-in for a tuple type and behaving like individual variables packed in a tuple, star unpacking as the typing equivalent of value unpacking and permitting an arbitrary number of parameters, the agnosticism about semantic labels versus literal sizes, the always-unpacked rule with both stated reasons, the grammar change and the `Unpack` operator for older versions, the single-pack restriction and its ambiguity rationale, variance, constraints, and bounds being unsupported with type variable tuples invariant, the prohibition on unions within the tuple, the splitting rules for unpacked arbitrary-length tuples and the impossibility of splitting a `TypeVarTuple` because there is no way to peer inside it, shape arithmetic being out of scope with the `repeat_each_element` example and the plan for a future PEP, overloads per rank being cumbersome but the best available, the PEP 484 rule that every `*args` argument must match the annotation and how `*args: *Ts` changes it with the `args_to_tuple` inference and empty-tuple behavior, the `os.execle` prefix and suffix example, and the acceptance for Python 3.11 with multiple unpackings left imprecisely specified.
