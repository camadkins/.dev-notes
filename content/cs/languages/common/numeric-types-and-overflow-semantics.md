---
title: Numbers, Overflow, and the Edge of the Type
description: "What happens when arithmetic leaves the range of its type. Wrapping, trapping, undefined behavior, and promotion to arbitrary precision are four different answers, and the choice shows up in your security posture."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-02-17
updated:
aliases:
  - Integer Overflow Semantics
  - Fixed-Width Integers and Floats
---

`x + 1` looks like the safest expression in programming. It is one of the more dangerous ones, because the machine's integers are finite and the mathematical ones are not. A `u8` holds 0 to 255, so 255 + 1 has no representable answer, and every language has to say something about what happens next. The answers are not variations on a theme. They are four genuinely different contracts, and one of them is "the compiler may assume this never happens."

> [!note] The idea
> Fixed-width arithmetic has an edge, and a language's overflow semantics are the promise it makes at that edge. C++ makes unsigned overflow defined (modulo 2^n) and signed overflow undefined, which turns an arithmetic bug into an optimization license. Rust makes it defined but mode-dependent: panic in debug, wrap in release, with an explicit method family when you actually mean one of them. Python sidesteps the edge entirely by giving integers unlimited precision, paying in allocation and speed. The deep point is that "it wraps" is not a fact about hardware, it is a fact about the language contract, and C++ specifically declines to make that promise even though the hardware would keep it.

## The fixed-width contract

A signed n-bit integer in two's complement stores values from -(2^(n-1)) to 2^(n-1) - 1, and an unsigned one from 0 to 2^n - 1. Rust names these explicitly (`i8` through `i128`, `u8` through `u128`), and adds `isize`/`usize`, which are 64 bits on a 64-bit architecture and 32 on a 32-bit one. That last pair is the first portability seam in the numeric tower: the same source has a different range depending on the target, which is why it is the type used for indexing collections rather than for arithmetic you care about.

C++ inherits the C model, where types are named by role (`int`, `long`) rather than by width, and adds a further wrinkle before arithmetic even begins. An integral operand passed to a built-in arithmetic operator undergoes integral promotion first, and for binary operators with differently typed operands the usual arithmetic conversions apply. So the type the addition actually happens in is not always the type you wrote. That is the mechanism behind the classic surprise where an unsigned `char` and an unsigned `int` behave differently under the same negation, a case cppreference documents with output showing `-1` for the `unsigned char` and `4294967295` for the `unsigned int`.

## Four things that can happen at the edge

**Modular wrapping, promised.** C++ specifies that unsigned integer arithmetic is always performed modulo 2^n: adding one to `UINT_MAX` gives 0, subtracting one from 0 gives `UINT_MAX`. This is a real guarantee and code can rely on it, which is why hashes and checksums are written against unsigned types.

