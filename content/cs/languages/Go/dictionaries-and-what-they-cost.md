---
title: "Dictionaries and What They Cost"
description: "The hidden first argument every generic call carries, what the compiler puts in it, and the two costs that are not the table lookup."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-08-11
updated:
aliases: []
---

A shape instantiation of a generic function runs the same machine code for every type sharing its memory layout. Sometimes that is enough. Often it is not: the body converts a value to `any` and needs a type descriptor, or calls a method through a constraint, or calls another generic function with its own type parameters. None of that can be baked into a body serving many types, so the caller supplies it. The Go 1.18 implementation document states the mechanism in one sentence: the compiler passes "a dictionary along with every call to a generic function/method," and the dictionary "provides relevant information about the type arguments that allows a single function instantiation to run correctly for many distinct type arguments."

> [!note] The idea
> The dictionary is a constant. "Each dictionary is statically defined at compile-time," lives in read-only memory, and is passed by pointer, so a generic call allocates nothing and computes nothing about types at run time. The interesting cost is therefore not the table lookup, which is one dependent load on the operations that need it. It is what the arrangement forbids. Because dictionaries must be built statically, the compiler needs the *body* of a generic function to know what its dictionary should contain, which rules out instantiating across a shared object boundary and rules out programs whose recursion generates unboundedly many types. The runtime table is cheap; the static-computability requirement it depends on is what actually constrains the language.

## Passing convention

The design document names the extra parameter plainly: "The implementation of f will have an additional argument which is the pointer to the dictionary structure." The Go 1.18 implementation puts it in front of everything, adding a dictionary parameter "as the first parameter, preceding even the method receiver."

The rule for when one is needed has no exceptions. "A dictionary is needed whenever a generic function/method is called, regardless if called from a non-generic or generic function/method." The call site knows the concrete types, so it can name the right constant, and because the naming is deterministic, "Dictionaries with the same name are fully de-duped (by some combination of the compiler and the linker)." Two packages instantiating the same function with the same types share one table in the final binary, and the space bound is reassuring: "Then the worst case space usage is one dictionary per instantiation."

The layout is unconstrained precisely because nothing outside the compiler reads it. "Because the dictionary is completely compile time and read only, it does not need to adhere to any particular structure." That freedom, and the read-only placement, come with a transitive requirement: "Anything they reference (types, other dictionaries, etc.) must also be in the read-only or code data sections."

## What it carries

Four kinds of entry, and each corresponds to a question the shape body cannot answer for itself.

**The concrete type arguments.** The types themselves, as runtime descriptors: "Types in the dictionary are always the run-time type descriptor (a pointer to `runtime._type`)." A body that boxes a `T` into an `any` needs the descriptor to write into the interface header.

**Derived types.** "The list of all (or needed) derived types, which appear in or are implicit in some way in the generic function/method, substituted with the concrete type arguments." If the body constructs a `map[string]T` or takes a `*T`, those composite types need descriptors too, and they cannot be enumerated without reading the body. The same entries have a second life at debug time: "The derived type and type argument entries are also used at run time by the debugger to determine the concrete type of arguments and local variables."

**Sub-dictionaries.** A generic function calling another generic function cannot construct that inner dictionary, because it does not know its own type arguments. "A sub-dictionary is needed for a generic function/method call inside a generic function/method, where the type arguments of the inner call depend on the type parameters of the outer function." The obligation is passed outward until it reaches a call site with concrete types. This is dictionary passing in the same sense that [[cs/pl/type-classes-and-traits|type class dictionaries]] are, and the resemblance is not a coincidence: it is the standard way to compile a constrained polymorphic function without duplicating it.

**Itabs.** Interface tables, needed whenever a value of type parameter type meets an interface. Method calls on a type parameter are among them, since such a call is compiled as a conversion of the receiver to the constraint interface. Type assertions and type switches need them as well: "For all type assertions from a non-empty interface to a non-interface type. The itab is needed to implement the type assertion." The rule tying it together is that "In all cases, the itab must come from the dictionary, since it depends on the type arguments of the current function." An itab is the same [[cs/pl/objects-classes-and-dispatch|dispatch table]] any interface value carries, sourced from the dictionary rather than from the static type.

