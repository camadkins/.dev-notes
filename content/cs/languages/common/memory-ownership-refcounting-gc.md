---
title: Who Frees the Memory
description: Four answers to one unavoidable question. Manual freeing, RAII in C++, reference counting in Python, and compile-time ownership in Rust, and what each one buys and costs.
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-07-22
updated:
aliases: []
---

Every program that puts data on the heap eventually has to take it back off. Free too early and a later access reads freed memory. Free too late, or never, and the program leaks until it dies. Free twice and the allocator's bookkeeping corrupts. The question "who frees this, and when" has exactly one correct answer per allocation, and getting it wrong is the source of most of the memory-corruption bugs that show up in security advisories. Rust, C++, and Python each answer the question differently, and the difference is not a detail. It shapes the whole feel of the language.

The theory of automatic reclamation lives in [[cs/pl/garbage-collection-concepts|garbage collection concepts]] and the [[cs/pl/gc-algorithms-mark-sweep-copying-generational|mark-sweep, copying, and generational algorithms]] that implement it. This note is about the concrete decision each language made, read side by side.

> [!note] The idea
> There are four common answers to "who frees the memory": free it by hand, tie it to a scope (RAII), count the references and free at zero (reference counting), or trace what is still reachable and collect the rest (tracing GC). Each moves the work to a different place: onto the programmer, onto the type system, onto every assignment, or onto a runtime collector. You cannot escape the cost, you can only choose where it lands.

## Manual: you free it, and you get it wrong

The C answer is that the programmer frees the memory, explicitly, with `free`. Total control, total responsibility. Every allocation must have exactly one matching deallocation on every path, including the error paths, and the compiler will not help you. This is where use-after-free, double-free, and leaks come from, covered from the data-structure side in [[cs/dsa/dynamic-memory-allocation|dynamic memory allocation]]. Manual management is fast and predictable, and it is why a buffer overflow in a C program could halt a tenth of the internet, as it did in the [[cs/military-computing/morris-worm-and-buffer-overflows|Morris worm]].

## RAII: C++ ties the free to a scope

C++ keeps manual allocation available but adds a discipline that automates the matching free: Resource Acquisition Is Initialization. A resource is owned by an object; the object's destructor releases it; the destructor runs automatically when the object leaves scope. Bind the allocation to a stack object and the free happens on the way out, on every path, including the one an exception takes.

The C++ Core Guidelines push this hard. Their resource rules say do not leak any resources, replace owners with standard-library resource handles, and avoid naked `new` and `delete`. Ownership is expressed in the type: a `unique_ptr<T>` owns its object and frees it when destroyed, and a `shared_ptr<T>` shares ownership among holders. The guidelines note that RAII combined with the lifetime-safety rules eliminates the need for garbage collection. The cost is that the discipline is a convention the compiler mostly does not enforce; a raw pointer next to a `unique_ptr` can still outlive what it points at.

## Reference counting: Python frees at zero

CPython takes the count-the-references answer. Every Python object carries a reference count. The C API manipulates it explicitly with `Py_INCREF` to take a reference and `Py_DECREF` to release one, and when the last strong reference is released and the count becomes zero, the object is deallocated and its own references are released in turn. Reclamation is immediate and deterministic: the object dies the moment nothing points to it.

Reference counting has one hole it cannot patch on its own. Two objects that point at each other keep each other's count above zero even when nothing else can reach them, so the pair leaks. That is why CPython ships an optional cyclic garbage collector; as its documentation puts it, the collector supplements the reference counting already used in Python, existing specifically to find and free reference cycles. Python therefore runs both mechanisms at once: counting for the common case, tracing for the cycles. The cost is that every assignment touches a counter, which is work the other languages do not do, and the counter updates are part of why the interpreter holds a global lock.

## Compile-time ownership: Rust proves it at build time

