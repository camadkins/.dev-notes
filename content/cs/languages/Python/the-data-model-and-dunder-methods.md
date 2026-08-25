---
title: The Data Model and Dunder Methods
description: "Python's object model is a set of protocols, not an inheritance tree. What x[i] and len(x) actually call, why special methods are looked up on the type, and how duck typing became a static discipline."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-12
updated:
aliases: []
---

Every piece of Python syntax that looks like a built-in feature is a method call in disguise. `x[i]`, `len(x)`, `a + b`, `for y in x`, `with r:`, `f(...)`, `repr(x)`, `x < y`: none of these check what type you have. Each one is defined as an invocation of a specially named method on the object's type. That is what "the data model" means, and it is the single design decision most of the rest of Python descends from.

> [!note] The idea
> Python's object model is protocol-based rather than hierarchy-based. Syntax does not test membership in a class tree; it looks for a named method and calls it. So participation in `for`, `in`, `+`, `[]`, `with`, and every other construct is opt-in per operation rather than inherited wholesale, and an object can be *partly* a sequence. The non-obvious price of that flexibility is that implicit special-method lookup deliberately skips the instance dictionary and even the metaclass's `__getattribute__`, which means the one place you cannot monkeypatch a dunder is on the individual object.

## Objects have identity, type, and value

The reference starts from the primitive: objects are Python's abstraction for data, and all data in a Python program is represented by objects or by relations between objects, including code itself. Every object has an identity, a type, and a value. The identity never changes once the object is created, `is` compares identities, and `id()` returns an integer representing it. (In CPython specifically, `id(x)` is the memory address where `x` is stored.)

The type is what carries the model. An object's type determines the operations that the object supports, and the reference's own example of such an operation is "does it have a length?" Type is unchangeable, like identity. Only the *value* may be mutable, and [[cs/pl/mutable-state-references-effects|mutability]] is itself a property of the type: numbers, strings, and tuples are immutable, while dictionaries and lists are mutable.

There is a subtlety the reference is careful about. An immutable container holding a reference to a mutable object can have its observable contents change when that inner object changes; the container is still immutable, because the collection of objects it contains cannot be changed. Immutability is a claim about the references, not about everything reachable through them. That distinction is the reason a tuple containing a list is unhashable in practice.

## Special methods are the operator table

A class can implement operations invoked by special syntax by defining methods with special names, and the reference names this plainly as Python's approach to [[cs/pl/objects-classes-and-dispatch|operator overloading]]. The worked example is the desugaring: if a class defines `__getitem__` and `x` is an instance, then `x[i]` is roughly equivalent to `type(x).__getitem__(x, i)`.

Note *where* the lookup happens in that expansion. It goes through `type(x)`, not through `x`. Except where mentioned, attempting an operation with no appropriate method defined raises an exception, typically `AttributeError` or `TypeError`.

There is also an explicit off switch. Setting a special method to `None` indicates that the corresponding operation is not available: a class that sets `__iter__` to `None` is not iterable, and calling `iter()` on its instances raises `TypeError` without falling back to `__getitem__`. That fallback is worth registering, because it means iterability has two independent routes and turning one off is a distinct act from never defining it.

The reference also gives design advice rather than mechanism, which is rare enough to be worth quoting the sense of: when implementing a class that emulates a built-in type, the emulation should only be implemented to the degree that it makes sense for the object being modelled. Some sequences work well with retrieval of individual elements while extracting a slice may not make sense, and the reference cites the `NodeList` interface in the W3C Document Object Model as a real example. Partial protocol implementation is intended, not a compromise.

## Why lookup skips the instance

This is the rule that surprises people who assume dunders are ordinary attributes. For custom classes, implicit invocations of special methods are only guaranteed to work correctly if defined on an object's *type*, not in the object's instance dictionary. So:

```python
class C: pass
c = C()
c.__len__ = lambda: 5
len(c)      # TypeError: object of type 'C' has no len()
```

The rationale in the reference is a correctness argument, not a performance one. A number of special methods such as `__hash__` and `__repr__` are implemented by all objects, including type objects. If implicit lookup used the conventional attribute lookup process, those methods would fail when invoked on a type object itself, because `int.__hash__()` would resolve to the unbound descriptor rather than to `int`'s own hash. The reference calls incorrectly invoking an unbound method this way "metaclass confusion," and the fix is exactly the bypass: `type(1).__hash__(1)` and `type(int).__hash__(int)` both give the right answer.

The bypass goes further than the instance dictionary. Implicit special method lookup generally also bypasses the `__getattribute__` method even of the object's metaclass. The reference states the trade directly: this speeds up the interpreter, at the cost of some flexibility in the handling of special methods, since the special method must be set on the class object itself in order to be consistently invoked.

