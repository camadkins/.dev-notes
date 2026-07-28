---
title: Iterators and Adapters in Rust
description: "The Iterator trait's single required method, why adapters are lazy, what a consuming adapter takes ownership of, and the benchmark behind the zero-cost claim."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-04-08
updated:
aliases:
  - Rust Iterators
  - Iterator Adapters
---

`v1.iter().map(|x| x + 1)` looks like it increments every element of a vector. It does nothing at all. The compiler even says so, warning that iterators are lazy and do nothing unless consumed. Understanding why that expression is inert, and what turns it live, is most of what there is to know about iteration in Rust.

> [!note] The idea
> The `Iterator` trait requires implementors to define exactly one method, `next`, which returns one item wrapped in `Some` and `None` when iteration is over. Everything else in the iteration vocabulary is a default method built on top of `next`, which is why a chain of adapters builds a tower of structs that has not moved a single element yet. The non-obvious payoff is that the tower costs nothing: a benchmark in the Book put an explicit `for` loop at 19,620,300 ns/iter against 19,234,900 ns/iter for the iterator version, because the abstraction compiles down to roughly the code you would have written by hand.

## One required method

The core of `Iterator` is small enough to quote whole:

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

`type Item` is an associated type, and it is the type the iterator returns. `next` returns `Some(Item)` as long as there are elements, then `None` once they are exhausted. The full definition includes many other methods, but they are default methods built on top of `next`, so an implementor gets them for free. That is the whole contract. Write `next` for a struct holding your iteration state and every adapter in the standard library becomes available to it.

Calling `next` mutates. It changes internal state the iterator uses to track where it is in the sequence, which is why an iterator you call `next` on directly must be `mut`. A `for` loop does not require that because the loop takes ownership of the iterator and makes it mutable behind the scenes.

The trait is deliberately silent about finiteness. An open-ended range `0..` is an infinite iterator, and that is legal. The consequence is a real hazard: methods such as `min`, which in the general case must traverse every element, are likely not to return for an infinite iterator. `std::iter::repeat(1).min()` is an infinite loop, not an error.

## Three forms, chosen by who owns what

Three methods conventionally create an iterator from a collection. `iter()` iterates over `&T`, `iter_mut()` over `&mut T`, and `into_iter()` over `T`. The distinction is exactly the [[cs/languages/Rust/ownership-and-moves|ownership]] distinction: `into_iter` takes `self` by value, so using a `for` loop over a collection directly consumes it.

The desugaring makes this mechanical rather than magical. `for x in values { ... }` becomes a call to `IntoIterator::into_iter(values)` followed by a `loop` that matches on `iter.next()`, binding `Some(val)` and breaking on `None`. The standard library then closes the circle with `impl<I: Iterator> IntoIterator for I`, so every iterator is itself convertible into one by returning itself. Two things follow: an `Iterator` you write works in a `for` loop with no extra work, and implementing `IntoIterator` for a collection you write is what makes it loopable.

The `&values` shorthand is the same trick one level out. A collection `C` offering `iter()` usually implements `IntoIterator for &C` by delegating to it, so `for x in &values` is `values.iter()`. Not every collection offers `iter_mut()`. `HashSet<T>` does not, because mutating a key could put the collection into an inconsistent state if the key hashes change.

## Adapters are lazy; consuming adapters are not

Two families of default method sit on the trait, and the difference is whether they call `next`.

**Iterator adapters** do not consume the iterator. They produce a different iterator by changing some aspect of the original, which is why the standard library has one struct per adapter. `map`, `take`, and `filter` are the common ones. Because they are lazy, `v.iter().map(|x| println!("{x}"))` prints nothing; the closure never runs. The idiomatic fix when you want side effects is a `for` loop or `for_each`, and the idiomatic fix when you want a result is `collect`.

**Consuming adapters** are the ones that call `next`, and calling them uses up the iterator. `sum` takes ownership of the iterator, repeatedly calls `next` while adding each item to a running total, and returns the total. You cannot use the iterator afterward, because `sum` took ownership of it. This is not a special rule for iterators; it is the ordinary move rule applied to a value that happens to be an iterator.

