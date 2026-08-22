---
title: Best, Worst & Average Cases
description: How input families shape algorithm behavior - what each case means, when it matters, and how to reason about them.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-03-12
aliases:
  - understanding-best-worst-and-average-cases
---

## Overview
**Best, worst, and average cases** summarize how an algorithm's running time (or space) varies across **different families of inputs** of the *same size* `n`. They provide complementary perspectives:

- **Best-case**: the most favorable inputs for size `n`.
- **Worst-case**: the most costly inputs for size `n`.
- **Average-case**: the expected cost under a **stated distribution** over inputs of size `n`.

These notions let you predict performance, communicate guarantees, and reason about **risk** (pathological inputs) versus **typical** behavior.

> [!note]
> Always specify **which case** you're reporting and, for average-case, the **assumptions** (input distribution, pivot rule, hash function model, etc.). See [[time-complexity-analysis|Time Complexity Analysis]].

## Motivation
- **User-facing guarantees:** Worst-case bounds protect latency SLAs when inputs can be adversarial (public APIs, security contexts).
- **Throughput in practice:** Average-case reflects typical workloads (e.g., randomized quicksort on diverse data).
- **Input-aware engineering:** Best-case reveals **adaptivity** (e.g., insertion sort is fast on nearly-sorted data).
- **Design decisions:** Choosing randomized algorithms or balance-enforcing structures depends on how often worst case arises and how costly it is to avoid.

> [!note] Practical takeaway
> Choose **worst case** when you must not exceed a latency/space budget; choose **average case** when input distributions are stable and can be defended.

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

## Model & Assumptions
A statement like "average $O(f(n))$" is **meaningless** without:
- A **distribution** over inputs (e.g., uniform over all [[cs/math/combinatorics|permutations]], random hash function, i.i.d. keys).
- A **cost model** (e.g., RAM with unit-cost arithmetic, how comparisons and [[cs/systems/memory-hierarchy-and-caching|cache misses]] are counted).
- Clear **preconditions** (e.g., "array is randomly shuffled", or "hash function is universal/independent").

Common modeling patterns:
- **Uniform over inputs**: average over all permutations/graphs/etc. Often unrealistic without justification.
- **Stochastic process for inputs**: e.g., keys are i.i.d. from a distribution $D$ (state $D$ explicitly).
- **Randomized algorithms**: expected runtime is over the algorithm's **own randomness** for **any input** (Yao's principle relates this to distributional inputs).
- **Randomized quicksort**: expectation over random pivot choices; average $O(n\log n)$ for every fixed input.
- **Cuckoo hashing**: expected $O(1)$ lookup under specific independence assumptions on hash functions.

> [!tip] Be explicit about assumptions
> - If you randomize the algorithm (e.g., randomized pivot), you can analyze **expected runtime over the algorithm's coins** for **any fixed input** - this sidesteps unknown input distributions.
> - If you rely on input randomness, document the **source of randomness** (real-world shuffles? adversary likely?).

## Examples

### Quicksort
- **Best-case:** pivot always splits `n` roughly in half → `$Θ(n \log n)$`.
- **Average-case:** random inputs or randomized pivoting → `$Θ(n \log n)$` expected.
- **Worst-case:** already sorted + naive first/last pivot (or repeated bad splits) → `$Θ(n^2)$`.

> [!example] Recursion shapes
> - Worst case: highly unbalanced recursion (depth $n$).
> - Average case: roughly balanced recursion (depth $\Theta(\log n)$).

### Hash table (separate chaining)
- **Best-case / Expected:** with a good hash and low load factor `α = n/m`, lookup/insert/delete in `$Θ(1)$` expected.
- **Worst-case:** all keys collide in one bucket → operations degrade to `$Θ(n)$`.

### Binary search
- **Best-case:** match at the middle element → `$Θ(1)$`.
- **Worst/average:** `$Θ(\log n)$` comparisons.

### Insertion sort
- **Worst**: $O(n^2)$ comparisons/shifts on reverse-sorted arrays.
- **Average**: $O(n^2)$ over random permutations, but with a smaller constant than selection sort.
- **Best**: $O(n)$ on already sorted arrays (adaptive behavior).

> [!example] Mini trace: insertion sort on nearly-sorted data
> Each insertion shifts only a few elements, so total shifts scale with **number of inversions**, not $n^2$.

### Graph algorithms (BFS/DFS)
- **Worst/Average/Best**: $O(n+m)$ for traversal itself - insensitive to input ordering, but **graph density** $m$ vs $n$ heavily influences actual running time.

## Properties and Relationships
- **Case ordering:** `T_min(n) ≤ E[T(n)] ≤ T_max(n)` for any fixed `n`.
- **Tightness:** Worst-case `$Θ(\cdot)$` is a **guarantee**; average-case is an **expectation** that may vary with distribution; best-case is **achievable** but may be vanishingly rare.
- **Adaptivity:** Algorithms like insertion sort or shell sort exploit **structure** (e.g., small number of inversions) to achieve near best-case on *easy* inputs.
- **Randomization:** Converts an algorithm's **worst-case input** into a **typical** input relative to the algorithm's own coin flips (e.g., randomized quicksort), yielding **expected** bounds that hold **for any fixed input**.

> [!note]
> **Smoothed analysis** bridges worst- and average-case: measure expected performance after an adversary chooses an input and small random noise is added. It explains why algorithms like the simplex method perform well in practice despite exponential worst cases.

