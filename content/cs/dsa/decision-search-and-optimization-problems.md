---
title: Decision, Search, and Optimization Problems
description: Problems sort by what an instance's answer is allowed to be, and that shape decides which theory, which reductions, and which algorithms are available.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2026-08-27
updated:
aliases:
  - Decision Problem
  - Search Problem
  - Optimization Problem
---

Every [[cs/dsa/problem-instance|computational problem]] maps instances to acceptable answers, and problems divide cleanly by what those answers are allowed to be. The division is not bookkeeping. It decides which body of theory applies, what a reduction between two problems can look like, and often whether the problem is the one you should be solving.

> [!note] The idea
> A decision problem answers yes or no. A search problem answers with an arbitrary string satisfying a relation. A counting problem answers with how many such strings exist. A function problem answers with one output per input. An optimization problem answers with the best member of a feasible set. Complexity theory is built on the first because yes-no answers make problems into sets, and sets can be compared.

## The four shapes

**Decision.** The answer for every instance is yes or no. Primality is the standard example: given a positive integer n, is n prime? A decision problem is naturally represented as the set of instances whose answer is yes, which turns a problem into a language and makes the whole machinery of decidability and complexity classes available. A problem is decidable when some algorithm answers correctly on all inputs, and long division decides whether x divides y evenly.

**Search.** The answer can be any string. Factoring is a search problem where instances are integers and solutions are their nontrivial prime factors. It is represented as a relation of instance-solution pairs rather than a set, and a single instance may have many acceptable answers. This is the shape most working algorithms actually have.

**Counting.** How many solutions does the associated search problem have? Given n, count its nontrivial prime factors. Formally it is a function from the instance to a nonnegative integer, the cardinality of the solution set for that instance.

**Function.** One output per input, more structured than a yes or no. The traveling salesman problem in its usual form is here: given cities and pairwise distances, find the shortest route visiting each once and returning to the start. It is NP-hard, and it is a load-bearing problem in combinatorial optimization and operations research.

## Optimization sits across the split

An optimization problem asks for the best solution among all feasible ones, and it splits again by whether the variables are discrete or continuous. Discrete optimization searches a countable set for an integer, a permutation, or a graph. Continuous optimization looks for an optimal value of a continuous function, and brings its own concerns like constraints and multimodality. The set of points satisfying the problem's constraints is the search space, and the [[cs/dsa/knapsack-problem|knapsack problem]] and [[cs/math/linear-programming-and-duality|linear programming]] are the discrete and continuous archetypes.

> [!warning]
> An optimization problem and its decision version are different problems and it is worth saying which one is meant. "Find the shortest tour" and "is there a tour shorter than k" have different answer types, different proofs, and different algorithms, even though the second is how the first gets classified in complexity theory. Hardness results are usually stated about the decision version, and carrying them back to the optimization version is a step, not a given.

## Why the shape decides the tooling

[[cs/dsa/greedy-algorithms|Greedy]] and [[cs/dsa/dynamic-programming|dynamic programming]] are optimization strategies. They assume a criterion to be best under, which means they say nothing about a decision problem with no notion of better. [[cs/dsa/branch-and-bound|Branch and bound]] needs an objective to bound against, so it applies to optimization and not to a bare search problem. [[cs/dsa/backtracking-algorithms|Backtracking]] and [[cs/dsa/constraint-satisfaction-problems|constraint satisfaction]] want a feasibility question, which is why a satisfaction problem is often easier to state as decision than as optimization.

Recognizing the shape before reaching for a paradigm saves the common failure of applying an optimization technique to a feasibility question, or of building a full optimizer when the caller only needed to know whether anything works at all.

> [!example]
> **One problem, four questions.** Take a graph and a budget k.
>
> - *Decision*: does a path from s to t of weight at most k exist?
> - *Search*: produce a path from s to t of weight at most k.
> - *Counting*: how many such paths are there?
> - *Optimization*: produce the lightest path from s to t.
>
> [[cs/dsa/dijkstras-algorithm|Dijkstra's algorithm]] answers the fourth and gives the first three for free. Nothing about that is general. For most problems the four questions have genuinely different difficulty, and the counting version is frequently the hardest of the four.

## Related Notes

- [[cs/dsa/problem-instance|Problem and Instance]] - the set these shapes are taxonomies of
- [[cs/dsa/knapsack-problem|Knapsack Problem]] - a discrete optimization problem with a well known decision version
- [[cs/dsa/constraint-satisfaction-problems|Constraint Satisfaction Problems]] - feasibility posed as its own field
- [[cs/dsa/dijkstras-algorithm|Dijkstra's Algorithm]] - a case where the optimization answer subsumes the others
- [[cs/math/linear-programming-and-duality|Linear Programming and Duality]] - the continuous optimization archetype
- [[cs/math/convexity-and-optimization-basics|Convexity and Optimization Basics]] - what makes a continuous optimization tractable
- [[cs/history/turing-and-computability|Turing and Computability]] - decidability, the property decision problems are classified by

## Sources

- Computational problem, Wikipedia. https://en.wikipedia.org/wiki/Computational_problem . Backs the four types and their definitions: decision problems answering yes or no with primality as the example and the representation as the set of yes-instances, search problems with arbitrary string answers represented as a search relation with factoring as the example, counting problems as the cardinality function over a search relation, and function problems expecting a single more-complex output with the traveling salesman problem as the example together with its NP-hardness and its importance in combinatorial optimization and operations research.
- Decision problem, Wikipedia. https://en.wikipedia.org/wiki/Decision_problem . Backs the definition as a yes-no question on a set of input values, the primality and divisibility examples, the definition of a decision procedure, decidability, and long division as the decision procedure for divisibility.
- Optimization problem, Wikipedia. https://en.wikipedia.org/wiki/Optimization_problem . Backs the definition as finding the best solution from all feasible solutions, the split into discrete and continuous by whether the variables are discrete or continuous, discrete optimization over a countable set of integers, permutations, or graphs, continuous optimization over a continuous function including constrained and multimodal problems, and the definition of the search space as the set of points satisfying the problem's constraints.
