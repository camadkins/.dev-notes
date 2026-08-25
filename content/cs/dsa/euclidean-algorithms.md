---
title: Euclidean Algorithms
description: Fast GCD via repeated modulo; the extended form finds Bézout coefficients for modular inverses and Diophantine solutions.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-06
aliases: []
---

## Overview

**Euclid's algorithm** computes the **greatest common divisor (gcd)** of two integers using the identity
`gcd(a, b) = gcd(b, a mod b)` and repeating until the remainder is zero. The **extended** version also returns integers `x, y` such that **`ax + by = gcd(a, b)`** (Bézout coefficients). These coefficients are essential for **modular inverses** (when `gcd(a, m) = 1`, the inverse of `a mod m` is `x mod m`) and for solving **linear Diophantine equations**.

## Core Idea

Two facts drive correctness:

1. **Remainder identity:** For integers `a, b (b ≠ 0)` with `a = q·b + r` and `0 ≤ r < |b|`,
    `gcd(a, b) = gcd(b, r)`.
    (Any common divisor of `a` and `b` also divides `r = a − q·b`, and vice versa.)

2. **Termination measure:** Remainders **strictly decrease** and are **non-negative**; the process halts when the remainder is zero. The last nonzero remainder is the gcd.


Extended Euclid threads **coefficients** through the same recurrence so that at each step `x_i, y_i` satisfy `x_i·a + y_i·b = current_value`.

## Algorithm Steps / Pseudocode

### Euclid's GCD (iterative, modulo form)

```pseudo
function GCD(a, b):
    a = abs(a); b = abs(b)
    while b != 0:
        (a, b) = (b, a mod b)
    return a
```

### Extended Euclid (returns gcd and Bézout coefficients)

We maintain two rows of coefficients that transform alongside `(a, b)`:

```pseudo
function EXTENDED_GCD(a, b):
    // returns (g, x, y) with g = gcd(a, b) and ax + by = g
    old_r = a;     r = b
    old_x = 1;     x = 0
    old_y = 0;     y = 1
    while r != 0:
        q = old_r div r                // integer division
        (old_r, r) = (r, old_r - q*r)  // remainder step
        (old_x, x) = (x, old_x - q*x)
        (old_y, y) = (y, old_y - q*y)
    // now old_r = gcd(a,b), and a*old_x + b*old_y = old_r
    return (old_r, old_x, old_y)
```

> [!tip]
> **Modular inverse:** If `g==1` from `EXTENDED_GCD(a, m)`, then `a^{-1} ≡ x (mod m)`. Use `(x % m + m) % m` to normalize a negative `x`.

## Example or Trace

**GCD example:** `gcd(252,105)`
`252 = 2·105 + 42` → `gcd(252,105) = gcd(105,42)`
`105 = 2·42 + 21` → `gcd(105,42) = gcd(42,21)`
`42 = 2·21 + 0` → **gcd = 21**.

**Extended example (inverse):** Find the inverse of `a=17 mod m=43`.

Run `EXTENDED_GCD(17, 43)`:

|step|old_r|r|q|old_x|x|old_y|y|
|--:|--:|--:|--:|--:|--:|--:|--:|
|init|17|43|-|1|0|0|1|
|1|43|17|2|0|1|1|-2|
|2|17|9|1|1|-1|-2|3|
|3|9|8|1|-1|2|3|-5|
|4|8|1|8|2|-17|-5|43|
|5|1|0|-|-17|-|43|-|

Return `(g,x,y)=(1,-17,43)`. Since `g=1`, the inverse is `x ≡ -17 ≡ 26 (mod 43)`.
Check: `17·26 = 442 ≡ 1 (mod 43)`.

## Complexity Analysis

- **Time:** Each modulo step reduces the remainder; the number of steps is **$O(\log(\min(a,b)))$** in the size of the inputs. (Worst-case inputs follow consecutive Fibonacci numbers.)

- **Space:** **$O(1)$** extra space for the iterative forms (both basic and extended).

- **Cost model:** Modulo operations dominate. For big integers, use fast division implementations; asymptotics remain logarithmic in bit-length.


## Optimizations or Variants

- **Subtractive Euclid:** Replace modulo with repeated subtraction: slow (**linear**) but useful where division is expensive (teaching/embedded).

- **Binary GCD (Stein's algorithm):** Avoids division using shifts and subtraction; efficient when shifts are cheaper than divides.

- **Tail-recursive style:** The basic GCD can be written [[cs/languages/Racket/proper-tail-calls-and-the-loop-question|tail-recursively]] and optimized by compilers to iterative code.

- **Batch inverses:** To compute many inverses modulo the same `m`, use a **prefix–suffix product** trick (one inverse plus linear-time sweeps) to avoid `O(n)` separate extended runs.


## Applications

- **Modular inverses:** In cryptography and competitive programming, invert `a mod m` when `gcd(a,m)=1`.

- **RSA & number theory:** Compute `d ≡ e^{-1} (mod φ(n))` during RSA key generation.

- **Diophantine equations:** Solve `ax + by = c` by finding `(x₀,y₀)` for `g=gcd(a,b)` and scaling `c/g`.

- **LCM and fraction reduction:** `lcm(a,b) = |ab| / gcd(a,b)`; reduce ratios to lowest terms.

- **Coprimality tests:** Quick check: `gcd(a,b) == 1` → numbers are [[cs/math/number-theory-and-modular-arithmetic|coprime]].


## Common Pitfalls or Edge Cases

> [!warning]
> **Zero and negatives.** Define `gcd(0,0)=0`. For `(a,0)`, return `|a|`. Use `abs` so the gcd is **non-negative** and signs don't leak into coefficients unexpectedly.

> [!warning]
> **Modulo sign conventions.** Some languages define `%` with a negative result for negative `a`. Normalize with `((a % b) + b) % b` when working with coefficients.

> [!warning]
> **Overflow in products.** When forming `lcm(a,b)=|ab|/gcd(a,b)`, multiply using a wider type or divide first (e.g., `|a/gcd| * |b|`) to avoid overflow.

> [!warning]
> **Forgetting the inverse condition.** An inverse `a^{-1} mod m` exists **iff** `gcd(a,m)=1`. Always check the gcd before using `x` from `EXTENDED_GCD`.

## Implementation Notes or Trade-offs

- **Iterative extended form** avoids recursion depth concerns and is easy to port.

- **Returning normalized inverses:** After `EXTENDED_GCD(a,m)`, compute `inv = (x % m + m) % m`.

- **APIs:** Expose helpers `gcd(a,b)`, `egcd(a,b)->(g,x,y)`, `mod_inverse(a,m)`; the latter throws/returns `None` if `g≠1`.

- **Performance tip:** For many small inverses mod the same prime, prefer **Fermat's little theorem** with fast exponentiation; for general moduli or non-primes, use extended Euclid.


## Summary

Euclid's algorithm reduces the gcd problem to a short loop of **modulo** operations with logarithmic step count. The **extended** variant carries Bézout coefficients through the same updates, unlocking modular inverses and linear equation solutions. Implement it iteratively for constant space, normalize signs and residues carefully, and add a thin helper for `mod_inverse` that guards on `gcd(a,m)=1`.

## Related Notes

- [[cs/dsa/hcf-and-lcm-algorithms|HCF and LCM Algorithms]]

- [[cs/dsa/prime-numbers-algorithms|Prime Numbers Algorithms]]

- [[cs/dsa/recursion|Recursion]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
