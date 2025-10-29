---
title: Math Basics for DS&A  
description: Essential arithmetic identities, integer properties, and edge-case behaviors that show up constantly in algorithms and proofs.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - sums-and-powers.svg — Visual table of common series (Σ i, Σ i^2, Σ i^3) and geometric sums; arrows annotate closed forms and growth orders.

# - integer-division-mod.svg — Number line showing x = q·d + r with 0 ≤ r < d; examples for negative x and differing modulo conventions.

# - overflow-graph.svg — 32-bit signed range with wraparound on addition/multiplication; highlights UB vs defined wrap.

# - parity-lattice.svg — Small lattice showing even/odd closure under +, −, ×; quick rules for parity of sums/products.

---

## Overview

This note collects **math facts and habits** that make algorithm design, analysis, and coding **faster and safer**: closed-form **sums**, **parity** and divisibility rules, **integer division/modulo** conventions, safe **overflow** reasoning, and a compact **proof checklist** (invariants, induction, extremal/contradiction). These tools reappear across sorting bounds, tree heights, hashing, DP recurrences, and implementation details like array indexing and bit operations.

> [!note]  
> Focus is **discrete** and **integer-first**. When asymptotics matter, we pair exact equalities with `Θ( )` or `O( )` forms to keep both proof and intuition aligned.

## Motivation

Small errors in integer math cause **off-by-one bugs**, **wrong loop bounds**, and **subtle overflow** failures. On the analysis side, recognizing a standard sum or applying a parity fact can collapse a page of algebra into a line. A single, dependable “math kit” helps you:

- Derive **runtime** quickly (e.g., `Σ_{i=1}^n i = n(n+1)/2`).
    
- Prove **correctness** via loop **invariants** or **induction**.
    
- Implement **division/modulo** correctly, especially with negatives.
    
- Avoid **undefined behavior** or wrong results due to overflow.
    

## Definition and Formalism

We work over integers `ℤ` unless stated. Standard notation:

- `a | b` means “`a` divides `b`”.
    
- Floor/ceiling: `⌊x⌋`, `⌈x⌉`.
    
- Asymptotics: `O( )`, `Ω( )`, `Θ( )`.
    
- For positive integer `d` and any integer `x`, **Euclidean division** defines unique `q,r` with  
    `x = q·d + r` and `0 ≤ r < d`. Then `q = ⌊x/d⌋`, `r = x mod d` (Euclidean convention).
    

> [!warning]  
> Programming languages differ on **modulo for negatives**; see “Integer Division & Modulo in Practice.”

## Example or Illustration

- The cost of nested loops
    
    ```text
    for i in 1..n:      // Θ(n)
      for j in 1..i:    // Σ i = Θ(n^2)
        work()          // total = Θ(n^2)
    ```
    
    uses `Σ_{i=1}^n i = n(n+1)/2 = Θ(n^2)`.
    
- Hash bucketing often checks parity or residue: `bucket = key mod m`. Understanding `mod` rules with negatives prevents off-by-one and negative indices (see below).
    
- Balanced tree depth relies on logs and geometric sums: `1 + 2 + 4 + … + 2^h = 2^{h+1}-1`.
    

## Properties and Relationships

### A. Canonical Sums & Products (close forms & growth)

For integer `n ≥ 1`:

- **Arithmetic series**  
    `Σ_{i=1}^n i = n(n+1)/2 = Θ(n^2)`  
    `Σ_{i=1}^n (a + (i−1)d) = n(2a+(n−1)d)/2`
    
- **Squares & cubes**  
    `Σ i^2 = n(n+1)(2n+1)/6 = Θ(n^3)`  
    `Σ i^3 = (n(n+1)/2)^2 = Θ(n^4)` (sum of cubes is square of triangular number)
    
- **Geometric series** (ratio `r ≠ 1`)  
    `Σ_{i=0}^{k} r^i = (r^{k+1} − 1)/(r − 1)`  
    Special cases:  
    `Σ_{i=0}^{k} 2^i = 2^{k+1} − 1`  
    For `|r|<1`, `Σ_{i=0}^{∞} r^i = 1/(1−r)`.
    
