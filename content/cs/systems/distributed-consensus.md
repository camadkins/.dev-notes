---
title: Distributed Consensus
description: CAP theorem, Paxos, Raft, and Byzantine fault tolerance — how distributed systems agree on shared state despite failures.
draft: false
comments: false
tags:
  - cs
  - systems
date: 2026-03-12
aliases: []
---

## Intuition

When data lives on a single machine, agreement is trivial — there is one copy, one truth. The moment you replicate data across machines (for availability or performance), you face a fundamental question: how do N nodes agree on the same value when messages can be delayed, reordered, or lost, and nodes can crash? **Distributed consensus** is the family of algorithms that answer this question, and the **CAP theorem** defines the trade-off space they operate in.

## Core Idea

**CAP theorem (Brewer, 2000; Gilbert & Lynch, 2002).** In a distributed system, you can guarantee at most two of three properties simultaneously:

- **Consistency** — every read returns the most recent write.
- **Availability** — every non-failing node returns a response.
- **Partition tolerance** — the system operates despite network partitions.

Since network partitions are unavoidable in practice, real systems choose between **CP** (sacrifice availability during partitions — e.g., most consensus protocols) and **AP** (sacrifice strict consistency — e.g., Dynamo, Cassandra with eventual consistency).

**Paxos (Lamport, 1989).** The foundational consensus protocol. A proposer sends a proposal to a quorum of acceptors; if a majority accepts, the value is chosen. Key insight: two-phase protocol (prepare/promise, then accept/accepted) ensures safety even with concurrent proposers. Paxos is notoriously hard to implement correctly; Multi-Paxos extends it to a sequence of decisions (a replicated log).

**Raft (Ongaro & Ousterhout, 2014).** Designed for understandability. Decomposes consensus into three sub-problems:

1. **Leader election** — nodes vote; a candidate with a majority becomes leader. Leaders send heartbeats; if followers miss them, they start a new election.
2. **Log replication** — the leader appends entries to its log and replicates to followers. An entry is **committed** once a majority has acknowledged it.
3. **Safety** — a candidate cannot win an election unless its log is at least as up-to-date as a majority's, preventing committed entries from being lost.

Raft guarantees that committed entries are never lost and that all nodes eventually converge to the same log.

**Byzantine fault tolerance (BFT).** Paxos and Raft tolerate **crash faults** — nodes that simply stop responding. **Byzantine faults** are worse: nodes can lie, send conflicting messages, or act arbitrarily. PBFT (Castro & Liskov, 1999) tolerates up to `f` Byzantine nodes out of `3f + 1` total, at higher message complexity (`O(n^2)` per decision). Blockchain consensus (Nakamoto, Tendermint) is a specialized form of BFT for open networks.

**FLP impossibility (Fischer, Lynch, Paterson, 1985).** No deterministic consensus algorithm can guarantee both safety and liveness in an asynchronous system with even one crash fault. Practical systems sidestep this with partial synchrony assumptions (timeouts, failure detectors) — they may stall during bad timing but never produce incorrect results.

**Replication strategies.**

| Strategy | Consistency | Latency | Fault tolerance |
|----------|------------|---------|-----------------|
| Single leader (Raft, Multi-Paxos) | Strong (linearizable) | Write to leader, read from leader or quorum | Majority must be up |
| Multi-leader | Conflict resolution needed | Lower write latency (local leader) | Higher availability |
| Leaderless (Dynamo-style) | Eventual or tunable | Read/write quorums (R + W > N) | Very high availability |

## Example

A three-node Raft cluster (`A`, `B`, `C`) with `A` as leader:

```
Client: "set x = 5"
  → A appends [set x=5] to log (index 3, term 2)
  → A sends AppendEntries to B, C
  → B acknowledges; C is slow but eventually acknowledges
  → A sees 2/3 majority → commits index 3
  → A applies to state machine, responds "ok" to client
  → A's next heartbeat tells B, C to commit index 3
```

If `A` crashes, `B` and `C` detect missing heartbeats after an election timeout. One starts an election, wins (it has all committed entries), and becomes the new leader. The client retries its next request against the new leader. Committed entry `[set x=5]` is never lost because a majority (`A` and `B`) had it before the crash.

**CAP in practice.** Consider a 3-node key-value store partitioned into `{A}` and `{B, C}`:
- **CP choice**: the `{A}` partition refuses writes (no majority), `{B, C}` continues. Reads from `{A}` return errors or stale data. After partition heals, `A` catches up from `B` or `C`.
- **AP choice**: both sides accept writes independently. After partition heals, conflicting writes must be resolved (last-writer-wins, vector clocks, CRDTs).

Most production systems (etcd, ZooKeeper, Consul) choose CP for coordination data and AP for less-critical caches or session stores.

## Related Notes

- [[graphs|Graphs]] — distributed systems are modeled as graphs of communicating nodes; graph connectivity determines partition behavior
- [[network-protocols|Network Protocols]] — the transport layer that consensus messages travel over
- [[processes-and-threads|Processes & Threads]] — each node in a distributed system is itself a process or set of threads
