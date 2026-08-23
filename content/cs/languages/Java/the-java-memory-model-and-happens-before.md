---
title: "The Java Memory Model and Happens-Before"
description: "What a data race is defined to be, why happens-before is a partial order rather than a timeline, and the exact guarantees volatile and final fields buy you."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-07-02
updated:
aliases:
  - JMM
  - Java Happens-Before
---

Ask an average Java programmer what `volatile` does and you will hear something about the value not being cached. That answer is folklore. The specification never mentions caches, store buffers, or any other piece of hardware, because it cannot: the same class file has to run correctly on a strongly ordered x86 chip and on a weakly ordered ARM one, under a compiler free to hoist, sink, and delete reads. Chapter 17 of the Java Language Specification defines correctness in terms the hardware cannot see, and hands implementers the job of meeting it.

> [!note] The idea
> The Java Memory Model does not tell you what the machine does. It defines a partial order over memory actions, called happens-before, and then defines a read's legal return values in terms of that order. The payload is one theorem: a program whose sequentially consistent executions contain no data race behaves, in every execution, as if it were sequentially consistent. That is a bargain, not a description. You pay by proving your program race free using an easy model, and in exchange you never have to reason about reordering at all.

## What a race actually is

The specification builds the definition from two smaller ones. First, scope: instance fields, static fields, and array elements live in shared memory, while local variables, method parameters, and exception handler parameters "are never shared between threads and are unaffected by the memory model." That one sentence explains why a captured local in a lambda is safe by construction and why a field of the same name is not. Second, conflict: two accesses to the same variable conflict "if at least one of the accesses is a write," so two concurrent reads are never a race however they interleave.

Put those together and the definition is short. When a program contains two conflicting accesses "that are not ordered by a happens-before relationship, it is said to contain a data race." Notice what is missing: no clock, no simultaneity, no requirement that the accesses overlap in wall-clock time. A race is an absence of ordering in a mathematical relation, which is why races are diagnosable statically and why they lurk for years in code that has never once misbehaved.

## Happens-before is a partial order, not a timeline

The relation has two ingredients: program order within a thread, and synchronizes-with edges between threads, closed under transitivity. The edges are the interesting half. An unlock of a monitor synchronizes with every subsequent lock of it. A write to a volatile field synchronizes with every subsequent read of it. Starting a thread synchronizes with its first action, and a thread's last action synchronizes with any action in another thread that detects the termination. The specification names the ends: "The source of a synchronizes-with edge is called a" release, "and the destination is called an" acquire.

The shape should look familiar to anyone who has read Lamport. Happens-before in Java is a causal partial order over events, established by designated communication points, exactly as in [[cs/systems/logical-clocks-lamport-and-vector|Lamport's logical clocks]]. The intuition transfers in both directions: unrelated actions in a distributed system have no defined order, and neither do unrelated actions in your heap.

Ordering in the relation does not mean ordering on the machine. "The presence of a happens-before relationship between two actions does not necessarily imply that they have to take place in that order in an implementation." A JIT may reorder freely so long as no execution observing the difference is legal. Happens-before constrains what a read is permitted to return, and nothing else.

## Why the theorem is the whole product

A model this abstract would be useless if you had to apply it directly. The escape hatch is section 17.4.5's central claim: a program "is correctly synchronized if and only if all sequentially consistent executions are free of data races," and if a program is correctly synchronized "then all executions of the program will appear to be sequentially consistent."

The quantifiers do real work. You check for races only in sequentially consistent executions, the simple interleaving model everyone already reasons in. If you find none, you get sequential consistency for every execution, including the ones the optimizer invents. The hard part of the model, the causality and well-formedness machinery in 17.4.7 and 17.4.8, exists only to bound what racy programs may do so the JVM stays memory safe.

This is the trade the platform makes with [[cs/pl/concurrency-models-threads-locks-and-actors|shared-memory concurrency]]: keep threads and mutable state, but define a discipline whose obligations are checkable. Rust took the other branch and made the discipline a type system property, which is what [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send and Sync]] encode.

## What volatile and final actually promise

`volatile` gives you two separate things, and conflating them is the usual source of bugs.

The ordering guarantee is the important one: a write to a volatile field happens-before every subsequent read of that field, so everything the writing thread did beforehand becomes visible to a reader that observes it. The `java.util.concurrent` documentation states the general rule plainly: results of a write "are guaranteed to be visible to a read by another thread only if the write operation happens-before the read operation." A volatile write publishes a whole prefix of your thread's history, not one field.

The atomicity guarantee is narrower and stranger. For a non-volatile `long` or `double`, "a single write to a non-volatile long or double value is treated as two separate writes: one to each 32-bit half," so a racy reader can observe half of one write and half of another. Marking the field volatile fixes that, since "Writes and reads of volatile long and double values are always atomic." What volatile never gives you is compound atomicity: `count++` on a volatile field is still a read, an add, and a write, and still loses updates.

`final` fields work by a different mechanism, and it is the one that makes immutable objects safe to publish through a race. "An object is considered to be completely initialized when its constructor finishes," and a thread that can only reach the object after that point is guaranteed to see the correctly initialized values of its final fields. That holds even when the reference itself was passed unsafely, which is why the specification says final fields "allow programmers to implement thread-safe immutable objects without synchronization." The price is in the same section: because the value cannot change, "compilers are allowed to keep the value of a final field cached in a register and not reload it from memory."

> [!warning] The escape clause
> The final-field guarantee is conditional on the constructor not leaking `this`. Register the object with a listener, assign it to a static field, or start a thread from inside its own constructor, and another thread can reach it before construction finishes. The guarantee then does not apply, and the field can be observed holding its default value.

## Where the model touches the machine

Two smaller rules show the model reaching down. Word tearing is forbidden: adjacent elements of a `byte` array must be independently updatable, so a JVM on a processor without byte stores cannot implement the update as a read-modify-write of the enclosing word. References are always atomic regardless of volatility, which lets safe publication be a question of ordering rather than torn pointers. Both push cost onto the implementation to keep the programmer's picture simple, and the machinery that pays, the fences the JIT emits at each release and acquire, sits a layer down in [[cs/systems/cache-coherence|cache coherence]].

## Related Notes

- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] - where the happens-before partial order comes from
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models: Threads, Locks, and Actors]] - the design space the JMM commits Java to
- [[cs/systems/cache-coherence|Cache Coherence]] - the hardware layer the model refuses to describe
- [[cs/languages/Java/virtual-threads-and-structured-concurrency|Virtual Threads and Structured Concurrency]] - the same guarantees, many more threads
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - monitors, locks, and the release/acquire pairs that generate the edges
- [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send, Sync, and Fearless Concurrency]] - enforcing the same discipline in the type system instead

## Sources

- "Chapter 17. Threads and Locks," The Java Language Specification, Java SE 21 Edition. https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html . Supports the shared-variable scope and the exclusion of locals, the conflicting-access and data-race definitions, the synchronizes-with edges and release/acquire naming, the caveat that happens-before does not force implementation order, the correct-synchronization theorem, the non-atomic treatment of long and double, the volatile long/double atomicity rule, the complete-initialization and final-field guarantees, and the register-caching latitude granted for final fields.
- "java.util.concurrent (Java SE 21 API)," Oracle. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html . Supports the statement that a write is guaranteed visible to another thread only if it happens-before the read.
