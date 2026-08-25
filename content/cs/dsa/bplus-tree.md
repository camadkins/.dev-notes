---
title: B+ Tree - Balanced Index for Database and Filesystem Storage  
description: Extension of B-trees optimized for range queries and disk-based indexing; all keys stored in leaves with linked leaf chaining.  
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16  
updated: 2025-10-29  
aliases:
- bplus-tree
- b-plus-tree

---

## Definition

A **B+ Tree** is a **self-balancing multi-level search tree** commonly used in **databases**, **[[cs/systems/file-systems|filesystems]]**, and **storage engines**.  
It extends the **B-tree** by ensuring that **all actual data (records)** reside in the **leaf nodes**, while **internal nodes** store only keys for navigation.

> [!note]  
> B+ Trees are optimized for **disk-based access patterns** - minimizing expensive I/O by maximizing branching factors and supporting **sequential traversal** through leaf linkage.

---

## Invariants

1. All leaves appear at the same level (balanced).
    
2. Internal nodes store **up to m−1 keys** and **m child pointers**.
    
3. Leaf nodes store **keys + data pointers**, and one **next-leaf pointer**.
    
4. Root may have fewer keys (at least two children unless empty).
    

---

## Operations

### Search

To search for key `k`:

1. Start from the root.
    
2. Repeatedly descend to the appropriate child pointer until reaching a leaf.
    
3. Perform a linear or binary search in the leaf node.
    

**Time Complexity:** `O(log_m n)` - logarithmic with respect to total keys and branching factor `m`.

> [!tip]  
> Each disk page read corresponds to one level - minimizing height is critical.

### Insertion

1. Locate the leaf where `k` should be inserted.
    
2. Insert key and value in sorted order.
    
3. If the leaf overflows (too many keys), **split** it:
    
    - Half the keys move to a new sibling leaf.
        
    - Middle key is **promoted** to the parent.
        
4. Propagate splits upward recursively if necessary.
    

```pseudo
function insert(node, key, value):
    if node is leaf:
        insert key,value
        if overflow(node):
            splitLeaf(node)
    else:
        child = selectChild(node, key)
        insert(child, key, value)
        if overflow(child):
            splitInternal(child)
```

![Inserting 30 overflows a leaf, which splits and copies 20 upward](cs/dsa/assets/bplus-tree-insertion.svg)

**Cost:** O(log_m n) I/O operations.

### Deletion

1. Locate the leaf containing the key.
    
2. Remove it.
    
3. If the node **underflows** (too few keys):
    
    - **Redistribute** keys with sibling, or
        
    - **Merge** with sibling and update parent.
        
4. Propagate adjustments upward if needed.
    

> [!warning]  
> Deletion in B+ Trees is more complex than insertion because rebalancing may cascade up multiple levels.

### Range Queries and Sequential Access

Range queries (e.g., `find all keys in [k1, k2]`) are where B+ Trees excel:

1. Use root-to-leaf search to locate `k1`.
    
2. Follow the **leaf-level linked list** until `k2` is reached.
    

![A range query descending to 6 then scanning the leaf chain to 20](cs/dsa/assets/bplus-tree-range-query.svg)

This design supports efficient **ordered scans** - a major reason B+ Trees dominate [[cs/history/relational-model-and-sql|database indexing]].

---

## Complexity

|Operation|Time Complexity|I/O Notes|
|---|---|---|
|Search|O(log_m n)|1 disk read per level|
|Insert|O(log_m n)|Split propagation may add 1–2 writes|
|Delete|O(log_m n)|May require merge or redistribution|
|Range Query|O(log_m n + k)|`k` = number of records in range|

> [!tip]  
> Since m (order) is large (hundreds per node), the height `h` is small - often 2–4 even for millions of records.

---

## Implementations

### Structure (components)

|Component|Description|
|---|---|
|**Internal Nodes**|Contain keys and child pointers only (no actual data).|
|**Leaf Nodes**|Contain all records and pointers to next leaf (linked list).|
|**Order (m)**|Maximum number of children for any internal node.|
|**Height (h)**|Determines search cost; typically small due to high fan-out.|

![An order 4 B+ tree with keys above and records in linked leaves](cs/dsa/assets/bplus-tree-structure.svg)

### Practical Notes

- [[cs/history/magnetic-disk-storage|Disk blocks]] (usually 4 KB) dictate node size.
    
- Leaves contain **record pointers**; internal nodes only **key pointers**.
    
- Linked leaves enable **cursor traversal** and **bulk scanning**.
    
- Rebalancing keeps operations logarithmic over time.
    

> [!warning]  
> **Caching is essential**: root and top levels often kept in memory to minimize I/O cost.

---

## Comparison

|Feature|B-Tree|B+ Tree|
|---|---|---|
|Data location|Internal + Leaf nodes|Leaf nodes only|
|Sequential access|Slower (no links)|Fast (linked leaves)|
|Range queries|Inefficient|Very efficient|
|Node size|Larger|Smaller (no data in internal nodes)|
|Storage utilization|Slightly lower|Higher|
|Use case|In-memory balanced trees|Disk-based indexes|

> [!note]  
> Most **database engines (MySQL, PostgreSQL)** and **filesystems (NTFS, HFS+, ext4)** use B+ trees under the hood.

---

## Examples

**Insert sequence:** `[10, 20, 5, 6, 12, 30, 7, 17]` into a B+ Tree of order 4 (max 3 keys per node, max 4 children).

1. Start empty - insert `[10, 20, 5]` into first leaf.
    
2. On inserting 6 → split leaf into `[5,6]` and `[10,20]`; promote `10`.
    
3. Insert 12 → fits right leaf `[10,12,20]`.
    
4. Insert 30 → overflow → split right leaf, promote `20`.
    
5. Insert 7, 17 → propagate splits as necessary.
    

> [!tip]  
> This small example mirrors the **page split** behavior of database indices.

---

## Pitfalls

- Deletion rebalancing can cascade up multiple levels.
    
- Caching strategy matters for performance.
    
- Node size should align with storage page size.
    

> [!warning] Common pitfalls
> 
> - Mixing B-Tree vs B+ Tree semantics (storing records in internal nodes).
>     
> - Forgetting to maintain **leaf links** after splits/merges (breaks range scans).
>     
> - Inconsistent min/max keys per node when switching between “order m” and “degree t” definitions.
>     
> - Node size not aligned to page size → reduced fanout and extra I/O.
>     

---

## When to use

Compared to B-trees, choose B+ Trees when you need:

- **Better range queries** (thanks to leaf chaining)
    
- **Higher fan-out** (internal nodes smaller, only keys)
    
- **Predictable I/O** (fewer disk pages to touch)
    
- **Efficient iteration** (ordered, sequential leaves)
    

These advantages make B+ trees ideal for large datasets that cannot fit entirely into memory.

---

## Summary

- **B+ Trees** extend B-trees by separating data storage (leaves) from indexing (internal nodes).
    
- They support **efficient range queries**, **sequential traversal**, and **high fan-out** - ideal for disk-based systems.
    
- Insertions and deletions maintain balance, ensuring predictable logarithmic performance.
    
- Almost every database and filesystem index structure builds on this design.
    

---

## Related Notes

- [[cs/dsa/b-tree|B-Tree]]
    
- [[cs/dsa/bst|Binary Search Tree]]
    
- [[cs/dsa/hash-tables|Hash Tables]]
    
- [[cs/dsa/graph-representations|Graph Representations]]
    
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]