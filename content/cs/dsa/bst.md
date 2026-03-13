---
title: Binary Search Tree — Ordered Data via Hierarchical Partitioning
description: Data structure maintaining ordered keys where left subtree < node < right subtree; supports logarithmic average-case search, insertion, and deletion.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
aliases: []
# diagrams:
#  - bst_structure.svg — example tree showing key ordering (left < node < right).
#  - bst_insertion_trace.svg — illustrates recursive insertion maintaining order.
#  - bst_deletion_cases.svg — shows deletion of leaf, single child, and two-child nodes.
---

## Overview
A **Binary Search Tree (BST)** is a hierarchical data structure that stores elements in a **sorted** manner, allowing efficient **search**, **insertion**, and **deletion** operations.  
Each node has up to two children — **left** and **right** — arranged by the **BST invariant**:

```

For every node x:  
all keys in left(x) < key(x) < all keys in right(x)

````

> [!note]
> BSTs form the foundation for self-balancing structures such as AVL trees, Red-Black trees, and Splay trees.

---

## Node Structure
Each node stores a key (and optionally a value) and pointers to its children.

```text
struct Node {
    key
    left, right
}
````

> [!tip]  
> Some implementations also store a parent pointer or subtree metadata (e.g., height, size).

---

## Operations

|Operation|Average Time|Worst Case|Space|
|---|---|---|---|
|Search|O(log n)|O(n)|O(1)|
|Insert|O(log n)|O(n)|O(1)|
|Delete|O(log n)|O(n)|O(1)|
|Traversal|O(n)|O(n)|O(1)|

The efficiency depends on tree height — ideally `O(log n)` but can degrade to `O(n)` if the tree becomes skewed.

---

## Searching for a Key

```pseudo
function search(node, key):
    if node == null or node.key == key:
        return node
    if key < node.key:
        return search(node.left, key)
    else:
        return search(node.right, key)
```

The search path follows comparisons — left for smaller, right for larger.

> [!example]  
> **Diagram (`bst_structure.svg`)** — show an example tree where searching for key 37 traverses nodes [50 → 25 → 37].

---

## Insertion

```pseudo
function insert(node, key):
    if node == null:
        return new Node(key)
    if key < node.key:
        node.left = insert(node.left, key)
    else if key > node.key:
        node.right = insert(node.right, key)
    return node
```

Insertion preserves the ordering invariant by recursively finding the correct null link.

### Duplicate Policy

There are three common approaches:

1. **Reject duplicates** entirely.
    
2. **Allow duplicates on one side** (usually right).
    
3. **Use counts or linked lists** at nodes.
    

> [!warning]  
> Duplicate-handling must be consistent — mixing policies can silently violate ordering.

> [!example]  
> **Diagram (`bst_insertion_trace.svg`)** — illustrates inserting 42 into `[40, 50, 60]`.

---

## Deletion

Deletion is more complex and has **three cases**:

### 1. Node is a Leaf

Remove it directly.

### 2. Node has One Child

Replace the node with its child.

### 3. Node has Two Children

Find the **inorder successor** (smallest node in right subtree) or **predecessor** (largest in left subtree).  
Copy its value into the current node, then delete the duplicate from the subtree.

```pseudo
function delete(node, key):
    if node == null:
        return null
    if key < node.key:
        node.left = delete(node.left, key)
    else if key > node.key:
        node.right = delete(node.right, key)
    else:
        if node.left == null:
            return node.right
        if node.right == null:
            return node.left
        successor = minValueNode(node.right)
        node.key = successor.key
        node.right = delete(node.right, successor.key)
    return node
```

> [!example]  
> **Diagram (`bst_deletion_cases.svg`)** — show leaf removal, single-child promotion, and inorder-successor replacement.

---

## Traversals

### Inorder Traversal

```pseudo
function inorder(node):
    if node != null:
        inorder(node.left)
        visit(node)
        inorder(node.right)
```

> Produces sorted output of keys.

### Preorder / Postorder

Used for copying or deleting the tree respectively.

|Type|Order|Use|
|---|---|---|
|Inorder|Left → Root → Right|Sorted listing|
|Preorder|Root → Left → Right|Tree construction|
|Postorder|Left → Right → Root|Deletion or evaluation|

---

## Height and Balance

The **height** of a BST affects its performance.

- Best case (balanced): `h ≈ log₂(n)`
    
- Worst case (skewed): `h = n`
    

A skewed BST behaves like a linked list; self-balancing variants (AVL, Red-Black) mitigate this by maintaining bounded height.

> [!tip]  
> Use random insertion or balancing logic to maintain logarithmic height.

---

## Example Trace

Consider inserting keys `[50, 25, 75, 10, 37, 60, 90]`.

After construction:

```
        50
       /  \
     25    75
    / \    / \
   10 37  60 90
```

Inorder traversal yields `[10, 25, 37, 50, 60, 75, 90]`.

---

## Common Pitfalls

> [!warning]  
> **Parent link updates:** If nodes store parent references, update them during insertions and deletions.

> [!warning]  
> **Unbalanced growth:** Sequential insertions (`1, 2, 3, ...`) degrade to O(n) time — use balancing or randomization.

> [!warning]  
> **Incorrect duplicate handling:** Failing to define a side (left/right) for equal keys breaks ordering.

---

## Summary

- BST maintains **ordered keys** with hierarchical structure.
    
- Search, insert, delete average **O(log n)** when balanced.
    
- **Inorder traversal** always yields sorted sequence.
    
- Basis for advanced balanced trees like **AVL** and **Red-Black Trees**.
    

---

## See also

- [[avl-tree|AVL Tree]]
    
- [[rb-tree]]
    
- [[tree-traversal|Tree Traversal]]
    
- [[linked-list|Linked List]]
    
- [[heapify|Heapify]]