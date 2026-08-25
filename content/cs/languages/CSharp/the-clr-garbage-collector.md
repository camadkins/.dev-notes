---
title: "The CLR Garbage Collector"
description: "Generations are a logical view. Segments, thresholds, and an 85,000 byte cutoff are the physical machinery, and every surprising GC behavior comes from the gap between the two."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-28
updated:
aliases: []
---

The theory of generational collection is short enough to fit in a sentence and is covered elsewhere in this garden: most objects die young, so collect the young ones often and the old ones rarely. What is worth studying in the CLR is not that idea but its implementation, because the CLR makes specific commitments about where objects physically live, when a collection is triggered, and which threads run it, and every counterintuitive production symptom traces to one of those commitments rather than to the theory.

> [!note] The idea
> Generations provide a logical view of the GC heap; physically, objects live in managed heap segments. Those two views agree most of the time and diverge in exactly the places that hurt. An object of 85,000 bytes or more lands on a different segment and is collected only with generation 2. Thresholds, not clocks, trigger collections, and they are tuned at run time. Whether the collection pauses your application depends on a mode chosen by configuration rather than by code. Read that way, GC tuning stops being folklore and becomes a question of which physical structure a given allocation pattern is stressing.

## Three generations and one promotion rule

The managed heap is divided into three generations, 0, 1, and 2, so the collector can handle long-lived and short-lived objects separately. New objects go into generation 0. Objects created early in the application lifetime that survive collections are promoted into generations 1 and 2. Because it is faster to compact a portion of the heap than all of it, the collector can release memory in one generation rather than the whole heap each time.

The promotion rule is mechanical. Objects surviving a generation 0 collection are promoted to generation 1; survivors of a generation 1 collection are promoted to generation 2; survivors of a generation 2 collection stay in generation 2 until a later collection finds them unreachable. Collecting a generation means collecting that generation and all younger ones, so a generation 2 collection is also a full collection covering the entire managed heap. Generation 1 exists to be a buffer between short-lived and long-lived objects, and the payoff is that the collector does not have to reexamine generations 1 and 2 on every generation 0 pass. The theory behind those three numbers lives in [[cs/pl/gc-algorithms-mark-sweep-copying-generational|the algorithm note]]; what the CLR adds is the bookkeeping.

Collections are triggered by thresholds. A threshold is a property of a generation, set when the collector allocates objects into it, and exceeding it triggers a collection on that generation. Those thresholds are dynamically tuned as the program runs. When the collector detects a high survival rate in a generation it raises the allocation threshold for that generation, so the next collection reclaims a substantial amount. The runtime is continually balancing two priorities: not letting the working set get too large by delaying collection, and not letting collection run too frequently.

User code can only allocate in generation 0 for small objects or on the large object heap for large ones. Only the collector allocates into generations 1 and 2, and it does so by promoting survivors. That is the sentence to keep: promotion is the only path upward, so anything sitting in generation 2 got there by surviving twice, or by being large.

A collection itself has three phases: a marking phase that finds and lists all live objects, a relocating phase that updates references to objects being compacted, and a compacting phase that reclaims dead space and moves survivors toward the older end of the segment. Liveness starts from stack roots reported by the JIT and stack walker, from GC handles, and from static data. Before a collection starts, all managed threads are suspended except the one that triggered it. The general form of this machinery is [[cs/pl/garbage-collection-concepts|reachability from roots]], and the CLR does not depart from it.

## The 85,000 byte cliff

If an object is greater than or equal to 85,000 bytes in size it is considered a large object, a number the documentation says was determined by performance tuning, and the runtime allocates it on the large object heap. When the CLR loads it allocates two initial segments, one for the small object heap and one for the LOH, and each allocation goes to one or the other by size.

Three consequences follow, and they compound.

Large objects belong to generation 2 because they are collected only during a generation 2 collection. A short-lived 100 KB buffer is, from the collector's point of view, a long-lived object. Worse, because the LOH and generation 2 are collected together, exceeding either threshold triggers a generation 2 collection, so a stream of temporary large buffers can drive full collections of a heap that had no other reason to be collected.

