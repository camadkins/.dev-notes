---

title: Queue Using Array  
description: Circular buffer (ring) with head/tail indices, wrap-around, and unambiguous empty/full handling.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - queue-ring-buffer-indexing.svg — Circular array with head/tail arrows, size n, and modulo wrap-around; highlights the reserved-slot vs size-counter designs.

# - ring-buffer-wrap-sequence.svg — Stepwise load→wrap→unload timeline showing how indices advance and how logical order differs from physical layout.

---

## Overview

An **array-backed queue** implements FIFO with a **circular buffer** (ring) to reuse storage as elements are enqueued/dequeued. Two indices—**head** (front) and **tail** (next insert position)—advance **modulo capacity**, yielding `O(1)` operations and excellent cache locality. The core design choice is how to **distinguish empty from full** when `head == tail`.

> [!note]  
> Use a **size counter** `n`, a **reserved slot** (capacity effectively `cap−1`), or a **tag bit** to disambiguate empty/full states. Pick one policy and stick to it across the codebase.

## Structure Definition

We present the **size-counter** version (unambiguous, easy to reason about) and note the **reserved-slot** alternative.

```
struct QueueArray:
    A: array[0..cap-1] of T
    head: integer  // index of current front (0..cap-1)
    tail: integer  // index of next insertion (0..cap-1)
    n:    integer  // current size, 0 ≤ n ≤ cap
    cap:  integer  // capacity (#slots in A)
```

- **Empty** iff `n == 0`; **Full** iff `n == cap`.
    
- **Front** element is `A[head]` when `n > 0`.
    
- Next insert goes to `A[tail]`. Advance an index with `i = (i + 1) mod cap`.
    

**Reserved-slot alternative (no `n`)**

- Treat queue as **full when advancing `tail` would equal `head`**. Effective capacity is `cap−1`.
    
- Empty iff `head == tail`; full iff `(tail + 1) mod cap == head`.
    

> [!tip]  
> For teaching and debugging, prefer the **size-counter** form. For lock-free SPSC rings, the **reserved-slot** or a **tag bit** often simplifies atomics.

## Core Operations

Below, a **fixed-capacity** ring; a resizing variant follows.

```pseudo
function ENQUEUE(Q, x):
    if Q.n == Q.cap: error "overflow"
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

**Resizing (amortized `O(1)`)**

```pseudo
function ENQUEUE_RESIZING(Q, x):
    if Q.n == Q.cap:
        RESIZE(Q, max(1, 2 * Q.cap))
    ENQUEUE(Q, x)

function RESIZE(Q, new_cap):
    B = new array[new_cap]
    // copy in logical order head..head+n-1
    for i in 0..Q.n-1:
        B[i] = Q.A[(Q.head + i) mod Q.cap]
    Q.A = B
    Q.cap = new_cap
    Q.head = 0
    Q.tail = Q.n
