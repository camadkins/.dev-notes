---
title: Sequences and Series
description: "Adding infinitely many terms and getting a finite answer: convergence, the geometric series, and the sums hiding inside algorithm analysis."
draft: false
comments: true
tags:
  - cs
  - math
  - algorithms
date: 2026-05-02
updated:
aliases:
  - infinite-series
  - geometric-series
---

## A List, Then Its Running Total

Two objects, easy to confuse. A sequence is an ordered list of terms. A series is what you get when you decide to add them all up: "in mathematics, a series is, roughly speaking, an addition of infinitely many terms, one after the other." Any "ordered infinite sequence ... of terms, whether those terms are numbers, functions, matrices, or anything else that can be added, defines a series." Terminology follows the same split: "to emphasize that there are an infinite number of terms, series are often also called infinite series to contrast with finite series, a term sometimes used for finite sums."

You cannot add infinitely many things directly, so the definition goes through finite prefixes. Add the first $n$ terms, get a number; do that for every $n$, and you have a new sequence. "These finite sums are called the partial sums of the series." Everything about a series is a statement about the behavior of that second sequence.

> [!note] The idea
> A series is not really about infinity, it is about whether a growing total settles down. "Strictly speaking, a series is said to converge, to be convergent, or to be summable when the sequence of its partial sums has a limit. When the limit of the sequence of partial sums does not exist, the series diverges or is divergent." The CS payload is that the same question decides whether a repeated-halving process is cheap. When work per level shrinks geometrically, the total across all levels stays within a constant factor of the first level, so an algorithm that recurses forever in principle costs about as much as its top layer in practice.

## Convergence Is a Statement About Partial Sums

When "the limit of the partial sums exists, it is called the sum of the series or value of the series." That indirection is why two series with equally innocent-looking terms can behave completely differently.

The reference divergent example is the harmonic series, $1 + \tfrac{1}{2} + \tfrac{1}{3} + \tfrac{1}{4} + \cdots = \sum_{n=1}^{\infty} \tfrac{1}{n}$. Its terms shrink toward zero, and yet "the harmonic series is divergent." Terms going to zero is necessary, never sufficient. That single fact ends most naive reasoning about infinite sums, and it is the reason convergence gets its own machinery: "when a series's sequence of partial sums is not easily calculated and evaluated for convergence directly, convergence tests can be used to prove that the series converges or diverges."

Convergence is also more fragile than it looks. Reordering can change the answer. "Series with sequences of partial sums that converge to a value but whose terms could be rearranged to a form a series with partial sums that converge to some other value are called conditionally convergent series." For real numbers the damage is total: "any conditionally convergent sum of real numbers can be rearranged to yield any other real number as a limit, or to diverge. These claims are the content of the Riemann series theorem." Addition is commutative for finitely many terms and, in general, not for infinitely many.

## The Geometric Series

One series matters more than the rest for computing. "A geometric series is a series summing the terms of an infinite geometric sequence, in which the ratio of consecutive terms is constant." Each term is the previous term times a fixed multiplier: "a geometric progression is a sequence obtained from an initial term, producing the next term by multiplying it by a constant from the previous term, and continuing the process with the same constant. Such a constant is called a common ratio."

Its finite partial sums have a closed form, which is what makes it tractable. For initial term $a$ and common ratio $r \neq 1$,

$$S_n = \frac{a\left(1 - r^{n+1}\right)}{1 - r}$$

Take $n$ to infinity and the condition for a finite answer falls out: "the absolute value of r must be less than one for this sequence of partial sums to converge to a limit. When it does, the series converges absolutely." The limit is

$$S = \frac{a}{1 - r}$$

The canonical instance is the one Zeno tripped over. The series $\tfrac{1}{2} + \tfrac{1}{4} + \tfrac{1}{8} + \cdots$ "is a geometric series with common ratio 1/2, which converges to the sum of 1." Halve repeatedly forever and the total never exceeds twice the first term.

