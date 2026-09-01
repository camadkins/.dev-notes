---
title: Non-Blocking IO and the Event Loop
description: "Readiness notification lets one thread wait on ten thousand sockets. The interfaces differ on where the interest set lives and whether the kernel reports that you may act or that it already acted."
draft: false
comments: true
tags:
  - cs
  - systems
  - concurrency
  - operating-systems
date: 2026-08-31
updated:
aliases:
  - epoll
  - kqueue
  - IOCP
---

A thread blocked in `read()` is a thread that costs a stack, a scheduler slot, and a [[cs/systems/context-switching|context switch]] to wake, and is doing nothing at all. One thread per connection is fine at a hundred connections and is the whole problem at ten thousand. Dan Kegel coined the name for that wall in 1999, the C10k problem, citing the Simtel FTP host cdrom.com serving 10,000 clients at once over 1 gigabit-per-second Ethernet. Handling many concurrent connections is a different problem from handling many requests per second: the second needs throughput, the first needs efficient scheduling of connections to sockets, and the connections are mostly idle.

> [!note] The idea
> Non-blocking IO removes the thread from the waiting, and something has to take over the waiting. That something is a kernel object holding your interest set, and the whole design space is two questions about it. Does the interest set live in user space, rebuilt and copied on every call, or in the kernel, registered once? And does the kernel tell you that an operation *may now proceed* (readiness) or that it *has already completed* (completion)? Every one of `select`, `poll`, `epoll`, `kqueue`, IOCP, and `io_uring` is one pair of answers to those two questions.

## The O(n) that started it

`select` examines the status of file descriptors of open IO channels, and `poll` is the System V-era successor. Both take the full set of descriptors you care about as an argument on every call. That is the defect: the kernel has no memory of what you asked about last time, so every iteration of the loop copies the whole interest set in and scans it, and the cost of one iteration is proportional to the number of connections you are watching rather than to the number that actually became ready. With ten thousand mostly-idle sockets, you pay ten thousand units of work to learn about the three that have data. With the C10k problem, both `select` and `poll` have been superseded by `kqueue`, `/dev/poll`, `epoll`, and IO completion ports.

`select` carries a second, sharper limit: `nfds` is an integer one more than the maximum of any file descriptor in any of the sets, and the descriptor sets are fixed-width bitmaps. The interface is bounded by a compile-time constant, not by your memory.

## Registration: keep the interest set in the kernel

`kqueue` came first, introduced in FreeBSD 4.1 in July 2000 and authored by Jonathan Lemon; the name means kernel event queue. `epoll` followed on Linux, first shipping in kernel 2.5.45 in October 2002, and where the older calls operate in O(n) time, `epoll` operates in O(1). The saving is entirely structural. The set of descriptors you are watching is created once with `epoll_create1`, modified incrementally with `epoll_ctl` (add, modify, delete), and `epoll_wait` returns only the events that fired. Registration is amortized across the life of the connection instead of repeated per loop iteration.

The kernel side keeps that set in a [[cs/dsa/rb-tree|red-black tree]], which is a small and satisfying bridge: the thing that makes an event loop scale to a million sockets is an ordinary balanced binary search tree, chosen for exactly the reason [[cs/dsa/trees|any balanced tree]] is chosen, logarithmic insert and delete under a workload that mutates the set constantly as connections open and close.

`kqueue` makes one design choice differently and it is worth noticing. `epoll` splits registration and waiting into two system calls; `kqueue` uses `kevent(2)` for both, taking a `changelist` of modifications that are applied before waiting begins and returning pending events in an `eventlist`. One [[cs/systems/system-calls-and-the-kernel-boundary|system call]] per main event loop iteration rather than one per registration plus one per wait. `kqueue` is also the more general object: beyond descriptor readiness it reports file modification, [[cs/systems/interrupts-and-traps|signals]], asynchronous IO completion, child process state changes, timers with nanosecond resolution, and user-defined events. On Linux those each arrived as a separate `*fd` call that could be fed back into `epoll`; on BSD they were one interface from the start.

## Edge-triggered and level-triggered

`epoll` offers both modes and the difference is the standard source of event-loop bugs. In level-triggered mode, `epoll_wait` returns as long as the condition holds. In edge-triggered mode, it returns only when a new event is enqueued.

