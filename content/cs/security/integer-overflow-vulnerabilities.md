---
title: Integer Overflow Vulnerabilities
description: "How a silent arithmetic wrap, legal and consequence-free at the CPU level, becomes memory corruption the moment the wrapped value is trusted as a size or a bound."
draft: false
comments: true
tags:
  - cs
  - security
  - memory
date: 2026-01-27
updated:
aliases:
  - integer overflow
  - integer wraparound
  - integer wrap
---

Fixed-width integer arithmetic has a property that is easy to forget because it almost never bites: the result lives in a bounded space, and when a computation leaves that space the hardware does not stop. It wraps. `0xFFFFFFFF + 1` is not a runtime error on a 32-bit unsigned value; it is `0`. The CPU is behaving exactly as specified. The vulnerability is not in the arithmetic. It is in the code downstream that assumed the arithmetic could not lie.

> [!note] The idea
> An integer overflow is a math error that becomes a memory-safety error through trust. The wrap itself is benign and defined for unsigned types. The danger appears when the wrapped-around value is used as an allocation size or a length check: a computation that should have produced a large number produces a tiny one, the program allocates a buffer far smaller than the data it is about to hold, and the subsequent write runs off the end. A single unchecked multiply or add becomes a heap overflow.

## The wrap is defined, not exceptional

An overflow "occurs when an arithmetic operation on integers attempts to create a numeric value that is outside of the range that can be represented in the space allocated for the result." What the machine does then is not a fault; it is modular reduction. For unsigned types, "when an unsigned arithmetic operation produces a result larger than the maximum above for an N-bit integer, an overflow reduces the result to modulo N-th power of 2, retaining only the least significant bits of the result and effectively causing a wrap around." No exception, no flag the program is obligated to check. The result is simply the low bits, and execution continues as if nothing happened.

## The size calculation is where it turns dangerous

The classic path from wrap to corruption runs through allocation. Multiply a controlled element count by an element size, wrap the product, and hand the truncated result to `malloc`. Wikipedia names the consequence directly: "if an overflowed value is used as the number of bytes to allocate for a buffer, the buffer will be allocated unexpectedly small, potentially leading to a buffer overflow which, depending on the use of the buffer, might in turn cause arbitrary code execution." The bounds check that should have caught the oversized input was computed on the wrapped value, so it passed. The allocation that should have reserved room for the real input was sized on the same wrapped value, so it is short. The write that follows trusts both.

## Signedness widens the trap

Overflow does not only shrink values. "An integer overflow can cause the value to wrap and become negative, which violates the program's assumption and may lead to unexpected behavior." A length field that goes negative and is then interpreted as a large unsigned size in a later call, or a signed comparison that a negative length slips past, produces the same outcome by a different route. The recurring pattern is a value that means one thing to the check and another thing to the use.

> [!warning] Validate before you compute, not after
> Checking whether a product is too large after computing it is checking the wrapped value, which is exactly the corrupted quantity. The defense is to reason about the inputs before the operation (does `count * size` exceed the type's maximum?), use checked or saturating arithmetic that reports the overflow, or use a language and library that trap it. Guarding the result of the multiply you already did is guarding the wrong number.

## Related Notes

- [[buffer-overflows|Buffer Overflows]], the memory corruption an undersized allocation feeds directly into
- [[use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]], another route from an allocator-level mistake to attacker-controlled memory
- [[fuzzing|Fuzzing]], the technique that finds these boundary-arithmetic bugs by hammering the edges of the input range

## Sources

- "Integer overflow," Wikipedia. https://en.wikipedia.org/wiki/Integer_overflow . Supports the definition of overflow as a value "outside of the range that can be represented," the unsigned modulo wrap behavior "retaining only the least significant bits," the undersized-allocation-to-arbitrary-code-execution chain, and that overflow can make a value "wrap and become negative."
