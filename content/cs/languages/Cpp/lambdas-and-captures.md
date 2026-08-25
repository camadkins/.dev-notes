---
title: Lambdas and Captures
description: "The closure type as an ordinary unnamed class, what capture by copy and by reference actually store, why the call operator is const by default, and the [=] trap."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-25
updated:
aliases:
  - init-capture
---

A lambda expression constructs a closure, an unnamed function object capable of capturing variables in scope. That definition is doing more work than it looks. The result is an object of a real class, and almost every lambda rule that seems arbitrary is a consequence of what that class contains.

> [!note] The idea
> The closure type is an ordinary class with hidden data members, and once you read it that way the rules stop being a list. Captures by copy become unnamed non-static data members. `operator()` is `const` unless you write `mutable`, which is why a by-copy capture is read-only by default. And `[=]` in a member function does not copy the class's data members at all, because the current object is always captured by reference even when the capture default is `=`, so the closure stores a copy of the `this` pointer and reaches through it. The Core Guidelines name that last one exactly: writing `[=]` in a member function appears to capture by value, but actually captures data members by reference, because it actually captures the invisible `this` pointer by value.

## The shape of the expression

The general form is `[captures] (params) specs (optional) except (optional) trailing (optional) { body }`, and the shortest legal form is `[captures] { body }`. `captures` specifies the entities to be captured, `params` is the parameter list of `operator()` of the closure type, and `trailing` gives its return type; if `trailing` is not provided, the return type is automatically deduced. Since C++20 there is also a form with an explicit template parameter list, which is always generic.

The `specs` slot holds a small set of specifiers, each allowed at most once. `mutable` allows the body to modify the objects captured by copy, and to call their non-const member functions. `constexpr` (C++17) explicitly specifies that `operator()` is a constexpr function.

## The closure type

The lambda expression is a prvalue expression of unique unnamed non-union non-aggregate class type, known as the closure type, declared (for the purposes of argument-dependent lookup) in the smallest block scope, class scope, or namespace scope that contains the lambda expression. Unique means every lambda expression has its own type, even two that look identical, which is why you store them in `auto` and why passing one to a template instantiates a fresh specialization.

`operator()` executes the body when invoked, and when accessing a variable it accesses its captured copy (for entities captured by copy) or the original object (for entities captured by reference). The default qualification is the sentence to memorize:

> Unless the keyword `mutable` was used in the lambda specifiers, or an explicit object parameter is present (since C++23), the cv-qualifier of `operator()` is `const` and the objects that were captured by copy are non-modifiable from inside this `operator()`. Explicit `const` qualifier is not allowed.

So `mutable` is not a special lambda feature. It is the absence of `const` on a member function, spelled with a different keyword because the qualifier position is already taken. The [[cs/languages/Cpp/const-correctness|const member function]] rules are the ones in play. `operator()` is never virtual and cannot have the `volatile` qualifier.

The rest of the class follows the same reading. If the lambda captures anything by copy, either implicitly with `[=]` or explicitly with a capture that does not include `&`, the closure type includes unnamed non-static data members, declared in unspecified order, that hold copies of all entities that were so captured. Members corresponding to captures without initializers are direct-initialized when the lambda expression is evaluated. The type of each data member is the type of the corresponding captured entity, except that a captured entity of reference type is captured as a copy of the referenced object (and a reference to a function as an lvalue reference to that function). For entities captured by reference, it is unspecified whether additional data members are declared in the closure type at all.

Since C++20, a closure type with no captures has a defaulted default constructor and defaulted copy and move assignment operators; otherwise it has no default constructor and a deleted copy assignment operator, and cppreference notes this includes the case where there is a capture-default even if it does not actually capture anything. Until C++20, closure types were not `DefaultConstructible` and not `CopyAssignable` at all. A capture-less non-generic lambda additionally has a conversion function to a [[cs/languages/common/c-abi-and-ffi|plain function pointer]], which is how a lambda gets passed to a C API.

