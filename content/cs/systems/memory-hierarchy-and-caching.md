---
title: Memory Hierarchy and Caching
description: Registers to cache to RAM to disk - why storage is layered by speed, how locality makes the layering pay off, and what a cache line, hit, and miss actually are.
draft: false
comments: true
tags:
  - cs
  - systems
  - computer-architecture
  - memory
date: 2026-06-11
updated:
aliases:
  - Memory Hierarchy
  - Cache Line
  - Locality of Reference
---

There is no single kind of memory in a computer, and the reason is economic before it is technical. Fast memory is small and expensive; large memory is cheap and slow. You cannot buy a terabyte of register-speed storage, and you would not want to run a program out of a [[cs/history/magnetic-disk-storage|hard drive]]. So machines stack several kinds of memory into a ladder and try to keep the data you are about to use near the top. That ladder is the memory hierarchy, and caching is the machinery that decides what lives where.

In computer architecture, "the memory hierarchy separates computer storage into a hierarchy based on response time. Since response time, complexity, and capacity are related, the levels may also be distinguished by their performance and controlling technologies."

> [!note] The idea
> The hierarchy only works because programs do not access memory randomly. They reuse the same data and touch neighbors of what they just touched. That regularity, called locality, is what lets a small fast layer near the CPU serve the overwhelming majority of accesses, so the average access time collapses toward the speed of the fast layer even though most of the data lives in the slow one. Without locality the hierarchy would be pointless; with it, a cache a thousand times smaller than main memory can catch most of the traffic.

## The levels

Wikipedia gives four major storage levels:

- **Internal**: "processor registers and cache." Registers hold the operands the CPU is working on this instant; cache holds copies of recently used main-memory data.
- **Main**: "the system RAM and controller cards."
- **On-line mass storage**: secondary storage (an SSD or disk).
- **Off-line bulk storage**: tertiary and off-line storage (archival media).

Each step down is larger, cheaper per byte, and slower. Registers answer in a single cycle; a cache reference in a handful; main memory in a range "which may be tens to hundreds of times slower" than cache; disk slower again by orders of magnitude. Designing for performance "requires considering the restrictions of the memory hierarchy, i.e. the size and capabilities of each component." [[cs/systems/virtual-memory|Virtual memory]] extends the same idea downward, treating RAM as a cache for pages that actually live on disk.

## Why it works: locality

The principle that makes the layering pay is locality of reference, "the tendency of a processor to access the same set of memory locations repetitively over a short period of time." It comes in two flavors:

- **Temporal locality** "refers to the reuse of specific data and/or resources within a relatively small time duration." If you touched an address just now, you will probably touch it again soon (a loop counter, a hot object).
- **Spatial locality** "refers to the use of data elements within relatively close storage locations." If you touched one address, you will probably touch its neighbors (the next element of an array, the next field of a struct). Its special case is sequential locality, walking "the elements in a [[cs/dsa/arrays|one-dimensional array]]."

Temporal locality justifies keeping recently used data in a fast layer. Spatial locality justifies fetching data in blocks rather than one byte at a time, on the bet that the neighbors are coming.

## Cache lines, hits, and misses

A CPU cache is "a hardware cache used by the central processing unit (CPU) of a computer to reduce the average cost (time or energy) to access data from the main memory." It is "a smaller, faster memory, located closer to a processor core, which stores copies of the data from frequently used main memory locations."

The unit of transfer is not a byte, it is a line. "Data is transferred between memory and cache in blocks of fixed size, called cache lines or cache blocks." When a line is copied in, "a cache entry is created. The cache entry will include the copied data as well as the requested memory location (called a tag)." Fetching a whole line at once is spatial locality made physical: you pull in the neighbors on the assumption you will want them. On a typical machine a line is 64 bytes.

Every access then resolves one of two ways. "If the processor finds that the memory location is in the cache, a cache hit has occurred. However, if the processor does not find the memory location in the cache, a cache miss has occurred." The costs diverge sharply: "in the case of a cache hit, the processor immediately reads or writes the data in the cache line," while "for a cache miss, the cache allocates a new entry and copies data from main memory, then the request is fulfilled from the contents of the cache." A hit is a few cycles; a miss pays the full trip to the slower layer.

> [!tip]
> This is why data layout affects speed more than most micro-optimizations. Walking an array in order hits the same cache line 64 bytes at a stretch (spatial locality); chasing pointers scattered across the heap misses on nearly every step. The code can be identical asymptotically and differ by an order of magnitude in wall-clock time, entirely because one respects the hierarchy and the other fights it.

## The through-line

Registers, cache, RAM, and disk are the same trick applied at four scales: put a small fast thing in front of a big slow thing, and rely on locality to make the small fast thing catch most of the requests. Multi-level caches (L1, L2, L3) are that trick nested inside itself, since "higher-level caches" are "organized as a hierarchy of more cache levels." Cache coherence, discussed in [[cs/systems/cache-coherence|its own note]], is the complication that appears once several cores each keep their own copy of the same line.

## Related Notes

- [[cs/systems/virtual-memory|Virtual Memory]] - the same caching idea one level down, with RAM as a cache for pages on disk
- [[cs/systems/cache-coherence|Cache Coherence]] - what breaks when multiple cores cache the same line
- [[cs/systems/context-switching|Context Switching]] - why a cold cache and TLB after a switch is so costly

## Sources

- "Memory hierarchy," Wikipedia. https://en.wikipedia.org/wiki/Memory_hierarchy . Backs the definition of the hierarchy as storage separated by response time, the relation of response time, complexity, and capacity, the four major storage levels (internal registers and cache, main RAM, on-line and off-line mass storage), and that designing for performance requires respecting each level's size and capabilities.
- "Locality of reference," Wikipedia. https://en.wikipedia.org/wiki/Locality_of_reference . Backs the principle of locality and the definitions of temporal locality (reuse within a small time duration) and spatial locality (nearby storage locations, with sequential locality as the array-traversal special case).
- "CPU cache," Wikipedia. https://en.wikipedia.org/wiki/CPU_cache . Backs the cache as a smaller faster memory holding copies of frequently used main-memory data (main memory being tens to hundreds of times slower), the cache line as the fixed-size transfer block with a tag, and the definitions and cost difference of a cache hit versus a cache miss.
