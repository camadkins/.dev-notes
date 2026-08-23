---
title: "String vs str, and the UTF-8 Invariant"
description: "Two string types for the same reason there are two sequence types, plus the question indexing cannot answer and the invariant that makes both safe."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-30
updated:
aliases:
  - String and str
  - String Slices
---

Every newcomer to Rust asks the same question in the first week: why are there two string types, and which one do I write in a signature? The short answer is that `String` and `str` stand in exactly the relationship that `Vec<T>` and `[T]` do, and the same reasoning applies. The long answer involves a decision about Unicode that Rust made early and has never softened.

> [!note] The idea
> `String` refuses integer indexing not because indexing is hard but because there is no defensible answer to what it should return. A byte, a Unicode scalar value, and a grapheme cluster are three different things at three different positions, and UTF-8 makes them disagree the moment your text leaves ASCII. Rather than pick one and be wrong for two thirds of the world's writing systems, the language makes you name which interpretation you meant. The performance argument, that indexing should be constant time and cannot be here, is real but secondary.

## Two types, one relationship

`String` is a UTF-8 encoded, growable string, and it is the most common string type. It has ownership over the contents, stored in a heap-allocated buffer. Its representation is three components: a pointer to some bytes, a length, and a capacity. The length is the number of bytes currently stored, the capacity is the size of the buffer in bytes, and length is always less than or equal to capacity. That is the same triplet as [[cs/languages/Rust/slices-vec-and-capacity|`Vec<T>`]], which is not a coincidence: the Book describes `String` as a wrapper over a `Vec<u8>`.

`str`, the string slice, is the most primitive string type, usually seen borrowed as `&str`. It is made up of two components: a pointer to some bytes and a length. Same fat pointer, no capacity, because a view has no business knowing how much room the owner has left. String literals are string slices with a static lifetime, guaranteed valid for the duration of the entire program, which is why `"hello"` is a `&'static str` and not something that needs allocating.

`String` implements `Deref<Target = str>`, so it inherits all of `str`'s methods, and passing `&some_string` to a function taking `&str` works through deref coercion. That conversion is very inexpensive, and so generally functions accept `&str` unless they need a `String` for a specific reason. The habit is the same one as taking `&[T]` rather than `&Vec<T>`, and it fails in the same corner: when a generic bound means the compiler would need two implicit conversions, coercion does not fire and you write `.as_str()`.

## What indexing would have to mean

In many other languages, accessing individual characters in a string by index is a valid and common operation. In Rust, `s1[0]` on a `String` does not compile: the type `str` cannot be indexed by an integer, because `SliceIndex<str>` is not implemented for integers.

The reason is arithmetic. `"Hola"` has a length of 4, one byte per letter. `"Здравствуйте"` has a length of 24, not 12, because each Unicode scalar value in that string takes two bytes to encode in UTF-8. Therefore an index into the string's bytes will not always correlate to a valid Unicode scalar value. Ask for byte 0 of that string and the honest answer is 208, the first byte of the two-byte encoding of З, which is not a valid character on its own and is certainly not what anyone asking for "the first letter" wanted. Rust refuses to compile the code rather than return the wrong thing quietly.

Even ASCII does not rescue the design, because the return type is still ambiguous. If `"hi"[0]` were valid and returned a byte, it would give 104, not `h`.

The Book's clearest passage names the three levels. There are three relevant ways to look at strings from Rust's perspective: as bytes, as scalar values, and as grapheme clusters, the closest thing to what we would call letters. The Hindi word नमस्ते is 18 bytes; as Unicode scalar values, which are what Rust's `char` type is, it is six `char`s, of which the fourth and sixth are diacritics that do not make sense on their own; as grapheme clusters it is the four letters a person would count. One string, three defensible lengths. This is the general problem of [[cs/languages/common/text-encoding-and-unicode|text encoding]], and Rust's contribution is refusing to hide it behind a subscript.

