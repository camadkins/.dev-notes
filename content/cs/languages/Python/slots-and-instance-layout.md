---
title: Slots and Instance Layout
description: "What an ordinary Python instance costs, how __slots__ trades a per-instance dictionary for a fixed array of descriptors, and the inheritance rules that quietly give the dictionary back."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-08-11
updated:
aliases:
  - __slots__
  - Python Instance Layout
---

The default Python object is a hash table with a type pointer attached. Set `self.x = 1` in `__init__` and you have not written to a field at a known offset; you have inserted a string key into a per-instance dictionary. Every instance of that class carries its own dictionary, and every one of those dictionaries stores the same handful of keys. For one object this is a rounding error. For a million rows read out of a database it is the dominant cost of the program.

`__slots__` is the opt-out. As the reference describes it, `__slots__` allows us to explicitly declare data members, like properties, and deny the creation of `__dict__` and `__weakref__`, and the space saved over using `__dict__` can be significant, with attribute lookup speed significantly improved as well.

> [!note] The idea
> `__slots__` does not add a feature, it removes one. The per-instance dictionary is what makes a Python object dynamically extensible, and giving it up converts the instance from a variable-size mapping into a fixed-size struct with a known layout. Both directions of the tradeoff are real: what you gain is memory and locality, and what you lose is the ability to add an attribute nobody declared. The mechanism is not new machinery either. `__slots__` are implemented at the class level by creating descriptors for each variable name, so slotted attributes go through [[cs/languages/Python/the-descriptor-protocol|the same protocol]] that methods and properties use.

## What an instance costs

An ordinary instance is a `PyObject` header plus a pointer to a dictionary. That dictionary is a real [[cs/dsa/hash-tables|hash table]] with capacity larger than its occupancy, and it stores hashed string keys pointing at values. The header is unavoidable, since [[cs/languages/Python/cpython-object-model-and-reference-counting|every Python object carries a refcount and a type pointer]]. The dictionary is the part that scales badly across many instances of the same shape, because the key strings are shared but the table structure is not.

The slotted layout replaces that indirection. `__slots__` reserves space for the declared variables and prevents the automatic creation of `__dict__` and `__weakref__` for each instance. The values sit in a contiguous array in the object itself, and each name resolves to a member descriptor holding an offset into that array. Attribute access becomes a bounds-free load at a fixed displacement rather than a hash, a probe, and a comparison.

The speed claim in the docs follows from the same change. A hash lookup is a handful of operations plus a data-dependent memory access; a slot read is one. The [[cs/systems/memory-hierarchy-and-caching|locality]] difference is larger than the instruction difference, because slot values live inside the object next to the header rather than in a separately allocated table one pointer hop away.

## What you give up, precisely

Without a `__dict__` variable, instances cannot be assigned new variables not listed in the `__slots__` definition, and attempts to assign to an unlisted variable name raise `AttributeError`. That is the intended behavior, and it doubles as a typo check: `self.usrename = x` fails immediately instead of creating a field nobody reads.

The second loss is easy to miss. Without a `__weakref__` variable for each instance, classes defining `__slots__` do not support weak references to their instances. Any code that puts objects in a `WeakValueDictionary`, or uses weak references for caches and observer registries, breaks on a slotted class until `'__weakref__'` is added to the declaration. Both losses are recoverable by naming `'__dict__'` or `'__weakref__'` in the sequence, which restores the corresponding feature at its usual cost.

There is a third, quieter constraint. Because slots are descriptors on the class, class attributes cannot be used to set default values for instance variables defined by `__slots__`, since the class attribute would overwrite the descriptor assignment. The familiar pattern of writing `x = 0` in the class body as a default is not merely discouraged here, it destroys the slot.

## Inheritance is where it goes wrong

The rules that surprise people are all about subclassing, and each one has a sharp edge.

