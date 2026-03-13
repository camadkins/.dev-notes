---

title: Prime Number Algorithms
description: Primality tests from trial division to sieves and Miller-Rabin; performance, memory, and correctness trade-offs.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-10-30
aliases: []

---

## Overview

Prime-number work splits into two families:

1. **Generate many primes up to N** — use **sieves** (Eratosthenes, segmented variants) with near-linear time and tightly bounded memory.

2. **Test a single large n** — use **primality tests** (deterministic for small ranges; **probabilistic** like **Miller-Rabin** for cryptographic sizes).

This note presents clear, implementable versions of **trial division**, **wheel tricks**, **Sieve of Eratosthenes** (plain and segmented), and **Miller-Rabin**, with complexity, pitfalls, and practical defaults.

> [!note]
> Conventions: integers `n ≥ 0`; primes start at `2`. Use half-open ranges where helpful. Complexity uses `$O(\cdot)$`.

## Motivation

- **Batch prime generation** (tables, factoring small numbers, number-theory DP): sieves dominate.

- **Single-number primality** (keys, randomized algorithms): Miller-Rabin yields fast, extremely reliable answers with tunable error.

- **Hybrid**: small-factor trial division before Miller-Rabin prunes trivial composites cheaply.

## Definition and Formalism

### Trial Division (sqrt(n) bound)

An integer `n ≥ 2` is composite iff it has a factor `p ≤ √n`.

- Test divisibility by small primes up to `⌊√n⌋`.

- Early return as soon as a divisor is found.

- Optional **wheel** (skip obvious composites like even numbers or multiples of 3).

**Complexity:** `$O(\pi(\sqrt{n})) = O(\sqrt{n}/\log n)$` divisions in worst case; fine for 32-bit `n`, too slow for 1024-bit.

> [!tip]
> Precompute primes up to `√n` with a small sieve and divide only by those primes.

### Wheel Factorization (skipping residues)

Reduce the set of candidates by removing numbers divisible by small bases.

- **Mod 6 wheel**: after handling 2 and 3, check only residues `±1 (mod 6)` → ~1/3 of odds remain.

- Larger wheels (e.g., mod 30: skip multiples of 2,3,5) reduce trial count further but increase indexing complexity.

**Effect:** Constant-factor speedup; asymptotics unchanged.

## Example or Trace

**Trial division with mod-6 wheel:** Candidates: `5,7,11,13,17,19,23,25,...` (i.e., `6k±1`). Stop once `p*p > n`.

- For `n=221`, test 5 (no), 7 (no), 11 (yes, 221=11×20+1 → actually 221 = 13×17; our sequence hits 13 next and finds divisor).

- For `n=223`, stop at `p=15` since `15*15>223`; no divisor found → **prime**.

> [!warning]
> **Edge cases**: `n < 2` is **not prime**; `2` and `3` are primes; even `n > 2` and `n % 3 == 0` imply composite early.

## Implementation or Practical Context

### Sieve of Eratosthenes (dense in-RAM up to N)

Core idea: mark composite multiples of each found prime, starting at `p*p`.

```pseudo
function SIEVE_ERATOSTHENES(N):
    is_prime = array[0..N] of bool true
    is_prime[0] = is_prime[1] = false
    for p in 2..floor(sqrt(N)):
        if is_prime[p]:
            // start at p*p to avoid redundant marks
            for m in p*p .. N step p:
                is_prime[m] = false
    primes = []
    for x in 2..N:
        if is_prime[x]: append(primes, x)
    return primes
```

**Why start at `p*p`?** All smaller multiples `k·p` with `k < p` were already marked by `k`.

**Complexity:** `$O(N \log \log N)$` time; `$O(N)$` bits/bytes memory (use bitset to reduce).
**Memory footprint:** With a **bitset**, memory is `N/8` bytes. For `N=10^8`, ~12.5 MB.

> [!warning]
> **Off-by-one pitfalls**: ensure loops include/exclude correct endpoints; guard `p*p` overflow (use 64-bit when `N` near 2^31).

