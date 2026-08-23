---
title: "Streams and the Collector Abstraction"
description: "Why intermediate operations do nothing, how the spliterator makes a source parallelizable, and why Collector is the extension point that matters."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-16
updated:
aliases:
  - Java Streams
  - java.util.stream
---

Most tours of `java.util.stream` spend their time on the verbs: `filter`, `map`, `sorted`, `distinct`. Those are the least interesting part of the design, a fixed list you cannot extend, each a thin wrapper over the same machinery. The two pieces you can implement yourself sit at the ends of the pipeline, and that is where the design decisions live.

> [!note] The idea
> A stream pipeline is a description of work that does not run until something demands a value, and the two ends of it are open. `Spliterator` is the contract a source signs, saying how it can be traversed and, critically, how it can be cut in half. `Collector` is the contract a result signs, saying how partial answers are built and merged. The middle, the part everyone teaches, is closed. So the interesting question about streams is never which operation to use; it is whether your source can split and whether your reduction is associative.

## Nothing happens until it has to

The documentation is unusually blunt about what an intermediate operation does, which is nothing. Calling `filter()` "does not actually perform any filtering, but instead creates a new stream that, when traversed, contains the elements of the initial stream that match the given predicate." Intermediate operations "are always lazy," and "Traversal of the pipeline source does not begin until the terminal operation of the pipeline is executed."

Build a pipeline, forget the terminal operation, and it never touches an element. That is the basis of the optimization: because no stage runs eagerly, filtering, mapping, and summing "can be fused into a single pass on the data, with minimal intermediate state." A chain of five operations over a million elements is one traversal with five calls per element, not five traversals materializing four intermediate lists.

Laziness also buys early exit. "An intermediate operation is short-circuiting if, when presented with" infinite input it may produce a finite stream, and a short-circuiting terminal operation may finish in finite time on infinite input. That is what makes `Stream.iterate(...).filter(...).findFirst()` a sensible program rather than a hang. The distinction between what a computation describes and when it is forced is the subject of [[cs/pl/evaluation-order-and-strictness|evaluation order and strictness]]; streams are call-by-need bolted onto an eager language at library level.

The cost is that a stream is single-use. "A stream is not a data structure that stores elements"; it conveys them from somewhere else, and "The elements of a stream are only visited once during the life of a stream." After the terminal operation "the stream pipeline is considered consumed, and can no longer be used." Reuse a stream variable and you get `IllegalStateException`, which surprises everyone exactly once.

## The source contract

The source end is a `Spliterator`, and the name is the API telling you what it is for: "An object for traversing and partitioning elements of a source." It has two jobs, and the second one is the reason it exists rather than `Iterator`.

Traversal is the familiar half: `tryAdvance` pulls one element, `forEachRemaining` pushes the rest in bulk. Partitioning is `trySplit`, which peels off some prefix of the remaining elements as a second spliterator that another thread can take. That is [[cs/dsa/divide-and-conquer|divide and conquer]] as an interface, and the recursion bottoms out when a spliterator declines to split further.

Whether parallelism helps is decided entirely here. "Operations using a Spliterator that cannot split, or does so in a highly imbalanced or inefficient manner, are unlikely to benefit from parallelism." An `ArrayList` splits perfectly, since indices are arithmetic. A `LinkedList` splits badly, since finding the midpoint means walking. A `BufferedReader` over lines cannot split until it has read them. The failure mode is the one [[cs/dsa/quick-sort|quicksort]] has with a bad pivot: recursive decomposition is only as good as the balance of its cuts, and an adversarial split turns a parallel algorithm into a sequential one with overhead.

A spliterator also reports `characteristics()` as a bitmask, one of `ORDERED`, `DISTINCT`, `SORTED`, `SIZED`, `NONNULL`, `IMMUTABLE`, `CONCURRENT`, `SUBSIZED`, with "Characteristics are reported as a simple unioned bit set." These are how a source tells the pipeline what work it can skip. A `SIZED` source lets `toArray` allocate exactly once. A `DISTINCT` source lets `distinct()` become a no-op. A `SORTED` source lets `sorted()` do the same. The bitmask is a tiny static type system carried at run time.

