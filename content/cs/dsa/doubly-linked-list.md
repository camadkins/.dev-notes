---
title: Doubly Linked List
description: A bidirectional linked structure with constant-time insertion and deletion given a node reference; trades extra pointers and memory overhead for O(1) local updates and two-way iteration.
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

A **doubly linked list** stores elements in nodes that each carry two pointers: `prev` to the predecessor and `next` to the successor. This design enables **O(1)** insertion and deletion given a **node reference**, and supports **bidirectional iteration** without random access. The cost is higher memory per node and more delicate pointer maintenance compared to a singly linked list. Doubly linked lists are common in **LRU caches**, **deques**, and anywhere that needs constant-time splicing given a handle to a node, contrasting with array-based structures that favor indexed access and cache locality.

## Structure Definition

Each **node** holds:

- `value` - the stored element

- `prev` - pointer to previous node (or `null`/sentinel)

- `next` - pointer to next node (or `null`/sentinel)


A list exposes:

- `head`, `tail` pointers (null when empty) **or** a single **sentinel** node `S` where `S.next` is the first and `S.prev` is the last (with `S.next == S.prev == S` when empty).


**Invariants (null-terminated variant).**

- `head == null ⇔ tail == null` (empty)

- `head.prev == null`, `tail.next == null`

- For any interior node `X`: `X.prev.next == X` and `X.next.prev == X`


**Invariants (sentinel variant).**

- `S.next.prev == S` and `S.prev.next == S`

- Empty: `S.next == S.prev == S`

- No null checks needed in core operations; branch count is reduced


> [!tip]
> Prefer a **sentinel (dummy) node** for production implementations. It **eliminates special-cases** at the ends (empty/singleton) and turns many `if` branches into straight-line rewires.

## Core Operations

Below, operations are expressed twice when behavior differs meaningfully between variants. All run in **O(1)** given a node handle.

### Create / Initialize

```pseudo
function CREATE_EMPTY_NULL():
    head = null
    tail = null

function CREATE_EMPTY_SENTINEL():
    S = new Node(⊥)
    S.prev = S
    S.next = S
    return S
```

### Insert at Front / Back

```pseudo
// null-terminated
function PUSH_FRONT(x):
    node = new Node(x)
    node.prev = null
    node.next = head
    if head != null: head.prev = node else tail = node
    head = node

function PUSH_BACK(x):
    node = new Node(x)
    node.next = null
    node.prev = tail
    if tail != null: tail.next = node else head = node
    tail = node
```

```pseudo
// sentinel-based (S is the sentinel)
function INSERT_AFTER(S, x): // push_front: insert after S
    node = new Node(x)
    node.prev = S
    node.next = S.next
    S.next.prev = node
    S.next = node

function INSERT_BEFORE(S, x): // push_back: insert before S
    node = new Node(x)
    node.next = S
    node.prev = S.prev
    S.prev.next = node
    S.prev = node
```

### Insert After / Before a Given Node

```pseudo
function INSERT_AFTER(node, x):
    y = new Node(x)
    y.prev = node
    y.next = node.next
    if node.next != null: node.next.prev = y else tail = y
    node.next = y

function INSERT_BEFORE(node, x):
    y = new Node(x)
    y.next = node
    y.prev = node.prev
    if node.prev != null: node.prev.next = y else head = y
    node.prev = y
```

### Delete a Node (Given a Handle)

```pseudo
function DELETE(node):
    if node.prev != null: node.prev.next = node.next else head = node.next
    if node.next != null: node.next.prev = node.prev else tail = node.prev
    free(node)
```

```pseudo
// sentinel-based
function DELETE(node):
    node.prev.next = node.next
    node.next.prev = node.prev
    free(node)
```

### Pop Front / Pop Back

```pseudo
function POP_FRONT():
    if head == null: error "underflow"
    x = head.value
    head = head.next
    if head != null: head.prev = null else tail = null
    return x

function POP_BACK():
    if tail == null: error "underflow"
    x = tail.value
    tail = tail.prev
    if tail != null: tail.next = null else head = null
    return x
```

### Iterate Forward / Backward

```pseudo
function FOR_EACH_FORWARD():
    u = head
    while u != null:
        PROCESS(u.value)
        u = u.next

function FOR_EACH_BACKWARD():
    u = tail
    while u != null:
        PROCESS(u.value)
        u = u.prev
```

## Example (Stepwise)

**Goal:** Build `A ⇄ B ⇄ C`, then insert `X` after `B`, then delete `B`.

1. **Start empty (null-terminated)**: `head=null`, `tail=null`.

2. `PUSH_BACK(A)` → `head=tail=A`.

3. `PUSH_BACK(B)` → wire `A.next=B`, `B.prev=A`, update `tail=B`.

4. `PUSH_BACK(C)` → wire `B.next=C`, `C.prev=B`, update `tail=C`. Now `A ⇄ B ⇄ C`.

5. **Insert-after `B`:** create `X`; set `X.prev=B`, `X.next=C`; set `C.prev=X`, `B.next=X`. Now `A ⇄ B ⇄ X ⇄ C`.

