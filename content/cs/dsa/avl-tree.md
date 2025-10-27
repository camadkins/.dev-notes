---
title: AVL Tree — Height-Balanced Binary Search Tree
description: Self-balancing BST that maintains O(log n) height via single and double rotations based on balance factors.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - avl_rotations.svg — visualize LL, LR, RL, RR rotation patterns.
#  - avl_insert_trace.svg — insertion sequence showing rebalancing propagation.
#  - avl_balance_factor.svg — tree annotated with balance factors (-1, 0, +1).
---

## Overview
An **AVL tree** (named after Adelson-Velsky and Landis, 1962) is a **self-balancing binary search tree (BST)**.  
It ensures that for every node, the height difference between its left and right subtrees — called the **balance factor** — never exceeds 1.

> [!note]
> This guarantees the height `h` of an AVL tree with `n` nodes is **O(log n)**, ensuring logarithmic search, insertion, and deletion times.

---

## Core Property
For every node `v`:
```

balance_factor(v) = height(v.left) − height(v.right)

```
and  
```

|balance_factor(v)| ≤ 1

```

Whenever an insertion or deletion violates this rule, **rotations** are applied to restore balance while preserving BST order.

---

## Model & Invariants
1. **BST property:** left < root < right.
2. **Balance constraint:** |height(left) - height(right)| ≤ 1.
3. **Height invariant:** after each update, all subtrees satisfy the balance constraint.

Because of these rules, the height `h` satisfies:
```

h ≤ 1.44 log₂(n + 2) − 0.328

````
which is asymptotically O(log n).

---

## Operations & Complexity

| Operation | Time | Space | Notes |
|------------|------|--------|-------|
| Search | O(log n) | O(1) | Same as BST; no rebalance needed. |
| Insert | O(log n) | O(1) | May require one rotation. |
| Delete | O(log n) | O(1) | May require multiple rotations up the path. |
| Traversal | O(n) | O(1) | Inorder yields sorted output. |

> [!tip]
> Maintaining height at each node (instead of recomputing recursively) allows constant-time balance checks during updates.

---

## Rotations
To rebalance, AVL trees perform **single** or **double rotations** depending on where the imbalance occurs.

| Case | Trigger | Fix |
|------|----------|-----|
| LL (Left-Left) | Insertion in left child’s left subtree | Single right rotation |
| RR (Right-Right) | Insertion in right child’s right subtree | Single left rotation |
| LR (Left-Right) | Insertion in left child’s right subtree | Double rotation: left-right |
| RL (Right-Left) | Insertion in right child’s left subtree | Double rotation: right-left |

> [!example]
> **Diagram (`avl_rotations.svg`)** — four labeled subtrees (A, B, C, D) show how rotation preserves in-order sequence.

### Right Rotation (LL Case)

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

### Left Rotation (RR Case)

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

Double rotations (LR, RL) are simply combinations of these two.

---

## Insertion Example

Insert sequence: `[10, 20, 30, 25, 28]`

|Step|Inserted|Imbalance|Rotation|Result|
|---|---|---|---|---|
|10|–|–|–|Balanced|
|20|10|RR|Left rotation|Root becomes 20|
|30|20|RR|Left rotation|Root becomes 30|
|25|30|RL|Double rotation|Rebalanced|
|28|25|LR|Double rotation|Balanced|

> [!example]  
> **Diagram (`avl_insert_trace.svg`)** — show insertion steps with heights and rebalance highlights.

---

## Deletion Example

Deleting nodes can cause _cascading rebalances_ up the tree because multiple ancestors might become unbalanced.

Example:

```
Delete(10)
→ imbalance at 30 (balance_factor = +2)
→ perform rotateRight(30)
```

> [!warning]  
> Unlike insertion (which requires at most one rotation), deletion may require multiple rotations up the path to the root.

---

## Maintaining Heights

Each node stores:

```text
node {
    key
    height
    left, right
}
```

After modification:

```
height(node) = 1 + max(height(left), height(right))
```

Updating height in O(1) per visited node keeps rebalancing efficient.

---

## Visualization

> [!example]  
> **Diagram (`avl_balance_factor.svg`)** — a tree annotated with balance factors (-1, 0, +1) to illustrate local vs global balance.

---

## Pitfalls

> [!warning]  
> **Forgetting to update heights:**  
> Heights must be updated bottom-up after rotations or insertion; skipping one leads to incorrect balancing.

> [!warning]  
> **Incorrect balance propagation:**  
> After fixing one imbalance, continue updating parent nodes—rotations don’t automatically restore the entire path.

> [!tip]  
> Use recursion or explicit parent pointers to propagate updates cleanly.

---

## AVL vs Other Self-Balancing Trees

|Feature|AVL Tree|Red-Black Tree|
|---|---|---|
|Height bound|Stricter (O(log n))|Looser (≤ 2× log n)|
|Rebalancing frequency|Higher|Lower|
|Lookup speed|Slightly faster|Comparable|
|Insert/Delete cost|Slightly higher|Lower constants|
|Typical use|Memory-sensitive, read-heavy|Write-heavy or map/set libraries|

> [!note]  
> AVL trees often outperform Red-Black Trees in search-heavy workloads due to tighter balance, but cost more in updates.

---

## Summary

- Maintains **height balance** via **rotations**.
    
- Guarantees **O(log n)** operations.
    
- Balancing cases: LL, RR, LR, RL.
    
- Height updates and proper rotation propagation are essential.
    

---

## See also

- [[cs/dsa/binary-search-tree|Binary Search Tree]]
    
- [[cs/dsa/red-black-tree|Red-Black Tree]]
    
- [[cs/dsa/tree-traversal|Tree Traversal]]
    
- [[cs/dsa/avl-trees-balance-rotations|AVL Rotations Explained]]
    
- [[cs/dsa/splay-tree|Splay Tree]]