#### Optimizations

- **Skip evens:** store only odds; index map `val = 2*i + 1` halves memory and time.

- **Wheel sieve:** store residues of a larger wheel (e.g., mod 30) for further savings.

- **Cache-friendly crossing:** block the inner loop to work on cache-sized chunks.

### Segmented Sieve (large N with limited RAM)

Generate primes in `[2..N]` without holding all `N` flags in memory.

1. Sieve **base primes** up to `√N` (small array).

2. For each segment `[L..R]` (size `S`, e.g., a few MB), allocate `is_prime[L..R]` initialized true.

3. For each base prime `p`, compute the first multiple in segment:
    `start = max(p*p, ceil(L/p)*p)`; mark `start, start+p, … ≤ R`.

```pseudo
function SIEVE_SEGMENTED(N, S):
    base = SIEVE_ERATOSTHENES(floor(sqrt(N)))
    for L in 2..N step S:
        R = min(L+S-1, N)
        mark = array[L..R] of bool true
        for p in base:
            if p*p > R: break
            start = max(p*p, ((L + p - 1) / p) * p)
            for m in start .. R step p: mark[m-L] = false
        emit all x in [L..R] with mark[x-L] = true
```

**Complexity:** still `$O(N \log \log N)$`; memory `$O(S)` plus base primes.
**Use cases:** `N ≥ 10^9` where full bitset is too large.

### Sieve Variants

- **Linear (Euler) sieve:** marks each composite once, keeping smallest prime factor; useful for factoring. Time `$O(N)$`, memory `$O(N)$`.

- **Sieve of Atkin:** more complex math, faster constants on some hardware; rarely worth the complexity in practice.

### Deterministic Primality for Machine Words

For **64-bit integers**, Miller-Rabin with a **small fixed base set** is deterministic.

- A common set: test bases `a ∈ {2, 3, 5, 7, 11, 13, 17}` is sufficient for all `n < 2^64`.

- Even smaller curated sets exist; any of the standard sets work in practice.

> [!tip]
> Always **trial-divide by small primes** first (e.g., all primes ≤ 1000). This removes trivial composites and reduces Miller-Rabin rounds.

### Miller-Rabin (probabilistic, fast, practical)

Given odd `n > 2`, write `n−1 = d·2^s` with `d` odd. For a base `a` with `1 < a < n−1`:

```pseudo
function MILLER_RABIN_WITNESS(n, a):
    if n % a == 0: return composite
    // compute x = a^d mod n via fast exponentiation
    x = powmod(a, d, n)
    if x == 1 or x == n-1: return probably_prime
    for r in 1..s-1:
        x = (x * x) mod n
        if x == n-1: return probably_prime
    return composite
```

Run with `k` independent random bases `a`; if all return **probably_prime**, declare **probable prime** with error ≤ `4^{-k}` (often much smaller). For 64-bit `n`, using the **fixed bases** above makes it **deterministic**.

**Cost:** Each round does one modular exponentiation: `$O(\log n)$` squarings/multiplications; total `$O(k \log^3 n)$` in bit complexity (schoolbook arithmetic).

> [!note]
> **Strong pseudoprimes** ("liars") exist for many bases, but taking a small **set** of bases crushes error. Cryptographic libraries combine Miller-Rabin with **trial division** and sometimes **Baillie-PSW** (Miller-Rabin base 2 + strong Lucas test), which has no known counterexample.

## Example or Trace

### Sieve (N = 50)

- Start `p=2`: mark `4,6,8,...`.

- `p=3`: mark `9,12,15,...`.

- `p=5`: mark `25,30,35,40,45,50`.
    Remaining true flags are primes: `[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47]`.

### Miller-Rabin factorization

For `n−1 = d·2^s`, example `n=561` (Carmichael):

- `561−1=560=35·2^4`.

- With base `a=2`, exponentiation leads to a nontrivial square never hitting `n−1`; returns **composite**.

- Carmichael numbers fool **Fermat** but not a proper **Miller-Rabin** round structure (for many bases).

