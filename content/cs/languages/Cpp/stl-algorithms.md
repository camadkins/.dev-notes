---
title: STL Algorithms
description: "How iterators decouple algorithms from containers, what that decoupling costs, and the algorithm names worth carrying in your head."
draft: false
comments: true
tags:
  - cs
  - languages
  - algorithms
date: 2026-05-14
updated:
aliases:
  - "<algorithm>"
  - C++ Algorithms
  - erase-remove idiom
---

The algorithms library defines functions for a variety of purposes (searching, sorting, counting, manipulating) that operate on ranges of elements. Not on containers. On ranges. Most of the standard library's algorithmic templates that operate on data structures have interfaces that use ranges, and a range is expressed in iterators, so `std::sort` has never known whether it was handed a `vector`, an array, or something you wrote yourself. It only knows the operations its iterators support.

> [!note] The idea
> The iterator interface is the seam that lets one algorithm serve every container, and the same seam is exactly why `std::remove` cannot remove. cppreference states it plainly: the underlying sequence of `[first, last)` is not shortened by the removing operation, and a call to `remove` is typically followed by a call to a container's `erase` member function to actually remove elements, the two together constituting the erase-remove idiom. An algorithm reaches the elements through iterators, and an iterator carries no way to resize the thing it points into. So the algorithm shifts the survivors forward and hands back a new logical end, and only the container can do the second half. The decoupling that buys reuse is the same decoupling that splits removal into two calls.

## Where the seam is, and what it costs

Because each category of iterator is defined by the operations that can be performed on it, an algorithm's requirements are stated as a category rather than a container. `std::remove` requires `ForwardIt` to meet the requirements of `LegacyForwardIterator`, and that is the entire coupling. Anything satisfying it works. The [[cs/languages/Cpp/iterators-and-ranges|iterator categories]] are the vocabulary this contract is written in.

Trace `remove` to see the seam. Removing is done by shifting the elements in the range so that the elements not to be removed appear at the beginning, and shifting is done by move assignment since C++11. The removing operation is stable, meaning the relative order of the elements not to be removed stays the same. It returns a past-the-end iterator for the new range of values, and if that is not `end`, it points to an unspecified value, and so do iterators to any values between it and `end`.

The postcondition is stated carefully and is worth reading twice. Given `result` as the returned iterator, all iterators in `[result, last)` are still dereferenceable, and each element of `[result, last)` has a valid but unspecified state, because move assignment can eliminate elements by moving from elements that were originally in that range. So the tail is not garbage and it is not the old contents either. It is [[cs/languages/Cpp/move-semantics-and-rvalue-references|moved-from]], which means destructible and assignable and nothing more.

Complexity is exact rather than asymptotic: given N as `std::distance(first, last)`, `remove` performs exactly N comparisons using `operator==`, and `remove_if` performs exactly N applications of the predicate.

> [!warning] Three traps on the same page
> `std::remove` and `std::remove_if` cannot be used with associative containers such as `std::set` and `std::map`, because their iterator types do not dereference to `MoveAssignable` types (the keys in these containers are not modifiable). The similarly-named member functions `list::remove`, `list::remove_if`, `forward_list::remove`, and `forward_list::remove_if` do erase the removed elements, so the member and the free function with the same name behave differently. And because `std::remove` takes `value` by reference, it can have unexpected behavior if that is a reference to an element of the range `[first, last)`.

Since C++20 there is a shorter path. The same effect is achieved by the non-member `std::erase`, which has overloads for all standard sequence containers, and `std::erase_if`, which has overloads for all standard containers. The idiom stays worth understanding, because the algorithm's return value and the moved-from tail show up whenever you write a shifting algorithm yourself.

## The names worth knowing

cppreference groups these, and the grouping is the fastest way to hold them. Every one listed below also has a `ranges::` counterpart added in C++20 unless noted.

**Non-modifying searches.** `find`, `find_if`, `find_if_not` (C++11) find the first element satisfying specific criteria. `all_of`, `any_of`, `none_of` (C++11) check whether a predicate is true for all, any, or none of the elements. `count` and `count_if` return the number of elements satisfying specific criteria. `mismatch` finds the first position where two ranges differ, and `equal` determines if two sets of elements are the same. `search` finds the first occurrence of a range of elements, `find_end` finds the last such sequence, `find_first_of` searches for any one of a set of elements, and `adjacent_find` finds the first two adjacent items that are equal (or satisfy a given predicate). `for_each` applies a unary function object to elements from a range.

