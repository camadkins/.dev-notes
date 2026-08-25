---
title: "Garbage Collection: Concepts"
description: Core principles of automatic memory management, from reachability and tracing to performance trade-offs and tuning.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
---

## Why Garbage Collection Exists
Manual memory management is error-prone. Forgetting to free memory causes leaks; freeing too early causes crashes.  
Garbage Collection (GC) automates this process by **identifying and reclaiming unreachable objects**, letting programmers focus on logic instead of allocation bookkeeping.

The challenge is efficiency: reclaiming memory fast enough without pausing the program or consuming too much CPU.

> [!note]
> GC doesn’t make memory leaks impossible. It only prevents *unreachable* objects from persisting. If your code keeps a reference around, the collector will never reclaim it.

---

## Reachability vs. Liveness
At the heart of every collector is the distinction between what *can* be reached and what *will* be used.

- **Reachable:** an object is accessible from some root, such as global variables, active stack frames, or registers.  
- **Live:** an object will actually be used again in the future.  

Because *liveness* is undecidable, collectors approximate it through reachability.  
This means GCs are conservative by design. They may keep memory alive longer than strictly necessary, but they never free memory still in use.

> [!example]
> In Java or C#, the “roots” are thread stacks, static fields, and CPU registers.  
> Any object reachable from these is considered alive.  
> Everything else is garbage and eligible for collection.

---

## Major GC Strategies

### 1. Reference Counting
Each object stores a counter of how many references point to it.
- When a reference is created, increment the counter.  
- When a reference is destroyed, decrement it.  
- When it hits zero, free the object immediately.

**Pros:**  
- Simple and predictable (deallocation happens instantly).  
- Works well for acyclic structures.  

**Cons:**  
- Fails with **cycles**: objects referencing each other but unreachable from roots.  
- Adds runtime overhead on every assignment.  
- Requires atomic operations in multithreaded settings.

Python’s CPython runtime uses [[cs/languages/Python/cpython-object-model-and-reference-counting|reference counting with a backup cyclic GC]] to handle these cases.

---

### 2. Tracing Collectors
Instead of tracking counts, tracing collectors start from roots and **walk the object graph**.

**Mark-and-Sweep**
1. **Mark:** traverse from roots and mark everything reachable.  
2. **Sweep:** iterate over heap and reclaim unmarked objects.  

**Copying Collector**
- Divide the heap into two spaces: *from-space* and *to-space*.  
- Copy live objects into the new region, compacting them together and discarding the rest.

**Generational GC**
- Observes that most objects die young.  
- New allocations go in a *young generation* that’s collected frequently.  
- Older, long-lived objects move to the *old generation*, collected less often.

> [!tip]
> Copying and generational collectors improve spatial locality, keeping live objects packed together, reducing cache misses.

---

### 3. Concurrent and Incremental GC
Traditional GCs stop the world during collection, causing noticeable pauses.  
**Concurrent** collectors run alongside the program (the “mutator”) using read/write barriers to maintain consistency.  
**Incremental** ones interleave short GC steps between normal program execution.

Common designs include:
- **Stop-the-world mark-sweep:** simple, but long pauses.  
- **[[cs/languages/Java/hotspot-garbage-collectors|Concurrent mark-sweep (CMS)]]:** Java’s old low-pause collector.  
- **G1, ZGC, Shenandoah:** modern concurrent and region-based designs that minimize latency.

> [!note]
> Barriers add overhead, but predictable pause times often matter more for real-time systems than peak throughput.

---

## Fragmentation and Compaction
When objects are freed individually, gaps form in the heap, called **fragmentation**.  
This leads to wasted space and allocation failures even when total free memory is sufficient.

- **Mark-sweep:** prone to fragmentation.  
- **Copying:** naturally compacts the heap.  
- **Compacting mark-sweep:** moves live objects to close gaps, updating all references.

> [!warning]
> Compaction requires *object relocation*: the runtime must track and patch every pointer.  
> Languages like Java and C# handle this transparently through indirect references (“handles” or object headers).

---

## GC Performance Metrics
1. **Throughput:** total program time spent doing useful work vs. GC work.  
2. **Pause time:** how long execution halts for collection.  
3. **Footprint:** memory used, including heap and metadata.  
4. **Allocation rate:** how fast memory is consumed.  

Tuning these requires understanding the trade-off triangle:
> - Low pauses → more CPU overhead  
> - High throughput → longer pauses  
> - Small footprint → more frequent GC cycles

Different applications optimize differently:  
- Latency-sensitive services (trading systems, GUIs) prefer short pauses.  
- Compute-intensive batch jobs prefer throughput.

---

![Root set → live objects → unreachable garbage swept](cs/pl/assets/gc-reachability.svg)

---

## Tuning Levers and Trade-Offs
Collectors expose many configuration knobs:

| Lever | Effect |
|--------|--------|
| **Heap size** | Larger heaps reduce GC frequency but increase pause length. |
| **Survivor ratios / tenuring thresholds** | Control promotion between young/old generations. |
| **Parallelism** | More GC threads reduce pause time but consume CPU. |
| **Write barriers** | Maintain object graph consistency during concurrent marking. |

The ideal configuration depends on workload: short-lived object churn favors small, frequent GCs; long-lived heaps favor larger, incremental cycles.

> [!tip]
> Profiling tools like JVM GC logs or .NET PerfView are invaluable. Don’t guess; measure.

---

## Beyond Safety: GC and Language Design
Garbage collection influences language semantics:
- Pure functional languages depend on GC for immutability efficiency.  
- Systems languages (Rust, C++) trade GC for manual or [[cs/languages/common/memory-ownership-refcounting-gc|ownership-based safety]].  
- Hybrid systems (Go, Swift) integrate GC with compiler checks to control latency.

The choice isn’t just about automation; it defines how developers think about **lifetime** and **ownership**.

> [!note]
> GC is one end of a design spectrum; ownership and borrow checking (as in Rust) represent the other.  
> Both aim for safety, but through opposite philosophies: *runtime enforcement* vs. *compile-time reasoning*.

---

## See also
- [[cs/pl/gc-algorithms-mark-sweep-copying-generational|GC Algorithms: Mark-Sweep, Copying, and Generational]]
- [[cs/pl/abstract-machines-cek-secd|Abstract Machines: CEK and SECD]]
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus: Syntax & Substitution]]

## Sources

- "Garbage collection (computer science)," Wikipedia. https://en.wikipedia.org/wiki/Garbage_collection_%28computer_science%29 . Supports garbage collection as automatic memory management that reclaims memory no longer referenced, invented by John McCarthy around 1959 for Lisp, the contrast with manual management in C and C++, and that GC may consume a significant share of processing time.
- "Tracing garbage collection," Wikipedia. https://en.wikipedia.org/wiki/Tracing_garbage_collection . Supports tracing collectors determining liveness by reachability from root objects, the distinction between syntactic and semantic garbage, and that precisely identifying semantic garbage is undecidable (the basis for conservative reachability approximation).
- "Reference counting," Wikipedia. https://en.wikipedia.org/wiki/Reference_counting . Supports reference counting storing the number of references to an object, immediate reclamation when the count reaches zero, predictable lifetimes without long pauses, and its inability to reclaim reference cycles.
