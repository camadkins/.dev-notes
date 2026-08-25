---
title: Stack Using Array
description: Index-based top with geometric resize for amortized O(1) push/pop and clear underflow/overflow semantics.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-06
aliases: []
---

## Overview
An **array-backed stack** implements the **LIFO** policy with a **contiguous buffer** and an integer `top` that tracks how many elements are stored. Core operations are simple and fast:

- `push(x)` stores `x` at index `top` and increments `top`.
- `pop()` decrements `top` and returns the element that was at `top−1`.
- `peek()` reads `A[top−1]` without modifying the structure.

Using a **geometric resize** strategy (e.g., double capacity when full), `push` runs in **amortized `O(1)`** time, while `pop`, `peek`, `isEmpty`, and `size` are **`O(1)`** worst-case. This note presents the design, invariants, resizing policies, common pitfalls, and a short amortized analysis sketch.

> [!note]
> Define `top` as the **count of elements** (also the next free index). This convention eliminates off-by-one errors and keeps `push` and `pop` symmetric.

## Structure Definition
State variables:

- `A[0..cap-1]`: contiguous array buffer (value or reference type).
- `cap`: current capacity (`|A|`).
- `top`: number of stored elements, `0 ≤ top ≤ cap`.

**Invariants**
- Valid elements occupy `A[0..top-1]`.
- Empty iff `top == 0`.
- Full iff `top == cap`.
- After any operation, `0 ≤ top ≤ cap` holds.

Representations:

- **Value arrays:** store elements directly; copies occur on push/resize.
- **Handle arrays:** store indices/pointers/refs; reduces copy cost for large objects.

## Core Operations
Language-agnostic pseudocode with geometric growth:

