---
title: STL Containers
description: "The three container categories, the invalidation contract each one publishes, and how to choose between vector, deque, list, map, and unordered_map."
draft: false
comments: true
tags:
  - cs
  - languages
  - data-structures
date: 2026-03-18
updated:
aliases:
  - std::vector
  - std::deque
  - std::unordered_map
  - C++ Containers
---

Picking a container looks like a performance question and mostly is not. The complexity numbers are published and small in count, so the real decision is usually about what happens to the iterators and pointers you are already holding when the container changes underneath them. That part is also published, and it is the part people skip.

cppreference describes the containers library as a generic collection of class templates and algorithms that let programmers implement common data structures like queues, lists and stacks, and it splits them into three classes: sequence containers, associative containers, and (since C++11) unordered associative containers, each designed to support a different set of operations. Which container is best for a particular application depends not only on the offered functionality, but also on its efficiency for different workloads.

> [!note] The idea
> A container's interface is not only its member functions. It also includes a published contract about which iterators and references survive each mutation, and those two survive on **different schedules**. The clearest case is `std::deque`: inserting at either end invalidates all iterators, and yet pointers and references to the rest of the elements remain valid. So "my iterator broke" and "my pointer dangled" are separate failure modes with separate rules, and a container can be safe for one while being unsafe for the other. Choosing a container means choosing an invalidation contract as much as choosing a complexity class.

## The three categories

Sequence containers implement data structures which can be accessed sequentially: `array` (C++11, a fixed-sized inplace contiguous array), `vector` (a resizable contiguous array), `deque` (a double-ended queue), `forward_list` (C++11, a singly-linked list), and `list` (a doubly-linked list).

Associative containers implement sorted data structures that can be quickly searched, at O(log n) complexity: `set` (a collection of unique keys, sorted by keys), `map` (a collection of key-value pairs, sorted by keys, keys unique), plus the `multi` variants that drop uniqueness.

Unordered associative containers, added in C++11, implement unsorted (hashed) data structures that can be quickly searched, at O(1) average and O(n) worst-case complexity: `unordered_set`, `unordered_map`, and their `multi` variants. The complexity gap between average and worst case is the entire tradeoff against the sorted containers, and it is why the hashed version is not a strict upgrade. The underlying structures are covered in [[cs/dsa/hash-tables|Hash Tables]] and [[cs/dsa/rb-tree|Red-Black Trees]].

Two further groups sit on top. Container adaptors provide a different interface for sequential containers, which is what `stack` (LIFO), `queue` (FIFO), and `priority_queue` are. Views, added in C++20, provide facilities for interacting with a non-owning array of elements, which is `span` (a non-owning view over a contiguous sequence of objects) and `mdspan` (C++23).

## vector: contiguous, and the capacity rule that governs everything

`std::vector` is a sequence container that encapsulates dynamic size arrays. The elements are stored contiguously, which means elements can be accessed not only through iterators but also using offsets to regular pointers, so a pointer to an element of a vector may be passed to any function that expects a pointer to an element of an array. That single property is why `vector` is the default: it is the only one of these that hands the CPU a flat block.

The storage is handled automatically, being expanded as needed. Vectors usually occupy more space than static arrays, because more memory is allocated to handle future growth, so a vector does not need to reallocate each time an element is inserted, but only when the additional memory is exhausted. The total allocated amount is queryable with `capacity()`. Reallocations are usually costly operations in terms of performance, and `reserve()` can be used to eliminate them if the element count is known beforehand. The growth strategy behind this is the subject of [[cs/dsa/dynamic-arrays|Dynamic Arrays]], and the reason the end operations are cheap on average is [[cs/dsa/amortized-analysis-methods|amortized analysis]].

cppreference gives the complexity of common operations: random access is constant O(1); insertion or removal of elements at the end is amortized constant O(1); insertion or removal of elements is linear in the distance to the end of the vector, O(n).

