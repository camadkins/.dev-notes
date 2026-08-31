---
title: Binary Search Tree
description: Data structure maintaining ordered keys where left subtree < node < right subtree; supports logarithmic average-case search, insertion, and deletion.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
aliases: []
---

## Overview
A **Binary Search Tree (BST)** is a hierarchical data structure that stores elements in a **sorted** manner, allowing efficient **search**, **insertion**, and **deletion** operations.  
Each node has up to two children, **left** and **right**, arranged by the **BST invariant**:

```

For every node x:  
all keys in left(x) < key(x) < all keys in right(x)

````

> [!note]
> BSTs form the foundation for self-balancing structures such as AVL trees, Red-Black trees, and Splay trees.

---

## Node Structure
Each node stores a key (and optionally a value) and [[cs/languages/Rust/smart-pointers-box-rc-refcell|pointers to its children]].

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
|Traversal|O(n)|O(n)|O(h)|

The efficiency depends on tree height: ideally `O(log n)`, but it can degrade to `O(n)` if the tree becomes skewed.

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

The search path follows comparisons: left for smaller, right for larger.

![BST structure showing search path for key 37: 50 → 25 → 37](cs/dsa/assets/bst-structure.svg)

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
> Duplicate-handling must be consistent; mixing policies can silently violate ordering.

![Inserting 42 into the chain 40, 50, 60, descending right then left](cs/dsa/assets/bst-insertion-trace.svg)

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

![BST deletion cases: leaf removal, single-child promotion, inorder-successor replacement](cs/dsa/assets/bst-deletion-cases.svg)

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
> **Unbalanced growth:** Sequential insertions (`1, 2, 3, ...`) degrade to O(n) time. Use balancing or randomization.

> [!warning]  
> **Incorrect duplicate handling:** Failing to define a side (left/right) for equal keys breaks ordering.

---

## Summary

- BST maintains **[[cs/math/relations-and-equivalence|ordered keys]]** with hierarchical structure.
    
- Search, insert, delete average **O(log n)** when balanced.
    
- **Inorder traversal** always yields sorted sequence.
    
- Basis for advanced balanced trees like **AVL** and **Red-Black Trees**.
    

---

## See also

- [[cs/dsa/avl-tree|AVL Tree]]
    
- [[cs/dsa/rb-tree]]
    
- [[cs/dsa/tree-traversal|Tree Traversal]]
    
- [[cs/dsa/linked-list|Linked List]]
    
- [[cs/dsa/heapify|Heapify]]

## Sources

- Binary search tree, Wikipedia. https://en.wikipedia.org/wiki/Binary_search_tree . Backs the BST invariant that every key in a node's left subtree is smaller and every key in its right subtree is larger, the operations table (average `Θ(log n)` for search, insert and delete against `O(n)` in the worst case), the reason for the degradation (arbitrary insertion order can make the tree degenerate into something with the same worst-case complexity as a linked list), the three deletion cases with the inorder successor or predecessor used when the node has two children, and the statement that an inorder walk visits all nodes in non-decreasing key order.
- CS 161 Lecture 8, Binary Search Trees, Jessica Su, Stanford University (some parts copied from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture8.pdf . Backs the height claims in the Height and Balance section, since it states that these operations run in time proportional to the height of the tree, that in the best case the tree is complete and the height is `Θ(log n)`, and that in the worst case the tree is a linear chain and the height is `Θ(n)`. It also backs the search descent rule (compare against the node, go left if smaller and right if larger, stop at NIL), that search runs in `O(h)`, the `Θ(n)` running time of the inorder tree walk, and the two-children deletion case, including the detail that the successor cannot have a left child.
- Tree traversal, Wikipedia. https://en.wikipedia.org/wiki/Tree_traversal . Backs the traversal table's three orders and the corrected traversal space cell. The article states that all of its recursive and iterative traversal implementations require stack space proportional to the height of the tree, which is why the table now reads `O(h)` rather than `O(1)` for traversal.
- Random binary search tree, Wikipedia. https://en.wikipedia.org/wiki/Random_binary_search_tree . Backs the tip that random insertion order keeps the height logarithmic: inserting `n` keys in uniformly random order gives an expected root-to-node path length of at most `2 log n + O(1)` and, with high probability, a height of about `4.311 log n` in natural logarithms.
- AVL tree, Wikipedia. https://en.wikipedia.org/wiki/AVL_tree . Backs the claim that self-balancing variants mitigate skew by maintaining bounded height, since an AVL tree keeps the heights of any node's two child subtrees within one of each other and therefore does lookup, insertion and deletion in `O(log n)` in both the average and the worst case.
- Red-black tree, Wikipedia. https://en.wikipedia.org/wiki/Red%E2%80%93black_tree . Backs the same claim for the other named family: the colouring requirements force the path to the farthest leaf to be at most twice the path to the nearest, giving `h ∈ O(log n)`, a property ordinary binary search trees do not have.
- Order statistic tree, Wikipedia. https://en.wikipedia.org/wiki/Order_statistic_tree . Backs the note under Node Structure that implementations may store subtree metadata such as size, and what that metadata buys, namely rank and select queries answered by keeping `size[x] = size[left[x]] + size[right[x]] + 1` up to date.