```pseudo
class ArrayStack<T>:
    A: array[T]
    cap: int
    top: int

    constructor(initialCap = 1):
        cap = max(1, initialCap)
        A = new array[T](cap)
        top = 0

    method isEmpty() -> bool:
        return top == 0

    method size() -> int:
        return top

    method peek() -> T:
        if top == 0: error Underflow
        return A[top - 1]

    method push(x: T):
        if top == cap:
            grow()                        // doubles capacity
        A[top] = x
        top = top + 1

    method pop() -> T:
        if top == 0: error Underflow
        top = top - 1
        x = A[top]
        maybeShrink()                     // optional (see trade-offs)
        return x

    method grow():
        newCap = cap * 2
        B = new array[T](newCap)
        copy A[0..cap-1] into B[0..cap-1]
        A = B
        cap = newCap

    method maybeShrink():
        // Optional: shrink when sparse to save memory
        if cap >= 4 and top <= cap / 4:
            newCap = cap / 2
            B = new array[T](newCap)
            copy A[0..top-1] into B[0..top-1]
            A = B
            cap = newCap
````

> [!warning]
> **Underflow/overflow** are logic errors. Always check `top == 0` before `pop/peek`, and `top == cap` before writing. In unsafe languages, these checks prevent memory corruption.

## Example (Stepwise)

**Trace: push until resize, then pop**

1. Start with `cap=4`, `top=0`, `A=[_,_,_,_]`.

2. `push(7)` → write at `A[0]`, `top=1`.

3. `push(3)` → `A=[7,3,_,_]`, `top=2`.

4. `push(9)` → `A=[7,3,9,_]`, `top=3`.

5. `push(1)` → `A=[7,3,9,1]`, `top=4` (now full).

6. `push(5)` → triggers `grow()` to `cap=8`, copy 4 slots, then store `5` at `A[4]`, `top=5`.

7. `pop()` → `top=4`, returns `5`.

8. `pop()` → `top=3`, returns `1`. If shrinking is on and `top ≤ cap/4` (here `3 ≤ 2` is false), no shrink.


This illustrates **rare expensive operations** (resizes) amortized across many constant-time pushes/pops.

> [!tip]
> If your workload oscillates around a threshold, you might disable automatic shrinking and expose a manual `trimToSize()` to avoid resize thrashing.

## Complexity and Performance

Let `n` be the number of operations and `N` the final number of elements.

- **Time per op (amortized):** `push` is **amortized `O(1)`** with doubling growth; `pop`, `peek`, `isEmpty`, `size` are **`O(1)`** worst-case.

- **Space usage:** `Θ(cap)` with `N ≤ cap < 2N` under doubling (no shrinking). With optional halving, `N ≤ cap ≤ 4N` at steady state; tighter if you shrink more aggressively.

- **Locality:** contiguous memory yields **[[cs/systems/memory-hierarchy-and-caching|cache-friendly]]** access and predictable prefetching; often faster than a linked stack even with the same asymptotic bounds.


### Amortized analysis (brief)

Each resize from `cap` to `2·cap` copies `cap` elements. Charge an **amortized credit** of 1 copy per `push`. The next `cap` pushes will collectively pay for the `cap`-element copy when growth happens; hence amortized `O(1)` per `push`. A symmetric argument applies to halving (with hysteresis) if implemented carefully.

## Implementation Details or Trade-offs

### Growth factor

- **×2 (doubling):** classical; minimizes the number of resizes (`O(log N)` resizes for `N` pushes).

- **×1.5:** reduces peak memory but increases the number of resizes; still amortized `O(1)`.

- **Exact fits:** avoid (linear-time behavior due to frequent resizes).


### Shrinking policy

- **No auto-shrink:** avoids thrash; use `trimToSize()` explicitly.

- **Halve when `top ≤ cap/4`:** introduces **hysteresis** (growth at full, shrink when ≤ 25%), preventing oscillation.

- **Move semantics:** for large objects, prefer moving handles/references rather than deep copies on resize.


### Error handling & API surface

Define clear behavior for:

- `pop/peek` on empty → return status + out-param, throw exception, or sentinel (language-dependent).

- `push` allocation failure → propagate error; do not partially modify state.

- Optional: batch operations (`pushAll`, `popN`) to reduce bounds checks overhead.


### Type considerations

- **Value types (POD):** direct storage is fastest; copying cost matters on resize.

- **Reference/handle types:** store pointers/indices; may require destructor/finalizer awareness on pop and during shrink/grow.


### Memory & concurrency

- **Allocator:** frequent resizes allocate large blocks; using growth-friendly allocators reduces [[cs/systems/memory-allocators-and-fragmentation|fragmentation]].

- **Concurrency:** a plain array stack is **not** thread-safe. For multi-producer/consumer use cases, guard with a [[cs/systems/concurrency-primitives|mutex]] or adopt specialized concurrent stacks. Lock-free designs on arrays exist but are nontrivial (ABA issues, hazard pointers).


### Diagnostics

Add **assertions** in debug builds:

- `0 ≤ top ≤ cap` after every public method.

- On `peek/pop`, assert `top > 0`.

- On `push`, assert capacity or that `grow()` succeeded.


## Practical Use Cases

- **Expression evaluation:** operands stack for postfix (RPN) evaluators; operator stack in shunting-yard parsing.

- **Backtracking/undo:** store inverse operations and pop to revert state.

- **Algorithmic recursion elimination:** iterative DFS, tree traversals, and state machines.

- **VM/interpreters:** evaluation stacks (values, return addresses).


## Limitations / Pitfalls

> [!warning]
> **Underflow/overflow.** Always guard `pop/peek` on empty and `push` on full (pre-grow). In unsafe languages, missing checks cause UB.

> [!warning]
> **Thrashing due to eager shrink.** Shrinking at `top == cap/2` can oscillate on alternating push/pop patterns. Use a **¼ threshold** (or disable auto-shrink).

> [!warning]
> **Large-object copies on resize.** Copying big structs can dominate time. Store **references** or use **move semantics** to keep resizes cheap.

> [!warning]
> **Iterator invalidation.** Any resize invalidates raw pointers/iterators into `A`. Avoid exposing internals or document invalidation rules.

## Summary

An array-backed stack offers a **simple, fast, and cache-efficient** LIFO container. With `top` as the element count and geometric growth on demand, pushes are **amortized `O(1)`**, while pops and peeks are **`O(1)`**. Thoughtful policies for growth and (optional) shrink, plus clear underflow/overflow semantics, yield a robust implementation suitable for parsers, evaluators, backtracking, and recursion elimination. Prefer arrays when you want performance and predictable locality; consider linked stacks only when per-operation allocations are acceptable and you need pointer-stable nodes.

## Related Notes

- [[cs/dsa/stack|Stack]]

- [[cs/dsa/push-and-pop-operations|Push & Pop Operations]]

- [[cs/dsa/stack-using-linked-list|Stack Using Linked List]]

- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]
