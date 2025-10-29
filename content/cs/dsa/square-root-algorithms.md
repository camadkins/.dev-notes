---
title: Square Root Algorithms  
description: Integer and real square roots via binary search and Newton's method; correctness, rounding, and overflow-safe implementations.  
draft: true  
tags:
- cs
- dsa
- date: 2025-10-16  
updated:  
aliases: []
# diagrams:

# - sqrt-binary-search-flow.svg — Flowchart for floor sqrt using monotone predicate mid*mid ≤ n with overflow-safe comparison mid ≤ n//mid.

# - newton-convergence.svg — Plot of error vs iteration showing quadratic convergence of Newton/Heron updates toward √n.

---

## Overview

Computing a square root appears simple but hides details: **integer vs real** results, **rounding** (floor/ceil/nearest), **overflow safety**, and the **domain** (nonnegative inputs). This note presents practical, production-ready approaches:

- **Binary search (integer sqrt):** robust, easy to implement, `Θ(log U)` steps where `U` bounds the result.
    
- **Newton’s method / Heron’s algorithm (real or integer):** fast (quadratic convergence) with careful termination and rounding rules.
    
- **Bit-by-bit (restoring) method:** integer-only alternative with predictable control flow.
    

Use these patterns to implement `floor_sqrt(n)`, `ceil_sqrt(n)`, a floating `sqrt(x)`, and checks like “is `n` a perfect square?” while avoiding overflow and off-by-one traps.

> [!note]  
> Domain is **nonnegative** inputs. For negative `x`, real `sqrt(x)` is undefined (NaN); integer sqrt is undefined. In complex arithmetic, `√x` is multi-valued—outside this note’s scope.

## Core Idea

Exploit monotonicity of `f(m) = m²`:

- For integers, `m² ≤ n` is a **monotone predicate** in `m`. The **largest** `m` satisfying it is `⌊√n⌋`. Binary search or bit tricks find this without floating-point.
    
- Newton’s method solves `g(y) = y² − x = 0` by iterative refinement  
    `y_{k+1} = (y_k + x / y_k) / 2`. With a good initial guess, errors square each step, rapidly doubling correct digits.
    

Both methods require **care around overflow** and **termination** to guarantee correct rounding.

## Algorithm Steps / Pseudocode

### A. Integer floor sqrt by binary search (overflow-safe)

```pseudo
function ISQRT_FLOOR(n):            // n ≥ 0 (unsigned or nonnegative integer)
    if n < 2: return n              // 0→0, 1→1
    lo = 1
    hi = n // 2 + 1                 // √n ≤ n/2 + 1 for n ≥ 2
    while lo < hi:
        mid = lo + (hi - lo + 1) // 2   // upper mid to avoid infinite loop
        // Compare mid*mid ≤ n without overflow:
        if mid <= n // mid:
            lo = mid
        else:
            hi = mid - 1
    return lo                        // lo = ⌊√n⌋
```

- **Ceiling**: `ISQRT_CEIL(n) = ISQRT_FLOOR(n)` if `lo*lo == n` else `lo + 1`.
    
- **Perfect square test**: compute `r = ISQRT_FLOOR(n)`, check `r*r == n` (guard overflow via `r ≤ n // r` as above if types are tight).
    

> [!example]  
> **Diagram (`sqrt-binary-search-flow.svg`)** — Flowchart with states `(lo, hi)` and the predicate `mid ≤ n//mid` instead of `mid*mid ≤ n`, emphasizing overflow safety; shows convergence to `lo = ⌊√n⌋`.

### B. Newton/Heron for real sqrt (double) with safe termination

```pseudo
function SQRT_NEWTON(x):            // x ≥ 0, floating-point
    if x == 0: return 0.0
    // Initial guess: use exponent to get ~1 ULP start (optional).
    y = initial_guess(x)            // e.g., y = max(1.0, 2^(ceil(log2(x))/2))
    // Iterate until relative change small and y*y close to x
    repeat:
        y_next = 0.5 * (y + x / y)
        if abs(y_next - y) <= 1e-15 * y_next: break
        y = y_next
    return y_next
```

- Better stopping rules compare `|y² − x| ≤ ε · max(x,1)` to avoid stagnation near tiny `x`.
    
- For languages without fused divide behavior, guard `x / y` when `y` underflows.
    

### C. Newton for integer floor sqrt (round-down at end)

```pseudo
function ISQRT_NEWTON(n):           // n ≥ 0 integer; uses integer division
    if n < 2: return n
    // Start with a power-of-two estimate: 1 << ceil(bit_length(n)/2)
    y = 1 << ((bit_length(n) + 1) // 2)
    while true:
        y_next = (y + n // y) // 2
        if y_next >= y: break       // converged (monotone non-increasing)
        y = y_next
    // y is ≥ ⌊√n⌋; adjust down if necessary
    while (y + 1) <= n // (y + 1): y = y + 1
    while y > n // y: y = y - 1
    return y
```

- This uses only integer arithmetic; the final correction ensures exact floor even with early stopping.
    

### D. Bit-by-bit (restoring) integer sqrt

Deterministic loop building the result from MSB to LSB; reminiscent of long division:

```pseudo
function ISQRT_RESTORING(n):
    res = 0
    rem = 0
    // Process bits in pairs from high to low
    shift = (bit_length(n) - 1) // 2
    while shift >= 0:
        rem = (rem << 2) | ((n >> (shift*2)) & 3)   // bring next 2 bits
        cand = (res << 1) | 1                       // trial divisor
        if rem >= cand:
            rem = rem - cand
            res = (res << 1) | 1
        else:
            res = (res << 1)
        shift = shift - 1
    return res       // = ⌊√n⌋
```

