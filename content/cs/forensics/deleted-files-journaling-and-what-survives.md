---
title: Deleted Files, Journaling, and What Survives
description: "Deletion on a rotating disk was an accounting change that left the content intact by accident, the change journal records that the deletion happened even when the file is gone, and discard turned an accounting change into an instruction the examiner cannot observe."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-15
updated:
aliases:
  - TRIM
---

Recovering deleted files is the most familiar thing forensics does and the least well understood. The reason it works has never been that anything preserves the data. It is that nothing bothered to destroy it.

> [!note] The idea
> Classic deletion is a **free-list update**, so the survival of content is a side effect of laziness in the allocator rather than a property of the filesystem. That makes recoverability a race, not a guarantee. Two things change the picture in opposite directions: a change journal records the fact of the deletion even after the file itself is unrecoverable, and a discard command converts deletion from a passive accounting change into an active notification to hardware whose subsequent behavior the examiner cannot see.

## What deletion actually does

NIST states the mechanism without ceremony. After a file is deleted, the operating system considers the region to be free space and can overwrite any portion of or the entire deleted file at any time.

Notice what is absent from that sentence: any commitment about when. The clusters are returned to the pool. The next allocation may take one of them, all of them, or none. This is the same arrangement as a [[cs/systems/memory-allocators-and-fragmentation|heap allocator]] returning a block to a free list, and it has the same consequence for the contents: the old bytes stay until the allocator hands the region to a new owner who writes over them. A machine that sits idle after a deletion preserves the file indefinitely; a machine under write pressure can destroy it in seconds. Nothing about the filesystem distinguishes these cases, which is why "the file was deleted three months ago, so it is gone" is a claim about workload rather than about storage.

The metadata is a separate question with a separate answer. On NTFS, deletion clears an in-use flag in the [[cs/forensics/ntfs-artifacts-and-the-mft|MFT record]] and leaves the record populated, so the name, timestamps, size, and parent reference remain until the record is reused. Content and metadata therefore decay on independent schedules, and an examiner routinely recovers one without the other. A file record with no recoverable content still proves the file existed, was called what it was called, and was created when it was created. That is often the entire finding.

## What the journal records

Journaling exists for crash consistency, not for investigators, and the artifacts it leaves are a byproduct. NTFS carries two relevant structures, and the one built for change tracking is the more useful.

Microsoft explains the change journal by explaining the alternatives it replaces. A program that needs to know what changed on a volume can scan the whole volume, which is often not acceptable because of the decrease in system performance it would cause, or it can register a directory notification, which is more efficient but requires that an application be running at all times. To avoid these disadvantages, the NTFS file system maintains an update sequence number change journal. When any change is made to a file or directory in a volume, the USN change journal for that volume is updated with a description of the change and the name of the file or directory. As files, directories, and other NTFS objects are added, deleted, and modified, NTFS enters change journal records in streams, one for each volume.

Read that as an evidence source and it is remarkable. The journal is a persistent, on-volume record of file system events including deletions, containing names, carried in a structure whose whole purpose is to be cheap to append to and cheap to read back. It survives the file. An examiner working a volume where the content is long overwritten can still find a record saying that a file with a given name was deleted, which is a different and sometimes stronger fact than possessing the file.

Its limits matter as much. Administrators can create, delete, and re-create change journals, and each journal is associated with an unsigned 64-bit identifier, which means a journal can be discontinuous and a discontinuity is visible. The journal is also finite and wraps. It is a window, not an archive, and the window's length is a function of how busy the volume is.

The write-ahead journal that protects metadata consistency is the other structure. Its function is atomicity across a crash, the same problem [[cs/systems/two-phase-commit-and-distributed-transactions|two-phase commit]] solves for distributed writes, and its forensic value comes from the fact that it holds recent metadata updates in a second location. Both structures record metadata history. Neither is designed to record content.

## What discard changed

Everything above assumes the storage device is passive: the filesystem stops referencing a region and the region keeps its bits until someone writes new ones. That assumption is a property of [[cs/history/magnetic-disk-storage|magnetic disk storage]], where overwriting in place is how writing works.

Flash does not work that way, and the software stack grew an explicit notification to compensate. The Linux tool is described in one line: fstrim is used on a mounted filesystem to discard, or trim, blocks which are not in use by the filesystem, and this is useful for solid-state drives and thinly-provisioned storage. By default, fstrim will discard all unused blocks in the filesystem. The same behavior is available continuously through the discard mount option, though the manual warns that running fstrim frequently, or even using mount with discard, might negatively affect the lifetime of poor-quality SSD devices, and suggests that for most desktop and server systems a sufficient trimming frequency is once a week.

That last detail is the forensically interesting one, because it means the timing of discard is a configuration choice rather than a property of deletion. On a system trimming continuously, unallocated regions are announced as unused the moment a file is deleted. On a system trimming weekly, there is a window. On a filesystem or device that does not support the operation, the classic model still holds, and the manual notes that errors from filesystems that do not support the discard operation, read-only devices, and read-only filesystems are silently ignored.

The examiner's problem is that discard is a message, not a write. The filesystem tells the device those blocks are no longer in use. What the device does next is firmware behavior that the operating system does not observe and the image does not record. The clean statement of the change is this: on rotating media, whether deleted content survived was decided by the operating system's allocator, and the evidence of that decision was on the disk. After discard, part of the decision moved into a device the examiner can only query through the same interface that has already been told the data is garbage.

> [!warning] Do not overclaim in either direction
> "It was an SSD, so nothing is recoverable" is as unsupported as "it was deleted, so it must still be there." Discard support, trim scheduling, filesystem support, and device behavior are all variables. The defensible position is to determine and report which of them applied, and to treat absence of recovered content as absence of evidence rather than as evidence of destruction.

## Related Notes

- [[cs/forensics/ntfs-artifacts-and-the-mft|NTFS Artifacts and the MFT]] explains the record that survives with its in-use flag cleared.
- [[cs/forensics/file-carving-and-unallocated-space|File Carving and Unallocated Space]] is what you do once the metadata is gone but the clusters are not.
- [[cs/forensics/anti-forensics-and-what-it-defeats|Anti-Forensics and What It Defeats]] covers deliberate destruction, which is a different problem from incidental reuse.
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] is the same free-list behavior in RAM, and the closest available intuition for why recoverability is a race.
- [[cs/systems/two-phase-commit-and-distributed-transactions|Two-Phase Commit]] is the atomicity problem a write-ahead journal solves on one machine.
- [[cs/history/magnetic-disk-storage|Magnetic Disk Storage]] is the medium whose overwrite-in-place behavior made classic recovery possible in the first place.

## Sources

- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the statement that a deleted file becomes free space and may be overwritten at any time.
- [Change Journals, Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/fileio/change-journals) backs the rationale for the USN change journal, what it records on every change, the per-volume record streams, the 64-bit journal identifier, and administrative deletion and re-creation of journals.
- [fstrim(8), Linux manual page](https://man7.org/linux/man-pages/man8/fstrim.8.html) backs the definition of discard, the default behavior, the frequency guidance, and the silent handling of devices and filesystems without discard support.