- **Harmonic**  
    `H_n = Σ_{i=1}^n 1/i = Θ(log n)` (tightly `ln n + γ + o(1)`)
    
- **Binomial sums**  
    `Σ_{i=0}^n C(n,i) = 2^n`, `Σ i·C(n,i) = n·2^{n-1}`
    
- **Telescoping**  
    Recognize `a_i − a_{i+1}` pattern to collapse sums, e.g.,  
    `Σ (1/(i(i+1))) = 1 − 1/(n+1)`.
    

> [!tip]  
> When proving `Θ( )`, pair an **exact** closed form with a simpler bound:  
> `n(n+1)/2 ≥ n^2/2` and `≤ n^2`, hence `Θ(n^2)`.

### B. Parity, Divisibility, and Congruences

- **Parity rules** (with `e` even, `o` odd):  
    `e ± e = e`, `o ± o = e`, `e ± o = o`;  
    `e·x = e`, `o·o = o`.  
    Squares: `n^2 ≡ 0 (mod 4)` if `n` even; `≡ 1 (mod 4)` if `n` odd.
    
- **Congruence**: `a ≡ b (mod m)` iff `m | (a−b)`. Behaves like equality under `+`, `−`, `×`.
    
- **Coprime product rule**: If `gcd(a,m)=1`, then `a` has a multiplicative inverse mod `m`. Used in hashing and CRT-based reasoning.
    
- **Chinese Remainder** (pairwise coprime moduli): Solve simultaneous congruences componentwise.
    

### C. Growth & Logs (quick recall)

- `Σ_{i=0}^{⌊log₂ n⌋} 2^i = Θ(n)`
    
- `Σ_{i=1}^n log i = Θ(n log n)` (Stirling: `≈ n log n − n`)
    
- `1 + 1/2 + … + 1/n = Θ(log n)` (harmonic).
    

### D. Inequalities you actually use

- **AM–GM:** `(x+y)/2 ≥ √(xy)` with equality at `x=y`.
    
- **Bernoulli:** `(1+x)^r ≥ 1 + rx` for `r ≥ 1`, `x ≥ −1`.
    
- **Exponential vs polynomial:** `a^n` eventually outgrows `n^k` for fixed `a>1,k`.
    

## Implementation or Practical Context

### Integer Division & Modulo in Practice

There are two common conventions for `x div d` and `x mod d` (with `d>0`):

1. **Euclidean** (mathematical): `q = ⌊x/d⌋`, `r = x − q·d`, so `0 ≤ r < d`.
    
2. **Truncation toward zero** (C/C++/Java for division; C/C++ `%` ties to that): `q = trunc(x/d)`, remainder `r = x − q·d` may be negative or positive but satisfies `|r| < d`.
    

|Language|Division of `-7/3`|Remainder|Mod behavior|
|---|---|---|---|
|Math/Euclidean|`⌊-7/3⌋ = -3`|`r = 2`|`-7 mod 3 = 2`|
|C, C++ (since C99/C++11)|`-2`|`-1`|`-7 % 3 = -1`|
|Python (`//`, `%`)|`-3`|`2`|Euclidean: `-7 % 3 = 2`|

> [!warning]  
> **Indexing with `%`**: In C/C++, `(i % m)` can be **negative** if `i<0`. Normalize with `((i % m) + m) % m` when using as an array index in `[0..m-1]`.

**Uniqueness:** For Euclidean division (fixed `d>0`) the `q,r` pair is unique. In truncation semantics `r` can be negative; many invariants still hold if you account for it, but **range checks** differ.

### Floors, Ceilings, and Off-by-One

- `⌊(n−1)/k⌋` counts **full groups** of size `k` in `n` items.
    
- `⌈n/k⌉` counts groups if you **allow a partial** last group—commonly used for chunking arrays into pages of size `k`.
    
- `⌈log₂ n⌉` comparisons for binary search worst-case (on `n≥1`).
    
- Inclusive ranges `[L..R]` have size `R−L+1`.
    

