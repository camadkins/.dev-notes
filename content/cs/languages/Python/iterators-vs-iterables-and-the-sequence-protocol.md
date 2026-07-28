---
title: Iterators vs Iterables and the Sequence Protocol
description: "Two protocols, three methods, and one legacy fallback. What iter() actually accepts, why __getitem__ still makes an object iterable, and what the sequence protocol is separately from iteration."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-08
updated:
aliases:
  - The Sequence Protocol
  - "__getitem__ iteration fallback"
---

Python supports a concept of iteration over containers, and this is implemented using two distinct methods. That sentence from the standard types documentation is doing more work than it looks. Two methods, not one, and they belong to two different objects playing two different roles.

The [[cs/languages/Python/generators-and-iterators|generators note]] covers what a `yield` freezes and what a generator expression costs. This one is about the protocol boundary itself: who has to implement what, and the third route into iteration that predates the protocol and still works.

> [!note] The idea
> "Iterable" and "iterator" are not two words for one thing, and the split is a *role* distinction rather than a type distinction. A container defines `__iter__()` returning an iterator object; an iterator defines `__iter__()` returning itself plus `__next__()`. Every iterator is therefore an iterable, but the reverse fails, and that asymmetry is exactly what lets a list be looped many times while a generator is exhausted after one. The non-obvious part is that Python has a *third* entrance nobody designed as a protocol: `iter()` accepts an object with `__getitem__()` taking integer arguments starting at 0, and that path predates `__iter__` entirely.

## One method to be iterable

One method needs to be defined for container objects to provide iterable support. `container.__iter__()` returns an iterator object, and the object is required to support the iterator protocol. That is the whole obligation.

The documentation adds a design note worth carrying: if a container supports different types of iteration, additional methods can be provided to specifically request iterators for those iteration types, with the given example being a tree structure which supports both breadth-first and depth-first traversal. `__iter__` gives you the default traversal; named methods give you the alternatives. At the C level this method corresponds to the `tp_iter` slot of the type structure.

For a container that is a mapping, the datamodel is specific about what should come out. `__iter__()` should return a new iterator object that can iterate over all the objects in the container, and for mappings, it should iterate over the keys of the container.

## Two methods to be an iterator

The iterator objects themselves are required to support two methods, which together form the iterator protocol.

`iterator.__iter__()` returns the iterator object itself, and the documented reason is operational: this is required to allow both containers and iterators to be used with the `for` and `in` statements. One code path, two kinds of argument.

`iterator.__next__()` returns the next item from the iterator, and if there are no further items, raises the `StopIteration` exception. It corresponds to the `tp_iternext` slot in the C API.

There is a hard requirement attached that is easy to violate in a hand-written iterator. Once an iterator's `__next__()` method raises `StopIteration`, it must continue to do so on subsequent calls, and implementations that do not obey this property are deemed broken. An iterator that raises `StopIteration` once and then starts producing values again is not a slightly unusual iterator; it is a broken one by the specification's own word.

Python defines several iterator objects to support iteration over general and specific sequence types, dictionaries, and other more specialized forms, and the specific types are not important beyond their implementation of the iterator protocol. The protocol is the interface; the classes behind it are private detail.

Generators are the shortcut. Python's generators provide a convenient way to implement the iterator protocol, and if a container object's `__iter__()` method is implemented as a generator, it will automatically return an iterator object (technically, a generator object) supplying both `__iter__()` and `__next__()`.

## The __getitem__ fallback

`iter()`'s documented contract names both routes explicitly. Without a second argument, the single argument must be a collection object which supports the iterable protocol (the `__iter__()` method), or it must support the sequence protocol (the `__getitem__()` method with integer arguments starting at 0). If it does not support either of those protocols, `TypeError` is raised.

So a class with nothing but `__getitem__` is iterable. The mechanism that terminates such a loop is an exception rather than a sentinel: the sequence iteration protocol, used for example in `for` loops, expects that an `IndexError` will be raised for illegal indexes to allow proper detection of the end of a sequence. A `__getitem__` that returns something for every integer forever produces an infinite loop; one that raises `KeyError` instead of `IndexError` produces an error rather than a clean stop.

The datamodel calls this route by its age when describing membership testing. For objects that do not define `__contains__()`, the membership test first tries iteration via `__iter__()`, then the old sequence iteration protocol via `__getitem__()`. That ordering, `__contains__` then `__iter__` then `__getitem__`, is the actual resolution order for `in`, and it is the clearest place the three-way structure of Python's iteration support is visible in one sentence.

`iter()` has a second form that has nothing to do with either protocol. Given `iter(callable, sentinel)`, the first argument must be a callable object, and the iterator created will call it with no arguments for each call to its `__next__()` method; if the value returned is equal to `sentinel`, `StopIteration` will be raised, otherwise the value will be returned. The documented application is a block-reader, reading fixed-width blocks from a binary database file until end of file with `for block in iter(partial(f.read, 64), b'')`.

> [!example] Three objects that are all "iterable" for different reasons
> A `list` is iterable because it defines `__iter__()` returning a fresh iterator, which is why looping it twice works. A generator object is iterable because it defines `__iter__()` returning *itself*, which is why looping it twice does not. A class defining only `__getitem__` taking integers from 0 and raising `IndexError` past the end is iterable because `iter()` accepts the sequence protocol as an alternative, with no `__iter__` anywhere in the picture. All three satisfy `for x in obj:`. Only the first survives a second pass, and only the first two would pass a naive `hasattr(obj, '__iter__')` check.

## The sequence protocol is a separate thing

