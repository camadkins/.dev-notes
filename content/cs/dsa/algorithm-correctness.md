---
title: Algorithm Correctness
description: Correctness is quantified over every instance, and it splits into partial correctness plus termination, which is why testing cannot establish it.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2026-08-27
updated:
aliases:
  - Correctness
  - Partial and Total Correctness
---

An algorithm is correct with respect to a specification when it behaves as specified. That sentence sounds like a formality until you look at where the quantifier sits. Correctness is a claim about every input the algorithm admits, not about the inputs anyone has run. A procedure that produces the right answer on a thousand cases and the wrong answer on the thousand-and-first is not a correct algorithm with a rare defect. It is an incorrect algorithm.

> [!note] The idea
> Functional correctness has two independent halves. **Partial correctness** says that if the algorithm returns, the answer satisfies the specification. **Total correctness** additionally says that it returns. Proving total correctness means proving both, and the second half is the one that cannot be automated in general.

## The quantifier is the whole difference

A [[cs/dsa/problem-instance|computational problem]] is a set of instances together with the acceptable solutions for each. Correctness ranges over that set. This is why a passing test suite is evidence and not proof: a test exercises finitely many instances, and the claim is about all of them, which for most interesting problems is an infinite set.

The practical consequence is that a correctness argument has to be structural. It has to say something about the shape of the computation that holds regardless of which instance arrived. That is what a [[cs/dsa/loop-invariant|loop invariant]] is for on the iterative side, and what an inductive hypothesis is for on the recursive side. Both are ways of making a statement about all instances without enumerating them.

## Partial correctness and termination

The split is sharper than it first looks, because the two halves fail in different ways and are proved by different means.

Partial correctness is a conditional claim, and a conditional claim is cheap to satisfy vacuously. A program that never returns is partially correct with respect to every specification, since the antecedent never fires. The standard illustration is a search over the positive integers for an odd perfect number. It is short, it is partially correct, and asserting that it terminates would be asserting that an odd perfect number exists, which is an open question in number theory. The program is easy. The termination claim is a research result nobody has.

Termination proofs cannot be fully mechanized, and the reason is the halting problem: no algorithm decides, for arbitrary program and input, whether the computation stops. [[cs/history/turing-and-computability|Turing's result]] is not a remark about the current state of tooling. It is a limit on what any tool can do, which is why termination arguments stay a human obligation and why practical termination proofs work by exhibiting a measure that strictly decreases into a well-founded order rather than by inspection.

> [!warning]
> Partial correctness plus "it finished when I ran it" is not total correctness. It is partial correctness plus one data point about one instance. The gap between those two is where the interesting bugs live, and it widens exactly when input size grows past what anyone tested.

## What correctness is not measured against

A correctness proof is a mathematical statement about an algorithm and a specification, both given formally. It is deliberately not a statement about a particular program on a particular machine, which would drag in memory limits, integer width, and floating point behavior. Those are real concerns and they belong to implementation, not to the algorithm.

This is the same abstraction boundary that makes [[cs/dsa/asymptotic-notation|asymptotic analysis]] possible. Both correctness and complexity are defined over an abstract machine so that the properties survive a change of hardware or language. An algorithm that is correct stays correct when you port it. Whether the *program* stays correct is a separate question with a separate answer.

> [!example]
> **Two ways to be wrong.** Consider a routine meant to return the maximum of a nonempty array.
>
> - *Partially correct, not total*: it loops while the index differs from the length, and the length is negative. The comparison never becomes true, the loop never exits, and no wrong answer is ever produced. Nothing is produced.
> - *Total, not correct*: it initializes the running maximum to zero rather than to the first element, then returns after one clean pass. It always terminates and it is wrong on any array of negative numbers.
>
> The two failures need two different arguments to rule out, and a proof that addresses only one of them has addressed half the problem.

## Related Notes

- [[cs/dsa/loop-invariant|Loop Invariant]] - the standard device for establishing the partial half on an iterative algorithm
- [[cs/dsa/problem-instance|Problem and Instance]] - the set correctness is quantified over
- [[cs/math/mathematical-induction|Mathematical Induction]] - the underlying proof form for both loops and recursion
- [[cs/math/proof-techniques|Proof Techniques]] - the broader toolkit a correctness argument draws on
- [[cs/history/turing-and-computability|Turing and Computability]] - why the termination half has no general decision procedure
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]] - the other axis an algorithm is judged on once it is known to be right

## Sources

- Correctness (computer science), Wikipedia. https://en.wikipedia.org/wiki/Correctness_%28computer_science%29 . Backs the definition of correctness with respect to a specification, the definition of functional correctness as input-output behavior, the partial versus total correctness distinction, that total correctness follows from partial correctness plus termination, that termination proofs can never be fully automated because the halting problem is undecidable, the odd perfect number example, and that a correctness proof is a statement about algorithm and specification rather than about a program on a given machine with its memory limits.
- Computational problem, Wikipedia. https://en.wikipedia.org/wiki/Computational_problem . Backs the framing of a computational problem as a set of instances together with the solutions for each instance, and the halting problem as a computational problem with no solution.
- Loop invariant, Wikipedia. https://en.wikipedia.org/wiki/Loop_invariant . Backs the use of invariants in the Floyd-Hoare approach to prove correctness properties of loops, and the correspondence between loop invariants and inductive hypotheses.
- Hoare logic, Wikipedia. https://en.wikipedia.org/wiki/Hoare_logic . Backs the formal system for reasoning about program correctness through assertions, and the separation of partial from total correctness in its inference rules.
