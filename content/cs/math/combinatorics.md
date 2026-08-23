---
title: Combinatorics
description: Permutations, combinations, pigeonhole principle, and inclusion-exclusion - counting techniques for algorithm analysis and design.
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-03-12
updated:
aliases: []
---

## What Counting Gets You

Every time you analyze a brute-force solution's runtime, estimate hash collisions, or argue that a greedy choice is optimal, you're doing combinatorics. The core question is "how many ways?" and precise answers to that question are what separate "I think this is exponential" from "I can prove the search space has exactly $\binom{n}{k}$ states."

That precision drives algorithm design directly. If you know the exact count, you can decide whether brute force is feasible, estimate how much pruning buys you, or recognize when a polynomial-time approach must exist.

## Fundamental Counting Principles

- **Product rule**: if task $A$ has $m$ outcomes and task $B$ has $n$ outcomes, then $A$ followed by $B$ has $m \cdot n$ outcomes.
- **Sum rule**: if $A$ and $B$ are mutually exclusive, the total outcomes are $m + n$.

These two rules are so basic they almost don't feel worth stating, but every counting argument bottoms out at one of them.

## Permutations and Combinations

**Permutations.** An arrangement of $r$ items chosen from $n$ distinct items, where order matters:

$$P(n, r) = \frac{n!}{(n-r)!}$$

All $n$ items arranged: $n!$ permutations.

**Combinations.** A selection of $r$ items from $n$ where order does not matter:

$$\binom{n}{r} = \frac{n!}{r!(n-r)!}$$

Key identity: $\binom{n}{r} = \binom{n}{n-r}$ (choosing what to include is the same as choosing what to leave out). The binomial theorem expands $(x + y)^n = \sum_{k=0}^{n} \binom{n}{k} x^k y^{n-k}$.

**Multinomial coefficients.** When distributing $n$ distinct items into groups of sizes $k_1, k_2, \dots, k_r$ (where $\sum k_i = n$):

$$\binom{n}{k_1, k_2, \dots, k_r} = \frac{n!}{k_1! k_2! \cdots k_r!}$$

This generalizes combinations and is what you use for anagram counting (how many distinct rearrangements of MISSISSIPPI?).

## The Pigeonhole Principle

If $n$ items are placed into $m$ containers and $n > m$, at least one container holds more than one item. Generalized: some container holds at least $\lceil n/m \rceil$ items.

> [!tip]
> The pigeonhole principle sounds trivial but it's surprisingly powerful in proofs. It gives you existence results for free: you don't need to find the crowded container, you just know it's there.

Classic applications:
- In any group of 13 people, at least two share a birth month.
- A hash table with $m$ slots and $n > m$ keys **must** have at least one collision. There is no injective [[cs/security/cryptographic-hash-functions|hash function]] when the domain exceeds the range.

## Inclusion-Exclusion

For counting elements in a union of sets:

$$|A_1 \cup A_2 \cup \cdots \cup A_n| = \sum_{i} |A_i| - \sum_{i<j} |A_i \cap A_j| + \sum_{i<j<k} |A_i \cap A_j \cap A_k| - \cdots$$

This corrects for overcounting at each intersection level. It's essential for counting derangements, surjections, and elements satisfying "at least one of several properties."

> [!example]
> **Derangements** (permutations with no fixed point). For $n$ elements, let $A_i$ = "element $i$ is fixed." By inclusion-exclusion:
> $$D_n = n! \sum_{k=0}^{n} \frac{(-1)^k}{k!} \approx \frac{n!}{e}$$
> The probability of a random permutation being a derangement converges to $1/e \approx 0.368$ remarkably fast. This result shows up in problems about random shuffling and matching.

## Stars and Bars

The number of ways to distribute $n$ identical items into $k$ distinct bins is $\binom{n+k-1}{k-1}$. This comes up whenever you're counting solutions to equations like $x_1 + x_2 + \cdots + x_k = n$ with non-negative integer constraints.

## Recurrences and Catalan Numbers

Many combinatorial quantities satisfy recurrences, and recognizing the recurrence often leads to a closed form or a known sequence.

The **Catalan numbers** $C_n = \frac{1}{n+1}\binom{2n}{n}$ count an absurd number of things: valid parenthesizations, binary tree shapes, non-crossing partitions, paths that stay below the diagonal. They satisfy:

$$C_0 = 1, \quad C_{n+1} = \sum_{i=0}^{n} C_i \cdot C_{n-i}$$

> [!note]
> The Catalan numbers show up in [[dynamic-programming|Dynamic Programming]] directly. The number of distinct binary trees with $n$ internal nodes is $C_n$, which is the same as the number of ways to fully parenthesize a product of $n+1$ factors. This is exactly the structure behind matrix chain multiplication.

## Counting in Algorithm Analysis

**Subsets and brute force.** The brute-force approach to subset-sum examines all $2^n$ subsets. That count comes from $\sum_{k=0}^{n} \binom{n}{k} = 2^n$. Backtracking prunes this space, but $2^n$ is the baseline you're pruning from.

**Inversions and sorting.** The number of permutations of $n$ elements with exactly $k$ inversions (pairs out of order) follows the Mahonian distribution. Sorting algorithms that do adjacent swaps (bubble sort, [[cs/dsa/insertion-sort|insertion sort]]) take exactly as many swaps as there are inversions.

> [!warning]
> **Complement counting** is one of the most useful tricks and it's easy to forget about it. Instead of counting what you want directly, count the total minus what you don't want. Binary strings of length $n$ with at least one `1`? Total $2^n$ minus the one all-zero string gives $2^n - 1$. Always check whether the complement is easier before diving into a direct count.

**Double counting.** A proof technique where the same quantity is counted two different ways, yielding an identity. For instance, counting edges in $K_{m,n}$ by rows gives $m \cdot n$ and by degree sum gives $\sum \deg(v) / 2$, confirming $|E| = mn$. This appears frequently in graph theory proofs.

## Related Notes

- [[dynamic-programming|Dynamic Programming]] - many DP problems count combinatorial objects or optimize over them
- [[backtracking-algorithms|Backtracking]] - systematically enumerates combinatorial structures with pruning
- [[discrete-probability|Discrete Probability]] - probability computations require counting favorable outcomes
- [[mathematical-induction|Mathematical Induction]] - induction proves combinatorial identities like the binomial theorem
- [[graph-theory|Graph Theory]] - graph enumeration and coloring rely on combinatorial arguments
