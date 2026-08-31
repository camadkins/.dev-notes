---
title: Asymptotic Notation
description: Landau symbols O, Θ, and Ω for bounding algorithm efficiency and reasoning about limiting behavior.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-29
aliases:
  - complexity-growth
---

## Definition
**Asymptotic notation** provides a language for describing how an algorithm’s runtime or space usage grows as input size `n` becomes large.  
It abstracts away constants and low-order terms, focusing on the *rate of growth* rather than exact runtime.

> [!note]
> Asymptotic notation lets us say “Algorithm A grows no faster than Algorithm B” without depending on implementation details or hardware.

### Formal Definitions
#### Big-O (Upper Bound)
> `f(n) = O(g(n))`  
> There exist constants `c > 0` and `n₀ ≥ 0` such that for all `n ≥ n₀`,  
> `f(n) ≤ c·g(n)`.

Means *f grows no faster than g* up to constant multiples.

> [!example]
> `3n² + 2n + 1 = O(n²)` (choose `c = 6`, `n₀ = 1`).

#### Big-Ω (Lower Bound)
> `f(n) = Ω(g(n))`  
> There exist constants `c > 0` and `n₀ ≥ 0` such that for all `n ≥ n₀`,  
> `f(n) ≥ c·g(n)`.

Means *f grows at least as fast as g*.

> [!example]
> `3n² + 2n + 1 = Ω(n²)` (choose `c = 3`, `n₀ = 1`).

#### Big-Θ (Tight Bound)
> `f(n) = Θ(g(n))`  
> There exist constants `c₁, c₂ > 0` and `n₀ ≥ 0` such that for all `n ≥ n₀`,  
> `c₁·g(n) ≤ f(n) ≤ c₂·g(n)`.

Means *f and g grow at the same rate* asymptotically.

> [!example]
> `f(n) = 3n² + 2n + 1 = Θ(n²)` (choose `c₁ = 3`, `c₂ = 6`).
### Other Notations

| Symbol | Meaning | Bound Type | Example |
|--------|----------|-------------|----------|
| `O(g(n))` | Upper | ≤ | Insertion Sort worst case O(n²) |
| `Ω(g(n))` | Lower | ≥ | Insertion Sort best case Ω(n) |
| `Θ(g(n))` | Tight | ≈ | Merge Sort Θ(n log n) |
| `o(g(n))` | *Little-o* (strictly smaller) | < | log n = o(n) |
| `ω(g(n))` | *Little-omega* (strictly greater) | > | n² = ω(n log n) |

---

## Why it matters
Two sorting algorithms may have runtimes `T₁(n) = 5n² + 10n` and `T₂(n) = 0.01n³ − 3n`.  
For small `n`, constants matter; for large `n`, the term of highest order dominates:
```

T₁(n) ≈ 5n²  
T₂(n) ≈ 0.01n³

```
So we describe them as:
```

T₁(n) = Θ(n²)  
T₂(n) = Θ(n³)

```
This simplification allows algorithm analysis independent of constant factors.

> [!note] Intuition vs rigor
> Intuition (growth curves) is useful, but always check that the **quantifiers** in the definition actually hold for large enough n.

---

## Model & Assumptions
> [!tip] Be explicit about the model
> The RAM model treats integer ops as O(1). If you analyze large integers, hashing, or I/O, note which costs scale with input magnitude.

- **RAM model; cost measures:** We typically count primitive operations under a **[[cs/systems/memory-hierarchy-and-caching|unit-cost]]** assumption.  
- **Ignoring constants/lower-order terms:** Asymptotics emphasize dominant terms, but constants can dominate at practical `n`.  
- **Distributional caveats:** Worst-/average-case statements require clear **input assumptions** (random vs adversarial; [[cs/math/discrete-probability|independence]]).

---

## Examples
### Limit Comparison Method
When direct constants are hard to find, compare function ratios:

```

lim (n→∞) f(n)/g(n) = L

```
- If `0 < L < ∞` → `f(n) = Θ(g(n))`  
- If `L = 0` → `f(n) = o(g(n))`  
- If `L = ∞` → `f(n) = ω(g(n))`

> [!example]
> For `f(n) = 3n² + 5n`, `g(n) = n²`  
> `lim (f(n)/g(n)) = 3` → `f(n) = Θ(g(n))`.

### Simplification Rules

| Expression | Simplified As | Reason |
|-------------|----------------|---------|
| `O(2n)` | `O(n)` | Drop constant factor |
| `O(n + log n)` | `O(n)` | Dominant term |
| `O(n² + n log n)` | `O(n²)` | Highest-order term dominates |
| `O(n log 2n)` | `O(n log n)` | log(2n) = log n + log 2 = log n + constant |
| `O((n+1)²)` | `O(n²)` | Expand and drop lower terms |

> [!tip]
> Constants and additive terms vanish in asymptotic analysis; only growth rates matter.

### Visual Intuition
Imagine plotting `f(n)` and `g(n)`:
- O(g(n)) bounds *above* f(n)  
- Ω(g(n)) bounds *below*  
- Θ(g(n)) traps f(n) *between* both bounds.


