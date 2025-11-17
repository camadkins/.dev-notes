---
title: Bitwise Operators — Core Logic and Low-Level Tricks  
description: Foundational binary operators (AND, OR, XOR, NOT, shifts) and their applications in optimization, masking, and data encoding.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated: 2025-10-29  
aliases:
- bitwise-operator
- bitwise_ops
- bitwise-operations

# diagrams:
# - name: bitwise-truth-tables
# brief: AND/OR/XOR/NOT evaluated per-bit on aligned binary inputs

# - name: bitmask-operations
# brief: Set/clear/toggle/check of a single bit using masks

# - name: signed-vs-logical-shift
# brief: Arithmetic (signed) vs logical right shifts illustrated
---

## Definition

Bitwise operators directly manipulate binary digits (bits) of integers.  
They form the foundation of **low-level computation**, **hardware interaction**, and **high-performance algorithms**.  
Mastering them allows for efficient **state encoding**, **compression**, and **arithmetic tricks**.

## Why it matters

> [!note]  
> Bitwise operations are constant time, making them extremely fast for encoding flags, implementing sets, and writing compact algorithms.

## Model & Assumptions

> [!tip] Be explicit about the machine model
> 
> - **Word size**: use fixed-width types (`uint32_t`, `uint64_t`) when shifts depend on width.
>     
> - **Signed right shift**: implementation-defined in C/C++; prefer unsigned for portable logical shifts.
>     
> - **Shift range**: shifting by ≥ word size is undefined; guard indices.
>     
> - **Two’s complement**: most platforms use it; tricks like `x & -x` rely on two’s complement.
>     

## Operators

### The Core Bitwise Operators

|Operator|Symbol|Example|Result|Description|
|---|---|---|---|---|
|AND|`&`|`1010 & 1100`|`1000`|1 only if both bits are 1|
|OR|`\|`|`1010|1100`|`1110`|
|XOR|`^`|`1010 ^ 1100`|`0110`|1 if bits differ|
|NOT|`~`|`~1010`|`0101`|Flips all bits|
|Left Shift|`<<`|`0011 << 1`|`0110`|Moves bits left, inserts 0s|
|Right Shift|`>>`|`1010 >> 1`|`0101`|Moves bits right, discards rightmost|

> [!example] Diagram: Per-bit truth tables for AND/OR/XOR/NOT

### Working Example

```text
A = 60 → 0011 1100  
B = 13 → 0000 1101

A & B = 0000 1100 (12)
A | B = 0011 1101 (61)
A ^ B = 0011 0001 (49)
~A    = 1100 0011 (-61 in 2’s complement)
```

## Masks

### Bit Masking — The Swiss Army Knife

A **bitmask** is a pattern used to isolate, set, or clear specific bits in a value.

#### Common Bit Mask Patterns

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

> [!example] Diagram: Masking to set/clear/toggle/check a bit

## Isolating & Manipulating Bits

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

## Bit Packing & Fields

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

## Shifts

### Shifts — Signed vs Logical

- **Left shift (`<<`)** → multiplies by powers of two (if no overflow).
    
- **Right shift (`>>`)** → divides by powers of two (depends on sign).
    

|Type|Behavior|Example|
|---|---|---|
|Logical right shift|Fills left bits with zeros|`0001 1010 >> 2 = 0000 0110`|
|Arithmetic (signed) shift|Fills left bits with sign bit|`1110 1000 >> 2 = 1111 1010`|

> [!warning]  
> In C/C++, right-shifting negative values is **implementation-defined**. Always use unsigned integers for portable bit shifts.

> [!example] Diagram: Signed vs logical right shift

## Pitfalls

> [!warning]  
> **Overflow**: `(1 << 31)` in 32-bit signed int is undefined — use unsigned types or 64-bit integers.

> [!warning]  
> **Precedence confusion**: `a & 1 << k` means `(a & 1) << k`, not `a & (1 << k)`. Use parentheses explicitly.

> [!tip]  
> Always clarify intent with parentheses — bitwise precedence can differ subtly across languages.

## Applications

- **Flag management** (e.g., configuration bits, permissions)
    
- **Cryptographic primitives**
    
- **Subset enumeration in DP**
    
- **Compression and encoding**
    
- **Graphics and color channels**
    
- **Error detection (checksums, parity bits)**
    

## Summary

Bitwise operators provide fine-grained control over data representation, enabling optimization beyond what high-level arithmetic can achieve.  
They remain critical in systems, algorithms, and performance engineering contexts.

## See also

- [[cs/dsa/bit-manipulation|Bit Manipulation]]
    
- [[cs/dsa/algorithm-efficiency|Algorithm Efficiency]]
    
- [[cs/dsa/dynamic-programming|Dynamic Programming]]
    