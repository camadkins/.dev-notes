---
title: The Numeric Tower
description: "Exactness as a property orthogonal to the integer-rational-real-complex hierarchy, and the contagion rules that follow from it."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-11
updated:
aliases:
  - Racket Numeric Tower
  - Exact and Inexact Numbers
  - Bignums and Rationals
---

`(/ 1 3)` in Racket is `1/3`, not `0.3333333333333333` and not `0`. That single evaluation contains the whole design: Racket refuses to lose information it was not asked to lose, and it carries the resulting arbitrary-precision rational forward until something forces it to stop.

> [!note] The idea
> The tower is two independent classifications, not one. All numbers are complex numbers, some of those are real, and among the rationals some are integers, so [[cs/math/set-theory-basics|the categories nest as a chain of subsets]]. Orthogonal to those categories, each number is also either an exact number or an inexact number. That second axis is the one that governs behavior, and it is one-way: unless otherwise specified, computations that involve an inexact number produce inexact results. Exactness is a property that propagates, and the propagation rule is contagion rather than promotion. A language whose numbers only have widths has to choose a conversion at every mixed operation. Racket has already decided.

## What the categories actually mean

An exact number is an arbitrarily large or small integer, a rational that is exactly the ratio of two arbitrarily small or large integers, or a complex number with exact real and imaginary parts. An inexact number is an IEEE floating-point representation, or a complex number whose parts are such representations. Inexact numbers print with a decimal point or exponent specifier, and exact numbers print as integers and fractions, so the printer tells you which axis you are on without a predicate call.

The category membership rules are stated by property rather than by representation, which is what makes them independent of storage. Among the rational numbers, some are integers, because `round` applied to the number produces the same number. So `5.0` is an integer by this definition and `1+2i` is not, even though the second is a "whole" number in the loose sense. Likewise a complex number with an exact zero imaginary part is a real number, which is why complex support costs nothing when you are not using it.

The infinities and not-a-number sit outside the rational subset deliberately. All representable reals are rationals except `+inf.0`, `-inf.0`, and `+nan.0`, and those three have no exact form at all: inexact numbers can be coerced to exact form except for exactly those values.

## Contagion, and the two places it does not apply

The default rule is simple. Computations that involve an inexact number produce inexact results, so that inexactness acts as a kind of taint on numbers. `(/ 1 2)` is `1/2` and `(/ 1 2.0)` is `0.5`.

Two exceptions matter in practice, and both catch people.

The first is that certain operations on inexact numbers produce an exact number, such as multiplying an inexact number with an exact `0`. Absorbing elements defeat contagion because the result does not depend on the inexact operand at all.

The second is subtler and is called out in the Guide as a warning. Racket offers no inexact booleans, so computations that branch on the comparison of inexact numbers can nevertheless produce exact results. `(if (= 3.0 2.999) 1 2)` returns the exact `2`. Inexactness taints numbers; it does not taint control flow, and the moment a float passes through a predicate, the uncertainty it carried stops being tracked.

Contagion also runs the other way when you ask. `(inexact->exact 0.1)` yields `3602879701896397/36028797018963968`, the exact rational the double actually holds. That is a useful debugging move: it prints the value your float really is, rather than the decimal literal you typed.

## The tower has a ceiling

Racket can represent only rational numbers and complex numbers with rational parts. There is no algebraic number type and no symbolic surd. So irrational results have nowhere exact to go: operations that mathematically produce irrational numbers for some rational arguments, such as `sqrt`, may produce inexact results even for exact arguments. `(sin 0)` is the exact `0` because zero is rational, and `(sin 1/2)` is `0.479425538604203` because that value is not.

This is the honest boundary of the design. The tower is not a computer algebra system. It guarantees that arithmetic closed over the rationals stays exact, and it tells you by the printed form the moment you leave that region.

## Two equalities, because there are two axes

Numbers now have a value and an exactness, so equality splits. The `=` procedure compares numbers for numerical equality; given both inexact and exact numbers, it essentially converts the inexact numbers to exact before comparing. `eqv?`, and therefore `equal?`, compares numbers considering both exactness and numerical equality.

