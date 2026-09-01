---
title: Input Validation and Trust Boundaries
description: "A trust boundary is a line drawn through a program, untrusted on one side and trusted on the other. Validation is the only thing that moves data across it, and most validation bugs are really bugs about where the line is."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-08-31
updated:
aliases: []
---

MITRE's definition of a trust boundary violation is the clearest sentence in the whole subject: "A trust boundary can be thought of as line drawn through a program. On one side of the line, data is untrusted. On the other side of the line, data is assumed to be trustworthy. The purpose of validation logic is to allow data to safely cross the trust boundary - to move from untrusted to trusted."

Read backwards, that gives validation a job description most codebases have never written down. Validation is not a filter for dangerous characters. It is the *only* sanctioned transition between two states of a value, and it is a transition, so it has a location.

> [!note] The idea
> Every validation question is downstream of a location question. Where is the line, what does the code on the trusted side get to assume, and does a single function actually enforce that assumption for every path in? A trust boundary violation is what happens when a program mixes trusted and untrusted data in the same data structure or structured message, blurring the line and making it easier for programmers to mistakenly trust unvalidated data. The bug is rarely a missing regex. It is that nobody could say where the boundary was, so each caller assumed a different one.

## What "validated" has to mean

CWE-20 is deliberately broad: the product receives input or data, but does not validate, or incorrectly validates, that the input has the properties required to process the data safely and correctly. The interesting part is the properties list, because it is much longer than the one most validators implement. Among the things that may need checking: specified quantities such as size, length, frequency, price, rate, or number of operations; implied or derived quantities such as the actual size of a file rather than a specified size; indexes, offsets, or positions into more complex data structures; symbolic keys into hash tables or associative arrays; well-formedness, meaning compliance with expected syntax; lexical token correctness; specified or derived type; consistency between individual data elements, between raw data and metadata, and between references; conformance to domain-specific rules such as business logic; equivalence, so that equivalent inputs are treated the same; and authenticity or ownership, such as a cryptographic signature proving the source of the data.

Input here includes both raw data (strings, numbers, parameters, file contents) and metadata (information about the raw data, such as headers or size), and structured data can nest many layers of both. Two entries on that list are the ones that get skipped and then become CVEs. *Implied or derived quantities* is the declared-length-versus-actual-length mismatch behind a long line of [[cs/security/buffer-overflows|buffer]] and [[cs/security/integer-overflow-vulnerabilities|integer]] bugs; CWE notes that errors in deriving properties may themselves be a contributing factor to improper input validation. *Consistency between raw data and metadata* is the check that a `Content-Length` matches the body, that a declared MIME type matches the magic bytes, and that a JWT's `alg` header matches what the verifier was built for.

OWASP splits the work along a second axis, and the split is worth keeping. Syntactic validation enforces correct syntax of structured fields such as an SSN, a date, or a currency symbol. Semantic validation enforces correctness of values in the specific business context, such as a start date preceding an end date or a price falling within an expected range. A schema library gives you the first for free and never gives you the second, which is why "we use JSON Schema" answers half the question.

## Allowlist, and why denylists keep losing

It is a common mistake to use denylist validation to try to detect dangerous characters and patterns like the apostrophe, the string `1=1`, or the `<script>` tag, and OWASP calls it a massively flawed approach because it is trivial for an attacker to bypass such filters. It also has a cost on the other side: such filters frequently prevent authorized input, like `O'Brian`, where the apostrophe is fully legitimate. A denylist is simultaneously too weak against the adversary and too strong against the user, which is an unusual way to be wrong in both directions at once.

Allowlist validation defines exactly what is authorized, and by definition everything else is not. For well-structured data such as dates, postal codes, or email addresses, that is a strong pattern, usually a regular expression covering the whole input string with anchors and avoiding any-character wildcards. Denylisting known dangerous patterns can supplement this as an additional layer, and OWASP is explicit that it should supplement rather than replace allowlisting.

The sharpest operational detail is about fixed sets. If an input comes from a drop-down or radio buttons, it must match exactly one of the values offered to the user in the first place, and any failure to validate against that discrete list on the server side is a high security event that should be logged at high severity, because it indicates that an attacker is tampering with the client-side code. That is a rare case where a validation failure is not noise. The legitimate client cannot produce it.

## Where the line goes

Validation should happen as early as possible in the data flow, preferably as soon as the data is received from the external party. Early means fewer components downstream operating on unchecked values, and it means one place to audit.

Two corollaries follow, and both are routinely violated.

First, the boundary is server-side. Validation must be implemented on the server before any data is processed by an application's functions, because JavaScript-based validation on the client can be circumvented by an attacker who disables JavaScript or uses a web proxy. The recommended approach is both: client-side for user experience, server-side for security, each used for its strength. Client-side validation is a courtesy to the user and carries no security weight at all.

Second, the internet is not the only untrusted side. Data from all potentially untrusted sources should be subject to input validation, including backend feeds over extranets and data from suppliers, partners, vendors, or regulators, each of which may be compromised on their own and start sending malformed data. This is the same premise [[cs/security/zero-trust-architecture|zero trust]] generalizes into an architecture: a network position is not a trust decision, so an internal caller crosses a boundary exactly like an external one.

