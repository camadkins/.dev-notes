---
title: "Slices, Arrays, and the append Aliasing Trap"
description: "The three-word slice header, why append reallocating or not is a decision the language declines to make visible, and the bug that follows from it."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-30
updated:
aliases: []
---

Two Go programs differ by one integer in a `make` call. One of them mutates a caller's data through a slice it was handed; the other quietly does not. Neither is wrong, neither warns, and the difference is invisible at the call site. This is the single most reliable way to write a Go bug that survives code review.

The mechanism is not obscure. It is the interaction of two facts that are each documented plainly and are almost never held in mind at the same time.

> [!note] The idea
> A slice is a **value** containing a **pointer**. Passing it copies the header and shares the array. Then `append` breaks the symmetry: the spec says that when capacity is insufficient it "allocates a new, sufficiently large underlying array," and "Otherwise, append re-uses the underlying array." The reallocation decision is data-dependent, unobservable at the call site, and it silently ends the sharing. Aliasing in Go is not a property of a slice, it is a property of a slice **and its current spare capacity**, which is why the three-index slice expression exists.

## Arrays are values, slices are descriptions of them

Go's array is a fixed-size composite value, and the length is part of the type: `[4]int` and `[5]int` are "distinct, incompatible types." Crucially, "Go's arrays are values. An array variable denotes the entire array; it is not a pointer to the first array element (as would be the case in C)," so assigning or passing an array copies its contents. The Go blog suggests thinking of an array as "a sort of struct but with indexed rather than named fields."

That is why you rarely see them. A slice is the usable form: "A slice is a descriptor of an array segment. It consists of a pointer to the array, the length of the segment, and its capacity (the maximum length of the segment)." Rob Pike's article writes the struct out:

```go
type sliceHeader struct {
    Length        int
    Capacity      int
    ZerothElement *byte
}
```

Length is what you can index. "The Capacity field records how much space the underlying array actually has; it is the maximum value the Length can reach," and it "is equal to the length of the underlying array, minus the index in the array of the first element of the slice."

Slicing does not copy: "Slicing does not copy the slice's data. It creates a new slice value that points to the original array." So `d[2:]` and `d` write to the same bytes, which is the sharing everyone expects and reasons about correctly.

## The header travels by value

The part people get wrong is the header itself. Pike is emphatic: "even though a slice contains a pointer, it is itself a value. Under the covers, it is a struct value holding a pointer and a length. It is not a pointer to a struct."

The consequence is a clean split. "Even though the slice header is passed by value, the header includes a pointer to elements of an array, so both the original slice header and the copy of the header passed to the function describe the same array," so element writes are visible to the caller. But "the contents of a slice argument can be modified by a function, but its header cannot." A function that reslices its parameter changes nothing the caller can see, "since the function is passed a copy of the slice header, not the original."

This is [[cs/dsa/pass-by-value-and-pass-by-reference|pass by value]] applied to a struct that happens to contain a pointer, and it is the reason `append` has to return something. Pike states the rule directly: "since the slice header is always updated by a call to append, you need to save the returned slice after the call. In fact, the compiler won't let you call append without saving the result."

## The conditional that hides the bug

Now put the two halves together. The spec's rule for `append` has two branches, and nothing in the program text tells you which one you took.

Take a slice `a` of length 5 and capacity 10, and derive `b := a[:2]`. `b` has length 2 and capacity 10, because capacity runs from the slice's first element to the end of the array. Now `append(b, x)` has room, so it re-uses the array, and it writes `x` over `a[2]`. The caller's data changed and no line of code mentioned `a`.

Change the original capacity to 5 and the same `append` overflows, allocates a fresh array, and touches nothing. The blog's own demonstration of `Extend` filling up notes what changes at the boundary: "Both the capacity and the address of the zeroth element change when the new array is allocated." The same source line does two incompatible things depending on a number you did not write down.

> [!warning] Why the fix is a third index
> The full slice expression `a[low : high : max]` "controls the resulting slice's capacity by setting it to max - low." Writing `b := a[0:2:2]` gives a slice whose capacity equals its length, so the very first `append` is guaranteed to reallocate and the sharing is guaranteed to end. This is the only way to make the branch deterministic without copying, and it is why library functions that hand out sub-slices of internal buffers should almost always use the three-index form.

## Growth is deliberately unspecified

The spec says only that `append` "allocates a new, sufficiently large underlying array that fits both the existing slice elements and the additional values." It commits to no growth factor. The blog's hand-written `Extend` doubles and adds one, with the comment that adding one means a zero-length slice still grows, and the older slices article's `AppendByte` allocates `(n+1)*2`. Those are illustrations of the technique, not a promise about the built-in.

Leaving the factor unspecified is the right call and it costs you the ability to reason about exact allocation counts. What survives is the [[cs/dsa/amortized-analysis-methods|amortized]] argument: any geometric growth policy makes a sequence of n appends O(n) total, which is the same accounting that justifies every [[cs/dsa/dynamic-arrays|dynamic array]] in every language. Go's slice is that data structure with the header exposed, which is what makes both the performance and the aliasing legible instead of hidden behind a class.

One more property is easy to miss and load-bearing for correctness: for both `append` and `copy`, "the result is independent of whether the memory referenced by the arguments overlaps." Overlapping arguments are defined behavior, not a hazard.

## The retention leak

The other cost of sharing is that a small slice pins a large array. The slices article gives the canonical case: a `FindDigits` function reads a whole file and returns the match. "This code behaves as advertised, but the returned []byte points into an array containing the entire file. Since the slice references the original array, as long as the slice is kept around the garbage collector can't release the array; the few useful bytes of the file keep the entire contents in memory."

The fix is to copy the interesting bytes into a fresh slice before returning. Worth naming for what it is: a reachability leak, where the [[cs/pl/garbage-collection-concepts|collector]] is behaving exactly as specified and the program is still holding megabytes it stopped needing. Slice retention is one of the few Go memory problems that a profiler shows as a live heap rather than as garbage.

## Related Notes

- [[cs/dsa/dynamic-arrays]] - the general structure a Go slice is a transparent instance of
- [[cs/dsa/amortized-analysis-methods]] - why geometric growth makes a sequence of appends cheap on average even though one of them is not
- [[cs/dsa/pass-by-value-and-pass-by-reference]] - the distinction that decides which half of a slice a function can change
- [[cs/pl/garbage-collection-concepts]] - reachability, and why a two-byte slice can keep a file alive
- [[cs/languages/Go/the-go-memory-model]] - what a concurrent write to a multiword value like a slice header can do
- [[cs/languages/Cpp/stl-containers]] - the same growth problem solved with an opaque container and iterator invalidation instead of a visible header

## Sources

- [Go Slices: usage and internals](https://go.dev/blog/slices-intro) - arrays as values, the slice as a descriptor of an array segment, slicing without copying, and the `FindDigits` retention gotcha
- [Arrays, slices (and strings): The mechanics of append](https://go.dev/blog/slices) - the `sliceHeader` struct, pass-by-value semantics of the header, what changes on reallocation, and the requirement to save the result of `append`
- [The Go Programming Language Specification](https://go.dev/ref/spec) - the two branches of `append`, the overlap-independence of `append` and `copy`, and the full slice expression that sets capacity
