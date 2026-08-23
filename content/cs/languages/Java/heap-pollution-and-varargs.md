---
title: "Heap Pollution and Varargs"
description: "Why a generic varargs parameter is the one construct erasure cannot make safe and cannot make illegal, and what you are actually promising when you write @SafeVarargs."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-11
updated:
aliases:
  - Java Heap Pollution
  - SafeVarargs
---

Most of what [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|erasure forbids]] it forbids outright. You cannot write `new T[10]`, you cannot write `new List<String>[2]`, you cannot ask `instanceof List<Integer>`. The compiler refuses and you go find another way. Generic varargs is the construct where that strategy runs out, because the array the compiler needs is one it creates for you, at a call site, in code you did not write.

> [!note] The idea
> A varargs parameter is syntax for an array. `T... elements` becomes `T[] elements`, and after erasure that array is an `Object[]`. So declaring a generic varargs method asks the compiler to create exactly the array the language elsewhere refuses to let you create. It cannot reject the declaration without breaking every method shaped like `Arrays.asList` or `Collections.addAll`, and it cannot prove the body safe, so it does the only remaining thing: it warns at the declaration, warns again at every call site, and offers you `@SafeVarargs` as a way to convert a warning the compiler cannot discharge into an assertion you sign for it.

## What heap pollution actually means

The tutorial's definition is worth taking literally. Heap pollution occurs when a variable of a parameterized type refers to an object that is not of that parameterized type. A `List<String>` variable pointing at a list that holds an `Integer` is a polluted heap. The variable's static type says one thing and the object on the heap is something else, and nothing at runtime can tell you so, because the type argument was erased before the class file was written.

The [[cs/languages/Java/generics-and-type-erasure|erasure]] language specification is stricter about how you get there. Pollution can only arise if the program performed some operation involving a raw type that would give rise to a compile-time unchecked warning, or if the program aliases an array variable of non-reifiable element type through an array variable of a supertype which is either raw or non-generic. Those are the only two doors. The first is the [[cs/languages/Java/raw-types-and-migration-compatibility|raw type]] door, and it is well marked: you get an unchecked warning walking through it. The second is the varargs door, and it is not marked at all.

That asymmetry is the whole subject. The tutorial states the contrapositive as a guarantee: if you ensure that your code compiles without warnings, then no heap pollution can occur. Which sounds like a clean deal until you notice that the varargs warning arrives at the method declaration, and the unsafe operation happens several lines later at a statement that draws no warning of its own.

## Why the varargs parameter degrades twice

When the compiler encounters a varargs method, it translates the varargs formal parameter into an array. That is the first step and it is purely syntactic: `T... elements` is `T[] elements`, and the call site is rewritten to allocate the array and fill it.

Now the two rules collide. The Java programming language does not permit the creation of arrays of parameterized types, which is the restriction that exists because arrays carry a runtime element type and generics do not. But the call site has to allocate something. So the second step happens: because of type erasure, the compiler converts the varargs formal parameter to `Object[] elements`. The array that gets allocated is real, its runtime element type is whatever survived erasure, and every guarantee about what its components hold now lives only in the compiler's static reasoning.

> [!example] The faulty method, line by line
> ```java
> public static void faultyMethod(List<String>... l) {
>     Object[] objectArray = l;        // Valid
>     objectArray[0] = Arrays.asList(42);
>     String s = l[0].get(0);          // ClassCastException thrown here
> }
> ```
> Line one is legal and draws nothing. The compiler has already generated a warning when it translated the varargs formal parameter, so the assignment itself passes in silence: `l` has type `List[]` after erasure, and `List[]` is a subtype of `Object[]`. The tutorial is explicit that the compiler does not generate an unchecked warning at this statement.
>
> Line two stores a `List` holding a single `Integer` into the first component. The array's runtime element type is `List`, the stored object is a `List`, so the JVM's array store check passes. There is nothing to detect. As the specification puts it, there is no way to detect this pollution in the presence of both a universal supertype and a non-reifiable type.
>
> Line three reads it back. `l[0].get(0)` has static type `String`, so the compiler inserted a cast, and at runtime the JVM throws a `ClassCastException` at that statement. The failure surfaces two lines and one erased type argument away from the operation that caused it.

