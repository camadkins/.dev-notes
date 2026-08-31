---
title: Time Complexity Analysis
description: Rigorous techniques to bound running time using cost models, asymptotics, and recurrences.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-02
aliases: []
---

## Overview
**Time complexity analysis** predicts how an algorithm's running time scales with input size `n`. The goal is not to count literal CPU cycles but to obtain **asymptotic bounds** - usually `$O(\cdot)$`, `$Ω(\cdot)$`, `$Θ(\cdot)$` - that remain stable across machines and implementations. A disciplined analysis uses a **cost model**, **dominant-term extraction**, and (when needed) **recurrences** for recursive algorithms.

> [!note]
> Complexity is a *function of input size and structure*. For many algorithms, best, worst, and average cases differ. Report the one most relevant to the use case and model assumptions.

## Motivation
- **Design feedback:** reveals bottlenecks early and guides data-structure choices.
- **Scalability checks:** ensures performance remains acceptable as `n` grows.
- **Comparisons:** provides machine-independent yardsticks for alternative approaches.
- **Contracts:** communicates guarantees (e.g., `$O(\log n)$` lookup) to users of a library.

## Definition and Formalism
An algorithm's time cost on input `x` is the number of primitive steps `T(x)` under a chosen **unit-cost** model. For input size `n = |x|`, define:
- **Worst-case:** `T_max(n) = max_{|x|=n} T(x)`
- **Best-case:** `T_min(n) = min_{|x|=n} T(x)`
- **Average-case:** `E[T(x) | |x|=n]` under a distribution over inputs

Asymptotic notation:
- `$O(g(n))$`: upper bound up to constant factors
- `$Ω(g(n))$`: lower bound
- `$Θ(g(n))$`: tight bound; both `$O$` and `$Ω$`

> [!tip]
> When possible, prefer `$Θ(\cdot)$` to communicate tight growth. If only an upper bound is known, use `$O(\cdot)$`, but say why a tighter bound is unknown or unnecessary.

### Cost models
- **RAM model:** Each primitive operation (arithmetic, assignment, comparison, array index) costs `$Θ(1)$`. Memory is word-addressable. Good for most DS&A.
- **Bit model:** Cost reflects operand bit-length. Needed for **big integers**, cryptography, and exact arithmetic.
- **I/O or cache model:** Dominates when [[cs/systems/memory-hierarchy-and-caching|memory hierarchy]] costs overshadow CPU (e.g., external sort). Count **block transfers** rather than primitive ops.

[!example]
**Example (RAM vs bit model):** Adding two `b`-bit integers is `$Θ(1)$` in RAM, but `$Θ(b)$` in the bit model. An algorithm "linear-time" in RAM could be superlinear when numbers grow with `n`.

## Example or Illustration
Consider the following pseudocode:

```pseudo
function F(A):                      // A has length n
    s = 0                           // 1
    for i in 0..n-1:                // n iterations
        s = s + A[i]                // 1 per iter
    return s                        // 1
````

Under the RAM model, `T(n) = 1 + n·1 + 1 = n + 2 = Θ(n)`.

Nested loops:

```pseudo
for i in 0..n-1:
    for j in 0..n-1:
        work()                      // O(1)
```

The inner loop runs `n` times for each `i`: total `n·n = n^2` → `$Θ(n^2)$`.

Triangular loops:

```pseudo
for i in 0..n-1:
    for j in 0..i:
        work()
```

The work count is `Σ_{i=0}^{n-1} (i+1) = n(n+1)/2 = Θ(n^2)`.

Binary search:

```pseudo
lo = 0; hi = n-1
while lo <= hi:
    mid = floor((lo+hi)/2)
    if A[mid] == x: return true
    if A[mid] < x: lo = mid + 1 else hi = mid - 1
