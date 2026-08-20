---
title: Concurrency in Practice
description: The model taxonomy is theory; this is what real languages do. Python's global lock, Rust's Send and Sync as compile-time race prevention, and where each language puts the data-race problem.
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-07-22
updated:
aliases:
  - Concurrency in Practice
  - GIL
  - Send and Sync
---

The taxonomy of concurrency, threads and locks, actors, communicating sequential processes, lives in [[cs/pl/concurrency-models-threads-locks-and-actors|concurrency models]], and the operating system's side, how threads get scheduled and switched, is in [[cs/systems/processes-and-threads|processes and threads]]. This note sits between them, at the level where a working programmer actually meets concurrency: not "what is an actor" but "why can't my Python threads use all my cores," and "why does the Rust compiler reject this code that looks fine." The answers reveal a design decision each language made about the one hard problem underneath all concurrency, the data race.

A data race is two threads touching the same memory at the same time with at least one write and no synchronization. It is [[cs/languages/common/undefined-behavior-as-a-contract|undefined behavior]] in C and C++, and the source of the worst class of concurrency bugs, the ones that appear once a week under load and never in the debugger. Python, Rust, and C++ each decided differently where to put the burden of preventing it.

> [!note] The idea
> Every concurrent language must stop two threads from corrupting shared memory, and it can put that job in one of three places: on a runtime lock that serializes execution (Python's GIL), on the type system that rejects unsynchronized sharing at compile time (Rust's Send and Sync), or on the programmer's discipline with library primitives (C++ threads and mutexes). Where the burden lands determines what the language is good at and what it cannot do.

## Python: one lock, and the ways around it

CPython's answer is a single global lock. The Global Interpreter Lock is a mutex that protects access to Python objects, preventing more than one thread from executing Python bytecode at once. It exists for a reason rooted in the [[cs/languages/common/memory-ownership-refcounting-gc|reference counting]] that manages Python's memory: those per-object counts are not thread-safe, and without the lock two threads adjusting the same object's count would corrupt it. The GIL makes the interpreter's memory management safe by brute force.

The consequence is stark. Even on a many-core machine, a pure-Python program cannot run bytecode on two cores at once, so threads buy nothing for CPU-bound work. Python programmers route around this in two directions. For CPU-bound work they reach for multiprocessing, separate processes each with their own interpreter and lock, paying the cost of not sharing memory. For IO-bound work, where threads spend their time waiting rather than computing, they use threads (which release the GIL during blocking IO) or, increasingly, asyncio, which the standard library describes as a way to write concurrent code with async/await syntax, well suited to IO-bound and structured network code. asyncio is not threads at all: it is a single-threaded event loop doing cooperative multitasking, where a coroutine explicitly yields control at each `await` instead of being preempted. The GIL is irrelevant to it because there is only ever one thread.

## Rust: the type system rejects the race

Rust's answer is to make data races a compile error. Two marker traits carry the whole scheme. A type is `Send` if it is safe to move to another thread, and `Sync` if it is safe to share between threads by reference, defined precisely as `T` being `Sync` exactly when `&T` is `Send`. The compiler derives these automatically: a type built entirely of `Send` types is `Send`. The interesting cases are the exceptions. Raw pointers, `UnsafeCell`, and the single-threaded reference-counted `Rc` are deliberately not `Sync`, so the moment you try to share one across threads, the code does not compile.

This is why Rust markets "fearless concurrency." The same ownership system that gives [[cs/languages/common/memory-ownership-refcounting-gc|memory safety without a garbage collector]] gives race freedom for free: the borrow checker already forbids two mutable references to the same data, and `Send`/`Sync` extend that rule across thread boundaries. The cost is the same cost as the rest of Rust, that the compiler rejects patterns it cannot prove safe, and the price of sharing a counter across threads is paying explicitly for the atomic version, `Arc` instead of `Rc`. The burden moved from runtime to compile time, and the race that would surface once a week under load in C is instead a red squiggle before the program ever runs.

## C++: the primitives, and the discipline

C++ gives real OS threads and the full kit of synchronization primitives, mutexes, atomics, condition variables, and defines a memory model that says what concurrent access means. What it does not do is check that you used them correctly. A shared variable touched by two threads without a lock compiles cleanly and races at runtime, and because the standard makes a data race undefined behavior, the compiler is entitled to assume it never happens. C++ sits closest to the metal and closest to the hazard: maximum control, maximum performance, and the data-race burden squarely on the programmer, exactly as with [[cs/languages/common/undefined-behavior-as-a-contract|the rest of its undefined behavior]].

> [!warning] The GIL is a memory-safety mechanism, not a concurrency feature
> It is tempting to read the GIL as Python being lazy about parallelism. It is the opposite: the lock is the price of making non-thread-safe reference counting safe by default, a deliberate trade of multicore throughput for a simpler, safer object model. Rust reaches the same safety by making the type system do the work instead, which is why it needs no global lock and can use every core. Same problem, different place to pay.

## Related Notes

- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models]] - the theory of threads/locks, actors, and CSP that this note grounds in real languages
- [[cs/systems/processes-and-threads|Processes and Threads]] - the OS layer: how threads are scheduled, context-switched, and what a process actually is
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - why Python's reference counting forces the GIL, and why Rust's ownership gives race freedom for free
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - data races as undefined behavior in C and C++, and why the compiler assumes they never occur

## Sources

- "GlobalInterpreterLock," Python Wiki. https://wiki.python.org/moin/GlobalInterpreterLock . Supports the GIL being a mutex that protects access to Python objects and prevents multiple threads from executing Python bytecode at once, its existence because CPython's reference-counting memory management is not thread-safe, and the consequence that CPU-bound multithreading gets no true parallelism while IO-bound threads benefit because they release the GIL.
- "Send and Sync," The Rustonomicon. https://doc.rust-lang.org/nomicon/send-and-sync.html . Supports `Send` meaning safe to move to another thread, `Sync` meaning safe to share between threads with `T: Sync` iff `&T: Send`, the traits being auto-derived from component types, and raw pointers / `UnsafeCell` / `Rc` being the deliberate non-Send/Sync exceptions the compiler uses to reject unsynchronized sharing.
- "asyncio - Asynchronous I/O," Python Standard Library. https://docs.python.org/3/library/asyncio.html . Supports asyncio being a library for concurrent code using async/await, suited to IO-bound and structured network code, running a single-threaded event loop with cooperative multitasking via coroutines rather than OS threads.
