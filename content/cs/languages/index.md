---
title: Programming Languages
description: Where language theory meets concrete languages. One question, generics, answered five structurally different ways across nine languages, with the comparative layer in the common cluster.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2025-10-16
updated: 2026-08-21
aliases: []
---

Universal language theory lives in [[cs/pl/index|Programming Language Concepts]]: grammars, semantics, type soundness, garbage collection as an idea. This section is where that theory meets a running compiler and a real toolchain. The interesting content is rarely inside any one language. It is in the deltas between them, the different answers nine languages give to the same unavoidable question, and the engineering consequence of each answer.

The question the section is organized around is generics. Every language here has to let you write code once and use it at many types, and there are only so many ways to do that. **Monomorphize**, and emit a separate copy per type: Rust and C++, paying in binary size and compile time. **Erase**, and let one copy serve every type: Java for compatibility with code written before generics existed, TypeScript because the runtime was never told about types at all, Python because the annotations exist for a checker that runs before the program does. **Reify**, and teach the runtime about type arguments: C#, which is why almost nothing Java forbids is forbidden there. **Quantize**, and emit one copy per memory shape with a dictionary for the rest: Go, after twelve years of refusing to pick. Or **decline the whole premise** and solve the problem without a static type system: Racket does it with runtime contracts and macros, and Ansible has no generics at all because it has no types, no functions, and no compile step.

Five answers is the whole axis, and every other concern in a language folder hangs off it: what the compiler must do, what the runtime must keep, where the leaks are, and what the tooling costs. The comparison itself lives in the [[cs/languages/common/index|Common Concerns]] cluster, which reads one cross-cutting engineering problem at a time across several languages with the tradeoff named. Each language folder has a curated index that maps its own arc.

### The comparative layer

- [[cs/languages/common/index|Common Concerns]] - memory, the C ABI, wire formats, undefined behavior, concurrency, and modules, read across languages
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the hub note for the axis above, and a good first stop

### The languages

- [[cs/languages/Rust/index|Rust]] - monomorphization, with the safety proof carried by the same generic system
- [[cs/languages/Cpp/index|C++]] - templates as compile-time substitution, and a twenty-year arc to constraining them
- [[cs/languages/Java/index|Java]] - erasure for migration compatibility, and every restriction that follows from it
- [[cs/languages/CSharp/index|C#]] - reification in the CLR, and what keeping the type arguments costs
- [[cs/languages/Go/index|Go]] - twelve years of refusal, then GC shape stenciling and dictionaries
- [[cs/languages/TypeScript/index|TypeScript]] - generics as type-level computation over a structural system that erases by construction
- [[cs/languages/Python/index|Python]] - gradual typing, where annotations are live objects nothing enforces
- [[cs/languages/Racket/index|Racket]] - polymorphism through runtime contracts and macros, with no static checker required
- [[cs/languages/Ansible/index|Ansible]] - the language with no generics, and what does the work instead

---

*Language folders and their contents are listed automatically below by Quartz.*
