---
title: Metaclasses and Class Creation
description: "What type actually does when a class body finishes executing, why __init_subclass__ replaced most metaclass code, and the conflict rule that makes a metaclass a permanent commitment."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-11
updated:
aliases:
  - Python Metaclasses
  - __init_subclass__
  - type as a Metaclass
---

A `class` statement looks like a declaration. It is not. It is a small program that runs, top to bottom, in a fresh namespace, and then hands the resulting dictionary to a callable that builds an object out of it. The Python reference states the mechanism without ceremony: by default, classes are constructed using `type()`, and the class body is executed in a new namespace and the class name is bound locally to the result of `type(name, bases, namespace)`. Every class in a Python program is the return value of a function call that the compiler emitted on your behalf.

> [!note] The idea
> A metaclass is not a special kind of magic attached to classes. It is the ordinary answer to an ordinary question: what callable receives the executed class body. Because that callable is a parameter of the `class` statement, class construction is user-programmable in the same way function construction is programmable with [[cs/languages/Python/decorators|decorators]]. The insight that made most metaclass code obsolete is that the customization almost always wanted to happen once per subclass, not once per class-creation protocol, and PEP 487 proved that a plain inherited method covers that case with none of the composition problems.

## What `type` does with the namespace

The class body finishes and control reaches the construction step. As the reference puts it, once the class namespace has been populated by executing the class body, the class object is created by calling `metaclass(name, bases, namespace, **kwds)`. Three arguments and some keywords. Everything a class is, its name, its parents, its methods, its annotations, arrives as data at that call.

`type.__new__` does the real work, and it is worth being precise about what it changes on the way through. The namespace mapping you built in the class body does not become the class dictionary. It is copied into a new ordered mapping, the original is discarded, and the copy is wrapped in a read-only proxy which becomes `__dict__` on the class. This is why `SomeClass.__dict__['x'] = 3` raises rather than mutating, and why `setattr` on a class goes through `type.__setattr__` instead. `type.__new__` is also where the class scans its own namespace for descriptors and calls `__set_name__` on each, which is why [[cs/languages/Python/the-descriptor-protocol|a descriptor learns its own attribute name]] at class creation and never afterward.

The choice of which callable gets that call has a rule that most people never read until it bites. The appropriate metaclass for a class definition is determined as follows: with no bases and no explicit metaclass, `type` is used; with an explicit metaclass that is not itself an instance of `type`, that object is used directly; otherwise, the most derived metaclass is selected from the explicitly specified metaclass and the metaclasses of all the base classes. That last clause is the one that matters, because "most derived" means one of the candidates has to be a subclass of all the others. If two bases carry unrelated metaclasses, no candidate dominates, and the class statement fails outright.

## The composition problem, and why `__init_subclass__` exists

PEP 487 named the failure mode directly. Metaclasses are a powerful tool to customize class creation, but they have the problem that there is no automatic way to combine metaclasses. Two libraries, each reasonably using a metaclass for its own purposes, produce a class that cannot inherit from both. The PEP is blunt about the cost: currently, customising class creation requires the use of a custom metaclass, and this custom metaclass then persists for the entire lifecycle of the class, creating the potential for spurious metaclass conflicts.

The conflicts occur whenever two unrelated metaclasses are used by the desired parents of a class definition, which makes the decision viral. Every class downstream of yours inherits the constraint. Worse for a library author, this risk also makes it very difficult to add a metaclass to a class that has previously been published without one, so the choice is effectively permanent from the first release.

Against that, PEP 487 made an empirical claim about what people were actually doing. Of the ways a metaclass gets used, the vast majority of use cases falls into just three categories: some initialization code running after class creation, the initialization of descriptors, and keeping the order in which class attributes were defined. Two of those three do not need a new type at all. They need a hook, and a hook can be an inherited method.

