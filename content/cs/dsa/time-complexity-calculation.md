---
title: Time Complexity Calculation
description: Deriving running-time bounds by translating code to counts, summations, and recurrences with clear assumptions.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-05
aliases: []

---

## Overview
**Time complexity calculation** turns code into a mathematical bound on the number of basic operations. The workflow is mechanical: (1) choose a **cost model**, (2) **count** dominant actions (comparisons, array accesses, arithmetic), (3) **express** counts as **sums** (for loops) or **recurrences** (for recursion), and (4) **simplify** using asymptotics. This note provides a practical playbook with patterns, examples, and pitfalls so the process is consistent and auditably correct.

> [!note]
> Report the **case** (worst, average, best) and the **model** (RAM/bit/I-O). Tie the bound to **parameters that matter** (e.g., arrays: `n`; graphs: `n` and `m`; strings: `n` and `m`). See [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]].

## Motivation
- **Repeatable reasoning:** a standard recipe reduces mistakes on exams and in code reviews.
- **Early detection:** translates code structure into growth rates before benchmarking.
- **Comparability:** apples-to-apples across implementations by abstracting machine constants.

## Definition and Formalism
Let `T(x)` be the **step count** on input `x`. For size `n=|x|`:
- Worst-case: `T_max(n) = max_{|x|=n} T(x)`
- Average-case: `E[T(x) | |x|=n]` under a specified distribution

We use `$O(\cdot)$`, `$Ω(\cdot)$`, `$Θ(\cdot)$` with a declared **cost model**:
- **RAM model**: fixed-width ops cost `Θ(1)`.
- **Bit model**: costs scale with operand bit-length.
- **I/O model**: count **block transfers** between memory levels.

> [!tip]
> Default to the **RAM model** for DS&A unless numbers grow with `n` (switch to **bit**), or data lives out of core (use **I/O**).

## Example or Illustration
Below is a **translation table** from code shapes to counts. Use it like a checklist when scanning a function.

### Linear and constant loops
```pseudo
for i in 0..n-1:
    body()        // O(1)
````

Count: `n` → `$Θ(n)$`.

**Constant loops** (e.g., `for k in 1..100`) are `$Θ(1)$`.

### Nested "square" loops

```pseudo
for i in 0..n-1:
    for j in 0..n-1:
        body()
```

Count: `n*n = n^2` → `$Θ(n^2)$`.

### Triangular loops (i.e., j < i)

```pseudo
for i in 0..n-1:
    for j in 0..i:
        body()
```

Count: `Σ_{i=0}^{n-1} (i+1) = n(n+1)/2 = Θ(n^2)`.

### Logarithmic loops (halving/doubling index)

```pseudo
i = 1
while i <= n:
    body()
    i = i * 2
```

Count: number of doublings `k` with `2^k ≤ n` → `k ≈ ⌊log₂ n⌋` → `$Θ(\log n)$`.

Similarly, while `n > 0: n = n/2` runs `$Θ(\log n)$` iterations.

### Harmonic series (shrinking inner work)

```pseudo
sum = 0
for i in 1..n:
    sum += n / i   // treat as O(n/i) per iteration
```

Count: `Σ n/i = n Σ (1/i) = n H_n = Θ(n log n)` since `H_n = Θ(log n)`.

### Two-phase pipelines (additive)

```pseudo
phaseA(n)   // Θ(n log n)
phaseB(n)   // Θ(n)
```

Total: `Θ(n log n + n) = Θ(n log n)` (dominant term wins).

## Properties and Relationships

### 1) Translate → Sum → Simplify

- Replace loop bodies with a step bound (often `1`).

- Turn loop nests into **sums**.

- Use arithmetic/geometric/harmonic identities to simplify.


Common identities (Big-Theta forms):

- `1 + 2 + … + n = Θ(n^2)`

- `1 + 1/2 + … + 1/n = Θ(log n)` (harmonic)

- `1 + r + r^2 + … + r^k = Θ(1)` if `|r|<1`, else `Θ(r^k)` when `r>1`


### 2) Max vs sum

For **conditionals**:

```pseudo
if cond(x):
    costA(n)
else:
    costB(n)
