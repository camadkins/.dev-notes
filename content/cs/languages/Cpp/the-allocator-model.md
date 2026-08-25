---
title: The Allocator Model
description: "Why putting the allocator in the container's type was the mistake, what stateful allocators cost under that design, and what polymorphic memory resources changed by moving the choice to runtime."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-13
updated:
aliases:
  - PMR
---

`std::vector<int>` has two template parameters. Almost nobody writes the second one, and that is the tell: a design choice that everyone accepts the default of, but which is baked into the type of every container in the program whether they wanted it or not.

The reach is total. "Every standard library component that may need to allocate or release storage," from `std::string` and every container except `std::array`, through to `std::shared_ptr`, does so through an Allocator. So the decision about where memory comes from is not a container feature. It is a property of the whole library, expressed one way.

> [!note] The idea
> C++ made the allocator a template parameter, which means it made memory provenance part of the type. Two vectors of `int` that draw from different pools are unrelated types: they will not assign to each other, will not pass to the same function, and will not live in the same collection. That is not a limitation of the container implementation. It is the direct consequence of encoding a runtime concern in a compile-time slot, and `std::pmr` fixes it by putting a virtual call where the template parameter used to bind.

## The default hides the problem

`std::allocator` is the default Allocator for every standard container when none is given, and its important property is stated plainly: "The default allocator is stateless, that is, all instances of the given allocator are interchangeable, compare equal and can deallocate memory allocated by any other instance of the same allocator type."

Interchangeable and always equal is what makes the default invisible. Because every `std::allocator<int>` equals every other, no container ever has to ask whether the memory it holds came from a compatible source, and every `std::vector<int>` in the program has the same type. Substitute a real allocator with state and both of those properties go away at once.

## Stateful allocators, and what the standard says about them

The distinction is formal. "a stateful allocator type can have unequal values which denote distinct memory resources, while a stateless allocator type denotes a single memory resource," and "Instances of a stateless allocator type always compare equal."

The moment two allocator values can differ, every container operation that moves memory between containers has to be qualified. Copy assignment: "if the allocators of the source and the target containers do not compare equal, copy assignment has to deallocate the target's" memory with the old allocator and reallocate with the new one before copying. Move assignment cannot steal the source's buffer at all in that case and has to move the elements individually. Swap does not even get a defined answer: without the right propagation trait, "the behavior of container swap is undefined."

Then there is the sentence that reads as an admission. "Although custom allocators are not required to be stateless, whether and how the use of stateful allocators in the standard library is implementation-defined." And: "Use of unequal allocator values may result in implementation-defined runtime errors or undefined behavior if the implementation does not support such usage." The feature exists, it is specified, and portability of the interesting case is not promised.

A second symptom of strain is `rebind`. A container almost never allocates the type you named. "The member template class rebind provides a way to obtain an allocator for a different type," because `std::list<T, A>` needs to allocate internal nodes rather than `T` values. So an allocator parameterized on `T` has to be able to produce an allocator for something else, which means the parameterization on `T` was never carrying its weight. The type parameter is there to satisfy the template machinery, not because anyone wanted a per-element-type allocator.

> [!warning] The cost is in the type system, not the code
> The practical failure is not that stateful allocators are slow or hard to write. It is that a function taking `std::vector<Widget>` cannot accept a vector that allocates from an arena, because that is a different type. Every interface in the program either commits to one allocator or becomes a template. Arena allocation, pool allocation, and per-request allocation are exactly the strategies described in [[cs/systems/memory-allocators-and-fragmentation|memory allocators and fragmentation]], and the container model made all of them viral through the codebase rather than local to the code that wanted them.

## What polymorphic memory resources changed

C++17 added `std::pmr`, and the fix is a single indirection. `std::pmr::memory_resource` is "an abstract interface for classes that encapsulate memory resources," and `std::pmr::polymorphic_allocator` "is an Allocator which exhibits different allocation behavior depending upon the std::pmr::memory_resource from which it is constructed."

