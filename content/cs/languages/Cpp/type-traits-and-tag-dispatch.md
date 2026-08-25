---
title: Type Traits and Tag Dispatch
description: "Asking a question about a type at compile time, and the trick that turned the answer into a function argument so overload resolution could do the branching."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-30
updated:
aliases: []
---

cppreference describes the `<type_traits>` header in one line: it provides compile-time template-based interfaces to query the properties of types. That is a modest description of something unusual. A trait is a function whose argument is a type, whose body is a template specialization, and whose return value exists before the program runs.

Having the answer is only half the problem. The other half is doing something different depending on it, and until C++17 gave the language `if constexpr` there was no way to write a branch that discards the untaken side. Tag dispatch is what filled that gap, and it is more interesting than the usual "select an overload" summary suggests.

> [!note] The idea
> Tag dispatch converts a compile-time answer into a runtime function argument that nobody passes on purpose and nobody reads. The tag types are empty, so the argument costs nothing; its entire job is to be a type that overload resolution can look at. What makes the standard library's version clever rather than merely cute is that the tags **inherit from each other**. `forward_iterator_tag` derives from `input_iterator_tag`, and so on up to `contiguous_iterator_tag`. An algorithm that needs at least a bidirectional iterator takes `bidirectional_iterator_tag`, and a random-access tag converts to it by an ordinary derived-to-base conversion, which overload resolution already ranks as worse than an exact match. The ordering of iterator capabilities was encoded in a class hierarchy, so that the compiler's existing preference for exact matches over base-class conversions would pick the most specific implementation. C++ had subsumption twenty years before it had concepts. It was spelled `public`.

## The trait half

The shape is the one from [[cs/languages/Cpp/template-specialization-full-and-partial|full and partial specialization]]: a primary template gives the default answer, and specializations give the exceptions. cppreference's helper classes make the answer uniform, with `std::integral_constant` as a compile-time constant of specified type with specified value, and `true_type` and `false_type` as its `bool` instantiations, so that every predicate trait can be read the same way.

The Core Guidelines describe the family in a sentence worth keeping, since it covers forms people do not always recognize as traits: a trait is usually a type alias to compute a type, a `constexpr` function to compute a value, or a traditional traits template to be specialized on the user's type. The first is `std::remove_reference_t`, the second is `std::is_trivially_copyable_v`, and the third is the customization hook, which is the reason traits are also an extension mechanism and not only a query.

## The dispatch half

cppreference's iterator tags page defines six empty structs and one inheritance chain:

```cpp
struct input_iterator_tag {};
struct forward_iterator_tag       : public input_iterator_tag {};
struct bidirectional_iterator_tag : public forward_iterator_tag {};
struct random_access_iterator_tag : public bidirectional_iterator_tag {};
struct contiguous_iterator_tag    : public random_access_iterator_tag {};
```

Each tag is an empty type. cppreference states that for every iterator type, `std::iterator_traits<It>::iterator_category` must be defined as an alias to one of these tags to indicate the most specific category that the iterator is in, and that the tags carry information that can be used to select the most efficient algorithms for the specific requirement set implied by the category. It names the technique directly: the common approach to algorithm selection based on iterator category tags is a dispatcher function, with `std::enable_if` as the alternative.

The Core Guidelines' rule T.65 gives the general recipe, using a simplified `std::copy`. Two empty tag types are declared, a `copy_trait` template maps a value type to one of them with a specialization for `int`, two `copy_helper` overloads take the tags, and the public `copy` computes the tag type and constructs one to pass along. The comments carry the payoff: the `vector<int>` call uses memmove, and the `vector<string>` call uses a loop calling copy constructors. The Guidelines call this a general and powerful technique for compile-time algorithm selection, and its reasons include performance outright.

That example is the reason the technique matters rather than being a curiosity. A [[cs/dsa/arrays|contiguous array]] of trivially copyable elements can be moved with a single bulk memory operation, and an array of objects with nontrivial copy constructors cannot. The difference is not a micro-optimization; it is a different algorithm with a different cost model, selected by a question about the element type that nothing at runtime could answer more cheaply.

## What the tags could not do

Two admissions on the same cppreference page mark the boundary the tag scheme hit.

