---

title: Priority Queue
description: Abstract interface for retrieving the highest-priority element efficiently; commonly implemented with heaps and specialized queues.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-06
aliases: []

---

## Overview

A **priority queue (PQ)** stores items keyed by **priority** and supports fast retrieval of the **highest priority** element (either **min** or **max** depending on convention). The PQ is an _abstract interface_ with multiple concrete implementations. The most common backing is a **binary heap**, but variants such as **d-ary heaps**, **pairing heaps**, **binomial/Fibonacci heaps**, **bucket/radix queues** (for bounded integer keys), and **tree-based** structures (balanced BSTs/B-trees) trade off operation costs and constants.

Typical operations:

- `INSERT(x, key)` - add an item with a given key.

- `FIND_MIN()` / `FIND_MAX()` - peek the top item without removing.

- `EXTRACT_MIN()` / `EXTRACT_MAX()` - remove and return the top.

- `DECREASE_KEY(handle, newKey)` - lower an item's key (min-PQ; dual is `INCREASE_KEY` for max-PQ).

- `MERGE(Q1, Q2)` - optional meld operation for some heaps.


> [!note]
> Many algorithmic guarantees (e.g., Dijkstra, Prim) assume **`DECREASE_KEY`** is available or emulated (the "lazy" approach pushes duplicates and discards stale entries on pop).

## Structure Definition

### Binary Heap (array-based, 0-indexed)

A **binary heap** is a **complete binary tree** embedded in an array `H[0..n-1]` satisfying the **heap-order property** (for a min-heap: `H[i].key ≤ H[left(i)].key` and `H[i].key ≤ H[right(i)].key` whenever children exist).

Indexing (0-based):

- `left(i) = 2*i + 1`

- `right(i) = 2*i + 2`

- `parent(i) = floor((i-1)/2)`


Fields per entry (conceptual):

```
H[i].key     // priority
H[i].value   // payload (optional)
```

The heap shape is always **complete** (filled left-to-right) which enables compact storage and simple **sift-up** / **sift-down** operations.

### Alternative Backings

- **d-ary heap**: node has `d` children; reduces height to `⌈log_d n⌉` (fewer levels) but increases per-level comparisons on `sift_down`. Useful when **`DECREASE_KEY` is frequent** relative to `EXTRACT_MIN` or when cache behavior favors broader nodes.

- **Pairing heap**: a self-adjusting multiway heap with excellent **empirical** `DECREASE_KEY`; simple to implement; good default when you truly need `DECREASE_KEY`.

- **Binomial/Fibonacci heaps**: offer theoretical meld-friendly bounds; **Fibonacci** gives `O(1)` amortized `DECREASE_KEY` and `INSERT`, `O(log n)` `EXTRACT_MIN` - great on paper, large constants in practice.

- **Balanced trees (RB-tree/B-tree)**: support ordered operations and iteration; `O(log n)` for insert/extract; stable iteration order.

