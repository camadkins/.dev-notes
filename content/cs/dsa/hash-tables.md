---
title: Hash Tables
description: Key–value dictionaries that provide expected O(1) lookup/insert/delete using hashing, collision handling, and periodic resizing.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-11-15
aliases: []
---

## Overview

A **hash table** stores **key → value** pairs and supports **expected O(1)** `search`, `insert`, and `delete`. It computes an array index from the key using a **hash function** `h(k)`, then resolves **collisions** (two keys mapping to the same index) using either **separate chaining** (lists per bucket) or **open addressing** (probing within the array). Periodic **resizing** keeps the **load factor** small so constant-time performance holds.

## Structure Definition

A hash table consists of:

- A **bucket array** `T[0..m-1]` (capacity `m`).

- A **hash function** `h: Key → {0..m-1}`.

- A **collision policy**:

    - **Separate chaining:** `T[i]` holds a (possibly empty) list/array of entries with hash `i`.

    - **Open addressing:** One entry per slot; on collision, probe other indices in a deterministic sequence.


**Load factor.** `α = n/m`, where `n` is the number of stored keys. For chaining, `α` is expected **average chain length**. For open addressing, `α` must be **< 1**; performance degrades as `α → 1`.

## Core Operations

### Separate chaining (with small vectors/lists per bucket)

```pseudo
function SEARCH(T, k):
    i = h(k) mod m
    for (key, val) in T[i]:
        if key == k: return val
    return NOT_FOUND

function INSERT(T, k, v):
    if LOAD_FACTOR(T) > MAX_ALPHA: RESIZE(T, growth_factor)
    i = h(k) mod m
    for (key, _) in T[i]:
        if key == k:              // update existing
            set value; return
    append (k, v) to T[i]

function DELETE(T, k):
    i = h(k) mod m
    remove first entry with key == k in T[i] (if any)
```

### Open addressing (linear/quadratic/double hashing)

We maintain slots with states: `EMPTY`, `FILLED`, `TOMBSTONE` (deleted).

```pseudo
function PROBE_INDEX(h1, h2, i, m, scheme):
    if scheme == LINEAR:     return (h1 + i)       mod m
    if scheme == QUADRATIC:  return (h1 + c1*i + c2*i*i) mod m
    if scheme == DOUBLE:     return (h1 + i*h2)    mod m   // h2 ≠ 0, coprime to m

function SEARCH(T, k):
    h1 = h(k) mod m
    h2 = h2_fn(k, m)         // for DOUBLE only; otherwise ignore
    for i in 0..m-1:
        j = PROBE_INDEX(h1, h2, i, m, scheme)
        if T[j] == EMPTY:  return NOT_FOUND
        if T[j] is FILLED and T[j].key == k: return T[j].val
    return NOT_FOUND

function INSERT(T, k, v):
    if LOAD_FACTOR(T) > MAX_ALPHA: RESIZE_REHASH(T, growth_factor)
    h1 = h(k) mod m; h2 = h2_fn(k, m)
    first_tomb = NONE
    for i in 0..m-1:
        j = PROBE_INDEX(h1, h2, i, m, scheme)
        if T[j] is FILLED:
            if T[j].key == k: T[j].val = v; return
        else if T[j] is TOMBSTONE and first_tomb is NONE:
            first_tomb = j
        else if T[j] is EMPTY:
            place at (first_tomb if set else j); return

function DELETE(T, k):
    h1 = h(k) mod m; h2 = h2_fn(k, m)
    for i in 0..m-1:
        j = PROBE_INDEX(h1, h2, i, m, scheme)
        if T[j] == EMPTY: return                   // not found
        if T[j] is FILLED and T[j].key == k:
            mark T[j] = TOMBSTONE; return
```

> [!tip]
> For open addressing, **do not** shift elements after a deletion—use a **tombstone** so later probes don't stop early. Tombstones are reclaimed during periodic **rehashing**.

## Example (Stepwise)

**Chaining.** Let `m=5`, keys `{17, 42, 9, 14}` with `h(k)=k mod 5`.
Buckets: `B[0]={}`, `B[1]={}`, `B[2]={17}`, `B[3]={}`, `B[4]={9,14,42}` (after inserts).
Searching `42` inspects `B[2]`? No—`42 mod 5 = 2`? Actually `42 mod 5 = 2`, so it lives in `B[2]` (correcting the example): insert order yields `B[2]={17,42}`, `B[4]={9,14}`. Average chain length `α = n/m = 4/5 = 0.8`.

**Open addressing (linear probing, `m=7`).** Insert keys `{10, 24, 31, 18}` with `h(k)=k mod 7`.

- `10 → 3` goes to slot 3.

- `24 → 3` collides; probe to 4.

- `31 → 3` collides; probe to 5.

- `18 → 4` collides; probe 5 (full), then 6 (place).
    Notice a **cluster** forming at indices `3..6`.

## Complexity and Performance

Assume a good hash function and simple uniform hashing.

- **Expected time:** `search`, `insert`, `delete` are **O(1)** expected for both chaining and open addressing when the load factor `α` is bounded (e.g., `α ≤ 1` for open addressing; `α` modest for chaining).

