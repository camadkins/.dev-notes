---
title: "IEEE 754 as a Document"
description: "What the floating-point standard actually requires of an implementation, what it hands to the language binding, and why the 2008 and 2019 editions are the ones your compiler documentation is quietly referring to."
draft: false
comments: true
tags:
  - cs
  - standards
  - computer-architecture
date: 2026-07-02
updated:
aliases: []
---

Almost every programmer has met floating point through a surprise: a sum that ends in `.30000000000000004`, a comparison that fails on values that print identically, a total that drifts by a cent over a million rows. That behavior belongs to the arithmetic, and the garden documents it where it bites, in [[cs/languages/common/numeric-types-and-overflow-semantics|numeric types and overflow semantics]]. This note is about the document instead. IEEE 754 is a specification that tells an implementer what to build, and reading it as a specification answers a question the arithmetic never does: given that everyone claims to follow the same standard, why do two conforming systems disagree?

> [!note] The idea
> The standard makes a strong determinism promise and then attaches a condition that most readers skip. Results and exceptions "are uniquely determined by the values of the input data, sequence of operations, and destination formats, all under user control." Every one of those inputs is something the standard expects a *language* to expose and a *programmer* to choose. IEEE 754 specifies what an implementation must be able to do; it says almost nothing binding about how a program reaches it. The observable differences between languages are not violations of the standard. They live in the space the standard deliberately left to the language binding.

## What the document specifies

The IEEE Standards Association scope statement is compact: the standard "specifies interchange and arithmetic formats and methods for binary and decimal floating-point arithmetic in computer programming environments," and it "specifies exception conditions and their default handling." Five things are in scope. Arithmetic formats are the sets of values a system computes over, including signed zeros, subnormals, infinities, and NaNs. Interchange formats are encodings, described as bit strings "that may be used to exchange floating-point data in an efficient and compact form." Rounding rules are properties that must hold when a result is rounded. Operations are the required functions over an arithmetic format. Exception handling is the set of indications raised for exceptional conditions.

Two clauses in that list do more work than their length suggests. The first is the separation of arithmetic from interchange. An implementation is free to compute in wider registers than it stores, and the interchange format is the fixed bit layout that gives a value the same meaning on the machine that wrote it and the machine that reads it. That is why a 32-bit float in a binary protocol needs no negotiation beyond byte order, and it is the reason [[cs/languages/common/serialization-and-wire-formats|wire formats]] can name `binary32` and stop talking.

The second is the conformance floor. To conform to the current standard, an implementation must implement at least one of the basic formats as both an arithmetic format and an interchange format. One. A system that supports only `binary64` and nothing else can be fully conforming, which means "conforms to IEEE 754" is not a statement about which formats you get.

The standard is also studiously indifferent to how it is realized. An implementation "may be realized entirely in software, entirely in hardware, or in any combination of software and hardware." A soft-float library on a microcontroller with no FPU can conform. That neutrality is a design choice with teeth, because it forces every requirement to be phrased as observable behavior rather than as a circuit.

## What it hands to the language

Clause 9 recommends a long list of additional operations that language standards should define, including correctly rounded `exp`, `log`, `hypot`, and `pow`. None are required in order to conform to the standard. So a language can ship a math library whose transcendental functions are off by several units in the last place, and nothing in 754 has been broken.

Expression evaluation is the sharper case. The 1985 edition "left aspects of the language interface unspecified, which led to inconsistent behavior between compilers, or different optimization levels in an optimizing compiler." The 2008 revision responded by recommending how language standards should specify the semantics of sequences of operations, and by adding a reproducibility clause. That clause "recommends that language standards should provide a means to write reproducible programs." Recommends. When a C or C++ compiler contracts `a * b + c` into a fused multiply-add, or evaluates an intermediate in a wider format than you declared, it is exercising latitude the arithmetic standard chose not to close and the language standard chose to keep. The distinction between a clause that recommends and a clause that binds is the whole subject of [[cs/standards/normative-versus-informative-and-the-word-shall|normative versus informative text]], and 754 is the case where it costs real money.

## The editions, and which one your tools mean

The original standard, IEEE 754-1985, defined "a family of commercially feasible ways for new systems to perform binary floating-point arithmetic." Binary only. Its sibling, IEEE 854-1987, generalized the ideas to be radix-independent so that decimal machines were covered too.

The two merged in IEEE 754-2008, published in August 2008 after a seven-year revision chaired by Dan Zuras and edited by Mike Cowlishaw. That edition folded in 854 and added three new basic formats, one binary and two decimal. It is the edition that most language documentation is describing when it says a type follows IEEE 754, because it is where `binary16`, `binary128`, and the decimal formats were standardized, and where the rules on expression evaluation and reproducibility first appeared.

IEEE 754-2019 is the current version, published in July 2019, and it is a minor revision "incorporating mainly clarifications, defect fixes and new recommended operations." One example of how minor a minor revision can still matter: the ordering of NaN payloads under the `totalOrder` predicate was specified in 2008 so that a NaN with a lesser payload had a lesser absolute value, and in 2019 any implementation-defined ordering is acceptable. A sorting routine that relied on the 2008 behavior is now relying on something the current edition permits an implementation to change.

The standard also has a second identity. It is published in parallel as ISO/IEC 60559, whose scope text is word for word the IEEE scope. A specification that cites 60559 and one that cites 754 are citing the same requirements through different institutions, which is a pattern worth recognizing before you conclude that a contract is asking for two things.

> [!warning] What this note does not cover
> The normative text of IEEE 754 is not free. Everything quoted here comes from the IEEE Standards Association scope and history pages and from the public summary of the standard, which is enough to establish structure, conformance floor, and edition history. It is not enough to reconstruct a clause, and no clause number in this note should be treated as a citation of the clause text.

Reading 754 as a document rather than as arithmetic also reframes an old complaint. The pre-standard era was genuinely chaotic: IBM used a hexadecimal format with a fixed seven-bit exponent regardless of precision, which is part of why moving numeric data off [[cs/history/ibm-system-360|a System/360]] was a research project rather than a copy. The standard did not make floating point intuitive. It made it *portable enough to argue about*, and every remaining argument is about a clause it declined to write.

## Related Notes

- [[cs/standards/ieee-754-rounding-and-exceptions|IEEE 754 Rounding and Exceptions]] - the five modes and five flags, and why your language hides them
- [[cs/languages/common/numeric-types-and-overflow-semantics|Numbers, Overflow, and the Edge of the Type]] - the behavior side, across four languages
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] - why a specification is written as a contract between implementers
- [[cs/languages/common/portability-and-cross-compilation|Portability and Cross-Compilation]] - what changes when the same source targets a different float unit
- [[cs/math/taylor-series-and-approximation|Taylor Series and Approximation]] - how the recommended transcendental operations get computed at all

## Sources

- IEEE SA, "IEEE 754-2019, IEEE Standard for Floating-Point Arithmetic." https://standards.ieee.org/ieee/754/6210/ . Backs the scope statement, the software-or-hardware realization clause, the determinism-under-user-control sentence, the 1985 and 2008 scope texts, and the parallel ISO/IEC 60559-2020 publication.
- "IEEE 754," Wikipedia. https://en.wikipedia.org/wiki/IEEE_754 . Backs the five-part list of what the standard defines, the one-basic-format conformance floor, the 2008 merge with 854 and its editors, the 2019 revision characterization, the totalOrder payload change, the expression-evaluation and reproducibility clauses, and the pre-standard IBM hexadecimal format.
