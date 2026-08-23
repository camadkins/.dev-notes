---
title: Dispatch, Vtables, Fat Pointers, and Dictionaries
description: "A C++ object carries its vtable pointer inside itself, a Rust trait object carries it beside itself in a doubled pointer, Go passes a compile-time dictionary alongside a shared instantiation, and a Java interface call searches. Each layout permits and forbids something different."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-30
updated:
aliases:
  - Runtime Dispatch Layouts
  - Fat Pointers vs Vtables
---

Somewhere in every polymorphic call there is an indirect jump, and something has to supply the address. Where that something lives is a layout decision made once per language, and it determines a surprising amount: whether an `int` can implement an interface, whether a library can add behavior to a type it did not define, and whether the object pays for a machine word it never uses.

> [!note] The idea
> Four layouts, four places to put the table. C++ puts a pointer to it *inside the object*, making every polymorphic value self-describing and permanently taxed. Rust puts it *beside a reference*, doubling the pointer instead of the object, which decouples the type from the traits it satisfies and lets a plain `u8` become a trait object. Go passes a *statically built dictionary* alongside a shared instantiation. Java looks it up: an interface call searches the methods implemented by the run-time object. The non-obvious consequence is that where you put the table determines who may add behavior later, and that question decides more library design than the performance numbers do.

## Inside the object: C++

C++ says the object knows. The `virtual` specifier states that a non-static member function is virtual and supports dynamic dispatch, and the semantics are that, as opposed to non-virtual functions, the overriding behavior is preserved even if there is no compile-time information about the actual type of the class. To do that at run time, an implementation needs a per-object route to the right code.

The Itanium C++ ABI, which governs the layout on nearly every non-Windows platform, spells it out. It defines a *dynamic class* as a class requiring a virtual table pointer, because it or its bases have one or more virtual member functions or virtual base classes. That pointer is a field: if a class has no primary base class, the ABI allocates the virtual table pointer for it at offset zero. Each class with virtual member functions or virtual bases has an associated set of virtual tables, and the virtual table pointers within all the objects of a particular most-derived class point to the same set of virtual tables. A virtual table consists of a sequence of offsets, data pointers, and function pointers, plus structures composed of such items.

What that layout buys is that any pointer to the object is enough to dispatch. What it bills is a machine word in *every instance*, allocated whether or not anything ever dispatches through it. The ABI sizes that field as a pointer, all eight bytes on 64-bit Itanium, so a million small polymorphic objects spend eight megabytes on dispatch metadata that the [[cs/systems/memory-hierarchy-and-caching|cache lines have to carry]] whether or not a virtual call is ever made. It also forbids the thing you most often want: a type cannot acquire virtual behavior after it is defined, because the vptr slot is decided by the class definition. See [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|virtual dispatch and object layout]] for the multiple-inheritance version, which gets worse.

## Beside the pointer: Rust

Rust moved the table out of the object and into the reference. Because the concrete type behind `dyn Trait` is opaque, trait objects are dynamically sized types, and like all DSTs they are used behind some type of pointer. Each instance of a pointer to a trait object includes a pointer to an instance of a type `T` that implements the trait, plus a virtual method table, often just called a vtable, which contains a pointer to `T`'s implementation for each method of the trait and its supertraits.

The size consequence is stated directly in the reference: pointer types to DSTs are sized but have twice the size of pointers to sized types, since they also store metadata, and pointers to trait objects store a pointer to a vtable. That is the [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|fat pointer]]. Two words on the stack, zero words in the value.

Three things follow that C++ cannot do. A `u8` can be a trait object, because the value is untouched and needs no header. A trait can be implemented for a type defined in another crate, because the vtable is built where the coercion happens rather than where the type is declared. And a value costs nothing until somebody actually asks for dynamic dispatch, because generic code is monomorphized by default and the fat pointer only appears where `dyn` is written.

The bill is that a value on its own is not self-describing. Nothing was stored in the value, so given only a thin pointer to it there is no vtable to find and no way to ask what trait implementations exist. C++ can interrogate any polymorphic object it holds a pointer to. Rust can interrogate only a reference somebody already coerced.

## Passed alongside: Go

Go's generics use a third layout that is neither of the above. The compiler shares an instantiation among type arguments with the same GC shape and passes a dictionary along with every call to a generic function or method. Each dictionary is statically defined at compile time, and the entries include the list of concrete type arguments (always as run-time type descriptors), the list of derived types appearing in the function, sub-dictionaries for nested generic calls, and, critically, any specific itabs needed for conversion to a non-empty interface from a type parameter.

