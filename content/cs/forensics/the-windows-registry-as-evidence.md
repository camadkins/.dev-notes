---
title: The Windows Registry as Evidence
description: "The registry is a configuration database that accidentally became the richest single artifact on a Windows machine, and its one native timestamp is coarser than almost every examiner assumes."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-02
updated:
aliases: []
---

Windows keeps most of what it knows about itself in [[cs/dsa/trees|one hierarchical database]]. Which programs start at logon, which devices have been attached, which network the machine last joined, which user account maps to which profile directory, which application was configured when. None of that was designed as an audit trail. It exists so the operating system can find its own settings quickly. The forensic value is a side effect of a configuration store that happens to be written by nearly every component in the system.

> [!note] The idea
> The registry is a write-ordered record of state, not an event log, and it carries exactly one native time signal: a per-key last-write timestamp. That timestamp dates **the key, not the value**, and one modification to any value under a key restamps the whole key. Everything an examiner wants to say about *when* a registry-based event occurred rests on that single coarse field, or on correlating the key against artifacts that do carry per-event times.

## Hives are files

Microsoft defines the unit precisely. "A hive is a logical group of keys, subkeys, and values in the registry that has a set of supporting files loaded into memory when the operating system is started or a user logs in." That definition matters to acquisition because it says two things at once: the hive is a live in-memory structure, and it is backed by files on disk.

"Most of the supporting files for the hives are in the %SystemRoot%\System32\Config directory." SYSTEM, SOFTWARE, SAM, and SECURITY live there. Per-user state lives elsewhere, because "each time a new user logs on to a computer, a new hive is created for that user with a separate file for the user profile," which is the NTUSER.DAT in each profile directory.

That split is the first practical fact of registry analysis. A machine-wide question (what services are installed, which USB devices were seen, what the computer name is) is answered from the config directory. A per-user question (what this account ran, what it typed into a path box, what it mounted) is answered from that account's own hive file. Two accounts on one machine produce two independent answers, and confusing them is the fastest way to attribute an action to the wrong human being.

Because hives are files, they are recovered like files. They sit in the volume, tracked by [[cs/forensics/ntfs-artifacts-and-the-mft|the master file table]] like any other data. Because hives are also loaded into memory, a locked live hive can be pulled from [[cs/forensics/memory-analysis-and-process-reconstruction|a memory image]] when a disk copy is unavailable, and the two copies can disagree, since the in-memory version reflects writes not yet flushed.

## The keys that carry weight

The persistence keys are the ones an intrusion examiner reaches for first, and Microsoft documents them as an ordinary application feature. "The Run key makes the program run every time the user logs on, while the RunOnce key makes the program run one time, and then the key is deleted." There are four of them, two under the machine root and two under the current user, and "the data value for a key is a command line no longer than 260 characters."

Read that as an examiner rather than as a developer. A command line under a Run key is an assertion that something intended to execute at every logon, and the machine-level and user-level variants distinguish an install that required administrative rights from one that did not. The self-deleting behavior of RunOnce is the more interesting half: a successful RunOnce entry removes its own evidence, so absence in a live system proves nothing about what ran yesterday. Microsoft also notes that "if more than one program is registered under any particular key, the order in which those programs run is indeterminate," which forecloses any argument that one entry must have executed before another.

The same hives carry device history, mounted volume mappings, installed services and their binary paths, shell history for typed paths and run boxes, and the mapping between a security identifier and an account name. The techniques catalog in [[cs/security/the-cyber-kill-chain-and-mitre-attack|ATT&CK]] treats many of these as named persistence and defense-evasion behaviors, which is useful for phrasing a finding: the artifact is a configuration entry, the behavior it evidences has a name, and the two should never be collapsed in a report.

## What a key timestamp does not tell you

Every registry key carries a last-write time. The API that returns it is documented plainly: "The function sets the members of the FILETIME structure to indicate the last time that the key or any of its value entries is modified."

That single sentence bounds every temporal claim built on the registry. The stamp belongs to the key. If a key holds twelve values and one of them changes, the key's timestamp moves and the other eleven look, from the timestamp alone, exactly as though they had been written at that instant. There is no per-value time. There is no creation time. There is no history of prior values in the live hive, only the current state plus whatever unallocated hive space happens to still hold.

Three consequences follow, and each is the kind of thing that gets an analysis taken apart under questioning.

First, a last-write time is an upper bound on the age of the value you care about, not the time it was set. The value could be older than the stamp by any margin.

Second, ordinary system activity restamps keys. Windows writes to its own configuration constantly, so a key's time may record an operating system housekeeping write rather than any human action.

Third, the field is writable in the sense that matters: anything that modifies a value moves it forward, and hive files can be edited offline. A last-write time is not [[cs/security/cryptographic-hash-functions|a tamper-evident record]], which is why registry-derived times belong in [[cs/forensics/timestamps-macb-and-timeline-analysis|a timeline]] alongside independently sourced times rather than as the sole anchor for a sequence of events.

> [!warning] Scope
> This note is about what the artifact supports, not about how to parse it. The hive file format, the on-disk cell structure, and the recovery of deleted keys from hive slack are separate problems with their own tooling, and none of them changes the fact that the only time the platform documents for a key is the key-level last write.

## Reading it as a record of intent

The registry is best treated as a snapshot of configured intent with weak timing, and the correction for weak timing is corroboration. A Run key naming a binary is a statement that the binary was configured to launch. The Windows event log records whether a process by that name actually started, and [[cs/forensics/windows-event-logs-and-user-activity|those records carry per-event times]]. The file system records when the binary arrived. Three artifacts with different failure modes, agreeing, is an argument. One key with one timestamp is a lead.

That posture is the section's thesis in miniature. Registry parsing is easy and the tools are mature. The hard part is stating exactly what the artifact supports, in language that survives someone whose job is to find the gap between the artifact and the conclusion.

## Related Notes

- [[cs/forensics/windows-event-logs-and-user-activity|Windows Event Logs and User Activity]] for the per-event timing that registry keys lack.
- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] for how a coarse registry time is placed among better-sourced ones.
- [[cs/forensics/ntfs-artifacts-and-the-mft|NTFS Artifacts and the MFT]] because hives are ordinary files and are recovered as files.
- [[cs/forensics/memory-analysis-and-process-reconstruction|Memory Analysis and Process Reconstruction]] for pulling a loaded hive that a live disk copy cannot reach.
- [[cs/security/the-cyber-kill-chain-and-mitre-attack|The Cyber Kill Chain and MITRE ATT&CK]] for the named persistence behaviors these keys evidence.
- [[cs/forensics/anti-forensics-and-what-it-defeats|Anti-Forensics and What It Defeats]] because a last-write time is trivially moved and never proves absence.

## Sources

- <https://learn.microsoft.com/en-us/windows/win32/sysinfo/registry-hives> for the definition of a hive, the per-user profile hive, and the location of the supporting files.
- <https://learn.microsoft.com/en-us/windows/win32/setupapi/run-and-runonce-registry-keys> for Run and RunOnce semantics, the four keys, the command-line length limit, and the indeterminate execution order.
- <https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryinfokeya> for the documented meaning of a key last-write time.
