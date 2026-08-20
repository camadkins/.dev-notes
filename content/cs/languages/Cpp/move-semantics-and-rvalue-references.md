---
title: Move Semantics and Rvalue References
description: Value categories as the thing overload resolution actually sees, why std::move is a cast and not a move, what the move constructor is allowed to leave behind, and how much you may assume about a moved-from object.
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-05-06
updated:
aliases:
  - C++ Move Semantics
  - Rvalue References
  - std::move
---

Returning a `std::vector` with a million elements by value used to mean copying a million elements, because the compiler had no way to tell "this vector is about to be destroyed anyway" from "this vector is still in use." C++11 gave the language a way to say it. The mechanism is not a new operation on objects; it is a new distinction between expressions, plus an overload that fires on one side of the distinction.

[[cs/languages/Cpp/raii-and-object-lifetime|RAII]] is what creates the need. Once a resource is nailed to an object's lifetime, getting the resource out of a dying scope without copying it requires a way to transfer ownership rather than duplicate content.

> [!note] The idea
> Move semantics is a compile-time routing decision, not a runtime one. `std::move` moves nothing: cppreference states it is exactly equivalent to a `static_cast` to an rvalue reference type, and it exists only to change the value category of an expression so that a different overload is selected. The corollary that surprises people is that the overload picked is under no obligation to steal anything. cppreference says these overloads have the option, but are not required, to move any resources held by the argument. Whether a move is cheap is a property of the type's author, not of the `std::move` call.

## Two independent properties of every expression

cppreference opens with the framing that makes the rest tractable. Each C++ expression is characterized by two independent properties: a type and a value category. Each expression has some non-reference type, and each expression belongs to exactly one of three primary value categories: prvalue, xvalue, and lvalue.

The definitions turn on identity and reusability.

A **glvalue** is an expression whose evaluation determines the identity of an object or function. A **prvalue** is an expression whose evaluation computes the value of an operand of a built-in operator, or initializes an object. An **xvalue**, meaning eXpiring value, is a glvalue that denotes an object whose resources can be reused. An **lvalue** is a glvalue that is not an xvalue, and an **rvalue** is a prvalue or an xvalue.

So the axis that matters for moving is not "has a name" but "may its resources be raided." An xvalue has identity (you could take a reference to what it denotes) and is also flagged as expiring. That is precisely the combination a move needs: something concrete to steal from, and permission to leave it damaged.

cppreference notes the historical names are misleading, and that despite them, these terms classify expressions, not values. It also flags directly the trap that follows.

## The name of an rvalue reference is an lvalue

From the lvalue list: the name of a variable, a function, a template parameter object, or a data member is an lvalue expression regardless of type, and even if the variable's type is rvalue reference, the expression consisting of its name is an lvalue expression.

This is the single rule that makes move constructors look strange to newcomers. Inside `A(A&& arg)`, the parameter `arg` is declared as an rvalue reference, but every time you write `arg` you have written an lvalue. The `std::move` page states the consequence: names of rvalue reference variables are lvalues and have to be converted to xvalues to be bound to the function overloads that accept rvalue reference parameters, which is why move constructors and move assignment operators typically use `std::move`. Its illustration is the canonical body:

```cpp
// Simple move constructor
A(A&& arg) : member(std::move(arg.member)) // the expression "arg.member" is lvalue
{}
```

Without the inner `std::move`, `member` is copy-constructed from `arg.member` and the "move" constructor quietly copies. The comment on that line is the whole reason the call is there.

The one exception cppreference names: when the function parameter is a forwarding reference (which looks like an rvalue reference to a type template parameter), `std::forward` is used instead.

## std::move is a cast with a good name

cppreference's description is unambiguous. `std::move` is used to indicate that an object `t` may be moved from, allowing the efficient transfer of resources from `t` to another object. In particular, it produces an xvalue expression that identifies its argument, and it is exactly equivalent to a `static_cast` to an rvalue reference type. Its documented return value is `static_cast<typename std::remove_reference<T>::type&&>(t)`.

Nothing there touches memory. The function's entire effect is on overload resolution: functions that accept rvalue reference parameters, including move constructors, move assignment operators, and ordinary members such as `std::vector::push_back`, are selected when called with rvalue arguments, whether prvalues such as a temporary or xvalues such as the one produced by `std::move`. cppreference's example of what such an overload may then do is exact: a move constructor of a linked list might copy the pointer to the head of the list and store `nullptr` in the argument instead of allocating and copying individual nodes.

Two words to hold on to. `push_back(std::move(str))` on a `std::string` does not guarantee `str` is emptied. It guarantees that the `push_back(T&&)` overload is chosen, and that overload is free to do whatever its author wrote.

## What a move constructor is

cppreference defines it as a constructor which can be called with an argument of the same class type and copies the content of the argument, possibly mutating the argument. The parameter list requirement is that, given the class type `T`, the first parameter is of type `T&&`, `const T&&`, `volatile T&&`, or `const volatile T&&`, and either there are no other parameters or all other parameters have default arguments.

It is typically called when an object is initialized, by direct or copy initialization, from an xvalue of the same type (since C++17), including three shapes: initialization such as `T a = std::move(b);`, function argument passing such as `f(std::move(a));`, and function return, meaning `return a;` inside a function returning `T` where `a` is of type `T` and `T` has a move constructor.

The behavioral description is where the contract lives. Move constructors typically transfer the resources held by the argument, such as pointers to dynamically allocated objects, file descriptors, TCP sockets, and thread handles, rather than making copies of them, and leave the argument in some valid but otherwise indeterminate state. Then the sentence people forget: since the move constructor does not change the lifetime of the argument, the destructor will typically be called on the argument at a later point.