> [!warning]
> Validation is a contributing control, not the primary defense against injection. OWASP states that input validation should not be used as the primary method of preventing [[cs/security/cross-site-scripting-xss|XSS]], [[cs/security/sql-injection|SQL injection]], and similar attacks, though it can significantly reduce their impact. Those are fixed at the point of use, by [[cs/security/sql-injection|parameterized queries]] and by context-aware output encoding, because the same byte is safe in one context and hostile in another. Free-form text makes this obvious: if a user wants an apostrophe or a less-than sign in a comment, they may have a perfectly legitimate reason, and the application's job is to handle it correctly throughout the whole life cycle of the data. Rejecting it at the door is a bug report, not a defense.

Regular expressions carry their own hazard here. A poorly designed pattern enables a regular-expression [[cs/security/denial-of-service-and-ddos|denial of service]], where the program operates very slowly and consumes CPU for a very long time. The validator becomes the vulnerability.

## Parsing beats validating

The strongest form of this control changes the data's type rather than checking it. Once an input has been parsed into a value whose type can only represent well-formed instances, the trusted side of the boundary is enforced by the type checker rather than by everyone's discipline. A `UserId` that cannot be constructed except through a validating constructor makes trust a property you can see in a signature.

This is the point where the boundary becomes a [[cs/pl/type-systems-goals-guarantees|type system]] question, and where the failure mode is worth naming precisely. In TypeScript, annotating the perimeter as [[cs/languages/TypeScript/the-any-unknown-never-triangle|`any`]], or asserting a parsed body `as User`, performs no check at all: the [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|types are erased]] and the assertion is a claim, not a verification. A [[cs/languages/TypeScript/discriminated-unions-and-exhaustiveness|discriminated union]] has the same seam, since the compiler verifies that the branch you took matches the tag you tested and never verifies that the object arrived carrying the tag it claims. In both cases the trust boundary was drawn on paper. Parsing at the perimeter with a runtime validator is what puts it in the program.

[[cs/security/insecure-deserialization|Native deserialization]] is the extreme case: the format itself decides which classes to instantiate, so the boundary crossing happens *during* the parse and there is no inert intermediate value to inspect. The reason the fix there is to change the format rather than filter the bytes is that no validator can sit at a boundary the format has already crossed.

## Related Notes

- [[cs/security/stride-threat-modeling|STRIDE Threat Modeling]] - where trust boundaries get drawn explicitly, on a data flow diagram, before any code is written
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - what happens when the parse itself is the boundary crossing
- [[cs/security/sql-injection|SQL Injection]] - the point-of-use fix that validation supplements rather than replaces
- [[cs/security/cross-site-scripting-xss|Cross-Site Scripting (XSS)]] - why context-aware output encoding does the work input filtering cannot
- [[cs/security/path-traversal-and-directory-traversal|Path Traversal]] - a validation failure on a derived property, the resolved path rather than the supplied one
- [[cs/security/integer-overflow-vulnerabilities|Integer Overflow Vulnerabilities]] - the range check that CWE-20 lists and most parsers omit
- [[cs/security/zero-trust-architecture|Zero Trust Architecture]] - the same premise scaled from a function boundary to a network one
- [[cs/security/owasp-top-10|OWASP Top 10]] - where the injection classes this control feeds into are ranked
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what it takes to make the trusted side enforceable rather than conventional

## Sources

- "CWE-501: Trust Boundary Violation," MITRE. https://cwe.mitre.org/data/definitions/501.html . Backs the description of the weakness as mixing trusted and untrusted data in the same data structure or structured message, and the quoted definition of a trust boundary as a line drawn through a program with untrusted data on one side and trustworthy data on the other, validation logic existing to allow data to safely cross that boundary, and a violation occurring when the program blurs the line and makes it easier to mistakenly trust unvalidated data.
- "CWE-20: Improper Input Validation," MITRE. https://cwe.mitre.org/data/definitions/20.html . Backs the definition of the weakness as receiving input but not validating, or incorrectly validating, that it has the properties required to process the data safely and correctly; input consisting of raw data and metadata with structured data nesting both; the enumerated properties that may need validating, including specified and implied or derived quantities, indexes and offsets, symbolic keys, well-formedness, lexical token correctness, specified or derived type, consistency between elements and between raw data and metadata, conformance to domain-specific rules, equivalence, and authenticity such as a cryptographic signature; and the note that errors in deriving properties may be a contributing factor to improper input validation.
- "Input Validation Cheat Sheet," OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html . Backs input validation ensuring only properly formed data enters the workflow and happening as early as possible in the data flow, preferably as soon as data is received from the external party; the scope covering all potentially untrusted sources including backend feeds over extranets from suppliers, partners, vendors, or regulators that may themselves be compromised; the statement that input validation should not be the primary method of preventing XSS and SQL injection though it can significantly reduce their impact; the syntactic-versus-semantic split with its SSN/date/currency and start-date/price examples; the criticism of denylist validation as massively flawed and trivially bypassed while frequently blocking authorized input such as `O'Brian`; denylisting as a supplement rather than a replacement for allowlisting; allowlist validation defining exactly what is authorized with regular expressions anchored over the whole input and avoiding any-character wildcards; the fixed-option rule that a server-side mismatch against a discrete list is a high security event to be logged at high severity as evidence of client-side tampering; the requirement that validation be implemented server-side because client-side JavaScript validation can be circumvented by disabling JavaScript or using a web proxy, with both layers recommended; the free-form text guidance that a user may legitimately type an apostrophe or a less-than sign and the application must handle it through the whole life cycle of the data; and ReDoS as the risk of a poorly designed regular expression operating very slowly and consuming CPU for a very long time.
