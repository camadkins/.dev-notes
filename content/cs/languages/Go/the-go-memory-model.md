---
title: "The Go Memory Model"
description: "Happens-before as the transitive closure of two smaller relations, why DRF-SC is the whole bargain, and Go's deliberate refusal to make a racy program fully undefined."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-08-11
updated:
aliases:
  - Go Memory Model
  - DRF-SC in Go
---

Most language specifications hide their memory model behind a wall of formalism and hope you never need it. Go's version, dated June 6, 2022, opens by telling you not to read it. The Advice section is four short paragraphs, and the last two are: "If you must read the rest of this document to understand the behavior of your program, you are being too clever." Then, alone on its own line, "Don't be clever."

That is not a joke about documentation. It is the document stating its own theory of use. The rest of the model exists so that the advice is sufficient.

> [!note] The idea
> The memory model's payload is a single bargain called DRF-SC: "data-race-free programs execute in a sequentially consistent manner." You prove your program has no races using an easy mental model where everything interleaves on one processor, and in exchange you never reason about reordering. What makes Go's version distinctive is the second half, the part about programs that lose the bet. Go refuses to say a racy program is meaningless. It constrains implementations even in the presence of races, which makes Go "more like Java or JavaScript" and "less like C and C++, where the meaning of any program with a race is entirely undefined."

## Two relations, then a closure

The formal core is smaller than it looks. Go builds happens-before out of two pieces.

**Sequenced before** is the intra-goroutine order. Requirement 1 says the memory operations in each goroutine "must correspond to a correct sequential execution of that goroutine," consistent with the partial order the language specification lays down for control flow and expression evaluation. Nothing concurrent about it.

**Synchronized before** is the cross-goroutine order, and it is defined by observation rather than by time. A program execution comes with a mapping `W` naming, for each read-like operation, the write-like operation it read from. If a synchronizing read observes a synchronizing write, then that write is synchronized before that read. Operations are classified as read-like (read, atomic read, mutex lock, channel receive) or write-like (write, atomic write, mutex unlock, channel send, channel close), and some, such as compare-and-swap, are both.

Then the definition that ties it together: "The happens before relation is defined as the transitive closure of the union of the sequenced before and synchronized before relations." Program order inside a goroutine, observation across goroutines, transitivity to connect them. Everything else in the document is a list of which operations are synchronizing.

Requirement 3 uses the relation to pin down what a read may return. `W(r)` must be a write `w` that is **visible**: `w` happens before `r`, and `w` does not happen before some other write to the same location that also happens before `r`. When there are no races on a location, that condition picks out exactly one write, "the single w that immediately precedes it in the happens before order."

## Where the edges come from

The synchronizing operations are listed rather than derived, and reading the list end to end is more useful than reading any one entry.

Initialization: if package `p` imports `q`, the completion of `q`'s init functions happens before the start of any of `p`'s, and the completion of all init functions is synchronized before the start of `main.main`. Goroutine creation: "The go statement that starts a new goroutine is synchronized before the start of the goroutine's execution." [[cs/languages/Go/channels-and-select|Channel operations]] contribute three rules, in both directions and generalized over capacity. Mutexes contribute the usual unlock-before-later-lock edge. Atomics get their own clause: "All the atomic operations executed in a program behave as though executed in some sequentially consistent order," which the document says has "the same semantics as C++'s sequentially consistent atomics and Java's volatile variables."

One entry is a hole rather than an edge, and it is the one people trip on. "The exit of a goroutine is not guaranteed to be synchronized before any event in the program." A goroutine that writes a variable and then returns has established nothing. The document goes further: "In fact, an aggressive compiler might delete the entire go statement." Finishing is not synchronizing.

## Compare: Go and Java

Set beside [[cs/languages/Java/the-java-memory-model-and-happens-before|the Java Memory Model]], the two agree on the bargain and differ in what they spend effort on.

Both promise DRF-SC. Go says its intent is "to match the DRF-SC guarantee provided to race-free programs by other languages, including C, C++, Java, JavaScript, Rust, and Swift," and it takes its formalism from Boehm and Adve's PLDI 2008 paper on the C++ model rather than inventing one.

