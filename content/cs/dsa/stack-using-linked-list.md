---
title: Stack Using Linked List  
description: Node-based LIFO with push/pop at the head; O(1) operations and pointer-stable elements.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - ll-stack-head.svg — Show push/pop at the head of a singly linked list; highlight new head after each operation and empty-state handling.

# - mixed-ops-trace.svg — Timeline of operations (push, push, pop, push, ...) with snapshots of head and next pointers.

---

## Overview

A **linked-list stack** implements **LIFO** using nodes linked by pointers, with the **head** representing the top. Core operations—`push(x)` and `pop()`—operate on the head and run in **O(1)** worst-case time. Compared to array-backed stacks, a linked stack provides **pointer-stable elements** (nodes do not move in memory) and avoids bulk resizes, at the cost of **per-node allocation overhead** and reduced cache locality.

> [!note]  
> Representation matters for performance but not for the LIFO **semantics**. A linked stack is ideal when you want `O(1)` operations with **no resizing** and you may need to hold **stable references** to nodes.

## Structure Definition

A minimal singly linked node:

```
struct Node {
  value: T
  next: Node*
}
```

Stack state:

- `head: Node*` — pointer to the top node (or `NIL` if empty)
    
- `n: int` — optional size counter (kept consistent on every op)
    

**Invariants**

- Empty iff `head == NIL` and (if tracked) `n == 0`.
    
- The top element is always at `head.value`.
    
- The list is acyclic; `next` of the last node is `NIL`.
    

> [!tip]  
> Track `n` if you need `size()` in `O(1)`. Without `n`, computing size is `Θ(n)` by traversal.

## Core Operations

### Interface

```pseudo
interface Stack<T>:
    method push(x: T)
    method pop() -> T
    method peek() -> T
    method isEmpty() -> bool
    method size() -> int    // optional without n
```

### Singly linked implementation

```pseudo
class LinkedStack<T>:
    head: Node*
    n: int

    constructor():
        head = NIL
        n = 0

    method isEmpty() -> bool:
        return head == NIL

    method size() -> int:
        return n

    method peek() -> T:
        if head == NIL: error Underflow
        return head.value

    method push(x: T):
        node = new Node(x, head)
        head = node
        n = n + 1

    method pop() -> T:
        if head == NIL: error Underflow
        node = head
        x = node.value
        head = node.next
        free(node)              // or return to pool
        n = n - 1
        return x
```

**Why head-only?** Pushing and popping at the head keeps both operations **O(1)** with simple pointer rewiring. Maintaining a tail would not help LIFO and would complicate invariants.

## Example (Stepwise)

> [!example]  
> **Diagram (`ll-stack-head.svg`)** — Show `head` pointing to the top node; after a `push(x)`, new node points to old head and becomes the new head. After a `pop()`, `head` moves to `head.next`.

Consider the sequence: `push(7), push(3), pop(), push(5)`

1. Start: `head = NIL`
    
2. `push(7)` → new node(7, NIL); `head` → 7
    
3. `push(3)` → new node(3, head=7); `head` → 3
    
4. `pop()` → remove 3; `head` → 7
    
5. `push(5)` → new node(5, head=7); `head` → 5
    

> [!example]  
> **Diagram (`mixed-ops-trace.svg`)** — Timeline snapshots for the sequence above with `head` labels and `next` pointers.

## Complexity and Performance

- **Time (worst-case):** `push`, `pop`, `peek`, `isEmpty` are **O(1)**.
    
- **Space:** `Θ(n)` for `n` nodes **plus** per-node overhead (pointer fields, allocator headers).
    
- **Locality:** Typically **worse** than arrays. Nodes are scattered in memory; pointer chasing causes more cache misses.
    
- **Predictability:** No resize spikes; each operation’s cost is stable (modulo allocator behavior).
    

When does a linked stack outperform arrays?

- When **resizes would be frequent** and you cannot tolerate occasional `Θ(n)` copies (e.g., strict real-time bounds).
    
- When you require **pointer-stable** elements (references to nodes remain valid until popped).
    
- When memory comes from a **pool/arena**, eliminating allocator overhead and improving locality.
    

## Implementation Details or Trade-offs

### Memory management

- **General-purpose heap**: simplest, but per-op `new/free` can dominate runtime and fragment memory.
    
- **Object pool / slab allocator**: preallocate nodes; `push` pops from free-list, `pop` returns to free-list. Constant-time, cache-friendlier, and deterministic.
    
