---
title: Dataclasses and attrs-Style Classes
description: "A decorator that reads annotations and writes methods, the field() options that actually matter, and why a mutable default is a ValueError instead of a bug."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-14
updated:
aliases: []
---

The `dataclasses` module exists because a specific class shape kept being reinvented. PEP 557's rationale lists the prior art: `collections.namedtuple` in the standard library, `typing.NamedTuple` in the standard library, the popular `attrs` project, George Sakkis' `recordType` recipe, and many online recipes, packages, and questions. David Beazley used a form of data classes as the motivating example in a PyCon 2013 [[cs/languages/Python/metaclasses-and-class-creation|metaclass]] talk. All of them solve the same problem, classes which exist primarily to store values which are accessible by attribute lookup, and all of them solve it with different machinery.

PEP 557's own one-line summary is that although they use a very different mechanism, Data Classes can be thought of as "mutable namedtuples with defaults."

> [!note] The idea
> `@dataclass` is not a base class, a metaclass, or a new kind of object. It is a code generator that reads the class body's annotations and writes ordinary methods onto an ordinary class. The decorator returns the same class that it is called on; no new class is created. That design choice is the whole point: no base classes or metaclasses are used by Data Classes, so users are free to use inheritance and metaclasses without any interference, and the decorated classes are truly normal Python classes. Everything surprising about dataclasses, including the mutable-default `ValueError`, follows from generated code being subject to the same rules as code you would have typed yourself.

## What the decorator reads and what it writes

The `@dataclass` decorator examines the class to find fields, and a field is defined as a class variable that has a type annotation. The member variables to use in the generated methods are defined using PEP 526 type annotations. The critical qualifier: with two exceptions, nothing in `@dataclass` examines the type specified in the variable annotation. The annotation is a marker saying "this name is a field," not a constraint. That fits the general position that [[cs/languages/Python/type-hints-and-gradual-typing|annotations are a side channel]] the runtime records and does not check.

The order of the fields in all of the generated methods is the order in which they appear in the class definition. So this

```python
@dataclass
class InventoryItem:
    name: str
    unit_price: float
    quantity_on_hand: int = 0
```

adds, among other things, an `__init__()` that looks like `def __init__(self, name: str, unit_price: float, quantity_on_hand: int = 0)` assigning each parameter to the matching attribute.

The decorator's signature spells out every switch: `@dataclasses.dataclass(*, init=True, repr=True, eq=True, order=False, unsafe_hash=False, frozen=False, match_args=True, kw_only=False, slots=False, weakref_slot=False)`. Bare `@dataclass`, `@dataclass()`, and the fully spelled-out defaults are equivalent.

The generated methods and their conditions are worth reading rather than assuming. `init` generates `__init__()`, and if the class already defines `__init__()` this parameter is ignored. `repr` generates a `__repr__()` whose string has the class name and the name and repr of each field, in definition order, giving output like `InventoryItem(name='widget', unit_price=3.0, quantity_on_hand=10)`. `eq` generates an `__eq__()` that compares the class by comparing each field in order, and both instances in the comparison must be of the identical type. `order`, off by default, generates `__lt__()`, `__le__()`, `__gt__()`, and `__ge__()`, which compare the class as if it were a tuple of its fields, in order.

The two collision behaviors differ, and the difference is easy to get wrong. For `init`, `repr`, and `eq`, an existing method means the parameter is quietly ignored. For ordering, if the class already defines any of `__lt__()`, `__le__()`, `__gt__()`, or `__ge__()`, then `TypeError` is raised. Setting `order` true with `eq` false raises `ValueError`.

One change worth knowing if you compare floats. Since Python 3.13 the generated `__eq__` compares each field individually, for example `self.a == other.a and self.b == other.b`, rather than comparing tuples of fields as in previous versions. The documentation notes this makes comparison faster but may alter results in cases where attributes compare equal by identity but not by value, such as `float('nan')`.

## Hashability is derived, not chosen

The `__hash__` rules are the densest part of the module and they follow one principle: having a `__hash__()` implies that instances of the class are immutable. By default `@dataclass` will not implicitly add a `__hash__()` method unless it is safe to do so, and it will neither add nor change an existing explicitly defined one.

