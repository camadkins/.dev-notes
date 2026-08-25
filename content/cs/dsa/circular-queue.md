---
title: Circular Queue
description: Fixed-size ring buffer with wrap-around indexing for bounded FIFO; supports constant-time enqueue/dequeue with predictable memory and timing.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-11
aliases: []
---

## Overview

A **circular queue** (ring buffer) is a bounded **FIFO** implemented on a fixed-size array where the **head** and **tail** indices advance **modulo** the capacity. This yields **O(1)** enqueue and dequeue with predictable memory usage and steady cache locality - ideal for embedded systems, [[cs/systems/io-devices-and-drivers|device drivers]], real-time pipelines, and producer–consumer handoffs.

Unlike dynamically growing queues, a circular queue **never reallocates**; instead, it enforces a policy when full: **reject**, **block**, or **overwrite** the oldest element. Correctness hinges on unambiguous full/empty detection, careful boundary handling, and, in concurrent settings, **[[cs/languages/Cpp/the-cpp-memory-model-and-atomics|memory ordering]]** and **single-producer/single-consumer** discipline.

## Structure Definition

- **Storage:** array `Q[0..N-1]`.
- **Indices:** integers `head`, `tail` in `[0, N-1]`.
- **Empty vs full:** common patterns
  - **Reserved slot (capacity `N-1`):**
    - `empty ↔ head == tail`
    - `full  ↔ (tail + 1) % N == head`
    - Simple logic; loses one slot of capacity.
  - **Counted (capacity `N`):** track `size` and treat `head == tail` as *both* empty and full distinguished by `size`. Slightly more bookkeeping.

**Notation:** Arrays are 0-indexed; wrap with `x = (x + 1) % N`.

## Core Operations

Below uses the **reserved-slot** design (capacity `N-1`) because it simplifies full/empty detection and avoids ambiguous `head == tail`.

### Enqueue (No-Overwrite)

```pseudo
function ENQ(Q, head, tail, x):  // returns (ok, head, tail)
    next_tail = (tail + 1) % N
    if next_tail == head:
        return (false, head, tail)     // full
    Q[tail] = x
    tail = next_tail
    return (true, head, tail)
````

### Dequeue

```pseudo
function DEQ(Q, head, tail):  // returns (ok, value, head, tail)
    if head == tail:
        return (false, ⊥, head, tail)  // empty
    x = Q[head]
    head = (head + 1) % N
    return (true, x, head, tail)
```

### Enqueue (Overwrite-Oldest Policy)

When full, drop the **oldest** element by advancing `head`.

```pseudo
function ENQ_OVERWRITE(Q, head, tail, x):  // returns (overwrote, head, tail)
    next_tail = (tail + 1) % N
    overwrote = (next_tail == head)
    if overwrote:
        head = (head + 1) % N            // lose oldest
    Q[tail] = x
    tail = next_tail
    return (overwrote, head, tail)
```

### Peek / Front

```pseudo
function PEEK(Q, head, tail):  // returns (ok, value)
    if head == tail:
        return (false, ⊥)
    return (true, Q[head])
```

### Size (Reserved-Slot)

```pseudo
function SIZE(head, tail):
    if tail >= head:
        return tail - head
    else:
        return N - (head - tail)
