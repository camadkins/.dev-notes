---
title: Red–Black Tree  
description: Height-balanced binary search tree with coloring and rotation rules that ensure logarithmic operations.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - rbt-properties.svg — Visual of BST with black root, red nodes having black children, and equal black-height on all root→leaf paths.

# - rbt-insert-cases.svg — Case-by-case insert fixup: recolor, left-rotation, right-rotation with uncle red/black scenarios.

# - rbt-delete-double-black.svg — Delete fixup states: sibling red/black, near/far nephew colors, and the rotations/recolors that discharge “double black.”

# - rbt-black-height-proof.svg — Illustration of black-height and the ≤2 log(n+1) height bound.

---

## Overview

A **red–black tree (RBT)** is a **binary search tree** (BST) augmented with a **color** bit per node and a set of **local invariants** that globally bound the tree’s height by `O(log n)`. Because search, insert, and delete all maintain these invariants with at most a constant number of **rotations** and **recolorings**, RBTs are a practical default for ordered maps/sets, and they power many standard libraries.

Key promise: the **longest root–leaf path** is at most **twice** as long as the shortest, producing `Θ(log n)` worst-case time for lookup and updates, while keeping implementation complexity moderate compared to other balanced BSTs.

> [!note]  
> Notation: nodes have `key`, `left`, `right`, `parent`, and `color ∈ {RED, BLACK}`. External nulls (leaves) are treated as **black NIL** sentinels.

## Structure Definition

A red–black tree is a BST over keys with these **properties**:

1. **Every node is either RED or BLACK.**
    
2. **The root is BLACK.**
    
3. **Every NIL leaf is BLACK.**
    
4. **No RED node has a RED child** (no two reds in a row).
    
5. **Equal black-height**: every path from a node to any descendant NIL has the **same number of BLACK nodes**.
    

The **black-height** `bh(x)` of a node `x` is the number of **BLACK** nodes on any path from `x` down to, but not including, a NIL leaf; property (5) makes `bh` well-defined.

> [!example]  
> **Diagram (`rbt-properties.svg`)** — Highlight the root as black, draw several red nodes each with **black** children, and annotate equal black-heights on two distinct root→NIL paths.

## Core Operations

**Rotations** are the only shape-changing primitives; colors change only via recoloring.

### Rotation primitives (0-indexed pointers)

```pseudo
function LEFT_ROTATE(T, x):
    y = x.right
    x.right = y.left
    if y.left ≠ NIL: y.left.parent = x
    y.parent = x.parent
    if x.parent == NIL: T.root = y
    else if x == x.parent.left: x.parent.left = y
    else: x.parent.right = y
    y.left = x
    x.parent = y

function RIGHT_ROTATE(T, y):
    x = y.left
    y.left = x.right
    if x.right ≠ NIL: x.right.parent = y
    x.parent = y.parent
    if y.parent == NIL: T.root = x
    else if y == y.parent.right: y.parent.right = x
    else: y.parent.left = x
    x.right = y
    y.parent = x
```

### Insertion (BST insert + fixup)

1. Insert a new node `z` as in a BST (respect ordering), with `z.color = RED` and `z.left = z.right = NIL`.
    
2. **Fixup** while a **red–red** violation occurs (i.e., `z` has a red parent):
    
    - Let `p = parent(z)`, `g = grandparent(z)`, and `u = uncle(z)` (the other child of `g`).
        
    - **Case 1 — `u` is RED (recoloring):** set `p.color = BLACK`, `u.color = BLACK`, `g.color = RED`; then continue with `z = g`.
        
    - **Case 2/3 — `u` is BLACK (rotation + recolor):** rotate to make `z` and `p` aligned (a **triangle** becomes a **line**), then rotate around `g` and recolor `p` black and `g` red.
        
3. Finish by coloring the root **BLACK**.
    

```pseudo
function RB_INSERT(T, z):
    // standard BST insert
    y = NIL; x = T.root
    while x ≠ NIL:
        y = x
        if z.key < x.key: x = x.left else: x = x.right
    z.parent = y
    if y == NIL: T.root = z
    else if z.key < y.key: y.left = z else: y.right = z
    z.left = z.right = NIL
    z.color = RED

    // fixup
    while z.parent.color == RED:
        if z.parent == z.parent.parent.left:
            y = z.parent.parent.right  // uncle
            if y.color == RED:                 // Case 1
                z.parent.color = BLACK
                y.color = BLACK
                z.parent.parent.color = RED
                z = z.parent.parent
            else:                               // y is BLACK
                if z == z.parent.right:         // Case 2 (triangle)
                    z = z.parent
                    LEFT_ROTATE(T, z)
                z.parent.color = BLACK          // Case 3 (line)
                z.parent.parent.color = RED
                RIGHT_ROTATE(T, z.parent.parent)
        else:                                   // mirror cases
            y = z.parent.parent.left
            if y.color == RED:
                z.parent.color = BLACK
                y.color = BLACK
                z.parent.parent.color = RED
                z = z.parent.parent
            else:
                if z == z.parent.left:
                    z = z.parent
                    RIGHT_ROTATE(T, z)
                z.parent.color = BLACK
                z.parent.parent.color = RED
                LEFT_ROTATE(T, z.parent.parent)
    T.root.color = BLACK
```

