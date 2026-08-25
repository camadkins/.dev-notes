---
title: Stack Operations
description: Implement and reason about push/pop operations and invariants for array- and list-backed stacks.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-17
aliases: []
---

## Overview

A **stack** is a LIFO container supporting two primary operations:

- **`PUSH(x)`**: place `x` on the top.

- **`POP()`**: remove and return the top element.


Correct stacks maintain simple but strict **invariants** (top index, size bounds, element order). This note implements `push/pop` for **array-backed** and **linked-list–backed** stacks, clarifies invariants, covers resizing and underflow protection, and shows how to test edge cases.

> [!note]
> Notation: arrays are 0-indexed with `A[0..cap-1]`. The stack size is `n`. The top element is at index `n-1` when `n>0`.

## Structure Definition

Two common representations:

**Array-backed**

```
struct StackArray:
    A: array[0..cap-1] of T
    n: integer  // current size, 0 <= n <= cap
```

- **Top** at `A[n-1]` when `n>0`.

- **Empty** iff `n == 0`.


**Linked-list–backed (singly)**

```
struct Node: { value: T, next: Node* }
struct StackList:
    head: Node*  // top node or NIL
    n: integer
```

- **Top** at `head`.

- **Empty** iff `head == NIL`.


> [!tip]
> Prefer the **array version** when you can estimate an upper bound or accept amortized resizing. Choose the **list version** for frequent pushes/pops with unknown growth and no need for random access.

## Core Operations

### Array-backed `PUSH` / `POP` (with geometric growth)

```pseudo
function PUSH_ARRAY(S, x):
    if S.n == S.cap:
        RESIZE(S, new_cap = max(1, 2 * S.cap))
    S.A[S.n] = x
    S.n = S.n + 1

function POP_ARRAY(S):
    if S.n == 0: error "underflow"
    S.n = S.n - 1
    x = S.A[S.n]
    // optional: S.A[S.n] = undefined  // clear for GC/debug
    if S.n > 0 and S.n == S.cap / 4:
        RESIZE(S, new_cap = S.cap / 2)    // shrink to control memory
    return x

function RESIZE(S, new_cap):
    B = new array[new_cap]
    for i in 0..S.n-1: B[i] = S.A[i]
    S.A = B
    S.cap = new_cap
```

**Invariants (array)**

- `0 <= n <= cap`

- If `n > 0`, **top** is `A[n-1]` and elements occupy `A[0..n-1]`.


### List-backed `PUSH` / `POP`

```pseudo
function PUSH_LIST(S, x):
    node = new Node(x, S.head)
    S.head = node
    S.n = S.n + 1

function POP_LIST(S):
    if S.head == NIL: error "underflow"
    node = S.head
    S.head = node.next
    S.n = S.n - 1
    x = node.value
    free(node)             // or let GC reclaim
    return x
```

**Invariants (list)**

- `n == 0 <=> head == NIL`

- Following `next` pointers from `head` visits exactly `n` nodes.


## Example (Stepwise)

**Array-backed trace**

Initial: `cap=4`, `n=0`, `A=[_,_,_,_]`
`PUSH(7)` -> `n=1`, `A=[7,_,_,_]` (top=7)
`PUSH(5)` -> `n=2`, `A=[7,5,_,_]` (top=5)
`POP()` -> return `5`, `n=1`, `A=[7,_,_,_]` (top=7)
`POP()` -> return `7`, `n=0`, `A=[_,_,_,_]` (empty)
`POP()` -> **underflow** (error)

## Complexity and Performance

- **Array-backed**: `PUSH` and `POP` are **amortized** `O(1)` with geometric resizing; worst-case `O(n)` only when resizing. Excellent [[cs/systems/memory-hierarchy-and-caching|cache locality]].

- **List-backed**: `PUSH` and `POP` are **worst-case `O(1)`** with predictable cost; extra per-node allocation and pointer chasing hurts locality.


Memory:

- Array uses `Theta(cap)` elements; doubling/halving keeps wasted space <= 75% between resizes and <= 50% on average.