6. **Delete `B`:** set `B.prev=A`; rewire `A.next = X` and `X.prev = A`; free `B`. Final: `A ⇄ X ⇄ C`.


This sequence exercises both **middle** splices and **end** updates.

## Complexity and Performance

Let `n` be the number of nodes.

- **Time:** Local operations (`insert-before/after`, `delete`, `splice`) are **O(1)** given a node reference. Searching by value is **O(n)** (no index).

- **Space:** **O(n)** for nodes; each node stores two pointers plus element payload.

- **Iteration:** Forward/backward scans are linear. Random access is not supported (no `O(1)` `A[i]`).

- **Cache behavior:** Pointer chasing degrades locality vs arrays/contiguous deques; performance depends on allocator behavior and prefetching.


**Comparison to related structures.**

- [[linked-list|Linked List]]: saves one pointer per node but cannot delete in O(1) without the **predecessor**; DLLs delete in O(1) with the node handle.

- [[doubly-linked-list|Doubly Linked List]] vs [[circular-linked-list|Circular Linked List]]: circular + sentinel variant removes end-case branches and supports O(1) rotation by simply changing the entry pointer.

- [[queue|Queue]] / [[deque|Deque (Double-Ended Queue)]]: deques can be implemented atop DLLs (unbounded) or arrays (cache-friendly).


## Implementation Details or Trade-offs

**Sentinel vs null-terminated.**

- **Sentinel** simplifies code paths: no `head/tail` special cases; empty and singleton look identical. Good for libraries and performance-critical code where branch predictability matters.

- **Null-terminated** reduces one node of overhead and can be friendlier for serialization, but needs careful end-case logic.


**Order of pointer updates.**
Adopt a **fail-safe wiring order** to avoid transient inconsistencies:

1. Fill new node's pointers (`y.prev`, `y.next`).

2. Update neighbor pointers **toward** the new node.

3. Adjust `head`/`tail` if boundaries changed.


Deletions reverse this: **detach neighbors first**, then free the node.

**Memory management.**

- Pair operations with allocators that minimize fragmentation; consider pooling nodes for high churn.

- Guard against double frees by clearing `prev`/`next` (debug modes) after detach.


**Splice operations.**
To move a **contiguous segment** `[a..b]` after node `t` in O(1):

- Detach: `a.prev.next = b.next`; `b.next.prev = a.prev`.

- Insert: link `[a..b]` between `t` and `t.next`.
    Track `head`/`tail` (or use a sentinel) to handle boundary cases cleanly.


**Iterators and invalidation.**

- **Erasing the pointed node** invalidates that iterator; iterators to other nodes remain valid.

- Insertions **do not** invalidate iterators except at insertion points.

- Provide **bidirectional iterators** with `++` and `--` that simply follow `next`/`prev`.


**Concurrency.**

- Single-threaded operations are trivial. Multi-threaded use requires coarse-grained locks or fine-grained node locks; lock-free DLLs are complex due to ABA and double-link updates - generally avoid unless using a proven algorithm.


**Safety checks.**

- In debug builds, assert invariants after operations: ends well-formed; no self-loops unless circular by design; link symmetry (`x.next.prev == x`, `x.prev.next == x`).


## Practical Use Cases

- **LRU caches / page replacement**: nodes represent items; most-recently-used at one end and least-recently-used at the other; splicing moves accessed nodes to the front in O(1).

- **Deques and schedulers**: unbounded capacity with stable node addresses when the backing structure must support frequent end operations.

- **Editors / ropes (as component)**: some rope/cord structures use DLLs to chain chunks; splicing enables efficient edits.

- **Adjacency lists with removal**: when edges must be removed by handle in O(1) without scanning neighbors.


## Limitations / Pitfalls

> [!warning]
> **Partial rewires cause leaks or cycles.** If you update a neighbor pointer on one side but not the other, you can create **orphan chains** (memory leaks) or **2-cycles** that break traversal. Always perform updates atomically with a known-safe order, or guard with assertions.

> [!warning]
> **Dangling node references.** Client code must not keep raw pointers to nodes after `DELETE` or `POP_*`. Encapsulate nodes or use handles that become invalid on erase.

> [!warning]
> **Performance traps.** DLLs have poor spatial locality; large linear scans can underperform array-based structures drastically. Prefer arrays when random access and iteration speed dominate.

> [!warning]
> **Incorrect boundary updates.** In null-terminated lists, forgetting to update `head`/`tail` during end insertions/deletions yields latent bugs. Tests should cover empty ↔ singleton ↔ multi transitions.

## Summary

Doubly linked lists enable **constant-time local edits** and **two-way iteration** by maintaining `prev` and `next` pointers in each node. Using a **sentinel** simplifies edge cases and often improves branch behavior. The structure is ideal for workloads driven by **splicing with handles** (LRU, schedulers, deque backends), but it trades away array-like locality and indexed access. Robust implementations formalize pointer-update order, validate invariants, and define clear iterator invalidation rules.

## Related Notes

- [[linked-list|Linked List]]

- [[circular-linked-list|Circular Linked List]]

- [[deque|Deque (Double-Ended Queue)]]

- [[queue|Queue]]
