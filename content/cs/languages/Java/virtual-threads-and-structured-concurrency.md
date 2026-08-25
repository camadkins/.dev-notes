---
title: "Virtual Threads and Structured Concurrency"
description: "Mounting, unmounting, and the blocking operations that still pin a carrier, plus what structured concurrency adds once threads are cheap enough to be disposable."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-06-24
updated:
aliases: []
---

For twenty years the Java answer to "I have ten thousand concurrent requests" was a thread pool, and the cost was the thread-per-request style. Once a thread is an expensive OS object you have to share it, and once you share it you cannot block in it, and once you cannot block in it your request handler stops being a method that returns a value and becomes a chain of callbacks. JEP 444 undoes that trade by attacking its premise.

> [!note] The idea
> A virtual thread is the same `java.lang.Thread` abstraction with its stack moved from the OS into the garbage-collected heap. That single relocation is what makes suspension cheap: parking a virtual thread is copying a heap object reference, not a kernel transition. Everything else follows. Threads become disposable, thread pools become an anti-pattern, and the interesting engineering question shifts from "how many threads can I afford" to "which blocking calls still fail to give the carrier back."

## The relocation

The JEP's own framing is an analogy to virtual memory: just as an OS maps a large virtual address space onto limited physical RAM, "a Java runtime can give the illusion of plentiful threads by mapping a large number of virtual threads to a small number of OS threads." That is classic M:N scheduling, the design the Java 1.1 green threads implementation abandoned and which [[cs/systems/processes-and-threads|the process and thread model]] describes in its general form.

The mechanism is stated plainly: "The stacks of virtual threads are stored in Java's garbage-collected heap as stack chunk objects," growing and shrinking as the program runs. In the vocabulary of [[cs/pl/continuations-cps|continuations]], a parked virtual thread is a reified continuation on the heap, and resuming it is applying that continuation. The JEP never uses the word and does not need to: a thread's remaining work is a value the runtime can put down and pick up again. What `async`/`await` rewriters do at compile time, the JVM does at run time, below the level where source code can tell.

One consequence deserves attention. "Unlike platform thread stacks, virtual thread stacks are not GC roots," so a concurrently scanning collector does not walk a million of them in a stop-the-world pause. The thing that makes virtual threads possible is also the thing that keeps the collector from choking on them.

## Mounting, unmounting, and the carrier

Virtual threads are scheduled by the JDK rather than the OS: "the JDK has its own scheduler," and it "is a work-stealing ForkJoinPool that operates in FIFO mode," with parallelism defaulting to the number of available processors. That FIFO choice is deliberate, distinct from the LIFO common pool used by parallel streams.

The scheduler "assigns the virtual thread for execution on a platform thread by mounting the virtual thread on a platform thread." That platform thread is then the virtual thread's carrier. Unmounting is the reverse: the virtual thread's stack goes back to the heap and the carrier is free to pick up someone else. "Typically, a virtual thread will unmount when it blocks on I/O or some other blocking operation in the JDK," and when the operation is ready to complete it is resubmitted to the scheduler.

The abstraction is airtight from Java's side. "The identity of the carrier is unavailable to the virtual thread," the two stack traces are separate, and thread locals do not leak between them. From native code the illusion breaks: both run on the same OS thread, and native code invoked repeatedly on one virtual thread may see a different OS thread identifier each time.

One thing this scheduler does not do: "The scheduler does not currently implement time sharing for virtual threads," so there is no forceful preemption of a virtual thread that has burned its quantum. A CPU-bound virtual thread that never blocks holds its carrier indefinitely, a real difference from the [[cs/systems/process-scheduling-algorithms|preemptive scheduling]] the OS applies to platform threads.

## What still pins

The scalability story lives or dies on which blocking calls give the carrier back. "The vast majority of blocking operations in the JDK will unmount the virtual thread, freeing its carrier and the underlying OS thread to take on new work." Sockets, `BlockingQueue.take()`, `Thread.sleep`, the HTTP client: all fine. The exceptions come in two flavors, and mixing them up is the usual source of confusion.

