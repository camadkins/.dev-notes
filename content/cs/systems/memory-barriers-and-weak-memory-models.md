---
title: Memory Barriers and Weak Memory Models
description: "Coherence makes every copy of one address agree. Ordering across different addresses is a separate guarantee the hardware declines to give, and a barrier is how you buy back the piece of it you need."
draft: false
comments: true
tags:
  - cs
  - systems
  - concurrency
  - computer-architecture
date: 2026-08-31
updated:
aliases:
  - Memory Fence
---

The Linux kernel's memory-barrier document opens with a picture of two CPUs and one memory, and then says the useful part out loud: in the abstract CPU, memory operation ordering is very relaxed, and a CPU may actually perform the memory operations in any order it likes, provided program causality appears to be maintained. The compiler has the same licence. Neither is obliged to preserve the order you wrote, only the order you can observe, and "you" means the thread doing the writing. Another thread is not you.

> [!note] The idea
> [[cs/systems/cache-coherence|Coherence]] and ordering are different guarantees, and only the first one is free. Coherence says all cached copies of a single address agree. Ordering says the accesses to two different addresses become visible in the order the program issued them, and no mainstream processor gives that for free because giving it means giving up store buffers, speculation, and out-of-order execution. A memory barrier is a purchase order: it names a boundary and forces the operations issued before it to be performed before the operations issued after it, at the exact place your algorithm depends on that being true.

## The reordering you cannot see from one thread

Take the canonical flag-and-payload handoff, which is the example the memory-barrier article uses. `x` and `f` both start at zero. Thread 2 stores 42 into `x`, then stores 1 into `f`. Thread 1 spins until `f` is nonzero, then prints `x`. Every reading of the source says it prints 42.

If thread 2's stores are executed out of order, `f` can be updated before `x`, and thread 1 prints 0. Independently, thread 1's loads can be executed out of order, so `x` can be read before `f` is checked, and again the print is wrong. Two fences fix it: one before thread 2's assignment to `f`, so the new value of `x` is visible at or prior to the change in `f`, and one before thread 1's access to `x`, so `x` is not read before the change to `f` is seen. Barriers pair. A release with no matching acquire orders one half of a handshake and protects nothing.

The reason the single-threaded reading feels so authoritative is that it is enforced. Memory order is of little concern outside multithreading and memory-mapped IO, because if the compiler or CPU changes the order of any operations, it must ensure the reordering does not change the output of ordinary single-threaded code. Your own thread is the one observer the machine promises to keep fooled. Every other observer is on their own.

## Strong, weak, and where the real machines sit

A memory order is called strong, or sequentially consistent, when either the order of operations cannot change or such changes have no visible effect on any thread. It is called weak, or relaxed, when one thread cannot predict the order of operations arising from another thread. The spectrum runs from sequential consistency, through relaxed models that permit specific reorderings, down to weak consistency where reads and writes are arbitrarily reordered and the only limit is the barriers you write.

Almost nothing sits at the strong end. To fully use the bandwidth of caches and memory banks, few compilers or CPU architectures ensure perfectly strong ordering. Among commonly used architectures, x86-64 has the strongest memory order and still defers memory store instructions until after memory load instructions, which is the single reordering that makes Dekker-style mutual exclusion break on the most ordered mainstream chip in production. At the other end, DEC Alpha makes practically no guarantees about memory order.

The four reorderings the models are classified by are load-after-load, load-after-store, store-after-store, and store-after-load. x86, AMD64, SPARC TSO, and z/Architecture permit only the last. ARMv7, POWER, PA-RISC, and Alpha permit all four. That difference is why the same lock-free queue passes for a year on a developer's laptop and corrupts on an ARM server, and it is a portability property, not a bug that testing on x86 was ever going to find.

Alpha earns a line of its own because it is the one architecture that reorders *dependent* loads. If the processor fetches a pointer and then the data it points at, it may use stale cached data it has not yet invalidated, because Alpha processes cache-line invalidations lazily by default. Allowing that relaxation makes the cache hardware simpler and faster, at the cost of requiring barriers between a pointer read and the read through it. Every other architecture treats the address dependency as ordering enough. This is the outer bound of how weak a shipped model was willing to be.

## The compiler is the other reorderer

Barrier instructions address reordering at the hardware level only. Compilers reorder as part of optimization, and in general it is necessary to take separate measures to inhibit compiler reordering for data shared between threads. Two layers, two mitigations, and code that fences one and not the other is broken in a way that only shows up under `-O2`.

