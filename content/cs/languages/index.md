---
title: Programming Languages
description: Where language theory meets concrete languages. A comparative layer on the concerns every real language must answer, read across Rust, C++, Python, and Ansible.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2025-10-16
updated: 2026-07-22
aliases: []
---

Universal language theory lives in [[cs/pl/index|Programming Language Concepts]]: grammars, semantics, type soundness, garbage collection as an idea. This section is where that theory meets a running compiler and a real toolchain. The interesting content is rarely inside any one language. It is in the deltas between them, the different answers Rust, C++, Python, and Ansible give to the same unavoidable question, and the engineering consequence of each answer.

So the organizing unit here is the concern, not the language. The [[cs/languages/common/index|Common Concerns]] cluster carries the substance: one cross-cutting engineering problem per note, shown several ways, with the tradeoff named. The per-language pages are thin landing spots that point into that cluster from a single language's angle.

### Common concerns

- [[cs/languages/common/index|Common Concerns]] - the comparative layer: memory, the C ABI, wire formats, undefined behavior, and more, across languages

### Languages

- [[cs/languages/Rust/index|Rust]] - ownership, zero-cost abstractions, and the `unsafe` boundary
- [[cs/languages/Cpp/index|C++]] - RAII, templates, and the undefined-behavior contract
- [[cs/languages/Python/index|Python]] - reference counting, the C API, and gradual typing
- [[cs/languages/Ansible/index|Ansible]] - declarative configuration as a language
- [[cs/languages/Racket/index|Racket]] - macro systems, desugaring, core-to-surface design

---

*Language folders and their contents are listed automatically below by Quartz.*
