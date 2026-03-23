---
title: Time & Space Complexity
description: Measuring how running time and memory usage grow with input size under clear cost models and asymptotic notation.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-20
aliases: []

---

## Overview
**Time and space complexity** are tools for predicting how an algorithm's **running time** and **memory usage** grow as input size `n` increases. Rather than count literal CPU cycles or bytes, analysis adopts a **cost model** and summarizes behavior with **asymptotic notation** - `$O(\cdot)$`, `$Ω(\cdot)$`, `$Θ(\cdot)$`. The result is a machine-independent description that guides design, compares alternatives, and surfaces scaling risks early.

> [!note]
> Complexity describes **growth**, not wall-clock time. Two `$Θ(n)$` algorithms can differ by large constant factors; profiling still matters in practice.

## Motivation
- **Engineering foresight:** Choose data structures and algorithms that remain fast and memory-efficient as datasets grow.
- **Communication:** Convey guarantees to users (e.g., "lookup is `$O(\log n)$`").
- **Comparison:** Evaluate trade-offs (e.g., `$Θ(n \log n)$` time & `$Θ(1)$` extra space vs `$Θ(n)$` time & `$Θ(n)$` space).
- **Risk control:** Detect "looks fine on samples, explodes in production" scenarios.

## Definition and Formalism
Let `T(x)` be the step count (or relevant cost) of an algorithm on input `x`, with `n = |x|` its size. Define:
- **Worst-case:** `$T_{\max}(n) = \max_{|x|=n} T(x)$`
- **Best-case:** `$T_{\min}(n) = \min_{|x|=n} T(x)$`
- **Average-case:** `$E[T(x)\mid |x|=n]$` under a specified input [[cs/statistics/probability-distributions|distribution]] (see [[cs/statistics/expected-value|Expected Value]])

Asymptotic notation:
- `$O(g(n))$`: upper bound up to constant factors
- `$Ω(g(n))$`: lower bound
- `$Θ(g(n))$`: tight bound (both `$O$` and `$Ω$`)

Space complexity parallels time: let `S(n)` be the **extra memory** beyond the input (and sometimes beyond the output, depending on convention). Report in `$O(\cdot)$`/`$Θ(\cdot)$`.

### Cost models (time)
- **RAM model (unit cost):** Arithmetic, comparisons, assignments, and array indexing cost `$Θ(1)$`. Appropriate for most DS&A with fixed-width machine words.
- **Bit model:** Cost depends on operand bit-length `b`. Adding two `b`-bit integers costs `$Θ(b)$`. Needed for big-integer algorithms, cryptography, exact arithmetic.
- **I/O (external memory) model:** Dominant cost is **block transfers** between memory layers (e.g., disk↔RAM). Sorting becomes `$Θ\!\left(\frac{n}{B}\log_{M/B}\frac{n}{B}\right)$` in terms of block size `B` and fast memory `M`.

### Space accounting
- **Input space:** memory occupied by the input itself (often **excluded** from the bound).
- **Auxiliary space:** extra scratch structures (stacks, queues, recursion frames, buffers).
- **Output space:** storage required to hold results (sometimes excluded if unavoidable).

> [!tip]
> State what you count. "`$O(1)$` extra space" usually means **in-place**, excluding input and output.

## Example or Illustration
1) **Single loop (RAM model)**
```pseudo
sum = 0
for i in 0..n-1:
    sum += A[i]
return sum
````

Each iteration is constant work → `$Θ(n)$` time, `$Θ(1)$` extra space.

2. **Nested loops (full square)**


```pseudo
for i in 0..n-1:
    for j in 0..n-1:
        work()
```

Runs `n·n` bodies → `$Θ(n^2)$` time.

3. **Triangular loop**


```pseudo
for i in 0..n-1:
    for j in 0..i:
        work()
