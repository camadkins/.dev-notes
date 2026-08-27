---
title: Loop Invariant
description: An assertion preserved by every iteration, which combined with the exit condition is strong enough to prove the loop did what it claimed.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2026-08-27
updated:
aliases:
  - Loop Invariants
  - Invariant (loops)
---

A loop is the place where an algorithm stops being obvious. A straight-line sequence of statements can be read and believed. A loop that runs an unknown number of times cannot, because the thing you want to believe is a statement about all the iterations at once, and reading the body only tells you about one. The loop invariant is how that gap gets closed.

> [!note] The idea
> A loop invariant is a property that is true before the loop starts and is still true after every iteration. On exit, the invariant holds and the loop condition has become false, and the whole point of choosing a good invariant is that those two facts together imply the result you wanted.

## The three obligations

Stating an invariant is not the proof. The proof has three parts, and each one is a separate thing to check.

**Initialization.** The invariant is true before the first iteration. This is usually the easy part, and it is usually easy because the loop has done nothing yet, so the invariant is asserting something about an empty or single-element region.

**Maintenance.** If the invariant is true at the start of an iteration, it is true again at the start of the next one. This is the inductive step, and it is where the actual argument lives.

**Termination.** The loop stops, and when it does, the invariant plus the negated loop condition give you what you set out to prove.

Stanford's CS 161 runs this structure on the merge subroutine of [[cs/dsa/merge-sort|merge sort]] with the invariant that at the start of iteration k, the filled part of the output array holds the k-1 smallest elements of both inputs in sorted order. At termination k has reached m+1, so the output holds all m in order, which is exactly the postcondition of a merge.

## It is induction wearing different clothes

The maintenance obligation is the inductive step and the initialization obligation is the base case, so a loop invariant proof is [[cs/math/mathematical-induction|mathematical induction]] over the iteration count. This is not a loose analogy. When you rewrite a loop as the equivalent recursive procedure, the invariant you would have used for the loop and the inductive hypothesis you would prove about the recursion are typically the same statement.

That equivalence is useful in both directions. If the recursive version of an algorithm has an obvious inductive hypothesis, you already have the loop invariant for the iterative version.

## What an invariant does not buy you

An invariant establishes partial correctness. It says that *if* the loop exits, the result is right. It says nothing at all about whether the loop exits. In Floyd-Hoare logic this is explicit: the while rule for partial correctness takes an invariant and produces a partial correctness triple, and getting total correctness out requires a second ingredient, a measure that strictly decreases on every iteration and cannot decrease forever. The split matters enough that it has its own treatment in [[cs/dsa/algorithm-correctness|algorithm correctness]].

> [!warning]
> The properties that get left out of an invariant are the ones that feel too obvious to write down. The standard example is a bound like `i <= n` on the index variable. Nobody doubts it, so nobody states it, and then the exit argument needs it and cannot get it. If an invariant fails to discharge the exit obligation, the missing clause is usually a range fact about the loop variable.

> [!example]
> **Insertion sort.** The invariant on the outer loop is that the subarray `A[1..i-1]` holds the elements originally in those positions, in sorted order.
>
> - *Initialization*: before the first pass `i = 2`, so the region is `A[1..1]`, a single element, trivially sorted.
> - *Maintenance*: the inner loop shifts elements of the sorted prefix rightward until it finds the slot where `A[i]` belongs, then places it. The prefix is one longer and still sorted.
> - *Termination*: the loop ends with `i = n+1`, so the invariant describes `A[1..n]`, which is the whole array, sorted. That is the specification of [[cs/dsa/insertion-sort|insertion sort]].
>
> Notice that the invariant carries two clauses, sorted *and* originally in those positions. Dropping the second one would let an algorithm that overwrites everything with zeroes satisfy the invariant.

## Choosing one

An invariant has to be strong enough that the exit condition finishes the argument, and weak enough that the loop body actually preserves it. Those two pressures point in opposite directions and finding the point between them is the real work.

A practical starting move is to write the postcondition you want, then weaken it by replacing "the whole array" with "the part processed so far". That is how the [[cs/dsa/binary-search|binary search]] invariant (the target, if present, lies within the current bounds) and the insertion sort invariant are both built. The invariant is the postcondition, relativized to progress.

## Related Notes

- [[cs/dsa/insertion-sort|Insertion Sort]] - the canonical worked invariant, and the one CLRS uses to introduce the technique
- [[cs/dsa/merge-sort|Merge Sort]] - the merge subroutine's invariant, with all three obligations discharged
- [[cs/dsa/binary-search|Binary Search]] - an invariant on a shrinking interval rather than a growing prefix
- [[cs/dsa/algorithm-correctness|Algorithm Correctness]] - where partial correctness stops and termination has to be argued separately
- [[cs/math/mathematical-induction|Mathematical Induction]] - the proof technique an invariant argument is an instance of
- [[cs/dsa/recursion|Recursion]] - the form where the invariant reappears as the inductive hypothesis

## Sources

- Loop invariant, Wikipedia. https://en.wikipedia.org/wiki/Loop_invariant . Backs the definition as a property true before and after each iteration, the point that invariant plus termination condition together guarantee the exit property, the correspondence between loop invariants and the inductive hypothesis of an equivalent recursive program, and the worked observation that intuitively obvious index bounds such as `i <= n` are often omitted and then needed.
- Jessica Su, CS 161 Lecture 2, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture2.pdf . Backs the three named conditions initialization, maintenance, and termination, and the merge subroutine invariant with its discharge at k = m+1.
- Correctness (computer science), Wikipedia. https://en.wikipedia.org/wiki/Correctness_%28computer_science%29 . Backs the partial versus total correctness distinction and that total correctness requires proving partial correctness plus termination.
- Hoare logic, Wikipedia. https://en.wikipedia.org/wiki/Hoare_logic . Backs the while rule governing partial correctness of loops and the separate machinery required for total correctness.
- Insertion sort, Wikipedia. https://en.wikipedia.org/wiki/Insertion_sort . Backs the sorted-prefix invariant, that the single-element prefix is trivially sorted at the start, and that each outer iteration extends the sorted prefix by one.
