---

title: Queue Using Linked List
description: Singly linked nodes with head/tail pointers for O(1) enqueue/dequeue and stable FIFO semantics.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-05
aliases: []

---

## Overview

A **linked-list queue** implements FIFO with **nodes** connected via `next` pointers and two external references: **`head`** (front) and **`tail`** (last). The key strengths are:

- **Strict `O(1)`** `ENQUEUE` and `DEQUEUE` without shifting/copying elements.

- **Unbounded growth** (limited only by memory).

- **Stable references** to enqueued elements (until removed).


Trade-offs include **extra memory per node**, potential **[[cs/systems/memory-allocators-and-fragmentation|allocator fragmentation]]**, and poorer **cache locality** than array-based rings (see [[cs/dsa/queue-using-array|Queue Using Array]]).

> [!note]
> Representation used below is **singly linked** with a `tail` pointer for `O(1)` appends. A **dummy (sentinel) head** is optional; it simplifies edge cases at the cost of one extra node.

## Structure Definition

```
struct Node { value: T, next: Node* }

struct QueueList {
    head: Node*   // first element or NIL
    tail: Node*   // last element or NIL (must be NIL when head is NIL)
    n:    integer // size (optional but useful for diagnostics)
}
```

**Invariants**

- `n == 0` ⇔ `head == NIL` and `tail == NIL`

- `n > 0` ⇒ `head != NIL` and `tail != NIL` and `tail->next == NIL`

- Following `next` from `head` yields exactly `n` nodes ending at `tail`


> [!tip]
> Keep the **`tail->next == NIL`** invariant sacred. Many subtle bugs arise from forgetting to null the new tail after a dequeue of the last element.

## Core Operations

### Enqueue at tail (append)

```pseudo
function ENQUEUE(Q, x):
    node = new Node(x, NIL)
    if Q.tail == NIL:            // queue is empty
        Q.head = node
        Q.tail = node
    else:
        Q.tail.next = node
        Q.tail = node
    Q.n = Q.n + 1
```

### Dequeue at head (remove front)

```pseudo
function DEQUEUE(Q):
    if Q.head == NIL: error "underflow"
    node = Q.head
    Q.head = node.next
    if Q.head == NIL:            // became empty
        Q.tail = NIL
    Q.n = Q.n - 1
    x = node.value
    free(node)                   // or let GC reclaim
    return x
```

### Peek and emptiness

```pseudo
function PEEK(Q):
    if Q.head == NIL: error "underflow"
    return Q.head.value

function EMPTY(Q):
    return Q.head == NIL
```

## Example (Stepwise)

Start empty: `head=tail=NIL`.

1. `ENQ(7)` → `head=tail=Node(7)`

2. `ENQ(4)` → list `7 → 4`, `tail=4`

3. `DEQ()` → returns `7`, list `4`, `head=tail=4`

4. `DEQ()` → returns `4`, list empty: **set both `head=tail=NIL`**

5. `DEQ()` → **underflow error**


> [!note]
> The **empty → one** and **one → empty** transitions are the only tricky states. Test them specifically.

## Complexity and Performance

|Operation|Cost|Notes|
|---|--:|---|
|`ENQUEUE`|`O(1)`|Append at `tail`|
|`DEQUEUE`|`O(1)`|Remove from `head`|
|`PEEK`|`O(1)`|Read `head.value`|
|Memory|`Θ(n)`|Per-node pointer + allocator metadata|

Performance discussion:

- **Locality**: Nodes are typically scattered on the heap → poorer cache performance than a ring buffer.

- **Allocation cost**: One alloc per enqueue (and free per dequeue) unless using **object pools**.

- **Throughput**: Still predictable `O(1)` ops; allocator behavior can dominate latency tails.


## Implementation Details or Trade-offs

### Sentinel head variant

Using a **dummy head** (`head` always points to a non-data node; first element at `head.next`) removes special cases:

