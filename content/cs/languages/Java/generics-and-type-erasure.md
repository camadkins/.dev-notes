---
title: "Generics and Type Erasure in Java"
description: "What the compiler actually does to a generic class, why Java chose erasure over a runtime representation, and which of the language's odd restrictions fall out of that one decision."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-14
updated:
aliases: []
---

Java generics look like a [[cs/pl/type-systems-goals-guarantees|type-system feature]] and behave like a compiler feature. `List<String>` and `List<Integer>` are different types to `javac` and the same class to the JVM. Everything strange about generics in this language, and there is a lot of it, comes from that gap. This note is the mechanism. The restrictions it produces get their own notes.

> [!note] The idea
> Erasure is what you implement when you are not allowed to change the runtime. Generics arrived in Java 5, fourteen years into a language with an enormous deployed base of pre-generic code and a class file format everything already depended on. The chosen implementation compiles generic source into ordinary non-generic bytecode: type parameters are replaced with their bounds, casts are inserted where the erased code needs them, and the type arguments are gone before the program runs. The tutorial states the payoff directly, that erasure "ensures that no new classes are created for parameterized types; consequently, generics incur no runtime overhead." The price is that no generic type argument exists at runtime to be inspected, stored, or dispatched on, and every limitation in this folder is the shape of that absence.

## What the compiler does

The tutorial lists three transformations. First, it replaces "all type parameters in generic types with their bounds or `Object` if the type parameters are unbounded." An unbounded `class Box<T>` erases to a class holding an `Object`. A bounded `class Box<T extends Comparable<T>>` erases to a class holding a `Comparable`, because the bound is the most specific type the compiler can prove every instantiation satisfies.

Second, it inserts "type casts if necessary to preserve type safety." The casts land at the call sites, not in the generic class. When you call `box.get()` on a `Box<String>`, the method returns `Object` after erasure and the compiler emits a checkcast to `String` on your side of the call. The cast is real, it is in the bytecode, and it is the reason a corrupted generic collection throws `ClassCastException` at a line that contains no visible cast.

Third, it generates bridge methods "to preserve polymorphism in extended generic types." That is a large enough problem to need its own explanation, in [[cs/languages/Java/bridge-methods|Bridge Methods]].

The result is that "the produced bytecode contains only ordinary classes, interfaces, and methods." A class file compiled from generic source is loadable by, and callable from, code that has never heard of generics.

## Bounds are where the erasure goes

The single most useful mental model is that the erasure of a type parameter is its bound. This explains behavior that otherwise looks arbitrary.

An unbounded `<T>` erases to `Object`, so a generic method that only moves values around compiles to a method over `Object` and needs no casts internally. Add `<T extends Comparable<T>>` and the erasure becomes `Comparable`, so a call to `compareTo` inside the generic body [[cs/pl/objects-classes-and-dispatch|dispatches]] through the `Comparable` interface with no cast at all. Bounds are not only a constraint on the caller. They are the compiler's only way to keep a method call inside a generic body from becoming a cast on the receiver.

Multiple bounds follow the same rule with one wrinkle worth remembering. The specification defines the erasure of a type variable as the erasure of its leftmost bound, so the first bound listed is the one that survives. `<T extends Serializable & Comparable<T>>` erases to `Serializable`, which is almost never the useful one, so the ordering of bounds is a performance and readability decision rather than a stylistic one.

## What is gone at runtime

After erasure a parameterized type has no type argument to consult. That single fact generates the list in [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]]: you cannot write `new T()`, you cannot declare a `static` field of type `T`, you cannot ask `list instanceof ArrayList<Integer>`, you cannot allocate a `List<Integer>[]`, and you cannot overload two methods whose parameters erase to the same raw type.

The last one is the most instructive, because it is a pure compiler-level consequence with no runtime component. Two methods `print(Set<String>)` and `print(Set<Integer>)` both erase to `print(Set)`, and the class file has no way to hold both. The error message names a duplicate method, which is confusing until you remember you are being told about the erased signatures rather than the ones you wrote.

## The comparison this sets up

Erasure is a choice, not a law. The same problem admits at least three other answers, and the section covers each of them: [[cs/languages/CSharp/reified-generics-in-the-clr|C# reifies type arguments in the runtime]], [[cs/languages/Rust/traits-and-generic-bounds|Rust monomorphizes to one copy per instantiation]], and [[cs/languages/Go/generics-implementation-gc-shape-stenciling|Go compiles a copy per memory shape and passes a dictionary for the rest]]. The tradeoff read across all of them is in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]].

The argument for erasure is the one the raw-types page makes: pre-JDK 5.0 code, "many API classes (such as the Collections classes) were not generic prior to JDK 5.0," and all of it had to keep working. Reification would have meant a new class file format and [[cs/software-engineering/semantic-versioning|a hard break]]. Java bought a smooth migration and paid for it with a type system that stops at the compiler's edge.

> [!warning] Erasure is not the same as "generics are only documentation"
> A common overcorrection. Generic type information does survive in the class file, in signature attributes used by reflection and by the compiler when it reads a library. `Method.getGenericReturnType()` can tell you a method returns `List<String>`. What does not survive is the type argument of a particular *object*: an instance of `ArrayList` carries no record of having been created as `ArrayList<String>`. Declarations keep their generic signatures; values do not.

## Related Notes

- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the full list of restrictions and the reason given for each
- [[cs/languages/Java/bridge-methods|Bridge Methods]] - the synthetic methods erasure forces the compiler to generate
- [[cs/languages/Java/raw-types-and-migration-compatibility|Raw Types and Migration Compatibility]] - the backward-compatibility story erasure was chosen to serve
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the same tradeoff across languages
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]] - the theory Java generics implement
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - the monomorphizing counterpoint

## Sources

- "Type Erasure," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/erasure.html . Supports the three compiler transformations (replace type parameters with bounds or `Object`, insert casts, generate bridge methods), the claim that no new classes are created for parameterized types and generics incur no runtime overhead, and that the produced bytecode contains only ordinary classes, interfaces, and methods.
- "Raw Types," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/rawTypes.html . Supports that raw types exist for backward compatibility with legacy code written before JDK 5.0 and that many API classes including the Collections classes were not generic prior to JDK 5.0.
- "Non-Reifiable Types," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/nonReifiableVarargsType.html . Supports that type erasure converts a varargs `T...` parameter to `T[]` and then to `Object[]`.
- "Types, Values, and Variables," The Java Language Specification, Java SE 21, section 4.6 Type Erasure. https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html . Supports the formal erasure mapping: the erasure of `G<T1,...,Tn>` is `|G|`, the erasure of `T[]` is `|T|[]`, the erasure of a type variable is the erasure of its leftmost bound, the erasure of every other type is itself, and the erasure of a method signature keeps the name and erases the formal parameter types.
- "Restrictions on Generics," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html . Supports the specific restrictions cited here: no `new T()`, no static field of a type parameter, no `instanceof` with a parameterized type, no arrays of parameterized types, and no overload whose formal parameters erase to the same raw type, including the `print(Set<String>)` and `print(Set<Integer>)` example.