That last entry is where the layouts collide. In Go, all method calls on a type parameter, which must be to a method in the type parameter's bound, are implemented as a conversion of the receiver to the type bound interface, and are handled like an implicit interface conversion. A constrained method call inside a Go generic function is therefore an *interface call*, resolved through an itab that the dictionary supplied. Rust monomorphizes the same call into a direct one. This is [[cs/languages/Go/dictionaries-and-what-they-cost|the cost Go accepted]] to keep instantiation counts and build times bounded.

## Searched: Java

The JVM does not commit to a single strategy in the specification, and the instruction set makes the distinction visible. `invokevirtual` invokes an instance method of an object, dispatching on the virtual type of the object, and the specification calls this the normal method dispatch in the Java programming language. `invokeinterface` invokes an interface method, *searching* the methods implemented by the particular run-time object to find the appropriate method.

The specification's choice of verb tracks a real structural difference. A single inheritance chain lets every override land at a fixed index, because each class extends exactly one superclass and the layout can be extended by appending. A set of interfaces has no such shared numbering, because a class may implement several unrelated interfaces that were designed without knowledge of each other. Production JVMs close most of the gap with inline caches, but the abstract machine described in the specification is being asked to search, and that is the honest description of the problem.

> [!warning] The layout is a compatibility decision, not only a performance one
> C++ and Java both put the dispatch information in or with the object, and both then had to invent extra mechanisms to add behavior after the fact: free functions and adapters in C++, default methods in Java. Rust put it in the pointer and got retroactive implementation for free. Go put it in a compile-time side table and got bounded build times while paying interface dispatch on constrained calls. If extension feels hard in your language, the answer is often a layout choice made before that language had users.

The through-line: static dispatch is always faster and always less extensible, and each of these designs makes the dynamic case cheap enough that the extensibility is worth having, which is the same tradeoff [[cs/pl/objects-classes-and-dispatch|objects and dispatch]] describes one level up.

## Related Notes

- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the general theory of resolving a call by the receiver's runtime type
- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - dictionary passing as the academic ancestor of both Rust traits and Go dictionaries
- [[cs/security/control-flow-integrity|Control-Flow Integrity]] - what happens when an attacker can write to a table of function pointers an indirect call trusts
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - where the JVM resolves an interface method reference
- [[cs/languages/common/five-answers-to-the-same-question|Five Answers to the Same Question]] - the compile-time half of the same decision
- [[cs/languages/common/runtime-type-information|Runtime Type Information]] - what each of these layouts leaves available to ask about at run time

## Sources

- "virtual function specifier," cppreference.com. https://en.cppreference.com/w/cpp/language/virtual.html . Supports virtual functions supporting dynamic dispatch and overriding behavior being preserved without compile-time knowledge of the actual class.
- "Itanium C++ ABI." https://itanium-cxx-abi.github.io/cxx-abi/abi.html . Supports the definition of a dynamic class as one requiring a virtual table pointer, allocating that pointer at offset zero when there is no primary base, all instances of a most-derived class sharing one set of virtual tables, and the composition of a virtual table.
- "Trait object types," The Rust Reference. https://doc.rust-lang.org/reference/types/trait-object.html . Supports trait objects being dynamically sized types used behind a pointer, and each trait object pointer carrying both a data pointer and a vtable of implementation function pointers.
- "Dynamically sized types," The Rust Reference. https://doc.rust-lang.org/reference/dynamically-sized-types.html . Supports pointers to DSTs being twice the size of ordinary pointers because they store metadata, and trait object pointers storing a vtable pointer.
- "Go 1.18 Implementation of Generics via Dictionaries and Gcshape Stenciling," Go design documents. https://go.googlesource.com/proposal/+/refs/heads/master/design/generics-implementation-dictionaries-go1.18.md . Supports dictionaries being passed on every generic call and statically defined at compile time, the itab entries they carry, and method calls on a type parameter being implemented as a conversion of the receiver to the bound interface.
- "Chapter 2: The Structure of the Java Virtual Machine," The Java Virtual Machine Specification (Java SE 21). https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html . Supports invokevirtual dispatching on the virtual type of the object as the normal Java dispatch, and invokeinterface searching the methods implemented by the run-time object.
