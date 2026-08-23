---
title: Exception Groups and Tracebacks
description: "A traceback is a linked list built during unwinding, and ExceptionGroup exists because that structure could only ever describe one failure at a time."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-07-06
updated:
aliases:
  - ExceptionGroup
  - except star
  - Python Tracebacks
---

Python's exception machinery rests on an assumption so old that it stopped looking like an assumption: at any moment, one thing has gone wrong. Everything follows from that. There is one exception in flight, one traceback attached to it, one handler that catches it. PEP 654 states the limitation as a fact about the interpreter rather than about style. The interpreter is currently able to propagate at most one exception at a time.

Chaining did not lift that. `__cause__` and `__context__` link together exceptions that are related to each other as the cause or context, which is a vertical relationship: this failed because that failed. What was missing was horizontal. There are situations where multiple unrelated exceptions need to be propagated together as the stack unwinds, and nothing in the model could express it.

> [!note] The idea
> A traceback is not a rendered string, it is a data structure built incrementally by the unwinder, and its shape is a list because the stack it records is a line. Concurrency broke that geometry. Once several tasks run under one `await`, failure is a set rather than a point, and no linked list can hold it. `ExceptionGroup` is the tree that replaces the line, and `except*` is the only handler form that can act on a tree without flattening it back to a single value.

## What a traceback object actually is

Traceback objects represent the stack trace of an exception, and a traceback object is implicitly created when an exception occurs. The construction procedure matters more than the definition. When the search for an exception handler unwinds the execution stack, at each unwound level a traceback object is inserted in front of the current traceback.

So the traceback is built during unwinding, one node per frame abandoned, each new node prepended. It is a [[cs/dsa/linked-list|linked list]] growing at the head as the stack shrinks. That is why the printed output reads outermost frame first and the raise site last: the list is in insertion order reversed by the printer, and every entry corresponds to a [[cs/languages/Python/the-bytecode-and-the-eval-loop|frame]] the interpreter gave up on. Reading the exception machinery as [[cs/pl/exceptions-handlers-and-non-local-control|non-local control flow]] makes the design obvious. The unwinder has to walk the frames anyway to find a handler, so recording them costs one allocation per level.

Holding a traceback keeps frames alive, and frames keep their locals alive. The docs point at the consequence when documenting `frame.clear()`, which helps break reference cycles involving frame objects, for example when catching an exception and storing its traceback for later use. Stashing an exception in a list for later reporting pins every local variable in every frame it unwound through, which is a memory leak that reference counting cannot resolve on its own because the frame and the traceback point at each other.

## Why concurrency needed a new shape

The motivating case is stated in the PEP without abstraction. Libraries for async concurrency provide APIs to invoke multiple tasks and return their results in aggregate, and there was no good way for such libraries to handle situations where multiple tasks raise exceptions. The standard library's `asyncio.gather` illustrated the dilemma exactly: it provides two options, raise the first exception, or return the exceptions in the results list.

Both options are bad in the same way. Raising the first discards real failures, and which one survives depends on scheduling order, so the error a user reports is a coin flip. Returning them in the results list demotes errors to return values, so the caller must remember to inspect a list for exception instances, and forgetting is silent. Trio's answer was a `MultiError` type raised to report a collection of errors, and the difficulty of handling `MultiError` is what motivated the PEP.

The proposal is small in surface. It adds language extensions that allow programs to raise and handle multiple unrelated exceptions simultaneously: a new standard exception type, `ExceptionGroup`, which represents a group of unrelated exceptions being propagated together, and a new syntax `except*` for handling them. There are two builtin types, since a group holding a `KeyboardInterrupt` must not be catchable by a bare `except Exception`, which is why `BaseExceptionGroup` sits above `ExceptionGroup` in the hierarchy.

## `except*` splits instead of matching

Ordinary `except` asks a yes-or-no question: does this exception match this type. Against a group that question is malformed, because a group can contain a `ValueError` and an `OSError` at once, and both handlers should run.

