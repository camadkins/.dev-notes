---
title: Hilbert, Gödel, Church, and the Limits of Computation
description: How mathematicians worked out what computation can never do, and in the process had to define what an algorithm even is.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-04-19
updated:
aliases:
  - Entscheidungsproblem
  - limits of computation
---

Before anyone built a computer, mathematicians worked out what computation could never do. The chain of results running from Hilbert to Gödel to Church and Turing defined the very idea of the computable, and it did so by first answering a question nobody had asked precisely: what is an algorithm?

> [!note] The idea
> Not everything is computable. There are well-posed questions that no algorithm can answer, and proving that required pinning down, for the first time, exactly what an algorithm is.

## Hilbert's dream

In 1928 David Hilbert, with Wilhelm Ackermann, posed the Entscheidungsproblem, the decision problem. It asks for an algorithm that takes [[cs/math/predicate-logic-and-quantifiers|any statement in a formal logical system]] and answers, correctly, whether it is universally valid. Hilbert believed mathematics could be made complete and mechanically decidable, and he wanted the procedure that would do it.

## Gödel's blow

The dream was already cracking. The work of Church and Turing was heavily influenced by Kurt Gödel's earlier incompleteness theorem, which showed that any formal system powerful enough to express arithmetic [[cs/math/proof-techniques|contains true statements it cannot prove]]. A complete, self-contained mathematics was off the table before the decision problem was even resolved.

## The answer is no

In 1936 Alonzo Church and Alan Turing, working independently, proved that no general algorithm for the Entscheidungsproblem exists. Church built his proof on the lambda calculus; Turing built his on [[cs/pl/abstract-machines-cek-secd|the abstract machines that now bear his name]]. To even state the result, each had to give a precise definition of "effective procedure," and their two definitions turned out to be equivalent, which is strong evidence they had captured the right notion.

## Why it matters

This is the theoretical bedrock of computer science. [[cs/history/turing-and-computability|Turing's machine]] and Church's [[cs/pl/lambda-calculus-syntax-substitution|lambda calculus]] are two faces of one idea of the computable, and the discovery that computation has hard limits is as foundational as anything that came after it.

## Related Notes

- [[cs/history/turing-and-computability|Turing and Computability]], one model of the computable
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus]], Church's equivalent model
- [[cs/history/boole-and-boolean-algebra|George Boole and the Algebra of Logic]], an earlier step in mathematizing reasoning
- [[cs/math/mathematical-induction|Mathematical Induction]], a core tool of the proofs involved
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Entscheidungsproblem," Wikipedia. https://en.wikipedia.org/wiki/Entscheidungsproblem . Supports the decision problem posed by Hilbert and Ackermann in 1928, its request for an algorithm deciding the validity of logical statements, the 1936 independent proofs by Church (lambda calculus) and Turing that no general solution exists, and the influence of Kurt Gödel's earlier incompleteness theorem on that work.