The first is that a tag is an assertion, not a check. Since C++20, cppreference states that each iterator concept is not satisfied if the required operations are not supported, regardless of the tag. Before that, a type claiming `random_access_iterator_tag` was believed. The tag was a promise the author made, and nothing verified it, which is exactly the gap [[cs/languages/Cpp/concepts-and-requires-clauses|concepts]] closed by making the requirement a checkable predicate rather than a label.

The second is that the scheme ran out of room. cppreference notes there is no separate tag for a contiguous iterator in the legacy scheme, so it is not possible to tell one from its `iterator_category`, and that to define a specialized algorithm for contiguous iterators you should use the `contiguous_iterator` concept. Adding a category to a hierarchy that libraries were already pattern matching on was not a change that could be made compatibly. The fallback rules show the same strain: cppreference states that if `iterator_concept` is not provided, `iterator_category` is used, and if neither is provided and `iterator_traits` is not specialized, `random_access_iterator_tag` is assumed.

## Why this counts as dispatch

The comparison worth drawing is with [[cs/pl/objects-classes-and-dispatch|virtual dispatch]], because tag dispatch is structurally the same idea moved to a different phase. Both select an implementation based on a type. Virtual dispatch reads a pointer at runtime and indexes a table. Tag dispatch reads a type at compile time and runs overload resolution. Both use an inheritance hierarchy to express "more specific than," and in both cases the hierarchy is where the ordering knowledge lives.

The difference is what each buys. Virtual dispatch lets one variable hold any implementation, which is worth a great deal and costs an indirect call. Tag dispatch resolves entirely before the program runs, so the selected `copy_helper` can be inlined into the caller and the tag argument disappears completely, but there is no such thing as a value whose category is decided later.

The Guidelines close rule T.65 by noting that with C++20 constraints, such alternatives can be distinguished directly, showing the same two `copy_helper` overloads with a `requires std::is_trivially_copyable_v<...>` clause on one of them and nothing on the other. The trait survives. The tag, and the empty argument that carried it, becomes unnecessary.

> [!example] Reading a dispatcher
> When you meet a function taking a trailing argument of an empty struct type, or a call site that constructs a value out of nowhere and passes it, that is tag dispatch. Trace it backwards: the tag type came from a trait, the trait was specialized on some property of a template parameter, and the set of overloads taking tag types is the set of algorithms. The empty argument is not data. It is the selector, wearing a parameter's clothes.

## Related Notes

- [[cs/languages/Cpp/template-specialization-full-and-partial|Template Specialization, Full and Partial]] - the mechanism every trait is built from
- [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE and enable_if]] - the alternative dispatcher, and the one cppreference recommends against
- [[cs/languages/Cpp/concepts-and-requires-clauses|Concepts and requires Clauses]] - checkable requirements replacing labels that were merely asserted
- [[cs/languages/Cpp/iterators-and-ranges|Iterators and Ranges]] - the category hierarchy these tags name
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the runtime version of the same selection problem
- [[cs/dsa/arrays|Arrays: Fixed-Size Contiguous Storage]] - why a bulk memory move is a legal algorithm for some element types and not others

## Sources

- "Metaprogramming library," cppreference.com. https://en.cppreference.com/w/cpp/meta.html . Supports the description of `<type_traits>` as providing compile-time template-based interfaces to query the properties of types.
- "std::iterator_tags," cppreference.com. https://en.cppreference.com/w/cpp/iterator/iterator_tags.html . Supports the six tag definitions and their inheritance chain, each tag being an empty type, the requirement that `iterator_traits<It>::iterator_category` alias the most specific category, the statement that tags carry information used to select the most efficient algorithms, the dispatcher-function technique with `std::enable_if` as the alternative, the C++20 rule that a concept is unsatisfied regardless of the tag when the operations are missing, the absence of a legacy contiguous tag and the advice to use the concept, and the `iterator_concept` fallback rules.
- "C++ Core Guidelines," isocpp.github.io. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports rule T.65 including the simplified `copy` example with its memmove and copy-constructor-loop outcomes, the description of the technique as general and powerful for compile-time algorithm selection, the note that C++20 constraints can distinguish such alternatives directly, and the definition of a trait as a type alias, a `constexpr` function, or a traits template specialized on the user's type.