So `__init_subclass__` is a classmethod on the parent that Python calls once for each new subclass, receiving the subclass and any extra keywords from the `class` line. Subclass registration, attribute validation, and keyword-driven configuration all move out of a metaclass and into ordinary method inheritance, where `super()` composition works normally and two independent base classes cooperate instead of colliding. `__set_name__` covers the descriptor case in the same release. The third category, definition order, became its own proposal.

> [!warning] The split is about timing, not preference
> `__init_subclass__` runs after the class object exists, on the parent's behalf. `type.__new__` runs while the class object is being built and is the only place that can change what the class *is*: its layout, its `__slots__`, its bases, whether it is even an instance of `type`. Anything that only inspects or annotates a finished class belongs in the hook. Anything that must alter construction itself belongs in a metaclass, and there are few such things.

## What is left for metaclasses

The reference is generous about the possibilities and vague about the necessity: the potential uses for metaclasses are boundless, and some ideas that have been explored include enum, logging, interface checking, automatic delegation, automatic property creation, proxies, frameworks, and automatic resource locking/synchronization. Read that list against the PEP 487 hooks and most entries collapse. Interface checking, automatic property creation, and registration are all post-creation inspection.

The residue is real but small. `abc.ABCMeta` overrides `__instancecheck__` and `__subclasscheck__`, which are methods on the *type* of a class and therefore genuinely require a metaclass. `enum.EnumMeta` rewrites the namespace during construction so that members become singleton instances rather than plain attributes, which is a change to what the class is. `__prepare__`, returning a custom mapping for the class body to execute in, has no non-metaclass equivalent because it must exist before the body runs.

> [!example] The two-line diagnostic
> Before writing a metaclass, ask whether your code needs to observe the finished class or to change how it is made. If observing, `__init_subclass__` does it, composes cleanly, and costs a subclass nothing. If changing, ask a second question: does the change survive `type.__new__` copying the namespace and freezing the proxy? If it does not, you are fighting the construction order rather than using it.

Metaclasses are Python's version of a question every language with a class construct has to answer, which is who gets to run code at definition time. C++ answers with templates and `constexpr` evaluated by the compiler, Java answers with annotation processors and bytecode rewriting before the loader sees the file, and Lisp answers with [[cs/pl/macros-and-metaprogramming|macros over the syntax itself]]. Python answers by making definition time a runtime, executing the body as a program and letting a user callable consume the result. That is why the mechanism is uniform with everything else in [[cs/pl/objects-classes-and-dispatch|the object system]], and also why the mechanism has no compile-time cost model to lean on: the class statement executes when the module does, and every class in your program is built by running code.

## Related Notes

- [[cs/languages/Python/the-descriptor-protocol|The Descriptor Protocol]] - what `type.__new__` calls `__set_name__` on, and why only at creation
- [[cs/languages/Python/the-mro-and-c3-linearization|The MRO and C3 Linearization]] - the other thing class creation computes, and the reason base order matters
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - what a class is in object systems that do not make it a runtime value
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the compile-time answer to the same question
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - definition time as a loader step rather than an executed body
- [[cs/languages/Python/dataclasses-and-attrs-style-classes|Dataclasses and attrs-Style Classes]] - the decorator route to class rewriting, which sidesteps metaclasses entirely

## Sources

- "3. Data model," Python Language Reference. https://docs.python.org/3/reference/datamodel.html . Supports classes being constructed by `type()` with the body executed in a new namespace; the `metaclass(name, bases, namespace, **kwds)` call; the namespace being copied into a new ordered mapping and wrapped in a read-only proxy; the metaclass determination rules and the most-derived selection; and the list of explored uses for metaclasses.
- "PEP 487 - Simpler customisation of class creation," Python Enhancement Proposals. https://peps.python.org/pep-0487/ . Supports the absence of an automatic way to combine metaclasses; the persistence and spurious-conflict argument; conflicts arising from unrelated metaclasses on the desired parents; the difficulty of adding a metaclass to a previously published class; and the three-category breakdown of what metaclasses were actually used for.
