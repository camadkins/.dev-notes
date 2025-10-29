---
title: Stack Using Queue
description: Build a LIFO stack from FIFO queues; contrast two-queue and one-queue rotation strategies and their cost trade-offs.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
# - queue-to-stack-rotation.svg — One-queue method: enqueue x, then rotate by dequeuing and enqueuing size−1 items so x becomes front; illustrates a subsequent pop as a single dequeue.
# - two-queue-swap.svg — Two-queue “costly push”: enqueue to Q2, move all from Q1→Q2, then swap names Q1↔Q2 to maintain invariant “top at front of Q1”.
---

## Overview
A **stack using queue(s)** simulates **LIFO** behavior using only **FIFO** primitives (`enqueue`, `dequeue`, `front/peek`, `empty`, `size`). This construction is useful for reasoning about **data structure equivalence**, practicing **amortized analysis**, and in environments where only queue operations are allowed (e.g., restricted APIs, interview puzzles).

There are two classic approaches:

1. **Two-queue strategy**  
   - *Costly `push`* variant: keep **top at the front** of `Q1` so that `pop` is `O(1)`.  
   - *Costly `pop`* variant: keep items in arrival order; pop drains all but the last to a helper queue.

2. **One-queue rotation strategy**  
   - After `push(x)`, **rotate** the queue so `x` moves to the front. Then `pop` is a single `dequeue`.

> [!note]
> Throughout, assume queues are standard FIFO with `enqueue(x)` at the back and `dequeue()` from the front, each in `O(1)` amortized time for a linked-list or circular-buffer implementation.

## Structure Definition
**State (two-queue version):**
- `Q1`: primary queue that always has the **stack top at its front** (for the costly-`push` variant).
- `Q2`: helper queue used during `push` (or during `pop` in the costly-`pop` variant).

**State (one-queue rotation version):**
- `Q`: a single queue; maintain the invariant that **the most recently pushed element sits at the front** by rotating after every `push`.

## Core Operations
### A) Two-queue, *costly push* (fast pop)
Makes `pop()` and `peek()` `O(1)`.

```pseudo
class StackUsingQueues:
    Q1: Queue
    Q2: Queue

    method push(x):
        Q2.enqueue(x)
        while not Q1.empty():
            Q2.enqueue(Q1.dequeue())
        // swap names so Q1 has the new order
        swap(Q1, Q2)

    method pop() -> T:
        if Q1.empty(): error Underflow
        return Q1.dequeue()

    method peek() -> T:
        if Q1.empty(): error Underflow
        return Q1.front()

    method empty() -> bool:
        return Q1.empty()
````

**Cost:** `push` takes `Θ(n)` (moves all elements); `pop`/`peek` are `Θ(1)`.

### B) Two-queue, _costly pop_ (fast push)

Keeps `push` cheap; `pop` moves `n−1` items.

```pseudo
class StackUsingQueues:
    Q1: Queue
    Q2: Queue

    method push(x):
        Q1.enqueue(x)            // O(1)

    method pop() -> T:
        if Q1.empty(): error Underflow
        while Q1.size() > 1:
            Q2.enqueue(Q1.dequeue())
        x = Q1.dequeue()         // last remaining is the top
        swap(Q1, Q2)             // Q1 becomes the new primary
        return x

    method peek() -> T:
        if Q1.empty(): error Underflow
        while Q1.size() > 1:
            Q2.enqueue(Q1.dequeue())
        x = Q1.front()           // look at last
        Q2.enqueue(Q1.dequeue()) // move it too
        swap(Q1, Q2)
        return x

    method empty() -> bool:
        return Q1.empty()
```

**Cost:** `push` is `Θ(1)`; `pop`/`peek` are `Θ(n)`.

### C) One-queue rotation (balanced; fast pop)

Rotate after each `push` so top becomes front.

```pseudo
class StackUsingOneQueue:
    Q: Queue

    method push(x):
        Q.enqueue(x)
        // rotate size-1 elements so x moves to the front
        k = Q.size() - 1
        for i in 1..k:
            Q.enqueue(Q.dequeue())

    method pop() -> T:
        if Q.empty(): error Underflow
        return Q.dequeue()      // top at front

    method peek() -> T:
        if Q.empty(): error Underflow
        return Q.front()

    method empty() -> bool:
        return Q.empty()
