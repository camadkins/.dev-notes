---
title: Logarithmic Functions
description: Logs invert exponentiation, count digits/levels, and model halving processes; essential for O(log n) analyses in algorithms and data structures.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-11-25
aliases: []
---

## Overview

A **logarithm** answers "what power produces this number?": `log_b(x)` is the exponent `y` such that `b^y = x` (with `b>0`, `b!=1`, `x>0`). In computer science, logarithms explain why **divide-and-conquer**, **tree heights**, and **binary encodings** behave like `O(log n)`. Because logs grow **slowly**, any algorithm with logarithmic factors scales well. Understanding bases, identities, floors/ceilings, and discrete interpretations (digits, bit length, loop counts) is key to accurate performance reasoning.

> [!note]
> In CS, the default base is often **2** (`log2`) due to binary representations; in math/analysis, **e** (natural log `ln`) is common. Bases differ by a **constant factor** via the change-of-base identity.

## Motivation

Logarithms appear whenever work scales with the number of **times you can halve** (or reduce by a constant factor) before hitting a base case. Classic examples:

- **Binary search:** each comparison halves the remaining range -> about `log2 n` steps.

- **Tree height:** balanced binary trees and heaps have height `Theta(log2 n)`.

- **Exponentiation-by-squaring:** reduces exponent size by half each step -> `O(log n)` multiplications.

- **Bit length / digits:** storing the number `n` requires `floor(log2 n)+1` bits; decimal digits are `floor(log10 n)+1`.


The ubiquitous nature of `log n` terms makes logs a compact language for **levels, digits, and exponents**.

## Definition and Formalism

For `b>0`, `b!=1`, define:

- `log_b(x) = y <=> b^y = x`, for `x>0`.

- **Change of base:** `log_b(x) = log_k(x) / log_k(b)` for any `k>0, k!=1`.
    Commonly, `log2(x) = ln(x)/ln(2)` and `log10(x) = ln(x)/ln(10)`.


**Algebraic identities (for `x,y>0`):**

- `log_b(xy) = log_b(x) + log_b(y)`

- `log_b(x/y) = log_b(x) - log_b(y)`

- `log_b(x^a) = a*log_b(x)`

- `b^{log_b(x)} = x`, `log_b(b^a) = a`


**Domain & monotonicity.**

- Domain: `x>0` only.

- If `b>1`, then `log_b` is **increasing**; if `0<b<1`, it is **decreasing** (rare in CS).


**Growth:** For large `x`, `log x` grows slower than any polynomial root: `log x = o(x^epsilon)` for all `epsilon>0`. Also, `log log x` grows slower than `log x`.

## Example or Illustration

- `log2(1) = 0` because `2^0 = 1`.

- `log2(1024) = 10` because `2^10 = 1024`.

- `log10(1000) = 3`; thus numbers `100`–`999` have **3** digits, consistent with `floor(log10(n))+1`.


> [!example]
> **Binary search steps.** With `n=1000`, `ceil(log2 1000)` is approximately 10. After 10 halving steps a single candidate remains. The **levels** of decisions correspond to the **bits** needed to encode an index.

## Properties and Relationships

- **Base invariance up to constants.** In asymptotics, `log_b n = (1/ln b)*ln n`, so changing the base multiplies by a constant. Thus `O(log2 n) = O(log10 n) = O(ln n)` in Big-O terms.

- **Digits and bits.** For `n>=1`:

    - Bit length: `bits(n) = floor(log2 n) + 1`.

    - Decimal digits: `digits(n) = floor(log10 n) + 1`.

- **Tree heights.** A complete binary tree with `n` nodes has height `floor(log2 n)` (0-based). A complete `k`-ary tree has height `Theta(log_k n) = Theta((log n)/(log k))`.

- **Master Theorem context.** Recurrences like `T(n) = a*T(n/b) + f(n)` yield terms with `log_b n` in the exponent of `n` or in multiplicative factors; see [[recurrences-master-theorem|Recurrences - Master Theorem]].

- **Iterated logs.** `log^{(k)} n` denotes applying log **k** times; `log^* n` (log-star) counts how many times to log until <= 1 (extremely small, <= 5 for any realistic `n`).


## Implementation or Practical Context

### Counting loop iterations via logs

A pattern where `n` shrinks by a constant factor per iteration:

```pseudo
// Count iterations until range size becomes 0 or 1
function HALVING_STEPS(n):
    count = 0
    while n > 1:
        n = floor(n / 2)
        count = count + 1
    return count          // equals floor(log2(original_n))
```

