---
title: Python
description: Landing page for Python. Reference counting, the C API, and gradual typing, seen through the cross-language comparative notes.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-07-22
updated:
aliases: []
---

Python trades raw control for speed of expression. Objects are [[cs/systems/memory-allocators-and-fragmentation|heap-allocated]] and managed by reference counting backed by a cycle collector, [[cs/pl/type-systems-goals-guarantees|values carry their types at runtime]], and the reference interpreter runs Python bytecode behind a global lock. Its performance-critical parts, and its bridges to the rest of the system, are written in C through a stable C API, which makes Python as much a glue language over compiled code as a language in its own right. The scientific-Python and machine-learning stack, from NumPy to PyTorch, is the canonical example: a thin Python surface over compiled C, C++, and CUDA, which is much of why Python became the lingua franca of [[cs/machine-learning/index|machine learning]].

Python-specific study collects here.

### Python's own mechanics

- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - the protocol-based object model every other feature descends from
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators]] - the iterator protocol, what `yield` freezes, and what a generator costs against a list
- [[cs/languages/Python/decorators|Decorators]] - `@` as a rebinding rule, `functools.wraps`, and decorators that take arguments
- [[cs/languages/Python/context-managers-and-with|Context Managers and the with Statement]] - the exact expansion of `with`, and `__exit__` as an exception switch
- [[cs/languages/Python/the-gil-and-python-concurrency|The GIL and Python Concurrency]] - what the lock protects, why it was hard to remove, and choosing threads, processes, or asyncio
- [[cs/languages/Python/iterators-vs-iterables-and-the-sequence-protocol|Iterators vs Iterables and the Sequence Protocol]] - the two protocols, the `__getitem__` fallback, and what `iter()` really accepts
- [[cs/languages/Python/comprehensions-and-generator-expressions|Comprehensions and Generator Expressions]] - displays, the implicitly nested scope, and when laziness is the right call
- [[cs/languages/Python/type-hints-and-gradual-typing|Type Hints and Gradual Typing]] - annotations as a side channel the runtime records and never checks
- [[cs/languages/Python/dataclasses-and-attrs-style-classes|Dataclasses and attrs-Style Classes]] - generated methods, `field()` options, and the mutable-default trap
- [[cs/languages/Python/the-import-system|The Import System]] - the `sys.modules` cache, `sys.path`, and what happens on first import

### Read through the comparative notes

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - CPython reference counting and the cycle collector
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the CPython C API, `ctypes`, and calling into native code
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - the `struct` module and packing bytes for the wire

---

*Any pages placed under this folder are auto-listed below by Quartz.*
