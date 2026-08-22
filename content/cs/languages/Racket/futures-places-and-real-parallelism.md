---
title: Futures, Places, and Real Parallelism
description: "Why a future stops the moment it needs its continuation, what a place gives instead, and the shared runtime that shapes both."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-15
updated:
aliases:
  - Racket Futures
  - Racket Places
  - Racket Parallelism
---

Racket threads are coroutines. They give concurrency and no parallelism, which surprises people who arrive from a language where `Thread` means a hardware thread. For actual parallel execution Racket provides three forms of parallelism: parallel threads, futures, and places. The three exist because a single design cannot satisfy both halves of what Racket promises, and understanding the split is more useful than memorizing the APIs.

> [!note] The idea
> The obstacle to parallelism in Racket is not the collector and it is not a global interpreter lock. It is the continuation. A future executes its work in parallel until it detects an attempt to perform an operation that cannot run safely in parallel, and work in a future is suspended if it depends in some way on the current continuation, such as raising an exception. Everything Racket makes cheap and pervasive, [[cs/languages/Racket/parameters-and-dynamic-binding|parameters]], exception handlers, prompts, continuation marks, lives in the continuation, and a future does not have one until you touch it. Places dodge the problem by giving each task its own everything. The two designs are the two available answers to one question: share the runtime and restrict the operations, or replicate the runtime and restrict the values.

## Futures block on the things that make Racket Racket

Achieving parallelism through `future` and `touch` depends on avoiding blocking operations, defined as anything that inspects the full continuation or requires atomic execution relative to Racket threads. Futures run in parallel as long as they can do so safely and independent of any continuation context that a `touch` might provide, where continuation context can include an exception handler, parameter value, continuation prompts, or other values accessible via continuation marks.

The suspension is not a stall that resolves itself. A blocking operation halts evaluation of a future and will not allow it to continue until the future is touched. A `touch` of the future in a thread causes its work to be evaluated sequentially by the thread, which provides a continuation context and can synchronize with Racket threads. So a future that blocks early has not been slowed down; it has been converted into a normal function call at the moment you asked for the result.

The Guide's worked example is a good lesson because the failure is invisible in the source. Two Mandelbrot computations, one wrapped in a `future`, produce no speedup at all. The reason that no parallelism appears is `printf`, one debug line at the top of the function. Output ports are shared mutable objects, so writing to one is future-unsafe, so the future blocks on its first statement and does nothing until the touch.

That is the practical shape of the constraint. Futures are excellent for numeric kernels over flonums and fixnums with no I/O, no exceptions, no parameters, and no allocation-heavy shared structure, and they are useless for almost everything else. Racket ships a futures visualizer precisely because the failure mode is silent: without a trace showing the blocking event, a blocked future looks identical to a slow one.

> [!warning] Safe is a narrower promise than you would guess
> Safe parallel execution of a future means that all operations provided by the system must be able to enforce contracts and produce results as documented. It does not preclude concurrent access to mutable data that is visible in the program. A computation in a future can `set!` a shared variable, and the assignment can be seen by other computations. Futures protect the runtime's invariants, not your program's. [[cs/pl/concurrency-models-threads-locks-and-actors|The usual data-race reasoning]] still applies to your own state.

Parallel threads are the newer middle path. A thread created with a parallel thread pool can use a different hardware processor. The difference with a parallel thread is that when a future would block, a parallel thread instead synchronizes enough with other threads to continue, hoping to quickly reach a point clear of blocking actions, and a parallel thread can freely use parameters and exception handlers, which are limited in futures until a touch provides a full dynamic context. The trade is overhead: blocking input and output can be significantly more expensive for parallel threads than for coroutine threads, because extra synchronization is required.

## Places replicate instead of restricting

The `place` form creates a place, effectively a new Racket instance that can run in parallel to other places, including the initial place. The full power of the Racket language is available at each place. That is the entire pitch: no future-unsafe operations, because there is no shared runtime state to make an operation unsafe.

