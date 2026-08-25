---
title: Anti-Forensics and What It Defeats
description: "Every technique for destroying evidence has to reach every independent record of the same act, and almost none of them do, which is why anti-forensics usually converts one artifact into a different and often louder one."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-08
updated:
aliases: []
---

Anti-forensics is usually described as a list of tools: timestamp editors, wipers, log cleaners, encryption. The list is not the interesting part. What matters is a counting problem. A single act on a modern system is recorded independently in several places by components that do not know about each other, and a technique only works if it reaches all of them. Most reach one.

> [!note] The idea
> Anti-forensic techniques are best evaluated by asking **how many independent records of the same event the technique must modify, and how many it actually modifies**. A tool that edits the timestamps a user can see leaves the ones the kernel maintains. A command that clears a log writes an entry saying the log was cleared. Destruction that succeeds usually does so by making the medium unreadable rather than by editing the record, and that is visible too.

## Timestomping edits one of two clocks

The canonical example is timestamp manipulation. [[cs/security/the-cyber-kill-chain-and-mitre-attack|ATT&CK]] describes it as a technique in which "adversaries may modify file time attributes to hide new files or changes to existing files," typically "to mimic files that are in the same folder and blend malicious files with legitimate files."

The reason it usually fails is a structural detail of the filesystem. "In Windows systems, both the $STANDARD_INFORMATION ( $SI ) and $FILE_NAME ( $FN ) attributes record times in a Master File Table (MFT) file." Those are two sets of times for the same file, maintained separately. ATT&CK is explicit about which one tooling touches: the $SI times are "displayed to the end user, including in the File System view, while $FN is dealt with by the kernel," and "modifying the $SI attribute is the most common method of timestomping because it can be modified at the user level using API calls." The other set is harder: "$FN timestomping, however, typically requires interacting with the system kernel or moving or renaming a file."

So the ordinary case leaves two records of the same file in disagreement. The disagreement is the evidence, and it is stronger than the original timestamp would have been, because a file whose displayed creation time precedes its kernel-recorded time is not a thing that happens by accident. The mechanics of the two attribute sets belong to [[cs/forensics/ntfs-artifacts-and-the-mft|the MFT]], and reading the pair against each other is the core move in [[cs/forensics/timestamps-macb-and-timeline-analysis|timeline analysis]].

The same counting logic extends past the filesystem. Journals, [[cs/forensics/windows-event-logs-and-user-activity|event records]], prefetch and execution artifacts, and backup snapshots all carry their own notion of when the file appeared, and none of them are updated by a tool that rewrites attributes on one file.

## Clearing a log is an act that logs

Log clearing is the bluntest technique and the most self-defeating. ATT&CK notes that "adversaries may clear Windows Event Logs to hide the activity of an intrusion," and describes exactly how: "with administrator privileges, the event logs can be cleared with the following utility commands," naming the system, application, and security channels, along with GUI and PowerShell equivalents.

Two documented details undercut it. First, clearing is itself an audited event: Microsoft documents an event that "generates every time Windows Security audit log was cleared" and records the "SID of account that cleared the system security audit log," so the log ends up holding a record of its own destruction with an actor attached. Second, ATT&CK notes for the disable-then-reboot variant that "events may still be generated and logged in the .evtx file between the time the command is run and the reboot," so even the aggressive version leaves a window of recorded activity.

What clearing does accomplish is real: the contents are gone from that host, and whatever they said cannot be recovered from the live log. Whether that matters depends on whether copies existed elsewhere. [[cs/security/siem-and-security-logging|A forwarded log]] is outside the attacker's reach, and an examiner who finds a cleared local log with an intact remote copy has both the original content and a documented act of destruction.

## Deletion and the medium

Deleting a file does not remove its contents. That is the premise of [[cs/forensics/file-carving-and-unallocated-space|carving]], and it is why serious destruction targets the medium rather than the directory entry.

