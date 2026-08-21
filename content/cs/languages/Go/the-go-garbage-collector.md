---
title: "The Go Garbage Collector"
description: "Concurrent tri-color mark and sweep, a write barrier that is off most of the time, and a pacer that conscripts the allocating goroutine, all chosen against one objective."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-07-27
updated:
aliases:
  - Go GC
  - GOGC and the Pacer
---

Go's collector is unusual in what it does not do. It does not move objects. It does not have generations. It does not have a nursery, a survivor space, or a tuning matrix of a dozen collectors. It has one algorithm and one dial, and it is slower on throughput than several collectors it could have been.

Read that list as a set of failures and the design looks poor. Read it as a set of prices paid for one property and it looks like a specification.

> [!note] The idea
> Every structural choice in the Go GC was made against a **tail-latency objective**, and each one trades away something a throughput-first collector would keep. The runtime guide states the property directly: "the Go GC avoids making the length of any global application pauses proportional to the size of the heap." Non-moving costs you compaction. Concurrent costs you throughput, and the guide says so: "in practice it often leads to a design with lower throughput than an equivalent stop-the-world garbage collector." Both were accepted because a pause proportional to heap size is a pause that gets worse exactly as a service gets successful.

The theory this rests on lives elsewhere. Reachability, roots, and the mutator-collector split are in [[cs/pl/garbage-collection-concepts|garbage collection concepts]]; the family of algorithms Go is choosing from is in [[cs/pl/gc-algorithms-mark-sweep-copying-generational|mark-sweep, copying, and generational GC]]. This note is about which member Go picked and what the choice cost.

## Why latency, specifically

Rick Hudson's 2018 ISMM keynote gives the arithmetic that set the target. A per-cycle objective is not what a user experiences. If a session makes roughly a hundred server requests, then a 99th-percentile promise means "only 37% of users will have a consistent sub 10ms experience" across that session. To give 99% of users that experience, "the math says you really need to target 4 9s or the 99.99%ile." The keynote calls this the tyranny of the 9s, and it is the reason the objective is stated as a pause bound rather than as a percentage of CPU.

The 2018 objective was "500 microseconds stop the world pause per GC cycle." That number, not allocation throughput, is what the rest of the design is optimizing.

## Mark and sweep, concurrently

Go uses "the mark-sweep technique, which means that in order to keep track" of progress it marks live values as it traces, then walks the heap and returns everything unmarked to the allocator. The two phases cannot overlap, and the guide explains why in a sentence worth keeping: "the act of sweeping must be entirely separated from the act of marking," because until tracing finishes there may be an unscanned pointer keeping an object alive. The cycle is therefore sweep, off, mark, repeating.

The alternative was on the table and was declined. A moving collector relocates objects and leaves forwarding pointers; "We call a GC that moves objects in this way a moving GC; Go has a" non-moving one. Three reasons, all in the keynote. Size-segregated spans let the collector find an object's start by rounding down, which solves interior pointers. Experience with production allocators "gave us confidence that fragmentation was not going to be a problem with non-moving allocators," so the usual argument for compaction weakened. And a non-moving heap avoids "the long tail of bugs you might encounter if you had a moving collector as you attempt to pin objects and put levels of indirection between C and the Go object," which is to say [[cs/languages/common/c-abi-and-ffi|cgo]] is cheap precisely because addresses are stable. The fragmentation question then belongs to the [[cs/systems/memory-allocators-and-fragmentation|allocator]] rather than the collector.

Objects carry no headers. "Mark bits are kept on the side and used for marking as well as allocation," and "Each word has 2 bits associated with it to tell you if it was a scalar or a pointer inside that word," with the encoding also indicating when scanning can stop early.

## The write barrier, and why it is usually free

Concurrent marking has a correctness problem: the program keeps rewriting pointers while the collector traces. The decision was "to do a tri-color concurrent algorithm," with proofs behind it, and the barrier is what makes tri-color safe against a running mutator. It "is responsible for ensuring that no reachable objects get lost during the tri-color operations."

