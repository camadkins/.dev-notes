---

title: Logarithmic Functions  
description: Logs invert exponentiation, count digits/levels, and model halving processes; essential for O(log n) analyses in algorithms and data structures.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - log-curves-bases.svg — Plot y=log_b(x) for b∈{2,e,10}; mark x=1 (y=0), x=b (y=1); show slower growth than linear.

# - binary-halving-levels.svg — Binary search tree showing levels 0..⌊log2 n⌋ and a halving trace; connects comparisons to depth.

# - digits-and-bits.svg — Visual: decimal digits = ⌊log10 n⌋+1, bit length = ⌊log2 n⌋+1 for n≥1; sample annotations for n=999, n=1024.

---

## Overview

A **logarithm** answers “what power produces this number?”: `log_b(x)` is the exponent `y` such that `b^y = x` (with `b>0`, `b≠1`, `x>0`). In computer science, logarithms explain why **divide-and-conquer**, **tree heights**, and **binary encodings** behave like `O(log n)`. Because logs grow **slowly**, any algorithm with logarithmic factors scales well. Understanding bases, identities, floors/ceilings, and discrete interpretations (digits, bit length, loop counts) is key to accurate performance reasoning.

> [!note]  
> In CS, the default base is often **2** (`log₂`) due to binary representations; in math/analysis, **e** (natural log `ln`) is common. Bases differ by a **constant factor** via the change-of-base identity.

## Motivation

Logarithms appear whenever work scales with the number of **times you can halve** (or reduce by a constant factor) before hitting a base case. Classic examples:

- **Binary search:** each comparison halves the remaining range → about `log₂ n` steps.
    
- **Tree height:** balanced binary trees and heaps have height `Θ(log₂ n)`.
    
- **Exponentiation-by-squaring:** reduces exponent size by half each step → `O(log n)` multiplications.
    
- **Bit length / digits:** storing the number `n` requires `⌊log₂ n⌋+1` bits; decimal digits are `⌊log₁₀ n⌋+1`.
    

The ubiquitous nature of `log n` terms makes logs a compact language for **levels, digits, and exponents**.

## Definition and Formalism

For `b>0`, `b≠1`, define:

- `log_b(x) = y ⇔ b^y = x`, for `x>0`.
    
- **Change of base:** `log_b(x) = log_k(x) / log_k(b)` for any `k>0, k≠1`.  
    Commonly, `log₂(x) = ln(x)/ln(2)` and `log₁₀(x) = ln(x)/ln(10)`.
    

**Algebraic identities (for `x,y>0`):**

- `log_b(xy) = log_b(x) + log_b(y)`
    
- `log_b(x/y) = log_b(x) - log_b(y)`
    
- `log_b(x^a) = a·log_b(x)`
    
- `b^{log_b(x)} = x`, `log_b(b^a) = a`
    

**Domain & monotonicity.**

- Domain: `x>0` only.
    
- If `b>1`, then `log_b` is **increasing**; if `0<b<1`, it is **decreasing** (rare in CS).
    

**Growth:** For large `x`, `log x` grows slower than any polynomial root: `log x = o(x^ε)` for all `ε>0`. Also, `log log x` grows slower than `log x`.

## Example or Illustration

- `log₂(1) = 0` because `2^0 = 1`.
    
- `log₂(1024) = 10` because `2^10 = 1024`.
    
- `log₁₀(1000) = 3`; thus numbers `100`–`999` have **3** digits, consistent with `⌊log₁₀(n)⌋+1`.
    

> [!example]  
> **Binary search steps.** With `n=1000`, `⌈log₂ 1000⌉ ≈ 10`. After 10 halving steps a single candidate remains. The **levels** of decisions correspond to the **bits** needed to encode an index.

## Properties and Relationships

- **Base invariance up to constants.** In asymptotics, `log_b n = (1/ln b)·ln n`, so changing the base multiplies by a constant. Thus `O(log₂ n) = O(log₁₀ n) = O(ln n)` in Big-O terms.
    
- **Digits and bits.** For `n≥1`:
    
    - Bit length: `bits(n) = ⌊log₂ n⌋ + 1`.
        
    - Decimal digits: `digits(n) = ⌊log₁₀ n⌋ + 1`.
        
- **Tree heights.** A complete binary tree with `n` nodes has height `⌊log₂ n⌋` (0-based). A complete `k`-ary tree has height `Θ(log_k n) = Θ((log n)/(log k))`.
    
- **Master Theorem context.** Recurrences like `T(n) = a·T(n/b) + f(n)` yield terms with `log_b n` in the exponent of `n` or in multiplicative factors; see [[cs/dsa/recurrences-master-theorem|Recurrences — Master Theorem]].
    
