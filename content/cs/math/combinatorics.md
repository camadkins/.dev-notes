---
title: Combinatorics
description: Permutations, combinations, pigeonhole principle, and inclusion-exclusion — counting techniques for algorithm analysis and design.
draft: false
comments: false
tags:
  - cs
  - math
date: 2026-03-12
aliases: []
---

## Intuition

Combinatorics answers the question "how many ways?" How many possible inputs does an algorithm face? How many subsets must a search explore? How many hash collisions should we expect? Counting is foundational to complexity analysis, probability, and the design of algorithms that enumerate or optimize over structured collections. Every time you analyze a brute-force solution's runtime or argue that a greedy choice is optimal, combinatorics is at work.

Being able to count precisely separates "I think this is exponential" from "I can prove the search space has exactly $\binom{n}{k}$ states." This precision drives algorithm design: if you know the exact count, you can evaluate whether brute force is feasible, estimate how much pruning helps, or recognize when a polynomial-time solution must exist.

## Core Idea

**The fundamental counting principles:**

- **Product rule**: if task $A$ has $m$ outcomes and task $B$ has $n$ outcomes, then $A$ followed by $B$ has $m \cdot n$ outcomes.
- **Sum rule**: if $A$ and $B$ are mutually exclusive, the total outcomes are $m + n$.

**Permutations.** An arrangement of $r$ items chosen from $n$ distinct items, where order matters:

$$P(n, r) = \frac{n!}{(n-r)!}$$

All $n$ items arranged: $n!$ permutations.

**Combinations.** A selection of $r$ items from $n$ where order does not matter:

$$\binom{n}{r} = \frac{n!}{r!(n-r)!}$$

Key identity: $\binom{n}{r} = \binom{n}{n-r}$. The binomial theorem expands $(x + y)^n = \sum_{k=0}^{n} \binom{n}{k} x^k y^{n-k}$.

**Pigeonhole principle.** If $n$ items are placed into $m$ containers and $n > m$, at least one container holds more than one item. Generalized: some container holds at least $\lceil n/m \rceil$ items. Despite its simplicity, it yields powerful existence proofs (e.g., in any group of 13 people, at least two share a birth month).

**Inclusion-exclusion.** For counting elements in a union of sets:

$$|A_1 \cup A_2 \cup \cdots \cup A_n| = \sum_{i} |A_i| - \sum_{i<j} |A_i \cap A_j| + \sum_{i<j<k} |A_i \cap A_j \cap A_k| - \cdots$$

This corrects for overcounting at each intersection level. It is essential for counting derangements, surjections, and elements satisfying "at least one of several properties."

**Stars and bars.** The number of ways to distribute $n$ identical items into $k$ distinct bins is $\binom{n+k-1}{k-1}$.

**Recurrence-based counting.** Many combinatorial quantities satisfy recurrences. The Catalan numbers $C_n = \frac{1}{n+1}\binom{2n}{n}$ count the number of valid parenthesizations, binary tree shapes, and non-crossing partitions. They satisfy:

$$C_0 = 1, \quad C_{n+1} = \sum_{i=0}^{n} C_i \cdot C_{n-i}$$

**Multinomial coefficients.** When distributing $n$ distinct items into groups of sizes $k_1, k_2, \dots, k_r$ (where $\sum k_i = n$):

$$\binom{n}{k_1, k_2, \dots, k_r} = \frac{n!}{k_1! k_2! \cdots k_r!}$$

This generalizes combinations and counts arrangements of items with repeated types (e.g., anagram counting).

## Example

**Counting binary strings.** How many binary strings of length $n$ contain at least one `1`? Total strings: $2^n$. Strings with no `1`: $1$ (the all-zero string). By complement counting: $2^n - 1$.

**Pigeonhole in hashing.** A hash table with $m$ slots and $n > m$ keys must have at least one collision — there is no injective hash function when the domain exceeds the range.

**Inclusion-exclusion for derangements.** A derangement is a permutation with no fixed point. For $n$ elements, let $A_i$ = "element $i$ is fixed." By inclusion-exclusion:

$$D_n = n! \sum_{k=0}^{n} \frac{(-1)^k}{k!} \approx \frac{n!}{e}$$

**Combinations in algorithm analysis.** The brute-force approach to the subset-sum problem examines all $2^n$ subsets. Backtracking prunes this space, but the $2^n$ baseline comes directly from the count of subsets of an $n$-element set: $\sum_{k=0}^{n} \binom{n}{k} = 2^n$.

**Catalan numbers in parsing.** The number of distinct binary trees with $n$ internal nodes is $C_n$, the $n$th Catalan number. This directly relates to the number of ways to fully parenthesize a product of $n+1$ factors — a question that arises in optimizing matrix chain multiplication via dynamic programming.

**Permutations with constraints.** Many CS problems involve counting restricted permutations. For example, the number of permutations of $n$ elements with exactly $k$ inversions (pairs out of order) is given by the Mahonian distribution. Sorting algorithms that perform adjacent swaps (bubble sort, insertion sort) take exactly as many swaps as there are inversions.

**Double counting.** A proof technique where the same quantity is counted two different ways, yielding an identity. For instance, counting edges in a complete bipartite graph $K_{m,n}$ by rows gives $m \cdot n$ and by the sum of degrees gives $\sum \deg(v) / 2$, confirming $|E| = mn$. This technique frequently appears in graph theory proofs and algorithm analysis.

## Related Notes

- [[dynamic-programming|Dynamic Programming]] — many DP problems count combinatorial objects or optimize over them
- [[backtracking-algorithms|Backtracking]] — systematically enumerates combinatorial structures with pruning
- [[discrete-probability|Discrete Probability]] — probability computations require counting favorable outcomes
- [[mathematical-induction|Mathematical Induction]] — induction proves combinatorial identities like the binomial theorem
- [[graph-theory|Graph Theory]] — graph enumeration and coloring rely on combinatorial arguments
