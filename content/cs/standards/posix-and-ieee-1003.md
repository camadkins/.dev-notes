---
title: "POSIX, or IEEE 1003"
description: "POSIX as an IEEE standard rather than as a folk category. What the document standardizes, how the Austin Group publishes it under three names at once, and what a POSIX conformance certificate actually certifies."
draft: false
comments: true
tags:
  - cs
  - standards
  - operating-systems
date: 2026-06-24
updated:
aliases:
  - IEEE 1003
  - POSIX as a Standard
---

"POSIX-compliant" appears in more READMEs than almost any other standards claim in software, and it is usually doing the work of an adjective rather than a citation. The underlying document is real, currently published, and specific about what it covers. Reading it as a standard rather than as a vibe changes what the phrase in the README means, and it explains an oddity that surprises people the first time they meet it: the operating system that the overwhelming majority of POSIX code runs on has never been certified as conforming.

> [!note] The idea
> POSIX standardizes an *interface*, never an implementation. It says what a program must be able to call and what the call must do, and it is deliberately silent about the kernel on the other side. That is why conformance can be certified by running a test suite against a product, and why certification is a per-product, per-edition, expiring claim rather than a property of a codebase. The word "compliant" in ordinary usage does not mean any of that. It means someone read the standard and mostly agreed with it.

## Three names, one document

The family is formally designated as IEEE 1003, and the same material is published as ISO/IEC 9945 and forms the core of the Single UNIX Specification. That is not three overlapping standards. The current set of specifications is simultaneously ISO/IEC 9945 and IEEE Std 1003.1, and it forms the core of the Single UNIX Specification, because one working group writes one text and three organizations publish it.

That group is the Austin Common Standards Revision Group, described on its own site as a joint technical working group established to develop and maintain the core open systems interfaces that are the POSIX 1003.1 standards, ISO/IEC 9945, and the core of the Single UNIX Specification. Its stated approach to specification development is "write once, adopt everywhere," with deliverables carrying the IEEE POSIX designation, The Open Group technical standard designation, and the ISO/IEC designation simultaneously. The specification is joint copyright IEEE and The Open Group, and participants are required to disclose any patent issues related to contributions, which is the same intellectual-property discipline that governs [[cs/standards/standards-patents-and-frand|patents in standards]] generally.

The group is free and open to participate in, and it deliberately balances commercial companies, figures from the open source community, liaisons from other standards groups, educational and government users, and user groups. The consequence is visible in the text: POSIX documents behavior that several independent implementations already had, which is a different exercise from designing an interface from scratch.

## What it standardizes, and what it refuses to

POSIX is a family of standards specified by the IEEE Computer Society for maintaining compatibility between operating systems, and it specifies functionality classifiable as an application programming interface, a command-line shell, and shell commands. Those three layers are the whole surface. System developers implement the interface imposed by POSIX, and application developers use that interface to get compatibility across POSIX-conforming systems.

Notice what is absent. There is nothing in the standard about how the kernel schedules, how it manages memory, whether it is monolithic or a microkernel, or how a call gets from user space into privileged code. Those are exactly the concerns of [[cs/systems/system-calls-and-the-kernel-boundary|the syscall boundary]], and POSIX sits one layer above them, specifying the shape of the request rather than the mechanism that carries it. This is why a POSIX interface can be provided by a Unix kernel, a compatibility layer, or a subsystem on an operating system with no Unix lineage at all. The standard cannot tell the difference and does not try to.

The name itself carries a trace of the same interface-first thinking. The standards emerged from a project that began in 1984, and Richard Stallman suggested the name POSIX to the IEEE instead of the former IEEE-IX, which the committee adopted for being easier to say. Originally POSIX referred to IEEE Std 1003.1-1988. The 1003.2 shell and utilities work was later folded back into the same document, which is why the modern citation is almost always just 1003.1.

## What conformance certifies

An operating system can be classified by its degree of conformance with a POSIX standard, and only one of those degrees is a certificate. A certified system is one that passed the automated conformance tests, whose certification has not expired, and whose product has not been discontinued. A test suite accompanies the standard for exactly this purpose. So the claim is a triple: a named product, a named edition, and a test run that has not aged out.

The systems on the current certified list are largely proprietary: AIX, INTEGRITY, macOS, OpenServer, UnixWare, VxWorks, and z/OS. Meanwhile Linux, in most distributions, sits in the other category, one described as not certified as POSIX conforming yet considered partially conforming, which is sometimes called compliant. The gap is not technical embarrassment. Certification costs money and effort per product and per release, and a distribution that ships continuously has little to gain from a certificate stamped on one snapshot.

> [!tip] The distinction worth keeping
> Conformance is a demonstrated result against a test suite for a named edition. Compliance, in ordinary software usage, is an unverified self-claim. Every time you see a standards claim in a procurement document, a datasheet, or a README, the first question is which of those two it is, because only one of them is checkable. The same split shows up under a different name in [[cs/standards/standards-in-procurement-and-defense-acquisition|procurement]], where a solicitation can demand either one and the difference is measured in money.

## Editions and the timing-out problem

POSIX has an unusually visible maintenance history, because the Austin Group posts it. The 2017 edition is the clearest artifact of standards process leaking into the numbering: it was a revision to the 1003.1-2008 standard that rolled up the standard including its two technical corrigenda as-is, done so as to avoid the standard timing out in 2018. Nothing technical changed. An IEEE standard that goes long enough without revision becomes inactive, so the working group republished the accumulated corrections under a new year to keep it alive, which is the exact mechanism described in [[cs/standards/amendments-revisions-and-rollups|amendments, revisions, and rollups]].

Real revision resumed afterward. IEEE Std 1003.1-2024 was published by IEEE in June 2024, alongside The Open Group Base Specifications, Issue 8, and ISO/IEC/IEEE Std 9945:2026 was published in March 2026. The HTML version of the 2024 edition is freely available to read online, which makes POSIX one of the few standards in this section you can actually read without buying it.

## Related Notes

- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - the mechanism POSIX deliberately does not specify
- [[cs/history/unix-and-open-source|Unix and Open Source]] - the implementations that existed before the interface was written down
- [[cs/languages/common/portability-and-cross-compilation|Portability and Cross-Compilation]] - what actually breaks when the target only partially conforms
- [[cs/standards/how-ieee-makes-a-standard|How IEEE Makes a Standard]] - why a joint working group can publish one text under three designations
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] - why an interface standard and an implementation are different objects

## Sources

- The Austin Common Standards Revision Group. https://www.opengroup.org/austin/ . Backs the description and remit of the Austin Group, the write-once-adopt-everywhere approach, the simultaneous ISO/IEC 9945 and IEEE 1003.1 publication, the joint copyright and patent-disclosure requirement, the open and balanced membership, the 2017 rollup to avoid timing out, the 2024 and 2026 publication dates, and the free HTML edition.
- "POSIX," Wikipedia. https://en.wikipedia.org/wiki/POSIX . Backs the IEEE Computer Society authorship and compatibility purpose, the API, shell, and commands scope, the IEEE 1003 designation, the naming by Richard Stallman, the 1988 first edition, the accompanying test suite, what certification means, and the certified versus partially conformant classification.
