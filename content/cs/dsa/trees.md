---
title: Trees - Overview
description: Hierarchical structures of nodes and edges; terminology (size, height, degree), variants, and core representations.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
# - rooted-vs-unrooted.svg - Same undirected tree shown once without a root and once with a chosen root; annotate parent/child, depth, height.
# - ordered-vs-unordered.svg - Show children with fixed left-to-right order vs a set with no order; contrast traversals.
# - binary-forms.svg - Perfect vs complete vs full vs degenerate (linked-list-like) binary trees, each with n, h annotated.
# - representations.svg - Pointer nodes, parent array, children arrays, left-child-right-sibling (LCRS), showing memory trade-offs.
---

## Overview
A **tree** is an acyclic, connected structure of nodes joined by edges. Trees model hierarchical relations: file systems, syntax trees, organization charts, dependency graphs, scene graphs, and indexes. Choosing the right **variant** (rooted or unrooted, ordered or unordered, binary or k-ary) and **representation** (pointer-based, arrays, LCRS) affects clarity, memory footprint, and algorithmic complexity.

> [!note]
> In an undirected setting, a “tree” is a connected, acyclic graph. In a rooted setting, a “tree” is a hierarchy with a designated **root** that induces parent–child relations and node **depths**.

## Motivation
Trees provide:
- **Recursive decomposition**: solve on a node using results from its children (postorder DP).
- **Search and ordering**: BSTs and balanced variants (AVL, red–black, splay) maintain order and support logarithmic operations.
- **Aggregation**: sums, minima, counts, and constraints computed over subtrees naturally.
- **Scheduling/precedence**: dependency orderings and staged execution (level order, topological-like passes).

Typical applications include parsers (ASTs), directory services, routing tables, heaps/priority queues, and spatial indexes.

## Definition and Formalism
Let `T = (V, E)` be a finite, connected, acyclic undirected graph.

- **Size** `|V| = n`; **edges** `|E| = n − 1`.
- **Degree** of `u`: number of incident edges. In rooted trees, out-degree is the number of children.
- **Rooted tree**: choose a node `r` as root; every edge gets an implicit direction from parent to child.
- **Depth** of `u`: number of edges from `r` to `u` (root has depth 0).
- **Height** of a node `u`: length of the longest downward path from `u` to a leaf.  
  **Height of the tree**: height of `r`. Empty tree often has height `−1` by convention (so a single node has height `0`).
- **Leaf**: node with no children. **Internal** node: has ≥1 child.
- **Path**: sequence of nodes joined by edges; **simple** if no repeats.
- **Subtree rooted at `u`**: `u` and all its descendants.
- **Ordered vs unordered**: in an **ordered** tree, the children of each node are in a fixed left-to-right order (affects traversal sequences). In an **unordered** tree, children are a set.

> [!tip]
> Keep a consistent convention: **depth(root) = 0** and **height(leaf) = 0**. This avoids common off-by-ones when proving relations like `n = Σ_u 1` and `Σ_u outDegree(u) = n − 1`.

### Binary trees
A **binary tree** restricts each node to **left** and **right** child pointers (possibly null). Common flavors:
- **Full** (proper): every internal node has exactly 2 children.
- **Complete**: all levels filled except possibly the last, which is filled from left to right.
- **Perfect**: all leaves at the same depth and every internal node has 2 children.
- **Degenerate**: every node has at most one child (path-like).

Relations (binary, perfect): with height `h`, `n = 2^{h+1} − 1` and leaves `= 2^h`.

## Example or Illustration
Consider the undirected tree:
```

1 - 2 - 3 - 4  
|  
5

````
Unrooted, it is simply acyclic and connected. Rooting at `3` yields:
- Parent(3) = ⌀; children(3) = {2,4,5}
- Depths: depth(3)=0; depth(2)=depth(4)=depth(5)=1; depth(1)=2
- Height(tree) = 2 (longest path 3→2→1)

> [!example]
> **Diagram (`rooted-vs-unrooted.svg`)** shows the same shape twice: left as a plain tree; right rooted at node `3` with arrows to children and depth labels at each node.

## Properties and Relationships
- **Edge count**: An undirected tree with `n` nodes has exactly `n − 1` edges (prove by induction or by acyclicity + connectivity).
- **Unique path**: Between any two nodes `u, v`, there is exactly one simple path.
- **Sum of degrees**: `Σ_u degree(u) = 2(n − 1)` (handshaking lemma).
- **Leaves vs branching** (rooted, full binary): number of leaves `L = I + 1` where `I` is the count of internal nodes.
- **Ancestor/Descendant closure**: Ancestors of a node form a chain; descendants form a subtree (a connected, closed set under the parent relation).
- **Depth–height relation**: For node `u`, all descendants `v` satisfy `depth(v) = depth(u) + distance(u, v)`.

> [!note]
> A **forest** is a disjoint union of trees. Rooting each component yields a **rooted forest**. Many algorithms (e.g., union–find) maintain forests.

## Core Operations (Skeletons)
### Subtree size and height (postorder)
```pseudo
function SUBTREE_SIZE(u):
    if u == null: return 0
    size = 1
    for v in children(u):
        size += SUBTREE_SIZE(v)
    return size

function HEIGHT(u):
    if u == null: return -1      // so leaf height is 0
    h = -1
    for v in children(u):
        h = max(h, HEIGHT(v))
    return 1 + h
````

### Traversals (binary trees)

