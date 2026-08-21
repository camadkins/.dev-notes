---
title: "Records, Sealed Types, and Pattern Matching"
description: "What a record actually generates, what sealed promises the compiler, and why exhaustiveness is a maintenance tool rather than a convenience."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases:
  - Java Records
  - Sealed Classes in Java
  - Pattern Matching for switch
---

Three features landed in Java across four releases and they only make sense together. A record fixes a type's data. `sealed` fixes a hierarchy's membership. Pattern matching in `switch` consumes both, and the compiler can finally tell you when you have missed a case.

> [!note] The idea
> The payload is not the syntax, it is what exhaustiveness does to maintenance. A pattern `switch` over a sealed type turns "someone added a subtype" from a silent runtime fallthrough into a compile error at every site that reasons over the hierarchy. That guarantee is only available because `sealed` makes the set of alternatives finite and known, which is the condition the compiler needs to prove coverage. Records supply the other half, since a type whose state description is fixed and whose class is implicitly final has exactly one sensible answer to what its components are. The three features are one feature: closing a type so the compiler can reason about all of it.

## What a record generates

The JEP describes records as "classes that act as transparent carriers for immutable data," adding that they "can be thought of as nominal tuples." The transparency claim is what licenses the code generation.

A record declaration is a name plus a header, and "the header lists the components of the record class, which are the variables that make up its state." From `record Point(int x, int y) { }` the compiler derives a full API: for each component, "a public accessor method with the same name and return type as the component, and a private final field with the same type as the component"; then "a canonical constructor whose signature is the same as the header"; plus "equals and hashCode methods which ensure that two record values are equal if they are of the same type and contain equal component values," and "a toString method that returns a string representation of all the record components, along with their names." The principle is stated directly: "the header of a record class describes its state, i.e., the types and names of its components, and the api is derived mechanically and completely from that state description."

The restrictions are the interesting part. "A record class declaration does not have an extends clause. The superclass of a record class is always java.lang.Record," and "a record class is implicitly final, and cannot be abstract." The JEP says why: "these restrictions emphasize that the API of a record class is defined solely by its state description, and cannot be enhanced later by another class."

That is a structural answer to the problem in [[cs/languages/Java/the-equals-and-hashcode-contract|The equals and hashCode Contract]]. A hand-written `equals` cannot survive inheritance because a subclass may add state the superclass does not know about. A record forbids the subclass, so the generated `equals` compares the complete state and no later class can widen it. The equivalence relation is not carefully maintained; it is made unbreakable by removing the operation that breaks it.

## What sealed promises

"Sealed classes and interfaces restrict which other classes or interfaces may extend or implement them." The mechanism is a `permits` clause, which "specifies the classes that are permitted to extend the sealed class," as in `public abstract sealed class Shape permits Circle, Rectangle, Square`.

The restriction is not merely nominal. Permitted subclasses "must be located near the superclass: either in the same module (if the superclass is in a named module) or in the same package (if the superclass is in the unnamed module)," which stops a permitted name from being claimed by a class the author never saw.

The stated goals separate sealing from what it superficially resembles. It is meant to "allow the author of a class or interface to control which code is responsible for implementing it," and to "provide a more declarative way than access modifiers to restrict the use of a superclass." The JEP is explicit that it "is not a goal to change final in any way." Sealing controls extension, not visibility: a permitted subclass can be public and used by anyone, but it cannot gain a sibling.

The third goal connects the features: "support future directions in pattern matching by providing a foundation for the exhaustive analysis of patterns." Sealing was designed for the type checker, not for encapsulation.

Combine it with records and you have the classical construction, which the JEP names. "The combination of sealed classes and record classes is sometimes referred to as algebraic data types: record classes allow us to express product types, and sealed classes allow us to express sum types." That is the vocabulary of [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]], arriving in a language that spent two decades modelling variants as an abstract class with a `getKind()` method.

## What exhaustiveness buys

Pattern matching for `switch` "allows an expression to be tested against a number of patterns, each with a specific action." The type rules loosened to make that possible: the selector expression may now be "either an integral primitive type (excluding long) or any reference type," where before it had to be an integral type, its boxed form, `String`, or an enum.

The coverage rule is stated as a property to preserve rather than a restriction to obey. "A switch expression requires that all possible values of the selector expression be handled in the switch block; in other words, it must be exhaustive. This maintains the property that successful evaluation of a switch expression always yields a value." An expression that must produce a value cannot have an uncovered input, which is the same argument that makes a total function total.

For pattern switches the compiler proves this through type coverage, and sealing makes the proof possible. "If the type of the selector expression is a sealed class then the type coverage check can take into account the permits clause of the sealed class to determine whether a switch block is exhaustive." Given `sealed interface S permits A, B, C`, cases for `A`, `B`, and `C` are complete, and the JEP notes the payoff: "this can sometimes remove the need for a default clause, which as argued above is good practice."

> [!tip] The default clause is what you are giving up, and that is the point
> A `default` branch makes every switch trivially exhaustive, so the compiler stops checking. Add a fourth permitted subtype to `S` and every switch with a `default` keeps compiling and silently routes the new case to the fallback, while every switch without one fails to compile at exactly the sites that now need a decision. Exhaustiveness is a standing query, re-run at every build, asking which call sites depend on this hierarchy being closed.

A runtime backstop covers the case where the compile-time proof is invalidated later, such as a permitted subtype recompiled separately. "If no label in a pattern switch matches the value of the selector expression then the switch completes abruptly by throwing a MatchException, since pattern switches must be exhaustive."

## The tradeoff nobody names

Sealing plus pattern matching inverts the usual object-oriented extension axis. A virtual method lets you add a subtype without touching existing code, and makes adding an operation expensive because every subtype must implement it. A sealed hierarchy with pattern switches reverses both: a new operation is one more `switch`, and a new subtype breaks the build everywhere.

Java now supports both, so the choice is a design decision rather than a language constraint. Model an open-ended set of implementations, such as plugins, with an interface and dispatch, described in [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]]. Model a closed vocabulary, such as an expression tree or a protocol message, with a sealed hierarchy of records. The general form is in [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]]; the version in daily use for a decade is [[cs/languages/Rust/pattern-matching-and-enums|Pattern Matching and Enums in Rust]].

## Related Notes

- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the general form of products, sums, and matching over them
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]] - the theory the JEP names outright
- [[cs/languages/Java/the-equals-and-hashcode-contract|The equals and hashCode Contract]] - the inheritance problem a record removes by construction
- [[cs/languages/Rust/pattern-matching-and-enums|Pattern Matching and Enums in Rust]] - the same closure discipline in a language built around it
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the extension axis a sealed hierarchy trades away
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - where the permitted-subclasses list is recorded for the compiler and the JVM to read

## Sources

- "JEP 395: Records," OpenJDK. https://openjdk.org/jeps/395 . Supports records as transparent carriers for immutable data and nominal tuples, the header as the state description, the full list of automatically acquired members, the derivation of the API from the state description, and the restrictions that a record has no extends clause and is implicitly final.
- "JEP 409: Sealed Classes," OpenJDK. https://openjdk.org/jeps/409 . Supports the definition of sealing, the permits clause and its module or package locality requirement, the stated goals including exhaustive analysis of patterns, the non-goal of changing final, and the naming of records plus sealed classes as algebraic data types with product and sum types.
- "JEP 441: Pattern Matching for switch," OpenJDK. https://openjdk.org/jeps/441 . Supports the extension of switch to patterns, the widened selector expression types, the exhaustiveness requirement and its justification, the use of a sealed type's permits clause in the coverage check, and the MatchException thrown when no label matches.