```

**Cost:** `push` is `Θ(n)` due to the rotation; `pop`/`peek` are `Θ(1)`. This mirrors the costly-`push` two-queue variant but needs only one queue.

> [!example]  
> **Diagram (`queue-to-stack-rotation.svg`)** — Enqueue `x`, then show a loop that repeatedly dequeues the old front and enqueues to the back until `x` sits at the front; a subsequent `pop` is one `dequeue`.

## Example (Stepwise)

Consider the **one-queue rotation** with operations: `push(1), push(2), push(3), pop(), push(4), peek()`.

1. `push(1)`: `Q=[1]` (rotate 0). Top=1 at front.
    
2. `push(2)`: enqueue `2` → `[1,2]`; rotate `size−1=1` → dequeue `1`, enqueue `1` → `[2,1]`. Top=2 at front.
    
3. `push(3)`: enqueue `3` → `[2,1,3]`; rotate 2 → `[3,2,1]`. Top=3.
    
4. `pop()` → dequeue front → returns `3`; `Q=[2,1]`. Top=2.
    
5. `push(4)`: enqueue `4` → `[2,1,4]`; rotate 2 → `[4,2,1]`. Top=4.
    
6. `peek()` → `front()` returns `4`.
    

> [!note]  
> The invariant “**top at front**” keeps `pop` and `peek` trivial. The rotation amortizes the reordering cost into `push`.

## Complexity and Performance

Let `n` be the number of elements at the moment of the operation.

|Strategy|`push`|`pop`|`peek`|Extra Space|
|---|--:|--:|--:|--:|
|Two-queue (costly push)|Θ(n)|Θ(1)|Θ(1)|O(n) across two queues|
|Two-queue (costly pop)|Θ(1)|Θ(n)|Θ(n)|O(n) across two queues|
|One-queue rotation|Θ(n)|Θ(1)|Θ(1)|O(n) in one queue|

- **Amortization:** If your workload is pop-heavy (many pops per push), prefer the **costly-push** variants. If push-heavy, the **costly-pop** variant can win.
    
- **Space:** All variants store the elements once (`Θ(n)` total) plus queue metadata. Two-queue methods temporarily hold elements in both structures during transfers but keep overall `Θ(n)` capacity.
    

> [!tip]  
> On bounded-capacity queues, check before transfers to avoid overflow during the **move/rotate** phases.

## Implementation Details or Trade-offs

- **Queue choice:** Use a **linked queue** or **circular buffer** with `O(1)` operations. Ensure `size()` is `O(1)` if you rely on it for rotation counts.
    
- **Error semantics:** Define **underflow** for `pop/peek` on empty. Prefer returning status + out-param in C-like APIs or throwing domain-specific exceptions in higher-level languages.
    
- **Performance profile:**
    
    - **One-queue** minimizes bookkeeping (no swaps) but performs `size−1` moves on each `push`.
        
    - **Two-queue** versions add a `swap(Q1,Q2)` step to keep invariants clean and code straightforward.
        
- **Stability of references:** These implementations **do not** provide stable references to elements (queue nodes may move/rotate). If stability is required, use [[cs/dsa/stack-using-linked-list|Stack Using Linked List]].
    
- **Cache behavior:** Circular-buffer queues are generally more cache-friendly than linked queues due to contiguous memory.
    
- **Concurrency:** None of these are thread-safe without synchronization. Wrap with a mutex or use lock-free queues carefully (ABA hazards).
    

> [!warning]  
> **Cost blow-up surprises.** It’s easy to flip the invariant and accidentally make **both** `push` and `pop` expensive. Assert post-conditions (e.g., “top at front of `Q1`”) after each operation in tests.

## Practical Use Cases

- **Educational settings:** Demonstrates how to **compose** data structures and reason about **invariants** and **amortized costs**.
    
- **API constraints:** When only FIFO primitives are available, but LIFO behavior is required in a bounded scope.
    
- **Verification exercises:** Good target for unit tests that validate underflow behavior, rotation counts, and equivalence with a reference stack.
    

> [!example]  
> **Diagram (`two-queue-swap.svg`)** — Costly-push method: enqueue new element into `Q2`, drain `Q1` into `Q2`, then swap names so `Q1.front()` is the new top.

## Limitations / Pitfalls

> [!warning]  
> **Throughput vs simplicity.** A native stack (array or linked) beats these constructions in constant factors and locality. Use the queue-based stack only when constrained or for pedagogy.

> [!warning]  
> **Large elements.** Rotations/dequeues copy or move elements repeatedly; if payloads are large, store **handles** (indices/pointers) instead of full objects.

> [!warning]  
> **Capacity hysteresis.** If the underlying queue grows/shrinks dynamically, frequent rotations can trigger **resize thrash**. Prefer geometric growth with hysteresis.

## Summary

A stack can be implemented with queues by enforcing the invariant that the **most recently pushed element sits at the front**. The **two-queue** approach offers a choice between **costly `push`** (fast `pop`) and **costly `pop`** (fast `push`), while the **one-queue rotation** achieves the same effect with a single queue by rotating after each push. All variants are correct; choose based on your operation mix and simplicity needs, keeping an eye on data movement and queue performance characteristics.

## See also

- [[cs/dsa/stack|Stack]]
    
- [[cs/dsa/queue|Queue]]
    
- [[cs/dsa/stack-using-array|Stack Using Array]]
    
- [[cs/dsa/stack-using-linked-list|Stack Using Linked List]]