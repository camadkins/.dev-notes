---
title: Problem and Instance
description: A computational problem is a set of instances with their solutions, and the problem-instance split is what makes complexity a function of input size rather than a stopwatch reading.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2026-08-27
updated:
aliases:
  - Instance
  - Computational Problem
---

Two words get used interchangeably in casual talk and mean different things in analysis. A **problem** is the general question. An **instance** is one concrete input to it. Factoring is a problem. Factoring 91 is an instance. Almost every precise statement about algorithms is really a statement about one of these two and falls apart if you attach it to the other.

> [!note] The idea
> A computational problem is a set of instances together with a possibly empty set of acceptable solutions for each one. An algorithm solves the problem when it maps every instance to one of that instance's solutions. Correctness and complexity are both properties of the mapping over the whole set, never of any single instance.

## Why the distinction carries weight

Three of the most common confusions in algorithm analysis are the same confusion.

**Correctness.** "It works" is a claim about instances you tried. [[cs/dsa/algorithm-correctness|Correctness]] is a claim about the problem, quantified over every instance in the set. The gap between those is why a test suite is evidence and a proof is proof.

**Complexity.** A running time is not a number, it is a function. Instances and solutions are represented as binary strings, and complexity is expressed as a function of the length of that representation, which is what makes it comparable across instances of different sizes. This is the reason [[cs/dsa/asymptotic-notation|asymptotic notation]] takes a size parameter at all.

**Case analysis.** Best, worst, and average are quantifiers over the instances of a given size. Worst case picks the maximum over that set, and average case takes an expectation, which requires a distribution over the set to even be well defined. Without the problem-instance split, [[cs/dsa/best-worst-average-cases|the three cases]] have nothing to range over.

## Encoding is part of the problem

Because complexity is measured against the length of the input encoding, the encoding is not an implementation detail sitting outside the analysis. It is inside it. An integer n written in binary has a representation of length about log n, so an algorithm that runs in time proportional to n is exponential in its input length, not linear. This is the whole content of the distinction between pseudo-polynomial and polynomial algorithms, and it is why the standard dynamic programming solution to the [[cs/dsa/knapsack-problem|knapsack problem]] is not a polynomial-time algorithm despite its table being filled in a nested loop.

> [!warning]
> "Linear in n" and "linear in the input size" are the same claim only when n is the count of items. When n is the magnitude of a number, they diverge by an exponential. Naming the parameter before analyzing is worth the two seconds it costs.

## Shape of the answer

Problems sort by what an instance's solution is allowed to be, and the three shapes have different theory attached to them. A yes-or-no answer makes it a decision problem, an arbitrary string makes it a search problem, and a best-under-a-criterion answer makes it an optimization problem. That taxonomy has its own note in [[cs/dsa/decision-search-and-optimization-problems|decision, search, and optimization problems]].

> [!example]
> **One problem, many instances.** Take sorting.
>
> - The *problem* is: given a sequence of n comparable elements, produce a permutation of them in nondecreasing order.
> - An *instance* is one concrete sequence, say `[5, 2, 9, 2]`.
> - The claim "[[cs/dsa/insertion-sort|insertion sort]] is `O(n^2)`" is about the problem, over all instances of each size.
> - The claim "insertion sort finished this in four comparisons" is about the instance, and generalizes to nothing.
>
> The instance `[1, 2, 3, 4]` runs insertion sort in linear time. That fact is not a counterexample to the quadratic bound, because the bound is a statement about the worst instance of each size and this is not it.

## Related Notes

- [[cs/dsa/algorithm-correctness|Algorithm Correctness]] - the property quantified over the instance set
- [[cs/dsa/decision-search-and-optimization-problems|Decision, Search, and Optimization Problems]] - the taxonomy by answer shape
- [[cs/dsa/best-worst-average-cases|Best, Worst, and Average Cases]] - quantifiers over instances of a fixed size
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]] - the machinery that makes complexity a function of input length
- [[cs/dsa/knapsack-problem|Knapsack Problem]] - where encoding length changes the verdict on a familiar algorithm
- [[cs/history/turing-and-computability|Turing and Computability]] - the setting where a problem can have no solving algorithm at all

## Sources

- Computational problem, Wikipedia. https://en.wikipedia.org/wiki/Computational_problem . Backs the definition of a computational problem as a set of instances together with a possibly empty set of solutions for each instance, the factoring example with integers as instances and prime factors as solutions, the halting problem as a problem without a solution, the statement that instances and solutions are represented as binary strings, and that complexity is expressed as a function of the length of the input representation.
- Decision problem, Wikipedia. https://en.wikipedia.org/wiki/Decision_problem . Backs the definition of a decision problem as a yes-no question on a set of input values and the primality example.
- Correctness (computer science), Wikipedia. https://en.wikipedia.org/wiki/Correctness_%28computer_science%29 . Backs that functional correctness ranges over each input rather than over tested inputs.
- Insertion sort, Wikipedia. https://en.wikipedia.org/wiki/Insertion_sort . Backs the sorted-prefix behavior used in the worked example.