- **Zeroing / destructors**: if `T` owns resources, ensure destructors run on `pop()` (or when pooling, run cleanup before returning node to the pool).
    

### Safety and error handling

- **Underflow**: define clear behavior—throw/return status. In C-like APIs:
    
    ```pseudo
    method tryPop(out x: T) -> bool:
        if head == NIL: return false
        x = head.value
        head = head.next
        free(node)
        n = n - 1
        return true
    ```
    
- **Acyclicity**: logic errors that accidentally create cycles will break termination on traversals or debugging routines. Consider optional cycle checks in debug builds.
    

### Optional features

- **Size tracking**: maintain `n` for `size()` in `O(1)`.
    
- **Bulk ops**: `pushAll(iterable)` can chain-allocate and link nodes in one pass.
    
- **Clear**: pop until empty; if pooling, return all nodes to the pool in `O(n)`.
    

### Concurrency

- A simple linked stack isn’t thread-safe. Options:
    
    - **Coarse-grained mutex** around all methods.
        
    - **Lock-free Treiber stack** (CAS on `head`), but beware **ABA**; mitigate with hazard pointers, epoch reclamation, or tagged pointers. Garbage-collected languages reduce reclamation pain but still need safe publication.
        

### Comparisons to array stacks

- **Pros (linked)**: no resizing; stable node addresses; predictable `O(1)` worst-case; flexible capacity growth one node at a time.
    
- **Cons (linked)**: extra pointer per node; allocator overhead; cache misses; total memory higher than arrays at the same size.
    

> [!tip]  
> If elements are **large**, store **handles** (pointers/indices) in nodes instead of full objects to reduce move/copy costs on push/pop.

## Practical Use Cases

- **Interpreter/VM call frames** where frames are heap-allocated and chained.
    
- **Backtracking** in search/constraint solvers where nodes carry rich metadata and are frequently pushed/popped.
    
- **Undo logs** that must retain stable references until applied.
    
- **Embedded/real-time** systems with custom pools, needing bounded-time operations without periodic resize spikes.
    

## Limitations / Pitfalls

> [!warning]  
> **Per-op allocation cost.** Without pooling, `new/free` on every push/pop can dominate runtime. Use arenas or pooled nodes where possible.

> [!warning]  
> **Memory overhead.** Each node carries at least one pointer, plus allocator metadata. For small `T`, overhead may exceed payload.

> [!warning]  
> **Cache behavior.** Pointer chasing hurts locality. For hot paths with primitive types, an array stack is often faster.

> [!warning]  
> **Iterator invalidation & ownership.** Returning raw node pointers outside the stack API can invite misuse (dangling after pop). Prefer returning values or handles with clear ownership rules.

## Example (Additional)

**Pooled-node design sketch**

```pseudo
class NodePool<T>:
    freeList: Node*
    blockList: Block*   // optional, to free all at once

    method acquire(x: T) -> Node*:
        if freeList != NIL:
            node = freeList; freeList = freeList.next
            node.value = x; node.next = NIL
            return node
        else:
            return allocateNewNode(x)

    method release(node: Node*):
        cleanup(node.value)        // run destructor if needed
        node.next = freeList
        freeList = node

class LinkedStack<T>:
    head: Node*
    n: int
    pool: NodePool<T>

    method push(x):
        node = pool.acquire(x)
        node.next = head
        head = node
        n = n + 1

    method pop() -> T:
        if head == NIL: error Underflow
        node = head
        x = node.value
        head = node.next
        pool.release(node)
        n = n - 1
        return x
```

- Eliminates general-purpose allocator latency; keeps `push/pop` strictly `O(1)`.
    

## Summary

A **stack using a linked list** provides clean **O(1)** push/pop/peek with **no resizing**, stable node addresses, and flexible memory growth. The trade-offs are **per-node overhead**, **allocator costs**, and **poorer cache locality** versus array stacks. Use pooling to control allocation, define precise underflow semantics, and keep invariants (acyclic list, correct head, size tracking) tight. Choose the linked implementation when predictability and pointer stability outweigh the locality and memory advantages of arrays.

## See also

- [[cs/dsa/stack|Stack]]
    
- [[cs/dsa/stack-using-array|Stack Using Array]]
    
- [[cs/dsa/push-and-pop-operations|Push & Pop Operations]]
    
- [[cs/dsa/linked-list|Linked Lists]]