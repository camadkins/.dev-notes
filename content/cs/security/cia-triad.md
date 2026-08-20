---
title: The CIA Triad
description: Every security control ultimately serves confidentiality, integrity, or availability, and naming which one a mechanism protects is what turns a vague "make it secure" into a decidable question.
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-01-19
updated:
aliases:
  - CIA triad
  - confidentiality integrity availability
---

Ask someone to "secure" a system and you get an unbounded shopping list: encryption, firewalls, backups, passwords, audit logs. The list has no natural end because "secure" is not one property. The CIA triad is the observation that underneath the sprawl there are only three things any of it can be protecting, and that pinning a control to which of the three it serves is what makes a security argument finite instead of a pile of good intentions.

> [!note] The idea
> Confidentiality, integrity, and availability are the three axes every security mechanism ultimately serves. The triad is not a checklist of features to add; it is a *classification* of what protection even means. Its analytical power is that it forces the question "protecting against what?" to resolve to one of exactly three answers, and that the three routinely trade against each other, so you cannot maximize all of them at once.

## The three properties

The triad "of *confidentiality, integrity, and availability* is at the heart of information security." Each leg is a distinct guarantee about a distinct kind of failure, and the U.S. federal definitions (FIPS 200, tracing to the statute at 44 U.S.C. 3542) state them precisely enough to reason with.

Confidentiality is "preserving authorized restrictions on information access and disclosure, including means for protecting personal privacy and proprietary information." The failure it names is the wrong party *reading* the data.

Integrity is "guarding against improper information modification or destruction, and includes ensuring information non-repudiation and authenticity." The failure it names is the data being *changed* (or forged) without authorization. Note that integrity explicitly absorbs authenticity and non-repudiation, which is why a broader hexad is sometimes proposed.

Availability is "ensuring timely and reliable access to and use of information." The failure it names is the legitimate party being *unable to get at* the data or service when needed.

## Why the classification is the payload

The value is not the three words; it is that they partition the space of security failures. A confidentiality breach is someone reading what they should not. An integrity breach is someone writing what they should not, or the data silently corrupting. An availability breach is the rightful user locked out. Every attack you can name lands in at least one bucket, and knowing which bucket tells you what mechanism could possibly help.

This is why the triad pairs so cleanly with threat frameworks. [[stride-threat-modeling|STRIDE]] works precisely because its six threats are negations of security properties, and information disclosure, tampering, and denial of service are the direct negations of confidentiality, integrity, and availability. A [[symmetric-vs-asymmetric-cryptography|cipher]] buys confidentiality; a [[stride-threat-modeling|message authentication code]] buys integrity; redundancy and rate limiting buy availability. Ask of any control "which leg?" and if the answer is "none," it is not a security control.

## The properties fight each other

The non-obvious consequence is that the three are not independent goods you accumulate. They trade. The most confidential possible design for a document is to encrypt it and destroy the key: unreadable by anyone, which is perfect confidentiality and zero availability. Aggressive integrity checking that refuses any write it cannot fully verify can lock out legitimate updates, spending availability to buy integrity. A high-availability system with many replicas widens the confidentiality attack surface, since there are now more copies to steal. Because you cannot maximize all three, real design is the act of choosing *which* leg dominates for *this* asset. A public stock ticker prizes integrity and availability and barely cares about confidentiality; a leaked-but-accurate classified file has failed on confidentiality while integrity and availability held perfectly.

> [!warning] Three may not be enough
> Practitioners argue the triad omits properties worth naming on their own. "Some organisations may want to include security goals such as authenticity, accountability, non-repudiation, and reliability," and the extended Parkerian Hexad is "a subject of debate amongst security professionals." The federal definitions fold authenticity and non-repudiation *into* integrity, which is defensible but hides them; when a design turns on proving *who* acted, promoting authenticity to a first-class goal is often clearer than treating it as a sub-clause of integrity.

## Related Notes

- [[stride-threat-modeling|STRIDE Threat Modeling]] enumerates threats as the negations of these very properties
- [[authentication-vs-authorization|Authentication vs Authorization]] are the mechanisms that enforce confidentiality and integrity at the access boundary
- Defense in depth layers controls so a single failure does not collapse any one leg
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs. Asymmetric Cryptography]] is the primary tool for the confidentiality leg
- [[denial-of-service-and-ddos|Denial of Service and DDoS]] is the availability leg under direct attack

## Sources

- "Information security," Wikipedia. https://en.wikipedia.org/wiki/Information_security . Supports that the CIA triad of confidentiality, integrity, and availability is at the heart of information security, and that some organisations extend it with authenticity, accountability, non-repudiation, and reliability (the debated Parkerian Hexad).
- "confidentiality," NIST Computer Security Resource Center Glossary. https://csrc.nist.gov/glossary/term/confidentiality . Supports the FIPS 200 definition of confidentiality as preserving authorized restrictions on information access and disclosure.
- "integrity," NIST Computer Security Resource Center Glossary. https://csrc.nist.gov/glossary/term/integrity . Supports the FIPS 200 definition of integrity as guarding against improper information modification or destruction, including non-repudiation and authenticity.
- "availability," NIST Computer Security Resource Center Glossary. https://csrc.nist.gov/glossary/term/availability . Supports the FIPS 200 definition of availability as ensuring timely and reliable access to and use of information.
