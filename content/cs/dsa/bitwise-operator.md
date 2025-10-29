---
title: Bitwise Operators — Core Logic and Low-Level Tricks
description: Foundational binary operators (AND, OR, XOR, NOT, shifts) and their applications in optimization, masking, and data encoding.
draft: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - bitwise_truth_tables.svg — visualize AND, OR, XOR, and NOT across aligned binary digits.
#  - bitmask_operations.svg — show masking, clearing, toggling, and checking individual bits.
#  - signed_vs_logical_shift.svg — contrast signed right shift with logical shift.
---

## Overview
Bitwise operators directly manipulate binary digits (bits) of integers.  
They form the foundation of **low-level computation**, **hardware interaction**, and **high-performance algorithms**.  
Mastering them allows for efficient **state encoding**, **compression**, and **arithmetic tricks**.

> [!note]
> Bitwise operations are constant time, making them extremely fast for encoding flags, implementing sets, and writing compact algorithms.

---

## The Core Bitwise Operators

| Operator | Symbol | Example | Result | Description |
|-----------|---------|----------|----------|--------------|
| AND | `&` | `1010 & 1100` | `1000` | 1 only if both bits are 1 |
| OR | `\|` | `1010 | 1100` | `1110` | 1 if either bit is 1 |
| XOR | `^` | `1010 ^ 1100` | `0110` | 1 if bits differ |
| NOT | `~` | `~1010` | `0101` | Flips all bits |
| Left Shift | `<<` | `0011 << 1` | `0110` | Moves bits left, inserts 0s |
| Right Shift | `>>` | `1010 >> 1` | `0101` | Moves bits right, discards rightmost |

> [!example]
> **Diagram (`bitwise_truth_tables.svg`)** — each operator evaluated per bit; highlight where output becomes 1.

---

## Working Example
```text
A = 60 → 0011 1100  
B = 13 → 0000 1101

A & B = 0000 1100 (12)
A | B = 0011 1101 (61)
A ^ B = 0011 0001 (49)
~A    = 1100 0011 (-61 in 2’s complement)
````

---

## Bit Masking — The Swiss Army Knife

A **bitmask** is a pattern used to isolate, set, or clear specific bits in a value.

### Common Bit Mask Patterns

|Action|Expression|Effect|
|---|---|---|
|Set kth bit|`x|= (1 << k)`|
|Clear kth bit|`x &= ~(1 << k)`|Forces bit to 0|
|Toggle kth bit|`x ^= (1 << k)`|Flips bit|
|Check kth bit|`(x >> k) & 1`|Tests if set|

```c
int x = 42;      // 00101010
x |= (1 << 1);   // Set bit 1  → 00101011
x &= ~(1 << 3);  // Clear bit 3 → 00100011
x ^= (1 << 0);   // Toggle bit 0
```

> [!example]  
> **Diagram (`bitmask_operations.svg`)** — illustrate how a mask highlights a specific bit position being modified.

---

## Isolating and Manipulating Bits

### Isolate Least Significant Bit (LSB)

```c
int lsb = x & -x;
```

Extracts only the rightmost 1-bit.

### Clear LSB

```c
x &= (x - 1);
```

Removes the lowest set bit — useful for subset enumeration or counting bits.

### Power of Two Test

```c
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

> [!tip]  
> `(x & -x)` isolates; `(x & (x - 1))` clears — these two lines appear in countless algorithms.

---

## Bit Packing and Field Manipulation

Packing multiple small values into one integer saves space and improves cache performance.

```c
int packed = (r << 16) | (g << 8) | b;  // Combine RGB components
```

Unpacking:

```c
int r = (packed >> 16) & 0xFF;
int g = (packed >> 8) & 0xFF;
int b = packed & 0xFF;
```

Used heavily in **graphics**, **network protocols**, and **compression**.

---

## Shifts — Signed vs Logical

- **Left shift (`<<`)** → multiplies by powers of two (if no overflow).
    
- **Right shift (`>>`)** → divides by powers of two (depends on sign).
    

|Type|Behavior|Example|
|---|---|---|
|Logical right shift|Fills left bits with zeros|`0001 1010 >> 2 = 0000 0110`|
|Arithmetic (signed) shift|Fills left bits with sign bit|`1110 1000 >> 2 = 1111 1010`|

> [!warning]  
> In C/C++, right-shifting negative values is **implementation-defined**. Always use unsigned integers for portable bit shifts.

> [!example]  
> **Diagram (`signed_vs_logical_shift.svg`)** — illustrate left and right shifts, signed vs unsigned.

---

## Common Pitfalls

> [!warning]  
> **Overflow**: `(1 << 31)` in 32-bit signed int is undefined — use unsigned types or 64-bit integers.

> [!warning]  
> **Precedence confusion**: `a & 1 << k` means `(a & 1) << k`, not `a & (1 << k)`. Use parentheses explicitly.

> [!tip]  
> Always clarify intent with parentheses — bitwise precedence can differ subtly across languages.

---

## Applications

- **Flag management** (e.g., configuration bits, permissions)
    
- **Cryptographic primitives**
    
- **Subset enumeration in DP**
    
- **Compression and encoding**
    
- **Graphics and color channels**
    
- **Error detection (checksums, parity bits)**
    

---

## Summary

Bitwise operators provide fine-grained control over data representation, enabling optimization beyond what high-level arithmetic can achieve.  
They remain critical in systems, algorithms, and performance engineering contexts.

---

## See also

- [[cs/dsa/bit-manipulation|Bit Manipulation]]
    
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
    
- [[cs/dsa/dynamic-programming|Dynamic Programming]]
    
- [[cs/dsa/logarithmic-functions|Logarithmic Functions]]