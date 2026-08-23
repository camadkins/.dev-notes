---
title: CRTP and Static Polymorphism
description: "The curiously recurring template pattern uses inheritance to pass the derived type upward rather than to create a supertype: what compile-time dispatch buys, what it gives up, and why C++23 made the trick unnecessary."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-18
updated:
aliases:
  - Curiously Recurring Template Pattern
  - Static Polymorphism
  - Compile-Time Polymorphism
---

```cpp
template<class Z> class Y {};
class X : public Y<X> {};
```

cppreference gives that as the definition of the curiously recurring template pattern: an idiom in which a class `X` derives from a class template `Y` taking a template parameter `Z`, where `Y` is instantiated with `Z = X`. It looks like a circular definition. `X` is not complete when `Y<X>` is named, and yet the base class can call members of `X`.

> [!note] The idea
> CRTP is not inheritance being used for subtyping. It is inheritance being used as a channel to pass the derived type *upward* into the base, so the base can generate code that mentions a type it was written before. That reading explains both halves of the trade at once. You get dispatch resolved entirely at compile time, because the base performs a `static_cast` to a type it knows statically. And you lose the thing inheritance normally provides, because `Base<D1>` and `Base<D2>` are separate generated classes with no relationship, so there is no single type that can hold either one. Virtual dispatch trades an indirect call for a common supertype. CRTP declines the trade, and pays by not having the supertype.

## Why the incomplete type is not a problem

The mechanism that makes CRTP legal is laziness in the instantiation model. cppreference states that instantiation applies to the members of a class template such that unless a member is used in the program, it is not instantiated and does not require a definition. When the compiler processes `class D1 : public Base<D1>`, it instantiates the class `Base<D1>` itself, which needs only the declarations of its members. The *body* of `Base<D1>::name` is not instantiated until somebody calls it, and by then `D1` is a complete type with a known `impl`.

This is the same demand-driven behavior described in [[cs/languages/Cpp/templates-and-generic-programming|the introduction to templates]], turned into a load-bearing structural feature. The pattern is not clever about types. It is exploiting the exact moment at which a member function body gets compiled.

## The shape

cppreference's example is the canonical form:

```cpp
template<class Derived>
struct Base
{
    void name() { static_cast<Derived*>(this)->impl(); }
protected:
    Base() = default;   // prohibits the creation of Base objects, which is UB
};

struct D1 : public Base<D1> { void impl() { std::puts("D1::impl()"); } };
struct D2 : public Base<D2> { void impl() { std::puts("D2::impl()"); } };
```

Calling `d1.name()` prints `D1::impl()` and `d2.name()` prints `D2::impl()`. cppreference labels this compile-time polymorphism, with a base class exposing an interface and derived classes implementing it.

Two details in that snippet are not decoration. The `static_cast<Derived*>(this)` is a downcast the compiler cannot verify, and the protected default constructor is the guard: it prevents anyone from creating a standalone `Base` object, which cppreference notes would be [[cs/languages/common/undefined-behavior-as-a-contract|undefined behavior]] once the cast in `name` reinterprets it as a `Derived`. The pattern's safety rests on a convention that nothing checks. Write `struct D3 : public Base<D1>` by copy-paste and the cast lies, the compiler says nothing, and the program is undefined.

## What it buys

The call chain is `name` to `static_cast` to a direct call on a known type. There is no lookup and no indirection, so the whole thing can collapse into the caller after inlining, which is why the pattern shows up in numeric and container libraries where a virtual call per element would dominate the work being done.

The second, less-discussed benefit is that the base can generate *more* than one function. Because `Derived` is a type parameter, the base can define an entire family of members in terms of a small number the derived class supplies. cppreference points at the standard library's use of this: `std::ranges::view_interface` is described as a helper class template for defining a view, using the curiously recurring template pattern, and `std::enable_shared_from_this` allows an object to create a `shared_ptr` referring to itself. In the first case a view author writes `begin` and `end` and inherits `empty`, `front`, `operator[]`, and the rest. That is code reuse pointed in the opposite direction from ordinary inheritance: the base is generated from the derived class rather than the derived class extending the base.

## What it costs

