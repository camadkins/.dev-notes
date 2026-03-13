---
title: Greedy Algorithms
description: Locally optimal choices that yield globally optimal solutions when specific structure (e.g., matroids, exchange/optimal-substructure) holds.
draft: false
comments: true
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-11-08
aliases: []
---

## Overview

**Greedy algorithms** build solutions step by step, each time selecting the **locally best** option by a simple rule (e.g., smallest weight, earliest finish, highest ratio) and **never revisiting** that choice. Greedy methods can be extremely fast and simple, but they are correct only when a problem's structure guarantees that **local optimality composes into global optimality**. Typical justification tools include the **exchange argument**, **cut/greedy-choice properties**, and (for abstract families) **matroid theory**.

## Motivation

Greedy algorithms often beat dynamic programming and backtracking in **simplicity**, **speed**, and **space**, especially when the problem has:

- a **natural ordering** of choices (earliest finish, lowest weight, lexicographic),

- a **feasible prefix** property (partial greedy solutions can be extended), and

- a **structure** that ensures **exchanges** can fix any deviation from greedy without harming optimality.


They are the right fit for many scheduling, spanning tree, data compression, and selection problems. When greedy fails, it often fails **spectacularly** - so proofs and counterexamples matter.

## Definition and Formalism

A greedy algorithm is specified by:

- a **feasibility system** of partial solutions (what prefixes are allowed),

- a **selection rule** that picks the "best" next item under some **key** or **priority**, and

- an **irrevocable commit** step that accepts the choice and restricts the remaining options.


Two classic proof frameworks:

1. **Greedy-choice property:** There exists an optimal solution starting with the greedy choice.

2. **Exchange argument:** For any optimal solution that doesn't start like greedy, we can **swap** in the greedy choice and repair the rest to get another optimal solution. Repeating this aligns the whole solution with the greedy one.


A unifying abstraction is a **matroid**: a set system `(E, 𝕀)` with heredity and the **exchange axiom**. On a matroid, greedy with any **monotone weight order** maximizes weight of an independent set. Minimum spanning trees and interval scheduling fit related "exchangeable" structures even when not full matroids.

## Example or Illustration

### Interval Scheduling (maximize # of non-overlapping intervals)

**Goal:** Select as many intervals as possible.
**Greedy rule:** Sort by **earliest finish time**, then repeatedly take the first interval that doesn't conflict with the last chosen.

```pseudo
function INTERVAL_SCHEDULING(intervals):
    sort intervals by finish time increasing
    S = []
    last_end = -∞
    for (s, f) in intervals:
        if s ≥ last_end:
            S.append((s,f))
            last_end = f
    return S
```

**Why it works (exchange sketch):** Let `G` be the greedy set and `O` any optimal set. Compare both in finish-time order. The first time they differ, replace `O`'s earlier-finished conflicting interval with `G`'s choice - this never reduces the room for future intervals. Repeating yields a set the same size as `O` but beginning with `G`'s choices, hence greedy is optimal.

### Huffman Coding (optimal prefix-free compression)

**Goal:** Build a prefix-free binary code minimizing total weighted length `∑ f_i · depth(i)`.
**Greedy rule:** Repeatedly combine the two **least frequent** symbols into a new node; assign 0/1 edges arbitrarily; repeat until one tree remains.

```pseudo
function HUFFMAN(freqs):
    Q = min-heap of leaves keyed by frequency
    while Q.size > 1:
        x = Q.extract_min()
        y = Q.extract_min()
        z = new node with freq = x.freq + y.freq
        z.left = x; z.right = y
        Q.insert(z)
    return Q.extract_min()   // root of optimal code tree
```

**Why it works (greedy-choice + exchange):** An optimal tree has the **two lowest-frequency symbols as siblings at maximum depth**. Merging them first and treating the pair as one symbol preserves optimality; induction finishes the proof.

### Minimum Spanning Tree (Kruskal/Prim)

Both are greedy:

- **Kruskal:** add the **lightest** edge that doesn't create a cycle (by union–find).