## Implementation or Practical Context

### Patterns that shift the cases
- **Pivot sampling (median-of-3/5):** raises the floor on quicksort's splits, reducing probability of worst-case.
- **Load-factor control:** resizing hash tables when `α` grows keeps expected `$Θ(1)$`.
- **Self-balancing trees:** guarantee `$O(\log n)$` worst-case lookups/updates (AVL, red–black) rather than average-case only.

### Heuristics & Design Guidance
- If the **worst case matters**, prefer algorithms with strong worst-case guarantees (e.g., heapsort $O(n\log n)$ vs quicksort's $O(n^2)$).
- If inputs are **well-mixed** and latency spikes are tolerable, exploit **average-case** winners (randomized quicksort, hash tables).
- Use **randomization** to defend against adversarial inputs (e.g., randomized pivoting, randomized hashing).
- Detect structure at runtime: switch to **insertion sort** on tiny subarrays or nearly sorted data; use **introsort** (quicksort → heapsort fallback) to combine average-case speed with worst-case safety.

### Practical Context
- **Libraries**: Many standard libraries use **introsort** (quicksort with median-of-three + heapsort fallback) to mitigate worst-case while keeping average speed.
- **Systems**: Hash tables rely on load-factor control and good hash functions (sometimes randomized) to ensure expected $O(1)$.
- **Data skew**: Real-world keys are rarely uniform; evaluate with **profiles** and **benchmarks** that mirror production distributions.
- **APIs and security:** Worst-case bounds and **abuse resistance** matter (e.g., hash-flood attacks. Use randomized hashing or balanced trees as fallback).
- **Systems with SLOs:** Choose data structures with reliable upper bounds (e.g., heaps or balanced BSTs) for latency-critical paths; accept average-case structures elsewhere.

### Case Studies

#### Quicksort with different pivot rules
- **First-element pivot** on sorted input: worst-case `$Θ(n^2)$`.
- **Random pivot** or **median-of-3**: expected `$Θ(n \log n)$`; drastically smaller probability of quadratic behavior.
- **Three-way partitioning**: improves **average** when duplicates abound by shrinking recursion on equal keys.

#### Hash tables: expected vs worst-case
- Under **simple uniform hashing**, expected chain length is `α`; operations are `$Θ(1)$`.
- In adversarial settings (crafted collisions), degrade to `$Θ(n)$`. Mitigations:
  - **Randomized hash functions** (e.g., multiplicative hashing with secret seeds).
  - **Cuckoo hashing** (expected O(1), worst-case rehash).
  - **Tree-bucket fallback** (RB-tree per bucket) to cap worst-case at `$O(\log n)$`. See [[hash-tables|Hash Tables]].

## Common Misunderstandings
> [!warning]
> **"Average = typical without assumptions."** Average-case depends on a **distribution** or on **randomization** in the algorithm. Without stating it, the claim is incomplete.

> [!warning]
> **"Worst case never happens."** Attackers and corner datasets exist. If exposure is public or inputs are crafted (compilers, parsers), design against worst-case.

> [!warning]
> **"Best case proves algorithm is fast."** A best-case bound is often trivial and misleading. Emphasize **average** under justified assumptions and **worst** for guarantees.

> [!warning]
> **"Amortized = average-case."** **Amortized** cost averages over **operation sequences**, independent of input distribution (e.g., dynamic-array push). **Average-case** averages over **inputs** (or internal randomness). See [[dynamic-arrays|Dynamic Arrays]].

> [!warning]
> **"Randomized ⇒ unpredictable latency."** Randomization typically controls **tail risk** by making adversarial patterns unlikely, improving *predictability* across runs.

> [!warning] Conflating "average" with "expected"
> "Average case" is an **expectation with respect to a specified distribution**. If the real inputs don't match that distribution, the claim may not hold.

## Broader Implications
- **Risk management:** Systems interacting with untrusted inputs should prioritize worst-case guarantees or employ **defenses** (randomization, balancing, timeouts).
- **Benchmarking discipline:** Report **which case** a benchmark targets; avoid cherry-picking best-case distributions.
- **Algorithm portfolios:** Combine strategies: fast average-case (e.g., quicksort) with **fallbacks** for bad cases (e.g., introsort → heap sort). See [[quick-sort|Quick Sort]] and [[heapsort|Heapsort]].
- **Data pipelines:** Understand your input sources. If they skew toward nearly-sorted or heavy-duplicate regimes, choose algorithms that **adapt** to those structures.

## Summary
- **Best-case** highlights potential under ideal inputs, often used to show **adaptivity** but rarely a guarantee.
- **Average-case** reflects **expected** behavior under a **stated distribution** (or due to algorithm randomization).
- **Worst-case** provides **hard guarantees** against pathological or adversarial inputs.

Great engineering calls out the case, the assumptions, and the **mitigations** used to keep performance predictable: pivot sampling, rehashing, balancing, or hybrid fallbacks.

## Related Notes
- [[asymptotic-notation|Asymptotic Notation]]
- [[amortized-analysis-methods|Amortized Analysis]]
- [[time-complexity-analysis|Time Complexity Analysis]]
- [[time-complexity-calculation|Time Complexity Calculation]]
- [[algorithm-efficiency|Algorithm Efficiency]]
- [[quick-sort|Quick Sort]]
- [[hash-tables|Hash Tables]]
