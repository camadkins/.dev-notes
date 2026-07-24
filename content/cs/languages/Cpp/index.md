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

C++-specific study collects here. The substance lives in the comparative notes, read from C++'s angle:

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - RAII, `unique_ptr`, and `shared_ptr` reference counting
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - `extern "C"`, name mangling, and why C++ exports through a C door
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - signed overflow, aliasing, and the optimization license
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - struct packing, endianness, and why a raw memcpy of a struct to the wire breaks

---

*Any pages placed under this folder are auto-listed below by Quartz.*