```

> [!tip]
> Maintain **reserved-slot** for simpler invariants in latency-sensitive paths. Use **counted** capacity only when the extra slot is essential and the additional logic is acceptable.

## Example (Stepwise)

Let `N = 8`, initial `head = 0`, `tail = 0` (empty). Enqueue `A, B, C, D, E, F, G`:

1. ENQ `A`: `Q[0]=A`, `tail=1`

2. ENQ `B`: `Q[1]=B`, `tail=2`

3. …

4. ENQ `G`: `Q[6]=G`, `tail=7`


Now **size** is 7; since reserved-slot design holds, **full** occurs when `(tail+1)%8 == head` i.e., `7+1 ≡ 0 == head` - true - so the next ENQ without overwrite fails.

- DEQ twice → remove `A` at `0` (`head=1`), `B` at `1` (`head=2`).

- ENQ `H` and `I` → write at `7` (`tail=0` wrap) then at `0` (`tail=1`), maintaining FIFO order with wrap-around.


For **overwrite** mode, if full before ENQ `X`, advancing `head` first discards the oldest and admits `X` with fixed latency.

## Complexity and Performance

|Operation|Time|Space|Notes|
|---|---|---|---|
|Enqueue|O(1)|O(N)|Wrap with modulo; may reject or overwrite when full|
|Dequeue|O(1)|O(N)|Returns oldest|
|Peek|O(1)|O(N)|No mutation|
|Size (calc)|O(1)|O(1)|Formula above; or maintain a counter|
|Memory| - |O(N)|Fixed, cache-friendly array|

- **Predictable latency:** constant-time pointer arithmetic only; excellent for real-time/embedded.

- **Locality:** contiguous storage improves cache hit rate over linked queues.


## Implementation Notes or Trade-offs

### Full/Empty Policy

- **No-overwrite:** preserves all data; producer must block, drop, or signal backpressure on full.

- **Overwrite-oldest:** favors _latest_ data with constant forward progress; common for telemetry streams. Document the policy explicitly.


### Reserved Slot vs Counted

- **Reserved slot (capacity `N-1`):** simplest invariants; faster fast path; one slot lost.

- **Counted (`size` field):** true capacity `N`, but extra reads/writes and more complex concurrency.


### Modulo Arithmetic

- Use `tail = tail + 1; if tail == N: tail = 0` to avoid `%` on hot paths if the compiler/hardware doesn't optimize `%`.

- For power-of-two capacities, `x & (N-1)` is equivalent to `x % N`.


### Concurrency & ISR-Safe Pattern (SPSC)

- **Single Producer / Single Consumer (SPSC)** rings are naturally **lock-free**:

    - **Producer** exclusively updates `tail` and writes `Q[tail]`.

    - **Consumer** exclusively updates `head` and reads `Q[head]`.

    - Use the reserved-slot rule for simple full/empty checks.

    - Insert **store-release** on producer's `tail` update and **load-acquire** on consumer's `tail` read (and vice versa for `head`) to prevent reordering on weakly ordered CPUs.

- **ISR-safe example:** Producer runs in an **[[cs/systems/interrupts-and-traps|interrupt service routine]]**; consumer in the main loop. Ensure head/tail are `volatile` (or atomic) and that critical sections are minimal to meet ISR timing.


### Multi-Producer / Multi-Consumer

- SPSC is straightforward. **MPSC/MCSP/MPMC** require additional synchronization (CAS, tickets, or per-producer slots). Prefer queues designed specifically for MPMC if needed.


### Testing & Verification (Boundary Conditions)

- **Empty:** `head == tail`; `DEQ` returns empty; `PEEK` returns empty.

- **Full:** `(tail + 1) % N == head` (reserved-slot).

- **Wrap-around:** Enqueue to `tail == N-1` then ensure `tail → 0`. Dequeue to `head == N-1` then `head → 0`.

- **Off-by-one:** Fill to **size = N-1**, then verify next ENQ fails (no-overwrite) or overwrites (overwrite mode).

- **Interleaving (SPSC):** Alternate `ENQ`/`DEQ` near boundaries repeatedly.

- **Overwrite policy:** Verify oldest element is discarded and queue remains consistent.

- **Concurrency ordering:** Stress on weakly ordered platforms with memory fences enabled.


> [!tip]
> For traceability, expose a **watermark** (max observed size) and **dropped/overwritten counters** to tune capacity and detect pressure.

## Practical Use Cases

- **Embedded drivers and DSP pipelines:** Capture ISR-produced samples to a main-loop consumer with bounded latency.

- **Telemetry and logging:** Overwrite-oldest rings to prefer the latest observations under bursts.

- **Audio/video buffers:** Steady-rate producers/consumers with small jitter tolerance.

- **Networking and IO queues:** Bounded staging between DMA/interrupt handlers and application threads.


## Limitations / Pitfalls

> [!warning]
> **Ambiguous full/empty without a policy.** If `head == tail` and you don't track `size` or reserve a slot, the state is ambiguous; choose one method and keep it consistent.

> [!warning]
> **Overwrite surprises.** Overwrite-oldest changes semantics: consumers may miss data. Document this behavior, export "overwritten count," and select per-use-case.

> [!warning]
> **Blocking producers.** In no-overwrite mode, decide whether to block, drop, or signal backpressure; otherwise producers may livelock.

> [!warning]
> **Concurrency without fences.** On weakly ordered CPUs, missing acquire/release barriers can reorder head/tail with data, causing stale or torn reads.

## Summary

Circular queues implement a bounded, array-backed FIFO with **wrap-around indices** for **O(1)** operations and predictable performance. The key design choices are **full/empty policy** (no-overwrite vs overwrite-oldest), **reserved-slot vs counted capacity**, and, in concurrent or ISR contexts, **SPSC discipline with proper memory ordering**. With careful boundary handling and a clear policy, ring buffers are robust, cache-friendly building blocks for real-time and systems programming.

## Related Notes

- [[cs/dsa/queue|Queue]]

- [[cs/dsa/queue-using-array|Queue Using Array]]

- [[cs/dsa/circular-linked-list|Circular Linked List]]