The invalidation table is short enough to learn outright. All read-only operations invalidate nothing, ever. `clear`, `operator=`, and `assign` always invalidate. `reserve` and `shrink_to_fit` invalidate everything if the vector changed capacity, and nothing if it did not. `push_back` and `emplace_back` invalidate all of them if the vector changed capacity, and only `end()` if it did not. `insert` and `emplace` invalidate all of them on a capacity change, and otherwise only those at or after the insertion point (including `end()`). `erase` invalidates the erased elements and all elements after them (including `end()`), and `pop_back` invalidates the element erased and `end()`.

Read that list and the pattern falls out: capacity change is the cliff. Everything else is local damage.

## deque: the container where iterators and references disagree

`std::deque` (double-ended queue) is an indexed sequence container that allows fast insertion and deletion at both its beginning and its end. In addition, insertion and deletion at either end of a deque never invalidates pointers or references to the rest of the elements.

As opposed to `std::vector`, the elements of a deque are not stored contiguously: typical implementations use a sequence of individually allocated fixed-size arrays, with additional bookkeeping, which means indexed access to a deque must perform two pointer dereferences, compared to vector's indexed access which performs only one. Expansion of a deque is cheaper than expansion of a `std::vector` because it does not involve copying existing elements to a new memory location. The cost shows up elsewhere: deques typically have large minimal memory cost, and a deque holding just one element has to allocate its full internal array (cppreference gives 8 times the object size on 64-bit libstdc++, and 16 times the object size or 4096 bytes, whichever is larger, on 64-bit libc++).

Complexity: random access constant O(1); insertion or removal at the end or beginning constant O(1); insertion or removal of elements linear O(n).

Now the split that makes this container instructive. In the library-wide invalidation table, `deque` under the condition "Modified first or last element" is listed as **iterators valid after insertion: No**, **references valid after insertion: Yes**, and after erasure "Yes, except erased element(s)". Under "Modified middle only", both columns go to No.

The per-container table agrees and is blunter about it: for a deque, `shrink_to_fit`, `clear`, `insert`, `emplace`, `push_front`, `push_back`, `emplace_front`, and `emplace_back` always invalidate iterators. So `push_back` on a deque is an operation after which every iterator you hold is dead, while every reference you hold is fine. A vector does not behave that way and a list does not behave that way. If you have ever seen a bug survive a switch from `vector` to `deque` and then reappear, this asymmetry is a good first suspect. The abstract data type itself is in [[cs/dsa/deque|Deque]].

`erase` on a deque is conditional: erasing at `begin` invalidates only the erased elements, erasing at `end` invalidates only the erased elements and the past-the-end iterator, and otherwise all iterators are invalidated.

## list, map, and the node-based stability guarantee

For `list` and `forward_list`, the library table gives the same answer in every column: after insertion, iterators and references are valid; after erasure, iterators and references are valid except for the erased elements. The associative containers `set`, `multiset`, `map`, and `multimap` carry exactly the same row. That is the payoff of node-based storage, and it is the reason to reach for a [[cs/dsa/doubly-linked-list|linked list]] or a [[cs/dsa/rb-tree|balanced tree]] when you must hold long-lived handles into a mutating collection. You pay for it in locality and per-element allocation.

The unordered containers are node-based too but with one hole. Their table row splits on whether insertion caused a rehash: if it did, iterators are not valid; if it did not, they are. References are valid in both cases. After erasure, iterators and references are valid except for the erased elements. So a rehash is to `unordered_map` what a capacity change is to `vector`: the one event that invalidates wholesale.

> [!warning] `operator[]` on an unordered_map is an insertion
> The library page is explicit that insertion means any method which adds one or more elements to the container, with `std::set::insert`, `std::map::emplace`, `std::vector::push_back`, and `std::deque::push_front` as examples, and it adds a note that `std::unordered_map::operator[]` also counts, as it may insert an element into the map. Reading a missing key with `[]` is a mutation, and it can be the rehash that kills your iterators.

> [!example] Where `end()` goes
> The past-the-end iterator gets its own paragraph in the standard library docs, and it is worth tracing. In general it is invalidated as though it were a normal iterator to a non-erased element. So `std::set::end` is never invalidated, `std::unordered_set::end` is invalidated only on rehash (since C++11), and `std::vector::end` is always invalidated, since it is always after the modified elements.
> There is one exception. An erasure which deletes the last element of a `std::deque` does invalidate the past-the-end iterator, even though it is not an erased element of the container (or an element at all). Combined with the general rules for deque iterators, the net result is that the only modifying operation which does not invalidate `std::deque::end` is an erasure which deletes the first element, but not the last.