- **Prim:** grow a tree by repeatedly adding the lightest edge **cutting** from the tree to a new vertex.
    **Cut property:** the minimum edge crossing any cut of the graph is safe to take - an exchange/cut argument proves correctness.


See [[minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees - Kruskal & Prim]] and [[huffman-coding|Huffman Coding]].

## Properties and Relationships

- **Optimal substructure vs overlapping subproblems.** Greedy relies on **optimal substructure** plus a **greedy-choice property**; when subproblems overlap and local choices are insufficient, use [[dynamic-programming|Dynamic Programming]].

- **Matroids and partition matroids.** Greedy is guaranteed for maximizing weight over **matroid** independent sets. Interval scheduling is consistent with a matroid-like exchange condition; MSTs rely on cut/cycle properties (graphic matroid).

- **Greedy vs divide & conquer.** Greedy commits **now**; D&C defers to combine later; DP stores all subproblem outcomes. Pick the simplest paradigm that the structure allows.


## Implementation or Practical Context

**1) Greedy proof sketch templates**

- **Exchange template.**

    1. Let `G` be greedy's output; let `O` be an optimal solution.

    2. Identify the first decision point where `G` and `O` differ.

    3. Show a **swap** that replaces `O`'s choice with `G`'s without decreasing optimality.

    4. Repeat to transform `O` into `G`; conclude `G` is optimal.

- **Cut/choice template.**

    1. Identify a **cut** or a structural partition.

    2. Prove that some **locally best** element crossing the partition is **safe** to commit.

    3. Reduce the instance and iterate.


**2) Robustness checklist**

- **Feasibility invariant:** After each choice, the partial solution remains feasible.

- **Monotone key:** The selection rule should be monotone with respect to the remaining feasible set.

- **Ties:** Specify deterministic tie-breaking (e.g., by index) for reproducibility; proofs must tolerate ties.

- **Data structures:** Heaps, union–find, or sorted lists often make greedy **O(m log n)** or **O(n log n)**.


**3) Typical complexities**

- Sorting-driven greedy (intervals): `O(n log n)` for sorting; linear scan thereafter.

- Heap-based selection (Huffman): `O(n log n)` with a min-heap.

- Graph edge selection (Kruskal): `O(m log n)` with sorting + union–find near-linear; (Prim): `O(m log n)` with a heap, `O(m + n log n)` variants.


## Common Misunderstandings

> [!warning]
> **Using the wrong local rule.** Interval scheduling needs **earliest finish**, not earliest start or shortest duration. Knapsack 0/1 is **not** solved by highest value/weight ratio (that rule solves **fractional** knapsack).

> [!warning]
> **Ignoring structure.** Without cut/exchange/matroid structure, greedy can be arbitrarily bad. Always validate the rule with a proof or a counterexample.

> [!warning]
> **Assuming greedy generalizes.** Huffman's approach does **not** extend to ternary codes by just "picking three minima" unless you adapt the invariant (you must combine `r` least nodes for `r`-ary codes).

> [!warning]
> **Hidden constraints.** Greedy can break if feasibility is stateful (e.g., deadlines with release times, resource coupling) unless the rule accounts for those constraints.

## Broader Implications

Greedy methods are favored in **real-time systems** (fast, low memory), **streaming** (one-pass choices), and **distributed** settings (decisions made locally with limited coordination). They also seed **approximation algorithms** (e.g., set cover with logarithmic guarantees) where exact optimality is hard but greedy still provides **provable bounds**.

## Summary

Greedy algorithms succeed when **local choices are globally safe**. Prove that property with an **exchange** or **cut** argument (or by appealing to matroid structure), then implement with the right **priority structure**. Use sorting or heaps to keep complexity near `O(n log n)`; specify ties and invariants precisely. When in doubt, test against **counterexamples** - and switch to dynamic programming if local choices don't compose.

## Related Notes

- [[minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees - Kruskal & Prim]]

- [[huffman-coding|Huffman Coding]]

- [[dynamic-programming|Dynamic Programming]]

- [[algorithm-efficiency|Algorithm Efficiency]]
