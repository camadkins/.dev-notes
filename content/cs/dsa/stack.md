---
title: Stack
description: LIFO discipline with push, pop, and optional peek; array- or list-backed with clear invariants and well-defined error handling.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-22
aliases: []
---

## Overview
A **stack** is a container that enforces **Last-In, First-Out (LIFO)** access: the most recently pushed element is the first to be popped. Stacks power recursion (call stacks), parsing, expression evaluation, backtracking, and graph traversals. A minimal interface exposes `push(x)`, `pop()`, and `peek()` (or `top()`), plus convenience methods `isEmpty()`, `size()`, and sometimes `clear()`.

> [!note]
> LIFO is about **access policy**, not representation. Stacks can be implemented with **contiguous arrays** (top index) or **linked nodes** (head pointer). Both achieve `O(1)` amortized or worst-case time for core operations under typical designs.

## Structure Definition
Two common implementations:

- **Array-backed stack (contiguous)**
  - State: array `A[0..cap-1]`, integer `top` as the **count of elements** (also the next write index).
  - Invariant: elements occupy `A[0..top-1]`; empty iff `top == 0`; full iff `top == cap`.
  - Push: write `A[top] = x`, then `top++`.
  - Pop: `top--`, return `A[top]`.

- **Linked stack (singly linked list)**
  - State: `Node { value, next }`, pointer `head` to the **top node**; optional `size`.
  - Invariant: empty iff `head == NIL`.
  - Push: allocate `Node(x, head)`, set `head = new node`.
  - Pop: `x = head.value`, `head = head.next`, free old node.

> [!tip]
> For array stacks, define `top` as **count** (not last index). It eliminates off-by-one errors and keeps push/pop symmetric.

## Core Operations
A clean, language-agnostic interface:

```pseudo
interface Stack<T>:
    method push(x: T)                // add to top
    method pop() -> T                // remove & return top; error if empty
    method peek() -> T               // return top without removing; error if empty
    method isEmpty() -> bool
    method size() -> int
````

### Array-backed (with dynamic growth)

```pseudo
class ArrayStack<T>:
    A: array[T]; cap: int; top: int

    method push(x):
        if top == cap: grow()                    // resize policy
        A[top] = x
        top = top + 1

    method pop() -> T:
        if top == 0: error Underflow
        top = top - 1
        x = A[top]
        maybeShrink()                            // optional; see trade-offs
        return x

    method peek() -> T:
        if top == 0: error Underflow
        return A[top - 1]
```

### Linked (singly)

```pseudo
class LinkedStack<T>:
    head: Node*; n: int

    method push(x):
        head = new Node(x, head)
        n = n + 1

    method pop() -> T:
        if head == NIL: error Underflow
        x = head.value
        node = head
        head = head.next
        free(node)
        n = n - 1
        return x

    method peek() -> T:
        if head == NIL: error Underflow
        return head.value
```

## Example (Stepwise)

**Parentheses matching** (well-formedness of a string with `(` and `)`):

```pseudo
function PAREN_MATCH(s):
    S = new Stack<char>()
    for c in s:
        if c == '(':
            S.push(c)
        else if c == ')':
            if S.isEmpty(): return false
            S.pop()
    return S.isEmpty()
