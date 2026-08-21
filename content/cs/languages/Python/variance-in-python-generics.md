---
title: Variance in Python Generics
description: "Why list is invariant, what covariant=True actually promises, the _co and _contra convention checkers lean on, and the specialization algorithm that made declaring variance unnecessary."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-17
updated:
aliases:
  - Python Variance
  - covariant and contravariant TypeVar
  - infer_variance
---

Start with the question everyone gets wrong on instinct. A class `Employee` has a subclass `Manager`. A function takes an argument annotated `list[Employee]`. Should you be allowed to pass a `list[Manager]`?

The specification's answer is no, and the reason is one sentence long: the function might append an `Employee` instance to the list, which would violate the variable's type in the caller. The intuitive answer, that a list of managers is a list of employees, is correct only in the case the function does not mutate its argument.

> [!note] The idea
> Variance in Python is *declaration-site*: the author of the container decides, once, whether substituting a subtype is safe, and every use site inherits that decision. What makes it interesting is that the decision was never actually the author's to make. The variance of a type parameter is fully determined by how the parameter is used inside the class, and the algorithm to compute it is short enough to state in a paragraph. So `covariant=True` was never information the checker lacked. It was a promise the checker had no way to demand and, before 3.12, no reason to trust.

## The default is invariant, and that is the safe answer

By default, generic types declared using the old `TypeVar` syntax are considered invariant in all type variables, which means `list[Manager]` is neither a supertype nor a subtype of `list[Employee]`. Invariance is the choice that never lies. It rejects some safe programs and zero unsafe ones.

To opt out, type variables accept the keyword arguments `covariant=True` or `contravariant=True`, and at most one of these may be passed. Generic types defined with such variables are considered covariant or contravariant in the corresponding variable.

The split across the standard library follows the mutation argument exactly. The read-only collection classes in `typing` are all declared covariant in their type variable, `Mapping` and `Sequence` among them. The mutable collection classes such as `MutableMapping` and `MutableSequence` are declared invariant. Contravariance is rare enough that the specification names its one instance: the generator type, which is contravariant in the `send()` argument type. A parameter position you only write into can safely accept a supertype, which is the mirror image of the read-only case, and generators are one of the few standard types with a genuine input channel in a type parameter.

