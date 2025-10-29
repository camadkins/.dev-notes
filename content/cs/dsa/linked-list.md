---

title: Linked Lists  
description: Node-based dynamic sequences with next pointers; options for sentinel heads, tail tracking, and size fields.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - sll-head-tail-sentinel.svg — Side-by-side singly list with/without a sentinel head; arrows show head, optional tail, and next pointers.

# - reverse-in-place.svg — Three-frame trace of in-place reversal: (prev,curr,next) triples and pointer flips.

# - slow-fast-middle-cycle.svg — Slow/fast pointers finding the middle and detecting a cycle (meeting point vs NIL).

---

## Overview

A **linked list** is a dynamic sequence built from **nodes**. Each node stores a **value** and a pointer to the **next** node (singly linked list, SLL). The list container maintains a pointer to the **head** (first node), and optionally a **tail** (last node) and a **size** counter. The shape naturally supports **O(1)** insertion and deletion **once the predecessor is known**, and **O(n)** traversal. Unlike arrays, linked lists avoid contiguous memory and shifting costs, but pay overhead in **pointers, cache misses, and indirection**.

> [!example]  
> **Diagram (`sll-head-tail-sentinel.svg`)** — Show two SLLs: (A) “plain” with `head` possibly `NIL`; (B) “sentinel-head” where `head` points to a permanent dummy node whose `next` is the first real node. Both label an optional `tail` pointer.

## Structure Definition

### Node and container

```
Node:
    value
    next    // Node or NIL

List:
    head : Node or NIL       // plain: first real node or NIL
    tail : Node or NIL       // optional: last real node (if maintained)
    size : integer           // optional: number of real nodes
```

### Invariants

- `head == NIL ⇔ tail == NIL ⇔ size == 0` (when `size` is tracked).
    
- If `tail != NIL` then `tail.next == NIL`.
    
- Following `next` from `head` ends at `NIL` (no cycles) unless explicitly using a circular variant (see [[cs/dsa/circular-linked-list|Circular Linked List]]).
    

> [!tip]  
> **Sentinel head.** Introduce a **dummy head** whose `next` points to the first real node. Many edge cases (insert/delete at front) become ordinary middle cases because `head` is never `NIL`. Store the dummy in the `List` object and keep `tail` pointing to the last **real** node.

## Core Operations

Below, “SLL” means a singly linked list without cycles. Operations are `O(1)` when the **predecessor** is available; otherwise, locating it costs `O(n)`.

### Insert at front (push-front)

```pseudo
function PUSH_FRONT(L, x):
    n = new Node(x)
    n.next = L.head
    L.head = n
    if L.tail == NIL: L.tail = n
    L.size = L.size + 1
```

### Insert at back (push-back) using `tail`

```pseudo
function PUSH_BACK(L, x):
    n = new Node(x)
    n.next = NIL
    if L.tail != NIL:
        L.tail.next = n
        L.tail = n
    else:
        L.head = n
        L.tail = n
    L.size = L.size + 1
```

> [!tip]  
> Without a `tail`, appending requires a full traversal to the last node (**O(n)**). Maintain `tail` for queues.

### Insert after node `p`

```pseudo
function INSERT_AFTER(L, p, x):
    assert p != NIL
    n = new Node(x)
    n.next = p.next
    p.next = n
    if L.tail == p: L.tail = n
    L.size = L.size + 1
```

### Delete front (pop-front)

```pseudo
function POP_FRONT(L):
    if L.head == NIL: return EMPTY
    t = L.head
    L.head = t.next
    if L.head == NIL: L.tail = NIL
    L.size = L.size - 1
    destroy(t)
```

### Delete after node `p`

```pseudo
function ERASE_AFTER(L, p):
    assert p != NIL
    t = p.next
    if t == NIL: return         // nothing to erase
    p.next = t.next
    if L.tail == t: L.tail = p
    L.size = L.size - 1
    destroy(t)
```

### Delete first value `k` (search + unlink)

```pseudo
function ERASE_FIRST(L, k):
    prev = NIL
    curr = L.head
    while curr != NIL and curr.value != k:
        prev = curr
        curr = curr.next
    if curr == NIL: return NOT_FOUND
    if prev == NIL:            // deleting head
        L.head = curr.next
        if L.head == NIL: L.tail = NIL
    else:
        prev.next = curr.next
        if curr == L.tail: L.tail = prev
    L.size = L.size - 1
    destroy(curr)
```

### Traversal skeletons

```pseudo
function FOR_EACH(L, f):
    curr = L.head
    while curr != NIL:
        f(curr.value)
        curr = curr.next

function FIND(L, pred):
    idx = 0
    for curr = L.head; curr != NIL; curr = curr.next:
        if pred(curr.value): return (curr, idx)
        idx = idx + 1
    return (NIL, -1)
```

> [!warning]  
> **Do not lose the list.** When deleting `curr` during traversal, **save** `nxt = curr.next` before unlinking, then continue with `curr = nxt`.

## Example (Stepwise)

Start with empty list: `head=tail=NIL`.

1. `PUSH_FRONT(3)` → `[3]` (`head=tail=3`).
    
2. `PUSH_BACK(5)` → `[3 → 5]` (`tail=5`).
    