NIST's sanitization guidance gives the vocabulary that a report should use, because the terms are graded by what recovery they defeat. "Clear applies logical techniques to sanitize data in all user-addressable storage locations for protection against simple non-invasive data recovery techniques," typically by rewriting through ordinary read and write commands. "Purge applies physical or logical techniques that render Target Data recovery infeasible using state of the art laboratory techniques." And "Destroy renders Target Data recovery infeasible using state of the art laboratory techniques and results in the subsequent inability to use the media for storage of data."

Two things follow for an examiner. The first is that the phrase "user-addressable" is doing heavy work. A logical overwrite reaches the locations the host can address, and modern storage keeps data in places the host cannot address, which is why NIST notes that with solid state storage the change "is revolutionary" from a sanitization perspective and that "degaussing, a fundamental way to sanitize magnetic media, no longer applies in most cases for flash memory-based devices."

The second is that successful sanitization is itself an observable fact. A drive with no recoverable structure, or a range of sectors uniformly overwritten, does not look like a normally used drive. The evidence stops being the content and becomes the pattern of absence, together with whatever else recorded that a wipe was run: an installed tool, a shell invocation, a prefetch entry, a purchase.

## Encryption is the one that works

Encryption is different in kind from the rest of the list, because it does not try to remove a record. It makes the record unintelligible while leaving it in place, and unlike timestamp editing or log clearing, its guarantee does not depend on reaching every copy. Every copy is equally useless without the key.

That is why NIST treats cryptographic erase as a sanitization method in its own right and simultaneously warns about it: "in some cases, it may be difficult to verify that CE has effectively sanitized media," and where verification is not possible, an organization "should use alternative sanitization methods that can be verified." Destroying a key is fast and complete, and it is hard to prove it happened.

What encryption still cannot hide is that it is there. Encrypted volumes have containers, tools leave installation traces, and the surrounding artifacts, meaning file names, sizes, access times, and the [[cs/systems/end-to-end-encryption-and-the-lawful-access-debate|metadata that encryption does not cover]], continue to describe activity. In an investigation, the practical effect is to shift the target from the data to the key, and from the disk to memory, since a key in use is a key in RAM.

> [!warning] Scope
> This note describes what techniques do to evidence and what they leave. Deliberately destroying evidence carries its own legal consequences that are separate from the underlying conduct, and describing a technique is not describing a lawful or advisable act.

## The examiner's posture

The working method against all of this is redundancy plus documentation. Prefer artifacts that are written by different components with different privileges, since a single actor rarely controls all of them. State findings as claims about specific artifacts rather than about the world, because "the $SI creation time is earlier than the $FN creation time for this file" survives cross-examination in a way that "the file was planted" does not. And when a technique clearly succeeded, say so plainly: the absence, its shape, and what it prevents are themselves findings, and pretending to a certainty the artifacts do not support is the failure this whole section is organized around.

## Related Notes

- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] for reading two clocks against each other.
- [[cs/forensics/ntfs-artifacts-and-the-mft|NTFS Artifacts and the MFT]] for the two attribute sets that make timestomping detectable.
- [[cs/forensics/file-carving-and-unallocated-space|File Carving and Unallocated Space]] for why deletion alone destroys nothing.
- [[cs/forensics/windows-event-logs-and-user-activity|Windows Event Logs and User Activity]] for the event that clearing the log creates.
- [[cs/systems/end-to-end-encryption-and-the-lawful-access-debate|End-to-End Encryption and the Lawful-Access Debate]] for the metadata encryption leaves exposed.
- [[cs/forensics/memory-acquisition|Memory Acquisition]] because a key in use is a key in memory.

## Sources

- <https://attack.mitre.org/techniques/T1070/006/> for timestomping, the two NTFS attribute sets, and why user-level modification touches only one.
- <https://attack.mitre.org/techniques/T1685/005/> for clearing Windows event logs, the utility commands used, and the events still written before a reboot.
- <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r1.pdf> for the Clear, Purge, and Destroy definitions, the user-addressable limit, flash media, and verification of cryptographic erase.
- <https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-1102> for the audit event written when the security log is cleared.