Two smaller details matter in practice. A late-binding spliterator "binds to the source of elements at the point of first traversal, first split, or first query for estimated size," not at construction, which is why modifying a collection between `stream()` and the terminal call is sometimes fine and sometimes a `ConcurrentModificationException`. And "spliterators are not expected to be thread-safe": parallel streams hand whole spliterators between threads rather than sharing one.

## Why Collector is the interesting half

`Collector<T, A, R>` looks intimidating for three type parameters and is actually simpler than `reduce`. It is "A mutable reduction operation that accumulates input elements into a mutable result container," and it "is specified by four functions that work together to accumulate entries into a mutable result container": a supplier that makes an empty container, an accumulator that folds one element in, a combiner that merges two containers, and a finisher that transforms the container into the result.

The middle type parameter is the design's quiet cleverness. `A` is "the mutable accumulation type of the reduction operation," documented as "often hidden as an implementation detail." `Collectors.joining()` has a `StringBuilder` as its `A` and a `String` as its `R`, and no caller ever names the `StringBuilder`. The accumulation type is existentially quantified in practice: the collector knows it, the pipeline moves its values around without inspecting them, the caller never sees it. That is abstract-data-type discipline expressed through generics.

The four functions also carry proof obligations, and they are the reason a collector can run in parallel at all. "The collector functions must satisfy an identity and an associativity constraints." Identity says combining a partial result with an empty container yields an equivalent result. Associativity says "splitting the computation must produce an equivalent result," so accumulating `t1` and `t2` into one container must equal accumulating each into its own and combining. Those two laws make the accumulation a monoid, and a monoid is exactly what a divide-and-conquer reduction needs: any split of the input, in any grouping, gives the same answer.

> [!warning] The obligation is on you
> Write a collector whose combiner is not associative, or whose accumulator mutates shared state, and nothing complains. The sequential path never exercises the combiner at all, so the bug appears only under `parallelStream()`, only sometimes, and only on some inputs. The laws are documented contracts, not checked ones.

This is why `Collector` is the extension point that matters. `Collectors.groupingBy`, `partitioningBy`, `teeing`, and the downstream composition that groups and then averages inside each group are all implementations of the same four functions, and so is anything you write. You cannot add an intermediate operation to `Stream`, but you can express nearly any aggregation as a collector and drop it into the existing pipeline.

The contrast with [[cs/languages/Rust/iterators-and-adapters|Rust's iterator adapters]] is instructive. Rust makes the pipeline itself extensible, since any type implementing `Iterator` is a first-class stage, and puts nothing like `Collector` in the middle. Java made the opposite cut: a closed pipeline with two open ends. Both get laziness and fusion; they differ in which end the user is trusted with.

## Related Notes

- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - laziness as a language-level concept rather than a library trick
- [[cs/dsa/divide-and-conquer|Divide and Conquer]] - the shape trySplit and the combiner implement together
- [[cs/dsa/quick-sort|Quick Sort]] - the same dependence on split balance, with a longer history of pathological cases
- [[cs/languages/Rust/iterators-and-adapters|Iterators and Adapters in Rust]] - the same laziness with the extension point at the other end
- [[cs/languages/Java/default-methods-and-interface-evolution|Default Methods and Interface Evolution]] - how `stream()` was added to `Collection` without breaking implementors
- [[cs/languages/Java/generic-methods-and-type-inference|Generic Methods and Type Inference]] - what makes a three-parameter collector usable without writing the types

## Sources

- "java.util.stream (Java SE 21 API)," Oracle. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html . Supports the no-storage description of a stream, single-visit consumability, laziness of intermediate operations, the statement that traversal begins only at the terminal operation, pipeline fusion into a single pass, the definition of a short-circuiting intermediate operation, and pipeline consumption after the terminal operation.
- "Interface Collector (Java SE 21 API)," Oracle. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collector.html . Supports the mutable-reduction definition, the four specifying functions, the description of the A parameter as the mutable accumulation type often hidden as an implementation detail, and the identity and associativity constraints.
- "Interface Spliterator (Java SE 21 API)," Oracle. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Spliterator.html . Supports the traversing-and-partitioning definition, the warning about sources that split poorly not benefiting from parallelism, characteristics reported as a unioned bit set, late binding at first traversal or split, and the absence of a thread-safety expectation.
