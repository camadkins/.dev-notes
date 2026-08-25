---
title: Deque (Double-Ended Queue)
description: A double-ended queue supporting insertion and removal at both ends; implemented via ring buffers or linked lists for predictable O(1) operations.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-03
aliases: []
---

## Overview
A **deque** (double-ended queue) is a sequence container that supports **insertion** and **removal** at **both the front and the back** in amortized or worst-case **O(1)** time, depending on the implementation. Deques generalize both [[cs/dsa/queue|Queue]] and [[cs/dsa/stack|Stack]]: a queue is a deque that uses only one end for insertion and the other for removal; a stack is a deque that uses the same end for both operations.

Two common implementations dominate:
- **Array-backed ring buffer** (circular array with modular indices) offering compact storage, excellent [[cs/systems/memory-hierarchy-and-caching|cache locality]], and predictable timing.
- **Doubly linked list** offering unbounded growth and stable references to elements, at the cost of extra pointers and poorer locality.

## Structure Definition
A deque provides these primitives on elements `x`:
- `push_front(x)`, `push_back(x)`
- `pop_front() → x`, `pop_back() → x`
- `front() → x`, `back() → x`
- `empty()`, optionally `size()`

**Semantics.** `front()`/`back()` observe, `pop_…` removes and returns. Implementations must define behavior on **underflow** (empty deque) and **overflow** (bounded array variant at capacity).

### Array (Ring Buffer) Layout
- Storage: `A[0..N-1]`
- Indices: integers `head`, `tail` in `[0, N-1]`
- Two capacity conventions:
  - **Reserved slot:** capacity `N-1`; `empty ⇔ head == tail`; `full ⇔ (tail+1)%N == head`.
  - **Counted:** capacity `N`; track `size` to disambiguate `head == tail`.

### Doubly Linked List Layout
- Each node stores `value`, `prev`, `next`.
- Pointers `first`, `last` refer to ends; both `null` when empty.
- Optional sentinel node simplifies corner cases.

> [!tip]
> Favor a **ring buffer** when you know a practical upper bound on size and care about cache locality and constant-time behavior. Use a **doubly linked list** when size can grow without bound or iterators must remain valid across insertions/removals in the middle (if supported).

## Core Operations
Below are minimal, **O(1)** operations for each representation. Arrays use 0-indexed modulo arithmetic.

### Array-Backed Deque (Reserved-Slot Convention)
```pseudo
// invariants:
// empty  ⇔ head == tail
// full   ⇔ (tail + 1) % N == head

function PUSH_BACK(x):
    next_tail = (tail + 1) % N
    if next_tail == head: error "overflow"
    A[tail] = x
    tail = next_tail

function PUSH_FRONT(x):
    new_head = (head - 1 + N) % N
    if tail == new_head: error "overflow"
    head = new_head
    A[head] = x

function POP_FRONT():
    if head == tail: error "underflow"
    x = A[head]
    head = (head + 1) % N
    return x

function POP_BACK():
    if head == tail: error "underflow"
    tail = (tail - 1 + N) % N
    return A[tail]

function FRONT():
    if head == tail: error "underflow"
    return A[head]

function BACK():
    if head == tail: error "underflow"
    return A[(tail - 1 + N) % N]
````

### Doubly Linked List Deque

```pseudo
function PUSH_FRONT(x):
    node = new Node(x)
    node.prev = null
    node.next = first
    if first != null: first.prev = node else last = node
    first = node

function PUSH_BACK(x):
    node = new Node(x)
    node.next = null
    node.prev = last
    if last != null: last.next = node else first = node
    last = node

function POP_FRONT():
    if first == null: error "underflow"
    x = first.value
    first = first.next
    if first != null: first.prev = null else last = null
    return x

function POP_BACK():
    if last == null: error "underflow"
    x = last.value
    last = last.prev
    if last != null: last.next = null else first = null
    return x

