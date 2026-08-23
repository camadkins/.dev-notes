---
title: Processes & Threads
description: OS execution units, context switching, and CPU scheduling - how the operating system multiplexes programs onto hardware.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-03-12
updated:
aliases: []
---

## The Core Abstraction

A computer has far fewer CPUs than things it needs to run. Your machine might have 8 cores but hundreds of active processes. The OS solves this by giving each program the *illusion* of having the CPU to itself, rapidly switching between them. This multiplexing is one of the most fundamental things an OS does, and the two units of execution it works with are processes and threads.

Think of processes as separate apartments in a building: isolated, can't see each other's stuff. Threads are roommates within one apartment: shared kitchen and living room, but they need house rules to avoid conflicts.

---

## Processes

Created by `fork` (POSIX) or `CreateProcess` (Windows). Each process gets:
- Its own [[virtual-memory|virtual address space]]
- Its own file descriptor table
- Its own security context

The key property is **isolation**. A crash in one process cannot corrupt another. If you've ever wondered why [[cs/security/sandboxing-and-isolation|Chrome runs each tab as a separate process]], this is why: a misbehaving website can crash its process without taking down the whole browser.

Inter-process communication (IPC) is explicit and controlled: pipes, shared memory, [[cs/networking/ports-and-sockets|sockets]], message queues. The cost of this isolation is that sharing data between processes requires going through the kernel.

---

## Threads

Created within a process (`pthread_create`, `std::thread`). Threads share heap memory, global variables, and file descriptors, making communication cheap but correctness hard.

> [!warning]
> Shared mutable state is where most concurrency bugs live. Two threads reading and writing the same variable without synchronization leads to data races, which can produce arbitrarily wrong results. This is not a theoretical concern; it's one of the most common sources of hard-to-reproduce bugs in systems code.

Synchronization primitives (mutexes, condition variables, [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|atomics]], message passing) exist to manage shared state, but they come with their own pitfalls: deadlocks, priority inversion, lock contention.

### User-Level vs Kernel-Level Threads

| Type | Scheduled by | Pros | Cons |
|------|-------------|------|------|
| Kernel threads | OS scheduler | Can run on different cores, syscalls don't block siblings | Heavier to create/switch |
| User-level threads (green threads, goroutines) | Runtime in user space | Cheap to create, fast context switch | Blocking syscall can stall the runtime |

[[cs/languages/Go/goroutines-and-the-scheduler|Go's goroutines]] and Erlang's processes use M:N threading: many user-level threads multiplexed onto a smaller number of kernel threads. This gives you the cheap creation of user threads with the parallelism of kernel threads.

---

## Context Switches

When the OS preempts a running thread, it saves the current state and restores another thread's state. What gets saved:

- General-purpose registers (rax, rbx, ... on x86-64)
- Stack pointer and program counter
- Floating-point / SIMD state (if used)
- Kernel stack pointer
- For a full process switch: page-table base register (CR3 on x86), which flushes the TLB

> [!note]
> The actual register save/restore is fast (microseconds). The real cost is **indirect**: the new thread has a cold cache and a cold TLB. Rebuilding that working set can cost far more than the switch itself. This is why people say "context switches are expensive" even though the mechanism is simple.

**Cost sketch:** If a time quantum is 10 ms and a context switch costs 5 us, overhead is 0.05%, negligible. Shrink the quantum to 100 us and overhead jumps to 5%, which is noticeable. The quantum length is a tradeoff between responsiveness (short quanta) and throughput (long quanta, fewer switches).

---

## Scheduling

The scheduler decides *which* thread runs next. This is one of those areas where simple policies have surprising consequences:

| Policy | Idea | Trade-off |
|--------|------|-----------|
| FIFO / FCFS | Run to completion in arrival order | Simple but poor for short jobs behind long ones |
| Round-Robin | Fixed time quantum, rotate | Fair but high context-switch overhead if quantum is small |
| MLFQ | Multiple queues with different priorities and quanta | Good balance of responsiveness and throughput |
| CFS (Linux) | Virtual runtime via red-black tree, proportional share | Near-ideal fairness with O(log n) pick-next |
| EDF (real-time) | Earliest deadline first | Optimal for periodic real-time tasks |

> [!tip]
> Linux's CFS (Completely Fair Scheduler) tracks how much CPU time each task has received and always picks the task with the least accumulated time. It uses a red-black tree keyed by virtual runtime, so picking the next task is O(log n). The elegance is that fairness falls out naturally from this simple rule.

MLFQ deserves extra attention because it handles the common case well: interactive tasks (lots of I/O, short CPU bursts) get boosted to high-priority queues, while CPU-bound tasks sink to lower-priority queues with longer quanta. The system stays responsive for the user while still giving batch work its fair share.

---

## Process Lifecycle

A process cycles through these states:

```
         admit           dispatch
  NEW ─────────→ READY ──────────→ RUNNING ──→ TERMINATED
                  ↑                   │
                  │    I/O or event    │
                  └──── BLOCKED ←─────┘
                       (waiting)
```

> [!note]
> The BLOCKED state is important to understand. When a process does I/O (reading a file, waiting for network data), it's not burning CPU cycles. The OS moves it to BLOCKED and runs something else. When the I/O completes, the process moves back to READY. This is why a system with many I/O-bound processes can feel responsive even with limited cores.

---

## Concrete Example: Web Server Models

A web server has to handle many concurrent connections. The classic approaches map directly onto process/thread tradeoffs:

```
fork model (Apache prefork):
  parent (PID 1)
    └── child (PID 2) - handles request A (isolated address space)
    └── child (PID 3) - handles request B

thread model (Apache worker):
  process (PID 1)
    ├── thread 0 (main, accepts connections)
    ├── thread 1 - handles request A  (shared heap)
    └── thread 2 - handles request B  (shared heap)
```

The fork model is safer (one crash doesn't take down others) but uses more memory. The thread model is faster (no address-space duplication) but requires careful locking. Modern servers (nginx, Node.js) often use a third approach: event-driven I/O with a single thread per core, avoiding both the memory overhead of forking and the complexity of shared-state threading.

## Related Notes

- [[concurrency-models-threads-locks-and-actors|Concurrency Models - Threads, Locks & Actors]] - higher-level abstractions built on OS threads
- [[virtual-memory|Virtual Memory]] - the address-space isolation that makes processes safe
- [[file-systems|File Systems]] - another OS abstraction processes depend on

## Sources

- "Process (computing)," Wikipedia. https://en.wikipedia.org/wiki/Process_%28computing%29 . Supports the process model: isolated resources including file descriptors, OS-mediated isolation that prevents direct interference, and inter-process communication as the controlled sharing mechanism.
- "Thread (computing)," Wikipedia. https://en.wikipedia.org/wiki/Thread_%28computing%29 . Supports threads sharing process memory and the 1:1 (kernel-level), M:1 (user-level), and M:N (hybrid) threading models behind the user-vs-kernel thread table and goroutine example.
- "Context switch," Wikipedia. https://en.wikipedia.org/wiki/Context_switch . Supports saving and restoring registers, stack pointer, and program counter on a switch, and the TLB flush plus cold-cache cost that makes switches expensive.
- "Scheduling (computing)," Wikipedia. https://en.wikipedia.org/wiki/Scheduling_%28computing%29 . Supports the scheduling policies in the table, including first-come-first-served, round-robin, and priority scheduling, and the responsiveness-vs-throughput quantum tradeoff.
