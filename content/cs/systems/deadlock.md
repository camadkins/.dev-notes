---
title: Deadlock
description: "The four Coffman conditions, and the four ways an OS handles deadlock: prevention, avoidance, detection, and the ostrich."
draft: false
comments: true
tags:
  - cs
  - systems
  - concurrency
date: 2026-04-18
updated:
aliases:
  - Coffman Conditions
  - Deadlock Handling
---

Two threads, two locks, acquired in the opposite order: thread A holds lock 1 and wants lock 2, thread B holds lock 2 and wants lock 1. Neither will ever let go, so neither will ever proceed. That is a deadlock, and the reason it deserves its own note rather than a footnote in [[concurrency-primitives|concurrency primitives]] is that the interesting content is not the failure itself but the surprisingly small, closed list of conditions that make it possible, and the four fundamentally different postures an operating system can take toward it.

The Wikipedia definition is precise: "deadlock is any situation in which no member of some group of entities can proceed because each waits for another member, including itself, to take action, such as sending a message or, more commonly, releasing a lock."

> [!note] The idea
> Deadlock is not a random bug you hunt case by case. It requires four specific conditions to hold at once, and every strategy against it works by attacking one of those four. Break any single condition and deadlock becomes structurally impossible. This is why the Coffman conditions matter more than any particular deadlock story: they turn an open-ended problem into a closed one.

## The four Coffman conditions

A deadlock "can arise only if all of the following conditions occur simultaneously in a system." Named after Edward G. Coffman, Jr., who first described them in a 1971 article, they are:

1. **Mutual exclusion**: "multiple resources are not shareable; only one process at a time may use each resource."
2. **Hold and wait** (resource holding): "a process is currently holding at least one resource and requesting additional resources which are being held by other processes."
3. **No preemption**: "a resource can be released only voluntarily by the process holding it."
4. **Circular wait**: "each process must be waiting for a resource which is being held by another process, which in turn is waiting for the first process to release the resource."

The subtlety the article flags: these four "are sufficient to produce a deadlock on single-instance resource systems," but on systems with multiple instances of a resource "they only indicate the possibility of deadlock." Four conditions, all required, all simultaneous. That conjunction is the lever.

## Four ways to handle it

Because all four conditions are necessary, an OS has a menu of responses. They trade effort against safety in different ways.

### Ignore it (the ostrich)

The simplest posture is to assume deadlock will never happen. This "is also an application of the Ostrich algorithm," head in the sand, and it "was initially used by MINIX and UNIX." It sounds negligent until you see the economics: it "is used when the time intervals between occurrences of deadlocks are large and the data loss incurred each time is tolerable." Most current operating systems, in fact, "cannot prevent deadlocks." Rebooting the rare hung machine is cheaper than paying the overhead to prevent a once-a-year event.

### Prevention: break a condition up front

Prevention "works by preventing one of the four Coffman conditions from occurring." Each condition suggests an attack, and each attack has a cost:

- Removing **mutual exclusion** gives [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|non-blocking synchronization algorithms]], but it "proves impossible for resources that cannot be spooled."
- Removing **hold and wait** means "requiring processes to request all the resources they will need before starting up." This "advance knowledge is frequently difficult to satisfy and, in any case, is an inefficient use of resources."
- Removing **no preemption** implies rollback of a locked-out resource, which "is to be avoided since it is very costly in overhead."
- Removing **circular wait** is the cheapest and most common: impose "a hierarchy to determine a [[cs/math/relations-and-equivalence|partial ordering]] of resources." Everyone acquires locks in the same global order, so no cycle can form. "If no obvious hierarchy exists, even the memory address of resources has been used to determine ordering."

That last one is the trick most real codebases actually use: pick a lock order, enforce it everywhere.

### Avoidance: check each request against a safe state

Avoidance sounds like a synonym for prevention but is a different mechanism. It "does not impose any conditions as seen in prevention but, here each resource request is carefully analyzed to see whether it could be safely fulfilled without causing deadlock." The price is foreknowledge: the OS "be given in advance additional information concerning which resources a process will request and use during its lifetime."

The canonical avoidance algorithm is Dijkstra's Banker's algorithm, "a resource allocation and deadlock avoidance algorithm developed by Edsger Dijkstra that tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources." Every process declares a maximum claim up front; before granting any request the system asks whether the resulting state is still *safe*.

> [!example] Safe vs unsafe
> A state "is considered safe if it is possible for all processes to finish executing." The banker checks this by trying "to find a hypothetical set of requests by the processes that would allow each to acquire its maximum resources and then terminate (returning its resources to the system). Any state where no such set exists is an unsafe state." A request is granted only if the state it leads to is safe. The name is literal: like a bank that never commits so much cash that it cannot cover every customer's maximum withdrawal, the OS never grants an allocation that could strand some process short of its declared maximum.

### Detection: let it happen, then recover

The last posture allows deadlock and cleans up after. "The state of the system is examined to detect that a deadlock has occurred and subsequently it is corrected." An algorithm "tracks resource allocation and process states, it rolls back and restarts one or more of the processes in order to remove the detected deadlock." Detection is easy because "the resources that each process has locked and/or currently requested are known to the resource scheduler." This is the database-engine posture: run fast in the common case, and when a [[cs/math/graph-theory|wait-for cycle]] appears, kill a victim transaction and let it retry.

## The trade-off

The four handlers line up on a spectrum of pessimism. Prevention is the most pessimistic: pay structural cost always so deadlock can never form. Avoidance is middle: pay a per-request check plus the burden of declaring maximums. Detection is optimistic: pay nothing until a deadlock actually happens, then pay the rollback. The ostrich pays nothing ever and accepts the occasional hang. Which is correct depends entirely on how often deadlocks occur and how expensive each one is, which is why a kernel, a database, and an embedded controller each pick a different point.

## Related Notes

- [[concurrency-primitives|Concurrency Primitives]] - the locks whose misordered acquisition creates the classic deadlock
- [[process-scheduling-algorithms|Process Scheduling Algorithms]] - the scheduler is what strands the blocked processes
- [[processes-and-threads|Processes & Threads]] - the entities that hold and wait on resources

## Sources

- "Deadlock (computer science)," Wikipedia. https://en.wikipedia.org/wiki/Deadlock_%28computer_science%29 . Backs the definition of deadlock, the four Coffman conditions and their 1971 origin, the single-instance-vs-multiple-instance distinction, the ostrich/ignore approach (MINIX, UNIX) and the tolerable-data-loss rationale, prevention by breaking each condition (including resource ordering for circular wait), avoidance analyzing each request for safety, and detection with rollback and restart.
- "Banker's algorithm," Wikipedia. https://en.wikipedia.org/wiki/Banker%27s_algorithm . Backs the Banker's algorithm as Dijkstra's resource-allocation and deadlock-avoidance algorithm, the maximum-claim declaration, and the safe-versus-unsafe-state test.
