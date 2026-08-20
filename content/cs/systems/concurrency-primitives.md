---
title: Concurrency Primitives
description: "Mutex, semaphore, condition variable, and spinlock: the four building blocks of shared-state synchronization, what each one is actually for, and the trade-off that separates them."
draft: false
comments: true
tags:
  - cs
  - systems
  - concurrency
date: 2026-05-27
updated:
aliases:
  - Synchronization Primitives
  - Mutex Semaphore Condition Variable Spinlock
---

Two threads sharing memory is the source of the worst class of bugs in systems code: [[race-conditions-and-toctou|races]] that appear once a week under load and never in a debugger. Synchronization primitives are the small, sharp tools that make shared state safe. There are only a handful of them, and the mistake beginners make is treating them as interchangeable. They are not. Each answers a different question.

The [[concurrency-models-threads-locks-and-actors|concurrency models]] note covers the high-level taxonomy (shared memory versus message passing), and [[concurrency-in-practice|concurrency in practice]] covers what real languages do with it. This note is the layer below both: the individual primitives themselves.

> [!note] The idea
> Mutual exclusion and waiting-for-a-condition are two different problems, and the primitives split along that line. A mutex answers "only one thread inside here at a time." A condition variable answers "sleep until someone tells me the state changed." A semaphore counts a resource. A spinlock is a mutex that burns CPU instead of sleeping, a bet that the wait will be so short that going to sleep would cost more than spinning. Pick the wrong one and you get either a correctness bug or a performance cliff.

## Mutex: exclusive access

A lock or mutex (from *mutual exclusion*) is "a synchronization primitive that prevents state from being modified or accessed by multiple threads of execution at once. Locks enforce mutual exclusion concurrency control policies." One thread holds it, does its work in the critical section, releases it; everyone else waiting to acquire it blocks. Most mutexes are advisory: "each thread cooperates by acquiring the lock before accessing the corresponding data." The lock protects nothing on its own, it works only because every thread agrees to acquire it first. Forget one access and the mutex is useless.

## Semaphore: counting a resource

A semaphore generalizes the mutex from "one" to "N." It is "a variable or abstract data type used to control access to a common resource that is being accessed by multiple threads." The intuition Wikipedia offers is a record of "how many units of a particular resource are available, coupled with operations to adjust that record safely as units are acquired or become free, and, if necessary, wait until a unit of the resource becomes available."

Semaphores come in two flavors. A counting semaphore allows an arbitrary count, use it to cap a connection pool at, say, ten in-flight requests. A binary semaphore is "restricted to the values 0 and 1 (or locked/unlocked, unavailable/available)," which is essentially a mutex. In fact, "the simplest type of lock is a binary semaphore."

> [!warning]
> A semaphore prevents nothing by itself. "Though semaphores are useful for preventing race conditions, they do not guarantee their absence." A semaphore counts; it does not enforce that every thread checks it. Correctness still rests on every participant using the primitive correctly on every path.

## Condition variable: waiting for a change

A mutex lets you in one at a time, but it cannot express "wait until the queue is non-empty." That is the condition variable's job, and it never travels alone. It lives inside a monitor: "A monitor consists of a mutex (lock) and at least one condition variable." The point of a monitor is that "at each point in time, at most one thread may be executing any of the monitor's methods," so the shared state is always touched under mutual exclusion.

The condition variable is what lets a thread inside the monitor step aside and wait without holding everyone else out. It is "a mechanism for threads to temporarily give up exclusive access in order to wait for some condition to be met, before regaining exclusive access and resuming their task." A waiting thread releases the mutex and sleeps; when another thread changes the state it signals the condition variable, which wakes a waiter and hands the mutex back. "A condition variable is explicitly 'signalled' when the object's state is modified, temporarily passing the mutex to another thread 'waiting' on the condition variable." Classic use: a bounded buffer where consumers wait on "not empty" and producers wait on "not full."

## Spinlock: don't sleep, spin

Every primitive above puts a waiting thread to sleep, which means a [[context-switching|context switch]] out and back. That is the right call if the wait is long. If the wait is a few instructions, the switch costs more than the wait itself. The spinlock is the answer: "a lock that causes a thread trying to acquire it to simply wait in a loop ('spin') while repeatedly checking whether the lock is available." The thread stays on the CPU, burning cycles, a form of busy waiting.

The trade-off is explicit. "Because they avoid overhead from operating system process rescheduling or context switching, spinlocks are efficient if threads are likely to be blocked for only short periods. For this reason, operating-system kernels often use spinlocks." But hold one too long and it is pure waste: "spinlocks become wasteful if held for longer durations, as they may prevent other threads from running and require rescheduling."

## Choosing

| Primitive | Question it answers | Waiting cost |
|-----------|---------------------|--------------|
| Mutex | Only one thread in here at a time? | Sleeps (blocks) |
| Semaphore | How many units of this resource are free? | Sleeps (blocks) |
| Condition variable | Sleep until the shared state changes | Sleeps, releasing the mutex |
| Spinlock | One at a time, but the wait is tiny | Spins on the CPU (busy wait) |

The rule of thumb falls out of the table: use a mutex for exclusion, a semaphore to count, a condition variable to wait on a state change, and a spinlock only when the critical section is short and sleeping would cost more than spinning, which in practice is mostly inside the kernel.

## Related Notes

- [[concurrency-models-threads-locks-and-actors|Concurrency Models: Threads, Locks, and Actors]] - the higher-level taxonomy these primitives implement
- [[concurrency-in-practice|Concurrency in Practice]] - how Python, Rust, and C++ expose and constrain these tools
- [[race-conditions-and-toctou|Race Conditions and TOCTOU]] - the bug class these primitives exist to prevent
- [[context-switching|Context Switching]] - the sleep-versus-spin cost that decides between a mutex and a spinlock

## Sources

- "Lock (computer science)," Wikipedia. https://en.wikipedia.org/wiki/Lock_%28computer_science%29 . Backs the mutex definition (a synchronization primitive preventing simultaneous access, enforcing mutual exclusion), that locks are generally advisory with each thread cooperating by acquiring first, and that the simplest lock is a binary semaphore.
- "Semaphore (programming)," Wikipedia. https://en.wikipedia.org/wiki/Semaphore_%28programming%29 . Backs the semaphore as a variable controlling access to a shared resource, the record-of-available-units intuition, counting versus binary semaphores, and that semaphores do not guarantee the absence of race conditions.
- "Monitor (synchronization)," Wikipedia. https://en.wikipedia.org/wiki/Monitor_%28synchronization%29 . Backs the monitor as a mutex plus at least one condition variable, mutual exclusion of monitor methods, and the condition variable letting a thread give up exclusive access to wait and be signalled when the state changes.
- "Spinlock," Wikipedia. https://en.wikipedia.org/wiki/Spinlock . Backs the spinlock spinning in a loop as busy waiting, its efficiency for short waits by avoiding rescheduling and context switching, why kernels use them, and its wastefulness when held for long durations.
