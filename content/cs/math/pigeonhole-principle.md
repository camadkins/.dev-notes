---
title: Pigeonhole Principle
description: "The counting argument that a full-enough set of containers must share: simple and generalized forms, and the CS limits it enforces."
draft: false
comments: true
tags:
  - cs
  - math
  - discrete-math
date: 2026-07-11
updated:
aliases:
  - pigeonhole
---

## Obvious, Then Not

Put more pigeons than holes and some hole holds two. The pigeonhole principle "states that if $n$ items are put into $m$ containers, with $n > m$, then at least one container must contain more than one item." It looks too simple to prove anything. It proves a surprising amount, because it hands you an existence result without ever pointing at which container is crowded.

> [!note]
> The payload: stated in the language of [[cs/math/functions-injective-surjective-bijective|functions]], the principle says "there does not exist an injective function whose codomain is smaller than its domain." That single sentence is a hard limit. It forbids a collision-free hash into a smaller table and forbids a compressor that shrinks every input. Whenever you try to pack a large set into a smaller one without loss, this is the theorem that says you cannot.

## The Two Forms

**Simple.** $n$ items, $m$ containers, $n > m$: at least one container has two or more items.

**Generalized.** If $n$ items go into $m$ containers, some container holds at least $\lceil n/m \rceil$ items. With 100 items in 9 containers, one holds at least $\lceil 100/9 \rceil = 12$. The generalized form is what you reach for when "at least two" is too weak and you need a quantified lower bound on the crowding.

Both are pure [[cs/math/combinatorics|counting arguments]]: no construction, no algorithm, just a comparison of two sizes. The combinatorics note carries the derivation alongside its cousins; this note is about what the principle rules out.

## What It Forbids in CS

**[[cs/security/cryptographic-hash-functions|Hashing collisions]] are unavoidable.** A [[cs/dsa/hash-tables|hash function]] maps a large key space into a small array of buckets. The key space is the domain, the buckets are the codomain, and the domain is bigger. No injective mapping exists, so once you hash more distinct keys than you have buckets, two keys must land together. Collision handling is not defensive engineering against a rare event; it is mandatory because the pigeonhole principle guarantees the event.

**[[cs/dsa/huffman-coding|Lossless compression]] cannot win on everything.** The principle proves "that any lossless compression algorithm, provided it makes some inputs smaller ... will also make some other inputs larger." The set of all $n$-bit inputs has $2^n$ members, and the shorter outputs number fewer than that, so the map from inputs to compressed outputs cannot be injective if every input shrinks. Some inputs must grow. A compressor works only by betting that real files cluster in the compressible region, never by beating the counting bound.

## A Cleaner Trick

The principle's real charm is that it delivers existence for free. You prove something exists without exhibiting it.

> [!example]
> **Two people in London share an exact hair count.** A human head holds fewer hairs than the population of London. Treat each possible hair count as a container and each person as an item: more people than possible counts forces two people into one count. You have proved two Londoners have identical hair counts without measuring a single head. The same shape proves that in any simple graph with more than one vertex, "there is at least one pair of vertices that share the same degree."

> [!warning]
> The principle proves existence, not location or count beyond the bound. It tells you a shared container exists; it does not tell you which one, nor how to find the colliding pair efficiently. Turning "a collision must exist" into "here is the collision" is a separate, often much harder, algorithmic problem.

## Related Notes

- [[cs/math/combinatorics|Combinatorics]] - the pigeonhole principle among the core counting techniques, with derivations
- [[cs/math/functions-injective-surjective-bijective|Functions: Injective, Surjective, Bijective]] - the principle restated as the nonexistence of an injection into a smaller set
- [[cs/dsa/hash-tables|Hash Tables]] - why collision resolution is mandatory, not optional
- [[cs/math/set-theory-basics|Set Theory Basics]] - comparing set sizes, the cardinality argument underneath

## Sources

- [Pigeonhole principle (Wikipedia)](https://en.wikipedia.org/wiki/Pigeonhole_principle) - the simple statement, the no-injection-into-smaller-codomain form, the lossless-compression limit, and the shared-degree result.
