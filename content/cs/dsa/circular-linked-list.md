---
title: Circular Linked List
description: A linked list whose tail connects back to the head; supports constant-time rotations and round-robin iteration with careful termination logic.
draft: false
comments: true
tags:
 - cs
 - dsa
date: 2025-10-16
updated: 2025-10-27
aliases: []
---

## Overview

A **circular linked list** connects the tail node back to the head, forming a cycle. This structure preserves the dynamic flexibility of linked lists (constant-time splicing near a known position) while enabling **natural rotation** and **round-robin iteration** without ever reaching `null`. The circular property simplifies certain queue-like patterns (e.g., continuous scheduling) and enables algorithms such as the Josephus stepper to operate cleanly by repeatedly advancing a cursor around the ring.

Compared to a linear [[linked-list|Linked List]], circular lists remove the "end-of-list" sentinel (`null`) from traversals, which can reduce branching and enable elegant loops. The trade-off is the need for **explicit termination conditions** to avoid infinite loops.

## Structure Definition

A circular list may be **singly** or **doubly** linked:

- **Singly circular list (SCLL)**
  Each `Node` stores `value` and `next`. For a non-empty list, following `next` pointers eventually cycles to the starting node. For a **singleton** list, `node.next == node`.

- **Doubly circular list (DCLL)**
  Each `Node` additionally stores `prev`, with `head.prev == tail` and `tail.next == head`. DCLLs support O(1) deletion with only a pointer to the node itself (no predecessor search).

- **Optional sentinel**
  A **sentinel (dummy) head** of height 0 that always exists and points to itself in the empty case. This unifies edge cases: empty, singleton, and general operations can be written without per-case special logic.

**Notation.** Use 0-indexed naming for examples; `head` denotes an entry point (any node may serve as an entry pointer in a circle). Nodes hold `value` and pointers `next` (and optionally `prev`).

## Core Operations

Below, pseudocode targets SCLL unless noted. Where the list is empty, `head = null` (no sentinel). With a sentinel, replace `null` checks by `head.next == head`.

### Create (Empty)

```pseudo
function CREATE_EMPTY():
    return null  // no nodes; if using sentinel, return a node with next=self
````

### Insert at Head (SCLL)

O(1) if tail is known; O(n) otherwise due to tail search.

```pseudo
function INSERT_HEAD(head, x):  // returns new head
    node = new Node(x)
    if head == null:
        node.next = node
        return node

    // find tail (unless maintained separately)
    tail = head
    while tail.next != head:
        tail = tail.next

    node.next = head
    tail.next = node
    return node
```

### Insert After a Given Node (SCLL)

O(1) with a direct node reference.

```pseudo
function INSERT_AFTER(node, x):
    y = new Node(x)
    y.next = node.next
    node.next = y
```

### Insert at Tail (SCLL)

If a `tail` pointer is maintained, this is O(1); otherwise find tail.

```pseudo
function INSERT_TAIL(head, x):  // returns head; keep tail separately for O(1)
    if head == null:
        node = new Node(x)
        node.next = node
        return node

    // tail search as in INSERT_HEAD
    tail = head
    while tail.next != head:
        tail = tail.next

    y = new Node(x)
    y.next = head
    tail.next = y
    return head
```

### Delete After a Given Node (SCLL)

O(1) given predecessor; special handling for singleton and head adjustment.

```pseudo
function DELETE_AFTER(pred, head):  // delete pred.next, return new head
    target = pred.next
    if target == pred:               // singleton
        free(target)
        return null

    pred.next = target.next
    if target == head:
        head = target.next           // move head if we removed it
    free(target)
    return head
```

### Delete Head (SCLL)

O(1) if tail is known; otherwise O(n) to find tail.

```pseudo
function DELETE_HEAD(head):  // returns new head
    if head == null:
        return null
    if head.next == head:    // singleton
        free(head)
        return null

    // find tail unless maintained
    tail = head
    while tail.next != head:
        tail = tail.next

    tail.next = head.next
    temp = head
    head = head.next
    free(temp)
    return head
```

### Search / Membership Test

O(n) in general. Start anywhere and stop after a full cycle.

```pseudo
function CONTAINS(head, key):
    if head == null:
        return false
    cur = head
    do:
        if cur.value == key:
            return true
        cur = cur.next
    while cur != head
    return false
```

### Iterate (Round-Robin)

A bounded iterator advances `k` steps, or yields exactly `n` nodes if size is known.

```pseudo
function ADVANCE(cur, steps):  // returns node after 'steps' hops
    for s from 1 to steps:
        cur = cur.next
    return cur
