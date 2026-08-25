---

title: Maps & Hash Tables
description: Key→value dictionary ADT and its fast hash-table implementations; collision strategies, load factor control, and practical hashing.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-06
aliases: []

---

## Overview

A **map** (a.k.a. **dictionary**, **associative array**) stores **(key → value)** bindings with operations:

- `put(k, v)`, `get(k)`, `contains(k)`, `remove(k)`, and iteration over keys/entries.


A **hash table** implements maps by applying a **[[cs/security/cryptographic-hash-functions|hash function]]** `h(k)` to locate a bucket or slot. With a good hash and a controlled **load factor** `α = n / m` (items per table slot), hash tables deliver **expected** `O(1)` time for search, insert, and delete.

Two classic collision strategies:

1. **Separate chaining** - each table slot points to a **bucket** (often a linked list or small dynamic array).

2. **Open addressing** - all items live **in the array**; on collision, probe alternative slots (linear/quadratic probing or double hashing).


## Motivation

Maps are everywhere: symbol tables in compilers, [[cs/networking/routing-and-longest-prefix-match|routing tables]], caches, JSON/object property stores, and set membership (a map with dummy value `true`). Hashing gives **amortized constant-time** performance with simple memory layouts and is the default general-purpose dictionary in most languages.

## Definition and Formalism

**Map ADT operations**

- `put(k, v)` - Insert or overwrite.

- `get(k)` - Return `v` or indicate **not found**.

- `remove(k)` - Delete binding if present.

- `size()` / `isEmpty()`, iteration.


**Hash table core**

- `h: Keys → {0..m-1}` distributes keys across `m` slots.

- **Collision** occurs when multiple keys share an index; resolution strategy and `α` determine cost.


**Expected bounds (informal)**

- With uniform hashing and `α` kept bounded (e.g., `α ≤ 0.75`), operations are **expected `O(1)`**.

- Worst cases are `O(n)` (e.g., adversarial keys, no resize), but good designs make these rare in practice.


## Collision Resolution Strategies

### 1) Separate chaining (with linked lists or small vectors)

Each `T[i]` holds a pointer to a bucket container.

```pseudo
function PUT_CHAIN(T, k, v):
    i = hash(k) mod m
    for (key, val) in T[i]:        // iterate bucket
        if key == k:
            val = v
            return
    append (k, v) to T[i]
    n = n + 1
    if n / m > LOAD_MAX: RESIZE_CHAIN(T)

function GET_CHAIN(T, k):
    i = hash(k) mod m
    for (key, val) in T[i]:
        if key == k: return val
    return NOT_FOUND

function REMOVE_CHAIN(T, k):
    i = hash(k) mod m
    if erase (k, *) from T[i]:     // unlink from bucket
        n = n - 1
```

- **Expected costs** with well-spread `h`:

    - `E[search] ≈ 1 + α` node inspections (short lists).

- **Bucket choices:** linked lists (simple deletes), or small vectors (better cache locality for tiny buckets).


> [!tip]
> For small `α` (e.g., ≤ 1), using a **tiny dynamic array** per bucket often beats linked lists due to cache locality.

### 2) Open addressing

Store entries in `T[0..m-1]` directly; on collision, follow a **probe sequence**:

- **Linear probing:** `i, i+1, i+2, …` (mod `m`) - fast, but causes **primary clustering**.

- **Quadratic probing:** `i + 1², i + 2², …` - reduces clustering; needs care to guarantee coverage.

- **Double hashing:** `i + j·h2(k)` - best spread; requires `h2(k)` coprime to `m`.


```pseudo
// Linear probing with tombstones
function PUT_OPEN(T, k, v):
    i0 = hash(k) mod m
    first_tomb = NIL
    for j in 0..m-1:
        i = (i0 + j) mod m
        if T[i] is EMPTY:
            place at (first_tomb != NIL ? first_tomb : i)
            n = n + 1
            if n / m > LOAD_MAX: RESIZE_OPEN(T)
            return
        else if T[i] is TOMBSTONE and first_tomb == NIL:
            first_tomb = i
        else if T[i].key == k:
            T[i].val = v
            return
    RAISE TABLE_FULL

function GET_OPEN(T, k):
    i0 = hash(k) mod m
    for j in 0..m-1:
        i = (i0 + j) mod m
        if T[i] is EMPTY: return NOT_FOUND
        if T[i] is OCCUPIED and T[i].key == k: return T[i].val
    return NOT_FOUND

function REMOVE_OPEN(T, k):
    // mark a tombstone instead of clearing to EMPTY
    i0 = hash(k) mod m
    for j in 0..m-1:
        i = (i0 + j) mod m
        if T[i] is EMPTY: return        // not found
        if T[i] is OCCUPIED and T[i].key == k:
            T[i] = TOMBSTONE
            n = n - 1
            return
```

- **Expected costs** with `α < 0.7`: a **constant** number of probes on average.

- **Deletes** leave **tombstones** to preserve probe chains; periodic **rehash** cleans them.


> [!warning]
> Linear probing is fast but susceptible to clustering. If inputs may be adversarial or highly skewed, prefer **double hashing** or **Robin Hood hashing** (balanced probe lengths).

## Operations & Complexity (at a glance)