That last clause is why a moved-from object cannot simply be garbage. It is still a live object with a scheduled destructor call, so whatever state the move leaves it in must be destructible without harm. Emptying a `std::string`'s pointer is fine; leaving the pointer intact in both objects would be a double free.

cppreference adds the C++17 wrinkle for prvalue initializers: when the initializer is a prvalue, the move constructor call is never made (since C++17), because of copy elision. Returning a freshly built temporary does not move it; it constructs it in place.

## What you may assume about a moved-from object

There are two different guarantee levels, and conflating them causes real bugs.

For a general user-written type, cppreference's move-constructor page says only "valid but otherwise indeterminate state," and notes that moving from a `std::string` or a `std::vector` **may** result in the argument being left empty. May, not will.

For the standard library, the `std::move` page is stricter and more useful: unless otherwise specified, all standard library objects that have been moved from are placed in a valid but unspecified state, meaning the object's class invariants hold, so functions without preconditions, such as the assignment operator, can be safely used on the object after it was moved from. Its worked example draws the line exactly:

```cpp
v.push_back(std::move(str)); // str is now valid but unspecified
str.back();   // undefined behavior if size() == 0: back() has a precondition !empty()
if (!str.empty())
    str.back(); // OK, empty() has no precondition and back() precondition is met
str.clear();  // OK, clear() has no preconditions
```

The rule that falls out: on a moved-from standard library object, call anything with no preconditions (assign to it, ask its size, clear it) and call nothing with preconditions until you have checked them. This is a weaker guarantee than it looks, and it is deliberately weaker so that implementations can leave the cheapest possible state behind. It also connects to [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]]: the precondition is the contract, and the moved-from state is simply a state where you no longer know whether it holds.

`std::unique_ptr` is the notable exception in the other direction. cppreference says that for some types, such as `std::unique_ptr`, the moved-from state is fully specified. That is part of why it is the ownership type you reach for; see [[cs/languages/Cpp/smart-pointers|Smart Pointers in C++]].

Two more specifics from the `std::move` page. Standard library functions called with xvalue arguments may assume the argument is the only reference to the object, so if it was constructed from an lvalue with `std::move`, no aliasing checks are made. And self-move-assignment of standard library types is guaranteed to place the object in a valid but usually unspecified state, illustrated with `v = std::move(v);` leaving the value of `v` unspecified.

> [!example] When the compiler stops generating the move
> cppreference's example program moves four types and prints what happened. `B` holds a `std::string` and an `int` and gets an implicit move constructor that calls the string's move constructor and makes a bitwise copy of the `int`; moving it prints an empty string afterward. `C` derives from `B` and adds `~C() {}`, and the annotation is that the destructor prevents the implicit move constructor; the program's output for `C` is `move failed!`, because `std::move(c1)` silently selected the copy constructor. `D` also declares a destructor but adds `D(D&&) = default;`, which forces a move constructor anyway, and `D` moves successfully. Declaring a destructor did not produce a compile error. It produced a silent performance regression, which is the strongest argument for [[cs/languages/Cpp/the-rule-of-zero-three-five|the rule of zero]] there is.

The generation rule behind that example: cppreference lists that an implicit move constructor is declared only if no user-defined move constructors are provided and there are no user-declared copy constructors, no user-declared copy assignment operators, no user-declared move assignment operators, and no user-declared destructor. When declared and defined, it performs a full member-wise move of the object's direct base subobjects and member subobjects, in their initialization order, using direct initialization with an xvalue argument.

> [!tip] Reading a move at a glance
> Ask three questions in order. Is the expression an rvalue (so an rvalue-reference overload can be selected)? Does an rvalue-reference overload actually exist for this type, or did a user-declared destructor suppress it? And does that overload's author document what it leaves behind? A `std::move` that fails any of the three compiles fine and copies.

## Related Notes

- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - the resource-to-scope binding that moving exists to relocate
- [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] - which declarations suppress the implicit move operations
- [[cs/languages/Cpp/smart-pointers|Smart Pointers in C++]] - move-only ownership, and the one type with a fully specified moved-from state
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - the same word, a stricter rule: the source is statically invalidated rather than left unspecified
- [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]] - the substructural theory both languages are approximating
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - why "unspecified state plus a precondition" is a live hazard
- [[cs/pl/mutable-state-references-effects|Mutable State, References, and Effects]] - value categories as a syntax-level account of identity and mutation

## Sources

- "Value categories," cppreference.com. https://en.cppreference.com/w/cpp/language/value_category.html . Supports type and value category as two independent properties, the three primary categories, the glvalue/prvalue/xvalue/lvalue/rvalue definitions, the note that these terms classify expressions rather than values, and the rule that a variable's name is an lvalue even when its type is an rvalue reference.
- "Move constructors," cppreference.com. https://en.cppreference.com/w/cpp/language/move_constructor.html . Supports the definition and parameter-list requirements, the three contexts in which a move constructor is called, resource transfer leaving the argument in a valid but otherwise indeterminate state, the argument's destructor still running later, copy elision suppressing the call for prvalue initializers since C++17, the conditions for an implicitly declared move constructor, member-wise move in initialization order, and the `A`/`B`/`C`/`D` example whose output shows a user-declared destructor causing a silent fallback to copying.
- "std::move," cppreference.com. https://en.cppreference.com/w/cpp/utility/move.html . Supports `std::move` producing an xvalue and being exactly equivalent to a `static_cast` to rvalue reference type, its return expression, overloads having the option but not the requirement to move, the linked-list illustration, why move constructors internally call `std::move` on members, `std::forward` for forwarding references, the valid-but-unspecified guarantee for standard library moved-from objects with the precondition example, the no-aliasing-checks note, and the self-move-assignment guarantee.