```

Sum `1+2+…+n = n(n+1)/2` → `$Θ(n^2)$` time.

4. **Binary search** halves the interval every iteration → `$Θ(\log n)$` time, `$Θ(1)$` extra space.

5. **Merge sort** solves `2` subproblems of size `n/2` and merges in linear time:
    `$T(n)=2T(n/2)+Θ(n)$` → `$Θ(n \log n)$` time; auxiliary space `$Θ(n)$` (array) or `$Θ(\log n)$` (linked lists or bottom-up techniques).

## Properties and Relationships

### Dominant-term simplification

Drop constants and lower-order terms:

- `3n^2 + 7n + 10 = Θ(n^2)`

- `n \log n + 100n = Θ(n \log n)`


### Composition rules

- **Sequential** parts add: `T(n) = T₁(n) + T₂(n)`; report the dominant term.

- **Conditionals**: worst-case takes the **max** of branch costs; average-case requires branch probabilities.

- **Loops**: multiply cost per iteration by the iteration count (often a summation).


### Recurrences and patterns

For recursive algorithms describe `T(n)` by:

- **Halving + constant work:** `$T(n)=T(n/2)+Θ(1) ⇒ Θ(\log n)$` (binary search).

- **Split & merge:** `$T(n)=aT(n/b)+Θ(n^c)$` → use Master Theorem. See [[recurrence-relations|Recurrence Relations]] and [[recurrences-master-theorem|Recurrences - Master Theorem]].

- **Degenerate partition:** `$T(n)=T(n-1)+Θ(n) ⇒ Θ(n^2)$` (worst-case quicksort).


### Parameterized bounds

Express in the **right variables**:

- Graphs: `$Θ(n + m)$` for BFS/DFS where `n=|V|`, `m=|E|`.

- Strings: search costs in both text length `n` and pattern length `m`.

- Hash tables: expected `$Θ(1)$` at low load factor; worst-case `$Θ(n)$`.


> [!note]
> The parameterization frequently matters more than the big-O class alone; `$Θ(n + m)$` conveys structure that `$Θ(n^2)$` would obscure.

## Implementation or Practical Context

### Time: constants that bite

Asymptotics hide constant factors, but implementations reveal:

- **Cache locality:** Contiguous arrays beat pointer-chasing structures at the same big-O due to fewer cache misses.

- **Branching:** Predictable branches (or branchless code) reduce misprediction penalties.

- **Vectorization:** Turns many `$Θ(n)$` scans into much faster `$Θ(n)$` with smaller constants.

- **Parallelism:** Analyze **work** (`T₁`) and **span** (`T_\infty`) for parallel algorithms; wall-clock time lower-bounded by span and divided by available cores.


### Space: what actually fills memory

- **Recursion depth:** contributes `$Θ(\text{depth})$` stack frames (e.g., DFS).

- **Auxiliary structures:** queues, heaps, hash tables; report peak occupancy.

- **Representation choices:** 64-bit vs 32-bit indices, dense vs sparse matrices, struct padding, alignment.


> [!tip]
> When reporting space, separate categories: "`$Θ(n)$` input, `$Θ(n)$` output, `$Θ(\log n)$` auxiliary (recursion stack)." This is far more actionable.

### Model selection guidance

- Use **RAM** for fixed-width integers and mainstream DS&A problems.

- Switch to the **bit model** when values grow with `n` (big integers, exact arithmetic).

- Use the **I/O model** for disks/SSDs or out-of-core analytics; the right algorithm (e.g., external mergesort) can change feasibility entirely.


### Amortized analysis vs average-case

- **Amortized:** worst-case over any operation sequence is small _on average_ (dynamic arrays `push_back` `$O(1)$` amortized; union–find `$Θ(m α(n))$` for `m` ops). Distribution-free.

- **Average-case:** expectation under a **distribution** of inputs (e.g., quicksort `$Θ(n \log n)$` with random pivots). State assumptions.


See [[dynamic-arrays|Dynamic Arrays]] and [[disjoint-set-union-union-find|Disjoint Set Union - Union–Find]].

## Common Misunderstandings

> [!warning]
> **"`$O(\cdot)$` is an equality."** `$O(n)$` includes all smaller classes; only `$Θ(n)$` communicates tight growth.

> [!warning]
> **Counting every statement.** Avoid brittle micro-counts; model the dominant operations and simplify.

> [!warning]
> **Ignoring input representation.** If numbers are `b` bits, an "`$O(1)$` add" in RAM becomes `$Θ(b)$` in the bit model.

> [!warning]
> **Conflating amortized and average-case.** Amortized requires no input distribution; average-case does.

> [!warning]
> **Not stating the case.** Best/worst/average can differ drastically; say which you report.

> [!warning]
> **Hiding parameters.** Writing `$Θ(n)$` when the real bound is `$Θ(n + m)$` drops critical information.

## Broader Implications

- **Scalability budgeting:** If SLA requires 100 ms at `n=10^6`, `$Θ(n^2)$` is off the table; `$Θ(n \log n)$` or better is necessary.

- **Algorithm selection:** The same task may need different algorithms by regime (e.g., insertion sort for tiny `n`, mergesort/quicksort for large `n`).

- **Data layout and hardware:** Once asymptotics are acceptable, **layout** (AoS vs SoA), memory hierarchy, and parallel decomposition often provide larger real-world wins than further asymptotic improvements.


## Summary

Time and space complexity abstract away machine idiosyncrasies to expose **growth behavior**. Pick a **cost model** (RAM/bit/I/O), express bounds with **asymptotics**, and account for multiple parameters when relevant. Use **recurrences** for divide-and-conquer, and **amortized analysis** for operation sequences. In practice, pair the theoretical bound with attention to **constants, memory layout, and parallelism** to achieve algorithms that scale **on paper and in production**.

## Related Notes

- [[asymptotic-notation|Asymptotic Notation]]

- [[time-complexity-analysis|Time Complexity Analysis]]

- [[space-complexity|Space Complexity]]

- [[algorithm-efficiency|Algorithm Efficiency]]
