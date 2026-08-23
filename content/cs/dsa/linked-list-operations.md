---
title: Linked Lists - Insertion, Deletion, Traversal
description: Singly linked list operations with pointer rewiring invariants, edge cases, and testable pseudocode for head, tail, and middle updates.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-23
aliases: []
---

## Overview

A **singly linked list (SLL)** stores elements in **nodes** with a `value` and a pointer to the **next** node. Insertion and deletion are **O(1)** when the **predecessor** is known, because only a small, fixed set of pointers changes. Traversal is **O(n)** by following `next` from `head` until `NIL`. This note provides robust, language-agnostic pseudocode and the **invariants** you must preserve when inserting, deleting, and scanning, including common corner cases (empty list, one element, head/tail updates).

## Structure Definition

A minimal SLL node:

```
Node:
    value
    next  // = pointer to Node or NIL
```

The list container typically tracks at least `head`, and optionally `tail` and `size`:

```
List:
    head : Node or NIL
    tail : Node or NIL     // optional but recommended
    size : integer         // optional, for O(1) length
```

**Invariants**

- If `head == NIL` then `tail == NIL` and `size == 0`.

- If `tail != NIL` then `tail.next == NIL`.

- Following `next` pointers from `head` visits each node exactly once and ends at `NIL` (no cycles in a plain SLL).


## Core Operations

### Insert at head (O(1))

```pseudo
function PUSH_FRONT(L, x):
    node = new Node(x)
    node.next = L.head
    L.head = node
    if L.tail == NIL:        // list was empty
        L.tail = node
    L.size = L.size + 1
```

### Insert at tail with tail pointer (O(1))

```pseudo
function PUSH_BACK(L, x):
    node = new Node(x)
    node.next = NIL
    if L.tail != NIL:
        L.tail.next = node
        L.tail = node
    else:                    // empty list
        L.head = node
        L.tail = node
    L.size = L.size + 1
```

> [!tip]
> Without `tail`, appending requires a full traversal to the last node (**O(n)**). Maintain `tail` for queues and append-heavy workloads.

### Insert after a given node `p` (O(1))

```pseudo
function INSERT_AFTER(L, p, x):
    assert p != NIL
    node = new Node(x)
    node.next = p.next
    p.next = node
    if L.tail == p:          // appended at the end
        L.tail = node
    L.size = L.size + 1
```

### Delete head (O(1))

```pseudo
function POP_FRONT(L):
    if L.head == NIL: return EMPTY
    node = L.head
    L.head = node.next
    if L.head == NIL:        // list became empty
        L.tail = NIL
    L.size = L.size - 1
    destroy(node)            // free memory / release ref
```

### Delete after a given node `p` (O(1))

```pseudo
function ERASE_AFTER(L, p):
    assert p != NIL
    tgt = p.next
    if tgt == NIL: return     // nothing to erase
    p.next = tgt.next
    if L.tail == tgt:
        L.tail = p
    L.size = L.size - 1
    destroy(tgt)
```

### Delete first node with key `k` (O(n))

```pseudo
function ERASE_FIRST(L, k):
    prev = NIL
    curr = L.head
    while curr != NIL and curr.value != k:
        prev = curr
        curr = curr.next
    if curr == NIL: return NOT_FOUND
    if prev == NIL:
        // deleting head
        L.head = curr.next
        if L.head == NIL: L.tail = NIL
    else:
        prev.next = curr.next
        if curr == L.tail: L.tail = prev
    L.size = L.size - 1
    destroy(curr)
```

### Traversal (with early exit)

```pseudo
// Apply func to each value; stop early if func returns true
function TRAVERSE_EARLY_EXIT(L, func):
    curr = L.head
    while curr != NIL:
        if func(curr.value) == true:
            return STOPPED_EARLY
        curr = curr.next
    return FINISHED
```

### Search (first match)

```pseudo
function FIND(L, k):
    i = 0
    for curr = L.head; curr != NIL; curr = curr.next:
        if curr.value == k:
            return (curr, i)
        i = i + 1
    return (NIL, -1)
```

### Build from array (preserves order)

```pseudo
function FROM_ARRAY(A):
    L = new List()
    for x in A:
        PUSH_BACK(L, x)   // maintains original order
    return L
```

### Clear list

```pseudo
function CLEAR(L):
    curr = L.head
    while curr != NIL:
        nxt = curr.next
        destroy(curr)
        curr = nxt
    L.head = L.tail = NIL
    L.size = 0
```

## Example (Stepwise)

Start with `L = []` (empty: `head=tail=NIL`).

1. `PUSH_FRONT(3)` -> `[3]` (`head=tail=3`).

2. `PUSH_BACK(5)` -> `[3 -> 5]` (`tail=5`).

3. `INSERT_AFTER(node(3), 4)` -> `[3 -> 4 -> 5]`.

4. `POP_FRONT()` removes `3` -> `[4 -> 5]` (`head=4`, `tail=5`).

5. `ERASE_FIRST(5)` -> `[4]` (`tail=4`).

6. `TRAVERSE_EARLY_EXIT(x => x == 4)` stops when reaching `4`.


## Complexity and Performance

- **Traversal/Search:** `O(n)` time, `O(1)` space.

