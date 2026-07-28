---
title: "Generators and Iterators in Python"
description: The iterator protocol, what yield actually freezes, generator expressions, and the real cost of a generator against the list it replaces.
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-02-17
updated:
aliases:
  - Python Generators
  - The Iterator Protocol
---

A `for` loop in Python does not know what a list is. It calls `iter()` on whatever you gave it, gets back an object, and calls `__next__()` on that object until the object raises `StopIteration`. Everything that can be looped over, files, dictionaries, ranges, database cursors, network streams, is a participant in that one two-method conversation. Generators are the syntax that lets you write a participant without writing a class.

The general theory of a producer that suspends and resumes lives in [[cs/pl/coroutines-and-generators|coroutines and generators]], and the laziness angle is in [[cs/pl/evaluation-order-and-strictness|evaluation order and strictness]]. This note is about the CPython mechanics: what the protocol requires, what state a `yield` preserves, and what you actually pay for.

> [!note] The idea
> The iterator protocol is deliberately tiny, `__next__()` plus `StopIteration` plus a self-returning `__iter__()`, so that any object can join it. A generator function is a compiler-supported way to satisfy that protocol using ordinary local variables and ordinary control flow instead of a hand-maintained state machine. The non-obvious consequence is that an iterator is a *one-shot* object while a container is not: a list hands out a fresh iterator every time you loop it, but looping an already-exhausted iterator returns the same exhausted object and quietly looks like an empty container.

## The protocol is two methods, not one

The Python glossary is precise about the split. An **iterable** is an object capable of returning its members one at a time, and passing it to `iter()` returns an iterator for it. An **iterator** is an object representing a stream of data, where repeated calls to `__next__()` return successive items and a `StopIteration` exception is raised when no more data are available. Once that exception fires the iterator is exhausted, and further calls to `__next__()` just raise `StopIteration` again.

Iterators are also required to have an `__iter__()` method that returns the iterator object itself, so every iterator is also an iterable and can be passed anywhere an iterable is accepted. That self-return looks like a redundant formality until you see what it buys: `for` can accept iterables and iterators uniformly, because calling `iter()` on either yields something with `__next__()`.

The exhaustion asymmetry is where people get burned. A container object such as a list produces a fresh new iterator each time you pass it to `iter()` or use it in a `for` loop. Attempting the same with an iterator returns the same exhausted iterator used in the previous pass, making it appear like an empty container. Two loops over the same generator do not do the same thing twice; the second one does nothing.

Two footnotes the glossary attaches are worth carrying. CPython does not consistently apply the requirement that an iterator define `__iter__()`, so duck-typed code that assumes it may still be surprised. And free-threaded CPython does not guarantee thread-safe behavior of iterator operations.

An object also becomes iterable if it defines `__getitem__()` implementing sequence semantics, which is the older pre-protocol path and one of the many places Python's [[cs/languages/Python/the-data-model-and-dunder-methods|data model]] accepts more than one way to satisfy the same syntax.

## What yield freezes

PEP 255 introduced generators, and its description of the suspend step is the clearest one written. A function that contains a `yield` statement is a generator function. When it is called, the actual arguments are bound to the local formal names in the usual way but **no code in the body is executed**; instead a generator-iterator object is returned, and that object conforms to the iterator protocol.

Each time the generator's next-step method is invoked, the body runs until it hits a `yield` or a `return` or the end of the body. If a `yield` is encountered, the state of the function is frozen and the yielded value is returned to the caller. PEP 255 spells out what "frozen" means: all local state is retained, including the current bindings of local variables, the instruction pointer, and the internal evaluation stack, enough information saved that the next resumption proceeds exactly as if the `yield` were just another external call. The current glossary adds pending `try` statements to that list of remembered state.

That is the whole trick, and the reason generators feel like magic to write and are cheap to run. PEP 255's own claim is that resuming a generator should be no more expensive than a function call. You do not restore a state machine, you restore a frame.

Termination is defined by exception. When a `return` is encountered, control proceeds as in any function return, executing the appropriate `finally` clauses, and then a `StopIteration` is raised to signal exhaustion. `StopIteration` is also raised if control simply flows off the end of the body. And if an unhandled exception is raised by, or passes through, a generator function, it is passed to the caller in the usual way and subsequent attempts to resume raise `StopIteration`. An unhandled exception terminates a generator's useful life; there is no resuming past it.

Beyond plain iteration, generator iterators also implement `send()` to push a value into the suspended generator and `throw()` to raise an exception at the point where the generator was paused. Those two turn a generator from a producer into something closer to a coroutine, which is the door PEP 255 left open and which later work walked through.

