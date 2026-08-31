---
title: Types of Binary Tree
description: Full, complete, perfect, and balanced binary trees, with precise definitions, examples, and how the properties relate.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
---

## Overview
Binary trees come in many flavors: **full (proper)**, **complete**, **perfect**, and **balanced**. Each imposes structural constraints that affect height, memory layout, and operation costs. Understanding these definitions and how they interact prevents ambiguous claims (“this tree is balanced”) and helps choose or prove properties of data structures like heaps, BSTs, and search indexes.

> [!note]
> A **binary tree** restricts each node to at most two children: `left` and `right`. See [[cs/dsa/binary-tree|Binary Tree]] for fundamentals and [[cs/dsa/tree-traversal|Tree Traversal: Overview]] for visiting orders.

## Motivation
- **Performance guarantees:** Balanced forms bound height to `Θ(log n)`, yielding [[cs/math/logarithms-and-exponentials|logarithmic]] search/update in BST-like structures.
- **Memory/layout:** Complete trees admit **array layouts** with simple index formulas (heaps).
- **Reasoning & proofs:** Clear terminology avoids mixing incompatible properties (e.g., “full” vs “complete”).

## Definition and Formalism
Let `n` be the number of nodes and `h` the **height** (length in edges on the longest root-to-leaf path), with the convention `height(leaf)=0` and `height(empty)=-1`.

- **Full (proper) binary tree:** Every **internal** node has **exactly two** children. Leaves may appear at different depths.  
  - Example shapes:  
    ```
        •            •
       / \          / \
      •   •        •   •
                 / \
                •   •
    ```
- **Complete binary tree:** All levels are completely filled **except possibly the last**, which is filled from **left to right** without gaps.  
  - Precisely the shape used by **heaps** (array index formulas apply).
- **Perfect binary tree:** All internal nodes have two children **and** all leaves are at the **same depth**.  
  - Exact counts: `n = 2^{h+1} − 1` and leaves `L = 2^h`.
- **Balanced (height-bounded) binary tree:** Informally, one whose height is `Θ(log n)`. **Formalisms vary by scheme:**
  - **AVL**: for every node, `|height(left) − height(right)| ≤ 1`.
  - **Red–black**: a BST with a coloring invariant; every root-to-leaf path has the same **black-height**. Guarantees `h ≤ 2 ⌊log2(n+1)⌋`.
  - **Weight-balanced** (e.g., scapegoat trees): subtree sizes are bounded by ratios.
  - **Treaps/splay**: achieve *expected* or *amortized* logarithmic height/operations (probabilistic/self-adjusting balance).

> [!warning]
> “Balanced” **is not** a single canonical property. Always state *which* balancing scheme or height bound you mean.

## Shape Comparison

![Four binary tree types compared: full, complete, perfect, and degenerate with node counts, heights, and property annotations](cs/dsa/assets/bintree-types.svg)

Each panel shows a minimal witness tree with its Full / Complete / Perfect classification. Note that **Perfect ⇒ Full ∧ Complete**, but neither Full nor Complete alone implies the other.

## Properties and Relationships
- **Implications:**
  - Perfect ⇒ Full **and** Complete.  
  - Complete ⇏ Full (last level can be partially filled).  
  - Full ⇏ Complete (levels can be uneven).  
  - Any of {Full, Complete, Perfect} do **not** alone imply “balanced,” though Perfect has `h = ⌊log2(n)⌋` and Complete also has `h = ⌊log2(n)⌋`.
- **Height bounds:**
  - **Perfect:** `h = ⌊log2(n)⌋`.  
  - **Complete:** `h = ⌊log2(n)⌋`.  
  - **AVL:** `h ≤ c · log2(n+1)` with `c ≈ 1.44` (tight bound using Fibonacci-like recurrences).  
  - **Red–black:** `h ≤ 2 · ⌊log2(n+1)⌋`.  
  - **Degenerate (path):** `h = n − 1`.
- **Leaf/internal counts (full trees):** In a **full** binary tree, `#leaves = #internal + 1`.  
  Proof sketch: Sum of out-degrees is `n − 1`; full internal nodes each contribute 2, so `2I = n − 1` with `n = I + L` ⇒ `L = I + 1`.
- **Array layout (complete trees):** With 0-based indexing, parent/child indices satisfy:
  - `left(i) = 2i + 1`, `right(i) = 2i + 2`, `parent(i) = ⌊(i − 1)/2⌋`.  
  This **requires** completeness to avoid holes; see [[cs/dsa/binary-heap|Binary Heap]].

> [!tip]
> When proving logarithmic time for heap or BST variants, reduce to a **height bound** using the tree’s structural/ balance invariant, then show the algorithm’s path length is `O(h)`.

