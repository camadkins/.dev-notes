---
title: Runtime-Checkable Protocols and Their Limits
description: "isinstance against a Protocol answers a different question than the checker does. It tests for the presence of names, never their signatures, and the gap between those two is where the bug lives."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-09
updated:
aliases:
  - runtime_checkable
  - isinstance Protocol
  - Data Protocol
---

`@runtime_checkable` looks like the bridge between the checker's world and the interpreter's. It is not a bridge. It is a second, weaker test that happens to share a name with the first.

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Closable(Protocol):
    def close(self): ...

assert isinstance(open('/some/file'), Closable)
```

That assertion passes. So does an `issubclass` check of `ssl.SSLObject` against `Callable`, and the standard library documents exactly why that is a problem.

> [!note] The idea
> `runtime_checkable` will check only the presence of the required methods or attributes, not their type signatures or types. Everything else in this note follows from that sentence. The static check verifies a *shape*; the runtime check verifies a *vocabulary*. They agree often enough to be mistaken for each other and diverge exactly where the interesting bugs are, which is why the feature is opt-in rather than the default behavior of every [[cs/languages/Python/protocols-and-structural-subtyping|Protocol]].

## What isinstance is actually asking

The typing documentation calls the result a simple-minded structural check, very similar to the one-trick ponies in `collections.abc` such as `Iterable`. PEP 544 gives the operational equivalent: the most type checkers can do is to treat `isinstance(obj, Iterator)` roughly as a simpler way to write `hasattr(x, '__iter__')` and `hasattr(x, '__next__')`. Names present, question answered.

The documented failure case is worth memorizing because it is not contrived. `ssl.SSLObject` is a class, therefore it passes an `issubclass()` check against `Callable`. Every class is callable, since calling it constructs an instance. But the `ssl.SSLObject.__init__` method exists only to raise a `TypeError` with a more informative message, therefore making it impossible to call, or instantiate, `ssl.SSLObject`. The runtime check says yes; the object it approved cannot do the thing it was approved for. A static checker reading the annotated `__init__` would have said no.

## Data protocols, non-data protocols, and what each check may see

PEP 544 draws a line the runtime cannot cross. A protocol is called a non-data protocol if it only contains methods as members, `Sized` and `Iterator` among them. A protocol that contains at least one non-method member, such as `x: int`, is called a data protocol.

The consequence is asymmetric. `isinstance()` can be used with both data and non-data protocols, while `issubclass()` can be used only with non-data protocols. The reason is stated plainly: some data attributes can be set on an instance in the constructor and this information is not always available on the class object. An instance can be interrogated. A class cannot be asked what its instances will happen to have after `__init__` runs. That asymmetry is a fact about [[cs/pl/objects-classes-and-dispatch|where Python keeps state]], not a limitation of the typing module.

## Why it had to be opt-in

The decorator exists because instance checks are not 100% reliable statically, and that unreliability is why this behavior is opt-in. A protocol can be used as a second argument in `isinstance()` and `issubclass()` only if it is explicitly opted in by the `runtime_checkable` decorator.

Two reasons are given, and the first is the sharper one: protocol checks are not type safe in case of dynamically set attributes, and type checkers can only prove that an `isinstance()` check is safe for a given class, not for all its subclasses. An object that satisfies a data protocol at the moment of the check may not satisfy it afterward, because the attribute the check found was set by ordinary assignment and can be removed or replaced by ordinary assignment. The check and the use are two separate moments with mutable state between them, which is the shape of a [[cs/security/race-conditions-and-toctou|time-of-check to time-of-use]] problem even in single-threaded code.

The specification also guards against a subtler confusion. A type `X` is unsafely overlapping with a protocol `P` if `X` is not a subtype of `P`, but it is a subtype of the type-erased version of `P` where all members have type `Any`. If at least one element of a union unsafely overlaps with a protocol, then the whole union is unsafely overlapping. Type checkers should reject an `isinstance()` or `issubclass()` call if there is an unsafe overlap between the type of the first argument and the protocol. That is the checker refusing to narrow on evidence it knows to be insufficient, and it is the honest response to the gap this whole note is about. Narrowing from non-union types is intentionally unspecified, since a precise specification would require intersection types, so [[cs/languages/Python/type-narrowing-and-typeguard|narrowing behavior]] after a protocol check is checker-dependent by design.

> [!warning] The runtime check does not restore soundness
> A passing `isinstance` against a runtime-checkable protocol licenses far less than the annotation it appears to confirm. It says the names exist. It says nothing about arity, parameter types, return types, or whether calling the member raises. Code that treats the check as proof of the protocol's contract has substituted a necessary condition for a sufficient one, and [[cs/pl/type-soundness-progress-preservation|the soundness argument]] the annotation implies is not one the runtime ever made.

## The costs and the moving parts

Two practical notes from the standard library documentation. An `isinstance()` check against a runtime-checkable protocol can be surprisingly slow compared to an `isinstance()` check against a non-protocol class, and the recommendation is to consider alternative idioms such as `hasattr()` calls for structural checks in performance-sensitive code. When the documented fast path for a feature is the thing the feature replaced, the feature is buying clarity rather than capability.

The semantics have also moved. The decorator was added in version 3.8. In 3.12 the internal implementation of `isinstance()` checks against runtime-checkable protocols began using `inspect.getattr_static()` to look up attributes, where previously `hasattr()` was used. As a result, some objects which used to be considered instances of a runtime-checkable protocol may no longer be considered instances of that protocol on Python 3.12 and later, and vice versa, though most users are unlikely to be affected. Also in 3.12, the members of a runtime-checkable protocol are now considered frozen at runtime as soon as the class has been created, so monkey-patching attributes onto a runtime-checkable protocol will still work but will have no impact on `isinstance()` checks.

Applying the decorator to a non-protocol class raises `TypeError`, which is the one place the runtime enforces anything about protocols at all.

## Related Notes

- [[cs/languages/Python/protocols-and-structural-subtyping|Protocols and Structural Subtyping]] - the static check this one only approximates
- [[cs/languages/Python/type-narrowing-and-typeguard|Type Narrowing and TypeGuard]] - what a checker does with an `isinstance` result, and where it declines to
- [[cs/security/race-conditions-and-toctou|Race Conditions and TOCTOU]] - why a check against mutable attributes expires the moment it returns
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress and Preservation]] - the guarantee a presence test cannot supply
- [[cs/languages/Python/the-descriptor-protocol|The Descriptor Protocol]] - what an attribute lookup can involve, and why changing the lookup strategy changed results
- [[cs/languages/Go/the-empty-interface-any-and-type-assertions|The Empty Interface, any, and Type Assertions]] - a runtime type test that does carry the full static guarantee

## Sources

- "typing - Support for type hints," Python Standard Library. https://docs.python.org/3/library/typing.html . Supports `runtime_checkable` marking a protocol class as a runtime protocol usable with `isinstance()` and `issubclass()`, the simple-minded structural check comparison to one-trick ponies in `collections.abc`, the `Closable` example asserting on an open file, the decorator raising `TypeError` on a non-protocol class, the rule that only presence of methods or attributes is checked rather than signatures or types, the `ssl.SSLObject` case passing `issubclass` against `Callable` while its `__init__` raises `TypeError` and makes instantiation impossible, the warning that such checks can be surprisingly slow with `hasattr()` suggested for performance-sensitive code, the 3.8 addition, and the 3.12 changes to `inspect.getattr_static()` lookup and frozen protocol members with monkey-patching having no effect on checks.
- "PEP 544 - Protocols: Structural subtyping (static duck typing)," Python Enhancement Proposals. https://peps.python.org/pep-0544/ . Supports the statement that instance checks are not 100% reliable statically and that the behavior is therefore opt-in, the treatment of `isinstance(obj, Iterator)` as a simpler way to write two `hasattr` calls, the data and non-data protocol definitions, the opt-in requirement via the `runtime_checkable` decorator, the type-safety rationale about dynamically set attributes and checkers only proving safety for a given class rather than all subclasses, `isinstance()` working with both kinds while `issubclass()` works only with non-data protocols and the constructor-set-attribute reason, the unsafe overlap definition including the union rule, the instruction that checkers reject calls with an unsafe overlap, and narrowing from non-union types being intentionally unspecified because a precise specification would require intersection types.
