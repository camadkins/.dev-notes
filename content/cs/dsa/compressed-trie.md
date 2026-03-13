---
title: Compressed Trie  
description: A compact prefix tree that stores maximal shared substrings on edges to reduce height and pointer overhead while preserving lexicographic order.  
draft: false
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:
# - compressed-trie-edge-labels.svg — Example trie with multi-character edge labels after path compression; highlight shared prefixes collapsing single-child chains.
# - edge-split-on-insert.svg — Show insertion that splits an edge at first mismatch, introducing a mid node and two outgoing edges (old tail + new suffix).
# - compare-standard-vs-compressed.svg — Side-by-side: standard trie vs compressed trie built from same keys; annotate node/edge counts and heights.
# - radix-critbit-variants.svg — Sketch radix-array (per-byte) vs crit-bit (first differing bit) branching strategies.
---

## Overview

A **compressed trie** (radix/Patricia variant) is a prefix tree that **compresses single-child paths** by storing **maximal substrings on edges** instead of single characters. This reduces height and pointer hops while preserving lexicographic order, exact lookup, and prefix search.

## Structure Definition

- **Nodes:** Branch points and/or key terminals with a boolean `is_key`.
    
- **Edges:** Each outgoing edge has a **non-empty substring label**; siblings’ first characters differ.
    
- **Ordering:** Children are organized to respect lexicographic order.
    
- **Compression invariant:** No node has exactly one child unless it is marked `is_key`; otherwise the chain is stored in the incoming edge label.
    

> [!example]  
> **Diagram (`compressed-trie-edge-labels.svg`)** — Build a small dictionary (e.g., `bear, bell, bid, bull, buy, sell, stock, stop`) and show how single-character chains become multi-character edge labels like `"be"`, `"bu"`, `"st"`.

## Core Operations

Let `edge(u, c)` be the child edge from `u` whose label begins with character `c`. Let `L` be an edge label and `|L|` its length.

### Search(key)

```pseudo
function SEARCH(root, key):
    u = root; i = 0
    while i < |key|:
        e = edge(u, key[i])
        if e == null: return NOT_FOUND
        L = e.label
        k = longest_common_prefix_len(key, i, L, 0)
        if k < |L|: return NOT_FOUND     // diverged inside edge label
        i = i + k
        u = e.child
    return (u.is_key ? FOUND : NOT_FOUND)
```

### Insert(key)

```pseudo
function INSERT(root, key):
    u = root; i = 0
    while i < |key|:
        e = edge(u, key[i])
        if e == null:
            create_edge(u, key[i..], new_node(is_key=true))
            return INSERTED_NEW
        L = e.label
        k = longest_common_prefix_len(key, i, L, 0)
        if k == |L|:
            i = i + k; u = e.child; continue
        // split at k
        mid = new_node(is_key=false)
        replace_edge(u, L[0]) with edge(u, L[0..k], mid)
        create_edge(mid, L[k], e.child, label=L[k..])   // old tail
        if i + k == |key|:
            mid.is_key = true
        else:
            create_edge(mid, key[i+k], new_node(is_key=true), label=key[i+k..])
        return INSERTED_NEW
    if u.is_key: return ALREADY_PRESENT
    u.is_key = true
    return INSERTED_NEW
```

> [!example]  
> **Diagram (`edge-split-on-insert.svg`)** — Start with an edge labeled `"bell"` under `"be"`. Insert `"belt"`: split after the shared `"bel"`, create a mid node, keep old tail `"l"` to the old child, and add new branch `"t"`.

### Delete(key)

```pseudo
function DELETE(root, key):
    (found, u, stack) = SEARCH_WITH_STACK(root, key)
    if not found: return NOT_FOUND
    u.is_key = false
    // compress upward while a non-terminal has exactly one child
    while u != root and u.is_key == false and u.child_count == 1:
        v = only_child(u)
        merge_edge_labels(parent_of(u), edge_from_parent(u), u, v)
        u = parent_of(u)
    return DELETED
```

## Example or Trace

**Keys:** `["bear", "bell", "bid", "bull", "buy", "sell", "stock", "stop"]`

- From the root, two branches labeled `"b"` and `"s"`.
    
- Under `"b"`, children compress to `"be"`, `"bi"`, `"bu"`.
    
- Inserting `"belt"` against `"bell"` triggers a mid-node split at `"bel"` (as illustrated above).
    
- A longest-prefix query for `"stu"` follows `"s" → "t"` and stops before `"sto"`; completions live under the `"st"` locus.
    

> [!example]  
> **Diagram (`compare-standard-vs-compressed.svg`)** — Left: standard trie showing per-character nodes. Right: compressed trie with multi-character edges; annotate reduced height and node count.

## Complexity Analysis

- **Space:** `O(L + n)` characters plus metadata; typically far smaller than a standard trie (`L` = total key length, `n` = number of keys).
    
- **Search / Insert / Delete:** `O(m)` in key length `m` (each step consumes ≥1 character; splits/merges are local).
    
- **Prefix enumeration:** `O(k + output)` where `k` is prefix length.
    

## Optimizations or Variants

- **Branching representation:** ordered map (flexible), radix array (fast, higher fan-out), crit-bit (branch at first differing bit for byte strings).
    
- **Small-label inline:** store very short labels inline within the edge to remove an indirection.
    
- **Persistent version:** for immutable snapshots, share unchanged subtrees and allocate new nodes on updates.
    

> [!example]  
> **Diagram (`radix-critbit-variants.svg`)** — Two subpanels: (1) radix-array node with 256 slots keyed by byte; (2) crit-bit node storing index of first differing bit and two child pointers.

## Applications

- Autocomplete and prefix search
    
- Longest-prefix match (routing-like lookups)
    
- Symbol tables / compiler tooling
    
- Compact in-memory or memory-mapped dictionaries
    

## Common Pitfalls or Edge Cases

> [!warning]  
> **Edge-split correctness:** Always create a mid node, move the old child onto the tail label, and set `is_key` if the key ends at the split.

> [!warning]  
> **Normalization:** Case/Unicode normalization should happen _before_ insertion; otherwise common prefixes won’t align and compression suffers.

## Implementation Notes or Trade-offs

- **Ownership & lifetime:** Prefer arenas to avoid fragmentation and to enable bulk teardown; document slice lifetimes if labels reference packed storage.
    
- **Determinism:** For reproducible builds, define a stable child ordering and avoid RNG-dependent tie-breakers.
    
- **Iteration:** Preorder traversal yields lexicographic order if children are ordered by first character.
    

## Summary

Compressed tries **collapse single-child paths into edge labels**, giving shorter height and fewer pointer hops while preserving trie semantics (exact lookup, prefix queries, ordered iteration). Correctness hinges on **edge-split logic** and **post-delete re-compression**; performance depends on label storage and branching representation.

## See also

- [[standard-trie|Standard Trie]]
    
- [[ternary-search|Ternary Search]]
    
- [[hash-tables|Hash Tables]]
    
- [[strings|Strings]]