> [!example]  
> **Diagram (`rbt-insert-cases.svg`)** — Panel A: uncle red → recolor (no rotations). Panel B: triangle → single rotation to line. Panel C: line → rotate at grandparent and recolor.

### Deletion (BST delete + fixup)

Deletion removes a node and can violate black-height or create a “**double black**” at the position replacing the removed black node. Standard approach:

1. Find node `z` with the key; if both children non-NIL, swap with its **successor** `y` (which has at most one non-NIL child).
    
2. Splice out `y`; let `x` be `y`’s single child (possibly NIL). Track `y_original_color`.
    
3. If `y_original_color == BLACK`, call **`RB_DELETE_FIXUP(T, x)`** to discharge the “double black” at `x`.
    

Fixup uses sibling colors and nephew configurations:

```pseudo
function RB_DELETE(T, z):
    y = z
    y_original_color = y.color
    if z.left == NIL:
        x = z.right
        TRANSPLANT(T, z, z.right)
    else if z.right == NIL:
        x = z.left
        TRANSPLANT(T, z, z.left)
    else:
        y = TREE_MINIMUM(z.right)         // successor
        y_original_color = y.color
        x = y.right
        if y.parent == z:
            x.parent = y
        else:
            TRANSPLANT(T, y, y.right)
            y.right = z.right
            y.right.parent = y
        TRANSPLANT(T, z, y)
        y.left = z.left
        y.left.parent = y
        y.color = z.color
    if y_original_color == BLACK:
        RB_DELETE_FIXUP(T, x)

function RB_DELETE_FIXUP(T, x):
    while x ≠ T.root and x.color == BLACK:
        if x == x.parent.left:
            w = x.parent.right            // sibling
            if w.color == RED:            // Case 1: sibling red
                w.color = BLACK
                x.parent.color = RED
                LEFT_ROTATE(T, x.parent)
                w = x.parent.right
            if w.left.color == BLACK and w.right.color == BLACK: // Case 2
                w.color = RED
                x = x.parent
            else:
                if w.right.color == BLACK: // Case 3: far nephew black, near red
                    w.left.color = BLACK
                    w.color = RED
                    RIGHT_ROTATE(T, w)
                    w = x.parent.right
                w.color = x.parent.color   // Case 4: far nephew red
                x.parent.color = BLACK
                w.right.color = BLACK
                LEFT_ROTATE(T, x.parent)
                x = T.root
        else:                               // mirror cases
            w = x.parent.left
            if w.color == RED:
                w.color = BLACK
                x.parent.color = RED
                RIGHT_ROTATE(T, x.parent)
                w = x.parent.left
            if w.right.color == BLACK and w.left.color == BLACK:
                w.color = RED
                x = x.parent
            else:
                if w.left.color == BLACK:
                    w.right.color = BLACK
                    w.color = RED
                    LEFT_ROTATE(T, w)
                    w = x.parent.left
                w.color = x.parent.color
                x.parent.color = BLACK
                w.left.color = BLACK
                RIGHT_ROTATE(T, x.parent)
                x = T.root
    x.color = BLACK
```

> [!example]  
> **Diagram (`rbt-delete-double-black.svg`)** — Four canonical cases (sibling red, sibling black with both nephews black, sibling black with near red/far black, sibling black with far red). Track how rotations move the red nephew into the far position and recolor to eliminate the double black.

## Example (Stepwise)

**Insert 41, 38, 31, 12** (empty tree initially):

- Insert **41** (root colored black by fixup).
    
- Insert **38** (red child of black → OK).
    
- Insert **31**: parent **38** is red and uncle (right of 41) is **NIL (black)**; triangle about `(41 ← 38 → 31)`. Rotate **right at 38** to line up, then **left at 41**, recolor to make new root black, children red.
    
- Insert **12**: recolor with red uncle if encountered, else rotate/recolor depending on orientation. In a few steps, invariants hold and height stays small.
    

**Delete 38**:

- Successor swap if needed; splice out successor `y`.
    
- If the removed node was black, run delete fixup. Follow the sibling cases to discharge double black with at most **two rotations** and a few recolors.
    

