---
title: Queue — Enqueue & Dequeue  
description: Practical mechanics of pushing to and popping from a queue, with invariants, ring-buffer pseudocode, edge cases, and testing notes.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:
# - queue-state-transitions.svg — State machine for a ring-buffer queue showing transitions among {Empty, NonEmpty, Full} on enqueue/dequeue, with size/indices updates.
# - queue-full-vs-empty.svg — Circular buffer Q[0..N-1] with head/tail; illustrate empty (head==tail) and one-slot-reserved full ((tail+1)%N==head) conventions.
---

## Overview

Queues support **FIFO** service: items are inserted at the **rear** (enqueue) and removed from the **front** (dequeue). Getting these two operations correct hinges on **invariants** (empty/full) and consistent updates to **front/rear indices** or **head/tail pointers**, depending on whether the queue is array- or list-backed. This note focuses on the **mechanics**—how to perform enqueue/dequeue safely and efficiently, how to detect boundary conditions, and how to test them.

> [!example]  
> **Diagram (`queue-state-transitions.svg`)** — A three-node diagram with states **Empty**, **NonEmpty**, **Full**. Arcs labeled `enqueue` and `dequeue` show allowed transitions and the guard predicates (e.g., `!Full` for enqueue). Include how `size` changes and when errors are raised.

## Underlying Process

Two mainstream representations deliver O(1) enqueue/dequeue:

1. **Array-backed circular buffer (ring):**
    
    - Storage: `Q[0..N-1]`
        
    - Indices: `head` (front), `tail` (next write position)
        
    - Conventions:
        
        - **Reserved-slot:** capacity is `N-1`; `Empty ⇔ head == tail`; `Full ⇔ (tail+1) % N == head`.
            
        - **With-size:** capacity is `N`; track `size`; `Empty ⇔ size==0`; `Full ⇔ size==N`.
            
2. **Linked queue (singly or doubly linked):**
    
    - Pointers: `first` (front), `last` (rear)
        
    - Enqueue appends a new node at `last`; dequeue removes at `first`.
        
    - Works well for unbounded growth; adds pointer overhead and poorer cache locality.
        

> [!tip]  
> Prefer a **ring buffer** for fixed or predictable capacities (better cache locality, fewer allocations). Use a **linked queue** when the size is unbounded or when maintaining stable node addresses matters.

## Example Execution

**Scenario (ring, reserved-slot, N=8).** Start `head=tail=0` (empty).

1. `enqueue(A)`: write to `Q[0]`, set `tail=1`.
    
2. `enqueue(B)`: write to `Q[1]`, set `tail=2`.
    
3. `dequeue()` → return `Q[0]='A'`, set `head=1`.
    
4. Push until `(tail+1)%8 == head` to become **Full**; the next `enqueue` must error (or trigger growth in a dynamic variant).
    
5. Repeated `dequeue` eventually reaches `head == tail` again (**Empty**).
    

> [!example]  
> **Diagram (`queue-full-vs-empty.svg`)** — A circle of cells with arrows showing `head` and `tail`. Panel A: `head==tail` (empty). Panel B: `(tail+1)%N==head` (full, reserved-slot). Annotate the exact predicates to prevent off-by-one mistakes.

## Performance and Design Trade-offs

- **Time per operation:** O(1) for ring and linked variants (amortized O(1) if a dynamic ring grows by reallocating).
    
- **Space:** Ring pre-allocates `N` (or grows in chunks); linked uses O(n) nodes with pointer overhead.
    
- **Locality:** Rings are cache-friendly; linked queues incur pointer chasing.
    
- **Capacity policy:** Fixed-capacity queues must decide what to do on overflow (reject, block, or overwrite). Dynamic rings can `realloc` and **linearize** contents into a larger buffer.
    

**Blocking vs non-blocking (producer/consumer):**

- **Blocking:** `enqueue` waits when full; `dequeue` waits when empty (requires condition variables or semaphores).
    
- **Non-blocking:** returns an error code immediately; common in single-threaded or polling designs.
    
- **SPSC lock-free rings:** one producer and one consumer can run without locks using atomic index updates and memory fences; MPMC requires more sophisticated algorithms.
    

## Correctness and Reliability Considerations

**Core invariants (ring, reserved-slot):**

- `Empty ⇔ head == tail`
    
- `Full ⇔ (tail + 1) % N == head`
    
- After `enqueue`: `Q[tail] = x; tail = (tail + 1) % N`
    
- After `dequeue`: `x = Q[head]; head = (head + 1) % N`
    