A final reason is cost. Indexing operations are expected to always take constant time, and `String` cannot guarantee that, because Rust would have to walk from the beginning to the index to determine how many valid characters there were. Variable-width encoding turns a subscript into a scan, which breaks the [[cs/dsa/array-operations|array cost model]] every programmer carries in their head.

Range slicing is allowed, and the ranges are byte offsets. `&hello[0..4]` on that Cyrillic string is `Зд`, the first two two-byte characters. Slice on a boundary that falls inside a character and the program panics at run time with `byte index 1 is not a char boundary`. The Book's own advice: use caution when creating string slices with ranges, because doing so can crash your program.

## The invariant

Both types carry the same guarantee, and it is stronger than "the constructors validate." Rust libraries may assume that string slices are always valid UTF-8. Constructing a non-UTF-8 string slice is not immediate undefined behavior, but any function called on a string slice may assume validity, which means a non-UTF-8 string slice can lead to undefined behavior down the road. `Strings` are always valid UTF-8, and if you need a non-UTF-8 string the standard library offers `OsString`, which is similar but without the UTF-8 constraint.

This is a type-level invariant maintained by unsafe code, exactly like the ones described in [[cs/languages/Rust/unsafe-rust-and-its-contract|the unsafe contract]]. `String::from_utf8` returns a `Result` because the check is real; `from_utf8_unchecked` skips it and is unsafe because skipping it wrongly poisons every later operation rather than only the constructor. The safe surface of the type is what makes the assumption sound for everyone downstream.

> [!warning] Length is bytes, and it says so
> `str::len` returns the length in bytes, not `char`s or graphemes, and the documentation adds that it might not be what a human considers the length of the string. `"ƒoo".len()` is 4 while `"ƒoo".chars().count()` is 3. Any code that computes a column position, truncates a display field, or validates a maximum length from `len()` is measuring storage, not text. That distinction is where a surprising share of [[cs/security/integer-overflow-vulnerabilities|length-arithmetic bugs]] in text handling begin, in every language, and Rust at least forces you to write the word `bytes` or `chars` and thereby say which one you meant.

## Related Notes

- [[cs/languages/common/text-encoding-and-unicode|Text Encoding and What a String Actually Is]] - the encoding layer these two types are built on
- [[cs/languages/Rust/slices-vec-and-capacity|Slices, Vec, and Capacity]] - the same owned-versus-borrowed split one type over, with the same three fields
- [[cs/languages/Rust/unsafe-rust-and-its-contract|Unsafe Rust and Its Contract]] - what maintaining the UTF-8 invariant obliges an unsafe constructor to do
- [[cs/dsa/strings|Strings]] - the data-structure view, where a string is a sequence and indexing is assumed cheap
- [[cs/dsa/array-operations|Array Operations]] - the constant-time indexing model that variable-width encoding breaks
- [[cs/languages/Rust/iterators-and-adapters|Iterators and Adapters in Rust]] - `chars`, `bytes`, and `char_indices` as the three answers the type makes you pick between

## Sources

- "String in std::string," Rust standard library documentation. https://doc.rust-lang.org/std/string/struct.String.html . Supports `String` being UTF-8 encoded, growable, and heap-owning, the pointer-length-capacity representation with length in bytes, the always-valid-UTF-8 rule and `OsString` as the unconstrained alternative, and `Deref<Target = str>` with inexpensive coercion.
- "Primitive Type str," Rust standard library documentation. https://doc.rust-lang.org/std/primitive.str.html . Supports `str` as the most primitive string type, the pointer-and-length representation, string literals having a static lifetime, the library-wide UTF-8 assumption and the downstream undefined behavior a violation causes, and `len` being measured in bytes rather than characters or graphemes.
- "Storing UTF-8 Encoded Text with Strings," The Rust Programming Language. https://doc.rust-lang.org/book/ch08-02-strings.html . Supports indexing being common elsewhere and rejected here, `String` as a wrapper over `Vec<u8>`, the 24-byte Cyrillic example and the mismatch between byte indices and scalar values, the bytes-scalars-graphemes distinction with the Devanagari example, the constant-time argument against indexing, and the char-boundary panic on a bad range slice.
