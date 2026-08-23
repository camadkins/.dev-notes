---
title: Java
description: Landing page for Java. The erasure pole of the section's generics comparison, and the twenty years of engineering that one decision forced.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-08-21
updated:
aliases: []
---

Java added generics in 2004 under a constraint that decided everything else: the class file format could not change, and code compiled before generics had to keep running beside code compiled after. The answer was erasure. The compiler checks the type arguments and then discards them, so no new classes are created for parameterized types. Almost every restriction in this folder traces back to that one sentence, and the restrictions stop looking arbitrary the moment you follow the trace.

Java is one pole of this section's comparison. The other poles are C# reification, Go stenciling, and TypeScript erasure by construction, and the comparison itself lives in [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]]. Theory stays in [[cs/pl/index|Programming Language Concepts]]; these notes are Java engineering.

### What erasure is, and why it was chosen

Start here. The rest of the folder is consequence.

- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - what the compiler actually does to a generic class, and why Java took this bargain
- [[cs/languages/Java/raw-types-and-migration-compatibility|Raw Types and Migration Compatibility]] - a hole deliberately left in a static type system so existing code would keep compiling
- [[cs/languages/Java/reifiable-types-and-what-erasure-forbids|Reifiable Types and What Erasure Forbids]] - seven restrictions, each traced to the type argument that is not there at runtime

### What the compiler has to do to make it work

Erasure moves work from the runtime to the compiler, and these three notes are that work.

- [[cs/languages/Java/bridge-methods|Bridge Methods]] - the synthetic method written when erasure breaks an override, and where it becomes visible
- [[cs/languages/Java/generic-methods-and-type-inference|Generic Methods and Type Inference]] - how a method declares its own type parameters, and what inference is allowed to look at
- [[cs/languages/Java/the-diamond-and-target-typing|The Diamond and Target Typing]] - an empty pair of angle brackets, and the target type that turned a convenience into an inference feature

### Saying what a type parameter must be

An unbounded parameter can do almost nothing. Bounds and wildcards are how you buy capability back.

- [[cs/languages/Java/bounded-type-parameters|Bounded Type Parameters]] - the bound that makes a parameter callable, and why the leftmost one decides the erasure
- [[cs/languages/Java/wildcards-and-the-get-put-principle|Wildcards and the Get-Put Principle]] - use-site variance, and the single rule that picks the wildcard for you
- [[cs/languages/Java/recursive-generic-bounds-and-self-types|Recursive Generic Bounds and Self Types]] - why `Comparable` appears as a bound on its own parameter, and the self type it can only imitate

### Where it leaks

Four places the missing runtime type argument shows through, and what the language offers instead.

- [[cs/languages/Java/heap-pollution-and-varargs|Heap Pollution and Varargs]] - the one construct erasure can neither make safe nor make illegal
- [[cs/languages/Java/unchecked-warnings-and-what-they-actually-mean|Unchecked Warnings and What They Actually Mean]] - the compiler recording the exact point it stopped being able to prove type safety
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - arrays pay at runtime for the variance generics refused to take
- [[cs/languages/Java/type-tokens-and-super-type-tokens|Type Tokens and Super Type Tokens]] - passing the erased type back in as an ordinary value

### The rest of the language

The ground a Java folder needs regardless of generics, ordered from the substrate upward.

- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - descriptors, the constant pool, and why a class is identified by more than its name
- [[cs/languages/Java/checked-and-unchecked-exceptions|Checked and Unchecked Exceptions]] - failure in the type system, two hierarchies exempted, and the argument that never ended
- [[cs/languages/Java/the-equals-and-hashcode-contract|The equals and hashCode Contract]] - five clauses of specified behavior and a structural conflict with inheritance
- [[cs/languages/Java/records-sealed-types-and-pattern-matching|Records, Sealed Types, and Pattern Matching]] - what a record generates, and exhaustiveness as a maintenance tool
- [[cs/languages/Java/default-methods-and-interface-evolution|Default Methods and Interface Evolution]] - adding methods to `Collection` without breaking every implementor
- [[cs/languages/Java/streams-and-the-collector-abstraction|Streams and the Collector Abstraction]] - laziness, the spliterator, and why `Collector` is the extension point that matters
- [[cs/languages/Java/the-module-system|The Module System]] - strong encapsulation at package granularity, and a decade of ecosystem breakage
- [[cs/languages/Java/the-java-memory-model-and-happens-before|The Java Memory Model and Happens-Before]] - a partial order rather than a timeline, and what `volatile` actually buys
- [[cs/languages/Java/virtual-threads-and-structured-concurrency|Virtual Threads and Structured Concurrency]] - mounting, pinning, and what becomes possible once a thread is disposable
- [[cs/languages/Java/hotspot-garbage-collectors|HotSpot Garbage Collectors]] - G1 regions and a pause-time model against ZGC colored pointers and load barriers

### Read from the comparative layer

- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - where Java's answer sits against the other four
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - the counterpole, where the restriction list simply is not a list
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - tracing collection as Java's answer
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - where Java puts the data-race problem

---

*Any pages placed under this folder are auto-listed below by Quartz.*
