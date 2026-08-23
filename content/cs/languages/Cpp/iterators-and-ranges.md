---
title: Iterators and Ranges
description: "The six iterator categories as operation sets, the half-open [first, last) convention, and what C++20 sentinels and views actually changed."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-04-09
updated:
aliases:
  - C++ Iterators
  - Iterator Categories
  - std::ranges
  - Half-open ranges
---

An iterator is not an interface a container implements. cppreference is precise about this: instead of being defined by specific types, each category of iterator is defined by the operations that can be performed on it, and any type that supports the necessary operations can be used as an iterator. A raw pointer supports all of the operations required by `LegacyRandomAccessIterator`, so a pointer can be used anywhere a `LegacyRandomAccessIterator` is expected. The category is a checklist, not a base class.

> [!note] The idea
> Until C++20 a range was a *pair of iterators of the same type*, which quietly forced the end of every range to be a value you could already compute. C++20 replaced that with an iterator and a **sentinel**, and the sentinel may have a different type from the iterator. That one relaxation is what lets a range be conditionally terminated (`views::take_while`) or unbounded (`views::iota`) rather than merely finite and pre-measured, and it is why `ranges::common_range` now exists as a named concept for the old case where the iterator and sentinel types are identical. The half-open convention did not change. What changed is what is allowed to sit on the right-hand side of it.

## The categories are a hierarchy of operations

There are five (until C++17) six (since C++17) kinds of iterators: `LegacyInputIterator`, `LegacyOutputIterator`, `LegacyForwardIterator`, `LegacyBidirectionalIterator`, `LegacyRandomAccessIterator`, and `LegacyContiguousIterator` (since C++17), plus `LegacyIterator` for the most basic kind.

All of them except `LegacyOutputIterator` organize into a hierarchy where more powerful categories support the operations of less powerful ones, so a random access iterator can be used wherever an input iterator is expected. Output sits outside the chain because it is about writability rather than traversal power: if an iterator falls into one of the hierarchy categories and also satisfies `LegacyOutputIterator`, it is called a mutable iterator and supports both input and output, and non-mutable iterators are called constant iterators.

The requirement table reads as a set of nested capability increments. `LegacyIterator` requires increment. `LegacyOutputIterator` requires write and increment. `LegacyInputIterator` requires read and increment without multiple passes. `LegacyForwardIterator` adds increment with multiple passes. `LegacyBidirectionalIterator` adds decrement. `LegacyRandomAccessIterator` adds random access. `LegacyContiguousIterator` adds [[cs/systems/memory-hierarchy-and-caching|contiguous storage]].

That last one has a history worth knowing. cppreference notes the `LegacyContiguousIterator` category was only formally specified in C++17, but the iterators of `std::vector`, `std::basic_string`, `std::array`, and `std::valarray`, as well as [[cs/dsa/arrays|pointers into C arrays]], are often treated as a separate category in pre-C++17 code. The capability existed before the name did.

The single-pass versus multi-pass distinction between input and forward is the one that bites in practice. An input iterator only promises read and increment *without* multiple passes, which is why an algorithm written against input iterators cannot walk the sequence twice. A stream is the canonical case.

Since C++20, iterators are called constexpr iterators if all operations provided to meet iterator category requirements are constexpr functions.

## Dereferenceable, past-the-end, and singular

Three states, and the vocabulary matters because the standard library's guarantees are stated in it.

Just as a regular pointer to an array guarantees a pointer value pointing past the last element, for any iterator type there is an iterator value that points past the last element of a corresponding sequence, called a past-the-end value. Values of an iterator `i` for which the expression `*i` is defined are called dereferenceable, and the standard library never assumes that past-the-end values are dereferenceable.

Iterators can also have singular values that are not associated with any sequence. Results of most expressions are undefined for singular values, with only three exceptions: assigning a non-singular value to an iterator holding a singular value, destroying an iterator holding a singular value, and (for iterators meeting `DefaultConstructible`) using a value-initialized iterator as the source of a copy or move operation. Dereferenceable values are always non-singular.

The definition that ties this back to [[cs/languages/Cpp/stl-containers|container invalidation]] is one sentence: an invalid iterator is an iterator that **may be** singular. Not one that is known to be broken. One whose validity is no longer guaranteed. That is why the invalidation tables are written in terms of what an operation may invalidate rather than what it observably damaged, and why testing an invalidated iterator and finding it "works" proves nothing.

## The half-open range

Most of the standard library's algorithmic templates that operate on data structures have interfaces that use ranges. The pre-C++20 definition:

> A range is a pair of iterators that designate the beginning and end of the computation. A range `[i, i)` is an empty range; in general, a range `[i, j)` refers to the elements in the data structure starting with the element pointed to by `i` and up to but not including the element pointed to by `j`.

Validity is defined by reachability. An iterator `j` is called reachable from an iterator `i` if and only if there is a finite sequence of applications of `++i` that makes `i == j`, and if `j` is reachable from `i` they refer to elements of the same sequence. A range `[i, j)` is valid if and only if `j` is reachable from `i`. The result of applying standard library functions to invalid ranges is undefined.

Two properties fall straight out of half-openness and are the reason the convention is worth the initial awkwardness. `[i, i)` denotes the empty range without needing a special value, and the end of one subrange is exactly the beginning of the next, so splitting a range needs one iterator rather than two.

## What C++20 changed

