---
title: Huffman Coding
description: Optimal prefix codes built greedily by repeatedly merging the two least frequent symbols into a binary tree; supports compact encoding and linear-time decoding.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-30
aliases: []
---

## Overview

**Huffman coding** constructs an **optimal prefix-free binary code** for a known set of symbol frequencies. The algorithm is **greedy**: repeatedly merge the **two least frequent** nodes, forming their parent with weight equal to the sum, until a single tree remains. Labeling left/right edges as `0/1` (convention) yields codewords by reading edge labels from root to leaf. Encoding replaces each symbol with its codeword; decoding walks the tree following bits to a leaf.

## Core Idea

If two symbols are the least frequent, any optimal prefix code places them as **siblings at maximum depth**. Merging them into a single meta-symbol of weight `f1+f2` preserves optimality inductively. Repeating this choice constructs an optimal tree. The code is **prefix-free** (no codeword is a prefix of another) because all symbols correspond to **leaves** in a binary tree.

## Algorithm Steps / Pseudocode

```pseudo
// Input: symbols s_i with positive frequencies f_i (i=1..k)
// Output: code table Code[s] mapping each symbol to a 0/1 string

function HUFFMAN(symbols, freqs):
    Q = min-heap of nodes    // each leaf: node {sym, freq, left=NIL, right=NIL}
    for each (s, f) in (symbols, freqs):
        Q.insert(new_leaf(s, f))

    if Q.size == 1:          // single-symbol edge case
        leaf = Q.extract_min()
        return { leaf.sym : "0" }  // assign a 1-bit code for decodability

    while Q.size > 1:
        x = Q.extract_min()
        y = Q.extract_min()
        z = new_node(freq = x.freq + y.freq, left = x, right = y)
        Q.insert(z)

    root = Q.extract_min()
    Code = empty map
    DFS_BUILD_CODES(root, prefix="")
    return Code

function DFS_BUILD_CODES(node, prefix):
    if node is leaf:
        Code[node.sym] = (prefix == "" ? "0" : prefix) // handle empty prefix
        return
    DFS_BUILD_CODES(node.left,  prefix + "0")
    DFS_BUILD_CODES(node.right, prefix + "1")
```

> [!tip]
> The **single-symbol** case needs a 1-bit code (e.g., `"0"`) so that decoding is possible from bits; otherwise the empty string would be ambiguous across boundaries.

## Example or Trace

Alphabet `{A:45, B:13, C:12, D:16, E:9, F:5}` (classic example).

1. Initialize heap with six leaves (weights 45, 13, 12, 16, 9, 5).

2. Extract two minima `F(5)` and `E(9)` → merge to `N1(14)`.

3. Extract `C(12)` and `B(13)` → merge to `N2(25)`.

4. Extract `N1(14)` and `D(16)` → merge to `N3(30)`.

5. Extract `N2(25)` and `N3(30)` → merge to `N4(55)`.

6. Extract `A(45)` and `N4(55)` → merge to `Root(100)`.


Assign bits (left=`0`, right=`1` for illustration), derive codes from root→leaf paths. One valid optimal assignment:

```
A: 0
B: 101
C: 100
D: 111
E: 1101
F: 1100
```

Encoding the string `ABAC` becomes `0 101 0 100` → `01010 100` (spaces added for readability). Decoding consumes bits from the root: whenever a leaf is hit, output the symbol and reset to root.

## Complexity Analysis

- **Build time:** `O(k log k)` for `k` distinct symbols using a min-heap (each merge is an extract/extract/insert). If the frequencies are provided in **sorted order**, a linear-time **two-queue** method achieves `O(k)`.

- **Space:** `O(k)` for the tree and code table.

- **Encoding time:** `O(∑ len(code(s)) · count(s))` which is linear in the number of input symbols once the code table is known (array/hash lookup per symbol).

- **Decoding time:** Linear in bits of the encoded stream (walks the tree one edge per bit).


The total coded length is `L = ∑ f(s) · len(code(s))`, which is **minimal** among all prefix codes for the given frequency multiset.

## Optimizations or Variants

- **Canonical Huffman codes.** Instead of storing the entire tree, store just **code lengths** and assign lexicographically by length to get a **canonical** mapping. This yields faster I/O (compact tables) and deterministic codes - common in DEFLATE/PNG.

