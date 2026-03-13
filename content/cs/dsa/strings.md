---
title: Strings
description: Encodings and storage layouts; null-terminated vs length-prefixed; safe slicing, iteration, and search patterns.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-01-24
aliases: []

---

## Overview
A **string** is a sequence of characters stored in memory. Behind this simple idea lie crucial engineering details: **encoding** (ASCII/UTF-8/UTF-16/UTF-32), **storage layout** (null-terminated vs **length-prefixed**), **mutability**, and **iteration semantics** (bytes vs code points vs grapheme clusters). Many correctness and security bugs come from assuming "1 char = 1 byte" or slicing without regard to encoding boundaries. This note builds a practical mental model for strings, with implementation patterns and pitfalls to avoid.

> [!note]
> "Character" is ambiguous. Distinguish among:
> - **Code unit**: minimal storage chunk (byte in UTF-8; 16-bit unit in UTF-16).
> - **Code point**: Unicode scalar value, e.g., U+00E9.
> - **Grapheme cluster**: what users perceive as one character (may be multiple code points, e.g., `👨🏽‍💻`).

## Motivation
Strings sit at the boundary of systems: **I/O**, storage, parsing, rendering, networking, and security. Choosing the right **encoding** and **layout** affects:
- **Correctness** (no broken multi-byte sequences, valid slicing)
- **Performance** (scan costs, cache behavior, memory footprint)
- **Interoperability** (APIs, wire formats)
- **Security** (bounds checks, injection issues, normalization and spoofing)

## Definition and Formalism
A string `S` is a finite sequence over an **alphabet** `Σ`. In practice:
- **ASCII**: 7-bit subset; each char fits in one byte.
- **Unicode**: a superset with > 1.1M possible code points (not all assigned). Popular encodings:
  - **UTF-8**: variable length (1–4 bytes per code point); ASCII-compatible; dominant on the web.
  - **UTF-16**: variable length (1 or 2 **16-bit** code units via surrogate pairs).
  - **UTF-32**: fixed 32-bit units (simplifies indexing; memory-heavy).

Two canonical **storage layouts**:
- **Null-terminated (C-style)**: contiguous bytes ending with `0x00`. Length requires a scan (unless cached).
- **Length-prefixed**: store `len` alongside the buffer; O(1) length queries and safe interior NULs.

> [!tip]
> If you design an API, prefer **length-prefixed** + explicit encoding. Reserve null-terminated only for interop with C libraries.

## Storage Models
### 1) Null-terminated buffers
- **Pros**: Interop with legacy C APIs; simple representation.
- **Cons**: `strlen` is O(n); cannot embed NUL (`\0`) in payload; slicing often creates **aliasing** to interior pointers; many functions assume ASCII; easy to overrun.

### 2) Length-prefixed buffers
- Layout may include **length** and **capacity** (for dynamic growth). Common in higher-level languages; allows embedded NULs; cheap length.

### 3) Small-String Optimization (SSO)
- Very short strings stored **inline** in the object's header to avoid heap allocation (improves locality). Longer strings spill to heap.

### 4) Immune vs mutable
- **Immutable** (e.g., Java, Python): safe sharing and substrings; copy-on-write or interning reduces duplication.
- **Mutable** (e.g., C `char*`, Rust `String`): efficient in-place edits but require careful aliasing and bounds checks.

### 5) Rope / Gap buffer / Piece table
- For **editor** workloads: logarithmic concatenation and cheap middle insertions via trees of chunks (rope) or a gap within a contiguous buffer.

## Encoding: What Iteration Means
- **UTF-8**: Indexing `S[i]` by byte is **not** indexing by character. Valid iteration must step **code points** using first-byte prefix rules (10xxxxxx are continuation bytes).
- **UTF-16**: Index by 16-bit units; surrogate pairs represent non-BMP characters.
- **UTF-32**: Each code unit is a code point; grapheme clusters can still span multiple code points (combining marks, ZWJ sequences).

**Normalization**: Canonical forms (NFC/NFD/NFKC/NFKD) unify visually identical text with different code sequences. Compare either **after normalization** or with **normalization-aware** routines.

