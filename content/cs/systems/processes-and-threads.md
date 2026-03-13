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

## Intuition

A computer has far fewer CPUs than things it needs to run. The OS solves this by giving each program the *illusion* of having the CPU to itself, rapidly switching between them. A **process** is the heavyweight unit - its own address space, file descriptors, and security context. A **thread** is the lightweight unit - it shares an address space with sibling threads but has its own stack and register state. Switching between them (a **context switch**) is the price of multiplexing.

Think of processes as separate apartments in a building (isolated, can't see each other's stuff) and threads as roommates within one apartment (shared kitchen and living room, need house rules to avoid conflicts).

## Core Idea

**Process.** Created by `fork` (POSIX) or `CreateProcess` (Windows). Each process gets an independent virtual address space, so a crash in one process cannot corrupt another. Inter-process communication (IPC) - pipes, shared memory, sockets - is explicit and controlled.

**Thread.** Created within a process (`pthread_create`, `std::thread`). Threads share heap memory, global variables, and file descriptors, making communication cheap but correctness hard - shared mutable state demands synchronization (locks, atomics, message passing).

**User-level vs kernel-level threads.** Kernel threads are scheduled by the OS and can run on different cores. User-level threads (green threads, goroutines, Erlang processes) are scheduled by a runtime in user space - cheaper to create and switch, but a blocking syscall can stall the entire runtime unless the runtime multiplexes onto multiple kernel threads (M:N threading).

**Context switch.** When the OS preempts a running thread, it saves registers and program counter to a kernel structure (the thread control block), then restores another thread's state. Cost: typically 1-10 microseconds on modern hardware, dominated by cache and TLB pollution rather than the save/restore itself.

What gets saved during a context switch:
- General-purpose registers (rax, rbx, ... on x86-64)
- Stack pointer and program counter
- Floating-point / SIMD state (if used)
- Kernel stack pointer
- For a full process switch: page-table base register (CR3 on x86), which flushes the TLB

**Scheduling.** The scheduler decides *which* thread runs next. Classic policies include:

| Policy | Idea | Trade-off |
|--------|------|-----------|
| FIFO / FCFS | Run to completion in arrival order | Simple but poor for short jobs behind long ones |
| Round-Robin | Fixed time quantum, rotate | Fair but high context-switch overhead if quantum is small |
| MLFQ | Multiple queues with different priorities and quanta | Good balance of responsiveness and throughput |
| CFS (Linux) | Virtual runtime via red-black tree, proportional share | Near-ideal fairness with O(log n) pick-next |
| EDF (real-time) | Earliest deadline first | Optimal for periodic real-time tasks |

**Process states.** A process cycles through: **new** (being created), **ready** (waiting for CPU), **running** (executing on a core), **blocked/waiting** (waiting for I/O or a lock), and **terminated** (finished or killed).

```
         admit           dispatch
  NEW ─────────→ READY ──────────→ RUNNING ──→ TERMINATED
                  ↑                   │
                  │    I/O or event    │
                  └──── BLOCKED ←─────┘
                       (waiting)
```

## Example

A web server forks a child process per connection (Apache prefork model) or spawns a thread per request (Apache worker model):

```
fork model:
  parent (PID 1)
    └── child (PID 2) - handles request A (isolated address space)
    └── child (PID 3) - handles request B

thread model:
  process (PID 1)
    ├── thread 0 (main, accepts connections)
    ├── thread 1 - handles request A  (shared heap)
    └── thread 2 - handles request B  (shared heap)
```

The fork model is safer (one crash doesn't take down others) but uses more memory. The thread model is faster (no address-space duplication) but requires careful locking.

**Context-switch cost sketch.** If a quantum is 10 ms and a context switch costs 5 us, overhead is 0.05 % - negligible. Shrink the quantum to 100 us and overhead jumps to 5 %, which is noticeable.

## Related Notes

- [[concurrency-models-threads-locks-and-actors|Concurrency Models - Threads, Locks & Actors]] - higher-level abstractions built on OS threads
- [[virtual-memory|Virtual Memory]] - the address-space isolation that makes processes safe
- [[file-systems|File Systems]] - another OS abstraction processes depend on
