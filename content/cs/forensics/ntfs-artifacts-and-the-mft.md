---
title: NTFS Artifacts and the MFT
description: "The Master File Table is a record per file that holds metadata and, for small files, the file's entire contents, which makes it the single densest evidence structure on a Windows volume and the one that survives deletion in the most useful way."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-11
updated:
aliases:
  - MFT
---

Most [[cs/systems/file-systems|file system]] structures are indirection: a directory entry points at an inode, the inode points at blocks, the blocks hold the data. NTFS collapses part of that chain. Microsoft's description of the Master File Table is unusually direct about it. There is at least one entry in the MFT for every file on an NTFS volume, including the MFT itself, and all information about a file, including its size, time and date stamps, permissions, and data content, is stored either in MFT entries or in space outside the MFT that is described by MFT entries.

Read the phrase "and data content" carefully. For a sufficiently small file, the file is the metadata record.

> [!note] The idea
> The MFT is the rare artifact that is **both the index and the payload**, and its forensic value comes from that collapse. A single 1 KiB record can carry two independent sets of timestamps, the parent directory reference, the allocation state, a journal sequence number, and, for small files, every byte of the file's contents. Recovering a deleted small file from NTFS can therefore require no data-area recovery at all, because nothing was ever stored in the data area.

## The record

An MFT entry begins with a header whose signature is the ASCII string FILE, or BAAD when the entry is damaged. The header is 42 or 48 bytes and carries the fields an examiner reaches for constantly: a metadata transaction journal sequence number holding a $LogFile Sequence Number, a sequence number, a reference count, an offset to the first attribute, entry flags, the number of bytes of the entry that are in use, and the total entry size.

Two of those are worth pulling out.

The entry flags include MFT_RECORD_IN_USE. Deletion clears it. The record itself is not erased, moved, or scrubbed; a bit changes and the entry becomes available for reuse. Everything else in the record is still sitting there until something else claims the slot.

The sequence number provides the counter that makes reuse detectable. Per Microsoft's documentation as recorded in the libyal format specification, the sequence number is incremented each time that a file record segment is freed, and it is zero if the segment is not used. A file reference in NTFS is an MFT entry index plus that sequence number, which means a stale reference to a recycled entry is identifiable as stale rather than silently resolving to the wrong file. For an examiner this is a small gift: it converts "this pointer is dangling" from a guess into a check.

Then there are the fix-up values, which exist for a reason that has nothing to do with forensics and matters enormously to it. On disk, the last 2 bytes of each 512-byte block within the record are replaced by a fix-up placeholder value, with the original values stored in an array. A reader that finds mismatched placeholders knows the record was torn across a partially completed sector write. Any tool that parses MFT records straight out of a disk image without applying the fix-ups reads two corrupted bytes per sector, which is the kind of quiet defect that [[cs/forensics/tool-validation-and-nist-cftt|tool validation]] exists to catch and a hex viewer will not warn you about.

## Resident and non-resident

Everything in an MFT record after the header is an attribute, and every attribute header carries a non-resident flag, also called the form code. Resident attribute data is present when the flag is clear. Non-resident data lives outside the record, described by data runs.

The critical case is the data stream attribute. Per the format specification, $DATA contains the file data and can be stored as either a resident attribute, for a small amount of data, or a non-resident one. So a short text file, a small script, a registry hive fragment, or a stub written by a dropper may exist entirely inside its own MFT record.

Three forensic consequences follow. Recovery of small deleted files does not depend on the clusters being untouched, only on the record not being reused, which is a different and often much longer window. Carving tools that scan unallocated clusters will never see these files, because their content was never in a cluster. And a copy of the MFT alone, which is a few hundred megabytes on a large volume, is a triage artifact containing real file content and not merely a catalog.

When an entry runs out of room, NTFS spills. The attribute list attribute exists because some attributes could not be stored in the MFT entry due to space limitations, and each entry header carries a base record file reference indicating whether the entry is being used to store additional attributes for another entry. Reconstructing a single file can therefore mean reassembling several records, and a partial MFT recovers partial files.

## Two sets of timestamps

Both $STANDARD_INFORMATION and $FILE_NAME are resident attributes and both carry four FILETIME values: creation, last modification, MFT entry last modification, and last access. The duplication is an accident of design and a gift to examiners, because the two sets are updated by different code paths and tools that manipulate timestamps have historically targeted only one of them. The mechanics of what updates each, and what a mismatch implies, belong to [[cs/forensics/timestamps-macb-and-timeline-analysis|timeline analysis]].

$FILE_NAME also carries the parent file reference, which is how a recovered orphan record can still be placed in a directory tree, and an MFT entry can contain multiple file name attributes, for example a separate long name and short name.

## Named streams

NIST notes that NTFS has long supported multiple data streams for files and directories: each file consists of an unnamed stream used to store the file's primary data, and optionally one or more named streams, written in the form file.txt:Stream1, that can be used to store auxiliary information such as file properties and picture thumbnail data. The guide lists Alternate Data Streams among the ways data can be hidden.

The forensic reading is that file size, as reported by any ordinary directory listing, is a property of the unnamed stream only. A file that appears to be a 12-byte text document can carry a named stream of arbitrary size, which is why ADS shows up repeatedly in [[cs/security/malware-classes|malware]] tradecraft and why an examination that enumerates files rather than attributes will miss it entirely.

## Where the records live

The MFT competes for space with the files it describes. Microsoft describes an MFT zone calculated and reserved by the system when it mounts the volume, based on volume size. If the unreserved space is completely allocated, space for user files and directories will be allocated from the MFT zone, and if the MFT zone is completely allocated, space for new MFT entries will be allocated from the unreserved space. Fragmentation of the MFT starts when one region or the other becomes fully allocated.

That mutual encroachment is why an MFT on a full volume is fragmented and interleaved with file data, and why "the MFT" recovered from a damaged volume is often a set of runs that have to be stitched together rather than one contiguous object.

> [!warning] The MFT is not a log
> A record shows the current state of an entry plus whatever the last writer left in it. It does not record history. The $LogFile sequence number in the header points into a journal that does, and the change journal records what happened to a file over time. Those are covered in [[cs/forensics/deleted-files-journaling-and-what-survives|deletion and journaling]].

## Related Notes

- [[cs/forensics/deleted-files-journaling-and-what-survives|Deleted Files, Journaling, and What Survives]] takes the cleared in-use flag and follows it through to what is actually recoverable.
- [[cs/forensics/file-carving-and-unallocated-space|File Carving and Unallocated Space]] is the technique for everything the MFT can no longer describe.
- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] uses the two timestamp sets this note introduces.
- [[cs/systems/file-systems|File Systems]] give the general model that NTFS specializes, including why most designs separate index from data.
- [[cs/security/malware-classes|Classes of Malware]] covers the tradecraft that named streams and resident data are used for.
- [[cs/systems/io-devices-and-drivers|I/O Devices and Drivers]] explain the partial-sector-write hazard that fix-up values detect.

## Sources

- [Master File Table (Local File Systems), Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/fileio/master-file-table) backs the one-entry-per-file structure, the storage of data content in MFT entries, and the MFT zone allocation behavior.
- [New Technologies File System (NTFS) format specification, libyal project](https://raw.githubusercontent.com/libyal/libfsntfs/main/documentation/New%20Technologies%20File%20System%20%28NTFS%29.asciidoc) backs the entry header fields, the in-use flag, the sequence number semantics, the fix-up values, the resident and non-resident forms, the $DATA and attribute list behavior, and the two timestamp sets.
- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the description of alternate data streams and their use for hiding data.
