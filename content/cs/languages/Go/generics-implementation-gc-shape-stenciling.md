---
title: "Generics Implementation: GC Shape Stenciling"
description: "Go compiles one copy of a generic function per garbage-collection shape rather than one per type, quantizing types by the three properties the allocator already tracks."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-07-22
updated:
aliases: []
---

Every implementation of generics answers one question: how many copies of the machine code are there? A copy per type argument gives optimal code and a compiler that repeats itself endlessly. One copy treating every type argument as an opaque pointer gives a small binary and an indirection on every operation. C++ and Rust take the first road, Java the second, and the FAQ describes Go's position as a choice the compiler is free to make: "The compiler can choose whether to compile each instantiation separately or whether to compile similar instantiations as a single implementation."

What the compiler actually does is neither.

> [!note] The idea
> Go quantizes types before it stencils them. Instead of one instantiation per type argument or one for all of them, it emits one per *GC shape*, where a shape is the type as the memory system sees it. The design document defines it in a sentence: "The GC shape of a type means how that type appears to the allocator / garbage collector. It is determined by its size, its required alignment, and which parts of the type contain a pointer." Two types with the same shape can run the same machine code, because everything the code generator needs to know about a value, how much to copy, where to put it, and which words the collector must scan, is identical. The parts that still differ are looked up in a side table. The insight is that the compiler already had this classification lying around, built for a completely different purpose.

## Why the collector gets to decide

The choice of size, alignment, and pointer positions is not arbitrary. Those three facts are what a Go binary already knows about every value, because the collector walks stacks and heap objects and must know which words are pointers. That metadata exists whether or not you write a generic function, which is what makes it free to reuse.

The payoff shows up in the stack frame. In a pure dictionary implementation, where one body serves every type, the frame layout depends on the type arguments and has to be computed at run time. Under shape stenciling it does not: "Because we are stenciling for each GC shape, the layout of the stack frame, including where all the pointers are, is determined." Frames are constant sized, pointer maps are computable at compile time, and the runtime keeps the [[cs/pl/garbage-collection-concepts|precise collection]] it had before generics existed. This is the same reasoning an [[cs/systems/memory-allocators-and-fragmentation|allocator]] uses when it bins requests into size classes, applied to code generation instead of to memory.

## How coarse the grouping is

Much less coarse than the name suggests. The Go 1.18 implementation document gives the rule as a biconditional, which makes it a genuine [[cs/math/relations-and-equivalence|equivalence relation]] on types: "Two concrete types are in the same gcshape grouping if and only if they have the same underlying type or they are both pointer types."

So every pointer type in your program shares one shape, which is where most of the code saving comes from, and everything else groups by underlying type. `int` and `float64` are the same size and contain no pointers, and they are still different shapes. The reason is stated as a deliberate design constraint: "We are intentionally defining gcshapes such that we don't ever need to include any operator methods" in a dictionary. If `int` and `float64` shared a body, that body could not emit an add instruction, because integer and floating-point addition are different instructions. It would have to call through a function pointer supplied by the caller, which is exactly the slow path the design is avoiding.

The document follows the same logic down to sizes that do match: "Even `int16` and `int32` have distinct operations (notably left and right shift), so we don't put them in the same gcshape." And one more separation is enforced on top: "we also always want an interface type to be in a different gcshape from a non-interface type," because calling a method on an interface value is a different operation from calling one on a concrete value, even when the two have identical memory layout.

The partition ends up fine enough that the code emitted for a shape is the code you would have written for any one member of it. The document names the artefact: "We refer to an instantiation of a generic function or method for a specific set of shape type arguments as a shape instantiation."

## The dictionary makes up the difference

A shape instantiation cannot know which concrete type it is running as, and sometimes it needs to. The answer is the second half of the design: "Each chunk of assembly will take as an argument a dictionary, which is a set of information describing the particular concrete types that the parameterized types take on."

