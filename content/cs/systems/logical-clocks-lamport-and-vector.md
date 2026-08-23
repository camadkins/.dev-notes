---
title: "Logical Clocks: Lamport and Vector"
description: "Ordering events across machines without synchronized time, using the happens-before relation, Lamport timestamps, and vector clocks."
draft: false
comments: true
tags:
  - cs
  - systems
  - distributed-systems
date: 2026-01-22
updated:
aliases:
  - Lamport Timestamp
  - Vector Clock
  - Happens-Before
---

You cannot trust the [[cs/military-computing/gps-and-distributed-time|wall clocks]]. Two machines' quartz oscillators drift, [[cs/military-computing/ntp-distributed-clock-synchronization|NTP]] corrects them in jumps, and the moment you try to order two events by comparing timestamps across nodes you are building on sand. Leslie Lamport's insight in 1978 was that most of the time you do not need real time at all. You need to know which events *could have caused* which others, and that is a purely combinatorial fact about who sent messages to whom.

> [!note] The idea
> A logical clock orders events by potential causality rather than by real time. The happens-before relation captures exactly the causal chains a message-passing system can observe; a scalar Lamport clock encodes it one direction (cause implies smaller timestamp), and a vector clock encodes it both directions, so you can tell causally-ordered events apart from genuinely concurrent ones.

## Happens-before

The happens-before relation, written `a -> b`, is the least strict [[cs/math/relations-and-equivalence|partial order]] such that: if `a` and `b` are on the same process and `a` occurred first, then `a -> b`; and if `a` is the sending of a message and `b` is its reception, then `a -> b`. Chain these with transitivity and you have the full relation. Two events in different processes that never exchange a message, directly or through intermediaries, are **concurrent**: neither `a -> b` nor `b -> a` holds, and nothing can be said about their order.

As a strict partial order it is transitive, irreflexive (no event happens before itself), and asymmetric. The crucial limitation: a process has no knowledge of this relation on its own. It only learns causal order by carrying a logical clock along with its messages.

## Lamport timestamps

A Lamport clock is a single integer counter per process, updated by three rules:

1. Increment the counter before each local event (including a send).
2. Attach the current counter value to every message sent.
3. On receiving a message, set the counter to `max(local, received) + 1` before treating the message as received.

> [!example] The two receive rules in pseudocode
> ```
> # sending
> time = time + 1
> send(message, time)
>
> # receiving
> (message, timestamp) = receive()
> time = max(timestamp, time) + 1
> ```

This gives the **clock consistency condition**: if `a -> b` then `C(a) < C(b)`. The relation runs one way only. A smaller timestamp does *not* prove happens-before, so a Lamport clock can show non-causality (via the contrapositive, `C(a) >= C(b)` means `a` did not happen before `b`) but cannot capture all causality. You can force a total order by breaking ties with an arbitrary rule such as the process ID, but Lamport warns that this order is artificial and must not be read as a causal claim.

## Vector clocks

A vector clock recovers the information a scalar throws away. For `n` processes it is a vector of `n` counters; process `i` keeps its own counter *and* the highest counter value it has heard from every other process. The rules generalize the Lamport ones: increment your own entry on a local event or send, ship the whole vector with the message, and on receipt take the element-wise maximum with the received vector, then increment your own entry.

Now comparison is two-way. Define `VC(x) < VC(y)` to mean every component of `x` is less than or equal to the matching component of `y`, and at least one is strictly less. Then `x -> y` **if and only if** `VC(x) < VC(y)`. If neither vector dominates the other, the events are concurrent, and you can detect that fact, which a Lamport clock cannot. This is the strong clock consistency condition, and it is why systems that need to spot concurrent updates for [[consistency-models|conflict resolution]] reach for vector clocks. The generalization to vector time was worked out independently by several authors in the early 1980s; Colin Fidge and Friedemann Mattern's 1988 papers established the name and the properties.

The cost is space. A vector clock carries one entry per process, so its size grows with the number of participants, which is why some systems use bounded alternatives (matrix clocks, interval tree clocks, Bloom clocks) or avoid them entirely.

> [!warning]
> Both clocks work only under crash failures. Under Byzantine faults, where a process can forge or manipulate its metadata, detecting the happens-before relation is fundamentally impossible, and this holds for every variant of vector clock. Causality tracking assumes honest participants.

## Related Notes

- [[distributed-consensus|Distributed Consensus]] is the harder problem of agreeing on a single ordered log, where these clocks provide the raw ordering
- [[consistency-models|Consistency Models]] defines causal consistency directly on top of the happens-before relation
- [[processes-and-threads|Processes and Threads]] are the entities whose local event order the clocks extend across the network
- [[concurrency-primitives|Concurrency Primitives]] face the same ordering question inside one machine, where the hardware memory model plays the role of happens-before

## Sources

- "Lamport timestamp," Wikipedia. https://en.wikipedia.org/wiki/Lamport_timestamp . Backs the three update rules, the send/receive pseudocode, the clock consistency condition that `a -> b` implies `C(a) < C(b)`, that this is one-way and only a partial causal order, and tie-breaking by process ID producing an artificial total order.
- "Happened-before," Wikipedia. https://en.wikipedia.org/wiki/Happened-before . Backs the formal definition of happens-before as the least strict partial order over same-process and send/receive edges, the concurrency definition, transitivity/irreflexivity/asymmetry, and that processes have no knowledge of the relation without a logical clock.
- "Vector clock," Wikipedia. https://en.wikipedia.org/wiki/Vector_clock . Backs the per-process vector structure, the element-wise-max update, the `VC(x) < VC(y)` iff `x -> y` biconditional, the Fidge and Mattern 1988 naming, and the impossibility of causality detection under Byzantine failures for all vector clock variants.
