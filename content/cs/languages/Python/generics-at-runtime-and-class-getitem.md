---
title: Generics at Runtime and __class_getitem__
description: "list[int] is a real object built by a real method call at import time. What that call is, why the interpreter had to grow two dunders to make it cheap, and what get_type_hints will run for you."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-14
updated:
aliases: []
---

```python
>>> type(list[int])
<class 'types.GenericAlias'>
```

The subscript is not notation. It is an expression the interpreter evaluates, producing an object that occupies memory and took time to build. Every annotation in every module you import does this at import time.

> [!note] The idea
> Generic subscription resolves through the *ordinary* attribute-lookup machinery, with one deliberate fallback bolted on. Presented with `obj[x]`, the interpreter calls `type(obj).__getitem__` if it exists, and only if that fails and `obj` is a class does it try `obj.__class_getitem__(x)`. Since `type` does not define `__getitem__`, expressions such as `list[int]`, `dict[str, float]`, and `tuple[str, bytes]` all result in `__class_getitem__()` being called. The type system's most visible syntax is a miss in the normal lookup path, caught by a hook added to CPython specifically to make that miss cheap.

## Why the interpreter had to change

PEP 484 was initially designed in such a way that it would not introduce any changes to the core CPython interpreter. PEP 560 removed that restriction, and its rationale is a list of what the restriction had cost.

The performance charge is blunt: the `typing` module is one of the heaviest and slowest modules in the standard library even with all the optimizations made, mainly because subscripted generic types are class objects. Three consequences followed. Creation of generic classes was slow because `GenericMeta.__new__` is very slow. Method resolution orders for generic classes were very long, roughly twice what they needed to be, because the `collections.abc` inheritance chain was duplicated in `typing`. And instantiation of generic classes was slower than necessary.

There was a structural problem too. All generic types were instances of `GenericMeta`, so if a user uses a custom metaclass, then it is hard to make a corresponding class generic, which is particularly hard for library classes that a user does not control. The workaround was to mix in `GenericMeta` by hand, which is not always practical or even possible. This is a [[cs/pl/objects-classes-and-dispatch|metaclass conflict]] in its purest form: two libraries each needing to own the class of your class.

The PEP's list of hacks removed reads like an inventory of what a type system built entirely in library code has to do. Duplicated `__new__` logic because `__init__` is not called when `C[int]().__class__` is `C`. A `sys._getframe` hack the authors call particularly nasty since it looks like it cannot be removed without changes outside `typing`. Dangerous manipulation of private abstract-base-class caches to fix memory consumption that grows at least quadratically. A `_no_slots_copy` hack that cleans up the class dictionary on every subscription so that generics with `__slots__` work at all.

The justification for finally touching the interpreter was adoption: type hints and the `typing` module are extensively used by the community, and the backport of `typing` on PyPI had a million downloads a month at the time of writing.

## The two hooks

`__class_getitem__` is an exact analog of `__getitem__` with the exception that it is called on a class that defines it, not on its instances. It is automatically a class method and does not require the `classmethod` decorator, similar to `__init_subclass__`, and it is inherited like normal attributes. It should return a `GenericAlias` object if it is properly defined.

The fallback ordering matters: this method is used as a fallback, so if a metaclass defines `__getitem__`, then that will have the priority. The `enum` module is the documented case where a custom metaclass changes what subscripting a class does.

`__mro_entries__` handles the other half. If an object that is not a class object appears in the tuple of bases of a class definition, `__mro_entries__` is searched on it and called with the original tuple of bases, and the result must be a tuple that is unpacked in the base classes in place of this object. This step happens first in the process of creation of a class, before duplicate-base checks and MRO calculation. The original bases are stored as `__orig_bases__` in the class namespace, which is why introspecting a generic class can still recover `Generic[T]` after it has been erased from `__bases__`.

> [!warning] Do not use the subscript as a general-purpose operator
> The documentation is explicit that the purpose of `__class_getitem__()` is to allow runtime parameterization of standard-library generic classes in order to more easily apply type hints to these classes, and that using `__class_getitem__()` on any class for purposes other than type hinting is discouraged. Custom implementations on classes defined outside of the standard library may not be understood by third-party type checkers such as mypy. To write a generic class that both parameterizes at runtime and is understood statically, inherit from a standard library class that already implements it, or from `typing.Generic`, which has its own implementation.

## The import-time cost is real and the spec says to avoid it

Because subscription is evaluation, the typing specification recommends against putting subscripted classes in expressions: creating the subscripted class, for instance `Node[int]`, has a runtime cost, and using a type alias is also more readable. That is the whole recommendation, and it is a performance argument about [[cs/languages/Python/the-import-system|module import]], not about the checker. Annotations that name generics are built once per import, and a package with many annotated signatures pays for all of them before running a line of its own logic.

`Generic[T]` itself is only valid as a base class and is not a proper type, while user-defined generic types and built-in generic types like `list[T]` are valid both as types and as base classes.

