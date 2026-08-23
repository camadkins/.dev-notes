---
title: "Channels and select"
description: "Why a channel is a synchronization primitive that happens to carry data, what buffering changes about the guarantee, and the four things select actually promises."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-07-17
updated:
aliases:
  - Go Channels
  - Go select Statement
---

The usual first description of a channel is a thread-safe queue. That description survives contact with buffered channels and falls apart immediately on unbuffered ones, where nothing is ever stored. It also gets the emphasis backwards. The spec introduces the channel as "a mechanism for concurrently executing functions to communicate," and the memory model calls channel communication "the main method of synchronization between goroutines." The data transfer is the visible part. The ordering edge is the product.

> [!note] The idea
> A channel is a synchronization primitive whose payload happens to be a value. The memory model states the guarantee in both directions, and the reverse direction is the one that proves the point: a **receive** from an unbuffered channel is synchronized before the completion of the corresponding **send**. No queue has that property. Buffering does not add capacity to a queue so much as it loosens the ordering edge, and the rule that governs it, "The kth receive from a channel with capacity C is synchronized before the completion of the k+Cth send on that channel," is a counting semaphore written as a memory model clause.

## What buffering actually changes

The spec's rule for `make` is short. The capacity "sets the size of the buffer in the channel. If the capacity is zero or absent, the channel is unbuffered and communication succeeds only when both a sender and receiver are ready. Otherwise, the channel is buffered and communication succeeds without blocking if the buffer is not full (sends) or not empty (receives)."

Read that as a statement about rendezvous rather than storage. An unbuffered channel forces both parties to be present at the same moment, which is why the operation carries information in both directions. A buffered channel lets the sender leave and the receiver arrive later, which is exactly the ordering edge it gives up.

The memory model makes the difference concrete with two nearly identical programs. In the first, a goroutine writes a variable then sends on a channel, and `main` receives before printing. That program "is guaranteed to print" the written value. In the second, the send and receive are swapped so the goroutine receives and `main` sends, on an **unbuffered** channel, and the guarantee still holds by the reverse rule. Then the memory model adds the sentence that matters: "If the channel were buffered (e.g., c = make(chan int, 1)) then the program would not be guaranteed to print" the value. "It might print the empty string, crash, or do something else." A one-slot buffer, added for what looks like performance, deletes a correctness guarantee.

This is the sharpest available demonstration that channel capacity is a semantic parameter, not a tuning knob, and it belongs alongside the rest of [[cs/languages/Go/the-go-memory-model|what Go promises about ordering]].

## The edge cases are the API

Go put a surprising amount of behavior into what happens on channels that are not in the normal state, and the whole table is worth holding at once.

A send blocks until it can proceed. On an unbuffered channel it proceeds "if a receiver is ready"; on a buffered one, "if there is room in the buffer." A send on a closed channel "proceeds by causing a run-time panic." A send on a nil channel "blocks forever."

A receive blocks until a value is available. Receiving from a nil channel also blocks forever. A receive on a closed channel "can always proceed immediately, yielding the element type's zero value after any previously sent values have been received," which is what makes close a broadcast rather than a message. The comma-ok form distinguishes the two, with `ok` true "if the value received was delivered by a successful send operation," and false for a zero value produced by a closed and empty channel.

Closing carries its own ordering rule: "The closing of a channel is synchronized before a receive that returns a zero value because the channel is closed." Substituting `close(c)` for `c <- 0` in the memory model's first example gives a program with the same guarantee.

The blocking-forever cases look like defects and are load-bearing. A nil channel inside a `select` is how you disable a case, and the deliberate permanent block is a language-level [[cs/systems/deadlock|deadlock]] you can construct on purpose.

## The semaphore

The generalized rule is the one people underuse. Because the kth receive is synchronized before the completion of the k+Cth send, a buffered channel of capacity C "allows a counting semaphore to be modeled by a buffered channel: the number of items in the channel corresponds to the number of active uses, the capacity of the channel corresponds to the maximum number of simultaneous uses, sending an item acquires the semaphore, and receiving an item releases the semaphore."

The memory model calls this "a common idiom for limiting concurrency" and gives the four-line version: a `limit` channel of capacity three, a send before the work and a receive after. Nothing in the program mentions a semaphore, and the guarantee is not an implementation accident. It is a stated clause. Go got the [[cs/systems/concurrency-primitives|counting semaphore]] for free out of the channel's ordering rules, and it is a reasonable argument that the primitive was chosen partly because this fell out of it.

## What select guarantees

The spec breaks `select` into steps, and each one is a promise worth naming.

First, every channel operand and every send value is "evaluated exactly once, in source order, upon entering the select statement." The consequence is stated outright: "Any side effects in that evaluation will occur irrespective of which (if any) communication operation is selected to proceed." A function call in a `case` expression runs even when that case loses. The left-hand sides of a receive assignment are the exception; those are not evaluated yet.

Second, and this is the guarantee everything else rests on, "If one or more of the communications can proceed, a single one that can proceed is chosen via a uniform pseudo-random selection." Not first-ready, not source order. That randomness is a fairness property: a `select` in a loop over two hot channels cannot starve one of them, which a priority-ordered choice would.

Third, if nothing can proceed and there is a `default` case, `default` runs. There "can be at most one default case and it may appear anywhere in the list of cases," so its position in the source does not matter. If there is no `default`, the statement blocks until some communication can proceed.

> [!warning] Why the empty select is not a bug
> "Since communication on nil channels can never proceed, a select with only nil channels and no default case blocks forever." The memory model's own concurrency-limiting example ends with a bare `select{}` for exactly this reason: park `main` permanently while the worker goroutines run. The block is the feature.

None of this arrived from nowhere. The FAQ traces the lineage to Hoare's Communicating Sequential Processes, noting that Go's primitives "derive from a different part of the family tree whose main contribution is the powerful notion of channels as first class objects." First-class is the operative word, and `select` is what first-class buys: a value you can store, pass, nil out, and choose among, which is not something an [[cs/pl/concurrency-models-threads-locks-and-actors|actor mailbox or a lock]] gives you.

## Related Notes

- [[cs/languages/Go/the-go-memory-model]] - the full set of synchronized-before rules that channel operations are three clauses of
- [[cs/languages/Go/goroutines-and-the-scheduler]] - what a blocked send does to the M and P holding the goroutine
- [[cs/systems/concurrency-primitives]] - semaphores and condition variables, one of which the buffered channel simply is
- [[cs/pl/concurrency-models-threads-locks-and-actors]] - where CSP sits relative to the alternatives Go declined
- [[cs/systems/deadlock]] - the conditions the blocks-forever cases satisfy deliberately
- [[cs/languages/Rust/send-sync-and-fearless-concurrency]] - the other answer to the same problem, enforced by types instead of by discipline

## Sources

- [The Go Programming Language Specification](https://go.dev/ref/spec) - channel types and capacity, send and receive semantics including nil and closed channels, and the step-by-step definition of `select`
- [The Go Memory Model](https://go.dev/ref/mem) - channel communication as the main synchronization method, the send and receive ordering rules, the buffered counterexample, and the counting-semaphore idiom
- [Go Frequently Asked Questions](https://go.dev/doc/faq) - the CSP lineage and first-class channels
