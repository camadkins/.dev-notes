---
title: "HotSpot Garbage Collectors"
description: "What G1 and ZGC actually trade against each other in shipping HotSpot: regions and a pause-time model against colored pointers and barriers on every load."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-08-11
updated:
aliases:
  - G1GC
  - ZGC
  - Java Garbage Collection
---

The textbook account of garbage collection ends where the engineering starts. Mark-sweep, copying, and generational collection are covered in [[cs/pl/gc-algorithms-mark-sweep-copying-generational|the algorithms note]], the reachability and root-set machinery underneath them in [[cs/pl/garbage-collection-concepts|the concepts note]]. None of that tells you why a JVM tuned for a 4 GB heap and one tuned for a 4 TB heap run different collectors, or what you give up by switching. HotSpot ships several collectors because the theory does not pick one.

> [!note] The idea
> Both shipping HotSpot collectors are generational and concurrent, and they differ in where they spend the concurrency budget. G1 keeps a stop-the-world evacuation pause but sizes it against a model of past behavior, so the pause is short and predictable rather than absent. ZGC pushes almost everything concurrent by putting metadata in the pointer itself and taxing every object read through a barrier. The trade is stated openly in the docs: G1 gives up some throughput to shorten pauses, and ZGC gives up more, spending CPU on barriers to buy pause times that do not grow with the heap.

## G1: the heap as a set of regions

"G1 is a generational, incremental, parallel, mostly concurrent, stop-the-world, and evacuating garbage collector," and every adjective there is load-bearing. Its structural decision is to abandon contiguous generations. "G1 partitions the heap into a set of equally sized heap regions, each a contiguous range of virtual memory," and "A region is the unit of memory allocation and memory reclamation." Each region is assigned to eden, survivor, or old as needed, and those assignments are not contiguous the way classic young and old spaces were.

That decoupling makes generation sizing dynamic instead of a startup flag. "An application always allocates into a young generation," but which physical regions form that generation changes as the program runs. The kinship with [[cs/systems/memory-allocators-and-fragmentation|allocator design]] is direct: G1 is a region allocator, and choosing which regions to collect is the same kind of decision an allocator makes about which free block to hand out.

Reclamation is by copying. "G1 reclaims space mostly by using evacuation: live objects found within selected memory areas to collect are copied into new memory areas, compacting them in the process." Copying costs are proportional to live data rather than to heap size, which is exactly why collecting mostly-garbage regions first pays off, and where the collector's name comes from.

The distinctive part is the pause-time model. "G1 achieves predictability by tracking information about previous application behavior and garbage collection pauses to build a model of the associated costs," then sizes the collection set so the pause fits the target. This is feedback control, not a bound: "The Garbage-First collector is not a real-time collector," and it meets targets with high probability over time, not with certainty for any given pause.

The cost is throughput, and the tuning guide does not soften it. G1 "trades processor resources which would otherwise be available to the application for shorter collection pauses," and "while garbage collection pauses are typically much shorter with the G1 collector, application throughput also tends to be slightly lower." Concurrent marking threads run on cores your program wanted.

> [!warning] Humongous objects
> "Humongous objects are objects larger or equal the size of half a region," and each is allocated as a run of contiguous old regions with the tail of the last region wasted. Regular reclamation of them happens only at the Cleanup pause or a full GC, and moving one requires a second full GC in the same pause. A workload that allocates large arrays against a small region size can therefore behave badly for reasons that look nothing like a GC problem. This is the same limit that constrains a virtual thread's heap-allocated stack: see [[cs/languages/Java/virtual-threads-and-structured-concurrency|virtual threads]], whose stack chunks become humongous if they grow past half a region.

## ZGC: metadata in the pointer

ZGC starts from a different requirement. "ZGC's pause times are consistently measured in microseconds; by contrast the pause times of the default garbage collector, G1, range from milliseconds to seconds," and "ZGC's low pause times are independent of heap size." Independence from heap size is the claim that matters, and it is only achievable if the collector never does work proportional to the heap while the application is stopped.

