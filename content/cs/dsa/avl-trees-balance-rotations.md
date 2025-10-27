---
title: AVL Trees — Balance & Rotations
description: Understanding AVL balance factors, rotation types, and how rebalancing preserves the binary search property.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - avl_rotations.svg — visualizes LL, RR, LR, RL rotation patterns.
#  - avl_height_balance.svg — shows subtree height differences and balance factors.
---

## Overview
**AVL trees** maintain balance by ensuring that for any node, the **height difference** between its left and right subtrees is at most one.  
When this condition is violated, **rotations** restore balance while keeping the **binary search tree (BST)** property intact.

> [!note]
> Balance factors allow AVL trees to detect imbalance locally and correct it with minimal rotations.

---

## The Balance Factor

For any node `v`:
```

balance_factor(v) = height(v.left) − height(v.right)

````

- Balanced if `balance_factor ∈ {−1, 0, +1}`  
- Left-heavy if `balance_factor = +2`  
- Right-heavy if `balance_factor = −2`

> [!example]
> **Diagram (`avl_height_balance.svg`)** — show nodes annotated with height and balance factor values, highlighting when rotation triggers occur.

---

## Detecting Imbalance

When inserting or deleting a node:
1. Recompute height and balance factor up the tree.
2. Identify the **first node** that violates the AVL condition (`|balance_factor| > 1`).
3. Perform the appropriate rotation based on the *shape* of imbalance.

| Case | Description | Rotation Needed |
|------|--------------|-----------------|
| LL | Left subtree of left child grew | Right rotation |
| RR | Right subtree of right child grew | Left rotation |
| LR | Right subtree of left child grew | Left rotation on child, then right rotation |
| RL | Left subtree of right child grew | Right rotation on child, then left rotation |

---

## Single Rotations

### Right Rotation (LL Case)

Occurs when inserting into the **left subtree** of a node’s left child.

```pseudo
function rotateRight(y):
    x = y.left
    T2 = x.right
    x.right = y
    y.left = T2
    updateHeight(y)
    updateHeight(x)
    return x
````

After rotation:

- Node `x` becomes new root of subtree.
    
- The order property is preserved: all keys in `T2` remain between `x` and `y`.
    

> [!example]  
> **Diagram (`avl_rotations.svg`)** — show LL rotation sequence restoring balance.

---

### Left Rotation (RR Case)

Occurs when inserting into the **right subtree** of a node’s right child.

```pseudo
function rotateLeft(x):
    y = x.right
    T2 = y.left
    y.left = x
    x.right = T2
    updateHeight(x)
    updateHeight(y)
    return y
```

- Node `y` becomes new root of subtree.
    
- Subtree heights become balanced (`balance_factor = 0`).
    

---

## Double Rotations

### Left-Right (LR Case)

Triggered when inserting into the **right subtree of the left child**:

1. Perform a **left rotation** on the left child.
    
2. Then perform a **right rotation** on the root.
    

> [!example]  
> **Diagram (`avl_rotations.svg`)** — depict LR rotation as two-step fix for diagonal imbalance.

### Right-Left (RL Case)

Triggered when inserting into the **left subtree of the right child**:

1. Perform a **right rotation** on the right child.
    
2. Then perform a **left rotation** on the root.
    

> [!note]  
> LR and RL rotations are effectively _mirror images_ of each other.

---

## Rebalancing Algorithm (Insert)

```pseudo
function insert(node, key):
    if node == null:
        return new Node(key)
    if key < node.key:
        node.left = insert(node.left, key)
    else if key > node.key:
        node.right = insert(node.right, key)
    else:
        return node  // duplicate keys ignored

    updateHeight(node)
    balance = height(node.left) - height(node.right)

    if balance > 1 and key < node.left.key:
        return rotateRight(node)           // LL
    if balance < -1 and key > node.right.key:
        return rotateLeft(node)            // RR
    if balance > 1 and key > node.left.key:
        node.left = rotateLeft(node.left)  // LR
        return rotateRight(node)
    if balance < -1 and key < node.right.key:
        node.right = rotateRight(node.right) // RL
        return rotateLeft(node)
    return node
```

> [!tip]  
> Track heights as integers and only recompute from children—never traverse entire subtrees.

---

## Rebalancing on Deletion

Deletions may cause _cascading imbalance_ upward, so after removing a node:

- Recompute height.
    
- Recheck balance and apply the same rotation logic.
    
- Continue until reaching the root.
    

> [!warning]  
> Deletion can trigger multiple rotations because balance violations can propagate upward.

---

## Rotation Intuition

Rotations don’t reorder values — they **restructure subtrees** so height differences shrink while key ordering stays intact.

|Rotation|Restores|Description|
|---|---|---|
|LL / RR|Single imbalance|Straight chain fix|
|LR / RL|Diagonal imbalance|Two-step correction|

> [!example]  
> Visualize how a “leaning” subtree becomes upright after rotation — the parent node moves downward, and the child moves up.

---

## Summary

- AVL trees balance via **local rotations** guided by **balance factors**.
    
- Four rotation cases cover all imbalance patterns.
    
- Rebalancing keeps operations in O(log n).
    
- Rotations preserve BST order and structure.
    

---

## See also

- [[cs/dsa/avl-tree|AVL Tree]]
    
- [[cs/dsa/binary-search-tree|Binary Search Tree]]
    
- [[cs/dsa/red-black-tree|Red-Black Tree]]
    
- [[cs/dsa/tree-traversal|Tree Traversal]]