Payment is taken in the value domain instead. Places can communicate only through message passing, using `place-channel-put` and `place-channel-get` on a limited set of values, which helps ensure the safety and independence of parallel computations. To a first approximation, place channels support only immutable, transparent values as messages. Place channels themselves can be sent across channels, which is how you build a topology rather than a star. And there is a documented shared-memory escape: values from `shared-flvector`, `make-shared-flvector`, `shared-bytes`, and their relatives can be sent across channels, and mutation of such values is visible to all places that share the value, because they live in a shared memory space.

If that sounds like processes with a message queue, the resemblance is deliberate and the difference is important. A place is a parallel task that is effectively a separate instance of the Racket virtual machine, although all places run within a single operating-system process. You get [[cs/systems/processes-and-threads|the isolation of separate processes]] without paying process-creation cost or losing the ability to hand over a shared flvector, and [[cs/systems/inter-process-communication|the channel is the IPC layer]] with the serialization constraint made explicit in the type of what may be sent.

## The runtime constraint behind both

The Reference names the ceiling directly, and it is the most useful sentence in either page. Implementation and operating-system constraints may limit the scalability of places. Although places can perform garbage collections in parallel in the CS implementation or independently in the 3m implementation, a garbage collection may need to manipulate a page table that is shared across all places, and that shared page table can be a bottleneck with enough places, perhaps around 8 or 16.

So the isolation is not total. One artifact remains shared across every place in the process, and it is [[cs/pl/garbage-collection-concepts|the collector's bookkeeping]]. That is the deep reason both mechanisms exist in the shape they do. A managed language with a precise collector cannot give you free-running threads over one heap without either a lock, a restriction on what a parallel task may touch, or a separate heap per task. Racket declined the lock and shipped both of the other two answers.

Reading the two designs against that constraint makes the choice mechanical. If the work is a tight numeric loop over unboxed values with a result that fits in a return, use a future and check the visualizer. If the work is a substantial subprogram with its own I/O and error handling, use a place and design the message protocol first. If it needs the runtime's synchronization interface, use a parallel thread and accept the coordination cost. And if the parallel speedup you want is more than roughly a dozen-fold on one machine, the page-table sentence above says to stop looking at this axis and start looking at separate processes or separate machines.

## Related Notes

- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models: Threads, Locks, and Actors]] - places are the actor answer, futures are neither
- [[cs/systems/processes-and-threads|Processes and Threads]] - the OS-level units places imitate inside one process
- [[cs/systems/inter-process-communication|Inter-Process Communication]] - channels, message copying, and the shared-memory exception
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - the shared bookkeeping that caps how far places scale
- [[cs/languages/Racket/parameters-and-dynamic-binding|Parameters and Dynamic Binding]] - convenient everywhere else, a blocking operation inside a future
- [[cs/languages/Racket/delimited-continuations-and-prompts|Delimited Continuations and Prompts]] - the continuation marks a future cannot consult

## Sources

- "20 Parallelism," The Racket Guide. https://docs.racket-lang.org/guide/parallelism.html . Supports the three forms of parallelism, coroutine threads providing concurrency without parallelism, futures depending on avoiding blocking operations defined as full-continuation inspection or atomic execution, continuation context including exception handlers, parameter values, prompts, and marks, a blocking operation halting a future until touched, `touch` evaluating the work sequentially with a continuation context, the Mandelbrot example whose lack of parallelism is caused by `printf`, the futures visualizer, the parallel-thread comparison including its synchronize-and-continue behavior and free use of parameters and exception handlers, the extra cost of blocking I/O in parallel threads, and the `place` form creating a separate Racket instance limited to message passing.
- "11.4 Futures," The Racket Reference. https://docs.racket-lang.org/reference/futures.html . Supports `future` providing parallelism where `thread` provides only concurrency, a future running in parallel until it detects an unsafe operation, suspension when work depends on the current continuation such as raising an exception, resumption on `touch`, and safety not precluding concurrent access to mutable data visible in the program.
- "11.5 Places," The Racket Reference. https://docs.racket-lang.org/reference/places.html . Supports places enabling parallel programs on machines with multiple processors, cores, or hardware threads, a place being a separate instance of the Racket virtual machine inside one operating-system process, place channels carrying only immutable transparent values to a first approximation, channels being sendable over channels, shared flvector and byte-string values being visible to all sharing places, and the scalability limit from a page table shared across places becoming a bottleneck around 8 or 16.