- **Insert at head / insert after / delete head / delete after:** `O(1)` time.

- **Insert at tail:** `O(1)` with `tail`, otherwise `O(n)`.

- **Delete by value (first match):** `O(n)` due to search.

- **Space usage:** `Theta(n)` nodes; each node stores pointer overhead plus payload.


**When to use an SLL**

- Excellent for **queues** (with `head`/`tail`), **stacks** (use head as top), and workloads heavy on **prepend/append** with minimal random access.

- Poor for **random indexing** (no `A[i]`), and [[cs/systems/memory-hierarchy-and-caching|cache locality]] is worse than contiguous arrays.


## Implementation Notes or Trade-offs

- **Memory management.** In manual-memory languages, every `new` must pair with a `destroy`. Deleting a node **must not** lose the pointer to the rest of the list - save `next` first if needed.

- **Sentinel (dummy) head.** Using a **dummy head** (`head` always non-NIL) removes special cases for deleting/inserting at the start:

    ```pseudo
    List.head points to dummy; real list starts at dummy.next
    ```

    Then `ERASE_FIRST` never needs to treat "delete head" specially; just start from the dummy.

- **Size field.** Keeping `size` updated gives `O(1)` length queries and helps with validation/tests.

- **Tail correctness.** Any operation that may remove or add the **last** node must update `tail`:

    - After deleting the last real node, set `tail=NIL`.

    - After appending, set `tail=new`.

- **[[cs/software-engineering/design-patterns|Iterator pattern]].** Abstract traversal behind an iterator to centralize null checks and make early exits/read-modify-delete loops safer.

- **[[cs/systems/concurrency-primitives|Thread safety]].** Updates are not atomic; guard with locks or use single-producer/single-consumer discipline if needed.


## Common Pitfalls or Edge Cases

> [!warning]
> **Forgetting to update `tail`.** After deleting the last node (or inserting at the end via `INSERT_AFTER(tail, x)`), failing to adjust `tail` leaves it dangling or stale.

> [!warning]
> **Losing the rest of the list.** When deleting `curr`, do **not** overwrite `curr.next` before saving it if you still need to continue traversal. Prefer the pattern `nxt = curr.next; destroy(curr); curr = nxt`.

> [!warning]
> **Null dereferences.** Check `NIL` before accessing `p.next`. `ERASE_AFTER` must handle the case `p.next == NIL`.

> [!warning]
> **Deleting by value without `prev`.** In an SLL you cannot unlink `curr` without its predecessor. Maintain both `prev` and `curr` during scans if deletion may occur.

> [!warning]
> **Inconsistent emptiness invariants.** Keep `head==NIL <=> tail==NIL <=> size==0`. Violations cause subtle bugs (e.g., infinite loops at tail).

> [!warning]
> **Freeing the wrong thing.** In languages with destructors/GC finalizers, ensure node payload lifetimes are correct. In C/C++, free the node once; do not double-free if payload is shared elsewhere.

## Testing & Corner Cases

Create a small, deterministic suite:

- **Empty list**

    - `POP_FRONT` -> `EMPTY`

    - `ERASE_FIRST(k)` on empty -> `NOT_FOUND`

    - `TRAVERSE_EARLY_EXIT` runs 0 iterations

- **Single element**

    - Insert head; delete head; list becomes empty; `tail==NIL`, `size==0`

    - `INSERT_AFTER(head, x)` updates `tail`

- **Two elements**

    - Delete head vs delete tail via `ERASE_AFTER`

    - Ensure `tail` points to the second element after deleting the first

- **Middle deletions**

    - Build `[a->b->c->d]`, delete `b` and check wiring `a.next==c`

    - Delete `d` via predecessor; verify `tail==c`

- **Traversal early exit**

    - Predicate matches first element

    - Predicate matches last element (worst case)

    - Predicate matches none

- **Size accounting**

    - After each op, assert `size` equals counted nodes via traversal


> [!tip]
> Add a `CHECK_INVARIANTS(L)` helper for test builds:
>
> - If `head==NIL` then `tail==NIL` and `size==0`.
>
> - Else `tail.next==NIL` and counting nodes equals `size`.
>

## Practical Use Cases

- **Queues:** Use SLL with `head`/`tail`; `enqueue` = `PUSH_BACK`, `dequeue` = `POP_FRONT`.

- **Adjacency lists:** Store neighbors as SLL nodes when memory is tight and insertions are frequent.

- **Hash table chaining:** Buckets can be SLLs when constant-factor overhead should be minimal (see [[hash-tables|Hash Tables]]).


## Summary

Singly linked lists enable **O(1)** local updates when the predecessor is known and **O(n)** traversal/search. The crux is **pointer rewiring** while maintaining simple invariants (`head`, `tail`, `size`). Prefer `tail` for O(1) appends, use a **dummy head** to simplify edge cases, and write tests for empty/one-element operations. With these patterns, insertion, deletion, and traversal are reliable, readable, and safe.

## Related Notes

- [[linked-list|Linked List]]

- [[doubly-linked-list|Doubly Linked List]]

- [[circular-linked-list|Circular Linked List]]

- [[dynamic-memory-allocation|Dynamic Memory Allocation]]
