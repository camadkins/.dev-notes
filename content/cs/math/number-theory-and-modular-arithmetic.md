---
title: Number Theory and Modular Arithmetic
description: "Divisibility, congruence, Euclid's GCD, and primes: the integer arithmetic that public-key cryptography runs on."
draft: false
comments: true
tags:
  - cs
  - math
  - cryptography
date: 2026-02-14
updated:
aliases:
  - modular-arithmetic
---

## Arithmetic That Wraps

A 12-hour clock does not count past 12. Five hours after 9 o'clock is 2 o'clock, not 14. That everyday collapse is the whole idea of modular arithmetic, "a system of arithmetic operations for integers" where numbers "wrap around" when reaching or exceeding a certain value, called the modulus. Wikipedia gives exactly this picture: on a clock modulo 12, "13 is congruent to 1 modulo 12." Number theory is the study of the integers under divisibility and this wrapping, and it is the least optional branch of math for anyone doing cryptography.

> [!note]
> The payload: reducing modulo $m$ throws away magnitude and keeps only the remainder, folding infinitely many integers into $m$ residue classes. That deliberate loss of information is the source of cryptographic hardness. Forward operations (multiply two primes, exponentiate mod $n$) stay cheap; inverting them (factor the product, take a discrete logarithm) does not. The asymmetry is manufactured by working inside a finite ring where the answer no longer reveals how big the inputs were.

## Divisibility and the GCD

$a$ divides $b$ (written $a \mid b$) when $b$ is an exact integer multiple of $a$. The **greatest common divisor** $\gcd(a, b)$ is "the largest number that divides them both without a remainder." Two integers whose gcd is $1$ are **coprime**, and coprimality is the precondition for a number to have a multiplicative inverse modulo $m$.

Euclid's algorithm computes the gcd without factoring either number, using one structural fact: "the greatest common divisor of two numbers does not change if the larger number is replaced by its difference with the smaller number." Replace subtraction with remainder and each step shrinks the pair fast, so $\gcd$ falls out in $O(\log)$ steps. The [[cs/dsa/euclidean-algorithms|extended form]] additionally returns the Bézout coefficients $x, y$ with $ax + by = \gcd(a,b)$, which is how you actually compute a modular inverse.

## Congruence

$a \equiv b \pmod{m}$ means $m$ divides $a - b$, that is, $a$ and $b$ leave the same remainder on division by $m$. Congruence is a [[cs/math/relations-and-equivalence|equivalence relation]]: it is reflexive, symmetric, and transitive, so it carves the integers into $m$ disjoint residue classes $\{0, 1, \dots, m-1\}$. Addition and multiplication respect these classes, so you can reduce at any point in a computation and get the same answer, which is what keeps modular exponentiation from ever handling astronomically large intermediate values.

## Primes

A **prime** is "a natural number greater than 1 that is not a product of two smaller natural numbers." Primes are the multiplicative atoms of the integers: the fundamental theorem of arithmetic says "every natural number greater than 1 is either a prime itself or can be factorized as a product of primes that is unique up to their order." Unique factorization is why "factor this number" is a well-posed and, for large semiprimes, brutally expensive question. Generating primes and testing primality are their own [[cs/dsa/prime-numbers-algorithms|algorithmic topics]].

## Why Cryptography Sits On This

Modular arithmetic "directly underpins public key systems such as RSA and Diffie-Hellman." RSA picks two large primes $p, q$, publishes $n = pq$, and relies on the gap between multiplying them (trivial) and recovering them from $n$ (no known efficient method). The public and private exponents are modular inverses found with the extended Euclidean algorithm. Break the factoring problem and RSA falls; that single number-theoretic assumption is load-bearing for much of the internet's transport security.

> [!example]
> **Euclid on $\gcd(48, 18)$.** Repeatedly replace the pair with (divisor, remainder):
> $$48 = 2 \cdot 18 + 12 \quad\to\quad 18 = 1 \cdot 12 + 6 \quad\to\quad 12 = 2 \cdot 6 + 0$$
> The last nonzero remainder is $6$, so $\gcd(48, 18) = 6$. No factoring of either number was needed, and the same three lines would run just as fast on 300-digit inputs.

> [!warning]
> "Coprime modulo $m$" is what makes inverses exist, not primality of $m$ itself. $a$ has an inverse mod $m$ exactly when $\gcd(a, m) = 1$. When $m$ is prime every nonzero residue is invertible (a field), which is why prime moduli are convenient, but the underlying requirement is always coprimality.

## Related Notes

- [[cs/dsa/euclidean-algorithms|Euclidean Algorithms]] - the GCD algorithm and its extended, inverse-finding form
- [[cs/dsa/prime-numbers-algorithms|Prime Number Algorithms]] - primality testing and sieves
- [[cs/dsa/hcf-and-lcm-algorithms|HCF and LCM Algorithms]] - GCD and least common multiple in practice
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - congruence as an equivalence relation partitioning the integers
- [[cs/math/set-theory-basics|Set Theory Basics]] - residue classes are a partition of the integer set

## Sources

- [Modular arithmetic (Wikipedia)](https://en.wikipedia.org/wiki/Modular_arithmetic) - the wrap-around definition, the clock example, and the link to RSA and Diffie-Hellman.
- [Euclidean algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Euclidean_algorithm) - the GCD as the largest common divisor and the difference-invariance the algorithm exploits.
- [Prime number (Wikipedia)](https://en.wikipedia.org/wiki/Prime_number) - the definition of a prime and the fundamental theorem of arithmetic.
