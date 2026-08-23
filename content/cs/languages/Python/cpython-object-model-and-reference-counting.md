---
title: CPython's Object Model and Reference Counting
description: "Every Python value is a heap-allocated PyObject with a header, a type pointer, and a count, and that one representation choice explains destructor timing, the cycle collector, and why the interpreter is hard to change."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-08-04
updated:
aliases:
  - PyObject
  - Reference Counting in CPython
  - CPython Memory Model
---

In CPython there is no such thing as a value that is not an object, and no such thing as an object that is not a pointer. The C API documentation states the representation plainly: most Python/C API functions have one or more arguments as well as a return value of type `PyObject *`, and this type is a pointer to an opaque data type representing an arbitrary Python object. Uniformity is the stated reason. Since all Python object types are treated the same way by the Python language in most situations, including assignments, scope rules, and argument passing, it is only fitting that they should be represented by a single C type.

That uniformity has a location consequence people underrate. Almost all Python objects live on the heap: you never declare an automatic or static variable of type `PyObject`, only pointer variables. There is no stack-allocated integer, no inline struct field, no unboxed anything. An assignment copies a pointer, a list holds pointers, and a "small" object is still a heap allocation with a header.

> [!note] The idea
> The header on every object is what makes Python's memory management immediate rather than deferred. Because the count of live references lives in the object itself, the runtime knows the instant a value becomes garbage, and it frees it there. That is why `__del__` and file closing appear deterministic in CPython while behaving unpredictably in a [[cs/pl/garbage-collection-concepts|tracing collected runtime]]. The same choice is why cycles need a separate collector bolted alongside, and why the header is the single hardest thing in CPython to change.

## What the header buys

Each object carries at minimum a type pointer and a reference count. The type pointer answers what kind of object it is, and the count answers whether anyone still cares. The C API explains the count in terms of scarcity: the reference count is important because today's computers have a finite (and often severely limited) memory size, and it counts how many different places there are that have a strong reference to an object. A place can be another object, a global or static C variable, or a local in some C function.

The release rule is a single sentence and does all the work. When the last strong reference to an object is released, meaning its reference count becomes zero, the object is deallocated. If it contains references to other objects, those references are released in turn, so a whole subgraph can collapse in one cascade.

Nothing here is a background task. There is no collector pause, no allocation threshold, no scan. Rebinding a name decrements a count, and if that count hits zero the deallocator runs synchronously, inside the same bytecode instruction. This is the property that makes the idiom `open(path).read()` close its file at end of expression in CPython, and the property that makes that idiom a bug on any implementation that does not refcount.

> [!warning] Deallocation runs user code, at an arbitrary point
> The documentation attaches an explicit warning to `Py_DECREF`: the deallocation function can cause arbitrary Python code to be invoked, for example when a class instance with a `__del__` method is deallocated. While exceptions in such code are not propagated, the executed code has free access to all Python global variables. The consequence is a rule that reads like interrupt discipline: any object that is reachable from a global variable should be in a consistent state before `Py_DECREF` is invoked. Update the data structure first, then drop the reference. A `__del__` that observes a half-updated container is not a race, it is a reentrancy bug written into the ownership protocol.

## The count is not always the truth

Two later changes broke the naive reading of the header. Immortality came first: `Py_REFCNT` warns that some objects are immortal and have a very high refcount that does not reflect the actual number of references, so callers must not rely on the value being accurate other than a value of 0 or 1. `None`, `True`, small integers, and interned strings never die, and touching their counts is pure overhead. Skipping the update on those objects avoids writing to shared cache lines from every thread, which is directly relevant to [[cs/systems/cache-coherence|coherence traffic]] on a multicore machine.

The second is the free-threaded build, where a count of 1 no longer proves exclusivity. The docs say so directly: on free-threaded builds, returning 1 is not sufficient to determine if it is safe to treat an object as having no access by other threads. The refcount stopped being a simple integer and became a protocol with special values and thread-local pieces, which is the topic of [[cs/languages/Python/free-threading-and-the-end-of-the-gil|removing the GIL]].