### Practical Interpretation - Why Θ(n log n) Sorts Are “Optimal”
All **comparison-based sorting algorithms** must perform at least `Ω(n log n)` comparisons in the worst case.  
Merge Sort, Heap Sort, and Quick Sort (average case) achieve `O(n log n)`, hence `Θ(n log n)` optimality.

> [!note]
> Asymptotics describe scalability, not wall-clock speed. A well-tuned O(n²) algorithm can outperform O(n log n) for small n.

### Summary Table

| Notation | Meaning | Direction | Example |
|-----------|----------|------------|----------|
| O(g(n)) | Upper bound | ≤ | f(n) ≤ c·g(n) |
| Ω(g(n)) | Lower bound | ≥ | f(n) ≥ c·g(n) |
| Θ(g(n)) | Tight bound | ≈ | Both O and Ω hold |
| o(g(n)) | Strictly smaller | < | log n = o(n) |
| ω(g(n)) | Strictly larger | > | n² = ω(n log n) |

> [!example] Quick limit comparison
> \(\lim_{n\to\infty}\frac{n\log n}{n^\alpha}=0\) for any \(\alpha>1\), hence \(n\log n = o(n^\alpha)\).

---

## Pitfalls
> [!warning]
> **Dropping non-dominant terms incorrectly:**  
> `O(n log n + n²)` ≠ `O(n log n)` - the `n²` term dominates.

> [!warning]
> **Confusing average with amortized:**  
> Average-case O(1) ≠ amortized O(1); the latter averages over sequences of operations.

> [!warning]
> **Mixing variables:**  
> Big-O describes growth with respect to one dominant input size parameter; multivariate forms need explicit context.

> [!warning] Common traps
> - Using Big-O like equality (“algorithm is O(n)”).
> - Quoting bounds that hold only for **some** n without specifying “for sufficiently large n”.
> - Treating constants as irrelevant when they actually dominate in real data sizes.

---

## Related Notes
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis]]
- [[cs/dsa/best-worst-average-cases|Best/Worst/Average Cases]]
- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]
- [[cs/dsa/logarithmic-functions|Logarithmic Functions]]
- [[cs/dsa/recurrence-relations|Recurrence Relations]]

## Sources

- Jessica Su, CS 161 Lecture 1, Stanford University (portions from CLRS). https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture1.pdf . Backs the three formal definitions as this note states them: O(g(n)) is the set of f(n) for which there exist c and n0 with 0 <= f(n) <= c*g(n) for all n >= n0; Omega(g(n)) is the set for which 0 <= c*g(n) <= f(n); and f is Theta(g) when it is both O(g) and Omega(g), equivalently when c1*g(n) <= f(n) <= c2*g(n) for all n >= n0. It also backs the note's caution that a bound can be misleading in practice for exactly two reasons, the constant c and the threshold n0, which is why a well-tuned quadratic algorithm can beat an asymptotically better one at practical sizes.
- Eric Lehman, F. Thomson Leighton and Albert R. Meyer, Mathematics for Computer Science, MIT 6.042 (2018 edition), chapter 14.7. https://courses.csail.mit.edu/6.042/spring18/mcs.pdf . Backs the limit-comparison method used in the Examples section: little-o is defined there directly as lim f/g = 0 and little-omega as the mirrored relation g = o(f), so the L = 0 and L = infinity legs of the ratio test are the definitions themselves; the 0 < L < infinity leg follows because a finite nonzero ratio makes each function big-O of the other, which is that text's definition of Theta. It also backs the Pitfalls section: the Equality Blunder passage explains why f = O(g) must not be treated as a symmetric equation, and the Omega section states that big-O can only be used for upper bounds and that phrasing a lower bound with it is an error.
- Big O notation, Wikipedia. https://en.wikipedia.org/wiki/Big_O_notation . Backs the identification of O, Omega and Theta as the Bachmann-Landau family; that writing f(x) = O(g(x)) is an abuse of notation whose equals sign wrongly suggests a symmetry the statement does not have, with the set-membership form f(x) in O(g(x)) as the alternative and the equals sign nonetheless customary; and that the Omega used here is Knuth's complexity-theory Omega (f eventually at least a constant multiple of g) rather than the older Hardy-Littlewood Omega, which means something different.
- Comparison sort, Wikipedia. https://en.wikipedia.org/wiki/Comparison_sort . Backs the Practical Interpretation section: comparison sorts have an Omega(n log n) lower bound on comparisons, mergesort and heapsort are asymptotically optimal against it, that bound applies only when the input may be in any order, and non-comparison sorts sidestep it entirely.
- Analysis of algorithms, Wikipedia. https://en.wikipedia.org/wiki/Analysis_of_algorithms . Backs the Model and Assumptions section: the unit-cost model in which primitive operations are counted, and the point that asymptotics describe scalability rather than wall-clock time on a particular machine.
- Random-access machine, Wikipedia. https://en.wikipedia.org/wiki/Random-access_machine . Backs the RAM model referenced in the cost-model callout.
- Quicksort, Wikipedia. https://en.wikipedia.org/wiki/Quicksort . Backs quicksort's average O(n log n) as cited in the optimality paragraph, alongside its quadratic worst case.