## get_type_hints is where the annotations come back to life

`get_type_hints()` returns a dictionary of type hints for a function, method, module, class object, or other callable. It is often the same as `annotationlib.get_annotations()`, with specific differences. Forward references encoded as string literals or `ForwardRef` objects are handled by evaluating them in the given or inferred namespaces. `None` is replaced with `types.NoneType`. If `no_type_check` has been applied, an empty dictionary is returned. For a class, the function merges annotations from the base classes by traversing `__mro__`, and annotations on classes appearing earlier in the method resolution order always take precedence over those appearing later. It recursively replaces `Annotated[T, ...]`, `Required[T]`, `NotRequired[T]`, and `ReadOnly[T]` with `T`, unless `include_extras` is set.

Two operational warnings come with it. If any forward references are not resolvable, a `NameError` is raised, and this can happen with names imported under `if TYPE_CHECKING`. More generally, any kind of exception can be raised if an annotation contains invalid Python code. And calling `get_type_hints()` on an instance is not supported; you call it on the instance's class instead.

The one that deserves a pause is the security caution in the standard library documentation: this function may execute arbitrary code contained in annotations. An annotation is an expression that was stored rather than evaluated, and introspecting it is what finally runs it. Any tool that walks a third party's annotations, a serializer, a validator, a dependency injector, is evaluating attacker-influenced expressions in the target module's namespace, which is the same shape as [[cs/security/insecure-deserialization|deserializing untrusted data]]: inert-looking data that turns out to be a program.

## Related Notes

- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - the lookup protocol `__class_getitem__` slots into as a fallback
- [[cs/languages/Python/the-import-system|The Import System]] - where the cost of building every annotation is actually paid
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - metaclasses, and why owning the class of a class is a scarce resource
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - the failure mode of data that evaluates
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - erasure enforced by the compiler rather than left to a convention
- [[cs/languages/Python/pep-695-type-parameter-syntax|PEP 695 Type Parameter Syntax]] - the later round of interpreter changes for the same subsystem

## Sources

- "PEP 560 - Core support for typing module and generic types," Python Enhancement Proposals. https://peps.python.org/pep-0560/ . Supports PEP 484's original design not changing the core interpreter and the removal of that restriction, the PyPI `typing` backport download figure cited as motivation, the addition of `__class_getitem__` and `__mro_entries__`, the statement that `typing` is one of the heaviest and slowest modules in the standard library because subscripted generics are class objects, the three performance consequences involving `GenericMeta.__new__`, doubled method resolution orders from duplicating the `collections.abc` chain, and slower instantiation, the metaclass conflict for users with custom metaclasses and library classes plus the impractical mix-in workaround, the inventory of removed hacks including the `__init__` and `__class__` issue, the `sys._getframe` hack, quadratic memory growth handled through private abstract-base-class caches, and `_no_slots_copy`, the definition of `__class_getitem__` as an analog of `__getitem__` called on the class, its automatic class-method status without a decorator and normal inheritance, its use as a fallback with metaclass `__getitem__` taking priority, and the `__mro_entries__` mechanism including the tuple result unpacked into the bases, its position first in class creation, and the storage of the original bases as `__orig_bases__`.
- "The Python Language Reference: Data model," Python documentation. https://docs.python.org/3/reference/datamodel.html . Supports a class generally being parameterizable only if it defines `__class_getitem__()`, the method returning an object representing the specialization of a generic class, the statement that the purpose is runtime parameterization of standard-library generic classes for applying type hints, the advice to inherit from a standard library class or `typing.Generic` rather than writing a custom implementation, the warning that custom implementations outside the standard library may not be understood by checkers such as mypy, the discouragement of using it for anything other than type hinting, the subscription resolution order preferring `__getitem__` on the object's class and falling back to `__class_getitem__` when the object is a class, the fact that `type` does not define `__getitem__` so `list[int]`, `dict[str, float]`, and `tuple[str, bytes]` all call `__class_getitem__()`, the result being a `types.GenericAlias`, and the note that a custom metaclass defining `__getitem__` changes the behavior with `enum` as the example.
- "typing - Support for type hints," Python Standard Library. https://docs.python.org/3/library/typing.html . Supports `get_type_hints()` returning a dictionary of type hints for functions, methods, modules, class objects, and other callables and its relationship to `annotationlib.get_annotations()`, the evaluation of string and `ForwardRef` forward references in the given or inferred namespaces, the replacement of `None` with `types.NoneType`, the empty dictionary under `no_type_check`, the merging of base class annotations by traversing `__mro__` with earlier classes taking precedence, the recursive stripping of `Annotated`, `Required`, `NotRequired`, and `ReadOnly` unless `include_extras` is set, the `NameError` on unresolvable forward references with `if TYPE_CHECKING` imports as the example and the possibility of any exception from invalid annotation code, the lack of support for calling it on an instance, and the caution that the function may execute arbitrary code contained in annotations.
