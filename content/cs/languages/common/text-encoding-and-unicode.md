---
title: Text Encoding and What a String Actually Is
description: "Bytes, code points, and grapheme clusters are three different things, and every language picks which one its string type exposes."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-04-11
updated:
aliases:
  - Unicode in Practice
  - UTF-8 and String Types
  - Bytes vs Code Points
---

Ask a program for the length of a piece of text and you are asking a question that has at least three defensible answers. The Hindi word नमस्ते is 18 bytes on disk, 6 Unicode scalar values in memory, and 4 letters to a person reading it. None of those numbers is wrong. They answer different questions, and the reason [[cs/dsa/strings|string handling]] feels slippery across languages is that each language has quietly decided which of the three its string type is going to be about.

> [!note] The idea
> A "string" is not one abstraction, it is a stack of three: a byte sequence, a sequence of code points, and a sequence of grapheme clusters (what a person calls letters). UTF-8 is the mapping between the first two, and no encoding gives you the third for free. A language's string design is a decision about which layer it exposes by default and which it makes you ask for, and that single decision drives whether `s[0]` is legal, whether length is O(1), and whether your text bugs surface at compile time or in production on a non-ASCII input.

## The three layers, and where UTF-8 sits

Unicode assigns each character a code point, an integer in the range 0 to 0x10FFFF, written in the U+265E style. That is the abstract layer. To put a code point in memory or on a wire it has to become bytes, and the rules for that translation are a character encoding. The Python documentation is explicit that a Unicode string is a sequence of code points which then has to be represented as code units and mapped to 8-bit bytes.

The obvious encoding, one 32-bit integer per code point, was tried and mostly abandoned. Python's Unicode HOWTO lists the three reasons it fails: it is not portable because different processors order bytes differently, it is wasteful because most code points in most text are under 127 so the representation is full of zero bytes, and it is incompatible with C functions like `strlen()` because those zero bytes look like [[cs/security/buffer-overflows|string terminators]].

UTF-8 fixes all three by being byte oriented and variable width. RFC 3629 defines it as encoding characters in the U+0000 to U+10FFFF range using sequences of 1 to 4 octets, with a lead octet whose high bits announce the sequence length and continuation octets that all begin `10`. The properties that follow from that layout are why it won. Code points U+0000 to U+007F map to octets 00 to 7F, so a plain ASCII string is already a valid UTF-8 string. US-ASCII octet values never appear anywhere else in the stream, which keeps software that parses on ASCII values (the RFC names `printf()`) working on text it does not understand. Character boundaries can be found from anywhere in the stream, so a decoder that starts mid-buffer can resynchronize. And the octet values C0, C1, and F5 through FF never appear at all, which is part of why a simple algorithm can recognize UTF-8 with reasonable confidence.

The layer UTF-8 does not give you is the third one. A grapheme cluster, the unit a human calls a letter, can be several code points: a base character plus combining marks. No amount of decoding bytes into code points gets you there, because the grouping rule lives in the Unicode standard's text-segmentation data, not in the encoding.

## Rust: the layers are visible and you must pick one

Rust's `String` is a wrapper over a `Vec<u8>` holding UTF-8, and the consequences of that are pushed directly into the programmer's face. `String::from("Hola")` has length 4 because each letter is one byte in UTF-8. `String::from("Здравствуйте")` has length 24, not 12, because each Unicode scalar value in that string takes 2 bytes. So a byte index does not correspond to a character position, and Rust responds by refusing to compile `s1[0]` at all: the Book's stated reason is that returning byte 208 when the user asked for the first letter would cause bugs that might not be discovered immediately.

There is a second reason, and it is the more interesting one. Indexing is expected to be [[cs/dsa/time-complexity-analysis|O(1)]], and Rust cannot promise that for a `String`, because it would have to walk the buffer from the beginning to count valid characters. Variable-width encoding and constant-time indexing are simply incompatible; a language can have one or the other. Rust chose to keep the O(1) promise honest by removing the operation.