That mutation is the deciding factor is not a Python quirk. It is the same argument that makes [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Java's covariant arrays]] a runtime hazard while Java's generics are invariant, and the same argument behind [[cs/languages/CSharp/why-list-is-invariant-and-ienumerable-is-not|the split between IEnumerable and List]] in C#. Wherever a type parameter appears in a position you can assign to, [[cs/pl/mutable-state-references-effects|mutability]] forecloses the covariant reading.

## The naming convention is load-bearing in practice

By convention, it is recommended to use names ending in `_co` for type variables defined with `covariant=True` and names ending in `_contra` for those defined with `contravariant=True`. So you see `T_co` in real code, and in typeshed you see the underscore-prefixed forms `_T_co` and `_KT_co`.

This is a convention, not a rule, and no checker rejects a covariant variable named `T`. What it buys is a reader who can tell at a glance which substitutions a signature permits, without scrolling to the declaration. It is exactly the compensating mechanism a language reaches for when a semantically important property lives in a keyword argument at a distant call site. PEP 695 called the results cumbersome names and treated the whole convention as damage from a design it was replacing.

> [!warning] A covariant type variable is illegal in an input position
> Declaring covariance is a promise about a class, and the checker enforces it where it can. PEP 484 shows a `TypeVar` declared `covariant=True` used as a plain function parameter and return type, and states that this is flagged as an error by a type checker. Variance is meaningful only when a type variable is bound to a generic class. If a type variable declared as covariant or contravariant is bound to a generic function or type alias, type checkers may warn users about this, and any subsequent type analysis involving such functions or aliases should ignore the declared variance. A variance annotation on a standalone function is not wrong so much as meaningless: there is no container whose substitutions it could constrain.

## The algorithm that made the declaration redundant

PEP 695 removed the need to specify variance, and the reason it could is that checkers had already implemented the computation for a narrower purpose. Python type checkers already include the ability to determine the variance of type parameters for the purpose of validating variance within a generic protocol class, and that capability can be used for all classes, whether or not they are protocols.

The procedure is a two-point probe. For the parameter under test, create two specialized versions of the class, called the upper and lower specializations. In both, replace every other type parameter with a fixed dummy argument, whose only purpose is to make the class fully specialized so that the target type parameter can be varied on its own. In the upper specialization, fill the target parameter with an `object` instance. In the lower specialization, fill it with the parameter itself. Then determine whether `lower` can be assigned to `upper` using normal assignability rules. If so, the target type parameter is covariant. If not, check the other direction: if `upper` can be assigned to `lower`, it is contravariant. If neither of these combinations are assignable, the target type parameter is invariant.

> [!example] Three parameters, three answers, one class
> The specification works `class ClassA[T1, T2, T3](list[T1])` with `method1(self, a: T2) -> None` and `method2(self) -> T3`. For `T1`, neither `upper = ClassA[object, Dummy, Dummy]` nor `lower = ClassA[T1, Dummy, Dummy]` is assignable to the other, so `T1` is invariant, inherited straight from `list`. For `T2`, `upper` is assignable to `lower`, so `T2` is contravariant, because it appears only as a method parameter. For `T3`, `lower` is assignable to `upper`, so `T3` is covariant, because it appears only as a return type. Same class, three positions, three variances, none of them declared. The [[cs/pl/subtyping-variance-type-constraints|general rule]] falls out of the probe rather than being applied to it.

Type parameters implicitly allocated using [[cs/languages/Python/pep-695-type-parameter-syntax|the new syntax]] always have inferred variance. For code still using the constructor, `infer_variance=True` opts a single variable in, and a generic class that uses the traditional syntax may include combinations of type variables with explicit and inferred variance. The three keyword parameters are mutually exclusive, and if all three are false, the type variable is invariant.

Two limits are worth carrying. Inference is per class, so a class inheriting `list[T1]` is stuck with invariance in `T1` no matter what its own methods do. And inference cannot be overridden, so a class whose author wanted the stricter guarantee has to change the code rather than the annotation.

## What the runtime does with any of this

Nothing. `covariant=True` is a keyword argument stored on a `TypeVar` object. No allocation, no dispatch, no check changes because of it. The entire mechanism exists so that a checker running before the program does can reject a call that would have appended an `Employee` to a list of `Manager`. If the checker never runs, the whole apparatus is inert metadata, and the append succeeds.

## Related Notes

- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - variance as a general relation, independent of any language's spelling
- [[cs/pl/mutable-state-references-effects|Mutable State, References, and Effects]] - why a writable position is what forecloses covariance
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - the same decision made twice in one language, with different outcomes
- [[cs/languages/CSharp/variance-in-and-out|Variance in and out]] - declaration-site variance with real keywords and compiler enforcement
- [[cs/languages/Python/pep-695-type-parameter-syntax|PEP 695 Type Parameter Syntax]] - where inferred variance became the default
- [[cs/languages/Python/protocols-and-structural-subtyping|Protocols and Structural Subtyping]] - the context that motivated variance inference before it was generalized

## Sources

- "Generics," Specification for the Python type system. https://typing.readthedocs.io/en/latest/spec/generics.html . Supports the `Employee` and `Manager` list argument example and the append-mutation reason for rejecting it, the non-mutating caveat, invariance as the default for the old syntax with `list[Manager]` neither supertype nor subtype of `list[Employee]`, the `covariant=True` and `contravariant=True` keyword arguments with at most one permitted, the `_co` and `_contra` naming convention, read-only collections being covariant and mutable ones invariant, the generator being contravariant in its `send()` argument type, variance being meaningful only on a generic class with declared variance ignored on functions and aliases, the variance inference rationale and its reuse of protocol variance machinery, the upper and lower specialization procedure with dummy arguments and the assignability test producing covariant, contravariant, or invariant, the worked `ClassA[T1, T2, T3]` example and its three results, the constructor keyword parameters including `infer_variance` with at most one true and invariance when all are false, and new-syntax parameters always having inferred variance while traditional syntax may mix explicit and inferred.
- "PEP 484 - Type Hints," Python Enhancement Proposals. https://peps.python.org/pep-0484/ . Supports a covariant type variable used as a function parameter and return type being flagged as an error by a type checker.
- "PEP 695 - Type Parameter Syntax," Python Enhancement Proposals. https://peps.python.org/pep-0695/ . Supports the elimination of the need to specify variance, and the characterization of variance-encoding global type variable names as cumbersome.
