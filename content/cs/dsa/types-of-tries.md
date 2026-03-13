---
title: Tries — Types
description: Standard (explicit-edge), compressed/radix (path-compressed), and suffix tries—trade-offs in memory, depth, and operations.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
# - path-compression.svg — Show a standard trie with a long single-child chain compressed into a single labeled edge ("international" → "inter" + "national").
# - suffix-trie-fanout.svg — Suffix trie for "banana$" highlighting all suffix starts and duplicated substrings via shared paths.
---

## Overview
**Tries** come in several practical flavors that address the core trade-off between **operation cost** in key length and **memory footprint**:
- **Standard trie (explicit-edge):** one edge per symbol; depth is the key length; simple and fast but memory-heavy on sparse nodes.
- **Compressed (radix/Patricia) trie:** merges **single-child chains** into **edge labels** (strings), reducing depth and node count while preserving prefix semantics.
- **Suffix trie:** inserts **every suffix** of a text; supports substring queries via prefix search on suffixes, at the cost of **quadratic space** in the worst case.

This note contrasts the three, clarifying when each is appropriate and what invariants must hold to keep operations correct.

> [!note]
> Operation costs in tries are typically `Θ(L)` where `L` is the key length, independent of the number of stored keys `n` (assuming a bounded alphabet and efficient child lookup). Compressed variants aim to keep the *constant factors* and *depth* smaller without changing big-O.

## Motivation
- **Standard tries** shine when keys are short, the alphabet is small, and prefix queries dominate (e.g., command dispatch, small dictionaries).
- **Compressed tries** mitigate memory blow-ups for long keys with common prefixes (e.g., URLs, filesystem-like paths, language tokens).
- **Suffix tries** enable fast **substring** and **pattern** queries over a single text, useful for pedagogy or tiny inputs, but are usually replaced in practice by **suffix trees**/arrays due to space.

## Definition and Formalism
Let `Σ` be the alphabet and `S` a set of keys.

### Standard (explicit-edge) trie
- Each edge is labeled by **one symbol** `c ∈ Σ`.
- Each node corresponds to a **prefix** of some key(s).
- A node carries a **terminal** marker (and optional value) if a key ends at that prefix.
- Depth equals the number of symbols consumed from the root.

### Compressed (radix/Patricia) trie
- Any maximal path of nodes with **out-degree 1** is **contracted** into a single edge labeled by a **string** over `Σ`.
- Search consumes edge labels possibly **partially**; if a mismatch occurs in the middle of a label, the key is absent.
- The set of **explicit branching points** is preserved; depth becomes the number of **branching segments**, not raw characters.

### Suffix trie (of a single text `T` with sentinel `$`)
- Insert all suffixes `T[i..]` for `i=0..|T|`.
- Any **substring** `T[i..j]` is a **prefix** of some suffix and thus corresponds to a path from the root.
- Worst-case size is `Θ(|T|^2)` nodes/edges for large alphabets (many repeated contexts).

> [!tip]
> Always append a **unique sentinel** symbol `$` that does not appear in `T` when building suffix variants. It ensures that no suffix is a prefix of another and simplifies terminal handling.

## Example or Illustration
Consider keys `{to, tea, ted, ten, in, inn}` over lowercase ASCII.

- **Standard trie:** Path labels are single characters: root→`t`→`e` branches to `a/d/n`. Depth equals key length (2–3). Node count grows with every new character that diverges.
- **Compressed trie:** The chain `t → e → a` can remain separate from `t → e → d` by labeling edges `"te"` then `"a"`/`"d"`/`"n"`, or by compressing `"to"` as a single edge from `t`. Node count drops; search compares **substrings** per edge.
- **Suffix trie** (for `"banana$"`): Insert `$`, `a$`, `na$`, `ana$`, `nana$`, `anana$`, `banana$`. Substring `"ana"` appears as a path multiple times via different suffix starts.

> [!example]
> **Diagram (`path-compression.svg`)** — Show a long single-child run (“inter…” keys) collapsed into one edge `"inter"`, with a branch at `"national"` vs `"net"`.

## Properties and Relationships
- **Depth and branching:**
  - Standard depth = key length `L`.
  - Compressed depth = number of **branch points** on the path; often `≪ L` with shared prefixes.
  - Suffix depth can be large due to many starting positions; branching reflects repeated substrings.