- After the loop, `count = floor(log2 n0)`. If you stop when `n == 0`, the count is `floor(log2 n0) + 1` for `n0 >= 1`.


### Integer floor of log2 without floating point

```pseudo
function FLOOR_LOG2(n):              // n >= 1
    k = 0
    while (1 << (k+1)) <= n:
        k = k + 1
    return k
```

With bit operations, many languages provide a "count leading zeros" (CLZ) primitive:
`floor_log2(n) = word_bits - 1 - clz(n)` for `n>0`.

> [!tip]
> Use **bit length** to size arrays or heaps: a binary heap storing `n` items has height `floor(log2 n)`, so operations are bounded by that many sift steps; see [[heaps|Heaps - Overview]].

### Change-of-base in code (stable numerics)

Avoid subtracting nearly equal floats:

```pseudo
function LOG_BASE(x, b):
    return ln(x) / ln(b)        // relies on high-quality ln
```

If `x` and `b` vary widely, prefer library functions `log2(x)`/`log10(x)` for accuracy, then change base using constants `1/ln(2)` or `1/ln(10)`.

### Digits and bit length

```pseudo
function DECIMAL_DIGITS(n):     // n >= 1
    d = 0
    while n > 0:
        n = floor(n / 10)
        d = d + 1
    return d
// Equivalent to floor(log10(n)) + 1 but avoids FP issues.
```

### Common CS appearances

- **Binary search:** comparisons approximately `ceil(log2 n)` (see [[binary-search|Binary Search]]).

- **Balanced trees / heaps:** height `Theta(log n)`; operations take `O(log n)`.

- **Exponentiation by squaring:** `O(log e)` multiplications for exponent `e`.

- **Index structures:** B-trees achieve `O(log_b n)` with large base `b` (branching factor), reducing I/O.


## Common Misunderstandings

> [!warning]
> **Base confusion in asymptotics.** `O(log n)` hides constant factors. `log2 n` and `log10 n` differ by `ln(10)` which is approximately 2.3026 - **constant**, not a different class.

> [!warning]
> **Domain errors.** `log_b(0)` is **undefined** and `log_b(x)` for `x<0` is not real (without complex numbers). Guard inputs in code.

> [!warning]
> **Off-by-one at boundaries.** For levels or digits, remember floors:
>
> - Largest index at depth `h` in a complete binary tree is about `2^{h+1}-1` total nodes -> `h = floor(log2 n)`.
>
> - Decimal digits use `floor(log10 n)+1` **only for `n>=1`**; handle `n=0` as a special case (digits = 1).
>

> [!warning]
> **Confusing `log n` vs `n log n`.** `n log n` grows much faster than `log n`. Sorting lower bound is `Omega(n log n)` - not logarithmic.

> [!warning]
> **Iterated log vs power of log.** `log log n` (iterated) is **much** smaller than `(log n)^2` (power). Do not conflate notation.

## Broader Implications

Because `log` transforms multiplication into addition, it underpins:

- **Complexity transforms:** analyzing multiplicative shrinkage as additive depth (`#levels = log_b n`).

- **Information theory:** `log2` measures information in **bits**; entropy sums `p_i log p_i`.

- **Scale compression:** Logging axes turns exponential curves into lines - useful for profiling with exponentially growing inputs.

- **Numeric robustness:** Logs stabilize products of many factors (sum of logs) and prevent under/overflow in probabilistic computations.


> [!tip]
> For **large exponents/products**, compute `sum(log(x_i))` and exponentiate at the end to avoid overflow; in base 2 this directly yields **bits** of magnitude.

## Summary

Logarithms are the **inverse of exponentiation** and quantify **levels**, **digits**, and **bit lengths**. They capture the cost of processes that repeatedly **shrink by a constant factor**: binary search steps, tree heights, and divide-and-conquer recursion depths. Bases differ by a constant factor (`log_b n = ln n / ln b`), so asymptotically they're interchangeable. In implementation, prefer integer methods for floors/bit lengths, use built-in `log2/log10` for accuracy, and watch boundary cases (`n=0`, `x<=0`). Mastery of logs enables clear reasoning about `O(log n)`, `O(n log n)`, and deeper results like the Master Theorem.

## Related Notes

- [[asymptotic-notation|Asymptotic Notation]]

- [[algorithm-efficiency|Algorithm Efficiency]]

- [[binary-search|Binary Search]]

- [[recurrences-master-theorem|Recurrences - Master Theorem]]