**Core invariants (linked):**

- Empty: `first == null ⇔ last == null`
    
- After `enqueue`: `last.next = node; last = node; if first == null then first = node`
    
- After `dequeue`: return `first.value; first = first.next; if first == null then last = null`
    

> [!warning]  
> **Off-by-one and predicate drift.** Mixing reserved-slot and size-tracking conventions in the same codebase is a common source of bugs. Pick one convention and encode it in helpers (e.g., `is_full()`, `is_empty()`).

> [!warning]  
> **Stale pointers (linked).** After `dequeue`, do **not** read fields of the removed node. If using object pools, clear `next` and optionally poison the node in debug builds to catch misuse.

> [!warning]  
> **Underflow/overflow policy.** Define explicit behavior: throw/return error on underflow/overflow, or block (in concurrent settings). Ambiguity turns into data corruption under load.

## Implementation Notes

### Ring Buffer (Reserved-Slot) Pseudocode

```pseudo
// Invariants:
// empty ⇔ head == tail
// full  ⇔ (tail + 1) % N == head

function ENQUEUE(x):
    next_tail = (tail + 1) % N
    if next_tail == head:
        error "overflow"   // or block, or grow
    Q[tail] = x
    tail = next_tail

function DEQUEUE():
    if head == tail:
        error "underflow"  // or block
    x = Q[head]
    head = (head + 1) % N
    return x
```

**Dynamic growth (optional).** On overflow, allocate a larger array `Q'` (e.g., ×2), copy elements in logical order starting at `head`, then reset `head=0`, `tail=size`.

### Linked Queue Pseudocode

```pseudo
function ENQUEUE(x):
    node = new Node(x)
    node.next = null
    if last != null:
        last.next = node
    else:
        first = node
    last = node

function DEQUEUE():
    if first == null:
        error "underflow"
    x = first.value
    first = first.next
    if first == null: last = null
    return x
```

**Threaded variants.**

- **Blocking:** Guard with a mutex + condition variables `not_full` and `not_empty`.
    
- **SPSC lock-free ring:** Producer updates `tail` after writing; consumer reads `head` first, then updates it after reading. Use **acquire/release** memory order to prevent reordering.
    

### Testing & Harness Outline

A minimal **test harness** should exercise:

- Empty → enqueue → dequeue → empty round-trip.
    
- Fill to **Full**, verify one more `enqueue` fails (or blocks).
    
- Wrap-around sequences that cross `N-1 → 0`.
    
- Alternating `enqueue`/`dequeue` to catch off-by-one errors.
    
- For dynamic queues: multiple growth events with contents preserved in order.
    
- Concurrency (if applicable): producer/consumer stress with randomized timing.
    

```pseudo
test "wrap-around correctness":
    Q = new_ring(8)
    for i in 0..5: ENQUEUE(i)
    for i in 0..3: assert DEQUEUE() == i
    for i in 6..11: ENQUEUE(i)
    // Now force wrap-around; dequeue all and check ascending order
    expected = [3,4,5,6,7,8,9,10,11]
    for v in expected: assert DEQUEUE() == v
    assert is_empty(Q)
```

## Related Concepts

- **Size tracking vs predicates.** Tracking `size` clarifies under/overflow and simplifies telemetry (`length()`), but adds a counter you must keep consistent.
    
- **Back-pressure.** In pipelines, let `enqueue` failure (or blocking) signal downstream congestion.
    
- **Memory reclamation.** For linked queues with high churn, consider node pools or slab allocators to improve locality and reduce allocator contention.
    
- **Non-FIFO needs.** If you must insert/remove at both ends, use a [[cs/dsa/deque|Deque (Double-Ended Queue)]]; for priority by key, use a [[cs/dsa/binary-heap|Binary Heap]]-backed priority queue.
    

## Summary

Enqueue/dequeue correctness rests on **clear invariants** and **consistent updates**. Array-based rings give compact, fast queues; linked queues trade locality for unbounded growth. Decide overflow/underflow behavior up front, encode predicates in helpers, and test **wrap-around** and **boundary** cases aggressively. For concurrent contexts, choose blocking vs non-blocking semantics deliberately and apply the right synchronization or lock-free pattern.

## See also

- [[cs/dsa/queue|Queue]]
    
- [[cs/dsa/circular-queue|Circular Queue]]
    
- [[cs/dsa/deque|Deque (Double-Ended Queue)]]
    
- [[cs/dsa/doubly-linked-list|Doubly Linked List]]