**Modifying.** `copy` and `copy_if` (C++11) copy a range of elements to a new location; `move` (C++11) moves one. `transform` applies a function to a range of elements, storing results in a destination range, which is the workhorse. `replace` and `replace_if` replace all values satisfying specific criteria. `fill` copy-assigns the given value to every element, `generate` assigns the results of successive function calls to every element. `unique` removes consecutive duplicate elements in a range, and the word **consecutive** is the whole caveat: it is a deduplicator only on sorted input.

**Order-changing.** `reverse`, `rotate`, `shuffle` (C++11, randomly re-orders elements), `shift_left` and `shift_right` (C++20), and `sample` (C++17), which selects N random elements from a sequence.

**Sorting and selection.** `sort` sorts a range; `stable_sort` sorts while preserving relative order between equivalent elements. `partial_sort` sorts the first N elements. `nth_element` finds the Nth element as if the range were sorted, which is the selection algorithm you want when you do not need a full sort. `is_sorted` (C++11) checks, and `is_sorted_until` (C++11) finds the largest sorted subrange. The sorting theory behind the tradeoff is in [[cs/dsa/sorting|Sorting]].

**Binary search, on partitioned ranges.** `lower_bound` finds the first element not less than the given value, `upper_bound` the first element greater, `equal_range` the range of elements matching the given value, and `binary_search` determines whether an element exists. All four use binary search. The distinction between `lower_bound` and `upper_bound` is the one people misremember, and their one-line descriptions are the whole difference. See [[cs/dsa/binary-search|Binary Search]].

**Set operations, on sorted ranges.** `includes` determines if one sequence is a subsequence of another; `set_union`, `set_intersection`, `set_difference`, and `set_symmetric_difference` do what their names say. `merge` merges two sorted ranges and `inplace_merge` merges two ordered ranges in place, which is the [[cs/dsa/merge-sort|merge step]] exposed as a primitive.

**Heap operations.** `make_heap` creates a max heap out of a range of elements, `push_heap` adds an element to a max heap, `pop_heap` removes the largest element, `sort_heap` turns a max heap into a range sorted in ascending order, and `is_heap` (C++11) checks. This is [[cs/dsa/binary-heap|the binary heap]] as an algorithm family over a random access range rather than as a class.

**Partitioning.** `partition` divides a range of elements into two groups, `stable_partition` does it while preserving relative order within each group, and `partition_point` (C++11) locates the partition point of a partitioned range.

**Min, max, and comparison.** `min_element` and `max_element` return the smallest and largest element in a range, `minmax_element` (C++11) returns both, `clamp` (C++17) clamps a value between a pair of boundary values, and `lexicographical_compare` compares two ranges lexicographically.

## The preconditions are undefined behavior, not assertions

Some algorithms require the sequence represented by the arguments to be sorted or partitioned, and the behavior is undefined if the requirement is not met. That places a mis-sorted input to `binary_search` in the same category as a dangling pointer, which is covered generally in [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]].

The definitions are given precisely. A sequence is sorted with respect to a comparator `comp` if for every iterator `iter` pointing to the sequence and every non-negative integer `n` such that `iter + n` is a valid iterator pointing to an element of the sequence, `comp(*(iter + n), *iter) == false`. A sequence `[start, finish)` is partitioned with respect to an expression `f(e)` if there exists an integer `n` such that for all `i` in `[0, std::distance(start, finish))`, `f(*(start + i))` is true if and only if `i < n`. cppreference footnotes that `iter + n` simply means the result of `iter` being incremented n times, regardless of whether `iter` is a random access iterator.

Since C++20 those definitions gained a projection: a sequence is sorted with respect to `comp` and `proj` when the comparator is applied to `std::invoke(proj, ...)` of each element, and a sequence sorted with respect to a bare comparator is defined as one sorted with respect to that comparator and `std::identity{}`. The projection is the ranges library's answer to "sort these by one member" without writing a comparator [[cs/languages/Cpp/lambdas-and-captures|lambda]].