- **Space:**
  - Standard: `Θ(∑ L_i)` nodes/edges in the worst case; multiplied by alphabet representation at each node.
  - Compressed: reduces node count to roughly the number of **distinct prefixes/branch points**; stores edge labels (substrings) instead of per-character chains.
  - Suffix: `Θ(|T|^2)` worst-case space; pedagogically clear but impractical at scale.
- **Operations:**
  - **Lookup/insert/delete:** remain `Θ(L)` but compressed tries compare **runs** of characters (may be faster in practice due to fewer pointer traversals).
  - **Prefix enumeration:** identical semantics; compressed tries enumerate by descending through labeled edges, concatenating labels.
  - **Substring queries:** suffix tries support `contains(pattern)` in `Θ(|pattern|)` by routing through the pattern as a prefix of some suffix.
- **Alphabet handling:** Large `|Σ|` magnifies memory in standard tries if nodes use dense arrays; compressed tries still benefit from **sparse maps** at branch points.

## Implementation or Practical Context
### Standard trie (explicit-edge)
- **Children representations:** fixed arrays (fast, memory-heavy), hash maps (space-efficient, unordered), ordered maps (lexicographic iteration).
- **Best for:** small alphabets, relatively short keys, heavy prefix ops (e.g., command trees, small dictionaries).
- **Memory tips:** hybrid node types (dense for high degree, sparse for low); arena allocators for locality.

### Compressed (radix/Patricia)
- **Edge labels:** store `(startIndex, length)` into a shared string pool rather than copying substrings; keeps memory flat and cache-friendly.
- **Search routine:** compare as many characters as match along the current **edge label**; if fully matched, continue; if mismatch at position `k`, split label into prefix/suffix segments when inserting.
- **Deletion:** may require **edge concatenation** to restore compression when a node’s degree falls to 1.
- **Best for:** long keys with shared prefixes (URLs, file paths, tokens), memory-sensitive autocomplete.

### Suffix trie
- **Construction:** naive `O(|T|^2)` inserts; space `Θ(|T|^2)`. For real systems, prefer **suffix trees** (compressed suffix tries in `Θ(|T|)` space) or **suffix arrays** with LCP.
- **Use cases:** teaching substring search concepts; tiny corpora; quick prototypes when memory is not a concern.
- **Caveat:** for multi-string dictionaries, suffix tries of each key are rarely wanted; use [[standard-trie|Standard Trie]] or [[compressed-trie|Compressed Trie]] instead.

> [!note]
> Compressed tries and suffix **trees** are conceptually similar: both use **edge-label strings** and **path compression**. The difference is what is being indexed (arbitrary key set vs all suffixes of one text) and the associated construction algorithms and space bounds.

## Common Misunderstandings
> [!warning]
> **“Radix tries change big-O of lookup.”** No—the big-O in key length remains `Θ(L)`. They reduce *depth* and *pointer traversals*, often improving constants.

> [!warning]
> **“Suffix tries are practical for large texts.”** They are not; space is quadratic in the worst case. Use a **suffix tree** or **suffix array**.

> [!warning]
> **“Compression breaks prefix queries.”** Not if implemented correctly. Matching proceeds **within edge labels**; a split occurs only when inserting mismatching characters.

> [!warning]
> **“Dense arrays are always faster.”** With large alphabets or low branching factors, dense arrays waste memory and degrade cache behavior; hybrid/sparse children often win.

## Broader Implications
- **Data-engineering fit:** Domain-specific **normalization** (case-folding, tokenization to bytes) shrinks effective `|Σ|`, improving both memory and speed for all trie variants.
- **Persistence and versioning:** Path-copying tries (standard or compressed) enable **immutable** versions with structural sharing—useful for configuration maps and IDE index snapshots.
- **Ranking and top-k:** Augment nodes with `subtreeWeight` or frequency counters to support ranked autocomplete; costs apply equally to standard and compressed structures.

## Summary
- Use a **Standard Trie** for straightforward, prefix-heavy workloads with small alphabets and moderate key lengths.
- Choose a **Compressed (Radix/Patricia) Trie** when keys are long and share prefixes; expect fewer nodes and traversals while preserving `Θ(L)` operations.
- Reserve **Suffix Tries** for educational demos or tiny inputs; at scale, switch to suffix **trees/arrays**.

The right choice hinges on alphabet size, key length/distribution, memory budget, and query mix (exact, prefix, substring). All retain the trie hallmark: predictable, prefix-aware behavior that general-purpose maps cannot match.

## See also
- [[standard-trie|Standard Trie]]
- [[compressed-trie|Compressed Trie]]
- [[suffix-trie|Suffix Trie]]
- [[tries|Tries — Overview]]