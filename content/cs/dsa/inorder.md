---
title: Traversal - Inorder
description: Visit Left -> Root -> Right; yields sorted order precisely on binary search trees; includes recursive, iterative (stack), and Morris (O(1) space) variants.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-21
aliases: []
---

## Overview

**Inorder traversal** visits a binary tree's nodes in **Left -> Root -> Right** order. On a **binary search tree (BST)**, this yields the keys in **nondecreasing (sorted) order**, which makes inorder the default for enumerating BST contents, verifying ordering invariants, and exporting keys. There are three standard implementations:

- **Recursive** (short, idiomatic; uses [[cs/systems/processes-and-threads|call stack]]).

- **Iterative with an explicit stack** (control over space and stack use).

- **Morris traversal** (temporarily threads the tree to achieve **O(1)** auxiliary space).


All variants visit each node exactly once -> **O(n)** time. Space is **O(h)** for recursion/stack, with `h` the tree height, or **O(1)** extra for Morris (besides the output).

## Core Idea

The inorder rule is local: **first** traverse the left subtree, **then** process the current node, **then** traverse the right subtree. On BSTs, the left subtree contains keys `< key(root)` and the right subtree contains keys `> key(root)`, so this left-root-right ordering exposes the **global sort**. On general binary trees without ordering constraints, inorder is simply a well-defined visiting order (no sorted guarantee).

## Algorithm Steps / Pseudocode

### Recursive inorder

```pseudo
function INORDER_RECURSIVE(Node):
    if Node == NIL: return
    INORDER_RECURSIVE(Node.left)
    VISIT(Node)                 // e.g., append Node.key to output
    INORDER_RECURSIVE(Node.right)
```

- **Time:** O(n)

- **Extra space:** O(h) call stack (worst-case `h=n` for a degenerate chain; `h=floor(log2 n)` for balanced trees)


### Iterative inorder with explicit stack

```pseudo
function INORDER_ITERATIVE(root):
    S = empty stack
    curr = root
    while curr != NIL or not S.empty():
        // drill left
        while curr != NIL:
            S.push(curr)
            curr = curr.left
        // node at top has no unvisited left subtree
        curr = S.pop()
        VISIT(curr)
        // now traverse its right subtree
        curr = curr.right
```

- Push all the way left; when you hit `NIL`, pop, **visit**, and go right once.

- **Time:** O(n)

- **Extra space:** O(h) for the stack


### Morris inorder (O(1) auxiliary space)

Morris uses temporary **threads**: for a node `curr` with a left subtree, find its **inorder predecessor** `pred` (rightmost node in `curr.left`). If `pred.right` is `NIL`, set `pred.right = curr` (create a thread) and go left. If `pred.right == curr`, remove the thread, **visit** `curr`, and go right. No recursion, no stack; the tree's structure is temporarily reused and **restored**.

```pseudo
function INORDER_MORRIS(root):
    curr = root
    while curr != NIL:
        if curr.left == NIL:
            VISIT(curr)
            curr = curr.right
        else:
            pred = curr.left
            while pred.right != NIL and pred.right != curr:
                pred = pred.right
            if pred.right == NIL:
                pred.right = curr      // create thread
                curr = curr.left
            else:
                pred.right = NIL       // remove thread
                VISIT(curr)
                curr = curr.right
```

- **Time:** O(n) (each edge is traversed at most twice)

- **Extra space:** O(1)

- Restores the tree by removing every temporary thread.


> [!tip]
> Prefer **iterative with stack** in production when you need predictable behavior and debuggability. Use **Morris** when minimizing memory is paramount and you can safely modify and restore the structure during traversal.

## Example or Trace

Consider the BST built from keys `4,2,6,1,3,5,7`.

- **Recursive/Iterative output:** `1, 2, 3, 4, 5, 6, 7`.

- **Morris trace (high level):**

    1. `curr=4`, predecessor is `3` -> create thread `3.right=4`, go left to `2`.

    2. `curr=2`, predecessor is `1` -> create thread `1.right=2`, go left to `1`.

    3. `curr=1`, no left -> **visit 1**, go right via thread back to `2`; remove thread.

    4. **Visit 2**, go right to `3`; `3.left` is `NIL` -> **visit 3**, right via thread to `4`; remove thread.

    5. **Visit 4**; go right to `6`, and symmetrical steps produce `5,6,7`.