|Strategy|Search (expected)|Insert (expected)|Delete (expected)|Notes|
|---|---|---|---|---|
|Separate chaining|`O(1 + α)`|`O(1 + α)`|`O(1 + α)`|Buckets as lists/vectors; deletion is trivial.|
|Open addressing|`O(1)` when `α` kept <~0.7|`O(1)`|`O(1)` with tombstones|Probes grow fast as `α → 1`.|

- **Worst-case** for both can be `O(n)`; resizing and good hashing keep the expected case fast.


## Resizing & Load Factor

When `α = n/m` exceeds a threshold (e.g., **0.75** for chaining, **0.5–0.7** for open addressing), **resize**:

```pseudo
function RESIZE_CHAIN(T):
    newM = next_capacity(m)       // often 2*m (sometimes next prime)
    newT = array of newM empty buckets
    for each bucket B in T:
        for (k, v) in B:
            i = hash(k) mod newM
            append (k, v) to newT[i]
    T = newT; m = newM
```

- **Amortized O(1):** Each key moves only when capacity grows; across many operations, the average cost per `put` stays constant.

- For **open addressing**, rehashing also **drops tombstones**, restoring probe performance.


## Hash Functions & Key Equality

- **Deterministic, well-spread** hashes are essential. For strings, combine characters with a rolling/polynomial scheme; for structs, mix fields with **bitwise** combining (rotate/xor/multiply).

- Avoid trivial hashes (e.g., return constant or a single field) which cause catastrophic collisions.


**Universal hashing (theory)**

- Pick a hash function **at random** from a **universal family** `H` such that for distinct `x≠y`,
    `Pr_{h∈H}[h(x)=h(y)] ≤ 1/m`.

- Prevents adversaries from forcing collisions; expected bucket sizes remain small **for any input**.


**Equality & ordering**

- Hashing relies on **equality** (not ordering). Ensure:

    - If `k1 == k2` then `hash(k1) == hash(k2)` (consistency).

    - Custom `equals` must be reflexive, symmetric, transitive.


> [!tip]
> Many languages provide high-quality default hashes for primitive types. For compound keys, **compose** hashes of fields with a standard mixer (e.g., multiply/xor with odd constants and rotate).

## Implementation Notes or Trade-offs

- **Chaining storage:** Linked lists are simple; small vectors improve locality. For tiny buckets (avg length < 2), vectors often win.

- **Open addressing flavors:**

    - **Linear probing:** fastest in practice at moderate `α`; combine with **Robin Hood** (steal from richer probes) to limit variance of probe lengths.

    - **Quadratic probing:** avoids primary clustering; requires table size and coefficients chosen to guarantee reachability.

    - **Double hashing:** best dispersion; marginally more compute per probe.

- **Table size choices:** Power-of-two sizes make `i = hash & (m-1)` cheap; ensure the hash is well-mixed across low bits. Prime sizes work with `%` but cost more per index.

- **Deletion policy:**

    - Chaining: unlink node (simple).

    - Open addressing: mark **tombstone**; consider full rehash when tombstones exceed a fraction of `m`.

- **Iteration order:** Chaining yields **bucket order** (stable within buckets if vectors). Open addressing yields **array order**, not insertion order.

- **[[cs/systems/concurrency-primitives|Thread safety]]:** Writes need synchronization or striped locks; lock-free schemes exist but are complex.


## Common Pitfalls or Edge Cases

> [!warning]
> **Letting load factor grow.** Performance degrades sharply as `α` approaches 1 (especially for open addressing). Always resize before that.

> [!warning]
> **Bad hash mixing.** Low-entropy or correlated bits funnel keys into few indices → long chains/probe sequences.

> [!warning]
> **Tombstone leaks.** In open addressing, repeated deletes without periodic rehashing create walls of tombstones that slow down every probe.

> [!warning]
> **Equality/hash mismatch.** If two keys compare equal but hash differently, lookups/removes will fail.

> [!warning]
> **Concurrent mutation during iteration.** Iterating while mutating the table leads to missed or duplicated entries unless the iterator is carefully designed.

## Examples

### Example 1 - Separate chaining behavior

Suppose `m=5`, inserting keys with indices (after `mod 5`):
`[0, 2, 2, 4, 0, 1]`.
Buckets grow like:
`T[0] = [(k1, v1), (k5, v5)]`, `T[1] = [(k6, v6)]`, `T[2] = [(k2, v2), (k3, v3)]`, `T[4] = [(k4, v4)]`.
Lookup of `k3` is a fast scan of bucket `T[2]`.

### Example 2 - Linear probing cluster

Table `m=8`, linear probing. Insert at indices: `3,3,3,4,4` → occupied run `[3,4,5]` develops; future inserts that hash to `3–5` will **walk the cluster**, showing **primary clustering**.

## Summary

Maps provide the **dictionary** abstraction; hash tables realize it with **expected O(1)** operations given a good hash and **bounded load factor**. Choose **separate chaining** for simple deletes and predictable behavior with high load, or **open addressing** for tight memory and cache-friendly scans - mind **tombstones** and **clustering**. Resize proactively, pick well-mixed hashes (universal hashing if adversarial input is possible), and align `equals` with hashing. Done right, hash tables are the fastest general-purpose maps in practice.

## Related Notes

- [[cs/dsa/hash-tables|Hash Tables]]

- [[cs/dsa/linked-list|Linked List]]

- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
