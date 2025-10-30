---
title: B-Trees — Balanced Multiway Search Structures
description: Generalized search trees that maintain logarithmic height by storing multiple keys per node and balancing via split/merge operations.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - btree_structure.svg — example layout showing internal and leaf nodes with multiple keys.
#  - btree_split_merge.svg — visualizing node splitting and merging during insertions and deletions.
#  - btree_disk_blocks.svg — mapping B-tree nodes to disk pages for efficient I/O.
---

## Overview
A **B-tree** is a **self-balancing multiway search tree** that generalizes binary search trees to support **multiple keys per node**.  
It minimizes disk I/O by storing large blocks of sorted keys together—ideal for databases and filesystems where nodes map directly to disk pages.

> [!note]
> B-trees are optimized for external memory: instead of minimizing CPU comparisons, they minimize the number of disk reads required to locate data.

---

## Motivation
Standard binary search trees degrade to height `O(n)` in the worst case, while AVL and Red-Black trees—though balanced—are inefficient for disk storage, as each node often triggers separate disk access.

A B-tree solves this by:
- Storing many keys per node (reducing height).
- Ensuring **logarithmic depth** even for large datasets.
- Aligning node size with **disk block or cache line size** to maximize locality.

---

## Structure & Properties

A B-tree of order `m` (the maximum number of children per node) satisfies:

1. **Node capacity**:
```

ceil(m/2) − 1 ≤ keys ≤ m − 1  
ceil(m/2) ≤ children ≤ m

```
2. **Sorted order**:
Keys within a node are sorted.
3. **Child partitioning**:
Keys separate subranges:  
For node with keys `[k₁, k₂, …, kₜ]`, child `C₀` contains `< k₁`, `C₁` between `k₁` and `k₂`, etc.
4. **Balanced height**:
All leaves appear at the same depth.
5. **Root rules**:
The root can have fewer keys (≥1) and fewer children.

> [!example]
> **Diagram (`btree_structure.svg`)** — illustrate a 3rd-order B-tree with keys grouped in nodes and hierarchical child ranges.

---

## Example

For `m = 4`, each node can contain up to 3 keys and 4 children.

```

```
      [17 | 35]
     /     |     \
```

[5 | 12] [20 | 28] [40 | 50 | 60]

````

Searching for 28:
- Compare in root `[17 | 35]` → between → follow middle child `[20 | 28]` → found.

> [!tip]
> B-trees reduce the number of node visits dramatically—depth grows logarithmically with branching factor `m`.

---

## Insertion Algorithm

### 1. Locate target leaf
Traverse like a BST, descending to the correct child based on key order.

### 2. Insert key
Insert in sorted order into the leaf.

### 3. Handle overflow
If a node exceeds `(m − 1)` keys:
- Split the node into two halves.
- Promote the **middle key** to the parent.
- If parent overflows, recursively split upward (possibly creating a new root).

> [!example]
> **Diagram (`btree_split_merge.svg`)** — show insertion sequence: overflow → split → promote middle key.

### Pseudocode
```pseudo
function insert(T, k):
    if root is full:
        s = newNode()
        s.children[0] = root
        splitChild(s, 0)
        root = s
    insertNonFull(root, k)

function insertNonFull(x, k):
    if x is leaf:
        insert k into x.keys
    else:
        i = largest i where k > x.keys[i]
        if child[i+1] is full:
            splitChild(x, i+1)
            if k > x.keys[i+1]:
                i = i + 1
        insertNonFull(x.children[i+1], k)
````

---

## Deletion Algorithm

1. **Find** key `k`:
    
    - If in **leaf**: remove directly.
        
    - If in **internal node**: replace with predecessor or successor key and recursively delete that key.
        
2. **Fix underflow**:  
    If a node drops below `ceil(m/2) − 1` keys:
    
    - **Borrow** a key from a sibling, or
        
    - **Merge** with a sibling and pull down a key from the parent.
        

> [!warning]  
> Deletion rebalancing can cascade upward — similar to insert splitting, but reversed.

---

## Time & Space Complexity

|Operation|Time|Space|Notes|
|---|---|---|---|
|Search|O(logₘ n)|O(1)|Each level reads one node.|
|Insert|O(logₘ n)|O(1)|One split per level max.|
|Delete|O(logₘ n)|O(1)|Merge or borrow per level.|
|Traversal|O(n)|O(1)|In-order traversal yields sorted output.|

> [!note]  
> Increasing `m` reduces height and improves I/O locality but increases per-node linear search cost.

---

## B-Trees in Storage Systems

### Databases

- Used in **B+Trees**, a variant with all data in leaves and linked leaf nodes for range queries.
    
- Enables efficient **range scans** and **prefix lookups**.
    
- Balanced automatically on insertion/deletion.
    

### File Systems

- File allocation tables and metadata indices use B-tree variants.
    
- Example: **HFS+, NTFS, ext4**.
    

> [!example]  
> **Diagram (`btree_disk_blocks.svg`)** — show nodes mapped to disk pages, demonstrating how reading one node loads multiple keys.

---

## B-Tree vs Other Trees

| Property | B-Tree | BST | AVL | Red-Black | B+Tree |  
|-----------|---------|------|-------------|---------|  
| Keys per node | Multiple | 1 | 1 | 1 | Multiple |  
| Disk alignment | Yes | No | No | No | Yes |  
| Balance guarantee | Strict | Unbounded | Height-balanced | Loosely balanced | Strict |  
| Range queries | Moderate | Poor | Poor | Poor | Excellent |  
| Storage use | Block-based | Pointer-heavy | Pointer-heavy | Pointer-heavy | Block-based |

---

## Pitfalls

> [!warning]  
> **Underflow handling** during deletion is often overlooked.  
> Borrowing from or merging with siblings must maintain key ordering and node capacity invariants.

> [!warning]  
> **Incorrect split propagation**: always promote the _median_ key upward, not the last inserted one.

> [!tip]  
> Choose node size based on **disk block or page size (e.g., 4 KB)** to align with storage system granularity.

---

## Summary

- **B-trees** are balanced, disk-friendly structures ensuring logarithmic access time.
    
- Designed for **large datasets** stored on disk or secondary memory.
    
- Maintain order and balance through **split and merge** operations.
    
- Foundation of many modern **B+Tree**-based databases and filesystems.
    

---

## See also

- [[bst|Binary Search Tree]]
    
- [[cs/dsa/avl-tree|AVL Tree]]
    
- [[cs/dsa/rb-tree|Red-Black Tree]]
    
- [[cs/dsa/bplus-tree|B+ Tree]]
    
- [[cs/dsa/external-sorting|External Sorting]]