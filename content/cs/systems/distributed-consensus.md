---
title: Distributed Consensus
description: CAP theorem, Paxos, Raft, and Byzantine fault tolerance - how distributed systems agree on shared state despite failures.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-03-12
updated:
aliases: []
---

## The Problem

When data lives on one machine, agreement is trivial. There's one copy, one truth. The moment you replicate data across machines (for availability, latency, or fault tolerance), you hit the fundamental question: how do N nodes agree on the same value when messages can be delayed, reordered, or lost, and nodes can crash at any time?

This is harder than it sounds. You can't just "pick a leader and have everyone listen" because the leader can crash. You can't just "take a vote" because votes can arrive out of order or not at all. The whole field of distributed consensus exists because reliable agreement in an unreliable network is genuinely difficult.

> [!note]
> **FLP impossibility (Fischer, Lynch, Paterson, 1985):** No deterministic consensus algorithm can guarantee both safety and liveness in an asynchronous system with even one crash fault. This is a theoretical result, but it explains why every practical system uses timeouts and failure detectors. They might stall during bad timing, but they never produce incorrect results.

---

## CAP Theorem

**CAP (Brewer, 2000; Gilbert & Lynch, 2002):** In a distributed system, you can guarantee at most two of three properties simultaneously:

- **Consistency** - every read returns the most recent write.
- **Availability** - every non-failing node returns a response.
- **Partition tolerance** - the system operates despite network partitions.

Since network partitions are unavoidable in practice, the real choice is between **CP** (sacrifice availability during partitions) and **AP** (sacrifice strict consistency).

> [!tip]
> CAP is often presented as "pick 2 of 3," but that framing is slightly misleading. You always need partition tolerance because networks fail. So the actual decision is: when a partition happens, do you want consistency or availability? Most systems make different choices for different data. Coordination metadata (who's the leader, what's committed) is usually CP. Session caches or analytics counters can be AP.

---

## Paxos

The foundational consensus protocol (Lamport, written 1989, published 1998). A proposer sends a proposal to a quorum of acceptors; if a majority accepts, the value is chosen.

The two-phase protocol (prepare/promise, then accept/accepted) ensures safety even with concurrent proposers. The key insight: the prepare phase forces a proposer to learn about any value that might already be chosen, preventing conflicts.

Paxos is notoriously hard to implement correctly. Multi-Paxos extends it to a sequence of decisions (a replicated log), but the paper leaves a lot of implementation details as exercises for the reader, which is part of why Raft exists.

---

## Raft

Designed explicitly for understandability (Ongaro & Ousterhout, 2014). Where Paxos describes a single consensus decision and leaves log replication as an extension, Raft decomposes the whole problem into three clean sub-problems:

1. **Leader election** - nodes vote; a candidate with a majority becomes leader. Leaders send heartbeats; if followers miss them, they start a new election.
2. **Log replication** - the leader appends entries to its log and replicates to followers. An entry is **committed** once a majority has acknowledged it.
3. **Safety** - a candidate cannot win an election unless its log is at least as up-to-date as a majority's, preventing committed entries from being lost.

> [!warning]
> "Committed" in Raft has a precise meaning: a log entry is committed once the leader knows a majority of nodes have it. Until that point, the entry can still be lost. This distinction matters when reasoning about what survives a crash.

### Raft Walkthrough

A three-node cluster (`A`, `B`, `C`) with `A` as leader:

```
Client: "set x = 5"
  → A appends [set x=5] to log (index 3, term 2)
  → A sends AppendEntries to B, C
  → B acknowledges; C is slow but eventually acknowledges
  → A sees 2/3 majority → commits index 3
  → A applies to state machine, responds "ok" to client
  → A's next heartbeat tells B, C to commit index 3
```

If `A` crashes, `B` and `C` detect missing heartbeats after an election timeout. One starts an election, wins (it has all committed entries), and becomes the new leader. Committed entry `[set x=5]` is never lost because a majority (`A` and `B`) had it before the crash.

---

## Byzantine Fault Tolerance

Paxos and Raft handle **crash faults** where nodes simply stop responding. **Byzantine faults** are worse: nodes can lie, send conflicting messages, or act arbitrarily malicious.

PBFT (Castro & Liskov, 1999) tolerates up to `f` Byzantine nodes out of `3f + 1` total, at higher message complexity (`O(n^2)` per decision). Blockchain consensus (Nakamoto, Tendermint) is a specialized form of BFT for open networks where you don't even know who the participants are.

> [!note]
> The `3f + 1` bound is fundamental. With Byzantine faults, you need enough honest nodes to outvote the liars even in the worst case. With crash faults (Raft/Paxos), `2f + 1` suffices because crashed nodes don't actively lie, they just go silent.

---

## Replication Strategies

Different systems make different tradeoffs depending on what matters most:

| Strategy | Consistency | Latency | Fault tolerance |
|----------|------------|---------|-----------------|
| Single leader (Raft, Multi-Paxos) | Strong (linearizable) | Write to leader, read from leader or quorum | Majority must be up |
| Multi-leader | Conflict resolution needed | Lower write latency (local leader) | Higher availability |
| Leaderless (Dynamo-style) | Eventual or tunable | Read/write quorums (R + W > N) | Very high availability |

Leaderless systems like Dynamo use quorum math: if you write to W nodes and read from R nodes, and R + W > N, you're guaranteed to read at least one copy of the latest write. But "latest" gets fuzzy when there's no global ordering, which is why these systems need conflict resolution (last-writer-wins, vector clocks, CRDTs).

---

## CAP in Practice

Consider a 3-node key-value store partitioned into `{A}` and `{B, C}`:

- **CP choice**: the `{A}` partition refuses writes (no majority), `{B, C}` continues. Reads from `{A}` return errors or stale data. After partition heals, `A` catches up from `B` or `C`.
- **AP choice**: both sides accept writes independently. After partition heals, conflicting writes must be resolved (last-writer-wins, vector clocks, CRDTs).

> [!tip]
> Most production systems (etcd, ZooKeeper, Consul) choose CP for coordination data and AP for less-critical caches or session stores. The choice isn't system-wide; it's per-use-case.

## Related Notes

- [[graphs|Graphs]] - distributed systems are modeled as graphs of communicating nodes; graph connectivity determines partition behavior
- [[network-protocols|Network Protocols]] - the transport layer that consensus messages travel over
- [[processes-and-threads|Processes & Threads]] - each node in a distributed system is itself a process or set of threads
