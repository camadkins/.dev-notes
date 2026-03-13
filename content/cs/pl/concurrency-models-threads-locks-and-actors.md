---
title: Concurrency Models - Threads, Locks, and Actors
description: How programming languages structure concurrent computation using shared memory, synchronization, and message passing.
draft: false
comments: true
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagram: comparative_overview (threads_vs_actors_vs_csp_timeline.svg)
---

## Why Concurrency Models Exist
Modern programs rarely run in isolation.  
From web servers to simulations, systems need to handle many tasks at once - reading files, responding to users, updating shared state.  
Concurrency models describe *how those tasks cooperate safely* while sharing time, memory, or messages.

Languages choose concurrency models to balance **speed, safety, and simplicity**.  
Understanding them clarifies why Go uses goroutines, why Java still uses threads, and why Erlang can run telecom systems for decades without restarting.

---

## Threads and Shared Memory
The **threaded model** is the most direct and oldest form of concurrency.  
Multiple threads execute simultaneously within one process, sharing the same address space.

### Key Idea
Each thread runs independently but can read and modify shared data.  
To prevent interference, languages provide **synchronization primitives** such as locks, mutexes, and condition variables.

> [!example]
> **Shared Counter**
> ```c
> // Two threads increment a shared integer
> for (int i = 0; i < 1000; i++) {
>   lock(m);
>   counter++;
>   unlock(m);
> }
> ```
> Without the lock, increments interleave unpredictably, losing updates - a classic *race condition*.

### Advantages
- **Speed:** direct memory access, zero copying.  
- **Low latency:** efficient for compute-heavy tasks.  
- **Widely supported:** core to C, C++, and Java runtimes.

### Drawbacks
- **Races:** two threads reading/writing the same variable unsafely.  
- **Deadlocks:** circular waits on locks.  
- **Livelocks / starvation:** threads spinning or never scheduled.  
- **Non-determinism:** difficult to reproduce or test.

> [!warning]
> In shared-memory systems, correctness depends on **discipline**, not guarantees.  
> One missing `lock()` or misplaced `volatile` can destabilize an entire program.

---

## Lock-Based Coordination
Locks are simple but error-prone.  
More sophisticated abstractions evolved to manage concurrency without explicit locking:

- **Monitors:** integrate locks and condition variables into objects (e.g., Java `synchronized`).  
- **Semaphores:** countable access tokens; used for resource pools.  
- **Barriers and latches:** ensure groups of threads reach a point before proceeding.  
- **Atomic operations:** hardware-level primitives for lock-free algorithms.

Languages like Rust address safety through *ownership and borrowing*, which statically prevent certain races while still compiling to efficient machine code.

---

## Actors and Message Passing
The **actor model** takes a different path: eliminate shared memory entirely.

Each actor is an independent computational entity with:
1. A local state (private data),
2. A mailbox for incoming messages,
3. The ability to spawn new actors and send messages.

Messages are **immutable** and **asynchronous**.  
An actor processes one message at a time, guaranteeing isolation without locks.

> [!tip]
> “Share memory by communicating, not communicate by sharing memory.” - Go proverb

### Example
```erlang
loop(State) ->
  receive
    {add, N} -> loop(State + N);
    {get, Caller} -> Caller ! {state, State}, loop(State)
  end.
````

This Erlang actor handles additions safely because only it can modify its internal state.

### Advantages

- **No data races by design.**
    
- **Compositional:** actors can be distributed across nodes.
    
- **Fault isolation:** one actor’s failure doesn’t crash others.
    

### Drawbacks

- **Message ordering:** no guarantee across senders.
    
- **Latency:** communication overhead.
    
- **Backpressure:** unbounded queues can overflow.
    

> [!warning]  
> Actor systems trade shared-memory bugs for _coordination bugs_.  
> Understanding delivery guarantees and queue behavior is crucial.

---

## Communicating Sequential Processes (CSP)

A third model, **CSP**, connects independent processes through explicit channels.  
Instead of shared memory or mailboxes, processes use synchronous or buffered sends and receives.

Go’s goroutines and channels, as well as Rust’s `crossbeam`, are modern CSP descendants.

> [!example]  
> **Go Channel Example**
> 
> ```go
> ch := make(chan int)
> go func() { ch <- 42 }()
> x := <-ch  // waits for value
> ```
> 
> The send and receive synchronize automatically, avoiding explicit locks.

### Key Principles

- **Happens-before relation:** defines safe ordering of communication.
    
- **Select / alt:** allows choice among multiple channel operations.
    
- **Determinism:** well-structured channel programs are reproducible and analyzable.
    

CSP strikes a middle ground: it enforces communication discipline like actors but allows direct channel reasoning like threads.

---

## Comparing Models

|Feature|Threads + Locks|Actors|CSP|
|---|---|---|---|
|Memory sharing|Shared heap|Isolated mailboxes|Explicit channels|
|Synchronization|Locks, monitors|Message order|Channel operations|
|Safety|Manual discipline|Data-race free|Structured communication|
|Performance|Very fast|Moderate|Moderate|
|Reasoning|Difficult|Localized|Composable|

> [!note]  
> Most real languages blend these models.  
> C++20 adds atomic channels; Go actors use CSP channels internally; Akka and Orleans layer actor frameworks on thread pools.

---

## Practical Guidelines

1. **Keep shared state minimal.**  
    Immutable data simplifies reasoning.
    
2. **Acquire locks in a consistent global order.**  
    Prevents deadlocks.
    
3. **Use timeouts or non-blocking primitives.**  
    Avoids starvation.
    
4. **Model concurrency at the message or channel level, not the thread level.**  
    Higher-level abstractions scale better.
    

---

## Related Notes

- [[abstract-machines-cek-secd|Abstract Machines - CEK and SECD]]
    
- [[operational-semantics-big-step-small-step|Operational Semantics - Big-Step & Small-Step]]
    
- [[scoping-binding-and-closures|Scoping, Binding, and Closures]]