> [!warning]
> "Length" depends on the measure:
> - Bytes (storage size)
> - Code points (logical characters)
> - Grapheme clusters (user-perceived characters)
> UI operations should usually use **grapheme clusters**, not raw code points.

## Core Operations
### Membership / Find (byte-safe, encoding-aware)
For **ASCII needles** within UTF-8 text, a byte search works. For arbitrary Unicode, ensure the needle aligns with **code point boundaries**.

```pseudo
function FIND(hay, needle):
    // Assume UTF-8; both inputs validated.
    // Return byte index of first occurrence, or -1.
    if needle is empty: return 0
    i = 0
    while i ≤ len(hay) - len(needle):
        if hay[i] == needle[0] and hay[i .. i+len(needle)-1] == needle:
            // Optional: verify that i and i+len(needle) fall on code point boundaries
            if isCodepointBoundary(hay, i) and isCodepointBoundary(hay, i+len(needle)):
                return i
        i = i + 1
    return -1
````

### Substring / Slice (safe)

Slicing must respect **boundaries**:

```pseudo
// start, end measured in code point indices
function SLICE_BY_CODEPOINTS(s, start, end):
    i = byteOffsetOfCodepoint(s, start)
    j = byteOffsetOfCodepoint(s, end)
    return s[i .. j]          // half-open on bytes
```

For grapheme clusters, replace "code point" with "grapheme" and use a **Grapheme Cluster Boundary** iterator per UAX #29.

### Iteration (UTF-8)

```pseudo
function NEXT_CODEPOINT(s, i) -> (cp, next_i):
    b0 = s[i]
    if b0 < 0x80: return (b0, i+1)
    n = leadingOnes(b0)      // 2..4
    cp = b0 & mask(n)
    for k in 1..n-1:
        bk = s[i+k]
        assert (bk & 0xC0) == 0x80   // continuation 10xxxxxx
        cp = (cp << 6) | (bk & 0x3F)
    return (cp, i+n)