```

Worst-case: `max(costA, costB)`.
Average-case: weight by `P(cond)`.

### 3) Independent parameters

Prefer `Θ(n + m)` over collapsing to `Θ(n^2)` when `m` (edges) governs cost, as in BFS/DFS. See [[cs/dsa/graph-traversals-bfs-dfs|Graph Traversals - BFS & DFS]].

## Implementation or Practical Context

- **[[cs/systems/memory-hierarchy-and-caching|Cache effects]]:** Arrays vs pointers can change constants by 10× without changing Big-O.

- **Branching:** Data-dependent branches degrade predictability; branchless patterns may shrink constants.

- **Vectorization/parallelism:** Still `Θ(n)`, but much smaller constant or divided wall time; separately report **work** and **span** for parallel routines.


> [!note]
> Asymptotics **do not** predict wall time. After deriving bounds, **measure** critical paths.

## Common Misunderstandings

> [!warning]
> **Counting every statement literally.** You only need a bound for the **dominant** action per iteration, then sum.

> [!warning]
> **Ignoring the model.** Adding `b`-bit integers is `$Θ(1)$` in RAM but `$Θ(b)$` in the bit model.

> [!warning]
> **Wrong loop limits.** Off-by-one in `0..n-1` vs `1..n` does **not** change Big-O, but matters for **correctness** and for edge-case counts in proofs.

> [!warning]
> **Hiding parameters.** Prefer `Θ(n + m)` or `Θ(n + m log n)` over vague `Θ(n^2)` when graphs/strings are involved.

## Definition and Formalism (Recurrences)

Recursive procedures become **recurrences**. Typical forms:

### Halving with constant extra work

Binary search:

```
T(n) = T(n/2) + Θ(1)  ⇒  Θ(log n)
```

### Divide-and-conquer with linear combine

Merge sort:

```
T(n) = 2T(n/2) + Θ(n)  ⇒  Θ(n log n)
```

### Degenerate split (worst-case quicksort)

```
T(n) = T(n-1) + Θ(n)  ⇒  Θ(n^2)
```

### a/b recursion (Master Theorem)

General:

```
T(n) = a T(n/b) + f(n)
```

- If `f(n) = O(n^{log_b a - ε})` → `Θ(n^{log_b a})`

- If `f(n) = Θ(n^{log_b a} log^k n)` → `Θ(n^{log_b a} log^{k+1} n)`

- If `f(n) = Ω(n^{log_b a + ε})` + regularity → `Θ(f(n))`


See [[cs/dsa/recurrence-relations|Recurrence Relations]] and [[cs/dsa/recurrences-master-theorem|Recurrences - Master Theorem]].

## Example or Illustration (Worked Patterns)

### Example 1 - Mixed loops

```pseudo
function F(A):               // |A| = n
    s = 0
    for i in 0..n-1:         // (1) linear
        s += A[i]
    for k in 1..n:           // (2) harmonic
        s += n / k
    return s
```

Cost: `Θ(n)` + `Θ(n log n)` = `Θ(n log n)`.

### Example 2 - Two-pointer contraction

```pseudo
i = 0; j = n-1
while i < j:
    if A[i] + A[j] < x: i++
    else: j--
```

Each iteration moves `i` or `j` **once**; total moves ≤ `n` → `$Θ(n)$`.

### Example 3 - Factor-finding loop

```pseudo
for d in 1..⌊√n⌋:
    if n % d == 0: record(d)
```

Iterations: `⌊√n⌋` → `$Θ(√n)$` (RAM model). In **bit** model, include the cost of `%` on `b`-bit numbers.

### Example 4 - Exponential backtracking (branch factor `b`, depth `d`)

```pseudo
search(depth):
    if depth == d: return
    for child in 1..b:
        search(depth+1)
```

Nodes visited: `1 + b + b^2 + … + b^d = Θ(b^d)` (geometric). See [[cs/dsa/backtracking-algorithms|Backtracking Algorithms]].

## Implementation Notes

- **Tighten to Θ when possible.** Provide both upper and lower bounds if trivial: e.g., linear scans are `Θ(n)`.

- **State preconditions.** Many "logarithmic" bounds (e.g., binary search) **require ordering** and **random access**.

- **Use sentinels/invariants** to simplify counts (e.g., sentinel in insertion sort avoids inner bound checks but not the `Θ(n^2)` total).


## Broader Implications

- **Algorithm selection by regime:** Use insertion sort for tiny `n`, switch to `O(n log n)` sort as `n` grows. Hybrids like **[[cs/languages/Cpp/stl-algorithms|introsort]]** pick the best behavior across regimes (see [[cs/dsa/quick-sort|Quick Sort]] and [[cs/dsa/heapsort|Heapsort]]).

- **From asymptotics to engineering:** Once the class is acceptable, focus on **layout, caches, branches, and parallelization** to shrink constants.


## Summary

To calculate time complexity:

1. **Choose a model** (RAM/bit/I-O).

2. **Rewrite code as counts**: per-iteration cost × iterations → **sums**.

3. **Solve or bound** sums with known series; for recursion, set up a **recurrence** and apply **Master/recursion tree**.

4. **Simplify** to `$O/Ω/Θ$`, naming the **case** and **parameters**.
    This pipeline yields consistent, communicable bounds you can pair with measurement for real-world performance.


## Related Notes

- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]

- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]

- [[cs/dsa/recurrence-relations|Recurrence Relations]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