See [[tree-traversal-overview|Tree Traversal - Overview]] for detailed recursive and iterative patterns:

- **Preorder** (Root, Left, Right)
    
- **Inorder** (Left, Root, Right) - meaningful for [[bst|Binary Search Tree]]
    
- **Postorder** (Left, Right, Root)
    
- **Level order** (BFS by depth)
    

### Lowest Common Ancestor (LCA) (sketch)

- Naive: climb parents and mark ancestors (`O(h)`).
    
- Binary lifting / Euler tour + RMQ for `O(1)` queries after preprocessing.
    

> [!tip]  
> Postorder is ideal for bottom-up DPs (heights, counts). Preorder is ideal for passing **prefix** information down (path sums, ancestry flags).

## Representations

### 1) Pointer nodes (adjacency via child pointers)

```text
struct Node { Value val; Node* left; Node* right; }  // binary
struct Node { Value val; vector<Node*> children; }   // general
```

- **Pros**: natural recursion; flexible arity.
    
- **Cons**: pointer overhead; cache locality can be poor on large trees.
    

### 2) Parent array (static trees)

```
parent[0..n-1], where parent[root] = -1
```

- **Pros**: compact; easy upward navigation; amenable to **binary lifting** tables.
    
- **Cons**: downward traversal requires children lists or scans.
    

### 3) Children arrays / adjacency lists

- For each node, store a vector of children indices. Great for DP on DAG-like passes and iterative traversals.
    

### 4) Left-Child Right-Sibling (LCRS)

- Represent a general ordered tree using two pointers per node: `firstChild` and `nextSibling`.
    
- **Pros**: constant pointers per node (like binary) while supporting unbounded arity.
    
- **Cons**: siblings become a linked list; random child access is `O(k)`.
    

### 5) Array-based binary trees (complete trees)

- Map nodes to indices (heap layout): for index `i`, `left = 2i+1`, `right = 2i+2`.
    
- **Pros**: eliminates pointers; excellent locality for **complete** trees (heaps).
    
- **Cons**: poor for sparse or highly unbalanced shapes (wasted slots).
    

> [!example]  
> **Diagram (`representations.svg`)** contrasts pointer nodes, parent arrays, adjacency children arrays, LCRS, and heap indexing, with notes on memory and access patterns.

## Implementation or Practical Context

- **Memory layout & locality**: BFS-ordered allocations improve cache behavior. Arena/pool allocators cluster nodes.
    
- **Immutability**: Functional trees favor persistent structures (path-copying) enabling cheap snapshots and rollback at the cost of extra memory.
    
- **Concurrency**: Lock-free traversal is easiest on **immutable** trees. For mutable trees, use reader–writer locks or RCU-style epochs.
    
- **Validation**: Invariants like “no cycles,” “single parent,” and “connectedness” can be checked by counting edges (`n−1`) and running a DFS/Union–Find pass.
    
- **Serialization**:
    
    - **Preorder with null markers** uniquely encodes a binary tree.
        
    - **Level order** is compact for complete trees (heap-like arrays).
        

> [!tip]  
> For very large static trees, compress structure with succinct representations (balanced parentheses, DFUDS) to approach information-theoretic space while supporting queries.

## Common Misunderstandings

> [!warning]  
> **Depth vs height confusion.** Depth counts edges **from the root**; height counts edges **to a leaf**. Adopt `height(leaf)=0`, `height(empty)=-1` to keep recurrences clean.

> [!warning]  
> **Assuming inorder exists for general trees.** Inorder is specific to **binary** trees. For k-ary trees, define an application-specific order.

> [!warning]  
> **Using heap indexing on non-complete trees.** The `2i+1`/`2i+2` formulas assume a complete binary layout. Sparse shapes waste space and break invariants.

> [!warning]  
> **Multiple parents / cycles.** A DAG is **not** a tree. Trees have exactly one simple path between any two nodes. If multiple parents are needed, you’re in DAG territory - use [[graph-representations|Graph Representations]] and [[topological-sorting|Topological Sorting]].

> [!warning]  
> **Overflowing recursion stacks.** Deep or skewed trees can exceed recursion limits. Prefer iterative traversals with explicit stacks or tail-recursion elimination.

## Broader Implications

- **Algorithm design**: Many NP-hard problems on general graphs become linear-time on trees using DP (treewidth intuition). Tree decompositions extend these ideas to near-tree graphs.
    
- **Index and search structures**: Performance hinges on **height**. Balancing (AVL/RB) guarantees `O(log n)` operations; heaps guarantee `O(1)` find-min/max and `O(log n)` updates.
    
- **Parallelism**: Trees offer natural **divide-and-conquer**. Subtrees can be processed independently until shared resources (e.g., output arrays) require synchronization.
    

## Summary

Trees encode hierarchical relations with clean recursive structure. Key choices - rooted vs unrooted, ordered vs unordered, binary vs k-ary - and representations (pointers, arrays, LCRS) determine both elegance and performance. Master the vocabulary (size, leaves, degrees, depth, height), use traversal orders suited to the task, and select representations that match shape (complete vs sparse) and workload (static vs dynamic). With these fundamentals, tree algorithms become straightforward, efficient, and robust.

## Related Notes

- [[binary-tree|Binary Tree]]
    
- [[tree-traversal|Tree Traversal - Overview]]
    
- [[heaps|Heaps - Overview]]
    
- [[graph-representations|Graph Representations]]