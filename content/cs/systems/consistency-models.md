---
title: Consistency Models
description: "The spectrum from strict and linearizable down to causal and eventual consistency, and the guarantee-versus-latency tradeoff that ranks them."
draft: false
comments: true
tags:
  - cs
  - systems
  - distributed-systems
date: 2026-04-09
updated:
aliases:
  - Consistency Model
  - Linearizability
  - Eventual Consistency
---

"Consistent" sounds binary, either the replicas agree or they do not. In a distributed system it is a dial. A consistency model is a contract between the store and the programmer: obey these rules about what a read can return, and in exchange the store gets to reorder or delay work behind your back. Stronger contracts are easier to reason about and slower to satisfy. Weaker ones are fast and full of sharp edges.

> [!note] The idea
> Consistency models form a ranked spectrum, from strict (a write is seen instantaneously everywhere) down to eventual (reads converge only once updates stop). Every step down the ranking relaxes an ordering requirement to buy latency or availability. The model is not a quality knob you turn to "high"; it is the exact set of surprises your code must handle.

## The strong end

**Strict consistency** is the strongest and the least achievable. A write by any processor must be seen instantaneously by every other, as if [[cs/military-computing/gps-and-distributed-time|a global clock]] stamped each operation and the next operation could not begin until the write landed in all caches. It is the programmer's naive mental model and physically impossible across a real network, since instantaneous means faster than the speed of light.

**[[cs/languages/Cpp/the-cpp-memory-model-and-atomics|Sequential consistency]]**, proposed by Lamport in 1979, weakens that. A write need not be seen instantaneously, but all processors must see writes in the *same* single order, and each processor's own operations appear in that order in the sequence its program specified. Lamport's own phrasing: the result of any execution is the same as if the operations of all processes were executed in some sequential order, with each process's operations in program order.

**Linearizability**, also called atomic consistency, is sequential consistency plus a real-time constraint. Give every operation a begin time and an end time; an execution is linearizable if each operation appears to take effect at a single instant between its begin and end, and the resulting order still satisfies sequential consistency. This is the model the CAP "C" refers to, and the one a single-leader [[distributed-consensus|consensus]] system provides.

## The weaker, more scalable end

**Causal consistency** (Hutto and Ahamad, 1990) drops the requirement that everyone agree on the order of *unrelated* writes. It splits events into those that are causally related and those that are not, then demands only that writes which are potentially causally related be seen in the same order by all processes. Concurrent, unrelated writes may be seen in different orders on different nodes. The [[logical-clocks-lamport-and-vector|happens-before relation]] is exactly the machinery that decides which writes are causally related.

**Eventual consistency** is the weak floor. If no new updates are made to an item, eventually all reads of that item return the last written value; a system that reaches this state is said to have converged. It is only a liveness guarantee, updates *will* be observed sometime, with no safety guarantee about what intermediate value a read sees before convergence. Most stronger models are trivially eventually consistent.

> [!warning]
> Eventual consistency is criticized precisely because it hands the developer a liveness promise and no safety net. Any intermediate value is legal before convergence, which is nothing like single-threaded programming where a variable returns what you last assigned it. The bugs this produces tend to surface only under network failure or high concurrency, which is when they hurt most.

## BASE, and the convergence problem

Eventually-consistent services are often described as BASE (basically available, soft state, eventually consistent), set against ACID. Soft state is the admission that a record can drift through transient values with no external trigger, so two queries for the same record can legitimately disagree until convergence.

Getting to convergence takes real work. The system must exchange versions between replicas (anti-entropy) and then pick a final state when concurrent updates collided (reconciliation). A common reconciliation rule is last-writer-wins; [[logical-clocks-lamport-and-vector|vector clocks]] are often used to detect that two updates were concurrent in the first place. The repair can be scheduled at a read (read repair, which slows reads), at a write (write repair), or off the critical path (asynchronous repair).

**Strong eventual consistency (SEC)** adds back a safety guarantee: any two nodes that have received the same unordered set of updates are in the same state. Conflict-free replicated data types (CRDTs) are the common way to get there, since their merge is defined so that order of receipt does not matter.

## Related Notes

- [[cap-theorem|CAP Theorem]] is where the choice to sit at the weak end (AP) buys availability during a partition, and PACELC is where it buys latency in normal operation
- [[logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] provides the happens-before ordering that causal consistency is defined against
- [[distributed-consensus|Distributed Consensus]] is how a system delivers the strong end, linearizable single-leader reads
- [[cache-coherence|Cache Coherence]] is the same ordering question one level down, inside a single machine's memory system

## Sources

- "Consistency model," Wikipedia. https://en.wikipedia.org/wiki/Consistency_model . Backs the strict, sequential (Lamport 1979), linearizability, causal (Hutto and Ahamad 1990), and eventual definitions, including linearizability as sequential consistency with a real-time constraint and causal consistency requiring only causally related writes to be seen in the same order.
- "Eventual consistency," Wikipedia. https://en.wikipedia.org/wiki/Eventual_consistency . Backs convergence, the liveness-only guarantee, BASE semantics, anti-entropy and reconciliation, the read/write/asynchronous repair scheduling, last-writer-wins with vector clocks, and strong eventual consistency via CRDTs.