The property that keeps this cheap is that dictionaries are known before the program runs. "The most important feature of a dictionary is that it is compile-time computeable. All dictionaries will reside in the read-only data section, and will be passed around by reference." No allocation, no construction, no runtime type computation. What the table holds and what the indirection costs is the subject of [[cs/languages/Go/dictionaries-and-what-they-cost|dictionaries and what they cost]].

## What it costs

Two prices, both named in the design document's own risks section, and both are consequences of the same fact: a shape body does not know its concrete type.

The first is escape analysis. "The one exception is that method calls won't be fully resolvable at compile time," so "any methods called on the generic type will need to be analyzed conservatively which could lead to more heap allocation than a fully stenciled implementation." A fully monomorphized compiler can see that a method does not let its receiver escape and keep the value on the stack. A shape body cannot see which method it will call, so it assumes the worst, and a value that would have stayed in a stack frame goes to the heap.

The second follows from the first: "Similarly, inlining won't happen in situations where it could happen with a fully stenciled implementation." Losing inlining loses the optimizations that inlining unlocks, which is usually the larger effect.

There is also a bound on how far stencilling can go. "Note that the number of instantiations could be exponential in the number of type parameters," since shapes multiply across parameters, and the linker cleans up what duplicates: "Code for the instantiation of a specific generic function with a particular GC shape of its type parameters should be deduplicated by the linker."

> [!warning] This is an implementation, not a language guarantee
> Nothing in the specification requires any of this. The FAQ describes what the standard compiler ordinarily does, "emits a single instantiation for every type argument with the same shape, where the shape is determined by properties of the type such as the size and the location of pointers that it contains," and then reserves the right to change: "Future releases may experiment with the tradeoff between compile time, run-time efficiency, and code size." A different Go compiler could fully monomorphize or fully box. Code that depends on the current behaviour for performance is depending on an implementation detail.

## Where it sits

The gcshape document positions itself explicitly: "This proposal is middle ground between the" full stencilling proposal and the pure dictionaries proposal. The two poles are what every other language in the section chose, and the full comparison is in [[cs/languages/common/generics-monomorphization-vs-erasure|monomorphization versus erasure]]. What Go demonstrates is that the axis is continuous: pick a partition of the type space and you get a point in between, and the result is only as good as the partition, which has to group types that genuinely want the same instructions.

## Related Notes

- [[cs/languages/Go/dictionaries-and-what-they-cost|Dictionaries and What They Cost]] - the side table that lets one shape body serve many types
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - the pointer metadata that the shape classification is borrowed from
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - size classes, the same quantizing move applied to memory
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - the if and only if rule that makes gcshape a partition of types
- [[cs/languages/CSharp/generic-specialization-and-code-sharing|Generic Specialization and Code Sharing]] - the CLR partitions by value versus reference, a coarser cut of the same idea
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the pole Go declined, where one body serves everything

## Sources

- "Generics implementation - GC Shape Stenciling," golang/proposal. https://raw.githubusercontent.com/golang/proposal/master/design/generics-implementation-gcshape.md . Supports the definition of a GC shape, the one-chunk-per-shape rule, the dictionary argument, the compile-time computability and read-only placement of dictionaries, the determined stack frame layout, the exponential instantiation bound, linker deduplication, and the escape analysis and inlining costs.
- "Go 1.18 Implementation of Generics via Dictionaries and Gcshape Stenciling," golang/proposal. https://raw.githubusercontent.com/golang/proposal/master/design/generics-implementation-dictionaries-go1.18.md . Supports the gcshape grouping definition, the if and only if rule for shape membership, the deliberate exclusion of operator methods from dictionaries, the separation of int from float64 and of int16 from int32, the interface versus non-interface separation, and the term shape instantiation.
- The Go Programming Language FAQ. https://go.dev/doc/faq . Supports that the compiler may choose per-instantiation or shared compilation, that the standard compiler emits one instantiation per shape determined by size and pointer location, and that future releases may revisit the tradeoff.