**Undefined behavior.** When a signed integer operation overflows in C++, the behavior is undefined. cppreference lists what that can look like in practice: it may wrap per the representation (typically two's complement), it may trap on some platforms or under compiler options such as GCC and Clang's `-ftrapv`, it may saturate to the minimum or maximum (on many DSPs), or it may be completely optimized out by the compiler. That last possibility is the one that bites. A programmer who writes `if (x + 1 < x)` to detect overflow has written a check the compiler is entitled to delete, because in a well-defined program the condition cannot be true. The bug and the mitigation vanish together.

**Panic or wrap, by build mode.** Rust makes overflow defined but splits it by profile. In debug builds the compiler includes overflow checks that panic at runtime. In release builds with `--release` those checks are not included, and overflow performs two's complement wrapping, so 256 becomes 0 in a `u8` and 257 becomes 1. The Book is blunt that relying on that wrapping is considered an error. Because neither default is right for every case, the standard library offers four explicit families on the primitive numeric types: `wrapping_*` to wrap in all modes, `checked_*` to return `None` on overflow, `overflowing_*` to return the value plus a Boolean flag, and `saturating_*` to clamp at the type's minimum or maximum. The design idea is that if you have an opinion about the edge, you state it in the method name rather than in the build flags.

**No edge at all.** Python's integers have unlimited precision. The value grows into as many machine words as it needs, so there is no wraparound to reason about and no overflow class of bug in ordinary arithmetic. The cost is that an integer is a heap object of variable size rather than a register-width value, which is a fine trade for a scripting language and an impossible one for a kernel.

> [!warning] The security consequence is not theoretical
> An overflow that wraps silently is how a length check becomes a lie: a size computation wraps to a small number, the allocation succeeds, and the copy that follows writes past the end. That is the mechanism behind a large family of memory-safety bugs, which is why the difference between "wraps, and I meant it" and "wraps, and nobody noticed" is worth encoding in the type or the method name. See [[cs/security/integer-overflow-vulnerabilities|integer overflow vulnerabilities]] and [[cs/security/buffer-overflows|buffer overflows]].

## Floats are a separate contract, and a looser one

Integers at least agree on what the answer should be when it fits. Floats do not even promise that much. Rust's `f32` and `f64` are represented according to the IEEE-754 standard, with `f64` the default because on modern CPUs it is roughly the same speed as `f32` with more precision. Python's floats are usually implemented using C's `double`, with the machine's actual precision exposed through `sys.float_info`, and the standard library offers `fractions.Fraction` and `decimal.Decimal` for the cases where binary floating point is the wrong model.

The subtle part is that conforming to IEEE 754 does not make a program's floating-point results reproducible across compilers. Unless `#pragma STDC FP_CONTRACT` is supported and set to `OFF`, C++ permits all floating-point arithmetic to be performed as if intermediate results had infinite range and precision, allowing optimizations that omit rounding errors and floating-point exceptions. cppreference gives the concrete examples: implementing `(x * y) + z` as a single fused multiply-add instruction, or rewriting `x * x * x * x` as `tmp = x * x; tmp * tmp`. Separately, intermediate results may carry range and precision different from their declared type. So two builds of identical source can produce different last bits, legally.

## The tradeoff, stated plainly

Each answer optimizes for something and gives up something else. Undefined signed overflow buys the C++ optimizer freedom (it can assume loop counters do not wrap, which enables real transformations) and costs you the ability to reason locally about a program that does overflow. Rust's split buys detection in development and speed in production, at the price of a behavior difference between the binary you tested and the binary you shipped. Arbitrary precision buys the absence of a whole bug class and costs the register representation that makes systems code fast. There is no option here that is free, which is why the useful question about any numeric type is not "how big is it" but "what has the language promised at the edge."

## Related Notes

- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - why signed overflow being undefined is an optimization license, not an oversight
- [[cs/security/integer-overflow-vulnerabilities|Integer Overflow Vulnerabilities]] - the exploit path that starts with a wrapped size computation
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - fixed-width types and byte order when numbers cross a machine boundary
- [[cs/languages/common/portability-and-cross-compilation|Portability and Cross-Compilation]] - why `usize` changes size with the target
- [[cs/dsa/bitwise-operations|Bitwise Operations]] - the two's complement representation underneath all of this

## Sources

- "Data Types," The Rust Programming Language (official book). https://doc.rust-lang.org/book/ch03-02-data-types.html . Supports the signed/unsigned integer table and two's complement ranges, `isize`/`usize` tracking the architecture's word size, panic-on-overflow in debug versus two's complement wrapping in release (256 becomes 0 in a `u8`), wrapping being considered an error to rely on, the `wrapping_*` / `checked_*` / `overflowing_*` / `saturating_*` families, and `f32`/`f64` following IEEE-754 with `f64` as the default.
- "Arithmetic operators," cppreference.com. https://en.cppreference.com/w/cpp/language/operator_arithmetic.html . Supports integral promotion and the usual arithmetic conversions preceding arithmetic, the unsigned-char versus unsigned-int negation output, unsigned arithmetic being modulo 2^n with `UINT_MAX + 1 == 0`, signed overflow being undefined with its four listed manifestations (wrap, trap under `-ftrapv`, saturate on DSPs, optimized out), and the FP_CONTRACT allowance for fused multiply-add and reassociation.
- "Built-in Types: Numeric Types," Python documentation. https://docs.python.org/3/library/stdtypes.html . Supports Python integers having unlimited precision, floats usually being implemented as C doubles with details in `sys.float_info`, and `fractions.Fraction` and `decimal.Decimal` as standard-library alternatives.
