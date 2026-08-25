---
title: Process Scheduling Algorithms
description: "FCFS, SJF, round robin, priority, and the multilevel feedback queue: how the OS decides which ready process runs next, and why every policy is a compromise."
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-02-18
updated:
aliases:
  - CPU Scheduling
  - Scheduling Algorithms
---

## Picking the Next Runner

At any instant a machine has more processes ready to run than it has cores. The scheduler is the OS module that answers one repeated question: of everything in the ready queue, which process gets the CPU next, and for how long? The answer is invisible when it works and painfully obvious when it fails, a laggy terminal, a batch job that never finishes, [[cs/military-computing/sage-and-real-time-systems|a real-time task that misses its deadline]].

The [[cs/systems/processes-and-threads|processes and threads]] note surveys the OS execution units and touches scheduling in passing. This note goes into the policies themselves and the single tension they all negotiate.

> [!note] The idea
> There is no optimal scheduler, only optimal-for-a-goal. Throughput, wait time, response latency, and fairness pull against each other, so every real policy picks a compromise among them. The named algorithms (FCFS, SJF, round robin, priority, MLFQ) are named because each one privileges a different corner of that trade space.

## The goals that conflict

Wikipedia's scheduling overview lists the standard aims: maximizing throughput, minimizing wait time, minimizing response time, and maximizing fairness. It then states the catch plainly: "In practice, these goals often conflict (e.g. throughput versus latency), thus a scheduler will implement a suitable compromise." Hold that sentence in mind, because it is the reason the list of algorithms below exists at all. If one policy dominated on every metric, there would be one policy.

## The classic policies

**First come, first served (FCFS).** The ready queue is a [[cs/dsa/queue|plain FIFO]]: run each process to completion in arrival order. It is "the simplest scheduling algorithm," and its weakness is the convoy effect, a single long job at the head makes every short job behind it wait. Great for fairness of arrival, terrible for average wait time.

**Shortest job first (SJF).** Run the waiting process with the smallest execution time. It "minimizes the average amount of time each process has to wait until its execution is complete," which is [[cs/dsa/greedy-algorithms|provably optimal]] for average wait among non-preemptive policies. Two costs come with that optimality: it "has the potential for process starvation" for long jobs when short ones keep arriving, and "the total execution time of a job must be known before execution," which in general you cannot know. Real systems estimate the next burst from past behavior.

**Round robin (RR).** Assign "a fixed time unit per process" (the quantum) and cycle. A process that does not finish inside its quantum is preempted and sent to the back. Round robin is the fairness workhorse: no job starves, response time is bounded. The cost is overhead, a short quantum means frequent [[cs/systems/context-switching|context switches]], and each switch is wasted CPU time.

**Priority scheduling.** Assign every process a rank; the scheduler runs the highest-priority ready process. In the fixed-priority preemptive form, "lower-priority processes get interrupted by incoming higher-priority processes." Priority is expressive but reintroduces starvation: a stream of high-priority work can freeze a low-priority job forever. The standard remedy is aging, slowly raising a waiting job's priority so it eventually runs.

## Preemptive vs non-preemptive

The axis underneath all of these is whether the scheduler is allowed to yank a running process off the CPU. A preemptive scheduler can pause a running process to start another; a cooperative (non-preemptive) scheduler cannot, and must wait for the running process to yield or block. FCFS and plain SJF are non-preemptive. Round robin and fixed-priority preemptive scheduling are preemptive. Shortest remaining time first is just the preemptive variant of SJF: when a new, shorter job arrives, it preempts the current one.

Preemption buys responsiveness and protects against a runaway process monopolizing the machine, at the price of the context-switch overhead every preemption incurs.

## The multilevel feedback queue

FCFS is bad for short jobs; SJF needs a job length you cannot know; round robin ignores that jobs differ. The multilevel feedback queue (MLFQ) resolves this by *learning* each job's character from its behavior instead of being told. It uses several ready queues at different priorities and, crucially, moves a process between them based on observed CPU usage.

The design requirements Wikipedia records are: "Separate processes into multiple ready queues based on their need for the processor," "Give preference to processes with short CPU bursts," and "Give preference to processes with high I/O bursts." The mechanism: a job that repeatedly uses its whole quantum looks CPU-bound and sinks to a lower-priority queue with a longer quantum; a job that yields early to wait on I/O looks interactive and stays high. So an editor waiting on keystrokes stays snappy while a compile sinks to the batch tier, without anyone declaring which is which in advance.

> [!tip]
> MLFQ is the practical answer to "SJF is optimal but needs the future." It approximates shortest-job-first by treating recent short bursts as a prediction of the next one, then corrects continuously as behavior changes. It was first developed by Fernando Corbató in 1962, work for which he later received the Turing Award.

## Related Notes

- [[cs/systems/processes-and-threads|Processes & Threads]] - the execution units the scheduler multiplexes, with a shorter scheduling table
- [[cs/systems/context-switching|Context Switching]] - the per-preemption cost that makes short quanta expensive
- [[cs/systems/distributed-consensus|Distributed Consensus]] - scheduling's cross-machine cousin, ordering work across nodes rather than on one CPU

## Sources

- "Scheduling (computing)," Wikipedia. https://en.wikipedia.org/wiki/Scheduling_%28computing%29 . Backs the scheduler definition, the four conflicting goals and the "suitable compromise" quote, and the descriptions of FCFS ("simplest scheduling algorithm"), round robin ("a fixed time unit per process"), fixed-priority preemptive scheduling, and the preemptive-vs-cooperative distinction.
- "Shortest job next," Wikipedia. https://en.wikipedia.org/wiki/Shortest_job_next . Backs SJF selecting the smallest-execution-time process, that it minimizes average wait, that it is non-preemptive with shortest-remaining-time as the preemptive variant, and its two costs: starvation of long jobs and needing total execution time known in advance.
- "Multilevel feedback queue," Wikipedia. https://en.wikipedia.org/wiki/Multilevel_feedback_queue . Backs the three MLFQ design requirements (separate queues by processor need, prefer short CPU bursts, prefer high I/O bursts), the move-between-queues-by-behavior mechanism versus the fixed multilevel queue, and Corbató's 1962 development and Turing Award.
