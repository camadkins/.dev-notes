---
title: Disk Imaging Formats and Hashing
description: "Raw, E01, and AFF4 differ in what they can say about the bytes they do not have, and an image hash proves only that the container's payload has not changed since somebody hashed it."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-25
updated:
aliases:
  - E01
  - EWF
  - AFF4
---

An image is a file that claims to be a disk. The claim has two parts, and only one of them is about the bytes. The first part is "these are the sectors." The second part is "and here is everything that happened while I read them." Raw images can make the first claim and cannot make the second. The forensic container formats exist entirely for the second.

> [!note] The idea
> The interesting content of a forensic image format is its **vocabulary for absence**. Every real acquisition encounters regions it could not read, chose not to read, or read only after retries. A raw image has no way to say so; a bad sector and a legitimately zeroed sector are the same 512 bytes of nothing. E01 records read errors in a side section while filling the image with zeros, and AFF4 makes an unstored region a first-class object in a virtual address space. That difference is what survives cross-examination, because a hash cannot distinguish a faithful zero from a fabricated one.

## Raw

A raw image is the sector stream and nothing else, which is what a bit-to-bit copy program such as dd produces. NIST describes the operation rather than the format: bit stream imaging generates a bit-for-bit copy of the original media, including free space and slack space, and requires more storage and more time than a logical backup, which copies only the directories and files of a logical volume and does not capture deleted files or residual data in [[cs/forensics/file-carving-and-unallocated-space|slack space]].

Raw's virtue is that every tool on earth can read it, including tools that know nothing about forensics. Its defect is that it carries no metadata at all. The acquisition date, the tool version, the drive serial, the digest, and the read errors all have to live somewhere else, usually in a sidecar text file whose association with the image is a filename convention. That association is exactly the sort of thing an opposing expert enjoys.

## E01 and the Expert Witness format

EWF, the Expert Witness Compression Format, stores media images and can hold disk and partition images either compressed or uncompressed. A single image may be spread across one or more segment files, each consisting of a standard header followed by multiple sections arranged back to back, with the constraint that a single section cannot span multiple files. Segments are numbered by extension: the first has the extension .E01, the next .E02, and the naming rolls over into three-letter forms once the numeric space is exhausted.

The chunking is where the design shows. A chunk is defined as the sector size, 512 bytes by default, multiplied by the number of sectors per chunk, 64 by default. Compression is applied per chunk, which keeps the image randomly accessible: a tool can decompress one 32 KiB region rather than the whole file. The price is a per-chunk index, and EnCase historically capped a segment file at 2000 MiB because the chunk offset is a 32-bit value whose most significant bit is used as a compression flag. In EnCase 6.7 a base offset was added to the table to allow segment files greater than 2048 MiB.

Integrity lives in dedicated sections. The hash section contains an MD5 hash of the data within the chunks, is optional, and resides in the last segment file before the done section. Later versions added a digest section, found in EnCase 6.12 and later, which carries an MD5 and/or SHA1 hash of the data within the chunks. Both sections end with an Adler-32 checksum over the section's own data, so the container protects its own metadata separately from protecting the payload.

Then there is the section that makes the format honest. The error2 section contains the sectors that have read errors, and it is only added to the last segment file when errors were encountered while reading the input. The specification then states the consequence plainly: the sectors where a read error occurred are filled with zeros during acquisition by EnCase.

Sit with that. The image contains zeros where the drive contained something unknown. The image hash covers those zeros. The hash therefore certifies a substitution, and the only record that a substitution happened is a separate section that a lazy tool may not display. An examiner who reports "the image hash verifies" without reading the error2 section has verified the wrong proposition.

## AFF4

AFF4 approaches the same problems by making the image a small database instead of a file layout. Its specification describes it as a next-generation forensic container format supporting storage virtualisation, arbitrary metadata storage, extensible compression and hashing schemes, and throughput scalable to high IO rates.