C and C++ `volatile` is the classic wrong tool here. It was intended to let programs access memory-mapped IO, so a compiler may not omit reads from or writes to volatile locations, nor reorder them relative to other such actions for the same volatile location. What it does not do is guarantee a memory barrier to enforce cache consistency, so `volatile` alone is not sufficient to use a variable for inter-thread communication on all systems and processors. Worse, the compiler or CPU may reorder a volatile access relative to *non-volatile* accesses, which limits its usefulness as an inter-thread flag or mutex. That is precisely the flag-and-payload pattern above: the flag is volatile, the payload is not, and the ordering that mattered was between them.

The languages fixed this by defining their own models rather than by fixing `volatile`. C11 and C++11 added `atomic_thread_fence()`; GCC has had `__sync_synchronize` since 4.4.0. The named instruction underneath is architecture-specific: `MFENCE`, `LFENCE`, and `SFENCE` on x86, `DMB`, `DSB`, and `ISB` on ARM, `FENCE` on RISC-V, `sync` on POWER and MIPS.

> [!warning]
> A barrier orders operations; it does not make them fast, and it does not make them happen. Fences are a cost paid on the coherence interconnect, and the standard failure mode of a first lock-free implementation is a full fence where an acquire or release would have done, which is how a hand-rolled structure ends up slower than the lock it replaced.

## Why the language models exist

This is the layer a language memory model is written to hide. The [[cs/languages/Java/the-java-memory-model-and-happens-before|Java memory model]] never mentions caches or store buffers, because the same class file has to run on x86 and on ARM; it defines happens-before and hands implementers the job of emitting the right fences per target. [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|The C++ model]] does the same with acquire, release, and sequentially consistent orderings, and [[cs/languages/Go/the-go-memory-model|Go's]] and [[cs/languages/Rust/send-sync-and-fearless-concurrency|Rust's]] are variations on the identical move. Every one of them is an abstraction over the table above, and the reason they are all phrased in terms of ordering relations rather than instructions is that the instructions are not portable and the relations are.

Read from the bottom, the stack is short. Coherence keeps one address consistent. Ordering across addresses is not implied by that, and is unavailable by default. Barriers restore it pointwise. Language memory models let you name the points in portable terms. [[cs/systems/concurrency-primitives|Locks]] and the higher-level primitives are barriers with an ownership protocol wrapped around them, which is why using a mutex means never thinking about any of this, and why writing one means thinking about all of it.

## Related Notes

- [[cs/systems/cache-coherence|Cache Coherence]] - the guarantee that covers a single address, and stops there
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - the store buffers and caches whose latency the reordering is buying back
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - the locks and atomics built on top of fences
- [[cs/systems/consistency-models|Consistency Models]] - the same strong-to-weak spectrum, one layer up, across machines instead of cores
- [[cs/languages/Java/the-java-memory-model-and-happens-before|The Java Memory Model and Happens-Before]] - a language model defined so it never has to name this layer
- [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|The C++ Memory Model and Atomics]] - acquire, release, and the ordering menu exposed to the programmer
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what a data race is, in the language that declines to define it

## Sources

- "Memory barrier," Wikipedia. https://en.wikipedia.org/wiki/Memory_barrier . Backs the definition of a barrier as an instruction causing a CPU or compiler to enforce an ordering constraint such that operations issued before it are performed before operations issued after it, barriers being necessary because of out-of-order execution whose effects go unnoticed within a single thread, the exact constraint being hardware dependent, the `x`/`f` flag-and-payload example including both required fence positions, the architecture instruction names (`MFENCE`/`LFENCE`/`SFENCE`, `DMB`/`DSB`/`ISB`, RISC-V `FENCE`, PowerPC), the separation of hardware barriers from compiler reordering, and the treatment of `volatile`: no omission or reordering of accesses to the same volatile location, no memory-barrier guarantee, insufficiency for inter-thread communication, and reordering against non-volatile accesses.
- "Memory ordering," Wikipedia. https://en.wikipedia.org/wiki/Memory_ordering . Backs memory ordering depending on both compile-time and run-time order, memory order mattering little outside multithreading and memory-mapped IO because reordering may not change single-threaded output, the strong/sequentially-consistent and weak/relaxed definitions, few compilers or architectures ensuring perfectly strong ordering in order to use cache and memory-bank bandwidth, x86-64 having the strongest order among common architectures while still deferring stores past loads, DEC Alpha making practically no guarantees, the four reordering categories and the per-architecture table, Alpha's dependent-load reordering with lazy invalidation processing, and the compiler builtins `__sync_synchronize` (GCC 4.4.0 and later) and C11/C++11 `atomic_thread_fence()`.
- "Linux Kernel Memory Barriers," The Linux Kernel Archives. https://www.kernel.org/doc/Documentation/memory-barriers.txt . Backs the abstract model in which a CPU may perform memory operations in any order it likes provided program causality appears to be maintained, the compiler holding the same latitude, and the minimal guarantee that dependent memory accesses are issued in order on any given CPU with DEC Alpha as the exception requiring an emitted barrier.
