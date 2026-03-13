---
title: Queue
description: FIFO container supporting enqueue/dequeue; designs for arrays (ring buffer) and linked lists with correct empty/full handling.
draft: false
comments: true
tags:
- cs
- dsa
date: 2025-10-16
updated: 2026-01-10
aliases: []

---

## Overview

A **queue** offers **First-In, First-Out (FIFO)** access with two primary operations:

- **`ENQUEUE(x)`**: add `x` to the **tail**.

- **`DEQUEUE()`**: remove and return the **head**.


Correct queues maintain simple invariants: **head** points to the first element (if any), **tail** marks the position where the next element will be inserted (array case) or the last node (linked case), and **size** tracks the number of items. This note presents array-backed **ring buffers** and **linked-list** queues, with robust empty/full checks, resizing options, and patterns for producer–consumer workflows.

> [!note]
> Notation: arrays are 0-indexed; wrap-around uses modulo arithmetic. For linked queues, `Node.next` is `NIL` at the tail.

## Structure Definition

Two widely used representations:

### Array-backed ring buffer (circular queue)

```
struct QueueArray:
    A: array[0..cap-1] of T
    head: integer  // index of current front (0..cap-1)
    tail: integer  // index of next insertion (0..cap-1)
    n: integer     // size, 0 ≤ n ≤ cap
```

- Empty iff `n == 0`.

- Full iff `n == cap`.

- Head element is `A[head]` when `n > 0`.

- Next insert goes at `A[tail]`. After insert/remove, advance index with `i = (i + 1) mod cap`.


### Linked-list queue (singly linked)

```
struct Node: { value: T, next: Node* }
struct QueueList:
    head: Node*   // first element or NIL
    tail: Node*   // last element or NIL (must be NIL when head is NIL)
    n: integer
```

- Empty iff `head == NIL` (and then `tail == NIL`).

- Enqueue appends at `tail.next`; dequeue removes from `head`.


> [!tip]
> Prefer the **ring buffer** for predictable throughput and cache locality. Choose the **linked** queue when capacity is unknown and frequent growth/shrink is expected without copying.

## Core Operations

### Ring buffer `ENQUEUE` / `DEQUEUE` (fixed capacity)

```pseudo
function ENQUEUE(Q, x):
    if Q.n == Q.cap: error "overflow"  // or resize, see below
    Q.A[Q.tail] = x
    Q.tail = (Q.tail + 1) mod Q.cap
    Q.n = Q.n + 1

function DEQUEUE(Q):
    if Q.n == 0: error "underflow"
    x = Q.A[Q.head]
    Q.head = (Q.head + 1) mod Q.cap
    Q.n = Q.n - 1
    return x

function PEEK(Q):
    if Q.n == 0: error "underflow"
    return Q.A[Q.head]
```

**Optional resizing** (amortized `O(1)`):

```pseudo
function ENQUEUE_RESIZING(Q, x):
    if Q.n == Q.cap:
        RESIZE(Q, max(1, 2 * Q.cap))
    ENQUEUE(Q, x)

function RESIZE(Q, new_cap):
    B = new array[new_cap]
    // copy in logical order head..tail
    for i in 0..Q.n-1:
        B[i] = Q.A[(Q.head + i) mod Q.cap]
    Q.A = B
    Q.cap = new_cap
    Q.head = 0
    Q.tail = Q.n
```

### Linked-list `ENQUEUE` / `DEQUEUE`

```pseudo
function ENQUEUE(Q, x):
    node = new Node(x, NIL)
    if Q.tail == NIL:             // empty queue
        Q.head = node
        Q.tail = node
    else:
        Q.tail.next = node
        Q.tail = node
    Q.n = Q.n + 1

function DEQUEUE(Q):
    if Q.head == NIL: error "underflow"
    node = Q.head
    Q.head = node.next
    if Q.head == NIL: Q.tail = NIL
    Q.n = Q.n - 1
    x = node.value
    free(node)                    // or GC
    return x
```

## Example (Stepwise)

**Ring buffer trace (cap = 4)**
Start: `head=0, tail=0, n=0`
`ENQ(9)` → write `A[0]`, `tail=1`, `n=1`
`ENQ(4)` → write `A[1]`, `tail=2`, `n=2`
`DEQ()` → read `A[0]=9`, `head=1`, `n=1`
`ENQ(7)` → write `A[2]`, `tail=3`, `n=2`
`ENQ(1)` → write `A[3]`, `tail=0`, `n=3` (wrap)
`ENQ(5)` → if cap fixed: **overflow**; if resizing: `RESIZE` then place `5`.

**Linked-list trace**
Start empty: `head=tail=NIL`.
`ENQ(2)` → `head=tail=Node(2)`
`ENQ(8)` → `tail=Node(8)`; list `2→8`.
`DEQ()` → returns `2`; `head=Node(8)`; `tail` unchanged unless last removed.
`DEQ()` → returns `8`; both `head,tail=NIL`.