What you get instead is an explicit choice of layer. `.bytes()` iterates raw bytes, `.chars()` iterates Unicode scalar values, and grapheme clusters are not in the standard library at all because getting them is complex, so that job goes to a crate. Range slicing on byte offsets is allowed but will panic at runtime if the range splits a character: the error message reports that the byte index is not a char boundary. The Book's own summary of the tradeoff is that Rust exposes more of the complexity of strings than other languages do, in exchange for not handling non-ASCII bugs later in the development cycle.

> [!example] One word, three answers
> Take नमस्ते. As bytes it is the 18-element `u8` vector `[224, 164, 168, ...]`, which is how the machine actually stores it. As Unicode scalar values (Rust's `char`) it is six items, `['न', 'म', 'स', '्', 'त', 'े']`, and the fourth and sixth of those are diacritics that mean nothing standing alone. As grapheme clusters it is the four letters a Hindi reader sees, `["न", "म", "स्", "ते"]`. A loop that truncates "the first 10 characters" is picking one of these three layers whether the author realized it or not.

## Python: code points by default, bytes when you ask

Python 3 draws the line one layer up. Since 3.0 the `str` type contains Unicode characters, and the default encoding for Python source itself is UTF-8, so a literal can contain any character directly. Indexing and length work at the code point layer, which is why `len()` on a string of accented text matches intuition better than Rust's byte count, and why the byte layer is a separate type (`bytes`) that you convert to and from deliberately.

That design buys ergonomics and pays for it in two places. The conversion boundary between `str` and `bytes` becomes a place where an encoding assumption has to be stated, which is exactly the source of the decode errors that show up the first time non-ASCII data arrives. And the third layer is still missing: Python's code point view treats a base character plus a combining mark as two elements, so the same grapheme-cluster gap exists, just one level higher than Rust's.

## The tradeoff, stated plainly

The choice is which layer is the default, and every option is a real position:

- **Bytes as the default** (C's `char*`, and Rust's underlying representation) is fastest and most honest about storage, and it makes every text operation the programmer's problem.
- **Code points as the default** (Python 3's `str`) matches intuition for most alphabetic text and hides the encoding boundary until data crosses it.
- **Grapheme clusters as the default** is what users actually mean and what no mainstream systems language does, because the segmentation rules are large, version with the Unicode standard, and cannot be implemented with arithmetic on the bytes alone.

The engineering consequence is a rule of thumb: any code that slices, truncates, reverses, or counts text is making a layer choice. If it did not name the layer, it picked bytes, and it will be correct until the first non-ASCII input arrives.

## Related Notes

- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - encoding text is the same problem as encoding a struct, one layer down
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - why UTF-8's avoidance of embedded zero bytes matters at the C boundary
- [[cs/dsa/strings|Strings]] - the data-structure view of the same object
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - `String` as a heap-owned `Vec<u8>` and what owns it

## Sources

- "UTF-8, a transformation format of ISO 10646," RFC 3629 (Yergeau, November 2003). https://www.rfc-editor.org/rfc/rfc3629.txt . Supports the U+0000 to U+10FFFF range encoded in 1 to 4 octets, the lead/continuation octet layout, ASCII strings being valid UTF-8, ASCII octet values not appearing elsewhere in the stream (with the `printf()` example), character boundaries being findable from anywhere, and the octet values C0, C1, F5 to FF never appearing.
- "Storing UTF-8 Encoded Text with Strings," The Rust Programming Language (official book). https://doc.rust-lang.org/book/ch08-02-strings.html . Supports `String` being a wrapper over `Vec<u8>`, the "Hola" = 4 and "Здравствуйте" = 24 byte lengths, the refusal to compile integer indexing and its two stated reasons (misleading byte values and the O(1) indexing expectation), the bytes / scalar values / grapheme clusters split with the नमस्ते example, the char-boundary panic on bad slices, and the stated complexity tradeoff.
- "Unicode HOWTO," Python documentation. https://docs.python.org/3/howto/unicode.html . Supports code points as integers from 0 to 0x10FFFF and the U+265E notation, the code-points-to-code-units-to-bytes model, the three failures of a 32-bit-per-code-point encoding (byte order, space, `strlen()` incompatibility), and `str` holding Unicode since Python 3.0 with UTF-8 as the default source encoding.
