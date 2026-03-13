---

title: Linked Lists — Searching
description: Search patterns on singly and doubly linked lists; trade-offs vs indexed arrays and when to switch structures.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2026-01-28
aliases: []

---

## Overview

Searching in a **linked list** means following **pointers** rather than indexing by position. This makes the baseline search **sequential**—`Θ(n)` comparisons in the worst case—yet linked lists remain valuable when **inserts/deletes** dominate and **stable references** to nodes are required. This note catalogs practical search patterns for **singly** and **doubly** linked lists, shows how to handle **k-th**, **predecessor**, and **remove-by-value** tasks, and explains **when arrays or other indexed structures are preferable**.

> [!note]
> Throughout, `head` is the first node (or a sentinel before it), nodes store `value` and pointers (`next`, and optionally `prev`), and `NIL` marks the end unless a **sentinel** is used.

## Motivation

Linked lists excel when:

- Items are frequently **inserted/removed** mid-structure with **`O(1)` pointer rewiring** given a **node handle**.

- Elements must remain at stable addresses (e.g., referenced elsewhere) without reallocation.

- Batches are small enough that `Θ(n)` scans are acceptable.


They are **poor** for random access and binary search (no indexing); many search problems are better served by **arrays**, **hash tables**, or **balanced trees** depending on the need for order and operations.

## Definition and Formalism

A singly linked list node:

```
struct Node { value: T, next: Node* }
```

A doubly linked list node:

```
struct Node { value: T, next: Node*, prev: Node* }
```

Lists may use **sentinels** (dummy head/tail nodes) to simplify edge cases. A search over values uses a **predicate** `P(x)` (e.g., `x == key`).

### Baseline invariants

- Sequential scan maintains: nodes before `cur` have been examined and **do not** satisfy `P`.

- If using a **predecessor** pointer, maintain `prev.next == cur` in singly lists.

### Sequential membership search (singly)

```pseudo
function FIND(head, key):
    cur = head
    while cur ≠ NIL:
        if cur.value == key: return cur
        cur = cur.next
    return NIL
```

### Find with predecessor (for deletion by value, singly)

```pseudo
function FIND_WITH_PREV(head, key):
    prev = NIL
    cur  = head
    while cur ≠ NIL and cur.value ≠ key:
        prev = cur
        cur = cur.next
    return (prev, cur)   // cur may be NIL if not found
```

Removing (first) match:

```pseudo
function REMOVE_BY_VALUE(head_ref, key):
    (prev, cur) = FIND_WITH_PREV(head_ref.value, key)
    if cur == NIL: return false
    if prev == NIL:                // removing head
        head_ref.value = cur.next
    else:
        prev.next = cur.next
    free(cur); return true
```

### Doubly linked removal (faster once node known)

Given a **node handle** `x`, you can unlink in `O(1)`:

```pseudo
function UNLINK_DLL(x):
    if x.prev ≠ NIL: x.prev.next = x.next
    if x.next ≠ NIL: x.next.prev = x.prev
    free(x)
```

## Properties and Relationships

- **No indexing**: access by position `k` requires `Θ(k)` traversal.

- **Stable references**: nodes keep addresses as long as they remain linked; good for external handles/iterators.

- **Cache behavior**: pointer-chasing is cache-unfriendly compared to arrays' contiguous storage.

- **Order awareness**: if the list is known to be **sorted**, early termination is possible when `cur.value > key` under a strict order.


> [!tip]
> If searches predominate, consider storing an auxiliary **index** (hash map from key → node*) or switching to a structure designed for fast lookup.

## Implementation or Practical Context

### Common search tasks

#### 1) Find first/last occurrence

- **First**: standard forward scan returns the first match.

- **Last**:

    - Singly: scan entire list remembering the last seen match (still `Θ(n)`).

    - Doubly: scan from **tail** backward for the last match (`Θ(n)` but often fewer steps with a good starting point).


#### 2) Find k-th element (by index)

```pseudo
function KTH(head, k):   // 0-based
    cur = head
    while cur ≠ NIL and k > 0:
        cur = cur.next
        k = k - 1
    return cur   // NIL if out-of-bounds
```

Still `Θ(k)`. For frequent random indexing, **use an array or dynamic array** (see [[dynamic-arrays|Dynamic Arrays]]).

#### 3) Find k-th from the end (two pointers)

Maintain a **gap** of `k` nodes between `fast` and `slow`.

