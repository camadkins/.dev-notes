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

Python's position in this section's generics comparison is a third kind of erasure. Java erases for compatibility with pre-generic code, TypeScript erases because the runtime was never told about types at all, and Python keeps its annotations as live objects that no one enforces. `list[int]` is a real object built by a real method call at import time, and it means nothing to the interpreter. The whole generic system exists for a checker that runs before the program does, which makes the gap between what the checker proves and what the runtime does the most interesting thing in the folder.

### The object model

Protocols rather than an inheritance tree. Most of the language is a consequence of these six.

- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - what `x[i]` and `len(x)` actually call, and why special methods are looked up on the type
- [[cs/languages/Python/the-descriptor-protocol|The Descriptor Protocol]] - methods, properties, `classmethod`, and `__slots__` as one mechanism in different clothes
- [[cs/languages/Python/metaclasses-and-class-creation|Metaclasses and Class Creation]] - what `type` does when a class body finishes, and the conflict rule that makes a metaclass permanent
- [[cs/languages/Python/the-mro-and-c3-linearization|The MRO and C3 Linearization]] - the merge that turns an inheritance graph into one lookup order, and the hierarchies it rejects
- [[cs/languages/Python/slots-and-instance-layout|Slots and Instance Layout]] - trading a per-instance dictionary for a fixed array, and the inheritance rules that quietly give it back
- [[cs/languages/Python/dataclasses-and-attrs-style-classes|Dataclasses and attrs-Style Classes]] - a decorator that reads annotations and writes methods, and the mutable-default trap

### Iteration, context, and the syntax built on protocols

- [[cs/languages/Python/iterators-vs-iterables-and-the-sequence-protocol|Iterators vs Iterables and the Sequence Protocol]] - two protocols, three methods, and one legacy fallback
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - what `yield` freezes, and the real cost against the list it replaces
- [[cs/languages/Python/comprehensions-and-generator-expressions|Comprehensions and Generator Expressions]] - the implicitly nested scope, and the one iterable evaluated eagerly
- [[cs/languages/Python/context-managers-and-with|Context Managers and the with Statement]] - the exact expansion of `with`, and `__exit__` as an exception switch
- [[cs/languages/Python/decorators|Decorators in Python]] - `@` as a rebinding rule, and how a decorator taking arguments is a different animal

### Gradual typing, and the type parameter

- [[cs/languages/Python/type-hints-and-gradual-typing|Type Hints and Gradual Typing]] - annotations as data the interpreter stores and never checks
- [[cs/languages/Python/typevar-and-generic-functions|TypeVar and Generic Functions]] - a declaration that two positions must be filled by the same thing, and bound against constraint
- [[cs/languages/Python/pep-695-type-parameter-syntax|PEP 695 Type Parameter Syntax]] - a real lexical scope, lazily evaluated bounds, and inferred variance
- [[cs/languages/Python/variance-in-python-generics|Variance in Python Generics]] - why `list` is invariant, and the algorithm that made declaring variance unnecessary
- [[cs/languages/Python/self-type-and-recursive-bounds|Self and Recursive Bounds]] - what `Self` reaches that a hand-written recursive bound cannot

### Structural typing, where Python differs most

- [[cs/languages/Python/protocols-and-structural-subtyping|Protocols and Structural Subtyping]] - moving the interface declaration from the implementer to the consumer
- [[cs/languages/Python/runtime-checkable-protocols-and-their-limits|Runtime-Checkable Protocols and Their Limits]] - `isinstance` tests for names and never signatures, and the bug lives in that gap

### Describing what a plain parameter cannot

- [[cs/languages/Python/paramspec-and-callable-types|ParamSpec and Callable Types]] - `Callable[..., T]` means do no validation, and what replaces that hole
- [[cs/languages/Python/typevartuple-and-variadic-generics|TypeVarTuple and Variadic Generics]] - a variable standing for a tuple of types, and the more instructive list of what it cannot do
- [[cs/languages/Python/overload-and-the-stub-model|Overload and the Stub Model]] - a function that raises if you call it, a file that shadows the module it describes, and typeshed at ecosystem scale

### Where the checker stops and the runtime begins

- [[cs/languages/Python/generics-at-runtime-and-class-getitem|Generics at Runtime and __class_getitem__]] - `list[int]` as a real object, and what `get_type_hints` will run for you
- [[cs/languages/Python/type-narrowing-and-typeguard|Type Narrowing, TypeGuard, and TypeIs]] - a promise about one branch against a promise about both
- [[cs/languages/Python/any-object-and-never|Any, object, and Never]] - an unknown static type rather than a set of values, and a consistency relation that is not transitive

### The interpreter and its edges

- [[cs/languages/Python/cpython-object-model-and-reference-counting|CPython's Object Model and Reference Counting]] - one representation choice explaining destructor timing, the cycle collector, and the difficulty of change
- [[cs/languages/Python/the-bytecode-and-the-eval-loop|The Bytecode and the Eval Loop]] - code objects, frames, and a specializing interpreter that rewrites instructions as it runs
- [[cs/languages/Python/the-import-system|The Import System]] - the `sys.modules` cache, the path based finder, and what happens on first import
- [[cs/languages/Python/the-c-api-and-extension-modules|The C API and Extension Modules]] - ownership rules with no compiler to check them, and an interface that became the interpreter's hardest constraint
- [[cs/languages/Python/packaging-wheels-and-environments|Packaging, Wheels, and Environments]] - why an sdist install runs arbitrary code, and where the supply-chain risk moved

### Concurrency and failure

- [[cs/languages/Python/the-gil-and-python-concurrency|The GIL and Python Concurrency]] - what the lock protects, and how threads, processes, and asyncio divide the workload space
- [[cs/languages/Python/free-threading-and-the-end-of-the-gil|Free Threading and the End of the GIL]] - reference counting rebuilt around single-thread ownership, and who pays for it
- [[cs/languages/Python/asyncio-and-the-event-loop|asyncio and the Event Loop]] - why calling a coroutine does nothing, and what one blocking call costs every other task
- [[cs/languages/Python/exception-groups-and-tracebacks|Exception Groups and Tracebacks]] - a linked list built during unwinding, and a structure that could only describe one failure

### Read from the comparative layer

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - CPython reference counting and the cycle collector
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the CPython C API, `ctypes`, and calling into native code
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - annotations that survive as objects but bind nothing
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - the `struct` module and packing bytes for the wire

---

*Any pages placed under this folder are auto-listed below by Quartz.*
