---
title: Template Specialization, Full and Partial
description: "Full and partial specialization, the partial order that decides which one applies, and why function templates get overloading instead of partial specialization."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-17
updated:
aliases:
  - Partial Specialization
  - Explicit Specialization
  - Why Function Templates Cannot Be Partially Specialized
---

The smallest useful specialization in C++ is a two-line answer to a yes-or-no question about a type:

```cpp
template<typename T>  struct is_void       : std::false_type {};
template<>            struct is_void<void> : std::true_type  {};
```

The primary template says no. One explicit specialization says yes for one argument. cppreference gives exactly this pair as its introductory example, with static assertions confirming that for any type other than `void` the class derives from `false_type`, and that when `T` is `void` it derives from `true_type`. Every [[cs/languages/Cpp/type-traits-and-tag-dispatch|type trait]] is built on that shape, and partial specialization is what turns it from a lookup table into something that can answer questions about infinite families of types.

> [!note] The idea
> Partial specialization is [[cs/pl/records-variants-and-pattern-matching|pattern matching]] over the structure of a type. `A<T, T*, I>` matches whenever the second argument is a pointer to the first, binding `T` and `I` along the way, in the same way a match arm destructures a value. What makes it a language feature rather than a convenience is the resolution rule: candidates are ranked by a *partial* order, and the standard leaves genuinely incomparable pairs unresolved. That is why function templates were excluded. They already had an ordering mechanism, overload resolution, and the two do not compose: a specialization of a function template is not an overload and never participates in choosing one.

## What can be specialized, and by how much

Full specialization has a long list. cppreference states that a function template, class template, variable template, member function of a class template, static data member of a class template, member class, member enumeration, member class template, member function template, and member variable template can all be fully specialized.

Partial specialization has a short one. It allows customizing class and variable templates for a given category of template arguments, and that is all. Function templates are absent, and so the standard idiom for "a different implementation for pointers" is a second overload, not a second specialization.

The argument list of a partial specialization is constrained in ways that mostly amount to *it has to be deducible and it has to actually specialize something*. cppreference lists them: the argument list cannot be identical to the non-specialized argument list, the specialization has to be more specialized than the primary template, default arguments cannot appear, a pack expansion must be the last argument, and a non-type argument expression may use template parameters only as long as the parameter appears at least once outside a non-deduced context. So `template<int I> struct A<I + 5, I * 2>` is an error, because `I` is not deducible from either position.

One rule catches people writing library code: cppreference states that partial template specializations are not found by name lookup, and only if the primary template is found by name lookup are its partial specializations considered. A `using` declaration that makes the primary visible makes the partial specializations visible too, even ones declared afterwards in a different namespace block.

## The partial order, and the case it cannot decide

When a class template is instantiated and partial specializations exist, cppreference gives three outcomes: if only one specialization matches, it is used; if more than one matches, partial order rules pick the most specialized one, and it is used if it is unique; if none match, the primary template is used. The parenthetical in the second case is the interesting one. If the most specialized specialization is not unique, the program cannot be compiled.

The informal definition is the one to memorize: A is more specialized than B means A accepts a subset of the types that B accepts. The formal one is stranger and worth knowing because it explains the failures. Each partial specialization is converted to a fictitious function template taking one parameter whose type is the class template specialization with all of that partial specialization's arguments, and the two are then ranked as if for function template overloading. Specialization ordering is not a separate algorithm. It is overload resolution, run on templates that do not exist.

cppreference works the ambiguity. Given a primary `A<T1, T2, I>` and, among others, a partial specialization for `A<T, T2, I>` where the first argument is a pointer and another for `A<X, T*, I>` where the second is a pointer, the instantiation `A<int*, int*, 2>` matches both, and neither one is more specialized than the other. Both arms describe a strictly smaller set of types than the primary, but neither set contains the other. That is what "partial" means in [[cs/math/relations-and-equivalence|partial order]]: not every pair of elements needs to be comparable. The language has no tiebreaker to fall back on, so it stops.

## Why function templates were left out

The usual explanation is that function templates already have overloading and a second mechanism would be redundant. The sharper explanation is that specializations and overloads are resolved at different times, and mixing them produces results that look wrong.

