---
title: Traversal — Preorder
description: Root–Left–Right visit order for trees; useful for serialization, cloning, and prefix expression generation.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2026-01-04
aliases: []
---

## Overview

**Preorder traversal** visits a tree in **Root -> Left -> Right** order for binary trees (and more generally, **node before children** for rooted trees). Because each node is processed **before** its descendants, preorder is ideal for **serialization with structure markers**, **cloning**, building **prefix (Polish) expressions**, and any task that needs to act on a node prior to exploring its subtrees.

> [!note]
> Notation: `Node.left`, `Node.right`, `Node.val`. Use half-open thinking when iterating arrays that represent trees, but pointer-based trees follow the structural order above.

## Motivation

- **Serialization and cloning:** emit a node, then recursively emit its subtrees; with null markers, the sequence can reconstruct the exact tree.

- **Prefix expressions:** for expression trees, preorder yields operator-first sequences that evaluate with a simple stack machine.

- **Early filtering/pruning:** decide at a node whether to descend further (e.g., cut subtrees by value range).

- **UI and filesystems:** natural for "expand node, then children" presentations.


## Definition and Formalism

For a binary tree with root `r`:

- If `r = NIL`, return.

- Otherwise, **preorder** visits: **process `r`**, then `preorder(r.left)`, then `preorder(r.right)`.


For a general rooted tree with an ordered children list `Children(u)`:

- **process `u`**, then visit each `v in Children(u)` in order.


This order is a **topological order** of the "parent-of" relation: each parent appears _before_ its descendants.

## Example or Illustration

Consider:

```
      A
     / \
    B   C
   / \   \
  D   E   F
```

Preorder yields `A, B, D, E, C, F`.

## Properties and Relationships

- **Parent-first:** actions at a node can guide traversal of its subtrees (e.g., pruning).

- **Dualities:**

    - **Inorder**: Left->Root->Right (sorted output for BSTs).

    - **Postorder**: Left->Right->Root (bottom-up; good for deletion/evaluation).
        See [[inorder|Traversal — Inorder]] and [[postorder|Traversal — Postorder]].

- **Serialization correctness:** With **null sentinels** for missing children, preorder is sufficient to reconstruct the unique binary tree.


## Implementation or Practical Context

### Recursive (canonical)

```pseudo
function PREORDER_RECURSIVE(root):
    if root == NIL: return
    visit(root)
    PREORDER_RECURSIVE(root.left)
    PREORDER_RECURSIVE(root.right)
```

- Simple and clear; may overflow call stack on deep/skewed trees.


### Iterative — Single Stack (robust, common)

Push **right first**, then **left**, so left is processed next.

```pseudo
function PREORDER_ITERATIVE(root):
    if root == NIL: return
    S = stack()
    S.push(root)
    while not S.empty():
        u = S.pop()
        visit(u)
        if u.right != NIL: S.push(u.right)
        if u.left  != NIL: S.push(u.left)
```

- Time `Theta(n)`, auxiliary space `Theta(h)` where `h` is tree height.


### Iterative — "Unwind left spine" variant

Walk down the left spine, visiting as you go; keep a stack of right children to process later.

```pseudo
function PREORDER_LEFT_SPINE(root):
    S = stack()
    u = root
    while u != NIL or not S.empty():
        while u != NIL:
            visit(u)
            if u.right != NIL: S.push(u.right)
            u = u.left
        if not S.empty(): u = S.pop()
```

- Same complexity; sometimes better locality.


### Morris Preorder (O(1) extra space)

Temporarily thread the tree via right pointers of predecessors; restore structure afterward.

```pseudo
function PREORDER_MORRIS(root):
    curr = root
    while curr != NIL:
        if curr.left == NIL:
            visit(curr)
            curr = curr.right
        else:
            pred = curr.left
            while pred.right != NIL and pred.right != curr:
                pred = pred.right
            if pred.right == NIL:
                visit(curr)           // visit before threading
                pred.right = curr     // create thread
                curr = curr.left
            else:
                pred.right = NIL      // remove thread
                curr = curr.right
```

- **O(1)** auxiliary space; careful to **visit on first encounter** before descending left.


> [!warning]
> Morris methods temporarily modify pointers; ensure restoration (`pred.right = NIL`) to avoid corrupting the tree.

### General (k-ary) Trees

Replace left/right with an iteration over `Children(u)`:

```pseudo
function PREORDER_KARY(root):
    if root == NIL: return
    visit(root)
    for v in Children(root):
        PREORDER_KARY(v)
```

## Common Misunderstandings

> [!warning]
> **Wrong push order in iterative version.** Pushing left then right and popping from a LIFO stack yields Root->Right->Left. Push **right first**, then **left**.

> [!warning]
> **Skipping null sentinels in serialization.** Without explicit null markers, multiple shapes can produce the same preorder; include sentinels if you need exact reconstruction.

> [!warning]
> **Deep recursion on skewed trees.** Left- or right-skewed trees can cause stack overflow; switch to an iterative or Morris implementation.

> [!warning]
> **Confusing array-based heaps with pointer trees.** Heaps use array indexing; their "preorder" is not a contiguous array slice. Choose the traversal order appropriate to the representation.

## Applications

- **Serialization/deserialization with shape:** emit `value` then recurse with **null markers** (e.g., `#`) for missing children; reconstruct by reading in the same order.

- **Cloning:** visit node, allocate clone, then connect clones of children; preorder ensures parent exists before linking.

- **Prefix expressions:** for expression trees, preorder yields operator before operands; straightforward stack evaluation.

- **Selective pruning:** decide at the parent whether to traverse (e.g., range-limited searches or early exits).


## Complexity Analysis

- **Time:** `Theta(n)` — each node is processed once.

- **Space:** `Theta(h)` for recursive and stack-based forms; **O(1)** for Morris (transient threading).


## Implementation Notes or Trade-offs

- **Visitor pattern:** accept a callable `visit(Node*)` so clients can plug in actions (emit, clone, fold).

- **Determinism:** define a fixed child order; nondeterministic iteration yields nondeterministic traversals.

- **Interoperability:** for BST tasks that also need sorted output, combine with [[inorder|Traversal — Inorder]]; for teardown or DP folds use [[postorder|Traversal — Postorder]].


## Summary

Preorder is a **parent-first** traversal: **Root -> Left -> Right** for binary trees and **node -> children** for general trees. It excels at **serialization**, **cloning**, **prefix expression** construction, and **pruning** scenarios. Use the simple recursive version when depth is modest, the **single-stack** iterative version for robustness, or **Morris preorder** for strict `O(1)` space with pointer-threading care.

## See also

- [[inorder|Traversal — Inorder]]

- [[postorder|Traversal — Postorder]]

- [[tree-traversal|Tree Traversal]]

- [[binary-tree|Binary Tree]]