- **Bucket/radix queues**: for **small integer priorities** in `[0..C]`, achieve near-`O(1)` ops (e.g., Dial's algorithm), ideal for integer-weight SSSP variants.


## Core Operations

Below are canonical heap-based operations (min-heap).

```pseudo
function INSERT(H, x):
    H.push(x)                         // append at end
    i = H.size - 1
    while i > 0 and H[i].key < H[parent(i)].key:
        swap(H[i], H[parent(i)])
        i = parent(i)

function FIND_MIN(H):
    if H.size == 0: return NIL
    return H[0]

function EXTRACT_MIN(H):
    if H.size == 0: return NIL
    min = H[0]
    H[0] = H.back()
    H.pop()
    heapify_down(H, 0)
    return min

function heapify_down(H, i):
    n = H.size
    while true:
        l = left(i); r = right(i); s = i
        if l < n and H[l].key < H[s].key: s = l
        if r < n and H[r].key < H[s].key: s = r
        if s == i: break
        swap(H[i], H[s])
        i = s

function DECREASE_KEY(H, handle, newKey):
    i = handle.index
    if newKey > H[i].key: error
    H[i].key = newKey
    while i > 0 and H[i].key < H[parent(i)].key:
        swap(H[i], H[parent(i)])
        i = parent(i)
```

> [!tip]
> If your language lacks handles (indexes or pointers into the heap), emulate `DECREASE_KEY` with the **lazy** pattern: push a duplicate entry with the smaller key and mark the old one as stale on extract.

## Example (Stepwise)

**Min-heap inserts of keys**: `7, 3, 10, 1, 5`

1. Insert `7` → `[7]`

2. Insert `3` → `[3, 7]` (sift-up)

3. Insert `10` → `[3, 7, 10]`

4. Insert `1` → `[1, 3, 10, 7]` (bubble above 3, then 7)

5. Insert `5` → `[1, 3, 10, 7, 5]`


`EXTRACT_MIN()`:

- Swap root with last: `[5, 3, 10, 7]`, pop `1`, then `heapify_down` to `[3, 5, 10, 7]`.


## Complexity and Performance

For a **binary heap** (array-based):

- `INSERT`: `O(log n)` worst-case (sift-up).

- `FIND_MIN`: `O(1)`.

- `EXTRACT_MIN`: `O(log n)` (sift-down).

- `DECREASE_KEY`: `O(log n)` (sift-up).

- `BUILD_HEAP(A[0..n-1])`: `O(n)` using bottom-up heapify.


For a **d-ary heap**:

- Height `≈ log_d n`.

- `EXTRACT_MIN`: `O(d log_d n)` (pick min among up to `d` children per level; often `d` is tuned to cache line width).

- `DECREASE_KEY`: `O(log_d n)` (still just rise along parents, one comparison per level).


For **pairing/Fibonacci** heaps:

- Pairing heap: excellent `DECREASE_KEY` **empirically**, but only amortized analyses; `EXTRACT_MIN` ~ `O(log n)` amortized.

- Fibonacci heap: amortized `INSERT, DECREASE_KEY = O(1)`, `EXTRACT_MIN = O(log n)`; best for theory or cases with **heavy** `DECREASE_KEY`.


For **bucket/radix** queues (bounded integer priorities):

- Many ops are **amortized `O(1)`**; total time can be `O(m + C)` for graph algorithms where `C` is max key.


> [!note]
> Real-world performance depends on **memory locality** and constant factors. Binary heaps are hard to beat when you don't need a fast `DECREASE_KEY`.

## Implementation Details or Trade-offs

### Min vs Max and Comparators

- Implement **min-heap** by default; transform to max-heap by **negating keys** or swapping comparator direction.

- Supply a **comparator** (less-than) for custom priorities; ensure it's **strict weak ordering** for correctness.


### Stability (tie-breaking)

PQ retrieval is typically **not stable**. To get stability:

- Store composite keys `(priority, seqno)` where `seqno` increments per insert (the smaller `seqno` wins when priorities tie).


### Handles and `DECREASE_KEY`

- Heaps rearrange items, so a **handle** is needed to find an item's current index quickly. Strategies:

    - Store **index back-pointers** in items.

    - Keep a **map** from IDs to indices; update on swaps.

    - Use **lazy duplicates** if handle maintenance is complex.


### Memory Layout & Cache

- Use a **contiguous vector/array** for heaps to maximize [[cs/systems/memory-hierarchy-and-caching|cache locality]].

- Favor **0-based indexing** (matches typical language arrays and simple arithmetic).

- For d-ary heaps, choose `d` to cohere with **cache lines** (e.g., `d=4` or `8`).


### Decrease-key Alternatives

- **Lazy**: push updated key as a new entry; on pop, skip if the entry is stale. Simpler, often faster with binary heaps.

- **Pairing heap**: choose when algorithm spends most time in `DECREASE_KEY` (e.g., some MST/SSSP workloads).


### Merge (Meldable PQs)

- **Binomial/Fibonacci** and **pairing** heaps support efficient `MERGE(Q1,Q2)`.

- Array heaps don't meld efficiently without rebuilding.


### Integer Keys and Buckets

- When keys are **small nonnegative integers**, **bucket queues** or **radix heaps** can outperform comparison-based heaps (Dial's algorithm, Thorup's SSSP).


### Concurrency

- [[cs/systems/concurrency-primitives|Simple locks]] around heap ops serialize access; for high throughput, consider **work-stealing** or **sharded PQs** with occasional global combine steps.


## Practical Use Cases

- **Graph algorithms**: [[dijkstras-algorithm|Dijkstra's Algorithm]] (needs `DECREASE_KEY` or lazy), [[prims-algorithm|Prim's Algorithm]] (keys = cheapest frontier edges), A* (priority = `g+h`).

- **[[cs/systems/process-scheduling-algorithms|Scheduling]]**: CPU run queues, event-driven simulators, job schedulers (priority/time).

- **Streaming/selection**: maintain top-k (max-heap of size k), order statistics approximations.

- **Rate limiting/throttling**: next-eligible timestamps in a min-PQ.


## Limitations / Pitfalls

> [!warning]
> **No stable order by default.** If two items tie, their return order is unspecified unless you embed a secondary key.

> [!warning]
> **Incorrect `DECREASE_KEY`.** Forgetting to bubble up after lowering a key breaks the heap invariant; tests may silently pass on lucky inputs.

> [!warning]
> **Stale entries (lazy design).** Always check whether the popped entry's key matches the current best in your side table before acting.

> [!warning]
> **Comparator mistakes.** A non-transitive or stateful comparator can corrupt ordering and cause infinite loops or invalid heaps.

> [!warning]
> **Unbounded growth with lazy duplicates.** Periodically purge or cap queue size if the workload creates many updates.

## Summary

A priority queue abstracts **"give me the best next item"** with operations optimized by the chosen backing. **Binary heaps** are compact, cache-friendly, and strong general-purpose defaults; **d-ary** and **pairing** heaps shift trade-offs when `DECREASE_KEY` frequency or cache behavior dominates; **bucket/radix** structures win for bounded integer keys. Robust implementations define a clear comparator, handle ties (optionally with stability), choose a strategy for `DECREASE_KEY` (handles or lazy), and keep memory locality in mind.

## Related Notes

- [[binary-heap|Binary Heap]]

- [[d-ary-heap|D-ary Heap]]

- [[dijkstras-algorithm|Dijkstra's Algorithm]]

- [[prims-algorithm|Prim's Algorithm]]
