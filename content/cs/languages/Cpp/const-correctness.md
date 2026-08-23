---
title: Const Correctness
description: "const on values, pointers, references, and member functions, why constness is not transitive, and what the qualifier actually promises."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-02-11
updated:
aliases:
  - const
  - cv-qualifiers
  - const member functions
  - mutable
---

Two lines of C++ that look identical differ in whether they are legal:

```cpp
int n1 = 0;              // non-const object
const int n2 = 0;        // const object
const int& r1 = n1;      // reference to const bound to non-const object
const int& r2 = n2;      // reference to const bound to const object
const_cast<int&>(r1) = 2;   // OK: modifies non-const object n1
// const_cast<int&>(r2) = 2; // undefined behavior: attempt to modify const object n2
```

Same cast, same reference type, opposite verdicts. cppreference's own example says so. The difference is not in the reference; it is in how the underlying object was created.

> [!note] The idea
> `const` on a declaration and `const` on an access path are different promises. A **const object** is one whose type is const-qualified, or a non-`mutable` subobject of a const object, and such an object cannot be modified: attempting to do so directly is a compile-time error, and attempting to do so indirectly (for example by modifying it through a reference or pointer to non-const type) results in undefined behavior. A `const T&` parameter, by contrast, says only that *this* path will not write. The Core Guidelines put the consequence bluntly: **constness is not transitive**. A const member function can change the value of `mutable` members and the value of objects accessed through non-const pointers. So `const` is a checked promise about one access path, plus a hard property of the object only when the object itself was declared const.

## Four types, one group

Any (possibly incomplete) type other than a function type or reference type is a type in a group of four distinct but related types: a cv-unqualified version, a const-qualified version, a volatile-qualified version, and a const-volatile-qualified version. Those four have the same representation and alignment requirements. Array types are considered to have the same cv-qualification as their element types, and each cv-qualifier can appear at most once in any cv-qualifier sequence, so `const const` is not a valid sequence.

A const object is an object whose type is const-qualified, or a non-`mutable` subobject of a const object. The prohibition is stated in two halves and the split is what people miss. Direct modification is a compile-time error. Indirect modification, through a reference or pointer to non-const type, is undefined behavior, which puts it in the same category as the failures in [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]]: no diagnostic required, and the compiler may optimize on the assumption it never happens.

That is why the two `const_cast` lines above differ. `n1` is not a const object, so writing through a stripped reference to it is fine. `n2` is a const object, so the same write is undefined, and no amount of casting changes what `n2` is.

## Where the qualifier sits on a pointer

A pointer declaration has two positions a `const` can occupy, and cppreference's `mutable` rules make the distinction visible. `mutable` may appear in the declaration of non-static class members of non-reference, non-const type, which yields:

```cpp
class X
{
    mutable const int* p;   // OK
    mutable int* const q;   // ill-formed
    mutable int& r;         // ill-formed
};
```

`const int* p` is a non-const pointer to const int, so `mutable` applies fine. `int* const q` is a const pointer, so the member is of const type and `mutable` is rejected. The reference case is rejected for the separate reason that references are excluded outright.

The conversion direction between them is fixed. References and pointers to cv-qualified types can be implicitly converted to references and pointers to more cv-qualified types, and to go the other way, from a reference or pointer to a cv-qualified type toward a less cv-qualified one, `const_cast` must be used. There is a partial ordering by increasing restriction: unqualified is less qualified than const, unqualified is less than volatile, and both const and volatile are less than const volatile. Adding is free and implicit; removing requires you to write the cast, which is the language making the dangerous direction visible in the source. The general treatment of qualifier-driven conversion is in [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]].

## const on member functions

An implicit object member function can be declared with a cv-qualifier sequence (`const`, `volatile`, or a combination), appearing after the parameter list. Functions with different cv-qualifier sequences, or none, **have different types and so may overload each other**. That is the mechanism behind the const/non-const pair you see on every container's `operator[]` and `begin()`.

Inside the body, `*this` is cv-qualified. In a member function with a `const` qualifier, only other member functions with a `const` qualifier may be called normally, though a non-const member function may still be called if `const_cast` is applied, or through an access path that does not involve `this`. That escape clause is the whole reason the next section exists.