The container is generally a single ZIP64 based file or a folder. Arbitrary metadata is stored using an RDF data model within the container, in a file called information.turtle, which means the acquisition metadata that a raw image has to keep in a sidecar lives inside the evidence object and is queryable. Image content is stored through two abstractions: the Map, a virtual address space, and the Image Stream, a seekable contiguous sequence of fixed-size data blocks that may be compressed.

The Map is the piece that answers EWF's error2 problem from the other direction. Because the address space is virtual, a region of the image does not have to correspond to stored bytes at all, and the specification notes that various virtual streams exist for representing common block sequences such as sparse, all zero, streams. An AFF4 image can therefore say "this range is a described stream" rather than "here are the zeros I wrote for you," which keeps the distinction between recorded content and generated content inside the format instead of in a section a tool may skip.

The standard is also candid about its own authority: where there is ambiguity or difference between what is stated in the document and the reference images, the reference images take precedence. That is an unusual clause, and a useful one, because it names which artifact settles a dispute about the format.

## What a hash of an image proves

AFF4 states the general principle: the primary difference between a forensic image and a regular image is the inclusion of integrity verification by way of the use of cryptographic hashes. It offers two methods. Linear bitstream hashing computes a [[cs/security/cryptographic-hash-functions|digest]] over the byte stream, with datatypes defined for MD5, SHA1, SHA256, SHA512, and Blake2b. Block map hashing is a hybrid involving block hashing of data blocks and Merkle-tree-like generation of a single hash protecting both the Image Stream and the Map, with per-chunk hashes stored in block hash segments named after the algorithm, such as 00000000.sha1 for a bevy segment named 00000000.

The block-map approach buys locality. A single mismatched block is identified as one mismatched block rather than invalidating the whole image, the same property [[cs/security/certificate-transparency|Merkle-tree logs]] use to prove membership without shipping the log.

Now the negative space, which is the part that matters in a report. An image hash proves that the payload has not changed between two computations of the digest. It does not prove that the image corresponds to any physical drive; that link is made by [[cs/forensics/chain-of-custody|custody documentation]] and by the post-acquisition rehash of the original described in [[cs/forensics/acquisition-write-blockers-and-verification|acquisition verification]]. It does not prove the acquisition was complete, since an image that stopped early hashes perfectly. And, as the error2 section shows, it does not prove that every byte under the digest came off the platter.

> [!warning] Format choice is a disclosure decision
> Choosing raw is choosing to carry the acquisition metadata somewhere the image cannot authenticate. Choosing a container is choosing a parser dependency that a future examiner must still have. Neither is wrong. What is wrong is choosing one and reporting as though you had chosen the other.

## Related Notes

- [[cs/forensics/acquisition-write-blockers-and-verification|Acquisition, Write Blockers, and Verification]] covers the three-digest procedure that turns a hash into evidence about a drive.
- [[cs/forensics/file-carving-and-unallocated-space|File Carving and Unallocated Space]] is the reason bit stream imaging is worth its cost over a logical backup.
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] explain what collision resistance buys and when MD5's failure actually matters here.
- [[cs/security/certificate-transparency|Certificate Transparency]] uses the same Merkle construction for a different adversary.
- [[cs/dsa/huffman-coding|Huffman Coding]] underlies the per-chunk compression that makes a container smaller than the disk.
- [[cs/systems/file-systems|File Systems]] define the structures that a bit stream image preserves and a logical backup discards.

## Sources

- [EWF specification, libyal project](https://raw.githubusercontent.com/libyal/libewf/main/documentation/Expert%20Witness%20Compression%20Format%20%28EWF%29.asciidoc) backs the segment file and section layout, the chunk definition, the segment size limit, the hash and digest sections, and the error2 zero-fill behavior.
- [AFF4 Standard v1.0a](https://raw.githubusercontent.com/aff4/Standard/master/inprogress/AFF4StandardSpecification-v1.0a.md) backs the container model, the RDF metadata file, the Map and Image Stream abstractions, the virtual streams for sparse ranges, the precedence of the reference images, and both hashing methods.
- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the contrast between bit stream imaging and logical backup.
