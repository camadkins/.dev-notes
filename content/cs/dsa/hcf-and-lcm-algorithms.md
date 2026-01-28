---
title: HCF and LCM Algorithms
description: Practical computation of gcd/hcf and lcm, including overflow-safe formulas, zero/sign handling, and array-wise reductions.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2026-01-10
aliases: []
---

## Overview

The **highest common factor** (HCF), also called the **greatest common divisor** (**gcd**), of integers `a` and `b` is the largest integer dividing both. The **least common multiple** (**lcm**) is the smallest positive integer divisible by both. These quantities are tightly linked by a single identity:

- `lcm(a,b) = |a·b| / gcd(a,b)` for any integers `a` and `b`, not both zero.


Efficient computation hinges on **Euclid's algorithm** for `gcd`, plus an **overflow-safe** way to apply the identity for `lcm`. For multiple numbers, reduce pairwise: `gcd(a,b,c)=gcd(gcd(a,b),c)` and similarly for `lcm`.

## Motivation

GCD and LCM are building blocks for:

- **Number theory & cryptography:** modular inverses, RSA keygen use `gcd`; modular arithmetic with common moduli uses `lcm`.

- **Scheduling & periodicity:** find when events coincide (LCM of periods).

- **Arithmetic simplification:** reduce fractions by dividing numerator/denominator by `gcd`.

- **Programming tasks:** normalizing step sizes, aligning strides, checking coprimality.


A few careful choices—**signs**, **zeros**, and **overflow control**—make implementations robust instead of buggy.

## Definition and Identities

- `g = gcd(a,b)` is the **largest nonnegative** integer such that `g | a` and `g | b`. By convention, `gcd(0,0)=0`. For `(a,0)`, `g=|a|`.

- `lcm(a,b)` is the **smallest positive** integer `L` such that `a | L` and `b | L`. If either input is `0` and the other nonzero, `lcm` is `0`; if both are `0`, many libraries define `lcm(0,0)=0`.


**Key identity.**

```
|a·b| = gcd(a,b) · lcm(a,b)     (a,b not both 0)
```

**Multi-argument reductions.**

```
gcd(a1,a2,...,ak) = gcd(...gcd(gcd(a1,a2),a3)...,ak)
lcm(a1,a2,...,ak) = lcm(...lcm(lcm(a1,a2),a3)...,ak)
```

Associativity up to sign conventions allows a simple **fold** over arrays.

## Algorithms / Pseudocode

### Euclid's GCD (iterative)

```pseudo
function GCD(a, b):
    a = abs(a); b = abs(b)
    while b != 0:
        (a, b) = (b, a mod b)
    return a
```

See also [[cs/dsa/euclidan-algorithms|Euclidean Algorithms]] for extended GCD and binary GCD variants.

### Overflow-Safe LCM (pairwise)

Compute `lcm(a,b)` without overflowing `a*b`:

```pseudo
function LCM(a, b):
    if a == 0 or b == 0: return 0
    g = GCD(a, b)
    // divide first to avoid overflow
    return abs(a / g) * abs(b)
```

> [!tip]
> Divide **before** multiplying. `abs(a/g) * abs(b)` typically stays in range where `abs(a*b)` may overflow. For signed 64-bit integers, still guard against the rare case where the product exceeds `INT64_MAX`; switch to big integers or check before multiply.

### Array/Vector Forms

```pseudo
function GCD_ARRAY(A):
    g = 0
    for x in A:
        g = GCD(g, x)
    return g

function LCM_ARRAY(A):
    L = 1
    for x in A:
        if L == 0: return 0
        L = LCM(L, x)     // uses safe pairwise LCM above
        if overflow(L):   // optional guard or big-int fallback
            error "overflow"
    return L
```

## Example or Trace

**GCD:** `gcd(252,105)`
`252 = 2·105 + 42 → gcd(105,42)`
`105 = 2·42 + 21 → gcd(42,21)`
`42 = 2·21 + 0 → gcd = 21`.

**LCM:** `lcm(21,6)`
`gcd(21,6)=3`, so `lcm = |21/3|·|6| = 7·6 = 42`.

**Array:** `lcm(4,6,10)`
`lcm(4,6)=12`, then `lcm(12,10)=60`.

## Complexity Analysis

- **GCD:** `O(log min(|a|,|b|))` modulo steps (worst case ≈ Fibonacci inputs). Constant extra space.

- **LCM:** Dominated by a `gcd` and one multiply/divide; same asymptotics.

- **Array reductions:** `k` times the above; overall `O(k log M)` with `M` the magnitude of inputs (assuming primitive integers).


## Common Pitfalls or Edge Cases

> [!warning]
> **Zero handling.** Define `gcd(0,0)=0`. For `lcm`, if any input is `0` while another is nonzero, return `0`. Be explicit in docs/tests.

> [!warning]
> **Sign conventions.** Return **nonnegative** `gcd`. For `lcm`, return **nonnegative** too. Use `abs` around inputs and divisions.

> [!warning]
> **Overflow on `a*b`.** Never compute `lcm` as `abs(a*b)/gcd(a,b)` directly on fixed-width integers. Divide first, or use wide/bignum types.

> [!warning]
> **Integer division traps.** Ensure you use **integer** division when computing `a/g` and that `g` divides `a` (it does by definition).

> [!warning]
> **Empty arrays.** Define `gcd([])=0` (neutral for `gcd(g, x)` with `g=0`), and **decide** what `lcm([])` should be in your API—often `1` (multiplicative identity) or raise an error; document the choice.

## Implementation Notes or Trade-offs

- **Extended GCD:** If you need modular inverses or to solve `ax+by=c`, call the extended version and reuse `g, x, y` (see [[cs/dsa/euclidan-algorithms|Euclidean Algorithms]]).

- **Binary GCD (Stein).** Good when divisions are expensive; uses shifts/subtractions only.

- **Type width & big ints:** For 32-bit code, promote intermediates to 64-bit during `lcm`. For very large inputs or many factors, switch to **arbitrary precision** after a threshold.

- **Short-circuits:** If `gcd(a,b)==1`, then `lcm(a,b)=|a|·|b|` (still apply overflow guards). If `a==b`, `gcd(a,b)=|a|`, `lcm(a,b)=|a|`.


## Summary

Compute `gcd` with **Euclid**; compute `lcm` via the identity `|a·b| = gcd·lcm` but **divide before multiply** to avoid overflow. Normalize results to **nonnegative** values, handle **zeros** carefully, and fold pairwise for arrays. With these patterns, HCF/LCM code is short, fast, and safe.

## See also

- [[cs/dsa/euclidan-algorithms|Euclidean Algorithms]]

- [[cs/dsa/prime-numbers-algorithms|Prime Numbers Algorithms]]

- [[cs/dsa/maths|Maths]]

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
