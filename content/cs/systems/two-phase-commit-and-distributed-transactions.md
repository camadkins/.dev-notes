---
title: Two-Phase Commit and Distributed Transactions
description: "How 2PC coordinates an atomic commit across nodes, why it blocks when the coordinator dies, and what 3PC and sagas do about it."
draft: false
comments: true
tags:
  - cs
  - systems
  - distributed-systems
date: 2026-06-11
updated:
aliases:
  - 2PC
  - Two-Phase Commit
  - Distributed Transactions
---

A single-machine transaction is atomic because one storage engine decides commit or abort and everyone downstream obeys. Spread the transaction across databases on different machines and there is no single decider. Each participant might succeed locally while another fails, and you need all of them to reach the *same* verdict, commit everywhere or abort everywhere, despite crashes and dropped messages in between. Two-phase commit is the classic protocol for forcing that unanimity.

> [!note] The idea
> Two-phase commit is a specialized consensus protocol that guarantees an all-or-nothing outcome across participants by voting first and committing second. Its fatal weakness is structural, not incidental: once a participant votes yes, it is bound to wait for the coordinator's verdict, so a coordinator that dies at the wrong moment leaves participants blocked with locks held and no safe way to decide alone.

## The two phases

One node is the coordinator; the rest are participants (also called cohorts). The protocol assumes stable storage with a write-ahead log at every node, that no node crashes forever, that the log survives crashes, and that any two nodes can eventually communicate.

**Phase 1, commit-request (voting).** The coordinator sends a *query to commit* to every participant and waits for all replies. Each participant executes the transaction up to the commit point, writes undo and redo log entries, and votes: *yes* if its local work succeeded, *no* if it hit a problem that makes committing impossible.

**Phase 2, commit (completion).** If every vote was yes, the coordinator sends *commit* to all; each participant finalizes, releases its locks and resources, and acknowledges. If any participant voted no, or the coordinator timed out waiting, the coordinator sends *rollback* and every participant undoes its work using the undo log. Either way the coordinator finishes once all acknowledgments arrive.

The forced log writes are what let the protocol recover from most failures automatically; recovery procedures, though rarely exercised, make up a large part of any real 2PC implementation.

> [!example] Normal message flow
> ```
> Coordinator                        Participant
>            QUERY TO COMMIT
>   ------------------------------>
>            VOTE YES / NO           prepare* / abort*
>   <------------------------------
>            COMMIT / ROLLBACK
>   ------------------------------>
>            ACKNOWLEDGEMENT         commit* / abort*
>   <------------------------------
> ```
> An asterisk marks a record forced to stable storage before the message is sent.

## The blocking problem

The greatest disadvantage of 2PC is that it is a blocking protocol. After a participant has voted yes, it must wait for a commit or rollback; it cannot unilaterally decide, because it does not know how the other participants voted. If the coordinator fails permanently, those participants never resolve, holding their locks indefinitely.

Worse is the ambiguous case where **both** the coordinator and one participant fail during the commit phase. If only the coordinator had failed and no participant had received a commit, a new coordinator could safely infer that nothing committed. But if a participant also failed, that participant might have been the first told to commit and might have done so. A replacement coordinator cannot proceed safely until it has heard from every participant, so it must block until the failed one returns. This is a direct cousin of the [[distributed-consensus|FLP impossibility]] result: no timeout-free protocol escapes bad timing entirely.

## Three-phase commit and sagas

**Three-phase commit (3PC)** attacks exactly the blocking case by inserting a *prepared-to-commit* state between the vote and the commit. The coordinator does not send the final *doCommit* until every participant has acknowledged that it is prepared. If the coordinator dies before any preCommit goes out, a recovery coordinator finding no participant prepared can safely abort; finding some in the commit phase, it can safely drive the commit forward. The removed ambiguity is what eliminates indefinite blocking. The cost is real: 3PC assumes bounded network delay and bounded response times, so on ordinary networks with unbounded delay and process pauses it cannot guarantee atomicity, and it needs at least three round trips per transaction.

**Sagas** (the long-running transaction, or saga interaction pattern) abandon the goal entirely for transactions that would hold locks too long. Instead of one atomic commit, a saga chains smaller local ACID transactions and, on failure, runs **compensating** actions that undo the earlier steps by business logic rather than by rollback. The canonical example: the compensation for making a hotel reservation is canceling that reservation. A coordinator still mediates completion or compensation, but no global lock is ever held across the whole operation.

> [!tip]
> The progression is a story about what you are willing to give up. 2PC keeps strict atomicity and pays with blocking. 3PC trades a timing assumption to unblock. Sagas drop cross-node atomicity for availability, accepting that intermediate states are visible and must be compensated. There is no version that keeps all three for free.

## Related Notes

- [[distributed-consensus|Distributed Consensus]] frames 2PC as a specialized consensus protocol and covers Paxos and Raft, which replicate the coordinator so its failure is survivable
- [[cap-theorem|CAP Theorem]] explains why a strongly consistent commit sacrifices availability exactly when the network partitions
- [[replication-and-quorums|Replication and Quorums]] uses quorum voting as an alternative path to atomic commit under partition
- [[deadlock|Deadlock]] is the local analogue of participants stuck holding resources they will not release

## Sources

- "Two-phase commit protocol," Wikipedia. https://en.wikipedia.org/wiki/Two-phase_commit_protocol . Backs 2PC as an atomic commitment and specialized consensus protocol, the coordinator/participant roles and stable-storage assumptions, the voting and commit phases with undo/redo logging, the message-flow diagram, and the blocking disadvantage including the coordinator-plus-cohort failure ambiguity.
- "Three-phase commit protocol," Wikipedia. https://en.wikipedia.org/wiki/Three-phase_commit_protocol . Backs the prepared-to-commit state eliminating indefinite blocking, the recovery-coordinator reasoning, and the disadvantages of assuming bounded delay and requiring at least three round trips.
- "Long-running transaction," Wikipedia. https://en.wikipedia.org/wiki/Long-running_transaction . Backs the saga interaction pattern: avoiding locks on non-local resources, using compensation to handle failures instead of rollback, the hotel-reservation compensation example, and the use of a coordinator.