The divergence is in the treatment of racy programs. Java spends its hardest pages on causality, building an elaborate commitment-order construction to rule out out-of-thin-air values while still permitting optimization. Go rules them out by fiat in one sentence, "observation of acausal and 'out of thin air' writes is disallowed," and then spends its effort on operational constraints instead: a read of a word-sized or smaller location "must observe a value actually written to that location" and not yet overwritten. Java describes what an execution may be. Go describes what an implementation may do.

They also share one honest admission. Go's model states plainly that implementations may treat reads of locations larger than a machine word "as a set of individual machine-word-sized operations in an unspecified order," so "races on multiword data structures can lead to inconsistent values not corresponding to a single write."

> [!warning] Where the guarantee actually stops
> Go names the multiword case and its consequence directly. When values depend on internal pairs, "as can be the case for interface values, maps, slices, and strings in most Go implementations, such races can in turn lead to arbitrary memory corruption." A racy write to an interface variable can tear the [[cs/languages/Go/interfaces-and-implicit-satisfaction|type and value pair]], leaving a type word from one value beside a data word from another. That is not a wrong answer, it is a pointer being interpreted as the wrong type, which is why concurrent map access can crash a Go process outright.

## Three idioms the model kills

The document's Incorrect Synchronization section is the practical half, and each example fails for the same reason.

Double-checked locking, checking a `done` flag before calling `once.Do`, fails because "there is no guarantee that, in doprint, observing the write to done implies observing the write to a." The flag and the data are not connected by any edge.

Busy waiting on a flag fails twice over. Same visibility problem, plus a worse one: "there is no guarantee that the write to done will ever be observed by main, since there are no synchronization events between the two threads. The loop in main is not guaranteed to finish." A spin loop over an unsynchronized variable may never exit, and Go says so in the specification rather than leaving it to folklore.

The pointer-publication variant fails the same way. Even when `main` observes a non-nil pointer, "there is no guarantee that it will observe the initialized value for g.msg." The document's answer to all three is one clause: "use explicit synchronization."

## The model binds the compiler too

The last section is the one that explains why memory models exist at all. "The Go memory model restricts compiler optimizations as much as it does Go programs." A compiler must not introduce writes that were not in the source, must not let a single read observe multiple values, and must not let a single write write multiple values.

The examples are concrete. A compiler may not invert `*p = 1; if cond { *p = 2 }` into `*p = 2; if !cond { *p = 1 }`, because a concurrent reader could then observe a `2` that the original program made impossible. It may not hoist a load past a loop, because "Not introducing data races also means not assuming that loops terminate." And it may not hoist across a call, because it cannot assume a called function returns or is free of synchronization operations.

Each of these is a transformation that is obviously correct for a single thread and forbidden here. That gap is the whole reason a memory model is a separate document from the [[cs/pl/operational-semantics-big-step-small-step|operational semantics]] of the language.

## Related Notes

- [[cs/languages/Java/the-java-memory-model-and-happens-before]] - the same DRF-SC bargain, with far more machinery spent on constraining racy executions
- [[cs/languages/Go/channels-and-select]] - the three channel clauses that supply most real Go programs with their happens-before edges
- [[cs/systems/concurrency-primitives]] - the mutex and atomic operations the model turns into ordering edges
- [[cs/security/race-conditions-and-toctou]] - what a race becomes once an attacker is choosing the interleaving
- [[cs/pl/mutable-state-references-effects]] - why shared mutable state is the thing that needs a model in the first place
- [[cs/languages/Rust/send-sync-and-fearless-concurrency]] - the alternative of making the race unrepresentable rather than undefined

## Sources

- [The Go Memory Model](https://go.dev/ref/mem) - the advice, the DRF-SC definition, sequenced-before and synchronized-before, the synchronization rules for init, goroutines, channels, and atomics, the implementation restrictions on racy programs, the incorrect-synchronization idioms, and the limits on compiler optimization
- [The Go Programming Language Specification](https://go.dev/ref/spec) - the control-flow and expression-evaluation orders that the sequenced-before relation is defined against
