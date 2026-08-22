---
title: Coroutines & Generators
description: "Functions whose execution you can pause: what a coroutine is, how stackful and stackless implementations differ, and why async/await is a compiler transform rather than a runtime feature."
draft: false
comments: true
tags:
  - cs
  - pl
  - concurrency
date: 2026-07-08
updated:
aliases:
  - Coroutines
  - Generators
  - "async/await"
  - Stackful vs Stackless
---

A subroutine begins at the start, runs, and finishes. It returns exactly once and holds no state between invocations. Nearly every control abstraction people complain about writing by hand, iterators, state machines, event loops, pipelines, is a workaround for that one restriction.

Coroutines remove it. They are program components that can be suspended and resumed, generalizing subroutines, for cooperative multitasking, and they have been described as "functions whose execution you can pause."

> [!note] The idea
> Suspension is not a scheduling feature, it is a **representation** question. A coroutine must preserve where it stopped and everything live at that point, so the design axis that decides everything else is where that state lives: a real stack the implementation switches to (stackful) or a compiler-generated object holding the locals and a resume point (stackless). Async/await is the second answer with syntax on top, which is why it can be added to a language whose runtime the designers do not control.

## Two properties and three choices

There is no single precise definition of coroutine. In 1980 Christopher D. Marlin summarized two widely acknowledged fundamental characteristics: the values of data local to a coroutine persist between successive calls, and the execution of a coroutine is suspended as control leaves it, only to carry on where it left off when control re-enters at some later stage.

Beyond that, an implementation makes three choices.

**Control transfer.** Asymmetric coroutines usually provide keywords like `yield` and `resume`, and the programmer cannot freely choose which frame to yield to; the runtime only yields to the nearest caller of the current coroutine. In symmetric coroutines the programmer must specify a yield destination.

**First-class or not.** Coroutines may be first-class objects the programmer can manipulate freely, or constrained constructs.

**Stackful or stackless.** A coroutine able to suspend its execution from within nested function calls is **stackful**. In a **stackless** implementation, a regular function cannot use `yield` unless it is itself marked as a coroutine.

That third choice is the one with teeth. Stackless means suspension points must be visible in the source of the function that suspends, so `yield` cannot hide behind a helper call. The distinction propagates into the type system and eventually into the library ecosystem.

The 2009 paper "Revisiting Coroutines" by de Moura and Ierusalimschy proposed the term **full coroutine** for one that is both first-class and stackful. Full coroutines have the same expressive power as one-shot [[cs/pl/continuations-cps|continuations]] and delimited continuations. Whether a coroutine is symmetric or asymmetric has no bearing on expressiveness, though full coroutines are more expressive than non-full ones. Asymmetric coroutines simply resemble familiar routine-based control structures more closely, since control always passes back to the invoker.

## Against subroutines and against threads

Subroutines are special cases of coroutines. An instance of a subroutine returns once and holds no state between invocations. A coroutine can exit by calling other coroutines that may later return to the point where they were invoked, so from the coroutine's own point of view it is not exiting but calling. A coroutine instance therefore holds state and varies between invocations, and multiple instances of one coroutine can exist at once. The relationship between two coroutines that yield to each other is not caller and callee, but symmetric.

Threads are the other neighbor, and the comparison is sharper than it looks.

| | Coroutines | Threads |
|---|---|---|
| Scheduling | cooperative | typically preemptive |
| Provides concurrency | yes | yes |
| Provides parallelism | no | yes |
| Switching cost | no system calls, no blocking calls | OS-mediated |
| Locking | often avoidable entirely | required around shared state |

Coroutines provide [[cs/pl/concurrency-models-threads-locks-and-actors|concurrency]] because they allow tasks to be performed out of order or in a changeable order without changing the overall outcome, but they do not provide parallelism, because they do not execute multiple tasks simultaneously. Their advantages are that they may be used in a hard real-time context, since switching involves no system calls or blocking calls whatsoever, that synchronization primitives such as mutexes and semaphores are unnecessary to guard critical sections, and that no operating-system support is needed. Because coroutines can only be rescheduled at specific points and do not execute concurrently, programs using them can often avoid locking entirely.

Coroutines can be built on preemptively scheduled threads transparently to the calling code, but the hard-real-time suitability and the cheapness of switching are lost.

## Generators are the restricted case

Generators, also known as semicoroutines, are a subset of coroutines. Both yield multiple times, suspending execution and allowing re-entry at multiple entry points. The difference is that a coroutine can control where execution continues immediately after it yields, and a generator cannot: control is always transferred back to the generator's caller. Since generators exist primarily to simplify writing iterators, a `yield` in a generator does not name a coroutine to jump to, it passes a value back to a parent routine.

The restriction is not a ceiling. Coroutines can be implemented on top of a generator facility with a top-level dispatcher routine, essentially a trampoline, that passes control explicitly to child generators identified by tokens the generators pass back. Python's history is exactly this staircase: 2.5 added coroutine-like functionality based on [[cs/languages/Python/generators-and-iterators|extended generators]] (PEP 342), 3.3 added delegation to a subgenerator (PEP 380), 3.4 added an asynchronous I/O framework whose coroutines leverage subgenerator delegation (PEP 3156), and 3.5 added explicit `async`/`await` syntax (PEP 492). Since 3.7 `async` and `await` are reserved keywords.

## What people do without them