- **r-ary Huffman.** For `r`-ary alphabets, merge the `r` smallest nodes at each step; complexity is `O(k log k)` with an `r`-ary heap. Ensures prefix-free codes over an `r`-symbol digit alphabet.

- **Length-limited Huffman.** Some standards cap max code length (e.g., ≤15). Use **package-merge** to optimize under a length constraint.

- **Adaptive (online) Huffman.** Update the tree as data arrives (FGK/Vitter). Useful when frequencies are not known in advance; guarantees stay near optimality.

- **Two-queue linear build.** If input frequencies are already sorted, push them to one queue and merges to a second queue; repeatedly take the two smallest **fronts** across queues to achieve `O(k)`.


## Applications

- **Compression formats:** DEFLATE (gzip, PNG), many image/audio codecs use canonical Huffman for static blocks.

- **Embedded dictionaries:** Compact symbol tables when a static distribution is known.

- **Coding theory basics:** A practical construction approaching the [[cs/military-computing/shannon-and-information-theory|entropy bound]] for prefix codes.


## Common Pitfalls or Edge Cases

> [!warning]
> **Ties and determinism.** Equal frequencies can produce multiple optimal trees. For reproducible outputs, define a **tie-break** (e.g., stable by symbol order) or use **canonical** Huffman after computing code lengths.

> [!warning]
> **Zero-frequency symbols.** Exclude them from the heap; they don't appear in the code. If the format requires a full alphabet, assign a placeholder of bounded length but don't emit it.

> [!warning]
> **Single-symbol inputs.** Without a special-case 1-bit code, decoding becomes ambiguous. Ensure the encoder assigns `"0"` (or `"1"`) to the sole symbol.

> [!warning]
> **Tree serialization.** For interchange, you must store either the tree structure or the (canonical) **length table** alongside the bitstream; otherwise the decoder cannot interpret bits.

## Implementation Notes or Trade-offs

- **Data structures:** Use a binary min-heap of pointers/indices. For canonicalization, compute **code lengths** via a DFS and then sort `(length, symbol)` pairs to assign bit patterns.

- **Bit I/O:** Buffer bits into bytes; define MSB/LSB-first policy consistently. Align blocks to byte boundaries or carry a bit count in headers.

- **Speed vs memory:** Canonical codes enable **table-based decoding** (e.g., 8–12 bit lookups) that reduces branching; fall back to tree walking for rare long codes.

- **Numerics:** Frequencies may be counts (integers) or probabilities. For probabilities, scale to integers to avoid [[cs/standards/ieee-754-floating-point|floating-point drift]]; relative order is what matters.


## Summary

Huffman coding is the **greedy** solution to building an **optimal prefix-free** binary code from symbol frequencies. Merge the two lightest nodes until a single tree remains, derive bitstrings from root→leaf paths, and optionally canonicalize for fast, portable decoding. With `O(k log k)` build time and linear encoding/decoding, Huffman is the workhorse of practical lossless compression.

## Related Notes

- [[cs/dsa/greedy-algorithms|Greedy Algorithms]]

- [[cs/dsa/binary-heap|Binary Heap]]

- [[cs/dsa/priority-queue|Priority Queue]]

- [[cs/dsa/strings|Strings]]

## Sources