When inheriting from a class without `__slots__`, the `__dict__` and `__weakref__` attributes of the instances will always be accessible. Inherit from anything that lacks slots and every saving is gone. This is why one non-slotted base class in a hierarchy, or a mixin someone added for logging, silently converts an optimized leaf class back into a dictionary-carrying one.

The same trap applies downward. `__slots__` declared in parents are available in child classes, but instances of a child subclass will get a `__dict__` and `__weakref__` unless the subclass also defines `__slots__`, which should only contain the names of any additional slots. Forget an empty `__slots__ = ()` on a subclass and the subclass reintroduces the dictionary for every instance while still paying for the parent's slot array.

> [!warning] Redeclaring a parent's slot is undefined
> If a class defines a slot also defined in a base class, the instance variable defined by the base class slot becomes inaccessible except by retrieving its descriptor directly from the base class. The documentation does not call this a mistake, it calls it worse: this renders the meaning of the program undefined, and notes that in the future a check may be added to prevent it. Two slots with one name means two storage locations, and which one a method sees depends on which descriptor the method resolution order reaches first. Repeating a parent's slot name in a subclass wastes space and produces a program with no defined behavior.

Multiple inheritance runs into the layout problem directly, and there is a related hard error at the built-in boundary: `TypeError` is raised if nonempty `__slots__` are defined for a class derived from a variable-length built-in type such as `int`, `bytes`, and `tuple`. Those types already use the space after their header for variable-length data, so there is nowhere for a fixed slot array to go. The failure is a layout conflict, the same category of problem a C++ compiler resolves at compile time when laying out a multiply-inherited object, except Python must resolve it at class creation and can only refuse.

> [!example] Slots as documentation
> Any non-string iterable may be assigned to `__slots__`, and if a dictionary is used, the dictionary keys will be used as the slot names. The values are ignored by the interpreter, which makes a dict a place to write per-attribute documentation that tooling can read. It is a small detail that reveals the shape of the feature: `__slots__` is a declaration of an instance's fields, and the language quietly permits annotating that declaration.

The reason to reach for slots is narrow and worth stating as a rule. If a class is instantiated in large numbers with a fixed set of attributes, the fixed layout pays for itself in bytes and cache lines. If it is instantiated a handful of times, the dictionary costs nothing you will measure and the flexibility is worth keeping. Modern [[cs/languages/Python/dataclasses-and-attrs-style-classes|dataclasses]] make the choice a keyword rather than a separate declaration, which is the right place for it, since the decision is about instance count and nothing else.

## Related Notes

- [[cs/languages/Python/the-descriptor-protocol|The Descriptor Protocol]] - the mechanism slots are implemented with
- [[cs/dsa/hash-tables|Hash Tables]] - what a per-instance `__dict__` actually costs
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - why a contiguous layout beats a pointer hop by more than the instruction count suggests
- [[cs/languages/Python/cpython-object-model-and-reference-counting|CPython's Object Model and Reference Counting]] - the header that sits in front of the slot array
- [[cs/languages/Python/dataclasses-and-attrs-style-classes|Dataclasses and attrs-Style Classes]] - where the slots decision is made today
- [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|Virtual Dispatch, Vtables, and Object Layout]] - fixed layout decided at compile time, and the multiple-inheritance conflict it also has

## Sources

- "3. Data model," Python Language Reference. https://docs.python.org/3/reference/datamodel.html . Supports `__slots__` declaring data members and denying `__dict__` and `__weakref__` creation; the significant space saving and improved attribute lookup speed; slots reserving space for declared variables; `AttributeError` on assigning unlisted names; the loss of weak reference support; slots being implemented as class-level descriptors and the resulting ban on class-attribute defaults; parent slots being visible to children while a child without `__slots__` regains a `__dict__`; inheritance from a class without slots always exposing `__dict__` and `__weakref__`; redeclaring a base class slot rendering the meaning of the program undefined; the `TypeError` for nonempty slots on variable-length built-in subclasses; and dictionary keys being usable as slot names.
