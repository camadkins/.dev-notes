---
title: "Slices, Vec, and Capacity"
description: "The slice as a pointer and a length, the three fields Vec promises to be, and why capacity is a number you can trust."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-07-09
updated:
aliases: []
---

Most languages give you one growable sequence type and one way to talk about a piece of it. Rust splits the job in two, and the split shows up in every function signature you write. `Vec<T>` owns a heap buffer. `&[T]` borrows a run of elements without owning anything. Nearly all library code takes the second, because in Rust it is more common to pass slices as arguments rather than vectors when you just want to provide read access.

> [!note] The idea
> A slice is a pointer with a length welded to it, and that welding is what makes bounds checking a local operation. Because slices store the length of the sequence they refer to, they have twice the size of pointers to sized types, so `&[u8]` is two words where `&u8` is one. C passes an array as a bare pointer and the length as a separate argument that the type system does not connect to it, which is the shape of a decades-long class of bugs. Rust makes them one value, and the runtime cost is one extra word per reference.

## The slice

A slice is a dynamically sized view into a contiguous sequence, written `[T]`. Contiguous means elements are laid out so that every element is the same distance from its neighbors, which is what makes indexing a multiply and an add. The value you actually hold is a view into a block of memory represented as a pointer and a length. Slices come shared as `&[T]` or mutable as `&mut [T]`, and you get one by borrowing an array, a `Vec`, or a subrange of another slice.

The type `[T]` itself is unsized, so it cannot be a local variable or a function argument by value. It exists only behind a pointer, and every such pointer is fat: `&[u8]`, `*const [u8]`, `Box<[u8]>`, and `Rc<[u8]>` are all two pointers wide. That is the mechanism behind subslicing being free. `&v[2..5]` builds a new fat pointer with an offset base and a length of three, allocating nothing and copying nothing.

The safety argument is the interesting part, and it is not the bounds check. A bounds check makes an individual access safe. What makes a slice safe as a value is that the [[cs/languages/Rust/borrowing-and-lifetimes|borrow]] it carries prevents the underlying buffer from being reallocated or dropped while the slice is alive. Holding a `&[T]` into a `Vec` means the `Vec` is immutably borrowed, so no `push` can happen, so the pointer inside the slice cannot be left dangling by a reallocation. [[cs/languages/Go/slices-arrays-and-the-append-aliasing-trap|Go's slices]] have the same representation and no such rule, which is why `append` aliasing is a documented Go hazard and has no Rust analogue.

## `Vec<T>` and its promises

`Vec<T>` is a contiguous growable array type. The standard library documents its representation as a guarantee rather than an implementation detail, because the type is fundamental enough that unsafe code needs to manipulate it in primitive ways. Most fundamentally, `Vec` is and always will be a pointer, capacity, length triplet. No more, no less. The field order is unspecified, the pointer will never be null so the type is null-pointer-optimized, and if the vector has allocated, the pointer points to `len` initialized contiguous elements followed by `capacity - len` logically uninitialized ones.

Capacity is the amount of space allocated for any future elements, which is not to be confused with length, the number of actual elements within the vector. If length would exceed capacity, capacity is automatically increased, but the elements have to be reallocated, which means a fresh allocation and a copy. This is the [[cs/dsa/dynamic-arrays|dynamic array]] in its textbook form, and the cost model is the textbook one: `Vec` does not guarantee any particular growth strategy when reallocating, but whatever strategy is used will guarantee amortized constant-time `push`. The [[cs/dsa/amortized-analysis-methods|amortized argument]] is what licenses treating a `push` as cheap despite the occasional linear copy, and it is why the docs recommend `Vec::with_capacity` whenever you know roughly how big the vector will get.

Several of the guarantees are refusals, and each has a reason attached.

`Vec` will never perform a small-vector optimization storing elements inline on the stack. Two reasons: it would make correct unsafe manipulation harder, since the contents would not have a stable address across a move, and it would penalize the general case by incurring an additional branch on every access. A library type can make the opposite tradeoff, but the standard one refuses to make every index conditional.

`Vec` will never automatically shrink itself, even when completely empty, which ensures no unnecessary allocations or deallocations occur. Emptying a vector and refilling it to the same length should incur no calls to the [[cs/systems/memory-allocators-and-fragmentation|allocator]]. Reclaiming the space is an explicit `shrink_to_fit`.

And the reported capacity is exact. `push` and `insert` will never reallocate if the reported capacity is sufficient and will reallocate when length equals capacity, so the number is completely accurate and can be relied on, down to being usable to manually free the memory. A `Vec` also does not necessarily hold an allocation at all: it allocates if and only if the element size times the capacity is greater than zero, so `Vec::new` and a vector of zero-sized types touch no allocator.

> [!warning] Removed elements are not erased
> `Vec` will not specifically overwrite data removed from it, and also will not specifically preserve it. Its uninitialized memory is scratch space it may use however it wants, so do not rely on removed data to be erased for security purposes. Dropping the vector does not help, since the buffer may simply be reused by another allocation, and zeroing it first may not survive the optimizer, which does not treat the write as a side effect that must be preserved. Erasing a secret is a job for a type that guarantees it, not for a container that never promised.

> [!example] Reading the triplet
> A vector holding `'a'` and `'b'` with capacity 4 is a struct of three fields, a pointer such as `0x0123`, a length of 2, and a capacity of 4, pointing at a heap block of four slots where the first two hold the elements and the last two are uninitialized. Coerce it to `&[char]` and you get a fat pointer built from the first and second fields, with the capacity dropped on the floor. The slice does not know how much room is left, because a reader has no business knowing.

## The two-type split, restated

Ownership belongs to `Vec`, viewing belongs to `[T]`, and the same split appears one type over in `String` and `str`, which is its own note. Accepting `&[T]` rather than `&Vec<T>` costs the caller nothing, works for arrays and boxed slices as well as vectors, and says in the signature that the function will not grow anything. The habit is worth forming early, and the deref coercion from `&Vec<T>` to `&[T]` means it costs you nothing to adopt.

## Related Notes

- [[cs/dsa/dynamic-arrays|Dynamic Arrays]] - the growable-array data structure `Vec` is one implementation of
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis]] - the argument that makes push cheap despite periodic reallocation
- [[cs/languages/Go/slices-arrays-and-the-append-aliasing-trap|Slices, Arrays, and the append Aliasing Trap]] - the same representation without the borrow rule, and the bug that follows
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes in Rust]] - the rule that stops a reallocation from invalidating a live slice
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - what the reallocation on growth actually asks of the allocator
- [[cs/security/buffer-overflows|Buffer Overflows]] - the failure the pointer-plus-length pairing is designed to remove

## Sources

- "Primitive Type slice," Rust standard library documentation. https://doc.rust-lang.org/std/primitive.slice.html . Supports the definition of a slice as a dynamically sized view into a contiguous sequence, the meaning of contiguous, the pointer-and-length representation, shared versus mutable slice types, and slices being twice the size of a pointer to a sized type.
- "Vec in std::vec," Rust standard library documentation. https://doc.rust-lang.org/std/vec/struct.Vec.html . Supports `Vec` as a contiguous growable array, the recommendation to pass slices for read access, capacity versus length and automatic reallocation, the `with_capacity` advice, the pointer-capacity-length guarantee and non-null pointer, the initialized-then-uninitialized layout, the refusal of small-vector optimization and its two reasons, never shrinking automatically, capacity being exact and reallocation happening only at `len == capacity`, the allocate-only-if-nonzero rule, the absence of a guaranteed growth strategy with amortized constant push, and the warning against relying on removed data being erased.
