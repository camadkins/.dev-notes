---
title: "Goroutines and the Scheduler"
description: "G, M, and P, growable stacks, per-processor run queues with work stealing, and the decade-long argument that ended in preemption by signal."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-08-04
updated:
aliases:
  - Go Scheduler
  - GMP Model
---

Spawning a hundred thousand OS threads is not a thing you do. Each one wants a stack sized for the worst case, the kernel wants a scheduling entity for each, and the [[cs/systems/context-switching|context switch]] between two of them crosses a privilege boundary. Go's FAQ is direct about why goroutines are not that: "It is practical to create hundreds of thousands of goroutines in the same address space. If goroutines were just threads, system resources would run out at a much smaller number."

The interesting part is not that Go multiplexes user-level tasks onto kernel threads. Plenty of runtimes do. It is the third entity Go inserted between the two.

> [!note] The idea
> The Go scheduler is built from three things, not two: G (the goroutine), M (the worker thread), and P (a token granting permission to execute Go code). The runtime source states the invariant that makes the design work: an M "must have an associated P to execute Go code, however it can be blocked or in a syscall w/o an associated P." That one sentence separates **parallelism budget** from **thread count**. A goroutine that blocks in a system call takes its M with it, surrenders the P, and another M picks the P up. The number of threads floats; the number of things running Go code does not.

## The three letters

The scheduler comment in `runtime/proc.go` names them without ceremony. G is the goroutine. M is "worker thread, or machine." P is "processor, a resource that is required to execute Go code." Ps exist in a bounded count, and each owns a local run queue of runnable Gs.

Contrast this with the naive two-level design, where user tasks sit on a pool of threads and the pool size is the parallelism knob. That design has a well-known failure: one task issuing a blocking syscall consumes a pool slot for the duration. Go's answer is that the slot is the P, and the P is not attached to the blocked thread. The FAQ describes the effect from the programmer's side: "When a coroutine blocks, such as by calling a blocking system call, the run-time automatically moves other coroutines on the same operating system thread to a different, runnable thread so they won't be blocked." It then adds the design goal in five words: "The programmer sees none of this, which is the point."

This is why goroutines are cheaper than [[cs/systems/processes-and-threads|kernel threads]] without being as constrained as classic [[cs/pl/coroutines-and-generators|coroutines]], which yield only where the programmer says so.

## Stacks that grow

Cheapness is mostly a stack question. A thread's stack is reserved at creation because it cannot move; the address is baked into every frame pointer and every interior pointer on it. Go's runtime instead uses "resizable, bounded stacks." A new goroutine gets a few kilobytes, "which is almost always enough," and when it is not, the runtime grows and shrinks the stack automatically.

The FAQ puts a number on what that costs: "The CPU overhead averages about three cheap instructions per function call." Every Go function pays a check on entry so that the runtime knows when the stack needs to move. That is the trade. Go decided a small tax on every call was worth a hundred-thousand-fold increase in how many concurrent things a program can hold, and the tax is the reason a Go binary's function prologues look the way they do.

## Distributed queues and stealing

Each P holds its own run queue, and the scheduler comment is explicit that this is deliberate: "scheduler state is intentionally distributed (in particular, per-P work queues), so it is not possible to compute global predicates on fast paths." Centralizing scheduler state was one of three approaches the design explicitly rejected, because it "would inhibit scalability."

Distributed queues create the usual imbalance problem, and the usual answer. `stealWork` "attempts to steal a runnable goroutine or timer from any P." A thread that finds its local queue empty and finds nothing in the global queue or the netpoller enters a **spinning** state, looks through other Ps for work, and either finds some and stops spinning or parks. The runtime bounds this deliberately, with a comment on the check that says to "Limit the number of spinning Ms to half the number of busy Ps."

The design notes also record why direct handoff was rejected. Waking a thread and giving it the goroutine you just readied "would lead to thread state thrashing," because the readying thread may be out of work a moment later, and it would "destroy locality of computation as we want to preserve dependent goroutines on the same thread." Two goroutines that talk to each other over a [[cs/languages/Go/channels-and-select|channel]] stay near each other because the scheduler declined to be helpful.

## Preemption, the long argument

Through Go 1.10, preemption was cooperative, with safe points only at function calls, and Austin Clements' proposal is blunt about the consequences. The compiler benefits, because at a function-call safe point it can guarantee that all local garbage collection roots are known, which "is critical to precise garbage collection," and that no registers are live, so the runtime need not save a large register set.

The failure mode is a goroutine that runs a long time without calling anything. The proposal lists what that delays: stop-the-world operations at the start and end of a GC cycle, the scheduling of competing goroutines, and stack scanning. In the extreme, it can halt a program outright, "such as when a goroutine spinning on an atomic load starves out the goroutine responsible for setting that atomic."

Loop preemption, where the compiler inserts checks at back edges, was prototyped and measured. The fault-based version added one instruction and no branches on x86, and still produced a "geomean slow-down on a large suite of benchmarks" of 7.8%. That number is why Go did not take the obvious road.

The proposal instead is to preempt "by sending a POSIX signal (or using an equivalent OS mechanism) to stop a running goroutine and capture its CPU state," which is exactly the mechanism an OS uses for threads, adapted. The hard part is Go-specific: "Go must be able to find the live pointers on a goroutine's stack wherever it stops it," and the proposal says most of the complexity of the whole scheme derives from that requirement. A goroutine interrupted at a point that must be GC atomic is simply resumed and retried later.

> [!tip] What forces the interrupt
> The runtime constant that decides when a running goroutine has had long enough is `forcePreemptNS`, described in the source as "the time slice given to a G before it is preempted," and set to `10 * 1000 * 1000`, which the source annotates as 10ms. A monitoring thread checks for goroutines past that slice. Preemption is not a timer interrupt delivered to the goroutine, it is a decision made elsewhere and then delivered as a signal.

## Related Notes

- [[cs/systems/processes-and-threads]] - the kernel-side entities that M maps onto and that P deliberately does not
- [[cs/systems/context-switching]] - the cost model that makes a goroutine switch worth having
- [[cs/systems/interrupts-and-traps]] - signals as the userspace echo of the mechanism an OS scheduler uses
- [[cs/pl/coroutines-and-generators]] - the cooperative ancestor, and what preemption adds to it
- [[cs/languages/Go/channels-and-select]] - the operations that put a goroutine on and off a run queue
- [[cs/languages/Java/virtual-threads-and-structured-concurrency]] - the same multiplexing idea, arrived at fifteen years later on a different runtime

## Sources

- [Go Frequently Asked Questions](https://go.dev/doc/faq) - goroutines versus threads, the syscall-blocking behavior, resizable bounded stacks, and the per-call CPU overhead
- [runtime/proc.go](https://go.dev/src/runtime/proc.go) - the G, M, and P definitions and the M-needs-a-P invariant, the rationale for distributed run queues and against handoff, spinning threads and `stealWork`, and `forcePreemptNS`
- [Proposal: Non-cooperative goroutine preemption](https://raw.githubusercontent.com/golang/proposal/master/design/24543-non-cooperative-preemption.md) - cooperative safe points and their failure modes, the measured cost of loop preemption, and the signal-based design