Laziness is what makes chaining safe. `take(5)` on an infinite range is a normal, terminating program precisely because nothing was computed until a consumer asked.

> [!example] What `shoes_in_size` actually does
> The Book's example is `shoes.into_iter().filter(|s| s.size == shoe_size).collect()`. Read it as three ownership events rather than three operations. `into_iter` creates an iterator that takes ownership of the vector. `filter` adapts that iterator into a new one containing only elements for which the closure returns `true`, and the closure captures `shoe_size` from the environment. `collect` gathers the values the adapted iterator yields into a vector. No `Shoe` is inspected until `collect` starts pulling.

## The zero-cost claim, and what backs it

The Book benchmarks its two `search` implementations by loading the whole of *The Adventures of Sherlock Holmes* into a `String` and looking for the word "the". The `for` loop version measured 19,620,300 ns/iter (+/- 915,700); the iterator version measured 19,234,900 ns/iter (+/- 657,200). Similar, within the noise, and the authors are explicit that the point is a general sense of the comparison rather than a proof of equivalence.

The claim the benchmark supports is the one worth carrying: iterators, although a high-level abstraction, get compiled down to roughly the same code as if you had written the lower-level code yourself. That is what "zero-cost abstraction" means here, that using the abstraction imposes no additional runtime overhead. The Book ties the phrase to Bjarne Stroustrup's formulation of the zero-overhead principle from his 2012 ETAPS keynote: what you do not use, you do not pay for, and what you do use, you could not hand code any better. Loop unrolling and elimination of bounds checking on array access still apply to the compiled chain.

Mechanically this is plausible for the same reason [[cs/languages/Rust/traits-and-generic-bounds|monomorphization]] makes generics free. Each adapter is a concrete struct with a concrete `next`, the closures are concrete types, and the whole chain inlines into one loop body with nothing left to dispatch on.

> [!warning] A panicking adapter leaves an unspecified state
> If an iterator adapter panics, the iterator will be in an unspecified (but memory safe) state, and that state is not guaranteed to stay the same across versions of Rust. Memory safety holds. The values you would get from resuming do not, so do not build recovery logic on them.

## Related Notes

- [[cs/languages/Rust/closures-fn-fnmut-fnonce|Closures: Fn, FnMut, and FnOnce]] - the closures adapters take, and which trait a given capture mode admits
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - why `into_iter` consumes and `iter` does not
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds]] - default methods and monomorphization, the two mechanisms this note leans on
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - the other way languages express suspended, resumable iteration
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order and Strictness]] - laziness as a general semantic choice rather than a library convention

## Sources

- "Processing a Series of Items with Iterators," The Rust Programming Language. https://doc.rust-lang.org/book/ch13-02-iterators.html . Supports the `Iterator` trait definition and its single required `next` method returning `Some` then `None`, the associated `Item` type, `next` mutating internal state and the `for` loop taking ownership, `iter`/`iter_mut`/`into_iter`, consuming adapters and `sum` taking ownership, iterator adapters producing new iterators, laziness and the unused-`Map` warning, `collect`, and the `shoes_in_size` filter example.
- "Performance in Loops vs. Iterators," The Rust Programming Language. https://doc.rust-lang.org/book/ch13-04-performance.html . Supports the Sherlock Holmes benchmark and both timing figures, the claim that iterators compile down to roughly the same code as hand-written lower-level code, the zero-cost-abstraction definition, the Stroustrup 2012 ETAPS quotation, and loop unrolling and bounds-check elimination.
- "Module std::iter," The Rust Standard Library. https://doc.rust-lang.org/std/iter/index.html . Supports the core trait quotation and default-methods-for-free framing, the three forms of iteration, the `for` loop desugaring through `IntoIterator::into_iter`, `impl<I: Iterator> IntoIterator for I`, the `&C`/`&mut C` shorthand and the `HashSet` exception, the adapter definition and `map`/`take`/`filter`, the unspecified-but-memory-safe state after an adapter panics, laziness with `for_each` as the side-effect idiom, and infinite iterators with the `repeat(1).min()` hazard.
