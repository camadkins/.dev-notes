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

Python trades raw control for speed of expression. Objects are heap-allocated and managed by reference counting backed by a cycle collector, values carry their types at runtime, and the reference interpreter runs Python bytecode behind a global lock. Its performance-critical parts, and its bridges to the rest of the system, are written in C through a stable C API, which makes Python as much a glue language over compiled code as a language in its own right. The scientific-Python and machine-learning stack, from NumPy to PyTorch, is the canonical example: a thin Python surface over compiled C, C++, and CUDA, which is much of why Python became the lingua franca of [[cs/machine-learning/index|machine learning]].

Python-specific study collects here. The substance lives in the comparative notes, read from Python's angle:

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - CPython reference counting and the cycle collector
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the CPython C API, `ctypes`, and calling into native code
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - the `struct` module and packing bytes for the wire

---

*Any pages placed under this folder are auto-listed below by Quartz.*
