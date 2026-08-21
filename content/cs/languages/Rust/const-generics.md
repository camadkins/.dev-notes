---
title: Const Generics
description: "Parameterizing a type by a value rather than a type, what the 1.51 minimum viable product actually stabilized, and the macro-generated impls it retired."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-30
updated:
aliases:
  - Rust Const Generics
  - Generic Over Array Length
---

Rust had one const generic type from the beginning and did not let anyone else have one. The array type `[T; N]` is parameterized by a type and by a length, and the length is part of the type: `[u8; 4]` and `[u8; 5]` are as different as `u8` and `String`. Until 1.51 that ability was reserved for the language itself. There was no way to abstract over arrays of an arbitrary size, so implementing a trait for arrays of any size meant doing it manually for each possible value.

> [!note] The idea
> Const generics are generic arguments that range over constant values rather than over types or lifetimes. The interesting part is what that does to the compile-time and runtime split. A length that is a type parameter is known during [[cs/languages/Rust/monomorphization-and-code-bloat|monomorphization]], so bounds checks against it fold away, layouts are computed statically, and dimension mismatches become type errors rather than runtime panics. A length that is a struct field is data, checked when the program runs. Const generics let a library author choose which side of that line a quantity lives on, and that choice is usually more consequential than the syntax suggests.

## What the length in a type buys

The shape is small. A struct generic over a value declares it like a type parameter with an extra keyword and a type ascription.

```rust
struct ArrayPair<T, const N: usize> {
    left: [T; N],
    right: [T; N],
}
```

`ArrayPair<u8, 32>` monomorphizes to a struct containing two 32-byte arrays. Nothing is stored to record that 32, because the compiler already knows it. Two consequences follow immediately.

The first is safety that costs nothing at runtime. Writing the pair with `left` and `right` sharing one `N` makes a mismatched pair unrepresentable. Fixed-size cryptographic digests, matrix dimensions, and protocol frames all have this shape: a quantity that is genuinely constant per use site and catastrophic to get wrong. Compare with keeping a length in a field, where the check must be written, must be tested, and must run.

The second is layout. Because the value is present at compile time, `ArrayPair<u8, 32>` is a concrete struct with a concrete size, and it can be stack allocated and passed by value the way [[cs/dsa/arrays|a fixed-size array]] can, without the indirection that a [[cs/languages/Rust/slices-vec-and-capacity|`Vec` or a slice]] requires. Const generics recover the C ability to say "an array of exactly this many" without giving up the ability to write code once.

The mechanism is what [[cs/languages/Cpp/templates-and-generic-programming|C++ non-type template parameters]] have provided for decades, and the family resemblance is not accidental. Both languages instantiate per parameter value, so both get the same benefit and pay the same bill in code size. Rust deliberately took a smaller bite of it.

## The MVP, and what it deliberately left out

The 1.51 stabilization was scoped as a minimum viable product, and the scoping is legible in two restrictions.

**Only integral types, plus `char` and `bool`.** The only types usable as the type of a const generic argument are the integer types, signed and unsigned including `isize` and `usize`, along with `char` and `bool`. Struct and enum values remain unstable. The announcement is explicit that this covers a primary use case, abstracting over arrays, and that the restriction is intended to be lifted later to allow more complex types such as `str` and user-defined types.

**No complex generic expressions in const arguments.** A const parameter may be instantiated by a standalone const parameter, a literal, or a concrete constant expression in braces involving no generic parameters. So `foo::<M>()` is fine when `M` is a const parameter, `foo::<2021>()` is fine, and `foo::<{ 20 * 100 + 20 * 10 + 1 }>()` is fine because the expression mentions no generics. But `foo::<{ M + 1 }>()` is an error, because the const expression contains the generic parameter `M`, and `[u8; std::mem::size_of::<T>()]` is an error for the same reason.

That second restriction is the one people hit, because concatenating two arrays or splitting one in half wants exactly `N + M` and `N / 2`. The MVP post gives the reason such expressions are hard rather than merely unimplemented: without a way to restrict the possible values of a parameter, calling a function instantiated at `0` could produce an error while evaluating `0 - 1` that is not caught at declaration time and so may unexpectedly fail for downstream users. An arithmetic expression in a type turns an ordinary overflow into a type error that appears at a call site far from the definition, which is a soundness-and-diagnostics problem, not a parsing problem. It is the same reason [[cs/pl/type-systems-goals-guarantees|type systems]] that admit arbitrary computation in types have to answer for when and where that computation is checked.

## What it replaced

The concrete before-and-after is the standard library's array support. For a long time even the standard library methods for arrays were limited to arrays of length at most 32 because of this problem, and that restriction was finally lifted in Rust 1.47 by a change made possible by const generics.

The mechanism behind that number is worth naming. Without a way to be generic over the length, a trait covering `[T; 0]` through `[T; 32]` had to be implemented manually for each possible value, so the cutoff was a written-out list rather than a principle. It was arbitrary, visible in the documentation, and a permanent tax on every trait that wanted to cover arrays. `array::IntoIter` was stabilized as part of the same release, a standard library API built on the feature, allowing arrays to be iterated by value rather than by reference.

> [!warning] The cost is still per instantiation
> Every distinct value of `N` produces a distinct type and its own machine code. A function generic over `const N: usize` called at twenty lengths is twenty bodies, exactly as if it were generic over twenty types. This is the right tradeoff for a digest size or a matrix dimension used in a handful of shapes. It is the wrong tradeoff for something that varies across a wide range, where a slice and a runtime length is both smaller and faster to compile.

The design lesson is that const generics do not add expressiveness so much as they move a decision. Before, a library author who wanted compile-time sizes wrote a macro and picked a cutoff. Now the cutoff is gone, and the question becomes which quantities are genuinely fixed at the call site, since every one that is gets checked for free and every one that is not gets duplicated for nothing.

## Related Notes

- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - why one instantiation per value of `N` is the same bill as one per type
- [[cs/languages/Rust/slices-vec-and-capacity|Slices, Vec, and Capacity]] - the runtime-length alternative, and when a length belongs in a field instead of a type
- [[cs/dsa/arrays|Arrays: Fixed-Size Contiguous Storage]] - the data structure whose defining property is the one being lifted into the type
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - non-type template parameters, the same idea with fewer restrictions and more ways to lose
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - values in types, and what a type system owes you once it admits computation
- [[cs/languages/Rust/generic-associated-types|Generic Associated Types]] - the other axis the MVP touches, since a GAT may carry const parameters too

## Sources

- "Announcing Rust 1.51.0," The Rust Blog. https://blog.rust-lang.org/2021/03/25/Rust-1.51.0/ . Supports the stabilization of a const generics MVP in 1.51, the observation that arrays include their length in their type and previously could not be generic over it, the ability to be generic over values of any integer, `bool`, or `char` type with struct and enum values still unstable, the monomorphization of `Array<u8, 32>`, and the stabilization of `std::array::IntoIter` for by-value array iteration.
- "Const Generics MVP Hits Beta," The Rust Blog. https://blog.rust-lang.org/2021/02/26/const-generics-mvp-beta/ . Supports the definition of const generics as generic arguments ranging over constant values, `[T; N]` as the pre-existing example, the absence of any way to abstract over arrays of arbitrary size, the standard library's length-32 limit and its lifting in Rust 1.47, the `ArrayPair` example, the integral-plus-`char`-plus-`bool` restriction and its intended future relaxation, the three permitted forms of const argument with the `M + 1` and `size_of::<T>()` errors, and the `0 - 1` argument for why unrestricted expressions are hazardous for downstream users.