cppreference's example shows the overload pair doing real work:

```cpp
struct Array
{
    std::vector<int> data;
    Array(int sz) : data(sz) {}
    int operator[](int idx) const   // the this pointer has type const Array*
    { return data[idx]; }
    int& operator[](int idx)        // the this pointer has type Array*
    { return data[idx]; }
};
```

With `Array a(10);`, `a[1] = 1;` is fine because the type of `a[1]` is `int&`. With `const Array ca(10);`, `ca[1] = 2;` is an error because the type of `ca[1]` is `int`. The constness of the object selects the overload, and the overload decides whether you get a writable handle back.

Since C++23 there is a way out of writing the pair twice. A non-static non-virtual member function not declared with a cv-qualifier or ref-qualifier can take an explicit object parameter, denoted with the prefixed keyword `this`, so `void foo(this X const& self, int i);` means the same as `void foo(int i) const&;`. For member function templates the explicit object parameter allows deduction of type and value category, a feature called "deducing `this`", and cppreference notes this makes it possible to deduplicate const and non-const member functions.

## mutable, and why constness is not transitive

`mutable` permits modification of the class member declared `mutable` even if the containing object is declared const. It is used to specify that the member does not affect the externally visible state of the class, as often used for [[cs/systems/concurrency-primitives|mutexes]], memo caches, lazy evaluation, and access instrumentation.

The mutex case is idiomatic enough to have a name. cppreference's `ThreadsafeCounter` writes `mutable std::mutex m;` with the comment: the "M&M rule": mutable and mutex go together. A `get() const` that takes a `std::lock_guard` on that mutex is modifying the mutex while promising not to modify the object, which is coherent exactly because locking is not part of the observable state. The library-wide reading of const as "safe to call concurrently" in [[cs/languages/Cpp/stl-containers|STL Containers]] rests on this.

The Core Guidelines walk the same road from the design side. A memoizing `get_val` is logically constant, so we would like to make it a const member, and to do that we still need to mutate the cache. People sometimes resort to `const_cast<Cache&>(cache).set(x, val)`, which the guidelines label ugly; the better solution is to state that the cache is `mutable` even for a const object. Then the summary sentence:

> Another way of saying this is that constness is not transitive. It is possible for a const member function to change the value of mutable members and the value of objects accessed through non-const pointers. It is the job of the class to ensure such mutation is done only when it makes sense according to the semantics (invariants) it offers to its users.

