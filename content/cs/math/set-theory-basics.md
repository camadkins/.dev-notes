---
title: Set Theory Basics
description: "Sets, the union/intersection/difference/complement operations, subsets, power sets, and cardinality."
draft: false
comments: true
tags:
  - cs
  - math
  - discrete-math
date: 2026-01-22
updated:
aliases:
  - sets
---

## The Container Every Other Structure Sits In

A set is the most basic collection in mathematics: "a collection of different things," where "the things are called elements or members of the set." Two properties define it. Elements are distinct, so $\{1, 1, 2\}$ is just $\{1, 2\}$, and order does not matter, so $\{1, 2\} = \{2, 1\}$. Membership is the one primitive question, written $x \in A$.

Sets are the substrate under nearly everything else in CS. A [[cs/pl/type-systems-goals-guarantees|type]] is a set of values. A relation is a set of pairs. A hash set is this abstraction made concrete, and the [[cs/dsa/maps-and-hashtable|map]] built on it inherits the no-duplicate-keys rule directly from the definition of a set.

> [!note]
> The payload: the [[cs/math/propositional-logic|boolean connectives]] and the set operations are the same algebra wearing two costumes. Intersection is AND, union is OR, complement is NOT. An element is in $A \cap B$ exactly when it is in $A$ AND in $B$. Learn the truth tables and you already know the set identities, De Morgan's laws included.

## Membership, Subsets, and the Empty Set

$A$ is a **subset** of $B$, written $A \subseteq B$, when "every element of A is also an element of B." If $B$ also has elements $A$ lacks, $A$ is a proper subset ($A \subsetneq B$). The **empty set** is "a set with no elements," written $\emptyset$ or $\{\}$, and it is a subset of every set vacuously, since it has no element that could fail the condition.

Do not confuse membership with containment. $2 \in \{1, 2, 3\}$ (an element), but $\{2\} \subseteq \{1, 2, 3\}$ (a subset). The single-element set $\{2\}$ is a different object from the element $2$.

## The Operations

Given sets over some universe $U$:

- **Union** $A \cup B$: elements in $A$, in $B$, or in both.
- **Intersection** $A \cap B$: "those elements that belong to both A and B."
- **Difference** $A \setminus B$: elements in $A$ but not in $B$.
- **Complement** $A^c$ or $\overline{A}$: everything in the universe $U$ not in $A$, that is $U \setminus A$.

These pair off with the logical connectives one-for-one, which is why a Venn diagram (overlapping regions for each set, shaded to show an operation's result) and a truth table encode the same information. Union shades the OR region, intersection the AND overlap, complement the outside.

## Power Set and Cardinality

The **cardinality** of a set is "the number of its members," written $|A|$. For $A = \{1, 2, 3\}$, $|A| = 3$.

The **power set** $\mathcal{P}(A)$ is "the set that contains all subsets of a given set," "including the empty set and S itself." Its size is fixed by a counting argument: each element is either in or out of a given subset, two independent choices per element, so a set of $n$ elements has exactly $2^n$ subsets. Wikipedia states it directly: if $|S| = n$ "then the number of all the subsets of S is $|P(S)| = 2^n$."

That $2^n$ is not a curiosity. It is the size of the search space every [[cs/dsa/backtracking-algorithms|subset-enumeration algorithm]] walks, the reason brute-force over all [[cs/machine-learning/features-and-representations|feature combinations]] is exponential, and the same $2^n$ that bounds a [[cs/math/propositional-logic|truth table]] over $n$ variables. Subsets of an $n$-set and truth assignments to $n$ booleans are the same objects counted twice.

> [!example]
> **Power set of $\{a, b\}$.** List every subset by asking include-or-not for each element:
> $$\mathcal{P}(\{a, b\}) = \{\; \emptyset,\; \{a\},\; \{b\},\; \{a, b\}\;\}$$
> Four subsets, matching $2^2 = 4$. The empty set and the full set are always both present.

> [!warning]
> Naive set theory, taking "any definable collection is a set," is inconsistent: Russell's paradox asks whether the set of all sets that do not contain themselves contains itself, and either answer contradicts. The working fix is axiomatic set theory (ZFC), which restricts how sets are formed. For everyday CS the naive operations above are safe; the paradox is why "the set of everything" is not allowed.

## Related Notes

- [[cs/math/propositional-logic|Propositional Logic]] - the boolean algebra that set operations mirror exactly
- [[cs/math/combinatorics|Combinatorics]] - counting subsets, unions, and intersections (inclusion-exclusion)
- [[cs/math/discrete-probability|Discrete Probability]] - events are subsets of a sample set, and probability rules follow set rules
- [[cs/math/graph-theory|Graph Theory]] - a graph is a set of vertices plus a set of edges

## Sources

- [Set (mathematics) (Wikipedia)](https://en.wikipedia.org/wiki/Set_%28mathematics%29) - definitions of set, element, subset, empty set, intersection, and cardinality.
- [Power set (Wikipedia)](https://en.wikipedia.org/wiki/Power_set) - the power set as all subsets and its cardinality of 2^n.
