---
title: The Orange Book and Graded Assurance
description: How the U.S. government turned "is this system secure?" into a graded, testable scale of trust.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-02-19
updated:
aliases:
  - TCSEC
  - Orange Book
---

Claiming a system is secure is easy. Saying how secure, and backing it up, is the hard part. The Trusted Computer System Evaluation Criteria, known by the color of its cover as the Orange Book, was the United States government's attempt to replace the vague claim with a graded scale that a system could actually be measured against.

> [!note] The idea
> Put trustworthiness on a ladder. Each higher rung demands stronger and more formally verified security, so that "secure" becomes a level a system can be tested and certified for, rather than a word a vendor asserts.

## Who and when

The Orange Book was issued in 1983 by the National Computer Security Center, a division of [[cryptography-codebreaking-and-the-nsa|the NSA]], and updated in 1985. It set the basic requirements for assessing how effective a computer system's security controls were.

## The ladder

It defined four divisions, from D at the bottom to A at the top, and broke the upper divisions into classes: C1, C2, B1, B2, B3, and A1. Division D meant minimal protection. The C classes added discretionary controls and accountability. The B classes required mandatory access control, built on the [[bell-lapadula-and-mandatory-access-control|Bell-LaPadula model]], along with a clear security policy model. Each step up demanded more rigor in how the system was designed and argued, beyond simply adding features.

## The top rung

The highest class, A1, was distinguished by formal design and verification techniques, including a formal top-level specification of the system. At that level a vendor could not merely test the system and report no problems found. The design had to be argued mathematically. This was the government insisting that, for the most sensitive systems, security be demonstrated rather than assumed.

## Legacy

The Orange Book is the ancestor of the evaluation schemes that followed it, including the international Common Criteria still used today. The specific classes are history now, but the idea it introduced, that security can be graded, evaluated, and certified against a published standard, became permanent.

## Related Notes

- [[bell-lapadula-and-mandatory-access-control|Bell-LaPadula and Mandatory Access Control]], the model the higher classes required
- [[cyber-warfare-and-the-fifth-domain|Cyber Warfare and the Fifth Domain]], the modern security stakes
- [[cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]], the agency behind the standard
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Trusted Computer System Evaluation Criteria," Wikipedia. https://en.wikipedia.org/wiki/Trusted_Computer_System_Evaluation_Criteria . Supports the TCSEC as a DoD standard created by the National Computer Security Center (an NSA division), first issued in 1983 and updated in 1985, defining four divisions (D, C, B, A) and classes (C1, C2, B1, B2, B3, A1), with class A1 requiring formal design and verification including a formal top-level specification.