The costs come in three sizes.

The small one is readability. Every use of a CRTP base is a class whose full name mentions the class currently being declared, and error messages carry that recursion with them.

The medium one is duplication. Each distinct `Derived` produces a distinct instantiation of every base member it uses, which is the ordinary per-specialization cost of generic code, and the Core Guidelines' warning applies to this shape specifically: templating a class hierarchy that has many functions, especially many virtual functions, can lead to code bloat, and in a class template non-virtual functions are only instantiated if they are used while virtual functions are instantiated every time.

The large one is the missing supertype, and no technique recovers it for free. If you need a container of heterogeneous implementations, CRTP cannot give you one, and the alternatives are type erasure or virtual dispatch. The Guidelines rate the first as a last resort, with rule T.49 saying to avoid type erasure where possible because it incurs an extra level of indirection by hiding type information behind a separate compilation boundary, while conceding `std::function` as an appropriate exception.

The boundary between the two worlds is stated most sharply by rule T.83, which forbids declaring a member function template virtual. The reason given is not stylistic: C++ does not support it, and if it did, vtables could not be generated until link time, since in general implementations must deal with dynamic linking. The suggested alternatives are double dispatch, visitors, or calculating which function to call. That rule is why CRTP exists. Genericity is resolved when the code is generated, and [[cs/pl/objects-classes-and-dispatch|virtual dispatch]] is resolved when the object is used, and there is no construct that does both, so a pattern grew up to fake the second using the first.

For the same trade seen with a type system in front of it, compare [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|trait objects]]: generic code monomorphizes and `dyn Trait` erases, and the language makes you choose in the type rather than in the class hierarchy.

## The trick was a workaround

C++23 removed the reason for it. The same cppreference page gives a second version of the example, guarded by a feature test for explicit object parameters:

```cpp
struct Base { void name(this auto&& self) { self.impl(); } };
struct D1 : public Base { void impl() { std::puts("D1::impl()"); } };
```

No template parameter on the base, no `static_cast`, no recursive base specifier, and the same output. Deducing `this` gives the member function the derived type directly, which was the only thing CRTP ever needed. The pattern turns out to have been a fifteen-year workaround for a parameter the language did not let you write.

What survives is the underlying distinction, and it is worth holding onto independently of the syntax. Selecting an implementation from a type you know statically is a different operation from selecting one from a value you inspect at runtime, and it belongs to the same family as [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]] rather than to inheritance. CRTP was the shape that difference took when the only way to hand a type to a base class was to inherit from it.

## Related Notes

- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - the member-instantiation laziness that makes the incomplete base legal
- [[cs/languages/Cpp/templates-code-bloat-and-link-time|Templates, Code Bloat, and Link Time]] - what one instantiation per derived class costs
- [[cs/languages/Cpp/type-traits-and-tag-dispatch|Type Traits and Tag Dispatch]] - the other way of choosing an implementation before the program runs
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the runtime mechanism CRTP is imitating
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and Algebraic Data Types]] - the family static polymorphism actually belongs to
- [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|Trait Objects, Vtables, and Fat Pointers]] - the same choice made explicit in the type rather than the hierarchy

## Sources

- "Curiously Recurring Template Pattern," cppreference.com. https://en.cppreference.com/w/cpp/language/crtp.html . Supports the definition of the idiom, the compile-time polymorphism example including the `static_cast` and the protected default constructor with its undefined-behavior note, the output for both derived classes, the C++23 deducing-this version of the same example, and the references to `std::enable_shared_from_this` and `std::ranges::view_interface` as standard library uses.
- "Class template," cppreference.com. https://en.cppreference.com/w/cpp/language/class_template.html . Supports the rule that a member of a class template is not instantiated and does not require a definition unless it is used, which is what allows a base to be instantiated against an incomplete derived class.
- "C++ Core Guidelines," isocpp.github.io. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports T.80 on code bloat from templatized hierarchies, the note that non-virtual members of a class template are instantiated only when used while virtual members are instantiated every time, T.49 on avoiding type erasure and its extra indirection with `std::function` as an exception, and T.83 forbidding virtual member function templates with the link-time vtable reasoning and its suggested alternatives.
