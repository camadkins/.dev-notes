---
title: Replication and Quorums
description: "Primary-backup versus multi-primary replication, and the quorum arithmetic (R + W > N) that keeps reads current without a single leader."
draft: false
comments: true
tags:
  - cs
  - systems
  - distributed-systems
date: 2026-05-03
updated:
aliases: []
---

Replication is keeping more than one copy of the same data so the system survives a lost machine, serves reads from nearby, and [[cs/networking/load-balancing-l4-and-l7|spreads load]]. The copies are the easy part. The hard part is that the moment two clients can write, the copies can disagree, and you need a rule that decides whose write wins and which reads are allowed to see it. Quorums are the arithmetic that makes that rule provable rather than hopeful.

> [!note] The idea
> Every replication scheme is a position on one axis: how many replicas may accept a write. Primary-backup allows exactly one and gets simplicity at the cost of a bottleneck; multi-primary allows several and gets throughput at the cost of conflicts. Quorum voting turns the choice into inequalities: require read and write sets large enough that they always overlap (R + W > N), and a read is guaranteed to touch at least one copy of the latest write, no leader required.

## Active, passive, and the primary-backup default

Replication comes in two shapes. **Passive replication** processes each request on one replica and ships the resulting state to the others. **Active replication** processes the same request at every replica, which requires every replica to be a deterministic state machine seeing events in the same order. That ordering requirement is exactly [[cs/systems/distributed-consensus|state machine replication]], usually built on a replicated log of Paxos rounds.

When one leader is elected to handle every request, the system is **primary-backup** (also primary-replica): the primary does the work and streams a log of updates to standby backups that take over on failure. This dominates high-availability clusters. Its weakness is plain arithmetic. Only one replica actually does work, so fault tolerance costs a full duplicate of capacity, and if part of the update log is lost during a failure the backup may diverge from the primary and transactions can be lost.

The database world names three concrete topologies:

- **Single-leader** (primary/replica): one node takes all writes, logs them, and propagates to replicas that serve reads. Replicas can return stale data because of **replication lag**, the delay in propagating the leader's changes.
- **Multi-leader** (multi-master): writes go to any node and propagate outward. Useful across data centers, where each site writes locally and hides inter-site latency, at the cost of conflict handling when the same record changes in two places.
- **Leaderless**: any replica takes a write, and correctness comes from quorum overlap rather than a designated writer.

## Why multi-primary is dangerous

The appeal of letting every replica write is obvious: no bottleneck, local writes everywhere. Jim Gray's widely cited paper "The Dangers of Replication and a Solution" is the skeptic's case. He argued that unless the data splits naturally into disjoint sub-databases, concurrency-control conflicts degrade performance badly, and the group of replicas slows as a function of `n`, with the common approaches degrading [[cs/dsa/asymptotic-notation|on the order of]] `O(n^3)`. His fix is to partition the data on a natural key, which only works when such a key exists.

Synchronous (eager) replication prevents conflicts by detecting them before the commit is confirmed and aborting one transaction. Asynchronous (lazy) replication lets both commit and resolves the conflict later during re-synchronization, using techniques such as last-write-wins, application logic, or merging. The sync-versus-async choice reappears at the storage layer: synchronous replication guarantees zero data loss because a write is not complete until both local and remote storage acknowledge it, but performance falls off with distance since minimum latency is set by the speed of light. Asynchronous replication calls a write complete as soon as local storage acknowledges, so a local failure can lose the most recent data.

## The quorum inequalities

Quorum voting, due to Gifford in 1979, gives each copy of a data item a vote. A read must collect a **read quorum** `Vr`; a write must collect a **write quorum** `Vw`. With `V` total votes, two rules make it correct:

- `Vr + Vw > V`, so [[cs/math/pigeonhole-principle|the read and write quorums must overlap]], and a read set always contains at least one copy holding the newest version.
- `Vw > V/2`, so two writes cannot both gather a quorum at once, and no two writers commit to the same item concurrently.

Together these preserve one-copy serializability: the replicated item behaves like a single copy. In the common phrasing with `N` replicas, this is `R + W > N` for read-your-writes freshness and `W > N/2` to serialize writes. Set `W = N` and reads can be served from any single replica but writes need every node up; set `W` to a bare majority and you tolerate failures on both sides. The same voting idea also drives quorum-based **commit**: a distributed transaction commits only if a majority of sites vote to, with commit and abort quorums `Vc` and `Va` obeying `Va + Vc > V` so a transaction can never both commit and abort.

> [!example] A five-replica store, N = 5
> Choose `W = 3` and `R = 3`. Then `R + W = 6 > 5`, so any read of three replicas and any write to three replicas share at least one node, and that shared node holds the latest write. The store survives two replicas being down for either operation. Drop to `W = 2` and the overlap guarantee breaks: two reads and a write could miss each other, and a read can return stale data. That is the leaderless AP configuration, and it is why such systems need [[cs/systems/consistency-models|conflict resolution]] like vector clocks on top.

> [!warning]
> Quorum overlap guarantees a read *sees* a recent write; it does not by itself impose a global order on concurrent writes. Leaderless systems still need [[cs/systems/logical-clocks-lamport-and-vector|vector clocks]] or CRDTs to reconcile writes that were concurrent, because "latest" is undefined without a causal order.

## Related Notes

- [[cs/systems/distributed-consensus|Distributed Consensus]] covers the leader-election and state-machine-replication machinery that single-leader replication depends on
- [[cs/systems/cap-theorem|CAP Theorem]] is the constraint that forces the sync/async and leader/leaderless choices, in both its partition and latency branches
- [[cs/systems/consistency-models|Consistency Models]] defines what "stale read" and "converged" actually mean along the quorum spectrum
- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] supply the concurrency detection leaderless replication needs for conflict resolution

## Sources

- "Replication (computing)," Wikipedia. https://en.wikipedia.org/wiki/Replication_%28computing%29 . Backs active vs passive replication, the primary-backup / multi-primary distinction and its cost of a doubled backup, single-leader/multi-leader/leaderless database topologies with replication lag, Jim Gray's "Dangers of Replication" and the O(n^3) degradation, eager vs lazy conflict handling, and synchronous vs asynchronous storage replication with the speed-of-light latency point.
- "Quorum (distributed computing)," Wikipedia. https://en.wikipedia.org/wiki/Quorum_%28distributed_computing%29 . Backs the definition of a quorum, Gifford 1979 replica-control voting with the `Vr + Vw > V` and `Vw > V/2` rules preserving one-copy serializability, and quorum-based commit with `Va + Vc > V` preventing simultaneous commit and abort.