The compiler enforces a shallow rule. The meaningful rule, that a const call does not change what callers can observe, is a class invariant you maintain by hand. This is the same gap that separates [[cs/languages/Rust/borrowing-and-lifetimes|Rust's `&`/`&mut` split]], which is checked transitively and exclusively, from C++'s `const`, which is neither.

## The defaults worth adopting

The Core Guidelines open their constants section with three reasons that are worth reading as one argument: you cannot have a [[cs/security/race-conditions-and-toctou|race condition]] on a constant, it is easier to reason about a program when many of the objects cannot change their values, and interfaces that promise no change of objects passed as arguments greatly increase readability.

**Con.1: By default, make objects immutable.** Immutable objects are easier to reason about, so make objects non-const only when there is a need to change their value, which prevents accidental or hard-to-notice change of value. Two exceptions are named: a local variable returned by value that is cheaper to move than copy should not be declared const, because it can force an unnecessary copy (see [[cs/languages/Cpp/move-semantics-and-rvalue-references|move semantics]]); and the rule is not enforced for function parameters passed by value, since `void g(const int i)` is pedantic and a parameter is a local variable whose changes are local.

**Con.2: By default, make member functions const.** A member function should be marked const unless it changes the object's observable state, which gives a more precise statement of design intent, better readability, more errors caught by the compiler, and sometimes more optimization opportunities. The failure is contagious: a `Point::getx()` left non-const cannot be called on a `const Point&` at all, so one missing qualifier propagates out to every caller.

**Con.3: By default, pass pointers and references to const.** To avoid a called function unexpectedly changing the value, since it is far easier to reason about programs when called functions do not modify state. `void f(char* p);` leaves you guessing (assume it does), `void g(const char* p);` does not. The guidelines add the reader's rule that makes this matter: a reader of code must assume that a function taking a plain `T*` or `T&` will modify the object referred to, and if it does not now, it might do so later without forcing recompilation.

**Con.4: Use const to define objects with values that do not change after construction.** As `x` in a loop is not const, we must assume that it is modified somewhere in the loop.

**Con.5: Use constexpr for values that can be computed at compile time**, for better performance, better compile-time checking, guaranteed compile-time evaluation, and no possibility of race conditions. `const double y = f(2);` is still possible run-time evaluation, while `constexpr double z = f(2);` is an error unless `f(2)` can be evaluated at compile time. Const and constexpr answer different questions.

> [!warning] Two footnotes that surprise people
> The `const` qualifier used on the declaration of a non-local, non-volatile, non-template (since C++14), non-inline (since C++17) variable that is not declared `extern` gives it **internal linkage**, and cppreference flags that this is different from C, where const file-scope variables have external linkage. A header-level `const int kMax = 10;` therefore behaves differently across the two languages.
> On the modernization side, the Core Guidelines note that some code and libraries offer functions declaring a `T*` even though those functions do not modify that `T`, and list three responses: update the library to be const-correct (the preferred long-term solution), cast away const (best avoided), or provide a wrapper function such as `void f(const int* p) { f(const_cast<int*>(p)); }`. That wrapper is a patch for when the declaration cannot be modified, for example because it lives in a library you do not control.

> [!tip] What the promise actually is
> `const` on a parameter is a promise about your code, checked by the compiler and defeatable with a cast. `const` on the object's definition is a property of the object, and defeating it is undefined behavior rather than a bad style choice. Write the first everywhere by default; reach for the second when the value genuinely never changes after construction.

## Related Notes

- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - what "when an object is first created" is doing the work of here
- [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] - the special members whose signatures const-correctness shapes
- [[cs/languages/Cpp/stl-containers|STL Containers]] - the library reading of const as concurrently callable
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - why a returned local should not be const
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - immutability checked transitively and exclusively instead
- [[cs/pl/mutable-state-references-effects|Mutable State, References, and Effects]] - the general question of who may write what
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - qualification conversions as a subtyping relation
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what a shallow static check can and cannot buy
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - the cost of modifying a const object indirectly

## Sources

- "cv (const and volatile) type qualifiers," cppreference.com. https://en.cppreference.com/w/cpp/language/cv.html . Supports the four-type group with shared representation and alignment, array cv-qualification, the definition of a const object and the compile-error / undefined-behavior split for direct and indirect modification, the at-most-once rule for cv-qualifiers, the `mutable` specifier and its declaration restrictions with the `const int*` / `int* const` / `int&` examples, the mutable-does-not-affect-externally-visible-state note and the "M&M rule" mutex example, the partial ordering of cv-qualifiers, implicit conversion toward more cv-qualified and the `const_cast` requirement in the other direction, the internal-linkage note and its contrast with C, and the `const_cast` example whose two lines differ in legality.
- "Member functions," cppreference.com. https://en.cppreference.com/w/cpp/language/member_functions.html . Supports cv-qualifier sequences on implicit object member functions, that differing sequences give different types and may overload each other, that `*this` is cv-qualified in the body and only const member functions may be called normally from a const one (with the `const_cast` and non-`this` access-path escapes), the `Array::operator[]` const/non-const pair and its `a[1]` versus `ca[1]` outcome, and the C++23 explicit object parameter with "deducing this" deduplicating const and non-const member functions.
- "C++ Core Guidelines," Bjarne Stroustrup and Herb Sutter (eds.), isocpp.github.io. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports the Con section's opening rationale, Con.1 through Con.5 with their stated reasons, examples, and exceptions, the "constness is not transitive" statement about mutable members and non-const pointers, the memoizing `get_val` case preferring `mutable` over `const_cast`, the reader's assumption about plain `T*` and `T&`, and the three responses to non-const-correct libraries including the wrapper function.
