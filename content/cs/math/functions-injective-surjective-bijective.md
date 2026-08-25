---
title: "Functions: Injective, Surjective, Bijective"
description: "Functions as mappings, and the three ways a function can relate domain to codomain: one-to-one, onto, and the bijections that count."
draft: false
comments: true
tags:
  - cs
  - math
  - discrete-math
date: 2026-06-17
updated:
aliases:
  - injective-surjective-bijective
  - one-to-one-and-onto
---

## A Function Is a Rule With One Output

A function assigns to each element of a domain exactly one element of a codomain. That "exactly one" is the whole discipline: it is what separates a function from a general [[cs/math/relations-and-equivalence|relation]], which may send an element to zero, one, or many partners. Given the constraint, the interesting questions are about how the outputs cover the codomain and whether any output is hit twice. Three properties answer them.

> [!note]
> The payload: a bijection is the formal meaning of "these two sets are the same size." Two sets have "the same number of elements ... if there is a bijection between them," a definition that keeps working when the sets are infinite and counting stops being an option. Every counting proof in CS that pairs up two collections to show they are equinumerous is secretly constructing a bijection.

## Injective (One-to-One)

A function is "injective, or one-to-one, if each element of the codomain is mapped to by at most one element of the domain, or equivalently, if distinct elements of the domain map to distinct elements in the codomain." Nothing collides. An injection can be inverted on its image, because from an output you can recover the unique input that produced it. A perfect hash on a fixed key set is an injection; a [[cs/dsa/huffman-coding|lossless encoding]] is an injection from messages to codewords.

## Surjective (Onto)

A function is "surjective, or onto, if each element of the codomain is mapped to by at least one element of the domain; that is, if the image and the codomain of the function are equal." Nothing is missed. Every possible output value is actually produced. A surjection guarantees full coverage of the target, which is the property you want when the codomain is a set of results none of which may be unreachable.

## Bijective (Both)

A function is "bijective ... if each element of the codomain is mapped to by exactly one element of the domain; that is, if the function is both injective and surjective." No collisions and no gaps. Exactly one input per output means a bijection has a genuine two-sided inverse, and it is the only kind of function that does. Bijections are the invertible functions: [[cs/security/aes-and-block-ciphers|encryption]] under a fixed key, a reversible permutation, an index remap that can be undone.

## Why Bijections Count

Pairing two finite sets by a bijection proves they have equal [[cs/math/set-theory-basics|cardinality]] without counting either one. This is the backbone of [[cs/math/combinatorics|combinatorial]] proof: to show two sets of configurations are equal in number, exhibit a bijection between them. It also sets the boundary that the [[cs/math/pigeonhole-principle|pigeonhole principle]] enforces from the other side. If the domain is strictly larger than the codomain, no injection can exist, so some output must be shared. A [[cs/security/cryptographic-hash-functions|hash function]] from a large key space into a small table cannot be injective, and that impossibility is why collisions are inevitable rather than a bug.

> [!example]
> **Doubling on the naturals, $f(n) = 2n$.** From $\mathbb{N}$ to $\mathbb{N}$:
> It is *injective* (distinct $n$ give distinct $2n$) but not *surjective* (no $n$ maps to $3$).
> Yet $f$ is a bijection from $\mathbb{N}$ onto the even naturals, which proves the evens are the same size as all of $\mathbb{N}$. A proper subset can biject with the whole set, which is precisely the signature of an infinite set.

## Related Notes

- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - a function is a relation constrained to one output per input
- [[cs/math/set-theory-basics|Set Theory Basics]] - bijection is the definition of equal cardinality
- [[cs/math/combinatorics|Combinatorics]] - counting by constructing a bijection between two configuration sets
- [[cs/math/pigeonhole-principle|Pigeonhole Principle]] - when the domain exceeds the codomain, injectivity is impossible

## Sources

- [Bijection, injection and surjection (Wikipedia)](https://en.wikipedia.org/wiki/Bijection,_injection_and_surjection) - the at-most-one, at-least-one, and exactly-one definitions and the bijection characterization of equal size.
