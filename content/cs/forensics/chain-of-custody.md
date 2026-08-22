---
title: Chain of Custody
description: "A continuous documented account of who held an item of evidence, when, and under what conditions, whose real function is to make tampering a claim someone has to prove rather than a possibility they can merely raise."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-06-27
updated:
aliases:
  - Custody Chain
  - Evidence Handling
---

Nothing about a disk image tells you where it came from. A file of bytes with a matching hash proves only that those bytes hash to that value, and an examiner who produces one has proved a mathematical fact about a file, not a historical fact about a machine. The gap between those two things is where chain of custody lives.

> [!note] The idea
> Chain of custody is a **burden-shifting device**, and that is a different job from integrity checking. A hash detects modification; custody documentation makes an accusation of substitution testable. Without the chain, an opponent needs only to observe that the evidence was out of anyone's sight for an unrecorded interval, and the finding is now arguing against a possibility rather than against a claim. With an unbroken chain, the opponent has to name a custodian and allege what that person did.

## What it documents

RFC 3227 states the requirement compactly. Evidence must be strictly secured, and the chain of custody needs to be clearly documented. You should be able to clearly describe how the evidence was found, how it was handled, and everything that happened to it. It then enumerates four facts that must be recorded.

Where, when, and by whom the evidence was discovered and collected. Where, when, and by whom it was handled or examined. Who had custody during what period, and how it was stored. And when the evidence changed custody, when and how the transfer occurred, including shipping numbers.

Read as a data model this is a log of state transitions over an item, with each entry naming an actor, an interval, a location, and a transfer mechanism. The properties that matter are the ones you would demand of any [[cs/software-engineering/observability-logging-metrics-tracing|audit log]]: completeness, ordering, and the absence of gaps. The difference is the consequence of a gap. A missing span in an application log is an operational annoyance. A missing span in a custody record is an unforced concession, because the other side does not have to prove anything happened in the gap. They only have to point at it.

## Why the acquisition record is part of the chain

NIST SP 800-86 extends the same idea into the technical work. All steps taken to create the image copy should be documented, and doing so should allow any analyst to produce an exact duplicate of the original media using the same procedures. Beyond the steps, the analyst should document supplementary information such as the hard drive model and serial number, media storage capacity, and information about the imaging software or hardware that was used, including name, version number, and licensing information. NIST is explicit that all of these actions support the maintenance of the chain of custody.

That last sentence is the one to sit with. The serial number of the drive is a custody artifact, not an inventory detail. It is what ties the object in the evidence locker to the object described in the report, and without it the chain has an unnamed node. The version number of the imaging tool serves the same function in a different dimension: it identifies which behavior produced the image, which matters when a later-discovered defect in that version becomes the basis for an attack on the result. This is the point at which chain of custody stops being paperwork and becomes a dependency manifest for a claim.

NIST also names the trigger. Before data collection begins, a decision should be made regarding the need to collect and preserve evidence in a manner that supports its use in future legal or internal disciplinary proceedings, and in such situations a clearly defined chain of custody should be followed to avoid allegations of mishandling or tampering of evidence. The guidance then removes the temptation to guess: if it is unclear whether or not evidence needs to be preserved, by default it generally should be preserved.

## What breaks it

The physical failure modes are the boring ones, and they are the most common. The NIJ's first responder guide states the governing principle for all of them: the process of collecting, securing, and transporting digital evidence should not change the evidence. It then asks responders to document the transportation of the digital evidence and maintain the chain of custody on all evidence transported. The guide's environmental cautions read like a materials handling manual because that is what they are. Evidence should not be kept in a vehicle for prolonged periods, since heat, cold, and humidity can damage or destroy digital evidence.

The logical failure modes are subtler and more damaging.

An unlogged working copy is the classic. An examiner mounts an image on a workstation to look at one thing, does not record the mount, and now there exists an instance of the evidence with no custody entry. RFC 3227 anticipates the general shape of this by insisting that access to evidence be extremely restricted and clearly documented, and that it should be possible to detect unauthorized access.

A second is the storage-medium trap. RFC 3227 advises that commonly used media rather than obscure storage media be used for archiving. The reason is not convenience. Evidence that can only be read by one machine has an implicit custodian, and when that machine dies the chain has an untestable segment.

A third is the analyst who works on the original. RFC 3227 says to make a bit-level copy of the system's media, and if you wish to do forensic analysis, to make a bit-level copy of your evidence copy for that purpose, because your analysis will almost certainly alter file access times. It closes with the instruction to avoid doing forensics on the evidence copy. That is a two-generation rule: original, evidence copy, working copy. Each generation is a custody boundary, and collapsing two of them into one is how an examiner ends up having to explain why the [[cs/forensics/timestamps-macb-and-timeline-analysis|access timestamps]] on the exhibit are dated after the seizure.

> [!warning] The chain is not the integrity check
> [[cs/security/cryptographic-hash-functions|Hashing]] proves the bytes did not change between two points where you computed a hash. Custody documentation covers the intervals where nobody was computing anything, and it covers substitution, which hashing alone cannot detect if the substituting party also controls the recorded hash. The two mechanisms are complementary and neither replaces the other. [[cs/forensics/acquisition-write-blockers-and-verification|Acquisition verification]] handles the first job.

## Related Notes

- [[cs/forensics/acquisition-write-blockers-and-verification|Acquisition, Write Blockers, and Verification]] covers the integrity half that custody documentation deliberately does not do.
- [[cs/forensics/forensic-soundness-and-repeatability|Forensic Soundness and Repeatability]] is what the documented procedure is for: a second examiner reproducing the result.
- [[cs/security/digital-signatures|Digital Signatures]] are what RFC 3227 has in mind when it suggests cryptographically signing collected evidence.
- [[cs/law/state-breach-notification-law|State Breach Notification Law]] is one of the non-criminal audiences that will read a custody record.
- [[cs/security/comsec-principles|COMSEC Principles]] handle the same accountability problem for keying material, where custody of a physical object is likewise the control.
- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] is the same lineage problem solved for code, with the useful contrast that a commit graph is self-authenticating and an evidence bag is not.

## Sources

- [RFC 3227, Guidelines for Evidence Collection and Archiving](https://www.rfc-editor.org/rfc/rfc3227.html) backs the four documented custody facts, the access restriction and archival media guidance, and the bit-level copy rule.
- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the imaging documentation requirements, the supplementary drive and tool details, and the default-to-preserve guidance.
- [Electronic Crime Scene Investigation: A Guide for First Responders, Second Edition (NIJ)](https://www.ojp.gov/pdffiles1/nij/219941.pdf) backs the handling principle and the transportation and environmental cautions.