## Implementation or Practical Context
- **Heaps (priority queues):** Require **complete** binary shape; do not need “full” or “perfect.” Array representation minimizes pointers and improves [[cs/systems/memory-hierarchy-and-caching|cache locality]]. See [[cs/dsa/heaps|Heaps: Overview]] and [[cs/dsa/heapify|Heapify]].
- **Balanced BSTs (maps/sets):** Need **height-bounded** trees. Choices:
  - **AVL**: tighter height ⇒ faster lookups; more rotations on updates.
  - **Red–black**: looser bound but fewer rotations; common in libraries.
  - **Splay**: no explicit height invariant; **amortized** logarithmic access; good locality for skewed access patterns. See [[cs/dsa/avl-tree|AVL Tree]], [[cs/dsa/rb-tree|Red–Black Tree]], [[cs/dsa/splay-tree|Splay Tree]].
- **Memory/layout trade-offs:**
  - **Pointer-based** nodes are flexible but may be cache-inefficient on large trees.
  - **Array-based** layouts exploit completeness; random access and sequential scans are fast.
- **Static vs dynamic:** For static, read-mostly data, building a **perfect** or nearly complete shape can maximize cache performance and allow binary-search-like traversals over arrays.

## Common Misunderstandings
> [!warning]
> **“Full = all levels filled.”** No: **full** means every internal node has **two** children; levels can still be ragged. “All levels filled” is part of **complete** or **perfect** definitions.

> [!warning]
> **“Complete implies perfect.”** False. A complete tree’s last level may not be full; perfect *requires* all leaves at the same depth.

> [!warning]
> **“Balanced means AVL.”** “Balanced” is ambiguous. It might mean AVL balance (`|Δheight| ≤ 1`), red–black constraints, weight balance, or simply `h = Θ(log n)`. State the scheme.

> [!warning]
> **Using heap index formulas on non-complete trees.** Sparse shapes break `2i+1/2i+2` relations and waste memory.

> [!warning]
> **Depth vs height off-by-one.** Adopt consistent conventions: `height(leaf)=0`, `height(empty)=-1`, `depth(root)=0`. See [[cs/dsa/trees|Trees: Overview]].

## Example: Height Bounds by Type
Consider the following node counts and the implied heights:

- `n = 1` ⇒ perfect & complete ⇒ `h = 0`.
- `n = 10`:
  - **Perfect** lower bound: `h ≥ ⌈log2(10+1)⌉ − 1 = 3`.  
  - **Complete**: `h = ⌊log2(10)⌋ = 3`; completeness fixes the height, since the first three levels hold 7 nodes and the remaining 3 all sit on level 3.  
  - **AVL**: `h ≤ ⌊1.44 · log2(11)⌋ = 4` (tight-ish).  
  - **Red–black**: `h ≤ 2 · ⌊log2(11)⌋ = 6`.
- `n = 2^{h+1} − 1` ⇒ perfect with height `h`; any missing leaf at the last level makes it **complete** but not perfect.

![Height bounds by tree type: perfect (lower), AVL (middle), red-black (upper), and worst-case h=n-1](cs/dsa/assets/bintree-height-bounds.svg)

## Balanced Families (At a Glance)
- **AVL Trees:** Strict local balance via height differences. Guarantees `h ≤ 1.44 log2(n+2) − 1.328` (classical bound). Excellent lookup times; rotations on updates may be more frequent.
- **Red–Black Trees:** Color invariant ensures paths differ in length by at most a factor of 2. Ubiquitous in standard libraries due to good update performance and simpler invariants.
- **Splay Trees:** No static bound on height, but *amortized* `O(log n)` access; excels on temporal locality and access sequences.
- **Weight-/Size-balanced:** Keep subtree sizes within fixed ratios; provide deterministic `O(log n)` with simpler implementations in some cases.

> [!tip]
> If you need **stable worst-case** `O(log n)` *and* minimal update overhead, red–black is often a pragmatic default. If you need near-optimal lookup height (read-heavy), AVL can shine.

## Broader Implications
- **Asymptotics from structure:** Bounding `h = Θ(log n)` generally implies logarithmic-time search/insert/delete along root-to-leaf paths in BST-like trees.
- **Cache and SIMD:** Nearly complete or perfect layouts are friendlier to prefetching and can accelerate range queries with contiguous memory.
- **Parallelism:** Subtree independence enables parallel traversals; perfect/complete trees simplify work partitioning by levels.

## Summary
Binary-tree “types” encode **shape constraints**:
- **Full (proper):** every internal node has **two** children.
- **Complete:** all levels full except possibly the last, filled left to right (heap-friendly).
- **Perfect:** both full and leaves at the **same** depth (tightest `h = ⌊log2(n)⌋`).
- **Balanced:** umbrella for height-bounded schemes (AVL, red–black, etc.), aiming for `h = Θ(log n)`.

Know which property you need: **complete** for heaps and array layouts, **balanced** for logarithmic operations in BSTs, **perfect** mainly as a theoretical ideal. Use precise definitions to avoid ambiguity and to translate structure into performance guarantees.

