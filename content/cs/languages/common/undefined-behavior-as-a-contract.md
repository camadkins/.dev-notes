---
title: Undefined Behavior as a Contract
description: The standard's silence is the compiler's optimization license. Why C and C++ have undefined behavior, how the optimizer exploits it, and how Rust's unsafe draws the same line explicitly.
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-22
updated:
aliases:
  - Undefined Behavior
  - UB
  - The Compiler Contract
---

New systems programmers meet undefined behavior as a list of things not to do: do not overflow a signed integer, do not read past the end of an array, do not dereference a freed pointer. Read that way it looks like a set of bugs. It is something sharper. Undefined behavior is a term of art in the language standard with a precise meaning, and that meaning is a contract between the programmer and the compiler. The programmer promises never to do these things; in exchange, the compiler is allowed to assume they never happen and to optimize on that assumption. Understanding UB as a contract, rather than a list of hazards, is what turns baffling optimizer behavior into something predictable.

The scattered warnings across the garden, that [[cs/dsa/maths|signed overflow is undefined in C and C++]] while unsigned wraps, that out-of-bounds access and double-free are undefined, are all instances of one concept. This note names the concept.

> [!note] The idea
> A language standard sorts behavior into categories. When it labels something undefined, it imposes no requirements at all: the compiler may do anything, and crucially it may assume the situation never arises and delete the code paths that would handle it. Undefined behavior is not a runtime promise to crash. It is a compile-time license to optimize as if the program is always correct. Every "surprising" optimization around UB follows from taking the compiler at its word.

## Three categories, one important line

The C++ standard defines behavior in graded terms, and the distinctions matter. Undefined behavior is behavior for which the standard imposes no requirements. Unspecified behavior is behavior, for a valid program on correct data, that depends on the implementation, which need not document its choice. Implementation-defined behavior is the same except that the implementation must document what it does. The order of evaluation of certain subexpressions is unspecified; the size of an `int` is implementation-defined; signed overflow is undefined.

The line that carries the weight is the one around undefined. Unspecified and implementation-defined behavior still produce some real result within a bounded range. Undefined behavior imposes no requirements, so there is no range and no result to reason about. A program that executes one undefined operation has no defined meaning at all, not from that point forward, and in the compiler's model not before it either.

## The silence is the license

Why would a language leave common operations undefined instead of just defining them? For speed. As the LLVM project's account of C undefined behavior puts it, UB exists because the designers wanted an extremely efficient low-level language, and the compiler treats each undefined case as a promise it will never occur. That promise is worth a great deal to an optimizer.

The examples are concrete. Because signed overflow is undefined, the compiler may simplify `x + 1 > x` to `true` and `x * 2 / 2` to `x`, and it may assume a loop counter never wraps, which lets it prove a loop runs a fixed number of times and unroll or vectorize it. Because dereferencing a null pointer is undefined and specifically not defined to trap, the compiler may assume a pointer it later dereferences was non-null all along, and delete an earlier null check as dead code. Because reading through a mismatched pointer type is undefined, type-based alias analysis may assume two pointers of different types never overlap and rewrite a loop into a single `memset`. None of these are bugs in the compiler. Each is the compiler collecting on the contract: you promised no UB, so this optimization cannot change a correct program's meaning.

The unsettling consequence is that undefined behavior can appear to reach backward. If a later statement is undefined when a pointer is null, the compiler may conclude the pointer was never null and remove a safety check that ran earlier. Code that "looks like it checks" can be optimized away because a downstream UB told the compiler the check was unnecessary.

## Rust draws the same line, and names it

Rust does not abolish undefined behavior. It cannot; at the bottom, safe abstractions rest on operations that are only conditionally valid. What Rust does is move the line into the open with the `unsafe` keyword. Safe Rust is checked so that it cannot cause UB. `unsafe` marks the regions where the compiler stops checking and the programmer takes over the obligation.

