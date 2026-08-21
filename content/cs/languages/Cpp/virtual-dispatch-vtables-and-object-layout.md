---
title: Virtual Dispatch, Vtables, and Object Layout
description: "What a polymorphic C++ object looks like in memory: the hidden vtable pointer the constructor writes, why multiple inheritance puts base subobjects at different offsets, and what the two loads plus a call actually cost."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-07-02
updated:
aliases:
  - C++ Vtables
  - Virtual Function Dispatch
  - vptr
---

A C++ object with no virtual functions is exactly its members, laid end to end with padding. Add one `virtual` and the object grows a field you did not write, the constructor gains an assignment you did not ask for, and a member call turns into a load, a load, and an indirect jump. None of that is in the standard. All of it is in every implementation you will ever compile against.

> [!note] The idea
> The runtime type of a polymorphic object is not a property of its address. It is a value stored inside the object, written by whichever constructor is currently running. That single fact explains three otherwise unrelated behaviors: a virtual call from a base constructor dispatches to the base version, converting a pointer across a multiple-inheritance hierarchy changes the numeric address, and a corrupted heap object can redirect a virtual call to attacker-chosen code. The type tag is data, and data can be stale, offset, or overwritten.

## What the language promises

cppreference is careful to describe behavior rather than mechanism. Virtual functions are member functions whose behavior can be overridden in derived classes, and the guarantee that matters is that the overriding behavior survives the loss of static type information: "if a derived class is handled using pointer or reference to the base class, a call to an overridden virtual function would invoke the behavior defined in the derived class."

There is one deliberate escape hatch. "Virtual function call is suppressed if the function is selected using qualified name lookup," which is why `p->Base::f()` reaches `Base::f` even when `p` points at a `Derived`. The dispatch is on the object, and naming the scope opts out of asking the object.

The standard never says vtable. It says the observable result, and leaves the mechanism to the ABI. Every mainstream implementation converges on the same one anyway, because the constraints leave almost no room.

## What the compiler actually builds

The isocpp FAQ walks the construction. "The compiler creates a v-table for each class that has at least one virtual function." One table per class, not per object: a program with a million `Circle` instances has exactly one `Circle` vtable, and the table holds a pointer to each of the class's virtual functions in a fixed slot order.

Each object then carries a hidden pointer to its class's table, and the constructor is what installs it. A derived class reuses the same hidden field rather than adding a second one, and its constructor overwrites the value to point at the derived table, whose slots hold the overriders in the positions the base established.

The call site never learns the answer. In the FAQ's example, "The compiler has no idea whether this is going to call Base::virt3() or Der::virt3() or perhaps the virt3() method of another derived class that doesn't even exist yet." It knows only the slot number, so it emits a fetch of the hidden pointer, a fetch of the slot, and a call through the result. "The first load gets the v-pointer, storing it into a register," and the second reads the function pointer out of the table.

That is the whole cost model. Space: "objects of a class with a virtual function require space needed by the virtual function call mechanism," typically one word per object. Time: "compared to a normal function call, a virtual function call requires two extra fetches (one to get the value of the v-pointer, a second to get the address of the method)." Depth is free. "You could have 10 levels of inheritance, but there is no" chaining; it stays two fetches and a call regardless. The real expense is not the arithmetic but the unknown target, which forecloses inlining and puts an indirect branch where a direct one would have been. What that costs depends on whether the table line is resident, which is a question for [[cs/systems/memory-hierarchy-and-caching|the memory hierarchy]] rather than for the language.

## Layout, and why addresses move

Single inheritance is the easy case: the base subobject sits at offset zero, the derived members follow, and a `Derived*` and its `Base*` are the same number. Multiple inheritance breaks that, and cppreference states the general rule plainly. "Each direct and indirect base class is present, as base class subobject, within the object representation of the derived class at an ABI-dependent offset." Two polymorphic bases cannot both live at offset zero, so converting a `Derived*` to a pointer to the second base has to add that offset, and converting back has to subtract it. The pointer value changes while the object does not.

Two refinements follow. "Empty base classes usually do not increase the size of the derived object due to" empty base optimization, which is why policy-based designs inherit from stateless policy classes instead of storing them. And virtual inheritance collapses duplicates: for each distinct virtual base, the most derived object "contains only one base class subobject of that type, even if the class appears many times in the inheritance hierarchy." The standard library's own hierarchy leans on this, with `std::istream` and `std::ostream` deriving virtually from `std::ios` so that `std::iostream` holds one `std::ios`.

## The tag is mutable, and that is the bug source

Because the hidden pointer is written by the running constructor, the object's apparent type climbs the hierarchy during construction and descends it during destruction. cppreference gives the rule and the reason in one line: a virtual call from a constructor or destructor selects the final overrider in that constructor's or destructor's class, because "In other words, during construction or destruction, the more-derived classes do not exist." A base constructor calling a virtual function it expects the derived class to have overridden gets the base version, silently.

> [!warning] The non-virtual destructor is undefined behavior, not a leak
> The common summary is that a missing virtual destructor leaks the derived part. cppreference is stronger: "deleting a derived class object through a pointer to the base class is undefined behavior" regardless of whether anything would actually leak. It is a contract violation, in the sense [[cs/languages/common/undefined-behavior-as-a-contract|undefined behavior as a contract]] develops, not a resource accounting error, and the compiler owes you nothing afterward.

The security consequence is direct. A vtable pointer is a code pointer stored in writable memory next to user data, which makes it the preferred target once an attacker controls a freed or overflowed object. Overwrite the hidden field, point it at a forged table, and the next virtual call jumps wherever the table says. That is the threat [[cs/security/control-flow-integrity|control-flow integrity]] was built to answer, and it is why hardened toolchains ship vtable verification rather than trusting the field.

The alternative design keeps the object clean and moves the table pointer into the reference instead, so a value costs nothing until you take a polymorphic view of it. That is what [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|Rust trait objects]] do, and the tradeoff is exactly inverted: no per-object overhead, but a pointer that is twice as wide. Which of the two you want is a dispatch-strategy question older than either language, laid out in [[cs/pl/objects-classes-and-dispatch|objects, classes, and dispatch]].

## Related Notes

- [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|Trait Objects, Vtables, and Fat Pointers]] - the same table, reached through the pointer instead of the object
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the general taxonomy vtables are one point in
- [[cs/security/control-flow-integrity|Control-Flow Integrity]] - the defense that exists because the type tag is writable memory
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - what the second fetch costs when the table is cold
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - why the non-virtual destructor rule is absolute rather than pragmatic
- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - the destructor guarantee that the missing `virtual` quietly cancels

## Sources

- "virtual function specifier," cppreference.com. https://en.cppreference.com/w/cpp/language/virtual.html . Supports overriding surviving through base pointers and references, qualified name lookup suppressing the virtual call, the constructor and destructor dispatch rule with the more-derived-classes-do-not-exist reasoning, and deleting through a non-virtual base destructor being undefined behavior.
- "Derived classes," cppreference.com. https://en.cppreference.com/w/cpp/language/derived_class.html . Supports base class subobjects living at ABI-dependent offsets in the derived object representation, empty base optimization, and virtual bases collapsing to a single subobject in the most derived object.
- "Inheritance, Virtual Functions," isocpp.org. https://isocpp.org/wiki/faq/virtual-functions . Supports one vtable per class with at least one virtual function, the hidden per-object pointer initialized in the constructor, the call site knowing only a slot number, the two-load-plus-call sequence, the one-word-per-object space cost, and inheritance depth adding no per-call overhead.
