---
title: The Descriptor Protocol
description: "How __get__, __set__, and __set_name__ let a class attribute intercept its own lookup, and why methods, properties, classmethod, staticmethod, and __slots__ are all the same mechanism wearing different clothes."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-02
updated:
aliases: []
---

Ask why `self` appears as the first parameter of a Python method and the usual answer is "because Python is explicit about it." That is a style claim, not a mechanism. The mechanism is that a function stored in a class body is an object with a `__get__` method, and the dot operator calls it. `d.f` does not fetch a function and hand you a closure over `d`; it finds the function in the class dictionary, notices that it can intercept its own retrieval, and lets it return a bound method instead. Nothing about method binding is built into the language grammar. It is a protocol, and you can implement it yourself.

> [!note] The idea
> Attribute access in Python is not a lookup, it is a negotiation. The Python documentation makes the inversion explicit: traditionally, the calling class controls what happens during lookup, and descriptors invert that relationship and allow the data being looked-up to have a say in the matter. That single hook is load-bearing for a startling fraction of the language. Methods, `property`, `classmethod`, `staticmethod`, `functools.cached_property`, `super()`, and the storage slots created by `__slots__` are not separate features with separate implementations. They are descriptors, and the entire mechanism lives inside `object.__getattribute__`.

## The protocol is three methods and a naming hook

A descriptor is any object defining `__get__`, `__set__`, or `__delete__`. Defining any of them is enough. The signatures are `descr.__get__(self, obj, type=None)`, `descr.__set__(self, obj, value)`, and `descr.__delete__(self, obj)`, and as the HOWTO puts it, that is all there is to it: define any of these methods and an object is considered a descriptor and can override default behavior upon being looked up as an attribute.

Two constraints matter more than they first appear. Descriptors only work when used as class variables, and when put in instances they have no effect. And the invocation is tied to the dot operator specifically: if a descriptor is accessed indirectly with `vars(some_class)[descriptor_name]`, the descriptor instance is returned without invoking it. That asymmetry is why introspection tools reach into `__dict__` rather than using attribute access, and why a debugger showing you `SomeClass.__dict__['x']` shows a `property` object where `instance.x` shows a number.

The fourth method, `__set_name__`, solves an ergonomic problem that comes up the moment you write your own descriptor. The descriptor object is created by the expression on the right of the assignment, so it has no idea which name it was bound to. Python fixes this at class creation: when a new class is created, the `type` metaclass scans the dictionary of the new class, and if any of the entries are descriptors and if they define `__set_name__`, that method is called with two arguments. The owner is the class where the descriptor is used, and the name is the class variable the descriptor was assigned to. This is what lets a validator descriptor derive `_age` from being assigned to `age` without you repeating the string.

> [!warning] The notification happens once
> Because the update logic lives in `type.__new__`, notifications only take place at the time of class creation. If descriptors are added to the class afterwards, `__set_name__` will need to be called manually. Monkey-patching a descriptor onto an existing class produces an object that never learned its own name, and the failure is silent until something reads the attribute it was supposed to compute.

## Data versus non-data, and why the distinction decides the winner

The split that trips people up is the one between data and non-data descriptors. If an object defines `__set__` or `__delete__` it is a data descriptor; descriptors that only define `__get__` are non-data descriptors. The difference is not descriptive, it is a priority rule.

Instance lookup scans through a chain of namespaces giving data descriptors the highest priority, followed by instance variables, then non-data descriptors, then class variables, and finally `__getattr__` if it is provided. Collapsed to the two rules that matter: data descriptors always override instance dictionaries, and non-data descriptors may be overridden by instance dictionaries.

This is not a curiosity. It is the entire reason a `property` cannot be shadowed by an instance attribute while a method can. Assign `obj.some_property = 3` and the property's `__set__` runs (and typically raises, if there is no setter). Assign `obj.some_method = lambda: 3` and the instance dictionary wins, permanently, for that object. A read-only data descriptor is built by defining both `__get__` and `__set__` with the `__set__` raising `AttributeError` when called; defining the `__set__` method with an exception raising placeholder is enough to make it a data descriptor. The exception is not the point. Its presence in the class is.

