---
title: The C API and Extension Modules
description: "Ownership rules with no compiler to check them, a Limited API that trades speed for portability, and why an interface designed for convenience became the hardest constraint on the interpreter."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-17
updated:
aliases: []
---

NumPy, SciPy, lxml, cryptography, and every database driver that matters are C or C++ underneath. The interface they use is not an FFI in the usual sense, where a foreign function is called across a boundary. It is the interpreter's own internals, exposed. An extension module manipulates the same `PyObject` pointers the eval loop does, adjusts the same reference counts, and can reach into structures the interpreter uses to run your program. That is why Python's numerical ecosystem exists, and it is also why the interpreter cannot easily change.

> [!note] The idea
> Python's C API made the language's greatest strength and its heaviest constraint from a single decision: expose the implementation instead of an abstraction over it. Extensions gained direct access and near-zero call overhead. In exchange, every observable detail of CPython's object representation became load-bearing across an ecosystem CPython does not control, so [[cs/languages/common/c-abi-and-ffi|the ABI]] rather than the language specification became the thing that cannot break.

## Ownership without a checker

The API's central discipline is manual reference management, and its vocabulary is precise. When a function passes ownership of a reference on to its caller, the caller is said to receive a new reference. When no ownership is transferred, the caller is said to borrow the reference, and nothing needs to be done for a borrowed reference.

Borrowing is the fast path and the sharp edge. A borrowed reference is only valid while the owner still holds it, and the rule for promoting one is explicit: only when such a borrowed reference must be stored or passed on must it be turned into an owned reference by calling `Py_INCREF`. There is a third case that inverts the direction. Stealing a reference means that when you pass a reference to a function, that function assumes that it now owns that reference, so the caller must not use it afterward. Few functions steal references, which is exactly what makes the exceptions dangerous: an irregular rule applied by a handful of APIs is the kind of thing a programmer forgets.

None of this is checked. There is no borrow checker, no type distinction between an owned and a borrowed `PyObject *`, no compiler diagnostic. The C compiler sees one pointer type for both. Compare ownership in Rust, where new, borrowed, and stolen are three distinct types the compiler enforces, and the entire class of bug below is unrepresentable.

> [!warning] The failure mode has a name in the docs
> The tutorial devotes a section titled "Thin Ice" to it: there are a few situations where seemingly harmless use of a borrowed reference can lead to problems, and these all have to do with implicit invocations of the interpreter, which can cause the owner of a reference to dispose of it. The canonical bug borrows an item from a list, then replaces a different element of that same list, which drops a reference and can [[cs/languages/Python/cpython-object-model-and-reference-counting|run a destructor]] that frees the borrowed item. The borrowed pointer is now dangling, and the next use is a [[cs/security/use-after-free-and-heap-exploitation|use-after-free]] in a process running interpreted code. The dangerous line is not the one that crashes; it is the innocuous-looking call in between that gave the interpreter a chance to run.

## The ABI is the real interface

The documentation states the compatibility guarantee in terms of binaries, not source. CPython's Application Binary Interface is forward- and backwards-compatible across a minor release, so code compiled for Python 3.10.0 will work on 3.10.8 and vice versa, but will need to be compiled separately for 3.9.x and 3.11.x.

That single sentence explains the shape of Python packaging. Every compiled extension must be built once per minor version per platform per architecture, which is why a project publishes dozens of wheels per release, why a new Python version arrives before the ecosystem can use it, and why installing anything nontrivial used to mean waiting for a compiler.

The escape is the Limited API. Python 3.2 introduced the Limited API, a subset of Python's C API, and extensions that only use it can be compiled once and be loaded on multiple versions of Python. The mechanism behind that promise is a deliberate refusal to inline. All functions in the Stable ABI are present as functions in Python's shared library, not solely as macros, which also makes them usable from languages that do not use the C preprocessor. Real function calls can be redirected by the dynamic loader; macros are compiled into the extension and freeze whatever layout they assumed.

The price is stated as plainly. The goal for the Limited API is to allow everything that is possible with the full C API, but possibly with a performance penalty. `PyList_GetItem` is available while its unsafe macro variant `PyList_GET_ITEM` is not, because the macro can be faster since it can rely on version-specific implementation details of the list object. Opting in disables inlining, allowing stability as Python's data structures are improved, but possibly reducing performance. Fast and frozen, or slower and portable, and the tradeoff is between call overhead and being recompiled forever.