return false
```

The interval halves each iteration; iterations `≈ ⌈log₂ n⌉` → `$Θ(\log n)$`.

## Properties and Relationships

### Dominant-term rule

Drop lower-order terms and constant factors.
`3n^2 + 7n + 10` is `$Θ(n^2)$`.
`n log n + 100n` is `$Θ(n \log n)$`.

### Composition and sums

- Sequential composition adds costs: `T(n) = T₁(n) + T₂(n)` → dominated by the larger term.

- Conditional statements take the **maximum** of branch costs for worst-case.


### Recurrences

Many recursive algorithms are captured by a **recurrence relation**. Common patterns:

1. **Halving with constant work (binary search):**
    `$T(n) = T(n/2) + Θ(1) ⇒ T(n) = Θ(\log n)$`.

2. **Divide and conquer with linear merge (merge sort):**
    `$T(n) = 2T(n/2) + Θ(n) ⇒ T(n) = Θ(n \log n)$`.

3. **Quadratic partitioning (naive quicksort worst-case):**
    `$T(n) = T(n-1) + Θ(n) ⇒ T(n) = Θ(n^2)$`.


> See [[cs/dsa/recurrence-relations|Recurrence Relations]] and [[cs/dsa/recurrences-master-theorem|Recurrences - Master Theorem]] for systematic solutions.

### Master Theorem (quick recall)

For `$T(n) = aT(n/b) + f(n)$` with `a ≥ 1`, `b > 1`:

- If `$f(n) = O(n^{\log_b a - ε})$` → `$T(n) = Θ(n^{\log_b a})$`.

- If `$f(n) = Θ(n^{\log_b a} \log^k n)$` → `$T(n) = Θ(n^{\log_b a} \log^{k+1} n)$`.

- If `$f(n) = Ω(n^{\log_b a + ε})$` and regularity holds → `$T(n) = Θ(f(n))$`.


> [!tip]
> If `f(n)` is close to `n^{\log_b a}`, check the **polylog factor** to pick the right case. When `f` is irregular or the regularity condition fails, use the **Akra–Bazzi** method or a recursion-tree bound.

## Implementation or Practical Context

### Picking the right model

- Use **RAM** for typical in-memory DS&A.

- Switch to **I/O model** for external memory workflows (mergesort [[cs/history/magnetic-disk-storage|on disk]], graph analytics on massive data).

- Use **bit complexity** when numbers grow with `n` (big-integer algorithms, exact polynomial arithmetic).


### Micro-costs that matter

Asymptotics ignore constants, but implementations don't:

- **Cache misses** can dominate linear scans vs pointer-chasing (arrays vs linked lists).

- **Branch mispredictions** hurt data-dependent conditionals; branchless variants improve constants.

- **Vectorization** turns many `$Θ(n)$` routines into faster `$Θ(n)$` with smaller constants.

- **Parallelism** changes the wall-clock model: span/work analysis (e.g., fork-join) gives **parallel time** and **work** (`T₁`, `T_∞`).


> [!note]
> For production code, pair a theoretical bound with **empirical profiles** to calibrate constants and memory behavior. Both are necessary for performance work.

### Input-sensitive and parameterized bounds

- Hash tables: expected `$Θ(1)$` ops at low load, but worst-case `$Θ(n)$` under adversarial hashing.

- Graph algorithms: complexity in terms of `n` **and** `m` (edges) is more informative (e.g., BFS in `$Θ(n + m)$`).

- String algorithms: bounds in **pattern length** `m` and **text length** `n` (e.g., KMP `$Θ(n + m)$`).


### Amortized analysis (brief)

Spread the cost of occasional expensive operations over many cheap ones (dynamic arrays, union-find). Use **aggregate**, **accounting**, or **potential** methods to prove `$O(1)$` _amortized_ time.

- Dynamic array `push_back`: occasional resize is `$Θ(n)$`, but average per-push is `$Θ(1)$`.

- Union–Find with path compression + union by rank: sequence of `m` ops on `n` elements in `$Θ(m α(n))$`, where `α` is the inverse Ackermann function (practically ≤ 5).


See [[cs/dsa/dynamic-arrays|Dynamic Arrays]] and [[cs/dsa/disjoint-set|Disjoint Set Union - Union–Find]].

## Common Misunderstandings

> [!warning]
> **Counting statements literally.** It's unnecessary and brittle. Count _dominant_ operations and use algebra to simplify.

> [!warning]
> **Confusing average with amortized.** Average-case is over a distribution of inputs; amortized is over a _sequence_ of operations for any input.

> [!warning]
> **Ignoring input parameters.** Reporting `$Θ(n)$` when the true bound is `$Θ(n + m)$` hides critical scaling.

> [!warning]
> **Treating `$O(\cdot)$` as equality.** `$O(n)$` includes `$O(1)$`; only `$Θ(n)$` conveys tight growth.

> [!warning]
> **Applying Master Theorem blindly.** It requires regular subproblem sizes and the regularity condition in Case 3. Nonuniform splits, floors/ceilings, or irregular `f(n)` may break it.

## Broader Implications

- **Algorithm engineering:** After asymptotics identify candidates, careful constant-factor tuning, data layout, and parallelization deliver real-world speedups.

- **Scalability budgeting:** Given SLAs and expected `n`, asymptotics define viable regions (e.g., `$Θ(n^2)$` is fine for `n ≤ 1e3` but not for `1e6`).

- **Complexity classes:** Distinct from _computational complexity theory_ (P, NP, etc.). DS&A time complexity is _algorithm-specific_, not class membership.


## Summary

Time complexity analysis abstracts machine details to compare algorithms by **growth rates**. Choose an appropriate **cost model**, perform **dominant-term** simplification for straight-line and loop code, and use **recurrences** for divide-and-conquer. Incorporate **amortized** and **parameterized** analyses when operations or inputs demand it. Pair the theoretical result with empirical profiling and model-aware implementation to ensure performance that holds both **in principle** and **in production**.

## Related Notes

- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]

- [[cs/dsa/recurrence-relations|Recurrence Relations]]

- [[cs/dsa/space-complexity|Space Complexity]]

## Sources

- Time complexity, Wikipedia. https://en.wikipedia.org/wiki/Time_complexity . Backs the Overview and Definition sections: time complexity is estimated by counting elementary operations under the assumption that each takes fixed time, worst case is the maximum over inputs of a given size, average case is an average over inputs of a given size and has to be specified explicitly, and the whole thing is expressed asymptotically because exact functions are hard to compute and small inputs rarely matter.
- Jessica Su, CS 161 Lecture 1, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture1.pdf . Backs the formal definitions used here: O(g) as an upper bound with constants c and n0, Omega(g) as the lower bound, Theta(g) as holding both, and the note's warning against reading O as tight, since the definition permits any function bounded above by c*g.
- Random-access machine, Wikipedia. https://en.wikipedia.org/wiki/Random-access_machine . Backs the RAM cost model in which arithmetic, assignment, comparison, and array indexing are each Theta(1) and memory is word-addressable.
- External memory algorithm, Wikipedia. https://en.wikipedia.org/wiki/External_memory_algorithm . Backs the I/O model row: a processor with an internal memory of size M attached to unbounded external memory, both divided into blocks of size B, with running time defined by the number of block transfers rather than primitive operations. This is what the note means by counting block transfers for external workloads.
- Analysis of algorithms, Wikipedia. https://en.wikipedia.org/wiki/Analysis_of_algorithms . Backs the motivation section's framing of asymptotic analysis as the machine-independent yardstick for comparing alternative approaches.
- Recursion Trees and the Master Method, Cornell CS 3110 Lecture 20 (Spring 2012). https://www.cs.cornell.edu/courses/cs3110/2012sp/lectures/lec20-master/lec20.html . Backs the Master Theorem quick-recall block and the recursion-tree reasoning behind it: level i holds a^i subproblems of size n/b^i costing a^i * f(n/b^i), the tree has log_b n levels and n^{log_b a} leaves, and the three cases fall out of comparing f(n) with the leaf count. It states the Case 3 side condition directly, a*f(n/b) <= c*f(n) for a constant c and large n.
- Master theorem (analysis of algorithms), Wikipedia. https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29 . Backs the polylog form of Case 2 that this note uses, f(n) = Theta(n^{log_b a} (log n)^k) for k >= 0 giving T(n) = Theta(n^{log_b a} (log n)^{k+1}), and names the Case 3 side condition explicitly as the regularity condition with the constant strictly below 1: a*f(n/b) <= k*f(n) for some k < 1 and all sufficiently large n. This is the source for the note's warning that Case 3 fails without it.
- Akra-Bazzi method, Wikipedia. https://en.wikipedia.org/wiki/Akra%E2%80%93Bazzi_method . Backs the tip's fallback: Akra-Bazzi handles the recurrences the Master Theorem cannot, solving for p in the sum of a_i * b_i^p = 1 and giving T(x) as Theta of x^p times one plus an integral of g.
- Jeff Erickson, Algorithms Lecture 9: Amortized Analysis, University of Illinois. https://jeffe.cs.illinois.edu/teaching/algorithms/notes/09-amortize.pdf . Backs the amortized-analysis subsection and the misunderstanding that pairs with it: amortized cost averages over a sequence of operations with no probability involved, which is what separates it from average-case analysis over a distribution of inputs.
- Disjoint-set data structure, Wikipedia. https://en.wikipedia.org/wiki/Disjoint-set_data_structure . Backs the union-find bound quoted here: m operations on n elements with path compression and union by rank run in O(m * alpha(n)), a result due to Tarjan and proved tight.
- Ackermann function, Wikipedia. https://en.wikipedia.org/wiki/Ackermann_function . Backs the parenthetical that the inverse Ackermann function is below 5 for any practical input size.
- Jessica Su, CS 161 Lecture 9, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture9.pdf . Backs the hash-table row in the parameterized-bounds list: expected Theta(1 + alpha) search under simple uniform hashing, degrading to O(n) in the worst case where every key lands in one slot.
- Breadth-first search, Wikipedia. https://en.wikipedia.org/wiki/Breadth-first_search . Backs the graph example, Theta(n + m) for traversal in the vertex and edge counts, which is the note's point about reporting the right parameters.
- Knuth-Morris-Pratt algorithm, Wikipedia. https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm . Backs the string example, Theta(m) preprocessing plus Theta(n) matching, hence Theta(n + m).
- Analysis of parallel algorithms, Wikipedia. https://en.wikipedia.org/wiki/Analysis_of_parallel_algorithms . Backs the work and span pair the note names: work T_1 is the total primitive operations, equal to single-processor time, and span T_infinity is the critical path length, the time on an idealized machine with unbounded processors, which lower-bounds wall clock.
- CPU cache, Wikipedia. https://en.wikipedia.org/wiki/CPU_cache . Backs the micro-costs claim that a miss stalls the processor for the time it takes to fetch a cache line, during which a modern CPU could have executed hundreds of instructions.
- Branch predictor, Wikipedia. https://en.wikipedia.org/wiki/Branch_predictor . Backs the branch-misprediction cost that makes data-dependent conditionals expensive and branchless variants worth the trouble.
