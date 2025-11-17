---
title: Garbage Collection — Concepts
description: Core principles of automatic memory management, from reachability and tracing to performance trade-offs and tuning.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagram: gc_reachability_flow.svg — visualize root objects, reachable graph nodes, and unreachable (garbage) nodes being reclaimed.
---

## Why Garbage Collection Exists
Manual memory management is error-prone. Forgetting to free memory causes leaks; freeing too early causes crashes.  
Garbage Collection (GC) automates this process by **identifying and reclaiming unreachable objects**, letting programmers focus on logic instead of allocation bookkeeping.

The challenge is efficiency — reclaiming memory fast enough without pausing the program or consuming too much CPU.

> [!note]
> GC doesn’t make memory leaks impossible. It only prevents *unreachable* objects from persisting. If your code keeps a reference around, the collector will never reclaim it.

---

## Reachability vs. Liveness
At the heart of every collector is the distinction between what *can* be reached and what *will* be used.

- **Reachable:** an object is accessible from some root — such as global variables, active stack frames, or registers.  
- **Live:** an object will actually be used again in the future.  

Because *liveness* is undecidable, collectors approximate it through reachability.  
This means GCs are conservative by design — they may keep memory alive longer than strictly necessary, but they never free memory still in use.

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
- Fails with **cycles** — objects referencing each other but unreachable from roots.  
- Adds runtime overhead on every assignment.  
- Requires atomic operations in multithreaded settings.

Python’s CPython runtime uses reference counting with a backup cyclic GC to handle these cases.

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
> Copying and generational collectors improve spatial locality — keeping live objects packed together, reducing cache misses.

---

### 3. Concurrent and Incremental GC
Traditional GCs stop the world during collection, causing noticeable pauses.  
**Concurrent** collectors run alongside the program (“mutator”) using read/write barriers to maintain consistency.  
**Incremental** ones interleave short GC steps between normal program execution.

Common designs include:
- **Stop-the-world mark-sweep** — simple, but long pauses.  
- **Concurrent mark-sweep (CMS)** — Java’s old low-pause collector.  
- **G1, ZGC, Shenandoah** — modern concurrent and region-based designs that minimize latency.

> [!note]
> Barriers add overhead, but predictable pause times often matter more for real-time systems than peak throughput.

---

## Fragmentation and Compaction
When objects are freed individually, gaps form in the heap — **fragmentation**.  
This leads to wasted space and allocation failures even when total free memory is sufficient.

- **Mark-sweep:** prone to fragmentation.  
- **Copying:** naturally compacts the heap.  
- **Compacting mark-sweep:** moves live objects to close gaps, updating all references.

> [!warning]
> Compaction requires *object relocation* — the runtime must track and patch every pointer.  
> Languages like Java and C# handle this transparently through indirect references (“handles” or object headers).

---

## GC Performance Metrics
1. **Throughput** — total program time spent doing useful work vs. GC work.  
2. **Pause time** — how long execution halts for collection.  
3. **Footprint** — memory used, including heap and metadata.  
4. **Allocation rate** — how fast memory is consumed.  

Tuning these requires understanding the trade-off triangle:
> - Low pauses → more CPU overhead  
> - High throughput → longer pauses  
> - Small footprint → more frequent GC cycles

Different applications optimize differently:  
- Latency-sensitive services (trading systems, GUIs) prefer short pauses.  
- Compute-intensive batch jobs prefer throughput.

---

## Diagram Explanation — Reachability Flow
`gc_reachability_flow.svg` should show:
1. **Root set** (registers, globals, stack variables) as top nodes.  
2. Arrows from roots to live objects (highlighted).  
3. Unreachable nodes (faded or gray) identified as garbage.  
4. A “collector sweep” arrow reclaiming those objects.  
This helps visualize *why* GC is safe — only unreachable data is reclaimed.

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

## Beyond Safety — GC and Language Design
Garbage collection influences language semantics:
- Pure functional languages depend on GC for immutability efficiency.  
- Systems languages (Rust, C++) trade GC for manual or ownership-based safety.  
- Hybrid systems (Go, Swift) integrate GC with compiler checks to control latency.

The choice isn’t just about automation — it defines how developers think about **lifetime** and **ownership**.

> [!note]
> GC is one end of a design spectrum; ownership and borrow checking (as in Rust) represent the other.  
> Both aim for safety, but through opposite philosophies: *runtime enforcement* vs. *compile-time reasoning*.

---

## See also
- [[cs/pl/gc-algorithms-mark-sweep-copying-generational|GC Algorithms — Mark-Sweep, Copying, and Generational]]
- [[abstract-machines-cek-secd|Abstract Machines — CEK and SECD]]
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]
