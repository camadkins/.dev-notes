---
title: Cache Coherence
description: "When every core caches the same memory, whose copy is right? The coherence problem, the MESI states, write-invalidate vs write-update, and the false sharing trap."
draft: false
comments: true
tags:
  - cs
  - systems
  - computer-architecture
  - concurrency
date: 2026-07-02
updated:
aliases:
  - MESI
  - False Sharing
  - Coherence Protocol
---

A single core with a [[cs/systems/memory-hierarchy-and-caching|cache]] has no coherence problem: its cache is simply a fast copy of memory, and it is the only party writing. Add a second core with its own private cache and the picture breaks. Both cores can pull the same 64-byte line into their local caches, and the moment one of them writes, the other is holding a stale copy that still claims to be current. Cache coherence is the hardware discipline that stops the two copies from silently disagreeing.

The failure is concrete: "if two clients have a cached copy of a particular memory block and one client changes the block, the other client's copy must be invalidated or updated. If it is not, the system is in an incoherent state: it contains two different records of the same memory block which both claim to be up-to-date."

> [!note] The idea
> Coherence is what lets programmers keep pretending there is one shared memory when physically there are many private copies of every line. The hardware maintains that illusion by tracking, per cache line, whether this core's copy is the only one, one of several, or out of date, and by forcing an action (invalidate or update) the instant a write would make the copies diverge. The programmer sees a single coherent address space; underneath, the caches are constantly negotiating who is allowed to hold what.

## The problem, precisely

"In computer architecture, cache coherence is the uniformity of shared resource data that is stored in multiple local caches." The guarantee is simple to state: "in a cache coherent system, if multiple clients have a cached copy of the same region of a shared memory resource, all copies are the same." Coherence "defines the behavior of reads and writes to a single address location," which is exactly the scope, one address at a time, not the broader question of ordering across different addresses (that is [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|memory consistency]], a separate topic).

The mechanism most systems use is snooping: each cache watches the shared bus for transactions touching lines it holds. Two families of protocol act on what they see. "The write-invalidate protocols and write-update protocols make use of this mechanism." The names describe the two possible responses to another core's write, the same fork the intro named: invalidate the other copies, or update them.

## Write-invalidate vs write-update

- **Write-invalidate**: when a core writes a line, it first tells every other cache to mark its copy invalid. Now the writer is the sole owner and can modify freely; other cores take a miss and re-fetch the fresh value only if and when they actually need it. This is the common choice, and MESI is one such protocol.
- **Write-update**: when a core writes, it broadcasts the new value so every other cached copy is refreshed in place. No one takes a miss on the next read, but every write generates bus traffic proportional to how many caches hold the line.

The tradeoff is a bet about access patterns. Invalidate wins when a line is written repeatedly by one core before another reads it (you pay one invalidation, not many updates). Update wins when many cores read a line right after each writer touches it. Most real hardware bets on invalidate.

## MESI: the four states

MESI is "an invalidate-based cache coherence protocol, and is one of the most common protocols that support write-back caches." It is also called the Illinois protocol. It tracks each cache line in one of four states, "encoded using two additional bits":

- **Modified (M)**: "the cache line is present only in the current cache, and is dirty, it has been modified from the value in main memory." This core owns the only valid copy and must eventually write it back.
- **Exclusive (E)**: "the cache line is present only in the current cache, but is clean, it matches main memory." Sole copy, unmodified. A write can proceed to M without telling anyone, because no one else holds the line.
- **Shared (S)**: "this cache line may be stored in other caches of the machine and is clean, it matches the main memory." Read-only sharing; the line "may be discarded (changed to the Invalid state) at any time."
- **Invalid (I)**: "this cache line is invalid (unused)." A read of it misses.

The states encode exactly the two facts coherence needs per line: is my copy clean or dirty, and am I the only holder or one of several. The E state is the clever part. It lets a core that loaded a line nobody else wants upgrade to a write for free, skipping the invalidation broadcast that would otherwise be required, which is a common and cheap case worth optimizing.

> [!example] A write, traced through MESI
> Core 1 reads line L; no one else has it, so L is **Exclusive** in cache 1. Core 2 reads L; cache 1 sees the snoop and both copies become **Shared**. Now core 1 writes L: it broadcasts an invalidate, cache 2's copy drops to **Invalid**, and cache 1's copy becomes **Modified**. If core 2 now reads L, it misses, and cache 1 supplies the modified data (and writes back), leaving both in **Shared** again. Every divergence is caught at the moment of the write.

## False sharing: the coherence tax you did not ask for

Coherence works on whole cache lines, not individual variables, and that granularity has a sharp edge. False sharing is "a performance-degrading usage pattern that can arise in systems with distributed, coherent caches at the size of the smallest resource block managed by the caching mechanism." It happens when "a system participant attempts to periodically access data that is not being altered by another party, but that data shares a cache block with data that is being altered." The protocol then "may force the first participant to reload the whole cache block despite a lack of logical necessity."

The trap: two cores update two entirely separate variables, no logical sharing at all, but the variables happen to sit in the same 64-byte line. Every write by one core invalidates the line in the other, so both cores keep missing and re-fetching a line they are not truly sharing. The program is correct but crawls, and nothing in the source hints at why. The fix is layout, [[cs/dsa/memory-allocation|padding]] the two variables onto separate cache lines so the coherence protocol stops treating them as one unit.

## Related Notes

- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - the cache line, the unit coherence operates on
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - coherence keeps copies uniform, but does not by itself order operations across addresses
- [[cs/systems/processes-and-threads|Processes & Threads]] - the parallel threads whose caches must be kept coherent

## Sources

- "Cache coherence," Wikipedia. https://en.wikipedia.org/wiki/Cache_coherence . Backs the definition of the coherence problem (a changed block must invalidate or update other copies or the system is incoherent), coherence as uniformity of shared data across local caches defining reads and writes to a single address, and the existence of write-invalidate and write-update snooping protocol families.
- "MESI protocol," Wikipedia. https://en.wikipedia.org/wiki/MESI_protocol . Backs MESI as a common invalidate-based protocol for write-back caches (the Illinois protocol) and the definitions of the Modified, Exclusive, Shared, and Invalid states encoded in two bits.
- "False sharing," Wikipedia. https://en.wikipedia.org/wiki/False_sharing . Backs false sharing as a performance-degrading pattern where unshared data sharing a cache block with altered data forces the whole block to reload despite no logical necessity.