This is why `__enter__` and `__exit__` in [[cs/languages/Python/context-managers-and-with|the with statement's expansion]] are documented as using implicit special method lookup, and why a per-instance override of any dunder quietly does nothing.

## Duck typing, and its static successor

The dynamic half of the model is duck typing, which the glossary defines as a programming style that does not look at an object's type to determine whether it has the right interface; instead the method or attribute is simply called or used. If it looks like a duck and quacks like a duck, it must be a duck. By emphasizing interfaces rather than specific types, well-designed code improves flexibility by allowing polymorphic substitution. Duck typing avoids tests using `type()` or `isinstance()`, typically employing `hasattr()` tests or the EAFP style instead, and can be complemented with abstract base classes.

The word "dunder" is itself in the glossary, as informal shorthand for "double underscore" when talking about a special method, `__init__` being pronounced "dunder init."

The interesting recent development is that duck typing acquired a static form. PEP 544, "Protocols: Structural subtyping (static duck typing)," observes that PEP 484 only specified the semantics of *nominal* subtyping, so the typing module's abstract base classes for common protocols like `Iterable` and `Sized` required a class to be explicitly marked as supporting them, which the PEP calls unpythonic and unlike idiomatic dynamically typed Python. The same problem afflicts user-defined ABCs: they must be explicitly subclassed or registered, which is particularly hard for library types whose type objects may be hidden deep in the implementation.

Protocol classes fix that by letting a class that simply defines `__len__` and `__iter__` be implicitly considered a subtype of `Sized` and `Iterable[int]` by static checkers. The PEP's own framing of why: structural subtyping is natural for Python programmers because it matches the runtime semantics of duck typing, where an object with certain properties is treated independently of its actual runtime class. It is also automatically extensible and works with additional, unrelated classes that happen to implement the required protocol. The deeper comparative treatment of nominal against structural typing lives in [[cs/pl/subtyping-variance-type-constraints|subtyping, variance, and type constraints]].

Two scoping notes from the PEP matter. Structural subtyping does not replace nominal subtyping; protocol classes complement normal classes and users choose per case. And at runtime protocol classes are simple ABCs, with no intent to provide sophisticated runtime instance and class checks, since any checks are performed only by third-party type checkers.

> [!example] The one-line summary of the whole model
> `x[i]` is roughly `type(x).__getitem__(x, i)`. Every clause of that expansion is load-bearing. `type(x)` rather than `x` is why instance-level dunders do not work. `__getitem__` rather than a `Sequence` base class is why any object can be subscriptable without inheriting from anything. And `(x, i)` as explicit arguments is why the same method also serves `x['key']`, `x[1:5]`, and `x[a, b]`, since the index is just an object and a slice or a tuple is an object too.

> [!warning] Protocols are opt-in per operation, so "is it a sequence?" has no clean answer
> Because participation is method-by-method, an object can define `__len__` without `__getitem__`, or `__iter__` without `__contains__`, and each construct only fails at the moment it needs the method it lacks. Duck typing buys flexibility by giving up a single yes-or-no answer to what an object *is*. The abstract base classes and PEP 544 protocols exist to recover a checkable answer where you need one; they do not change what the interpreter does.

## Related Notes

- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the general theory of method dispatch that Python's type-level lookup is one point in
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - nominal versus structural subtyping, the axis PEP 544 moves Python along
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - `__iter__` and `__next__` as the most-used protocol in the model
- [[cs/languages/Python/context-managers-and-with|Context Managers and the with Statement]] - `__enter__`/`__exit__`, and implicit special method lookup in the wild
- [[cs/languages/Python/decorators|Decorators in Python]] - `__call__`, which is why "callable" is a protocol rather than a type
- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - the other way languages let a type opt into an operation after the fact

## Sources

- "3. Data model," The Python Language Reference. https://docs.python.org/3/reference/datamodel.html . Supports objects as Python's abstraction for data with identity, type, and value; identity being fixed with `is` and `id()` and the CPython memory-address detail; type determining supported operations and being unchangeable; the mutability discussion including the immutable-container-of-mutable-object subtlety; special methods as Python's operator overloading with the `x[i]` to `type(x).__getitem__(x, i)` desugaring and the `AttributeError`/`TypeError` default; setting a special method to `None` disabling the operation without `__getitem__` fallback; the partial-emulation advice and the W3C `NodeList` example; and the whole of special method lookup including the `c.__len__ = lambda: 5` failure, the `__hash__`/`__repr__` metaclass-confusion rationale, the `__getattribute__` bypass, and the stated speed-versus-flexibility trade.
- "Glossary," Python 3 documentation. https://docs.python.org/3/glossary.html . Supports the definition of duck-typing including the duck aphorism, the emphasis on interfaces over specific types for polymorphic substitution, the avoidance of `type()`/`isinstance()` in favour of `hasattr()` or EAFP, the complementarity with abstract base classes, and the definition of "dunder."
- "PEP 544 - Protocols: Structural subtyping (static duck typing)," Python Enhancement Proposals. https://peps.python.org/pep-0544/ . Supports PEP 484 specifying only nominal subtyping, the complaint that typing ABCs such as `Iterable` and `Sized` require explicit marking and that user-defined ABCs must be subclassed or registered, the `Bucket` example being implicitly a subtype of `Sized` and `Iterable[int]` under structural subtyping, structural subtyping matching the runtime semantics of duck typing and being automatically extensible to unrelated classes, protocols complementing rather than replacing nominal subtyping, and protocols being simple ABCs at runtime with checks performed only by third-party type checkers.
