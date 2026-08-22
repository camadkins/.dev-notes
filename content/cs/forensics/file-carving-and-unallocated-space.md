---
title: File Carving and Unallocated Space
description: "Carving reconstructs files from content when the metadata that pointed to them is gone, which turns recovery into a search problem over an enormous candidate space and makes validation, not detection, the expensive half."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-06-21
updated:
aliases:
  - File Carving
  - Data Carving
  - Unallocated Space
---

Deleting a file usually destroys the pointer, not the payload. The directory entry or the [[cs/forensics/ntfs-artifacts-and-the-mft|MFT record]] is marked free, and the clusters holding the content sit untouched until something claims them. At that moment the content still exists and nothing on the volume says where it starts or how long it is. Carving is what you do about that.

> [!note] The idea
> Carving is a **search problem with a validator**, not a pattern-matching problem, and the validator is the expensive component. Recognizing a plausible file header is trivial and nearly worthless, because a header tells you where something might begin and says nothing about where it ends or whether the bytes in between belong to it. What makes a carved object evidence is a decision procedure that can accept or reject a candidate byte range, and the quality of the carve is bounded by the quality of that procedure.

## The territory being searched

NIST distinguishes the regions a bit stream image preserves and a logical backup does not. Slack space arises because filesystems use file allocation units: even if a file requires less space than the allocation unit, the entire unit is reserved, so a 7 KB file in a 32 KB allocation unit leaves 25 KB of unused space that may hold residual data such as portions of deleted files. Free space is the area on media not allocated to any partition, including unallocated clusters or blocks, often covering space where files and even entire volumes once resided.

NIST is also blunt about the guarantee that deletion provides, which is none. When a file is deleted the operating system considers the region to be free space and can overwrite any portion of or the entire deleted file at any time. There is no countdown and no reservation. The window is a race against allocation pressure.

## What carving is

Garfinkel's 2007 DFRWS paper opens with the definition the field uses. File carving reconstructs files based on their content, rather than using metadata that points to the content. It serves both data recovery and forensics: for recovery it can pull files off a disk whose directory or Master File Table sectors are no longer readable, and in forensic practice it recovers files that have been deleted and have had their directory entries reallocated to other files, but whose data sectors have not yet been overwritten.

The paper decomposes the work into three activities. The files to be carved must be recognized in the disk image. Some process must establish if the files are intact or not. And the files must be copied out and presented to the examiner in a manner that makes sense. The first two require specific, in-depth knowledge for each file type. That is the real cost of carving: it is per-format engineering, not a general algorithm.

Header and footer carving is the simple realization. Scan for a known start signature, scan forward for the matching end signature, extract everything between. It works because many formats are self-delimiting and it fails for every format that is not, for every file whose footer was overwritten, and for every case where the bytes between the two signatures do not belong together.

## Why validation dominates

The paper frames carving as a multi-tier decision problem that seeks to quickly validate or discard candidate byte strings, called objects, from the media being carved. Object validation is described as a decision problem in which the validator attempts to determine if a sequence of bytes is a valid file, meaning that a target program can open the file and display sensible information without generating an error.

The scale argument is worth following because it explains why carvers are built the way they are. A disk with n bytes has n(n+1)/2 possible substrings, so a 200 GB drive would require on the order of 10^22 different validations if you tried them all. Two constraints collapse that. If sequences can only start on sector boundaries, then 511 of every 512 candidate starting positions can be skipped, eliminating 99.8% of the strings. And if the validator tolerates trailing data after a valid object, the carver can test byte sequences that start on a sector boundary and run to the end of the image, then use a [[cs/dsa/binary-search|binary search]] to find the minimum number of bytes necessary for validation. Both assumptions hold for contiguous JPEGs on FAT and NTFS, because both allocate at sector boundaries and the JPEG decompressor can recognize the end of a file.

That is a [[cs/math/combinatorics|combinatorial]] problem being beaten by two structural facts about how filesystems allocate. It is also why carving quality varies so sharply by format: a format with a strong validator and sector-aligned starts is cheap to carve, and a format with neither is close to hopeless.

## The failure mode that matters

Garfinkel names the limitation directly: most carving programs can only carve data files that are contiguous, extracting sequential ranges of bytes from the image, and carvers that do not perform extensive validation present the examiner with many false positives, files the carver reports as intact but which contain invalid data and cannot be displayed.

The paper's survey of more than 300 active file systems from drives acquired on the secondary market between 1998 and 2006 puts a number on how often that limitation bites. Overall 125,659 files, 6% of those recovered from the corpus, were fragmented. Read alone, that sounds like a solved problem.

It is not, because the base rate is the wrong statistic. The authors argue that the fragmentation patterns observed on those drives are representative of patterns found in drives of forensic interest, and their volume-size analysis concludes that fragmentation does appear to go down as drive size increases, but that many large drives have significant amounts of fragmentation, and this fragmentation may affect files of critical interest to forensic investigators. The single worst drive in the corpus had 43% of its JPEGs fragmented. A capability that fails on 6% of files in general can fail on nearly half of the files in the one case you are working.

Fragmentation also breaks header and footer carving in a specific and diagnosable way. If a region of sectors begins with a valid header and ends with a valid footer but does not validate, one possibility is that the file was fragmented into two or more pieces and that the header and footer reside in different fragments. The paper uses the phrase fragment recovery carving for any method in which two or more fragments are reassembled to form the original file, and treats the two-fragment case, bifragment gap carving, as the tractable one. The abstract states the state of the art plainly for its time: carving is widely used for forensics and data recovery, and no file carvers can automatically reassemble fragmented files.

> [!warning] What a carved file does not carry
> A carved object has no filename, no path, no timestamps, no owner, and no allocation history, because all of that lived in the metadata that carving exists to work around. It is bytes plus an offset. Attribution of a carved file to a user or an event has to come from the content itself or from a separate artifact, and an examiner who reports a carved document as though it had been "found in a user's Documents folder" has asserted something the technique cannot support.

## Related Notes

- [[cs/forensics/ntfs-artifacts-and-the-mft|NTFS Artifacts and the MFT]] explains why small files are recoverable without carving at all.
- [[cs/forensics/deleted-files-journaling-and-what-survives|Deleted Files, Journaling, and What Survives]] covers the allocation race that decides whether carving finds anything.
- [[cs/forensics/disk-imaging-formats-and-hashing|Disk Imaging Formats and Hashing]] is why the unallocated regions are in the image in the first place.
- [[cs/dsa/binary-search|Binary Search]] is the trick that makes exhaustive validation of a candidate range affordable.
- [[cs/math/combinatorics|Combinatorics]] gives the substring count that motivates every pruning heuristic in a carver.
- [[cs/systems/file-systems|File Systems]] define the allocation units whose size determines how much slack space exists to search.

## Sources

- [Carving contiguous and fragmented files with fast object validation, Simson Garfinkel, DFRWS 2007](https://simson.net/clips/academic/2007.DFRWS.pdf) backs the definition of carving, the three activities, object validation as a decision problem, the substring counting argument and its two prunings, the contiguity limitation and false positives, and the fragmentation survey results.
- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the definitions of slack space and free space and the statement that a deleted file may be overwritten at any time.