Hence `(= 1 1.0)` is `#t` and `(eqv? 1 1.0)` is `#f`. These are [[cs/math/relations-and-equivalence|two different equivalence relations over the same set]], one coarser than the other, and the coarser one is the mathematical notion while the finer one is the representational one. A hash table keyed by numbers uses `equal?`, which means `1` and `1.0` are different keys. That surprises people exactly once.

## The cost model, which is the part people skip

Exactness is not free, and the Guide is specific about where the money goes. In terms of performance, computations with small integers are typically the fastest, where "small" means the number fits into one bit less than the machine's word-sized representation for signed numbers. That is the fixnum range, and the missing bit is the tag that lets the runtime tell an immediate integer from a pointer.

Above that range, computation with very large exact integers or with non-integer exact numbers can be much more expensive than computation with inexact numbers. The Guide demonstrates with a summation: computing the same partial harmonic sum over `1/x` versus `1.0/x` for two thousand terms, the exact version accumulates a rational whose numerator and denominator grow enormous, while the float version does two thousand hardware operations.

Inexact reals are implemented as double-precision IEEE floating-point numbers, also known as flonums. So the tower is really three performance regimes wearing one interface: fixnum arithmetic at hardware speed, flonum arithmetic at hardware speed with allocation for boxing, and bignum or ratnum arithmetic in software with allocation proportional to the size of the value. [[cs/languages/common/numeric-types-and-overflow-semantics|Languages that expose fixed-width integer types]] make you pick the regime up front and live with overflow when you pick wrong. Racket picks per value, per operation, and charges you for it silently.

> [!warning] What the tower buys, beyond correctness
> Exact integers do not overflow, they get bigger. That eliminates an entire vulnerability class by construction: there is no wraparound to exploit, so [[cs/security/integer-overflow-vulnerabilities|the length-check-then-allocate bug pattern]] cannot arise from arithmetic alone. The cost has moved rather than disappeared. A value whose magnitude an attacker controls now controls an allocation, which is a resource-exhaustion question instead of a memory-safety one. That is a much better trade, and it is still a trade.
>
> One more sharp edge worth holding: dividing a number by exact zero raises an exception, while dividing a non-zero number by an inexact zero returns an infinity with the sign of the dividend. `(/ 1 0)` errors and `(/ 1 0.0)` is `+inf.0`. The exactness of the divisor decides whether you get an exception or a value.

## Related Notes

- [[cs/languages/common/numeric-types-and-overflow-semantics|Numbers, Overflow, and the Edge of the Type]] - the fixed-width alternative and what it forces on the programmer
- [[cs/math/set-theory-basics|Set Theory Basics]] - the nesting the number categories form, and why exactness is orthogonal to it
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - `=` and `eqv?` as two equivalence relations of different granularity
- [[cs/security/integer-overflow-vulnerabilities|Integer Overflow Vulnerabilities]] - the bug class arbitrary-precision integers remove, and the one they leave
- [[cs/math/number-theory-and-modular-arithmetic|Number Theory and Modular Arithmetic]] - where exact integer arithmetic of unbounded size is the requirement, not a luxury
- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation]] - the reader that turns `#e0.5` into `1/2` before evaluation ever starts

## Sources

- "3.2 Numbers," The Racket Guide. https://docs.racket-lang.org/guide/numbers.html . Supports the exact and inexact definitions with their examples, the printing conventions, the `#e`, `#i`, `#b`, `#o`, and `#x` prefixes, inexactness acting as a taint, the absence of inexact booleans and the exact result from a float comparison, `(inexact->exact 0.1)`, Racket representing only rationals and complex numbers with rational parts, the `sin` examples, small-integer performance and the word-size-minus-one definition of small, the cost of very large exact integers and non-integer exact numbers, the summation timing demonstration, and the `=` versus `eqv?` comparison semantics.
- "4.3 Numbers," The Racket Reference. https://docs.racket-lang.org/reference/numbers.html . Supports all numbers being complex with real and rational subsets, the infinities and not-a-number as the exceptions, integers defined by `round` fixing the value, exactness as an orthogonal classification, the default contagion rule, exact results from operations such as multiplying by an exact zero, irrational-producing operations yielding inexact results from exact arguments, a complex number with an exact zero imaginary part being real, inexact reals as double-precision IEEE flonums, the values with no exact form, and the difference between dividing by exact zero and by inexact zero.