The payoff is the sentence the whole design exists to produce: since the resource is reached through runtime polymorphism, "different container instances with polymorphic_allocator as their static allocator type are interoperable, but can behave as if they had different allocator types." One static type, many behaviors. A `std::pmr::vector<Widget>` backed by a monotonic buffer and one backed by the default resource are the same type and pass to the same function, and the choice moves to construction time where it belonged.

The mechanism is exactly the one described in [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|virtual dispatch and object layout]]. Each allocation is a virtual call through a base-class pointer instead of an inlined call resolved at compile time, which is the price. In exchange, the arena strategy stops leaking into every signature that touches the container.

`pmr` also fixes a propagation problem the older model handled badly. `polymorphic_allocator::construct` "so that the elements of a container using a polymorphic_allocator will use that same allocator for their own allocations," which is why a `std::pmr::vector<std::pmr::string>` puts both the vector's buffer and each string's characters in one resource. Under the classic model that required wrapping everything in `std::scoped_allocator_adaptor`, which almost nobody did correctly.

It is not free of sharp edges. "polymorphic_allocator does not propagate on container copy assignment, move assignment, or swap." The consequences are inherited from the general rules above: move assignment of a container "using container can throw, and swapping two" containers "whose allocators do not compare equal results in undefined behavior." The improvement is that these are now runtime properties of two objects of the same type, rather than a wall in the type system.

## The general lesson

The allocator parameter is a clean case study in a recurring design question: when a policy varies, do you resolve it at compile time or at runtime? Compile time is faster and lets the optimizer see through the choice, which is why the STL made it a template parameter and why [[cs/languages/Cpp/stl-containers|the containers]] were designed that way. Runtime is slower per operation and keeps types compatible, which is what actually determines whether a feature can be adopted incrementally in a large codebase.

The C++ answer, arrived at over twenty years, is that memory provenance belongs on the runtime side. Where the memory comes from is a deployment decision, and deployment decisions that live in type signatures do not stay local. The underlying strategies did not change at all; what changed is who has to know about them. That is worth holding next to [[cs/dsa/dynamic-memory-allocation|dynamic memory allocation]], where the same strategies are examined without the question of who names them in a type.

## Related Notes

- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - the strategies the model exists to let you plug in
- [[cs/dsa/dynamic-memory-allocation|Dynamic Memory Allocation]] - the underlying cost model, independent of who selects it
- [[cs/languages/Cpp/stl-containers|STL Containers]] - the components carrying the second template parameter
- [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|Virtual Dispatch, Vtables, and Object Layout]] - the indirection pmr pays for interoperability
- [[cs/languages/Cpp/smart-pointers|Smart Pointers in C++]] - the other place allocation policy hides in a type parameter
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - the wider question of who owns an allocation and when

## Sources

- "C++ named requirements: Allocator," cppreference.com. https://en.cppreference.com/w/cpp/named_req/Allocator.html . Supports every allocating standard library component going through an Allocator, the stateful versus stateless distinction, stateless allocators always comparing equal, the copy-assignment and move-assignment consequences when allocators do not compare equal, container swap being undefined without the right propagation trait, and the implementation-defined status of stateful allocator use with possible runtime errors or undefined behavior.
- "std::allocator," cppreference.com. https://en.cppreference.com/w/cpp/memory/allocator.html . Supports std::allocator being the default for all standard containers, the default allocator being stateless and its instances interchangeable and mutually deallocating, and rebind existing to obtain an allocator for a different type such as a list's internal node.
- "std::pmr::polymorphic_allocator," cppreference.com. https://en.cppreference.com/w/cpp/memory/polymorphic_allocator.html . Supports polymorphic_allocator taking its behavior from the memory_resource it was constructed with, containers sharing one static allocator type while behaving as if they had different ones, uses-allocator construction propagating the resource to elements, and pmr not propagating on copy assignment, move assignment, or swap with the resulting throw and undefined-behavior cases.