```

> [!warning]  
> **Update order matters.** On `ENQUEUE`, write `A[tail]` **before** advancing `tail`. On `DEQUEUE`, read `A[head]` **before** advancing `head`. Reversing these causes elusive off-by-one bugs.

## Example (Stepwise)

Assume `cap=5`, start with `head=tail=0`, `n=0`.

1. `ENQ(9)` → write `A[0]`, `tail=1`, `n=1`.
    
2. `ENQ(4)` → write `A[1]`, `tail=2`, `n=2`.
    
3. `DEQ()` → read `A[0]=9`, `head=1`, `n=1`.
    
4. `ENQ(7)` → write `A[2]`, `tail=3`, `n=2`.
    
5. `ENQ(1)` → write `A[3]`, `tail=4`, `n=3`.
    
6. `ENQ(5)` → write `A[4]`, `tail=0` (wrap), `n=4`.
    
7. `ENQ(6)` → if fixed-capacity, **overflow** (`n==cap`). If resizing, call `RESIZE` and append.
    

> [!example]  
> **Diagram (`ring-buffer-wrap-sequence.svg`)** — A timeline showing the logical order (`head..head+n-1`), while physical indices wrap around (`tail` moving to 0 after reaching `cap-1`).

## Complexity and Performance

- `ENQUEUE`, `DEQUEUE`, `PEEK`: **`O(1)`** time.
    
- Memory: `Θ(cap)` contiguous storage; excellent **cache locality** compared to node-based queues.
    
- With resizing and geometric growth (×2), amortized `O(1)` enqueue; at resize, a single `O(n)` copy re-linearizes the buffer.
    

**Throughput notes**

- Contiguous writes/reads give predictable performance under producer–consumer workloads.
    
- For large element types, store **pointers/handles** to avoid costly moves on resize.
    

## Implementation Details or Trade-offs

### Empty/Full Disambiguation

Pick one of:

- **Size counter `n`** — simplest runtime checks (`n==0` / `n==cap`).
    
- **Reserved slot** — `cap−1` usable slots, no `n`; full when `(tail+1) % cap == head`.
    
- **Tag/epoch bit** — advance a bit on wrap to distinguish `head==tail` states (useful for lock-free rings).
    

### Fixed vs Resizing

- **Fixed**: deterministic memory, no pause for copies; ideal for embedded or real-time constraints.
    
- **Resizing**: convenient for general apps; include **shrink** when `n == cap/4` to reduce memory, with hysteresis to avoid thrash.
    

### API Design

Provide both throwing and non-throwing forms:

- `DEQUEUE()` / `TRY_DEQUEUE(&x)`
    
- `ENQUEUE(x)` / `TRY_ENQUEUE(x)`  
    Add `PEEK()`, `SIZE()`, `EMPTY()`, `CAPACITY()` for diagnostics.
    

### Erasing/clearing slots

- In GC languages, optionally set `A[old_head] = null` on `DEQUEUE` to break references.
    
- In systems languages, leaving stale bytes is fine—treat `n` as the boundary; a debug build can scrub for safety.
    

### Iteration

Iterate **logically** from `i=0..n-1` using `A[(head+i) % cap]`. Exposing raw pointers into `A` is brittle—**resizes** can relocate storage.

### Concurrency (brief)

- **SPSC (single-producer/single-consumer)**: can be **lock-free** using atomic head/tail indices and careful memory ordering. Reserve a slot or use a tag bit to avoid ambiguity.
    
- **MPMC**: requires locks or specialized algorithms; ring buffers exist but are complex—consider concurrent queues designed for MPMC.
    

> [!tip]  
> In SPSC, pad `head` and `tail` to separate cache lines to avoid **false sharing**.

## Practical Use Cases

- **Producer–consumer pipelines** (log ingestion, media frames).
    
- **Networking**: packet buffers, completion queues.
    
- **Graph traversal**: worklists for [[cs/dsa/breadth-first-search-algorithms|Breadth-First Search Algorithms]].
    
- **Scheduling**: round-robin ready queues, timers (paired with a priority structure for expirations).
    

## Limitations / Pitfalls

> [!warning]  
> **Ambiguous states** if you skip `n` and don’t reserve a slot: `head==tail` cannot tell full from empty. Choose **one** strategy and document it.

> [!warning]  
> **Modulo mistakes.** Always wrap with `index = (index + 1) mod cap`. Off-by-one at wrap produces silent data corruption.

> [!warning]  
> **Resize copy order.** Copy in **logical** order starting at `head`; copying `A[0..n-1]` blindly will scramble element order after wrap.

> [!warning]  
> **Allocator churn (linked queues).** If you switch to a linked queue for unbounded growth, expect higher allocation overhead and poorer locality; pick based on workload.

## Summary

An array-based **circular queue** provides fast, predictable FIFO with two indices and modulo arithmetic. Decide on an **empty/full rule** (size counter, reserved slot, or tag) and enforce it consistently. With careful update order, logical-order copies during resize, and optional non-throwing APIs, the ring buffer is a robust default for queues in systems and application code alike.

## See also

- [[cs/dsa/queue|Queue]]
    
- [[cs/dsa/circular-queue|Circular Queue]]
    
- [[cs/dsa/queue-using-linked-list|Queue Using Linked List]]
    
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]