- **Worst case:** **O(n)** if all keys land in one bucket or if probing scans the entire table (adversarial inputs or poor `h`).

- **Space:** `Θ(m + n)` for chaining (extra node overhead), `Θ(m)` for open addressing (no pointers but must keep `α < 1`).


**Clustering effects (open addressing).**

- **Linear probing** suffers **primary clustering**: contiguous runs get longer.

- **Quadratic probing** mitigates primary clustering but can suffer **secondary clustering** (same `h1` → same probe pattern).

- **Double hashing** reduces both by using a second, key-dependent step size.


## Optimizations or Variants

- **Resizing policies.** Grow `m` when `α > MAX_ALPHA` (e.g., 0.75 for open addressing, 1–2+ for chaining). For chaining, you can also shrink when `α` falls below a threshold to save memory.

- **Cache-friendly chains.** Use **small fixed arrays** ("stash") or a **flat vector** per bucket instead of linked lists to improve locality.

- **Robin Hood hashing** (open addressing). On insert, if the new key's **probe distance** exceeds the resident's, **swap**; evens out cluster depth and reduces variance of search time.

- **Cuckoo hashing.** Maintain two (or more) hash functions and move items between two tables on collisions; gives O(1) lookups and high load but requires relocation logic and a stash for cycles.

- **Hopscotch hashing.** Keeps items near their ideal bucket using bitmaps; excellent locality on CPUs.

- **Instrumentation.** Track average probe length or chain length; trigger rehash before tail latency spikes.


## Applications

- **Dictionaries/maps/sets** in language runtimes (Python dicts, Java HashMap, C++ unordered_map).

- **Memoization** tables in algorithms (e.g., [[cs/dsa/dynamic-programming|Dynamic Programming]] caches).

- **Symbol tables** in compilers/interpreters.

- **Deduplication** (tracking seen IDs), frequency counts, joins in databases (hash join).


## Common Pitfalls or Edge Cases

> [!warning]
> **Poor hash functions.** Simple `h(k)=k mod m` for string-like or patterned keys causes clustering. Prefer **mixed** hash functions with good avalanche properties (e.g., MurmurHash3, xxHash) or **SipHash** for adversarial inputs.

> [!warning]
> **Forgetting equality semantics.** If two keys can be equal, their **hashes must be equal** (consistency with `==`). Also ensure hash depends on the **same fields** as equality.

> [!warning]
> **Changing keys in place.** In open addressing, mutating a key **after** insertion corrupts probe invariants; never modify keys stored in the table.

> [!warning]
> **Deletion without tombstones.** In open addressing, clearing a slot to `EMPTY` breaks probe chains; use `TOMBSTONE` and compact on rehash.

> [!warning]
> **Load factor too high.** As `α → 1` in open addressing, probe lengths blow up. Resize earlier (e.g., target `α ≤ 0.7–0.8`) to keep performance flat.

## Implementation Notes or Trade-offs

### Choosing `m` and hash functions

- Pick `m` as a power of two (bitmask) or a prime near a power of two.

- For power-of-two `m`, **mix** high bits into low bits (e.g., final XOR/rotate) so low bits aren't constant across many keys.

- For **double hashing**, ensure `h2(k)` is **odd** (coprime to `m` for power-of-two `m`) and nonzero to visit all slots.


### Resizing and rehashing

```pseudo
function RESIZE_REHASH(T, growth_factor):
    old = T
    m2  = choose_capacity(ceil(growth_factor * old.m))
    T   = new_table(m2)
    for slot in old:
        if slot is FILLED:
            INSERT(T, slot.key, slot.val)   // rehash with new m
    return T
```

For chaining, rehash all entries bucket by bucket. For open addressing, **avoid** copying raw slots; reinsert each FILLED entry to rebuild proper probe sequences and drop tombstones.

### Memory and locality

- **Chaining:** pointer-based lists hurt locality; prefer small vectors or **intrusive** nodes stored in arenas.

- **Open addressing:** excellent locality (single array), but deletions and high `α` are trickier.

- **Strings/large keys:** store a short **fingerprint** (e.g., 8–16 bits) in the slot to speed disambiguation before full key compares.


### Concurrency

- **Coarse locks** (one lock per table) are simple but contend.

- **Striped locks** (one per bucket range) enable parallelism in chaining.

- **Lock-free** tables exist (specialized), but are complex; start with coarse/striped and measure.


## Summary

Hash tables give near-constant-time operations by mapping keys to array indices and **controlling collisions**. Choose between **chaining** (simpler deletes, tolerant of high `α`) and **open addressing** (better locality, needs careful deletion and lower `α`). A good **hash function**, a sensible **resize policy**, and attention to **probe/chain lengths** keep performance predictable. For heavy-duty workloads, consider modern variants like **Robin Hood** or **cuckoo** hashing to tame tail latencies and improve cache behavior.

## See also

- [[cs/dsa/maps-and-hashtable|Maps and Hashtable]]

- [[cs/dsa/arrays|Arrays]]

- [[cs/dsa/dynamic-arrays|Dynamic Arrays]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