The rules, in full. If `eq` and `frozen` are both true, `@dataclass` generates a `__hash__()` for you. If `eq` is true and `frozen` is false, `__hash__()` is set to `None`, marking it unhashable, which it is, since it is mutable. If `eq` is false, `__hash__()` is left untouched, meaning the superclass method is used, and if the superclass is `object` this means it falls back to id-based hashing.

`unsafe_hash=True` forces a `__hash__()` even though it may not be safe to do so. The documented use case is narrow: this might be the case if your class is logically immutable but can still be mutated, and it is a specialized use case that should be considered carefully. You cannot both have an explicit `__hash__()` method and set `unsafe_hash=True`; that raises `TypeError`.

`frozen=True` means assigning to fields will generate an exception, emulating read-only frozen instances. If `__setattr__()` or `__delattr__()` is defined in the class and `frozen` is true, `TypeError` is raised.

## field() is where per-field control lives

Most fields need nothing beyond an annotation and maybe a plain default, and `TypeError` will be raised if a field without a default value follows a field with a default value, whether that happens in one class or through [[cs/pl/objects-classes-and-dispatch|inheritance]]. When you need more, you replace the default value with a call to `field()`:

`dataclasses.field(*, default=MISSING, default_factory=MISSING, init=True, repr=True, hash=None, compare=True, metadata=None, kw_only=MISSING, doc=None)`.

`MISSING` is a sentinel object used to detect if some parameters are provided by the user, used because `None` is a valid value for some parameters with a distinct meaning, and no code should directly use it.

`default_factory` must be a zero-argument callable that will be called when a default value is needed for this field, and it is an error to specify both `default` and `default_factory`. `init=False` drops the field from the generated `__init__()`. `repr=False` drops it from the generated repr. `compare=True` (the default) includes the field in the generated equality and comparison methods.

`hash` is subtle. It is a bool or `None`; if `None`, the default, it uses the value of `compare`, which would normally be the expected behavior since a field should be included in the hash if it is used for comparisons. Setting it to anything other than `None` is discouraged. The one motivating case the docs give: `hash=False` with `compare=True` when a field is expensive to compute a hash value for, that field is needed for equality testing, and other fields contribute to the type's hash. Even if a field is excluded from the hash, it will still be used for comparisons.

`metadata` is a mapping wrapped in `MappingProxyType()` to make it read-only and exposed on the `Field` object. It is not used at all by Data Classes and is provided as a third-party extension mechanism, so multiple third-parties can each have their own key as a namespace. That is the documented hook for validation and serialization libraries built on top.

There is a class-attribute side effect worth knowing. If a field's default is specified by a `field()` call, the class attribute for this field will be replaced by the specified default value, and if `default` is not provided, the class attribute will be deleted. The intent is that after the decorator runs, the class attributes all contain the default values, just as if the default value itself were specified.

## The mutable-default trap, and why it is not a special case

The documentation is careful to frame this as ordinary Python semantics leaking through. Because dataclasses just use normal Python class creation, they share the class-variable-sharing behavior of a hand-written class. Given a hypothetical

```python
@dataclass
class D:
    x: list = []   # This code raises ValueError
```

the generated code would be similar to a class with `x = []` at class scope and `def __init__(self, x=x)`, so `assert D().x is D().x` holds. Two instances that do not specify a value for `x` would [[cs/pl/mutable-state-references-effects|share the same copy]].

There is no general way for Data Classes to detect this condition. So the module takes a heuristic: the `@dataclass` decorator will raise a `ValueError` if it detects an unhashable default parameter, on the assumption that if a value is unhashable, it is mutable. The docs call this what it is, a partial solution, but one that does protect against many common errors. Since Python 3.11 the check is exactly that, unhashable objects are not allowed as default values, replacing the earlier approach of looking for and disallowing objects of type `list`, `dict`, or `set`.

The fix is `default_factory`, and its correctness is stated as an assertion: with `x: list = field(default_factory=list)`, `assert D().x is not D().x`.