## Complexity and Performance

|Operation|Array (ring)|Linked list|
|---|--:|--:|
|`ENQUEUE`|`O(1)` amortized (with resize), `O(1)` fixed-cap|`O(1)`|
|`DEQUEUE`|`O(1)`|`O(1)`|
|`PEEK`|`O(1)`|`O(1)`|
|Memory|`Θ(cap)` preallocated; good locality|`Θ(n)` nodes + pointer overhead; poorer locality|

- **Array advantages**: sequential memory, fewer allocations, excellent for high-throughput producers/consumers.

- **Linked advantages**: unbounded growth (until memory), no resizing cost, stable pointers to elements (until removal).


> [!note]
> With a ring buffer, prefer **size-based** empty/full detection (`n==0` / `n==cap`) instead of head–tail equality alone; it avoids ambiguous states.

## Implementation Details or Trade-offs

### Empty/full detection

Common patterns:

- **Size counter `n`**: simplest, unambiguous.

- **Reserved slot**: treat queue as full when advancing `tail` would equal `head`; effective capacity becomes `cap−1` (saves maintaining `n`).

- **Tag bit**: store a flip bit that toggles on wrap to disambiguate `head==tail`.


### Resizing strategy (array)

- **Growth factor**: `×2` on overflow; optional **shrink** when `n == cap/4` to avoid memory bloat.

- Copy elements in **logical order** starting at `head` to re-linearize.

- When `T` is large, consider storing **pointers/handles** to avoid costly moves.


### Error handling and APIs

- Expose both **throwing** and **non-throwing** flavors:

    - `DEQUEUE()` raises on empty; `TRY_DEQUEUE()` returns `(ok, value)`.

    - `ENQUEUE()` raises on full (fixed-cap); `TRY_ENQUEUE()` returns boolean.

- Provide `PEEK()`, `EMPTY()`, `SIZE()` for diagnostics and tests.


### Stability and iteration

FIFO implies **arrival order** preserved. If you must iterate, be aware that concurrent enqueues/dequeues can reorder the physical layout (array wrap) though the logical order remains FIFO.

### Cache and prefetch

- Ring buffers benefit from **contiguous** access.

- For heavyweight elements, use **separate buffers** (structure-of-arrays) to minimize copies on `DEQUEUE`.


### Concurrency notes (brief)

- **Single-producer/single-consumer (SPSC)** ring buffers can be implemented **lock-free** with only atomic indices (no ABA risk when each index is monotonic).

- **Multiple-producer/consumer (MPMC)** requires careful synchronization (locks or specialized algorithms).

- When blocking behavior is desired, pair the queue with **condition variables** or semaphores.


> [!tip]
> In SPSC, pad index variables to separate cache lines (avoid **false sharing**). Use relaxed atomics for data slots after publication ordering is guaranteed.

## Practical Use Cases

- **Producer–consumer pipelines**: log ingestion, networking, video frames; backpressure via bounded capacity.

- **Task scheduling**: breadth-first worklists, cooperative schedulers.

- **Graph traversals**: [[breadth-first-search-algorithms|Breadth-First Search Algorithms]] maintain a queue of vertices by discovery order.

- **Rate limiting**: enqueue timestamps/tokens; dequeue to permit actions at controlled pace.

- **Batching**: collect items until size/time threshold, then drain.


## Limitations / Pitfalls

> [!warning]
> **Off-by-one with wrap-around.** Always advance indices with modulo and update in the correct order. A common bug: incrementing `head` or `tail` before reading/writing the slot.

> [!warning]
> **Ambiguous empty/full when tracking only head/tail.** If you don't maintain `n` or a tag bit, `head==tail` can mean either state. Choose one of the disambiguation strategies.

> [!warning]
> **Memory churn (linked).** Allocating/freeing one node per operation stresses the allocator; consider pooling or the array variant for high rates.

> [!warning]
> **Blocking semantics confusion.** Decide if `DEQUEUE` should block or fail fast. Mixing blocking and non-blocking without clear contracts leads to deadlocks or spin-waits.

> [!warning]
> **Iterator invalidation (array).** On resize, internal storage moves; never expose raw pointers into the ring buffer.

## Summary

Queues provide **FIFO** semantics with simple `ENQUEUE`/`DEQUEUE` operations. The **ring buffer** is compact and fast, ideal for steady throughput; the **linked** queue grows flexibly with predictable `O(1)` operations at the ends. Robust implementations clearly define empty/full behavior, handle wrap-around correctly, and choose a resizing or allocation policy appropriate to workload. With these guardrails, queues underpin producer–consumer systems, BFS, schedulers, and numerous buffering tasks.

## Related Notes

- [[queue-using-array|Queue Using Array]]

- [[queue-using-linked-list|Queue Using Linked List]]

- [[circular-queue|Circular Queue]]

- [[breadth-first-search-algorithms|Breadth-First Search Algorithms]]
