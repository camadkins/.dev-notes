---
title: "The Diamond and Target Typing"
description: "How an empty pair of angle brackets removes a whole class of redundancy, what a target type is, and why Java 8 made a syntax convenience into a real inference feature."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-04
updated:
aliases: []
---

`Map<String, List<String>> myMap = new HashMap<String, List<String>>();` writes the same type twice. The second one carries no information the first did not already fix. The diamond operator deletes it.

> [!note] The idea
> The diamond is inference running backwards. Ordinary generic-method inference reads the arguments and works out the type parameter. Target typing reads the type the surrounding context requires and works out the type parameter from that instead. Java 8 generalized the mechanism from assignment contexts to method-argument contexts, and the practical effect was much larger than a syntax cleanup: expressions whose type depends entirely on where they are used, including every lambda, became inferable. The diamond is the first and simplest instance of a rule that the rest of modern Java leans on heavily.

## The construct

```java
Map<String, List<String>> myMap = new HashMap<>();
```

The empty type-argument list is the diamond. The compiler takes the type arguments from the declared type of the variable and applies them to the constructor.

Leaving the brackets off entirely is a different thing and worse:

```java
Map<String, List<String>> myMap = new HashMap();  // unchecked conversion warning
```

That is a [[cs/languages/Java/raw-types-and-migration-compatibility|raw type]] assigned to a parameterized variable, which is an unchecked conversion. The diamond is checked and the raw form is not, so the two-character difference is the difference between [[cs/pl/type-systems-goals-guarantees|a guarantee]] and a warning.

## Target type, precisely

The tutorial defines the target type as "the data type that the Java compiler expects depending on where the expression appears." An assignment's target type is the declared type of the variable. A method argument's target type is the declared type of the parameter. A return statement's target type is the method's return type.

The reach of that definition changed in Java 8. Before it, target typing applied in assignments but not to method arguments, which produced the well-known asymmetry around `Collections.emptyList()`:

```java
static <T> List<T> emptyList();

List<String> listOne = Collections.emptyList();   // fine in Java 7: assignment context
processStringList(Collections.emptyList());       // Java 7: does not compile
processStringList(Collections.<String>emptyList()); // Java 7: explicit witness required
```

In Java 8 and later the second line compiles, because the parameter's declared type `List<String>` is now a target type [[cs/pl/hindleymilner-type-inference|the inference algorithm]] may use. This is the single change that retired the explicit type witness from most codebases.

## Why this matters past the syntax

The interesting consequence is not shorter constructor calls. It is that an expression can now be typed by its context rather than by its contents, which is the precondition for lambdas.

A lambda like `s -> s.length()` has no type of its own. It is not an object of some function type in the way a closure is in [[cs/languages/Rust/closures-fn-fnmut-fnonce|Rust]] or a first-class value in [[cs/languages/Racket/index|Racket]]. It is a syntactic form whose meaning is supplied by the functional interface it is being assigned to, so `Function<String, Integer>` and a custom `StringMeasurer` both accept the same lambda text and produce different types. That only works if the compiler is willing to type an expression from its target, which is exactly what target typing generalized in Java 8.

Read that way, the diamond and the lambda are the same feature at two levels of ambition, and the diamond is the one where the machinery is visible enough to understand.

> [!warning] The diamond did not work everywhere
> An anonymous class with a diamond was a compile error in Java 7, and the stated reason names the class file rather than the language: "the inferred type using diamond with an anonymous class constructor could be outside of the set of types supported by the signature attribute in class files." Inference can produce non-denotable types, meaning compiler-internal types that cannot be written in a Java program, and the class file has nowhere to put them. Java 9 lifted the restriction with a condition attached: "as long as the inferred type is denotable, you can use the diamond operator when you create an anonymous inner class." When a diamond is still rejected there, spelling the type argument out is what the compiler is asking for.

## Related Notes

- [[cs/languages/Java/generic-methods-and-type-inference|Generic Methods and Type Inference]] - inference from arguments, the other direction
- [[cs/languages/Java/raw-types-and-migration-compatibility|Raw Types and Migration Compatibility]] - what leaving off the diamond actually means
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - why the constructor's type arguments have no runtime effect anyway
- [[cs/pl/hindleymilner-type-inference|Hindley–Milner & Type Inference]] - inference that does not need a target type
- [[cs/languages/TypeScript/contextual-typing-and-inference|Contextual Typing and Inference]] - the same context-supplies-the-type idea in a structural system

## Sources

- "Type Inference," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/genTypeInference.html . Supports the definition of target type as the data type the compiler expects depending on where the expression appears, the diamond example with `Map<String, List<String>>` and `new HashMap<>()`, the unchecked conversion warning on `new HashMap()`, the statement that Java SE 8 expanded target typing to include method arguments, and the `Collections.emptyList()` example including the Java 7 explicit type witness and the Java 8 behavior.
- "Generic Methods," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/methods.html . Supports that a generic method's type parameter list appears before the return type and its scope is limited to the method, which is what the explicit witness syntax is naming.
- "Java Platform, Standard Edition Java Language Updates, Release 9," Oracle. https://docs.oracle.com/javase/9/language/toc.htm . Supports the Java SE 7 restriction and its class-file signature-attribute reason, the definitions of denotable and non-denotable types, and the quoted Java SE 9 rule permitting the diamond with an anonymous inner class when the inferred type is denotable.