> [!warning] The heuristic has a hole on both sides
> Unhashability approximates mutability; it does not equal it. A mutable object that defines `__hash__` passes the check and is silently shared across instances, which is exactly the original bug with none of the guardrail. And an immutable-but-unhashable value is rejected for no real reason. Reach for `default_factory` by habit for anything that is not a number, string, `None`, or frozen value, rather than trusting the decorator to catch you.

## Why the standard library reimplemented instead of adopting attrs

PEP 557 answers this directly and generously. Its acknowledgements state that a special mention must be made about the `attrs` project, that it was a true inspiration for this PEP, and that the author respects the design decisions they made. The reasons for a separate implementation are two. First, `attrs` moves faster than could be accommodated if it were moved into the standard library. Second, `attrs` supports additional features not being proposed, specifically validators, converters, and metadata, and Data Classes makes a tradeoff to achieve simplicity by not implementing these features.

A second design constraint shaped the result. One main design goal of Data Classes is to support static type checkers; the use of PEP 526 syntax is one example, but so is the design of the `fields()` function and the decorator itself. Due to their very dynamic nature, some of the prior-art libraries are difficult to use with static type checkers. The PEP is also explicit that Data Classes are not, and are not intended to be, a replacement for those alternatives.

So the practical read is a capability ladder rather than a competition. `@dataclass` when you want generated `__init__`, `__repr__`, and comparison on a plain class with zero dependencies. A third-party library when you need validators and converters at construction time. The `metadata` parameter is the seam the standard library deliberately left open for the second case.

## Related Notes

- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - the `__init__`, `__repr__`, `__eq__`, and `__hash__` contracts the decorator writes implementations of
- [[cs/languages/Python/decorators|Decorators in Python]] - why a decorator can legally return the same class it was handed
- [[cs/languages/Python/type-hints-and-gradual-typing|Type Hints and Gradual Typing]] - annotations as markers the runtime records but does not check
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the record shape dataclasses give Python, and `__match_args__`
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - what "no metaclass involved" buys in a language with metaclasses
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - where `metadata` and third-party converters usually get used

## Sources

- "dataclasses - Data Classes," Python Standard Library. https://docs.python.org/3/library/dataclasses.html . Supports the module adding generated special methods, PEP 526 annotations defining the fields, the `InventoryItem` example and its generated `__init__`, the full `@dataclass` signature and equivalence of the three bare forms, the field definition as an annotated class variable and the "with two exceptions, nothing examines the type" rule, definition-order field ordering, the decorator returning the same class, the per-parameter behavior of `init`/`repr`/`eq`/`order` including the ignored-versus-`TypeError` collision rules and the `order`-with-`eq`-false `ValueError`, the 3.13 per-field `__eq__` change and its `float('nan')` caveat, the complete implicit `__hash__` rules and `unsafe_hash` guidance, `frozen` semantics, the `field()` signature and every parameter described (`default_factory`, `init`, `repr`, `hash` with the expensive-hash rationale, `compare`, `metadata` as a read-only third-party extension mechanism, `kw_only`, `doc`), the `MISSING` sentinel, the class-attribute replacement or deletion behavior, the `TypeError` for a defaultless field after a defaulted one, and the entire mutable-default discussion including the shared-copy demonstration, the `ValueError` on unhashable defaults, the 3.11 change from type-based to hashability-based detection, and the `default_factory` fix with its `is not` assertion.
- "PEP 557 - Data Classes," Python Enhancement Proposals. https://peps.python.org/pep-0557/ . Supports the "mutable namedtuples with defaults" framing, the rationale's list of prior art (`collections.namedtuple`, `typing.NamedTuple`, `attrs`, Sakkis' `recordType`, online recipes, and Beazley's PyCon 2013 metaclass talk), the statement that no base classes or metaclasses are used and decorated classes are truly normal Python classes, the design goal of supporting static type checkers and the note that dynamic prior-art libraries are hard to use with them, the statement that Data Classes are not intended as a replacement, and the section answering why attrs itself was not adopted, citing release velocity and the deliberate omission of validators, converters, and metadata, plus the acknowledgement of attrs as a true inspiration.
