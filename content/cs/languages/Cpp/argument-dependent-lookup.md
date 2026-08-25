---
title: Argument-Dependent Lookup
description: "ADL makes the free functions in a type's namespace part of that type's interface, which is what makes the swap idiom work and what makes every unqualified call inside a template an extension point you cannot take back."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-11
updated:
aliases:
  - ADL
---

There is no `operator<<` in the global namespace, and yet `std::cout << "Test\n"` compiles. cppreference explains why in one line: argument-dependent lookup examines the `std` namespace because the left argument is in `std`, and finds `std::operator<<`. The same page notes that `std::cout << endl` does not compile, because that is not a function call to `endl()`, so ADL does not apply, while `endl(std::cout)` does compile for exactly the symmetric reason.

ADL, which cppreference also records under the name Koenig lookup, is the set of rules for looking up unqualified function names in function-call expressions, including implicit calls to overloaded operators, by searching the namespaces of the arguments in addition to the scopes that ordinary unqualified lookup considers. Stated that way it sounds like a convenience for operators. It is considerably more than that.

> [!note] The idea
> ADL promotes a namespace into an interface. cppreference states the consequence directly: because of argument-dependent lookup, non-member functions and non-member operators defined in the same namespace as a class are considered part of the public interface of that class. That is the mechanism that lets a generic algorithm written years earlier call your `swap` on a type that did not exist when the algorithm was written, with no registration, no inheritance, and no trait specialization. It is also why every unqualified call inside a template body is a customization point whether or not you meant it as one, and why the language has no way to declare that a name is *not* one.

## What counts as associated

The rules are mechanical. For each argument in the call, cppreference derives an associated set of namespaces and classes. Arguments of fundamental type contribute nothing. For a class type the set contains the class itself, all of its direct and indirect base classes if it is complete, the class it is a member of if it is nested, and the innermost enclosing namespaces of all of those. Enumeration types contribute the innermost enclosing namespace of their declaration, plus the enclosing class if the enumeration is a member.

The rule for templates is the one that surprises people. For arguments whose type is a class template specialization, cppreference adds the types of all template arguments provided for type template parameters, skipping non-type template parameters and skipping template template parameters. So `std::vector<MyType>` drags your namespace into the lookup, while `std::vector<int>` does not, and `std::array<int, 8>` does not gain anything from the `8`.

There is a switch that turns the whole thing off. cppreference states that ADL is not considered if the lookup set produced by usual unqualified lookup contains a declaration of a class member, a declaration of a function at block scope that is not a using declaration, or any declaration that is not a function or a function template, explicitly including a function object or another variable whose name conflicts. That last clause is worth remembering: putting a function object in scope with the same name as the function you wanted suppresses ADL entirely.

## Why swap depends on it

cppreference calls the swap idiom the established consequence of ADL and spells out both failure modes it avoids:

```cpp
using std::swap;
swap(obj1, obj2);
```

Calling `std::swap(obj1, obj2)` directly would not consider the user-defined `swap()` functions that could be defined in the same namespace as the types of the arguments. Calling unqualified `swap(obj1, obj2)` on its own would call nothing if no user-defined overload was provided. The two-line idiom gets both: the `using` declaration puts the fallback in scope, and the unqualified call lets ADL find the better one. cppreference adds that `std::iter_swap` and all other standard library algorithms use this approach when dealing with Swappable types.

The same pattern appears where the language, not the library, does the lookup. cppreference lists three contexts where ADL-only lookup takes place, meaning lookup in associated namespaces alone: the non-member `begin` and `end` used by the range-based `for` loop when member lookup fails, the dependent name lookup from the point of template instantiation, and the non-member `get` used by structured binding declarations for tuple-like types. Range-based `for` over your own type works because the language went looking in your namespace.

## The hidden friend

cppreference notes that ADL can find a friend function, typically an overloaded operator, that is defined entirely within a class or class template even if it was never declared at namespace level. Its `number<T>` example defines `friend number gcd(number x, number y)` inside the template and comments that unless a matching declaration is provided, `gcd` is an invisible except through ADL member of its namespace. The call `gcd(a, b)` on two `number<double>` values succeeds; `gcd(3, 4)` is an error, because `int` brings no associated namespace with it.

