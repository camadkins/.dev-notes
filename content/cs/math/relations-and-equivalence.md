---
title: Relations and Equivalence
description: "Binary relations, the reflexive/symmetric/transitive properties, equivalence relations and their classes, and partial orders."
draft: false
comments: true
tags:
  - cs
  - math
date: 2026-05-09
updated:
aliases:
  - equivalence-relations
  - partial-orders
---

## Relating Things Is Just a Set of Pairs

"Is less than," "has the same remainder as," [[cs/pl/subtyping-variance-type-constraints|"is a subtype of,"]] "points to." Each of these connects elements of one collection to elements of another, and each is, formally, nothing more than a set of ordered pairs. A binary relation "associates some elements of one set called the domain with some elements of another set (possibly the same) called the codomain." Once a relation is just a set, its useful behavior comes from which structural properties that set happens to satisfy.

> [!note]
> The payload: three yes/no properties, reflexivity, symmetry, and transitivity, generate the two relations that organize most of computer science. Keep symmetry and you get an equivalence relation, which slices a set into disjoint buckets. Drop symmetry for antisymmetry and you get a partial order, which arranges a set by precedence without demanding every pair be comparable. Sameness and ordering are the same primitive with one property flipped.

## The Three Properties

For a relation $R$ on a set $A$:

- **Reflexive**: every element relates to itself, $a\,R\,a$ for all $a$.
- **Symmetric**: whenever $a\,R\,b$, also $b\,R\,a$.
- **Transitive**: whenever $a\,R\,b$ and $b\,R\,c$, also $a\,R\,c$.
- **Antisymmetric**: if $a\,R\,b$ and $b\,R\,a$ then $a = b$ (the direction can only close on equal elements).

"Equals" has all of reflexive, symmetric, transitive. "Less than or equal to" is reflexive, antisymmetric, transitive. "Is the parent of" has none of them. The properties a relation carries decide what you can build from it.

## Equivalence Relations

An equivalence relation "is a binary relation that is reflexive, symmetric, and transitive." Its payoff is structural: it induces a "partition of the underlying set into disjoint equivalence classes." Every element lands in exactly one class, and two elements share a class precisely when the relation holds between them. The relation and the partition are two views of one object.

Congruence modulo $m$ from [[cs/math/number-theory-and-modular-arithmetic|modular arithmetic]] is the canonical example: it partitions the integers into $m$ residue classes. In code, the [[cs/dsa/disjoint-set|union-find structure]] is an equivalence relation made incremental, maintaining the current classes under merges so that "are these two in the same group?" is answered in near-constant time. Deduplication, connected components, and [[cs/pl/hindleymilner-type-inference|type unification]] all reduce to computing an equivalence relation's classes.

## Partial Orders

Replace symmetry with antisymmetry and you get a partial order: "a homogeneous binary relation that is reflexive, antisymmetric, and transitive." The word *partial* is the interesting part, because in a partial order "not every pair of elements needs to be comparable; that is, there may be pairs for which neither element precedes the other." Subset inclusion orders sets, divisibility orders integers, and dependency orders build targets, yet in each case many pairs are simply unrelated.

That incomparability is exactly what [[cs/dsa/topological-sorting|topological sort]] resolves: it embeds a partial order into a total order, producing one linear sequence consistent with every required precedence while inventing an order for the pairs the partial order left free. A build system, a course prerequisite chain, and a spreadsheet's recalculation order are all this move.

> [!example]
> **Divisibility on $\{1, 2, 3, 6\}$.** Let $a \preceq b$ mean $a \mid b$.
> It is reflexive ($a \mid a$), antisymmetric (if $a \mid b$ and $b \mid a$ then $a = b$ for positives), and transitive, so it is a partial order.
> $2$ and $3$ are incomparable: neither divides the other. A topological sort turns the order into a line such as $1, 2, 3, 6$, choosing a placement for $2$ versus $3$ that the divisibility order never fixed.

> [!warning]
> A relation is not a [[cs/math/functions-injective-surjective-bijective|function]] unless every domain element relates to exactly one codomain element. Functions are the special case of relations with that single-output constraint; general relations allow zero, one, or many partners per element, which is why "many-to-many" database tables are relations and not functions.

## Related Notes

- [[cs/math/functions-injective-surjective-bijective|Functions: Injective, Surjective, Bijective]] - a function is a relation with a uniqueness constraint on outputs
- [[cs/math/set-theory-basics|Set Theory Basics]] - a relation is a subset of a Cartesian product; equivalence classes partition a set
- [[cs/math/number-theory-and-modular-arithmetic|Number Theory and Modular Arithmetic]] - congruence mod m as the canonical equivalence relation
- [[cs/dsa/disjoint-set|Disjoint Set]] - union-find maintains equivalence classes incrementally
- [[cs/dsa/topological-sorting|Topological Sorting]] - linearizing a partial order into a consistent total order

## Sources

- [Binary relation (Wikipedia)](https://en.wikipedia.org/wiki/Binary_relation) - a relation as an association of domain elements with codomain elements.
- [Equivalence relation (Wikipedia)](https://en.wikipedia.org/wiki/Equivalence_relation) - the reflexive/symmetric/transitive definition and the partition into disjoint equivalence classes.
- [Partially ordered set (Wikipedia)](https://en.wikipedia.org/wiki/Partially_ordered_set) - the reflexive/antisymmetric/transitive definition and the existence of incomparable pairs.
