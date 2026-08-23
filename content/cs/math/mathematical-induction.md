---
title: Mathematical Induction
description: Weak, strong, and structural induction - the primary proof technique for recursive definitions and algorithm correctness.
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-03-12
updated:
aliases: []
---

## The Connection to Recursion

Induction is the proof technique that mirrors recursion. If you can write a recursive algorithm, you can structure an inductive proof with the same shape. The domino analogy is standard: if the first domino falls, and each domino knocks over the next, then every domino falls. But the real insight for CS is that induction and recursion are two sides of the same coin. Recursion breaks a problem down; induction builds a proof up. Same structure, different direction.

> [!note]
> Induction is not optional in CS. It's the primary method for proving algorithm correctness, verifying loop invariants, and establishing properties of recursive data structures. If you're uncomfortable with induction, you'll hit a wall the moment a course asks you to *prove* something works rather than just implement it.

## Weak (Simple) Induction

To prove a statement $P(n)$ holds for all $n \geq n_0$:

1. **Base case**: Show $P(n_0)$ is true.
2. **Inductive step**: Assume $P(k)$ for an arbitrary $k \geq n_0$ (the **inductive hypothesis**), and prove $P(k+1)$.

By the well-ordering principle of the natural numbers, this suffices: every $n \geq n_0$ is reachable from $n_0$ by repeated successor steps.

> [!example]
> **Sum formula.** Prove $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ for all $n \geq 1$.
>
> *Base case* ($n = 1$): $1 = \frac{1 \cdot 2}{2}$. True.
>
> *Inductive step*: Assume $\sum_{i=1}^{k} i = \frac{k(k+1)}{2}$. Then:
> $$\sum_{i=1}^{k+1} i = \frac{k(k+1)}{2} + (k+1) = \frac{(k+1)(k+2)}{2}$$
> which is the formula with $n = k+1$. QED.

## Strong Induction

The inductive hypothesis is strengthened: assume $P(j)$ for **all** $n_0 \leq j \leq k$, then prove $P(k+1)$. This is equivalent in power to weak induction but often simplifies proofs where the recursive step depends on cases smaller than $k$ but not necessarily $k$ itself.

$$\text{Strong IH: } \forall j \in [n_0, k],\; P(j) \implies P(k+1)$$

> [!example]
> **Every integer $\geq 2$ is a product of primes.**
>
> *Base case* ($n = 2$): $2$ is prime, so it's trivially a product of primes.
>
> *Inductive step*: Assume every integer $j$ with $2 \leq j \leq k$ is a product of primes. Consider $k + 1$. If it's prime, done. If not, then $k + 1 = a \cdot b$ where $2 \leq a, b \leq k$. By the strong IH, both $a$ and $b$ are products of primes, so $k + 1$ is as well. QED.

> [!tip]
> Use strong induction whenever your recursive structure doesn't just depend on the "previous" case. Divide-and-conquer algorithms (merge sort splits in half, not just peeling off one element) naturally call for strong induction in their correctness proofs.

## Structural Induction

This generalizes induction to recursively defined structures: trees, lists, formulas, ASTs. Instead of inducting on an integer, you induct on the structure of the data:

1. **Base case**: Prove $P$ for each base constructor (e.g., empty list, leaf node).
2. **Inductive step**: For each recursive constructor, assume $P$ holds for all sub-structures and prove $P$ for the constructed whole.

This directly mirrors how recursive functions process [[cs/pl/parametric-polymorphism-adts|algebraic data types]]. If you've written a recursive function over a tree, you've already done structural induction informally. The proof has exactly the same shape as the code.

> [!example]
> **Binary tree leaf bound.** Prove: for any binary tree $T$, the number of leaves $\ell(T) \leq \frac{n(T) + 1}{2}$, where $n(T)$ is the node count.
>
> *Base case*: A single-node tree has $\ell = 1$, $n = 1$, and $1 \leq \frac{2}{2} = 1$. True.
>
> *Inductive step*: Suppose $T$ has root $r$ with subtrees $T_L$ and $T_R$. By the IH, $\ell(T_L) \leq \frac{n(T_L)+1}{2}$ and $\ell(T_R) \leq \frac{n(T_R)+1}{2}$. Since $\ell(T) = \ell(T_L) + \ell(T_R)$ and $n(T) = n(T_L) + n(T_R) + 1$, the bound follows by algebra.

## When to Use Which Form

| Form | Use when... |
|------|-------------|
| Weak induction | The step from $k$ to $k+1$ only needs $P(k)$ |
| Strong induction | The step needs $P(j)$ for arbitrary $j < k+1$ (e.g., optimal substructure arguments) |
| Structural induction | The domain is a recursive data type, not integers |

## CS Proof Patterns

**Loop invariants.** Induction on iteration count proves that a loop maintains a property. The base case is the state before the first iteration; the step shows that if the invariant holds at iteration $k$, it holds at $k+1$. This is how you prove that a while loop in an algorithm actually computes what you claim it does.

**Algorithm correctness.** For [[cs/dsa/divide-and-conquer|divide-and-conquer]] or recursive algorithms, strong induction on input size shows that if the algorithm is correct on all inputs smaller than $n$, it is correct on input $n$.

**Recurrence verification.** You have a recurrence $T(n) = aT(n/b) + f(n)$ and a claimed closed form. Substitute and induct to verify it. This is the "guess and check" approach that complements the [[recurrence-relations|master theorem]].

> [!warning]
> **Common mistakes in induction proofs:**
> - Forgetting to verify the base case. Without it, the proof is vacuous. You can "prove" anything by induction if you skip the base case.
> - Using $P(k+1)$ in the proof of $P(k+1)$: that's circular reasoning, not induction.
> - Choosing the wrong inductive variable (e.g., inducting on $n$ when the recursion decreases a different quantity).
> - Off-by-one errors in the base case that leave a gap between the base and the first application of the inductive step.

> [!tip]
> When stuck on an induction proof, write the recursive algorithm first. The base case of the algorithm is the base case of the proof. The recursive calls correspond to applications of the inductive hypothesis. Match the proof structure to the code structure and it usually clicks.

## Related Notes

- [[recursion|Recursion]] - induction is the proof technique that mirrors recursive computation
- [[recurrence-relations|Recurrence Relations]] - induction verifies closed-form solutions to recurrences
- [[graph-theory|Graph Theory]] - many graph proofs proceed by induction on vertices or edges
- [[discrete-probability|Discrete Probability]] - inductive arguments establish properties of random processes