A function that exists only for the types it was written for, and is invisible to everything else, is a genuinely useful thing to be able to declare. It arrived as a side effect.

## The customization problem

The flip side is that you cannot write an unqualified call inside a template and mean it as an implementation detail. The C++ Core Guidelines devote rule T.69 to this, listing the three major ways to let calling code customize a template: call a member function, call a non-member function without qualification, or invoke a trait. Its note is the operational advice: if you intend to call your own helper function with a value that depends on a template type parameter, put it in a `detail` namespace and qualify the call, because an unqualified call becomes a customization point where any function of that name in the namespace of the argument's type can be invoked, and this can cause problems like unintentionally invoking unconstrained function templates.

That is not hypothetical. The Guidelines observe elsewhere that an unconstrained template defined in the same namespace as a type can be found by ADL and is therefore highly visible, add that the rule against this should not be necessary but the committee cannot agree to exclude unconstrained templates from ADL, and concede that the standard library violates this widely by putting many unconstrained templates and types into the single namespace `std`.

The ODR hazard is the other cost, and it is the reason [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|two-phase lookup]] narrows ordinary lookup to the definition context while leaving ADL open to both. cppreference's own note follows from it: name lookup rules make it impractical to declare operators in the global or a user-defined namespace that operate on types from the `std` namespace, because such operators would not be looked up from template instantiations such as the standard library algorithms.

> [!warning] ADL is an open extension point, not a coherence rule
> Compare [[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|the orphan rule]]. Rust forbids implementing a foreign trait for a foreign type precisely so that two crates cannot supply conflicting implementations that the compiler would then have to choose between. C++ has no such rule, because ADL never had a registry to be coherent about. The protection is negative instead: cppreference notes that the reason ordinary lookup is restricted to the definition context is that if it were not, an instantiation could have two different definitions in two translation units, and such a violation may not be detected by the linker, leading to one or the other being used in both instances. Where [[cs/pl/type-classes-and-traits|type classes]] make conflicting instances a compile error, C++ makes them your responsibility.

The whole design sits on top of ordinary [[cs/pl/scoping-binding-and-closures|name binding]] rather than replacing it. The two sets are merged, with using directives in associated namespaces ignored, namespace-scoped friend functions in associated classes made visible, and everything that is not a function or function template dropped so that variables do not collide with the call.

## Related Notes

- [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|Template Instantiation and the Two-Phase Rule]] - why ADL sees the instantiation context and ordinary lookup does not
- [[cs/languages/Cpp/dependent-names-and-the-typename-keyword|Dependent Names and the typename Keyword]] - the other half of what happens to a name inside a template
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the ordinary lookup ADL is bolted onto
- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - the registry-based answer to the same customization problem
- [[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|The Orphan Rule and the Newtype Pattern]] - a coherence rule C++ has no place to put
- [[cs/languages/Cpp/stl-algorithms|STL Algorithms]] - the library that leans on the swap idiom throughout

## Sources

- "Argument-dependent lookup," cppreference.com. https://en.cppreference.com/w/cpp/language/adl.html . Supports the definition and the Koenig lookup name, the `std::cout` and `endl` examples, the three conditions that suppress ADL, the associated-set rules for fundamental, class, enumeration, and class template specialization arguments, the merge rules, non-member functions in a class's namespace counting as part of its interface, the `using std::swap` idiom with both failure modes and the note about standard library algorithms, the hidden friend `gcd` example, the three ADL-only lookup contexts, and the impracticality of overloading operators for standard library types.
- "Dependent names," cppreference.com. https://en.cppreference.com/w/cpp/language/dependent_name.html . Supports the split between non-ADL lookup from the definition context and ADL from both contexts, and the ODR rationale including the linker's inability to detect the resulting conflict.
- "C++ Core Guidelines," isocpp.github.io. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports rule T.69's three ways to customize a template, the advice to qualify helper calls into a `detail` namespace, the warning about unintentionally invoking unconstrained function templates, and the observations that unconstrained templates in a type's namespace are highly visible through ADL and that the standard library does this widely.
