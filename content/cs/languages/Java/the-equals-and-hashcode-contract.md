---
title: "The equals and hashCode Contract"
description: "Two methods on Object, five clauses of specified behavior, and a structural conflict with inheritance that no amount of careful coding resolves."
draft: false
comments: true
tags:
  - cs
  - languages
  - data-structures
date: 2026-06-18
updated:
aliases:
  - Java equals hashCode
  - Object equals Contract
---

Every Java object inherits an `equals` and a `hashCode` that answer a narrow question: is this the same object in memory. Override either one and you are redefining what "same" means for a whole type, and the standard library has already been written against the answer.

> [!note] The idea
> The contract is not style advice. It is the precondition that makes constant-time lookup sound, and the two halves fail differently. `hashCode` picks a bucket, `equals` decides inside that bucket, so an object with a wrong hash is invisible to the collection no matter how correct its `equals` is, while an object with a wrong `equals` is found and misjudged. The deeper problem is that `equals` is required to be an equivalence relation, and inheritance cannot preserve one across an added field. Every attempt lands on breaking symmetry or breaking transitivity, which is why the modern answer is to make the component list fixed and the class final rather than to write a cleverer `equals`.

## The contract, as written

The `Object` javadoc states the `equals` requirement in the vocabulary of [[cs/math/relations-and-equivalence|Relations and Equivalence]]: "The equals method implements an equivalence relation on non-null object references." Five clauses follow.

Reflexive: "for any non-null reference value x, x.equals(x) should return true." Symmetric: "x.equals(y) should return true if and only if y.equals(x) returns true." Transitive: "if x.equals(y) returns true and y.equals(z) returns true, then x.equals(z) should return true." Consistent: repeated invocations "consistently return true or consistently return false, provided no information used in equals comparisons on the objects is modified." And a null clause: "for any non-null reference value x, x.equals(null) should return false."

The javadoc then draws the mathematical consequence out loud. "An equivalence relation partitions the elements it operates on into equivalence classes; all the members of an equivalence class are equal to each other." Defining `equals` is defining a partition of your type's value space, and everything downstream (deduplication, keying, caching) is that partition being used.

The default implementation is the finest partition available. `Object.equals` "implements the most discriminating possible equivalence relation on objects," so "under the reference equality equivalence relation, each equivalence class only has a single element."

The `hashCode` contract has three clauses and they are asymmetric on purpose. Within one execution the method "must consistently return the same integer, provided no information used in equals comparisons on the object is modified," though "this integer need not remain consistent from one execution of an application to another execution of the same application." The binding clause is the second: "If two objects are equal according to the equals method, then calling the hashCode method on each of the two objects must produce the same integer result." And the deliberate non-requirement is the third: "It is not required that if two objects are unequal according to the equals method, then calling the hashCode method on each of the two objects must produce distinct integer results."

That third clause is the whole difference between this hash and a cryptographic one. `hashCode` is permitted to collide freely and is under no obligation to make collisions hard to find, which is exactly the property [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] exist to provide. A hash for lookup and a hash for integrity are different tools with the same name.

## Why the collections need it

`hashCode` "is supported for the benefit of hash tables such as those provided by HashMap." The mechanism is in [[cs/dsa/hash-tables|Hash Tables]]: reduce the key to an integer, use it to select a bucket, then search only that bucket. `HashMap` "provides constant-time performance for the basic operations (get and put), assuming the hash function disperses the elements properly among the buckets."

Both halves of that sentence are load-bearing. The constant time is contingent on dispersal, and the javadoc says what happens without it: "using many keys with the same hashCode() is a sure way to slow down performance of any hash table." Modern `HashMap` mitigates rather than solves, since "when keys are Comparable, this class may use comparison order among keys to help break ties," converting a long chain into an ordered structure with logarithmic search. Deliberately colliding keys therefore degrade a lookup to logarithmic rather than linear, which is the difference between a slowdown and an outage.

