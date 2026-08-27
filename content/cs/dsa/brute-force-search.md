---
title: Brute Force Search
description: Enumerate every candidate and test it, the baseline paradigm every cleverer strategy is measured against and the one that is sometimes correct to ship.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2026-08-27
updated:
aliases:
  - Brute Force
  - Exhaustive Search
  - Generate and Test
---

Brute force search, also called exhaustive search or generate and test, systematically checks every possible candidate against the problem's statement and keeps the ones that satisfy it. It is the first algorithmic paradigm anyone learns and the last one anyone respects, which is unfortunate, because it has properties the sophisticated paradigms do not.

> [!note] The idea
> Brute force is defined by what it refuses to assume. It exploits no structure in the problem, so it needs no proof that the structure exists, and it will find a solution whenever one exists. Its cost is proportional to the size of the candidate set, and that set is usually the thing that kills it.

## Four procedures

Applying brute force to a class of problems means supplying four operations, each taking the data P for a particular [[cs/dsa/problem-instance|instance]]:

- `first(P)` produces the first candidate
- `next(P, c)` produces the candidate after `c`
- `valid(P, c)` tests whether `c` solves `P`
- `output(P, c)` does something with a solution

`next` also has to signal exhaustion, conventionally by returning a distinguished null value distinct from every real candidate. The driver is then a loop that walks from `first` to null, testing each candidate. That structure is worth noticing because it is the same shape as the deck-standard `FIND_IN_ARRAY` pseudocode that returns Null on a miss, and because brute force applied to a table is exactly [[cs/dsa/linear-search|linear search]].

## When it is the right answer

The reflex is to treat brute force as the thing you replace. Four situations invert that.

**The candidate set is small and bounded.** If n is capped by the problem domain, an exponential in n can still be a rounding error. Optimizing it buys nothing and costs a new opportunity for a bug.

**Simplicity is worth more than speed.** In code where a subtle error carries serious consequences, the algorithm nobody can get wrong has real value. This is the same reasoning behind using an exhaustive check inside a computer-assisted proof: the argument's credibility depends on the checker being simple enough to audit.

**As a benchmark.** A brute force implementation is the reference answer for testing a fast one. Run both on small instances and diff. This gives a stronger correctness signal than hand-written expected values, because it is generated from an independent implementation.

**As a baseline.** Brute force can be read as the simplest metaheuristic, the one with no heuristic at all, which makes it the floor any smarter method has to beat to justify itself.

> [!warning]
> Brute force and [[cs/dsa/backtracking-algorithms|backtracking]] are not the same paradigm and the words get swapped constantly. Backtracking discards large sets of candidates without enumerating them, by abandoning a partial assignment the moment it cannot be extended. The classic eight queens solution is backtracking, and describing it as brute force loses the only interesting thing about it. [[cs/dsa/branch-and-bound|Branch and bound]] adds a bound function on top, pruning subtrees that cannot beat the best solution found so far. Both are pruned searches over the same space that brute force walks in full.

> [!example]
> **Divisors of n.** The instance data P is the number n. `first(n)` returns 1, `next(n, c)` returns `c + 1` while `c < n` and null afterward, and `valid(n, c)` is true when `c` divides n with no remainder. The loop runs n times and does one modulo each pass.
>
> Now read that with the encoding in mind. The input is the number n, whose representation has length about `log n`, so n iterations is exponential in the input length. The obvious improvement, stopping at `sqrt(n)`, cuts the work enormously and is still exponential in the input size. Brute force did not become a good algorithm; it became a faster bad one.

## The failure mode

The candidate set almost never grows gently. Adding one element to a permutation problem multiplies the space, and the growth is [[cs/dsa/combinatorial-explosion|combinatorial explosion]], which is what puts most brute force approaches out of reach at sizes that look modest. Either the problem has structure a paradigm like [[cs/dsa/dynamic-programming|dynamic programming]] or [[cs/dsa/greedy-algorithms|greedy]] can exploit, or a heuristic shrinks the candidate set to something manageable, or the instance stays small. There is no fourth option.

## Related Notes

- [[cs/dsa/linear-search|Linear Search]] - brute force specialized to finding an item in a table
- [[cs/dsa/backtracking-algorithms|Backtracking]] - the same search space with unextendable partial candidates abandoned early
- [[cs/dsa/branch-and-bound|Branch and Bound]] - backtracking plus a bound function that prunes on optimality
- [[cs/dsa/combinatorial-explosion|Combinatorial Explosion]] - the growth curve that makes exhaustive enumeration fail
- [[cs/dsa/problem-instance|Problem and Instance]] - why n iterations can be exponential in the input length
- [[cs/dsa/constraint-satisfaction-problems|Constraint Satisfaction Problems]] - a domain where pruned search is the standard tool
- [[cs/security/password-hashing-and-salting|Password Hashing and Salting]] - a place where the defense is deliberately raising the cost of exhaustive search

## Sources

- Brute-force search, Wikipedia. https://en.wikipedia.org/wiki/Brute-force_search . Backs the definition and the alternate names exhaustive search and generate and test, the divisors and eight queens examples, that implementation cost is proportional to the number of candidate solutions, that it is used when problem size is limited or heuristics reduce the candidate set or simplicity outweighs speed, the critical-application and computer-assisted-proof justifications, its use as a benchmarking baseline and as the simplest metaheuristic, the four procedures first, next, valid, and output with the null candidate convention, the driver loop, the worked divisors instance, and the explicit warning that brute force should not be confused with backtracking, together with the identification of brute force on a table as linear search.
- Combinatorial explosion, Wikipedia. https://en.wikipedia.org/wiki/Combinatorial_explosion . Backs the growth of problem complexity with input and constraints and its use to justify intractability.
- Computational problem, Wikipedia. https://en.wikipedia.org/wiki/Computational_problem . Backs that complexity is expressed as a function of the length of the input representation, which is what makes the divisors example exponential.