> [!warning] Closures do not extend lifetimes
> If a non-reference entity is captured by reference, implicitly or explicitly, and `operator()` of the closure object is invoked after the entity's lifetime has ended, undefined behavior occurs. cppreference states the reason flatly: the C++ closures do not extend the lifetimes of objects captured by reference. The same applies to the lifetime of the current `*this` object captured via `this`. Nothing about a lambda is garbage collected, reference counted, or borrow checked. Compare [[cs/languages/Rust/closures-fn-fnmut-fnonce|Rust's closures]], where the same capture is rejected at compile time by the [[cs/languages/Rust/borrowing-and-lifetimes|borrow checker]].

## Capture syntax and its rules

The capture list is a capture-default, a capture-list, or both. The capture-default is one of `&` and `=`. Individual captures come in a handful of forms: `identifier` is a simple by-copy capture, `&identifier` a simple by-reference capture, `identifier initializer` (C++14) a by-copy capture with an initializer, `this` a simple by-reference capture of the current object, and `*this` (C++17) a simple by-copy capture of the current object.

The consistency rules are small and mechanical. If the capture-default is `&`, subsequent simple captures must not begin with `&`, so `[&, i]` is a by-reference capture except that `i` is captured by copy, while `[&, &i]` is an error. If the capture-default is `=`, subsequent simple captures must begin with `&` or be `*this` (since C++17) or `this` (since C++20), so `[=, &i]` is a by-copy capture except that `i` is captured by reference. Any capture may appear only once, and its name must be different from any parameter name, so `[i, i]{}` and `[i](int i){}` are both errors.

Some things need no capture at all. A lambda expression can use a variable without capturing it if the variable is a non-local variable or has static or thread local storage duration (in which case the variable cannot be captured), or is a reference that has been initialized with a constant expression. It can read the value of a variable without capturing it if the variable has const non-volatile integral or enumeration type and has been initialized with a constant expression, or is `constexpr` and has no mutable members.

## The `[=]` trap

Here is the rule that surprises people, stated by the language and then by the guidelines.

cppreference: the current object (`*this`) can be implicitly captured if either capture default is present, and **if implicitly captured, it is always captured by reference, even if the capture default is `=`**. The implicit capture of `*this` when the capture default is `=` is deprecated since C++20.

The Core Guidelines turn that into F.54, which says that when writing a lambda that captures `this` or any class data member, do not use `[=]` default capture, because it is confusing. Their example is worth the space:

```cpp
class My_class {
    int x = 0;
    void f()
    {
        int i = 0;
        auto lambda = [=] { use(i, x); };   // BAD: "looks like" copy/value capture
        x = 42;
        lambda();                            // calls use(0, 42);
        x = 43;
        lambda();                            // calls use(0, 43);

        auto lambda2 = [i, this] { use(i, x); };  // ok, most explicit and least confusing
    }
};
```

`i` froze at 0 because it really was copied. `x` tracked the assignments because it was never copied; the closure holds a copy of the `this` pointer and dereferences it on every call. If you intend to capture a copy of all class data members, the guidelines point at C++17's `[*this]`.

## Init-capture, and moving into a lambda

A capture with an initializer, called an init-capture (C++14), acts as if it declares and explicitly captures a variable declared with type specifier `auto` and the same initializer, whose declarative region is the body of the lambda expression, so it is not in scope within its own initializer. If the capture is by copy, the introduced non-static data member of the closure object is another way to refer to that variable, meaning the source variable does not actually exist and the type deduction via `auto` and the initialization are applied to the data member directly. If the capture is by reference, the reference variable's lifetime ends when the lifetime of the closure object ends.

cppreference names the two things this unlocks. It is used to capture move-only types with a capture such as `x = std::move(x)`, which is the only way to get a [[cs/languages/Cpp/smart-pointers|`unique_ptr`]] into a closure. And it makes it possible to capture by const reference, with `&cr = std::as_const(x)` or similar.

> [!example] Init-capture in one expression
> cppreference's example:
> ```cpp
> int x = 4;
> auto y = [&r = x, x = x + 1]() -> int
> {
>     r += 2;
>     return x * x;
> }();  // updates ::x to 6 and initializes y to 25.
> ```
> `r` is a reference to the outer `x`, and the capture named `x` is a *new* entity initialized from the outer `x` plus one, since a capture's initializer is evaluated in the enclosing scope while the captured name lives only in the body. Body reads `x` as 5 and returns 25; `r += 2` pushes the outer `x` from 4 to 6.