The Rust Reference is explicit that this is a shift of responsibility, not a suspension of the rule. Its list of undefined behavior, data races, dereferencing dangling or misaligned pointers, breaking the aliasing rules that `&T` and `&mut T` encode, producing an invalid value such as a `bool` that is not 0 or 1, applies inside `unsafe` blocks exactly as outside them. As the reference states, `unsafe` only means avoiding undefined behavior is on the programmer; Rust programs must never cause it. Code that upholds this is called sound, and code that lets safe callers trigger UB is unsound. This is the same contract C and C++ have always had, with the boundary made syntactically visible: in C the whole program is one unmarked `unsafe` block, and in Rust the dangerous regions are labeled so the reader knows exactly where the guarantees lapse.

## The languages that decline to sign

Not every language offers this contract. Memory-safe managed languages define behavior for the operations C leaves open: an out-of-bounds index in Python raises an exception rather than reading arbitrary memory, and there is no signed-overflow trap to reason around because the runtime, not the programmer, guarantees the result. Their users never sign the UB contract at all, which is exactly why CISA and the NSA count Python, along with Rust, Go, Java, Swift, C#, and JavaScript, among the memory-safe languages they urge for new development. The tradeoff is the mirror of C's bargain: the runtime checks that close the undefined gaps cost the cycles C spends nowhere. UB is the price of the compiler's silence, and safety is the price of the runtime's vigilance.

> [!warning] UB is not a crash you can rely on
> The tempting mental model is that undefined behavior means the program will crash or misbehave at that spot. It does not. The standard imposes no requirements, so a program with UB may appear to work, work until a compiler upgrade changes an optimization, or corrupt data far from the offending line. This is why UB is a security problem: the [[cs/military-computing/morris-worm-and-buffer-overflows|buffer overflow]] that seems harmless in testing is undefined behavior an attacker can steer, and the compiler's assumption that it never happens is exactly what removes the guardrails.

## Related Notes

- [[cs/dsa/maths|Mathematics for Programmers]] - signed overflow as undefined behavior versus unsigned wraparound, and why the compiler can optimize around it
- [[cs/military-computing/morris-worm-and-buffer-overflows|The Morris Worm and Buffer Overflows]] - undefined behavior in C turned into a self-propagating exploit
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - use-after-free and double-free as undefined behavior, and the memory models that prevent them
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the boundary where a language's safety guarantees lapse and UB obligations pass to the programmer

## Sources

- "Undefined behavior," definitions from the Working Draft, Standard for C++ ([intro.defs], eel.is mirror). https://eel.is/c++draft/intro.defs . Supports the definitions: undefined behavior is behavior for which the standard imposes no requirements; unspecified behavior depends on the implementation and need not be documented; implementation-defined behavior depends on the implementation and must be documented.
- Chris Lattner, "What Every C Programmer Should Know About Undefined Behavior," LLVM Project Blog. https://blog.llvm.org/2011/05/what-every-c-programmer-should-know.html . Supports UB existing for low-level efficiency, the compiler assuming UB never occurs and optimizing on that assumption, and the concrete examples: signed-overflow simplifications and loop assumptions, null dereference being undefined and not defined to trap (enabling removal of null checks), and type-based alias analysis rewriting a loop into a memset.
- "Behavior considered undefined," The Rust Reference. https://doc.rust-lang.org/reference/behavior-considered-undefined.html . Supports the Rust UB list (data races, dangling/misaligned pointer access, breaking the `&T`/`&mut T` aliasing rules, producing invalid values), that this applies inside `unsafe` code, that `unsafe` only shifts the obligation onto the programmer rather than permitting UB, and the sound/unsound terminology.
- "The Case for Memory Safe Roadmaps," CISA. https://www.cisa.gov/resources-tools/resources/case-memory-safe-roadmaps . Supports CISA and the NSA counting Python, Rust, Go, Java, Swift, C#, and JavaScript among the memory-safe languages recommended for new development in place of memory-unsafe C and C++.
