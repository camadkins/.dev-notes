---
title: Inter-Process Communication
description: Pipes, FIFOs, shared memory, message queues, signals, and sockets - the kernel's menu of ways for isolated processes to exchange data, and the tradeoff each one makes.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-02-09
updated:
aliases:
  - IPC
  - Pipes and Sockets
---

[[virtual-memory|Virtual memory]] exists to keep processes from touching each other's memory. That isolation is the whole point, and it is also a problem: real systems are built from many processes that need to cooperate. A shell pipes one program's output into another; a database server hands a query result back to a client; a daemon tells a worker to reload its config. None of that can happen through raw shared pointers, because there are no shared pointers across the isolation boundary. Inter-process communication is the set of controlled channels the kernel opens through that boundary.

Formally, IPC "is the sharing of data between running processes in a computer system, or between multiple such systems," and the "mechanisms for IPC may be provided by an operating system."

> [!note] The idea
> There is no single IPC mechanism, there is a menu, and the axis that organizes it is what you are willing to trade. Shared memory is the fastest because it removes the kernel from the data path entirely, but it hands you back the synchronization problem to solve yourself. Everything else, pipes, queues, sockets, buys you coordination and message framing by routing through the kernel, and pays for it in copies. Picking an IPC mechanism is picking a point on the speed-versus-safety-versus-reach curve.

## The channels

### Pipes and FIFOs

A pipe is the oldest and simplest. Per the Linux manual, pipes and FIFOs "provide a unidirectional interprocess communication channel. A pipe has a read end and a write end. Data written to the write end of a pipe can be read from the read end of the pipe." An anonymous pipe (the `|` in your shell) connects related processes: it "is created using pipe(2), which creates a new pipe and returns two file descriptors, one referring to the read end of the pipe, the other referring to the write end." Because the file descriptors are inherited across `fork`, only relatives can share an anonymous pipe.

A named pipe, or FIFO, removes that restriction by giving the channel a name. "A FIFO (short for First In First Out) has a name within the filesystem (created using mkfifo(3)), and is opened using open(2). Any process may open a FIFO, assuming the file permissions allow it." Wikipedia frames it the same way: a named pipe is "a pipe that is treated like a file," so unrelated processes "write to and read from a named pipe, as if it were a regular file." The tradeoff pipes make is simplicity for shape: they are byte streams, unidirectional, and best for a producer feeding a consumer.

### Shared memory

Shared memory is the fast lane. "Multiple processes are given access to the same block of memory, which creates a shared buffer for the processes to communicate with each other." The reason it is fast is exactly what makes it dangerous: after the initial setup the kernel is no longer involved, so there are no per-message copies, but nothing coordinates the two writers either. Shared memory alone is not enough; it must be paired with [[concurrency-primitives|synchronization primitives]] (a semaphore or mutex in the shared region) or you get [[race-conditions-and-toctou|races]]. It buys raw throughput at the cost of making correctness your job.

### Message queues

A message queue sits between pipes and sockets. It is "a data stream similar to a socket, but which usually preserves message boundaries." That boundary preservation is the key difference from a pipe: a pipe is a flat byte stream where a 100-byte write and two 50-byte writes are indistinguishable to the reader, whereas a queue delivers discrete messages. Queues are "typically implemented by the operating system," and let "multiple processes read and write to the message queue without being connected to each other," decoupling sender and receiver in time.

### Signals

A signal is the odd one out: it carries almost no data. It is "a system message sent from one process to another, not usually used to transfer data but instead used to remotely command the partnered process." Think of it as a doorbell, not a letter. `SIGTERM` says "please exit," `SIGKILL` says "you are gone," `SIGHUP` conventionally says "reload." Signals are asynchronous, interrupting the target wherever it is executing, which is why signal handlers are notoriously constrained in what they may safely do.

### Sockets

Sockets are the IPC mechanism that also reaches across machines. Socket data is "sent over a network interface, either to a different process on the same computer or to another computer on the network." That reach is the whole appeal: the same API that talks to a process on `localhost` talks to a process across the planet. A Unix domain socket stays local and skips the network stack; a TCP socket goes out over the wire. The cost is generality overhead, but sockets are the only entry on this menu whose scope is not limited to one host.

## Choosing

| Mechanism | Shape | Reach | The tradeoff |
|-----------|-------|-------|--------------|
| Anonymous pipe | Byte stream, one-way | Related processes only | Simplest, but relatives only and no framing |
| Named pipe (FIFO) | Byte stream, one-way | Any process on the host | Filesystem name lifts the relative-only limit |
| Shared memory | Raw memory region | Same host | Fastest (no copies), but you must synchronize |
| Message queue | Discrete messages | Same host | Preserves boundaries, decouples sender/receiver |
| Signal | A number, no payload | Same host | Command, not data; asynchronous and constrained |
| Socket | Stream or datagram | Same host or across the network | Only cross-machine option; general-purpose overhead |

An IPC mechanism is "either synchronous or asynchronous," and synchronization primitives can layer synchronous behavior onto an asynchronous channel. The practical read of the table: reach for a pipe when a stream flows one direction between related programs, shared memory when you need speed and can pay for your own locking, a queue when message boundaries matter, a signal to nudge rather than to send, and a socket the moment the other process might live on another machine.

## Related Notes

- [[processes-and-threads|Processes & Threads]] - the isolated entities IPC exists to connect
- [[system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - most IPC channels are opened and driven through syscalls
- [[concurrency-primitives|Concurrency Primitives]] - the synchronization shared memory forces you to add yourself
- [[virtual-memory|Virtual Memory]] - the isolation that makes IPC necessary in the first place

## Sources

- "Inter-process communication," Wikipedia. https://en.wikipedia.org/wiki/Inter-process_communication . Backs the definition of IPC as the sharing of data between running processes, the synchronous/asynchronous distinction, and the per-mechanism descriptions of anonymous pipes, named pipes, shared memory, message queues (preserving message boundaries), signals (commanding rather than transferring data), and sockets (local or across a network).
- "pipe(7) - Linux manual page," man7.org. https://man7.org/linux/man-pages/man7/pipe.7.html . Backs the account of pipes and FIFOs as unidirectional channels with a read end and a write end, pipe(2) returning two file descriptors, and FIFOs having a filesystem name created with mkfifo(3) so any permitted process can open them.