Closures inside a generic function do not get their own: "We have decided that closures in generic functions/methods that reference generic values/types should use the same dictionary as their containing function/method." The design document had already noticed the need, since "We need to pass a dictionary to the anonymous function as part of the closure," and the Go 1.18 answer is to fold those entries into the enclosing table, which makes the dictionary part of what [[cs/pl/scoping-binding-and-closures|a closure captures]].

## The costs that matter

The indirection is real but small. A shape body that needs a type descriptor loads the dictionary pointer and then loads a slot, where a fully monomorphized body would have used an immediate. That is the same trade the CLR makes for [[cs/languages/CSharp/generic-specialization-and-code-sharing|its reference-type instantiations]], and it is paid only on operations that ask which type is running.

The larger costs are structural.

The first is that the compiler cannot instantiate from a signature. Building the dictionary requires knowing which derived types, sub-dictionaries, and itabs the body needs, so the body must be available. The gcshape document draws the conclusion: "we need its implementation at compile time also. So implemented-in-assembly and cross-shared-object-boundary instantiations are not possible." A generic function is not a linkable symbol in the ordinary sense, which is why exported generic function bodies must always be exported.

The second is that some correct-looking programs will not build. "Our choice to compute all dictionaries and sub-dictionaries at compile time does mean that there are some programs that we cannot run." Specifically, "we cannot handle programs that, via recursion of generic functions/methods, can create an unbounded number of distinct types," typically by a generic type nesting itself at each recursive step. "These types of programs are often called non-monomorphisable." The name is honest about the cause: dictionaries make the implementation partly shared, but it inherits the finiteness requirement of monomorphization anyway, because the tables are built at compile time.

> [!warning] The tables are not tightly packed
> The implementation admits slack: "The current implementation may have duplicate subdictionary entries and/or duplicate itab entries." These are read-only bytes rather than run-time work, so the effect is binary size rather than speed. Anyone measuring generic code size against a hand-written equivalent should expect the dictionaries and the per-shape bodies described in [[cs/languages/Go/generics-implementation-gc-shape-stenciling|GC shape stenciling]] to both show up.

## Related Notes

- [[cs/languages/Go/generics-implementation-gc-shape-stenciling|Generics Implementation: GC Shape Stenciling]] - the code-generation half that dictionaries complete
- [[cs/pl/type-classes-and-traits|Type Classes & Traits]] - dictionary passing as the canonical compilation of constrained polymorphism
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - what an itab is and why an interface call needs one
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the dictionary as one more thing a closure carries
- [[cs/languages/CSharp/generic-specialization-and-code-sharing|Generic Specialization and Code Sharing]] - the CLR generic dictionary, reached by a different route
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - the alternative of resolving this information at load time instead

## Sources

- "Go 1.18 Implementation of Generics via Dictionaries and Gcshape Stenciling," golang/proposal. https://raw.githubusercontent.com/golang/proposal/master/design/generics-implementation-dictionaries-go1.18.md . Supports that a dictionary is passed with every generic call and what it provides, that dictionaries are statically defined at compile time, the dictionary parameter preceding the receiver, the rule that a dictionary is always needed, name-based deduplication, the four entry categories including runtime type descriptors, derived types, sub-dictionaries and itabs, the debugger use of derived type entries, the closure sharing decision, the possibility of duplicate entries, and the non-monomorphisable limitation.
- "Generics implementation - GC Shape Stenciling," golang/proposal. https://raw.githubusercontent.com/golang/proposal/master/design/generics-implementation-gcshape.md . Supports the dictionary pointer as an additional argument, the requirement that referenced data live in read-only or code sections, the unconstrained dictionary layout, the worst-case one dictionary per instantiation bound, the need to pass a dictionary to a closure, and the conclusion that assembly and cross-shared-object instantiation are impossible.
