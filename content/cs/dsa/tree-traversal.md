---
title: Tree Traversal - Overview
description: Systematic ways to visit tree nodes; depth-first (pre/in/post), breadth-first (level order), with recursive and iterative patterns.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
# - traversal-skeletons.svg - Unified boxes for Preorder (Root, Left, Right), Inorder (Left, Root, Right), Postorder (Left, Right, Root), and Level Order (by depth), showing control flow arrows.
# - recursion-vs-iteration.svg - Side-by-side of a call stack expanding/contracting vs an explicit stack/queue driving the same visit order.
---

## Overview
**Tree traversal** is the disciplined process of visiting every node of a tree in a well-defined order. Traversal orders drive nearly every tree algorithm: searching, aggregating values, transforming structures, serializing/deserializing, and checking invariants. Two broad families dominate:

- **Depth-First Search (DFS):** visit a subtree completely before moving to siblings. Canonical orders on binary trees are **preorder**, **inorder**, and **postorder**.
- **Breadth-First Search (BFS):** visit nodes by **levels** using a queue.

Each order admits a **recursive** version (via the program stack) and an **iterative** version (using an explicit **stack** or **queue**). The choice affects stack depth, memory use, and control over side effects.

> [!note]
> Throughout, assume a binary-tree node with fields `Node.left`, `Node.right`, and possibly `Node.children[]` for general trees. For binary search trees (BSTs), **inorder** yields keys in sorted order; see [[inorder|Traversal - Inorder]] and [[binary-tree|Binary Tree]].

## Motivation
Picking the right traversal gives you:
- **Correctness by construction:** e.g., postorder naturally ensures children are processed **before** their parent - ideal for deletion or bottom-up DP.
- **Clarity of intent:** preorder aligns with **serialization** (“emit root before its subtree”), inorder with **BST iteration**, level order with **shortest number of edges from root** properties.
- **Performance predictability:** DFS uses at most the **height** of the tree in extra memory; BFS uses at most the size of the **widest level**.

## Definition and Formalism
Let `T` be a (rooted) tree with root `r`.

- **Preorder (Root, Left, Right):** visit `r`, then visit each child’s subtree recursively. On binary trees: `R-L-R`.
- **Inorder (Left, Root, Right):** visit left subtree, then `r`, then right subtree (binary trees only).
- **Postorder (Left, Right, Root):** visit subtrees first, then `r`.
- **Level order (BFS):** visit nodes in increasing **depth** from `r` using a FIFO queue.

All standard traversals are **Θ(n)** time for `n` nodes and, in trees without cross-links, scan each edge exactly once.

> [!tip]
> For **k-ary** or general trees (arbitrary arity), preorder and postorder generalize directly by looping over `children`. “Inorder” is inherently binary; for higher arity, define a domain-specific “inorder-like” order if needed.

## Example or Illustration
Consider a binary tree with values:
```

```
  8
/   \
```

3 10  
/ \  
1 6 14  
/ \ /  
4 7 13

````
- **Preorder:** 8, 3, 1, 6, 4, 7, 10, 14, 13  
- **Inorder:** 1, 3, 4, 6, 7, 8, 10, 13, 14  (sorted because it’s a BST)  
- **Postorder:** 1, 4, 7, 6, 3, 13, 14, 10, 8  
- **Level order:** 8, 3, 10, 1, 6, 14, 4, 7, 13

> [!example]
> **Diagram (`traversal-skeletons.svg`)** - Show the same small tree annotated four times with arrows indicating the exact visiting order for preorder/inorder/postorder/level-order.

## Recursive Skeletons (Binary Trees)
```pseudo
function PREORDER(u):
    if u == null: return
    visit(u)
    PREORDER(u.left)
    PREORDER(u.right)

function INORDER(u):
    if u == null: return
    INORDER(u.left)
    visit(u)
    INORDER(u.right)

function POSTORDER(u):
    if u == null: return
    POSTORDER(u.left)
    POSTORDER(u.right)
    visit(u)
````

**Level order (BFS):**

```pseudo
function LEVEL_ORDER(root):
    if root == null: return
    Q = queue()
    Q.enqueue(root)
    while not Q.empty():
        u = Q.dequeue()
        visit(u)
        if u.left  != null: Q.enqueue(u.left)
        if u.right != null: Q.enqueue(u.right)
```

> [!note]  
> Replace `visit(u)` with any side effect: printing, summing, computing heights, serializing, etc.

## Iterative Patterns

### Preorder (explicit stack)

```pseudo
function PREORDER_IT(root):
    if root == null: return
    S = stack()
    S.push(root)
    while not S.empty():
        u = S.pop()
        visit(u)
        if u.right != null: S.push(u.right) // push right first
        if u.left  != null: S.push(u.left)  // so left is processed next
```

### Inorder (explicit stack)

```pseudo
function INORDER_IT(root):
    S = stack()
    u = root
    while u != null or not S.empty():
        while u != null:
            S.push(u)
            u = u.left
        u = S.pop()
        visit(u)
        u = u.right
```

### Postorder (two stacks or one stack + last-visited)

**Two-stack variant:**

```pseudo
function POSTORDER_TWO_STACKS(root):
    if root == null: return
    S1 = stack(); S2 = stack()
    S1.push(root)
    while not S1.empty():
        u = S1.pop()
        S2.push(u)
        if u.left  != null: S1.push(u.left)
        if u.right != null: S1.push(u.right)
    while not S2.empty():
        visit(S2.pop())
```

**One-stack variant (track last visited):**