The whole search is a chain of dictionary lookups, and the cost model is the one from [[cs/dsa/hash-tables|hash tables]]: each step in the chain is an average constant-time probe, and the chain length is bounded by the [[cs/languages/Python/the-mro-and-c3-linearization|method resolution order]] of the type. Attribute access feels cheap because it is several hash lookups, not because it is free, which is exactly why the specializing interpreter spends effort caching the result of that search.

## Everything is built out of it

Functions include a `__get__` method for binding methods during attribute access, which means that functions are non-data descriptors that return bound methods during dotted lookup from an instance. The transformation is mechanical: the non-data descriptor turns an `obj.f(*args)` call into `f(obj, *args)`, while calling `cls.f(*args)` becomes `f(*args)`. Access the function through the class dictionary and `__get__` is never invoked, so you get the plain function object back.

From there the variants write themselves. `staticmethod` is a descriptor whose `__get__` returns the underlying function unchanged, refusing to bind anything. `classmethod` is a descriptor whose `__get__` binds the class rather than the instance. `property` is a data descriptor built from getter, setter, and deleter functions. The documentation is direct about the scope of this: descriptors are a powerful, general purpose protocol, and they are the mechanism behind properties, methods, static methods, class methods, and `super()`.

Even `__slots__` is descriptors. Slot storage is a C-level array, and each slot name becomes a member descriptor holding an offset into it, with `__get__` and `__set__` reading and writing that offset. That is why a slotted attribute raises `AttributeError` when unset rather than returning a default, and it is the connection to [[cs/languages/Python/slots-and-instance-layout|instance layout]]: removing the per-instance dictionary does not remove attribute access, it replaces one descriptor implementation with another.

> [!example] Where the machinery actually lives
> The logic for a dotted lookup is in `object.__getattribute__`, with `type.__getattribute__` handling class-level access and `super()` carrying its own variant. The consequence is a footgun worth knowing: overriding `__getattribute__` prevents automatic descriptor calls because all the descriptor logic is in that method. Write a class that defines `__getattribute__` and forgets to delegate to `object.__getattribute__`, and every property, every method, and every slot on that class stops working at once. Note also that there is no `__getattr__` hook inside `__getattribute__`; the fallback is arranged by the calling machinery, which is why calling `__getattribute__` directly bypasses `__getattr__` entirely.

The descriptor protocol is Python's answer to a question every object system has to answer: who decides what a field access means. C++ answers it at compile time with member offsets and [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|vtable slots]] fixed by the layout. Python answers it at every access, dynamically, by asking the stored object whether it wants to intervene. That is slower per access and vastly more flexible, and it is the same tradeoff visible everywhere in [[cs/pl/objects-classes-and-dispatch|how languages implement dispatch]]. The unusual part is that Python exposes the hook rather than reserving it, so an ORM field, a lazily computed property, and a type-validating attribute are all ordinary user code using the same protocol the interpreter uses for methods.

## Related Notes

- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the general problem descriptors solve, and how other object systems answer it
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - the wider protocol surface that descriptors are one member of
- [[cs/languages/Python/the-mro-and-c3-linearization|The MRO and C3 Linearization]] - the class chain that attribute lookup walks
- [[cs/languages/Python/slots-and-instance-layout|Slots and Instance Layout]] - member descriptors, and what replaces the instance dictionary
- [[cs/dsa/hash-tables|Hash Tables]] - the cost model behind every step of the lookup chain
- [[cs/languages/Python/decorators|Decorators in Python]] - the syntax that applies `property`, `classmethod`, and `staticmethod`

## Sources

- "Descriptor Guide," Python Documentation. https://docs.python.org/3/howto/descriptor.html . Supports the definition of a descriptor as any object defining `__get__`, `__set__`, or `__delete__`; the class-variable-only restriction and the non-invocation through `vars()`; the inversion of control framing; `__set_name__` being called by the `type` metaclass at class creation with owner and name, and only at class creation; the data versus non-data split and the precedence rules; the read-only data descriptor recipe; the instance lookup namespace chain; functions as non-data descriptors returning bound methods and the call transformations; the list of features implemented as descriptors including `super()`; member descriptors emulating `__slots__`; and the warning that overriding `__getattribute__` disables descriptor invocation.
