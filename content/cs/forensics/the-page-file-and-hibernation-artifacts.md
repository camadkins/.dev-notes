---
title: The Page File and Hibernation Artifacts
description: "Paging and hibernation write volatile state to non-volatile storage as a side effect of memory management and power management, which makes a disk image carry fragments of RAM that outlive the power cycle, with consequences for both acquisition and privacy."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-30
updated:
aliases: []
---

The clean division between volatile and non-volatile evidence is a teaching device. Two mechanisms present in every general-purpose operating system violate it constantly, and both do so for reasons that have nothing to do with forensics: memory management writes RAM to disk to reclaim physical pages, and power management writes RAM to disk to survive a power loss.

The result is that a machine which has been powered off for a week can still yield process memory.

> [!note] The idea
> Paging and hibernation are **transfers of state across the volatility boundary**, performed by the system for its own reasons and recorded on the medium an examiner is guaranteed to get. This cuts both ways. It hands the analyst content that survived power-off, and it means a user's most sensitive in-memory data can persist on disk indefinitely without that user ever having saved a file.

## The page file

Microsoft's description is compact. A page file, also known as a paging file, is an optional, hidden system file on a hard disk. Its primary functionality is a physical extension of RAM: page files enable the system to remove infrequently accessed modified pages from [[cs/systems/virtual-memory|physical memory]] to let the system use physical memory more efficiently for more frequently accessed pages.

The words "infrequently accessed modified pages" are the forensic specification. What gets written out is data a process wrote and then stopped touching. That is a selection bias with a useful direction: it favors data that was created and set aside rather than data still in active use. NIST's inventory of non-volatile data sources makes the consequence explicit. Most operating systems use swap files in conjunction with RAM to provide temporary storage, allowing pages to be swapped in and out of RAM, and swap files may contain a broad range of operating system and application information, such as usernames, password hashes, and contact information.

The page file also has a second job that governs its size. Microsoft states that page files can be used to back system crash dumps and extend how much system-committed memory a system can support, and that the reason to configure page file size has always been about supporting a system crash dump, if necessary, or extending the system commit limit. The system commit memory limit is the sum of physical memory and all page files combined. On a machine with large physical memory a page file might not be required to support the commit charge during peak usage, but a page file or a dedicated dump file might still be required to back a system crash dump.

That is why the page file has not disappeared on machines with abundant RAM, and it is also why size alone tells an examiner little. A system-managed page file grows automatically up to three times physical memory or 4 GB, whichever is larger, but no more than one-eighth of the volume size, when the commit charge reaches 90 percent of the commit limit.

## Hibernation

Hibernation is the more dramatic case, because it writes essentially all of memory rather than a selection.

In the S4 hibernate transition, the system saves the contents of volatile memory to a hibernation file to preserve system state, and Microsoft describes it as writing all the contents of memory to a file on the primary system drive, the hibernation file, preserving the state of the operating system, applications, and devices. In the case where the combined memory footprint consumes all of physical memory, the hibernation file must be large enough to ensure there is space to save all the contents of physical memory. On resume, system memory is decompressed and restored from the hibernation file, the contents of memory and all architectural registers are restored, and the system returns to the exact state it was in when it was hibernated.

Compression matters to a parser, and so does knowing which of several producers wrote the file. Fast startup is a type of shutdown that uses a hibernation file to speed up the subsequent boot, during which the user is logged off before the hibernation file is created, allowing for a smaller hibernation file. Hybrid sleep is a combination state in which a system uses a hibernation file with the S1 through S3 sleep states, writing a hibernation file but entering a higher-powered sleep state so that if power is lost while sleeping the system wakes from hibernation instead of losing state.

An examiner therefore cannot read the presence of a hibernation file as evidence of a deliberate hibernate. It may be the residue of a fast-startup shutdown, in which case the user session was already torn down, or of a hybrid sleep, in which case the machine may never have used the file at all. Microsoft draws the distinction cleanly: during a full shutdown and boot the entire user session is torn down and restarted on the next boot, whereas during a hibernation the user session is closed and the user state is saved.

## What this means for acquisition

The practical payoff is that these files reconstitute part of an unavailable RAM image. Volatility makes the composition explicit at the layer level: a raw memory image in the LiME file format and a page file can be combined to form a single Intel virtual memory layer, so that an address translating to an evicted page is directed towards the swap layer rather than the memory layer. Without the page file, [[cs/forensics/memory-analysis-and-process-reconstruction|process reconstruction]] silently loses every page that had been evicted, and the loss looks like absence rather than error.

NIST also lists dump files as a distinct source: some operating systems can store the contents of memory automatically during an error condition, and the file that holds those stored memory contents is a dump file. A crash dump is an unplanned memory capture taken by the system itself, at a moment nobody chose, with none of the acquisition problems that live [[cs/forensics/memory-acquisition|memory acquisition]] introduces. When one exists on the timeline of interest, it is often the highest-quality memory evidence available.

## What this means for privacy

Everything above describes a mechanism that writes a user's memory to persistent storage without the user's involvement, knowledge, or consent, and with no user-visible record that it happened. The categories NIST names for swap file contents are the categories that matter: usernames, password hashes, and contact information. Keys held in memory by an application that never writes them to disk can end up in the page file. A document composed and never saved can end up in a hibernation file.

This is the reason full-volume encryption is a materially different privacy control from file-level encryption: the protection has to cover regions no application ever chose to write. It also means that the [[cs/law/riley-carpenter-and-the-fourth-amendment-online|scope of a search]] of a hard drive is broader than a plain reading of "files on the disk" suggests, because these files are not files anyone created.

> [!warning] Do not assume the artifacts are there
> Page files can be disabled or relocated, hibernation can be turned off, and both files are commonly excluded from logical backups and from some imaging presets because they are large and change constantly. Their absence is a configuration fact to be established and reported, not evidence that the system had nothing to hide.

## Related Notes

- [[cs/forensics/memory-acquisition|Memory Acquisition]] covers the live capture these artifacts partially substitute for.
- [[cs/forensics/memory-analysis-and-process-reconstruction|Memory Analysis and Process Reconstruction]] is where a page file is composed with an image to resolve evicted pages.
- [[cs/forensics/deleted-files-journaling-and-what-survives|Deleted Files, Journaling, and What Survives]] governs how long an old page file's contents persist after it is resized or replaced.
- [[cs/systems/context-switching|Context Switching]] is the surrounding machinery that makes a process resumable, which is what a hibernation file preserves for the whole system.
- [[cs/systems/page-replacement-algorithms|Page Replacement Algorithms]] decide which pages are written out, and therefore what an examiner finds.
- [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Riley, Carpenter, and the Fourth Amendment Online]] is where the scope question about unintended persistence gets decided.

## Sources

- [Introduction to page files, Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/introduction-to-the-page-file) backs the definition of a page file, its role as a physical extension of RAM, crash dump support, the system commit limit, and system-managed growth behavior.
- [System power states, Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/power/system-power-states) backs the S4 hibernate description, the hibernation file contents and sizing, the resume sequence, and the fast startup and hybrid sleep variants.
- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the swap file, dump file, and hibernation file entries in its inventory of non-volatile data sources.
- [Volatility 3 Basics](https://volatility3.readthedocs.io/en/latest/basics.html) backs the composition of a memory image with a page file into a single virtual memory layer.