> [!tip]  
> During debugging, log **(node, color, bh)** along the modified path; black-height should remain the same at affected subtrees after each fixup step.

## Complexity and Performance

Let `n` be the number of nodes.

- **Search**: `O(log n)` worst-case (height bounded).
    
- **Insert**: `O(log n)` search plus **≤ 2 rotations** and `O(1)` recolors.
    
- **Delete**: `O(log n)` search plus **≤ 3 rotations** and `O(1)` recolors in fixup.
    
- **Space**: `Θ(n)` (one color bit; many implementations pack color in a parent pointer’s low bit or alongside metadata).
    

**Height bound.** From properties (4) and (5):

- Longest path alternates red/black at most, so its length ≤ **2 × black-height**.
    
- Each subtree with black-height `bh` has at least `2^{bh} − 1` internal nodes.
    
- Therefore `h ≤ 2 log2(n + 1)`, giving the logarithmic guarantees.
    

> [!example]  
> **Diagram (`rbt-black-height-proof.svg`)** — Show two root→leaf paths: a short all-black path and a longest alternating red/black path ≤ 2× longer, with a side note that each black contributes to `bh`.

## Implementation Details or Trade-offs

### Sentinels vs nulls

- Use a single **shared black `NIL` sentinel** for all external leaves (simplifies color checks and avoids null-branching). Root’s parent may also be a `NIL` sentinel.
    

### Color storage

- Pack color in pointer bits (if aligned) or store as a single byte; keep the hot fields contiguous to help cache locality.
    

### API design

- Expose map/set operations (`find`, `lower_bound`, `insert`, `erase`, `iterate in-order`).
    
- Provide iterators via in-order successor/predecessor using parent pointers.
    

### Iterator stability

- Rotations **preserve in-order sequence**, so iterators to elements remain valid except to erased nodes (container-specific rules apply).
    

### Comparators

- Require a **strict weak ordering** comparator (transitive, antisymmetric). Comparator bugs can violate BST invariants and break balancing logic.
    

### Deletion corner cases

- When removing a **red** node, no fixup is needed (colors/bh unchanged).
    
- When splicing a **black** with a **red** child, color the child **BLACK** and skip fixup (discharges the double black immediately).
    

### Testing harness

- After random sequences, verify:
    
    1. Root is black;
        
    2. No red–red edges;
        
    3. Equal black-height on all root→NIL paths;
        
    4. In-order traversal is sorted and has exactly `n` nodes.
        

> [!warning]  
> **Mixing mirrored cases** (left/right) is a classic source of bugs. Implement left-cases and generate right-cases mechanically (or through a macro/templating trick) to avoid divergence.

> [!warning]  
> **Forgetting to update parents** during rotations (especially `NIL` parents) silently corrupts the structure and causes iterator crashes later.

> [!warning]  
> **Recolor order** matters: in delete fixup Case 4, copy parent’s color to sibling before painting parent and far nephew black, then rotate.

## Practical Use Cases

- **Ordered maps/sets** in language libraries: C++ `std::map`/`std::set`, many JVM collections, OS schedulers.
    
- **Event queues and interval indexes** needing ordered traversal plus fast updates.
    
- **Database/storage engines** (memory-resident trees) where consistent worst-case bounds beat average-case structures.
    

> [!tip]  
> If you need **order statistics** (select k-th, rank queries), augment nodes with **subtree sizes** and maintain them across rotations—RBT balancing and size updates compose cleanly.

## Limitations / Pitfalls

> [!warning]  
> **Deletion complexity** is higher than insertion; ensure all four sibling cases (and mirrors) are covered. Missing a near/far nephew check leads to infinite loops or property violations.

> [!warning]  
> **Pathological comparator** (non-transitive, inconsistent across calls) can create cycles or break the BST invariant; validate comparator semantics in debug builds.

> [!warning]  
> **Incorrect NIL handling** during fixups. Treat external leaves as **black** nodes; accessing fields through actual `null` rather than a `NIL` sentinel tends to add branches and bugs.

## Summary

Red–black trees are **height-balanced BSTs** that guarantee `O(log n)` operations through a compact set of **coloring rules** and **local rotations**. Insertion is handled by at most two rotations and a small recolor dance; deletion by a well-understood **double-black** fixup. Their balance guarantee, modest memory overhead, and robust performance under arbitrary update sequences explain their dominance as the default **balanced ordered container** in general-purpose libraries.

## See also

- [[bst|Binary Search Tree]]
    
- [[cs/dsa/avl-tree|AVL Tree]]
    
- [[cs/dsa/splay-tree|Splay Tree]]
    
- [[cs/dsa/trees|Trees]]