Rust's answer is the newest and the most different in kind. Instead of a runtime mechanism, it makes ownership a property the compiler checks. The Rust Book states the rules directly: each value has an owner, there can be only one owner at a time, and when the owner goes out of scope the value is dropped. Assigning heap data to a new variable moves ownership and invalidates the original, so there is never more than one owner to free it. When the owner leaves scope the compiler inserts the call to `drop`, the same idea as a C++ destructor, decided statically.

The payoff is memory safety with no garbage collector and, in the Book's words, none of the ownership features slowing the program at run time. The count moves from run time to compile time. The cost is that the programmer must satisfy the borrow checker, which rejects patterns it cannot prove safe, and shared ownership that outlives a single scope needs an explicit reference-counted pointer, `Rc` for single-threaded and `Arc` for shared-across-threads, which brings Python's runtime counting back for exactly the cases that need it.

> [!warning] The four are not ranked
> RAII, reference counting, and tracing GC are points on a spectrum from compile-time reasoning to runtime enforcement, not a quality ladder. A hard-real-time flight controller cannot tolerate an unpredictable collector pause and leans toward manual or ownership models; a scripting layer values the programmer's time more than the counter updates and takes reference counting gladly. The right answer depends on what the program cannot afford to spend.

## Why this is a security question

The reason to care beyond taste is that the manual and RAII answers put the burden on the programmer, and programmers miss cases. Use-after-free and buffer overflows in C and C++ underlie a large share of exploited vulnerabilities, which is why CISA and the NSA, with international partners, now urge vendors to adopt memory-safe languages or publish a memory-safety roadmap. The push toward Rust in new systems and security-critical code is the same argument as this note, made at national scale: choosing where the free-the-memory work lands is choosing how many memory-corruption bugs ship.

## Related Notes

- [[cs/pl/garbage-collection-concepts|Garbage Collection Concepts]] - the theory of approximating liveness by reachability that the tracing answer rests on
- [[cs/pl/gc-algorithms-mark-sweep-copying-generational|GC Algorithms]] - how tracing collectors actually reclaim, and the throughput and pause tradeoffs
- [[cs/dsa/dynamic-memory-allocation|Dynamic Memory Allocation]] - the heap, ownership discipline, and the leak/double-free/use-after-free failure modes from the data-structure side
- [[cs/military-computing/morris-worm-and-buffer-overflows|The Morris Worm and Buffer Overflows]] - what a single memory-safety bug in C did to the early internet
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - why use-after-free in C++ is more than a bug, it is undefined behavior the compiler may assume never happens

## Sources

- "What Is Ownership?", The Rust Programming Language (official book). https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html . Supports the three ownership rules (each value has one owner, one owner at a time, dropped when the owner goes out of scope), move semantics invalidating the original variable, `drop` being called automatically at end of scope, and memory safety with no garbage collector and no runtime slowdown.
- "C++ Core Guidelines," isocpp.github.io (Stroustrup and Sutter, eds.). https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports the RAII resource rules: do not leak resources, replace owners with standard-library resource handles, avoid naked `new`/`delete`, use `unique_ptr<T>` for unique ownership and `shared_ptr<T>` for shared ownership, and that RAII plus lifetime safety removes the need for garbage collection.
- "Introduction," Python/C API Reference Manual. https://docs.python.org/3/c-api/intro.html . Supports every Python object having a reference count, `Py_INCREF`/`Py_DECREF` adjusting it explicitly, and the object being deallocated when the last strong reference is released and the count reaches zero.
- "gc - Garbage Collector interface," Python Standard Library. https://docs.python.org/3/library/gc.html . Supports the cyclic collector being optional and supplementing the reference counting already used in Python, existing to reclaim reference cycles that counting alone cannot free.
- "The Case for Memory Safe Roadmaps," CISA. https://www.cisa.gov/resources-tools/resources/case-memory-safe-roadmaps . Supports CISA and the NSA, with international partners, urging software manufacturers to adopt memory-safe languages or publish a memory-safety roadmap to reduce memory-corruption vulnerabilities.
