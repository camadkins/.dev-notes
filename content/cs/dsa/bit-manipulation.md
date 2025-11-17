---
title: Bit Manipulation — Binary Operations for Speed and Space Efficiency  
description: Core bitwise operations and techniques for set representation, optimization, and low-level computation.  
draft: true  
tags:
- cs
- dsa  
date: 2025-10-16  
updated: 2025-10-29  
aliases: []

# diagrams:
# - name: bitwise-operations
# brief: Visualizing AND/OR/XOR/NOT on aligned bit strings

# - name: bit-masking-examples
# brief: Mask creation and set/clear/toggle/check of a specific bit

# - name: bit-tricks-flow
# brief: Flow of popcount, power-of-two test, and clear-lowest-bit iteration

---

## Definition

**Bit manipulation** leverages binary representations and bitwise operators to perform fast, memory-efficient computations.  
It’s foundational in **low-level programming**, **competitive algorithms**, and **system design** — offering ways to optimize performance by working directly with binary data.

## Why it matters

> [!note]  
> Bitwise logic is integral in embedded systems, compression algorithms, cryptography, and fast mathematical functions.

## Model & Assumptions

> [!tip] Be explicit about the machine model
> 
> - **Word size**: use fixed-width types (e.g., `uint32_t`, `uint64_t`) when shifts depend on width.
>     
> - **Signed right shift**: implementation-defined in C/C++; prefer unsigned for logical shifts.
>     
> - **Shift range**: shifting by ≥ word size is undefined; guard indices.
>     
> - **Two’s complement**: most platforms use it; tricks like `x & -x` rely on it.
>     

## Operators

### Common Bitwise Operators

|Operator|Symbol|Meaning|Example (8-bit)|
|---|---|---|---|
|AND|`&`|Bit set if both bits are 1|`1101 & 1011 = 1001`|
|OR|`\|`|Bit set if either bit is 1|`1100|
|XOR|`^`|Bit set if bits differ|`1100 ^ 1010 = 0110`|
|NOT|`~`|Flips all bits|`~1010 = 0101`|
|Left Shift|`<<`|Moves bits left, adds 0s on right|`0011 << 1 = 0110`|
|Right Shift|`>>`|Moves bits right, discards rightmost|`1010 >> 1 = 0101`|

> [!example] Diagram: Basic bitwise operators on aligned values

## Masks

A **mask** is a binary pattern used to isolate, toggle, or clear specific bits.

### Creating and Using Masks

```c
int x = 42;          // 00101010
int mask = 1 << 3;   // 00001000

x |= mask;           // Set bit 3 → 00111010
x &= ~mask;          // Clear bit 3 → 00101010
x ^= mask;           // Toggle bit 3
```

|Task|Expression|Effect|
|---|---|---|
|Set bit `i`|`x|= (1 << i)`|
|Clear bit `i`|`x &= ~(1 << i)`|Forces bit to 0|
|Toggle bit `i`|`x ^= (1 << i)`|Flips bit|
|Check bit `i`|`(x >> i) & 1`|Returns 1 if set|

> [!example] Diagram: Mask creation and effects on bits

## Patterns & Techniques

### 1. Check Power of Two

```c
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

Works because powers of two have only **one bit set** (e.g., `1000`, `0100`).

### 2. Count Set Bits (Population Count)

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

Each iteration clears the **lowest 1-bit** — making it run in O(k), where k = number of set bits.

### 3. Clear Lowest Set Bit

```c
x &= (x - 1);
```

Efficiently removes the least significant 1 — useful for iterating subsets or sparse masks.

### 4. Get Lowest Set Bit

```c
int lowest = x & -x;
```

This isolates the rightmost 1-bit (two’s complement trick).

> [!tip]  
> These four patterns — **power of two**, **popcount**, **clear bit**, and **extract bit** — form the “bit-hack core” of many algorithms.

> [!example] Diagram: Popcount, power-of-two test, clear-lowest-bit

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

- **Dynamic Programming** — encode states as bitmasks.
    
- **Graph problems** — represent adjacency and visited sets.
    
- **Set operations** — union/intersection via OR/AND.
    
- **Optimization** — compact flag storage or vectorization.
    
- **Cryptography & hashing** — fast XOR-based transformations.
    

## Edge Cases

> [!warning]
> 
> - **0 value**: Always handle separately — some bit tricks assume at least one bit is set.
>     
> - **Signed shifts**: Right shifts of negative numbers are implementation-defined in C/C++.
>     
> - **Overflow**: `(1 << n)` overflows if `n ≥ word size`. Use 64-bit integers for safety.
>     

## Summary

- Bit manipulation enables **constant-time arithmetic**, **fast set logic**, and **memory efficiency**.
    
- Learn patterns: `x & (x - 1)` for clearing, `x & -x` for extraction, `(n & (n - 1)) == 0` for powers of two.
    
- Bitmasks unify logic, speed, and compact data representation across low-level and algorithmic contexts.
    

## See also

- [[cs/dsa/bitwise-operator|Bitwise Operator Basics]]
    
- [[cs/dsa/dynamic-programming|Dynamic Programming]]
    
- [[cs/dsa/recursion|Recursion]]
    
- [[cs/dsa/array-operations|Array Operations]]