## Choosing the capture

The Core Guidelines split the decision on one axis, lifetime.

**F.52: prefer capturing by reference in lambdas that will be used locally, including passed to algorithms.** For efficiency and correctness you nearly always want to capture by reference when using the lambda locally, including in parallel algorithms that are local because they join before returning. The efficiency consideration is that most types are cheaper to [[cs/dsa/pass-by-value-and-pass-by-reference|pass by reference]] than by value; the correctness consideration is that many calls want to perform side effects on the original object at the call site, and passing by value prevents this. The guidelines add an honest caveat: there is no simple way to capture by reference to const to get the efficiency for a local call but also prevent side effects. Their example passes a large network message to `std::for_each` with `[&message]`, since copying the message is neither efficient nor necessarily possible. Most [[cs/languages/Cpp/stl-algorithms|STL algorithm]] predicates fall into this case.

**F.53: avoid capturing by reference in lambdas that will be used non-locally**, including returned, stored on the heap, or passed to [[cs/systems/processes-and-threads|another thread]]. Pointers and references to locals should not outlive their scope, and a lambda that captures by reference is just another place to store a reference to a local object. Their bad example queues `[&] { process(local); }` on a thread pool and notes that after the scope exits, `local` no longer exists, so the `process()` call has undefined behavior; the good version uses `[=]` so a copy is always available. If a non-local pointer must be captured, they suggest `unique_ptr`, which handles both lifetime and synchronization, and if the `this` pointer must be captured, `[*this]`, which creates a copy of the entire object.

The rule underneath both is one question: will this closure still exist when the enclosing scope is gone? Local means reference. Escaping means copy. The general closure machinery this all instantiates is in [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]].

## Related Notes

- [[cs/languages/Cpp/const-correctness|Const Correctness]] - why `operator()` being const by default is the same rule as any const member function
- [[cs/languages/Cpp/stl-algorithms|STL Algorithms]] - the main consumer of lambdas, and where F.52 applies
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - what `x = std::move(x)` in an init-capture is doing
- [[cs/languages/Cpp/smart-pointers|Smart Pointers in C++]] - the move-only type init-capture exists to carry
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - generic lambdas, and why a unique closure type matters to instantiation
- [[cs/languages/Rust/closures-fn-fnmut-fnonce|Closures: Fn, FnMut, FnOnce]] - the same capture question answered with three traits and a checker
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - closures as a general language mechanism
- [[cs/languages/Python/decorators|Decorators]] - closures over a captured environment in a language with no capture list

## Sources

- "Lambda expressions," cppreference.com. https://en.cppreference.com/w/cpp/language/lambda.html . Supports the closure definition, the syntax forms and the roles of `captures`, `params`, `specs`, and `trailing`, the `mutable` and `constexpr` specifier effects, the closure type as a unique unnamed non-union non-aggregate class declared in the smallest enclosing scope, `operator()` accessing the captured copy or the original object, the const-by-default rule and the ban on an explicit `const` qualifier, the never-virtual and no-volatile constraints, the unnamed non-static data members holding by-copy captures with their initialization and type rules, the unspecified status of by-reference capture members, the C++20 and pre-C++20 default constructor and copy assignment rules, the function pointer conversion for capture-less non-generic lambdas, the dangling-reference undefined behavior and "closures do not extend the lifetimes" statement, the capture-default and capture forms, the `[&, i]` / `[&, &i]` and `[=, &i]` consistency rules, the repeated-capture and parameter-name errors, the use-without-capture and read-without-capture conditions, the always-by-reference implicit capture of `*this` with its C++20 deprecation, and the init-capture semantics with the `std::move` and `std::as_const` uses and the `[&r = x, x = x + 1]` example and its stated result.
- "C++ Core Guidelines," Bjarne Stroustrup and Herb Sutter (eds.), isocpp.github.io. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports F.52 (reasons, the no-capture-by-const-reference caveat, and the `for_each` network message example), F.53 (reasons, the thread pool bad and good examples, and the `unique_ptr` and `[*this]` suggestions), and F.54 (the `[=]`-appears-to-capture-by-value explanation and the `My_class` example with its stated call results).