## Complexity Analysis

- **Time:** All variants are **O(n)**; each node is visited once, and Morris's inner "find predecessor" loop across all iterations touches each edge at most twice.

- **Space:**

    - Recursive / explicit stack: **O(h)** auxiliary; for a balanced tree `h=Theta(log n)`.

    - Morris: **O(1)** auxiliary (but temporarily writes pointers).


**I/O cost.** The `VISIT` operation (e.g., printing or appending) dominates when producing large outputs; traversal overhead becomes negligible relative to I/O.

## Optimizations or Variants

- **Early exit / range queries on BSTs.** If you only need keys in `[L, R]`, prune subtrees:

    ```pseudo
    function INORDER_RANGE(node, L, R):
        if node == NIL: return
        if node.key > L: INORDER_RANGE(node.left, L, R)
        if L <= node.key <= R: VISIT(node)
        if node.key < R: INORDER_RANGE(node.right, L, R)
    ```

    This returns results in sorted order while skipping irrelevant branches.

- **K-th smallest (BST).** Augment nodes with `size` of left subtree; navigate by comparing `k` to `size(left)+1` to get **O(h)** select without full traversal.

- **Threaded trees (persistent).** Morris's temporary links inspire **threaded binary trees**, which permanently store predecessor/successor pointers in place of `NIL` links to support efficient inorder without recursion or a stack.

- **Iterative with color/marker.** Some frameworks simulate traversal using a stack of `(node, state)` to unify preorder/inorder/postorder in one loop, which can simplify generic tree walkers.


## Applications

- **BST enumeration:** Sorted listing, merging two BSTs (two-pointer merge over inorder outputs), verifying BST property (check monotonicity).

- **Range reporting:** Enumerate all keys in a numeric window in sorted order (see pruning above).

- **Serialization & UI:** Building sorted menus or ordered reports from tree-based indices.

- **Algorithm building block:** Convert a tree to a sorted array/list as a precursor to balanced-tree rebuilding or deduplication.


## Common Pitfalls or Edge Cases

> [!warning]
> **Assuming sorted output on non-BSTs.** Inorder only guarantees sorted output if the tree is a **BST** with a consistent comparator.

> [!warning]
> **Null handling.** Always check `NIL` before dereferencing children. In iterative code, the inner "drill left" loop must stop on `NIL` to avoid pushing garbage.

> [!warning]
> **Stack/recursion overflow.** Deeply skewed trees (`h approximately n`) can overflow the call stack or allocate large explicit stacks. Consider rebalancing, tail recursion elimination where applicable, or Morris traversal.

> [!warning]
> **Morris pointer restoration.** Forgetting to remove a thread (`pred.right = NIL`) **corrupts the tree**. Ensure each created thread is removed exactly once.

> [!warning]
> **Concurrent modification.** Traversing while mutating (insert/delete) breaks invariants. Freeze updates or traverse a snapshot.

## Implementation Notes or Trade-offs

- **Comparator consistency.** For BSTs, maintain a [[cs/languages/Cpp/stl-containers|strict weak ordering]]; inconsistencies can break "sorted by inorder" guarantees.

- **Visit action.** Keep `VISIT` small (e.g., append to buffer) to avoid skewing performance measurements; batch I/O where possible.

- **Memory profile.** Recursive version is simplest and usually fastest for balanced trees; iterative is safer for worst-case depth; Morris minimizes memory but is more error-prone.


## Summary

Inorder traversal is the canonical **Left -> Root -> Right** visit order. It runs in **O(n)** time, uses **O(h)** space (or **O(1)** via Morris), and produces **sorted output** for BSTs. Choose recursive for clarity, iterative for control and worst-case safety, and Morris when auxiliary memory must be minimized and temporary pointer rewiring is acceptable.

## Related Notes

- [[cs/dsa/binary-tree|Binary Tree]]

- [[cs/dsa/bst|Binary Search Tree]]

- [[cs/dsa/preorder|Traversal - Preorder]]

- [[cs/dsa/postorder|Traversal - Postorder]]