```

> [!tip]
> In a DCLL, insertion and deletion become strictly O(1) with only the node pointer, since `prev` is available (no predecessor scan). The memory overhead is one extra pointer per node.

## Example (Stepwise)

**Build** a list with values `[A, B, C]` using head insertion:

1. Insert `A` into empty → `A.next = A`, `head = A`.

2. Insert `B` at head → find tail `A`; link `B.next = A`, `A.next = B`, new `head = B`.

3. Insert `C` at head → find tail `A`; link `C.next = B`, `A.next = C`, new `head = C`.


The ring is `C → B → A → C`.
**Delete head** (`C`):

- Find tail (`A`), set `A.next = B`, free `C`, and set `head = B`.
    Now `B → A → B`.


**Round-robin pass** starting from `B` visiting each once:

```pseudo
cur = head
do:
    PROCESS(cur.value)
    cur = cur.next
while cur != head
```

This yields `B, A`.

## Complexity and Performance

|Operation|SCLL (no tail)|SCLL (tail kept)|DCLL (with prev)|
|---|---|---|---|
|Insert after known node|O(1)|O(1)|O(1)|
|Delete after known predecessor|O(1)|O(1)|O(1)|
|Insert at head|O(n)|O(1)|O(1)|
|Delete head|O(n)|O(1)|O(1)|
|Search / membership|O(n)|O(n)|O(n)|
|Iterate k steps|O(k)|O(k)|O(k)|
|Space per node|1 ptr|1 ptr|2 ptrs|

- Maintaining a `tail` pointer converts head insert/delete to **O(1)** in SCLL.

- DCLL adds memory but yields **O(1)** deletion with just a pointer to the node (no predecessor).

- Traversals are strictly **O(n)**; circularity removes `null` checks but not asymptotics.


## Implementation Details or Trade-offs

**Choosing SCLL vs DCLL.**

- Use **SCLL** when memory is tight and deletions occur via known predecessors (e.g., removal after a current cursor in round-robin tasks).

- Use **DCLL** when arbitrary deletion with only a node pointer is common (e.g., LRU lists, splice-heavy algorithms).


**Sentinel vs `null` head.**

- A **sentinel head** simplifies edge cases: empty list is `head.next == head`; singleton is also uniform; operations become regular pointer rewrites with no `null`.

- Without a sentinel, code must handle: empty (`head == null`), singleton (`head.next == head`), and general cases.


**Maintaining size `n`.**
Track a size counter to enable bounded traversals (exactly `n` steps) and to prevent accidental infinite loops.

**Safe iteration and mutation.**
When deleting during iteration, store `next = cur.next` before unlinking `cur`. In DCLL, you can relink via `cur.prev.next = cur.next` and `cur.next.prev = cur.prev` in O(1).

**Concurrency considerations.**
Circular lists are pointer-rich structures; lock-free variants require careful use of atomic primitives (e.g., CAS on adjacency pairs) and hazard pointers or epoch reclamation to manage memory safely.

**Interfacing with queues.**
Circular lists can back a **cyclic scheduler** or a **round-robin queue** by maintaining a cursor; each dequeue reassigns the cursor to `cursor.next`. For strict queue semantics (head/tail enqueues and dequeues) with array-level locality, see [[circular-queue|Circular Queue]].

## Practical Use Cases

- **Round-robin scheduling** (time-sharing tasks, fair resource allocation): maintain a cursor that advances each tick.

- **Josephus/"hot-potato" steppers:** repeatedly advance `k` steps and delete the current element, continuing around the ring until one remains.

- **Multi-player game loops** (token passing) and **playlist rotations** where wraparound is semantically meaningful.

- **Concatenation by rotation semantics:** conceptually "rotate head" in O(1) by picking a new entry point in the ring, without relinking.


## Limitations / Pitfalls

> [!warning]
> **Termination conditions.** Since there is no `null`, traversals must stop after a full cycle (e.g., a `do … while (cur != head)` loop) or after `n` steps. Forgetting this leads to infinite loops.

> [!warning]
> **Singleton and empty cases.** In SCLL, `node.next == node` denotes a singleton; deletion must set `head = null`. A sentinel simplifies these cases.

> [!warning]
> **Predecessor requirement in SCLL.** Deleting an arbitrary node in SCLL needs its predecessor; without it, you must either scan O(n) to find the predecessor or adopt DCLL.

> [!warning]
> **Pointer integrity.** Circularity magnifies the impact of pointer bugs (e.g., accidentally isolating a subcycle). Maintain invariants carefully and consider asserts in debug builds.

## Summary

Circular linked lists form a **ring** by connecting the tail to the head. They preserve linked-list flexibility and enable **natural rotation** and **round-robin** patterns. SCLL is memory-light and works well with predecessor-based updates; DCLL pays one extra pointer per node to enable uniform O(1) deletion with just a node reference. Correct usage hinges on **explicit termination conditions**, careful handling of **empty/singleton** states, and optionally maintaining a **tail** pointer (or using a **sentinel**) to keep head operations O(1).

## Related Notes

- [[linked-list|Linked List]]

- [[doubly-linked-list|Doubly Linked List]]

- [[circular-queue|Circular Queue]]

- [[queue|Queue]]