> [!warning] PEP 255 describes Python 2.2 and some of it has since been superseded
> The original PEP required `from __future__ import generators`, spelled the step method `.next()`, forbade `yield` inside the `try` clause of a `try`/`finally`, and disallowed an expression on `return` inside a generator. Modern Python spells the method `__next__()`, and later PEPs relaxed the other restrictions. Read PEP 255 for its account of *why* generators exist and what suspension preserves, and read the current language reference for what is legal today.

## Generator expressions

PEP 289 added the comprehension-shaped form. The glossary defines a generator expression as an expression that returns an iterator, looking like a normal expression followed by a `for` clause and an optional `if` clause. The PEP's framing is that it is a high performance, memory efficient generalization of list comprehensions and generators.

The rationale is a single observation: many list-comprehension use cases do not need a full list created in memory, they only need to iterate the elements one at a time. `sum([x*x for x in range(10)])` builds the whole list of squares, iterates it, then deletes it. `sum(x*x for x in range(10))` does not build it at all. The same saving applies to constructors like `set(...)` and `dict(...)`, and to reducers like `sum()`, `min()`, and `max()`.

Semantically, a generator expression is equivalent to creating an anonymous generator function and calling it. The syntax requires that it always sit directly inside a set of parentheses with no comma on either side; a function call with a single positional argument can take a bare generator expression, but every other case needs its own parentheses. And the loop variable is not exposed to the surrounding function, which was a deliberate departure from the list-comprehension behavior of the time.

## What a generator costs versus a list

The honest answer from PEP 289 is not "generators are always faster." Early timings showed generators had a significant performance advantage over list comprehensions, but list comprehensions were then heavily optimized for Python 2.4 and the performance became roughly comparable for small to mid-sized data sets. The advantage returns as data volumes grow, because generator expressions do not exhaust cache memory and they allow Python to re-use objects between iterations.

So the trade is not raw speed at small n. It is memory, and it is cache behavior at large n. A list of a million results is a million live objects and a million pointers in one contiguous array; the generator producing them holds one frame. Against that you pay in three currencies. You give up random access and `len()`, because there is nothing materialized to index. You give up reuse, because the iterator is one-shot. And you accept per-item resumption overhead spread across the loop rather than a single bulk build.

> [!example] Only the outermost for-expression runs eagerly
> PEP 289 specifies that `g = (tgtexp for var1 in exp1 if exp2 for var2 in exp3 if exp4)` is equivalent to defining a generator function over a *bound* argument and calling it as `__gen(iter(exp1))`. Only the outermost for-expression is evaluated immediately; all the other expressions are deferred until the generator is run. That means `exp1` is evaluated and iterated at the moment you write the expression, while `exp2`, `exp3`, and `exp4` are evaluated later, against whatever the surrounding variables happen to hold *then*. Constructing a generator expression from a name you rebind afterward is a real source of surprise, and the mixed binding times are exactly why.

## Related Notes

- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - the general theory of suspendable producers that Python's generators instantiate
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - laziness as a language design axis, not a Python-only trick
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - how `__iter__` and `__next__` fit the wider protocol scheme
- [[cs/languages/Python/context-managers-and-with|Context Managers and the with Statement]] - the other protocol that turns cleanup into syntax
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - what a live list of a million objects actually costs under reference counting
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - `StopIteration` as control flow rather than error signalling

## Sources

- "Glossary," Python 3 documentation. https://docs.python.org/3/glossary.html . Supports the definitions of iterable, iterator, generator, generator function, generator iterator, and generator expression; the `__next__()`/`StopIteration`/self-returning `__iter__()` protocol; the one-shot exhaustion asymmetry between iterators and containers; `__getitem__()` as an alternate route to iterability; `send()` and `throw()`; and the CPython `__iter__` and free-threaded thread-safety caveats.
- "PEP 255 - Simple Generators," Python Enhancement Proposals. https://peps.python.org/pep-0255/ . Supports a `yield`-containing function being a generator function, no body code running at call time, the returned generator-iterator conforming to the iterator protocol, the exact list of state preserved when frozen (locals, instruction pointer, evaluation stack), resumption costing no more than a function call, `StopIteration` on `return` or falling off the end, unhandled exceptions ending a generator's life, and the Python 2.2 era restrictions noted in the warning.
- "PEP 289 - Generator Expressions," Python Enhancement Proposals. https://peps.python.org/pep-0289/ . Supports generator expressions as a memory efficient generalization of list comprehensions, the `sum([x*x ...])` versus `sum(x*x ...)` memory argument, equivalence to an anonymous generator function, the parenthesization rule, the hidden loop variable, only the outermost for-expression being evaluated immediately, and the performance comparison being roughly comparable at small to mid sizes with generators pulling ahead at large volumes due to cache and object reuse.