## The warning, and where it lands

Compile the harmless-looking `addToList` method and you get:

```
warning: [varargs] Possible heap pollution from parameterized vararg type T
```

Note the word `Possible`. The compiler is not claiming your body is wrong. It is reporting a structural fact about the declaration: this method has an array it should not be able to have. A second warning is emitted on the other side. A compile-time unchecked warning will be given at any invocation of the method, because the static type system considers an invocation to create an array whose element type is non-reifiable. One declaration, warnings at every call site, none of which the caller can fix.

## What @SafeVarargs asserts

`@SafeVarargs` is a programmer assertion that the body of the annotated method or constructor does not perform potentially unsafe operations on its varargs parameter. Applying it suppresses unchecked warnings about a non-reifiable variable arity type and suppresses unchecked warnings about parameterized array creation at call sites. That second clause is the point of the annotation: it silences the callers, who have no other remedy.

Because it is [[cs/pl/type-soundness-progress-preservation|an assertion the compiler cannot check]], its placement is restricted. Beyond the `@Target` of constructors and methods, compilers are required to implement additional usage restrictions, and it is a compile-time error if the declaration is a fixed arity method or constructor, or if the declaration is a variable arity method that is neither `static` nor `final` nor `private`. The reason is [[cs/pl/objects-classes-and-dispatch|override]]: a method someone can override is a method whose body you have not seen, and you cannot assert safety on behalf of a subclass. The specification says the same thing from the other direction: only if the body was type-safe with respect to the variable arity parameter could the programmer use the annotation to silence warnings at invocations, and since `faultyMethod` causes heap pollution, it would be completely inappropriate to annotate it.

The annotation is not a proof, and the javadoc admits the gap: some unsafe operations do not trigger an unchecked warning, and it prints the aliasing example above under the comment `// Not actually safe!`. The compiler cannot stop you from signing a false statement. It notes only that future versions of the platform may mandate compiler errors for such unsafe operations.

## The weaker alternative

You can also write `@SuppressWarnings({"unchecked", "varargs"})`, which the tutorial describes as possible though less desirable. The reason it is worse is precise rather than stylistic: this approach does not suppress warnings generated from the method's call site. It quiets your own compilation unit and leaves every caller with an unchecked warning they cannot act on, since the fix lives in your method, not theirs.

> [!tip] The rule that falls out
> `@SafeVarargs` belongs on a method that only reads its varargs array and never lets a reference to it escape. The moment the array is assigned to a wider-typed variable, returned, or handed to another method, you have created the alias the specification names as one of the two doors into heap pollution, and the annotation stops describing your code.

## Related Notes

- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the mechanism that turns `T[]` into `Object[]`
- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the array restriction this construct routes around
- [[cs/languages/Java/raw-types-and-migration-compatibility|Raw Types and Migration Compatibility]] - the other door into heap pollution, the one that is well marked
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - why the runtime array store check cannot help here
- [[cs/languages/Java/unchecked-warnings-and-what-they-actually-mean|Unchecked Warnings and What They Actually Mean]] - what the compiler is and is not claiming when it warns

## Sources

- "Non-Reifiable Types," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/nonReifiableVarargsType.html . Supports the heap pollution definition, the compiles-without-warnings guarantee, the two-step translation of `T...` to `T[]` to `Object[]`, the `ArrayBuilder.faultyMethod` walkthrough and its `ClassCastException`, the exact varargs warning text, what `@SafeVarargs` asserts, and why `@SuppressWarnings({"unchecked","varargs"})` is the weaker option.
- `java.lang.SafeVarargs`, Java SE 21 API documentation. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/SafeVarargs.html . Supports the annotation's definition as a programmer assertion, the call-site suppression, the compile-time errors on fixed arity and on non-static non-final non-private variable arity declarations, and the note that some unsafe operations trigger no warning.
- The Java Language Specification, Java SE 21, section 4.12.2. https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html . Supports the formal statement of heap pollution, the two conditions under which it can occur, the undetectability argument about a universal supertype and a non-reifiable type, and the invocation-site warning rule.
