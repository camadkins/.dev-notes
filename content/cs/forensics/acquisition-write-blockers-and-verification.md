---
title: Acquisition, Write Blockers, and Verification
description: "Write blocking is an interface-level filter that partitions every command a host can send into modifying and non-modifying categories, and verification exists because the block is a claim about a device you did not build."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-17
updated:
aliases:
  - Write Blocker
  - Hardware Write Blocker
  - HWB
  - Forensic Acquisition
---

Attaching a suspect drive to a running computer is an act of writing. The operating system will mount it, journal-replay it if it is dirty, drop a volume identifier on it, index it if a search service is watching, and update timestamps as it goes. None of that requires a user to touch anything. NIST notes the mundane version of this in a footnote: services or processes running on the system might be writing to a system's hard drive even if no person is currently using the computer.

So acquisition begins with a negative requirement. Not "copy the drive" but "copy the drive while proving nothing traveled the other way."

> [!note] The idea
> A write blocker is a **command classifier sitting on a bus**, and its correctness is a property of a partition rather than of a wire. NIST's specification does not say "block writes." It says every operation an interface can express must fall into exactly one of four categories, with anything undefined in the interface specification counted as modifying. That default is the whole design: a blocker is judged not on the commands it recognized but on what it did with the ones it did not.

## Two implementations of one requirement

SP 800-86 defines the tool plainly. A write blocker is a hardware or software based tool that prevents a computer from writing to computer storage media connected to it. Hardware write blockers are physically connected between the computer and the storage media being processed to prevent any writes to that media. Software write blockers are installed on the analyst's forensic system instead.

The implementations differ in where they sit relative to the [[cs/systems/io-devices-and-drivers|driver stack]]. NIST describes MS-DOS based software write blockers as working by trapping Interrupt 13 and extended Interrupt 13 disk writes, while Windows based software write blockers use filters to sort interrupts sent to devices to prevent any writes to storage media. Both are interception at a software layer, which means both inherit the trust assumptions of everything below them. A hardware blocker sits below all of it, which is why NIST observes that although some operating systems can be set to boot with secondary devices not mounted, attaching a hardware write blocking device will ensure that integrity is maintained.

The topology guidance is the part people get wrong under time pressure. The media should be connected directly to the write blocker, and the write blocker connected to the computer performing the imaging. For a software blocker the ordering inverts in time rather than in space: the software should be loaded onto the computer before the media is connected. NIST adds a warning that reads like a bug report from the field. Write blockers may allow blocking to be toggled per device, and it is important that it be toggled on for all connected devices.

## What NIST actually specifies

The Computer Forensic Tool Testing project's Hardware Write Blocker Device Specification, version 2.0, dated May 19, 2004, is short enough to read in one sitting and repays it. Its stated overview is that the central requirement for a sound forensic examination of digital evidence is that the original evidence must not be modified.

The specification's method is categorization. Each interface command represents one or more distinct operations, and every operation must exist in only one category: modifying, read, information, or other non-modifying. The definition of "modifying" is where the engineering judgment lives, covering any operation that directly causes a modification, could potentially cause a modification, is a necessary prerequisite for a modification, is undefined in the interface specifications, changes how the storage device is presented to the host, or changes any of the storage device's configurable parameters.

Four of those six clauses are about things that are not writes. An undefined opcode is modifying by default. Changing how the device presents itself to the host is modifying. That is a fail-closed classification, and it is the reason a blocker built by enumerating known write commands is unsound even when it never misses one.

The mandatory requirements follow from the partition. A hardware write blocker shall not, after receiving an operation of any category from the host nor at any time during its operation, transmit any modifying category operation to a protected storage device. After receiving a read category operation it shall return the data requested. After receiving an information category operation it shall return a response that does not modify any access-significant information contained in the response. And any error condition reported by the storage device to the blocker shall be reported to the host.

That third requirement introduces a term the specification had to invent. Access-significant information is information in the response to an information category operation that is significant to locating and accessing data stored on the device, and the example given is the total number of sectors reported for a given storage device. A blocker that lies about capacity has not written to anything and has still destroyed the acquisition, because the imaging tool will stop early and the examiner will never see the tail of the disk. Blocking writes is necessary. Not distorting the device's self-description is equally necessary, and it is the requirement that a naive design forgets.

## Verification, because blocking is a claim

Every part of the above is an assertion about a device the examiner did not build and cannot inspect, so the acquisition is checked rather than trusted. SP 800-86 prescribes the sequence. When a bit stream image is performed, the message digest of the original media should be computed and recorded before the image is performed. After the imaging, the message digest of the copied media should be computed and compared with the original to verify that data integrity has been preserved. Then the message digest of the original media should be computed again to verify that the imaging process did not alter the original media, and all results should be documented.

The three-hash structure carries two independent proofs. Comparing the pre-image original digest against the copy's digest proves the copy is faithful. Recomputing the original's digest after imaging proves the acquisition was non-destructive, which is the empirical test of whether the write blocker did its job on this device, on this day. A [[cs/security/cryptographic-hash-functions|message digest]] uniquely identifies data such that changing a single bit produces a completely different digest, which is what makes the second comparison meaningful. NIST names MD5 and SHA-1 as the two most commonly used algorithms and directs federal agencies to use SHA-1 instead of MD5 because SHA-1 is FIPS approved and MD5 is not.

NIST also closes the loop on the blocker itself. Write blockers should be tested routinely to ensure that they support newer devices, because a new device might make use of reserved or previously unused functions to implement device-specific functions that might ultimately write to the device and alter its contents. The blocker's correctness is not a property it has. It is a property it had, against the devices it was tested against, and it decays as hardware changes. This is [[cs/standards/conformance-testing-and-plugfests|conformance testing]] with an unusually direct consequence for the person holding the tool.

> [!warning] The digest is not a chain of custody
> A hash proves two byte sequences match. It says nothing about whose drive those bytes came from, and nothing about the interval between two hashings. [[cs/forensics/chain-of-custody|Chain of custody]] carries that half, and the acquisition record that lists the drive serial and the tool version is where the two mechanisms are stitched together.

## Related Notes

- [[cs/forensics/disk-imaging-formats-and-hashing|Disk Imaging Formats and Hashing]] covers what the verified bytes are stored in, and why the container changes what a hash covers.
- [[cs/forensics/forensic-soundness-and-repeatability|Forensic Soundness and Repeatability]] is the standard this whole procedure exists to satisfy.
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] explain the collision properties that make the verification argument work and where it weakens.
- [[cs/standards/conformance-testing-and-plugfests|Conformance Testing and Plugfests]] is the general practice that CFTT applies to forensic tools.
- [[cs/systems/io-devices-and-drivers|I/O Devices and Drivers]] is the layer a software write blocker filters and a hardware one bypasses.

## Sources

- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the write blocker definition, the hardware and software implementations, the connection guidance, the three-digest verification sequence, and the routine testing warning.
- [NIST CFTT Hardware Write Blocker Device (HWB) Specification, Version 2.0](https://www.nist.gov/system/files/documents/2017/05/09/hwb-v2-post-19-may-04.pdf) backs the four command operation categories, the definition of modifying operations, the four mandatory requirements, and the definition of access-significant information.
