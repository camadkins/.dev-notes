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

## Sources

- Binary tree, Wikipedia. https://en.wikipedia.org/wiki/Binary_tree . Backs the core definition of a binary tree as a structure in which each node has at most a left and a right child, every row of the Variants table (full = every node has 0 or 2 children; complete = every level filled except possibly the last, whose nodes sit as far left as possible; perfect = all interior nodes have two children and all leaves at the same depth, with `2^(h+1) - 1` nodes; degenerate/skewed = each parent has only one child and the structure behaves like a linked list), and the array index mapping `left = 2i+1`, `right = 2i+2`, `parent = ⌊(i−1)/2⌋` with the root at index zero.
- Tree (abstract data type), Wikipedia. https://en.wikipedia.org/wiki/Tree_%28abstract_data_type%29 . Backs the Terminology table: root as the single node with no parent, leaf as a node with no children, parent and child, siblings as nodes sharing a parent, subtree, height as the length of the longest downward path to a leaf, and depth as the length of the path back to the root. It also fixes the conventions that make the `height(node) = 1 + max(height(left), height(right))` recurrence work, namely leaf height zero and empty-tree height `-1`.
- full binary tree, NIST Dictionary of Algorithms and Data Structures. https://xlinux.nist.gov/dads/HTML/fullBinaryTree.html . Backs the Full Binary Tree row specifically, defined as a binary tree in which each node has exactly zero or two children, and the note in that row that no node may have only one child.
- complete binary tree, NIST Dictionary of Algorithms and Data Structures. https://xlinux.nist.gov/dads/HTML/completeBinaryTree.html . Backs the Complete Binary Tree row and the claim that this is the shape that can be efficiently implemented as an array with the index arithmetic given under Array-Based.
- balanced tree, NIST Dictionary of Algorithms and Data Structures. https://xlinux.nist.gov/dads/HTML/balancedtree.html . Backs the Balanced Binary Tree row: a tree in which no leaf is much farther from the root than any other, with AVL and red-black listed as specific schemes and with different schemes defining "much farther" differently.
- Binary heap, Wikipedia. https://en.wikipedia.org/wiki/Binary_heap . Backs the statement that the array index mapping is used primarily for complete trees such as heaps, and that a heap can be stored compactly precisely because it is always a complete binary tree, with no space needed for pointers.
- Tree traversal, Wikipedia. https://en.wikipedia.org/wiki/Tree_traversal . Backs the three traversal orders listed here, preorder as root then left then right, inorder as left then root then right, and postorder as left then right then root.
- Binary search tree, Wikipedia. https://en.wikipedia.org/wiki/Binary_search_tree . Backs the claim that binary trees are the foundation for binary search trees, and that a degenerate binary search tree has the same worst-case cost as a linked list, which is why balancing and completeness affect efficiency.
- Huffman coding, Wikipedia. https://en.wikipedia.org/wiki/Huffman_coding . Backs the Huffman coding tree use case: a binary tree built from symbol frequencies that yields an optimal prefix code.
- Tree (graph theory), Wikipedia. https://en.wikipedia.org/wiki/Tree_%28graph_theory%29 . Backs the cycle-creation pitfall, since a tree is by definition acyclic and any two nodes are joined by a unique simple path, so mutual parent/child references break the structure.