> [!example] Nobody verifies your claim
> On some platforms Python looks for and loads shared libraries named with the `abi3` tag, and it does not check whether such extensions conform to a Stable ABI. The user or their packaging tools must ensure that, for example, extensions built with the 3.10 or later Limited API are not installed for lower versions. The tag is an assertion by the builder, checked by nothing at load time. This is the same shape as an [[cs/security/subresource-integrity|integrity claim nobody validates]]: the filename says compatible, the loader believes it, and a mismatch surfaces as a segfault rather than an ImportError.

## Why the API constrains the language

An interface exposing implementation details converts those details into a contract. `Py_INCREF` and `Py_DECREF` were macros operating directly on a field in the object header, so the header's layout became part of the ABI. Extensions hold raw pointers into containers, so container layouts became part of the ABI. The GIL guaranteed that extension code ran without data races on interpreter state, so the *absence of concurrency* became part of the contract, an invariant thousands of C extensions relied on without ever naming it.

That last one is the expensive case. [[cs/languages/Python/free-threading-and-the-end-of-the-gil|Removing the GIL]] was not primarily an interpreter problem; it was a compatibility problem, because every extension assuming single-threaded access to Python objects had to be audited or fenced off. The same pattern recurs everywhere the interpreter wants to improve: change the object header and every extension needs recompiling, change dictionary internals and code reaching into `ma_keys` breaks, introduce moving garbage collection and every stored raw pointer is invalid.

CPython's answer has been a slow narrowing. Publish a Limited API, deprecate direct struct access, add accessor functions for fields that used to be macros, and push the ecosystem toward the subset the implementation is willing to guarantee. Alternatives took different routes: PyPy emulates the C API and pays for it in speed, since the emulation contradicts its own object model, while newer projects prefer PyO3 or `ctypes` and `cffi`, which sit on the platform's C ABI rather than on the interpreter's internals.

The historical lesson is worth extracting from the mechanics. An API designed to be maximally convenient for callers, by giving them everything, becomes maximally expensive for the implementer, by promising everything. Python got its scientific stack because writing an extension was easy, and it got a decade-long transition plan for every internal change for the same reason. Both facts have the same cause.

## Related Notes

- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the alternative of binding at the platform ABI instead of the interpreter's internals
- [[cs/languages/Python/cpython-object-model-and-reference-counting|CPython's Object Model and Reference Counting]] - the header and counting rules extensions manipulate directly
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - the same borrowed, owned, and moved distinction, enforced by a compiler
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - what a dangling borrowed reference becomes in a hostile process
- [[cs/languages/Python/free-threading-and-the-end-of-the-gil|Free Threading and the End of the GIL]] - the compatibility cost of an invariant nobody wrote down
- [[cs/security/subresource-integrity|Subresource Integrity]] - an artifact whose compatibility tag nobody verifies at load time

## Sources

- "C API Stability," Python/C API Reference Manual. https://docs.python.org/3/c-api/stable.html . Supports the ABI being compatible across a minor release but requiring separate compilation per minor version; the Limited API being introduced in 3.2 as a subset allowing one compilation to load on multiple versions; Stable ABI symbols being real functions rather than macros; the `abi3` tag being loaded without conformance checking and the resulting user responsibility; and the Limited API's goal of full capability with a possible performance penalty, including the `PyList_GET_ITEM` example and the disabling of inlining.
- "Introduction," Python/C API Reference Manual. https://docs.python.org/3/c-api/intro.html . Supports the definitions of receiving a new reference, borrowing a reference with nothing to be done, and stealing a reference with the caller forbidden from further use, plus the note that few functions steal references.
- "Extending Python with C or C++," Extending and Embedding the Python Interpreter. https://docs.python.org/3/extending/extending.html . Supports the rule that a borrowed reference must be converted with `Py_INCREF` before being stored or passed on, and the "Thin Ice" warning that borrowed references fail around implicit invocations of the interpreter that let the owner dispose of the reference.