"Sequence protocol" is used in the documentation for a small cluster of methods, and it is not identical to iterability. `reversed()` shows the fuller form. Its argument must be an object which has a `__reversed__()` method or supports the sequence protocol, described there as the `__len__()` method and the `__getitem__()` method with integer arguments starting at 0. Two methods, not one. If `__reversed__()` is not provided, `reversed()` falls back to using the sequence protocol, and objects that support the sequence protocol should only provide `__reversed__()` if they can provide an implementation that is more efficient than the one `reversed()` supplies.

The sequence/mapping distinction lives in the key domain rather than in a separate set of methods. The datamodel says the first set of container methods is used either to emulate a sequence or to emulate a mapping, and the difference is that for a sequence, the allowable keys should be the integers `k` for which `0 <= k < N` where `N` is the length of the sequence, or slice objects, which define a range of items. `__getitem__` serves both; what distinguishes them is what you are allowed to pass.

The error contract is specified too. If the subscript is of an inappropriate type, `__getitem__()` should raise `TypeError`, and if it has an inappropriate value, it should raise a `LookupError` or one of its subclasses, `IndexError` for sequences and `KeyError` for mappings. That is why the iteration fallback keys on `IndexError` specifically: the fallback is reading the sequence half of an already-specified error contract.

Slicing is not a separate protocol either. It is handled by `__getitem__()`, `__setitem__()`, and `__delitem__()`, with `a[1:2] = b` translated to `a[slice(1, 2, None)] = b`, and missing slice items always filled in with `None`.

Beyond subscription, the recommendations for a full sequence type are concrete. Mutable sequences should provide `append()`, `clear()`, `count()`, `extend()`, `index()`, `insert()`, `pop()`, `remove()`, and `reverse()`, like standard `list` objects. Sequence types should implement addition (meaning concatenation) and multiplication (meaning repetition) by defining `__add__()`, `__radd__()`, `__iadd__()`, `__mul__()`, `__rmul__()`, and `__imul__()`, and they should not define other numerical operators. It is recommended that both mappings and sequences implement `__contains__()` to allow efficient use of the `in` operator, searching keys for mappings and values for sequences, and that both implement `__iter__()` for efficient iteration.

`collections.abc.Sequence` exists to keep this from being freehand work; the ABC is provided to make it easier to correctly implement the common sequence operations on custom sequence types.

> [!warning] `__len__` is not free of consequences
> `__len__()` should return the length of the object as an integer greater than or equal to zero, and an object that does not define `__bool__()` and whose `__len__()` returns zero is considered to be false in a Boolean context. Adding `__len__` to a container therefore changes its truthiness, which is a separate decision from making it indexable. In CPython the length is required to be at most `sys.maxsize`, and if it is larger, some features such as `len()` may raise `OverflowError`; defining `__bool__()` is the documented way to prevent that in truth value testing.

## Related Notes

- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - what `yield` preserves, and the cost of a generator against the list it replaces
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - the wider protocol scheme these methods are instances of
- [[cs/languages/Python/comprehensions-and-generator-expressions|Comprehensions and Generator Expressions]] - the syntax that consumes an iterable and produces a container or an iterator
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - the general theory of a suspendable producer
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - `StopIteration` and `IndexError` used as loop termination rather than error signalling
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - the design choice of ending a loop with an exception instead of a return value

## Sources

- "Built-in Types," Python Standard Library. https://docs.python.org/3/library/stdtypes.html . Supports iteration being implemented using two distinct methods, `container.__iter__()` returning an iterator required to support the iterator protocol plus the multiple-traversal design note and the tree example, the `tp_iter` and `tp_iternext` C API slot correspondences, `iterator.__iter__()` returning itself and its rationale of allowing containers and iterators to be used uniformly with `for` and `in`, `iterator.__next__()` returning the next item and raising `StopIteration` when exhausted, the requirement that `__next__()` keep raising `StopIteration` once it has (implementations that do not being deemed broken), the several built-in iterator types being unimportant beyond their protocol implementation, and generators as a convenient way to implement the iterator protocol with a generator-implemented `__iter__()` automatically supplying both methods.
- "3. Data model," The Python Language Reference. https://docs.python.org/3/reference/datamodel.html . Supports the sequence-versus-mapping key-domain distinction (integers `0 <= k < N` or slice objects), the mutable-sequence method recommendations and the concatenation/repetition operator list with the injunction against other numeric operators, the `__contains__` and `__iter__` recommendations for mappings and sequences and what each should search or yield, `collections.abc.Sequence` as the helper ABC, `__len__()`'s contract and its effect on Boolean context plus the CPython `sys.maxsize` and `OverflowError` detail, `__getitem__()`'s two supported subscript kinds and its `TypeError`/`LookupError`/`IndexError`/`KeyError` error contract, the note that the sequence iteration protocol expects `IndexError` for illegal indexes to detect the end of a sequence, slicing being handled by `__getitem__`/`__setitem__`/`__delitem__` with the `a[slice(1, 2, None)]` translation and `None`-filled missing items, `__iter__()` returning a new iterator and iterating keys for mappings, `__reversed__()` and its fallback to the sequence protocol, and the `__contains__` then `__iter__` then old `__getitem__` resolution order for membership tests.
- "Built-in Functions," Python Standard Library. https://docs.python.org/3/library/functions.html . Supports `iter()` accepting either the iterable protocol (`__iter__()`) or the sequence protocol (`__getitem__()` with integer arguments starting at 0) and raising `TypeError` otherwise, the two-argument `iter(callable, sentinel)` form and its `StopIteration`-on-sentinel behavior with the fixed-width block-reader example, and `reversed()` requiring `__reversed__()` or the sequence protocol described as `__len__()` plus `__getitem__()` with integer arguments starting at 0.
