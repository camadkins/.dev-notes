---
title: Bitwise Operations - Core Logic, Manipulation, and Low-Level Tricks
description: Foundational binary operators (AND, OR, XOR, NOT, shifts) and bit manipulation techniques for optimization, masking, set representation, and data encoding.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2026-03-12
aliases:
- bitwise-operator
- bitwise_ops
- bitwise-operations
- bit-manipulation
---

## Definition

Bitwise operators directly manipulate binary digits (bits) of integers.
They form the foundation of **low-level computation**, **hardware interaction**, and **high-performance algorithms**.
Mastering them allows for efficient **state encoding**, **compression**, and **arithmetic tricks**.

**Bit manipulation** leverages these operators and binary representations to perform fast, memory-efficient computations - foundational in **low-level programming**, **competitive algorithms**, and **system design**.

## Why it matters

> [!note]
> Bitwise operations are constant time, making them extremely fast for encoding flags, implementing sets, and writing compact algorithms. They are integral in embedded systems, compression algorithms, cryptography, and fast mathematical functions.

## Model & Assumptions

> [!tip] Be explicit about the machine model
>
> - **Word size**: use fixed-width types (`uint32_t`, `uint64_t`) when shifts depend on width.
>
> - **Signed right shift**: implementation-defined in C/C++; prefer unsigned for portable logical shifts.
>
> - **Shift range**: shifting by >= word size is undefined; guard indices.
>
> - **Two's complement**: most platforms use it; tricks like `x & -x` rely on two's complement.

## Operators

### The Core Bitwise Operators

|Operator|Symbol|Example|Result|Description|
|---|---|---|---|---|
|AND|`&`|`1010 & 1100`|`1000`|1 only if both bits are 1|
|OR|`\|`|`1010 \| 1100`|`1110`|1 if either bit is 1|
|XOR|`^`|`1010 ^ 1100`|`0110`|1 if bits differ|
|NOT|`~`|`~1010`|`0101`|Flips all bits|
|Left Shift|`<<`|`0011 << 1`|`0110`|Moves bits left, inserts 0s|
|Right Shift|`>>`|`1010 >> 1`|`0101`|Moves bits right, discards rightmost|

### Working Example

```text
A = 60 -> 0011 1100
B = 13 -> 0000 1101

A & B = 0000 1100 (12)
A | B = 0011 1101 (61)
A ^ B = 0011 0001 (49)
~A    = 1100 0011 (-61 in 2's complement)
```

## Masks

A **bitmask** is a pattern used to isolate, set, or clear specific bits in a value.

### Common Bit Mask Patterns

|Action|Expression|Effect|
|---|---|---|
|Set kth bit|`x \|= (1 << k)`|Forces bit to 1|
|Clear kth bit|`x &= ~(1 << k)`|Forces bit to 0|
|Toggle kth bit|`x ^= (1 << k)`|Flips bit|
|Check kth bit|`(x >> k) & 1`|Tests if set|

```c
int x = 42;          // 00101010
int mask = 1 << 3;   // 00001000

x |= mask;           // Set bit 3 → 00111010
x &= ~mask;          // Clear bit 3 → 00101010
x ^= mask;           // Toggle bit 3
```

## Isolating & Manipulating Bits

### Isolate Least Significant Bit (LSB)

```c
int lsb = x & -x;
```

Extracts only the rightmost 1-bit (two's complement trick).

### Clear LSB

```c
x &= (x - 1);
```

Removes the lowest set bit - useful for subset enumeration or counting bits.

### Power of Two Test

```c
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

Works because powers of two have only **one bit set** (e.g., `1000`, `0100`).

### Count Set Bits (Population Count)

```c
int popcount(int n) {
    int count = 0;
    while (n) {
        n &= (n - 1);  // Clears lowest set bit
        count++;
    }
    return count;
}
```

Each iteration clears the **lowest 1-bit** - making it run in O(k), where k = number of set bits.

> [!tip]
> These four patterns - **power of two**, **popcount**, **clear bit**, and **extract bit** - form the "bit-hack core" of many algorithms.

## Bit Packing & Fields

Packing multiple small values into one integer saves space and improves [[cs/systems/memory-hierarchy-and-caching|cache performance]].

```c
int packed = (r << 16) | (g << 8) | b;  // Combine RGB components
```

Unpacking:

```c
int r = (packed >> 16) & 0xFF;
int g = (packed >> 8) & 0xFF;
int b = packed & 0xFF;
```

Used heavily in **graphics**, **[[cs/systems/network-protocols|network protocols]]**, and **compression**.

## Shifts - Signed vs Logical

- **Left shift (`<<`)** → multiplies by powers of two (if no [[cs/security/integer-overflow-vulnerabilities|overflow]]).
- **Right shift (`>>`)** → divides by powers of two (depends on sign).

|Type|Behavior|Example|
|---|---|---|
|Logical right shift|Fills left bits with zeros|`0001 1010 >> 2 = 0000 0110`|
|Arithmetic (signed) shift|Fills left bits with sign bit|`1110 1000 >> 2 = 1111 1010`|

> [!warning]
> In C/C++, right-shifting negative values is **implementation-defined**. Always use unsigned integers for portable bit shifts.

## Subset Iteration

Represent a subset of `{0...n-1}` as an integer from `0` to `(1<<n)-1`.
Iterating over all subsets:

```c
for (int mask = 0; mask < (1 << n); mask++) {
    // use subset defined by mask
}
```

### Iterating Submasks

Iterate through all submasks of a given mask:

```c
for (int sub = mask; sub; sub = (sub - 1) & mask) {
    // handle submask
}
```

> [!note]
> This technique is heavily used in **bit DP** and **state compression** problems.

## Applications

- **Dynamic Programming** - encode states as bitmasks
- **Graph problems** - represent adjacency and visited sets
- **Set operations** - union/intersection via OR/AND
- **Flag management** - configuration bits, permissions
- **[[cs/security/aes-and-block-ciphers|Cryptographic primitives]]** - fast XOR-based transformations
- **Compression and encoding** - compact data representations
- **Graphics and color channels** - RGB packing, alpha blending
- **Error detection** - checksums, parity bits

## Edge Cases & Pitfalls

> [!warning]
> **0 value**: Always handle separately - some bit tricks assume at least one bit is set.

> [!warning]
> **Overflow**: `(1 << 31)` in 32-bit signed int is undefined - use unsigned types or 64-bit integers. `(1 << n)` overflows if `n ≥ word size`.

> [!warning]
> **Precedence confusion**: `a & 1 << k` means `(a & 1) << k`, not `a & (1 << k)`. Use parentheses explicitly.

> [!warning]
> **Signed shifts**: Right shifts of negative numbers are implementation-defined in C/C++. Prefer unsigned for logical shifts.

## Summary

- Bitwise operators provide fine-grained control over data representation, enabling optimization beyond what high-level arithmetic can achieve.
- Bit manipulation enables **constant-time arithmetic**, **fast set logic**, and **memory efficiency**.
- Learn patterns: `x & (x - 1)` for clearing, `x & -x` for extraction, `(n & (n - 1)) == 0` for powers of two.
- Bitmasks unify logic, speed, and compact data representation across low-level and algorithmic contexts.

## Related Notes

- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
- [[cs/dsa/dynamic-programming|Dynamic Programming]]
- [[cs/dsa/recursion|Recursion]]
- [[cs/dsa/array-operations|Array Operations]]
