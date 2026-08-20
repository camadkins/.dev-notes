---
title: CAP Theorem
description: "Consistency, availability, partition tolerance: why a partitioned system picks two, and how PACELC extends the tradeoff to normal operation."
draft: false
comments: true
tags:
  - cs
  - systems
  - distributed-systems
date: 2026-02-18
updated:
aliases:
  - CAP
  - Brewer's theorem
  - PACELC
---

Put one copy of your data on one machine and there is nothing to argue about. Replicate it for availability and latency, and you inherit a question with no free answer: when the network splits the replicas into groups that cannot talk, do you keep answering requests with possibly stale data, or do you refuse to answer until the split heals? CAP is the compact statement of that dilemma.

> [!note] The idea
> A distributed data store can provide at most two of consistency, availability, and partition tolerance at once. Partitions are a fact of any real network, not a design choice, so the honest reading is narrower than "pick two of three": **when a partition happens, you choose consistency or availability.** During normal operation you can have both.

## The three guarantees

Eric Brewer stated CAP as a conjecture at the 2000 PODC symposium; Seth Gilbert and Nancy Lynch published a formal proof in 2002, turning it into a theorem. The three properties, in the Gilbert and Lynch sense:

- **Consistency** means every read receives the most recent write or an error. All clients see the same data at the same time regardless of which node they hit. Note that this is a stronger, different notion than the C in ACID.
- **Availability** means every request to a non-failing node returns a response, with no promise that the response holds the newest data.
- **Partition tolerance** means the system keeps operating even though an arbitrary number of messages between nodes are dropped or delayed.

## Why it is really a choice of two

No real network is safe from failures, so partition tolerance has to be tolerated rather than opted out of. That collapses the "three" down to a live decision between the other two, but only while a partition is in effect. Choosing consistency means a node returns an error or times out when it cannot confirm its data is current. Choosing availability means the node always answers with the best version it has, even when it cannot guarantee that version is up to date.

> [!warning]
> The "two out of three" slogan is what Brewer himself walked back in 2012. In the absence of a partition a well-built system covers all three; designers only surrender consistency or availability *in the presence of partitions*, and partition management and recovery techniques exist to shrink how often that presence occurs. Reading CAP as a permanent one-of-three sacrifice overstates the cost.

Traditional relational systems built around ACID lean toward consistency; systems built on the BASE philosophy common in NoSQL lean toward availability. Cassandra and ScyllaDB are examples of AP stores. There is no useful CA category, because a system that assumed no partitions would simply be undefined the moment one occurred. This is why the [[distributed-consensus|consensus]] protocols that back coordination metadata (etcd, ZooKeeper) sit firmly on the CP side, while a session cache can afford to be AP.

## PACELC: the part CAP leaves out

CAP only says anything during a partition, which is the rare case. Daniel Abadi's objection, published as PACELC in 2010, is that ignoring the consistency-versus-latency tradeoff of a replicated system is a major oversight, because that tradeoff is present at all times the system runs.

PACELC reads as a two-branch rule. **If** there is a Partition (P), trade between Availability (A) and Consistency (C), exactly as CAP says. **Else** (E), when the system runs normally, trade between Latency (L) and Consistency (C). The reason the second branch exists at all is mechanical: if a store is atomically consistent, the sum of its read and write delay is at least one message delay, because most systems wait for explicit acknowledgments over a full round trip before confirming. Relaxing consistency is how a low-latency system buys back that round trip.

The space has four labels:

| Label | Under partition | Normal operation |
|-------|-----------------|------------------|
| PA/EL | availability | low latency |
| PC/EC | consistency | consistency |
| PA/EC | availability | consistency |
| PC/EL | consistency | low latency |

Early Dynamo, Cassandra, and Riak are PA/EL: they drop consistency for availability under a partition and drop it again for lower latency when things are calm. Fully ACID systems like VoltDB, MySQL Cluster, and PostgreSQL are PC/EC, paying both availability and latency costs to never give up consistency. PC/EL is the subtle one: PC does not mean fully consistent, only that a partition does not push consistency *below* the system's baseline, and the system sheds availability instead.

> [!tip]
> The practical takeaway is that a system rarely makes one global CAP or PACELC choice. Coordination data wants CP/PC/EC; caches and analytics counters can live at AP/PA/EL. The interesting engineering is choosing per use case, not per system.

## Related Notes

- [[distributed-consensus|Distributed Consensus]] covers Paxos, Raft, and the FLP impossibility result that sits underneath why CP systems stall rather than lie during bad timing
- [[consistency-models|Consistency Models]] unpacks what the "C" actually ranges over, from linearizability down to eventual consistency
- [[replication-and-quorums|Replication and Quorums]] shows the quorum math (R + W > N) that a CP store uses to keep reads current
- [[network-protocols|Network Protocols]] is the transport whose message loss and delay is exactly what "partition" names

## Sources

- "CAP theorem," Wikipedia. https://en.wikipedia.org/wiki/CAP_theorem . Backs the three-guarantee definitions, the Brewer 2000 / Gilbert and Lynch 2002 history, the 2012 clarification that "two out of three" is misleading, the AP classification of Cassandra and ScyllaDB, and the one-line PACELC framing.
- "PACELC design principle," Wikipedia. https://en.wikipedia.org/wiki/PACELC_design_principle . Backs the P-then-A/C, else-L/C structure, Abadi's 2010 origin and his thesis about the ever-present latency tradeoff, the read-plus-write-delay argument, the four PA/EL, PC/EC, PA/EC, PC/EL configurations, and the example database ratings.
