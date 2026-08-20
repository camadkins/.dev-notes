---
title: Traversal - Postorder
description: Left–Right–Root visit order for trees; ideal for delete/free, structural evaluation, and bottom-up dynamic programming.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-06
aliases: []
---

## Overview

**Postorder traversal** visits a tree **after** fully processing its subtrees: **Left -> Right -> Root** for binary trees (and, more generally, "children before parent" for arbitrary rooted trees). Because a node is visited _after_ its descendants, postorder naturally supports **bottom-up computations** (e.g., size, height, DP on trees), **safe deallocation** (free children before parent), and **expression evaluation** (evaluate operands before applying an operator).

> [!note]
> Notation: `Node.left`, `Node.right`, and `Node.val`. Postorder = visit left subtree, then right subtree, then the node itself.

## Motivation

- **Deletion / free**: free children first, then the parent, to avoid dangling pointers.

- **Evaluation**: expression trees compute operands (subtrees) before combining at the operator (root).

- **Tree DP**: many problems (subtree sums, diameters, LIS on trees) require children's results to compute the parent's result.

- **Serialization**: postorder is convenient for building **postfix** sequences that can be evaluated with a stack.


## Definition and Formalism

For a binary tree with root `r`:

- If `r = NIL`, return.

- Otherwise, **postorder** recursively visits: `postorder(r.left)`, `postorder(r.right)`, then **process** `r`.


For a general rooted tree with children list `Children(u)` in a fixed order:

- Visit all `v in Children(u)` in order, then visit `u`.


The **sequence** produced is a **topological order of the parent-of relation** (every parent appears after its descendants).

## Example or Illustration

Consider:

```
      A
     / \
    B   C
   / \   \
  D   E   F
```

Postorder yields `D, E, B, F, C, A`.

## Properties and Relationships

- **Bottom-up guarantee**: visiting a node implies all descendants were already visited.

- **Stack discipline**: recursive postorder corresponds to **call stack** frames following the tree shape.

- **Dualities**:

    - Preorder: Root->Left->Right (useful for cloning/serialization with structure markers).

    - Inorder: Left->Root->Right (yields sorted order for BSTs).

- **Parent-after-children** implies postorder is suitable for **safe teardown** and **folds/reductions** on trees.


See also [[preorder|Traversal - Preorder]] and [[inorder|Traversal - Inorder]] for contrasts.

## Implementation or Practical Context

### Recursive (canonical, simplest)

```pseudo
function POSTORDER_RECURSIVE(root):
    if root == NIL: return
    POSTORDER_RECURSIVE(root.left)
    POSTORDER_RECURSIVE(root.right)
    visit(root)
```

- Clear and concise; may overflow the call stack on very deep trees.


### Iterative - Two Stacks (conceptually simple)

Idea: one stack for processing, one stack for output (effectively reversing a modified preorder).

```pseudo
function POSTORDER_TWO_STACKS(root):
    if root == NIL: return
    S1 = stack(); S2 = stack()
    S1.push(root)
    while not S1.empty():
        u = S1.pop()
        S2.push(u)
        if u.left  != NIL: S1.push(u.left)
        if u.right != NIL: S1.push(u.right)
    while not S2.empty():
        visit(S2.pop())
```

- `S2` collects nodes in **Root->Right->Left**; popping yields **Left->Right->Root**.


### Iterative - One Stack + lastVisited (memory-lean)

Track the last node that was visited to know when a right subtree has been processed.

```pseudo
function POSTORDER_ONE_STACK(root):
    S = stack()
    curr = root
    last = NIL
    while curr != NIL or not S.empty():
        if curr != NIL:
            S.push(curr)
            curr = curr.left
        else:
            peek = S.top()
            if peek.right != NIL and last != peek.right:
                curr = peek.right      // descend right
            else:
                visit(peek)
                last = peek
                S.pop()
```

- Avoids the second stack; commonly used in interviews and production.


### Iterative - Reverse-Preorder Trick

Push **left then right** but prepend to output (or push right first and collect to a list that you reverse at the end). This is isomorphic to the two-stack method but uses a dynamic array.

### Morris Postorder (O(1) extra space)

Temporarily "thread" the tree by creating and later removing right links along left edges; visit nodes by **reversing** right-edge paths.

High level steps:

1. Create a **dummy** node whose left child is `root`.

2. For each node `curr`, if it has a left child, find its predecessor `pred` (rightmost of `curr.left`).

3. If `pred.right == NIL`, set `pred.right = curr` and move `curr = curr.left`.

4. Else (thread exists), **reverse-print** the path from `curr.left` to `pred` (right edges), restore `pred.right = NIL`, and move `curr = curr.right`.


> [!tip]
> Morris postorder avoids stacks but is intricate; use when **O(1)** extra memory is required and you can safely mutate pointers during traversal.

### General Trees (k-ary)

Replace `left/right` with iterating over `Children(u)`:

```pseudo
function POSTORDER_KARY(root):
    if root == NIL: return
    for v in Children(root):
        POSTORDER_KARY(v)
    visit(root)
```

### Common Postorder Computations

**1) Free/Delete a Tree (C-style)**

```pseudo
function FREE(u):
    if u == NIL: return
    FREE(u.left)
    FREE(u.right)
    free(u)
```

**2) Subtree Sum / Size**

```pseudo
function SUBTREE_SUM(u):
    if u == NIL: return 0
    sL = SUBTREE_SUM(u.left)
    sR = SUBTREE_SUM(u.right)
    u.sum = sL + sR + u.val
    return u.sum
```

**3) Height (max depth)**

```pseudo
function HEIGHT(u):
    if u == NIL: return -1
    hL = HEIGHT(u.left)
    hR = HEIGHT(u.right)
    return 1 + max(hL, hR)
```

**4) Evaluate Expression Tree**

```pseudo
function EVAL(u):
    if u is leaf: return value(u)
    x = EVAL(u.left)
    y = EVAL(u.right)
    return apply(op(u), x, y)
```

## Complexity Analysis

- **Time**: `Theta(n)` - each node is pushed/popped a constant number of times (or visited once in recursive/Morris forms).

- **Space**:

    - Recursive: `Theta(h)` call stack, where `h` is tree height (`Theta(log n)` for balanced, `Theta(n)` worst-case skew).

    - Two stacks: `Theta(h)`–`Theta(n)` depending on shape (bounded by `n`).

    - One stack: `Theta(h)`.

    - Morris: `O(1)` auxiliary but temporarily rewires pointers.


## Common Pitfalls or Edge Cases

> [!warning]
> **Visiting root too early.** In iterative versions, ensure you only `visit(peek)` after either (a) the right child is `NIL` or (b) `lastVisited` equals `peek.right`.

> [!warning]
> **Forgetting to restore threads (Morris).** Always reset `pred.right = NIL` after reverse-printing; otherwise the structure is corrupted.

> [!warning]
> **Null checks on descent.** Always guard `u.left`/`u.right` accesses; pushing `NIL` complicates logic and wastes work.

> [!warning]
> **Two-stack order mistakes.** Pushing `left` before `right` into `S1` yields **Right->Left->Root** on pop. To get correct postorder, push **left then right** but remember `S2` reverses the sequence; verify with a small example.

> [!warning]
> **Stack overflow on deep trees.** Switch to iterative or tail-recursive style for adversarial inputs.

## Implementation Notes or Trade-offs

- **API choice**: Provide both `postorder_recursive` (clarity) and `postorder_iterative` (robustness).

- **Visitor pattern**: accept a function/lambda `visit(Node*)` so users can plug in deletion, accumulation, serialization, etc.

- **Iterative preference**: in systems code, the **one-stack** method balances readability and safety; Morris is niche but valuable.

- **Order for n-ary trees**: define a stable children iteration order to guarantee reproducible outputs.

- **Memory locality**: for arrays representing trees (e.g., heaps) postorder over implicit children may not be linear; gather children indices first.


## Summary

Postorder traversal visits **children before parent**, enabling bottom-up algorithms, safe resource **teardown**, and **expression evaluation**. It runs in `Theta(n)` time with `Theta(h)` space for standard implementations, with a specialized **Morris** variant achieving **O(1)** extra space by temporary threading. Choose between recursive (simple) and iterative (robust) forms; test against small examples to confirm ordering.

## Related Notes

- [[preorder|Traversal - Preorder]]

- [[inorder|Traversal - Inorder]]

- [[tree-traversal|Tree Traversal]]

- [[binary-tree|Binary Tree]]