Take a pipe with data waiting. A level-triggered `epoll_wait` returns; you read part of the buffer; the next `epoll_wait` returns immediately, because the pipe still holds unread data. Edge-triggered, the second call blocks, because nothing new was written. The remaining bytes sit there until more data arrives, which on a request-response protocol may be never, because the peer is waiting for the reply you did not send.

> [!warning]
> Edge-triggered mode is the faster default only if the loop obeys its contract: on every wakeup, read until the descriptor returns `EAGAIN`, then wait again. Reading once per event is correct level-triggered and is a hang edge-triggered, and the hang appears under load rather than in a test, because it needs a read that stops short of the buffer's end.

## Completion: the other answer

Windows made the other choice. An IO completion port object is created and associated with a number of sockets or file handles; when IO is requested on the object, completion is indicated by a message queued to the port. The process is not notified of completion, but instead checks the port's message queue to determine the status of its requests, and the port manages multiple threads and their concurrency. IOCP shipped in Windows NT 3.5, and equivalents exist on AIX and Solaris 10 and later.

The distinction is not cosmetic. Readiness says the kernel will not block if you call `read` now, so the buffer copy still happens on your thread, inside your loop, in your time. Completion says the transfer is already done and here is the result, so the buffer was filled while your thread was elsewhere. Readiness composes badly with regular files, which are always "ready" in the `select` sense and still block for milliseconds on a disk seek. That gap is why a Unix event loop historically could not multiplex sockets and disk in the same loop, and pushed file IO onto a thread pool.

Linux closed it with `io_uring`, adopted in kernel 5.1 in 2019. Its predecessor, Linux AIO, only performed genuinely asynchronous operations with the `O_DIRECT` flag on already-allocated files, which rules out the [[cs/systems/virtual-memory|page cache]] and exposes the caller to complex direct-IO semantics, and it did not support sockets at all, so it could not multiplex network and disk IO. `io_uring` works by creating two circular buffers, the submission queue and the completion queue, shared between the kernel and the application. Sharing them is the point: it removes the extra system calls that would otherwise be needed to copy those buffers across the boundary, so a batch of operations can be submitted and reaped with little or no trapping into the kernel. The design paper fixes ownership, with the submission ring writable only by the application and the completion ring writable only by the kernel.

> [!warning]
> Shared mutable memory across the kernel boundary is a large attack surface, and it behaved like one. Google's security team reported in June 2023 that 60% of the exploits submitted to their bug bounty program in 2022 targeted `io_uring`. It was disabled for apps on Android, disabled entirely on ChromeOS and Google servers, and dropped from Docker's default seccomp profile. A performance interface that removes a [[cs/security/sandboxing-and-isolation|privilege boundary crossing]] has also removed the place the checks used to live.

## What the languages built on top

Everything above is one loop: wait for events, dispatch each to the code that was waiting for it, repeat. The awkward part is the second half. A callback per event fragments a sequential protocol into a pile of handlers that have to hand-carry their own state, which is the shape people mean by callback hell.

