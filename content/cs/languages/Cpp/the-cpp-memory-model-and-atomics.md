---
title: The C++ Memory Model and Atomics
description: "What a data race is defined to be, what release and acquire actually promise about non-atomic writes, why seq_cst is the default and what it costs, and why the single total order can still disagree with happens-before."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-07-15
updated:
aliases: []
---

Every rule in this note is marked in the standard as arriving with C++11, which is the revision that gave the language multi-threaded executions and a definition of what they mean. The shape of that definition is worth noticing: rather than specifying what hardware does, the standard defines an ordering relation over operations, declares certain programs to have no meaning at all, and hands you a small vocabulary for buying back exactly as much ordering as you need.

> [!note] The idea
> The memory model is not a description of caches. It is a contract about which writes a read is allowed to see, expressed as a partial order called happens-before, plus a rule that a program with two unordered conflicting accesses has no defined behavior whatsoever. Atomics are not primarily about indivisibility. Their real job is to be the only things in the language that can create happens-before edges between threads, which is why the interesting parameter on an atomic operation is not what it does to its own variable but what it promises about every ordinary variable around it.

## What a data race is

The definition is built from memory locations rather than variables, and the distinction earns its keep. A memory location is the storage occupied by the object representation of a scalar object that is not a bit-field, or the largest contiguous sequence of non-zero-length bit-fields. Two adjacent `int` members are separate locations; two adjacent bit-fields in the same run are one.

The permission comes first: "Different threads of execution are always allowed to access (read and modify) different memory locations concurrently, with no interference and no synchronization requirements." That sentence outlaws an entire class of compiler transformation. An implementation may not write to a neighboring field as a side effect of updating one, because doing so would introduce a conflict the source did not have.

Then the prohibition. "Two expression evaluations conflict if one of them modifies a memory location or starts/ends the lifetime of an object in a memory location" while the other reads or modifies the same location. "A program that has two conflicting evaluations has a data race unless" both are atomic operations or one happens-before the other. And the penalty is the strongest one the language has: "If a data race occurs, the behavior of the program is undefined."

That last point is worth sitting with, because it is not the intuitive model. A racy read is not defined to return a stale value or a torn value. The program has no behavior, so the compiler was entitled to assume the race could not occur and to have optimized on that basis, in the manner [[cs/languages/common/undefined-behavior-as-a-contract|undefined behavior as a contract]] describes. Whole-program consequences follow from a race in one line.

## Why ordering has to be specified at all

cppreference states the underlying problem without reference to any particular machine: absent constraints on a multi-core system, "one thread can observe the values change in an order different from the order another thread wrote them," and the apparent order can differ between reader threads. It then adds the part people forget: similar effects occur on a uniprocessor, from compiler transformations the memory model permits.

So there are two reorderers, the compiler and the hardware, and one vocabulary constrains both. That is a deliberate design choice, and it is why the same source has predictable meaning on x86 and on ARM even though the machines differ in what they reorder. The hardware half of the story is [[cs/systems/cache-coherence|cache coherence]] and the protocols that make one core's store eventually visible to another.

## The three orderings that matter

**Relaxed** buys atomicity and nothing else. "Atomic operations tagged memory_order_relaxed are not synchronization operations; they do not impose an order among concurrent memory accesses. They only guarantee atomicity and modification order consistency." A relaxed counter increments correctly and tells you nothing about when any other write became visible. It is the right tool for statistics and reference counts on the increment side, and the wrong tool for publishing data.

**Release and acquire** come as a pair and are the workhorse. "If an atomic store in thread A is tagged memory_order_release, an atomic load in thread B from the same variable is tagged memory_order_acquire, and the load in thread B reads a value written by the store in thread A, then the store in thread A synchronizes-with the load in thread B." What that buys is the important part, and it concerns non-atomic memory: all writes that happened-before the store in thread A become visible side effects in thread B, so "once the atomic load is completed, thread B is guaranteed to see everything thread A wrote to memory."

Two conditions bound the promise. "This promise only holds if B actually returns the value that A stored, or a value from later in the release sequence." A load that misses the store gets nothing. And "The synchronization is established only between the threads releasing and acquiring the same atomic variable," so a third thread may see a different order than either participant. Release-acquire is pairwise, not global, which is the single most common misreading of it.