- List stores one pointer per element plus allocator overhead; total `Theta(n)` but larger constants.


## Implementation Details or Trade-offs

### Resizing Policy (arrays)

- **Grow factor**: x2 is standard; x1.5 reduces spikes in large arrays at the cost of more resizes.

- **Shrink threshold**: halve when `n == cap/4` to avoid thrashing near 1/2 boundary.

- **Zero-capacity start**: use `cap=1` after first push to simplify edge conditions.


### Clearing Slots

- In GC languages, write `A[n] = null` on `POP` to break references.

- In systems languages, consider leaving data intact for speed and rely on `n` as the boundary; enable a debug build that scrubs freed slots to catch bugs.


### Error Handling

- On **underflow**, either throw/return an error code or expose a **`TRY_POP`** that returns `(ok, value)` without raising.

- On **overflow** (fixed-capacity version), reject `PUSH` with an error and document capacity semantics.


### Iteration Contract

Stacks usually **do not** guarantee stable iteration order beyond LIFO semantics. If you expose iterators, iterate from `top` down to `0`.

### Thread Safety

- A single [[cs/systems/concurrency-primitives|global lock]] around `PUSH/POP` serializes access.

- For high throughput, use **work-stealing deques** (not a simple stack) or **per-thread** stacks with periodic merging.


> [!tip]
> If you only ever need the **top k** items, cap capacity at `k` and drop the oldest when full (a ring or bounded stack). This keeps memory stable without general resizing.

## Practical Use Cases

- **Call stacks / stack traces**: model function activation records (frames) and simulate unwinding.

- **Parsing & evaluation**: expression evaluation (postfix), delimiter matching, tree traversals' explicit stacks.

- **Backtracking**: DFS, undo operations in editors/solvers, state checkpoints.


> [!example]
> **Simulate a tiny stack trace**
>
> ```
> main
>  - foo
>      - bar
> POP -> returns "bar"; next POP -> "foo"
> ```

## Limitations / Pitfalls

> [!warning]
> **Off-by-one on `top`.** In array stacks, the top index is `n-1` when `n>0`. Accessing `A[n]` after `PUSH` but before incrementing or after `POP` but before decrementing is a classic bug - update `n` in the right order.

> [!warning]
> **Underflow/overflow.** Always guard `POP` on empty and `PUSH` on full when capacity is fixed.

> [!warning]
> **Memory thrash.** Shrinking too aggressively causes repeated grow/shrink around thresholds; use `cap/4` to halve and hysteresis to stabilize.

> [!warning]
> **Iterator invalidation.** Any `PUSH` can reallocate the array and invalidate external references to `A`. Avoid exposing raw pointers to internal storage.

## Implementation Notes or Trade-offs

- **Fixed-capacity variant** (e.g., embedded systems): remove resizing and return explicit overflow errors.

- **Type constraints**: when `T` is large or nontrivial to copy, consider storing **pointers/handles** instead of values in an array stack.

- **Sentinel methods**: provide `PEEK()` to read the top without popping and `EMPTY()` to check underflow conditions.

- **Testing hooks**: compile-time flags to force frequent resizes (e.g., grow to `cap+1`) help reveal bugs in `RESIZE`.


## Summary

Stacks give **LIFO** access with minimal API: `PUSH`, `POP`, and `PEEK`. Array-backed stacks offer **amortized constant-time** operations and good locality; list-backed stacks give **strict constant-time** operations with higher overhead. Clean implementations hinge on three rules: guard **underflow**, maintain the **top invariant** (`top=n-1`), and manage **resizing** predictably. With those in place, stacks are a robust building block for [[cs/pl/grammar-ambiguity-parse-trees|parsers]], traversal algorithms, backtracking, and runtime call modeling.

## Related Notes

- [[cs/dsa/stack|Stack]]

- [[cs/dsa/push-and-pop-operations|Push and Pop Operations]]

- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]

- [[cs/dsa/depth-first-search-algorithms|Depth-First Search Algorithms]]