So `except*` partitions rather than selecting. The operation underneath is described precisely: `eg.split(T)` divides a group into the subgroup of leaf exceptions that match the type `T` and the subgroup of those that do not, using the same check as `except` for a match. A `try` statement with several `except*` clauses runs each clause against the part of the group it matches, and anything unmatched by every clause propagates onward as a smaller group. The nesting structure is preserved through the split, which is why the printed output of a group still shows which task each leaf came from.

Subclassing needs one extra hook because splitting must construct new groups. `BaseExceptionGroup` exposes an instance method `derive(self, excs)` which is called whenever `subgroup` and `split` need to create a new exception group, and since `derive` has access to `self`, it can copy data from the original onto the new object. A group subclass carrying an error code keeps that code through every split, which is what makes subclassed groups usable rather than decorative.

> [!warning] The authors do not want you using these everywhere
> The PEP is unusually explicit about scope. The desired semantics of `except*` are sufficiently different from current exception handling that the authors did not propose modifying the behavior of the `except` keyword, adding new syntax instead. Their premise is that exception groups and `except*` will be used selectively, only when they are needed, and they do not expect them to become the default mechanism for exception handling. Stronger still: the decision to raise exception groups from a library needs to be considered carefully and regarded as an API-breaking change. Wrapping an existing library's errors in a group breaks every caller's `except ValueError`, because a group is not a `ValueError`. New API, not modified API.

> [!example] What made it urgent
> `asyncio.TaskGroup` and the structured concurrency it enables are the payoff. A task group awaits several children and, if more than one fails, raises one `ExceptionGroup` containing all of them, each with its own intact traceback back to its own `await` point. Compare structured concurrency in Java, which faces the identical problem, and note that the shape of the answer is the same in both: a scope that owns child tasks needs an error type that can hold more than one failure. The [[cs/languages/Python/asyncio-and-the-event-loop|event loop]] made concurrent failure ordinary, and the exception model had to grow a dimension to describe it.

The deeper point is about representation choice. Errors-as-values languages hit this problem too and answer it in the type: a Result holding a collection is not a new language feature, just a different generic argument. Python's exceptions are not values in that sense, they are a control-flow mechanism with one channel, and widening that channel to carry a set required new syntax. The lesson from [[cs/languages/common/errors-as-values-vs-control-flow|comparing the two approaches]] is that the exception model's convenience comes from an implicit assumption of singularity, and concurrency is precisely where that assumption expires.

## Related Notes

- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - what unwinding is, and why a traceback is a by-product of it
- [[cs/languages/Python/asyncio-and-the-event-loop|asyncio and the Event Loop]] - where several failures at once became routine
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - why the value-based answer needed no new syntax
- [[cs/languages/Java/virtual-threads-and-structured-concurrency|Virtual Threads and Structured Concurrency]] - the same aggregation problem in another runtime
- [[cs/languages/Python/the-bytecode-and-the-eval-loop|The Bytecode and the Eval Loop]] - the frame chain a traceback is assembled from
- [[cs/dsa/linked-list|Linked Lists]] - the structure a traceback is, built by prepending during unwinding

## Sources

- "PEP 654 - Exception Groups and except*," Python Enhancement Proposals. https://peps.python.org/pep-0654/ . Supports the interpreter propagating at most one exception at a time and chaining covering only cause and context; the concurrent-errors motivation including `asyncio.gather`'s two options and Trio's `MultiError`; the proposal of `ExceptionGroup` and `except*` for multiple unrelated exceptions; the two builtin group types; `split` partitioning leaf exceptions by type using the same match check as `except`; `derive` being called when subgroup and split construct new groups; and the scope guidance that groups are for selective use and that raising them from an existing library is an API-breaking change.
- "3. Data model," Python Language Reference. https://docs.python.org/3/reference/datamodel.html . Supports traceback objects representing the stack trace of an exception, being implicitly created when an exception occurs, and being inserted in front of the current traceback at each level unwound during the search for a handler; and `frame.clear()` breaking reference cycles involving frames when a traceback is stored for later use.