cppreference states the rule: only non-template and primary template overloads participate in overload resolution, specializations are not overloads and are not considered, and only after overload resolution selects the best-matching primary function template are its specializations examined to see if one is a better match. Its example is three lines and should be read twice:

```cpp
template<class T> void f(T);    // #1: overload for all types
template<>        void f(int*); // #2: specialization of #1 for pointers to int
template<class T> void f(T*);   // #3: overload for all pointer types

f(new int(1));                  // calls #3
```

`#2` is a perfect match for `int*`. It is not called. Overload resolution runs over `#1` and `#3`, picks `#3` because it is the better match, and then looks for specializations *of #3*, of which there are none. `#2` was a specialization of the losing template and never entered the competition. cppreference's own comment on this is that it is important to remember this rule while ordering the header files of a translation unit, which is a polite way of saying that whether your specialization does anything depends on which declarations the reader of your header has seen so far.

Two related hazards live nearby. A specialization must be declared before the first use that would cause implicit instantiation, in every translation unit where such use occurs, so a specialization included too late is not an error at the point of specialization but a silently different program in that translation unit. And a function with the same name and the same argument list as a specialization is not a specialization, it is an overload, which means one missing `template<>` changes which machine you are talking to.

> [!warning] Specifiers do not travel from the template to the specialization
> cppreference states that whether an explicit specialization of a function or variable template is `inline`, `constexpr`, `constinit`, or `consteval` is determined by the explicit specialization itself, regardless of whether the primary template is declared with that specifier, and that attributes appearing in the declaration of a template have no effect on an explicit specialization of it. Its example declares `template<class T> inline T g(T)` and then a non-`inline` specialization for `int`, which is legal and means what it says. A specialization is a separate entity that happens to answer to the same name.

Rust reached the same design question from the other side and has not shipped an answer; see [[cs/languages/Rust/specialization-and-why-it-is-still-unstable|specialization and why it is still unstable]] for what goes wrong when overlapping impls meet a type system that has to prove soundness first. C++ has no such obligation, which is why it could ship the feature in 1998 and spend the next twenty years discovering the edges, including the one that turned into [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE]]: `std::enable_if` is nothing but a class template with a partial specialization for `true`, used to make a substitution fail on purpose.

## Related Notes

- [[cs/languages/Cpp/type-traits-and-tag-dispatch|Type Traits and Tag Dispatch]] - what full and partial specialization were mostly used to build
- [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE and enable_if]] - a specialization used for its failure rather than its result
- [[cs/languages/Cpp/concepts-and-requires-clauses|Concepts and requires Clauses]] - constraint subsumption, the second partial order C++ uses to pick an implementation
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - why a partial order is allowed to leave two candidates incomparable
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the value-level version of what a partial specialization does to a type
- [[cs/languages/Rust/specialization-and-why-it-is-still-unstable|Specialization and Why It Is Still Unstable]] - the same feature blocked by a soundness requirement C++ never had

## Sources

- "Explicit (full) specialization," cppreference.com. https://en.cppreference.com/w/cpp/language/template_specialization.html . Supports the `is_void` example, the list of entities that can be fully specialized, the requirement that a specialization be declared before the first use causing implicit instantiation in every translation unit, the rule that a function with the same name and argument list as a specialization is not a specialization, and the rule that `inline`, `constexpr`, and attribute specifiers are determined by the specialization itself rather than the primary template.
- "Partial specialization," cppreference.com. https://en.cppreference.com/w/cpp/language/partial_specialization.html . Supports partial specialization being limited to class and variable templates, the argument-list restrictions including deducibility, the rule that partial specializations are not found by name lookup, the three-way selection between one match, multiple matches, and none, the informal and formal definitions of more-specialized-than including the fictitious function template conversion, and the worked ambiguity where neither candidate is more specialized.
- "Function template," cppreference.com. https://en.cppreference.com/w/cpp/language/function_template.html . Supports the rule that specializations are not overloads and are examined only after overload resolution picks a primary template, the three-declaration example where the call selects the pointer overload rather than the perfect-match specialization, and the note about header ordering.
