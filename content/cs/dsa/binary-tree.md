---
title: Binary Tree
description: Hierarchical structure where each node has up to two children; basis for BSTs, Heaps, and Tree Traversals.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-29
aliases: []
---

## Definition

A **Binary Tree** is a **hierarchical data structure** where each node has at most two children: **left** and **right**.
It serves as the foundation for many advanced structures like **Binary Search Trees**, **Heaps**, and **[[cs/pl/grammar-ambiguity-parse-trees|Expression Trees]]**.

> [!note]
> Binary trees are used when hierarchical relationships or ordered branching is required - e.g., parsing, searching, and structural recursion.

---

## Terminology

|Term|Definition|
|---|---|
|**Root**|Topmost node of the tree|
|**Leaf**|Node with no children|
|**Parent**|Node with references to children|
|**Child**|Node referenced by a parent|
|**Sibling**|Nodes sharing the same parent|
|**Subtree**|Tree formed by a node and all its descendants|
|**Height**|Number of edges on the longest downward path|
|**Depth**|Distance from the root to a node|

> [!tip]
> Tree height is often computed recursively:
> `height(node) = 1 + max(height(left), height(right))`

---

## Variants

|Type|Description|Notes|
|---|---|---|
|**Full Binary Tree**|Every node has 0 or 2 children.|No node has only one child.|
|**Complete Binary Tree**|All levels full except possibly the last, filled left to right.|Used in heaps.|
|**Perfect Binary Tree**|All leaves at same level and every parent has 2 children.|Contains `2^(h+1) - 1` nodes.|
|**Skewed Binary Tree**|Every node has only one child (left or right).|Degenerates into linked list.|
|**Balanced Binary Tree**|Height = O(log n) due to balancing rules.|Includes AVL, Red-Black, etc.|

---

## Representations

### Pointer-Based (Linked)

- Each node stores [[cs/languages/Rust/smart-pointers-box-rc-refcell|references to its children]].

- Flexible for sparse or irregular trees.

- Common for BSTs, expression trees, and tries.


### Array-Based (Index Mapping)

Used primarily for **complete** trees (e.g., heaps).

|Node i|Left Child|Right Child|Parent|
|---|---|---|---|
|i|2i + 1|2i + 2|(i − 1) // 2|

> [!note]
> This layout eliminates pointers and improves cache locality.

---

## Implementations

Each node typically contains:

- A **key or value**

- A **left** pointer

- A **right** pointer


```text
struct Node {
    key
    left, right
}
```

---

## Traversals

1. **Preorder (Root → Left → Right)**

2. **Inorder (Left → Root → Right)**

3. **Postorder (Left → Right → Root)**


These traversals define the **order of visiting** nodes and serve different purposes (expression evaluation, sorting, etc.).

---

## Recursive Properties

Many algorithms leverage the recursive nature of trees.

### Counting Nodes

```pseudo
function count(node):
    if node == null: return 0
    return 1 + count(node.left) + count(node.right)
```

### Computing Height

```pseudo
function height(node):
    if node == null: return -1
    return 1 + max(height(node.left), height(node.right))
```

---

## Pitfalls

> [!warning]
> **Cycle creation:** Never let two nodes reference each other as parent/child - breaks acyclicity assumption.

> [!warning]
> **Null pointer handling:** Recursive algorithms must check for null before descending.

> [!tip]
> For memory safety, initialize all child pointers to null on node creation.

---

## Examples / Use Cases

- **Expression Trees** - Represent arithmetic expressions hierarchically.

- **Huffman Coding Trees** - Encode symbols based on frequency.

- **Binary Search Trees / Heaps** - Use structural variants for ordering and efficiency.


---

## Summary

- Binary tree = at most two children per node.

- Recursive, hierarchical, and foundational for most tree-based algorithms.

- Can be represented via pointers or array indices.

- Balancing and completeness affect efficiency.


---

## Related Notes

- [[cs/dsa/bst|Binary Search Tree]]

- [[cs/dsa/binary-heap|Binary Heap]]

- [[cs/dsa/tree-traversal|Tree Traversals]]

- [[cs/dsa/recursion|Recursion]]

- [[cs/dsa/graph-representations|Graph Representations]]