> [!example] `remove`, as the standard shows it
> cppreference's possible implementation is six lines and explains the return value better than prose does.
> ```cpp
> template<class ForwardIt, class T = typename std::iterator_traits<ForwardIt>::value_type>
> ForwardIt remove(ForwardIt first, ForwardIt last, const T& value)
> {
>     first = std::find(first, last, value);
>     if (first != last)
>         for (ForwardIt i = first; ++i != last;)
>             if (!(*i == value))
>                 *first++ = std::move(*i);
>     return first;
> }
> ```
> `first` walks to the first doomed element and then becomes a write cursor. Everything kept is moved down onto it. The returned `first` is where the survivors ended, and everything past it is the moved-from tail the container still owns. cppreference's own example applies this to removing all spaces from a string by shifting all non-space characters to the left and then erasing the extra, and labels it the erase-remove idiom.

## Two additions worth naming

Parallel algorithms arrived in C++17. A parallel algorithm is a function template in the algorithms library with a template parameter named `ExecutionPolicy`, and that parameter describes the manner in which the execution of the algorithm may be parallelized. Users may select an execution policy statically by invoking a parallel algorithm with an execution policy object of the corresponding type. Implementations, but not users, may define additional policies as an extension, and the semantics of a parallel algorithm invoked with an implementation-defined policy is implementation-defined. Error reporting changes under a policy too: if a function invoked as part of the algorithm throws and the policy is one of the standard policies, `std::terminate` is called.

Constrained algorithms arrived in C++20 as the `ranges::` overloads (`ranges::copy`, `ranges::sort`, and the rest), covering the same groups. C++23 added fold operations that the classic library never had: `ranges::fold_left` left-folds a range of elements, `ranges::fold_left_first` left-folds using the first element as an initial value, and `ranges::fold_right` and `ranges::fold_right_last` mirror them. The same shape shows up as `fold` in [[cs/languages/Rust/iterators-and-adapters|Rust's iterator adapters]].

> [!tip] The practical read
> Learn the *groups* rather than the list. When you find yourself writing an index loop, the question to ask is which group it belongs to, because the group narrows the search to a handful of names with one-line descriptions. And when an algorithm's name promises removal, deletion, or resizing, check whether it can actually reach the container. Usually it cannot.

## Related Notes

- [[cs/languages/Cpp/iterators-and-ranges|Iterators and Ranges]] - the interface every algorithm here is written against
- [[cs/languages/Cpp/stl-containers|STL Containers]] - the other side of the seam, and who owns `erase`
- [[cs/languages/Cpp/lambdas-and-captures|Lambdas and Captures]] - how predicates and comparators are usually supplied
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - what "valid but unspecified" means for the tail `remove` leaves behind
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - why these are function templates and what that costs at compile time
- [[cs/dsa/sorting|Sorting]] - the algorithms `sort` and `stable_sort` are instances of
- [[cs/dsa/binary-search|Binary Search]] - what `lower_bound` and `upper_bound` are doing
- [[cs/dsa/binary-heap|Binary Heap]] - the structure the heap operations maintain
- [[cs/dsa/merge-sort|Merge Sort]] - the merge step that `inplace_merge` exposes
- [[cs/languages/Rust/iterators-and-adapters|Iterators and Adapters]] - the same library shape built as methods on a trait
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what "the behavior is undefined if the requirement is not met" licenses

## Sources

- "Algorithms library," cppreference.com. https://en.cppreference.com/w/cpp/algorithm.html . Supports the library's stated purpose, the group-by-group algorithm names and their one-line descriptions (search, batch, copy, transformation, generation, removing, order-changing, sampling, sorting, binary search, set, merge, heap, partitioning, min/max, lexicographical), the sorted and partitioned definitions with the `iter + n` footnote and the C++20 projection form, the "behavior is undefined if the requirement is not met" statement, the C++17 parallel algorithm and execution policy description, the C++20 constrained algorithms list, and the C++23 fold operations.
- "std::remove, std::remove_if," cppreference.com. https://en.cppreference.com/w/cpp/algorithm/remove.html . Supports the shifting-by-move-assignment explanation and stability, the "underlying sequence is not shortened" postcondition with the dereferenceable but valid-and-unspecified tail, the return value, the exact-N complexity, the `LegacyForwardIterator` requirement, the erase-remove idiom note and the C++20 `std::erase` / `std::erase_if` alternative, the associative-container and `list::remove` caveats, the by-reference `value` warning, the possible implementation, the `std::terminate` behavior under a standard execution policy, and the remove-spaces example.
- "Iterator library," cppreference.com. https://en.cppreference.com/w/cpp/iterator.html . Supports that iterator categories are defined by the operations that can be performed on them, and that most of the standard library's algorithmic templates operating on data structures have interfaces that use ranges.
