---
title: "The Class File and Classloading"
description: "Descriptors, the constant pool, and the delegation model: what the JVM actually reads, when it reads it, and why a class is identified by more than its name."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-27
updated:
aliases:
  - Java Class File Format
  - Class Loader Delegation
  - Method Descriptors
---

`javac` does not produce a program. It produces one file per class, each one a self-contained, mostly symbolic description of a type: its name, its supertype, its members, and a table of every name it needs from somewhere else. Nothing is resolved. The linking that a C toolchain does before the program starts, the JVM does while the program runs.

> [!note] The idea
> The class file is a symbolic artifact, not a linked one, and everything characteristic about Java follows from that. Cross-class references are stored as names and descriptors in a constant pool rather than as addresses, so the resolution step happens at runtime and can be deferred until the reference is actually used. That deferral is what makes classes replaceable and dynamically discoverable, and it is also why the identity of a loaded class is not its name. A class is fixed by its binary name paired with the loader that defined it, which turns the class loader from a file-reading utility into the unit of namespace isolation in the JVM.

## Descriptors, and what "same signature" means

Types in a class file are written as descriptors. The specification defines one as "a string representing the type of a field or method," and the encoding is dense: `I` for `int`, `D` for `double`, `Ljava/lang/Thread;` for a reference type, a leading `[` for each array dimension.

A method descriptor stitches those together. It "contains zero or more parameter descriptors, representing the types of parameters that the method takes, and a return descriptor, representing the type of the value (if any) that the method returns." The specification's own worked case is worth memorizing, because it shows the shape in one line. For the method `Object m(int i, double d, Thread t)`, the descriptor is `(IDLjava/lang/Thread;)Ljava/lang/Object;`.

Two things about that string matter more than they look. First, the return type is part of it, which is why the JVM's notion of a signature is finer than the Java language's overload resolution, and why covariant return types force the compiler to emit [[cs/languages/Java/bridge-methods|Bridge Methods]]. Second, there are no type arguments in it. A descriptor for `List<String>` is just `Ljava/util/List;`, which is erasure stated in the file format rather than in the language spec.

## The constant pool

Every symbolic reference in a class lives in one table. The constant pool is described as "a table of structures representing various string constants, class and interface names, field names, and other constants that are referred to within the ClassFile structure and its substructures," indexed from 1, with each entry's kind given by a leading tag byte.

Bytecode never names anything directly. An `invokevirtual` carries a two-byte index; the entry at that index names a class, a method name, and a descriptor. The whole file is written against this indirection, which is why so much of the runtime's behavior is a question about what the pool entry resolves to today rather than what the compiler saw. This is Java's answer to separate compilation, and the shape of the tradeoff is the general one in [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]]: compile against a symbol, resolve later, and accept that the thing you resolve to may have changed.

Recompile a library so a method's return type changes and the old caller's constant pool entry still names the old descriptor. Nothing fails at build time on the caller's side; it fails at first call, when resolution finds no method matching the descriptor. Binary compatibility in Java is, concretely, a question about descriptors in constant pools.

## Loading, linking, initializing

The specification splits what happens to a class into three phases. "Loading is the process of finding the binary representation of a class or interface type with a particular name and creating a class or interface from that binary representation." Linking "is the process of taking a class or interface and combining it into the run-time state of the Java Virtual Machine so that it can be executed," and it "involves verifying and preparing that class or interface, its direct superclass, its direct superinterfaces, and its element type." Initialization runs the static initializer.

Verification is the step that makes the rest safe. A class file is just bytes and may have been produced by something other than `javac`, so type confusion in the bytecode is caught before the code runs, not by the compiler that emitted it.

The timing is deliberately unspecified. "This specification allows an implementation flexibility as to when linking activities (and, because of recursion, loading) take place," subject to an ordering constraint: "a class or interface is completely loaded before it is linked." An implementation "may choose a lazy linkage strategy, where each symbolic reference in a class or interface is resolved individually when it is used," or an eager one that resolves everything at verification time. HotSpot is lazy, which is why a program can reference a class that is missing from the classpath and run fine until the branch that touches it. The economics are the same as [[cs/systems/virtual-memory|Virtual Memory]]: do the expensive per-item work on first touch, and never pay for the items nobody touches.

## Delegation

Loading is done by class loaders, and they are organized as a chain rather than a search path. The `ClassLoader` documentation states the rule directly. "The ClassLoader class uses a delegation model to search for classes and resources. Each instance of ClassLoader has an associated parent class loader. When requested to find a class or resource, a ClassLoader instance will usually delegate the search for the class or resource to its parent class loader before attempting to find the class or resource itself."

Parent first, not self first. The bootstrap loader at the root of the chain gets the first chance at every name, so a class file named `java/lang/String.class` sitting in an application jar is never consulted. The platform's own types cannot be shadowed by anything further down.

> [!warning] Parallel loading is a real constraint
> The documentation notes that class loaders supporting concurrent loading must register as parallel capable, and that "in environments in which the delegation model is not strictly hierarchical, class loaders need to be parallel capable, otherwise class loading can lead to deadlocks." Application servers and module frameworks that build non-hierarchical loader graphs are opting into that hazard on purpose.

## Identity is a pair

The consequence that catches people is stated in one sentence of the specification. "After creation, a class or interface is determined not by its name alone, but by a pair: its binary name and its defining loader."

Load the same bytes through two loaders and you get two distinct runtime classes. A cast between them throws, with an exception message that names the same fully qualified type on both sides.

The security payoff comes from the same rule applied to packages. "The run-time package of a class or interface is determined by the package name and the defining loader of the class or interface." Package-private access is scoped to the run-time package, so a hostile class that declares itself in package `com.example.internal` and is loaded by a different loader lands in a different run-time package and gets no access to the real one's package-private members. Namespace confinement is not a check bolted on top of the loader; it is a property of how loaded classes are named. That makes the loader graph the place to enforce boundaries, which is what loader-per-plugin designs exploit and a concrete instance of [[cs/security/sandboxing-and-isolation|Sandboxing and Isolation]].

## Related Notes

- [[cs/languages/Java/bridge-methods|Bridge Methods]] - what the compiler emits when two descriptors fail to line up
- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - the erasure that descriptors make visible
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - compiling against a symbol and resolving it later
- [[cs/systems/virtual-memory|Virtual Memory]] - the same deferral economics applied to pages instead of symbols
- [[cs/security/sandboxing-and-isolation|Sandboxing and Isolation]] - loader-scoped namespaces as an isolation boundary
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - where a bytecode format sits between the two

## Sources

- "The class File Format," The Java Virtual Machine Specification, Java SE 21 Edition, chapter 4. https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html . Supports the definition of a descriptor, the composition of a method descriptor from parameter and return descriptors, the worked descriptor for `Object m(int, double, Thread)`, and the description of the constant pool table.
- "Loading, Linking, and Initializing," The Java Virtual Machine Specification, Java SE 21 Edition, chapter 5. https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html . Supports the definitions of loading and linking, the implementation freedom over when linking happens, the lazy and eager linkage strategies, and the rule that a class is identified by its binary name paired with its defining loader.
- `java.lang.ClassLoader`, Java SE 21 API Specification. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html . Supports the parent-first delegation model and the deadlock hazard for non-hierarchical loader graphs.
