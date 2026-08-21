---
title: "Raw Types and Migration Compatibility"
description: "Why a language with a static type system deliberately kept a hole in it, what an unchecked warning is actually telling you, and how the migration argument shaped Java generics."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-02
updated:
aliases:
  - Java Raw Types
  - Unchecked Conversion
---

A raw type is a generic class or interface used without type arguments. `Box` is the raw type of `Box<T>`. The language accepts it, the compiler warns about it, and every style guide says avoid it. The interesting question is why a feature everyone agrees is bad was designed in on purpose.

> [!note] The idea
> Raw types are a migration mechanism wearing the costume of a type. Generics arrived in Java 5 into an ecosystem where the standard collections and an enormous body of third-party code were not generic, and the design constraint was that a generified library and a non-generic caller had to keep compiling and linking against each other in both directions. Raw types are the seam that makes that work: they let non-generic code call generified APIs unchanged, and they let generified code accept values from non-generic sources. The type hole is not an oversight. It is the price of not forking the ecosystem, and the unchecked warning is the compiler marking exactly where the guarantee was suspended so a human can adjudicate it.

## The two directions of assignment

Assigning a parameterized type to a raw type is fine and silent:

```java
Box<String> stringBox = new Box<>();
Box rawBox = stringBox;  // OK
```

Nothing was lost that the compiler was relying on. You gave up information voluntarily and the resulting variable is treated as pre-generics: "a `Box` gives you `Object`s."

The other direction is where the warning lives:

```java
Box rawBox = new Box();
Box<Integer> intBox = rawBox;  // warning: unchecked conversion
```

There is nothing in `rawBox` that says it holds `Integer`. The compiler cannot prove the assignment safe, and rather than reject it (which would break migration) it accepts it and records that it accepted it. Invoking a generic method through a raw reference warns for the same reason:

```java
rawBox.set(8);  // warning: unchecked invocation to set(T)
```

## What "unchecked" means precisely

The default compile prints a summary and nothing else:

```
Note: Example.java uses unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
```

`-Xlint:unchecked` prints the real message:

```
WarningDemo.java:4: warning: [unchecked] unchecked conversion
found   : Box
required: Box<java.lang.Integer>
```

Read "unchecked" literally. It does not mean "probably fine" and it does not mean "wrong." It means the compiler has performed no check here and is telling you that the static guarantee for this expression is your responsibility. The consequence is deferred, not cancelled: the cast erasure inserted at some later call site is still there, so a violated assumption surfaces as a `ClassCastException` at a line that contains no visible cast, in a method that did nothing wrong.

`-Xlint:-unchecked` turns the warnings off entirely, and `@SuppressWarnings("unchecked")` turns them off for one declaration. The annotation is the honest one, because it is local, reviewable, and can carry a comment explaining the proof the compiler could not do.

## Why this shape and not another

Two alternatives were available and both were rejected by the migration constraint.

Reject raw types outright, and every non-generic caller of a generified library breaks on the day the library adds type parameters. Since the standard collections were being generified in the same release, that means all existing Java code breaks at once.

Reify the type arguments, and the class file format changes, which means the same break in a different place plus a new one at the JVM boundary. [[cs/languages/CSharp/reified-generics-in-the-clr|C# took that path]] and its documentation advertises the result as the distinguishing feature, describing its generics as similar to Java's but "with full runtime type information and no type erasure." That is the same feature list Java's designers wanted and the same one the compatibility requirement priced out of reach.

Java bought source and binary compatibility in both directions and paid with a type system that has a documented, warned-about hole. [[cs/languages/Java/generics-and-type-erasure|Erasure]] is the implementation of that decision and raw types are its user-visible seam.

> [!warning] A raw type is not the same as a wildcard
> `Box` and `Box<?>` are often confused and behave differently in the way that matters. `Box<?>` is fully type-checked: you can read from it as `Object` and you cannot write to it, so the compiler enforces safety by restricting the operations. `Box` disables checking: you can call anything and the compiler will let you, with a warning. When you genuinely do not care about the type argument, `Box<?>` is what you meant, and it costs nothing.

## Where you still meet raw types

Reflection returns them. `Class.getMethod` and friends hand back objects whose generic signatures you have to reconstruct, which is why the type-token pattern in [[cs/languages/Java/type-tokens-and-super-type-tokens|Type Tokens and Super Type Tokens]] exists. Older libraries still expose them. And the varargs case in [[cs/languages/Java/heap-pollution-and-varargs|Heap Pollution and Varargs]] produces the same category of warning from a construct that looks entirely modern, which is a good reminder that "unchecked" is about the proof obligation rather than about legacy code.

## Related Notes

- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the implementation choice raw types exist to serve
- [[cs/languages/Java/unchecked-warnings-and-what-they-actually-mean|Unchecked Warnings and What They Actually Mean]] - the full catalogue of unchecked operations
- [[cs/languages/Java/wildcards-and-the-get-put-principle|Wildcards and the Get-Put Principle]] - what to write when you genuinely do not care about the type argument
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the alternative Java's compatibility constraint ruled out
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what a soundness hole costs a type system

## Sources

- "Raw Types," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/rawTypes.html . Supports the definition of a raw type, that raw types exist for backward compatibility with legacy code written before JDK 5.0, that many API classes including the Collections classes were not generic prior to JDK 5.0, that a raw type gives you `Object`s, the legality of assigning a parameterized type to a raw type, the unchecked conversion warning on the reverse assignment, the unchecked invocation warning on `rawBox.set(8)`, the exact default and `-Xlint:unchecked` warning text, and the `-Xlint:-unchecked` and `@SuppressWarnings("unchecked")` controls.
- "Type Erasure," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/erasure.html . Supports that the compiler inserts casts to preserve type safety, which is the mechanism by which a violated unchecked assumption surfaces later as a `ClassCastException`.
- "Restrictions on Generics," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html . Supports that `instanceof` requires a reifiable type and that the unbounded wildcard form is the checked alternative.
- "Generic types and methods," Microsoft Learn (C# fundamentals). https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/generics . Supports the quoted description of C# generics as similar to Java generics or C++ templates but with full runtime type information and no type erasure.
