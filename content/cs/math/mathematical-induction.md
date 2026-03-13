---
title: Mathematical Induction
description: Weak, strong, and structural induction — the primary proof technique for recursive definitions and algorithm correctness.
draft: false
comments: false
tags:
  - cs
  - math
date: 2026-03-12
aliases: []
---

## Intuition

Induction is the formal version of a domino argument: if the first domino falls, and each domino knocks over the next, then every domino falls. In CS, induction is the proof technique that matches recursion — whenever a function or data structure is defined recursively, induction is the natural way to prove properties about it. If you can write a recursive algorithm, you can structure an inductive proof with the same shape.

Understanding induction is not optional in CS — it is the primary method for proving algorithm correctness, verifying loop invariants, and establishing properties of recursive data structures. Type theorists and programming language researchers use structural induction so routinely that it becomes second nature: the shape of the proof follows the shape of the data.

## Core Idea

**Weak (simple) induction.** To prove a statement $P(n)$ holds for all $n \geq n_0$:

1. **Base case**: Show $P(n_0)$ is true.
2. **Inductive step**: Assume $P(k)$ for an arbitrary $k \geq n_0$ (the **inductive hypothesis**), and prove $P(k+1)$.

By the well-ordering principle of the natural numbers, this suffices: every $n \geq n_0$ is reachable from $n_0$ by repeated successor steps.

**Strong induction.** The inductive hypothesis is strengthened: assume $P(j)$ for all $n_0 \leq j \leq k$, then prove $P(k+1)$. This is equivalent in power to weak induction but often simplifies proofs where the recursive step depends on cases smaller than $k$ but not necessarily $k$ itself.

$$\text{Strong IH: } \forall j \in [n_0, k],\; P(j) \implies P(k+1)$$

**Structural induction.** Generalizes induction to recursively defined structures (trees, lists, formulas). Instead of inducting on an integer, you induct on the structure of the data:

1. **Base case**: Prove $P$ for each base constructor (e.g., empty list, leaf node).
2. **Inductive step**: For each recursive constructor, assume $P$ holds for all sub-structures and prove $P$ for the constructed whole.

This directly mirrors how recursive functions process algebraic data types.

**Common proof patterns in CS:**

- **Loop invariants**: induction on iteration count proves that a loop maintains a property. The base case is the state before the first iteration; the step shows that if the invariant holds at iteration $k$, it holds at $k+1$.
- **Algorithm correctness**: for divide-and-conquer or recursive algorithms, strong induction on input size shows that if the algorithm is correct on all inputs smaller than $n$, it is correct on input $n$.
- **Recurrence solutions**: verifying a closed-form solution to a recurrence $T(n) = aT(n/b) + f(n)$ by substituting and inducting.

**When to use which form:**

| Form | Use when... |
|------|-------------|
| Weak induction | The step from $k$ to $k+1$ only needs $P(k)$ |
| Strong induction | The step needs $P(j)$ for arbitrary $j < k+1$ (e.g., optimal substructure arguments) |
| Structural induction | The domain is a recursive data type, not integers |

## Example

**Sum formula.** Prove $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ for all $n \geq 1$.

*Base case* ($n = 1$): $\sum_{i=1}^{1} i = 1 = \frac{1 \cdot 2}{2}$. True.

*Inductive step*: Assume $\sum_{i=1}^{k} i = \frac{k(k+1)}{2}$. Then:

$$\sum_{i=1}^{k+1} i = \frac{k(k+1)}{2} + (k+1) = \frac{k(k+1) + 2(k+1)}{2} = \frac{(k+1)(k+2)}{2}$$

which is the formula with $n = k+1$. QED.

**Structural induction on binary trees.** Prove: for any binary tree $T$, the number of leaves $\ell(T)$ satisfies $\ell(T) \leq \frac{n(T) + 1}{2}$, where $n(T)$ is the node count.

*Base case*: A single-node tree has $\ell = 1$, $n = 1$, and $1 \leq \frac{2}{2} = 1$. True.

*Inductive step*: Suppose $T$ has root $r$ with subtrees $T_L$ and $T_R$. By the IH, $\ell(T_L) \leq \frac{n(T_L)+1}{2}$ and $\ell(T_R) \leq \frac{n(T_R)+1}{2}$. Since $\ell(T) = \ell(T_L) + \ell(T_R)$ and $n(T) = n(T_L) + n(T_R) + 1$, the bound follows by algebra.

**Strong induction example.** Prove every integer $n \geq 2$ is a product of primes.

*Base case* ($n = 2$): $2$ is prime, so it is trivially a product of primes (a single factor).

*Inductive step*: Assume every integer $j$ with $2 \leq j \leq k$ is a product of primes. Consider $k + 1$. If $k + 1$ is prime, done. If not, then $k + 1 = a \cdot b$ where $2 \leq a, b \leq k$. By the strong IH, both $a$ and $b$ are products of primes, so $k + 1 = a \cdot b$ is as well. QED.

**Common mistakes in induction proofs:**

- Forgetting to verify the base case (the proof is vacuous without it).
- Using $P(k+1)$ in the proof of $P(k+1)$ — circular reasoning.
- Choosing the wrong inductive variable (e.g., inducting on $n$ when the recursion decreases a different quantity).
- Off-by-one errors in the base case that leave a gap.

## Related Notes

- [[recursion|Recursion]] — induction is the proof technique that mirrors recursive computation
- [[recurrence-relations|Recurrence Relations]] — induction verifies closed-form solutions to recurrences
- [[graph-theory|Graph Theory]] — many graph proofs proceed by induction on vertices or edges
- [[discrete-probability|Discrete Probability]] — inductive arguments establish properties of random processes