## Two guarantees you can lean on

Read-only methods never invalidate iterators or references. And unless otherwise specified, passing a container as an argument to a library function never invalidates iterators to, or changes the values of, objects within that container. Between them, those two rules cover most of the code you write, which is why the invalidation tables only need consulting at the points where you actually mutate.

Thread safety has its own contract. All container functions can be called concurrently by different threads on different containers. All const member functions can be called concurrently by different threads on the same container, and `begin()`, `end()`, `rbegin()`, `rend()`, `front()`, `back()`, `data()`, `find()`, `lower_bound()`, `upper_bound()`, `equal_range()`, `at()`, and (except in associative containers) `operator[]` behave as const for the purposes of thread safety. Different elements in the same container can be modified concurrently by different threads, except for the elements of `std::vector<bool>`.

> [!warning] Iterators and concurrent mutation
> Iterator operations such as incrementing an iterator read, but do not modify, the underlying container, and may be executed concurrently with operations on other iterators on the same container, with the const member functions, or reads from the elements. But container operations that invalidate any iterators modify the container and cannot be executed concurrently with any operations on existing iterators **even if those iterators are not invalidated**. The safe-set is defined by what an operation *may* invalidate, not by what it happened to invalidate this time. Broader treatment in [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]].

> [!tip] Choosing
> Default to `vector`, because contiguity is the property nothing else offers and the amortized O(1) end operations cover most sequence work. Take `deque` when you need cheap growth at both ends or want to avoid the copy-on-reallocation, and accept that every iterator dies on any insertion. Take `list` when handles must survive arbitrary mutation and you can pay for the nodes. Between `map` and `unordered_map`, ask whether you need ordered traversal and a hard O(log n) bound, or average O(1) with an O(n) worst case and a rehash that invalidates iterators. `vector<bool>` is a distinct specialization with its own rules and is worth avoiding by reflex.

## Related Notes

- [[cs/languages/Cpp/iterators-and-ranges|Iterators and Ranges]] - the abstraction the invalidation rules are rules *about*
- [[cs/languages/Cpp/stl-algorithms|STL Algorithms]] - what containers are made usable by
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - these are class templates, instantiated per element type
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - why reallocation moves rather than copies
- [[cs/dsa/dynamic-arrays|Dynamic Arrays]] - the growth strategy under `vector`
- [[cs/dsa/deque|Deque]] - the abstract data type behind `std::deque`
- [[cs/dsa/hash-tables|Hash Tables]] - what `unordered_map` is, and what rehashing costs
- [[cs/dsa/rb-tree|Red-Black Trees]] - the usual implementation under `map` and `set`
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis Methods]] - why `push_back` is amortized constant
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - the threading model these guarantees sit inside

## Sources

- "Containers library," cppreference.com. https://en.cppreference.com/w/cpp/container.html . Supports the three container classes and their descriptions, the associative O(log n) and unordered O(1) average / O(n) worst-case complexities, the adaptor and view lists, the full iterator-invalidation table rows for vector, deque, list, forward_list, the associative and unordered containers, the definition of insertion and the `unordered_map::operator[]` note, the read-only and library-function invalidation guarantees, the past-the-end iterator rules including the deque exception, and the thread-safety statements.
- "std::vector," cppreference.com. https://en.cppreference.com/w/cpp/container/vector.html . Supports contiguous storage and pointer interchangeability, automatic expansion with `capacity()` and `reserve()`, the three complexity bounds, and the per-operation invalidation table.
- "std::deque," cppreference.com. https://en.cppreference.com/w/cpp/container/deque.html . Supports the double-ended definition and the pointer/reference stability at the ends, non-contiguous storage with two dereferences per indexed access, cheaper expansion, the minimal memory cost figures for libstdc++ and libc++, the complexity bounds, and the per-operation invalidation table including the conditional `erase` behavior.