> [!example]
> Apply $S = a/(1-r)$ with $a = 1$ and $r = 1/2$: the sum is $1/(1 - 1/2) = 2$. So $1 + \tfrac{1}{2} + \tfrac{1}{4} + \cdots = 2$.
>
> Read that backwards and it is a work argument. If a process does $n$ units of work, then $n/2$, then $n/4$, and so on, the total is bounded by $2n$ no matter how many levels there are. The geometry, not the level count, sets the answer. The same formula with $r = 2$ has $|r| > 1$, so there is no finite limit at all, and a process whose per-level cost doubles is dominated by its last level instead of its first.

## Where Series Show Up in Computing

"The mathematical properties of infinite series make them widely applicable in other quantitative disciplines such as physics, computer science, statistics and finance," and geometric series specifically "are used in mathematical finance, calculating areas of fractals, and various computer science topics." Three contact points are worth naming.

**Partial sums are a data structure.** The operation that turns a sequence into its running totals has a name on both sides of the aisle: "partial summation of a sequence is an example of a linear sequence transformation, and it is also known as the prefix sum in computer science." The inverse is equally familiar: "the inverse transformation for recovering a sequence from its partial sums is the finite difference, another linear sequence transformation."

**Recursion trees are sums.** The master theorem "for divide-and-conquer recurrences provides an asymptotic analysis for many recurrence relations that occur in the analysis of divide-and-conquer algorithms," and its underlying picture is exactly a series: "the total amount of work done by the entire algorithm is the sum of the work performed by all the nodes in the tree." Grouping those nodes by depth turns a recursion into a sum over levels, and for the common cases that sum is geometric. See [[cs/dsa/recurrences-master-theorem|Recurrences and the Master Theorem]] and [[cs/dsa/recurrence-relations|Recurrence Relations]] for the algorithmic side.

**Closed forms replace loops.** The finite geometric formula above is derived by a two-line trick: multiply the partial sum by $r$, subtract, and everything telescopes. That pattern, replacing a summation with an expression evaluated once, is the same move the [[cs/math/integrals-and-the-fundamental-theorem|fundamental theorem of calculus]] makes in the continuous setting.

> [!warning]
> Convergence in the mathematical sense says a limit exists, not that you will reach it quickly. In the geometric case, "when the series converges, the rate of convergence gets slower as $|r|$ approaches 1." A ratio of 0.999 converges just as surely as a ratio of 0.5 and is useless as a numerical method. Existence and efficiency are separate questions, and only the first is what "convergent" asserts.

## Related Notes

- [[cs/math/limits-and-continuity|Limits and Continuity]] - convergence of a series is the limit of its sequence of partial sums
- [[cs/math/integrals-and-the-fundamental-theorem|Integrals and the Fundamental Theorem]] - the continuous analog of summing a series
- [[cs/dsa/recurrences-master-theorem|Recurrences and the Master Theorem]] - the recursion tree whose level sums are usually geometric
- [[cs/math/mathematical-induction|Mathematical Induction]] - the standard tool for proving a closed form for a finite sum
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis Methods]] - accounting arguments that lean on bounded total work

## Sources

- [Series (mathematics) (Wikipedia)](https://en.wikipedia.org/wiki/Series_%28mathematics%29) - series as infinite addition, partial sums, the definition of convergence and divergence, conditional convergence and the Riemann series theorem, the divergent harmonic series, and partial summation as the prefix sum.
- [Geometric series (Wikipedia)](https://en.wikipedia.org/wiki/Geometric_series) - common ratio, the finite partial-sum formula, the $|r| < 1$ convergence condition and the $a/(1-r)$ limit, and the slowing rate of convergence.
- [Master theorem (analysis of algorithms) (Wikipedia)](https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29) - the master theorem's scope and total work as the sum over all nodes of the recursion tree.
