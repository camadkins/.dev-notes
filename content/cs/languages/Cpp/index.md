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

It is also the oldest generics system in this section, and the strangest. A template is not a generic type. It is a compile-time substitution mechanism that turned out to be Turing complete by accident, grew an entire style of type-level programming out of a defensive rule about failed deduction, and then spent twenty years acquiring a way to say what a parameter is supposed to be. The folder follows that arc, from what substitution actually does, through the overload-resolution machinery it turned into, to concepts.

### Object lifetime and the value model

The half of C++ that is not templates. Read it first; the template notes assume it.

- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - resource life cycle bound to object lifetime, and what the standard promises about scope exit
- [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] - the special member functions as a matched set, and the suppression rules that turn one destructor into copies everywhere
- [[cs/languages/Cpp/value-categories-lvalue-xvalue-prvalue|Value Categories: lvalue, xvalue, prvalue]] - three categories from two independent yes-or-no questions, and what overload resolution actually sees
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - `std::move` as a cast, and how much you may assume about a moved-from object
- [[cs/languages/Cpp/const-correctness|Const Correctness]] - cv-qualifiers, const member functions, and why constness is not transitive
- [[cs/languages/Cpp/smart-pointers|Smart Pointers in C++]] - the control block, the two counts, the cycle leak, and the asymmetry between unique and shared
- [[cs/languages/Cpp/lambdas-and-captures|Lambdas and Captures]] - the closure type as an ordinary unnamed class, and the `[=]` trap

### What a template actually is

Substitution, not parameterization. Every surprise in the next two sections comes from this one.

- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - instantiation as code generation, and why template libraries are header-only
- [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|Template Instantiation and the Two-Phase Rule]] - what is checked at the definition, what waits for the use, and why they can disagree silently
- [[cs/languages/Cpp/dependent-names-and-the-typename-keyword|Dependent Names and the typename Keyword]] - the same tokens parsing two ways, because the parser cannot know yet
- [[cs/languages/Cpp/template-argument-deduction-and-ctad|Template Argument Deduction and CTAD]] - what the compiler matches, the positions it refuses to look at, and the C++17 extension to class templates
- [[cs/languages/Cpp/argument-dependent-lookup|Argument-Dependent Lookup]] - a type's namespace becoming part of its interface, and every unqualified call inside a template becoming an extension point
- [[cs/languages/Cpp/templates-code-bloat-and-link-time|Templates, Code Bloat, and Link Time]] - one instantiation per argument list, emitted everywhere and merged at link time

### Choosing an implementation

Generic programming in C++98 had no way to ask a question about a type, so it built one out of overload resolution.

- [[cs/languages/Cpp/template-specialization-full-and-partial|Template Specialization, Full and Partial]] - the partial order that decides which one applies, and why functions get overloading instead
- [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE and enable_if]] - a defensive rule about failed deduction becoming the only question-asking mechanism available
- [[cs/languages/Cpp/type-traits-and-tag-dispatch|Type Traits and Tag Dispatch]] - turning the answer into a function argument so overload resolution can branch on it
- [[cs/languages/Cpp/variadic-templates-and-parameter-packs|Variadic Templates and Parameter Packs]] - a pack as a syntactic entity, and what a fold expression replaced

### Constraining it

The twenty-year arc to saying what you meant.

- [[cs/languages/Cpp/concepts-and-requires-clauses|Concepts and requires Clauses]] - the payoff is that constraints are ordered, not merely checked
- [[cs/languages/Cpp/crtp-and-static-polymorphism|CRTP and Static Polymorphism]] - inheritance used to pass the derived type upward, and why C++23 made the trick unnecessary
- [[cs/languages/Cpp/constexpr-and-compile-time-computation|constexpr and Compile-Time Computation]] - may, must, and must not, and the arc from computing with types to running ordinary C++ early

### The standard library

- [[cs/languages/Cpp/stl-containers|STL Containers]] - the three categories, the invalidation contracts, and choosing between them
- [[cs/languages/Cpp/iterators-and-ranges|Iterators and Ranges]] - iterator categories, the half-open range, and what C++20 sentinels changed
- [[cs/languages/Cpp/stl-algorithms|STL Algorithms]] - the algorithm and container seam, and the names worth knowing
- [[cs/languages/Cpp/the-allocator-model|The Allocator Model]] - why putting the allocator in the container's type was the mistake, and what `pmr` moved to runtime

### Dispatch, failure, and concurrency

- [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|Virtual Dispatch, Vtables, and Object Layout]] - the hidden pointer the constructor writes, and what two loads plus a call cost
- [[cs/languages/Cpp/exceptions-and-stack-unwinding|Exceptions and Stack Unwinding]] - why RAII is load-bearing during unwinding, and where the zero-cost model sends the bill
- [[cs/languages/Cpp/coroutines-in-cpp|Coroutines in C++]] - the promise type as a protocol, and a mechanism shipped with no types to use it with
- [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|The C++ Memory Model and Atomics]] - what release and acquire promise about non-atomic writes, and what `seq_cst` costs

### The build model and the contract with the compiler

- [[cs/languages/Cpp/translation-units-linkage-and-the-build-model|Translation Units, Linkage, and the Build Model]] - nine phases, a header paid for once per source file, and the build times that follow
- [[cs/languages/Cpp/the-one-definition-rule|The One Definition Rule]] - what it requires, who is exempt, and why no diagnostic is required when you break it
- [[cs/languages/Cpp/modules-and-the-include-model|Modules and the Include Model]] - what a module unit replaces, and the ODR violations it makes diagnosable
- [[cs/languages/Cpp/how-compilers-exploit-undefined-behavior|How Compilers Exploit Undefined Behavior]] - the deleted null check, the assumed non-overflow, and why the surprising output is the correct one

### Read from the comparative layer

- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - RAII, `unique_ptr`, and `shared_ptr` reference counting
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - `extern "C"`, name mangling, and why C++ exports through a C door
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - signed overflow, aliasing, and the optimization license
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - templates as the most aggressive point on the axis
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - struct packing, endianness, and why a raw memcpy to the wire breaks

---

*Any pages placed under this folder are auto-listed below by Quartz.*
