---
title: Timestamps, MACB, and Timeline Analysis
description: "The four timestamp classes are not four readings of one clock; they live in different structures, update under different rules, and carry different resolutions, which is why a timeline is an argument built from corroboration rather than a record read off a disk."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-09
updated:
aliases:
  - MACB
---

The shorthand MACB collects four classes of file timestamp: modified, accessed, changed in the metadata sense, and born. The acronym is convenient and it hides the thing that matters. These are not four columns of one table. They are values written by different code paths, into different structures, at different resolutions, with different update policies, and in at least one common case into two structures at once.

> [!note] The idea
> A timestamp is a **record of an operation the operating system chose to record**, not a measurement of an event. Each class has its own update rule, and the rules include deliberate suppression for performance. A timeline is therefore built the way a case is built, from independent sources that agree, and its strength comes from corroboration across artifact types rather than from the precision of any single field.

## What the value is

On Windows the underlying representation is a FILETIME: a 64-bit value representing the number of 100-nanosecond intervals that have elapsed since 12:00 A.M. January 1, 1601 Coordinated Universal Time. The system records file times when applications create, access, and write to files.

The 100-nanosecond unit is a trap for the unwary, because resolution of representation is not resolution of recording. Microsoft is explicit that not all file systems record creation and last access times, and not all record them in the same manner. On FAT, the resolution of create time is 10 milliseconds, write time has a resolution of 2 seconds, and access time has a resolution of one day, so it is really the access date. A timeline that displays FAT access times to the second is displaying precision that was never in the data.

Time zone handling differs by filesystem as well. NTFS stores time values in UTC, so they are not affected by changes in time zone or daylight saving time, while FAT stores time values based on the local time of the computer. Correlating an NTFS artifact with a FAT artifact therefore requires knowing where the FAT volume's clock thought it was, which is the same recorded-drift problem that [[cs/forensics/the-order-of-volatility|volatile collection]] insists on capturing while the machine is still running.

## The update rules are the interesting part

Three documented behaviors do more damage to naive readings than anything else.

First, access times are lazy. The NTFS file system delays updates to the last access time for a file by up to 1 hour after the last access. An access time that appears to be an hour stale is not evidence of anything; it is the documented behavior. Any argument of the form "the file was opened at exactly this moment" that rests on a last access time is arguing against the specification.

Second, write times lag their own operation. When writing to a file, the last write time is not fully updated until all handles that are used for writing are closed. A process that holds a file open for hours produces a modification timestamp clustered at close time rather than distributed across the writes. For log files, database files, and anything an application keeps open, the modification time approximates session end rather than content change.

Third, and this is the one that turns timestamps into a contested artifact rather than a neutral one, the values are writable. SetFileTime lets a caller modify creation, last access, and last write times without changing the content of the file. Timestamp manipulation requires no exotic capability. It is a documented API.

## Two sets on NTFS

That last fact is what makes the duplication in NTFS valuable. Both $STANDARD_INFORMATION and $FILE_NAME are resident attributes in the [[cs/forensics/ntfs-artifacts-and-the-mft|MFT record]], and both carry four FILETIME values: creation, last modification, MFT entry last modification, and last access.

Four values, two copies, one file. The pair exists because the file name attribute maintains its own view of the file for indexing purposes, and the practical consequence for an examiner is redundancy across independent write paths. Where the sets disagree, something updated one and not the other, and that disagreement is itself an artifact worth reporting even when its cause is ambiguous.

The MFT entry last modification value is the fourth class that people forget. It tracks changes to the record rather than to the content, which is what makes a permission change, a rename, or an attribute edit visible when the modification time has not moved.

## Building a timeline

A filesystem timeline uses one artifact type. That is useful and thin. The technique that dominates practice widens the input set: extract every timestamped event from every artifact on the image, normalize them into one ordering, and analyze the merged sequence. The resulting artifact is usually called a super timeline.

Plaso implements this, and its tool decomposition shows the shape of the work. log2timeline is a command line tool to extract events from individual files, recursing a directory such as a mount point, or from a storage media image or device. It creates a plaso storage file which can be analyzed with the pinfo and psort tools, and that storage file contains the extracted events and various metadata about the collection process alongside information collected from the source data. It may also contain information about tags applied to events and reports from analysis plugins. psort then post-processes the storage file, allowing you to filter, sort, and run automatic analysis on its contents.

Two design choices in that pipeline are worth naming. Extraction and analysis are separate stages with a persisted intermediate, which means the expensive parse happens once and the analyst iterates on filters against a stable corpus. And the storage file carries metadata about the collection process itself, so the timeline records how it was built, which is the difference between an artifact that can be defended and a spreadsheet.

The output volume is the practical problem. A single disk yields millions of events, most of them background noise from the operating system doing its job. The analytical value comes from filtering to a window and then looking for co-occurrence across artifact classes: a filesystem event, an application record, and a log entry that agree within a few seconds are worth far more than any of them alone, because manipulating one is easy and manipulating three consistently is not.

> [!warning] Ordering is not causation, and clocks are not synchronized
> Two events adjacent in a merged timeline may come from machines whose clocks differed by minutes, or from artifact types whose resolutions differ by a factor of a thousand. Cross-host reasoning needs the recorded offsets, which is why [[cs/military-computing/ntp-distributed-clock-synchronization|clock synchronization]] state is part of the collection record. Where wall time cannot be trusted at all, only ordering survives, and ordering alone is what [[cs/systems/logical-clocks-lamport-and-vector|logical clocks]] were invented to formalize.

## Related Notes

- [[cs/forensics/ntfs-artifacts-and-the-mft|NTFS Artifacts and the MFT]] is where the two timestamp sets physically live.
- [[cs/forensics/the-order-of-volatility|The Order of Volatility]] explains why clock drift has to be captured during collection or not at all.
- [[cs/forensics/anti-forensics-and-what-it-defeats|Anti-Forensics and What It Defeats]] covers deliberate timestamp manipulation and what it fails to reach.
- [[cs/military-computing/ntp-distributed-clock-synchronization|NTP and Distributed Clock Synchronization]] is the mechanism that makes cross-host timestamps comparable when it is working.
- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks]] show what remains provable when wall-clock time is unavailable.
- [[cs/standards/ieee-1588-precision-time-protocol|IEEE 1588 and PTP]] is what time distribution looks like when the tolerance is sub-microsecond rather than sub-hour.

## Sources

- [File Times, Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/sysinfo/file-times) backs the FILETIME representation and epoch, the FAT and NTFS resolution and time zone differences, the one-hour last access delay, the write-handle closing rule, and SetFileTime.
- [New Technologies File System (NTFS) format specification, libyal project](https://raw.githubusercontent.com/libyal/libfsntfs/main/documentation/New%20Technologies%20File%20System%20%28NTFS%29.asciidoc) backs the four FILETIME values carried by both $STANDARD_INFORMATION and $FILE_NAME.
- [Plaso (log2timeline) User's Guide](https://plaso.readthedocs.io/en/latest/sources/user/Users-Guide.html) backs the description of log2timeline, the plaso storage file and its collection metadata, and the role of psort.