As of 2003, many of the most popular languages including C and its derivatives had no built-in coroutine support, largely due to the limitations of stack-based subroutine implementation. The workarounds are familiar. One is a [[cs/pl/scoping-binding-and-closures|closure]], a subroutine with state variables (often boolean flags) maintaining internal state between calls, with conditionals steering successive calls down different code paths. The other is an explicit state machine written as a large switch statement or a computed `goto`. Such implementations are considered difficult to understand and maintain, and that is a motivation for coroutine support.

Coroutines originated as an assembly language method, and machine-dependent assembly languages often provide direct methods for them. In MACRO-11 on the PDP-11, the classic coroutine switch is the instruction `JSR PC,@(SP)+`, which jumps to the address popped from the stack and pushes the address of the next instruction onto it. Melvin Conway coined the term *coroutine* in 1958 when he applied it to the construction of an assembly program, and the first published explanation appeared in 1963.

## Async/await as a coroutine transform

The async/await pattern is a syntactic feature allowing an asynchronous, non-blocking function to be structured like an ordinary synchronous one. It is semantically related to the concept of a coroutine and is often implemented using similar techniques, and its purpose is to give the program opportunities to execute other code while waiting for a long-running asynchronous task, usually represented by promises.

> [!example] What `await` actually does
> ```csharp
> public async Task<int> FindSizeOfPageAsync(Uri uri)
> {
>     HttpClient client = new();
>     byte[] data = await client.GetByteArrayAsync(uri);
>     return data.Length;
> }
> ```
>
> `GetByteArrayAsync` begins the download using a non-blocking mechanism and immediately returns an unresolved `Task<byte[]>`. With `await` attached, `FindSizeOfPageAsync` immediately returns a `Task<int>` to its own caller, who continues with other work. When the download finishes it resolves its `Task`, which triggers a callback resuming this function with `data` bound. The final `return data.Length` is re-interpreted by the compiler as resolving the `Task` returned earlier.
>
> The suspension point is the only thing that changed. Everything above and below it reads as straight-line code.

The mechanism is a compiler transform, not a runtime service. In C# and many other languages with the feature, async/await is not a core part of the language's runtime but is implemented with lambdas or continuations at compile time. [[cs/languages/Rust/async-rust-futures-and-pinning|Async functions in Rust]] desugar to plain functions returning values that implement the `std::future::Future` trait, currently implemented with a finite-state machine. This is precisely why the pattern is attractive to designers of languages that do not have or control their own runtime: async/await can be implemented solely as a transformation to a state machine in the compiler.

The timeline shows the idea spreading rather than being invented once. F# added asynchronous workflows with await points in version 2.0 in 2007, which influenced C#; Microsoft released async/await in the Async CTP in 2011 and officially in C# 5 in 2012; Python 3.5 added it in 2015, TypeScript 1.7 the same year, JavaScript in ECMAScript 2017, Rust in 1.39.0 in 2019 with the `async` keyword and the `.await` postfix operator, [[cs/languages/Cpp/coroutines-in-cpp|C++20]] in 2020 with `co_return`, `co_await`, and `co_yield`, and Swift 5.5 in 2021.

> [!warning] Function coloring
> The pattern tends to make surrounding code asynchronous too, and its contagious nature splits a language's library ecosystem between synchronous and asynchronous libraries and APIs, an issue often called **function coloring**. Alternatives that avoid it are called colorless; Go's goroutines and Java's virtual threads are the standard examples. This is the stackless choice showing its bill: because a stackless coroutine can only suspend in a function marked as one, the marking has to propagate up every caller.

## Related Notes

- [[cs/pl/continuations-cps|Continuations & CPS]]
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models]]
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions & Non-local Control]]
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding & Closures]]
- [[cs/pl/abstract-machines-cek-secd|Abstract Machines: CEK and SECD]]
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order & Strictness]]

## Sources

- "Coroutine," Wikipedia. https://en.wikipedia.org/wiki/Coroutine . Backs the definition of coroutines as suspendable and resumable components for cooperative multitasking and the "functions whose execution you can pause" description, Conway's 1958 coining and the 1963 publication, Marlin's two fundamental characteristics, the three implementation features covering asymmetric versus symmetric transfer, first-class versus constrained, and stackful versus stackless, the "Revisiting Coroutines" full-coroutine terminology and its equivalence to one-shot and delimited continuations, the subroutine comparison, the thread comparison including concurrency without parallelism and the locking and hard-real-time points, generators as semicoroutines and their inability to choose where control resumes, the trampoline construction of coroutines over generators, the Python PEP progression from 2.5 to 3.7, the absence of built-in support in C-family languages and the closure and switch-statement workarounds, and the MACRO-11 `JSR PC,@(SP)+` coroutine switch.
- "Async/await," Wikipedia. https://en.wikipedia.org/wiki/Async/await . Backs the definition of the pattern and its semantic relation to coroutines and promises, the C# `FindSizeOfPageAsync` example and its step-by-step behavior, the compile-time implementation with lambdas or continuations, Rust's desugaring to `std::future::Future` via a finite-state machine, the appeal of a compiler-only state-machine transformation to languages without control of their runtime, the function-coloring criticism and the colorless alternatives Go goroutines and Java virtual threads, and the adoption timeline for F#, C#, Python, TypeScript, JavaScript, Rust, C++, and Swift.