## Cycles, and the collector that exists because of them

Reference counting has one structural blind spot. A list that contains itself, or two objects that point at each other, keeps every count above zero forever even when nothing else can reach them. Counting is local, and reachability is global. No local rule can detect that.

CPython's answer is a second mechanism that runs alongside the first rather than replacing it. The `gc` module documentation frames it exactly that way: it provides an interface to the optional garbage collector, and since the collector supplements the reference counting already used in Python, you can disable the collector if you are sure your program does not create reference cycles. Two words carry the design. "Optional" means the program still frees almost everything without it. "Supplements" means it is not the primary mechanism, it is the patch over counting's one hole.

That collector is generational, classifying objects into three generations depending on how many collection sweeps they have survived: new objects are placed in the youngest generation, and if an object survives a collection it is moved into the next older generation. It also does not watch everything. Instances of non-atomic types, meaning containers and user-defined objects, are tracked, while atomic values are not. An integer cannot point at anything, so it can never be part of a cycle and never needs tracing. This is a hybrid nobody would design from scratch: immediate freeing for the common case, periodic tracing for the case counting cannot see. The comparison with a pure tracing collector is instructive, because Go pays a concurrent marking cost on everything and gets cycles for free, while CPython pays a counter update on every pointer copy and still needs a tracer.

> [!example] Where the cost actually lands
> Refcounting's overhead is not the memory for the counter, it is that every pointer assignment is a write. Passing an object to a function, appending it to a list, and storing it in an attribute each dirty a cache line that other code may be reading. A tracing collector touches an object once per cycle of collection; a refcounting one touches it once per reference operation. This is the reverse of the usual [[cs/systems/memory-hierarchy-and-caching|locality]] intuition, where the "simple" scheme turns out to be the one generating constant traffic.

## Why the model constrains the interpreter

The header is baked into the ABI. Extension modules written in C are compiled against a struct layout and against macros that increment and decrement counts inline, so millions of lines of third-party code depend on the exact representation. Changing what an object is means recompiling the world, which is why proposals to alter object layout arrive with multi-release transition plans and why the [[cs/languages/Python/the-c-api-and-extension-modules|C API is a design constraint on the language]] rather than an implementation detail. It is also why the free-threading work had to keep refcounting and make it thread-safe instead of switching to tracing, which would have been the cleaner design starting from nothing.

## Related Notes

- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - the general problem, and where refcounting sits among the answers
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - the cross-language comparison of ownership strategies
- [[cs/languages/Python/free-threading-and-the-end-of-the-gil|Free Threading and the End of the GIL]] - what making these counters thread-safe required
- [[cs/languages/Python/the-c-api-and-extension-modules|The C API and Extension Modules]] - why the object header cannot simply be redesigned
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - what "lives on the heap" costs when every value is an allocation
- [[cs/languages/Python/slots-and-instance-layout|Slots and Instance Layout]] - what sits after the header in an ordinary instance

## Sources

- "Introduction," Python/C API Reference Manual. https://docs.python.org/3/c-api/intro.html . Supports `PyObject *` as the uniform opaque representation and the rationale for a single C type; objects living on the heap with no automatic or static declarations; the definition and motivation of the reference count; and deallocation when the last strong reference is released.
- "Reference Counting," Python/C API Reference Manual. https://docs.python.org/3/c-api/refcounting.html . Supports immortal objects carrying inaccurate high refcounts and the guidance not to rely on the value; the free-threaded caveat that a count of 1 does not prove exclusive access; and the warning that deallocation can invoke arbitrary Python code with access to globals, with the consistent-state rule that follows.
- "gc - Garbage Collector interface," Python Standard Library. https://docs.python.org/3/library/gc.html . Supports the collector being optional, supplementing reference counting, and being safely disableable in programs that create no reference cycles; the three-generation classification and promotion on survival; and the tracking of non-atomic container and user-defined objects.
