---
title: C++
description: Landing page for C++. RAII, templates, and the undefined-behavior contract, seen through the cross-language comparative notes.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-07-22
updated:
aliases:
  - Cpp
  - C++
---

C++ gives the programmer manual control over memory and machine representation, then hands back safety through library and language conventions rather than a checker: RAII ties resource lifetime to scope, smart pointers encode ownership in the type, and templates generate specialized code at compile time. The cost of that control is a large surface of undefined behavior, where the standard declines to say what happens and the compiler is free to assume it never occurs.

C++-specific study collects here.

### Core mechanisms

- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - resource life cycle bound to object lifetime, and what the standard promises about scope exit
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - value categories, `std::move` as a cast, and the moved-from state
- [[cs/languages/Cpp/smart-pointers|Smart Pointers in C++]] - `unique_ptr`, `shared_ptr`, `weak_ptr`, the control block, and the cycle leak
- [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] - the special member functions as a matched set
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - instantiation as code generation, and C++20 concepts
- [[cs/languages/Cpp/const-correctness|Const Correctness]] - cv-qualifiers, const member functions, `mutable`, and why constness is not transitive
- [[cs/languages/Cpp/lambdas-and-captures|Lambdas and Captures]] - the closure type as a class, capture by copy and reference, and the `[=]` trap

### The standard library

- [[cs/languages/Cpp/stl-containers|STL Containers]] - the three categories, the invalidation contracts, and choosing between them
- [[cs/languages/Cpp/iterators-and-ranges|Iterators and Ranges]] - iterator categories, the half-open range, and what C++20 sentinels changed
- [[cs/languages/Cpp/stl-algorithms|STL Algorithms]] - the algorithm/container seam, and the names worth knowing

### Cross-cutting

The comparative notes, read from C++'s angle:

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - RAII, `unique_ptr`, and `shared_ptr` reference counting
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - `extern "C"`, name mangling, and why C++ exports through a C door
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - signed overflow, aliasing, and the optimization license
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - struct packing, endianness, and why a raw memcpy of a struct to the wire breaks

---

*Any pages placed under this folder are auto-listed below by Quartz.*