The failure that a broken contract produces is stranger than slowness. Insert an object into a `HashSet`, then look it up with an equal object whose `hashCode` differs, and the lookup computes a different bucket and reports absence. The object is in the set. The set says it is not. No exception is thrown, because nothing detected anything: the table did exactly what it was asked.

`Set` inherits the same dependency through its own definition. A set is "a collection that contains no duplicate elements," formally one containing "no pair of elements e1 and e2 such that e1.equals(e2)." The uniqueness invariant is stated in terms of `equals`, so a wrong `equals` does not corrupt a set so much as redefine what set it is.

> [!warning] Mutation invalidates the placement, not the object
> The `Set` documentation is blunt: "great care must be exercised if mutable objects are used as set elements," and "the behavior of a Set is not specified if the value of an object is changed in a manner that affects equals comparisons while the object is an element in the set." Bucket assignment happens once, at insertion. Change a field that feeds `hashCode` afterward and the element sits in a bucket the table will never search for it again. The usual symptom is an element that survives iteration but fails `contains`.

## Where inheritance breaks it

Take a `Point` with `x` and `y`, and a subclass `ColorPoint` that adds a color. Write `ColorPoint.equals` to compare color as well, and symmetry dies: a `Point` compared against a `ColorPoint` with the same coordinates uses `Point.equals`, sees matching coordinates, and returns true, while the reverse comparison checks color and returns false. The specification says `x.equals(y)` must be true if and only if `y.equals(x)` is, and it is not.

Patch that by having `ColorPoint.equals` ignore color when the argument is a plain `Point`, and symmetry is restored at the cost of transitivity. Two `ColorPoint` instances of different colors are each equal to the same colorless `Point`, so transitivity demands they be equal to each other, and they are not.

The remaining move is `getClass()` equality instead of `instanceof`, which makes a subclass instance unequal to a superclass instance always. That satisfies all five clauses. It also means no subclass can ever be equal to a superclass instance, which breaks substitutability: a `HashSet<Point>` will not recognize a `ColorPoint` that a `Point`-typed API just handed it, even though every `Point` operation on it works.

None of these is a bug in the programmer's reasoning. No implementation adds a value-carrying field in a subclass and preserves an equivalence relation across the hierarchy, because the partition the superclass induces and the partition the subclass induces genuinely disagree about the same objects. The dispatch machinery underneath, and the reason the choice of comparison lands at runtime, is in [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]].

The practical resolutions all step outside inheritance. Favor composition: hold a `Point` as a field rather than extending it, and the two types are simply never compared. Or fix the component list and forbid extension, which is what a record does by generating `equals` and `hashCode` from its declared components and refusing to be subclassed. That is the argument developed in [[cs/languages/Java/records-sealed-types-and-pattern-matching|Records, Sealed Types, and Pattern Matching]], and it is the same conclusion the contract forces.

## Related Notes

- [[cs/dsa/hash-tables|Hash Tables]] - the bucket-then-compare structure the contract exists to serve
- [[cs/dsa/maps-and-hashtable|Maps & Hash Tables]] - collision handling and load factor as a cost model
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - reflexivity, symmetry, transitivity, and the partition they induce
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] - the collision guarantees hashCode explicitly does not make
- [[cs/languages/Java/records-sealed-types-and-pattern-matching|Records, Sealed Types, and Pattern Matching]] - fixing the component list so the equality question has one answer
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - why the comparison that runs depends on the runtime class

## Sources

- `java.lang.Object`, Java SE 21 API Specification. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html . Supports the five clauses of the equals contract, the equivalence-class consequence, the reference-equality default, and the three clauses of the hashCode contract including the explicit non-requirement of distinct hashes for unequal objects.
- `java.util.HashMap`, Java SE 21 API Specification. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html . Supports the constant-time claim conditioned on dispersal, the warning about many keys sharing a hash code, and the comparison-order tie-breaking mitigation.
- `java.util.Set`, Java SE 21 API Specification. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html . Supports the definition of a set in terms of equals and the unspecified behavior when a mutable element changes in a way affecting equals comparisons.