function FRONT(): if first == null: error else return first.value
function BACK():  if last == null:  error else return last.value
```

## Example (Stepwise)

Consider an array deque with `N = 8`, initially empty (`head = tail = 0`).

1. `push_back(A)`: write at `tail=0`, advance `tail→1`.

2. `push_back(B)`: write at `1`, `tail→2`.

3. `push_front(Z)`: move `head→7`, write at `7`. Contents (from front to back): `Z, A, B`.

4. `pop_back()`: decrement `tail→1`, returns `B`.

5. `pop_front()`: returns `Z`, `head→0`. Now contents: `A`.


The same sequence on a linked deque adjusts `first`/`last` and a few pointers without modulo arithmetic.

## Complexity and Performance

Let `n` be the number of elements currently stored and `N` the capacity for fixed-size arrays.

- **Time per op (both ends):** `O(1)` worst-case (linked) or `O(1)` amortized/worst-case (array, absent resizing).

- **Space:** Linked: `O(n)` nodes with 2 pointers each. Array: `O(N)` pre-allocated; optional dynamic growth adds temporary reallocation cost.


**Locality & Throughput.**

- Array deques exhibit contiguous memory access patterns, boosting cache performance relative to linked lists.

- Linked deques incur pointer chasing; performance depends on allocator behavior and branch prediction.


**Resizing policy (dynamic arrays).**

- When full, allocate a larger array (often ×2), **linearize** existing elements into the new buffer starting at index 0, and reset `head=0`, `tail=n`. Future ops return to `O(1)`.


## Implementation Details or Trade-offs

**Underflow and overflow.** Decide between exceptions, error codes, or pre-checks. For bounded arrays, overflowing `push_*` must be specified (reject vs overwrite).

**Indexing correctness.** For arrays:

- Use `head = (head - 1 + N) % N` and `tail = (tail + 1) % N` to avoid negative indices.

- Consider replacing `%` with conditional add/sub if `%` is slow and `N` isn't a power of two; or use `& (N-1)` when `N` is a power of two.


**Concurrency.**

- **Single-producer/single-consumer rings** (one end per thread) can be written **lock-free** with [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|acquire/release semantics]] (see [[cs/dsa/circular-queue|Circular Queue]] for memory-ordering notes).

- True multi-producer/multi-consumer deques require locks or specialized designs (e.g., work-stealing deques use split indices and memory fences).


**Iterator stability.**

- Linked deques keep node addresses stable across pushes/pops at ends (unless the referenced node is removed).

- Array deques invalidate raw pointers across **resize**, but offset-based indices remain valid after a stable rebase.


**Middle operations.**

- Classic deques focus on ends. If frequent middle insertions/removals are required, consider a **linked list** or a **gap buffer/rope** depending on workload.


**Memory footprint.**

- Linked: overhead is `2 * pointer_size` per element plus allocator metadata.

- Array: no per-element pointer overhead; peak memory equals capacity.


## Practical Use Cases

- **Sliding window algorithms.** Maintain a window over a stream with `push_back` for arrivals and `pop_front` for expirations. The **monotonic deque** pattern yields `O(n)` solutions for running minimum/maximum in windows.

- **[[cs/systems/process-scheduling-algorithms|Task schedulers]] / event loops.** Support head/tail policies (LIFO for urgent tasks at the front, FIFO at the back).

- **Undo/redo stacks.** Keep recent history at one end while trimming from the other.

- **Parser/token buffers.** Efficient lookahead by pushing tokens to the back and occasionally pushing corrections to the front.


**Worked window-max sketch (monotonic deque).**
Maintain a deque of **indices** whose corresponding values are **non-increasing** from front to back. For each new index `i`:

1. Pop from **back** while `A[i] > A[back]`.

2. Push `i` to back.

3. Pop from **front** if `front_index` is outside the window.

4. The current maximum is at the **front**.


This uses deque operations only and runs in linear time over the sequence.

## Limitations / Pitfalls

> [!warning]
> **Underflow at both ends.** Because two remove operations exist, clients must guard against calling `pop_front`/`pop_back` on an empty deque. Define a consistent error policy.

> [!warning]
> **Off-by-one in ring buffers.** Mismanaging the full/empty tests (`head == tail` vs `(tail+1)%N == head`) causes silent overwrites or false "full" signals. Write these predicates once and reuse them.

> [!warning]
> **Resizing invalidates addresses.** Array-based deques that resize will move storage; don't store raw pointers into elements across operations that may trigger growth.

## Summary

A deque is a versatile, end-efficient container that unifies queue and stack behaviors. **Array-backed** deques provide compact, cache-friendly storage with predictable `O(1)` operations (plus occasional `O(n)` resize), while **doubly linked** deques provide unbounded size and stable node addresses at higher per-element cost. Clear handling of **underflow/overflow**, correct **index arithmetic** (for rings), and a considered concurrency policy make deques reliable building blocks for sliding-window analytics, schedulers, and general-purpose buffering.

## Related Notes

- [[cs/dsa/circular-queue|Circular Queue]]

- [[cs/dsa/doubly-linked-list|Doubly Linked List]]

- [[cs/dsa/queue|Queue]]

- [[cs/dsa/stack|Stack]]
