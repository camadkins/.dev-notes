---
title: Cryptography, Codebreaking, and the NSA
description: How making and breaking codes turned cryptography into one of the earliest and largest drivers of computing power, and produced the NSA.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-03-07
updated:
aliases:
  - NSA
  - cryptanalysis
---

Secrecy is a computational arms race. [[cs/security/comsec-principles|Protecting your own communications]] and breaking your enemy's are two sides of the same problem, and both, pushed hard enough, demand computation. The United States did both throughout the twentieth century, and in 1952 it created an agency for it that became one of the hungriest consumers of computing power on Earth.

> [!note] The idea
> Codemaking and codebreaking turned cryptography into an early and enormous driver of computing. The harder the codes, the more computation it took to make and break them.

## Codes as a military problem

In the Second World War the United States protected its own high-level traffic with cipher machines like [[cs/military-computing/sigaba-cipher-machine|SIGABA]], which was never broken, while codebreaking the enemy's traffic was understood, even then, as fundamentally a problem of pattern, statistics, and computation. The Navy's own codebreakers, [[cs/military-computing/naval-cryptology-roof-gang|OP-20-G and the On-the-Roof Gang]], are part of the same story.

## Breaking the unbreakable

The [[cs/military-computing/venona-and-one-time-pad-reuse|VENONA]] project showed the other side: even a provably secure cipher falls when it is used wrong, and reading the resulting traffic took years of painstaking analysis. Cryptanalysis is relentless, and it rewards whoever can bring the most computation to bear.

## The NSA

The National Security Agency was formed on 4 November 1952. It is responsible for [[cs/law/title-10-and-title-50-authorities|signals intelligence]], [[cs/geopolitics/surveillance-and-privacy|the global collection and processing of communications]], and for protecting United States communications and information systems. Concentrating the nation's codemaking and codebreaking in one agency also concentrated its appetite for computing.

## The compute arms race

That appetite drove hardware. The NSA commissioned machines built specifically to attack codes at scale, such as the stream-processing [[cs/military-computing/harvest-and-nsa-supercomputing|Harvest]], an early example of building hardware shaped like the problem. The same pressure runs forward into the public era of cryptography, through the [[cs/military-computing/des-standardization-and-symmetric-crypto|DES]] standard and the arrival of [[cs/military-computing/rsa-and-computational-hardness|public-key cryptography]].

## Related Notes

- [[cs/military-computing/sigaba-cipher-machine|SIGABA]], the American cipher that held
- [[cs/military-computing/venona-and-one-time-pad-reuse|VENONA]], reading a cipher broken by misuse
- [[cs/military-computing/harvest-and-nsa-supercomputing|IBM Harvest]], hardware built for cryptanalysis
- [[cs/military-computing/des-standardization-and-symmetric-crypto|DES]] and [[cs/military-computing/rsa-and-computational-hardness|RSA]], the public era of cryptography
- [[cs/geopolitics/surveillance-and-privacy|Surveillance and Privacy]], the modern stakes of this power
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "National Security Agency," Wikipedia. https://en.wikipedia.org/wiki/National_Security_Agency . Supports the NSA's formation on 4 November 1952, its responsibility for signals intelligence and the global collection and processing of communications, and its task of protecting U.S. communications networks and information systems.