> [!tip]  
> When you see “loop while `n > 1`: `n = ⌊n/2⌋`,” the iteration count is `⌊log₂ n₀⌋`. If the loop includes the step for `n==1`, then the count matches `⌊log₂ n₀⌋ + 1`.

### Overflow, Underflow, and Safe Arithmetic

- **Fixed-width integers** (e.g., 32-bit signed) have finite ranges `[-2^{31}, 2^{31}-1]`.
    
    - In **C/C++**, **signed overflow is undefined behavior** (UB). Unsigned overflow **wraps modulo `2^w`**.
        
    - Many managed languages define two’s-complement wrap for signed overflow (e.g., Java) but may throw on divide-by-zero only.
        
- **Red flags**: `a*b`, `a+b`, `mid = (L+R)/2` in binary search.
    
    - Use `mid = L + (R−L)/2`.
        
    - For `a*b`, cast to wider type before multiply or check against thresholds.
        
    - Prefer library **checked** ops or intrinsics where available.
        

> [!warning]  
> UB can be “optimized” away by compilers, producing surprising code motion. Avoid expressions that can overflow in C/C++ unless you use unsigned or builtins that define behavior.

### Bit Operations & Identities You’ll Use

- **Powers of two**: `x % 2^k == x & (2^k − 1)` (fast masking if non-negative and language semantics match).
    
- **Parity**: `x` is odd iff `(x & 1) == 1`.
    
- **Counting bits**: use built-ins (`popcount`, `clz`, `ctz`).
    
- **Swapping without temp**: `a ^= b; b ^= a; a ^= b;` (works but reduce to normal swap for clarity unless micro-optimizing).
    

### Quick Asymptotic Translations

- Replace `Σ_{i=1}^n i` with `Θ(n^2)`, `Σ log i` with `Θ(n log n)`, geometric tails with constants (`Σ 2^{-i} ≤ 1`).
    
- Remember **dominance**: `n log n` ≫ `n`, `n^2` ≫ `n log n`, `2^n` ≫ any polynomial.
    

## Common Misunderstandings

> [!warning]  
> **Assuming one modulo rule.** Language `%` may not match Euclidean `mod`. Always check your target language and normalize negative results when indexing.

> [!warning]  
> **Dropping floor/ceiling too early.** Rounding changes equalities; keep floors/ceilings through algebra, then bound them when taking `O( )`.

> [!warning]  
> **“`log n` is tiny” ⇒ ignore it.** `log n` is small but not negligible compared to constants in tight loops; distinguish between `O(log n)` and `O(1)` in design choices.

> [!warning]  
> **Harmonic ≈ constant.** `H_n` grows unbounded (slowly). Replacing it with a constant loses the asymptotic `log n` factor in analyses of hashing, union–find, etc.

> [!warning]  
> **Silent overflow.** If an intermediate expression overflows (e.g., `n(n+1)/2` in 32-bit), the final value is wrong even if it “should” fit in 64-bit. Promote before multiply.

## Broader Implications

These basics underlie larger results:

- **Sorting lower bound** uses `log(n!) = Θ(n log n)`.
    
- **Master Theorem** manipulates geometric levels and harmonic sums.
    
- **Hash analysis** often needs **expectation** and **indicator variables** atop congruences and series.
    
- **Number-theoretic** constructions (e.g., universal hashing, modular inverses) require modular arithmetic discipline.
    

> [!tip]  
> Build a **scratch pad** of identities (Σ, product bounds, congruence rules) for exams/interviews. Re-derive once, then reuse.

## Summary

Keep a compact toolkit:

- **Sums**: arithmetic, geometric, harmonic; binomial and telescoping.
    
- **Parity & mod**: closure rules, congruences, Chinese Remainder basics.
    
- **Division/mod**: know your language’s convention; normalize negatives for indices.
    
- **Floors/ceilings**: count groups, levels, and comparisons precisely.
    
- **Overflow**: avoid UB, promote types, use safe midpoints.  
    Pair exact math with asymptotic bounds to move seamlessly between **proof** and **implementation**.
    

## See also

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
    
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]
    
- [[cs/dsa/recurrence-relations|Recurrence Relations]]
    
- [[cs/dsa/logarithmic-functions|Logarithmic Functions]]