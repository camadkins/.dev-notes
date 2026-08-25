---
title: AVL Tree - Height-Balanced Binary Search Tree
description: Self-balancing BST that maintains O(log n) height via single and double rotations based on balance factors.
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
An **AVL tree** (Adelson-Velsky and Landis, 1962) is a **self-balancing binary search tree (BST)** that enforces a local height-balance constraint at every node. The **balance factor** (left-subtree height minus right-subtree height) is kept within `{-1, 0, +1}` so the overall tree height remains [[cs/math/logarithms-and-exponentials|logarithmic]] in the number of nodes.

> [!note]
> This guarantees the height `h` of an AVL tree with `n` nodes is **O(log n)**, ensuring logarithmic search, insertion, and deletion times.

The core property is:
```

balance_factor(v) = height(v.left) − height(v.right) and |balance_factor(v)| ≤ 1

```
Whenever an insertion or deletion violates this rule, **rotations** restore balance while preserving BST order.

## Invariants
1. **BST property:** keys in the left subtree are `< node.key` and in the right subtree are `> node.key`.
2. **Balance constraint:** for every node, `|height(left) - height(right)| ≤ 1`.
3. **[[cs/math/mathematical-induction|Height invariant]]:** after each update, all subtrees satisfy the balance constraint.

Because of these rules, the height `h` satisfies:
```

h ≤ 1.44 log₂(n + 2) − 0.328

````
which is asymptotically `O(log n)`.

> [!note] Balance factor
> For each node \(x\), \(bf(x) = \text{height}(x.\text{left}) - \text{height}(x.\text{right}) \in \{-1,0,+1\}\).

## Operations
**Search** proceeds like a standard BST. **Insert** and **delete** first modify the BST structure, then **rebalance** on the path back to the root using rotations that preserve the in-order sequence.

> [!tip] Rotation triggers (high level)
> Insertions and deletions that cause \(|bf(x)| > 1\) on the search path require a local rotation (see [[cs/dsa/avl-rotations|AVL Rotations]]).

*(Detailed LL/LR/RL/RR rotation sequences and rotation pseudocode live in [[cs/dsa/avl-rotations|AVL Rotations]] to keep this note focused on the data structure itself.)*

## Complexity
| Operation | Time | Space | Notes |
|---|---|---|---|
| Search | O(log n) | O(1) | Same as BST; no rebalance needed. |
| Insert | O(log n) | O(1) | May require rotations near the first unbalanced ancestor. |
| Delete | O(log n) | O(1) | May require multiple rebalances up the path. |
| Traversal | O(n) | O(1) | Inorder yields sorted output. |

> [!tip]
> Maintaining `height` at each node (instead of recomputing recursively) allows constant-time balance checks during updates.

## Implementations
**Storing height/balance.** Each node typically stores a cached `height` (and optionally a `balance`), updated after any child change:
```text
node {
    key
    height
    left, right
}
````

```
height(node) = 1 + max(height(left), height(right))
```

**Recursive vs iterative updates.** Implement rebalancing either:

- **Recursively** (natural propagation of height fixes), or

- **Iteratively** with parent pointers or an explicit stack to walk back up and rotate where needed.


### Trade-offs vs other trees

|Feature|AVL Tree|Red-Black Tree|
|---|---|---|
|Height bound|Stricter (closer to perfectly balanced)|Looser (≤ 2× log n)|
|Rebalancing frequency|Higher|Lower|
|Lookup speed|Often slightly faster|Comparable|
|Insert/Delete constants|Slightly higher|Often lower|
|Typical use|Memory-sensitive, read-heavy|Write-heavy or map/set libraries|

> [!note]
> AVL trees often outperform Red-Black Trees in search-heavy workloads thanks to tighter height bounds, at the cost of more frequent rebalancing.

## Examples

### Short insert narrative

Insert sequence `[10, 20, 30, 25, 28]`:

- After inserting `30`, an **RR**-type imbalance near the root triggers a **left rotation**.

- Inserting `25` then `28` can produce **RL/LR**-type patterns; apply the appropriate **double rotation**.
    See full step-by-step transformations in [[cs/dsa/avl-rotations|AVL Rotations]].

### Short delete narrative

Deletion can cause **cascading** rebalances:

```
Delete(10)
→ imbalance at 30 (balance_factor = +2)
→ perform a rotation at 30, then continue fixing ancestors as needed
```

## Pitfalls

> [!warning] Common pitfalls
>
> - Forgetting to update heights after rotation.
>
> - Propagating height updates in the wrong order.
>
> - Mixing up LR vs RL cases.
>

> [!warning]
> **Forgetting to update heights:** Heights must be updated bottom-up after rotations or insertion; skipping one leads to incorrect balancing.

> [!warning]
> **Incorrect balance propagation:** After fixing one imbalance, continue updating parent nodes - rotations don't automatically restore the entire path.

> [!tip]
> Use recursion or explicit parent pointers to propagate updates cleanly.

## Related Notes

- [[cs/dsa/bst|Binary Search Tree]]

- [[cs/dsa/avl-rotations|AVL Rotations]]

- [[cs/dsa/rb-tree| Red Black Tree]]

- [[cs/dsa/tree-traversal|Tree Traversal]]

- [[cs/dsa/splay-tree|Splay Tree]]