- Predictable branches and no division; good on microcontrollers without fast div.
    

## Example or Trace

**Binary search (n = 37):**  
`lo=1, hi=19` → `mid=10`, `10 ≤ 3?` no → `hi=9` → `mid=5`, `5 ≤ 7?` yes → `lo=5` → `mid=7`, `7 ≤ 5?` no → `hi=6` → `mid=6`, `6 ≤ 6?` yes → `lo=6`, stop with `6`, since `6²=36 ≤ 37 < 49`.

**Newton (x = 10):**  
Start `y=4`. Iterates: `3.25`, `3.1625`, `3.16227766…`. Two to three iterations get full double precision.

> [!tip]  
> Newton’s method converges **quadratically** near the root: once close, each step roughly **doubles** the number of correct digits.

## Complexity Analysis

- **Binary search (integer):** `O(log U)` iterations, where `U` is an upper bound on `⌊√n⌋` (e.g., `U = n/2+1` or `1<<((bitlen+1)/2)`). Each step is `O(1)` arithmetic → **`Θ(log n)`** time, **`Θ(1)`** extra space.
    
- **Newton (float):** Each iteration is `O(1)` arithmetic; with a good initial guess, **`O(log d)`** iterations to achieve `d` digits → effectively constant for fixed-precision floats. Space `Θ(1)`.
    
- **Newton (integer):** Iterations count grows like **`O(log log n)`** from a strong initial guess; overall `Θ(1)` space.
    
- **Bit-by-bit:** Processes **`⌈bitlen(n)/2⌉`** loop steps → `Θ(log n)` time, `Θ(1)` space.
    

## Optimizations or Variants

- **Initial guess for Newton:** derive from exponent bits (for IEEE-754, split mantissa/exponent) to start within a few ULPs. Alternatively, table-based seeds for ranges.
    
- **Guarded division:** in integer Newton, using `n // y` avoids overflow that would occur with `y*y`.
    
- **Mixed strategy:** use 2–3 Newton steps from a rough `y0` (e.g., bit-based) then finalize with a **binary-search polish** between `⌊y⌋−1` and `⌈y⌉+1`.
    
- **Vectorized sqrt:** on platforms with SIMD, use hardware `sqrtps/sqrtsd` then refine with one Newton step for accuracy across lanes.
    
- **Fast inverse sqrt:** compute `1/√x` (graphics classic); multiply by `x` to get `√x` if needed. Requires careful constant tuning and one Newton step for accuracy.
    

> [!example]  
> **Diagram (`newton-convergence.svg`)** — Error `|y_k − √x|` vs iteration on a log scale showing near-linear drop in log-space (slope ≈ 2), contrasting with the linear convergence of simple methods.

## Applications

- **Geometry & graphics:** distance, normalization (`len = √(x²+y²+z²)`), perspective calculations.
    
- **Statistics:** standard deviation, RMS, Mahalanobis distances.
    
- **Cryptography / number theory:** perfect square checks, Cornacchia’s algorithm, modular square roots (different domain).
    
- **Systems:** integer sqrt for bucket sizing, level-of-detail, tile radii without floats.
    

## Common Pitfalls or Edge Cases

> [!warning]  
> **Overflow in `mid*mid`.** Always compare via `mid ≤ n // mid` (integers) or use wider types/bignums.

> [!warning]  
> **Termination on Newton.** Stop by checking both **relative change** and **squared residual**; tiny `x` or very large `x` can trick naive deltas.

> [!warning]  
> **Rounding ambiguity.** Specify whether you return **floor**, **ceil**, or **nearest**; document ties (e.g., nearest-even).

> [!warning]  
> **Negative inputs.** Decide: return NaN (float), throw, or sentinel. For integer APIs, reject at the boundary.

> [!warning]  
> **Precision loss for large `x`.** In floating-point, `y*y` can overflow even when `y ≈ √x` fits. Prefer comparing `y` to `x / y` during checks, or scale `x` by powers of two to a safe range, iterate, then rescale.

## Implementation Notes or Trade-offs

- **API surface:** Provide `isqrt_floor`, `isqrt_ceil`, `sqrt_safe(double)`. Expose **prediction-free** integer paths for deterministic timing.
    
- **Language quirks:** Some languages offer `isqrt` in the standard library (e.g., C++20 `std::sqrt` for floats, `std::bit_width` helps seeding; Python `math.isqrt` implements a bit-by-bit/NR hybrid).
    
- **Big integers:** Use Newton with big-int division; convergence remains fast because each step roughly doubles digits. Normalize by base-`B` digits to keep divisions balanced.
    
- **Testing:** Include boundaries `n ∈ {0,1,2,3,4}`, powers just below/above squares (e.g., `k² − 1`, `k²`, `k² + 1`), and max values for the type (e.g., `UINT64_MAX`).
    

## Summary

Square roots can be computed reliably with:

- **Binary search** for integer floors/ceils (simple, safe, `Θ(log n)`).
    
- **Newton/Heron** for fast real roots or integer roots with final correction (quadratic convergence).
    
- **Bit-by-bit** methods when divisions are slow or unavailable.
    

Correctness hinges on **overflow-safe comparisons**, **clear rounding semantics**, and **explicit termination**. Choose the method that fits the numeric model, performance constraints, and platform capabilities.

## See also

- [[cs/dsa/binary-search|Binary Search]]
    
- [[cs/dsa/recurrences-master-theorem|Recurrences — Master Theorem]]
    
- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]
    
- [[cs/dsa/maths|Math Basics for DS&A]]