---

title: Huffman Coding  
description: Optimal prefix codes built greedily by repeatedly merging the two least frequent symbols into a binary tree; supports compact encoding and linear-time decoding.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated:
aliases: []
# diagrams:

# - huffman-heap-to-tree.svg — Min-heap of leaf nodes (frequencies) with iterative extract-min/extract-min/merge/insert steps until a single root remains.

# - huffman-encode-decode-walkthrough.svg — Example alphabet with frequencies, constructed tree with 0/1 edges, code table, and bitstream decode path.

---

## Overview

**Huffman coding** constructs an **optimal prefix-free binary code** for a known set of symbol frequencies. The algorithm is **greedy**: repeatedly merge the **two least frequent** nodes, forming their parent with weight equal to the sum, until a single tree remains. Labeling left/right edges as `0/1` (convention) yields codewords by reading edge labels from root to leaf. Encoding replaces each symbol with its codeword; decoding walks the tree following bits to a leaf.

> [!example]  
> **Diagram (`huffman-heap-to-tree.svg`)** — Show a min-heap of `(freq, node)` entries. Repeatedly `extract-min` twice, create a parent with weight `f=f1+f2`, and `insert` back. The final root defines the prefix code.

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

> [!example]  
> **Diagram (`huffman-encode-decode-walkthrough.svg`)** — The final tree with edges labeled `0/1`, a table listing `(symbol, code)`, and a bitstream highlighting the decode path for a short message.

## Complexity Analysis

- **Build time:** `O(k log k)` for `k` distinct symbols using a min-heap (each merge is an extract/extract/insert). If the frequencies are provided in **sorted order**, a linear-time **two-queue** method achieves `O(k)`.
    
- **Space:** `O(k)` for the tree and code table.
    
- **Encoding time:** `O(∑ len(code(s)) · count(s))` which is linear in the number of input symbols once the code table is known (array/hash lookup per symbol).
    
- **Decoding time:** Linear in bits of the encoded stream (walks the tree one edge per bit).
    

The total coded length is `L = ∑ f(s) · len(code(s))`, which is **minimal** among all prefix codes for the given frequency multiset.

## Optimizations or Variants

- **Canonical Huffman codes.** Instead of storing the entire tree, store just **code lengths** and assign lexicographically by length to get a **canonical** mapping. This yields faster I/O (compact tables) and deterministic codes—common in DEFLATE/PNG.
    
- **r-ary Huffman.** For `r`-ary alphabets, merge the `r` smallest nodes at each step; complexity is `O(k log k)` with an `r`-ary heap. Ensures prefix-free codes over an `r`-symbol digit alphabet.
    
- **Length-limited Huffman.** Some standards cap max code length (e.g., ≤15). Use **package-merge** to optimize under a length constraint.
    
- **Adaptive (online) Huffman.** Update the tree as data arrives (FGK/Vitter). Useful when frequencies are not known in advance; guarantees stay near optimality.
    
- **Two-queue linear build.** If input frequencies are already sorted, push them to one queue and merges to a second queue; repeatedly take the two smallest **fronts** across queues to achieve `O(k)`.
    

## Applications

- **Compression formats:** DEFLATE (gzip, PNG), many image/audio codecs use canonical Huffman for static blocks.
    
- **Embedded dictionaries:** Compact symbol tables when a static distribution is known.
    
- **Coding theory basics:** A practical construction approaching the entropy bound for prefix codes.
    

## Common Pitfalls or Edge Cases

> [!warning]  
> **Ties and determinism.** Equal frequencies can produce multiple optimal trees. For reproducible outputs, define a **tie-break** (e.g., stable by symbol order) or use **canonical** Huffman after computing code lengths.

> [!warning]  
> **Zero-frequency symbols.** Exclude them from the heap; they don’t appear in the code. If the format requires a full alphabet, assign a placeholder of bounded length but don’t emit it.

> [!warning]  
> **Single-symbol inputs.** Without a special-case 1-bit code, decoding becomes ambiguous. Ensure the encoder assigns `"0"` (or `"1"`) to the sole symbol.

> [!warning]  
> **Tree serialization.** For interchange, you must store either the tree structure or the (canonical) **length table** alongside the bitstream; otherwise the decoder cannot interpret bits.

## Implementation Notes or Trade-offs

- **Data structures:** Use a binary min-heap of pointers/indices. For canonicalization, compute **code lengths** via a DFS and then sort `(length, symbol)` pairs to assign bit patterns.
    
- **Bit I/O:** Buffer bits into bytes; define MSB/LSB-first policy consistently. Align blocks to byte boundaries or carry a bit count in headers.
    
- **Speed vs memory:** Canonical codes enable **table-based decoding** (e.g., 8–12 bit lookups) that reduces branching; fall back to tree walking for rare long codes.
    
- **Numerics:** Frequencies may be counts (integers) or probabilities. For probabilities, scale to integers to avoid floating-point drift; relative order is what matters.
    

## Summary

Huffman coding is the **greedy** solution to building an **optimal prefix-free** binary code from symbol frequencies. Merge the two lightest nodes until a single tree remains, derive bitstrings from root→leaf paths, and optionally canonicalize for fast, portable decoding. With `O(k log k)` build time and linear encoding/decoding, Huffman is the workhorse of practical lossless compression.

## See also

- [[cs/dsa/greedy-algorithms|Greedy Algorithms]]
    
- [[cs/dsa/binary-heap|Binary Heap]]
    
- [[cs/dsa/priority-queue|Priority Queue]]
    
- [[cs/dsa/strings|Strings]]