```

- Push on `'('`, pop on `')'`. At the end, stack must be empty to be balanced.


## Complexity and Performance

Let `n` be the number of operations.

- **Array-backed**: `push`/`pop`/`peek` in **O(1)**; with dynamic resizing by a factor (e.g., ×2), `push` is **amortized O(1)**; `pop` is O(1). `size` and `isEmpty` are O(1).

- **Linked**: all core ops are **O(1)** worst-case; each element adds a node allocation.

- **Space**:

    - Array: `Θ(cap)` reserved; load factor near 1 if growth policy is geometric.

    - Linked: `Θ(n)` plus per-node overhead (pointers, allocator headers).


Cache and locality:

- Arrays are **cache-friendly**, often outperforming lists due to contiguous memory.

- Linked stacks suffer **pointer chasing**, but avoid reallocation on growth.


## Implementation Details or Trade-offs

### Fixed vs dynamic capacity (arrays)

- **Fixed** `cap` yields predictable memory and can prevent reallocation in constrained settings. You must decide on **overflow behavior** (error/exception, discard, or overwrite in a circular-buffer variant—though wrap-around violates strict LIFO semantics unless designed as a ring stack for bounded history).

- **Dynamic growth** (e.g., doubling capacity) gives amortized O(1) pushes but temporarily allocates and copies `Θ(n)` elements during a resize.


### Shrink policy

- Shrinking when `top < cap/4` reduces memory but risks **thrash** on workloads that hover near thresholds. Many libraries **do not shrink automatically**; expose a `trimToSize()` method instead.


### Error handling

- **Underflow** on `pop()` or `peek()` from an empty stack must be defined: throw, return sentinel, or return status plus out-parameter. In C-like APIs, consider `bool pop(T* out)` and return false on empty.


### Thread safety

- A simple stack is **not** thread-safe by default. For concurrent use, wrap with a mutex or use a specialized **lock-free** stack (e.g., Treiber stack with ABA handling via hazard pointers or tagged pointers). Note: lock-free stacks can suffer **contention** on the top pointer under high concurrency.


### Memory model

- **Linked** stacks: per-op heap alloc/free can dominate time and fragment memory; use **object pools**/arenas to amortize costs.

- **Array** stacks: reallocation copies elements; for large objects, store **handles/indices** instead of full objects to minimize copy costs.


> [!tip]
> In languages without bounds-checked arrays, guard every `push` against overflow (array full) and every `pop/peek` against underflow. Add assertions in debug builds to catch misuse.

## Practical Use Cases

- **Call stacks (recursion)**: function frames are effectively a stack; recursion depth corresponds to stack height. See [[cs/dsa/recursion|Recursion]] for depth concerns.

- **Expression evaluation**: postfix (RPN) evaluators push operands and pop on operators; infix-to-postfix conversion uses **operator stacks**.

- **Backtracking**: DFS paths, undo logs, and state snapshots are naturally stacked.

- **Language parsing**: parentheses/bracket matching, operator precedence parsing (shunting-yard), and LR parser stacks.

- **Algorithms**: iterative DFS replaces recursion with an explicit stack; Tarjan's SCC uses a stack to manage active vertices.


## Limitations / Pitfalls

> [!warning]
> **Underflow/overflow**: empty pops/peeks and capacity overflows are the most common bugs. Define clear API behavior and test boundary conditions.

> [!warning]
> **Iterator invalidation**: popping elements while iterating a backing container can invalidate references/pointers; avoid exposing raw internals.

> [!warning]
> **Recursion depth**: relying on the language call stack can overflow for deep inputs (e.g., skewed trees); use an explicit stack and iterative algorithms when needed.

> [!warning]
> **LIFO mismatch**: not all "undo" semantics are strictly LIFO once you introduce branching histories; you may need a **stack of stacks** or a DAG of states.

## Example (Additional)

**Undo log** pattern:

```pseudo
function UPDATE(state, action, undoStack):
    inverse = computeInverse(action, state)
    apply(action, state)
    undoStack.push(inverse)

function UNDO(state, undoStack):
    if undoStack.isEmpty(): return false
    inverse = undoStack.pop()
    apply(inverse, state)
    return true
```

- Each forward action pushes an inverse. Undo becomes a single `pop()+apply()`.


## Summary

Stacks implement **LIFO** access with a minimal, efficient API. Array-backed stacks offer **cache-friendly speed** and amortized `O(1)` growth; linked stacks offer **constant-time worst-case ops** and stable pointers at the cost of per-node overhead. Robust designs define clear behavior for **underflow/overflow**, choose sensible **resize/shrink** policies, and consider **thread safety** and **memory locality**. Stacks are a foundational tool for recursion elimination, parsing, backtracking, and many core algorithms.

## See also

- [[cs/dsa/stack-using-array|Stack Using Array]]

- [[cs/dsa/stack-using-linked-list|Stack Using Linked List]]

- [[cs/dsa/recursion|Recursion]]

- [[cs/dsa/depth-first-search-algorithms|Depth-First Search Algorithms]]