```pseudo
function KTH_FROM_END(head, k):
    slow = head; fast = head
    for i in 1..k:
        if fast == NIL: return NIL
        fast = fast.next
    while fast ≠ NIL:
        slow = slow.next
        fast = fast.next
    return slow
```

#### 4) Search with move-to-front (self-organizing lists)

Heuristic for skewed workloads: after a successful search, **move the found node to the head** to reduce future search cost on hot keys. Good when a small set of keys dominate.

```pseudo
function FIND_MTF(head_ref, key):
    prev = NIL; cur = head_ref.value
    while cur ≠ NIL and cur.value ≠ key:
        prev = cur; cur = cur.next
    if cur ≠ NIL and prev ≠ NIL:
        prev.next = cur.next
        cur.next = head_ref.value
        head_ref.value = cur
    return cur
```

#### 5) Cycle detection before/while searching

Use **Floyd's tortoise and hare**:

```pseudo
function HAS_CYCLE(head):
    slow = head; fast = head
    while fast ≠ NIL and fast.next ≠ NIL:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: return true
    return false
```

If your search might traverse arbitrary input, guard against cycles to avoid infinite loops.

### Sorted list searches

If the list is **sorted** by `value` with a strict comparator:

- **Early exit**: stop when `cur.value > key`.

- **Insert position**: track predecessor where `prev.value < key ≤ cur.value`. This is still `Θ(n)` but avoids post-search passes.

- **Duplicates**: to find the **first** occurrence, keep walking left via `prev` on a DLL or track the last `==` seen in SLL.

### Sentinels and error-prone edges

Using **sentinel nodes** (head for SLL, head+tail for DLL) simplifies:

- Removal of the first/last element (no special-case nulling).

- Uniform loop bodies without `NIL` checks on each step.
    It doesn't change asymptotics but reduces bugs.

### Remove by value (first match) patterns

- **SLL**: you must know the **predecessor** to rewire `prev.next`.

- **DLL**: you can unlink with only a pointer to the node due to `prev`.


### When to choose arrays (or others) instead

- **Frequent random access or binary search →** [[dynamic-arrays|Dynamic Arrays]] or static arrays.

- **Frequent lookups by key without order →** [[hash-tables|Hash Tables]].

- **Ordered set/map with logarithmic search →** balanced trees (e.g., [[red-black-tree|Red–Black Tree]], [[avl-tree|AVL Tree]]).

- **Ordered list with occasional mid-inserts but faster search →** consider **skip lists** (layered indexes) or a **vector + gap buffer** depending on edits.


> [!tip]
> If you must stick with a list but need faster search for **hot keys**, maintain a **side index** (hash from key → node*). Update the index on insert/delete for `O(1)` expected membership checks.

### Performance notes

- **Time**: sequential search is `Θ(n)`. Move-to-front can yield good amortized behavior under locality.

- **Space**: SLL stores one pointer per node; DLL stores two (higher overhead but `O(1)` unlink by handle).

- **Cache**: lists suffer from **pointer chasing**; small arrays often outperform lists even when asymptotics match.

- **Concurrency**: mutation while searching needs synchronization; iterators can be invalidated by unlink operations unless the API defines safe semantics.


## Common Misunderstandings

> [!warning]
> **Binary search on a list.** Not feasible in `O(log n)`—jumping to the middle is `Θ(n)`. Any binary-search-like method becomes `Θ(n)` just to move pointers.

> [!warning]
> **Forgetting predecessor in SLL deletion.** You cannot unlink `cur` in `O(1)` without `prev` (unless you overwrite `cur.value` with `cur.next.value` and bypass `cur.next`, which fails for the tail and violates invariants).

> [!warning]
> **Cycle-unsafe traversals.** Lists constructed from user input or after complex merges may contain cycles; guard long scans with cycle checks when needed.

> [!warning]
> **Assuming DLL always faster.** Doubly links cost memory and write traffic; if you never traverse backward or unlink by handle, SLL may be preferable.

## Summary

Searching in linked lists is fundamentally **sequential**: you walk pointers until you find a match, track predecessors for safe rewiring, and lean on **fast/slow** techniques for tasks like k-th-from-end or cycle detection. For sorted lists, you gain **early exit** and clean insertion points but not better asymptotics. If searches dominate, **switch structures** (arrays, hash tables, trees) or add a **side index**. Keep implementations robust with **sentinels**, clear invariants, and careful handling of deletion and cycles.

## See also

- [[linked-list|Linked Lists]]

- [[doubly-linked-list|Doubly Linked List]]

- [[linear-search|Linear Search]]

- [[dynamic-arrays|Dynamic Arrays]]