Some operations block without unmounting because the platform cannot do better. "Some blocking operations in the JDK do not unmount the virtual thread, and thus block both its carrier and the underlying OS thread," due to limits at the OS level (many filesystem operations) or the JDK level (`Object.wait()`). For these the runtime compensates by temporarily growing the scheduler's pool past the processor count, so the application still progresses.

Pinning is the other flavor, and it is not compensated. As of JDK 21 there are exactly two cases: "When it executes code inside a synchronized block or method, or" when it executes a native method or foreign function. Block on I/O while pinned and the carrier is stuck for the duration. Critically, "The scheduler does not compensate for pinning by expanding its parallelism," so frequent long pinning eats carriers with nothing replacing them. The prescribed fix is to convert hot `synchronized` blocks guarding I/O into `ReentrantLock`; infrequent or purely in-memory ones need no change. JFR emits `jdk.VirtualThreadPinned` when a thread parks while pinned, which is how you find these rather than guessing.

> [!warning] Pooling
> "Virtual threads are cheap and plentiful, and thus should never be pooled: A new virtual thread should be created for every application task." Handing virtual threads to an `ExecutorService` with a fixed size reintroduces exactly the scarcity the feature removes. The only pool in the picture is the carrier pool, and that one is the JDK's problem.

## What structure adds

A million cheap threads is a supply of concurrency, not a discipline for it. Launch two subtasks on an `ExecutorService` and nothing ties them to the method that started them: "Observability tools such as thread dumps, for example, will show" the subtask frames "on the call stacks of unrelated threads, with no hint of the task-subtask relationship." Cancellation is manual, leaks are easy, and the parent can return while children keep running.

Structured concurrency, a preview API in JDK 21 via JEP 453, imposes the missing invariant: "If a task splits into concurrent subtasks then they all return to the same place, namely the task's code block." A `StructuredTaskScope` in a try-with-resources block confines subtask lifetimes so that "the lifetime of a concurrent subtask is confined to the syntactic block of its parent task." Fork inside the block, `join()` as a unit, and the block cannot be exited with children still alive.

The payoff is a data structure. Because lifetimes nest the way syntax nests, "the runtime can reify the hierarchy of tasks into a tree that is the concurrent counterpart of the call stack of a single thread." Deadlines then apply to a subtree, a failure in one child can short-circuit its siblings under a shutdown policy, and a thread dump can show children indented under their parent. The stated goal is to "eliminate common risks arising from cancellation and shutdown, such as thread leaks and cancellation delays."

Structure recovering something unstructured concurrency threw away is the argument Dijkstra made about `goto` and block structure, one level up. Cheap threads made it affordable; the scope makes it enforceable.

## Related Notes

- [[cs/pl/continuations-cps|Continuations and CPS]] - the general form of the suspend-and-resume mechanism
- [[cs/systems/processes-and-threads|Processes and Threads]] - the M:N scheduling model virtual threads revive
- [[cs/systems/process-scheduling-algorithms|Process Scheduling Algorithms]] - what the JDK scheduler does and does not do
- [[cs/languages/Java/the-java-memory-model-and-happens-before|The Java Memory Model and Happens-Before]] - the guarantees that carry over unchanged
- [[cs/languages/Python/the-gil-and-python-concurrency|The GIL and Python Concurrency]] - a runtime that answered the same question differently
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - suspension exposed in the language instead of hidden in the runtime

## Sources

- "JEP 444: Virtual Threads," OpenJDK. https://openjdk.org/jeps/444 . Supports the virtual-memory analogy and M:N mapping, heap-allocated stack chunks, virtual thread stacks not being GC roots, the JDK's own FIFO work-stealing ForkJoinPool scheduler and its default parallelism, mounting and unmounting, carrier opacity to Java code, the absence of time sharing, the unmount behavior of most JDK blocking operations, the uncompensated cases and the two pinning scenarios, the lack of parallelism compensation for pinning, and the never-pool guidance.
- "JEP 453: Structured Concurrency (Preview)," OpenJDK. https://openjdk.org/jeps/453 . Supports the thread-dump critique of unstructured concurrency, the governing principle that subtasks return to the same code block, lexical confinement of subtask lifetimes, reification of the task hierarchy as a tree analogous to the call stack, and the stated goal of eliminating thread leaks and cancellation delays.