The language answer is to keep the loop and restore the sequential source. An `async` function compiles into a state machine whose suspension points are exactly the awaits, so the state a callback would carry by hand becomes fields of a compiler-generated struct. [[cs/languages/CSharp/async-await-and-the-state-machine|C#]], [[cs/languages/Rust/async-rust-futures-and-pinning|Rust]], and [[cs/languages/Python/asyncio-and-the-event-loop|Python's asyncio]] all make that same move over the same kernel primitives, and it is the general shape of [[cs/pl/coroutines-and-generators|coroutines]]. What varies is who owns the loop: asyncio ships one, Rust ships none and expects a runtime crate to supply it, and the CLR wires completions onto its thread pool.

The alternative answer is to keep the blocking source and make the thread cheap, which is what [[cs/languages/Java/virtual-threads-and-structured-concurrency|Java's virtual threads]] do. A virtual thread parked in a blocking read is unmounted from its carrier and the carrier goes back to the pool, so the runtime runs the same readiness loop underneath and the programmer never writes `await`. Both routes reach the same syscall. They disagree about whether the suspension point should be visible in the source.

## Related Notes

- [[cs/systems/processes-and-threads|Processes & Threads]] - the per-connection cost the event loop exists to avoid paying
- [[cs/systems/io-devices-and-drivers|I/O Devices and Drivers]] - where the readiness the kernel reports actually originates
- [[cs/systems/interrupts-and-traps|Interrupts and Traps]] - the hardware event that makes a descriptor ready in the first place
- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - the crossing `io_uring` shares memory to avoid
- [[cs/systems/context-switching|Context Switching]] - what a blocked thread costs on every wake
- [[cs/dsa/rb-tree|Red-Black Tree]] - the structure `epoll` keeps the interest set in
- [[cs/pl/coroutines-and-generators|Coroutines & Generators]] - the transform that turns the callback pile back into sequential code
- [[cs/languages/Python/asyncio-and-the-event-loop|asyncio and the Event Loop]] - one language's loop, in full
- [[cs/languages/CSharp/async-await-and-the-state-machine|Async/Await and the State Machine]] - the same transform on the CLR
- [[cs/languages/Rust/async-rust-futures-and-pinning|Async Rust, Futures, and Pinning]] - the same transform with no runtime in the box

## Sources

- "epoll," Wikipedia. https://en.wikipedia.org/wiki/Epoll . Backs `epoll` as a Linux system call for scalable IO event notification first introduced in kernel 2.5.45 in October 2002, its purpose of monitoring multiple file descriptors for possible IO, its intent to replace `select(2)` and `poll(2)` where the number of watched descriptors is large, the O(n) versus O(1) contrast, the red-black tree used to track monitored descriptors, the `epoll_create1`/`epoll_ctl`/`epoll_wait` API with add, modify, and delete operations, and the edge-triggered versus level-triggered semantics including the partially-drained pipe example.
- "Kqueue," Wikipedia. https://en.wikipedia.org/wiki/Kqueue . Backs `kqueue` as a scalable event notification interface introduced in FreeBSD 4.1 in July 2000, authored by Jonathan Lemon, the name meaning kernel event queue, its role in letting nginx solve the C10k problem, the single `kevent(2)` call per main event loop iteration with the `changelist` applied before waiting and the `eventlist` receiving events, the contrast with `epoll` on registering and waiting in one function, and the additional event classes: file modification monitoring, signals, asynchronous IO, child process state changes, nanosecond-resolution timers, and user-defined events.
- "io_uring," Wikipedia. https://en.wikipedia.org/wiki/Io_uring . Backs `io_uring` as a Linux system call interface for asynchronous IO, its two circular queue rings (submission and completion) shared between kernel and application to eliminate extra system calls copying buffers, the design paper's ownership rule that the submission ring is writable only by the application and the completion ring only by the kernel, its adoption in Linux 5.1 in 2019, the Linux AIO deficiencies it addressed (asynchrony only with `O_DIRECT` on already-allocated files, no page cache, no socket support and so no multiplexing of network and disk IO), and Google's June 2023 report that 60% of 2022 bug bounty exploit submissions targeted `io_uring`, with the resulting disabling on Android apps, ChromeOS, Google servers, and Docker's default seccomp profile.
- "Input/output completion port," Wikipedia. https://en.wikipedia.org/wiki/Input/output_completion_port . Backs IOCP as an API for multiple simultaneous asynchronous IO operations in Windows NT 3.5 and later, AIX, and Solaris 10 and later, the port object being associated with sockets or file handles, completion being indicated by a message queued to the port rather than by notifying the requesting process, and the port managing multiple threads and their concurrency.
- "select (Unix)," Wikipedia. https://en.wikipedia.org/wiki/Select_%28Unix%29 . Backs `select` as a system call for examining the status of file descriptors of open IO channels, its similarity to the later System V `poll`, both being superseded by `kqueue`, `/dev/poll`, `epoll`, and IO completion ports because of the C10k problem, and the `nfds` argument being one more than the maximum descriptor in any set.
- "C10k problem," Wikipedia. https://en.wikipedia.org/wiki/C10k_problem . Backs the C10k problem as optimizing networking stacks to handle many simultaneous clients, the numeronym for ten thousand concurrent connections, the distinction between handling many concurrent connections and many requests per second, and the term being coined in 1999 by Dan Kegel citing the Simtel FTP host cdrom.com serving 10,000 clients at once over 1 gigabit-per-second Ethernet.
