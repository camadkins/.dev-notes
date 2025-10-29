---
title: Best, Worst & Average Cases
description: How input families shape algorithm behavior—what each case means, when it matters, and how to reason about them.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
# - input-families.svg — Three panels showing “friendly/random,” “typical,” and “adversarial” inputs mapped to best/average/worst behavior for an example algorithm (quicksort or hashing).
# - quicksort-pivot-cases.svg — Side-by-side partition trees for best (balanced), average (roughly balanced), and worst (highly unbalanced) cases.
# - hashing-loads.svg — Buckets with uniform vs clustered keys illustrating expected O(1) vs worst-case O(n) lookups.
---

## Overview
**Best, worst, and average cases** summarize how an algorithm’s running time (or space) varies across **different families of inputs** of the *same size* `n`. They provide complementary perspectives:

- **Best-case**: the most favorable inputs for size `n`.
- **Worst-case**: the most costly inputs for size `n`.
- **Average-case**: the expected cost under a **stated distribution** over inputs of size `n`.

These notions let you predict performance, communicate guarantees, and reason about **risk** (pathological inputs) versus **typical** behavior.

> [!note]
> Always specify **which case** you’re reporting and, for average-case, the **assumptions** (input distribution, pivot rule, hash function model, etc.). See [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]].

## Motivation
- **User-facing guarantees:** Worst-case bounds protect latency SLAs when inputs can be adversarial (public APIs, security contexts).
- **Throughput in practice:** Average-case reflects typical workloads (e.g., randomized quicksort on diverse data).
- **Input-aware engineering:** Best-case reveals **adaptivity** (e.g., insertion sort is fast on nearly-sorted data).
- **Design decisions:** Choosing randomized algorithms or balance-enforcing structures depends on how often worst case arises and how costly it is to avoid.

## Definition and Formalism
Let `T(x)` be the step count (or cost) on input `x`, with `|x| = n`.

- **Worst-case:**  
  `T_max(n) = \max_{|x|=n} T(x)`
- **Best-case:**  
  `T_min(n) = \min_{|x|=n} T(x)`
- **Average-case (expected):**  
  `E[T(X) \mid |X|=n] = \sum_x T(x) · P(X=x \mid |x|=n)`

Asymptotic notation applies to each:
- Worst-case time might be `$O(n^2)$` while average is `$Θ(n \log n)$`.
- Best-case should be reported alongside **preconditions** that realize it.

> [!tip]
> The average is meaningless without a **distribution**. Common choices: **uniform** over all permutations; **product distributions** for keys; or a **randomized algorithm** where the *internal randomness* induces the expectation (e.g., random pivots).

## Example or Illustration
### Quicksort
- **Best-case:** pivot always splits `n` roughly in half → `$Θ(n \log n)$`.
- **Average-case:** random inputs or randomized pivoting → `$Θ(n \log n)$` expected.
- **Worst-case:** already sorted + naive first/last pivot (or repeated bad splits) → `$Θ(n^2)$`.

> [!example]
> **Diagram (`quicksort-pivot-cases.svg`)** — Partition trees: balanced (log depth), roughly balanced (typical), and chain-like (worst).

### Hash table (separate chaining)
- **Best-case / Expected:** with a good hash and low load factor `α = n/m`, lookup/insert/delete in `$Θ(1)$` expected.
- **Worst-case:** all keys collide in one bucket → operations degrade to `$Θ(n)$`.

> [!example]
> **Diagram (`hashing-loads.svg`)** — Uniformly spread keys vs cluster in one bucket.

### Binary search
- **Best-case:** match at the middle element → `$Θ(1)$`.
- **Worst/average:** `$Θ(\log n)$` comparisons.

## Properties and Relationships
- **Case ordering:** `T_min(n) ≤ E[T(n)] ≤ T_max(n)` for any fixed `n`.
- **Tightness:** Worst-case `$Θ(\cdot)$` is a **guarantee**; average-case is an **expectation** that may vary with distribution; best-case is **achievable** but may be vanishingly rare.
- **Adaptivity:** Algorithms like insertion sort or shell sort exploit **structure** (e.g., small number of inversions) to achieve near best-case on *easy* inputs.
- **Randomization:** Converts an algorithm’s **worst-case input** into a **typical** input relative to the algorithm’s own coin flips (e.g., randomized quicksort), yielding **expected** bounds that hold **for any fixed input**.

> [!note]
> **Smoothed analysis** bridges worst- and average-case: measure expected performance after an adversary chooses an input and small random noise is added. It explains why algorithms like the simplex method perform well in practice despite exponential worst cases.