The cost is architectural. On strongly-ordered systems including x86, "release-acquire ordering is automatic for the majority of operations," with no extra CPU instructions and only compiler optimizations restricted. "On weakly-ordered systems (ARM, Itanium, PowerPC), special CPU load or memory fence instructions are used." A mutex is the canonical instance: unlocking releases, locking acquires, and everything done in the critical section is visible to the next holder.

**Sequential consistency** adds one more thing on top. Operations tagged `seq_cst` order memory the same way release and acquire do, "but also establish a single total modification order of all atomic operations that are so tagged." One agreed-upon sequence, observed identically by every thread. It is the default, because "The default behavior of all atomic operations in the library provides for sequentially consistent ordering," which is the right default: it is the only ordering under which the naive mental model of interleaved threads is actually correct. The same notion appears at a much larger scale in [[cs/systems/consistency-models|consistency models]] for distributed stores, and it is expensive there for the same reason it is expensive here.

> [!warning] The total order is not the same thing as happens-before
> Two facts, stated by cppreference, break the intuition that `seq_cst` restores plain sequential reasoning. First, "as soon as atomic operations that are not tagged memory_order_seq_cst enter the picture, the sequential consistency is lost." Mixing one relaxed store into an otherwise `seq_cst` algorithm does not weaken that one operation, it removes the global guarantee. Second, and stranger, "The single total order might not be consistent with happens-before." That is not an oversight. "This allows more efficient implementation of memory_order_acquire and memory_order_release on some CPUs," and cppreference warns that "It can produce surprising results when memory_order_acquire and memory_order_release are mixed with" `seq_cst`. Sequential consistency is a property of the `seq_cst` operations among themselves, not a property of the program.

## Consume, and what it teaches

The fourth ordering is the cautionary tale. `memory_order_consume` was meant to capture dependency ordering, where only reads that actually depend on the loaded value need be ordered, which on most hardware is free. The standard specified it, and then the implementations declined: "no known production compilers track dependency chains: consume operations are lifted to acquire operations." The specification is under revision and "The specification of release-consume ordering is being revised, and the use of memory_order_consume is temporarily discouraged," with C++26 deprecating it as equivalent to acquire.

The lesson generalizes past C++. A memory model is a contract among a standard, a set of compilers, and a set of processors, and a clause that no compiler can implement profitably is not a feature. Compare what [[cs/languages/Java/the-java-memory-model-and-happens-before|the Java memory model]] settled on with the same happens-before relation, and what [[cs/languages/Go/the-go-memory-model|the Go memory model]] does with it. Three languages, one relation, three different judgments about how much of it to put in the programmer's hands.

## Related Notes

- [[cs/languages/Java/the-java-memory-model-and-happens-before|The Java Memory Model and Happens-Before]] - the earlier model that established the relation this one uses
- [[cs/languages/Go/the-go-memory-model|The Go Memory Model]] - the same guarantees with the tuning knobs deliberately withheld
- [[cs/systems/cache-coherence|Cache Coherence]] - the hardware layer the orderings are paying for
- [[cs/systems/consistency-models|Consistency Models]] - sequential consistency and its weaker relatives at distributed scale
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what it means that a data race has no behavior rather than a bad one
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - where these primitives sit relative to the abstractions built on them

## Sources

- "Multi-threaded executions and data races," cppreference.com. https://en.cppreference.com/w/cpp/language/multithread.html . Supports concurrent access to distinct memory locations requiring no synchronization, the definition of conflicting evaluations, the definition of a data race and its two exemptions, and data races being undefined behavior.
- "Memory model," cppreference.com. https://en.cppreference.com/w/cpp/language/memory_model.html . Supports the definition of a memory location as the storage of a scalar object that is not a bit-field or the largest contiguous run of non-zero-length bit-fields.
- "std::memory_order," cppreference.com. https://en.cppreference.com/w/cpp/atomic/memory_order.html . Supports threads observing changes in different orders absent constraints, sequentially consistent ordering being the library default, relaxed operations guaranteeing only atomicity and modification order consistency, the release-acquire synchronizes-with rule and the visibility of prior non-atomic writes, the two limits on that promise, release-acquire being free on strongly ordered systems and requiring fences on weakly ordered ones, seq_cst adding a single total modification order, sequential consistency being lost when non-seq_cst operations are involved, the total order not necessarily agreeing with happens-before and why, and consume being lifted to acquire by production compilers and discouraged pending revision.