3. `INSERT_AFTER(node(3), 4)` → `[3 → 4 → 5]` (`tail=5`).
    
4. `ERASE_FIRST(4)` → `[3 → 5]`.
    
5. `POP_FRONT()` → `[5]` (`head=tail=5`).
    
6. `FOR_EACH(print)` prints `5`.
    

> [!example]  
> **Diagram (`reverse-in-place.svg`)** — Show `(prev, curr, next)` while reversing: rewire `curr.next = prev`, then advance `prev=curr`, `curr=next`; final `head=prev`.

## Complexity and Performance

- **Traversal/Search:** `O(n)` time, `O(1)` extra space.
    
- **Insert at head / insert after / delete at head / delete after:** `O(1)`.
    
- **Insert at tail:** `O(1)` with `tail`; `O(n)` without.
    
- **Delete by value:** `O(n)` to find predecessor.
    
- **Space:** `Θ(n)` nodes plus pointer overhead (one pointer per node in SLL).
    

**Cache behavior.** SLLs suffer from **poor locality** vs arrays; each step is a pointer chase. Arrays dominate when random access and iteration speed matter (see [[cs/dsa/dynamic-arrays|Dynamic Arrays]]).

## Implementation Details or Trade-offs

### Sentinel vs plain head

- **Plain head:** Fewer objects; must special-case front operations when `head==NIL`.
    
- **Sentinel head:** `head` always non-`NIL`; simplifies code paths (deletes/insert-at-front become “erase/insert after sentinel”). Slight memory overhead for one dummy node.
    

### Tail and size fields

- **Tail** enables `O(1)` append and helps with queue-like workloads. Keep `tail` updated **whenever** the last node changes.
    
- **Size** makes length queries `O(1)` and aids invariants/tests; increment/decrement with each mutation.
    

### Reversal in place (classic)

```pseudo
function REVERSE(L):
    prev = NIL
    curr = L.head
    L.tail = L.head                // tail becomes old head
    while curr != NIL:
        next = curr.next
        curr.next = prev
        prev = curr
        curr = next
    L.head = prev
```

### Find middle with slow/fast pointers

```pseudo
function MIDDLE(L):
    slow = L.head
    fast = L.head
    while fast != NIL and fast.next != NIL:
        slow = slow.next
        fast = fast.next.next
    return slow    // middle (left-middle on even length)
```

### Cycle detection (Floyd’s tortoise & hare)

```pseudo
function HAS_CYCLE(L):
    slow = L.head
    fast = L.head
    while fast != NIL and fast.next != NIL:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: return true
    return false
```

> [!tip]  
> To **locate** the cycle entry after a meet: move one pointer to `head`, advance both by one until they meet again; that node is the entry.

### Memory management & safety

- **Manual memory (C/C++):** Pair every `new` with `destroy`. After unlinking a node, **never** read from it. Set its `next` to `NIL` before freeing to catch accidental double frees in debug builds.
    
- **GC languages:** Dropped nodes are collected automatically; be mindful of payload references if they are shared elsewhere.
    

## Practical Use Cases

- **Queues / Producer–Consumer:** SLL with `head`/`tail` supports `enqueue`/`dequeue` in `O(1)` (see [[cs/dsa/queue|Queue]]).
    
- **Adjacency lists:** Graph representations often store neighbors in linked nodes when memory fragmentation is acceptable.
    
- **Hash table buckets:** Separate chaining uses SLL per bucket (see [[cs/dsa/hash-tables|Hash Tables]]).
    
- **Streaming logs / editors:** Gap buffers and rope-like structures may embed linked chunks for insert-heavy workloads.
    

## Limitations / Pitfalls

> [!warning]  
> **Random access is slow.** No `A[i]`. Accessing the i-th element is `O(i)`. If you need indexing or range scans with locality, prefer arrays or balanced trees.

> [!warning]  
> **Lost head/tail.** Always update `head`/`tail` when removing or adding at ends; stale `tail` causes infinite loops or crashes.

> [!warning]  
> **Cycles** (accidental or intended): Plain SLL algorithms assume acyclic lists; introduce cycle-aware variants (e.g., Floyd’s) when needed.

> [!warning]  
> **Concurrent mutation.** Traversing while another thread mutates the list is unsafe without synchronization.

> [!warning]  
> **Space overhead.** One pointer per node (two for DLLs) plus allocator metadata; for small payloads, overhead can dominate.

> [!warning]  
> **Comparator/equality.** When removing by value, define value equality carefully (e.g., string content vs reference, floating-point tolerance).

## Summary

Linked lists provide **O(1)** local updates with simple pointer rewiring and **O(n)** traversal. Their strengths are **constant-time insert/delete given a predecessor**, easy **queue/stack** patterns, and **flexible growth** without shifting or reallocation. Their weaknesses are **poor cache locality**, **no random access**, and higher per-element overhead. Use sentinels to simplify edge cases, maintain `tail` and `size` when useful, and rely on slow/fast pointers for middle finding and cycle detection. For heavy iteration or indexing workloads, arrays or trees are typically faster and simpler.

## See also

- [[cs/dsa/singly-linked-list|Singly Linked List]]
    
- [[cs/dsa/doubly-linked-list|Doubly Linked List]]
    
- [[cs/dsa/circular-linked-list|Circular Linked List]]
    
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]