- **Iterated logs.** `log^{(k)} n` denotes applying log **k** times; `log^* n` (log-star) counts how many times to log until ≤ 1 (extremely small, ≤ 5 for any realistic `n`).
    

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

- After the loop, `count = ⌊log₂ n₀⌋`. If you stop when `n == 0`, the count is `⌊log₂ n₀⌋ + 1` for `n₀ ≥ 1`.
    

### Integer floor of log₂ without floating point

```pseudo
function FLOOR_LOG2(n):              // n ≥ 1
    k = 0
    while (1 << (k+1)) <= n:
        k = k + 1
    return k
```

With bit operations, many languages provide a “count leading zeros” (CLZ) primitive:  
`floor_log2(n) = word_bits - 1 - clz(n)` for `n>0`.

> [!tip]  
> Use **bit length** to size arrays or heaps: a binary heap storing `n` items has height `⌊log₂ n⌋`, so operations are bounded by that many sift steps; see [[cs/dsa/heaps|Heaps — Overview]].

### Change-of-base in code (stable numerics)

Avoid subtracting nearly equal floats:

```pseudo
function LOG_BASE(x, b):
    return ln(x) / ln(b)        // relies on high-quality ln
```

If `x` and `b` vary widely, prefer library functions `log2(x)`/`log10(x)` for accuracy, then change base using constants `1/ln(2)` or `1/ln(10)`.

### Digits and bit length

```pseudo
function DECIMAL_DIGITS(n):     // n ≥ 1
    d = 0
    while n > 0:
        n = floor(n / 10)
        d = d + 1
    return d
// Equivalent to floor(log10(n)) + 1 but avoids FP issues.
```

### Common CS appearances

- **Binary search:** comparisons `≈ ⌈log₂ n⌉` (see [[cs/dsa/binary-search|Binary Search]]).
    
- **Balanced trees / heaps:** height `Θ(log n)`; operations take `O(log n)`.
    
- **Exponentiation by squaring:** `O(log e)` multiplications for exponent `e`.
    
- **Index structures:** B-trees achieve `O(log_b n)` with large base `b` (branching factor), reducing I/O.
    

## Common Misunderstandings

> [!warning]  
> **Base confusion in asymptotics.** `O(log n)` hides constant factors. `log₂ n` and `log₁₀ n` differ by `ln(10)` ≈ 2.3026—**constant**, not a different class.

> [!warning]  
> **Domain errors.** `log_b(0)` is **undefined** and `log_b(x)` for `x<0` is not real (without complex numbers). Guard inputs in code.

> [!warning]  
> **Off-by-one at boundaries.** For levels or digits, remember floors:
> 
> - Largest index at depth `h` in a complete binary tree is about `2^{h+1}-1` total nodes → `h = ⌊log₂ n⌋`.
>     
> - Decimal digits use `⌊log₁₀ n⌋+1` **only for `n≥1`**; handle `n=0` as a special case (digits = 1).
>     

> [!warning]  
> **Confusing `log n` vs `n log n`.** `n log n` grows much faster than `log n`. Sorting lower bound is `Ω(n log n)`—not logarithmic.

> [!warning]  
> **Iterated log vs power of log.** `log log n` (iterated) is **much** smaller than `(log n)^2` (power). Do not conflate notation.

## Broader Implications

Because `log` transforms multiplication into addition, it underpins:

- **Complexity transforms:** analyzing multiplicative shrinkage as additive depth (`#levels = log_b n`).
    
- **Information theory:** `log₂` measures information in **bits**; entropy sums `p_i log p_i`.
    
- **Scale compression:** Logging axes turns exponential curves into lines—useful for profiling with exponentially growing inputs.
    
- **Numeric robustness:** Logs stabilize products of many factors (sum of logs) and prevent under/overflow in probabilistic computations.
    

> [!tip]  
> For **large exponents/products**, compute `sum(log(x_i))` and exponentiate at the end to avoid overflow; in base 2 this directly yields **bits** of magnitude.

## Summary

Logarithms are the **inverse of exponentiation** and quantify **levels**, **digits**, and **bit lengths**. They capture the cost of processes that repeatedly **shrink by a constant factor**: binary search steps, tree heights, and divide-and-conquer recursion depths. Bases differ by a constant factor (`log_b n = ln n / ln b`), so asymptotically they’re interchangeable. In implementation, prefer integer methods for floors/bit lengths, use built-in `log2/log10` for accuracy, and watch boundary cases (`n=0`, `x≤0`). Mastery of logs enables clear reasoning about `O(log n)`, `O(n log n)`, and deeper results like the Master Theorem.

## See also

- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]
    
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
    
- [[cs/dsa/binary-search|Binary Search]]
    
- [[cs/dsa/recurrences-master-theorem|Recurrences — Master Theorem]]