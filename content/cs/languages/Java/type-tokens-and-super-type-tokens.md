---
title: "Type Tokens and Super Type Tokens"
description: "Passing the erased type back in as a value, why Class<T> is the canonical token, and the anonymous-subclass trick that recovers a full parameterized type from the class file."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-22
updated:
aliases: []
---

Erasure deletes type arguments from the compiled program, so a method that needs to know its own `T` at runtime has to be told. The standard answer is to add a parameter whose value carries the type: the caller writes `String.class`, the method receives it, and the type that the compiler threw away comes back in through the front door as ordinary data.

> [!note] The idea
> A type token converts type information from the channel erasure deletes into the channel erasure cannot touch. Static type arguments live in the compile-time channel and are gone by the time bytecode runs. Values live in the data channel and survive untouched. `Class<T>` is the canonical token because its own type parameter ties the value to the static type, so the compiler can check the correspondence that the runtime will later depend on. The trick worth remembering is that erasure is not total: a class declaration's generic supertype is written into the class file as a `Signature` attribute, so declaring a class is itself a way to record a parameterized type where reflection can read it back. A super type token exploits exactly that, using an empty anonymous subclass as a smuggling container.

## Why a token is needed at all

The Java Tutorials' restriction list is blunt. "You cannot create an instance of a type parameter," and the failing example is the obvious one, `E elem = new E();` inside a generic method. There is no class named `E` at runtime, so there is nothing for `new` to allocate.

The tutorial's own workaround is the type token in its purest form. "As a workaround, you can create an object of a type parameter through reflection," and the fixed method takes an extra argument, `public static <E> void append(List<E> list, Class<E> cls)`, whose body calls `cls.newInstance()`. The call site becomes `append(ls, String.class)`. Nothing about erasure changed. The method stopped relying on information erasure removes and started relying on an argument the caller supplies.

The pattern generalizes past instantiation to any operation that needs a runtime type: a deserializer deciding what to build, a container checking what it stores, a lookup keyed by type. The theory of why a parametrically polymorphic function cannot see its own type argument is in [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]]; erasure makes Java's version of that ignorance total at runtime rather than merely conventional.

## Why `Class<T>` and not something homemade

You could pass a string, or an enum, or your own `TypeId` object. `Class<T>` wins for a reason the API documentation states in one line. The type parameter of `Class` is documented as "the type of the class modeled by this Class object. For example, the type of String.class is Class String."

That is the whole trick. The token's static type and the type it denotes are linked by the compiler, so a method declared to take `Class<E>` and return `E` cannot be handed `Integer.class` when `E` is `String`. The token is more than data the method trusts; it is data the compiler already checked.

The runtime half of the link is `Class.cast`. The javadoc describes it as a method that "casts an object to the class or interface represented by this Class object," returning "the object after casting, or null if obj is null," and throwing `ClassCastException` "if the object is not null and is not assignable to the type T." Its signature is `T cast(Object obj)`, so the narrowing is a real runtime check that yields a statically typed result rather than an unchecked cast erasure would compile away. A container keyed on a `Class<T>` and reading back through `Class.cast` is genuinely type safe at runtime, which no amount of `(T)` casting can claim. That is why [[cs/languages/Java/unchecked-warnings-and-what-they-actually-mean|Unchecked Warnings and What They Actually Mean]] treats a `Class.cast` call as the fix rather than the problem.

## What a token cannot carry

Here the pattern hits its wall. There is no way to write `List<String>.class`. Class literals denote classes, and after erasure `List<String>` and `List<Integer>` are the same class, so `List.class` is the only literal available. A `Class<T>` token can name a class; it cannot name a parameterized type, because no class file records one as a runtime identity. The same wall stops `instanceof` and array creation, catalogued in [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]]. So a deserializer told to produce a `List<String>` cannot be told with a `Class` object at all.

## The anonymous subclass trick

The recovery route runs through the class file format. The JVM specification says a `Signature` attribute "stores a signature for a class, interface, constructor, method, field, or record component whose declaration in the Java programming language uses type variables or parameterized types." Erasure removes type arguments from executable code; it does not remove this attribute. The generic form of a declaration survives in metadata precisely so that reflection and separate compilation can see it.

A class declaration is therefore a place where a parameterized type can be written down permanently. `class StringList extends ArrayList<String> {}` compiles to a class file whose `Signature` attribute records `ArrayList<String>` as the supertype, complete with its argument.

Reflection reads it back. `Class.getGenericSuperclass` "returns the Type representing the direct superclass" of the class, and the javadoc adds the guarantee the trick depends on: "If the superclass is a parameterized type, the Type object returned must accurately reflect the actual type arguments used in the source code." The return type is `Type`, not `Class`, and the object that comes back for a parameterized supertype is a `ParameterizedType` whose actual type arguments can be walked.

Put those together and you get the super type token. Declare an abstract generic holder, subclass it anonymously at the use site with the type argument you want, and have the holder's constructor call `getClass().getGenericSuperclass()` on itself. The anonymous subclass carries no members and exists for no reason except to have a generic supertype, and that supertype is the payload.

> [!example] What the file actually holds
> `new TypeHolder<Map<String, List<Integer>>>() {}` compiles to an anonymous class, say `Caller$1`, with `TypeHolder` as its erased superclass and a `Signature` attribute recording the full parameterization. At construction the holder reflects on itself, gets a `ParameterizedType` for `TypeHolder<Map<String, List<Integer>>>`, and pulls out the actual type argument. The nesting survives, because the attribute stores a signature and not an erased descriptor. This is the mechanism behind the `TypeReference` classes in the major JSON libraries.

> [!warning] The braces are load-bearing
> Drop the trailing `{}` and there is no subclass, no new class file, no `Signature` attribute. The construct also fails for a type argument that is itself a type variable, since the enclosing method's `T` is not known where the anonymous class is declared. The token records what was written at the declaration site, not what the caller had in mind.

## The cost of moving types into data

Once a runtime type is a value, it can come from anywhere, including a network. A deserializer that resolves types from its own input has let the attacker choose the token, and the type system offers no protection, because from the compiler's view a `Class` object is just an object. That is the mechanism side of [[cs/security/insecure-deserialization|Insecure Deserialization]], and the allowlist advice there is really advice about which tokens a program will honor. The general lesson, in [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]], is that a guarantee moved from the static phase to the dynamic phase becomes a runtime check somebody has to actually write.

## Related Notes

- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the restriction list a token is working around
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - where the Signature attribute lives and who reads it
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]] - why a generic function cannot see its own type argument
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - what happens when the token is attacker-supplied
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the comparison where languages that keep types at runtime need no token at all

## Sources

- "Restrictions on Generics," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html . Supports that an instance of a type parameter cannot be created, and the reflection workaround that takes a `Class<E>` parameter and calls `newInstance`.
- `java.lang.Class`, Java SE 21 API Specification. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html . Supports the documented meaning of the `T` parameter and the `String.class` example, the behavior and exception contract of `cast`, and the `getGenericSuperclass` guarantee about accurately reflecting actual type arguments.
- "The Signature Attribute," The Java Virtual Machine Specification, Java SE 21 Edition, section 4.7.9. https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html . Supports that a class file stores a signature for a declaration that uses type variables or parameterized types.