```pseudo
function POSTORDER_ONE_STACK(root):
    S = stack()
    u = root
    last = null
    while u != null or not S.empty():
        if u != null:
            S.push(u)
            u = u.left
        else:
            peek = S.top()
            if peek.right != null and last != peek.right:
                u = peek.right
            else:
                visit(peek)
                last = S.pop()
```

### Level order with level boundaries

```pseudo
function LEVEL_ORDER_WITH_LEVELS(root):
    if root == null: return
    Q = queue()
    Q.enqueue(root)
    while not Q.empty():
        size = Q.size()
        // process all nodes at this depth
        for k in 1..size:
            u = Q.dequeue()
            visit(u)
            if u.left  != null: Q.enqueue(u.left)
            if u.right != null: Q.enqueue(u.right)
        end_level()  // optional hook (e.g., newline)
```

> [!tip]  
> Iterative forms provide **explicit control** over data structures. Use them to avoid deep recursion, to integrate with custom allocators, or to interleave traversal with other iterators.

## Accumulation Patterns (What to Do During `visit`)

- **Aggregates:** subtree sizes, sums, min/max - often simplest in **postorder** (children computed first).
    
- **Structural checks:** BST validity (inorder should be non-decreasing), heap property, balance factors.
    
- **Transformations:** map/filter on trees; cloning (**preorder** copies node then recurses); freeing memory (**postorder**) so children are released before parent.
    
- **Serialization:**
    
    - **Preorder with null markers** yields a unique encoding for general binary trees.
        
    - **Level order** yields compact layout for **complete** trees (array-based heaps).
        

> [!example]  
> Computing heights: `height(u) = 1 + max(height(u.left), height(u.right))` (postorder).  
> Accumulating running sum for root-to-leaf paths: pass `sumSoFar` in preorder and record at leaves.

## Complexity and Space Usage

For `n` nodes:

- **Time:** All standard traversals are `Θ(n)`.
    
- **Space (extra):**
    
    - **Recursive DFS:** `Θ(h)` stack frames, where `h` is tree height (`Θ(log n)` on balanced trees, `Θ(n)` on skewed trees).
        
    - **Iterative DFS with stack:** `Θ(h)` worst-case.
        
    - **BFS:** `Θ(w)` where `w` is the **maximum width** (nodes on the largest level). On complete trees, `w = Θ(n)` at the last level.
        

> [!note]  
> For **complete binary trees**, BFS may queue roughly `n/2` nodes near the bottom level. Prefer DFS when memory is tight and you do not need level structure.

## Common Pitfalls or Edge Cases

> [!warning]  
> **Null handling and sentinel confusion.** Always guard `null` child pointers before pushing/enqueuing. For implicit (array) trees, derive child indices carefully to avoid out-of-bounds; see [[binary-heap|Binary Heap]] for index formulas.

> [!warning]  
> **Stack overflow with deep recursion.** Skewed trees can exceed recursion limits. Use iterative variants for unbalanced inputs or increase limits cautiously.

> [!warning]  
> **Mixing orders accidentally.** Tiny changes in push order flip traversal results (e.g., pushing left before right vs the reverse). Write small tests asserting expected sequences.

> [!warning]  
> **Stateful visits with side effects.** If `visit` mutates structure (e.g., deleting nodes), ensure the traversal order still visits all intended nodes safely - **postorder** is safest for destructive operations.

> [!warning]  
> **Inorder assumptions outside BSTs.** Only BSTs guarantee sorted order under inorder; for arbitrary binary trees, inorder is just a convention.

## Implementation or Practical Context

- **Iterative vs recursive:** Iterative gives explicit control over memory and is safer for unknown depths; recursive is concise and often faster to write/read.
    
- **Morris traversals (advanced):** Preorder/inorder without extra memory by temporarily “threading” the tree via right pointers; restores structure on exit. This achieves `Θ(1)` extra space but complicates code and pointer invariants.
    
- **General trees:** Replace `left/right` with a loop over `children[]`. “Inorder” must be defined per domain (e.g., N-ary trees may choose an index `k` to visit before root, then remaining).
    
- **Parallelism:** BFS lends itself to **level-parallel** processing. DFS parallelism is possible by task spawning on subtrees (avoid oversubscription with a threshold).
    
- **Testing harness:** For each order, build small canonical trees and assert known sequences. Add randomized shape generators to catch push-order bugs.
    

> [!tip]  
> When exposing iteration APIs, provide all four: `preorder()`, `inorder()`, `postorder()`, `levelOrder()`. For BSTs, make `inorder()` the **default iterator** so `for x in bst` yields sorted keys.

> [!example]  
> **Diagram (`recursion-vs-iteration.svg`)** - Left: recursive call stack frames expanding and unwinding; Right: explicit stack/queue snapshots evolving step-by-step for the same visit order.

## Summary

Traversal orders are **contracts** about when a node is visited relative to its children:

- **Preorder**: visit **before** children - ideal for cloning, serialization, and pre-compute passes.
    
- **Inorder**: visit **between** children - exposes sorted order in BSTs.
    
- **Postorder**: visit **after** children - natural for deletions, frees, and bottom-up DP.
    
- **Level order (BFS)**: visit by **depth** - best for breadth properties, shortest-edge layers, and level-wise aggregation.
    

All run in `Θ(n)` time; pick recursive vs iterative to balance simplicity, depth safety, and memory. Combine traversal with **accumulation** to implement practical algorithms cleanly and safely.

## Related Notes

- [[preorder|Traversal - Preorder]]
    
- [[inorder|Traversal - Inorder]]
    
- [[postorder|Traversal - Postorder]]
    
- [[graph-traversals-bfs-dfs|Graph Traversals - BFS & DFS]]