The LOH is swept, not compacted. When a collection runs, the GC traces live objects and compacts them, but because compaction is expensive it sweeps the LOH instead, making a free list out of dead objects that later large allocations reuse, with adjacent dead objects merged into one free object. A free list plus variable-size requests is the classic setup for [[cs/systems/memory-allocators-and-fragmentation|external fragmentation]], and the LOH inherits the whole problem. `GCSettings.LargeObjectHeapCompactionMode` exists to force compaction during the next full blocking collection, and pinning is the documented answer when large objects must not move.

Allocation itself is expensive. The CLR guarantees that memory for every new object is cleared, so the allocation cost of a large object is dominated by clearing it. The documentation does the arithmetic: at two cycles per byte, clearing the smallest large object costs about 170,000 cycles, and clearing a 16 MB object on a 2 GHz machine takes roughly 16 milliseconds. The recommendation that follows is to allocate a pool of large objects and reuse them rather than allocating temporary ones.

> [!tip] The 85,000 number is a design constraint, not trivia
> An array of 21,250 four-byte elements already reaches 85,000 bytes of payload, and a byte array reaches it at 85,000 elements. Buffer sizes chosen just above the line behave categorically differently from buffers chosen just below it, which is the practical reason pooled buffers exist and why [[cs/languages/CSharp/value-types-structs-and-boxing|the layout of what you put in an array]] decides which heap it lands on.

## Who runs the collection

Workstation and server are the two flavors, and the difference is threading. The choice already shows up in the physical layout: the size of the ephemeral segment varies with whether the system is 32-bit or 64-bit and with whether workstation or server GC is running. The more consequential axis, though, is whether the collection stops your threads. In background GC, ephemeral generations 0 and 1 are collected as needed while a generation 2 collection is in progress, it runs on one or more dedicated threads, and it applies only to generation 2 collections. It is enabled by default and controlled by `System.GC.Concurrent` on modern .NET. A collection of the ephemeral generations during a background collection is called a foreground collection, and when a foreground collection occurs all managed threads are suspended. The background thread checks at frequent safe points for a foreground request and suspends itself when it finds one.

The two flavors differ inside this mechanism as well. Background workstation collection uses one dedicated background thread, while background server collection uses multiple, typically one for each logical processor, and unlike the workstation thread the background server threads do not time out. Background GC is the default mode for server garbage collection. [[cs/languages/Java/hotspot-garbage-collectors|HotSpot exposes the same tradeoff]] as a menu of named collectors instead of two flavors and a flag, which makes the choice more visible and the defaults less opinionated.

## Related Notes

- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - reachability, roots, and what a collector is obligated to prove.
- [[cs/pl/gc-algorithms-mark-sweep-copying-generational|GC Algorithms: Mark-Sweep, Copying, and Generational]] - the algorithm family this implementation selects from.
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - what a swept free list costs over time.
- [[cs/languages/Java/hotspot-garbage-collectors|HotSpot Garbage Collectors]] - the same design space, presented as a choice of collectors.
- [[cs/languages/CSharp/value-types-structs-and-boxing|Value Types, Structs, and Boxing]] - the allocations the collector never has to see.
- [[cs/languages/CSharp/unsafe-code-and-the-fixed-statement|Unsafe Code and the fixed Statement]] - what pinning does to a collector that wants to move things.

## Sources

- "Fundamentals of garbage collection," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals . Supports the three-generation division and its rationale, the promotion rules, collecting a generation meaning collecting younger ones, generation 2 as a full collection, the buffer role of generation 1, threshold raising on high survival and the two competing priorities, the marking, relocating, and compacting phases, the stack root, handle, and static data root sets, and the suspension of all managed threads except the triggering one.
- "The large object heap on Windows systems," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/large-object-heap . Supports the 85,000 byte threshold and its performance-tuned origin, the two initial segments, generations as a logical view over physical segments, large objects belonging to generation 2, user code allocating only in generation 0 or the LOH, the sweep and free list behavior with adjacent dead objects merged, the LargeObjectHeapCompactionMode setting and pinning advice, thresholds as dynamically tuned generation properties, the memory-clearing guarantee and the cycle and millisecond figures, and the recommendation to pool large objects.
- "Background garbage collection," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/background-gc . Supports ephemeral collection during a generation 2 collection, background GC running on dedicated threads and applying only to generation 2, its default-enabled status and configuration setting, foreground collections and the suspension of managed threads during them, the safe-point check and self-suspension, the one-thread versus one-per-logical-processor difference between workstation and server, that background server threads do not time out, and background GC as the default mode for server collection.