- A Method for the Construction of Minimum-Redundancy Codes, David A. Huffman, Proceedings of the I.R.E., September 1952. http://compression.ru/download/articles/huff/huffman_1952_minimum-redundancy-codes.pdf . Backs the greedy construction from its original statement, this note's central claim. The paper states the prefix-free restriction ("no message be coded in such a way that its code appears, digit for digit, as the first part of any message code of greater length") and derives the requirement that licenses merging the two least frequent symbols: the codes are ordered `L(1) ≤ L(2) ≤ … ≤ L(N-1) = L(N)`, and "at least two and not more than D of the messages with code length L(N) have codes which are alike except for their final digits". It also backs the tie-breaking pitfall directly, noting that when several messages are equally least likely either grouping may be chosen because "it is possible to rearrange codes in any manner among equally likely messages without affecting the average code length", and the r-ary generalization, where one must "always combine a number of messages equal to D" and may need to pad with zero-probability messages so that `(N-1)/(D-1)` is an integer.
- Lecture 17: Huffman Coding (CLRS 16.3), Mordecai Golin, COMP271, HKUST. https://home.cse.ust.hk/faculty/golin/COMP271Sp03/Notes/MyL17.pdf . Backs this note's worked example exactly: the same six-symbol file with frequencies a:45, b:13, c:12, d:16, e:9, f:5 in thousands, and the same variable-length code `0, 101, 100, 111, 1101, 1100`. It also backs the objective function `B(C) = Σ f(aᵢ)·L(c(aᵢ))` and its minimality, the leaves-to-characters correspondence that makes the code prefix-free ("since no codeword is a prefix of any other we can always find the first codeword in a message, peel it off, and continue decoding"), the priority-queue construction running in `O(n log n)` with exactly `n-1` merges, and the two lemmas this note compresses into one sentence: the two lowest-frequency letters can be taken as sibling leaves at the lowest level of some optimal tree, and the greedy merge then preserves optimality by induction.
- Huffman coding, Wikipedia. https://en.wikipedia.org/wiki/Huffman_coding . Backs the `O(n log n)` priority-queue bound with the reasoning (a tree with n leaves has 2n-1 nodes and each queue operation costs `O(log n)`), the linear-time alternative this note calls the two-queue method ("if the symbols are sorted by probability, there is a linear-time `O(n)` method to create a Huffman tree using two queues", the first holding initial weights and the second holding combined weights, which keeps the lowest weight at the front of one of the two), the n-ary variant that groups the n least likely symbols and may need zero-probability placeholders, the canonical Huffman code as "often the code used in practice, due to ease of encoding/decoding", and the entropy framing (Huffman and arithmetic coding achieve entropy when every symbol has probability of the form `1/2^k`, with prefix codes limited to integer bit lengths otherwise).
- DEFLATE Compressed Data Format Specification version 1.3, RFC 1951, P. Deutsch. https://www.rfc-editor.org/rfc/rfc1951.txt . Backs the canonical-code and length-table claims in a shipping spec: DEFLATE's Huffman codes obey two extra rules, that all codes of a given bit length have lexicographically consecutive values in symbol order and that shorter codes lexicographically precede longer ones, so "we can define the Huffman code for an alphabet just by giving the bit lengths of the codes for each symbol of the alphabet in order; this is sufficient to determine the actual codes", with a worked derivation from the length sequence. It backs the length cap this note cites as roughly 15, since the code-length alphabet encodes "0 - 15: Represent code lengths of 0 - 15". It backs the zero-frequency rule ("a code length of 0 indicates that the corresponding symbol will not occur in the block, and should not participate in the Huffman code construction algorithm"). And it backs the single-symbol edge case with a real-world instance: "if only one distance code is used, it is encoded using one bit, not zero bits; in this case there is a single code length of one, with one unused code".
- Portable Network Graphics (PNG) Specification, RFC 2083. https://www.rfc-editor.org/rfc/rfc2083.txt . Backs the PNG half of the "DEFLATE (gzip, PNG)" claim: PNG defines only compression method 0, deflate/inflate compression, so PNG's entropy coding is the canonical Huffman of RFC 1951.
- Canonical Huffman code, Wikipedia. https://en.wikipedia.org/wiki/Canonical_Huffman_code . Backs the motivation this note gives for canonicalization: rather than storing the tree structure explicitly, canonical codes are ordered so "it suffices to only store the lengths of the codewords, which reduces the overhead of the codebook", and most compressors build a normal Huffman codebook and then convert it to canonical before use.
- Package-merge algorithm, Wikipedia. https://en.wikipedia.org/wiki/Package-merge_algorithm . Backs the length-limited variant by name and bound: package-merge is an `O(nL)`-time algorithm for finding an optimal length-limited Huffman code where no codeword is longer than L, and it is a generalization of Huffman's original algorithm.
- Adaptive Huffman coding, Wikipedia. https://en.wikipedia.org/wiki/Adaptive_Huffman_coding . Backs the online variant and its two named implementations: adaptive Huffman coding builds the code as symbols are transmitted with no initial knowledge of the source distribution, and "the most notable are FGK (Faller-Gallager-Knuth) and Vitter algorithm".
