---
title: "Reifiable Types and What Erasure Forbids"
description: "The seven restrictions Java generics carry, each traced to the missing runtime type argument that causes it, and the workaround the language offers in its place."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-21
updated:
aliases:
  - Java Generic Restrictions
  - Non-Reifiable Types
---

A reifiable type is one whose type information is fully available at runtime. `String` is reifiable. `String[]` is reifiable. `List<String>` is not, because [[cs/languages/Java/generics-and-type-erasure|erasure]] removed the type argument before the class file was written. Every restriction below is the compiler refusing to write code whose safety depends on information that will not exist when the code runs.

> [!note] The idea
> The restriction list looks like seven unrelated rules and is really one rule applied seven times. A JVM operation that needs to know a type at runtime cannot be applied to a type argument, because the type argument is a compile-time fiction. Allocation needs a class. Array stores need an element type. `instanceof` needs a class. A `catch` clause needs a class. Static fields need one type shared across all instantiations, and instantiations do not exist as separate entities. Read the list this way and it stops being trivia to memorize and becomes a single prediction you can make about any new generic construct you are considering.

## Primitives are not type arguments

`Pair<int, char> p = new Pair<>(8, 'a')` does not compile. Only reference types can be type arguments, so you write `Pair<Integer, Character>` and accept the boxing.

This is downstream of erasure in a specific way. The erased class holds an `Object` field, and an `int` is not an `Object`, so there is nothing for the field to hold without a wrapper. A reifying runtime can specialize the class per primitive, which is what [[cs/languages/CSharp/reified-generics-in-the-clr|C# does]] and why `List<int>` there stores unboxed integers. The cost of Java's answer is an allocation per element and a pointer chase per read, which is a real difference on a numeric workload and the motivation for the long-running work on value types.

## You cannot instantiate a type parameter

```java
public static <E> void append(List<E> list) {
    E elem = new E();  // compile-time error
}
```

`new` compiles to a bytecode instruction naming a class. After erasure there is no class named `E`. The sanctioned workaround passes the class explicitly and uses reflection:

```java
public static <E> void append(List<E> list, Class<E> cls) throws Exception {
    E elem = cls.newInstance();   // OK
    list.add(elem);
}
```

That `Class<E>` parameter is the seed of the type-token pattern, which is developed in [[cs/languages/Java/type-tokens-and-super-type-tokens|Type Tokens and Super Type Tokens]]. The general move is to reintroduce, as an ordinary runtime value, exactly the type information erasure dropped.

## You cannot declare a static field of a type parameter

```java
public class MobileDevice<T> {
    private static T os;  // compile-time error
}
```

The tutorial's reasoning is the clearest statement of what a parameterized type is at runtime. A static field is shared across all instances of the class. Create a `MobileDevice<Smartphone>`, a `MobileDevice<Pager>`, and a `MobileDevice<TabletPC>`, and the question "what is the actual type of `os`" has three answers and one storage location. There is one class, so there is one static field, so it cannot have a per-instantiation type.

## You cannot cast to or test a parameterized type

```java
if (list instanceof ArrayList<Integer>) {  // compile-time error
```

`instanceof` requires a reifiable type. The check compiles to a runtime class comparison and there is no runtime distinction between an `ArrayList<Integer>` and an `ArrayList<String>`. The unbounded wildcard form is legal precisely because it asks a question the runtime can answer:

```java
if (list instanceof ArrayList<?>) {  // OK
```

Casts follow the same rule from the other direction. `(List<Number>) li` on a `List<Integer>` is an error, while `(ArrayList<String>) l1` on a `List<String>` is allowed, because in the second case the compiler can already prove the type argument matches and only the class is in question.

## You cannot create an array of a parameterized type

```java
List<Integer>[] arrayOfLists = new List<Integer>[2];  // compile-time error
```

The reason is the most interesting one in the list, because it is about an existing runtime check rather than a missing one. Arrays are covariant and self-checking: every store into an array is verified against the array's actual element type, and a bad store throws `ArrayStoreException`. That check is what makes covariant arrays tolerable, and it is explored in [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]].

The tutorial's example shows what would happen if generic arrays were allowed:

```java
Object[] stringLists = new List<String>[2];  // pretend this compiles
stringLists[0] = new ArrayList<String>();    // OK
stringLists[1] = new ArrayList<Integer>();   // should throw ArrayStoreException,
                                             // but the runtime cannot detect it
```

The array's element type erases to `List`, both stores are `List` instances, and the runtime check passes on a store that violates the declared type. Java's response was to forbid the array rather than let its one runtime type check silently become unsound.

## You cannot create, catch, or throw a parameterized throwable

A generic class cannot extend `Throwable`, directly or indirectly, and a `catch` clause cannot name a type parameter:

```java
class MathException<T> extends Exception { }      // compile-time error
class QueueFullException<T> extends Throwable { } // compile-time error

catch (T e) { }                                   // compile-time error
```

Exception dispatch is a runtime class match against the handler table in the class file, so a handler for `T` is a handler for nothing in particular. The `throws` clause is the exception to the exception: `public void parse(File file) throws T` is legal, because a `throws` clause is a compile-time declaration that nothing at runtime consults.

## You cannot overload on erased-identical signatures

```java
public void print(Set<String> strSet) { }
public void print(Set<Integer> intSet) { }  // compile-time error
```

Both erase to `print(Set)` and a class file cannot hold two methods with the same name and descriptor. This one has no runtime component at all. It is the class file format telling you what it can represent.

> [!tip] The predictive form
> Before writing any generic construct, ask what the JVM would have to know at runtime for it to be safe. If the answer includes a type argument, the construct is either forbidden or unchecked. That single question replaces the memorized list, and it also tells you which workaround applies: pass the type as a `Class` value, widen to an unbounded wildcard, or accept an unchecked cast and document why it is safe.

## Related Notes

- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the mechanism every restriction here derives from
- [[cs/languages/Java/type-tokens-and-super-type-tokens|Type Tokens and Super Type Tokens]] - passing the erased type back in as a value
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - why the array rule is about soundness rather than convenience
- [[cs/languages/Java/heap-pollution-and-varargs|Heap Pollution and Varargs]] - the hole erasure leaves open where the compiler cannot refuse
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the same seven questions on a runtime that keeps the type arguments
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what a type system is promising when it refuses a program

## Sources

- "Restrictions on Generics," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html . Supports all seven restrictions and their stated reasons, including the `Pair<int, char>` error, the `new E()` error and the `Class<E>` reflection workaround, the `MobileDevice<T>` static field example and the three-instantiation argument, the `instanceof ArrayList<Integer>` error and the `ArrayList<?>` workaround, the `List<Integer>[]` error with the `stringLists` `ArrayStoreException` walkthrough, the `MathException`/`QueueFullException`/`catch (T e)` errors with the legal `throws T` exception, and the `print(Set<String>)` / `print(Set<Integer>)` overload error.
- "Type Erasure," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/erasure.html . Supports the claim that type parameters are replaced with their bounds or `Object` and that the produced bytecode contains only ordinary classes, interfaces, and methods.