```

Validate input (reject overlong encodings, invalid surrogates).

> [!tip]
> If you frequently need **random access**, keep an **index map** from code point (or grapheme) indices to byte offsets (sampled checkpoints every `K` code points) to get `O(1)` average seek.

## Performance Considerations

- **UTF-8** dominates storage and wire formats—compact for ASCII-heavy text, cache-friendly for western languages.

- **UTF-16** shines with East Asian texts where many characters become single 16-bit units; but surrogate pairs still occur.

- **UTF-32** simplifies code point indexing but quadruples memory; poor cache locality.


**Operations and costs**

- `lenBytes(s)` is O(1) for most layouts.

- `lenCodepoints(s)` in UTF-8/16 is **O(n)** unless you maintain an index.

- `append`:

    - Immutable: create new object or share + copy on write.

    - Mutable: amortized O(1) with geometric capacity growth (like [[dynamic-arrays|Dynamic Arrays]]).

- `concat` many pieces: avoid quadratic behavior by buffering chunks; consider ropes for editors.


**Zero-copy substrings**

- Immutable strings can share the same backing buffer with different (offset, length) views, but beware:

    - **Retention**: a tiny slice keeps a huge original buffer alive → memory leaks by design.

    - Some runtimes copy substrings to avoid retention (e.g., Java changed behavior across versions).


## Common Pitfalls or Edge Cases

> [!warning]
> **Off-by-one slicing.** End indices commonly treated as inclusive vs exclusive inconsistently. Adopt a **half-open** convention `[start, end)`.

> [!warning]
> **Invalid boundaries in UTF-8/16.** Slicing at arbitrary byte or 16-bit indices can split a code point. Always slice on **code point** (or grapheme) boundaries.

> [!warning]
> **Assuming 1 char = 1 byte.** Causes broken UI widths and corrupted processing of multi-byte sequences. Even "characters" visible to users can be **multiple code points** (graphemes).

> [!warning]
> **Normalization issues.** Comparing unnormalized strings may yield false negatives; canonicalize for comparisons and keys (e.g., NFC for storage + case-folding where appropriate).

> [!warning]
> **Embedded NULs and C APIs.** Passing length-prefixed strings with interior `\0` to C APIs that expect NUL-termination will truncate data.

> [!warning]
> **Mutable shared buffers.** Aliasing slices to a mutable buffer invites use-after-free or surprising mutations. Prefer immutable or copy-on-write models across API boundaries.

> [!warning]
> **Locale-dependent case.** `toUpper("i")` vs Turkish `İ`; prefer locale-insensitive case-folding for identity comparisons; specify locale for presentation.

## Implementation Notes or Trade-offs

- **Validation**: On ingest, validate UTF-8/16 (no overlong forms, no isolated surrogates). Store a **validated** flag to skip repeated checks.

- **Normalization strategy**:

    - **At boundaries** (I/O): normalize once, store normalized.

    - **At comparison**: normalize on lookup; cache normalized forms.

- **Indexing aids**:

    - Per-`K` checkpoint table: `(codepointIndex → byteOffset)` for fast seeks.

    - Grapheme break iterator (UAX #29) for UI cursor movement, deletion, and display width.

- **Search**:

    - For general text, use **two-way** or **KMP** over bytes if both haystack and needle are normalized and encoding-aligned.

    - For large-scale search, maintain additional structures (e.g., suffix arrays/automata) on code points, not bytes.

- **Hashing**:

    - Hash **normalized** strings.

    - Cache hash with the string object (invalidated on mutation) to make dict/set operations O(1) average with low constants. See [[hash-tables|Hash Tables]].

- **Memory**:

    - Prefer UTF-8 for storage + transport.

    - Avoid keeping many small heap allocations: **SSO** and **arena allocators** help.

    - For logs/telemetry, compress after chunking to preserve CPU.

## Practical Patterns

### Substring scan (ASCII needle in UTF-8 text)

```pseudo
function FIND_ASCII(hay, ch) -> int:
    // ch is ASCII (0..127)
    for i in 0..len(hay)-1:
        if hay[i] == ch: return i
    return -1
```

Safe because ASCII bytes are never continuation bytes in UTF-8.

### Case-insensitive compare (locale-insensitive)

```pseudo
function EQUALS_CASEFOLD(a, b) -> bool:
    return NFC(caseFold(a)) == NFC(caseFold(b))
```

Use Unicode **simple case folding** for identity tasks; avoid locale-specific surprises.

### Safe truncate for preview

```pseudo
function TRUNCATE_GRAPHEMES(s, k) -> string:
    it = graphemeIterator(s)
    count = 0; endByte = 0
    while it.hasNext() and count < k:
        (start, end) = it.nextSpan()   // byte range of next grapheme
        endByte = end
        count = count + 1
    return s[0 .. endByte]
```

Never cut in the middle of a grapheme; ensures UI correctness.

## Applications

- **Parsers & tokenizers**: protocol messages, programming languages—prefer normalized, validated Unicode.

- **Search & indexing**: substring search over normalized text; for prefix systems, consider [[standard-trie|Standard Trie]]; for heavy-duty indexing, suffix structures.

- **User interfaces**: cursor movement, deletion, and selection by **grapheme clusters**; rendering width requires East Asian Width and combining mark rules.

- **Security**: defense against **homoglyph** attacks and mixed-script identifiers; normalize and restrict allowed scripts where feasible.


## Summary

Strings combine **encoding**, **layout**, and **semantics**. Choose a clear **encoding** (UTF-8 by default), a safe **layout** (length-prefixed where possible), and iterate/slice on the correct **boundary type** (code points or graphemes, not arbitrary bytes). Normalize for comparisons and hashing, validate on input, and design APIs that make misuse hard. With these habits, you can write string-heavy code that is fast, correct, and robust across languages and platforms.

## See also

- [[standard-trie|Standard Trie]]

- [[compressed-trie|Compressed Trie]]

- [[hash-tables|Hash Tables]]

- [[bitwise-operations|Bit Manipulation]]