## Complexity Analysis

- **Trial division:** worst-case `$O(\sqrt{n})$` trials; wheel reduces constants.

- **Sieve of Eratosthenes:** `$O(N \log \log N)$` time, `$O(N)$` memory (bitset recommended).

- **Segmented sieve:** same time, memory `$O(\sqrt{N} + S)$`.

- **Miller-Rabin:** `$O(k \log^3 n)$` bit ops; with fixed bases for 64-bit, a handful of rounds.

**Throughput guidance**

- Need _all primes ≤ N_? — Sieve (segmented if `N` is huge).

- Need _just primality of one big n_? — Trial divide small primes, then Miller-Rabin.

- Need _factors_? — Combine small-sieve SPF (smallest prime factor) with Pollard's rho (out of scope here).

## Optimizations or Variants

- **Bitset compression**: store only odds; 8× memory cut with bit packing.

- **Wheel sieving**: skip residues that are multiples of small primes (mod 30 common).

- **Blocked crossing**: improve cache behavior by marking composites in cache-lined tiles.

- **Baillie-PSW**: a strong Miller-Rabin round (base 2) + a Lucas probable-prime test; extremely reliable without fixed counterexamples known.

- **Deterministic bases** for 64-bit n: established small sets yield correctness without randomness.

## Applications

- **Cryptography**: generate probable primes for RSA/DSA/ECC (Miller-Rabin loops with size and structure constraints).

- **Number-theory algorithms**: dynamic programming over primes, totients, Mobius, etc., using sieved lists.

- **Combinatorics and hashing**: choose moduli that are prime to enable multiplicative inverses and fields in hash functions or NTTs.

- **Primality proofs**: for special forms (Mersenne/Fermat), dedicated tests exist (Lucas-Lehmer, Pepin).

## Common Pitfalls or Edge Cases

> [!warning]
> **Treating 1 as prime.** `0` and `1` are **not** prime; start table at `2`.

> [!warning]
> **Marking from `2p`.** In the sieve, start marking at `p*p`, not `2p`, to avoid redundant work.

> [!warning]
> **Integer overflow in `p*p`.** Use a wider type when `p*p` may overflow the loop's type.

> [!warning]
> **Segment base alignment.** For segmented sieves, compute `start = max(p*p, ceil(L/p)*p)` carefully; off-by-one here silently drops marks.

> [!warning]
> **Miller-Rabin base choices.** Using a single small base can let strong pseudoprimes slip through; use **multiple** bases or the known deterministic set for 64-bit.

> [!warning]
> **Modular exponentiation bugs.** Implement `powmod` with **64-bit/BigInt** intermediates; multiply then reduce safely to avoid overflow.

## Implementation Notes or Trade-offs

- **Small prime wheel**: quick reject by checking divisibility by primes ≤ 19 or residues modulo 30 before heavier tests.

- **Caching primes**: keep a global small prime table (e.g., all primes ≤ 10^6) for both trial division and fast segmented ranges.

- **Memory vs speed**: bitsets + wheels offer the best of both; Atkin/linear sieves add complexity—use when you need SPF or per-composite work.

- **Threading**: segmented sieve parallelizes across segments; Miller-Rabin parallelizes across bases.

## Summary

- For **up to N** primes, the **Eratosthenes sieve** (plain or segmented) is the gold standard: `$O(N \log \log N)$` with tight memory via bitsets and wheels.

- For **single large n**, combine **small-factor trial division** with **Miller-Rabin** using multiple bases (or deterministic sets for 64-bit).

- Watch **off-by-ones** (`p*p`), **overflow**, and **powmod correctness**. With these building blocks and a few guardrails, prime testing and generation are fast, reliable, and production-friendly.

## See also

- [[euclidean-algorithms|Euclidean Algorithms]]

- [[hcf-and-lcm-algorithms|HCF and LCM Algorithms]]

- [[counting-sort|Counting Sort]]

- [[logarithmic-functions|Logarithmic Functions]]