## See also
- [[cs/dsa/binary-tree|Binary Tree]]
- [[cs/dsa/heaps|Heaps: Overview]]
- [[cs/dsa/avl-tree|AVL Tree]]
- [[cs/dsa/rb-tree]]

## Sources

- Binary tree, Wikipedia. https://en.wikipedia.org/wiki/Binary_tree . Backs the four definitions this note turns on: full (proper) as a tree in which every node has either 0 or 2 children, complete as one in which every level except possibly the last is completely filled with the last level's nodes as far left as possible, perfect as one in which all interior nodes have two children and all leaves have the same depth, and degenerate as one in which each parent has only one child. It also backs the implication chain, stating that a perfect binary tree is a full binary tree and that a perfect tree is therefore always complete while a complete tree is not always perfect, plus the perfect-tree counts `n = 2^{h+1} − 1` and `L = 2^h`, the `l = i + 1` leaf relation for full trees, the convention that a tree consisting of only a root has height 0, and the `2i+1`/`2i+2`/`⌊(i−1)/2⌋` array layout.
- complete binary tree, NIST Dictionary of Algorithms and Data Structures. https://xlinux.nist.gov/dads/HTML/completeBinaryTree.html . Backs the corrected complete-tree height. The entry states that a complete binary tree of height `n` has `2^k` nodes at every depth `k < n` and between `2^n` and `2^{n+1} − 1` nodes altogether, which pins the height of a complete tree on `n` nodes to exactly `⌊log2(n)⌋` rather than leaving it free to be one larger.
- Binary heap, Wikipedia. https://en.wikipedia.org/wiki/Binary_heap . Independently backs the same correction, stating that the height of the heap is `⌊log n⌋`, a heap being by its shape property a complete binary tree. Also backs the Implementation section's claim that heaps require the complete shape and nothing stronger, and that the array form needs no pointers.
- full binary tree, NIST Dictionary of Algorithms and Data Structures. https://xlinux.nist.gov/dads/HTML/fullBinaryTree.html . Backs the definition of a full binary tree as one in which each node has exactly zero or two children, together with the recorded alias proper, and so backs the Common Misunderstandings warning that full does not mean all levels are filled.
- perfect binary tree, NIST Dictionary of Algorithms and Data Structures. https://xlinux.nist.gov/dads/HTML/perfectBinaryTree.html . Backs the perfect definition as all leaves at the same depth with all internal nodes of degree 2, the `2^{n+1} − 1` node count for height `n`, and the warning that terminology is contested here, since the entry records that some authors call this shape "complete" and others call it "full".
- balanced tree, NIST Dictionary of Algorithms and Data Structures. https://xlinux.nist.gov/dads/HTML/balancedtree.html . Backs the central warning that balanced is not one canonical property: the entry defines it as a tree where no leaf is much farther from the root than any other, and states outright that different balancing schemes allow different definitions of "much farther", listing BB(alpha), height-balanced, B-tree, AVL and red-black as separate schemes.
- AVL tree, Wikipedia. https://en.wikipedia.org/wiki/AVL_tree . Backs the AVL balance invariant that the heights of the two child subtrees of any node differ by at most one, and the classical height bound. The article gives `log2(n+1) ≤ h < log_phi(n+2) + b` with `b ≈ −0.3277` for `h` counted in levels, which is the `h ≤ 1.44 log2(n+2) − 1.328` quoted here once converted to this note's edge-counting height convention, and attributes the tightness to the fact that an AVL tree of height `h` holds at least `F_{h+2} − 1` nodes.
- Red-black tree, Wikipedia. https://en.wikipedia.org/wiki/Red%E2%80%93black_tree . Backs the red-black entries: the black-height invariant that every root-to-leaf path contains the same number of black nodes, the resulting guarantee that the path to the farthest leaf is no more than twice the path to the nearest, and the height bound, given here as `log2(n+1) ≤ h ≤ 2 log2(n+2) − 2` with the article noting the widespread CLRS form `h < 2 log2(n+1)` that this note uses.
- Scapegoat tree, Wikipedia. https://en.wikipedia.org/wiki/Scapegoat_tree . Backs the weight-balanced row: an alpha-weight-balanced node is one where `size(left) ≤ alpha*size(node)` and `size(right) ≤ alpha*size(node)`, so balance is stated as a ratio on subtree sizes, with worst-case `O(log n)` lookup and amortised `O(log n)` update.
- Splay tree, Wikipedia. https://en.wikipedia.org/wiki/Splay_tree . Backs the splay row: no static height invariant, worst-case height `O(n)`, amortised `O(log n)` for insertion, lookup and removal, and better-than-logarithmic behaviour on access patterns with temporal locality.
- Tree (abstract data type), Wikipedia. https://en.wikipedia.org/wiki/Tree_%28abstract_data_type%29 . Backs the height and depth conventions declared in the Definition and Formalism section and repeated in the final warning: leaf height zero, root depth zero, and empty-tree height `−1`.