## Implementation or Practical Context
- **APIs and security:** Worst-case bounds and **abuse resistance** matter (e.g., hash-flood attacks. Use randomized hashing or balanced trees as fallback).
- **Systems with SLOs:** Choose data structures with reliable upper bounds (e.g., heaps or balanced BSTs) for latency-critical paths; accept average-case structures elsewhere.
- **Data-dependent constants:** Even with identical Big-O, inputs that enhance locality (sorted arrays for linear scans) shrink constants dramatically.
- **Input curation:** Preprocessing (random shuffles, pivot sampling, rehashing, normalization) can push workloads toward typical-case behavior.

### Patterns that shift the cases
- **Pivot sampling (median-of-3/5):** raises the floor on quicksort’s splits, reducing probability of worst-case.
- **Load-factor control:** resizing hash tables when `α` grows keeps expected `$Θ(1)$`.
- **Self-balancing trees:** guarantee `$O(\log n)$` worst-case lookups/updates (AVL, red–black) rather than average-case only.

## Common Misunderstandings
> [!warning]
> **“Average = typical without assumptions.”** Average-case depends on a **distribution** or on **randomization** in the algorithm. Without stating it, the claim is incomplete.

> [!warning]
> **“Worst case never happens.”** Attackers and corner datasets exist. If exposure is public or inputs are crafted (compilers, parsers), design against worst-case.

> [!warning]
> **“Best case proves algorithm is fast.”** A best-case bound is often trivial and misleading. Emphasize **average** under justified assumptions and **worst** for guarantees.

> [!warning]
> **“Amortized = average-case.”** **Amortized** cost averages over **operation sequences**, independent of input distribution (e.g., dynamic-array push). **Average-case** averages over **inputs** (or internal randomness). See [[cs/dsa/dynamic-arrays|Dynamic Arrays]].

> [!warning]
> **“Randomized ⇒ unpredictable latency.”** Randomization typically controls **tail risk** by making adversarial patterns unlikely, improving *predictability* across runs.

## Example or Illustration (Case Studies)
### 1) Quicksort with different pivot rules
- **First-element pivot** on sorted input: worst-case `$Θ(n^2)$`.
- **Random pivot** or **median-of-3**: expected `$Θ(n \log n)$`; drastically smaller probability of quadratic behavior.
- **Three-way partitioning**: improves **average** when duplicates abound by shrinking recursion on equal keys.

### 2) Hash tables: expected vs worst-case
- Under **simple uniform hashing**, expected chain length is `α`; operations are `$Θ(1)$`.  
- In adversarial settings (crafted collisions), degrade to `$Θ(n)$`. Mitigations:
  - **Randomized hash functions** (e.g., multiplicative hashing with secret seeds).
  - **Cuckoo hashing** (expected O(1), worst-case rehash).
  - **Tree-bucket fallback** (RB-tree per bucket) to cap worst-case at `$O(\log n)$`. See [[cs/dsa/hash-tables|Hash Tables]].

### 3) Graph traversal
- **BFS/DFS** are `$Θ(n + m)$` across best/average/worst on adjacency lists—**input-insensitive** in asymptotics. However, constants vary with topology (dense vs sparse) and representation; see [[cs/dsa/graph-representations|Graph Representations]].

### 4) Searching arrays
- **Linear search**: best-case `$Θ(1)$` (match at front), average `$Θ(n)` under uniform location, worst `$Θ(n)$`.
- **Binary search**: best `$Θ(1)$`, worst/average `$Θ(\log n)$`, but requires **sorted** input and **random access**.

## Broader Implications
- **Risk management:** Systems interacting with untrusted inputs should prioritize worst-case guarantees or employ **defenses** (randomization, balancing, timeouts).
- **Benchmarking discipline:** Report **which case** a benchmark targets; avoid cherry-picking best-case distributions.
- **Algorithm portfolios:** Combine strategies: fast average-case (e.g., quicksort) with **fallbacks** for bad cases (e.g., introsort → heap sort). See [[cs/dsa/quick-sort|Quick Sort]] and [[cs/dsa/heapsort|Heapsort]].
- **Data pipelines:** Understand your input sources. If they skew toward nearly-sorted or heavy-duplicate regimes, choose algorithms that **adapt** to those structures.

## Summary
- **Best-case** highlights potential under ideal inputs, often used to show **adaptivity** but rarely a guarantee.  
- **Average-case** reflects **expected** behavior under a **stated distribution** (or due to algorithm randomization).  
- **Worst-case** provides **hard guarantees** against pathological or adversarial inputs.

Great engineering calls out the case, the assumptions, and the **mitigations** used to keep performance predictable: pivot sampling, rehashing, balancing, or hybrid fallbacks. With these tools, you can design systems that are **fast on average** and **safe at the tails**.

## See also
- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
- [[cs/dsa/quick-sort|Quick Sort]]
- [[cs/dsa/hash-tables|Hash Tables]]