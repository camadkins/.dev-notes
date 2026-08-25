---
title: "Wildcards and the Get-Put Principle"
description: "Why generic types are invariant, what an upper or lower bounded wildcard buys back, and the one rule that tells you which to write without thinking about variance at all."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-23
updated:
aliases:
  - PECS
---

`List<Integer>` is not a `List<Number>`. That surprises everyone once, because an `Integer` is a `Number` and the containers feel like they should follow. They do not follow, and the wildcard is the language's way of letting you opt back into the flexibility you gave up, one usage at a time, in whichever direction is actually safe.

> [!note] The idea
> Generic types are invariant because a mutable container supports both reading and writing, and those two operations want opposite subtyping rules. Reading wants covariance: a producer of `Integer` is a fine producer of `Number`. Writing wants contravariance: a consumer of `Number` is a fine consumer of `Integer`. A type that does both can safely have neither, so Java makes you say which half of the container you intend to use at each site. `? extends` is the read half, `? super` is the write half, and the whole apparatus collapses into one question: at this parameter, am I getting values out or putting values in?

## The two forms

An upper bounded wildcard names a supertype and accepts everything below it:

```java
void process(List<? extends Number> src)
```

This accepts `List<Integer>`, `List<Double>`, `List<Number>`. You can read `Number` out of it. You cannot add anything to it except `null`, and the tutorial gives the reason with the compile error attached:

```java
List<EvenNumber> le = new ArrayList<>();
List<? extends NaturalNumber> ln = le;
ln.add(new NaturalNumber(35));  // compile-time error
```

The compiler does not know which subtype the list really holds, so it cannot certify any particular value as legal to store.

A lower bounded wildcard names a subtype and accepts everything above it:

```java
public static void addNumbers(List<? super Integer> list) {
    for (int i = 1; i <= 10; i++) {
        list.add(i);
    }
}
```

`List<? super Integer>` matches any list whose element type is a supertype of `Integer`, so `List<Integer>`, `List<Number>`, and `List<Object>` all qualify. Writing `Integer` into any of them is safe, because each of them holds something at least as general. Reading gives you `Object`, since that is the only guarantee that survives.

A wildcard takes one bound or the other. The tutorial is explicit: "You can specify an upper bound for a wildcard, or you can specify a lower bound, but you cannot specify both."

## The rule that replaces the reasoning

Oracle's guidelines frame it as in-variables and out-variables. An "in" variable "serves up data to the code," like `src` in `copy(src, dest)`. An "out" variable "holds data for use elsewhere," like `dest`. Then:

- An "in" variable is defined with an upper bounded wildcard, using `extends`.
- An "out" variable is defined with a lower bounded wildcard, using `super`.
- When the "in" variable is only accessed through `Object` methods, use an unbounded wildcard.
- When the code needs the variable as both "in" and "out", do not use a wildcard.

The community states the same rule more tersely as the Get and Put Principle: "Use an extends wildcard when you only get values out of a structure. Use a super wildcard when you only put values into a structure. And don't use a wildcard when you both get and put." Both formulations say the same thing, and the value of having a name for it is that you stop deriving variance from first principles at every signature.

The last clause is the one people skip. A parameter that is genuinely read and written should be plainly `List<T>`. Reaching for a wildcard there produces a signature that compiles and then refuses every useful call.

## Do not put a wildcard on a return type

The guidelines carry a separate instruction that reads like style advice and is really about [[cs/software-engineering/coupling-and-cohesion|blast radius]]: "Using a wildcard as a return type should be avoided because it forces programmers using the code to deal with wildcards."

A wildcard in a parameter is a widening. It costs the caller nothing and lets more code call you. A wildcard in a return type is a narrowing pushed onto every caller, all of whom now hold a value of an unknown type and have to introduce their own wildcards or captures to work with it. Wildcards belong on the way in.

> [!example] Why `copy` needs both
> The canonical signature is `<T> void copy(List<? extends T> src, List<? super T> dest)`. Read it against the rule and it writes itself: `src` is pure "in", so `extends`; `dest` is pure "out", so `super`; `T` is the method's own type parameter tying the two together. Every relaxation is at exactly the place where the operation is one-directional, which is what makes the signature accept a `copy(List<Integer>, List<Object>)` call that the naive `copy(List<T>, List<T>)` would reject.

## Where wildcards are not the answer

A wildcard is use-site variance: the caller's declaration decides the direction. Other languages put the decision at the declaration site instead, where the library author marks the type parameter once and every use inherits it. [[cs/languages/CSharp/variance-in-and-out|C# does this with `in` and `out`]], and the tradeoff is the usual one, less flexibility at each use in exchange for far less syntax and no wildcard capture. The general theory of both is in [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]].

Wildcards are also not raw types, which is a confusion worth killing early. `List<?>` is checked and restricted; `List` is unchecked and permissive. See [[cs/languages/Java/raw-types-and-migration-compatibility|Raw Types and Migration Compatibility]].

## Related Notes

- [[cs/languages/Java/bounded-type-parameters|Bounded Type Parameters]] - the declaration-site constraint a wildcard complements
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - what invariance is protecting against
- [[cs/languages/Java/raw-types-and-migration-compatibility|Raw Types and Migration Compatibility]] - the unchecked alternative to an unbounded wildcard
- [[cs/languages/CSharp/variance-in-and-out|Variance with in and out]] - declaration-site variance for comparison
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - covariance and contravariance as general concepts

## Sources

- "Guidelines for Wildcard Use," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html . Supports the in-variable and out-variable definitions with the `copy(src, dest)` example, the four guidelines (extends for in, super for out, unbounded for Object-only access, no wildcard for both), the instruction to avoid wildcards as return types with its stated reason, and the `List<? extends NaturalNumber>` add error example.
- "Lower Bounded Wildcards," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/lowerBounded.html . Supports the `<? super A>` syntax, that `List<? super Integer>` matches `List<Integer>`, `List<Number>`, and `List<Object>`, the `addNumbers` example, and the rule that a wildcard may have an upper bound or a lower bound but not both.
- "Restrictions on Generics," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html . Supports that `instanceof` requires a reifiable type, which is why the unbounded wildcard form `ArrayList<?>` is the legal one.
- "Java Generics with extends and super Wildcards and the Get and Put Principle," CodeJava. https://www.codejava.net/java-core/collections/generics-with-extends-and-super-wildcards-and-the-get-and-put-principle . Supports the quoted three-clause statement of the Get and Put Principle.
