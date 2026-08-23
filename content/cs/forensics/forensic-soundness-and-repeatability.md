---
title: Forensic Soundness and Repeatability
description: "Soundness is not a property of a result, it is a property of the path to the result, and the operational test is whether a second examiner given the same evidence and the same documented method arrives at the same place."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-04
updated:
aliases:
  - Forensically Sound
  - Repeatability
  - Reproducibility in Forensics
---

"Forensically sound" gets used as though it meant "did not touch anything," which is both impossible and beside the point. Every acquisition touches something. Reading memory allocates memory. Powering a device on runs firmware. Even a perfect hardware-blocked disk image spins the platters and warms the drive. The term is doing different work.

> [!note] The idea
> Soundness is a claim about **reproducibility by a stranger**, not about non-interference. The standard is not that the examiner changed nothing; it is that another qualified examiner, given the same inputs and the documented method, reaches the same output, and that every change the method caused was predictable, bounded, and recorded. A result nobody else can reproduce is an assertion about the examiner. A result anyone can reproduce is an assertion about the evidence.

## The requirement, stated as a requirement

RFC 3227 puts it in two sentences under the heading of transparency. The methods used to collect evidence should be transparent and reproducible. You should be prepared to reproduce precisely the methods you used, and have those methods tested by independent experts.

That second clause is the one that turns a preference into a standard. "Reproducible" alone could mean reproducible by the person who did it, which is worth very little. "Tested by independent experts" means the method must survive being run by someone with no stake in the conclusion, which is the only version of the property that an opponent cannot simply deny.

NIST expresses the same idea as an output of documentation rather than as a virtue of methods. All steps taken to create an image copy should be documented, and doing so should allow any analyst to produce an exact duplicate of the original media using the same procedures. Note the phrasing: any analyst. Not the analyst. The documentation is written for a reader who does not exist yet and may be hostile.

## Why "repeatable" and "reproducible" are worth separating

A method is repeatable when the same examiner, on the same evidence, with the same tools, gets the same answer twice. That is a low bar and it is still frequently failed, usually by tools whose output depends on the order of processing or on a cache built during a previous run.

A method is reproducible when a different examiner, in a different lab, with a different licensed copy of the same tool version, gets the same answer. Reproducibility is the property the adversarial setting actually needs, and it fails for reasons repeatability never exposes: an undocumented configuration option, a timezone assumed rather than recorded, a plugin version that changed a parsing heuristic. This is the same distinction that [[cs/software-engineering/testing-strategies|test design]] makes between a test that passes on your machine and a test that passes in CI, with the difference that here the "other machine" is a person who is being paid to make the test fail.

RFC 3227 pushes the horizon further out. Be prepared to testify, perhaps years later, outlining all actions you took and at what times, and detailed notes will be vital. Reproducibility in forensics has a time axis. The method must be reconstructible after the examiner has forgotten it, after the tool has been updated past the version used, and after the hardware has been retired.

## The tools inherit the requirement

An examiner's method is only as reproducible as the tools inside it, which is why the tool-testing program exists. NIST's CFTT specification opens by naming the need directly: a capability is required to ensure that forensic tools consistently produce accurate, objective, and reproducible test results. The project's goal is to establish a methodology for testing computer forensic tools through functional specifications, test procedures, test criteria, test sets, and test hardware.

Notice the structure, because it is the same one used in [[cs/standards/ieee-1012-verification-and-validation|verification and validation]] generally. First write down what the tool is supposed to do, in terms independent of any product. Then derive assertions. Then derive tests. The specification is not a review of tools; it is the artifact that makes reviewing tools possible without arguing about what "should" meant.

RFC 3227 lands the personal version of the same obligation: you should be prepared to testify to the authenticity and reliability of the tools that you use. An examiner who cannot describe how a tool reaches its conclusion has adopted the tool's claims as their own without being able to defend them, which is exactly the position [[cs/forensics/the-daubert-standard-and-expert-testimony|expert testimony]] rules are designed to detect.

## Where soundness is actually won

It is won before the incident, in the procedures. SP 800-86 recommends developing guidelines and procedures precisely so that decisions are made consistently, and notes that management should ensure all major decision-making points are documented and the proper course of action is defined. RFC 3227 makes the practical demand: collection procedures should be as detailed as possible, unambiguous, and should minimise the amount of decision-making needed during the collection process.

Minimising decisions during collection is the load-bearing idea. Every judgment call made at three in the morning by a tired responder is a place where the method diverges from any documented method and therefore stops being reproducible. Procedures do not make the responder smarter. They make the responder's actions predictable, which is what a later reconstruction requires.

RFC 3227 adds a test for the procedures themselves: though it hardly needs stating, your procedures should be implementable, and, as with any aspect of an incident response policy, procedures should be tested to ensure feasibility, particularly in a crisis. An untested procedure is a document that describes a method nobody has ever executed, which is the same epistemic position as an untested backup.

SP 800-86 also names the payoff in a register that has nothing to do with courts. Handling evidence in a forensically sound manner puts decision makers in a position where they can confidently take the necessary actions. Soundness buys speed later. An organization that cannot trust its own reconstruction has to hedge every remediation decision, and hedging is expensive.

> [!warning] Soundness does not mean unmodified
> A live memory capture necessarily perturbs the state it records, and [[cs/forensics/memory-acquisition|memory acquisition]] is sound anyway, because the perturbation is understood, bounded, and documented. The failure mode is not causing change. It is causing change you cannot characterize, or characterizing it only after being challenged.

## Related Notes

- [[cs/forensics/chain-of-custody|Chain of Custody]] is the documentary substrate that makes reproduction by a stranger possible at all.
- [[cs/forensics/tool-validation-and-nist-cftt|Tool Validation and NIST CFTT]] is the program this note's tool requirement points to.
- [[cs/standards/ieee-1012-verification-and-validation|IEEE 1012 and the Integrity Level]] is the general form of "how much verification does this claim deserve."
- [[cs/software-engineering/testing-strategies|Testing Strategies]] draws the same repeatable-versus-reproducible line in a friendlier setting.
- [[cs/software-engineering/incident-postmortems-and-blameless-culture|Incident Postmortems]] show what reconstruction looks like when nobody is trying to break it.
- [[cs/security/penetration-testing-methodology|Penetration Testing Methodology]] is the neighboring discipline where reproducibility is a courtesy rather than a requirement, which sharpens the contrast.

## Sources

- [RFC 3227, Guidelines for Evidence Collection and Archiving](https://www.rfc-editor.org/rfc/rfc3227.html) backs the transparency and independent-expert requirement, the years-later testimony expectation, the tool authenticity obligation, and the demands on collection procedures.
- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the any-analyst duplication standard, the guidance on documented decision points, and the decision-maker confidence argument.
- [NIST CFTT Hardware Write Blocker Device (HWB) Specification, Version 2.0](https://www.nist.gov/system/files/documents/2017/05/09/hwb-v2-post-19-may-04.pdf) backs the statement of why tool testing exists and the specification-first testing methodology.
