---
title: "Covariant Arrays vs Invariant Generics"
description: "Java arrays are covariant and pay for it with a runtime store check on every write; generics refused the same trade, because erasure leaves no check to make."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-29
updated:
aliases:
  - ArrayStoreException
  - Array Covariance in Java
---

Java ships two container-shaped abstractions with opposite [[cs/pl/subtyping-variance-type-constraints|subtyping rules]]. An `Integer[]` is usable anywhere a `Number[]` is expected. A `List<Integer>` is not usable anywhere a `List<Number>` is expected. Both containers hold references, both support reads and writes, and both were designed by the same people. The difference is not taste. It is a record of what each design could afford to check when the program actually ran.

> [!note] The idea
> Array covariance is unsound, and Java knew it in 1995. The language shipped it anyway and bought the soundness back with a runtime check: every store into an array is verified against the array's actual element type, and a bad store throws `ArrayStoreException`. Generics arrived in 2004 into a world where that purchase was no longer available. Erasure strips the type argument before the class file is written, so a generic container has nothing to compare a store against. With no check to make, invariance stopped being a stylistic preference and became the only sound option left. The two decisions are the same decision under different budgets: put the hole behind a runtime check when you can afford one, and behind a compile error when you cannot.

## Arrays are covariant, and the JVM watches every store

The subtyping rule is direct. If `S` is a subtype of `T`, then `S[]` is a subtype of `T[]`. `ColoredPoint[]` flows into a `Point[]` variable with no cast and no warning.

That rule is broken on its face. Once the array is reachable through the wider static type, the compiler will happily approve a store that the array cannot actually hold. Java's answer is to move the check to run time. For an array whose type is `A[]` where `A` is a reference type, "an assignment to a component of the array is checked at run time to ensure that the value being assigned is assignable to the component." When the value fails that test, "an `ArrayStoreException` is thrown." The javadoc says the same thing in one line: it is "thrown to indicate that an attempt has been made to store the wrong type of object into an array of objects."

The exception is unchecked. `ArrayStoreException` extends `RuntimeException`, so no signature declares it and no `catch` is required. The language's position is that this is a bug, not a condition, and the check exists to convert silent memory corruption into a loud failure at the moment of the bad write.

> [!example] The spec's own demonstration
> ```java
> class Point { int x, y; }
> class ColoredPoint extends Point { int color; }
> class Test {
>     public static void main(String[] args) {
>         ColoredPoint[] cpa = new ColoredPoint[10];
>         Point[] pa = cpa;
>         System.out.println(pa[1] == null);
>         try {
>             pa[0] = new Point();
>         } catch (ArrayStoreException e) {
>             System.out.println(e);
>         }
>     }
> }
> ```
> The output is `true` then `java.lang.ArrayStoreException: Point`. Reading is fine, because "every `ColoredPoint` can stand in for a `Point`." Writing is where the two types diverge, and the JVM catches it on the write.

The cost is that the check is per store, not per method or per array. Every `aastore` on a reference array carries a type comparison, which the [[cs/pl/compilation-vs-interpretation|JIT]] can often hoist or elide once it proves the array's exact type, but which is real work in the general case. The larger cost is where the error surfaces. The store that throws is frequently far from the assignment that widened the array, so the stack trace names the victim rather than the culprit.

## Generics are invariant, and there is no check to move

Generic containers are invariant. `Box<Integer>` is not a subtype of `Box<Number>` "even though `Integer` is a subtype of `Number`," and the tutorial states the rule in full generality: two parameterizations of the same generic class have no subtype relationship "regardless of whether or not `A` and `B` are related." Ordinary inheritance still works along the other axis, since "so long as you do not vary the type argument, the subtyping relationship is preserved between the types," which is why `ArrayList<String>` is a `List<String>`.

The tempting reading is that invariance is the type theory catching up: mutable containers really are invariant, arrays were the mistake, and generics fixed it. That reading is half right and misses the engineering half. Java could have shipped covariant generics with a store check, exactly as it shipped covariant arrays. It could not, because [[cs/languages/Java/generics-and-type-erasure|erasure]] deletes the type argument. At run time a `Box<Integer>` and a `Box<Number>` are one class holding one `Object` field. There is no element type recorded anywhere for a store check to consult. Arrays got a runtime escape hatch because [[cs/dsa/arrays|an array object]] carries its component type; generics got none, so the hole had to be closed at compile time or left open forever. Java closed it, and made you say which half of the container you want with [[cs/languages/Java/wildcards-and-the-get-put-principle|wildcards]] instead.

## Where the two rules collide

The collision point is generic array creation, and the spec is unusually explicit about the causality. "If the component type of an array were not reifiable, the Java Virtual Machine could not perform the store check described in the preceding paragraph. This is why an array creation expression with a non-reifiable element type is forbidden."

Read that as a chain rather than a rule. The array's soundness depends on a store check. The store check depends on the runtime knowing the component type. A [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|non-reifiable]] component type such as `List<String>` erases to plain `List`, so the check would pass on a store of a `List<Integer>` and the array's one safety mechanism would return a false negative. Java's response was to remove the array rather than let the check quietly become decorative. `new List<String>[2]` does not compile.

The language stops short of banning the type. You may declare a variable of an array type whose element type is non-reifiable, but "assignment of the result of an array creation expression to the variable will necessarily cause an unchecked warning." That is the honest shape of the compromise: the type exists, the value cannot be safely created, and the warning is the compiler saying it has stopped guaranteeing anything past this line. The `@SafeVarargs` machinery and the [[cs/languages/Java/heap-pollution-and-varargs|heap pollution]] rules all live downstream of that gap.

## What the pair actually teaches

Two soundness holes, two placements. Arrays put the hole behind a runtime check, which buys expressiveness and pays in per-operation cost, deferred failure, and a stack trace that points at the wrong line. Generics put it behind a compile error, which buys early detection and pays in ceremony, since you now write `? extends` and `? super` at every site where covariance would have been implicit.

The choice between the two is rarely about which is more correct. It is about whether the runtime retains enough information to make the check at all. Arrays kept their element type, so a check was purchasable. Erasure spent that information for [[cs/languages/Java/raw-types-and-migration-compatibility|migration compatibility]], and once it was spent the compile error was the only remaining way to keep the type system honest. Every restriction that surprises people about Java generics traces back to a bill that was paid somewhere else.

## Related Notes

- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the full restriction list this note supplies the array half of
- [[cs/languages/Java/wildcards-and-the-get-put-principle|Wildcards and the Get-Put Principle]] - what you write instead of covariance
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - covariance, contravariance, and invariance as general type theory
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the mechanism that removed the check
- [[cs/languages/Java/heap-pollution-and-varargs|Heap Pollution and Varargs]] - the hole the compile error does not fully close

## Sources

- "Chapter 10. Arrays," The Java Language Specification, Java SE 21. https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html . Supports the per-store runtime check in 10.5, the `ArrayStoreException` throw condition, the `Point`/`ColoredPoint` example and its output, the reifiability argument for forbidding array creation with a non-reifiable element type, and the unchecked warning left available to a declared variable.
- "ArrayStoreException," Java SE 21 API documentation. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ArrayStoreException.html . Supports the one-line definition of the exception and its `RuntimeException` superclass.
- "Generics, Inheritance, and Subtypes," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/inheritance.html . Supports the invariance of parameterized types, the statement that two parameterizations are unrelated regardless of their type arguments, and the preservation of subtyping when the type argument is held fixed.