Since C++20 a range can be denoted two ways: `[i, s)`, with an iterator `i` and a sentinel `s` that designate the beginning and end of the computation, where **`i` and `s` can have different types**; or `i + [0, n)`, with an iterator `i` and a count `n` designating the beginning and the number of elements the computation applies to.

The sentinel semantics keep the half-open shape. An iterator and a sentinel denoting a range are comparable, `[i, s)` is empty if `i == s`, and otherwise `[i, s)` refers to the elements starting with the element pointed to by `i` and up to but not including the element, if any, pointed to by the first iterator `j` such that `j == s`. A sentinel `s` is reachable from `i` if and only if a finite sequence of `++i` makes `i == s`, and if `s` is reachable from `i` then `[i, s)` denotes a valid range.

C++20 also introduced a new system of iterators based on concepts. cppreference is explicit that while the basic taxonomy remains similar, the requirements for individual iterator categories are somewhat different. The concept-based names (`input_iterator`, `forward_iterator`, `bidirectional_iterator`, `random_access_iterator`, `contiguous_iterator`, plus building blocks like `indirectly_readable`, `weakly_incrementable`, and `sentinel_for`) do more than rename the Legacy named requirements. See [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] for what concepts buy at the constraint-checking level.

## The ranges library

The ranges library is an extension and generalization of the algorithms and iterator libraries that makes them more powerful by making them composable and less error-prone. It creates and manipulates range views, lightweight objects that indirectly represent iterable sequences.

Ranges are an abstraction over four shapes, and listing them makes the sentinel payoff concrete:

- `[begin, end)`, iterator pairs, for example ranges made by implicit conversion from containers. All algorithms that take iterator pairs now have overloads that accept ranges, such as `ranges::sort`.
- `begin + [0, size)`, counted sequences, for example the range returned by `views::counted`.
- `[begin, predicate)`, conditionally-terminated sequences, for example the range returned by `views::take_while`.
- `[begin, ..)`, unbounded sequences, for example the range returned by `views::iota`.

The last two are not expressible as a same-type iterator pair, which is the whole point.

The library splits into two halves with opposite evaluation behavior. Range algorithms are applied to ranges **eagerly**. Range adaptors are applied to views **lazily**, and adaptors can be composed into pipelines so that their actions take place as the view is iterated. Laziness here is the same idea as in [[cs/languages/Python/generators-and-iterators|Python generators]] and [[cs/languages/Rust/iterators-and-adapters|Rust iterator adapters]]: the pipeline describes work, and iteration performs it. Evaluation-order machinery generally is in [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]].

The namespace alias `std::views` is provided as a shorthand for `std::ranges::views`.

> [!warning] `view` is a cost promise, not a shape
> `ranges::view` specifies that a range is a view, that is, **it has constant time copy/move/assignment**. That is the defining property, and it is why views are passed by value freely while containers are not. Two neighboring concepts are worth reading in the same light: `ranges::sized_range` specifies that a range knows its size in constant time, and `ranges::borrowed_range` specifies that a type is a range and iterators obtained from an expression of it can be safely returned without danger of dangling. Each concept names a guarantee about cost or lifetime, not a data layout.

> [!example] The concept vocabulary as a map
> `ranges::range` specifies that a type is a range, that is, it provides a begin iterator and an end sentinel. Every category concept is then defined by delegating to the iterator: `ranges::forward_range` specifies a range whose iterator type satisfies `forward_iterator`, `ranges::random_access_range` a range whose iterator type satisfies `random_access_iterator`, and so on through `contiguous_range`. Two extra ones fill in the corners: `ranges::common_range` specifies that a range has identical iterator and sentinel types (the pre-C++20 shape, now a named special case), and `ranges::constant_range` (C++23) specifies that a range has read-only elements. C++23 also added `ranges::to`, which constructs a new non-view object from an input range, closing the loop from a lazy pipeline back to a container.

## Related Notes

- [[cs/languages/Cpp/stl-containers|STL Containers]] - what iterators point into, and the invalidation rules that "invalid iterator" names
- [[cs/languages/Cpp/stl-algorithms|STL Algorithms]] - the consumers that the categories exist to constrain
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - concepts, and why an operation checklist can be a compile-time constraint
- [[cs/languages/Rust/iterators-and-adapters|Iterators and Adapters]] - the same lazy-pipeline design in a language that made it the default
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators]] - single-pass iteration as a language feature
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - eager versus lazy, stated generally
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - the other way to produce a sequence on demand

## Sources

- "Iterator library," cppreference.com. https://en.cppreference.com/w/cpp/iterator.html . Supports the six iterator categories and the pointer example, categories defined by operations rather than types, the hierarchy and the mutable/constant distinction, the per-category operation table including the single-pass versus multi-pass split, the `LegacyContiguousIterator` C++17 history note, constexpr iterators, past-the-end and dereferenceable and singular values with the three exceptions, "an invalid iterator is an iterator that may be singular", the `[i, j)` range definition and reachability-based validity, undefined results on invalid ranges, the C++20 iterator-sentinel and counted range forms, and the note that the concept-based iterator system has somewhat different requirements.
- "Ranges library," cppreference.com. https://en.cppreference.com/w/cpp/ranges.html . Supports the library's stated purpose (composable and less error-prone), range views as lightweight objects, the four range shapes with their example adaptors, eager range algorithms versus lazy range adaptors composed into pipelines, the `std::views` namespace alias, and the definitions of the `range`, `view`, `sized_range`, `borrowed_range`, `common_range`, `constant_range`, the category range concepts, and `ranges::to`.