Getting there means solving a harder problem than G1's. ZGC relocates objects while the application reads and writes them, so it must hand the application a consistent view of a graph moving underneath it. "ZGC does this via colored pointers, load barriers, and store barriers."

A colored pointer is "a pointer to an object in the heap which, along with the object's memory address, includes metadata that encodes the known state of the object": whether it is known live, whether the address is still correct. "ZGC always uses 64-bit object pointers," which is where the spare bits come from and why ZGC has never supported compressed oops. A load barrier is "a fragment of code injected by ZGC into the application wherever the application reads a field of an object that refers to another object." It reads the color, and if the object moved, fixes the pointer before the application sees it. Every reference load carries that check.

The generational rework in JDK 21 shows how much was left on the table. Before it, "ZGC currently stores all objects together, regardless of age, so it must collect all objects every time it runs," discarding the weak generational hypothesis entirely: "young objects tend to die young, while old objects tend to stick around." Generational ZGC adds store barriers to track cross-generational references, and the win is not marginal. On an Apache Cassandra benchmark, "Generational ZGC requires a quarter of the heap size yet achieves four times the throughput compared to non-generational ZGC, while still keeping pause times under one millisecond."

Two implementation details show the engineering texture. Non-generational ZGC used multi-mapped memory to make load barriers cheap, with the consequence that "the same heap memory is mapped into three separate virtual address ranges, so the heap usage reported by tools such as ps is around triple the amount of memory actually used." Generational ZGC dropped that for explicit barrier code, which fixes the reporting confusion and frees the metadata bits from having to fit inside the addressable range. The coloring is also confined to the heap: "Object references stored in the JVM stack, however, are implemented as colorless pointers, without metadata bits, in the hardware stack or in CPU registers," with barriers translating at the boundary, and the layout is chosen so one shift instruction on x64 strips metadata and tests whether processing is needed.

## Choosing

"G1 is the default collector," and for most workloads that is right: heaps in the tens of gigabytes, pause targets in the low hundreds of milliseconds, no barrier tax on ordinary field reads. ZGC earns its cost when a pause of even tens of milliseconds is a business problem, or when the heap is large enough that any pause proportional to it is intolerable, and when spare cores and memory can pay for concurrency. JEP 439 is candid that ZGC works "as long as there are sufficient resources" for the collector to reclaim faster than the application allocates. Starve it and you get allocation stalls, a worse failure than a pause because it is unbounded.

The pattern generalizes past Java. Every low-latency collector converts a stop-the-world cost into a distributed per-operation cost, and the question is never whether you pay but where the payment shows up: in a pause your monitoring can see, or in a barrier on every load that it cannot.

## Related Notes

- [[cs/pl/gc-algorithms-mark-sweep-copying-generational|GC Algorithms: Mark-Sweep, Copying, and Generational]] - the theory both collectors implement
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - reachability, roots, and why any of this is sound
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - regions, compaction, and the problem evacuation solves
- [[cs/languages/Java/virtual-threads-and-structured-concurrency|Virtual Threads and Structured Concurrency]] - a feature whose feasibility depends on collector behavior
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - why compaction is worth its copying cost
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - the design space GC sits in, next to ownership and refcounting

## Sources

- "Garbage-First (G1) Garbage Collector," HotSpot Virtual Machine Garbage Collection Tuning Guide, Java SE 21. https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-g1-garbage-collector1.html . Supports the adjective list describing G1, equal-sized regions as the unit of allocation and reclamation, allocation into the young generation, reclamation by evacuation with compaction, the cost model built from previous behavior, the statement that G1 is not a real-time collector, the processor-for-pause-time trade and slightly lower throughput, the definition and handling of humongous objects, and that G1 is the default collector.
- "JEP 439: Generational ZGC," OpenJDK. https://openjdk.org/jeps/439 . Supports the microsecond versus millisecond-to-second pause comparison with G1, heap-size independence of ZGC pauses, the pre-generational behavior of collecting all objects every cycle, the weak generational hypothesis statement, colored pointers with load and store barriers, the 64-bit pointer requirement, the Cassandra benchmark figures, the multi-mapped memory triple-reporting artifact and its removal, colorless pointers on the hardware stack, and the sufficient-resources condition.
