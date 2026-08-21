---
title: "Bounded Type Parameters"
description: "How a bound turns an unusable type parameter into a callable one, why the leftmost bound decides the erasure, and the ordering rule that trips people on multiple bounds."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-16
updated:
aliases:
  - Java Bounded Types
  - Multiple Bounds
---

An unbounded type parameter is almost useless inside the method that declares it. You can move a `T` around, store it, and return it, and that is the whole list. Calling anything on it beyond the methods of `Object` is a [[cs/pl/type-systems-goals-guarantees|compile error]], because the compiler has no evidence any particular method exists. A bound is how you supply that evidence.

> [!note] The idea
> A bound is a promise made to the compiler at the declaration site and enforced at every call site, and it pays for itself twice. It restricts which type arguments are legal, which is the part everyone notices. It also determines what the type parameter erases to, which is the part that decides whether the generic body compiles to a virtual call or to a cast followed by a virtual call. `<T>` erases to `Object`; `<T extends Comparable<T>>` erases to `Comparable`. The bound is simultaneously the constraint on the caller and the static type the method body actually gets to use.

## The syntax means implements too

The declaration uses `extends` regardless of whether the bound is a class or an interface. The tutorial is explicit that the keyword "is used in a general sense to mean either `extends` (for classes) or `implements` (for interfaces)." So `<T extends Runnable>` accepts any type implementing `Runnable`, and there is no `<T implements Runnable>` form to reach for.

Inside the body, the bound is what you may call:

```java
public class NaturalNumber<T extends Integer> {
    private T n;

    public boolean isEven() {
        return n.intValue() % 2 == 0;
    }
}
```

`intValue()` is available because `T extends Integer`. Remove the bound and that line stops compiling, since `Object` has no `intValue`.

The same applies to a generic method, where the bound also filters arguments:

```java
public <U extends Number> void inspect(U u) {
    System.out.println("U: " + u.getClass().getName());
}
```

Passing a `String` is a compile error rather than a runtime surprise.

## Multiple bounds and the ordering rule

A parameter can carry several bounds joined by `&`:

```java
<T extends B1 & B2 & B3>
```

If one of them is a class, it must be listed first:

```java
class D <T extends A & B & C> { }  // fine when A is the class
class D <T extends B & A & C> { }  // compile-time error
```

The rule looks arbitrary until you connect it to [[cs/languages/Java/generics-and-type-erasure|erasure]]. The Java Language Specification defines the erasure of a type variable as the erasure of its leftmost bound. A type can extend at most one class, so if a class bound were allowed anywhere in the list, the leftmost bound might be an interface while the class bound sat behind it, and the erased type would be an interface that the class bound has to be cast to on every use. Forcing the class first makes the erasure the most informative type available.

That same specification sentence is the practical reason to think about bound ordering at all. `<T extends Serializable & Comparable<T>>` erases to `Serializable`, which supports nothing, so every call to `compareTo` in the body goes through a cast. Reversing the two, where the language allows it, erases to `Comparable` and the calls become [[cs/pl/objects-classes-and-dispatch|direct interface invocations]]. The ordering is a code-generation decision dressed as a syntax preference.

## Bounds versus wildcards

Bounds and wildcards are frequently confused because both use `extends`. They sit at different sites and answer different questions.

A bound is declaration-site: it constrains the type parameter for everyone, forever, and it is visible in the class or method's contract. A wildcard is use-site: it constrains one particular usage of an already-generic type, at the point where a variable or parameter is declared. `<T extends Number>` says this class only works for numbers. `List<? extends Number>` says this one list can be read as numbers and not written to. The full treatment is in [[cs/languages/Java/wildcards-and-the-get-put-principle|Wildcards and the Get-Put Principle]], and the theory both are instances of is in [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]].

> [!warning] A bound on the wrong side of the API
> Over-bounding is the more common mistake once people get comfortable with the syntax. A bound belongs on a type parameter when the implementation genuinely needs the capability. Adding `<T extends Serializable>` to a container that never serializes anything narrows every caller for no benefit, and removing it later is a source-compatible change only in the easy direction. Ask what the method body calls; that is the bound.

## Related Notes

- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - why the leftmost bound is the one that matters
- [[cs/languages/Java/wildcards-and-the-get-put-principle|Wildcards and the Get-Put Principle]] - the use-site counterpart to a declaration-site bound
- [[cs/languages/Java/recursive-generic-bounds-and-self-types|Recursive Generic Bounds and Self Types]] - what happens when a bound mentions its own parameter
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - the same idea where the bound also selects the implementation
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - bounded polymorphism as a general concept

## Sources

- "Bounded Type Parameters," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/bounded.html . Supports the `extends` keyword meaning either extends or implements, the `NaturalNumber<T extends Integer>` example with `intValue()`, the `<U extends Number> inspect(U u)` generic method example and its rejection of a `String` argument, the `<T extends B1 & B2 & B3>` multiple-bounds syntax, and the rule that a class bound must be specified first with the `class D <T extends B & A & C>` compile-time error.
- "Types, Values, and Variables," The Java Language Specification, Java SE 21, section 4.6 Type Erasure. https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html . Supports the definition of the erasure of a type variable as the erasure of its leftmost bound.
