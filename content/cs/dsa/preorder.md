---
title: Preorder Traversal
description: Root–Left–Right visit order for trees; useful for serialization, cloning, and prefix expression generation.
draft: false
comments: true
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

- **UI and [[cs/systems/file-systems|filesystems]]:** natural for "expand node, then children" presentations.


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
        See [[cs/dsa/inorder|Traversal - Inorder]] and [[cs/dsa/postorder|Traversal - Postorder]].

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

- Simple and clear; may [[cs/systems/processes-and-threads|overflow call stack]] on deep/skewed trees.


### Iterative - Single Stack (robust, common)

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


### Iterative - "Unwind left spine" variant

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

- **Time:** `Theta(n)` - each node is processed once.

- **Space:** `Theta(h)` for recursive and stack-based forms; **O(1)** for Morris (transient threading).


## Implementation Notes or Trade-offs

- **Visitor pattern:** accept a callable `visit(Node*)` so clients can plug in actions (emit, clone, fold).

- **Determinism:** define a fixed child order; nondeterministic iteration yields nondeterministic traversals.

- **Interoperability:** for BST tasks that also need sorted output, combine with [[cs/dsa/inorder|Traversal - Inorder]]; for teardown or DP folds use [[cs/dsa/postorder|Traversal - Postorder]].


## Summary

Preorder is a **parent-first** traversal: **Root -> Left -> Right** for binary trees and **node -> children** for general trees. It excels at **serialization**, **cloning**, **prefix expression** construction, and **pruning** scenarios. Use the simple recursive version when depth is modest, the **single-stack** iterative version for robustness, or **Morris preorder** for strict `O(1)` space with pointer-threading care.

## Related Notes

- [[cs/dsa/inorder|Traversal - Inorder]]

- [[cs/dsa/postorder|Traversal - Postorder]]

- [[cs/dsa/tree-traversal|Tree Traversal]]

- [[cs/dsa/binary-tree|Binary Tree]]

## Sources

- Tree traversal, Wikipedia. https://en.wikipedia.org/wiki/Tree_traversal . Backs the definition of pre-order as NLR (visit the current node, then recursively traverse the left subtree, then the right subtree) and the claim under Properties that this order is a topological sort, which the article states directly: the pre-order traversal is a topologically sorted one because a parent node is processed before any of its child nodes. It also backs the single-stack iterative form and its push order, since the article's iterativePreorder pushes the right child first so that the left is processed first, which is exactly the mistake warned about in Common Misunderstandings. It further backs the existence of Morris threading as the traversal technique that removes the stack whose size is proportional to the tree's height.
- Tree (abstract data type), Wikipedia. https://en.wikipedia.org/wiki/Tree_%28abstract_data_type%29 . Backs the generalisation to arbitrary rooted trees that this note leads with, defining a pre-order walk as one in which each parent node is traversed before its children, and backs the requirement that the children of each node carry a fixed order, since an ordered tree is defined as a rooted tree in which an ordering is specified for the children of each vertex.
- Topological sorting, Wikipedia. https://en.wikipedia.org/wiki/Topological_sorting . Backs what the Properties section means by calling preorder a topological order, namely a linear ordering in which every node precedes the nodes that depend on it, here the descendants under the parent-of relation.
- Binary tree, Wikipedia. https://en.wikipedia.org/wiki/Binary_tree . Backs the serialization claims in Properties and Applications: the article's EncodeSuccinct walks the tree in preorder emitting a marker for every null child and storing data in a parallel preorder array, and DecodeSuccinct reads that stream back into the original tree, which is what makes preorder-with-sentinels a unique and reversible encoding. It also backs the pitfall about array-based heaps, since binary trees stored in arrays are stored in breadth-first order rather than preorder.
- Polish notation, Wikipedia. https://en.wikipedia.org/wiki/Polish_notation . Backs the prefix-expression motivation and application: in Polish (prefix) notation operators precede their operands, and no parentheses are needed as long as each operator has a fixed number of operands, which is why an operator-first preorder emission of an expression tree parses unambiguously.
- Threaded binary tree, Wikipedia. https://en.wikipedia.org/wiki/Threaded_binary_tree . Backs the Morris preorder section's mechanism and its warning: threading reuses child pointers that would otherwise be null, so the structure is temporarily modified and must be restored, and threading is what buys traversal without recursion and without storage proportional to the tree's depth.
- Binary heap, Wikipedia. https://en.wikipedia.org/wiki/Binary_heap . Backs the pitfall contrasting heaps with pointer trees, since a heap is stored as an array in breadth-first order with children of index `i` at `2i+1` and `2i+2`, an arrangement in which a preorder sequence is not a contiguous run of array slots.
