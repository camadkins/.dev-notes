---
title: Immutable Data and Persistent Structures
description: "Why Racket pairs are immutable, how structural sharing pays for it, and the published cost model that makes log N read as constant."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-09
updated:
aliases:
  - Racket Immutable Data
  - Persistent Hash Tables
  - Structural Sharing
---

Racket broke with its own family here. Pairs are immutable, contrary to Lisp tradition, and `pair?` and `list?` recognize immutable pairs and lists only. `set-car!` is not deprecated in Racket; it does not exist. Mutable pairs are a separate type made by `mcons`, with their own predicate, their own accessors, and their own printed form using braces.

> [!note] The idea
> Immutability by default is not a purity argument in Racket, it is a representation argument with a published cost model attached. The interesting number is not that immutable operations are slower; it is by how much and why. Immutable hash tables actually provide logarithmic access and update, and the docs then explain why nobody needs to care: since N is limited by the address space so that log N is limited to less than 30 or 62 depending on the platform, log N can be treated reasonably as a constant. A bound derived from the machine rather than from the algorithm is what turns a persistent structure from a theoretical nicety into the default choice.

## Two pair types, and what the split buys

A pair combines exactly two values, accessed with `car` and `cdr`, and pairs are not mutable. `cons` returns a newly allocated pair. A list is recursively defined as either `null` or a pair whose second value is a list.

The `mcons` procedure creates a mutable pair, which works with `set-mcar!` and `set-mcdr!` alongside `mcar` and `mcdr`. Crucially `(pair? (mcons 1 2))` is `#f`. The two types do not overlap, so a function that accepts a list has a guarantee no Lisp function ever had: the structure it received cannot change under it, and it needs no defensive copy.

Structural sharing follows immediately from `cons` allocating exactly one pair. `(cons 0 lst)` allocates one cell whose `cdr` is `lst` itself. The new list and the old one share every cell of the tail, forever, safely, because nothing can write through either view. [[cs/dsa/linked-list|A singly linked list]] shares tails whether or not it is immutable; what immutability adds is that sharing becomes an optimization the compiler and the programmer may both rely on rather than a hazard to be defended against.

> [!warning] Immutable does not mean acyclic
> Cyclic data structures can be created using only immutable pairs, via `read` or `make-reader-graph`. If starting from a pair and following some number of `cdr`s returns to the starting pair, then that pair is not a list. Immutability constrains who may write, not what shapes the reader may build, so code that walks a `pair?` structure without a `list?` check can still fail to terminate.

## The `list?` trick, which is an amortization argument

`list?` has to decide whether following `cdr`s reaches `null`, which sounds linear. The Reference says otherwise, and the parenthetical is the whole explanation: this procedure effectively takes constant time due to internal caching, so that any necessary traversals of pairs can in principle count as an extra cost of allocating the pairs.

Read that as [[cs/dsa/amortized-analysis-methods|an accounting argument]]. The traversal cost is charged to the allocations that built the chain rather than to the query that asks about it. That accounting only works because the chain cannot change after it is built. In a mutable-pair world, a cached listness flag would be invalidated by every `set-cdr!`, and the amortization collapses. The performance of `list?` is a downstream consequence of the immutability decision, not an independent optimization.

## Immutable hash tables, and the cost model in full

A hash table maps each of its keys to a single value, with key equivalence via `equal?`, `equal-always?`, `eqv?`, or `eq?`, and a hash table is also either mutable or immutable. `hash-set` functionally extends a table by mapping a key to a value, overwriting any existing mapping, and returning the extended table. The old table is untouched and still valid.

The Reference gives the performance claim twice, at two levels of precision, and the pair is more useful than either alone. Immutable hash tables support effectively constant-time access and update, just like mutable hash tables; the constant on immutable operations is usually larger, but the functional nature of immutable hash tables can pay off in certain algorithms. Then the honest version: immutable hash tables actually provide logarithmic access and update, and log N is bounded by the address space at under 30 or 62.

That is the argument for persistent structures stated as an engineer would state it. The logarithm is real, but its argument is bounded by how many distinct addresses the machine has, so the asymptotic gap against [[cs/dsa/hash-tables|a mutable hash table]] closes into a constant factor with a known ceiling of about 30 or 62 steps. Whether the factor is worth paying is then a question about the algorithm, not about the data structure.

Two further costs are documented and are easy to forget. For `equal?`-based hashing, the built-in hash functions on strings, pairs, lists, vectors, and prefab or transparent structures take time proportional to the size of the value. The hash code for a compound structure depends on hashing each item of the container, though the depth of that recursive hashing is limited to avoid problems with cyclic data. So a table keyed by long lists pays a per-operation cost proportional to key size on top of the logarithmic lookup, and that cost is invisible in the big-O statement.

The equality rules also carry a mutability clause: two hash tables cannot be `equal?` unless they have the same mutability, use the same key-comparison procedure, and hold keys the same way. Mutability is part of a table's identity, not an incidental attribute. Empty immutable hash tables are `eq?` when they are `equal?`, which is a small interning optimization that only a persistent representation can offer.

## When the trade is wrong

Persistent structures win when old versions have readers. Undo stacks, backtracking search, snapshot isolation, an environment threaded through [[cs/languages/Racket/structs-and-pattern-matching|a recursive traversal]], any structure handed to a thread that may outlive the caller's use of it. In every one of those cases, the alternative is a copy, and the copy is linear where the update is logarithmic.

Persistent structures lose on tight accumulation loops with a single owner, where the mutable version does one store and the immutable version allocates a path from root to leaf on every step. The Reference's own hedge, that the constant is usually larger, is aimed at exactly that case. Racket's answer to it is not to abandon immutability but to make the mutable version available under a different name, so choosing it is a deliberate, visible, local act rather than the ambient default. That is the same move as `mcons` versus `cons`, one layer up.

## Related Notes

- [[cs/dsa/linked-list|Linked Lists]] - the structure `cons` builds, and the tail sharing immutability makes safe
- [[cs/dsa/hash-tables|Hash Tables]] - the mutable baseline the persistent version is measured against
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis]] - the accounting that lets `list?` charge traversal to allocation
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]] - and why a bound the machine caps can be read as a constant
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - shared structure needs a collector, and this is why
- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching]] - immutable-by-default aggregates, and the traversals that thread them

## Sources

- "3.9 Pairs and Lists," The Racket Guide. https://docs.racket-lang.org/guide/pairs.html . Supports pairs being immutable contrary to Lisp tradition, `pair?` and `list?` recognizing only immutable pairs and lists, `mcons` creating a mutable pair with `set-mcar!` and `set-mcdr!`, and the distinct printed form for mutable pairs.
- "4.10 Pairs and Lists," The Racket Reference. https://docs.racket-lang.org/reference/pairs.html . Supports a pair combining exactly two values accessed by `car` and `cdr`, pairs not being mutable, the recursive definition of a list, `cons` returning a newly allocated pair, cyclic structures built from immutable pairs via `read` or `make-reader-graph` and such a pair not being a list, and `list?` taking effectively constant time due to internal caching with traversal charged to allocation.
- "4.15 Hash Tables," The Racket Reference. https://docs.racket-lang.org/reference/hashtables.html . Supports the definition of a hash table and its four key-equivalence choices, tables being mutable or immutable, the effectively-constant-time claim with a larger constant, the logarithmic access and update figure with the address-space bound of under 30 or 62, `hash-set` functionally extending a table, `equal?`-based hash functions taking time proportional to the size of the value, the limited depth of recursive hashing for cyclic data, the mutability and comparison requirements for two tables to be `equal?`, and empty immutable tables being `eq?` when `equal?`.