The implementation detail is the one that makes the cost acceptable. "The write barrier is on only during the GC. At other times the compiled code loads a global variable and looks at it." Every pointer write in every compiled Go function tests a flag. Because the flag is nearly always false, "the hardware correctly speculates to branch around the write barrier," so the steady-state cost is a predicted branch rather than a barrier. Keeping the barrier off most of the time was also a compiler-team constraint: an always-on barrier would have blocked optimizations and slowed the compiler's output at a moment when Go could not afford it.

## The pacer

Deciding when to start a cycle is the tuning problem, and the answer is a controller rather than a threshold. The pacer "is basically based on a feedback loop that determines when to best start a GC cycle." In a steady state it aims for marking to finish just as the heap target is reached.

When the program allocates faster than the collector marks, the pacer does not simply start earlier. "If need be, the Pacer slows down allocation while speeding up marking" by stopping the offending goroutine and making it mark, with work proportional to how much it allocated. "This speeds up the garbage collector while slowing down the mutator." That is a negative feedback loop applied to the specific goroutine causing the problem, which is why a Go program under allocation pressure gets slower rather than growing without bound.

The target itself comes from `GOGC`. "The heap target controls GC frequency: the bigger the target, the longer the GC can wait to start another mark phase and vice versa," and the tradeoff is clean: "doubling GOGC will double heap memory overheads and roughly halve GC CPU cost." Since Go 1.18 the calculation includes the root set, not only the live heap, because programs with hundreds of thousands of goroutine stacks were being paced badly. `GOMEMLIMIT` was added in Go 1.19 as a second, absolute bound for the case where a percentage cannot express the constraint.

> [!tip] The P count has a name
> The pause bound is not free of parallelism concerns. Pauses "are more strongly proportional to GOMAXPROCS algorithmically, but most commonly are dominated by the time it takes to stop running goroutines," and the mark phase costs you scheduling delay "because the GC takes 25% of CPU resources when in the mark phase." `GOMAXPROCS` is the knob, and its default is derived rather than hardcoded: the runtime "typically selects the default GOMAXPROCS as the minimum of the logical CPU count, the CPU affinity mask count, or the cgroup CPU throughput limit," never below 2 unless the machine itself is. On cgroup v2 the quota comes from `cpu.max`. The runtime rechecks up to once per second, so a container whose CPU limit changes gets a new P count without a restart.

The remaining latency sources are worth naming because they are the ones a profile will show: brief stop-the-world pauses at the mark-to-sweep transition, the 25% mark-phase CPU take, goroutines conscripted into assists, pointer writes doing barrier work during marking, and goroutines suspended so their roots can be scanned. Four of the five are visible in an execution trace. The cheapest way to reduce all of them at once is to allocate less, which is where [[cs/languages/Go/escape-analysis-and-stack-allocation|escape analysis]] earns its keep: a value that never reaches the heap is a value the collector never traces.

## Related Notes

- [[cs/pl/garbage-collection-concepts]] - reachability, roots, and the mutator-collector relationship this note assumes
- [[cs/pl/gc-algorithms-mark-sweep-copying-generational]] - the algorithm family, including the generational and copying designs Go declined
- [[cs/systems/memory-allocators-and-fragmentation]] - size-segregated spans, and why a non-moving heap does not fragment badly
- [[cs/languages/Go/escape-analysis-and-stack-allocation]] - the compiler pass that keeps work away from the collector entirely
- [[cs/languages/Java/hotspot-garbage-collectors]] - a runtime that answered the same question with generations, compaction, and a choice of collectors
- [[cs/languages/CSharp/the-clr-garbage-collector]] - the third mainstream answer, and its own latency-versus-throughput dial

## Sources

- [A Guide to the Go Garbage Collector](https://go.dev/doc/gc-guide) - mark-sweep and non-moving, the phase separation argument, the GOGC target and its CPU-memory tradeoff, the root set change in Go 1.18, and the enumerated latency sources including the 25% mark-phase CPU share
- [Getting to Go: The Journey of Go's Garbage Collector](https://go.dev/blog/ismmkeynote) - the tyranny-of-the-9s arithmetic, the 500 microsecond objective, the tri-color decision, size-segregated spans and side mark bits, the conditionally enabled write barrier, and the pacer feedback loop
- [package runtime](https://pkg.go.dev/runtime) - GOMAXPROCS as the parallelism limit and how its default is derived from logical CPUs, affinity mask, and cgroup quota