```pseudo
struct QueueList {
    head: Node*  // sentinel (never NIL after init)
    tail: Node*  // either sentinel or last data node
    n: integer
}
```

- Empty iff `head == tail`.

- `ENQUEUE`: append after `tail`.

- `DEQUEUE`: remove `head.next`; if it becomes `NIL`, set `tail=head`.


This yields less branching at the cost of one extra node and a slightly different API surface.

### Size tracking vs traversal

- Maintaining `n` makes `SIZE()` `O(1)` and simplifies capacity checks.

- Omitting `n` avoids one integer update per op but makes `SIZE()` `O(n)`.


### Memory management and fragmentation

- In manual-memory languages, **pool nodes**: pre-allocate blocks or use a free-list to avoid fragmentation and cut allocator overhead.

- In GC languages, fragmentation still affects cache locality; pooling may help for latency-sensitive paths.


### Multi-producer/consumer considerations (brief)

- **Single-threaded**: above ops suffice.

- **SPSC** (single-producer/single-consumer): a linked queue can be made **lock-free** with atomic `next` publication and head/tail moves, but array rings are usually simpler.

- **MPMC**: use a well-tested concurrent queue algorithm (Michael–Scott) or a mutex with clear blocking semantics.


### Error handling and API surface

Offer both throwing and non-throwing forms:

- `DEQUEUE()` vs `TRY_DEQUEUE(&x)` (returns false on empty).

- `PEEK()` vs `TRY_PEEK(&x)`.


### Determinism and iteration

Iteration from `head` to `tail` preserves **arrival order**. Avoid exposing raw node pointers to clients unless ownership is clear.

## Practical Use Cases

- **Unbounded buffering** where input rates may spike unpredictably.

- **[[cs/systems/process-scheduling-algorithms|Task schedulers]]** that attach metadata to tasks stored in nodes (links, timestamps).

- **BFS on massive graphs** that exceed contiguous memory benefits (though [[cs/dsa/queue-using-array|Queue Using Array]] is usually faster).

- **I/O pipelines** where objects must survive list re-links without copying (handles/pointers stored in nodes).


## Limitations / Pitfalls

> [!warning]
> **Forgetting `tail = NIL` on last dequeue.** If the queue becomes empty and `tail` is not nulled, the next enqueue may link from a stale node.

> [!warning]
> **Leaking nodes on errors.** Ensure allocations that fail mid-operation (or exceptions) roll back or free correctly.

> [!warning]
> **Concurrent misuse.** Without synchronization, two producers appending to `tail` can corrupt links. Use locks or a proper concurrent algorithm.

> [!warning]
> **Unbounded memory growth.** A stalled consumer with fast producers will allocate indefinitely. Consider backpressure or a hard cap.

## Implementation Notes or Trade-offs

- **Payload strategy**: Store `T` by value when small; otherwise store pointers/handles in nodes to keep nodes slim.

- **Testing hooks**: Add fuzz tests with alternating `ENQUEUE`/`DEQUEUE` to hammer empty ↔ one ↔ many transitions and random interleavings.

- **Instrumentation**: Track max size and allocation failures for capacity planning.

- **Hybrid approach**: Use a **linked list of fixed-size blocks** to reduce per-element overhead while retaining unbounded growth.


## Summary

A linked-list queue provides **FIFO** with **constant-time** appends/removals via `head`/`tail` pointers. It shines when capacity is unknown or unbounded and when moving/copying elements is undesirable. To build a robust version, rigorously handle the **empty ↔ one** transitions, manage memory (pools or GC), and choose synchronization appropriate to the producer/consumer pattern. For cache-friendly, fixed-capacity pipelines, prefer an array ring; for flexible growth and stable references, the linked queue is the right tool.

## Related Notes

- [[cs/dsa/queue|Queue]]

- [[cs/dsa/queue-using-array|Queue Using Array]]

- [[cs/dsa/linked-list|Linked Lists]]

- [[cs/dsa/circular-queue|Circular Queue]]
